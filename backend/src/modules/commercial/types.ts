import type { LeadQualificationTier } from '../../services/lead-qualification-service';

export type CommercialLeadStatus =
  | 'novo_lead'
  | 'primeiro_contato'
  | 'diagnostico_agendado'
  | 'diagnostico_concluido'
  | 'proposta_enviada'
  | 'negociacao'
  | 'fechado'
  | 'nutricao'
  | 'perdido';

export type CommercialAreaPrincipal = 'trabalhista' | 'aereo' | 'salario_maternidade' | 'previdenciario' | 'outro';

export interface CreateCommercialLeadInput {
  origem: 'instagram' | 'indicacao' | 'site' | 'whatsapp' | 'outro';
  nomeEscritorio: string;
  responsavel: string;
  nomeContato?: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  areaPrincipal?: CommercialAreaPrincipal;
  qtdAdvogados?: number;
  faturamentoEstimado?: number;
  orcamentoMarketing?: number;
  timezone?: string;
  proximaAcao?: string;
  dataProximaAcao?: string;
}

export interface UpdateCommercialLeadInput {
  nomeContato?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  cidade?: string;
  areaPrincipal?: CommercialAreaPrincipal;
  timezone?: string;
  qtdAdvogados?: number;
  valProposta?: number;
  urlProposta?: string;
  faturamentoEstimado?: number;
  orcamentoMarketing?: number;
  scoreQualificacao?: number;
  folderUrl?: string;
  proximaAcao?: string;
  dataProximaAcao?: string;
}

export interface MoveLeadStatusInput {
  to: CommercialLeadStatus;
  observacao?: string;
  actor?: string;
  actorRole?: 'admin' | 'manager' | 'analyst' | string;
  dor01Ok?: boolean;
  dor02Ok?: boolean;
  dor03Ok?: boolean;
  motivoNutricao?: string;
  motivoPerda?: string;
  dataProximaAcao?: string;
  waiveRequirements?: string[];
  waiveReason?: string;
}

export interface SubmitCommercialFormInput {
  formType: CommercialFormType;
  payload: Record<string, unknown>;
  submittedAt?: string;
}

export type ContractStatus = 'pendente' | 'assinado';
export type PaymentStatus = 'pendente' | 'pago';

export interface UpdateCommercialLeadProofsInput {
  contractStatus?: ContractStatus;
  paymentStatus?: PaymentStatus;
  observacao?: string;
}

export interface UpdateCommercialLeadOnboardingInput {
  d0Ok?: boolean;
  d1Ok?: boolean;
  d2Ok?: boolean;
  d3D4Ok?: boolean;
  d5D7Ok?: boolean;
  observacao?: string;
}

export interface UpdateCommercialLeadPrivacyInput {
  consentGiven?: boolean;
  retentionUntil?: string;
  observacao?: string;
}

export interface IngestCommercialIntegrationEventInput {
  leadId: string;
  channel: 'whatsapp' | 'gmail' | 'calendar' | 'zapsign' | 'custom';
  eventType: string;
  payload?: Record<string, unknown>;
  externalEventId?: string;
  occurredAt?: string;
}

export interface DispatchCommercialCommunicationInput {
  leadId: string;
  channel: 'whatsapp' | 'gmail';
  stage: 'primeiro_contato' | 'diagnostico_agendado' | 'proposta_enviada' | 'negociacao' | 'fechado';
  templateKey?: string;
  recipient?: string;
  variables?: Record<string, unknown>;
}

export interface CommercialScheduleSlot {
  start: string;
  end: string;
  label?: string;
}

export interface RequestCommercialScheduleSlotsInput {
  leadId: string;
  date?: string;
  durationMin?: number;
  timezone?: string;
}

export interface ConfirmCommercialScheduleInput {
  leadId: string;
  slotStart: string;
  slotEnd: string;
  attendeeName?: string;
  attendeeEmail?: string;
  timezone?: string;
  scheduledFrom?: 'quick_suggestion_1' | 'quick_suggestion_2' | 'calendar' | 'google_booking';
}

