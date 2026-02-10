# Playbook de Otimização (Optimization Center)

> **Documentação Oficial das Regras de Otimização**
> Localização no Código: `backend/src/services/optimization-playbook/`

## 1. Visão Geral
O Optimization Center avalia diariamente o desempenho das campanhas e criativos, gerando propostas de ação (pausar, escalar, atualizar) baseadas em regras pré-definidas.

**Fluxo de Execução:**
1. **Coleta de Dados:** Métricas dos últimos 7 dias (Spend, CPL, CTR, Frequency).
2. **Inferência de Tema:** Identifica o nicho da campanha (ex: Trabalhista, Aéreo).
3. **Avaliação de Regras:** Aplica 25 regras contra os dados coletados.
4. **Geração de Propostas:** Cria ações (`pause`, `scale`, `review`) para aprovação humana.
5. **Execução:** Aplica alterações via Meta Graph API após aprovação.

**Detecção de Tema (prioridade):**
1. **Override manual por campanha**: `campaigns.optimization_theme_key` (e opcional `optimization_subtheme_key`).
2. **Tag no nome da campanha**: ex. `[TRABALHISTA]`.
3. **Keywords no nome da campanha** (definidas em `themes.ts`).
4. **Fallback**: tema `geral`.

---

## 2. Estrutura de Thresholds (Limites)
Os limites de métricas (CPL, Frequência) são definidos por **Tema**.

| Parâmetro | Geral (Default) | Trabalhista | Aéreo | Salário Maternidade |
| :--- | :--- | :--- | :--- | :--- |
| **CPL Bom** | ≤ R$10 | ≤ R$12 | ≤ R$9 | ≤ R$11 |
| **CPL Ruim** | ≥ R$20 | ≥ R$25 | ≥ R$20 | ≥ R$23 |
| **Qualificação Mín** | 12% | 12% | 10% | 14% |
| **1ª Resposta Mín** | 25% | 28% | 25% | 28% |

> **Nota:** Clientes podem ter overrides específicos via `optimization_targets` no banco de dados.

---

## 3. Regras de Otimização (25 Regras)

### 3.1 Regras de Campanha (Budget & Status)
| ID | Severidade | Ação | Condição Gatilho |
| :--- | :--- | :--- | :--- |
| `campaign.stalled` | warning | review | Ativa mas sem gasto/impressões (7d). |
| `campaign.no-contacts` | critical | pause | Gasto > R$150 mas 0 contatos. |
| `campaign.contacts-drop` | warning | review | Queda ≥ 50% em contatos vs semana anterior. |
| `campaign.cpl-rise` | warning | review | CPL subiu ≥ 40% vs semana anterior. |
| `campaign.cpl-high` | critical | pause | CPL acima do limite "Ruim". |
| `campaign.frequency-high` | critical | review | Frequência ≥ 5x. |
| `campaign.scale-opportunity` | opportunity | scale | CPL "Bom" + Tendência de melhora. |

### 3.2 Regras de Criativo (Ads)
| ID | Severidade | Ação | Condição Gatilho |
| :--- | :--- | :--- | :--- |
| `creative.winner` | opportunity | scale | Top 20% CPL, Gasto > R$50. |
| `creative.loser` | warning | pause | CPL ≥ 2x Mediana ou Gasto Alto s/ Conversão. |
| `creative.fatigued` | warning | refresh | Queda ≥ 50% nas conversas (Fadiga). |
| `creative.video-hook-low` | warning | refresh | Hook Rate < 15% (Vídeos). |

### 3.3 Regras de Copy & Compliance (Creative Linter)
| ID | Severidade | Ação | Condição Gatilho |
| :--- | :--- | :--- | :--- |
| `copy-compliance-risk` | error | review | Termos proibidos ("Garantido", "Causa Ganha"). |
| `copy-missing-headline` | error | review | Anúncio sem headline. |
| `copy-cta-mismatch` | info | review | CTA diferente de WHATSAPP/SEND_MESSAGE. |

---

## 4. Integração Técnica
- **Engine:** `backend/src/services/optimization-playbook/engine/`
- **Regras:** `backend/src/services/optimization-playbook/engine/rules/`
- **Linter:** `backend/src/services/creative-linter.ts`
- **API:** `POST /api/actions/execute` (Executa pausa/escala na Meta)

## 5. Gestão de Regras (UI)
Agora existe uma aba **Playbook** dentro de **Clientes > Optimization** para:
- **Cadastrar regras customizadas** (metadados) diretamente pela UI.
- **Ativar/desativar regras por cliente**.
- **Editar inputs** (parâmetros por cliente) e validar JSON básico.
- **Visualizar condição, severidade e ação** de cada regra.
- **Aplicar templates inteligentes** (pré-preenchimento de condição, severidade, ação e parâmetros).

### 5.1 Condição Executável (JSON Logic)
Regras customizadas podem **executar automaticamente** quando a condição for informada em **JSON Logic**.
Se a condição for apenas texto livre, a regra não será avaliada automaticamente.

**Exemplo (campanha):**
```json
{
  "<": [
    { "var": "metrics.cplLast7" },
    { "var": "thresholds.targetCplBadMin" }
  ]
}
```

**Contexto disponível (principais):**
- `metrics.*` (ex: `spendLast7`, `conversationsLast7`, `cplLast7`, `avgFrequencyLast7`, etc)
- `thresholds.*` (targets do tema)
- `params.*` (parâmetros por cliente)
- `entity.*` (id, nome, tipo)
- `theme.*` (quando aplicável)

**Campos comuns por nível:**
- **Campaign**
  - `metrics.spendLast7`, `metrics.contactsLast7`, `metrics.costPerContact`, `metrics.firstReplyRate`, `metrics.cplChange`
  - `thresholds.targetCplBadMin`, `thresholds.frequencyWarning`, `thresholds.firstReplyRateMin`
- **Creative**
  - `metrics.spendLast7`, `metrics.conversationsLast7`, `metrics.cplLast7`, `metrics.hookRateAvg`
  - `attributes.isVideo`, `attributes.isDynamic`, `attributes.ctaType`
- **Adset**
  - `metrics.spendLast7`, `metrics.conversationsLast7`, `metrics.cplLast7`, `metrics.avgFrequencyLast7`

> **Nota:** regras do engine (TypeScript) continuam sendo o caminho recomendado para lógica complexa e ações automáticas. JSON Logic é útil para regras simples e rápidas.

## 6. Comandos Úteis
```bash
# Rodar testes do gerador de tarefas
npm test backend/src/services/optimization-playbook/task-generator.test.ts

# Forçar geração de tarefas (via API)
curl -X POST http://localhost:3001/api/tasks/generate -d '{"clientId": "ID"}'

# Backfill de tema nas campanhas (usa inferência por nome)
node dist/scripts/backfill-campaign-themes.js
```
