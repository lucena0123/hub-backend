import { google, Auth } from 'googleapis';

export interface CommercialScheduleSlot {
  start: string;
  end: string;
  label?: string;
}

interface CalendarEventParams {
  slotStart: string;
  slotEnd: string;
  timezone: string;
  leadId: string;
  attendeeName?: string;
  attendeeEmail?: string;
}

const GMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  gm_boas_vindas_comercial_v1: {
    subject: 'Diagnóstico comercial inicial — {{escritorio}}',
    body: 'Olá, {{nome}},\n\nObrigado pelo interesse. Podemos iniciar com um diagnóstico rápido para mapear melhorias de posicionamento, atendimento e conversão.\n\nSe estiver de acordo, seguimos com uma conversa objetiva de 10–15 minutos.\n\nAbraço,\nEquipe Lucena',
  },
  gm_convite_reuniao_v1: {
    subject: 'Confirmação de reunião — {{data_hora}}',
    body: 'Olá, {{nome}},\n\nSua reunião foi agendada para {{data_hora}}.\nCaso precise remarcar, responda este e-mail com duas janelas de horário.\n\nAté breve,\nEquipe Lucena',
  },
  gm_envio_proposta_v1: {
    subject: 'Proposta comercial — {{escritorio}}',
    body: 'Olá, {{nome}},\n\nConforme alinhado, segue proposta comercial para avaliação.\n\nSe preferir, podemos marcar uma revisão rápida para esclarecer qualquer ponto.\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_contraproposta_v1: {
    subject: 'Contraproposta e próximos passos',
    body: 'Olá, {{nome}},\n\nAtualizamos os pontos discutidos e segue a contraproposta consolidada.\n\nFico à disposição para validar o melhor cenário para seu momento.\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_confirmacao_fechamento_v1: {
    subject: 'Fechamento confirmado — próximos passos',
    body: 'Olá, {{nome}},\n\nFechamento confirmado com sucesso.\n\nPróximos passos:\n1) envio do checklist inicial\n2) agenda de onboarding\n3) definição dos primeiros marcos\n\nConte com a gente,\nEquipe Lucena',
  },
};

const FALLBACK_GMAIL_KEY = 'gm_boas_vindas_comercial_v1';

/**
 * Converts a naive local datetime (dateStr at localHour:00) in the given timezone to a UTC Date.
 * Uses the toLocaleString trick to find the UTC offset at that moment.
 */
function localTimeToUTC(dateStr: string, localHour: number, timezone: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const anchor = new Date(Date.UTC(y, m - 1, d, localHour, 0, 0));
  const utcMs = new Date(anchor.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
  const localMs = new Date(anchor.toLocaleString('en-US', { timeZone: timezone })).getTime();
  return new Date(anchor.getTime() + (utcMs - localMs));
}

export class GoogleApiService {
  private auth: Auth.OAuth2Client;

  constructor(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
    private calendarId: string,
    private fromAddress: string,
  ) {
    this.auth = new google.auth.OAuth2(clientId, clientSecret);
    this.auth.setCredentials({ refresh_token: refreshToken });
  }

  // ─── Gmail ────────────────────────────────────────────────────────────────

  resolveGmailTemplate(
    templateKey: string,
    variables: Record<string, unknown>,
  ): { subject: string; html: string } {
    const tpl = GMAIL_TEMPLATES[templateKey] ?? GMAIL_TEMPLATES[FALLBACK_GMAIL_KEY];
    const vars: Record<string, string> = {
      nome: String(variables.nome ?? variables.nomeEscritorio ?? 'Doutor(a)'),
      escritorio: String(variables.escritorio ?? variables.nomeEscritorio ?? 'seu escritório'),
      data_hora: String(variables.data_hora ?? variables.dataHora ?? 'horário a confirmar'),
    };

    let subject = tpl.subject;
    let body = tpl.body;
    for (const [key, val] of Object.entries(vars)) {
      subject = subject.replaceAll(`{{${key}}}`, val);
      body = body.replaceAll(`{{${key}}}`, val);
    }

    const html = body
      .split('\n\n')
      .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('\n');

    return { subject, html };
  }

  async sendEmail(to: string, subject: string, html: string): Promise<{ messageId: string }> {
    const gmail = google.gmail({ version: 'v1', auth: this.auth });

    const raw = [
      `From: ${this.fromAddress}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ].join('\r\n');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: Buffer.from(raw).toString('base64url') },
    });

    return { messageId: result.data.id ?? `gm_${Date.now()}` };
  }

  // ─── Google Calendar ──────────────────────────────────────────────────────

  async getFreeBusy(
    date: string | undefined,
    durationMin: number,
    timezone: string,
  ): Promise<CommercialScheduleSlot[]> {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const timeMin = localTimeToUTC(targetDate, 8, timezone);
    const timeMax = localTimeToUTC(targetDate, 18, timezone);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone: timezone,
        items: [{ id: this.calendarId }],
      },
    });

    const busySlots = response.data.calendars?.[this.calendarId]?.busy ?? [];
    const slots: CommercialScheduleSlot[] = [];
    const durationMs = durationMin * 60_000;
    const cursor = new Date(timeMin);

    while (cursor.getTime() + durationMs <= timeMax.getTime() && slots.length < 10) {
      const slotEnd = new Date(cursor.getTime() + durationMs);

      const isBusy = busySlots.some((busy) => {
        const bs = new Date(busy.start!).getTime();
        const be = new Date(busy.end!).getTime();
        return cursor.getTime() < be && slotEnd.getTime() > bs;
      });

      if (!isBusy) {
        slots.push({
          start: cursor.toISOString(),
          end: slotEnd.toISOString(),
          label: cursor.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone,
          }),
        });
      }

      cursor.setTime(cursor.getTime() + durationMs);
    }

    return slots;
  }

  async createEvent(params: CalendarEventParams): Promise<{ eventId: string }> {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });

    const result = await calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        summary: 'Diagnóstico Comercial',
        description: `Lead ${params.leadId}`,
        start: { dateTime: params.slotStart, timeZone: params.timezone },
        end: { dateTime: params.slotEnd, timeZone: params.timezone },
        ...(params.attendeeEmail
          ? { attendees: [{ email: params.attendeeEmail, displayName: params.attendeeName }] }
          : {}),
      },
    });

    return { eventId: result.data.id ?? result.data.iCalUID ?? `cal_${Date.now()}` };
  }

  async updateEvent(eventId: string, params: CalendarEventParams): Promise<{ eventId: string }> {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });

    const result = await calendar.events.patch({
      calendarId: this.calendarId,
      eventId,
      requestBody: {
        summary: 'Diagnóstico Comercial (Remarcado)',
        description: `Lead ${params.leadId}`,
        start: { dateTime: params.slotStart, timeZone: params.timezone },
        end: { dateTime: params.slotEnd, timeZone: params.timezone },
        ...(params.attendeeEmail
          ? { attendees: [{ email: params.attendeeEmail, displayName: params.attendeeName }] }
          : {}),
      },
    });

    return { eventId: result.data.id ?? eventId };
  }

  async deleteEvent(eventId: string): Promise<void> {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });
    await calendar.events.delete({ calendarId: this.calendarId, eventId });
  }
}