export interface UpdateCommercialScheduleInput {
  leadId: string;
  eventId?: string;
  slotStart: string;
  slotEnd: string;
  attendeeName?: string;
  attendeeEmail?: string;
  timezone?: string;
}

export interface CancelCommercialScheduleInput {
  leadId: string;
  eventId?: string;
  reason?: string;
  cancelledBy?: string;
}

export type CommercialRequirementType = 'field' | 'file' | 'event' | 'boolean';
export type CommercialRequirementStatus = 'pending' | 'done' | 'waived';

export interface CommercialStageRequirementRecord {
  id: string;
  stage: CommercialLeadStatus;
  requirementKey: string;
  requirementType: CommercialRequirementType;
  config?: Record<string, unknown>;
  isRequired: boolean;
  profileKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialLeadRequirementRecord {
  leadId: string;
  requirementId: string;
  requirementKey: string;
  status: CommercialRequirementStatus;
  evidence?: Record<string, unknown>;
  verifiedBy?: string;
  verifiedAt?: string;
  updatedAt: string;
}

export interface CommercialRequirementEvaluation {
  requirementId: string;
  requirementKey: string;
  stage: CommercialLeadStatus;
  required: boolean;
  status: CommercialRequirementStatus;
  source: 'system' | 'manual';
  satisfied: boolean;
  type: CommercialRequirementType;
  reason?: string;
  evidence?: Record<string, unknown>;
}

export interface UpsertCommercialLeadRequirementsInput {
  updates: Array<{
    stage?: CommercialLeadStatus;
    requirementKey: string;
    status: CommercialRequirementStatus;
    evidence?: Record<string, unknown>;
  }>;
  actor?: string;
}

export interface CommercialAssetRecord {
  id: string;
  leadId: string;
  stage: CommercialLeadStatus;
  assetType: string;
  storageProvider: string;
  storageRef?: string;
  url: string;
  version: number;
  checksum?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CreateCommercialAssetInput {
  stage: CommercialLeadStatus;
  assetType: string;
  url: string;
  storageProvider?: string;
  storageRef?: string;
  version?: number;
  checksum?: string;
  createdBy?: string;
}

export type CommercialTemplateChannel = 'whatsapp' | 'gmail';
export type CommercialTemplateVersionStatus = 'draft' | 'published' | 'archived';

export interface CommercialTemplateRecord {
  id: string;
  channel: CommercialTemplateChannel;
  stage: DispatchCommercialCommunicationInput['stage'];
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialTemplateVersionRecord {
  id: string;
  templateId: string;
  version: number;
  content: Record<string, unknown>;
  status: CommercialTemplateVersionStatus;
  createdBy?: string;
  createdAt: string;
}

export interface CommercialTemplateBindingRecord {
  id: string;
  stage: DispatchCommercialCommunicationInput['stage'];
  channel: CommercialTemplateChannel;
  profileKey?: string;
  templateVersionId: string;
  isDefault: boolean;
}

export interface CreateCommercialTemplateInput {
  channel: CommercialTemplateChannel;
  stage: DispatchCommercialCommunicationInput['stage'];
  slug: string;
  name: string;
  content: Record<string, unknown>;
  status?: CommercialTemplateVersionStatus;
  createdBy?: string;
  profileKey?: string;
  bindAsDefault?: boolean;
}

export interface UpdateCommercialTemplateInput {
  name?: string;
  isActive?: boolean;
  content?: Record<string, unknown>;
  status?: CommercialTemplateVersionStatus;
  createdBy?: string;
}

export interface PublishCommercialTemplateInput {
  versionId?: string;
  profileKey?: string;
  channel?: CommercialTemplateChannel;
  stage?: DispatchCommercialCommunicationInput['stage'];
}

export interface CommercialSchedulingLink {
  leadId: string;
  token: string;
  expiresAt: string;
  url: string;
}

export interface CreateCommercialSchedulingLinkInput {
  expiresInDays?: number;
}

export interface CreateCommercialSchedulingInviteInput {
  daysWindow?: number;
  durationMin?: number;
  timezone?: string;
}

export type WhatsAppSchedulingReplyIntent =
  | 'confirm_option_1'
  | 'confirm_option_2'
  | 'open_calendar'
  | 'unknown';

export interface ProcessWhatsAppSchedulingReplyInput {
  providerMessageId?: string;
  from?: string;
  text?: string;
  buttonPayload?: string;
  quotedMessageId?: string;
  timestamp?: string;
  raw?: Record<string, unknown>;
}

export interface ProcessWhatsAppSchedulingReplyResult {
  ok: true;
  status: 'processed' | 'ignored' | 'duplicate';
  reasonCode?: string;
  leadId?: string;
  inviteId?: string;
  intent?: WhatsAppSchedulingReplyIntent;
}

export interface PublicCommercialQuickConfirmInput {
  leadId: string;
  quickToken: string;
}

export interface CommercialSchedulingSuggestedSlot {
  slotStart: string;
  slotEnd: string;
  label: string;
  quickToken?: string;
  quickLink?: string;
}

export type CommercialSchedulingInviteProvider = 'google_booking' | 'hub_public';
export type CommercialWhatsAppSchedulingMode = 'buttons_3' | 'text_reply';

export interface CommercialSchedulingInvite {
  inviteId: string;
  leadId: string;
  calendarUrl: string;
  bookingUrl?: string;
  provider?: CommercialSchedulingInviteProvider;
  interactiveMode?: 'buttons_3';
  whatsappMode?: CommercialWhatsAppSchedulingMode;
  interactiveAttempted?: boolean;
  suggestedSlots: CommercialSchedulingSuggestedSlot[];
  channelsSent: Array<'whatsapp' | 'gmail'>;
  channelErrors?: Array<{ channel: 'whatsapp' | 'gmail'; message: string }>;
  sentAt: string;
  expiresAt: string;
}

export interface PublicCommercialSchedulingInput {
  leadId: string;
  token: string;
  date?: string;
  durationMin?: number;
  timezone?: string;
}

export interface PublicCommercialConfirmScheduleInput {
  leadId: string;
  token: string;
  slotStart: string;
  slotEnd: string;
  attendeeName?: string;
  attendeeEmail?: string;
  timezone?: string;
}

export interface PublicCommercialUpdateScheduleInput extends PublicCommercialConfirmScheduleInput {
  eventId?: string;
}

export interface PublicCommercialCancelScheduleInput {
  leadId: string;
  token: string;
  eventId?: string;
  reason?: string;
  cancelledBy?: string;
}

export interface CommercialCalendarConfigRecord {
  id: string;
  responsavelKey: string;
  calendarId: string;
  bookingUrl: string;
  ownerEmail: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertCommercialCalendarConfigInput {
  responsavelKey: string;
  calendarId: string;
  bookingUrl: string;
  ownerEmail: string;
  timezone?: string;
  isActive?: boolean;
}

export interface CommercialCalendarReconciliationItem {
  id: string;
  calendarConfigId: string;
  googleEventId: string;
  attendeeEmail?: string;
  eventStart?: string;
  eventEnd?: string;
  payload?: Record<string, unknown>;
  reasonCode: string;
  status: 'pending' | 'resolved' | 'ignored';
  leadId?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolveCommercialCalendarReconciliationInput {
  status: 'resolved' | 'ignored';
  leadId?: string;
  resolvedBy?: string;
}

export interface SyncGoogleBookingEventsResult {
  checkedCalendars: number;
  processedEvents: number;
  linkedLeads: number;
  queued: number;
}

export interface CommercialDashboard {
  total: number;
  novos: number;
  diagnosticos: number;
  propostas: number;
  fechados: number;
  rangeDays?: number;
}

export interface CommercialSlaAlert {
  leadId: string;
  nomeEscritorio: string;
  statusAtual: CommercialLeadStatus;
  responsavel: string;
  updatedAt: string;
  hoursInStatus: number;
}

export interface CommercialDailySummary {
  date: string;
  novosLeads: number;
  leadsAtrasadosSla24h: number;
  propostasSemFollowup: number;
  negociacoesAbertas: number;
  fechadosHoje: number;
}

export interface CommercialLeadTimelineEvent {
  id: string;
  leadId: string;
  statusOrigem: string;
  statusDestino: string;
  actor?: string;
  observacao?: string;
  createdAt: string;
}

export interface CommercialFormLink {
  leadId: string;
  formType: CommercialFormType;
  formToken: string;
  url: string;
}

export interface CommercialFollowupDue {
  leadId: string;
  nomeEscritorio: string;
  responsavel: string;
  statusAtual: CommercialLeadStatus;
  followupType: 'D+2' | 'D+5';
  dueAt: string;
}

export interface TriggerFollowupDispatchInput {
  leadId: string;
  followupType: 'D+2' | 'D+5';
  channel?: 'whatsapp' | 'gmail';
}

export interface CommercialRetentionAlert {
  leadId: string;
  nomeEscritorio: string;
  responsavel: string;
  retentionUntil: string;
  daysOverdue: number;
}

export interface CommercialIntegrationEvent {
  id: string;
  leadId: string;
  channel: string;
  eventType: string;
  externalEventId?: string;
  payload?: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

export interface CommercialDispatchHealthByChannel {
  channel: string;
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

export interface CommercialDispatchHealthSummary {
  windowDays: number;
  total: number;
  success: number;
  failed: number;
  successRate: number;
  byChannel: CommercialDispatchHealthByChannel[];
}

export type CommercialFormType = 'briefing' | 'onboarding' | 'custom';

export interface CommercialLeadRecord {
  leadId: string;
  dataEntrada: string;
  origem: string;
  nomeEscritorio: string;
  nomeContato?: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  areaPrincipal?: string;
  qtdAdvogados?: number;
  faturamentoEstimado?: number;
  orcamentoMarketing?: number;
  timezone?: string;
  valProposta?: number;
  calEventId?: string;
  dataDiagnostico?: string;
  urlProposta?: string;
  scoreQualificacao?: number;
  qualificationTier?: LeadQualificationTier;
  qualificationReasons?: Record<string, unknown>;
  qualificationUpdatedAt?: string;
  lastSchedulingInviteAt?: string;
  lastSchedulingInviteChannels?: string[];
  scheduledFrom?: 'quick_suggestion_1' | 'quick_suggestion_2' | 'calendar' | 'google_booking';
  calEventUrl?: string;
  calMeetUrl?: string;
  calOrganizerEmail?: string;
  calSyncedAt?: string;
  missingRequirements?: string[];
  folderUrl?: string;
  statusAtual: CommercialLeadStatus;
  responsavel: string;
  proximaAcao?: string;
  dataProximaAcao?: string;
  motivoNutricao?: string;
  motivoPerda?: string;
  dor01Ok: boolean;
  dor02Ok: boolean;
  dor03Ok: boolean;
  formToken?: string;
  formType?: CommercialFormType;
  formSubmittedAt?: string;
  formPayloadJson?: Record<string, unknown>;
  contractStatus: ContractStatus;
  paymentStatus: PaymentStatus;
  followupD2At?: string;
  followupD5At?: string;
  onboardingD0Ok: boolean;
  onboardingD1Ok: boolean;
  onboardingD2Ok: boolean;
  onboardingD3D4Ok: boolean;
  onboardingD5D7Ok: boolean;
  consentGiven: boolean;
  consentGivenAt?: string;
  retentionUntil?: string;
  createdAt: string;
  updatedAt: string;
}
