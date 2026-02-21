# Próximo Bloco — Agenda por Disponibilidade (Google Calendar)

Objetivo: habilitar no Hub o agendamento por disponibilidade real (slots livres) e confirmação de reunião com `eventId` auditável.

## Pré-requisitos (ambiente)
No n8n, configurar:
- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID` (ex.: `primary`)

## Escopo da implementação
1. Endpoint backend para solicitar slots disponíveis por lead/data.
2. Endpoint backend para confirmar slot e criar evento.
3. Integração n8n com Google Calendar:
   - consulta free/busy
   - criação de evento
   - retorno de `externalEventId`/`eventId`
4. UI no `/comercial`:
   - botão “Agendar reunião”
   - lista de slots
   - confirmação
   - registro em timeline

## Critérios de aceite
- Selecionar lead e ver slots disponíveis reais.
- Confirmar slot e receber `eventId`.
- Timeline exibe evento de calendário e horário confirmado.
- Falha de API retorna erro amigável na UI.

## Observações
- Deixar timezone fixo em `America/Sao_Paulo` para evitar desvio de horário.
- Registrar no evento payload mínimo: `calendarId`, `start`, `end`, `attendee`.
