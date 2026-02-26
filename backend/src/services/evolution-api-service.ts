const WHATSAPP_TEMPLATES: Record<string, string> = {
  wa_lead_qualificado_v1:
    'Olá, Dr(a). {{nome}}! Vi o perfil do {{escritorio}} e acredito que temos fit para estruturar o comercial digital com previsibilidade. Posso te enviar um diagnóstico rápido com 3 ajustes práticos?',
  wa_reuniao_agendada_lembrete_v1:
    'Perfeito, {{nome}}. Reunião confirmada para {{data_hora}}. Se precisar ajustar horário, me avise por aqui e te envio novas opções.',
  wa_proposta_enviada_followup_v1:
    '{{nome}}, proposta enviada ✅ Fico à disposição para alinhar qualquer ponto. Se preferir, já marcamos 15 min para revisar juntos.',
  wa_negociacao_alinhamento_v1:
    'Obrigado pelo retorno, {{nome}}. Ajustei os pontos da negociação e posso te apresentar as opções agora. Quer que eu te envie o resumo objetivo por aqui?',
  wa_fechado_boas_vindas_v1:
    'Excelente, {{nome}}! Fechamento confirmado ✅ Próximo passo: onboarding inicial + cronograma de execução. Te envio os detalhes agora.',
};

const FALLBACK_TEMPLATE_KEY = 'wa_lead_qualificado_v1';

export class EvolutionApiService {
  constructor(
    private baseUrl: string,
    private instance: string,
    private apiKey: string,
  ) {}

  resolveTemplate(templateKey: string, variables: Record<string, unknown>): string {
    const template = WHATSAPP_TEMPLATES[templateKey] ?? WHATSAPP_TEMPLATES[FALLBACK_TEMPLATE_KEY];
    const vars: Record<string, string> = {
      nome: String(variables.nome ?? variables.nomeEscritorio ?? 'Doutor(a)'),
      escritorio: String(variables.escritorio ?? variables.nomeEscritorio ?? 'seu escritório'),
      data_hora: String(variables.data_hora ?? variables.dataHora ?? 'horário a confirmar'),
    };
    return Object.entries(vars).reduce(
      (text, [key, val]) => text.replaceAll(`{{${key}}}`, val),
      template,
    );
  }

  async sendText(number: string, text: string): Promise<{ messageId: string }> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/message/sendText/${this.instance}`;
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
          body: JSON.stringify({ number, text }),
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
}
