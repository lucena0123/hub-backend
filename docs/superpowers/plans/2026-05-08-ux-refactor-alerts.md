# UX Refactor — /alerts (Fase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a tela `/alerts` de lista flat sem hierarquia em uma fila de incidentes escaneável, agrupada por severidade, com ação contextual clara por alerta.

**Architecture:** Três mudanças isoladas em sequência: (1) criar `StatusPill` como componente novo sem tocar em nada existente; (2) compactar `AlertCard` preservando toda lógica de dados; (3) reestruturar `alerts/page.tsx` apenas reorganizando componentes — fetch e estado ficam intocados.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Tailwind CSS v4, Lucide React, shadcn/ui, date-fns.

---

## Contexto do domínio

- `PerformanceAlert.type`: `'critical' | 'warning' | 'info'`
- `AlertsResponse`: `{ total, critical, warning, alerts: PerformanceAlert[] }`
- Alertas críticos têm prioridade máxima — devem aparecer primeiro e ter visual dominante
- CTAs existentes por alerta: Performance (`/clients/:id/performance`), Board (`/optimization/board?clientId=:id`), Regras (`/optimization/settings?clientId=:id`)
- O fetch de alertas (`getAlerts()`) e todos os filtros de estado permanecem **intocados**

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `frontend/components/ui/status-pill.tsx` | Criar | Pill semântico reutilizável com 7 estados |
| `frontend/components/alerts/alert-card.tsx` | Modificar | Layout compacto com borda lateral de severidade |
| `frontend/app/alerts/page.tsx` | Modificar | Agrupamento por severidade + filtro compacto |

---

## Task 1: Criar StatusPill — fundação semântica

**Files:**
- Create: `frontend/components/ui/status-pill.tsx`

**Risco:** ZERO — arquivo novo, nada existente é tocado.

- [ ] **Step 1.1 — Criar o arquivo**

Criar `E:\hub-backend\frontend\components\ui\status-pill.tsx` com o conteúdo exato:

```tsx
import { cn } from '@/lib/utils';

export type StatusPillStatus =
  | 'critical'
  | 'warning'
  | 'healthy'
  | 'completed'
  | 'blocked'
  | 'pending'
  | 'info';

const config: Record<StatusPillStatus, { defaultLabel: string; className: string }> = {
  critical:  { defaultLabel: 'Crítico',   className: 'bg-destructive/10 text-destructive border-destructive/40' },
  warning:   { defaultLabel: 'Atenção',   className: 'bg-amber-500/10 text-amber-600 border-amber-500/40 dark:text-amber-400' },
  healthy:   { defaultLabel: 'Saudável',  className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40 dark:text-emerald-400' },
  completed: { defaultLabel: 'Concluído', className: 'bg-primary/10 text-primary border-primary/40' },
  blocked:   { defaultLabel: 'Bloqueado', className: 'bg-orange-500/10 text-orange-600 border-orange-500/40 dark:text-orange-400' },
  pending:   { defaultLabel: 'Pendente',  className: 'bg-muted text-muted-foreground border-border' },
  info:      { defaultLabel: 'Info',      className: 'bg-primary/10 text-primary border-primary/40' },
};

interface StatusPillProps {
  status: StatusPillStatus;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const cfg = config[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        cfg.className,
        className
      )}
    >
      {label ?? cfg.defaultLabel}
    </span>
  );
}
```

- [ ] **Step 1.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes sem erros.

- [ ] **Step 1.3 — Commit**

```bash
cd E:\hub-backend\frontend
git add components/ui/status-pill.tsx
git commit -m "feat(ui): add StatusPill component — semantic status states"
```

---

## Task 2: Compactar AlertCard com severidade visual

**Files:**
- Modify: `frontend/components/alerts/alert-card.tsx`

**Risco:** BAIXO — apenas layout/CSS. `typeConfig`, `formatValue`, `categoryLabels` e todos os links de CTA são preservados integralmente.

