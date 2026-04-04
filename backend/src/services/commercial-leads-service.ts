import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { createAuditLog } from '../middleware/audit';
import { EvolutionApiService } from './evolution-api-service';
import { GoogleApiService } from './google-api-service';
import { LeadQualificationService, LeadQualificationTier } from './lead-qualification-service';

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

const isRequirementGatesEnabled = () => process.env.COMMERCIAL_REQUIREMENT_GATES_ENABLED === 'true';
const isPublicSchedulingEnabled = () => process.env.COMMERCIAL_PUBLIC_SCHEDULING_ENABLED === 'true';
const isQualificationScoreEnabled = () => process.env.COMMERCIAL_QUALIFICATION_SCORE_ENABLED === 'true';
const isHybridSchedulingInviteEnabled = () => process.env.COMMERCIAL_SCHEDULING_INVITE_HYBRID_ENABLED === 'true';
const isQuickSchedulingConfirmEnabled = () => process.env.COMMERCIAL_SCHEDULING_QUICK_CONFIRM_ENABLED === 'true';
const isTemplateStrictModeEnabled = () => process.env.COMMERCIAL_TEMPLATE_STRICT_MODE_ENABLED === 'true';
const isGoogleBookingEnabled = () => process.env.COMMERCIAL_GOOGLE_BOOKING_ENABLED === 'true';
const isGoogleBookingSyncEnabled = () => process.env.COMMERCIAL_GOOGLE_BOOKING_SYNC_ENABLED === 'true';
const isGoogleBookingFallbackToPublicEnabled = () =>
  process.env.COMMERCIAL_GOOGLE_BOOKING_FALLBACK_TO_PUBLIC_ENABLED !== 'false';
const isWhatsAppInteractiveSchedulingEnabled = () =>
  process.env.COMMERCIAL_WHATSAPP_INTERACTIVE_SCHEDULING_ENABLED === 'true';
const isWhatsAppReplyAutoConfirmEnabled = () =>
  process.env.COMMERCIAL_WHATSAPP_REPLY_AUTOCONFIRM_ENABLED === 'true';
const isWhatsAppInteractiveFallbackTextEnabled = () =>
  process.env.COMMERCIAL_WHATSAPP_INTERACTIVE_FALLBACK_TEXT_ENABLED !== 'false';

const DEFAULT_DISPATCH_TEMPLATE_BY_CHANNEL_AND_STAGE: Record<
  DispatchCommercialCommunicationInput['channel'],
  Record<DispatchCommercialCommunicationInput['stage'], string>
> = {
  whatsapp: {
    primeiro_contato: 'wa_lead_qualificado_v1',
    diagnostico_agendado: 'wa_briefing_recebido_agendamento_link_v1',
    proposta_enviada: 'wa_proposta_enviada_followup_v1',
    negociacao: 'wa_negociacao_alinhamento_v1',
    fechado: 'wa_fechado_boas_vindas_v1',
  },
  gmail: {
    primeiro_contato: 'gm_boas_vindas_comercial_v1',
    diagnostico_agendado: 'gm_briefing_recebido_agendamento_link_v1',
    proposta_enviada: 'gm_envio_proposta_v1',
    negociacao: 'gm_negociacao_alinhamento_v1',
    fechado: 'gm_confirmacao_fechamento_v1',
  },
};

