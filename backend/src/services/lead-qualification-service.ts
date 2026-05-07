export type LeadQualificationTier = 'quente' | 'morno' | 'frio';

export interface LeadQualificationInput {
  statusAtual?: string | null;
  areaPrincipal?: string | null;
  qtdAdvogados?: number | null;
  faturamentoEstimado?: number | null;
  orcamentoMarketing?: number | null;
  formType?: string | null;
  consentGiven?: boolean | null;
  dor01Ok?: boolean | null;
  dataDiagnostico?: string | null;
  proximaAcao?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}

export interface LeadQualificationResult {
  score: number;
  tier: LeadQualificationTier;
  breakdown: {
    fitPerfil: number;
    potencialInvestimento: number;
    urgencia: number;
    completudeDados: number;
    engajamentoFluxo: number;
  };
  reasons: string[];
}

const FLOW_SCORE_BY_STATUS: Record<string, number> = {
  novo_lead: 0,
  primeiro_contato: 5,
  diagnostico_agendado: 10,
  diagnostico_concluido: 14,
  proposta_enviada: 16,
  negociacao: 18,
  fechado: 20,
  nutricao: 8,
  perdido: 0,
};

export class LeadQualificationService {
  evaluate(input: LeadQualificationInput): LeadQualificationResult {
    const reasons: string[] = [];

    const fitPerfil =
      this.fitByArea(input.areaPrincipal, reasons) +
      this.fitByTeamSize(input.qtdAdvogados, reasons) +
      this.fitByRevenue(input.faturamentoEstimado, reasons);

    const potencialInvestimento =
      this.investmentByBudget(input.orcamentoMarketing, reasons) +
      this.investmentByRevenue(input.faturamentoEstimado, reasons);

    const urgencia =
      this.urgencyByDor(input.dor01Ok, reasons) +
      this.urgencyByNextAction(input.proximaAcao, reasons) +
      this.urgencyByMeeting(input.dataDiagnostico, reasons);

    const completudeDados =
      this.completenessByContact(input.whatsapp, input.email, reasons) +
      this.completenessByBriefing(input.formType, reasons) +
      this.completenessByConsent(input.consentGiven, reasons) +
      this.completenessByBaseFields(input, reasons);

    const engajamentoFluxo =
      this.flowByStatus(input.statusAtual, reasons) +
      this.flowByMeeting(input.dataDiagnostico, reasons);

    const rawScore = fitPerfil + potencialInvestimento + urgencia + completudeDados + engajamentoFluxo;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));
    const tier: LeadQualificationTier = score >= 75 ? 'quente' : score >= 50 ? 'morno' : 'frio';

    return {
      score,
      tier,
      breakdown: {
        fitPerfil,
        potencialInvestimento,
        urgencia,
        completudeDados,
        engajamentoFluxo,
      },
      reasons,
    };
  }

  private fitByArea(areaPrincipal: string | null | undefined, reasons: string[]) {
    if (areaPrincipal?.trim()) {
      reasons.push('Área principal informada.');
      return 10;
    }
    reasons.push('Área principal ausente.');
    return 0;
  }

  private fitByTeamSize(qtdAdvogados: number | null | undefined, reasons: string[]) {
    const value = Number(qtdAdvogados || 0);
    if (value >= 3) {
      reasons.push('Equipe com 3+ advogados.');
      return 8;
    }
    if (value >= 1) {
      reasons.push('Equipe inicial identificada.');
      return 5;
    }
    reasons.push('Tamanho da equipe não informado.');
    return 0;
  }

  private fitByRevenue(faturamento: number | null | undefined, reasons: string[]) {
    const value = Number(faturamento || 0);
    if (value >= 50_000) {
      reasons.push('Faturamento estimado indica fit de operação.');
      return 7;
    }
    if (value >= 20_000) {
      reasons.push('Faturamento estimado moderado.');
      return 4;
    }
    reasons.push('Faturamento estimado baixo ou ausente.');
    return 0;
  }

  private investmentByBudget(orcamento: number | null | undefined, reasons: string[]) {
    const value = Number(orcamento || 0);
    if (value >= 10_000) {
      reasons.push('Orçamento de marketing alto.');
      return 12;
    }
    if (value >= 5_000) {
      reasons.push('Orçamento de marketing viável.');
      return 8;
    }
    if (value >= 2_000) {
      reasons.push('Orçamento de marketing inicial.');
      return 4;
    }
    reasons.push('Orçamento de marketing ausente ou baixo.');
    return 0;
  }

  private investmentByRevenue(faturamento: number | null | undefined, reasons: string[]) {
    const value = Number(faturamento || 0);
    if (value >= 100_000) return 8;
    if (value >= 50_000) return 5;
    if (value >= 20_000) return 3;
    if (value > 0) {
      reasons.push('Receita estimada ainda limitada para expansão rápida.');
    }
    return 0;
  }

  private urgencyByDor(dor01Ok: boolean | null | undefined, reasons: string[]) {
    if (dor01Ok) {
      reasons.push('Pré-qualificação (DoR01) confirmada.');
      return 8;
    }
    return 0;
  }

  private urgencyByNextAction(proximaAcao: string | null | undefined, reasons: string[]) {
    if (proximaAcao?.trim()) {
      reasons.push('Próxima ação comercial definida.');
      return 4;
    }
    return 0;
  }

  private urgencyByMeeting(dataDiagnostico: string | null | undefined, reasons: string[]) {
    if (!dataDiagnostico) return 0;
    const dt = new Date(dataDiagnostico);
    if (Number.isNaN(dt.getTime())) return 0;
    const diff = dt.getTime() - Date.now();
    if (diff > 0 && diff <= 14 * 24 * 60 * 60 * 1000) {
      reasons.push('Diagnóstico agendado em janela de decisão.');
      return 3;
    }
    return 1;
  }

  private completenessByContact(whatsapp: string | null | undefined, email: string | null | undefined, reasons: string[]) {
    if ((whatsapp && whatsapp.trim()) || (email && email.trim())) {
      return 4;
    }
    reasons.push('Sem canal de contato validado.');
    return 0;
  }

  private completenessByBriefing(formType: string | null | undefined, reasons: string[]) {
    if (formType === 'briefing') return 8;
    reasons.push('Briefing ainda não preenchido.');
    return 0;
  }

  private completenessByConsent(consentGiven: boolean | null | undefined, reasons: string[]) {
    if (consentGiven) return 4;
    reasons.push('Consentimento LGPD pendente.');
    return 0;
  }

  private completenessByBaseFields(input: LeadQualificationInput, reasons: string[]) {
    let points = 0;
    if (input.areaPrincipal?.trim()) points += 2;
    if (Number(input.qtdAdvogados || 0) > 0) points += 2;
    if (Number(input.orcamentoMarketing || 0) > 0) points += 2;
    if (Number(input.faturamentoEstimado || 0) > 0) points += 2;
    if (points < 8) {
      reasons.push('Campos-base de diagnóstico incompletos.');
    }
    return points;
  }

  private flowByStatus(statusAtual: string | null | undefined, reasons: string[]) {
    const points = FLOW_SCORE_BY_STATUS[(statusAtual || '').trim().toLowerCase()] ?? 0;
    if (points >= 16) {
      reasons.push('Lead avançado no fluxo comercial.');
    }
    return points;
  }

  private flowByMeeting(dataDiagnostico: string | null | undefined, reasons: string[]) {
    if (!dataDiagnostico) return 0;
    reasons.push('Reunião de diagnóstico registrada.');
    return 5;
  }
}