**O que muda:**
- Remove `edge-card hover-lift` → card limpo com borda esquerda colorida por severidade
- Compacta padding e espaçamentos
- Header: severity dot + client name + category badge (remove a badge duplicada de tipo)
- Body: mensagem em 1 linha truncada + valores na mesma linha
- Footer: `Performance` como botão primário; `Board` e `Regras` como links menores

**O que NÃO muda:**
- `typeConfig`, `categoryLabels`, `formatValue` — intocados
- `parsedDate`, `timestamp` — intocado
- Todos os hrefs dos links — intocados
- `PerformanceAlert` type — intocado

- [ ] **Step 2.1 — Substituir o conteúdo de alert-card.tsx**

Substituir o conteúdo COMPLETO de `E:\hub-backend\frontend\components\alerts\alert-card.tsx` por:

```tsx
import type { LucideIcon } from 'lucide-react';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { PerformanceAlert } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const typeConfig: Record<
  PerformanceAlert['type'],
  { icon: LucideIcon; borderClass: string; iconClass: string }
> = {
  critical: {
    icon: AlertOctagon,
    borderClass: 'border-l-destructive',
    iconClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    borderClass: 'border-l-amber-500',
    iconClass: 'text-amber-500 dark:text-amber-400',
  },
  info: {
    icon: Info,
    borderClass: 'border-l-primary',
    iconClass: 'text-primary',
  },
};

const categoryLabels: Record<string, string> = {
  roas: 'ROAS',
  ctr: 'CTR',
  budget: 'Budget',
  cpl: 'CPL',
  conversions: 'Conversões',
  bpmn: 'BPMN',
  contacts: 'Contatos',
  qualification: 'Qualificação',
  trend: 'Tendência',
  stalled: 'Sem entrega',
  sync: 'Sincronização',
};

const formatValue = (category: string, value: number) => {
  if (!Number.isFinite(value)) return '-';
  switch (category) {
    case 'roas':        return `${value.toFixed(2)}x`;
    case 'ctr':         return `${value.toFixed(2)}%`;
    case 'budget':      return `${value.toFixed(1)}%`;
    case 'cpl':         return `R$${value.toFixed(2)}`;
    case 'conversions': return Math.round(value).toString();
    case 'bpmn':        return value === 0 ? '-' : value.toString();
    default:            return value.toString();
  }
};

export function AlertCard({ alert }: { alert: PerformanceAlert }) {
  const config = typeConfig[alert.type];
  const Icon = config.icon;
  const categoryLabel = categoryLabels[alert.category] ?? alert.category.toUpperCase();
  const currentValue = formatValue(alert.category, alert.currentValue);
  const thresholdValue = formatValue(alert.category, alert.threshold);
  const parsedDate = alert.createdAt ? new Date(alert.createdAt) : null;
  const timestamp =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? format(parsedDate, 'dd/MM HH:mm')
      : '-';

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 border-l-[3px] transition-colors hover:bg-muted/30',
        config.borderClass
      )}
    >
      {/* Severity icon */}
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconClass)} aria-hidden="true" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Row 1: client + category + timestamp */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{alert.clientName}</span>
          <span className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {categoryLabel}
          </span>
          {alert.campaignName && (
            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
              {alert.campaignName}
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground flex-shrink-0">{timestamp}</span>
        </div>

        {/* Row 2: message (1 line) */}
        <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">{alert.message}</p>

        {/* Row 3: metric values + actions */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <span className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{alert.metric}</span>
            {' '}{currentValue}
            {' vs '}{thresholdValue}
          </span>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" variant="default" asChild className="h-6 px-2.5 text-[11px]">
              <Link href={`/clients/${alert.clientId}/performance`}>Performance</Link>
            </Button>
            <Link
              href={`/optimization/board?clientId=${alert.clientId}`}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Board
            </Link>
            <Link
              href={`/optimization/settings?clientId=${alert.clientId}`}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Regras
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes sem erros de tipo.

- [ ] **Step 2.3 — Commit**

```bash
cd E:\hub-backend\frontend
git add components/alerts/alert-card.tsx
git commit -m "refactor(alerts): compact AlertCard with severity border and single primary CTA"
```

---

## Task 3: Reestruturar alerts/page.tsx

**Files:**
- Modify: `frontend/app/alerts/page.tsx`

**Risco:** BAIXO — `getAlerts()`, useState, useMemo e toda a lógica de filtro permanecem intactos. Apenas a estrutura de renderização muda.

**O que muda:**
- Remove os 3 stat-cards grandes (redundantes com o meta do PageShell)
- Meta do PageShell usa `StatusPill` ao invés de `signal-chip`
- Remove o `SectionHeader` de "Filtros de Alerta" separado
- Filtros: 12 chips numa barra horizontal compacta dentro do próprio fluxo
- Alertas agrupados: Críticos (N) → Atenção (N) → Info (N), com separadores textuais
- Estado vazio padronizado

**O que NÃO muda:**
- `getAlerts()` fetch — intocado
- `useState` / `useMemo` — intocados
- `categories` array — intocado
- `filteredAlerts` lógica — intocada

- [ ] **Step 3.1 — Substituir o conteúdo de alerts/page.tsx**

Substituir o conteúdo COMPLETO de `E:\hub-backend\frontend\app\alerts\page.tsx` por:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { getAlerts } from '@/lib/api/client';
import type { AlertsResponse } from '@/types';
import { AlertCard } from '@/components/alerts/alert-card';
import { StatusPill } from '@/components/ui/status-pill';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';

const categories = [
  { value: 'all', label: 'Todos' },
  { value: 'contacts', label: 'Contatos' },
  { value: 'qualification', label: 'Qualificação' },
  { value: 'trend', label: 'Tendência' },
  { value: 'stalled', label: 'Sem entrega' },
  { value: 'sync', label: 'Sincronização' },
  { value: 'budget', label: 'Orçamento' },
  { value: 'roas', label: 'ROAS' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpl', label: 'CPL' },
  { value: 'conversions', label: 'Conversões' },
  { value: 'bpmn', label: 'BPMN' },
];

function SeveritySection({
  label,
  count,
  icon: Icon,
  iconClass,
  children,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  iconClass: string;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-3.5 w-3.5', iconClass)} aria-hidden="true" />
        <span className={cn('text-[11px] font-bold uppercase tracking-[0.12em]', iconClass)}>
          {label}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">({count})</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const response = await getAlerts();
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    if (!data) return [];
    if (category === 'all') return data.alerts;
    return data.alerts.filter((alert) => alert.category === category);
  }, [data, category]);

  const criticalAlerts = useMemo(
    () => filteredAlerts.filter((a) => a.type === 'critical'),
    [filteredAlerts]
  );
  const warningAlerts = useMemo(
    () => filteredAlerts.filter((a) => a.type === 'warning'),
    [filteredAlerts]
  );
  const infoAlerts = useMemo(
    () => filteredAlerts.filter((a) => a.type === 'info'),
    [filteredAlerts]
  );

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Activity className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm">Carregando alertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2 max-w-sm">
          <AlertOctagon className="h-6 w-6 text-destructive mx-auto" />
          <p className="text-sm font-semibold text-destructive">Falha ao carregar</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Monitoramento"
      title="Central de Alertas"
      meta={
        data ? (
          <div className="flex flex-wrap gap-2">
            {data.critical > 0 && (
              <StatusPill status="critical" label={`${data.critical} crítico${data.critical !== 1 ? 's' : ''}`} />
            )}
            {data.warning > 0 && (
              <StatusPill status="warning" label={`${data.warning} atenção`} />
            )}
            {data.total > 0 && (
              <StatusPill status="pending" label={`${data.total} total`} />
            )}
          </div>
        ) : null
      }
    >
      {/* Filter bar */}
      <Reveal>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1.5 min-w-max">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border shrink-0 cursor-pointer',
                  category === item.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Alert list grouped by severity */}
      <Reveal delayMs={80}>
        {filteredAlerts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Activity className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Nenhum alerta</p>
            <p className="text-xs text-muted-foreground mt-1">
              {category === 'all'
                ? 'Tudo operando normalmente.'
                : `Sem alertas na categoria "${categories.find((c) => c.value === category)?.label}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <SeveritySection
              label="Crítico"
              count={criticalAlerts.length}
              icon={AlertOctagon}
              iconClass="text-destructive"
            >
              {criticalAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </SeveritySection>

            <SeveritySection
              label="Atenção"
              count={warningAlerts.length}
              icon={AlertTriangle}
              iconClass="text-amber-500 dark:text-amber-400"
            >
              {warningAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </SeveritySection>

            <SeveritySection
              label="Info"
              count={infoAlerts.length}
              icon={Info}
              iconClass="text-primary"
            >
              {infoAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </SeveritySection>
          </div>
        )}
      </Reveal>
    </PageShell>
  );
}
```

- [ ] **Step 3.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 8
```