function resolveTemplateByStage(
  channel: DispatchCommercialCommunicationInput['channel'],
  stage: DispatchCommercialCommunicationInput['stage'],
): string {
  const raw = process.env.COMMERCIAL_DISPATCH_TEMPLATE_MAP_JSON;
  if (!raw) return DEFAULT_DISPATCH_TEMPLATE_BY_CHANNEL_AND_STAGE[channel][stage];

  try {
    const parsed = JSON.parse(raw) as (
      Partial<Record<DispatchCommercialCommunicationInput['stage'], string>>
      & Partial<Record<DispatchCommercialCommunicationInput['channel'], Partial<Record<DispatchCommercialCommunicationInput['stage'], string>>>>
    );

    const byChannel = parsed?.[channel]?.[stage]?.trim();
    if (byChannel) return byChannel;

    const flat = parsed?.[stage]?.trim();
    if (flat) return flat;
  } catch {
    // fallback silencioso para default
  }

  return DEFAULT_DISPATCH_TEMPLATE_BY_CHANNEL_AND_STAGE[channel][stage];
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

export class CommercialFlowError extends Error {
  constructor(
    public code: 'INVALID_TRANSITION' | 'DOR_BLOCKED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DUPLICATE_LEAD' | 'DELETE_GUARD',
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

const NURTURE_REASONS = [
  'Sem urgência no momento',
  'Aguardando decisão interna',
  'Aguardando retorno do sócio',
  'Momento financeiro inadequado',
  'Contato sem resposta temporária',
] as const;

const LOSS_REASONS = [
  'Sem orçamento',
  'Fechou com concorrente',
  'Sem fit de perfil',
  'Sem retorno após follow-up',
  'Projeto adiado/cancelado',
] as const;

const DEFAULT_STAGE_REQUIREMENTS: Array<{
  stage: CommercialLeadStatus;
  requirementKey: string;
  requirementType: CommercialRequirementType;
  config: Record<string, unknown>;
  isRequired: boolean;
  profileKey?: string;
}> = [
  {
    stage: 'primeiro_contato',
    requirementKey: 'lead.contact_available',
    requirementType: 'field',
    config: { mode: 'contact_any' },
    isRequired: true,
  },
  {
    stage: 'primeiro_contato',
    requirementKey: 'lead.pre_qualification',
    requirementType: 'boolean',
    config: { source: 'dor01_ok' },
    isRequired: true,
  },
  {
    stage: 'diagnostico_agendado',
    requirementKey: 'lead.meeting_confirmed',
    requirementType: 'event',
    config: { eventType: 'calendar:meeting_scheduled' },
    isRequired: true,
  },
  {
    stage: 'diagnostico_concluido',
    requirementKey: 'lead.diagnostic_summary',
    requirementType: 'field',
    config: { mode: 'observacao_min_length', min: 10 },
    isRequired: true,
  },
  {
    stage: 'proposta_enviada',
    requirementKey: 'lead.briefing_submitted',
    requirementType: 'field',
    config: { field: 'form_type', equals: 'briefing' },
    isRequired: true,
  },
  {
    stage: 'proposta_enviada',
    requirementKey: 'lead.lgpd_consent',
    requirementType: 'boolean',
    config: { source: 'consent_given' },
    isRequired: true,
  },
  {
    stage: 'proposta_enviada',
    requirementKey: 'lead.proposal_asset',
    requirementType: 'file',
    config: { assetType: 'proposal' },
    isRequired: true,
  },
  {
    stage: 'negociacao',
    requirementKey: 'lead.negotiation_history',
    requirementType: 'field',
    config: { mode: 'followup_any' },
    isRequired: true,
  },
  {
    stage: 'negociacao',
    requirementKey: 'lead.contract_sent',
    requirementType: 'file',
    config: { assetType: 'contract' },
    isRequired: true,
  },
  {
    stage: 'fechado',
    requirementKey: 'lead.contract_signed',
    requirementType: 'boolean',
    config: { source: 'contract_status', equals: 'assinado' },
    isRequired: true,
  },
  {
    stage: 'fechado',
    requirementKey: 'lead.payment_paid',
    requirementType: 'boolean',
    config: { source: 'payment_status', equals: 'pago' },
    isRequired: true,
  },
];

const DEFAULT_TEMPLATE_DEFINITIONS: Array<{
  channel: CommercialTemplateChannel;
  stage: DispatchCommercialCommunicationInput['stage'];
  slug: string;
  name: string;
  content: Record<string, unknown>;
  bindAsDefault?: boolean;
}> = [
  {
    channel: 'whatsapp',
    stage: 'primeiro_contato',
    slug: 'wa_lead_qualificado_v1',
    name: 'WhatsApp Primeiro Contato',
    content: { templateKey: 'wa_lead_qualificado_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_briefing_recebido_agendamento_link_v1',
    name: 'WhatsApp Briefing Recebido + Link Agenda',
    content: { templateKey: 'wa_briefing_recebido_agendamento_link_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_briefing_recebido_agendamento_google_sugestoes_v1',
    name: 'WhatsApp Briefing Recebido + Sugestões Google',
    content: { templateKey: 'wa_briefing_recebido_agendamento_google_sugestoes_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_briefing_recebido_agendamento_google_botoes_v1',
    name: 'WhatsApp Briefing Recebido + Botões 3 opções',
    content: { templateKey: 'wa_briefing_recebido_agendamento_google_botoes_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_agendamento_abrir_calendario_v1',
    name: 'WhatsApp Abrir Calendário',
    content: { templateKey: 'wa_agendamento_abrir_calendario_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_agendamento_confirmado_v1',
    name: 'WhatsApp Agendamento Confirmado',
    content: { templateKey: 'wa_agendamento_confirmado_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_agendamento_conflito_reoferta_v1',
    name: 'WhatsApp Agendamento Conflito/Reoferta',
    content: { templateKey: 'wa_agendamento_conflito_reoferta_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_agendamento_opcao_invalida_v1',
    name: 'WhatsApp Agendamento Opção Inválida',
    content: { templateKey: 'wa_agendamento_opcao_invalida_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_briefing_recebido_agendamento_v1',
    name: 'WhatsApp Briefing Recebido + Agendamento',
    content: { templateKey: 'wa_briefing_recebido_agendamento_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'whatsapp',
    stage: 'diagnostico_agendado',
    slug: 'wa_reuniao_agendada_lembrete_v1',
    name: 'WhatsApp Lembrete Reunião',
    content: { templateKey: 'wa_reuniao_agendada_lembrete_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'whatsapp',
    stage: 'proposta_enviada',
    slug: 'wa_proposta_enviada_followup_v1',
    name: 'WhatsApp Followup Proposta',
    content: { templateKey: 'wa_proposta_enviada_followup_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'whatsapp',
    stage: 'negociacao',
    slug: 'wa_negociacao_alinhamento_v1',
    name: 'WhatsApp Negociação',
    content: { templateKey: 'wa_negociacao_alinhamento_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'whatsapp',
    stage: 'fechado',
    slug: 'wa_fechado_boas_vindas_v1',
    name: 'WhatsApp Boas-vindas Fechado',
    content: { templateKey: 'wa_fechado_boas_vindas_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'gmail',
    stage: 'primeiro_contato',
    slug: 'gm_boas_vindas_comercial_v1',
    name: 'Gmail Primeiro Contato',
    content: { templateKey: 'gm_boas_vindas_comercial_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'gmail',
    stage: 'diagnostico_agendado',
    slug: 'gm_briefing_recebido_agendamento_link_v1',
    name: 'Gmail Briefing Recebido + Link Agenda',
    content: { templateKey: 'gm_briefing_recebido_agendamento_link_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'gmail',
    stage: 'diagnostico_agendado',
    slug: 'gm_briefing_recebido_agendamento_google_sugestoes_v1',
    name: 'Gmail Briefing Recebido + Sugestões Google',
    content: { templateKey: 'gm_briefing_recebido_agendamento_google_sugestoes_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'gmail',
    stage: 'diagnostico_agendado',
    slug: 'gm_briefing_recebido_agendamento_v1',
    name: 'Gmail Briefing Recebido + Agendamento',
    content: { templateKey: 'gm_briefing_recebido_agendamento_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'gmail',
    stage: 'diagnostico_agendado',
    slug: 'gm_reuniao_agendada_lembrete_v1',
    name: 'Gmail Lembrete Reunião',
    content: { templateKey: 'gm_reuniao_agendada_lembrete_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'gmail',
    stage: 'diagnostico_agendado',
    slug: 'gm_convite_reuniao_v1',
    name: 'Gmail Convite Reunião (Legado)',
    content: { templateKey: 'gm_convite_reuniao_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'gmail',
    stage: 'proposta_enviada',
    slug: 'gm_envio_proposta_v1',
    name: 'Gmail Envio Proposta',
    content: { templateKey: 'gm_envio_proposta_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'gmail',
    stage: 'proposta_enviada',
    slug: 'gm_proposta_enviada_followup_v1',
    name: 'Gmail Followup Proposta',
    content: { templateKey: 'gm_proposta_enviada_followup_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'gmail',
    stage: 'negociacao',
    slug: 'gm_negociacao_alinhamento_v1',
    name: 'Gmail Negociação Alinhamento',
    content: { templateKey: 'gm_negociacao_alinhamento_v1' },
    bindAsDefault: true,
  },
  {
    channel: 'gmail',
    stage: 'negociacao',
    slug: 'gm_contraproposta_v1',
    name: 'Gmail Contraproposta (Legado)',
    content: { templateKey: 'gm_contraproposta_v1' },
    bindAsDefault: false,
  },
  {
    channel: 'gmail',
    stage: 'fechado',
    slug: 'gm_confirmacao_fechamento_v1',
    name: 'Gmail Confirmação Fechamento',
    content: { templateKey: 'gm_confirmacao_fechamento_v1' },
    bindAsDefault: true,
  },
];

const allowedTransitions: Record<CommercialLeadStatus, CommercialLeadStatus[]> = {
  novo_lead: ['primeiro_contato'],
  primeiro_contato: ['diagnostico_agendado', 'nutricao', 'perdido'],
  diagnostico_agendado: ['diagnostico_concluido', 'nutricao', 'perdido'],
  diagnostico_concluido: ['proposta_enviada', 'nutricao', 'perdido'],
  proposta_enviada: ['negociacao', 'nutricao', 'perdido'],
  negociacao: ['fechado', 'nutricao', 'perdido'],
  fechado: [],
  nutricao: ['primeiro_contato'],
  perdido: [],
};

export function validateLeadTransition(from: CommercialLeadStatus, input: MoveLeadStatusInput): void {
  const { to } = input;

  if (!(allowedTransitions[from] || []).includes(to)) {
    throw new CommercialFlowError(
      'INVALID_TRANSITION',
      `Transição inválida: ${from} -> ${to}`,
    );
  }

  if (to === 'diagnostico_agendado' && !input.dor01Ok) {
    throw new CommercialFlowError('DOR_BLOCKED', 'DoR01 não foi cumprido.');
  }

  if (to === 'diagnostico_concluido' && (!input.observacao || input.observacao.trim().length < 10)) {
    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      'Conclusão do diagnóstico exige evidência (resumo com no mínimo 10 caracteres).',
    );
  }

  if (to === 'proposta_enviada' && !input.dor02Ok) {
    throw new CommercialFlowError('DOR_BLOCKED', 'DoR02 não foi cumprido.');
  }

  if (to === 'fechado' && !input.dor03Ok) {
    throw new CommercialFlowError('DOR_BLOCKED', 'DoR03 não foi cumprido.');
  }

  if (to === 'nutricao' && (!input.motivoNutricao || !input.dataProximaAcao)) {
    throw new CommercialFlowError('VALIDATION_ERROR', 'Nutrição exige motivo e data da próxima ação.');
  }

  if (to === 'nutricao' && input.motivoNutricao && !NURTURE_REASONS.includes(input.motivoNutricao as (typeof NURTURE_REASONS)[number])) {
    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      `Motivo de nutrição inválido. Use um destes: ${NURTURE_REASONS.join(' | ')}`,
    );
  }

  if (to === 'perdido' && !input.motivoPerda) {
    throw new CommercialFlowError('VALIDATION_ERROR', 'Perdido exige motivo da perda.');
  }

  if (to === 'perdido' && input.motivoPerda && !LOSS_REASONS.includes(input.motivoPerda as (typeof LOSS_REASONS)[number])) {
    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      `Motivo de perda inválido. Use um destes: ${LOSS_REASONS.join(' | ')}`,
    );
  }
}

export class CommercialLeadsService {
  private readonly qualification = new LeadQualificationService();

  constructor(
    private pool: Pool,
    private evolutionApi: EvolutionApiService,
    private googleApi: GoogleApiService,
  ) {}

  getFormLink(leadId: string, formType: CommercialFormType, formToken?: string): CommercialFormLink {
    const token = formToken || uuidv4();
    const baseUrl = process.env.HUB_FORMS_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
    const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return {
      leadId,
      formType,
      formToken: token,
      url: `${normalized}/forms/${formType}?token=${token}&leadId=${leadId}`,
    };
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS commercial_leads (
        lead_id UUID PRIMARY KEY,
        data_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        origem TEXT NOT NULL,
        nome_escritorio TEXT NOT NULL,
        instagram TEXT,
        whatsapp TEXT,
        email TEXT,
        nome_contato TEXT,
        cidade TEXT,
        area_principal TEXT,
        qtd_advogados INT,
        faturamento_estimado NUMERIC(12,2),
        orcamento_marketing NUMERIC(12,2),
        timezone TEXT DEFAULT 'America/Sao_Paulo',
        val_proposta NUMERIC(12,2),
        cal_event_id TEXT,
        data_diagnostico TIMESTAMPTZ,
        url_proposta TEXT,
        score_qualificacao SMALLINT,
        status_atual TEXT NOT NULL,
        responsavel TEXT NOT NULL,
        proxima_acao TEXT,
        data_proxima_acao TIMESTAMPTZ,
        motivo_nutricao TEXT,
        motivo_perda TEXT,
        dor01_ok BOOLEAN NOT NULL DEFAULT FALSE,
        dor02_ok BOOLEAN NOT NULL DEFAULT FALSE,
        dor03_ok BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_lead_transitions (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        status_origem TEXT NOT NULL,
        status_destino TEXT NOT NULL,
        actor TEXT,
        observacao TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_integration_events (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        channel TEXT NOT NULL,
        event_type TEXT NOT NULL,
        external_event_id TEXT,
        payload_json JSONB,
        occurred_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_stage_requirements (
        id UUID PRIMARY KEY,
        stage TEXT NOT NULL,
        requirement_key TEXT NOT NULL,
        requirement_type TEXT NOT NULL,
        config_json JSONB,
        is_required BOOLEAN NOT NULL DEFAULT TRUE,
        profile_key TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_lead_requirement_status (
        lead_id UUID NOT NULL,
        requirement_id UUID NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        evidence_json JSONB,
        verified_by TEXT,
        verified_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (lead_id, requirement_id)
      );

      CREATE TABLE IF NOT EXISTS commercial_assets (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        stage TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        storage_provider TEXT NOT NULL DEFAULT 'google_drive',
        storage_ref TEXT,
        url TEXT NOT NULL,
        version INT NOT NULL DEFAULT 1,
        checksum TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_templates (
        id UUID PRIMARY KEY,
        channel TEXT NOT NULL,
        stage TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_template_versions (
        id UUID PRIMARY KEY,
        template_id UUID NOT NULL,
        version INT NOT NULL,
        content_json JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_template_bindings (
        id UUID PRIMARY KEY,
        stage TEXT NOT NULL,
        channel TEXT NOT NULL,
        profile_key TEXT,
        template_version_id UUID NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_scheduling_tokens (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_scheduling_invites (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        token_hash TEXT NOT NULL,
        suggested_slots_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        expires_at TIMESTAMPTZ NOT NULL,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        whatsapp_dispatch_external_id TEXT
      );

      CREATE TABLE IF NOT EXISTS commercial_scheduling_quick_tokens (
        id UUID PRIMARY KEY,
        invite_id UUID NOT NULL,
        lead_id UUID NOT NULL,
        slot_start TIMESTAMPTZ NOT NULL,
        slot_end TIMESTAMPTZ NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_whatsapp_inbound_events (
        id UUID PRIMARY KEY,
        provider_message_id TEXT NOT NULL,
        from_phone TEXT,
        lead_id UUID,
        invite_id UUID,
        intent TEXT,
        status TEXT NOT NULL,
        reason_code TEXT,
        raw_payload_json JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS commercial_calendar_configs (
        id UUID PRIMARY KEY,
        responsavel_key TEXT NOT NULL UNIQUE,
        calendar_id TEXT NOT NULL,
        booking_url TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_calendar_sync_state (
        calendar_config_id UUID PRIMARY KEY,
        sync_token TEXT,
        last_synced_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS commercial_scheduling_reconciliation_queue (
        id UUID PRIMARY KEY,
        calendar_config_id UUID NOT NULL,
        google_event_id TEXT NOT NULL,
        attendee_email TEXT,
        event_start TIMESTAMPTZ,
        event_end TIMESTAMPTZ,
        payload_json JSONB,
        reason_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        lead_id UUID,
        resolved_by TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS nome_contato TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS qtd_advogados INT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS faturamento_estimado NUMERIC(12,2);
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS orcamento_marketing NUMERIC(12,2);
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS val_proposta NUMERIC(12,2);
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_event_id TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS data_diagnostico TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS url_proposta TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS score_qualificacao SMALLINT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_token TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_type TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_submitted_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS form_payload_json JSONB;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS contract_status TEXT NOT NULL DEFAULT 'pendente';
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendente';
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS followup_d2_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS followup_d5_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d0_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d1_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d2_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d3_d4_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS onboarding_d5_d7_ok BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS retention_until TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS qualification_tier TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS qualification_reasons_json JSONB;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS qualification_updated_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS last_scheduling_invite_at TIMESTAMPTZ;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS last_scheduling_invite_channels_json JSONB;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS scheduled_from TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_event_url TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_meet_url TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_organizer_email TEXT;
      ALTER TABLE commercial_leads ADD COLUMN IF NOT EXISTS cal_synced_at TIMESTAMPTZ;
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'hub_public';
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS booking_url TEXT;
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS redirect_token_hash TEXT;
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS redirect_clicked_at TIMESTAMPTZ;
      ALTER TABLE commercial_scheduling_invites ADD COLUMN IF NOT EXISTS whatsapp_dispatch_external_id TEXT;

      CREATE INDEX IF NOT EXISTS idx_commercial_leads_status ON commercial_leads(status_atual);
      CREATE INDEX IF NOT EXISTS idx_commercial_leads_responsavel ON commercial_leads(responsavel);
      CREATE INDEX IF NOT EXISTS idx_commercial_leads_form_type ON commercial_leads(form_type);
      CREATE INDEX IF NOT EXISTS idx_commercial_transitions_lead ON commercial_lead_transitions(lead_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_integration_events_lead ON commercial_integration_events(lead_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_integration_events_channel ON commercial_integration_events(channel);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_stage_requirements_key
        ON commercial_stage_requirements(stage, requirement_key, COALESCE(profile_key, 'global'));
      CREATE INDEX IF NOT EXISTS idx_commercial_stage_requirements_stage
        ON commercial_stage_requirements(stage);
      CREATE INDEX IF NOT EXISTS idx_commercial_lead_requirement_status_lead
        ON commercial_lead_requirement_status(lead_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_assets_lead_stage
        ON commercial_assets(lead_id, stage);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_template_versions_template_version
        ON commercial_template_versions(template_id, version);
      CREATE INDEX IF NOT EXISTS idx_commercial_template_bindings_stage_channel
        ON commercial_template_bindings(stage, channel);
      CREATE INDEX IF NOT EXISTS idx_commercial_template_bindings_profile
        ON commercial_template_bindings(profile_key);
      CREATE INDEX IF NOT EXISTS idx_commercial_scheduling_tokens_lead
        ON commercial_scheduling_tokens(lead_id, expires_at);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_scheduling_tokens_hash
        ON commercial_scheduling_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_commercial_scheduling_invites_lead
        ON commercial_scheduling_invites(lead_id, created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_scheduling_invites_hash
        ON commercial_scheduling_invites(token_hash);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_scheduling_invites_redirect_hash
        ON commercial_scheduling_invites(redirect_token_hash)
        WHERE redirect_token_hash IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_commercial_scheduling_quick_tokens_lead
        ON commercial_scheduling_quick_tokens(lead_id, slot_start, expires_at);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_scheduling_quick_tokens_hash
        ON commercial_scheduling_quick_tokens(token_hash);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_commercial_whatsapp_inbound_provider_message
        ON commercial_whatsapp_inbound_events(provider_message_id);
      CREATE INDEX IF NOT EXISTS idx_commercial_whatsapp_inbound_from_phone
        ON commercial_whatsapp_inbound_events(from_phone, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_commercial_calendar_configs_responsavel
        ON commercial_calendar_configs(responsavel_key);
      CREATE INDEX IF NOT EXISTS idx_commercial_reconciliation_status
        ON commercial_scheduling_reconciliation_queue(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_commercial_reconciliation_event
        ON commercial_scheduling_reconciliation_queue(google_event_id, calendar_config_id);
    `);

    await this.seedStageRequirements();
    await this.seedDefaultTemplates();
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

      return this.attachComputedLeadFields(this.mapRow(result.rows[0]));
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
    const result = await this.pool.query(
      'SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
      [leadId],
    );

    if (!result.rows[0]) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const mapped = this.mapRow(result.rows[0]);
    return this.attachComputedLeadFields(mapped);
  }

  async listLeads(filters?: { status?: CommercialLeadStatus; responsavel?: string; limit?: number; offset?: number }): Promise<CommercialLeadRecord[]> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filters?.status) {
      params.push(filters.status);
      where.push(`status_atual = $${params.length}`);
    }

    if (filters?.responsavel) {
      params.push(filters.responsavel);
      where.push(`responsavel = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 200);
    const offset = Math.max(filters?.offset ?? 0, 0);

    params.push(limit);
    params.push(offset);

    const result = await this.pool.query(
      `SELECT * FROM commercial_leads ${whereSql} ORDER BY updated_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const leads = result.rows.map((row) => this.mapRow(row));
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
      templateKey = await this.resolveDispatchTemplateKey(input);
      if (!templateKey) {
        throw new CommercialFlowError('VALIDATION_ERROR', `templateKey não definido para a etapa ${input.stage}.`, {
          reasonCode: 'TEMPLATE_NOT_CONFIGURED',
          stage: input.stage,
          channel: input.channel,
        });
      }

      recipient = await this.resolveDispatchRecipient(input.leadId, input.channel, input.recipient);

      // Enrich template variables with lead's nome_contato if not explicitly provided
      const leadRow = await this.pool.query(
        'SELECT nome_contato, nome_escritorio FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
        [input.leadId],
      );
      const leadData = leadRow.rows[0];
      enrichedVariables = {
        nome: leadData?.nome_contato || leadData?.nome_escritorio || 'Doutor(a)',
        nomeEscritorio: leadData?.nome_escritorio,
        ...input.variables,
      };

      const providerResult = await this.sendDispatchToProvider({
        leadId: input.leadId,
        channel: input.channel,
        stage: input.stage,
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

  private async resolveDispatchRecipient(leadId: string, channel: 'whatsapp' | 'gmail', explicitRecipient?: string): Promise<string> {
    if (explicitRecipient?.trim()) return explicitRecipient.trim();

    const lead = await this.pool.query(
      'SELECT lead_id, whatsapp, email FROM commercial_leads WHERE lead_id = $1 LIMIT 1',
      [leadId],
    );

    const current = lead.rows[0];
    if (!current) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado para dispatch.');
    }

    if (channel === 'whatsapp' && current.whatsapp) {
      return String(current.whatsapp);
    }

    if (channel === 'gmail' && current.email) {
      return String(current.email);
    }

    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      `Recipient é obrigatório para dispatch via ${channel}. Cadastre o ${channel === 'gmail' ? 'e-mail' : 'WhatsApp'} do lead.`,
    );
  }

  private async sendDispatchToProvider(input: {
    leadId: string;
    channel: 'whatsapp' | 'gmail';
    stage: string;
    templateKey: string;
    recipient: string;
    variables: Record<string, unknown>;
  }): Promise<{ provider: string; externalEventId?: string; ack: Record<string, unknown> }> {
    if (input.channel === 'whatsapp') {
      const text = this.evolutionApi.resolveTemplate(input.templateKey, input.variables);
      const result = await this.evolutionApi.sendText(input.recipient, text);
      return {
        provider: 'evolution-api',
        externalEventId: result.messageId,
        ack: { messageId: result.messageId, text },
      };
    }

    if (input.channel === 'gmail') {
      const { subject, html } = this.googleApi.resolveGmailTemplate(input.templateKey, input.variables);
      const result = await this.googleApi.sendEmail(input.recipient, subject, html);
      return {
        provider: 'gmail-api',
        externalEventId: result.messageId,
        ack: { messageId: result.messageId, subject },
      };
    }

    throw new CommercialFlowError('VALIDATION_ERROR', `Canal de dispatch inválido: ${input.channel}`);
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
    const result = await this.pool.query(`
      WITH today AS (
        SELECT DATE_TRUNC('day', NOW()) AS start_day,
               DATE_TRUNC('day', NOW()) + INTERVAL '1 day' AS end_day
      )
      SELECT
        TO_CHAR(NOW(), 'YYYY-MM-DD') AS date,
        (SELECT COUNT(*)::int FROM commercial_leads c, today t
          WHERE c.data_entrada >= t.start_day AND c.data_entrada < t.end_day) AS novos_leads,
        (SELECT COUNT(*)::int FROM commercial_leads
          WHERE status_atual NOT IN ('fechado','perdido')
            AND updated_at <= NOW() - INTERVAL '24 hours') AS leads_atrasados_sla_24h,
        (SELECT COUNT(*)::int FROM commercial_leads
          WHERE status_atual = 'proposta_enviada'
            AND (followup_d2_at IS NULL OR followup_d5_at IS NULL)) AS propostas_sem_followup,
        (SELECT COUNT(*)::int FROM commercial_leads
          WHERE status_atual = 'negociacao') AS negociacoes_abertas,
        (SELECT COUNT(*)::int FROM commercial_leads c, today t
          WHERE c.status_atual = 'fechado'
            AND c.updated_at >= t.start_day AND c.updated_at < t.end_day) AS fechados_hoje
    `);

    const row = result.rows[0] || {};
    return {
      date: row.date || new Date().toISOString().slice(0, 10),
      novosLeads: Number(row.novos_leads || 0),
      leadsAtrasadosSla24h: Number(row.leads_atrasados_sla_24h || 0),
      propostasSemFollowup: Number(row.propostas_sem_followup || 0),
      negociacoesAbertas: Number(row.negociacoes_abertas || 0),
      fechadosHoje: Number(row.fechados_hoje || 0),
    };
  }

  async listIntegrationEvents(leadId: string, limit = 50): Promise<CommercialIntegrationEvent[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const result = await this.pool.query(
      `SELECT id, lead_id, channel, event_type, external_event_id, payload_json, occurred_at, created_at
       FROM commercial_integration_events
       WHERE lead_id = $1
       ORDER BY occurred_at DESC
       LIMIT $2`,
      [leadId, safeLimit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      channel: row.channel,
      eventType: row.event_type,
      externalEventId: row.external_event_id || undefined,
      payload: row.payload_json || undefined,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
    }));
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
      slots: this.applySchedulingPolicy(slots, tz),
    };
  }

  async confirmScheduledMeeting(input: ConfirmCommercialScheduleInput): Promise<{ ok: true; leadId: string; eventId?: string }> {
    const leadRow = await this.getLeadRow(input.leadId);
    if (!leadRow) {
      throw new CommercialFlowError('NOT_FOUND', 'Lead não encontrado.');
    }

    const tz = input.timezone ?? leadRow.timezone ?? await this.getLeadTimezone(input.leadId) ?? 'America/Sao_Paulo';
    this.assertSchedulingPolicyForSlot(input.slotStart, input.slotEnd, tz);
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
    this.assertSchedulingPolicyForSlot(input.slotStart, input.slotEnd, tz);

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
    const safeWindowDays = Math.min(Math.max(windowDays, 1), 90);

    const result = await this.pool.query(
      `WITH dispatch_events AS (
         SELECT
           channel,
           COALESCE((payload_json->'providerAck'->>'ok')::boolean, false) AS ack_ok,
           CASE WHEN external_event_id IS NOT NULL AND external_event_id <> '' THEN true ELSE false END AS has_external_id
         FROM commercial_integration_events
         WHERE event_type LIKE 'dispatch:%'
           AND occurred_at >= NOW() - ($1::text || ' days')::interval
       )
       SELECT
         channel,
         COUNT(*)::int AS total,
         SUM(CASE WHEN (ack_ok OR has_external_id) THEN 1 ELSE 0 END)::int AS success,
         SUM(CASE WHEN NOT (ack_ok OR has_external_id) THEN 1 ELSE 0 END)::int AS failed
       FROM dispatch_events
       GROUP BY channel
       ORDER BY channel ASC`,
      [safeWindowDays],
    );

    const byChannel: CommercialDispatchHealthByChannel[] = result.rows.map((row) => {
      const total = Number(row.total || 0);
      const success = Number(row.success || 0);
      const failed = Number(row.failed || 0);
      return {
        channel: String(row.channel || 'unknown'),
        total,
        success,
        failed,
        successRate: total > 0 ? Number(((success / total) * 100).toFixed(1)) : 0,
      };
    });

    const total = byChannel.reduce((acc, item) => acc + item.total, 0);
    const success = byChannel.reduce((acc, item) => acc + item.success, 0);
    const failed = byChannel.reduce((acc, item) => acc + item.failed, 0);

    return {
      windowDays: safeWindowDays,
      total,
      success,
      failed,
      successRate: total > 0 ? Number(((success / total) * 100).toFixed(1)) : 0,
      byChannel,
    };
  }

  async listLeadTimeline(leadId: string, limit = 50): Promise<CommercialLeadTimelineEvent[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const result = await this.pool.query(
      `SELECT id, lead_id, status_origem, status_destino, actor, observacao, created_at
       FROM commercial_lead_transitions
       WHERE lead_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [leadId, safeLimit],
    );

    return result.rows.map((row) => ({
      id: row.id,
      leadId: row.lead_id,
      statusOrigem: row.status_origem,
      statusDestino: row.status_destino,
      actor: row.actor || undefined,
      observacao: row.observacao || undefined,
      createdAt: row.created_at,
    }));
  }

  async listRetentionDue(limit = 50): Promise<CommercialRetentionAlert[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const result = await this.pool.query(
      `SELECT
         lead_id,
         nome_escritorio,
         responsavel,
         retention_until,
         ROUND(EXTRACT(EPOCH FROM (NOW() - retention_until)) / 86400.0, 1) AS days_overdue
       FROM commercial_leads
       WHERE retention_until IS NOT NULL
         AND retention_until <= NOW()
         AND status_atual NOT IN ('perdido')
       ORDER BY retention_until ASC
       LIMIT $1`,
      [safeLimit],
    );

    return result.rows.map((row) => ({
      leadId: row.lead_id,
      nomeEscritorio: row.nome_escritorio,
      responsavel: row.responsavel,
      retentionUntil: row.retention_until,
      daysOverdue: Number(row.days_overdue || 0),
    }));
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
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    const result = await this.pool.query(
      `(
        SELECT lead_id, nome_escritorio, responsavel, status_atual, 'D+2'::text AS followup_type, followup_d2_at AS due_at
        FROM commercial_leads
        WHERE status_atual IN ('proposta_enviada', 'negociacao')
          AND followup_d2_at IS NOT NULL
          AND followup_d2_at <= NOW()
      )
      UNION ALL
      (
        SELECT lead_id, nome_escritorio, responsavel, status_atual, 'D+5'::text AS followup_type, followup_d5_at AS due_at
        FROM commercial_leads
        WHERE status_atual IN ('proposta_enviada', 'negociacao')
          AND followup_d5_at IS NOT NULL
          AND followup_d5_at <= NOW()
      )
      ORDER BY due_at ASC
      LIMIT $1`,
      [safeLimit],
    );

    return result.rows.map((row) => ({
      leadId: row.lead_id,
      nomeEscritorio: row.nome_escritorio,
      responsavel: row.responsavel,
      statusAtual: row.status_atual as CommercialLeadStatus,
      followupType: row.followup_type as 'D+2' | 'D+5',
      dueAt: row.due_at,
    }));
  }

  async listSlaAlerts(maxAgeHours = 24, limit = 50): Promise<CommercialSlaAlert[]> {
    const safeMaxAge = Math.min(Math.max(maxAgeHours, 1), 168);
    const safeLimit = Math.min(Math.max(limit, 1), 200);

    const result = await this.pool.query(
      `SELECT
         lead_id,
         nome_escritorio,
         status_atual,
         responsavel,
         updated_at,
         ROUND(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600.0, 1) AS hours_in_status
       FROM commercial_leads
       WHERE status_atual NOT IN ('fechado', 'perdido')
         AND updated_at <= NOW() - ($1::text || ' hours')::interval
       ORDER BY updated_at ASC
       LIMIT $2`,
      [safeMaxAge, safeLimit],
    );

    return result.rows.map((row) => ({
      leadId: row.lead_id,
      nomeEscritorio: row.nome_escritorio,
      statusAtual: row.status_atual as CommercialLeadStatus,
      responsavel: row.responsavel,
      updatedAt: row.updated_at,
      hoursInStatus: Number(row.hours_in_status || 0),
    }));
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
    const params: unknown[] = [leadId];
    const where = ['lead_id = $1'];

    if (filters?.stage) {
      params.push(filters.stage);
      where.push(`stage = $${params.length}`);
    }

    if (filters?.assetType) {
      params.push(filters.assetType);
      where.push(`asset_type = $${params.length}`);
    }

    const result = await this.pool.query(
      `SELECT id, lead_id, stage, asset_type, storage_provider, storage_ref, url, version, checksum, created_by, created_at
       FROM commercial_assets
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC`,
      params,
    );

    return result.rows.map((row) => this.mapAssetRow(row));
  }

  async createLeadAsset(leadId: string, input: CreateCommercialAssetInput): Promise<CommercialAssetRecord> {
    await this.ensureLeadExists(leadId);

    if (!input.assetType?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'assetType é obrigatório.');
    }

    if (!input.url?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'url é obrigatório.');
    }

    const inserted = await this.pool.query(
      `INSERT INTO commercial_assets
        (id, lead_id, stage, asset_type, storage_provider, storage_ref, url, version, checksum, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, lead_id, stage, asset_type, storage_provider, storage_ref, url, version, checksum, created_by, created_at`,
      [
        uuidv4(),
        leadId,
        input.stage,
        input.assetType.trim(),
        input.storageProvider?.trim() || 'google_drive',
        input.storageRef?.trim() || null,
        input.url.trim(),
        input.version ?? 1,
        input.checksum?.trim() || null,
        input.createdBy || null,
      ],
    );

    return this.mapAssetRow(inserted.rows[0]);
  }

  async listCalendarConfigs(): Promise<CommercialCalendarConfigRecord[]> {
    const result = await this.pool.query(
      `SELECT id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at
       FROM commercial_calendar_configs
       ORDER BY responsavel_key ASC`,
    );

    return result.rows.map((row) => this.mapCalendarConfigRow(row));
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

    const inserted = await this.pool.query(
      `INSERT INTO commercial_calendar_configs
        (id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       RETURNING id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at`,
      [uuidv4(), responsavelKey, calendarId, bookingUrl, ownerEmail, timezone, input.isActive !== false],
    );

    return this.mapCalendarConfigRow(inserted.rows[0]);
  }

  async updateCalendarConfig(
    id: string,
    input: Partial<UpsertCommercialCalendarConfigInput>,
  ): Promise<CommercialCalendarConfigRecord> {
    const current = await this.pool.query(
      `SELECT id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active
       FROM commercial_calendar_configs
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    if (!current.rows[0]) {
      throw new CommercialFlowError('NOT_FOUND', 'Configuração de calendário não encontrada.');
    }

    const updated = await this.pool.query(
      `UPDATE commercial_calendar_configs
       SET responsavel_key = COALESCE($2, responsavel_key),
           calendar_id = COALESCE($3, calendar_id),
           booking_url = COALESCE($4, booking_url),
           owner_email = COALESCE($5, owner_email),
           timezone = COALESCE($6, timezone),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at`,
      [
        id,
        input.responsavelKey?.trim() || null,
        input.calendarId?.trim() || null,
        input.bookingUrl?.trim() || null,
        input.ownerEmail?.trim().toLowerCase() || null,
        input.timezone?.trim() || null,
        input.isActive ?? null,
      ],
    );

    return this.mapCalendarConfigRow(updated.rows[0]);
  }

  async listCalendarReconciliationQueue(filters?: {
    status?: 'pending' | 'resolved' | 'ignored';
    limit?: number;
  }): Promise<CommercialCalendarReconciliationItem[]> {
    const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 250);
    const params: unknown[] = [];
    const where: string[] = [];

    if (filters?.status) {
      params.push(filters.status);
      where.push(`status = $${params.length}`);
    }

    params.push(limit);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT id, calendar_config_id, google_event_id, attendee_email, event_start, event_end, payload_json,
              reason_code, status, lead_id, resolved_by, resolved_at, created_at, updated_at
       FROM commercial_scheduling_reconciliation_queue
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.mapCalendarReconciliationRow(row));
  }

  async resolveCalendarReconciliation(
    id: string,
    input: ResolveCommercialCalendarReconciliationInput,
  ): Promise<CommercialCalendarReconciliationItem> {
    const current = await this.pool.query(
      `SELECT id, payload_json
       FROM commercial_scheduling_reconciliation_queue
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    const row = current.rows[0];
    if (!row) {
      throw new CommercialFlowError('NOT_FOUND', 'Item de reconciliação não encontrado.');
    }

    if (input.status === 'resolved' && !input.leadId) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'leadId é obrigatório para resolver item.');
    }

    if (input.status === 'resolved' && input.leadId) {
      const payload = (row.payload_json || {}) as Record<string, unknown>;
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

    const updated = await this.pool.query(
      `UPDATE commercial_scheduling_reconciliation_queue
       SET status = $2,
           lead_id = COALESCE($3, lead_id),
           resolved_by = $4,
           resolved_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, calendar_config_id, google_event_id, attendee_email, event_start, event_end, payload_json,
                 reason_code, status, lead_id, resolved_by, resolved_at, created_at, updated_at`,
      [id, input.status, input.leadId || null, input.resolvedBy || null],
    );

    return this.mapCalendarReconciliationRow(updated.rows[0]);
  }

  async listTemplates(filters?: {
    channel?: CommercialTemplateChannel;
    stage?: DispatchCommercialCommunicationInput['stage'];
    isActive?: boolean;
  }) {
    const params: unknown[] = [];
    const where: string[] = [];

    if (filters?.channel) {
      params.push(filters.channel);
      where.push(`t.channel = $${params.length}`);
    }

    if (filters?.stage) {
      params.push(filters.stage);
      where.push(`t.stage = $${params.length}`);
    }

    if (filters?.isActive !== undefined) {
      params.push(filters.isActive);
      where.push(`t.is_active = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await this.pool.query(
      `SELECT
         t.id,
         t.channel,
         t.stage,
         t.slug,
         t.name,
         t.is_active,
         t.created_at,
         t.updated_at,
         v.id AS latest_version_id,
         v.version AS latest_version,
         v.status AS latest_status
       FROM commercial_templates t
       LEFT JOIN LATERAL (
         SELECT id, version, status
         FROM commercial_template_versions
         WHERE template_id = t.id
         ORDER BY version DESC
         LIMIT 1
       ) v ON true
       ${whereSql}
       ORDER BY t.updated_at DESC`,
      params,
    );

    return result.rows.map((row) => ({
      id: row.id,
      channel: row.channel,
      stage: row.stage,
      slug: row.slug,
      name: row.name,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      latestVersionId: row.latest_version_id || null,
      latestVersion: row.latest_version != null ? Number(row.latest_version) : null,
      latestStatus: row.latest_status || null,
    }));
  }

  async createTemplate(input: CreateCommercialTemplateInput) {
    if (!input.slug.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'slug é obrigatório.');
    }

    const templateId = uuidv4();
    const versionId = uuidv4();
    const versionStatus = input.status || 'draft';

    await this.pool.query(
      `INSERT INTO commercial_templates (id, channel, stage, slug, name, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,TRUE,NOW(),NOW())`,
      [templateId, input.channel, input.stage, input.slug.trim(), input.name.trim()],
    );

    await this.pool.query(
      `INSERT INTO commercial_template_versions (id, template_id, version, content_json, status, created_by, created_at)
       VALUES ($1,$2,1,$3::jsonb,$4,$5,NOW())`,
      [versionId, templateId, JSON.stringify(input.content || {}), versionStatus, input.createdBy || null],
    );

    if (versionStatus === 'published' || input.bindAsDefault) {
      await this.upsertTemplateBinding({
        stage: input.stage,
        channel: input.channel,
        profileKey: input.profileKey || null,
        templateVersionId: versionId,
        isDefault: true,
      });
    }

    return this.getTemplateWithVersions(templateId);
  }

  async updateTemplate(templateId: string, input: UpdateCommercialTemplateInput) {
    const current = await this.pool.query(
      `SELECT id, name, is_active, stage, channel
       FROM commercial_templates
       WHERE id = $1
       LIMIT 1`,
      [templateId],
    );

    const template = current.rows[0];
    if (!template) {
      throw new CommercialFlowError('NOT_FOUND', 'Template comercial não encontrado.');
    }

    if (input.name !== undefined || input.isActive !== undefined) {
      await this.pool.query(
        `UPDATE commercial_templates
         SET name = COALESCE($2, name),
             is_active = COALESCE($3, is_active),
             updated_at = NOW()
         WHERE id = $1`,
        [templateId, input.name?.trim() || null, input.isActive ?? null],
      );
    }

    if (input.content !== undefined) {
      const versionResult = await this.pool.query(
        `SELECT COALESCE(MAX(version), 0)::int AS version
         FROM commercial_template_versions
         WHERE template_id = $1`,
        [templateId],
      );
      const nextVersion = Number(versionResult.rows[0]?.version || 0) + 1;
      const versionId = uuidv4();
      const status = input.status || 'draft';

      await this.pool.query(
        `INSERT INTO commercial_template_versions (id, template_id, version, content_json, status, created_by, created_at)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,NOW())`,
        [versionId, templateId, nextVersion, JSON.stringify(input.content), status, input.createdBy || null],
      );

      if (status === 'published') {
        await this.publishTemplate(templateId, {
          versionId,
          stage: template.stage,
          channel: template.channel,
        });
      }
    }

    return this.getTemplateWithVersions(templateId);
  }

  async publishTemplate(templateId: string, input?: PublishCommercialTemplateInput) {
    const templateResult = await this.pool.query(
      `SELECT id, stage, channel
       FROM commercial_templates
       WHERE id = $1
       LIMIT 1`,
      [templateId],
    );

    const template = templateResult.rows[0];
    if (!template) {
      throw new CommercialFlowError('NOT_FOUND', 'Template comercial não encontrado.');
    }

    const versionResult = input?.versionId
      ? await this.pool.query(
          `SELECT id, version FROM commercial_template_versions WHERE id = $1 AND template_id = $2 LIMIT 1`,
          [input.versionId, templateId],
        )
      : await this.pool.query(
          `SELECT id, version
           FROM commercial_template_versions
           WHERE template_id = $1
           ORDER BY version DESC
           LIMIT 1`,
          [templateId],
        );

    const version = versionResult.rows[0];
    if (!version) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Template sem versões para publicar.');
    }

    await this.pool.query(
      `UPDATE commercial_template_versions
       SET status = CASE WHEN id = $2 THEN 'published' ELSE 'archived' END
       WHERE template_id = $1
         AND status IN ('published', 'archived', 'draft')`,
      [templateId, version.id],
    );

    await this.upsertTemplateBinding({
      stage: (input?.stage || template.stage) as DispatchCommercialCommunicationInput['stage'],
      channel: (input?.channel || template.channel) as CommercialTemplateChannel,
      profileKey: input?.profileKey || null,
      templateVersionId: version.id,
      isDefault: true,
    });

    return this.getTemplateWithVersions(templateId);
  }

  async createSchedulingLink(leadId: string, input?: CreateCommercialSchedulingLinkInput): Promise<CommercialSchedulingLink> {
    if (!isPublicSchedulingEnabled()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Agendamento público está desabilitado.');
    }

    await this.ensureLeadExists(leadId);

    const expiresInDays = Math.min(Math.max(input?.expiresInDays ?? 14, 1), 30);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const token = `${uuidv4()}${uuidv4()}`.replace(/-/g, '');
    const tokenHash = this.hashSchedulingToken(token);

    await this.pool.query(
      `INSERT INTO commercial_scheduling_tokens (id, lead_id, token_hash, expires_at, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [uuidv4(), leadId, tokenHash, expiresAt],
    );

    return {
      leadId,
      token,
      expiresAt,
      url: `${this.resolveFormsBaseUrl()}/forms/comercial/scheduling?token=${token}&leadId=${leadId}`,
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
          label: this.formatSchedulingSlotLabel(slot.start, timezone),
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
      const formsBaseUrl = this.resolveFormsBaseUrl();

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
          label: this.formatSchedulingSlotLabel(slot.start, timezone),
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
          this.hashSchedulingToken(schedulingLink.token),
          JSON.stringify(
            suggested.map((slot) => ({
              slotStart: slot.start,
              slotEnd: slot.end,
              label: this.formatSchedulingSlotLabel(slot.start, timezone),
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

    const fromPhone = this.normalizePhone(input.from);
    if (!fromPhone) {
      return { ok: true, status: 'ignored', reasonCode: 'MISSING_FROM_PHONE' };
    }

    const providerMessageId = (input.providerMessageId?.trim()
      || this.hashSchedulingToken(`${input.from || ''}|${input.timestamp || ''}|${JSON.stringify(input.raw || {})}`)).slice(0, 128);

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
    const intent = this.parseWhatsAppSchedulingIntent(input.buttonPayload, input.text);
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
      await this.sendWhatsAppTemplateMessage(invite.leadId, invite.whatsapp, 'wa_agendamento_opcao_invalida_v1', {
        nome: invite.nomeContato || invite.nomeEscritorio || 'Doutor(a)',
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

      await this.sendWhatsAppTemplateMessage(invite.leadId, invite.whatsapp, 'wa_agendamento_abrir_calendario_v1', {
        nome: invite.nomeContato || invite.nomeEscritorio || 'Doutor(a)',
        link_calendario: calendarUrl,
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
    const slotDate = this.formatDateForTimezone(new Date(slotStart), timezone);
    const availability = await this.requestScheduleSlots({
      leadId: invite.leadId,
      date: slotDate,
      durationMin,
      timezone,
    });

    const stillAvailable = availability.slots.some((slot) => slot.start === slotStart && slot.end === slotEnd);
    if (!stillAvailable) {
      const reoffer = await this.buildConflictReofferPayload(invite);
      await this.sendWhatsAppTemplateMessage(invite.leadId, invite.whatsapp, reoffer.templateKey, reoffer.variables);

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

    await this.sendWhatsAppTemplateMessage(invite.leadId, invite.whatsapp, 'wa_agendamento_confirmado_v1', {
      nome: invite.nomeContato || invite.nomeEscritorio || 'Doutor(a)',
      data_hora: this.formatSchedulingSlotLabel(slotStart, timezone),
      link_meet: refreshed?.cal_meet_url || refreshed?.cal_event_url || 'Link será enviado em seguida.',
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

    const tokenHash = this.hashSchedulingToken(input.token.trim());
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

    const configs = await this.pool.query(
      `SELECT id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active
       FROM commercial_calendar_configs
       WHERE is_active = TRUE
       ORDER BY responsavel_key ASC`,
    );

    let processedEvents = 0;
    let linkedLeads = 0;
    let queued = 0;

    for (const configRow of configs.rows) {
      const config = this.mapCalendarConfigRow(configRow);
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
      checkedCalendars: configs.rowCount || 0,
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
      calendarUrl: `${this.resolveFormsBaseUrl()}/forms/comercial/scheduling?token=${input.token}&leadId=${input.leadId}`,
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

    const quickTokenHash = this.hashSchedulingToken(input.quickToken.trim());
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
    const slotDate = this.formatDateForTimezone(new Date(slotStart), timezone);

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

    return this.attachComputedLeadFields(this.mapRow(updatedRow));
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

    return this.attachComputedLeadFields(this.mapRow(updated.rows[0]));
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
      const system = await this.evaluateRequirementSystem(leadId, lead, requirement);
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

  private async evaluateRequirementSystem(
    leadId: string,
    lead: any,
    requirement: any,
  ): Promise<{ satisfied: boolean; reason?: string; evidence?: Record<string, unknown> }> {
    const config = (requirement.config_json || {}) as Record<string, unknown>;
    const type = requirement.requirement_type as CommercialRequirementType;

    if (type === 'field') {
      const mode = String(config.mode || '').trim().toLowerCase();
      if (mode === 'contact_any') {
        const satisfied = Boolean(lead.whatsapp || lead.email);
        return {
          satisfied,
          reason: satisfied ? undefined : 'WhatsApp ou e-mail é obrigatório.',
          evidence: { whatsapp: Boolean(lead.whatsapp), email: Boolean(lead.email) },
        };
      }

      if (mode === 'observacao_min_length') {
        const min = Number(config.min || 10);
        const summary = await this.pool.query(
          `SELECT observacao
           FROM commercial_lead_transitions
           WHERE lead_id = $1
             AND status_destino = 'diagnostico_concluido'
             AND observacao IS NOT NULL
           ORDER BY created_at DESC
           LIMIT 1`,
          [leadId],
        );
        const text = String(summary.rows[0]?.observacao || '');
        const satisfied = text.trim().length >= min;
        return {
          satisfied,
          reason: satisfied ? undefined : `Resumo de diagnóstico exige mínimo de ${min} caracteres.`,
          evidence: { length: text.trim().length, min },
        };
      }

      if (mode === 'followup_any') {
        const satisfied = Boolean(lead.followup_d2_at || lead.followup_d5_at);
        return {
          satisfied,
          reason: satisfied ? undefined : 'Lead sem follow-up configurado.',
        };
      }

      const field = String(config.field || '').trim().toLowerCase();
      const equals = config.equals;
      if (field) {
        const current = lead[field];
        const satisfied = equals !== undefined ? String(current || '') === String(equals) : Boolean(current);
        return {
          satisfied,
          reason: satisfied ? undefined : `Campo obrigatório pendente: ${field}.`,
          evidence: { field, current },
        };
      }

      return { satisfied: false, reason: `Configuração inválida para requisito ${requirement.requirement_key}.` };
    }

    if (type === 'boolean') {
      const source = String(config.source || '').trim().toLowerCase();
      const equals = config.equals;
      const current = lead[source];
      const satisfied =
        equals !== undefined
          ? String(current ?? '').toLowerCase() === String(equals).toLowerCase()
          : Boolean(current);
      return {
        satisfied,
        reason: satisfied ? undefined : `Condição booleana pendente: ${source}.`,
        evidence: { source, current, equals: equals ?? true },
      };
    }

    if (type === 'file') {
      const assetType = String(config.assetType || '').trim();
      if (!assetType) {
        return { satisfied: false, reason: `assetType ausente em ${requirement.requirement_key}.` };
      }
      const assetResult = await this.pool.query(
        `SELECT id
         FROM commercial_assets
         WHERE lead_id = $1
           AND asset_type = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [leadId, assetType],
      );
      const satisfied = Boolean(assetResult.rows[0]);
      return {
        satisfied,
        reason: satisfied ? undefined : `Arquivo obrigatório ausente (${assetType}).`,
      };
    }

    if (type === 'event') {
      const eventType = String(config.eventType || '').trim();
      if (!eventType) {
        return { satisfied: false, reason: `eventType ausente em ${requirement.requirement_key}.` };
      }

      if (eventType === 'calendar:meeting_scheduled' && lead.cal_event_id) {
        return { satisfied: true };
      }

      const eventResult = await this.pool.query(
        `SELECT id
         FROM commercial_integration_events
         WHERE lead_id = $1
           AND event_type = $2
         ORDER BY occurred_at DESC
         LIMIT 1`,
        [leadId, eventType],
      );
      const satisfied = Boolean(eventResult.rows[0]);
      return {
        satisfied,
        reason: satisfied ? undefined : `Evento obrigatório ausente (${eventType}).`,
      };
    }

    return {
      satisfied: false,
      reason: `Tipo de requisito não suportado: ${type}`,
    };
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

  private async seedStageRequirements(): Promise<void> {
    for (const requirement of DEFAULT_STAGE_REQUIREMENTS) {
      await this.pool.query(
        `INSERT INTO commercial_stage_requirements
          (id, stage, requirement_key, requirement_type, config_json, is_required, profile_key, created_at, updated_at)
         SELECT $1,$2,$3,$4,$5::jsonb,$6,$7,NOW(),NOW()
         WHERE NOT EXISTS (
           SELECT 1
           FROM commercial_stage_requirements
           WHERE stage = $2
             AND requirement_key = $3
             AND COALESCE(profile_key, '') = COALESCE($7, '')
         )`,
        [
          uuidv4(),
          requirement.stage,
          requirement.requirementKey,
          requirement.requirementType,
          JSON.stringify(requirement.config || {}),
          requirement.isRequired,
          requirement.profileKey || null,
        ],
      );
    }
  }

  private async seedDefaultTemplates(): Promise<void> {
    for (const template of DEFAULT_TEMPLATE_DEFINITIONS) {
      const existing = await this.pool.query(
        `SELECT id
         FROM commercial_templates
         WHERE slug = $1
         LIMIT 1`,
        [template.slug],
      );

      let templateId = existing.rows[0]?.id as string | undefined;
      if (!templateId) {
        templateId = uuidv4();
        await this.pool.query(
          `INSERT INTO commercial_templates (id, channel, stage, slug, name, is_active, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,TRUE,NOW(),NOW())`,
          [templateId, template.channel, template.stage, template.slug, template.name],
        );
      }

      const version = await this.pool.query(
        `SELECT id
         FROM commercial_template_versions
         WHERE template_id = $1
           AND version = 1
         LIMIT 1`,
        [templateId],
      );

      let versionId = version.rows[0]?.id as string | undefined;
      if (!versionId) {
        versionId = uuidv4();
        await this.pool.query(
          `INSERT INTO commercial_template_versions (id, template_id, version, content_json, status, created_at)
           VALUES ($1,$2,1,$3::jsonb,'published',NOW())`,
          [versionId, templateId, JSON.stringify(template.content || {})],
        );
      }

      if (template.bindAsDefault !== false) {
        await this.upsertTemplateBinding({
          stage: template.stage,
          channel: template.channel,
          profileKey: null,
          templateVersionId: versionId,
          isDefault: true,
        });
      }
    }
  }

  private async getTemplateWithVersions(templateId: string) {
    const templateResult = await this.pool.query(
      `SELECT id, channel, stage, slug, name, is_active, created_at, updated_at
       FROM commercial_templates
       WHERE id = $1
       LIMIT 1`,
      [templateId],
    );

    if (!templateResult.rows[0]) {
      throw new CommercialFlowError('NOT_FOUND', 'Template comercial não encontrado.');
    }

    const versionsResult = await this.pool.query(
      `SELECT id, template_id, version, content_json, status, created_by, created_at
       FROM commercial_template_versions
       WHERE template_id = $1
       ORDER BY version DESC`,
      [templateId],
    );

    return {
      template: this.mapTemplateRow(templateResult.rows[0]),
      versions: versionsResult.rows.map((row) => this.mapTemplateVersionRow(row)),
    };
  }

  private async upsertTemplateBinding(input: {
    stage: DispatchCommercialCommunicationInput['stage'];
    channel: CommercialTemplateChannel;
    profileKey: string | null;
    templateVersionId: string;
    isDefault: boolean;
  }) {
    const existing = await this.pool.query(
      `SELECT id
       FROM commercial_template_bindings
       WHERE stage = $1
         AND channel = $2
         AND COALESCE(profile_key, '') = COALESCE($3, '')
       LIMIT 1`,
      [input.stage, input.channel, input.profileKey],
    );

    if (existing.rows[0]) {
      await this.pool.query(
        `UPDATE commercial_template_bindings
         SET template_version_id = $2,
             is_default = $3
         WHERE id = $1`,
        [existing.rows[0].id, input.templateVersionId, input.isDefault],
      );
      return;
    }

    await this.pool.query(
      `INSERT INTO commercial_template_bindings (id, stage, channel, profile_key, template_version_id, is_default, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [uuidv4(), input.stage, input.channel, input.profileKey, input.templateVersionId, input.isDefault],
    );
  }

  private async resolveDispatchTemplateKey(input: DispatchCommercialCommunicationInput): Promise<string> {
    if (input.templateKey?.trim()) {
      return input.templateKey.trim();
    }

    const binding = await this.pool.query(
      `SELECT t.slug
       FROM commercial_template_bindings b
       JOIN commercial_template_versions v ON v.id = b.template_version_id
       JOIN commercial_templates t ON t.id = v.template_id
       WHERE b.stage = $1
         AND b.channel = $2
         AND b.profile_key IS NULL
         AND t.is_active = TRUE
         AND v.status = 'published'
       ORDER BY b.is_default DESC, v.version DESC
       LIMIT 1`,
      [input.stage, input.channel],
    );

    const slug = binding.rows[0]?.slug;
    if (slug) {
      return String(slug);
    }

    if (isTemplateStrictModeEnabled()) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Template não configurado para stage/canal.',
        {
          reasonCode: 'TEMPLATE_NOT_CONFIGURED',
          stage: input.stage,
          channel: input.channel,
        },
      );
    }

    return resolveTemplateByStage(input.channel, input.stage);
  }

  private normalizePhone(value?: string | null): string | undefined {
    if (!value) return undefined;
    const normalized = value.replace(/@.*/, '').replace(/\D/g, '');
    return normalized || undefined;
  }

  private parseWhatsAppSchedulingIntent(
    buttonPayload?: string,
    text?: string,
  ): WhatsAppSchedulingReplyIntent {
    const normalizedPayload = (buttonPayload || '').trim().toUpperCase();
    const normalizedText = (text || '').trim().toLowerCase();

    if (normalizedPayload.includes('SCHED_OPT_1')) return 'confirm_option_1';
    if (normalizedPayload.includes('SCHED_OPT_2')) return 'confirm_option_2';
    if (normalizedPayload.includes('SCHED_OPEN_CALENDAR')) return 'open_calendar';

    if (normalizedText === '1' || normalizedText === 'opção 1' || normalizedText === 'opcao 1') return 'confirm_option_1';
    if (normalizedText === '2' || normalizedText === 'opção 2' || normalizedText === 'opcao 2') return 'confirm_option_2';
    if (normalizedText === '3' || normalizedText.includes('calend')) return 'open_calendar';

    return 'unknown';
  }

  private async resolveSchedulingInviteForWhatsAppReply(
    normalizedPhone: string,
    quotedMessageId?: string,
  ): Promise<{
    inviteId: string;
    leadId: string;
    provider: CommercialSchedulingInviteProvider;
    bookingUrl?: string;
    whatsapp: string;
    email?: string;
    nomeContato?: string;
    nomeEscritorio: string;
    timezone?: string;
    responsavel: string;
    suggestedSlots: Array<{ slotStart: string; slotEnd: string; label: string }>;
  } | null> {
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

    const rawSlots = Array.isArray(row.suggested_slots_json)
      ? (row.suggested_slots_json as Array<Record<string, unknown>>)
      : [];

    const suggestedSlots = rawSlots
      .map((slot) => {
        const slotStart = String(slot.slotStart || slot.start || '').trim();
        const slotEnd = String(slot.slotEnd || slot.end || '').trim();
        if (!slotStart || !slotEnd) return null;
        const start = new Date(slotStart);
        const end = new Date(slotEnd);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        return {
          slotStart: start.toISOString(),
          slotEnd: end.toISOString(),
          label: String(slot.label || this.formatSchedulingSlotLabel(start.toISOString(), row.timezone || 'America/Sao_Paulo')),
        };
      })
      .filter((slot): slot is { slotStart: string; slotEnd: string; label: string } => Boolean(slot));

    return {
      inviteId: String(row.invite_id),
      leadId: String(row.lead_id),
      provider: String(row.provider || 'hub_public') as CommercialSchedulingInviteProvider,
      bookingUrl: row.booking_url ? String(row.booking_url) : undefined,
      whatsapp: String(row.whatsapp),
      email: row.email ? String(row.email) : undefined,
      nomeContato: row.nome_contato ? String(row.nome_contato) : undefined,
      nomeEscritorio: String(row.nome_escritorio || ''),
      timezone: row.timezone ? String(row.timezone) : undefined,
      responsavel: String(row.responsavel || ''),
      suggestedSlots,
    };
  }

  private async sendWhatsAppTemplateMessage(
    leadId: string,
    recipient: string,
    templateKey: string,
    variables: Record<string, unknown>,
  ): Promise<void> {
    const text = this.evolutionApi.resolveTemplate(templateKey, variables);
    const result = await this.evolutionApi.sendText(recipient, text);

    await this.ingestIntegrationEvent({
      leadId,
      channel: 'whatsapp',
      eventType: `dispatch:diagnostico_agendado:${templateKey}`,
      externalEventId: result.messageId,
      payload: {
        recipient,
        templateKey,
        variables,
        provider: 'evolution-api',
        providerAck: { messageId: result.messageId, text },
      },
    });
  }

  private async buildConflictReofferPayload(invite: {
    leadId: string;
    provider: CommercialSchedulingInviteProvider;
    bookingUrl?: string;
    timezone?: string;
    responsavel: string;
    nomeContato?: string;
    nomeEscritorio: string;
  }): Promise<{
    templateKey: string;
    variables: Record<string, unknown>;
    suggestionCount: number;
  }> {
    const timezone = invite.timezone || 'America/Sao_Paulo';
    let calendarUrl = '';
    let suggestionSlots: CommercialScheduleSlot[] = [];

    if (invite.provider === 'google_booking' && invite.bookingUrl) {
      const config = await this.resolveCalendarConfigByResponsavel(invite.responsavel);
      if (!config) {
        throw new CommercialFlowError(
          'VALIDATION_ERROR',
          `Responsável "${invite.responsavel || 'não informado'}" sem booking link configurado.`,
          { reasonCode: 'WHATSAPP_REPLY_CALENDAR_CONFIG_MISSING' },
        );
      }

      suggestionSlots = await this.collectGoogleBookingSuggestedSlots({
        calendarId: config.calendarId,
        timezone,
        durationMin: 30,
        daysWindow: 14,
        maxSuggestions: 2,
      });

      calendarUrl = (await this.createSchedulingRedirectLink(invite.leadId, invite.bookingUrl, 14)).url;
    } else {
      suggestionSlots = await this.collectSuggestedSlots({
        leadId: invite.leadId,
        timezone,
        durationMin: 30,
        daysWindow: 14,
        maxSuggestions: 2,
      });

      calendarUrl = (await this.createSchedulingLink(invite.leadId, { expiresInDays: 14 })).url;
    }

    if (suggestionSlots.length < 2) {
      return {
        templateKey: 'wa_agendamento_abrir_calendario_v1',
        variables: {
          nome: invite.nomeContato || invite.nomeEscritorio || 'Doutor(a)',
          link_calendario: calendarUrl,
        },
        suggestionCount: suggestionSlots.length,
      };
    }

    return {
      templateKey: 'wa_agendamento_conflito_reoferta_v1',
      variables: {
        nome: invite.nomeContato || invite.nomeEscritorio || 'Doutor(a)',
        horario_1: this.formatSchedulingSlotLabel(suggestionSlots[0].start, timezone),
        horario_2: this.formatSchedulingSlotLabel(suggestionSlots[1].start, timezone),
        link_calendario: calendarUrl,
      },
      suggestionCount: suggestionSlots.length,
    };
  }

  private resolveFormsBaseUrl(): string {
    const baseUrl = process.env.HUB_FORMS_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private resolveApiBaseUrl(): string {
    const baseUrl = process.env.HUB_API_BASE_URL || process.env.API_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3001';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private async createSchedulingRedirectLink(
    leadId: string,
    bookingUrl: string,
    expiresInDays: number,
  ): Promise<{ token: string; tokenHash: string; expiresAt: string; url: string }> {
    if (!bookingUrl.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'bookingUrl é obrigatório para redirecionamento.');
    }
    const expiresAt = new Date(Date.now() + Math.min(Math.max(expiresInDays, 1), 30) * 24 * 60 * 60 * 1000).toISOString();
    const token = `${uuidv4()}${uuidv4()}`.replace(/-/g, '');
    const tokenHash = this.hashSchedulingToken(token);

    await this.pool.query(
      `INSERT INTO commercial_scheduling_tokens (id, lead_id, token_hash, expires_at, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [uuidv4(), leadId, tokenHash, expiresAt],
    );

    const apiBase = this.resolveApiBaseUrl();
    const url = `${apiBase}/api/public/comercial/scheduling/redirect?token=${token}&leadId=${leadId}`;
    return { token, tokenHash, expiresAt, url };
  }

  private async resolveCalendarConfigByResponsavel(
    responsavel: string,
  ): Promise<CommercialCalendarConfigRecord | null> {
    const key = responsavel.trim();
    if (!key) return null;

    const result = await this.pool.query(
      `SELECT id, responsavel_key, calendar_id, booking_url, owner_email, timezone, is_active, created_at, updated_at
       FROM commercial_calendar_configs
       WHERE is_active = TRUE
         AND (
           responsavel_key = $1
           OR LOWER(responsavel_key) = LOWER($1)
         )
       ORDER BY updated_at DESC
       LIMIT 1`,
      [key],
    );

    return result.rows[0] ? this.mapCalendarConfigRow(result.rows[0]) : null;
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
    const existing = await this.pool.query(
      `SELECT id
       FROM commercial_scheduling_reconciliation_queue
       WHERE calendar_config_id = $1
         AND google_event_id = $2
         AND reason_code = $3
         AND status = 'pending'
       LIMIT 1`,
      [input.calendarConfigId, input.googleEventId, input.reasonCode],
    );

    if (existing.rows[0]) {
      await this.pool.query(
        `UPDATE commercial_scheduling_reconciliation_queue
         SET attendee_email = COALESCE($2, attendee_email),
             event_start = COALESCE($3::timestamptz, event_start),
             event_end = COALESCE($4::timestamptz, event_end),
             payload_json = $5::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [
          existing.rows[0].id,
          input.attendeeEmail,
          input.eventStart,
          input.eventEnd,
          JSON.stringify(input.payload),
        ],
      );
      return 0;
    }

    await this.pool.query(
      `INSERT INTO commercial_scheduling_reconciliation_queue
        (id, calendar_config_id, google_event_id, attendee_email, event_start, event_end, payload_json, reason_code, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,'pending',NOW(),NOW())`,
      [
        uuidv4(),
        input.calendarConfigId,
        input.googleEventId,
        input.attendeeEmail,
        input.eventStart,
        input.eventEnd,
        JSON.stringify(input.payload),
        input.reasonCode,
      ],
    );

    return 1;
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
      const date = this.formatDateForTimezone(targetDate, input.timezone);
      const daySlots = await this.requestScheduleSlots({
        leadId: input.leadId,
        date,
        durationMin: input.durationMin,
        timezone: input.timezone,
      });

      for (const slot of daySlots.slots) {
        const alreadyAdded = suggested.some((item) => item.start === slot.start && item.end === slot.end);
        if (alreadyAdded) continue;
        suggested.push(slot);
        if (suggested.length >= input.maxSuggestions) {
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
      const date = this.formatDateForTimezone(targetDate, input.timezone);
      const daySlots = await this.googleApi.getFreeBusyForCalendar(
        input.calendarId,
        date,
        input.durationMin,
        input.timezone,
      );

      const validDaySlots = this.applySchedulingPolicy(daySlots, input.timezone);
      for (const slot of validDaySlots) {
        const alreadyAdded = suggested.some((item) => item.start === slot.start && item.end === slot.end);
        if (alreadyAdded) continue;
        suggested.push(slot);
        if (suggested.length >= input.maxSuggestions) {
          return suggested;
        }
      }
    }

    return suggested;
  }

  private formatDateForTimezone(date: Date, timezone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value || '1970';
    const month = parts.find((part) => part.type === 'month')?.value || '01';
    const day = parts.find((part) => part.type === 'day')?.value || '01';

    return `${year}-${month}-${day}`;
  }

  private formatSchedulingSlotLabel(slotStartIso: string, timezone: string): string {
    const start = new Date(slotStartIso);
    return start.toLocaleString('pt-BR', {
      timeZone: timezone,
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private async createQuickSchedulingToken(input: {
    inviteId: string;
    leadId: string;
    slotStart: string;
    slotEnd: string;
  }): Promise<{ token: string; expiresAt: string }> {
    const token = `${uuidv4()}${uuidv4()}`.replace(/-/g, '');
    const tokenHash = this.hashSchedulingToken(token);
    const maxExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    const slotStartAt = new Date(input.slotStart).getTime();
    const expiresAt = new Date(Math.min(maxExpireAt, slotStartAt)).toISOString();

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
    const tokenHash = this.hashSchedulingToken(input.token.trim());
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

    const formsBaseUrl = this.resolveFormsBaseUrl();
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
      if (!this.isSlotWithinSchedulingPolicy(slotStart, slotEnd, input.timezone)) {
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
        label: this.formatSchedulingSlotLabel(slotStart, input.timezone),
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

  private hashSchedulingToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async assertValidSchedulingToken(leadId: string, token: string, markUsed: boolean): Promise<void> {
    if (!isPublicSchedulingEnabled()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Agendamento público está desabilitado.');
    }

    if (!token?.trim()) {
      throw new CommercialFlowError('VALIDATION_ERROR', 'Token de agendamento é obrigatório.');
    }

    const tokenHash = this.hashSchedulingToken(token.trim());
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

  private applySchedulingPolicy(slots: CommercialScheduleSlot[], timezone: string): CommercialScheduleSlot[] {
    return slots.filter((slot) => this.isSlotWithinSchedulingPolicy(slot.start, slot.end, timezone));
  }

  private assertSchedulingPolicyForSlot(slotStart: string, slotEnd: string, timezone?: string) {
    const tz = timezone || 'America/Sao_Paulo';
    if (!this.isSlotWithinSchedulingPolicy(slotStart, slotEnd, tz)) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        'Horário inválido para política de agenda (Seg-Sex, 08:00-18:00, 30min, antecedência mínima de 2h e máximo 14 dias).',
      );
    }
  }

  private isSlotWithinSchedulingPolicy(slotStart: string, slotEnd: string, timezone: string): boolean {
    const start = new Date(slotStart);
    const end = new Date(slotEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMin !== 30) return false;

    const now = Date.now();
    const minLeadTime = 2 * 60 * 60 * 1000;
    const maxFuture = 14 * 24 * 60 * 60 * 1000;
    if (start.getTime() < now + minLeadTime) return false;
    if (start.getTime() > now + maxFuture) return false;

    const parts = this.getDateTimeParts(start, timezone);
    const endParts = this.getDateTimeParts(end, timezone);
    const weekday = Number(parts.weekday);
    const startHour = Number(parts.hour);
    const endHour = Number(endParts.hour);
    const endMinute = Number(endParts.minute);

    if (weekday === 0 || weekday === 6) return false;
    if (startHour < 8 || startHour >= 18) return false;
    if (endHour > 18 || (endHour === 18 && endMinute > 0)) return false;

    return true;
  }

  private getDateTimeParts(date: Date, timezone: string) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const parts = dtf.formatToParts(date);
    const weekdayText = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() || 'mon';
    const weekdayMap: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };

    return {
      weekday: weekdayMap[weekdayText] ?? 1,
      hour: Number(parts.find((p) => p.type === 'hour')?.value || '0'),
      minute: Number(parts.find((p) => p.type === 'minute')?.value || '0'),
    };
  }

  private async getLeadRow(leadId: string): Promise<any | null> {
    const result = await this.pool.query('SELECT * FROM commercial_leads WHERE lead_id = $1 LIMIT 1', [leadId]);
    return result.rows[0] || null;
  }

  private mapAssetRow(row: any): CommercialAssetRecord {
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

  private mapCalendarConfigRow(row: any): CommercialCalendarConfigRecord {
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

  private mapCalendarReconciliationRow(row: any): CommercialCalendarReconciliationItem {
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

  private mapTemplateRow(row: any): CommercialTemplateRecord {
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

  private mapTemplateVersionRow(row: any): CommercialTemplateVersionRecord {
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

  private mapRow(row: any): CommercialLeadRecord {
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
}
