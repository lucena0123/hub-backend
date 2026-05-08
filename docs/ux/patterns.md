# UX Patterns — Hub B2B

> Padrões de interação reutilizáveis. Use sempre o padrão correto para o contexto.

---

## Padrão 1: Priority Queue (Fila de Decisão)

**Quando usar:** Listas de tarefas, alertas, intervenções, itens que exigem ação humana.

**Estrutura:**
```
━━ CRÍTICO (N) ━━━━━━━━━━━━━━━━━━━━━━
  [item] [ação primária] [ação secundária]
  [item] [ação primária] [ação secundária]

━━ ATENÇÃO (N) ━━━━━━━━━━━━━━━━━━━━━━
  [item] [ação]
  ...

━━ NORMAL (N) ━━━━━━━━━━━━━━━━━━━━━━━
  [item]
  ...
```

**Regras:**
- Críticos SEMPRE primeiro
- Separadores visuais com ícone + label + count + linha horizontal
- Cada item: resumo em 1 linha, máx 2 ações contextuais
- Sem detalhes técnicos — só o necessário para decidir
- Se grupo tem 0 itens, o separador some (`null`)
- Implementar com `SeveritySection`

---

## Padrão 2: Progressive Disclosure (Expandir sob Demanda)

**Quando usar:** Detalhes técnicos, histórico, logs, métricas secundárias, IA outputs.

**Níveis de disclosure:**

| Nível | Trigger | Conteúdo |
|-------|---------|----------|
| 1 — Resumo | Sempre visível | Status + valor principal + 1 ação |
| 2 — Expandido | Click no card/botão | Detalhes do item, contexto |
| 3 — Drawer/Modal | Click em "Ver mais" | Análise completa, histórico |
| 4 — Tela própria | Link de navegação | Dashboard completo do item |

**Regras:**
- Nível 1 é suficiente para 80% das decisões
- Nível 2 via `ExpandableSection` — `defaultOpen={false}`
- Nível 3 via drawer lateral (preferido a modal)
- Nível 4 via navegação — nunca duplicar uma tela completa dentro de outra
- Nunca abrir accordion/modal sem ação do usuário

---

## Padrão 3: Operational Health Grid

**Quando usar:** Visão executiva de múltiplos clientes ou entidades.

**Estrutura por card:**
```
┌─────────────────────────────────┐
│ [Grade] Nome do Cliente    [Tier]│  ← header: sempre visível
│ R$12.4k · 48 conv · CPL R$258  │  ← métricas resumidas em 1 linha
│ ⚠ 2 anomalias · 1 pendente     │  ← alertas inline
│ [Ação primária]  [Ação sec]     │  ← ações contextuais
└─────────────────────────────────┘
```

**Regras:**
- Grade A-F deve ser visualmente dominante no card
- Ordenar: F → E → D → C → B → A (piores primeiro)
- Separar visualmente: em risco (D-F) vs saudáveis (A-C)
- Máx 2 ações por card
- Implementar com `OperationalHealthCard`

---

## Padrão 4: Compact Filter Bar

**Quando usar:** Listas filtráveis com 3+ categorias.

**Estrutura:**
```
[Todos] [Cat 1] [Cat 2] [Cat 3] [Cat 4] [Cat 5] ...
```

**Regras:**
- Botões horizontais, overflow-x-auto para muitas categorias
- Item ativo: `bg-primary text-primary-foreground` — visualmente claro
- Item inativo: `bg-card border text-muted-foreground`
- Nunca usar `SectionHeader` separado só para filtros
- Não combinar filtros de categoria + filtros de período no mesmo bar — separar visualmente
- Incluir contagem quando relevante: `[ROAS (3)]`

---

## Padrão 5: Expandable Detail

**Quando usar:** Detalhes técnicos de um item (logs, parâmetros, histórico de execução).

**Estrutura:**
```
[▼] Detalhes técnicos          ← toggle header sempre visível
  ┌──────────────────────┐
  │ Parâmetro: valor     │     ← conteúdo colapsado por padrão
  │ Histórico: ...       │
  └──────────────────────┘
```

**Regras:**
- `defaultOpen={false}` em todos os casos (progressive disclosure)
- Header deve ter o resumo do conteúdo (ex: "3 execuções anteriores")
- Animação suave: 150-200ms ease-out
- Implementar com `ExpandableSection`

---

## Padrão 6: Context Action Bar

**Quando usar:** Ações em lote quando há seleção múltipla.

**Estrutura:**
```
[3 selecionados]  [Aprovar todos] [Ignorar todos] [✕]
```

**Regras:**
- Aparece somente quando há ≥1 item selecionado
- Fica no topo da lista (sticky)
- Desaparece quando seleção é limpa
- Nunca mostrar por padrão sem seleção ativa

---

## Padrão 7: Inline Status Update

**Quando usar:** Mudar status de um item sem abrir modal.

**Fluxo:**
1. Usuário clica em ação (ex: "Aprovar")
2. Botão entra em loading (`disabled`, spinner)
3. Após sucesso: item atualiza status visualmente (cor, badge)
4. Após erro: toast de erro, botão volta ao estado original

**Regras:**
- Nunca bloquear a lista inteira durante uma ação individual
- Loading state deve ser no item, não na página
- Sucesso/erro: toast com duração 3-4s
- Não usar modal de confirmação para ações não-destrutivas

---

## Padrão 8: Kanban Column

**Quando usar:** Pipeline com estados sequenciais (leads, otimizações).

**Regras:**
- Máx 7 colunas no Kanban horizontal
- Cada coluna: header com nome + contagem + ação de coluna
- Cards: título + status + 1 ação
- Sem detalhes expandidos dentro do card do Kanban (abrir drawer)
- Indicador visual de "pode ser dropado aqui" durante drag

---

## Padrão 9: Metric Strip

**Quando usar:** KPIs resumidos no topo de uma tela ou seção.

**Estrutura:**
```
[KPI 1: valor ▲+12%] [KPI 2: valor ▼-3%] [KPI 3: valor] [KPI 4: valor]
```

**Regras:**
- Máx 4 KPIs no strip
- Valores com delta quando disponível
- Sem labels verbose — label curta + valor grande
- Implementar com `KpiCard` (compacto) ou `MetricSummary` (inline)

---

## Padrão 10: Empty & Error States

**Quando usar:** Sempre que uma lista ou conteúdo está vazio ou com erro.

### Empty State
```
      [ícone]
  Nenhum item
Subtítulo explicativo.
   [Ação opcional]
```

**Regras:**
- Ícone Lucide relevante ao contexto
- Título: o que está vazio (ex: "Nenhum alerta ativo")
- Subtítulo: por que ou o que fazer (ex: "Tudo operando normalmente.")
- Ação: só quando há algo a fazer (ex: "Criar tarefa")
- Implementar com `EmptyState`

### Error State
```
    [AlertOctagon]
  Falha ao carregar
  mensagem técnica
  [Tentar novamente]
```

**Regras:**
- Sempre dentro do layout da página (`PageShell`) — nunca tela inteira
- Botão de retry obrigatório quando aplicável
- Não mostrar stack trace ao usuário
- Implementar com `ErrorState`
