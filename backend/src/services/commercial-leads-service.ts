import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { createAuditLog } from '../middleware/audit';
import { EvolutionApiService } from './evolution-api-service';
import { GoogleApiService } from './google-api-service';
import { LeadQualificationService } from './lead-qualification-service';
import {
  buildDispatchVariables,
  resolveDispatchRecipient,
  sendDispatchToProvider,
  sendWhatsAppTemplateMessage,
} from '../modules/commercial/dispatch';
import {
  isGoogleBookingEnabled,
  isGoogleBookingFallbackToPublicEnabled,
  isGoogleBookingSyncEnabled,
  isHybridSchedulingInviteEnabled,
  isPublicSchedulingEnabled,
  isQualificationScoreEnabled,
  isQuickSchedulingConfirmEnabled,
  isRequirementGatesEnabled,
  isWhatsAppInteractiveFallbackTextEnabled,
  isWhatsAppInteractiveSchedulingEnabled,
  isWhatsAppReplyAutoConfirmEnabled,
} from '../modules/commercial/flags';
import { CommercialFlowError, validateLeadTransition } from '../modules/commercial/flow';
import { buildCommercialFormLink } from '../modules/commercial/forms';
import {
  mapCommercialLeadRow,
} from '../modules/commercial/mappers';
import { CommercialLeadRepository } from '../modules/commercial/repository';
import { evaluateRequirementSystem } from '../modules/commercial/requirements';
import {
  applySchedulingPolicy,
  assertSchedulingPolicyForSlot,
  appendUniqueSchedulingSlot,
  createQuickSchedulingTokenForSlot,
  createSchedulingToken,
  formatDateForTimezone,
  formatSchedulingSlotLabel,
  hashSchedulingToken,
  isSlotWithinSchedulingPolicy,
  mapSchedulingInviteForWhatsAppReplyRow,
  type SchedulingInviteForWhatsAppReply,
} from '../modules/commercial/scheduling';
import { buildConflictReofferPayload } from '../modules/commercial/scheduling-reoffers';
import { COMMERCIAL_SCHEMA_SQL } from '../modules/commercial/schema';
import {
  getTemplateWithVersionsOrThrow,
  resolveDispatchTemplateKey,
  seedCommercialDefaults,
  upsertCommercialTemplateBinding,
} from '../modules/commercial/template-operations';
import { resolveCommercialApiBaseUrl, resolveCommercialFormsBaseUrl } from '../modules/commercial/urls';
import type {
  CommercialLeadStatus,
  CreateCommercialLeadInput,
  UpdateCommercialLeadInput,
  MoveLeadStatusInput,
  SubmitCommercialFormInput,
  UpdateCommercialLeadProofsInput,
  UpdateCommercialLeadOnboardingInput,
  UpdateCommercialLeadPrivacyInput,
  IngestCommercialIntegrationEventInput,
  DispatchCommercialCommunicationInput,
  CommercialScheduleSlot,
  RequestCommercialScheduleSlotsInput,
  ConfirmCommercialScheduleInput,
  UpdateCommercialScheduleInput,
  CancelCommercialScheduleInput,
  CommercialRequirementType,
  CommercialRequirementStatus,
  CommercialRequirementEvaluation,
  UpsertCommercialLeadRequirementsInput,
  CommercialAssetRecord,
  CreateCommercialAssetInput,
  CommercialTemplateChannel,
  CreateCommercialTemplateInput,
  UpdateCommercialTemplateInput,
  PublishCommercialTemplateInput,
  CommercialSchedulingLink,
  CreateCommercialSchedulingLinkInput,
  CreateCommercialSchedulingInviteInput,
  ProcessWhatsAppSchedulingReplyInput,
  ProcessWhatsAppSchedulingReplyResult,
  PublicCommercialQuickConfirmInput,
  CommercialSchedulingSuggestedSlot,
  CommercialSchedulingInviteProvider,
  CommercialWhatsAppSchedulingMode,
  CommercialSchedulingInvite,
  PublicCommercialSchedulingInput,
  PublicCommercialConfirmScheduleInput,
  PublicCommercialUpdateScheduleInput,
  PublicCommercialCancelScheduleInput,
  CommercialCalendarConfigRecord,
  UpsertCommercialCalendarConfigInput,
  CommercialCalendarReconciliationItem,
  ResolveCommercialCalendarReconciliationInput,
  SyncGoogleBookingEventsResult,
  CommercialDashboard,
  CommercialSlaAlert,
  CommercialDailySummary,
  CommercialLeadTimelineEvent,
  CommercialFormLink,
  CommercialFollowupDue,
  TriggerFollowupDispatchInput,
  CommercialRetentionAlert,
  CommercialIntegrationEvent,
  CommercialDispatchHealthSummary,
  CommercialFormType,
  CommercialLeadRecord,
} from '../modules/commercial/types';
import { normalizePhone, parseWhatsAppSchedulingIntent } from '../modules/commercial/whatsapp';

export { CommercialFlowError, validateLeadTransition } from '../modules/commercial/flow';

export type {
  CommercialLeadStatus,
  CommercialAreaPrincipal,
  CreateCommercialLeadInput,
  UpdateCommercialLeadInput,
  MoveLeadStatusInput,
  SubmitCommercialFormInput,
  ContractStatus,
  PaymentStatus,
  UpdateCommercialLeadProofsInput,
  UpdateCommercialLeadOnboardingInput,
  UpdateCommercialLeadPrivacyInput,
  IngestCommercialIntegrationEventInput,
  DispatchCommercialCommunicationInput,
  CommercialScheduleSlot,
  RequestCommercialScheduleSlotsInput,
  ConfirmCommercialScheduleInput,
  UpdateCommercialScheduleInput,
  CancelCommercialScheduleInput,
  CommercialRequirementType,
  CommercialRequirementStatus,
  CommercialStageRequirementRecord,
  CommercialLeadRequirementRecord,
  CommercialRequirementEvaluation,
  UpsertCommercialLeadRequirementsInput,
  CommercialAssetRecord,
  CreateCommercialAssetInput,
  CommercialTemplateChannel,
  CommercialTemplateVersionStatus,
  CommercialTemplateRecord,
  CommercialTemplateVersionRecord,
  CommercialTemplateBindingRecord,
  CreateCommercialTemplateInput,
  UpdateCommercialTemplateInput,
  PublishCommercialTemplateInput,
  CommercialSchedulingLink,
  CreateCommercialSchedulingLinkInput,
  CreateCommercialSchedulingInviteInput,
  WhatsAppSchedulingReplyIntent,
  ProcessWhatsAppSchedulingReplyInput,
  ProcessWhatsAppSchedulingReplyResult,
  PublicCommercialQuickConfirmInput,
  CommercialSchedulingSuggestedSlot,
  CommercialSchedulingInviteProvider,
  CommercialWhatsAppSchedulingMode,
  CommercialSchedulingInvite,
  PublicCommercialSchedulingInput,
  PublicCommercialConfirmScheduleInput,
  PublicCommercialUpdateScheduleInput,
  PublicCommercialCancelScheduleInput,
  CommercialCalendarConfigRecord,
  UpsertCommercialCalendarConfigInput,
  CommercialCalendarReconciliationItem,
  ResolveCommercialCalendarReconciliationInput,
  SyncGoogleBookingEventsResult,
  CommercialDashboard,
  CommercialSlaAlert,
  CommercialDailySummary,
  CommercialLeadTimelineEvent,
  CommercialFormLink,
  CommercialFollowupDue,
  TriggerFollowupDispatchInput,
  CommercialRetentionAlert,
  CommercialIntegrationEvent,
  CommercialDispatchHealthByChannel,
  CommercialDispatchHealthSummary,
  CommercialFormType,
  CommercialLeadRecord,
} from '../modules/commercial/types';

export class CommercialLeadsService {
  private readonly qualification = new LeadQualificationService();
  private readonly leadRepository: CommercialLeadRepository;

  constructor(
    private pool: Pool,
    private evolutionApi: EvolutionApiService,
    private googleApi: GoogleApiService,
  ) {
    this.leadRepository = new CommercialLeadRepository(pool);
  }

  getFormLink(leadId: string, formType: CommercialFormType, formToken?: string): CommercialFormLink {
    return buildCommercialFormLink(leadId, formType, formToken);
  }

  async initialize(): Promise<void> {
    await this.pool.query(COMMERCIAL_SCHEMA_SQL);

    await seedCommercialDefaults(this.leadRepository);
  }

  async createLead(input: CreateCommercialLeadInput): Promise<CommercialLeadRecord> {
    const leadId = uuidv4();
    const formToken = uuidv4();

    if (input.whatsapp) {
      const dedupe = await this.pool.query(
        `SELECT lead_id
         FROM commercial_leads
         WHERE status_atual NOT IN ('fechado', 'perdido')
           AND whatsapp = $1
           AND LOWER(nome_escritorio) = LOWER($2)
         LIMIT 1`,
        [input.whatsapp, input.nomeEscritorio],
      );

      if (dedupe.rowCount && dedupe.rowCount > 0) {
        throw new CommercialFlowError(
          'DUPLICATE_LEAD',
          'Lead duplicado detectado (mesmo WhatsApp e escritório em aberto).',
        );
      }
    }

    try {
      const result = await this.pool.query(
        `INSERT INTO commercial_leads (
          lead_id, origem, nome_escritorio, nome_contato, instagram, whatsapp, email,
          cidade, area_principal, qtd_advogados, faturamento_estimado, orcamento_marketing,
          timezone, status_atual, responsavel, proxima_acao, data_proxima_acao, form_token
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING *`,
        [
          leadId,
          input.origem,
          input.nomeEscritorio,
          input.nomeContato || null,
          input.instagram || null,
          input.whatsapp || null,
          input.email || null,
          input.cidade || null,
          input.areaPrincipal || null,
          input.qtdAdvogados ?? null,
          input.faturamentoEstimado ?? null,
          input.orcamentoMarketing ?? null,
          input.timezone || 'America/Sao_Paulo',
          'novo_lead',
          input.responsavel,
          input.proximaAcao || null,
          input.dataProximaAcao || null,
          formToken,
        ],
      );

      void createAuditLog(this.pool, {
        action: 'create',
        entityType: 'commercial_lead',
        entityId: leadId,
        changes: { after: { origem: input.origem, nomeEscritorio: input.nomeEscritorio, statusAtual: 'novo_lead' } },
        metadata: { responsavel: input.responsavel },
      });

      if (isQualificationScoreEnabled()) {
        return this.recomputeLeadQualification(leadId);
      }

      return this.attachComputedLeadFields(mapCommercialLeadRow(result.rows[0]));
    } catch (error) {
      const pgCode = (error as { code?: string })?.code;
      if (pgCode === '23505') {
        throw new CommercialFlowError(
          'DUPLICATE_LEAD',
          'Lead duplicado detectado (violação de unicidade).',
        );
      }
      throw error;
    }
  }

  async getLead(leadId: string): Promise<CommercialLeadRecord> {
    const mapped = await this.leadRepository.findLeadRecord(leadId);
    if (!mapped) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    return this.attachComputedLeadFields(mapped);
  }

  async listLeads(filters?: { status?: CommercialLeadStatus; responsavel?: string; limit?: number; offset?: number }): Promise<CommercialLeadRecord[]> {
    const leads = await this.leadRepository.listLeadRecords(filters);
    if (!isRequirementGatesEnabled()) {
      return leads;
    }

    return Promise.all(leads.map((lead) => this.attachComputedLeadFields(lead)));
  }

  async getDashboard(rangeDays?: number): Promise<CommercialDashboard> {
    const useRange = typeof rangeDays === 'number' && Number.isFinite(rangeDays) && rangeDays > 0;

    const params: unknown[] = [];
    const whereSql = useRange
      ? `WHERE data_entrada >= NOW() - ($1::text || ' days')::interval`
      : '';

    if (useRange) params.push(Math.floor(rangeDays as number));

    const result = await this.pool.query(
      `SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status_atual = 'novo_lead')::int as novos,
        COUNT(*) FILTER (WHERE status_atual IN ('diagnostico_agendado', 'diagnostico_concluido'))::int as diagnosticos,
        COUNT(*) FILTER (WHERE status_atual IN ('proposta_enviada', 'negociacao'))::int as propostas,
        COUNT(*) FILTER (WHERE status_atual = 'fechado')::int as fechados
      FROM commercial_leads
      ${whereSql}`,
      params,
    );

    const row = result.rows[0] || {};
    return {
      total: Number(row.total || 0),
      novos: Number(row.novos || 0),
      diagnosticos: Number(row.diagnosticos || 0),
      propostas: Number(row.propostas || 0),
      fechados: Number(row.fechados || 0),
      rangeDays: useRange ? Math.floor(rangeDays as number) : undefined,
    };
  }

