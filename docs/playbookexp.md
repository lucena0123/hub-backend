# Playbook de Otimização — Documentação Completa

## Fluxo Geral

```
Regras (25) → Optimization Center (recomendações) → Propostas (filtro: pause/scale) → Aprovação → Execução Meta API
```

1. **Optimization Center** (`buildOptimizationCenter`) avalia todas as 25 regras contra dados de campanhas e criativos
2. **Gerar Propostas** filtra items com `action = pause | scale` que possuem `entity` (campanha ou criativo)
3. **Deduplicação**: pula se já existe proposta pendente/aprovada para o mesmo `entity + action + ruleId` nos últimos 7 dias
4. **Aprovação**: usuário revisa e aprova/rejeita cada proposta
5. **Execução**: proposta aprovada é executada via Meta Graph API (suporta `dryRun`)

### Ações Executáveis vs. Informativas

| Tipo | Ações | Gera proposta? | Executa na Meta? |
|------|-------|---------------|-----------------|
| **Executável** | `pause`, `scale` | Sim | Sim |
| **Informativa** | `review`, `track`, `sync`, `refresh` | Não | Não (ação manual) |

- `pause` → pausa anúncio por snapshot ID (`POST /{ad_id}?status=PAUSED`)
- `scale` → aumenta budget da campanha em 20% (`POST /{campaign_id}?daily_budget=...`)

---

## Thresholds Padrão (`defaults.ts`)

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `minSpendForEvaluation` | R$150 | Gasto mínimo para a campanha ser avaliada |
| `minContactsForEvaluation` | 10 | Contatos mínimos para comparação 7d vs 7d |
| `targetCplGoodMax` | R$10 | CPL considerado "bom" |
| `targetCplOkMax` | R$15 | CPL "ok" (acima = warning) |
| `targetCplBadMin` | R$20 | CPL "ruim" (acima = critical) |
| `cplRisePctWarning` | 40% | Subida de CPL que dispara alerta |
| `contactsDropPctWarning` | -50% | Queda de contatos que dispara alerta |
| `frequencyWarning` | 3x | Frequência que gera warning |
| `frequencyCritical` | 5x | Frequência que gera critical |
| `firstReplyRateMin` | 25% | Taxa mínima de 1ª resposta |
| `qualificationRateTargetMin` | 12% | Taxa mínima de qualificação |
| `creativeMinSpendWinner` | R$50 | Gasto mínimo para criativo ser "winner" |
| `creativeMinSpendLoser` | R$200 | Gasto mínimo para criativo ser "loser" |
| `creativeWinnerPercentile` | 0.2 | Top 20% por CPL = winner |
| `creativeWinnerMaxCount` | 5 | Máximo de winners reportados |
| `creativeLoserCplMultiplier` | 2x | CPL ≥ 2x mediana = loser |
| `creativeLoserMaxConversations` | 3 | Conversas ≤ 3 com alto gasto = loser |
| `creativeFatigueDropPct` | -50% | Queda de conversas para fadiga |
| `creativeFatigueCplMultiplier` | 1.5x | Subida de CPL para fadiga |
| `creativeFatigueMinPrevConversations` | 10 | Mínimo de conversas anteriores |
| `creativeFatigueMinSpend` | R$100 | Gasto mínimo para avaliar fadiga |
| `copyHeadlineMinChars` | 18 | Headline mínimo de caracteres |
| `copyHeadlineMaxChars` | 60 | Headline máximo de caracteres |
| `copyPrimaryTextMaxChars` | 220 | Primary text máximo |
| `hookRateMin` | 15% | Hook rate mínimo (vídeos) |
| `holdRateMin` | 25% | Hold rate mínimo (vídeos) |

---

## Temas com Thresholds Customizados

| Tema | Key | CPL Bom | CPL OK | CPL Ruim | Qualif. | 1ª Resposta |
|------|-----|---------|--------|----------|---------|-------------|
| **Geral** (fallback) | `geral` | ≤R$10 | ≤R$15 | ≥R$20 | ≥12% | ≥25% |
| **Trabalhista** | `trabalhista` | ≤R$12 | ≤R$18 | ≥R$25 | ≥12% | ≥28% |
| **Passageiro Aéreo** | `passageiro_aereo` | ≤R$9 | ≤R$14 | ≥R$20 | ≥10% | ≥25% |
| **Salário Maternidade** | `salario_maternidade` | ≤R$11 | ≤R$16 | ≥R$23 | ≥14% | ≥28% |

### Detecção de Tema

O tema é inferido automaticamente pelo nome da campanha:

1. **Tags entre colchetes**: `[TRABALHISTA]` no nome → tema `trabalhista`
2. **Keywords**: se o nome contém "trabalh", "rescis", "demiss" etc. → tema `trabalhista`
3. **Fallback**: se nenhum padrão casa → tema `geral`

### Overrides por Cliente (novo)

Clientes podem ter thresholds customizados via coluna `optimization_targets` (JSONB) na tabela `clients`.

Exemplo: `{ "targetCplGoodMax": 15, "targetCplOkMax": 22 }`

Prioridade: `defaults < tema < cliente`

---

## As 25 Regras

### Regras de Campanha (9)

