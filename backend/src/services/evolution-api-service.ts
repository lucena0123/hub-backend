const WHATSAPP_TEMPLATES: Record<string, string> = {
  wa_lead_qualificado_v1:
    'Olá, {{nome}}. Analisei o cenário do {{escritorio}} e identifiquei oportunidades práticas para captação e conversão. Posso te enviar um diagnóstico objetivo com próximos passos?',
  wa_briefing_recebido_agendamento_v1:
    'Olá, {{nome}}. Recebemos seu briefing do {{escritorio}}. Para agilizar, você pode confirmar a reunião nestas opções:\n1) {{horario_1}}: {{link_1}}\n2) {{horario_2}}: {{link_2}}\nSe preferir outro horário: {{link_calendario}}',
  wa_briefing_recebido_agendamento_link_v1:
    'Olá, {{nome}}. Recebemos seu briefing do {{escritorio}}. Escolha o melhor dia e horário da reunião neste link: {{link_calendario}}',
  wa_briefing_recebido_agendamento_google_sugestoes_v1:
    'Olá, {{nome}}. Recebemos seu briefing do {{escritorio}}.\nSugestões de horário:\n1) {{horario_1}}\n2) {{horario_2}}\nPara confirmar, responda com 1, 2 ou 3.\n1 = confirmar opção 1\n2 = confirmar opção 2\n3 = escolher no Google Calendar: {{link_calendario}}',
  wa_briefing_recebido_agendamento_google_botoes_v1:
    'Olá, {{nome}}. Recebemos seu briefing do {{escritorio}}.\nSugestões de horário:\n1) {{horario_1}}\n2) {{horario_2}}\nUse os botões abaixo para confirmar uma opção ou abrir o calendário completo.',
  wa_agendamento_abrir_calendario_v1:
    'Perfeito, {{nome}}. Escolha o melhor dia e horário no Google Calendar: {{link_calendario}}',
  wa_agendamento_confirmado_v1:
    'Reunião confirmada para {{data_hora}}.\nLink do Google Meet: {{link_meet}}\nEquipe Lucena.',
  wa_agendamento_conflito_reoferta_v1:
    'Esse horário ficou indisponível. Novas sugestões:\n1) {{horario_1}}\n2) {{horario_2}}\nResponda com 1, 2 ou 3.\n3 = escolher no calendário completo: {{link_calendario}}',
  wa_agendamento_opcao_invalida_v1:
    'Não identifiquei a opção. Responda com 1, 2 ou 3 para continuar.',
  wa_reuniao_agendada_lembrete_v1:
    'Olá, {{nome}}. Lembrete da reunião de diagnóstico em {{data_hora}}. Se precisar remarcar, responda esta mensagem e enviamos novas opções.',
  wa_proposta_enviada_followup_v1:
    'Olá, {{nome}}. Quero confirmar se você conseguiu revisar a proposta. Se fizer sentido, agendamos 15 minutos para alinhar pontos finais.',
  wa_negociacao_alinhamento_v1:
    'Olá, {{nome}}. Atualizamos os pontos da negociação conforme combinado. Posso te enviar um resumo objetivo para validação final?',
  wa_fechado_boas_vindas_v1:
    'Olá, {{nome}}. Fechamento confirmado. Próximo passo: onboarding inicial e cronograma de execução. Equipe Lucena.',
};

export class EvolutionApiService {
  private integrationCache?: { value?: string; fetchedAt: number };

  constructor(
    private baseUrl: string,
    private instance: string,
    private apiKey: string,
  ) {}

  resolveTemplate(templateKey: string, variables: Record<string, unknown>): string {
    const template = WHATSAPP_TEMPLATES[templateKey];
    if (!template) {
      throw new Error(`WhatsApp template not found: ${templateKey}`);
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
      link_meet: String(variables.link_meet ?? variables.linkMeet ?? ''),
    };
    const dynamicEntries = Object.entries(variables).map(([key, value]) => [key, value == null ? '' : String(value)]);
    const vars: Record<string, string> = {
      ...defaults,
      ...Object.fromEntries(dynamicEntries),
    };

    return Object.entries(vars).reduce(
      (text, [key, val]) => text.replaceAll(`{{${key}}}`, val),
      template,
    );
  }

  private async sendWithRetry(path: string, payload: Record<string, unknown>): Promise<{ messageId: string }> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const raw = await response.text();
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          body = { raw };
        }

        if (!response.ok) {
          throw new Error(`Evolution API error: HTTP ${response.status} — ${raw}`);
        }

        const keyId = (body?.key as Record<string, unknown>)?.id;
        const messageId =
          (typeof keyId === 'string' && keyId) ||
          (typeof body?.id === 'string' && body.id) ||
          (typeof body?.messageId === 'string' && body.messageId) ||
          `wa_${Date.now()}`;

        return { messageId };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Evolution API unknown error');
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError ?? new Error('Evolution API: falha após retentativas');
  }

  async sendText(number: string, text: string): Promise<{ messageId: string }> {
    return this.sendWithRetry(`/message/sendText/${this.instance}`, { number, text });
  }

  async sendInteractiveButtons(input: {
    number: string;
    text: string;
    footer?: string;
    buttons: Array<{ id: string; title: string }>;
  }): Promise<{ messageId: string }> {
    const normalizedButtons = input.buttons.slice(0, 3).map((button) => ({
      buttonId: button.id,
      buttonText: { displayText: button.title },
      type: 1,
    }));

    return this.sendWithRetry(`/message/sendButtons/${this.instance}`, {
      number: input.number,
      title: '',
      description: input.text,
      footer: input.footer || 'Equipe Lucena',
      buttons: normalizedButtons,
      text: input.text,
    });
  }

  async getInstanceIntegrationType(): Promise<string | undefined> {
    const now = Date.now();
    const cacheTtlMs = 5 * 60 * 1000;
    if (this.integrationCache && (now - this.integrationCache.fetchedAt) < cacheTtlMs) {
      return this.integrationCache.value;
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}/instance/fetchInstances`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: this.apiKey,
      },
    });

    const raw = await response.text();
    if (!response.ok) {
      throw new Error(`Evolution API error: HTTP ${response.status} — ${raw}`);
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      body = [];
    }

    let integration: string | undefined;
    if (Array.isArray(body)) {
      const instanceName = this.instance.trim().toLowerCase();
      const match = body.find((item) => {
        if (!item || typeof item !== 'object') return false;
        const name = (item as Record<string, unknown>).name;
        return typeof name === 'string' && name.trim().toLowerCase() === instanceName;
      });
      const resolved = match && typeof match === 'object'
        ? (match as Record<string, unknown>).integration
        : undefined;
      integration = typeof resolved === 'string' ? resolved : undefined;
    }

    this.integrationCache = {
      value: integration,
      fetchedAt: now,
    };
    return integration;
  }
}
