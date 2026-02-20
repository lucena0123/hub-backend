# n8n Dispatch Setup (Hub Comercial)

## Objetivo
Subir n8n hospedado para receber dispatch do Hub e responder `externalEventId` auditável.

## Arquivos criados
- `ops/n8n/docker-compose.n8n.yml`
- `ops/n8n/.env.example`
- `ops/n8n/workflows/hub-dispatch-whatsapp.json`
- `ops/n8n/workflows/hub-dispatch-gmail.json`

## Passo a passo rápido
1. Copie `.env.example` para `.env` em `ops/n8n/` e preencha valores.
2. Suba stack:
   ```bash
   docker compose -f ops/n8n/docker-compose.n8n.yml --env-file ops/n8n/.env up -d
   ```
3. Acesse n8n e importe os dois workflows JSON.
4. Ative os workflows.
5. Copie as Production URLs dos webhooks:
   - WhatsApp: `/webhook/hub/dispatch/whatsapp`
   - Gmail: `/webhook/hub/dispatch/gmail`
6. Configure no backend do Hub:
   - `COMMERCIAL_DISPATCH_WHATSAPP_WEBHOOK_URL=<url_producao_whatsapp>`
   - `COMMERCIAL_DISPATCH_GMAIL_WEBHOOK_URL=<url_producao_gmail>`

## Teste
No Hub frontend (`/comercial`), disparar um envio de teste para cada canal.
Resposta esperada no backend:
- `ok: true`
- `provider`: `n8n-whatsapp` ou `n8n-gmail`
- `externalEventId` preenchido

## Segurança (assinatura)
Os templates de workflow validam:
- presença de `x-dispatch-signature` e `x-dispatch-timestamp`
- formato hexadecimal de assinatura (64 chars)
- timestamp com janela máxima de 5 minutos

Falhas retornam `401` com:
- `MISSING_SIGNATURE_HEADERS`
- `INVALID_SHARED_TOKEN`
- `INVALID_SIGNATURE_FORMAT`
- `INVALID_TIMESTAMP`
- `STALE_TIMESTAMP`

No Hub backend, configure:
- `COMMERCIAL_DISPATCH_WEBHOOK_SIGNING_SECRET`
- `COMMERCIAL_DISPATCH_SHARED_TOKEN`

No n8n, configure o mesmo token:
- `DISPATCH_SHARED_TOKEN` (ou `COMMERCIAL_DISPATCH_SHARED_TOKEN`)

> Nota: validação criptográfica HMAC completa depende das permissões/recursos da instância n8n (Code sandbox).
## Evolução (recomendada)
Depois de validar:
- Inserir nós reais de envio (WhatsApp Cloud API / Gmail node)
- Validar assinatura HMAC completa no n8n (não só presença de header)
- Adicionar retry + dead-letter
- Adicionar notificação de falha (Slack/Telegram)
- Armazenar payload/sucesso/erro em banco observabilidade
