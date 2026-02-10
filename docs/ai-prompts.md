# AI Prompts Registry

Este documento lista os prompts de IA ativos no backend, com seus IDs, versões e finalidade.

## Prompts

- `copy-insights`
  - Version: `copy-v1`
  - Schema: `copy-insights-v1`
  - Owner: growth
  - Description: Analisa copy de criativo (Meta Ads) e sugere melhorias com foco em conversas no WhatsApp.

- `copy-generator`
  - Version: `copy-gen-v1`
  - Schema: `copy-gen-v1`
  - Owner: growth
  - Description: Gera variações de copy com base em winners e tema, priorizando conversas no WhatsApp.

- `weekly-summary`
  - Version: `weekly-summary-v1`
  - Schema: `weekly-summary-v1`
  - Owner: growth
  - Description: Resumo semanal objetivo para performance Meta Ads (jurídico), com highlights e próximos passos.

- `report-monthly`
  - Version: `report-monthly-v1`
  - Schema: `report-monthly-v1`
  - Owner: growth
  - Description: Relatório mensal simples e orientado a resultado para clientes jurídicos.

- `report-weekly`
  - Version: `report-weekly-v1`
  - Schema: `report-weekly-v1`
  - Owner: growth
  - Description: Relatório semanal simples e orientado a resultado para clientes jurídicos.

## Notas

- Os prompts são centralizados em `backend/src/services/ai-prompts/`.
- Cada execução deve persistir `promptId` e `promptVersion` junto ao resultado.
