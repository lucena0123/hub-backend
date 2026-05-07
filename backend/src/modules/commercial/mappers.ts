import type {
  CommercialAssetRecord,
  CommercialCalendarConfigRecord,
  CommercialCalendarReconciliationItem,
  CommercialLeadRecord,
  CommercialLeadStatus,
  CommercialTemplateChannel,
  CommercialTemplateRecord,
  CommercialTemplateVersionRecord,
  CommercialTemplateVersionStatus,
  ContractStatus,
  DispatchCommercialCommunicationInput,
  PaymentStatus,
} from './types';

export function mapAssetRow(row: any): CommercialAssetRecord {
  return {
    id: row.id,
    leadId: row.lead_id,
    stage: row.stage as CommercialLeadStatus,
    assetType: row.asset_type,
    storageProvider: row.storage_provider,
    storageRef: row.storage_ref || undefined,
    url: row.url,
    version: Number(row.version || 1),
    checksum: row.checksum || undefined,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
  };
}

export function mapCalendarConfigRow(row: any): CommercialCalendarConfigRecord {
  return {
    id: row.id,
    responsavelKey: row.responsavel_key,
    calendarId: row.calendar_id,
    bookingUrl: row.booking_url,
    ownerEmail: row.owner_email,
    timezone: row.timezone || 'America/Sao_Paulo',
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCalendarReconciliationRow(row: any): CommercialCalendarReconciliationItem {
  return {
    id: row.id,
    calendarConfigId: row.calendar_config_id,
    googleEventId: row.google_event_id,
    attendeeEmail: row.attendee_email || undefined,
    eventStart: row.event_start || undefined,
    eventEnd: row.event_end || undefined,
    payload: row.payload_json || undefined,
    reasonCode: row.reason_code,
    status: row.status,
    leadId: row.lead_id || undefined,
    resolvedBy: row.resolved_by || undefined,
    resolvedAt: row.resolved_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTemplateRow(row: any): CommercialTemplateRecord {
  return {
    id: row.id,
    channel: row.channel as CommercialTemplateChannel,
    stage: row.stage as DispatchCommercialCommunicationInput['stage'],
    slug: row.slug,
    name: row.name,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTemplateVersionRow(row: any): CommercialTemplateVersionRecord {
  return {
    id: row.id,
    templateId: row.template_id,
    version: Number(row.version || 1),
    content: (row.content_json || {}) as Record<string, unknown>,
    status: row.status as CommercialTemplateVersionStatus,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
  };
}

export function mapCommercialLeadRow(row: any): CommercialLeadRecord {
  return {
    leadId: row.lead_id,
    dataEntrada: row.data_entrada,
    origem: row.origem,
    nomeEscritorio: row.nome_escritorio,
    nomeContato: row.nome_contato || undefined,
    instagram: row.instagram || undefined,
    whatsapp: row.whatsapp || undefined,
    email: row.email || undefined,
    cidade: row.cidade || undefined,
    areaPrincipal: row.area_principal || undefined,
    qtdAdvogados: row.qtd_advogados != null ? Number(row.qtd_advogados) : undefined,
    faturamentoEstimado: row.faturamento_estimado != null ? Number(row.faturamento_estimado) : undefined,
    orcamentoMarketing: row.orcamento_marketing != null ? Number(row.orcamento_marketing) : undefined,
    timezone: row.timezone || 'America/Sao_Paulo',
    valProposta: row.val_proposta != null ? Number(row.val_proposta) : undefined,
    calEventId: row.cal_event_id || undefined,
    dataDiagnostico: row.data_diagnostico || undefined,
    urlProposta: row.url_proposta || undefined,
    scoreQualificacao: row.score_qualificacao != null ? Number(row.score_qualificacao) : undefined,
    qualificationTier: row.qualification_tier || undefined,
    qualificationReasons: row.qualification_reasons_json || undefined,
    qualificationUpdatedAt: row.qualification_updated_at || undefined,
    lastSchedulingInviteAt: row.last_scheduling_invite_at || undefined,
    lastSchedulingInviteChannels: Array.isArray(row.last_scheduling_invite_channels_json)
      ? row.last_scheduling_invite_channels_json
      : undefined,
    scheduledFrom: row.scheduled_from || undefined,
    calEventUrl: row.cal_event_url || undefined,
    calMeetUrl: row.cal_meet_url || undefined,
    calOrganizerEmail: row.cal_organizer_email || undefined,
    calSyncedAt: row.cal_synced_at || undefined,
    folderUrl: row.drive_folder_url || undefined,
    missingRequirements: [],
    statusAtual: row.status_atual,
    responsavel: row.responsavel,
    proximaAcao: row.proxima_acao || undefined,
    dataProximaAcao: row.data_proxima_acao || undefined,
    motivoNutricao: row.motivo_nutricao || undefined,
    motivoPerda: row.motivo_perda || undefined,
    dor01Ok: row.dor01_ok,
    dor02Ok: row.dor02_ok,
    dor03Ok: row.dor03_ok,
    formToken: row.form_token || undefined,
    formType: row.form_type || undefined,
    formSubmittedAt: row.form_submitted_at || undefined,
    formPayloadJson: row.form_payload_json || undefined,
    contractStatus: (row.contract_status || 'pendente') as ContractStatus,
    paymentStatus: (row.payment_status || 'pendente') as PaymentStatus,
    followupD2At: row.followup_d2_at || undefined,
    followupD5At: row.followup_d5_at || undefined,
    onboardingD0Ok: Boolean(row.onboarding_d0_ok),
    onboardingD1Ok: Boolean(row.onboarding_d1_ok),
    onboardingD2Ok: Boolean(row.onboarding_d2_ok),
    onboardingD3D4Ok: Boolean(row.onboarding_d3_d4_ok),
    onboardingD5D7Ok: Boolean(row.onboarding_d5_d7_ok),
    consentGiven: Boolean(row.consent_given),
    consentGivenAt: row.consent_given_at || undefined,
    retentionUntil: row.retention_until || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