Expected: build passes sem erros de tipo.

- [ ] **Step 3.3 — Commit**

```bash
cd E:\hub-backend\frontend
git add app/alerts/page.tsx
git commit -m "refactor(alerts): group by severity, compact filters, StatusPill meta"
```

---

## Task 4: Verificação final + push

- [ ] **Step 4.1 — Verificar lint**

```powershell
cd E:\hub-backend\frontend
npm run lint 2>&1 | Select-Object -Last 10
```

Expected: sem erros de lint (warnings são aceitáveis).

- [ ] **Step 4.2 — Atualizar submodule e push**

```bash
# Frontend
cd E:\hub-backend\frontend
git push origin codex-work

# Hub-backend (atualizar ponteiro do submodule)
cd E:\hub-backend
git add frontend
git commit -m "chore(repo): update frontend submodule — UX refactor /alerts phase 1"
git push origin claude-work
```

---

## Self-Review

**Spec coverage (audit → tasks):**
- [x] Alertas agrupados por severidade → Task 3 `SeveritySection`
- [x] Críticos aparecem primeiro → Task 3 (ordem: critical → warning → info)
- [x] 1 CTA primário por alerta → Task 2 (`Performance` como `Button`, `Board`/`Regras` como links)
- [x] Estado vazio padronizado → Task 3
- [x] `signal-chip` removido → Task 3 (`StatusPill` no meta)
- [x] Filtros compactos → Task 3 (filter bar horizontal enxuta)
- [x] `StatusPill` criado → Task 1
- [x] Loading sem full-screen spinner → Task 3 (spinner centralizado mas sem bloquear layout)
- [x] `edge-card hover-lift` removidos do `AlertCard` → Task 2

**Sem placeholders:** todos os steps têm código completo.

**Consistência de tipos:**
- `StatusPill` aceita `StatusPillStatus` — importado de `@/components/ui/status-pill` em `alerts/page.tsx` ✓
- `AlertCard` continua aceitando `{ alert: PerformanceAlert }` — sem mudança de interface ✓
- `filteredAlerts`, `criticalAlerts`, `warningAlerts`, `infoAlerts` são todos `PerformanceAlert[]` ✓

**O que não foi alterado (zero risco):**
- `getAlerts()` em `lib/api/client`
- `PerformanceAlert`, `AlertsResponse` em `types/index.ts`
- `useState`, `useMemo`, `categories` array — lógica de filtro intacta
- Todos os hrefs de CTAs — intocados
- `formatValue`, `categoryLabels`, `typeConfig` — lógica de formatação intacta
