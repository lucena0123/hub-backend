# UX Refactor — /tasks (Fase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a tela `/tasks` de grid de cards sem hierarquia em uma fila de decisão operacional agrupada por severidade, com progressive disclosure e ação contextual clara por tarefa.

**Architecture:** Criar 3 componentes novos (EmptyState, ExpandableSection, TaskDecisionCard) e depois reestruturar a página. A lógica de negócio (`getOptimizationTasks`, `executeOptimizationAction`, todos os `useState`/`useMemo`) fica **100% intocada**. `TaskDecisionCard` substitui visualmente o `TaskActionCard` — a lógica de execução de ação migra para dentro do novo componente.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Tailwind CSS v4, Lucide React, shadcn/ui. Referência: `docs/ux/ux-system.md`, `docs/ux/patterns.md`, `docs/ux/anti-patterns.md`.

---

## Contexto do domínio

```ts
interface Task {
  id: string;
  taskId: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'suspended';
  priority: number;
  input?: {
    description?: string;
    severity?: string;           // 'critical' | 'high' | 'medium' | 'low'
    autoAction?: OptimizationActionPayload;
    [key: string]: unknown;
  };
  clientName?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Mapeamento de severidade → visual:**
| `input.severity` | `StatusPillStatus` | Cor de borda |
|-----------------|-------------------|--------------|
| `'critical'` | `'critical'` | `border-l-destructive` |
| `'high'` | `'warning'` | `border-l-amber-500` |
| `'medium'` | `'pending'` | `border-l-border` |
| `'low'` | `'info'` | `border-l-primary/50` |

**Ordem de grupos na fila:** critical → high → medium → low

**O que NÃO muda:**
- `getOptimizationTasks()` em `lib/api/optimization.ts`
- `executeOptimizationAction()` em `lib/api/optimization.ts`
- `useState`, `useMemo`, `fetchTasks`, `clientOptions`, `filteredTasks` em `tasks/page.tsx`
- Filtros de query/client/severity — lógica intacta

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `frontend/components/ui/empty-state.tsx` | Criar | Estado vazio padronizado com ícone, título, subtítulo, ação opcional |
| `frontend/components/ui/expandable-section.tsx` | Criar | Accordion reutilizável com header + body colapsável |
| `frontend/components/dashboard/task-decision-card.tsx` | Criar | Card de decisão compacto com borda de severidade + ação + detalhe colapsável |
| `frontend/app/tasks/page.tsx` | Modificar | Estrutura visual: fila por severidade, StatusPill, EmptyState, skeleton |

---

## Task 1: Criar EmptyState

**Files:**
- Create: `frontend/components/ui/empty-state.tsx`

**Risco:** ZERO — arquivo novo.

- [ ] **Step 1.1 — Criar o arquivo**

Criar `E:\hub-backend\frontend\components\ui\empty-state.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';
import { InboxIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && (
        <Button
          size="sm"
          variant="outline"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 1.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 1.3 — Commit**

```bash
cd E:\hub-backend\frontend
git add components/ui/empty-state.tsx
git commit -m "feat(ui): add EmptyState component — standardized empty content placeholder"
```

---

## Task 2: Criar ExpandableSection

**Files:**
- Create: `frontend/components/ui/expandable-section.tsx`

**Risco:** ZERO — arquivo novo.

- [ ] **Step 2.1 — Criar o arquivo**

Criar `E:\hub-backend\frontend\components\ui\expandable-section.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ExpandableSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  className,
  children,
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-lg border border-border/60 overflow-hidden', className)}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors hover:bg-muted/30 cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-foreground truncate">{title}</span>
          {subtitle && (
            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
              {subtitle}
            </span>
          )}
          {badge && <span className="flex-shrink-0">{badge}</span>}
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 2.3 — Commit**

```bash
cd E:\hub-backend\frontend
git add components/ui/expandable-section.tsx
git commit -m "feat(ui): add ExpandableSection accordion component"
```

---

## Task 3: Criar TaskDecisionCard

**Files:**
- Create: `frontend/components/dashboard/task-decision-card.tsx`

**Risco:** BAIXO — arquivo novo. Contém a lógica de execução migrada do `TaskActionCard` (preservando o comportamento de `executeOptimizationAction` com `dryRun: true`).

**O que muda vs TaskActionCard:**
- Layout compacto com borda esquerda de severidade
- Descrição em `ExpandableSection` (colapsada por padrão)
- 1 ação primária clara + dismiss secundário
- `StatusPill` para severidade (não Badge com cor hardcoded)
- Loading no botão, não na página

**O que é preservado:**
- `executeOptimizationAction()` chamada idêntica (incluindo `dryRun: true` e tokens mock — não alterar essa lógica)
- Props `task: Task` e `onActionComplete` idênticos ao `TaskActionCard`
- Mesmo comportamento de sucesso/erro

- [ ] **Step 3.1 — Criar o arquivo**

Criar `E:\hub-backend\frontend\components\dashboard\task-decision-card.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Pause, Play, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/status-pill';
import { ExpandableSection } from '@/components/ui/expandable-section';
import { executeOptimizationAction } from '@/lib/api/optimization';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import type { StatusPillStatus } from '@/components/ui/status-pill';

interface TaskDecisionCardProps {
  task: Task;
  onActionComplete: (message?: string) => void;
}

const severityMap: Record<string, { pillStatus: StatusPillStatus; borderClass: string }> = {
  critical: { pillStatus: 'critical', borderClass: 'border-l-destructive' },
  high:     { pillStatus: 'warning',  borderClass: 'border-l-amber-500' },
  medium:   { pillStatus: 'pending',  borderClass: 'border-l-border' },
  low:      { pillStatus: 'info',     borderClass: 'border-l-primary/50' },
};

const getActionIcon = (type?: string) => {
  switch (type) {
    case 'pause_ad':           return <Pause className="h-3.5 w-3.5" />;
    case 'resume_ad':          return <Play className="h-3.5 w-3.5" />;
    case 'set_adset_budget':
    case 'set_campaign_budget': return <DollarSign className="h-3.5 w-3.5" />;
    default:                   return <AlertTriangle className="h-3.5 w-3.5" />;
  }
};

const getActionLabel = (type?: string, amount?: number | string) => {
  switch (type) {
    case 'pause_ad':            return 'Pausar anúncio';
    case 'resume_ad':           return 'Retomar anúncio';
    case 'set_adset_budget':
    case 'set_campaign_budget': return `Ajustar orçamento${amount ? ` → ${amount}` : ''}`;
    default:                    return 'Executar ação';
  }
};

export function TaskDecisionCard({ task, onActionComplete }: TaskDecisionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const severity = task.input?.severity ?? 'medium';
  const { pillStatus, borderClass } = severityMap[severity] ?? severityMap.medium;
  const action = task.input?.autoAction;
  const isCompleted = task.status === 'completed';

  const handleAction = async () => {
    if (!action) return;
    try {
      setLoading(true);
      setError(null);
      await executeOptimizationAction({
        type: action.type,
        entityId: action.entityId,
        amount: action.amount,
        reason: task.name,
        accessToken: 'mock_token_from_frontend',
        adAccountId: 'act_mock_account',
        dryRun: true,
      });
      onActionComplete(`Ação executada: ${task.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao executar ação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 border-l-[3px] transition-colors',
        borderClass,
        isCompleted && 'opacity-60'
      )}
    >
      <div className="flex-1 min-w-0 space-y-2">
        {/* Row 1: name + client + severity */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate flex-1 min-w-0">
            {task.name}
          </span>
          {task.clientName && (
            <span className="text-[11px] text-muted-foreground flex-shrink-0">
              {task.clientName}
            </span>
          )}
          <StatusPill status={pillStatus} className="flex-shrink-0" />
        </div>

        {/* Row 2: description expandable */}
        {task.input?.description && (
          <ExpandableSection title="Detalhes" defaultOpen={false}>
            {task.input.description}
          </ExpandableSection>
        )}

        {/* Row 3: error + actions */}
        {error && (
          <p className="text-[11px] text-destructive">{error}</p>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          {action ? (
            <Button
              size="sm"
              variant={action.type === 'pause_ad' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={loading || isCompleted}
              className="h-7 px-3 text-[11px] gap-1.5"
            >
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : getActionIcon(action.type)}
              {loading ? 'Executando...' : getActionLabel(action.type, action.amount)}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => onActionComplete()}
            disabled={loading || isCompleted}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:pointer-events-none"
          >
            {isCompleted ? 'Concluído' : 'Ignorar'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 3.3 — Commit**

```bash
cd E:\hub-backend\frontend
git add components/dashboard/task-decision-card.tsx
git commit -m "feat(dashboard): add TaskDecisionCard — compact decision card with severity border"
```

---

## Task 4: Reestruturar tasks/page.tsx

**Files:**
- Modify: `frontend/app/tasks/page.tsx`

**Risco:** BAIXO — a lógica de `useState`, `useMemo`, `fetchTasks`, `clientOptions`, `filteredTasks` é preservada integralmente. Apenas a estrutura de renderização muda.

**O que muda:**
- Meta: `StatusPill` ao invés de `signal-chip`
- Remover `SectionHeader` redundante (título já está no Topbar)
- Loading: skeletons em vez de spinner isolado
- Empty state: `EmptyState` padronizado
- Lista: 1 coluna, agrupada por severidade (critical → high → medium → low)
- `TaskActionCard` → `TaskDecisionCard`
- `onActionComplete` remove o item da lista E mostra mensagem inline (comportamento preservado)
- Eyebrow: "Operações" (em vez de "Intervention")
- Select de severidade: labels em português

**O que NÃO muda:**
- `getOptimizationTasks()` — intocado
- Toda lógica de filtro (`clientFilter`, `severityFilter`, `query`) — intocada
- `clientOptions` — intocado
- `filteredTasks` — intocado
- `fetchTasks` / `onActionComplete` — intocados

- [ ] **Step 4.1 — Substituir conteúdo de tasks/page.tsx**

Substituir o conteúdo COMPLETO de `E:\hub-backend\frontend\app\tasks\page.tsx` por:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { getOptimizationTasks } from '@/lib/api/optimization';
import type { Task } from '@/types';
import { Activity, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { TaskDecisionCard } from '@/components/dashboard/task-decision-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const severityOrder = ['critical', 'high', 'medium', 'low'];

const severityLabel: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
};

const severityIconClass: Record<string, string> = {
  critical: 'text-destructive',
  high: 'text-amber-500 dark:text-amber-400',
  medium: 'text-muted-foreground',
  low: 'text-primary/70',
};

function SeverityGroup({
  severity,
  tasks,
  onActionComplete,
}: {
  severity: string;
  tasks: Task[];
  onActionComplete: (id: string, message?: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={cn('text-[11px] font-bold uppercase tracking-[0.12em]', severityIconClass[severity])}>
          {severityLabel[severity] ?? severity}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">({tasks.length})</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskDecisionCard
            key={task.id}
            task={task}
            onActionComplete={(message) => onActionComplete(task.id, message)}
          />
        ))}
      </div>
    </div>
  );
}

export default function OptimizationTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await getOptimizationTasks();
      setTasks(data);
    } catch {
      setErrorMessage('Falha ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const clientOptions = useMemo(
    () =>
      Array.from(new Set(tasks.map((t) => t.clientName).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (clientFilter !== 'all' && task.clientName !== clientFilter) return false;
      if (severityFilter !== 'all' && (task.input?.severity ?? 'medium') !== severityFilter) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${task.name} ${task.input?.description ?? ''} ${task.clientName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, clientFilter, severityFilter, query]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = { critical: [], high: [], medium: [], low: [] };
    for (const task of filteredTasks) {
      const sev = task.input?.severity ?? 'medium';
      const key = groups[sev] ? sev : 'medium';
      groups[key].push(task);
    }
    return groups;
  }, [filteredTasks]);

  const criticalCount = groupedTasks.critical.length;

  const handleActionComplete = (taskId: string, message?: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (message) setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <PageShell
      eyebrow="Operações"
      title="Central de Ações"
      description="Fila de intervenções automáticas e correções sugeridas."
      actions={
        <Button variant="outline" size="sm" onClick={fetchTasks} disabled={loading}>
          Atualizar
        </Button>
      }
      meta={
        <div className="flex flex-wrap gap-2">
          {criticalCount > 0 && (
            <StatusPill status="critical" label={`${criticalCount} crítico${criticalCount !== 1 ? 's' : ''}`} />
          )}
          <StatusPill status="pending" label={`${filteredTasks.length} pendente${filteredTasks.length !== 1 ? 's' : ''}`} />
        </div>
      }
    >
      {/* Feedback banners */}
      {statusMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar tarefa, descrição ou cliente..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 w-full sm:w-[260px]"
        />
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground cursor-pointer"
        >
          <option value="all">Todos os clientes</option>
          {clientOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground cursor-pointer"
        >
          <option value="all">Todas severidades</option>
          <option value="critical">Crítico</option>
          <option value="high">Alto</option>
          <option value="medium">Médio</option>
          <option value="low">Baixo</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Nenhuma tarefa pendente"
          description={
            query || clientFilter !== 'all' || severityFilter !== 'all'
              ? 'Nenhuma tarefa encontrada para o filtro atual.'
              : 'Tudo em dia. Novas tarefas aparecem aqui automaticamente.'
          }
          action={
            query || clientFilter !== 'all' || severityFilter !== 'all'
              ? {
                  label: 'Limpar filtros',
                  onClick: () => {
                    setQuery('');
                    setClientFilter('all');
                    setSeverityFilter('all');
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {severityOrder.map((sev) => (
            <SeverityGroup
              key={sev}
              severity={sev}
              tasks={groupedTasks[sev]}
              onActionComplete={handleActionComplete}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

- [ ] **Step 4.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 8
```

Expected: build passes sem erros de tipo.

- [ ] **Step 4.3 — Commit**

```bash
cd E:\hub-backend\frontend
git add app/tasks/page.tsx
git commit -m "refactor(tasks): priority queue by severity, TaskDecisionCard, EmptyState, StatusPill"
```

---

## Task 5: Push final

- [ ] **Step 5.1 — Lint**

```powershell
cd E:\hub-backend\frontend
npm run lint 2>&1 | Select-Object -Last 5
```

- [ ] **Step 5.2 — Push e submodule**

```bash
cd E:\hub-backend\frontend
git push origin codex-work

cd E:\hub-backend
git add frontend
git commit -m "chore(repo): update frontend submodule — UX refactor /tasks phase 2"
git push origin claude-work
```

---

## Self-Review

**Spec coverage (anti-patterns → tasks):**
- [x] AP-2 (grid sem hierarquia) → Task 4: lista 1 coluna agrupada por severidade
- [x] AP-3 (signal-chip) → Task 4: `StatusPill` no meta
- [x] AP-5 (SectionHeader redundante) → Task 4: removido, botão Atualizar vai para `actions`
- [x] AP-6 (spinner sem skeleton) → Task 4: skeleton 5 linhas durante loading
- [x] AP-7 (empty state inline) → Task 1 + Task 4: `EmptyState` com limpar filtros
- [x] Progressive disclosure na descrição → Task 2 + Task 3: `ExpandableSection` colapsada
- [x] 1 CTA primário por card → Task 3: `TaskDecisionCard` com botão primário + "Ignorar"
- [x] Severidade em português → Task 4: labels pt-BR no select
- [x] `onActionComplete` preservado → Task 3 e 4: mesmo contrato de interface

**Sem placeholders:** todos os steps têm código completo.

**Consistência de tipos:**
- `Task` importado de `@/types` em Tasks 3 e 4 ✓
- `StatusPillStatus` exportado de `status-pill.tsx` e usado em `task-decision-card.tsx` ✓
- `EmptyState.action.onClick: () => void` ✓
- `ExpandableSection.defaultOpen?: boolean` ✓
- `SeverityGroup.onActionComplete: (id: string, message?: string) => void` ✓
- `handleActionComplete` em page.tsx: `(taskId: string, message?: string)` — bate com `SeverityGroup.onActionComplete` ✓
- `TaskDecisionCard.onActionComplete: (message?: string) => void` — page.tsx chama `onActionComplete(task.id, message)` e passa para `TaskDecisionCard` como `(message) => onActionComplete(task.id, message)` ✓