  async updateLeadProofs(leadId: string, input: UpdateCommercialLeadProofsInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET contract_status = COALESCE($2, contract_status),
           payment_status = COALESCE($3, payment_status),
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, input.contractStatus ?? null, input.paymentStatus ?? null],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        leadId,
        current.status_atual,
        current.status_atual,
        'proofs-update',
        input.observacao || `proofs_update:${input.contractStatus || '-'}:${input.paymentStatus || '-'}`,
      ],
    );

    void createAuditLog(this.pool, {
      action: 'update',
      entityType: 'commercial_lead',
      entityId: leadId,
      changes: {
        before: { contractStatus: current.contract_status, paymentStatus: current.payment_status },
        after: { contractStatus: input.contractStatus, paymentStatus: input.paymentStatus },
      },
      metadata: { action: 'proofs_updated' },
    });

    return this.finalizeLeadRecordUpdate(leadId, updated.rows[0]);
  }

  async updateLeadPrivacy(leadId: string, input: UpdateCommercialLeadPrivacyInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const consentGivenAt = input.consentGiven === true ? new Date().toISOString() : current.consent_given_at;

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET consent_given = COALESCE($2, consent_given),
           consent_given_at = $3,
           retention_until = COALESCE($4, retention_until),
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, input.consentGiven ?? null, consentGivenAt, input.retentionUntil ?? null],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        leadId,
        current.status_atual,
        current.status_atual,
        'privacy-update',
        input.observacao || 'privacy_update',
      ],
    );

    return this.finalizeLeadRecordUpdate(leadId, updated.rows[0]);
  }

  async updateLeadOnboarding(leadId: string, input: UpdateCommercialLeadOnboardingInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET onboarding_d0_ok = COALESCE($2, onboarding_d0_ok),
           onboarding_d1_ok = COALESCE($3, onboarding_d1_ok),
           onboarding_d2_ok = COALESCE($4, onboarding_d2_ok),
           onboarding_d3_d4_ok = COALESCE($5, onboarding_d3_d4_ok),
           onboarding_d5_d7_ok = COALESCE($6, onboarding_d5_d7_ok),
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, input.d0Ok ?? null, input.d1Ok ?? null, input.d2Ok ?? null, input.d3D4Ok ?? null, input.d5D7Ok ?? null],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        leadId,
        current.status_atual,
        current.status_atual,
        'onboarding-update',
        input.observacao || 'onboarding_update',
      ],
    );

    return this.finalizeLeadRecordUpdate(leadId, updated.rows[0]);
  }

  async submitLeadForm(leadId: string, input: SubmitCommercialFormInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const submittedAt = input.submittedAt || new Date().toISOString();

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET form_type = $2,
           form_submitted_at = $3,
           form_payload_json = $4::jsonb,
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, input.formType, submittedAt, JSON.stringify(input.payload || {})],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        leadId,
        current.status_atual,
        current.status_atual,
        'forms-webhook',
        `form_submit:${input.formType}`,
      ],
    );

    if (input.formType === 'briefing') {
      await this.ingestIntegrationEvent({
        leadId,
        channel: 'custom',
        eventType: 'briefing:submitted',
        payload: {
          submittedAt,
          source: 'forms',
        },
      });

      if (isHybridSchedulingInviteEnabled() && !current.form_submitted_at) {
        try {
          await this.createHybridSchedulingInvite(leadId, {
            timezone: current.timezone || 'America/Sao_Paulo',
          });
        } catch (error) {
          await this.ingestIntegrationEvent({
            leadId,
            channel: 'custom',
            eventType: 'scheduling:invite_failed',
            payload: {
              reason: error instanceof Error ? error.message : 'unknown_error',
            },
          });
        }
      }
    }

    return this.finalizeLeadRecordUpdate(leadId, updated.rows[0]);
  }

  async ingestIntegrationEvent(input: IngestCommercialIntegrationEventInput): Promise<{ ok: true; eventId: string; leadId: string }> {
    const lead = await this.pool.query(
      'SELECT lead_id, status_atual FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
      [input.leadId],
    );

    const current = lead.rows[0];
    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado para o evento de integração.');
    }

    const eventId = uuidv4();
    const occurredAt = input.occurredAt || new Date().toISOString();

    await this.pool.query(
      `INSERT INTO commercial_integration_events (
         id, lead_id, channel, event_type, external_event_id, payload_json, occurred_at
       ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [
        eventId,
        input.leadId,
        input.channel,
        input.eventType,
        input.externalEventId || null,
        JSON.stringify(input.payload || {}),
        occurredAt,
      ],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        uuidv4(),
        input.leadId,
        current.status_atual,
        current.status_atual,
        `integration:${input.channel}`,
        `event:${input.eventType}`,
      ],
    );

    return { ok: true, eventId, leadId: input.leadId };
  }

  async dispatchStageCommunication(input: DispatchCommercialCommunicationInput): Promise<{ ok: true; leadId: string; channel: string; stage: string; eventId: string }> {
    let templateKey = input.templateKey?.trim();
    let recipient: string | null = null;
    let enrichedVariables: Record<string, unknown> = {};

    try {
      templateKey = await resolveDispatchTemplateKey(this.leadRepository, input);
      if (!templateKey) {
        throw new CommercialFlowError('VALIDATION_ERROR', `templateKey não definido para a etapa ${input.stage}.`, {
          reasonCode: 'TEMPLATE_NOT_CONFIGURED',
          stage: input.stage,
          channel: input.channel,
        });
      }

      recipient = await resolveDispatchRecipient(this.pool, input.leadId, input.channel, input.recipient);
      enrichedVariables = await buildDispatchVariables(this.pool, input.leadId, input.variables);

      const providerResult = await sendDispatchToProvider({
        evolutionApi: this.evolutionApi,
        googleApi: this.googleApi,
        channel: input.channel,
        templateKey,
        recipient,
        variables: enrichedVariables,
      });

      const event = await this.ingestIntegrationEvent({
        leadId: input.leadId,
        channel: input.channel,
        eventType: `dispatch:${input.stage}:${templateKey}`,
        externalEventId: providerResult.externalEventId,
        payload: {
          recipient,
          templateKey,
          variables: enrichedVariables,
          provider: providerResult.provider,
          providerAck: providerResult.ack,
        },
        occurredAt: new Date().toISOString(),
      });

      void createAuditLog(this.pool, {
        action: 'create',
        entityType: 'commercial_dispatch',
        entityId: event.eventId,
        changes: { after: { leadId: input.leadId, channel: input.channel, stage: input.stage, templateKey } },
        metadata: { externalEventId: providerResult.externalEventId },
      });

      return {
        ok: true,
        leadId: input.leadId,
        channel: input.channel,
        stage: input.stage,
        eventId: event.eventId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido de dispatch';
      const reasonCode =
        error instanceof CommercialFlowError
          ? String((error.details?.reasonCode as string | undefined) || error.code)
          : 'TEMPLATE_PROVIDER_ERROR';
      const isTemplateRelated =
        reasonCode.startsWith('TEMPLATE') || /template/i.test(message);

      if (isTemplateRelated) {
        try {
          await this.ingestIntegrationEvent({
            leadId: input.leadId,
            channel: 'custom',
            eventType: 'dispatch:template_error',
            payload: {
              stage: input.stage,
              channel: input.channel,
              templateKey: templateKey || null,
              recipient,
              reasonCode,
              message,
              variables: enrichedVariables,
            },
          });
        } catch {
          // best effort: não bloqueia o erro original
        }
      }

      if (error instanceof CommercialFlowError) {
        throw error;
      }

      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Falha ao processar template de comunicação.',
        {
          reasonCode: 'TEMPLATE_PROVIDER_ERROR',
          stage: input.stage,
          channel: input.channel,
          templateKey: templateKey || null,
          message,
        },
      );
    }
  }

  async getLeadFormLink(leadId: string, formType: CommercialFormType): Promise<CommercialFormLink> {
    const existing = await this.pool.query('SELECT lead_id, form_token FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    let token = current.form_token as string | null;
    if (!token) {
      token = uuidv4();
      await this.pool.query(
        `UPDATE commercial_leads SET form_token = $2, updated_at = NOW() WHERE lead_id = $1`,
        [leadId, token],
      );
    }

    return this.getFormLink(leadId, formType, token);
  }

  async getDailySummary(): Promise<CommercialDailySummary> {
    return this.leadRepository.getDailySummary();
  }

  async listIntegrationEvents(leadId: string, limit = 50): Promise<CommercialIntegrationEvent[]> {
    return this.leadRepository.listIntegrationEvents(leadId, limit);
  }

  async requestScheduleSlots(input: RequestCommercialScheduleSlotsInput): Promise<{ leadId: string; slots: CommercialScheduleSlot[] }> {
    const tz = input.timezone ?? await this.getLeadTimezone(input.leadId) ?? 'America/Sao_Paulo';
    const slots = await this.googleApi.getFreeBusy(
      input.date,
      input.durationMin ?? 30,
      tz,
    );

    return {
      leadId: input.leadId,
      slots: applySchedulingPolicy(slots, tz),
    };
  }

  async confirmScheduledMeeting(input: ConfirmCommercialScheduleInput): Promise<{ ok: true; leadId: string; eventId?: string }> {
    const leadRow = await this.getLeadRow(input.leadId);
    if (!leadRow) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const tz = input.timezone ?? leadRow.timezone ?? await this.getLeadTimezone(input.leadId) ?? 'America/Sao_Paulo';
    assertSchedulingPolicyForSlot(input.slotStart, input.slotEnd, tz);
    const scheduledFrom = input.scheduledFrom || 'calendar';
    const attendeeEmail = input.attendeeEmail || leadRow.email || undefined;
    const attendeeName = input.attendeeName || leadRow.nome_contato || leadRow.nome_escritorio || undefined;
    const calendarConfig = await this.resolveCalendarConfigByResponsavel(leadRow.responsavel || '');

    const ack = calendarConfig
      ? await this.googleApi.createEventForCalendar(calendarConfig.calendarId, {
        leadId: input.leadId,
        slotStart: input.slotStart,
        slotEnd: input.slotEnd,
        attendeeName,
        attendeeEmail,
        timezone: tz,
      })
      : await this.googleApi.createEvent({
      leadId: input.leadId,
      slotStart: input.slotStart,
      slotEnd: input.slotEnd,
      attendeeName,
      attendeeEmail,
      timezone: tz,
    });

    // Save cal_event_id and data_diagnostico directly on the lead
    await this.pool.query(
      `UPDATE commercial_leads
       SET cal_event_id = $1,
           data_diagnostico = $2,
           cal_event_url = $3,
           cal_meet_url = $4,
           cal_organizer_email = $5,
           cal_synced_at = NOW(),
           scheduled_from = $6,
           updated_at = NOW()
       WHERE lead_id = $7`,
      [
        ack.eventId,
        input.slotStart,
        ack.eventUrl || null,
        ack.meetUrl || null,
        calendarConfig?.ownerEmail || null,
        scheduledFrom,
        input.leadId,
      ],
    );

    await this.ingestIntegrationEvent({
      leadId: input.leadId,
      channel: 'calendar',
      eventType: 'calendar:meeting_scheduled',
      externalEventId: ack.eventId,
      payload: {
        slotStart: input.slotStart,
        slotEnd: input.slotEnd,
        attendeeName: attendeeName || null,
        attendeeEmail: attendeeEmail || null,
        scheduledFrom,
        eventUrl: ack.eventUrl || null,
        meetUrl: ack.meetUrl || null,
        organizerEmail: calendarConfig?.ownerEmail || null,
        providerAck: ack,
      },
    });

    if (isQualificationScoreEnabled()) {
      await this.recomputeLeadQualification(input.leadId);
    }

    return {
      ok: true,
      leadId: input.leadId,
      eventId: ack.eventId,
    };
  }

  async updateScheduledMeeting(input: UpdateCommercialScheduleInput): Promise<{ ok: true; leadId: string; eventId?: string }> {
    await this.ensureLeadExists(input.leadId);

    const eventId = input.eventId || await this.resolveLatestCalendarEventId(input.leadId);
    if (!eventId) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'eventId é obrigatório para atualizar reunião.');
    }

    const tz = input.timezone ?? await this.getLeadTimezone(input.leadId) ?? 'America/Sao_Paulo';
    assertSchedulingPolicyForSlot(input.slotStart, input.slotEnd, tz);

    const ack = await this.googleApi.updateEvent(eventId, {
      leadId: input.leadId,
      slotStart: input.slotStart,
      slotEnd: input.slotEnd,
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      timezone: tz,
    });

    // Update cal_event_id and data_diagnostico on the lead
    await this.pool.query(
      `UPDATE commercial_leads
       SET cal_event_id = $1,
           data_diagnostico = $2,
           cal_event_url = $3,
           cal_meet_url = $4,
           cal_synced_at = NOW(),
           scheduled_from = 'calendar',
           updated_at = NOW()
       WHERE lead_id = $5`,
      [ack.eventId, input.slotStart, ack.eventUrl || null, ack.meetUrl || null, input.leadId],
    );

    await this.ingestIntegrationEvent({
      leadId: input.leadId,
      channel: 'calendar',
      eventType: 'calendar:meeting_updated',
      externalEventId: ack.eventId,
      payload: {
        eventId: ack.eventId,
        slotStart: input.slotStart,
        slotEnd: input.slotEnd,
        attendeeName: input.attendeeName || null,
        attendeeEmail: input.attendeeEmail || null,
        eventUrl: ack.eventUrl || null,
        meetUrl: ack.meetUrl || null,
        providerAck: ack,
      },
    });

    if (isQualificationScoreEnabled()) {
      await this.recomputeLeadQualification(input.leadId);
    }

    return {
      ok: true,
      leadId: input.leadId,
      eventId: ack.eventId,
    };
  }

  async cancelScheduledMeeting(input: CancelCommercialScheduleInput): Promise<{ ok: true; leadId: string; eventId: string }> {
    await this.ensureLeadExists(input.leadId);

    const eventId = input.eventId || await this.resolveLatestCalendarEventId(input.leadId);
    if (!eventId) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'eventId é obrigatório para cancelar reunião.');
    }

    await this.googleApi.deleteEvent(eventId);

    // Clear cal_event_id and data_diagnostico from lead
    await this.pool.query(
      `UPDATE commercial_leads
       SET cal_event_id = NULL,
           data_diagnostico = NULL,
           cal_event_url = NULL,
           cal_meet_url = NULL,
           cal_synced_at = NOW(),
           scheduled_from = NULL,
           updated_at = NOW()
       WHERE lead_id = $1`,
      [input.leadId],
    );

    await this.ingestIntegrationEvent({
      leadId: input.leadId,
      channel: 'calendar',
      eventType: 'calendar:meeting_canceled',
      externalEventId: eventId,
      payload: {
        eventId,
        reason: input.reason || null,
        cancelledBy: input.cancelledBy || null,
      },
    });

    return {
      ok: true,
      leadId: input.leadId,
      eventId,
    };
  }

  private async getLeadTimezone(leadId: string): Promise<string | undefined> {
    const result = await this.pool.query(
      'SELECT timezone FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
      [leadId],
    );
    return result.rows[0]?.timezone || undefined;
  }

  async updateLead(leadId: string, input: UpdateCommercialLeadInput): Promise<CommercialLeadRecord> {
    const fieldMap: Record<string, string> = {
      nomeContato: 'nome_contato',
      email: 'email',
      whatsapp: 'whatsapp',
      instagram: 'instagram',
      cidade: 'cidade',
      areaPrincipal: 'area_principal',
      timezone: 'timezone',
      qtdAdvogados: 'qtd_advogados',
      valProposta: 'val_proposta',
      urlProposta: 'url_proposta',
      faturamentoEstimado: 'faturamento_estimado',
      orcamentoMarketing: 'orcamento_marketing',
      scoreQualificacao: 'score_qualificacao',
      folderUrl: 'drive_folder_url',
      proximaAcao: 'proxima_acao',
      dataProximaAcao: 'data_proxima_acao',
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, col] of Object.entries(fieldMap)) {
      const val = (input as Record<string, unknown>)[key];
      if (val !== undefined) {
        values.push(val === '' ? null : val);
        setClauses.push(`${col} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return this.getLead(leadId);
    }

    values.push(leadId);
    const result = await this.pool.query(
      `UPDATE commercial_leads SET ${setClauses.join(', ')}, updated_at = NOW() WHERE lead_id = $${values.length} RETURNING *`,
      values,
    );

    if (!result.rows[0]) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    void createAuditLog(this.pool, {
      action: 'update',
      entityType: 'commercial_lead',
      entityId: leadId,
      changes: { after: input as Record<string, unknown> },
    });

    return this.finalizeLeadRecordUpdate(leadId, result.rows[0]);
  }

  private async ensureLeadExists(leadId: string): Promise<void> {
    const lead = await this.pool.query('SELECT lead_id FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    if (!lead.rows[0]) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado para integração de agenda.');
    }
  }

  private async resolveLatestCalendarEventId(leadId: string): Promise<string | undefined> {
    const result = await this.pool.query(
      `SELECT external_event_id
       FROM commercial_integration_events
       WHERE lead_id = $1
         AND channel = 'calendar'
         AND external_event_id IS NOT NULL
         AND external_event_id <> ''
       ORDER BY occurred_at DESC
       LIMIT 1`,
      [leadId],
    );

    const row = result.rows[0];
    return row?.external_event_id || undefined;
  }

  async getDispatchHealthSummary(windowDays = 7): Promise<CommercialDispatchHealthSummary> {
    return this.leadRepository.getDispatchHealthSummary(windowDays);
  }

  async listLeadTimeline(leadId: string, limit = 50): Promise<CommercialLeadTimelineEvent[]> {
    return this.leadRepository.listLeadTimeline(leadId, limit);
  }

  async listRetentionDue(limit = 50): Promise<CommercialRetentionAlert[]> {
    return this.leadRepository.listRetentionDue(limit);
  }

  async triggerFollowupDispatch(input: TriggerFollowupDispatchInput): Promise<{ ok: true; leadId: string; eventId: string }> {
    const channel = input.channel || 'whatsapp';

    const leadResult = await this.pool.query(
      `SELECT lead_id, nome_escritorio, status_atual, followup_d2_at, followup_d5_at
       FROM commercial_leads
       WHERE lead_id = $1
       LIMIT 1`,
      [input.leadId],
    );

    const lead = leadResult.rows[0];
    if (!lead) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado para follow-up.');
    }

    const dueAt = input.followupType === 'D+2' ? lead.followup_d2_at : lead.followup_d5_at;
    if (!dueAt || new Date(dueAt).getTime() > Date.now()) {
      throw new CommercialFlowError('VALIDATION_ERROR', `Follow-up ${input.followupType} ainda não está vencido.`);
    }

    const duplicateCheck = await this.pool.query(
      `SELECT id
       FROM commercial_integration_events
       WHERE lead_id = $1
         AND event_type = $2
         AND occurred_at >= NOW() - interval '1 day'
       LIMIT 1`,
      [input.leadId, `followup:${input.followupType}`],
    );

    if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
      throw new CommercialFlowError('VALIDATION_ERROR', `Follow-up ${input.followupType} já disparado nas últimas 24h.`);
    }

    const stage = input.followupType === 'D+2' ? 'proposta_enviada' : 'negociacao';
    const templateKey = channel === 'gmail'
      ? (input.followupType === 'D+2' ? 'gm_proposta_enviada_followup_v1' : 'gm_negociacao_alinhamento_v1')
      : (input.followupType === 'D+2' ? 'wa_proposta_enviada_followup_v1' : 'wa_negociacao_alinhamento_v1');

    const dispatch = await this.dispatchStageCommunication({
      leadId: input.leadId,
      channel,
      stage,
      templateKey,
      variables: {
        nomeEscritorio: lead.nome_escritorio,
        followupType: input.followupType,
      },
    });

    await this.ingestIntegrationEvent({
      leadId: input.leadId,
      channel,
      eventType: `followup:${input.followupType}`,
      payload: {
        sourceEventId: dispatch.eventId,
      },
    });

    return {
      ok: true,
      leadId: input.leadId,
      eventId: dispatch.eventId,
    };
  }

  async listFollowupsDue(limit = 50): Promise<CommercialFollowupDue[]> {
    return this.leadRepository.listFollowupsDue(limit);
  }

  async listSlaAlerts(maxAgeHours = 24, limit = 50): Promise<CommercialSlaAlert[]> {
    return this.leadRepository.listSlaAlerts(maxAgeHours, limit);
  }

  async deleteLeadPermanently(leadId: string, input: { confirmText: string; reason?: string; actor?: string }): Promise<{ ok: true; leadId: string }> {
    if (input.confirmText !== 'EXCLUIR') {
      throw new CommercialFlowError('DELETE_GUARD', 'Confirmação inválida. Digite EXCLUIR para confirmar.');
    }

    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          uuidv4(),
          leadId,
          current.status_atual,
          'perdido',
          input.actor || 'admin',
          input.reason || 'Exclusão permanente solicitada',
        ],
      );

      await client.query('DELETE FROM commercial_integration_events WHERE lead_id = $1', [leadId]);
      await client.query('DELETE FROM commercial_lead_transitions WHERE lead_id = $1', [leadId]);
      await client.query('DELETE FROM commercial_leads WHERE lead_id = $1', [leadId]);

      await client.query('COMMIT');
      return { ok: true, leadId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async moveLeadStatus(leadId: string, input: MoveLeadStatusInput): Promise<CommercialLeadRecord> {
    const existing = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    const current = existing.rows[0];

    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const from = current.status_atual as CommercialLeadStatus;
    validateLeadTransition(from, input);

    if (input.waiveRequirements?.length) {
      const role = (input.actorRole || '').toLowerCase();
      if (role !== 'admin' && role !== 'manager') {
        throw new CommercialFlowError('VALIDATION_ERROR', 'Apenas admin/manager podem aplicar waiver de requisitos.');
      }

      if (!input.waiveReason?.trim()) {
        throw new CommercialFlowError('VALIDATION_ERROR', 'Waiver exige justificativa.');
      }

      await this.applyRequirementWaivers(leadId, input.waiveRequirements, {
        actor: input.actor || null,
        reason: input.waiveReason,
      });
    }

    if (input.to === 'proposta_enviada' && current.form_type !== 'briefing') {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para enviar proposta, o briefing do lead precisa estar submetido.',
      );
    }

    if (input.to === 'proposta_enviada' && current.consent_given !== true) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para enviar proposta, o consentimento LGPD deve estar confirmado.',
      );
    }

    if (input.to === 'fechado' && (current.contract_status !== 'assinado' || current.payment_status !== 'pago')) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para fechar o lead, assinatura e pagamento inicial devem estar confirmados.',
      );
    }

    if (input.to === 'primeiro_contato' && !current.whatsapp && !current.email) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Lead precisa ter WhatsApp ou e-mail antes de entrar em primeiro contato.');
    }

    const nextDor01 = input.to === 'diagnostico_agendado' ? Boolean(input.dor01Ok) : current.dor01_ok;
    const nextDor02 = input.to === 'proposta_enviada' ? Boolean(input.dor02Ok) : current.dor02_ok;
    const nextDor03 = input.to === 'fechado' ? Boolean(input.dor03Ok) : current.dor03_ok;

    if (input.to === 'diagnostico_agendado' && !current.cal_event_id) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para avançar para diagnóstico agendado é necessário confirmar reunião no calendário.',
        { reasonCode: 'MISSING_CALENDAR_EVENT' },
      );
    }

    if (input.to === 'diagnostico_agendado' && !current.cal_meet_url) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Para avançar para diagnóstico agendado é necessário que a reunião tenha link válido do Google Meet.',
        { reasonCode: 'MISSING_MEET_LINK' },
      );
    }

    if (isRequirementGatesEnabled()) {
      const leadPreview = {
        ...current,
        dor01_ok: nextDor01,
        dor02_ok: nextDor02,
        dor03_ok: nextDor03,
      };
      const missingEvaluations = await this.listMissingRequirementEvaluations(leadId, input.to, leadPreview);
      if (missingEvaluations.length > 0) {
        throw new CommercialFlowError(
          'VALIDATION_ERROR',
          `Requisitos pendentes para avançar para ${input.to}.`,
          {
            stage: input.to,
            missingRequirements: missingEvaluations.map((item) => item.requirementKey),
            reasons: missingEvaluations.map((item) => item.reason).filter(Boolean),
          },
        );
      }
    }

    const followupD2At =
      input.to === 'proposta_enviada'
        ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        : current.followup_d2_at;

    const followupD5At =
      input.to === 'proposta_enviada'
        ? new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        : current.followup_d5_at;

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET status_atual = $2,
           dor01_ok = $3,
           dor02_ok = $4,
           dor03_ok = $5,
           motivo_nutricao = $6,
           motivo_perda = $7,
           data_proxima_acao = $8,
           followup_d2_at = $9,
           followup_d5_at = $10,
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [
        leadId,
        input.to,
        nextDor01,
        nextDor02,
        nextDor03,
        input.to === 'nutricao' ? input.motivoNutricao || null : current.motivo_nutricao,
        input.to === 'perdido' ? input.motivoPerda || null : current.motivo_perda,
        input.to === 'nutricao' ? input.dataProximaAcao || null : current.data_proxima_acao,
        followupD2At,
        followupD5At,
      ],
    );

    await this.pool.query(
      `INSERT INTO commercial_lead_transitions (id, lead_id, status_origem, status_destino, actor, observacao)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), leadId, from, input.to, input.actor || null, input.observacao || null],
    );

    void createAuditLog(this.pool, {
      action: 'update',
      entityType: 'commercial_lead',
      entityId: leadId,
      changes: { before: { statusAtual: from }, after: { statusAtual: input.to } },
      metadata: { actor: input.actor, observacao: input.observacao },
    });

    return this.finalizeLeadRecordUpdate(leadId, updated.rows[0]);
  }

  async listLeadRequirements(leadId: string, stage?: CommercialLeadStatus) {
    const leadRow = await this.getLeadRow(leadId);
    if (!leadRow) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const targetStage = stage ?? (leadRow.status_atual as CommercialLeadStatus);
    const requirements = await this.evaluateStageRequirements(leadId, targetStage, leadRow);

    return {
      leadId,
      stage: targetStage,
      requirements,
    };
  }

  async putLeadRequirements(leadId: string, input: UpsertCommercialLeadRequirementsInput) {
    const leadRow = await this.getLeadRow(leadId);
    if (!leadRow) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    for (const update of input.updates) {
      const req = await this.pool.query(
        `SELECT id, stage, requirement_key
         FROM commercial_stage_requirements
         WHERE requirement_key = $1
           AND ($2::text IS NULL OR stage = $2)
         ORDER BY updated_at DESC
         LIMIT 1`,
        [update.requirementKey, update.stage ?? null],
      );

      const requirement = req.rows[0];
      if (!requirement) {
        throw new CommercialFlowError('VALIDATION_ERROR', `Requisito não encontrado: ${update.requirementKey}`);
      }

      await this.pool.query(
        `INSERT INTO commercial_lead_requirement_status
          (lead_id, requirement_id, status, evidence_json, verified_by, verified_at, updated_at)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,NOW())
         ON CONFLICT (lead_id, requirement_id)
         DO UPDATE SET
           status = EXCLUDED.status,
           evidence_json = EXCLUDED.evidence_json,
           verified_by = EXCLUDED.verified_by,
           verified_at = EXCLUDED.verified_at,
           updated_at = NOW()`,
        [
          leadId,
          requirement.id,
          update.status,
          JSON.stringify(update.evidence || {}),
          input.actor || null,
          new Date().toISOString(),
        ],
      );
    }

    return this.listLeadRequirements(leadId);
  }

  async listLeadAssets(
    leadId: string,
    filters?: { stage?: CommercialLeadStatus; assetType?: string }
  ): Promise<CommercialAssetRecord[]> {
    return this.leadRepository.listLeadAssets(leadId, filters);
  }

  async createLeadAsset(leadId: string, input: CreateCommercialAssetInput): Promise<CommercialAssetRecord> {
    await this.ensureLeadExists(leadId);

    if (!input.assetType?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'assetType é obrigatório.');
    }

    if (!input.url?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'url é obrigatório.');
    }

    return this.leadRepository.createLeadAsset(leadId, input);
  }

  async listCalendarConfigs(): Promise<CommercialCalendarConfigRecord[]> {
    return this.leadRepository.listCalendarConfigs();
  }

  async createCalendarConfig(input: UpsertCommercialCalendarConfigInput): Promise<CommercialCalendarConfigRecord> {
    const responsavelKey = String(input.responsavelKey || '').trim();
    const calendarId = String(input.calendarId || '').trim();
    const bookingUrl = String(input.bookingUrl || '').trim();
    const ownerEmail = String(input.ownerEmail || '').trim().toLowerCase();
    const timezone = String(input.timezone || 'America/Sao_Paulo').trim();

    if (!responsavelKey) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'responsavelKey é obrigatório.');
    }
    if (!calendarId) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'calendarId é obrigatório.');
    }
    if (!bookingUrl) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'bookingUrl é obrigatório.');
    }
    if (!ownerEmail) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'ownerEmail é obrigatório.');
    }

    return this.leadRepository.createCalendarConfig({
      responsavelKey,
      calendarId,
      bookingUrl,
      ownerEmail,
      timezone,
      isActive: input.isActive,
    });
  }

  async updateCalendarConfig(
    id: string,
    input: Partial<UpsertCommercialCalendarConfigInput>,
  ): Promise<CommercialCalendarConfigRecord> {
    const updated = await this.leadRepository.updateCalendarConfig(id, input);
    if (!updated) {
      throw new CommercialFlowError('NOT_FOUND', 'Configuração de calendário não encontrada.');
    }

    return updated;
  }

  async listCalendarReconciliationQueue(filters?: {
    status?: 'pending' | 'resolved' | 'ignored';
    limit?: number;
  }): Promise<CommercialCalendarReconciliationItem[]> {
    return this.leadRepository.listCalendarReconciliationQueue(filters);
  }

  async resolveCalendarReconciliation(
    id: string,
    input: ResolveCommercialCalendarReconciliationInput,
  ): Promise<CommercialCalendarReconciliationItem> {
    const payload = await this.leadRepository.findCalendarReconciliationPayload(id);
    if (!payload) {
      throw new CommercialFlowError('NOT_FOUND', 'Item de reconciliação não encontrado.');
    }

    if (input.status === 'resolved' && !input.leadId) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'leadId é obrigatório para resolver item.');
    }

    if (input.status === 'resolved' && input.leadId) {
      const slotStart = typeof payload.slotStart === 'string' ? payload.slotStart : undefined;
      const eventUrl = typeof payload.eventUrl === 'string' ? payload.eventUrl : undefined;
      const meetUrl = typeof payload.meetUrl === 'string' ? payload.meetUrl : undefined;
      const organizerEmail = typeof payload.organizerEmail === 'string' ? payload.organizerEmail : undefined;
      const googleEventId = typeof payload.googleEventId === 'string' ? payload.googleEventId : undefined;

      if (googleEventId && slotStart) {
        await this.pool.query(
          `UPDATE commercial_leads
           SET cal_event_id = $2,
               data_diagnostico = $3,
               cal_event_url = COALESCE($4, cal_event_url),
               cal_meet_url = COALESCE($5, cal_meet_url),
               cal_organizer_email = COALESCE($6, cal_organizer_email),
               cal_synced_at = NOW(),
               scheduled_from = 'google_booking',
               updated_at = NOW()
           WHERE lead_id = $1`,
          [input.leadId, googleEventId, slotStart, eventUrl || null, meetUrl || null, organizerEmail || null],
        );
      }
    }

    return this.leadRepository.updateCalendarReconciliation(id, input);
  }

  async listTemplates(filters?: {
    channel?: CommercialTemplateChannel;
    stage?: DispatchCommercialCommunicationInput['stage'];
    isActive?: boolean;
  }) {
    return this.leadRepository.listTemplates(filters);
  }

  async createTemplate(input: CreateCommercialTemplateInput) {
    if (!input.slug.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'slug é obrigatório.');
    }

    const { templateId, versionId, versionStatus } = await this.leadRepository.createTemplateWithInitialVersion(input);

    if (versionStatus === 'published' || input.bindAsDefault) {
      await upsertCommercialTemplateBinding(this.leadRepository, {
        stage: input.stage,
        channel: input.channel,
        profileKey: input.profileKey || null,
        templateVersionId: versionId,
        isDefault: true,
      });
    }

    return getTemplateWithVersionsOrThrow(this.leadRepository, templateId);
  }

  async updateTemplate(templateId: string, input: UpdateCommercialTemplateInput) {
    const template = await this.leadRepository.findTemplateMetadata(templateId);
    if (!template) {
      throw new CommercialFlowError('NOT_FOUND', 'Template comercial não encontrado.');
    }

    if (input.name !== undefined || input.isActive !== undefined) {
      await this.leadRepository.updateTemplateMetadata(templateId, input);
    }

    if (input.content !== undefined) {
      const { versionId, status } = await this.leadRepository.createTemplateVersion(templateId, input);

      if (status === 'published') {
        await this.publishTemplate(templateId, {
          versionId,
          stage: template.stage,
          channel: template.channel,
        });
      }
    }

    return getTemplateWithVersionsOrThrow(this.leadRepository, templateId);
  }

  async publishTemplate(templateId: string, input?: PublishCommercialTemplateInput) {
    const template = await this.leadRepository.findTemplateMetadata(templateId);
    if (!template) {
      throw new CommercialFlowError('NOT_FOUND', 'Template comercial não encontrado.');
    }

    const version = await this.leadRepository.findTemplateVersionToPublish(templateId, input?.versionId);
    if (!version) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Template sem versões para publicar.');
    }

    await this.leadRepository.markTemplateVersionPublished(templateId, version.id);

    await upsertCommercialTemplateBinding(this.leadRepository, {
      stage: (input?.stage || template.stage) as DispatchCommercialCommunicationInput['stage'],
      channel: (input?.channel || template.channel) as CommercialTemplateChannel,
      profileKey: input?.profileKey || null,
      templateVersionId: version.id,
      isDefault: true,
    });

    return getTemplateWithVersionsOrThrow(this.leadRepository, templateId);
  }

  async createSchedulingLink(leadId: string, input?: CreateCommercialSchedulingLinkInput): Promise<CommercialSchedulingLink> {
    if (!isPublicSchedulingEnabled()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Agendamento público está desabilitado.');
    }

    await this.ensureLeadExists(leadId);

    const { token, tokenHash, expiresAt } = createSchedulingToken(input?.expiresInDays ?? 14);

    await this.pool.query(
      `INSERT INTO commercial_scheduling_tokens (id, lead_id, token_hash, expires_at, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [uuidv4(), leadId, tokenHash, expiresAt],
    );

    return {
      leadId,
      token,
      expiresAt,
      url: `${resolveCommercialFormsBaseUrl()}/forms/comercial/scheduling?token=${token}&leadId=${leadId}`,
    };
  }

  async createHybridSchedulingInvite(leadId: string, input?: CreateCommercialSchedulingInviteInput): Promise<CommercialSchedulingInvite> {
    if (!isHybridSchedulingInviteEnabled()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Convite híbrido de agendamento está desabilitado.');
    }

    const leadRow = await this.getLeadRow(leadId);
    if (!leadRow) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    if (leadRow.form_type !== 'briefing') {
      try {
        await this.ingestIntegrationEvent({
          leadId,
          channel: 'custom',
          eventType: 'dispatch:context_blocked',
          payload: {
            reasonCode: 'BRIEFING_REQUIRED',
            stage: 'diagnostico_agendado',
            action: 'scheduling_invite',
          },
        });
      } catch {
        // best effort
      }

      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Briefing obrigatório antes de enviar convite de agendamento.',
        { reasonCode: 'BRIEFING_REQUIRED' },
      );
    }

    if (!leadRow.whatsapp && !leadRow.email) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Lead sem WhatsApp/e-mail válido para envio do convite de agendamento.',
      );
    }

    let timezone = input?.timezone || leadRow.timezone || 'America/Sao_Paulo';
    const durationMin = input?.durationMin ?? 30;
    const daysWindow = Math.min(Math.max(input?.daysWindow ?? 14, 1), 14);

    if (durationMin !== 30) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'durationMin inválido para a política atual. Use 30 minutos.',
      );
    }

    const inviteId = uuidv4();
    const sentAt = new Date().toISOString();
    const channelsSent: Array<'whatsapp' | 'gmail'> = [];
    const channelErrors: Array<{ channel: 'whatsapp' | 'gmail'; message: string }> = [];

    let provider: CommercialSchedulingInviteProvider = 'hub_public';
    let calendarUrl = '';
    let bookingUrl: string | undefined;
    let expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    let suggestedSlots: CommercialSchedulingSuggestedSlot[] = [];
    let interactiveMode: 'buttons_3' | undefined;
    let whatsappMode: CommercialWhatsAppSchedulingMode | undefined = leadRow.whatsapp ? 'text_reply' : undefined;
    let interactiveAttempted = false;
    let whatsappDispatchExternalId: string | undefined;
    let whatsappTemplateKey = 'wa_briefing_recebido_agendamento_link_v1';
    let gmailTemplateKey = 'gm_briefing_recebido_agendamento_link_v1';

    const googleBookingMode = isGoogleBookingEnabled();

    if (googleBookingMode) {
      if (!leadRow.email?.trim()) {
        throw new CommercialFlowError(
          'VALIDATION_ERROR',
          'Lead precisa ter e-mail para convite de agendamento no Google Calendar.',
          { reasonCode: 'LEAD_EMAIL_REQUIRED' },
        );
      }

      const config = await this.resolveCalendarConfigByResponsavel(leadRow.responsavel || '');
      if (!config) {
        throw new CommercialFlowError(
          'VALIDATION_ERROR',
          `Responsável "${leadRow.responsavel || 'não informado'}" sem booking link configurado.`,
          { reasonCode: 'CALENDAR_LINK_NOT_CONFIGURED' },
        );
      }

      provider = 'google_booking';
      bookingUrl = config.bookingUrl;
      timezone = input?.timezone || leadRow.timezone || config.timezone || 'America/Sao_Paulo';
      const googleSuggested = await this.collectGoogleBookingSuggestedSlots({
        calendarId: config.calendarId,
        timezone,
        durationMin,
        daysWindow,
        maxSuggestions: 2,
      });
      const hasTwoSuggestions = googleSuggested.length >= 2;
      if (hasTwoSuggestions) {
        suggestedSlots = googleSuggested.slice(0, 2).map((slot) => ({
          slotStart: slot.start,
          slotEnd: slot.end,
          label: formatSchedulingSlotLabel(slot.start, timezone),
        }));
        whatsappTemplateKey = 'wa_briefing_recebido_agendamento_google_sugestoes_v1';
        gmailTemplateKey = 'gm_briefing_recebido_agendamento_google_sugestoes_v1';
      } else {
        // Política definida: sem 2 sugestões válidas, enviar apenas link completo.
        suggestedSlots = [];
        whatsappTemplateKey = 'wa_briefing_recebido_agendamento_link_v1';
        gmailTemplateKey = 'gm_briefing_recebido_agendamento_link_v1';
      }

      const redirectLink = await this.createSchedulingRedirectLink(leadId, bookingUrl, 14);
      calendarUrl = redirectLink.url;
      expiresAt = redirectLink.expiresAt;

      await this.pool.query(
        `INSERT INTO commercial_scheduling_invites
          (id, lead_id, token_hash, suggested_slots_json, expires_at, sent_at, created_at, provider, booking_url, redirect_token_hash)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,NOW(),$7,$8,$9)`,
        [
          inviteId,
          leadId,
          redirectLink.tokenHash,
          JSON.stringify(
            suggestedSlots.map((slot) => ({
              slotStart: slot.slotStart,
              slotEnd: slot.slotEnd,
              label: slot.label,
            })),
          ),
          expiresAt,
          sentAt,
          provider,
          bookingUrl,
          redirectLink.tokenHash,
        ],
      );
    } else {
      if (!isPublicSchedulingEnabled()) {
        throw new CommercialFlowError('VALIDATION_ERROR', 'Agendamento público está desabilitado.');
      }

      const schedulingLink = await this.createSchedulingLink(leadId, { expiresInDays: 14 });
      calendarUrl = schedulingLink.url;
      expiresAt = schedulingLink.expiresAt;

      const suggested = await this.collectSuggestedSlots({
        leadId,
        timezone,
        durationMin,
        daysWindow,
        maxSuggestions: 2,
      });
      const quickConfirmEnabled = isQuickSchedulingConfirmEnabled();
      const formsBaseUrl = resolveCommercialFormsBaseUrl();

      for (const slot of suggested) {
        let quickToken: string | undefined;
        let quickLink: string | undefined;
        if (quickConfirmEnabled) {
          const quickTokenResult = await this.createQuickSchedulingToken({
            inviteId,
            leadId,
            slotStart: slot.start,
            slotEnd: slot.end,
          });
          quickToken = quickTokenResult.token;
          quickLink = `${formsBaseUrl}/forms/comercial/scheduling?token=${schedulingLink.token}&leadId=${leadId}&quickToken=${quickToken}`;
        }

        suggestedSlots.push({
          slotStart: slot.start,
          slotEnd: slot.end,
          label: formatSchedulingSlotLabel(slot.start, timezone),
          quickToken,
          quickLink,
        });
      }

      const hasQuickSuggestions = suggestedSlots.some((slot) => Boolean(slot.quickToken));
      whatsappTemplateKey = hasQuickSuggestions
        ? 'wa_briefing_recebido_agendamento_v1'
        : 'wa_briefing_recebido_agendamento_link_v1';
      gmailTemplateKey = hasQuickSuggestions
        ? 'gm_briefing_recebido_agendamento_v1'
        : 'gm_briefing_recebido_agendamento_link_v1';

      await this.pool.query(
        `INSERT INTO commercial_scheduling_invites
          (id, lead_id, token_hash, suggested_slots_json, expires_at, sent_at, created_at, provider)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,NOW(),$7)`,
        [
          inviteId,
          leadId,
          hashSchedulingToken(schedulingLink.token),
          JSON.stringify(
            suggested.map((slot) => ({
              slotStart: slot.start,
              slotEnd: slot.end,
              label: formatSchedulingSlotLabel(slot.start, timezone),
            })),
          ),
          expiresAt,
          sentAt,
          provider,
        ],
      );
    }

    if (googleBookingMode && isGoogleBookingFallbackToPublicEnabled() && provider === 'hub_public') {
      // no-op. guard keeps the flag used for rollout while preserving strict blocking on missing config.
    }

    const variables: Record<string, unknown> = {
      nome: leadRow.nome_contato || leadRow.nome_escritorio || 'Doutor(a)',
      escritorio: leadRow.nome_escritorio || '',
      horario_1: suggestedSlots[0]?.label || '',
      link_1: suggestedSlots[0]?.quickLink || calendarUrl,
      horario_2: suggestedSlots[1]?.label || '',
      link_2: suggestedSlots[1]?.quickLink || calendarUrl,
      link_calendario: calendarUrl,
    };

    if (leadRow.whatsapp) {
      const canAttemptInteractiveButtons =
        provider === 'google_booking'
        && suggestedSlots.length >= 2
        && isWhatsAppInteractiveSchedulingEnabled();
      let supportsInteractiveButtons = false;

      if (canAttemptInteractiveButtons) {
        try {
          const integrationType = (await this.evolutionApi.getInstanceIntegrationType())?.toUpperCase();
          supportsInteractiveButtons = Boolean(
            integrationType
            && integrationType.includes('CLOUD')
            && !integrationType.includes('BAILEYS'),
          );
        } catch {
          supportsInteractiveButtons = false;
        }
      }

      const shouldSendInteractiveButtons = canAttemptInteractiveButtons && supportsInteractiveButtons;

      if (shouldSendInteractiveButtons) {
        interactiveAttempted = true;
        try {
          const interactiveText = this.evolutionApi.resolveTemplate(
            'wa_briefing_recebido_agendamento_google_botoes_v1',
            variables,
          );
          const interactiveResult = await this.evolutionApi.sendInteractiveButtons({
            number: leadRow.whatsapp,
            text: interactiveText,
            footer: 'Equipe Lucena',
            buttons: [
              { id: 'SCHED_OPT_1', title: 'Opção 1' },
              { id: 'SCHED_OPT_2', title: 'Opção 2' },
              { id: 'SCHED_OPEN_CALENDAR', title: 'Escolher no calendário' },
            ],
          });

          whatsappDispatchExternalId = interactiveResult.messageId;
          interactiveMode = 'buttons_3';
          whatsappMode = 'buttons_3';
          channelsSent.push('whatsapp');

          await this.ingestIntegrationEvent({
            leadId,
            channel: 'whatsapp',
            eventType: 'dispatch:diagnostico_agendado:wa_briefing_recebido_agendamento_google_botoes_v1',
            externalEventId: interactiveResult.messageId,
            payload: {
              recipient: leadRow.whatsapp,
              templateKey: 'wa_briefing_recebido_agendamento_google_botoes_v1',
              variables,
              provider: 'evolution-api',
              providerAck: {
                messageId: interactiveResult.messageId,
                interactive: true,
                buttonIds: ['SCHED_OPT_1', 'SCHED_OPT_2', 'SCHED_OPEN_CALENDAR'],
              },
            },
          });
        } catch (error) {
          if (!isWhatsAppInteractiveFallbackTextEnabled()) {
            channelErrors.push({
              channel: 'whatsapp',
              message: error instanceof Error ? error.message : 'Falha desconhecida',
            });
          } else {
            try {
              await this.dispatchStageCommunication({
                leadId,
                channel: 'whatsapp',
                stage: 'diagnostico_agendado',
                templateKey: whatsappTemplateKey,
                recipient: leadRow.whatsapp,
                variables,
              });
              channelsSent.push('whatsapp');
            } catch (fallbackError) {
              channelErrors.push({
                channel: 'whatsapp',
                message: fallbackError instanceof Error ? fallbackError.message : 'Falha desconhecida',
              });
            }
          }
        }
      } else {
        try {
          await this.dispatchStageCommunication({
            leadId,
            channel: 'whatsapp',
            stage: 'diagnostico_agendado',
            templateKey: whatsappTemplateKey,
            recipient: leadRow.whatsapp,
            variables,
          });
          channelsSent.push('whatsapp');
        } catch (error) {
          channelErrors.push({
            channel: 'whatsapp',
            message: error instanceof Error ? error.message : 'Falha desconhecida',
          });
        }
      }
    }

    if (leadRow.email) {
      try {
        await this.dispatchStageCommunication({
          leadId,
          channel: 'gmail',
          stage: 'diagnostico_agendado',
          templateKey: gmailTemplateKey,
          recipient: leadRow.email,
          variables,
        });
        channelsSent.push('gmail');
      } catch (error) {
        channelErrors.push({
          channel: 'gmail',
          message: error instanceof Error ? error.message : 'Falha desconhecida',
        });
      }
    }

    if (channelsSent.length === 0) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Falha ao enviar convite de agendamento nos canais disponíveis.',
        {
          channelErrors,
        },
      );
    }

    if (whatsappDispatchExternalId) {
      await this.pool.query(
        `UPDATE commercial_scheduling_invites
         SET whatsapp_dispatch_external_id = $2
         WHERE id = $1`,
        [inviteId, whatsappDispatchExternalId],
      );
    }

    await this.pool.query(
      `UPDATE commercial_leads
       SET last_scheduling_invite_at = $2,
           last_scheduling_invite_channels_json = $3::jsonb,
           updated_at = NOW()
       WHERE lead_id = $1`,
      [leadId, sentAt, JSON.stringify(channelsSent)],
    );

    await this.ingestIntegrationEvent({
      leadId,
      channel: 'custom',
      eventType: 'scheduling:invite_sent',
      payload: {
        provider,
        inviteId,
        channels: channelsSent,
        channelErrors: channelErrors.length ? channelErrors : undefined,
        calendarUrl,
        bookingUrl,
        interactiveMode,
        whatsappMode,
        interactiveAttempted,
        suggestionCount: suggestedSlots.length,
        suggestionWindow: {
          daysWindow,
          durationMin,
          timezone,
        },
        suggestedSlots: suggestedSlots.map((slot) => ({
          slotStart: slot.slotStart,
          slotEnd: slot.slotEnd,
          label: slot.label,
        })),
      },
    });

    return {
      inviteId,
      leadId,
      provider,
      bookingUrl,
      calendarUrl,
      interactiveMode,
      whatsappMode,
      interactiveAttempted,
      suggestedSlots,
      channelsSent,
      channelErrors: channelErrors.length ? channelErrors : undefined,
      sentAt,
      expiresAt,
    };
  }

  async processWhatsAppSchedulingReply(
    input: ProcessWhatsAppSchedulingReplyInput,
  ): Promise<ProcessWhatsAppSchedulingReplyResult> {
    if (!isWhatsAppReplyAutoConfirmEnabled()) {
      return { ok: true, status: 'ignored', reasonCode: 'FEATURE_DISABLED' };
    }

    const fromPhone = normalizePhone(input.from);
    if (!fromPhone) {
      return { ok: true, status: 'ignored', reasonCode: 'MISSING_FROM_PHONE' };
    }

    const providerMessageId = (input.providerMessageId?.trim()
      || hashSchedulingToken(`${input.from || ''}|${input.timestamp || ''}|${JSON.stringify(input.raw || {})}`)).slice(0, 128);

    const inboundInsert = await this.pool.query(
      `INSERT INTO commercial_whatsapp_inbound_events
        (id, provider_message_id, from_phone, raw_payload_json, status, created_at)
       VALUES ($1,$2,$3,$4::jsonb,'received',NOW())
       ON CONFLICT (provider_message_id) DO NOTHING
       RETURNING id`,
      [uuidv4(), providerMessageId, fromPhone, JSON.stringify(input.raw || {})],
    );

    if (!inboundInsert.rows[0]) {
      const duplicateInvite = await this.resolveSchedulingInviteForWhatsAppReply(fromPhone, input.quotedMessageId);
      if (duplicateInvite) {
        await this.ingestIntegrationEvent({
          leadId: duplicateInvite.leadId,
          channel: 'whatsapp',
          eventType: 'whatsapp:reply_duplicate',
          externalEventId: providerMessageId,
          payload: {
            inviteId: duplicateInvite.inviteId,
            fromPhone,
          },
        });
      }
      return { ok: true, status: 'duplicate' };
    }

    const inboundId = String(inboundInsert.rows[0].id);
    const intent = parseWhatsAppSchedulingIntent(input.buttonPayload, input.text);
    const invite = await this.resolveSchedulingInviteForWhatsAppReply(fromPhone, input.quotedMessageId);

    if (!invite) {
      await this.pool.query(
        `UPDATE commercial_whatsapp_inbound_events
         SET status = 'ignored',
             reason_code = 'WHATSAPP_REPLY_INVITE_NOT_FOUND',
             intent = $2,
             processed_at = NOW()
         WHERE id = $1`,
        [inboundId, intent],
      );
      return { ok: true, status: 'ignored', reasonCode: 'WHATSAPP_REPLY_INVITE_NOT_FOUND', intent };
    }

    await this.pool.query(
      `UPDATE commercial_whatsapp_inbound_events
       SET lead_id = $2,
           invite_id = $3,
           intent = $4
       WHERE id = $1`,
      [inboundId, invite.leadId, invite.inviteId, intent],
    );

    await this.ingestIntegrationEvent({
      leadId: invite.leadId,
      channel: 'whatsapp',
      eventType: 'whatsapp:reply_received',
      externalEventId: providerMessageId,
      payload: {
        inviteId: invite.inviteId,
        fromPhone,
        quotedMessageId: input.quotedMessageId || null,
        intent,
        text: input.text || null,
        buttonPayload: input.buttonPayload || null,
      },
    });

    if (intent === 'unknown') {
      await sendWhatsAppTemplateMessage({
        evolutionApi: this.evolutionApi,
        leadId: invite.leadId,
        recipient: invite.whatsapp,
        templateKey: 'wa_agendamento_opcao_invalida_v1',
        variables: {
          nome: invite.nomeContato || invite.nomeEscritorio || 'Doutor(a)',
        },
        ingestIntegrationEvent: (event) => this.ingestIntegrationEvent(event),
      });

      await this.ingestIntegrationEvent({
        leadId: invite.leadId,
        channel: 'whatsapp',
        eventType: 'whatsapp:reply_invalid',
        payload: { inviteId: invite.inviteId, reasonCode: 'WHATSAPP_REPLY_INVALID_OPTION' },
      });

      await this.pool.query(
        `UPDATE commercial_whatsapp_inbound_events
         SET status = 'ignored',
             reason_code = 'WHATSAPP_REPLY_INVALID_OPTION',
             processed_at = NOW()
         WHERE id = $1`,
        [inboundId],
      );

      return {
        ok: true,
        status: 'ignored',
        reasonCode: 'WHATSAPP_REPLY_INVALID_OPTION',
        leadId: invite.leadId,
        inviteId: invite.inviteId,
        intent,
      };
    }

    if (intent === 'open_calendar') {
      const calendarUrl = invite.provider === 'google_booking' && invite.bookingUrl
        ? (await this.createSchedulingRedirectLink(invite.leadId, invite.bookingUrl, 14)).url
        : (await this.createSchedulingLink(invite.leadId, { expiresInDays: 14 })).url;

      await sendWhatsAppTemplateMessage({
        evolutionApi: this.evolutionApi,
        leadId: invite.leadId,
        recipient: invite.whatsapp,
        templateKey: 'wa_agendamento_abrir_calendario_v1',
        variables: {
          nome: invite.nomeContato || invite.nomeEscritorio || 'Doutor(a)',
          link_calendario: calendarUrl,
        },
        ingestIntegrationEvent: (event) => this.ingestIntegrationEvent(event),
      });

      await this.ingestIntegrationEvent({
        leadId: invite.leadId,
        channel: 'whatsapp',
        eventType: 'whatsapp:reply_open_calendar',
        payload: { inviteId: invite.inviteId, calendarUrl },
      });

      await this.pool.query(
        `UPDATE commercial_whatsapp_inbound_events
         SET status = 'processed',
             processed_at = NOW()
         WHERE id = $1`,
        [inboundId],
      );

      return { ok: true, status: 'processed', leadId: invite.leadId, inviteId: invite.inviteId, intent };
    }

    const slotIndex = intent === 'confirm_option_2' ? 1 : 0;
    const selectedSlot = invite.suggestedSlots[slotIndex];
    if (!selectedSlot) {
      await this.pool.query(
        `UPDATE commercial_whatsapp_inbound_events
         SET status = 'ignored',
             reason_code = 'WHATSAPP_REPLY_INVALID_OPTION',
             processed_at = NOW()
         WHERE id = $1`,
        [inboundId],
      );
      return {
        ok: true,
        status: 'ignored',
        reasonCode: 'WHATSAPP_REPLY_INVALID_OPTION',
        leadId: invite.leadId,
        inviteId: invite.inviteId,
        intent,
      };
    }

    const timezone = invite.timezone || 'America/Sao_Paulo';
    const slotStart = new Date(selectedSlot.slotStart).toISOString();
    const slotEnd = new Date(selectedSlot.slotEnd).toISOString();
    const durationMin = Math.max(
      15,
      Math.round((new Date(slotEnd).getTime() - new Date(slotStart).getTime()) / 60000),
    );
    const slotDate = formatDateForTimezone(new Date(slotStart), timezone);
    const availability = await this.requestScheduleSlots({
      leadId: invite.leadId,
      date: slotDate,
      durationMin,
      timezone,
    });

    const stillAvailable = availability.slots.some((slot) => slot.start === slotStart && slot.end === slotEnd);
    if (!stillAvailable) {
      const reoffer = await buildConflictReofferPayload({
        invite,
        resolveCalendarConfigByResponsavel: (responsavel) => this.resolveCalendarConfigByResponsavel(responsavel),
        collectGoogleBookingSuggestedSlots: (payload) => this.collectGoogleBookingSuggestedSlots(payload),
        collectSuggestedSlots: (payload) => this.collectSuggestedSlots(payload),
        createSchedulingRedirectLink: (leadId, bookingUrl, expiresInDays) =>
          this.createSchedulingRedirectLink(leadId, bookingUrl, expiresInDays),
        createSchedulingLink: (leadId, payload) => this.createSchedulingLink(leadId, payload),
      });
      await sendWhatsAppTemplateMessage({
        evolutionApi: this.evolutionApi,
        leadId: invite.leadId,
        recipient: invite.whatsapp,
        templateKey: reoffer.templateKey,
        variables: reoffer.variables,
        ingestIntegrationEvent: (event) => this.ingestIntegrationEvent(event),
      });

      await this.ingestIntegrationEvent({
        leadId: invite.leadId,
        channel: 'whatsapp',
        eventType: 'whatsapp:reply_conflict',
        payload: {
          inviteId: invite.inviteId,
          slotStart,
          slotEnd,
          suggestionCount: reoffer.suggestionCount,
        },
      });

      await this.pool.query(
        `UPDATE commercial_whatsapp_inbound_events
         SET status = 'processed',
             reason_code = 'WHATSAPP_REPLY_SLOT_CONFLICT',
             processed_at = NOW()
         WHERE id = $1`,
        [inboundId],
      );

      return {
        ok: true,
        status: 'processed',
        reasonCode: 'WHATSAPP_REPLY_SLOT_CONFLICT',
        leadId: invite.leadId,
        inviteId: invite.inviteId,
        intent,
      };
    }

    await this.confirmScheduledMeeting({
      leadId: invite.leadId,
      slotStart,
      slotEnd,
      attendeeName: invite.nomeContato || invite.nomeEscritorio || undefined,
      attendeeEmail: invite.email || undefined,
      timezone,
      scheduledFrom: slotIndex === 1 ? 'quick_suggestion_2' : 'quick_suggestion_1',
    });

    const refreshed = await this.getLeadRow(invite.leadId);
    if (!refreshed?.cal_meet_url) {
      await this.ingestIntegrationEvent({
        leadId: invite.leadId,
        channel: 'calendar',
        eventType: 'calendar:meeting_missing_link',
        payload: {
          inviteId: invite.inviteId,
          slotStart,
          slotEnd,
          source: 'whatsapp_reply',
        },
      });
    }

    await sendWhatsAppTemplateMessage({
      evolutionApi: this.evolutionApi,
      leadId: invite.leadId,
      recipient: invite.whatsapp,
      templateKey: 'wa_agendamento_confirmado_v1',
      variables: {
        nome: invite.nomeContato || invite.nomeEscritorio || 'Doutor(a)',
        data_hora: formatSchedulingSlotLabel(slotStart, timezone),
        link_meet: refreshed?.cal_meet_url || refreshed?.cal_event_url || 'Link será enviado em seguida.',
      },
      ingestIntegrationEvent: (event) => this.ingestIntegrationEvent(event),
    });

    await this.ingestIntegrationEvent({
      leadId: invite.leadId,
      channel: 'whatsapp',
      eventType: 'whatsapp:reply_confirmed',
      payload: {
        inviteId: invite.inviteId,
        intent,
        slotStart,
        slotEnd,
      },
    });

    await this.pool.query(
      `UPDATE commercial_whatsapp_inbound_events
       SET status = 'processed',
           processed_at = NOW()
       WHERE id = $1`,
      [inboundId],
    );

    return { ok: true, status: 'processed', leadId: invite.leadId, inviteId: invite.inviteId, intent };
  }

  async resolvePublicSchedulingRedirect(input: { leadId: string; token: string }): Promise<{ url: string }> {
    if (!input.token?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Token de redirecionamento é obrigatório.');
    }

    const tokenHash = hashSchedulingToken(input.token.trim());
    const inviteResult = await this.pool.query(
      `SELECT id, booking_url
       FROM commercial_scheduling_invites
       WHERE lead_id = $1
         AND provider = 'google_booking'
         AND (redirect_token_hash = $2 OR token_hash = $2)
         AND expires_at >= NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [input.leadId, tokenHash],
    );

    const invite = inviteResult.rows[0];
    if (!invite?.booking_url) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Link de agendamento inválido ou expirado.');
    }

    await this.pool.query(
      `UPDATE commercial_scheduling_invites
       SET redirect_clicked_at = NOW()
       WHERE id = $1`,
      [invite.id],
    );

    await this.ingestIntegrationEvent({
      leadId: input.leadId,
      channel: 'calendar',
      eventType: 'scheduling:booking_link_opened',
      payload: {
        inviteId: invite.id,
      },
    });

    return { url: String(invite.booking_url) };
  }

  async syncGoogleBookingEvents(): Promise<SyncGoogleBookingEventsResult> {
    if (!isGoogleBookingSyncEnabled()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Sync de Google Booking está desabilitado.');
    }

    const configs = await this.leadRepository.listActiveCalendarConfigs();

    let processedEvents = 0;
    let linkedLeads = 0;
    let queued = 0;

    for (const config of configs) {
      const stateResult = await this.pool.query(
        `SELECT sync_token
         FROM commercial_calendar_sync_state
         WHERE calendar_config_id = $1
         LIMIT 1`,
        [config.id],
      );
      const syncToken = stateResult.rows[0]?.sync_token as string | undefined;
      const initialTimeMin = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      let pageToken: string | undefined;
      let nextSyncToken: string | undefined;
      let localSyncToken = syncToken;
      let finished = false;

      while (!finished) {
        const batch = await this.googleApi.listEventsIncremental({
          calendarId: config.calendarId,
          syncToken: localSyncToken,
          pageToken,
          timeMin: initialTimeMin,
        });

        if (batch.resetRequired) {
          localSyncToken = undefined;
          pageToken = undefined;
          continue;
        }

        nextSyncToken = batch.nextSyncToken || nextSyncToken;
        pageToken = batch.nextPageToken;
        if (!pageToken) finished = true;

        for (const event of batch.events) {
          processedEvents += 1;
          const slotStart = event.start;
          const slotEnd = event.end;
          const attendeeEmail = event.attendeeEmails[0]?.toLowerCase();

          if (!slotStart || !slotEnd || !attendeeEmail) {
            queued += await this.enqueueCalendarReconciliation({
              calendarConfigId: config.id,
              googleEventId: event.eventId,
              attendeeEmail: attendeeEmail || null,
              eventStart: slotStart || null,
              eventEnd: slotEnd || null,
              reasonCode: 'booking_unmatched',
              payload: {
                googleEventId: event.eventId,
                attendeeEmail: attendeeEmail || null,
                slotStart: slotStart || null,
                slotEnd: slotEnd || null,
                eventUrl: event.eventUrl || null,
                meetUrl: event.meetUrl || null,
                organizerEmail: event.organizerEmail || null,
                status: event.status,
              },
            });
            continue;
          }

          if (event.status === 'cancelled') {
            await this.pool.query(
              `UPDATE commercial_leads
               SET cal_event_id = NULL,
                   data_diagnostico = NULL,
                   cal_event_url = NULL,
                   cal_meet_url = NULL,
                   cal_organizer_email = NULL,
                   cal_synced_at = NOW(),
                   updated_at = NOW()
               WHERE cal_event_id = $1
                 AND responsavel = $2`,
              [event.eventId, config.responsavelKey],
            );
            continue;
          }

          const candidates = await this.pool.query(
            `SELECT lead_id, cal_event_id
             FROM commercial_leads
             WHERE LOWER(COALESCE(email, '')) = $1
               AND responsavel = $2
               AND (
                 cal_event_id = $3
                 OR (
                   (cal_event_id IS NULL OR cal_event_id = '')
                   AND last_scheduling_invite_at IS NOT NULL
                   AND last_scheduling_invite_at >= NOW() - INTERVAL '14 days'
                 )
               )
             ORDER BY last_scheduling_invite_at DESC NULLS LAST
             LIMIT 3`,
            [attendeeEmail, config.responsavelKey, event.eventId],
          );

          if (candidates.rowCount !== 1) {
            queued += await this.enqueueCalendarReconciliation({
              calendarConfigId: config.id,
              googleEventId: event.eventId,
              attendeeEmail,
              eventStart: slotStart,
              eventEnd: slotEnd,
              reasonCode: candidates.rowCount === 0 ? 'booking_unmatched' : 'booking_ambiguous',
              payload: {
                googleEventId: event.eventId,
                attendeeEmail,
                slotStart,
                slotEnd,
                eventUrl: event.eventUrl || null,
                meetUrl: event.meetUrl || null,
                organizerEmail: event.organizerEmail || null,
                status: event.status,
              },
            });
            continue;
          }

          const leadId = String(candidates.rows[0].lead_id);
          linkedLeads += 1;

          await this.pool.query(
            `UPDATE commercial_leads
             SET cal_event_id = $2,
                 data_diagnostico = $3,
                 cal_event_url = $4,
                 cal_meet_url = $5,
                 cal_organizer_email = $6,
                 cal_synced_at = NOW(),
                 scheduled_from = 'google_booking',
                 updated_at = NOW()
             WHERE lead_id = $1`,
            [
              leadId,
              event.eventId,
              slotStart,
              event.eventUrl || null,
              event.meetUrl || null,
              event.organizerEmail || null,
            ],
          );

          const eventType = candidates.rows[0].cal_event_id ? 'calendar:meeting_updated' : 'calendar:meeting_scheduled';
          await this.ingestIntegrationEvent({
            leadId,
            channel: 'calendar',
            eventType,
            externalEventId: event.eventId,
            payload: {
              source: 'google_sync',
              slotStart,
              slotEnd,
              eventUrl: event.eventUrl || null,
              meetUrl: event.meetUrl || null,
              organizerEmail: event.organizerEmail || null,
            },
          });

          if (!event.meetUrl) {
            await this.ingestIntegrationEvent({
              leadId,
              channel: 'calendar',
              eventType: 'calendar:meeting_missing_link',
              externalEventId: event.eventId,
              payload: {
                source: 'google_sync',
              },
            });
          }
        }
      }

      if (nextSyncToken) {
        await this.pool.query(
          `INSERT INTO commercial_calendar_sync_state (calendar_config_id, sync_token, last_synced_at, updated_at)
           VALUES ($1,$2,NOW(),NOW())
           ON CONFLICT (calendar_config_id)
           DO UPDATE SET sync_token = EXCLUDED.sync_token,
                         last_synced_at = NOW(),
                         updated_at = NOW()`,
          [config.id, nextSyncToken],
        );
      } else {
        await this.pool.query(
          `INSERT INTO commercial_calendar_sync_state (calendar_config_id, sync_token, last_synced_at, updated_at)
           VALUES ($1, NULL, NOW(), NOW())
           ON CONFLICT (calendar_config_id)
           DO UPDATE SET last_synced_at = NOW(), updated_at = NOW()`,
          [config.id],
        );
      }
    }

    return {
      checkedCalendars: configs.length,
      processedEvents,
      linkedLeads,
      queued,
    };
  }

  async requestPublicScheduleSlots(input: PublicCommercialSchedulingInput) {
    await this.assertValidSchedulingToken(input.leadId, input.token, false);
    const timezone = input.timezone ?? await this.getLeadTimezone(input.leadId) ?? 'America/Sao_Paulo';
    const scheduleResult = await this.requestScheduleSlots({
      leadId: input.leadId,
      date: input.date,
      durationMin: input.durationMin,
      timezone,
    });

    const suggestedSlots = await this.resolvePublicSuggestedSlots({
      leadId: input.leadId,
      token: input.token,
      timezone,
    });

    return {
      ...scheduleResult,
      suggestedSlots,
      calendarUrl: `${resolveCommercialFormsBaseUrl()}/forms/comercial/scheduling?token=${input.token}&leadId=${input.leadId}`,
    };
  }

  async confirmPublicScheduledMeeting(input: PublicCommercialConfirmScheduleInput) {
    await this.assertValidSchedulingToken(input.leadId, input.token, true);
    return this.confirmScheduledMeeting({
      leadId: input.leadId,
      slotStart: input.slotStart,
      slotEnd: input.slotEnd,
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      timezone: input.timezone,
      scheduledFrom: 'calendar',
    });
  }

  async quickConfirmPublicScheduledMeeting(input: PublicCommercialQuickConfirmInput) {
    if (!isPublicSchedulingEnabled() || !isQuickSchedulingConfirmEnabled()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Confirmação rápida está desabilitada.');
    }

    if (!input.quickToken?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'quickToken é obrigatório.');
    }

    const quickTokenHash = hashSchedulingToken(input.quickToken.trim());
    const quickRowResult = await this.pool.query(
      `SELECT q.id, q.invite_id, q.slot_start, q.slot_end
       FROM commercial_scheduling_quick_tokens q
       JOIN commercial_scheduling_invites i ON i.id = q.invite_id
       WHERE q.lead_id = $1
         AND q.token_hash = $2
         AND q.used_at IS NULL
         AND q.expires_at >= NOW()
         AND i.expires_at >= NOW()
       ORDER BY q.created_at DESC
       LIMIT 1`,
      [input.leadId, quickTokenHash],
    );

    const quickRow = quickRowResult.rows[0];
    if (!quickRow) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Token rápido inválido ou expirado.');
    }

    const timezone = await this.getLeadTimezone(input.leadId) || 'America/Sao_Paulo';
    const slotStart = new Date(quickRow.slot_start as string).toISOString();
    const slotEnd = new Date(quickRow.slot_end as string).toISOString();
    const durationMin = Math.round((new Date(slotEnd).getTime() - new Date(slotStart).getTime()) / 60000);
    const slotDate = formatDateForTimezone(new Date(slotStart), timezone);

    const availability = await this.requestScheduleSlots({
      leadId: input.leadId,
      date: slotDate,
      durationMin,
      timezone,
    });

    const stillAvailable = availability.slots.some(
      (slot) => slot.start === slotStart && slot.end === slotEnd,
    );

    if (!stillAvailable) {
      await this.ingestIntegrationEvent({
        leadId: input.leadId,
        channel: 'custom',
        eventType: 'scheduling:quick_conflict',
        payload: {
          inviteId: quickRow.invite_id,
          slotStart,
          slotEnd,
        },
      });

      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Esse horário já não está disponível. Abra o calendário completo para escolher outro horário.',
        { reasonCode: 'SLOT_CONFLICT' },
      );
    }

    const scheduledFrom = await this.resolveQuickScheduledFrom(quickRow.invite_id as string, slotStart, slotEnd);
    const confirmation = await this.confirmScheduledMeeting({
      leadId: input.leadId,
      slotStart,
      slotEnd,
      timezone,
      scheduledFrom,
    });

    await this.pool.query(
      `UPDATE commercial_scheduling_quick_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [quickRow.id],
    );

    await this.ingestIntegrationEvent({
      leadId: input.leadId,
      channel: 'custom',
      eventType: 'scheduling:quick_confirmed',
      externalEventId: confirmation.eventId,
      payload: {
        inviteId: quickRow.invite_id,
        slotStart,
        slotEnd,
        scheduledFrom,
      },
    });

    return {
      ok: true as const,
      leadId: input.leadId,
      eventId: confirmation.eventId,
      slotStart,
      slotEnd,
    };
  }

  async updatePublicScheduledMeeting(input: PublicCommercialUpdateScheduleInput) {
    await this.assertValidSchedulingToken(input.leadId, input.token, true);
    return this.updateScheduledMeeting({
      leadId: input.leadId,
      eventId: input.eventId,
      slotStart: input.slotStart,
      slotEnd: input.slotEnd,
      attendeeName: input.attendeeName,
      attendeeEmail: input.attendeeEmail,
      timezone: input.timezone,
    });
  }

  async cancelPublicScheduledMeeting(input: PublicCommercialCancelScheduleInput) {
    await this.assertValidSchedulingToken(input.leadId, input.token, true);
    return this.cancelScheduledMeeting({
      leadId: input.leadId,
      eventId: input.eventId,
      reason: input.reason,
      cancelledBy: input.cancelledBy || 'public_link',
    });
  }

  async dispatchMeetingReminders(now = new Date()): Promise<{ checked: number; sent: number }> {
    const result = await this.pool.query(
      `SELECT lead_id, cal_event_id, data_diagnostico, nome_escritorio, nome_contato, whatsapp, email
       FROM commercial_leads
       WHERE status_atual = 'diagnostico_agendado'
         AND data_diagnostico IS NOT NULL
         AND cal_event_id IS NOT NULL
         AND data_diagnostico BETWEEN NOW() + interval '90 minutes' AND NOW() + interval '26 hours'`,
    );

    let sent = 0;
    for (const row of result.rows) {
      const meetingAt = new Date(row.data_diagnostico as string);
      const msToMeeting = meetingAt.getTime() - now.getTime();
      const reminderType = msToMeeting > 10 * 60 * 60 * 1000 ? 'd-1' : 'h-2';
      const eventType = `calendar:reminder:${reminderType}`;

      const dedupe = await this.pool.query(
        `SELECT id
         FROM commercial_integration_events
         WHERE lead_id = $1
           AND event_type = $2
           AND external_event_id = $3
         LIMIT 1`,
        [row.lead_id, eventType, row.cal_event_id],
      );
      if (dedupe.rowCount && dedupe.rowCount > 0) {
        continue;
      }

      const variables = {
        nome: row.nome_contato || row.nome_escritorio,
        nomeEscritorio: row.nome_escritorio,
        data_hora: meetingAt.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      };

      const channelsSent: string[] = [];
      if (row.whatsapp) {
        await this.dispatchStageCommunication({
          leadId: row.lead_id,
          channel: 'whatsapp',
          stage: 'diagnostico_agendado',
          templateKey: 'wa_reuniao_agendada_lembrete_v1',
          recipient: row.whatsapp,
          variables,
        });
        channelsSent.push('whatsapp');
      }

      if (row.email) {
        await this.dispatchStageCommunication({
          leadId: row.lead_id,
          channel: 'gmail',
          stage: 'diagnostico_agendado',
          templateKey: 'gm_reuniao_agendada_lembrete_v1',
          recipient: row.email,
          variables,
        });
        channelsSent.push('gmail');
      }

      if (channelsSent.length > 0) {
        sent += 1;
        await this.ingestIntegrationEvent({
          leadId: row.lead_id,
          channel: 'custom',
          eventType,
          externalEventId: row.cal_event_id,
          payload: {
            reminderType,
            channels: channelsSent,
            meetingAt: row.data_diagnostico,
          },
        });
      }
    }

    return { checked: result.rowCount || 0, sent };
  }

  private async finalizeLeadRecordUpdate(leadId: string, updatedRow: any): Promise<CommercialLeadRecord> {
    if (isQualificationScoreEnabled()) {
      return this.recomputeLeadQualification(leadId);
    }

    return this.attachComputedLeadFields(mapCommercialLeadRow(updatedRow));
  }

  private async attachComputedLeadFields(lead: CommercialLeadRecord): Promise<CommercialLeadRecord> {
    if (!isRequirementGatesEnabled()) {
      return lead;
    }

    const missingRequirements = await this.listMissingRequirementKeys(lead.leadId, lead.statusAtual);
    return {
      ...lead,
      missingRequirements,
    };
  }

  private async recomputeLeadQualification(leadId: string): Promise<CommercialLeadRecord> {
    const current = await this.getLeadRow(leadId);
    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const result = this.qualification.evaluate({
      statusAtual: current.status_atual,
      areaPrincipal: current.area_principal,
      qtdAdvogados: current.qtd_advogados != null ? Number(current.qtd_advogados) : null,
      faturamentoEstimado: current.faturamento_estimado != null ? Number(current.faturamento_estimado) : null,
      orcamentoMarketing: current.orcamento_marketing != null ? Number(current.orcamento_marketing) : null,
      formType: current.form_type,
      consentGiven: Boolean(current.consent_given),
      dor01Ok: Boolean(current.dor01_ok),
      dataDiagnostico: current.data_diagnostico,
      proximaAcao: current.proxima_acao,
      whatsapp: current.whatsapp,
      email: current.email,
    });

    const updated = await this.pool.query(
      `UPDATE commercial_leads
       SET score_qualificacao = $2,
           qualification_tier = $3,
           qualification_reasons_json = $4::jsonb,
           qualification_updated_at = NOW(),
           updated_at = NOW()
       WHERE lead_id = $1
       RETURNING *`,
      [leadId, result.score, result.tier, JSON.stringify({ breakdown: result.breakdown, reasons: result.reasons })],
    );

    return this.attachComputedLeadFields(mapCommercialLeadRow(updated.rows[0]));
  }

  private async listMissingRequirementKeys(
    leadId: string,
    stage: CommercialLeadStatus,
    leadSnapshot?: any,
  ): Promise<string[]> {
    const missing = await this.listMissingRequirementEvaluations(leadId, stage, leadSnapshot);
    return missing.map((item) => item.requirementKey);
  }

  private async listMissingRequirementEvaluations(
    leadId: string,
    stage: CommercialLeadStatus,
    leadSnapshot?: any,
  ): Promise<CommercialRequirementEvaluation[]> {
    const evaluations = await this.evaluateStageRequirements(leadId, stage, leadSnapshot);
    return evaluations.filter((item) => item.required && !item.satisfied);
  }

  private async evaluateStageRequirements(
    leadId: string,
    stage: CommercialLeadStatus,
    leadSnapshot?: any,
  ): Promise<CommercialRequirementEvaluation[]> {
    const requirementsResult = await this.pool.query(
      `SELECT id, stage, requirement_key, requirement_type, config_json, is_required, profile_key
       FROM commercial_stage_requirements
       WHERE stage = $1
       ORDER BY profile_key DESC NULLS LAST, requirement_key ASC`,
      [stage],
    );

    const requirements = requirementsResult.rows;
    if (requirements.length === 0) {
      return [];
    }

    const reqIds = requirements.map((item) => item.id);
    const manualStatusesResult = await this.pool.query(
      `SELECT requirement_id, status, evidence_json, verified_by, verified_at, updated_at
       FROM commercial_lead_requirement_status
       WHERE lead_id = $1
         AND requirement_id = ANY($2::uuid[])`,
      [leadId, reqIds],
    );

    const manualStatusByRequirement = new Map<string, any>();
    for (const row of manualStatusesResult.rows) {
      manualStatusByRequirement.set(String(row.requirement_id), row);
    }

    const lead = leadSnapshot || (await this.getLeadRow(leadId));
    if (!lead) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const evaluations: CommercialRequirementEvaluation[] = [];
    for (const requirement of requirements) {
      const system = await evaluateRequirementSystem(this.pool, leadId, lead, requirement);
      const manual = manualStatusByRequirement.get(String(requirement.id));

      if (manual && (manual.status === 'done' || manual.status === 'waived')) {
        evaluations.push({
          requirementId: requirement.id,
          requirementKey: requirement.requirement_key,
          stage: requirement.stage as CommercialLeadStatus,
          required: Boolean(requirement.is_required),
          status: manual.status as CommercialRequirementStatus,
          source: 'manual',
          satisfied: true,
          type: requirement.requirement_type as CommercialRequirementType,
          evidence: manual.evidence_json || undefined,
        });
        continue;
      }

      evaluations.push({
        requirementId: requirement.id,
        requirementKey: requirement.requirement_key,
        stage: requirement.stage as CommercialLeadStatus,
        required: Boolean(requirement.is_required),
        status: system.satisfied ? 'done' : 'pending',
        source: 'system',
        satisfied: system.satisfied,
        type: requirement.requirement_type as CommercialRequirementType,
        reason: system.reason,
        evidence: system.evidence,
      });
    }

    return evaluations;
  }

  private async applyRequirementWaivers(
    leadId: string,
    requirementKeys: string[],
    input: { actor: string | null; reason: string },
  ): Promise<void> {
    for (const requirementKey of requirementKeys) {
      const reqResult = await this.pool.query(
        `SELECT id
         FROM commercial_stage_requirements
         WHERE requirement_key = $1`,
        [requirementKey],
      );

      for (const req of reqResult.rows) {
        await this.pool.query(
          `INSERT INTO commercial_lead_requirement_status
            (lead_id, requirement_id, status, evidence_json, verified_by, verified_at, updated_at)
           VALUES ($1,$2,'waived',$3::jsonb,$4,NOW(),NOW())
           ON CONFLICT (lead_id, requirement_id)
           DO UPDATE SET
             status = 'waived',
             evidence_json = EXCLUDED.evidence_json,
             verified_by = EXCLUDED.verified_by,
             verified_at = EXCLUDED.verified_at,
             updated_at = NOW()`,
          [
            leadId,
            req.id,
            JSON.stringify({ waiveReason: input.reason }),
            input.actor,
          ],
        );
      }
    }
  }

  private async resolveSchedulingInviteForWhatsAppReply(
    normalizedPhone: string,
    quotedMessageId?: string,
  ): Promise<SchedulingInviteForWhatsAppReply | null> {
    const result = await this.pool.query(
      `SELECT i.id AS invite_id,
              i.lead_id,
              i.provider,
              i.booking_url,
              i.whatsapp_dispatch_external_id,
              i.suggested_slots_json,
              l.whatsapp,
              l.email,
              l.nome_contato,
              l.nome_escritorio,
              l.timezone,
              l.responsavel
       FROM commercial_scheduling_invites i
       JOIN commercial_leads l ON l.lead_id = i.lead_id
       WHERE i.expires_at >= NOW()
         AND regexp_replace(COALESCE(l.whatsapp, ''), '[^0-9]', '', 'g') = $1
       ORDER BY CASE
                  WHEN COALESCE($2, '') <> '' AND i.whatsapp_dispatch_external_id = $2 THEN 0
                  ELSE 1
                END,
                i.created_at DESC
       LIMIT 5`,
      [normalizedPhone, quotedMessageId || null],
    );

    const row = result.rows[0];
    if (!row) return null;

    return mapSchedulingInviteForWhatsAppReplyRow(row);
  }

  private async createSchedulingRedirectLink(
    leadId: string,
    bookingUrl: string,
    expiresInDays: number,
  ): Promise<{ token: string; tokenHash: string; expiresAt: string; url: string }> {
    if (!bookingUrl.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'bookingUrl é obrigatório para redirecionamento.');
    }
    const { token, tokenHash, expiresAt } = createSchedulingToken(expiresInDays);

    await this.pool.query(
      `INSERT INTO commercial_scheduling_tokens (id, lead_id, token_hash, expires_at, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [uuidv4(), leadId, tokenHash, expiresAt],
    );

    const apiBase = resolveCommercialApiBaseUrl();
    const url = `${apiBase}/api/public/comercial/scheduling/redirect?token=${token}&leadId=${leadId}`;
    return { token, tokenHash, expiresAt, url };
  }

  private async resolveCalendarConfigByResponsavel(
    responsavel: string,
  ): Promise<CommercialCalendarConfigRecord | null> {
    return this.leadRepository.findActiveCalendarConfigByResponsavel(responsavel);
  }

  private async enqueueCalendarReconciliation(input: {
    calendarConfigId: string;
    googleEventId: string;
    attendeeEmail: string | null;
    eventStart: string | null;
    eventEnd: string | null;
    reasonCode: string;
    payload: Record<string, unknown>;
  }): Promise<number> {
    return this.leadRepository.enqueueCalendarReconciliation(input);
  }

  private async collectSuggestedSlots(input: {
    leadId: string;
    timezone: string;
    durationMin: number;
    daysWindow: number;
    maxSuggestions: number;
  }): Promise<CommercialScheduleSlot[]> {
    const suggested: CommercialScheduleSlot[] = [];

    for (let dayOffset = 0; dayOffset < input.daysWindow; dayOffset += 1) {
      const targetDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      const date = formatDateForTimezone(targetDate, input.timezone);
      const daySlots = await this.requestScheduleSlots({
        leadId: input.leadId,
        date,
        durationMin: input.durationMin,
        timezone: input.timezone,
      });

      for (const slot of daySlots.slots) {
        if (appendUniqueSchedulingSlot(suggested, slot, input.maxSuggestions)) {
          return suggested;
        }
      }
    }

    return suggested;
  }

  private async collectGoogleBookingSuggestedSlots(input: {
    calendarId: string;
    timezone: string;
    durationMin: number;
    daysWindow: number;
    maxSuggestions: number;
  }): Promise<CommercialScheduleSlot[]> {
    const suggested: CommercialScheduleSlot[] = [];

    for (let dayOffset = 0; dayOffset < input.daysWindow; dayOffset += 1) {
      const targetDate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      const date = formatDateForTimezone(targetDate, input.timezone);
      const daySlots = await this.googleApi.getFreeBusyForCalendar(
        input.calendarId,
        date,
        input.durationMin,
        input.timezone,
      );

      const validDaySlots = applySchedulingPolicy(daySlots, input.timezone);
      for (const slot of validDaySlots) {
        if (appendUniqueSchedulingSlot(suggested, slot, input.maxSuggestions)) {
          return suggested;
        }
      }
    }

    return suggested;
  }

  private async createQuickSchedulingToken(input: {
    inviteId: string;
    leadId: string;
    slotStart: string;
    slotEnd: string;
  }): Promise<{ token: string; expiresAt: string }> {
    const { token, tokenHash, expiresAt } = createQuickSchedulingTokenForSlot(input.slotStart);

    await this.pool.query(
      `INSERT INTO commercial_scheduling_quick_tokens
        (id, invite_id, lead_id, slot_start, slot_end, token_hash, expires_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [uuidv4(), input.inviteId, input.leadId, input.slotStart, input.slotEnd, tokenHash, expiresAt],
    );

    return { token, expiresAt };
  }

  private async resolvePublicSuggestedSlots(input: {
    leadId: string;
    token: string;
    timezone: string;
  }): Promise<CommercialSchedulingSuggestedSlot[]> {
    const tokenHash = hashSchedulingToken(input.token.trim());
    const inviteResult = await this.pool.query(
      `SELECT id, suggested_slots_json
       FROM commercial_scheduling_invites
       WHERE lead_id = $1
         AND token_hash = $2
         AND expires_at >= NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [input.leadId, tokenHash],
    );

    const invite = inviteResult.rows[0];
    if (!invite) {
      return [];
    }

    const rawSlots = Array.isArray(invite.suggested_slots_json)
      ? (invite.suggested_slots_json as Array<Record<string, unknown>>)
      : [];

    const formsBaseUrl = resolveCommercialFormsBaseUrl();
    const quickConfirmEnabled = isQuickSchedulingConfirmEnabled();
    const suggested: CommercialSchedulingSuggestedSlot[] = [];
    for (const raw of rawSlots) {
      const rawStart = String(raw.slotStart || raw.start || '');
      const rawEnd = String(raw.slotEnd || raw.end || '');

      const startDate = new Date(rawStart);
      const endDate = new Date(rawEnd);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        continue;
      }

      const slotStart = startDate.toISOString();
      const slotEnd = endDate.toISOString();
      if (!isSlotWithinSchedulingPolicy(slotStart, slotEnd, input.timezone)) {
        continue;
      }

      let quickToken: string | undefined;
      let quickLink: string | undefined;
      if (quickConfirmEnabled) {
        const quick = await this.createQuickSchedulingToken({
          inviteId: invite.id as string,
          leadId: input.leadId,
          slotStart,
          slotEnd,
        });
        quickToken = quick.token;
        quickLink = `${formsBaseUrl}/forms/comercial/scheduling?token=${input.token}&leadId=${input.leadId}&quickToken=${quick.token}`;
      }

      suggested.push({
        slotStart,
        slotEnd,
        label: formatSchedulingSlotLabel(slotStart, input.timezone),
        quickToken,
        quickLink,
      });

      if (suggested.length >= 2) {
        break;
      }
    }

    return suggested;
  }

  private async resolveQuickScheduledFrom(
    inviteId: string,
    slotStart: string,
    slotEnd: string,
  ): Promise<'quick_suggestion_1' | 'quick_suggestion_2'> {
    const result = await this.pool.query(
      `SELECT suggested_slots_json
       FROM commercial_scheduling_invites
       WHERE id = $1
       LIMIT 1`,
      [inviteId],
    );

    const rawSlots = Array.isArray(result.rows[0]?.suggested_slots_json)
      ? (result.rows[0].suggested_slots_json as Array<Record<string, unknown>>)
      : [];

    const index = rawSlots.findIndex((raw) => {
      const currentStart = String(raw.slotStart || raw.start || '');
      const currentEnd = String(raw.slotEnd || raw.end || '');
      const startDate = new Date(currentStart);
      const endDate = new Date(currentEnd);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return false;
      }
      const normalizedStart = startDate.toISOString();
      const normalizedEnd = endDate.toISOString();
      return normalizedStart === slotStart && normalizedEnd === slotEnd;
    });

    if (index === 1) {
      return 'quick_suggestion_2';
    }

    return 'quick_suggestion_1';
  }

  private async assertValidSchedulingToken(leadId: string, token: string, markUsed: boolean): Promise<void> {
    if (!isPublicSchedulingEnabled()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Agendamento público está desabilitado.');
    }

    if (!token?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Token de agendamento é obrigatório.');
    }

    const tokenHash = hashSchedulingToken(token.trim());
    const found = await this.pool.query(
      `SELECT id
       FROM commercial_scheduling_tokens
       WHERE lead_id = $1
         AND token_hash = $2
         AND revoked_at IS NULL
         AND expires_at >= NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [leadId, tokenHash],
    );

    if (!found.rows[0]) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Link de agendamento inválido ou expirado.');
    }

    if (markUsed) {
      await this.pool.query(
        `UPDATE commercial_scheduling_tokens
         SET used_at = NOW()
         WHERE id = $1`,
        [found.rows[0].id],
      );
    }
  }

  private async getLeadRow(leadId: string): Promise<any | null> {
    return this.leadRepository.findLeadRow(leadId);
  }

}
