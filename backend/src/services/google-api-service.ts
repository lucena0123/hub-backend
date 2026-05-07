import { google, Auth, calendar_v3 } from 'googleapis';

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

export interface GoogleCalendarSyncEvent {
  eventId: string;
  status: string;
  start?: string;
  end?: string;
  attendeeEmails: string[];
  organizerEmail?: string;
  eventUrl?: string;
  meetUrl?: string;
  updatedAt?: string;
}

export interface GoogleCalendarSyncBatch {
  events: GoogleCalendarSyncEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
  resetRequired?: boolean;
}

const GMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  gm_boas_vindas_comercial_v1: {
    subject: 'Diagnóstico inicial para {{escritorio}}',
    body: 'Olá, {{nome}},\n\nObrigado pelo contato.\n\nCom base no contexto do {{escritorio}}, podemos iniciar com um diagnóstico comercial objetivo (10–15 minutos) para mapear oportunidades práticas de captação e conversão.\n\nSe fizer sentido, seguimos para o próximo passo.\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_convite_reuniao_v1: {
    subject: 'Confirmação de reunião — {{data_hora}}',
    body: 'Olá, {{nome}},\n\nSua reunião foi agendada para {{data_hora}}.\nCaso precise remarcar, responda este e-mail com duas janelas de horário.\n\nAté breve,\nEquipe Lucena',
  },
  gm_briefing_recebido_agendamento_v1: {
    subject: 'Briefing recebido — confirme seu horário de diagnóstico',
    body: 'Olá, {{nome}},\n\nRecebemos o briefing do {{escritorio}}.\n\nPara agilizar, você pode confirmar por estas opções:\n1) {{horario_1}}: {{link_1}}\n2) {{horario_2}}: {{link_2}}\n\nSe preferir outro horário:\n{{link_calendario}}\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_briefing_recebido_agendamento_link_v1: {
    subject: 'Briefing recebido — escolha seu horário de diagnóstico',
    body: 'Olá, {{nome}},\n\nRecebemos o briefing do {{escritorio}}.\n\nEscolha o melhor dia e horário da reunião de diagnóstico no link abaixo:\n{{link_calendario}}\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_briefing_recebido_agendamento_google_sugestoes_v1: {
    subject: 'Briefing recebido — sugestões de horário para diagnóstico',
    body: 'Olá, {{nome}},\n\nRecebemos o briefing do {{escritorio}}.\n\nSugestões de horário:\n1) {{horario_1}}\n2) {{horario_2}}\n\nPara confirmar ou escolher outro horário no Google Calendar:\n{{link_calendario}}\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_reuniao_agendada_lembrete_v1: {
    subject: 'Lembrete: reunião de diagnóstico em {{data_hora}}',
    body: 'Olá, {{nome}},\n\nEste é um lembrete da sua reunião de diagnóstico em {{data_hora}}.\n\nSe precisar remarcar, responda este e-mail que enviamos novas opções.\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_envio_proposta_v1: {
    subject: 'Proposta comercial — {{escritorio}}',
    body: 'Olá, {{nome}},\n\nConforme alinhado, a proposta comercial foi enviada para sua avaliação.\n\nSe fizer sentido, podemos fazer uma revisão rápida para alinhar os pontos finais.\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_proposta_enviada_followup_v1: {
    subject: 'Follow-up da proposta',
    body: 'Olá, {{nome}},\n\nQuero confirmar se você conseguiu revisar a proposta.\n\nSe preferir, agendamos um alinhamento rápido para avançar com segurança.\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_contraproposta_v1: {
    subject: 'Contraproposta e próximos passos',
    body: 'Olá, {{nome}},\n\nAtualizamos os pontos discutidos e segue a contraproposta consolidada.\n\nFico à disposição para validar o melhor cenário para seu momento.\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_negociacao_alinhamento_v1: {
    subject: 'Alinhamento final da negociação',
    body: 'Olá, {{nome}},\n\nAtualizamos os pontos da negociação conforme combinado.\n\nSe estiver de acordo, seguimos para validação final e próximos passos.\n\nAtenciosamente,\nEquipe Lucena',
  },
  gm_confirmacao_fechamento_v1: {
    subject: 'Fechamento confirmado — próximos passos',
    body: 'Olá, {{nome}},\n\nFechamento confirmado com sucesso.\n\nPróximos passos:\n1) onboarding inicial\n2) definição do cronograma de execução\n3) alinhamento dos primeiros marcos\n\nAtenciosamente,\nEquipe Lucena',
  },
};

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
    const tpl = GMAIL_TEMPLATES[templateKey];
    if (!tpl) {
      throw new Error(`Gmail template not found: ${templateKey}`);
    }
    const defaults: Record<string, string> = {
      nome: String(variables.nome ?? variables.nomeEscritorio ?? 'Doutor(a)'),
      escritorio: String(variables.escritorio ?? variables.nomeEscritorio ?? 'seu escritório'),
      data_hora: String(variables.data_hora ?? variables.dataHora ?? 'horário a confirmar'),
      horario_1: String(variables.horario_1 ?? variables.horario1 ?? '-'),
      horario_2: String(variables.horario_2 ?? variables.horario2 ?? '-'),
      link_1: String(variables.link_1 ?? variables.link1 ?? ''),
      link_2: String(variables.link_2 ?? variables.link2 ?? ''),
      link_calendario: String(variables.link_calendario ?? variables.linkCalendario ?? ''),
    };
    const dynamicEntries = Object.entries(variables).map(([key, value]) => [key, value == null ? '' : String(value)]);
    const vars: Record<string, string> = {
      ...defaults,
      ...Object.fromEntries(dynamicEntries),
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
    return this.getFreeBusyForCalendar(this.calendarId, date, durationMin, timezone);
  }

  async getFreeBusyForCalendar(
    calendarId: string,
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
        items: [{ id: calendarId }],
      },
    });

    const busySlots = response.data.calendars?.[calendarId]?.busy ?? [];
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

  async createEvent(params: CalendarEventParams): Promise<{ eventId: string; eventUrl?: string; meetUrl?: string }> {
    return this.createEventForCalendar(this.calendarId, params);
  }

  async createEventForCalendar(
    calendarId: string,
    params: CalendarEventParams,
  ): Promise<{ eventId: string; eventUrl?: string; meetUrl?: string }> {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });

    const result = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: 'Diagnóstico Comercial',
        description: `Lead ${params.leadId}`,
        start: { dateTime: params.slotStart, timeZone: params.timezone },
        end: { dateTime: params.slotEnd, timeZone: params.timezone },
        conferenceData: {
          createRequest: {
            conferenceSolutionKey: { type: 'hangoutsMeet' },
            requestId: `meet-${params.leadId}-${Date.now()}`,
          },
        },
        ...(params.attendeeEmail
          ? { attendees: [{ email: params.attendeeEmail, displayName: params.attendeeName }] }
          : {}),
      },
    });

    return {
      eventId: result.data.id ?? result.data.iCalUID ?? `cal_${Date.now()}`,
      eventUrl: result.data.htmlLink || undefined,
      meetUrl: this.extractMeetUrl(result.data),
    };
  }

  async updateEvent(
    eventId: string,
    params: CalendarEventParams,
  ): Promise<{ eventId: string; eventUrl?: string; meetUrl?: string }> {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });

    const result = await calendar.events.patch({
      calendarId: this.calendarId,
      eventId,
      conferenceDataVersion: 1,
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

    return {
      eventId: result.data.id ?? eventId,
      eventUrl: result.data.htmlLink || undefined,
      meetUrl: this.extractMeetUrl(result.data),
    };
  }

  async deleteEvent(eventId: string): Promise<void> {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });
    await calendar.events.delete({ calendarId: this.calendarId, eventId });
  }

  async listEventsIncremental(input: {
    calendarId: string;
    syncToken?: string;
    pageToken?: string;
    timeMin?: string;
    timeMax?: string;
  }): Promise<GoogleCalendarSyncBatch> {
    const calendar = google.calendar({ version: 'v3', auth: this.auth });

    try {
      const response = await calendar.events.list({
        calendarId: input.calendarId,
        singleEvents: true,
        showDeleted: true,
        maxResults: 2500,
        pageToken: input.pageToken,
        syncToken: input.syncToken,
        timeMin: input.syncToken ? undefined : input.timeMin,
        timeMax: input.syncToken ? undefined : input.timeMax,
      });

      const events: GoogleCalendarSyncEvent[] = (response.data.items || [])
        .map((item) => this.mapSyncEvent(item))
        .filter((item): item is GoogleCalendarSyncEvent => Boolean(item));

      return {
        events,
        nextSyncToken: response.data.nextSyncToken || undefined,
        nextPageToken: response.data.nextPageToken || undefined,
      };
    } catch (error) {
      const status = (error as { code?: number; response?: { status?: number } })?.code
        || (error as { response?: { status?: number } })?.response?.status;

      if (status === 410) {
        // Sync token expired/inválido: caller deve limpar token e reiniciar leitura por janela.
        return { events: [], resetRequired: true };
      }
      throw error;
    }
  }

  private mapSyncEvent(item: calendar_v3.Schema$Event): GoogleCalendarSyncEvent | null {
    const eventId = item.id || item.iCalUID;
    if (!eventId) return null;

    return {
      eventId,
      status: item.status || 'confirmed',
      start: item.start?.dateTime || undefined,
      end: item.end?.dateTime || undefined,
      attendeeEmails: (item.attendees || [])
        .map((attendee) => attendee.email || '')
        .filter((email) => Boolean(email)),
      organizerEmail: item.organizer?.email || undefined,
      eventUrl: item.htmlLink || undefined,
      meetUrl: this.extractMeetUrl(item),
      updatedAt: item.updated || undefined,
    };
  }

  private extractMeetUrl(event: calendar_v3.Schema$Event): string | undefined {
    if (event.hangoutLink) return event.hangoutLink;
    const entryPoints = event.conferenceData?.entryPoints || [];
    const videoEntry = entryPoints.find((entry) => entry.entryPointType === 'video');
    return videoEntry?.uri || undefined;
  }
}
