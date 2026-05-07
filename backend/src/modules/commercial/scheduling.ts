import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { CommercialScheduleSlot, CommercialSchedulingInviteProvider } from './types';
import { CommercialFlowError } from './flow';

export function formatDateForTimezone(date: Date, timezone: string): string {
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

export function formatSchedulingSlotLabel(slotStartIso: string, timezone: string): string {
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

export type SchedulingInviteSuggestedSlot = { slotStart: string; slotEnd: string; label: string };

export type SchedulingInviteForWhatsAppReply = {
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
  suggestedSlots: SchedulingInviteSuggestedSlot[];
};

export function normalizeSchedulingInviteSuggestedSlots(
  rawSlots: unknown,
  timezone?: string,
): SchedulingInviteSuggestedSlot[] {
  const slots = Array.isArray(rawSlots)
    ? (rawSlots as Array<Record<string, unknown>>)
    : [];
  const tz = timezone || 'America/Sao_Paulo';

  return slots
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
        label: String(slot.label || formatSchedulingSlotLabel(start.toISOString(), tz)),
      };
    })
    .filter((slot): slot is SchedulingInviteSuggestedSlot => Boolean(slot));
}

export function mapSchedulingInviteForWhatsAppReplyRow(row: any): SchedulingInviteForWhatsAppReply {
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
    suggestedSlots: normalizeSchedulingInviteSuggestedSlots(row.suggested_slots_json, row.timezone),
  };
}

export function hashSchedulingToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSchedulingToken(expiresInDays: number): { token: string; tokenHash: string; expiresAt: string } {
  const days = Math.min(Math.max(expiresInDays, 1), 30);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const token = `${uuidv4()}${uuidv4()}`.replace(/-/g, '');
  const tokenHash = hashSchedulingToken(token);
  return { token, tokenHash, expiresAt };
}

export function createQuickSchedulingTokenForSlot(slotStart: string): { token: string; tokenHash: string; expiresAt: string } {
  const token = `${uuidv4()}${uuidv4()}`.replace(/-/g, '');
  const tokenHash = hashSchedulingToken(token);
  const maxExpireAt = Date.now() + 24 * 60 * 60 * 1000;
  const slotStartAt = new Date(slotStart).getTime();
  const expiresAt = new Date(Math.min(maxExpireAt, slotStartAt)).toISOString();
  return { token, tokenHash, expiresAt };
}

export function applySchedulingPolicy(slots: CommercialScheduleSlot[], timezone: string): CommercialScheduleSlot[] {
  return slots.filter((slot) => isSlotWithinSchedulingPolicy(slot.start, slot.end, timezone));
}

export function appendUniqueSchedulingSlot(
  slots: CommercialScheduleSlot[],
  slot: CommercialScheduleSlot,
  maxSuggestions: number,
): boolean {
  const alreadyAdded = slots.some((item) => item.start === slot.start && item.end === slot.end);
  if (alreadyAdded) {
    return slots.length >= maxSuggestions;
  }

  slots.push(slot);
  return slots.length >= maxSuggestions;
}

export function assertSchedulingPolicyForSlot(slotStart: string, slotEnd: string, timezone?: string) {
  const tz = timezone || 'America/Sao_Paulo';
  if (!isSlotWithinSchedulingPolicy(slotStart, slotEnd, tz)) {
    throw new CommercialFlowError(
      'VALIDATION_ERROR',
      'Horário inválido para política de agenda (Seg-Sex, 08:00-18:00, 30min, antecedência mínima de 2h e máximo 14 dias).',
    );
  }
}

export function isSlotWithinSchedulingPolicy(slotStart: string, slotEnd: string, timezone: string): boolean {
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

  const parts = getDateTimeParts(start, timezone);
  const endParts = getDateTimeParts(end, timezone);
  const weekday = Number(parts.weekday);
  const startHour = Number(parts.hour);
  const endHour = Number(endParts.hour);
  const endMinute = Number(endParts.minute);

  if (weekday === 0 || weekday === 6) return false;
  if (startHour < 8 || startHour >= 18) return false;
  if (endHour > 18 || (endHour === 18 && endMinute > 0)) return false;

  return true;
}

function getDateTimeParts(date: Date, timezone: string) {
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
