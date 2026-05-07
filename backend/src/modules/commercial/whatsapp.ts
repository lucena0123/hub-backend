import type { WhatsAppSchedulingReplyIntent } from './types';

export function normalizePhone(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/@.*/, '').replace(/\D/g, '');
  return normalized || undefined;
}

export function parseWhatsAppSchedulingIntent(
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
