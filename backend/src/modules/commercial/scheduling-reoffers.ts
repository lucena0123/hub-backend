import { CommercialFlowError } from './flow';
import { formatSchedulingSlotLabel } from './scheduling';
import type {
  CommercialCalendarConfigRecord,
  CommercialScheduleSlot,
  CommercialSchedulingInviteProvider,
  CommercialSchedulingLink,
} from './types';

export async function buildConflictReofferPayload(input: {
  invite: {
    leadId: string;
    provider: CommercialSchedulingInviteProvider;
    bookingUrl?: string;
    timezone?: string;
    responsavel: string;
    nomeContato?: string;
    nomeEscritorio: string;
  };
  resolveCalendarConfigByResponsavel: (responsavel: string) => Promise<CommercialCalendarConfigRecord | null>;
  collectGoogleBookingSuggestedSlots: (input: {
    calendarId: string;
    timezone: string;
    durationMin: number;
    daysWindow: number;
    maxSuggestions: number;
  }) => Promise<CommercialScheduleSlot[]>;
  collectSuggestedSlots: (input: {
    leadId: string;
    timezone: string;
    durationMin: number;
    daysWindow: number;
    maxSuggestions: number;
  }) => Promise<CommercialScheduleSlot[]>;
  createSchedulingRedirectLink: (
    leadId: string,
    bookingUrl: string,
    expiresInDays: number,
  ) => Promise<{ url: string }>;
  createSchedulingLink: (leadId: string, input: { expiresInDays: number }) => Promise<CommercialSchedulingLink>;
}): Promise<{
  templateKey: string;
  variables: Record<string, unknown>;
  suggestionCount: number;
}> {
  const timezone = input.invite.timezone || 'America/Sao_Paulo';
  let calendarUrl = '';
  let suggestionSlots: CommercialScheduleSlot[] = [];

  if (input.invite.provider === 'google_booking' && input.invite.bookingUrl) {
    const config = await input.resolveCalendarConfigByResponsavel(input.invite.responsavel);
    if (!config) {
      throw new CommercialFlowError(
        'VALIDATION_ERROR',
        `Responsável "${input.invite.responsavel || 'não informado'}" sem booking link configurado.`,
        { reasonCode: 'WHATSAPP_REPLY_CALENDAR_CONFIG_MISSING' },
      );
    }

    suggestionSlots = await input.collectGoogleBookingSuggestedSlots({
      calendarId: config.calendarId,
      timezone,
      durationMin: 30,
      daysWindow: 14,
      maxSuggestions: 2,
    });

    calendarUrl = (await input.createSchedulingRedirectLink(input.invite.leadId, input.invite.bookingUrl, 14)).url;
  } else {
    suggestionSlots = await input.collectSuggestedSlots({
      leadId: input.invite.leadId,
      timezone,
      durationMin: 30,
      daysWindow: 14,
      maxSuggestions: 2,
    });

    calendarUrl = (await input.createSchedulingLink(input.invite.leadId, { expiresInDays: 14 })).url;
  }

  if (suggestionSlots.length < 2) {
    return {
      templateKey: 'wa_agendamento_abrir_calendario_v1',
      variables: {
        nome: input.invite.nomeContato || input.invite.nomeEscritorio || 'Doutor(a)',
        link_calendario: calendarUrl,
      },
      suggestionCount: suggestionSlots.length,
    };
  }

  return {
    templateKey: 'wa_agendamento_conflito_reoferta_v1',
    variables: {
      nome: input.invite.nomeContato || input.invite.nomeEscritorio || 'Doutor(a)',
      horario_1: formatSchedulingSlotLabel(suggestionSlots[0].start, timezone),
      horario_2: formatSchedulingSlotLabel(suggestionSlots[1].start, timezone),
      link_calendario: calendarUrl,
    },
    suggestionCount: suggestionSlots.length,
  };
}
