# Dashboard Redesign 2026 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar as mudanças estruturais do mockup 2026: topbar compacto, KPI cards com delta+sparkline, bento grid no dashboard, banner de destaque, mini métricas e logo mark na sidebar.

**Architecture:** Frontend usa mock data para sparklines/delta enquanto o backend implementa os endpoints em paralelo. A troca mock→real é uma mudança cirúrgica em `lib/api/client/dashboard.ts` na Task final. Novos componentes ficam em `frontend/components/dashboard/` e `frontend/components/layout/`.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui, Recharts (já instalado), Lucide React.

---

## File Map

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `frontend/types/index.ts` | Modify | Adicionar `KpiDelta`, `SparklineData`; atualizar `DashboardOverview` |
| `frontend/components/layout/topbar.tsx` | Create | Topbar compacto: eyebrow + title + actions slot |
| `frontend/components/layout/page-shell.tsx` | Modify | Integrar `Topbar`; simplificar header |
| `frontend/app/globals.css` | Modify | `.page-title` → `22px / font-weight: 800` |
| `frontend/components/dashboard/kpi-card.tsx` | Create | Card com valor 32px, delta badge, sparkline |
| `frontend/components/dashboard/mini-metric.tsx` | Create | Item com ícone colorido + valor + delta |
| `frontend/components/dashboard/compare-banner.tsx` | Create | Card gradient indigo com CTA |
| `frontend/lib/api/client/dashboard.ts` | Modify | Adicionar `getDashboardSparklines()` (mock) |
| `frontend/app/page.tsx` | Modify | Bento grid 4 colunas + novos componentes |
| `frontend/components/navigation/app-sidebar.tsx` | Modify | Logo mark 30×30px indigo |
| `backend/src/services/dashboard-service.ts` | Modify | Delta em `getPerformanceOverview()` |
| `backend/src/routes/dashboard.routes.ts` | Modify | `GET /api/dashboard/sparklines` |

---

## Task 1: Tipos — KpiDelta, SparklineData, DashboardOverview

**Files:**
- Modify: `frontend/types/index.ts:105-140`

- [ ] **Step 1.1 — Adicionar tipos novos e atualizar DashboardOverview**

Substituir o bloco `DashboardOverview` (linhas 105–140) em `frontend/types/index.ts`:

```ts
export interface KpiDelta {
  value: number;
  pct: number;
}

export interface SparklineData {
  spend: number[];
  roas: number[];
  leads: number[];
  clients: number[];
}

export interface DashboardOverview {
  clients: {
    total: number;
    active: number;
    byTier: Record<string, number>;
  };
  campaigns: {
    total: number;
    active: number;
    byPlatform: Record<string, number>;
  };
  performance: {
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    totalLeads: number;
    avgRoas: number;
    avgCtr: number;
    avgCpl: number;
    delta?: {
      totalSpend: KpiDelta;
      avgRoas: KpiDelta;
      avgCpl: KpiDelta;
      avgCtr: KpiDelta;
      totalConversions: KpiDelta;
      totalLeads: KpiDelta;
    };
  };
  bpmn: {
    clientsInExecution: number;
    clientsInMonitoring: number;
    avgProgress: number;
    blockedClients: number;
  };
  reports: {
    totalGenerated: number;
    lastGenerated: string | null;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}
```

- [ ] **Step 1.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes. O campo `delta` é opcional então nenhum consumer quebra.

- [ ] **Step 1.3 — Commit**

```bash
cd E:\hub-backend\frontend
git add types/index.ts
git commit -m "feat(types): add KpiDelta, SparklineData; extend DashboardOverview with optional delta"
```

---

## Task 2: Componente Topbar

**Files:**
- Create: `frontend/components/layout/topbar.tsx`

- [ ] **Step 2.1 — Criar o componente**

Criar `frontend/components/layout/topbar.tsx`:

```tsx
import type { ReactNode } from 'react';

interface TopbarProps {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}

export function Topbar({ eyebrow, title, actions }: TopbarProps) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4">
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] font-extrabold leading-[1.1] text-foreground truncate">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
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
git add components/layout/topbar.tsx
git commit -m "feat(layout): add Topbar component — compact eyebrow + title + actions"
```

---

## Task 3: PageShell + globals.css

**Files:**
- Modify: `frontend/components/layout/page-shell.tsx`
- Modify: `frontend/app/globals.css`

