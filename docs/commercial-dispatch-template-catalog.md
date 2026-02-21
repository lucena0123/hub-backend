# Catálogo de Templates de Dispatch Comercial (v1)

Baseado em:
- `projects/comercial-juridico/OPERACAO-CANAIS-EVENTOS.md`
- `projects/comercial-juridico/proposta-comercial-resumo-whatsapp.md`
- `projects/comercial-juridico/templates/template-script-abordagem-instagram-v1.md`

## Mapa de IDs sugeridos (produção)

### WhatsApp
- `primeiro_contato` → `wa_lead_qualificado_v1`
- `diagnostico_agendado` → `wa_reuniao_agendada_lembrete_v1`
- `proposta_enviada` → `wa_proposta_enviada_followup_v1`
- `negociacao` → `wa_negociacao_alinhamento_v1`
- `fechado` → `wa_fechado_boas_vindas_v1`

### Gmail
- `primeiro_contato` → `gm_boas_vindas_comercial_v1`
- `diagnostico_agendado` → `gm_convite_reuniao_v1`
- `proposta_enviada` → `gm_envio_proposta_v1`
- `negociacao` → `gm_contraproposta_v1`
- `fechado` → `gm_confirmacao_fechamento_v1`

## Exemplos de copy base

### wa_lead_qualificado_v1
Olá, Dr(a). [NOME], tudo bem? Vi o perfil de vocês e acredito que temos fit para estruturar o comercial digital com foco em previsibilidade. Se fizer sentido, te envio um diagnóstico rápido com 3 ajustes práticos e alinhamos próximos passos.

### gm_boas_vindas_comercial_v1
Assunto: Próximo passo comercial — diagnóstico inicial

Olá, [NOME],

Obrigado pelo interesse. Estruturamos um diagnóstico inicial para identificar melhorias no posicionamento, fluxo de atendimento e momento ideal para tráfego pago.

Se estiver de acordo, seguimos com uma conversa objetiva de 10–15 minutos.

## Como aplicar no Hub

Configurar no backend:
- `COMMERCIAL_DISPATCH_TEMPLATE_MAP_JSON`

Valor sugerido (copiar do arquivo JSON):
- `docs/commercial-dispatch-template-map.example.json`

## Observações
- IDs são estáveis para integração; o texto pode evoluir sem quebrar o fluxo.
- Evitar promessas de resultado financeiro direto.
- Manter linguagem clara, objetiva e compliance jurídico/publicitário.
