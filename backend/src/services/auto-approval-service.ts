/**
 * Auto-Approval Service
 * Evaluates action proposals against configurable rules and auto-approves eligible ones.
 *
 * 5 rules:
 *  - pause_loser_creative: pause ads with high spend and 0 conversations
 *  - pause_fatigued_creative: pause ads with high frequency + declining CTR
 *  - pause_losing_adset: pause adsets with CPL > 2x target
 *  - reduce_budget_overspend: reduce budget when pacing > threshold
 *  - scale_winner_adset: increase budget for winning adsets
 */

import type { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export type AutoApprovalRuleConfig = {
  enabled: boolean;
  [key: string]: unknown;
};

export type AutoApprovalConfig = {
  autoApproveEnabled: boolean;
  autoApproveMaxPerRun: number;
  autoApproveRules: Record<string, AutoApprovalRuleConfig>;
};

type ProposalRow = {
  id: string;
  ruleId: string | null;
  action: string | null;
  severity: string | null;
  entityType: string | null;
  entityId: string | null;
  recommendedPayload: any;
};

type EvalResult = {
  approved: string[];
  skipped: string[];
  reasons: Record<string, string>;
};

const DEFAULT_CONFIG: AutoApprovalConfig = {
  autoApproveEnabled: false,
  autoApproveMaxPerRun: 5,
  autoApproveRules: {
    pause_loser_creative: { enabled: true, minSpend: 200, maxSpend: 500, maxConversations: 0 },
    pause_fatigued_creative: { enabled: true, minFrequency: 4, ctrDropPct: 30 },
    pause_losing_adset: { enabled: false, cplMultiplier: 2.0, minSpend: 300 },
    reduce_budget_overspend: { enabled: false, pacingThreshold: 120, reductionPct: 20 },
    scale_winner_adset: { enabled: false, cplMultiplier: 0.8, minConversations: 10, maxIncreasePct: 30 },
  },
};

function getMetricValue(metrics: any, ...keys: string[]): number {
  for (const k of keys) {
    const v = metrics?.[k];
    if (v !== undefined && v !== null) return parseFloat(String(v)) || 0;
  }
  return 0;
}

export class AutoApprovalService {
  constructor(private pool: Pool) {}

  async getConfig(clientId: string): Promise<AutoApprovalConfig> {
    const result = await this.pool.query(
      'SELECT optimization_targets FROM clients WHERE id = $1',
      [clientId]
    );
    const raw = result.rows?.[0]?.optimization_targets;
    if (!raw || typeof raw !== 'object') return DEFAULT_CONFIG;

    return {
      autoApproveEnabled: raw.autoApproveEnabled === true,
      autoApproveMaxPerRun: typeof raw.autoApproveMaxPerRun === 'number' ? raw.autoApproveMaxPerRun : DEFAULT_CONFIG.autoApproveMaxPerRun,
      autoApproveRules: {
        ...DEFAULT_CONFIG.autoApproveRules,
        ...(typeof raw.autoApproveRules === 'object' ? raw.autoApproveRules : {}),
      },
    };
  }

  async updateConfig(clientId: string, config: Partial<AutoApprovalConfig>): Promise<AutoApprovalConfig> {
    const current = await this.getConfig(clientId);
    const merged: AutoApprovalConfig = {
      autoApproveEnabled: config.autoApproveEnabled ?? current.autoApproveEnabled,
      autoApproveMaxPerRun: config.autoApproveMaxPerRun ?? current.autoApproveMaxPerRun,
      autoApproveRules: {
        ...current.autoApproveRules,
        ...(config.autoApproveRules ?? {}),
      },
    };

    // Read existing optimization_targets and merge
    const existing = await this.pool.query(
      'SELECT optimization_targets FROM clients WHERE id = $1',
      [clientId]
    );
    const existingTargets = existing.rows?.[0]?.optimization_targets ?? {};

    const updatedTargets = {
      ...existingTargets,
      autoApproveEnabled: merged.autoApproveEnabled,
      autoApproveMaxPerRun: merged.autoApproveMaxPerRun,
      autoApproveRules: merged.autoApproveRules,
    };

    await this.pool.query(
      'UPDATE clients SET optimization_targets = $2 WHERE id = $1',
      [clientId, JSON.stringify(updatedTargets)]
    );

    return merged;
  }

  async evaluateProposals(clientId: string, proposalIds: string[]): Promise<EvalResult> {
    if (proposalIds.length === 0) return { approved: [], skipped: [], reasons: {} };

    const config = await this.getConfig(clientId);
    if (!config.autoApproveEnabled) {
      const reasons: Record<string, string> = {};
      for (const id of proposalIds) reasons[id] = 'auto-approve disabled';
      return { approved: [], skipped: proposalIds, reasons };
    }

    // Load proposals
    const proposalsResult = await this.pool.query(
      `SELECT id, rule_id, action, severity, entity_type, entity_id, recommended_payload
       FROM action_proposals WHERE id = ANY($1) AND status = 'pending'`,
      [proposalIds]
    );

    const proposals: ProposalRow[] = proposalsResult.rows.map((r: any) => ({
      id: r.id,
      ruleId: r.rule_id,
      action: r.action,
      severity: r.severity,
      entityType: r.entity_type,
      entityId: r.entity_id,
      recommendedPayload: r.recommended_payload,
    }));

    const approved: string[] = [];
    const skipped: string[] = [];
    const reasons: Record<string, string> = {};

    for (const proposal of proposals) {
      if (approved.length >= config.autoApproveMaxPerRun) {
        skipped.push(proposal.id);
        reasons[proposal.id] = `max auto-approvals reached (${config.autoApproveMaxPerRun})`;
        continue;
      }

      const result = this.evaluateProposal(proposal, config);
      if (result.approved) {
        try {
          await this.approveProposal(clientId, proposal.id, result.ruleType, result.reason);
          approved.push(proposal.id);
          reasons[proposal.id] = result.reason;
        } catch {
          skipped.push(proposal.id);
          reasons[proposal.id] = 'approval failed';
        }
      } else {
        skipped.push(proposal.id);
        reasons[proposal.id] = result.reason;
      }
    }

    return { approved, skipped, reasons };
  }

  private evaluateProposal(
    proposal: ProposalRow,
    config: AutoApprovalConfig
  ): { approved: boolean; ruleType: string; reason: string } {
    const ruleId = proposal.ruleId ?? '';
    const metrics = proposal.recommendedPayload?.metrics ?? {};
    const rules = config.autoApproveRules;

    // Rule 1: pause_loser_creative
    if (ruleId.includes('loser') && proposal.action === 'pause') {
      const ruleConfig = rules.pause_loser_creative;
      if (ruleConfig?.enabled) {
        const spend = getMetricValue(metrics, 'spend', 'spendLast7');
        const conversations = getMetricValue(metrics, 'conversations', 'conversationsLast7');
        const minSpend = (ruleConfig.minSpend as number) ?? 200;
        const maxSpend = (ruleConfig.maxSpend as number) ?? 500;
        const maxConv = (ruleConfig.maxConversations as number) ?? 0;

        if (spend >= minSpend && spend <= maxSpend && conversations <= maxConv) {
          return { approved: true, ruleType: 'pause_loser_creative', reason: `Loser: spend=${spend.toFixed(2)}, conv=${conversations}` };
        }
        return { approved: false, ruleType: 'pause_loser_creative', reason: `Loser criteria not met: spend=${spend.toFixed(2)}, conv=${conversations}` };
      }
    }

    // Rule 2: pause_fatigued_creative
    if (ruleId.includes('fatigued') && proposal.action === 'pause') {
      const ruleConfig = rules.pause_fatigued_creative;
      if (ruleConfig?.enabled) {
        const frequency = getMetricValue(metrics, 'frequency', 'avgFrequency');
        const spend = getMetricValue(metrics, 'spend', 'spendLast7');
        const maxSpend = (ruleConfig.maxSpend as number) ?? 500;

        if (spend <= maxSpend) {
          return { approved: true, ruleType: 'pause_fatigued_creative', reason: `Fatigued: freq=${frequency.toFixed(1)}, spend=${spend.toFixed(2)}` };
        }
        return { approved: false, ruleType: 'pause_fatigued_creative', reason: `Fatigued but spend too high: ${spend.toFixed(2)}` };
      }
    }

    // Rule 3: pause_losing_adset
    if (ruleId.includes('cpl') && proposal.action === 'pause_adset' && proposal.entityType === 'adset') {
      const ruleConfig = rules.pause_losing_adset;
      if (ruleConfig?.enabled) {
        const cpl = getMetricValue(metrics, 'cpl', 'cplLast7');
        const spend = getMetricValue(metrics, 'spend', 'spendLast7');
        const targetCpl = getMetricValue(metrics, 'targetCpl');
        const multiplier = (ruleConfig.cplMultiplier as number) ?? 2.0;
        const minSpend = (ruleConfig.minSpend as number) ?? 300;

        if (targetCpl > 0 && cpl >= targetCpl * multiplier && spend >= minSpend) {
          return { approved: true, ruleType: 'pause_losing_adset', reason: `Losing adset: CPL=${cpl.toFixed(2)} > ${(targetCpl * multiplier).toFixed(2)}, spend=${spend.toFixed(2)}` };
        }
        return { approved: false, ruleType: 'pause_losing_adset', reason: `Losing adset criteria not met` };
      }
    }

    // Rule 4: reduce_budget_overspend
    if (proposal.action === 'reduce_budget') {
      const ruleConfig = rules.reduce_budget_overspend;
      if (ruleConfig?.enabled) {
        const pacing = getMetricValue(metrics, 'pacing', 'budgetUtilization');
        const threshold = (ruleConfig.pacingThreshold as number) ?? 120;

        if (pacing >= threshold) {
          return { approved: true, ruleType: 'reduce_budget_overspend', reason: `Overspend: pacing=${pacing.toFixed(0)}% >= ${threshold}%` };
        }
        return { approved: false, ruleType: 'reduce_budget_overspend', reason: `Pacing ${pacing.toFixed(0)}% below threshold ${threshold}%` };
      }
    }

    // Rule 5: scale_winner_adset
    if ((proposal.action === 'set_budget' || proposal.action === 'scale') && ruleId.includes('winner')) {
      const ruleConfig = rules.scale_winner_adset;
      if (ruleConfig?.enabled) {
        const cpl = getMetricValue(metrics, 'cpl', 'cplLast7');
        const conversations = getMetricValue(metrics, 'conversations', 'conversationsLast7');
        const targetCpl = getMetricValue(metrics, 'targetCpl');
        const cplMult = (ruleConfig.cplMultiplier as number) ?? 0.8;
        const minConv = (ruleConfig.minConversations as number) ?? 10;

        if (targetCpl > 0 && cpl <= targetCpl * cplMult && conversations >= minConv) {
          return { approved: true, ruleType: 'scale_winner_adset', reason: `Winner: CPL=${cpl.toFixed(2)} <= ${(targetCpl * cplMult).toFixed(2)}, conv=${conversations}` };
        }
        return { approved: false, ruleType: 'scale_winner_adset', reason: `Winner criteria not met` };
      }
    }

    return { approved: false, ruleType: 'no_matching_rule', reason: `No matching auto-approval rule for: ${ruleId} / ${proposal.action}` };
  }

  private async approveProposal(clientId: string, proposalId: string, ruleType: string, reason: string): Promise<void> {
    const approvalId = uuidv4();
    const historyId = uuidv4();

    // Create approval
    await this.pool.query(
      `INSERT INTO action_approvals (id, proposal_id, decision, reason, decided_by_user_id, decided_at, created_at)
       VALUES ($1, $2, 'approved', $3, NULL, NOW(), NOW())`,
      [approvalId, proposalId, `Auto-approved: ${reason}`]
    );

    // Update proposal status
    await this.pool.query(
      `UPDATE action_proposals SET status = 'approved', updated_at = NOW() WHERE id = $1`,
      [proposalId]
    );

    // Save to audit log
    await this.pool.query(
      `INSERT INTO auto_approval_history (id, client_id, proposal_id, rule_type, decision, reason, metadata)
       VALUES ($1, $2, $3, $4, 'approved', $5, $6)`,
      [historyId, clientId, proposalId, ruleType, reason, JSON.stringify({ approvalId })]
    );
  }

  async getHistory(clientId: string, params: { limit?: number; offset?: number } = {}): Promise<{ total: number; items: any[] }> {
    const limit = Math.min(params.limit ?? 50, 200);
    const offset = params.offset ?? 0;

    const countResult = await this.pool.query(
      'SELECT COUNT(*)::int as total FROM auto_approval_history WHERE client_id = $1',
      [clientId]
    );

    const result = await this.pool.query(
      `SELECT h.*, ap.title as proposal_title, ap.action as proposal_action, ap.entity_type, ap.entity_id, ap.severity
       FROM auto_approval_history h
       LEFT JOIN action_proposals ap ON ap.id = h.proposal_id
       WHERE h.client_id = $1
       ORDER BY h.created_at DESC
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset]
    );

    return {
      total: countResult.rows[0].total,
      items: result.rows.map((r: any) => ({
        id: r.id,
        proposalId: r.proposal_id,
        ruleType: r.rule_type,
        decision: r.decision,
        reason: r.reason,
        proposalTitle: r.proposal_title,
        proposalAction: r.proposal_action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        severity: r.severity,
        metadata: r.metadata,
        createdAt: r.created_at,
      })),
    };
  }
}