| # | ID | Severidade | Ação | Condição |
|---|-----|-----------|------|----------|
| 1 | `campaign.stalled` | warning | review | Campanha ACTIVE sem impressões e sem gasto nos últimos 7 dias |
| 2 | `campaign.no-contacts` | critical | pause | Gasto ≥ minSpend, impressões > 0, mas 0 contatos nos 7d |
| 3 | `campaign.contacts-drop` | warning | review | Queda ≥ 50% contatos (7d vs 7d anterior), mín. 10 contatos prev |
| 4 | `campaign.cpl-rise` | warning | review | CPL subiu ≥ 40% vs semana anterior |
| 5 | `campaign.cpl-above-ok` | warning | review | CPL entre "ok" e "ruim" (ex: R$15–R$20) |
| 6 | `campaign.cpl-high` | critical | pause | CPL ≥ limite "ruim" (ex: ≥ R$20) |
| 7 | `campaign.frequency-high` | warning/critical | review | Frequência ≥ 3x (warning) ou ≥ 5x (critical) |
| 8 | `campaign.first-reply-low` | warning | review | Taxa 1ª resposta < 25%, com messaging > 0 |
| 9 | `campaign.scale-opportunity` | opportunity | scale | CPL "bom" + (contatos ↑ ≥20% ou CPL ↓ ≥20%) |

### Regras de Qualificação (3)

| # | ID | Severidade | Ação | Condição |
|---|-----|-----------|------|----------|
| 10 | `qualification.missing` | info | track | Contatos nos 7d mas sem registros de lead tracking |
| 11 | `qualification.zero` | critical | review | Tem tracking preenchido mas 0 qualificados |
| 12 | `qualification.low` | warning | review | Taxa qualificação < 12% (recordsLast7 > 0) |

### Regras de Criativo (13)

| # | ID | Severidade | Ação | Condição |
|---|-----|-----------|------|----------|
| 13 | `creative.winner` | opportunity | scale | Top 20% CPL, gasto ≥ R$50, CPL ≤ target bom |
| 14 | `creative.loser` | warning | pause | Gasto ≥ R$200, CPL ≥ 2x mediana ou ≤ 3 conversas |
| 15 | `creative.fatigued` | warning | refresh | Queda ≥ 50% conversas 7d vs 7d anterior |
| 16 | `creative.video-hook-low` | warning | refresh | Hook rate < 15% (vídeos) |
| 17 | `creative.video-hold-low` | warning | refresh | Hold rate < 25% (vídeos) |
| 18 | `creative.copy-insights-missing` | info | sync | Criativo com gasto ≥ R$50 sem copy insights |
| 19 | `creative.copy-missing-headline` | warning | review | Criativo sem headline (não-dinâmico, gasto > 0) |
| 20 | `creative.copy-headline-length` | info | review | Headline < 18 ou > 60 caracteres |
| 21 | `creative.copy-primary-too-long` | info | review | Primary text > 220 caracteres |
| 22 | `creative.copy-cta-mismatch` | warning | review | CTA não está na lista preferida (WHATSAPP_MESSAGE, SEND_MESSAGE) |
| 23 | `creative.copy-theme-not-mentioned` | info | review | Tema detectado mas keywords não mencionadas no copy |
| 24 | `creative.copy-compliance-risk` | warning | review | Contém frases proibidas no texto |
| 25 | `data.no-creatives` | info | sync | Nenhum criativo encontrado para o cliente/campanha |

---

## Arquitetura

```
handler.ts (buildOptimizationCenter)
  ├── Queries SQL (campanhas, criativos, lead tracking, reasons)
  ├── Detecção de tema (inferOptimizationTheme)
  ├── Resolução de thresholds (defaults → tema → cliente)
  ├── Scoring de criativos (scoreCreatives → winners/losers/fatigued)
  └── Avaliação de regras (evaluateOptimizationCenterRules)
       └── 25 módulos em engine/rules/*.ts

action-proposals.routes.ts
  ├── POST /generate → filtra items com action=pause|scale, cria propostas
  ├── POST /:id/approve → aprova proposta
  ├── POST /:id/reject → rejeita proposta
  └── POST /:id/execute → executa via Meta API
       ├── pause → metaService.setAdStatus(PAUSED)
       └── scale → metaService.setCampaignDailyBudget(+20%)
```

### Arquivos Principais

| Arquivo | Responsabilidade |
|---------|-----------------|
| `engine/registry.ts` | Lista e executa todas as 25 regras |
| `engine/types.ts` | Types: `OptimizationRuleContext`, `OptimizationItem`, `OptimizationRuleModule` |
| `engine/campaign-facts.ts` | Extrai fatos de cada campanha (spend, CPL, contacts, frequency etc.) |
| `engine/rules/*.ts` | 25 módulos individuais de regra |
| `v1/defaults.ts` | Thresholds padrão |
| `v1/themes.ts` | 4 temas com overrides de threshold |
| `theme.ts` | `inferOptimizationTheme()` + `getOptimizationTargetsForTheme()` |
| `handler.ts` | Orquestra queries, tema, scoring e avaliação |
| `action-proposals.routes.ts` | CRUD de propostas + execução Meta API |
| `meta-ads/service.ts` | Métodos de write-back: `setAdStatus`, `setCampaignDailyBudget` |
