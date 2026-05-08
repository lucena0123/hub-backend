# Component Architecture — Hub B2B

> Catálogo de componentes UX: existentes, novos e suas responsabilidades.

---

## Princípio de Arquitetura

Cada componente tem **uma responsabilidade clara**. Componentes não conhecem a tela em que vivem — recebem dados e emitem eventos.

Hierarquia:
```
Tela (page.tsx)
  └── Layout (PageShell, Topbar)
       └── Seção (SeveritySection, SectionBlock)
            └── Item (AlertCard, TaskDecisionCard, OperationalHealthCard)
                 └── Primitivo (StatusPill, Badge, Button)
```

---

## Componentes Existentes — Reutilizar

### Layout
| Componente | Arquivo | Uso |
|-----------|---------|-----|
| `PageShell` | `components/layout/page-shell.tsx` | Wrapper de página com Topbar + meta + children |
| `Topbar` | `components/layout/topbar.tsx` | Eyebrow + title + actions slot |
| `Reveal` | `components/layout/reveal.tsx` | Animação de entrada progressiva |
| `Breadcrumb` | `components/layout/breadcrumb.tsx` | Navegação hierárquica |

### UI Base
| Componente | Arquivo | Uso |
|-----------|---------|-----|
| `Card`, `CardHeader`, `CardContent` | `components/ui/card.tsx` | Container de card padrão |
| `Badge` | `components/ui/badge.tsx` | Label pequena com variantes (outline, destructive) |
| `Button` | `components/ui/button.tsx` | Ação com variantes (default, outline, ghost, destructive) |
| `Input` | `components/ui/input.tsx` | Campo de texto |
| `Select` | `components/ui/select.tsx` | Dropdown de seleção |
| `Tabs`, `TabsList`, `TabsContent` | `components/ui/tabs.tsx` | Navegação por abas |
| `Skeleton`, `SkeletonMetric`, `SkeletonRow` | `components/ui/skeleton.tsx` | Placeholders de loading |
| `Dialog` | `components/ui/dialog.tsx` | Modal padrão |

### Domínio
| Componente | Arquivo | Uso |
|-----------|---------|-----|
| `AlertCard` | `components/alerts/alert-card.tsx` | Card compacto de alerta com borda de severidade |
| `KpiCard` | `components/dashboard/kpi-card.tsx` | Card KPI 32px com delta e sparkline |
| `MiniMetric` | `components/dashboard/mini-metric.tsx` | Métrica compacta com ícone colorido |
| `CompareBanner` | `components/dashboard/compare-banner.tsx` | Banner gradient com CTA |
| `SectionHeader` | `components/performance/section-header.tsx` | Header de seção com ícone e ação |

---

## Componentes Novos — Criar por Fase

### Fase 1 (concluída)
| Componente | Arquivo | Status |
|-----------|---------|--------|
| `StatusPill` | `components/ui/status-pill.tsx` | ✅ Criado |

### Fase 2 — Foundation Components
Criar antes de refatorar /tasks e /executive:

| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| `EmptyState` | `components/ui/empty-state.tsx` | Estado vazio padronizado com ícone, título, subtítulo e ação opcional |
| `ErrorState` | `components/ui/error-state.tsx` | Estado de erro com mensagem e ação de retry |
| `LoadingState` | `components/ui/loading-state.tsx` | Skeleton contextual por tipo de conteúdo |
| `ExpandableSection` | `components/ui/expandable-section.tsx` | Accordion reutilizável: header sempre visível, body toggle |

### Fase 3 — Operational Components
Criar junto com refatoração das telas críticas:

| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| `TaskDecisionCard` | `components/dashboard/task-decision-card.tsx` | Card de decisão: resumo 1 linha + 2 ações + detalhe expandível |
| `PriorityQueue` | `components/dashboard/priority-queue.tsx` | Lista ordenada por severidade com separadores visuais |
| `OperationalHealthCard` | `components/dashboard/operational-health-card.tsx` | Card de saúde por cliente: grade A-F + métricas + ações |
| `EventTimeline` | `components/dashboard/event-timeline.tsx` | Timeline de eventos agrupados por data |
| `SeveritySection` | `components/ui/severity-section.tsx` | Wrapper de grupo por severidade com separador |

### Fase 4 — Analysis Components
| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| `InsightPanel` | `components/dashboard/insight-panel.tsx` | Painel colapsável de IA/insights com expand |
| `MetricSummary` | `components/dashboard/metric-summary.tsx` | Resumo inline de métricas (substituir SectionHeader em alguns contextos) |
| `ClientCampaignCard` | `components/dashboard/client-campaign-card.tsx` | Card de cliente+campanha com status e ação direta |

---

## Especificações de Interface

### `EmptyState`
```tsx
interface EmptyStateProps {
  icon?: React.ElementType;     // ícone Lucide
  title: string;                // "Nenhum alerta"
  description?: string;         // "Tudo operando normalmente."
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

### `ErrorState`
```tsx
interface ErrorStateProps {
  message: string;              // mensagem de erro
  onRetry?: () => void;         // ação de retry
  className?: string;
}
```

### `ExpandableSection`
```tsx
interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  defaultOpen?: boolean;        // false por padrão (progressive disclosure)
  badge?: React.ReactNode;      // count badge, StatusPill, etc.
  children: React.ReactNode;
  className?: string;
}
```

### `TaskDecisionCard`
```tsx
interface TaskDecisionCardProps {
  title: string;                // nome da tarefa em 1 linha
  client?: string;              // nome do cliente
  severity: 'critical' | 'high' | 'medium' | 'low';
  description?: string;         // detalhe expandível
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  status?: 'pending' | 'completed' | 'failed';
  meta?: React.ReactNode;       // slot livre para chips adicionais
}
```

### `SeveritySection`
```tsx
interface SeveritySectionProps {
  label: string;                // "Crítico", "Atenção", "Info"
  count: number;                // total de itens — retorna null se 0
  icon: React.ElementType;
  iconClass: string;
  children: React.ReactNode;
}
```

---

## Regras de Composição

1. **`PageShell` é obrigatório** em toda tela — nunca montar layout manual
2. **`StatusPill` é obrigatório** para qualquer indicador de status — nunca usar `signal-chip` ou badges manuais
3. **`EmptyState` é obrigatório** para listas/filas vazias — nunca usar `<div>` com texto inline
4. **`ExpandableSection` > accordion manual** — não reinventar comportamento de expand/collapse
5. **`SeveritySection` para agrupamentos** — nunca separar grupos com apenas texto ou `<hr>`

---

## O que NÃO criar

- Componentes que duplicam shadcn/ui (botão, input, select)
- Componentes específicos demais que não podem ser reutilizados em 2+ telas
- Componentes com lógica de API interna — dados vêm de props
- Wrappers desnecessários que adicionam apenas uma classe CSS
