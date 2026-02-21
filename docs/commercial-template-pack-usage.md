# Commercial Template Pack v1 — Uso Operacional

Arquivo fonte:
- `ops/n8n/commercial-template-pack.v1.json`

## Como usar no n8n
1. Carregue o JSON em um `Code`/`Set` node no início do workflow.
2. Resolva `templateKey` recebido do Hub.
3. Para WhatsApp, use o valor de string como mensagem final.
4. Para Gmail, use `subject` e `body` do objeto.

## Variáveis sugeridas
- `{{nome}}`
- `{{escritorio}}`
- `{{data_hora}}`

## Compatibilidade com Hub
Esses IDs batem com o mapa em:
- `docs/commercial-dispatch-template-map.example.json`

## Observação
Mantenha os IDs estáveis e evolua a copy por versão (`_v2`, `_v3`) para não quebrar automações existentes.