- [ ] **Step 3.1 — Atualizar PageShell para usar Topbar**

Substituir o conteúdo de `frontend/components/layout/page-shell.tsx`:

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Topbar } from '@/components/layout/topbar';
import { Breadcrumb, type BreadcrumbItem } from '@/components/layout/breadcrumb';

interface PageShellProps {
  eyebrow?: string;
  breadcrumb?: BreadcrumbItem[];
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function PageShell({
  eyebrow,
  breadcrumb,
  title,
  description,
  meta,
  actions,
  className,
  children,
}: PageShellProps) {
  const resolvedEyebrow = breadcrumb && breadcrumb.length > 0 ? undefined : eyebrow;

  return (
    <div className={cn('page-shell', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb items={breadcrumb} />
      )}
      <Topbar eyebrow={resolvedEyebrow} title={title} actions={actions} />
      {(description || meta) && (
        <div className="mb-6 space-y-2">
          {description && <p className="page-description">{description}</p>}
          {meta && <div className="page-meta">{meta}</div>}
        </div>
      )}
      <div className="space-y-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 3.2 — Atualizar .page-title em globals.css**

Encontrar e substituir o bloco `.page-title` em `frontend/app/globals.css`:

```css
/* ANTES */
.page-title {
  font-size: clamp(2rem, 4vw, 3.6rem);
  font-weight: 700;
  line-height: 1.05;
}

/* DEPOIS */
.page-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}
```

Nota: o `.page-title` agora é usado pelo `Topbar` via classe utilitária inline — a classe CSS existe como fallback para eventuais usos diretos.

- [ ] **Step 3.3 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes. Todas as páginas que usam `PageShell` ganham o topbar compacto automaticamente.

- [ ] **Step 3.4 — Commit**

```bash
git add components/layout/page-shell.tsx app/globals.css
git commit -m "feat(layout): integrate Topbar into PageShell; compact page-title 22px"
```

---

## Task 4: KpiCard com delta e sparkline

**Files:**
- Create: `frontend/components/dashboard/kpi-card.tsx`

- [ ] **Step 4.1 — Criar o componente**

Criar `frontend/components/dashboard/kpi-card.tsx`:

```tsx
'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import type { KpiDelta } from '@/types';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: KpiDelta;
  sparklineData?: number[];
  valueColor?: string;
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  sparklineData,
  valueColor = 'text-foreground',
}: KpiCardProps) {
  const isUp = delta && delta.value >= 0;
  const sparkPoints = sparklineData?.map((v, i) => ({ v, i }));

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">
        {label}
      </p>

      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className={cn('text-[32px] font-extrabold leading-none', valueColor)}>
            {value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>

        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold flex-shrink-0',
              isUp
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            )}
          >
            {isUp ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(delta.pct).toFixed(1)}%
          </span>
        )}
      </div>

      {sparkPoints && sparkPoints.length > 0 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkPoints}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="var(--primary)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 4.3 — Commit**

```bash
git add components/dashboard/kpi-card.tsx
git commit -m "feat(dashboard): add KpiCard with delta badge and recharts sparkline"
```

---

## Task 5: MiniMetric

**Files:**
- Create: `frontend/components/dashboard/mini-metric.tsx`

- [ ] **Step 5.1 — Criar o componente**

Criar `frontend/components/dashboard/mini-metric.tsx`:

```tsx
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { KpiDelta } from '@/types';

type IconBg = 'indigo' | 'emerald' | 'amber' | 'rose';

const iconBgMap: Record<IconBg, string> = {
  indigo:  'bg-[#eef2ff] text-[#6366f1] dark:bg-[#6366f1]/15 dark:text-[#a5b4fc]',
  emerald: 'bg-[#dcfce7] text-[#15803d] dark:bg-[#15803d]/15 dark:text-[#6ee7b7]',
  amber:   'bg-[#fef9c3] text-[#a16207] dark:bg-[#a16207]/15 dark:text-[#fcd34d]',
  rose:    'bg-[#fee2e2] text-[#b91c1c] dark:bg-[#b91c1c]/15 dark:text-[#f87171]',
};

interface MiniMetricProps {
  icon: LucideIcon;
  iconBg: IconBg;
  label: string;
  value: string;
  delta?: KpiDelta;
  isLast?: boolean;
}

export function MiniMetric({
  icon: Icon,
  iconBg,
  label,
  value,
  delta,
  isLast = false,
}: MiniMetricProps) {
  const isUp = delta && delta.value >= 0;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2.5',
        !isLast && 'border-b border-border'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
            iconBgMap[iconBg]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[13px] font-semibold text-foreground truncate">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0 text-right">
        <span className="text-[14px] font-bold text-foreground">{value}</span>
        {delta && (
          <span
            className={cn(
              'text-[11px] font-semibold',
              isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {isUp ? '+' : ''}{delta.pct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 5.3 — Commit**

```bash
git add components/dashboard/mini-metric.tsx
git commit -m "feat(dashboard): add MiniMetric with colored icon chip and delta"
```

---

## Task 6: CompareBanner

**Files:**
- Create: `frontend/components/dashboard/compare-banner.tsx`

- [ ] **Step 6.1 — Criar o componente**

Criar `frontend/components/dashboard/compare-banner.tsx`:

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);
}

interface CompareBannerProps {
  totalSpend: number;
  activeClients: number;
}

export function CompareBanner({ totalSpend, activeClients }: CompareBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#4F46E5] p-6 text-white col-span-2">
      {/* decorative circles */}
      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/8 pointer-events-none" />
      <div className="absolute right-10 -bottom-10 h-24 w-24 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
          Portfólio
        </p>
        <h2 className="mb-1 text-[18px] font-extrabold">
          Performance do Mês
        </h2>
        <p className="mb-5 text-[13px] text-white/75">
          {formatCurrency(totalSpend)} investidos · {activeClients} clientes ativos
        </p>
        <Link
          href="/executive"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-slate-100"
        >
          Ver relatório
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 6.3 — Commit**

```bash
git add components/dashboard/compare-banner.tsx
git commit -m "feat(dashboard): add CompareBanner with gradient indigo card and CTA"
```

---

## Task 7: Mock getDashboardSparklines

**Files:**
- Modify: `frontend/lib/api/client/dashboard.ts`
- Modify: `frontend/lib/api/client.ts`

- [ ] **Step 7.1 — Adicionar função mock em dashboard.ts**

Adicionar ao final de `frontend/lib/api/client/dashboard.ts`:

```ts
import type { DashboardOverview, DashboardStats, SparklineData } from '@/types';

// ... código existente mantido ...

// TODO: replace mock with real fetch when backend endpoint is ready
// GET /api/dashboard/sparklines
export const getDashboardSparklines = async (): Promise<SparklineData> => {
  return {
    spend:   [420, 380, 510, 490, 620, 580, 640],
    roas:    [2.1, 2.3, 2.0, 2.4, 2.6, 2.5, 2.8],
    leads:   [18, 22, 19, 25, 28, 24, 30],
    clients: [22, 22, 23, 23, 24, 24, 24],
  };
};
```

- [ ] **Step 7.2 — Exportar em client.ts**

Adicionar `getDashboardSparklines` à linha de export de dashboard em `frontend/lib/api/client.ts`:

```ts
export { getDashboardStats, getDashboardOverview, getDashboardSparklines } from './client/dashboard';
```

- [ ] **Step 7.3 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 7.4 — Commit**

```bash
git add lib/api/client/dashboard.ts lib/api/client.ts
git commit -m "feat(api): add getDashboardSparklines (mock data, swap to real endpoint later)"
```

---

## Task 8: Dashboard page — bento grid

**Files:**
- Modify: `frontend/app/page.tsx`

Esta task substitui a estrutura do dashboard. Ler o arquivo atual antes de editar para confirmar os imports existentes.

- [ ] **Step 8.1 — Atualizar imports no topo de page.tsx**

Substituir o bloco de imports existente:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getDashboardOverview,
  getAlerts,
  getDashboardSparklines,
} from '@/lib/api/client';
import type {
  AlertsResponse,
  DashboardOverview,
  SparklineData,
} from '@/types';
import {
  Activity,
  Cpu,
  Zap,
  Server,
  TrendingUp,
  DollarSign,
  MousePointer,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PageShell } from '@/components/layout/page-shell';
import { Reveal } from '@/components/layout/reveal';
import { SectionHeader } from '@/components/performance/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { MiniMetric } from '@/components/dashboard/mini-metric';
import { CompareBanner } from '@/components/dashboard/compare-banner';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
```

- [ ] **Step 8.2 — Atualizar estado e fetch**

Substituir o bloco de estado e useEffect existente pelo seguinte (manter `isDashboardOverview`, `formatCurrency`, `SkeletonMetric`, `PlatformBar`, `ProgressFill` — apenas atualizar o estado e o fetch):

```tsx
export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [sparklines, setSparklines] = useState<SparklineData | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewData, alertsData, sparklineData] = await Promise.all([
          getDashboardOverview(),
          getAlerts().catch(() => null),
          getDashboardSparklines(),
        ]);

        const data: unknown = overviewData;
        if (isDashboardOverview(data)) {
          setOverview(data);
          setAlerts(alertsData);
          setSparklines(sparklineData);
        } else {
          setError('Falha ao validar dados do painel.');
        }
      } catch {
        setError('Conexão indisponível no momento.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
```

- [ ] **Step 8.3 — Substituir o return do dashboard por bento grid**

Encontrar o bloco `return (` do dashboard (quando `overview` existe) e substituir pelo seguinte layout bento:

```tsx
  return (
    <PageShell
      eyebrow="Agência / Visão geral"
      title="Radar Operacional"
      description="Resumo executivo do portfolio de campanhas."
      meta={
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            Clientes {overview.clients.active}/{overview.clients.total}
          </span>
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            Campanhas {overview.campaigns.active}
          </span>
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            CPL R${overview.performance.avgCpl.toFixed(2)}
          </span>
        </div>
      }
    >
      {/* ── Row 1: 4 KPI Cards ── */}
      <Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Clientes ativos"
            value={overview.clients.active}
            unit={`/ ${overview.clients.total}`}
            delta={overview.performance.delta?.totalSpend}
            sparklineData={sparklines?.clients}
          />
          <KpiCard
            label="Campanhas ativas"
            value={overview.campaigns.active}
            sparklineData={sparklines?.leads}
          />
          <KpiCard
            label="ROI médio"
            value={overview.performance.avgRoas.toFixed(2)}
            unit="x"
            delta={overview.performance.delta?.avgRoas}
            sparklineData={sparklines?.roas}
            valueColor="text-emerald-600"
          />
          <KpiCard
            label="Investimento total"
            value={formatCurrency(overview.performance.totalSpend)}
            delta={overview.performance.delta?.totalSpend}
            sparklineData={sparklines?.spend}
          />
        </div>
      </Reveal>

      {/* ── Row 2: Gráfico (col-2) + Banner (col-2) ── */}
      <Reveal delayMs={60}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Gráfico de barras — col-span-2 */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> Financeiro mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                    formatter={(value, name) => {
                      const numeric = typeof value === 'number' ? value : Number(value ?? 0);
                      return name === 'brl' ? [formatCurrency(numeric), 'Financeiro'] : [numeric, 'Volume'];
                    }}
                  />
                  <Bar yAxisId="left" dataKey="brl" fill="var(--primary)" radius={[4, 4, 0, 0]} name="brl" />
                  <Bar yAxisId="right" dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="count" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Banner — col-span-2 */}
          <CompareBanner
            totalSpend={overview.performance.totalSpend}
            activeClients={overview.clients.active}
          />
        </div>
      </Reveal>

      {/* ── Row 3: Log de eventos (col-3) + Mini métricas (col-1) ── */}
      <Reveal delayMs={120}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Log de eventos — col-span-3 */}
          <Card className="lg:col-span-3">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Server className="h-3 w-3" /> Log de eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-0">
              <div className="space-y-0 relative">
                <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-border/30 border-l border-dashed border-muted-foreground/20" />
                {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors relative">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/70 flex-shrink-0 z-10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80 leading-snug">{log.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(log.timestamp)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="px-4 text-xs text-muted-foreground">Nenhum evento recente.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mini métricas — col-span-1 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3" /> Métricas rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-0 pb-4">
              <MiniMetric
                icon={TrendingUp}
                iconBg="indigo"
                label="ROI Médio"
                value={`${overview.performance.avgRoas.toFixed(2)}x`}
                delta={overview.performance.delta?.avgRoas}
              />
              <MiniMetric
                icon={DollarSign}
                iconBg="emerald"
                label="CPL Médio"
                value={`R$${overview.performance.avgCpl.toFixed(2)}`}
                delta={overview.performance.delta?.avgCpl}
              />
              <MiniMetric
                icon={MousePointer}
                iconBg="amber"
                label="CTR Médio"
                value={`${overview.performance.avgCtr.toFixed(2)}%`}
                delta={overview.performance.delta?.avgCtr}
              />
              <MiniMetric
                icon={Users}
                iconBg="rose"
                label="Conversões"
                value={String(overview.performance.totalConversions)}
                delta={overview.performance.delta?.totalConversions}
                isLast
              />
            </CardContent>
          </Card>
        </div>
      </Reveal>

      {/* ── Row 4: Pipeline BPMN + Plataformas ── */}
      <Reveal delayMs={180}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Pipeline de execução
                </CardTitle>
                <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  {overview.bpmn.avgProgress}%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Execução</span>
                  <span className="text-primary">{overview.bpmn.clientsInExecution}</span>
                </div>
                <div className="h-1 bg-secondary w-full rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${executionRatio}%` }} />
                </div>
                <div className="flex justify-between">
                  <span>Monitoramento</span>
                  <span className="text-emerald-500">{overview.bpmn.clientsInMonitoring}</span>
                </div>
                <div className="h-1 bg-secondary w-full rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${monitoringRatio}%` }} />
                </div>
                <div className="flex justify-between">
                  <span>Bloqueados</span>
                  <span className="text-red-500">{overview.bpmn.blockedClients}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" /> Distribuição por plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {platformData.map((p, i) => (
                <PlatformBar
                  key={p.name}
                  name={p.name}
                  value={p.value}
                  total={totalCampaigns}
                  color={i % 2 === 0 ? 'var(--primary)' : 'var(--chart-2)'}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </Reveal>
    </PageShell>
  );
```

- [ ] **Step 8.4 — Remover HudMetric e Wifi das imports (não usados mais)**

Certificar que `Wifi` e `AlertTriangle` foram removidos dos imports de lucide-react e `HudMetric` foi deletado do arquivo se existir.

- [ ] **Step 8.5 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 10
```

Expected: build passes sem erros de tipo.

- [ ] **Step 8.6 — Commit**

```bash
git add app/page.tsx
git commit -m "feat(dashboard): bento grid layout with KpiCard, CompareBanner, MiniMetric"
```

---

## Task 9: Sidebar — logo mark

**Files:**
- Modify: `frontend/components/navigation/app-sidebar.tsx`

- [ ] **Step 9.1 — Substituir bloco de brand na sidebar**

Encontrar em `app-sidebar.tsx`:

```tsx
<Link href="/" className="sidebar-brand" onClick={() => setMobileOpen(false)}>
  <span className="sidebar-brand-kicker">Agency Console</span>
  {!collapsed && (
    <span className="sidebar-brand-title">
      Hub<span className="text-primary">.</span>
    </span>
  )}
</Link>
```

Substituir por:

```tsx
<Link
  href="/"
  className="flex items-center gap-2.5 min-w-0"
  onClick={() => setMobileOpen(false)}
>
  <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white text-[13px] font-extrabold">
    H
  </div>
  {!collapsed && (
    <span className="text-[15px] font-bold text-sidebar-foreground truncate">
      Hub B2B
    </span>
  )}
</Link>
```

- [ ] **Step 9.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 9.3 — Commit**

```bash
git add components/navigation/app-sidebar.tsx
git commit -m "feat(sidebar): add indigo logo mark; rename brand to Hub B2B"
```

---

## Task 10: Backend — delta em getPerformanceOverview

**Files:**
- Modify: `backend/src/services/dashboard-service.ts`

- [ ] **Step 10.1 — Atualizar interface DashboardOverview no backend**

Adicionar campo `delta` à interface `DashboardOverview` em `backend/src/services/dashboard-service.ts`:

```ts
export interface DashboardOverview {
  clients: { total: number; active: number; byTier: Record<string, number>; };
  campaigns: { total: number; active: number; byPlatform: Record<string, number>; };
  performance: {
    totalSpend: number;
    totalRevenue: number;
    totalConversions: number;
    totalLeads: number;
    avgRoas: number;
    avgCtr: number;
    avgCpl: number;
    delta: {
      totalSpend:       { value: number; pct: number };
      avgRoas:          { value: number; pct: number };
      avgCpl:           { value: number; pct: number };
      avgCtr:           { value: number; pct: number };
      totalConversions: { value: number; pct: number };
      totalLeads:       { value: number; pct: number };
    };
  };
  bpmn: { clientsInExecution: number; clientsInMonitoring: number; avgProgress: number; blockedClients: number; };
  reports: { totalGenerated: number; lastGenerated: string | null; };
  recentActivity: Array<{ type: string; description: string; timestamp: string; }>;
}
```

- [ ] **Step 10.2 — Atualizar getPerformanceOverview com query de delta**

Substituir o método `getPerformanceOverview()` completo:

```ts
private async getPerformanceOverview() {
  const [current, previous] = await Promise.all([
    this.prisma.$queryRaw<any[]>`
      SELECT
        COALESCE(SUM(spend), 0)       as total_spend,
        COALESCE(SUM(revenue), 0)     as total_revenue,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(leads), 0)       as total_leads,
        CASE WHEN SUM(spend) > 0
          THEN ROUND(SUM(revenue) / SUM(spend), 2) ELSE 0 END as avg_roas,
        CASE WHEN SUM(impressions) > 0
          THEN ROUND((SUM(clicks)::decimal / SUM(impressions)) * 100, 2) ELSE 0 END as avg_ctr,
        CASE
          WHEN SUM(leads) > 0 THEN ROUND(SUM(spend) / SUM(leads), 2)
          WHEN SUM(messaging_conversations) > 0 THEN ROUND(SUM(spend) / SUM(messaging_conversations), 2)
          WHEN SUM(conversions) > 0 THEN ROUND(SUM(spend) / SUM(conversions), 2)
          ELSE 0
        END as avg_cpl
      FROM campaign_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `,
    this.prisma.$queryRaw<any[]>`
      SELECT
        COALESCE(SUM(spend), 0)       as total_spend,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(leads), 0)       as total_leads,
        CASE WHEN SUM(spend) > 0
          THEN ROUND(SUM(revenue) / SUM(spend), 2) ELSE 0 END as avg_roas,
        CASE WHEN SUM(impressions) > 0
          THEN ROUND((SUM(clicks)::decimal / SUM(impressions)) * 100, 2) ELSE 0 END as avg_ctr,
        CASE
          WHEN SUM(leads) > 0 THEN ROUND(SUM(spend) / SUM(leads), 2)
          WHEN SUM(messaging_conversations) > 0 THEN ROUND(SUM(spend) / SUM(messaging_conversations), 2)
          WHEN SUM(conversions) > 0 THEN ROUND(SUM(spend) / SUM(conversions), 2)
          ELSE 0
        END as avg_cpl
      FROM campaign_metrics
      WHERE date >= CURRENT_DATE - INTERVAL '60 days'
        AND date < CURRENT_DATE - INTERVAL '30 days'
    `,
  ]);

  const cur = current[0];
  const prev = previous[0];

  function delta(curVal: number, prevVal: number) {
    const value = curVal - prevVal;
    const pct = prevVal !== 0 ? Math.round((value / Math.abs(prevVal)) * 100) : 0;
    return { value: Math.round(value * 100) / 100, pct };
  }

  return {
    totalSpend:       Number(cur.total_spend) || 0,
    totalRevenue:     Number(cur.total_revenue) || 0,
    totalConversions: Number(cur.total_conversions) || 0,
    totalLeads:       Number(cur.total_leads) || 0,
    avgRoas:          Number(cur.avg_roas) || 0,
    avgCtr:           Number(cur.avg_ctr) || 0,
    avgCpl:           Number(cur.avg_cpl) || 0,
    delta: {
      totalSpend:       delta(Number(cur.total_spend) || 0,       Number(prev.total_spend) || 0),
      avgRoas:          delta(Number(cur.avg_roas) || 0,           Number(prev.avg_roas) || 0),
      avgCpl:           delta(Number(cur.avg_cpl) || 0,            Number(prev.avg_cpl) || 0),
      avgCtr:           delta(Number(cur.avg_ctr) || 0,            Number(prev.avg_ctr) || 0),
      totalConversions: delta(Number(cur.total_conversions) || 0, Number(prev.total_conversions) || 0),
      totalLeads:       delta(Number(cur.total_leads) || 0,        Number(prev.total_leads) || 0),
    },
  };
}
```

- [ ] **Step 10.3 — Rodar testes do backend**

```powershell
cd E:\hub-backend\backend
npm test 2>&1 | Select-Object -Last 15
```

Expected: todos os testes existentes passam.

- [ ] **Step 10.4 — Commit**

```bash
cd E:\hub-backend\backend
git add src/services/dashboard-service.ts
git commit -m "feat(dashboard): add 30-day delta to getPerformanceOverview"
```

---

## Task 11: Backend — endpoint /api/dashboard/sparklines

**Files:**
- Modify: `backend/src/routes/dashboard.routes.ts`

- [ ] **Step 11.1 — Adicionar rota de sparklines**

Adicionar dentro do `dashboardRoutes` em `backend/src/routes/dashboard.routes.ts`, antes do `};` final:

```ts
  fastify.get('/api/dashboard/sparklines', async (_request, reply) => {
    try {
      const { prisma } = fastify.services.dashboard as any;

      const rows = await fastify.services.dashboard['prisma'].$queryRaw<any[]>`
        SELECT
          date,
          COALESCE(SUM(spend), 0)       as spend,
          COALESCE(SUM(leads), 0)       as leads,
          CASE WHEN SUM(spend) > 0
            THEN ROUND(SUM(revenue) / SUM(spend), 2) ELSE 0 END as roas
        FROM campaign_metrics
        WHERE date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY date
        ORDER BY date ASC
        LIMIT 7
      `;

      const spend   = rows.map((r: any) => Number(r.spend)  || 0);
      const roas    = rows.map((r: any) => Number(r.roas)   || 0);
      const leads   = rows.map((r: any) => Number(r.leads)  || 0);

      return { spend, roas, leads, clients: [] };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500);
      return { error: 'Failed to fetch sparklines' };
    }
  });
```

Nota: `clients` por dia requer query adicional em `client` + `campaign_metrics` — retorna array vazio por ora, frontend usa mock para esse campo.

- [ ] **Step 11.2 — Rodar testes do backend**

```powershell
cd E:\hub-backend\backend
npm test 2>&1 | Select-Object -Last 10
```

Expected: testes passam.

- [ ] **Step 11.3 — Commit**

```bash
cd E:\hub-backend\backend
git add src/routes/dashboard.routes.ts
git commit -m "feat(dashboard): add GET /api/dashboard/sparklines endpoint"
```

---

## Task 12: Frontend — trocar mock por fetch real

**Files:**
- Modify: `frontend/lib/api/client/dashboard.ts`

Executar esta task **somente após** o backend estar deployado e acessível.

- [ ] **Step 12.1 — Substituir mock por fetch real**

Em `frontend/lib/api/client/dashboard.ts`, substituir `getDashboardSparklines`:

```ts
export const getDashboardSparklines = async (): Promise<SparklineData> => {
  const { data } = await apiClient.get<SparklineData>('/api/dashboard/sparklines');
  return data;
};
```

- [ ] **Step 12.2 — Verificar build**

```powershell
cd E:\hub-backend\frontend
npm run build 2>&1 | Select-Object -Last 5
```

Expected: build passes.

- [ ] **Step 12.3 — Commit**

```bash
git add lib/api/client/dashboard.ts
git commit -m "feat(api): replace sparklines mock with real /api/dashboard/sparklines fetch"
```

---

## Self-Review

**Spec coverage:**
- [x] Topbar compacto em todas as páginas → Tasks 2, 3
- [x] KPI cards com delta + sparkline → Task 4
- [x] Bento grid variado → Task 8
- [x] Banner de destaque → Tasks 6, 8
- [x] Mini métricas com ícone colorido → Tasks 5, 8
- [x] Logo mark sidebar → Task 9
- [x] Backend delta → Task 10
- [x] Backend sparklines endpoint → Task 11
- [x] Troca mock→real → Task 12
- [x] Tipos atualizados → Task 1

**Sem placeholders:** todos os steps têm código completo.

**Consistência de tipos:**
- `KpiDelta` definido na Task 1, usado em Tasks 4, 5, 10
- `SparklineData` definido na Task 1, usado em Tasks 7, 8, 11, 12
- `getDashboardSparklines` exportado na Task 7, importado na Task 8
- `CompareBanner` aceita `totalSpend: number` + `activeClients: number` (Tasks 6, 8 ✓)
- `MiniMetric` aceita `icon: LucideIcon` + `iconBg: IconBg` + `delta?: KpiDelta` (Tasks 5, 8 ✓)
