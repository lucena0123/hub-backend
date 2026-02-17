# Ciclo Real de Operação Assistida (v1)

Início: 2026-02-17
Janela inicial: 24-48h
Objetivo: validar regras em execução real e classificar por impacto (`manter` / `ajustar` / `desligar`).

## Baseline de entrada (T0)

- Tasks totais: `0`
- Configuração de regras por cliente:
  - `3408c38a-6f3b-4d10-a65b-15b5fd9dee72` → `8` regras calibradas
  - `1a233d17-d0e9-49c9-9135-f8efcf032c05` → `9` regras calibradas (inclui `data.no-creatives`)
- Distribuição temática de campanhas:
  - `trabalhista`: `4`
  - `salario_maternidade`: `3`
  - `passageiro_aereo`: `2`
  - `geral`: `1`
- Auditoria (últimas 24h):
  - Cliente `3408...ee72`: `client.update = 3`
  - Cliente `1a23...2c05`: sem eventos relevantes no recorte

## Critério de classificação (após janela)

Para cada regra crítica:
- **Manter**: gera ação útil com baixo ruído
- **Ajustar**: útil, mas com threshold sensível (falso positivo/negativo)
- **Desligar**: sem valor prático no contexto atual

## Regras foco (rodada 1)

1. `campaign.no-contacts`
2. `campaign.cpl-high`
3. `campaign.frequency-high`
4. `campaign.first-reply-low`
5. `adset.no-contacts`
6. `qualification.zero`
7. `creative.fatigued`
8. `creative.loser`

## Método de acompanhamento

- Checkpoint operacional curto (a cada 5 min quando em execução ativa)
- Revisão de auditoria por cliente (24h / 48h)
- Revisão de tasks por status/regra
- Ajustes incrementais com evidência

## Saída esperada ao fim da janela

- Matriz v2 final por cliente/tema
- Lista de regras `manter/ajustar/desligar`
- Changelog de ajustes e impacto observado
