# Dashboard Redesign 2026 — Design Spec

**Data:** 2026-05-08  
**Status:** Aprovado  
**Referência visual:** `mockups/design-system-2026.html`

---

## Objetivo

Implementar as mudanças estruturais do mockup 2026 além dos tokens de cor já migrados:
- Topbar compacto em todas as páginas (título 22px ao invés de clamp 2-3.6rem)
- KPI cards com delta real + sparkline de 7 dias
- Dashboard com bento grid variado, banner de destaque e mini métricas
- Logo mark na sidebar

**Estratégia:** Opção C — frontend com mock data + backend em paralelo. Quando o backend tiver delta e sparklines, troca-se o mock por fetch real em `lib/api/client.ts` sem tocar em componentes.

---

## Arquitetura

### Novos componentes

| Arquivo | Responsabilidade |
|---------|-----------------|
| `frontend/components/layout/topbar.tsx` | Topbar compacto: eyebrow + title + actions slot |
| `frontend/components/dashboard/kpi-card.tsx` | Card com valor grande, delta badge, sparkline |
| `frontend/components/dashboard/mini-metric.tsx` | Item de métrica com ícone colorido + delta |
| `frontend/components/dashboard/compare-banner.tsx` | Card gradient indigo com CTA |

### Arquivos modificados

| Arquivo | O que muda |
|---------|-----------|
| `frontend/components/layout/page-shell.tsx` | Integra `Topbar`; aceita prop `actions?: ReactNode` |
| `frontend/app/globals.css` | `.page-title` → `22px / font-weight: 800` |
| `frontend/app/page.tsx` | Bento grid, novos componentes, mock data para sparklines |
| `frontend/components/navigation/app-sidebar.tsx` | Logo mark 30×30px indigo + texto "Hub B2B" 15px |
| `frontend/lib/api/client.ts` | Adiciona `getDashboardSparklines()` (retorna mock por ora) |
| `frontend/types/index.ts` | Adiciona tipos `KpiDelta`, `SparklineData`, atualiza `DashboardOverview` |
| `backend/src/services/dashboard-service.ts` | Delta fields em `getPerformanceOverview()` |
| `backend/src/routes/dashboard.routes.ts` | Novo `GET /api/dashboard/sparklines` |

---

## Seção 1: Topbar + PageShell

### Componente `Topbar`

```tsx
// frontend/components/layout/topbar.tsx
interface TopbarProps {
  eyebrow: string
  title: string
  actions?: React.ReactNode
}
```

- `eyebrow`: `11px font-weight-600 uppercase tracking-[0.1em] text-primary`
- `title`: `22px font-weight-800 text-foreground`
- `actions`: alinhado à direita na mesma linha que eyebrow+title em desktop; abaixo em mobile
- Layout: `flex items-end justify-between mb-6`

### PageShell atualizado

```tsx
// frontend/components/layout/page-shell.tsx
interface PageShellProps {
  eyebrow: string
  title: string
  description?: string
  meta?: React.ReactNode
  actions?: React.ReactNode   // novo
  children: React.ReactNode
}
```

- Renderiza `<Topbar eyebrow={eyebrow} title={title} actions={actions} />`
- Remove o bloco `page-header` atual com grid de 280px à direita
- `description` e `meta` ficam abaixo do Topbar se presentes

### globals.css

```css
.page-title {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}
```

Remove o `clamp(2rem, 4vw, 3.6rem)` atual.

---

## Seção 2: KpiCard

```tsx
// frontend/components/dashboard/kpi-card.tsx
interface KpiCardProps {
  label: string
  value: string | number
  unit?: string
  delta?: { value: number; pct: number }   // positivo = up, negativo = down
  sparklineData?: number[]                  // 7 pontos, opcional
  color?: 'default' | 'emerald' | 'amber'  // cor do valor principal
}
```

**Layout:**
```
┌─────────────────────────────────┐
│ CLIENTES ATIVOS                 │  ← label: 12px uppercase muted
│ 24              ▲ +3  (+14%)   │  ← value: 32px bold + delta pill
│ ▁▂▃▅▄▆▇█                      │  ← sparkline recharts LineChart 40px
└─────────────────────────────────┘
```

**Delta badge:**
- Positivo: `bg-emerald-50 text-emerald-700` (dark: `bg-emerald-900/20 text-emerald-400`)
- Negativo: `bg-red-50 text-red-700` (dark: `bg-red-900/20 text-red-400`)
- Formato: `▲ +N (+X%)` ou `▼ -N (-X%)`

**Sparkline:**
- `recharts` `<LineChart>` sem eixos, sem tooltip, sem grid
- `height={40}`, linha `stroke="var(--primary)"` ou cor do card
- Se `sparklineData` não vier: sparkline oculto, layout não quebra

---

## Seção 3: Dashboard Bento Grid

### Grid layout

```
[ KpiCard ] [ KpiCard ] [ KpiCard ] [ KpiCard ]   ← col-span-1 cada
[ Gráfico barras (col-span-2)      ] [ Banner (col-span-2)        ]
[ Log de eventos (col-span-3)                  ] [ Mini métricas (col-span-1) ]
```

CSS: `grid grid-cols-4 gap-4`

### Compare Banner (`compare-banner.tsx`)

```tsx
interface CompareBannerProps {
  totalSpend: number
  activeClients: number
}
```

- Fundo: `bg-gradient-to-br from-primary to-[#4F46E5]`
- Eyebrow: `"PORTFÓLIO"` em branco 70% opacidade
- Título: `"Performance do Mês"` branco bold
- Subtítulo: `"R$ {totalSpend} investidos · {activeClients} clientes ativos"`
- Botão: `bg-white text-primary rounded-md px-3 py-1.5 text-xs font-semibold` → link `/executive`
- Decoração: dois círculos `bg-white/8` posicionados absolutos (igual ao mockup)

### MiniMetric (`mini-metric.tsx`)

```tsx
interface MiniMetricProps {
  icon: React.ElementType   // Lucide icon
  iconBg: 'indigo' | 'emerald' | 'amber' | 'rose'
  label: string
  value: string
  delta?: { pct: number }
}
```

- Ícone: `32×32px rounded-lg` com fundo colorido (`bg-[#eef2ff]` para indigo, etc.)
- Nome: `13px font-weight-600`
- Valor: `14px font-weight-700`
- Delta: `11px font-weight-600 text-emerald-600` (verde se +, vermelho se -)
- Separador: `border-b border-border` entre itens; último sem borda

### Mini métricas do dashboard

Usando dados do `overview.performance` existente:

| Ícone | Label | Valor | Delta source |
|-------|-------|-------|--------------|
| TrendingUp | ROI Médio | `{avgRoas}x` | `delta.avgRoas` |
| DollarSign | CPL Médio | `R${avgCpl}` | `delta.avgCpl` |
| MousePointer | CTR Médio | `{avgCtr}%` | `delta.avgCtr` |
| Users | Conversões | `{totalConversions}` | `delta.totalConversions` |

---

## Seção 4: Sidebar Logo Mark

No `app-sidebar.tsx`, substituir o bloco `sidebar-brand` atual:

```tsx
// ANTES
<span className="sidebar-brand-kicker">Agency Console</span>
<span className="sidebar-brand-title">Hub<span className="text-primary">.</span></span>

// DEPOIS
<div className="flex items-center gap-2.5">
  <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-primary text-white text-sm font-extrabold flex-shrink-0">
    H
  </div>
  {!collapsed && (
    <span className="text-[15px] font-bold text-sidebar-foreground">Hub B2B</span>
  )}
</div>
```

- Collapsed: só o logo mark aparece (30×30px quadrado indigo)
- Expanded: logo mark + "Hub B2B"

---

## Backend (paralelo, não bloqueia frontend)

### Delta em `getPerformanceOverview()`

Adicionar segunda query para período 31-60 dias e calcular delta:

```ts
// Novo campo no DashboardOverview.performance
delta: {
  totalSpend: number    // valor absoluto de diferença
  avgRoas: number
  avgCpl: number
  avgCtr: number
  totalConversions: number
  totalLeads: number
}
```

### Endpoint `GET /api/dashboard/sparklines`

```ts
// Response
{
  spend:   number[]   // 7 valores diários (mais antigo → mais recente)
  roas:    number[]
  leads:   number[]
  clients: number[]
}
```

Query: `GROUP BY date ORDER BY date DESC LIMIT 7` na `campaign_metrics`.

### Mock temporário no frontend

```ts
// frontend/lib/api/client.ts
export async function getDashboardSparklines() {
  // TODO: replace with real fetch when backend is ready
  return {
    spend:   [420, 380, 510, 490, 620, 580, 640],
    roas:    [2.1, 2.3, 2.0, 2.4, 2.6, 2.5, 2.8],
    leads:   [18, 22, 19, 25, 28, 24, 30],
    clients: [22, 22, 23, 23, 24, 24, 24],
  };
}
```

---

## Tipos novos (`frontend/types/index.ts`)

```ts
export interface KpiDelta {
  value: number
  pct: number
}

export interface SparklineData {
  spend: number[]
  roas: number[]
  leads: number[]
  clients: number[]
}

// Atualizar DashboardOverview.performance
performance: {
  totalSpend: number
  totalRevenue: number
  totalConversions: number
  totalLeads: number
  avgRoas: number
  avgCtr: number
  avgCpl: number
  delta?: {                    // opcional — não existe ainda no backend
    totalSpend: number
    avgRoas: number
    avgCpl: number
    avgCtr: number
    totalConversions: number
    totalLeads: number
  }
}
```

---

## Ordem de implementação

1. Tipos (`types/index.ts`)
2. Componentes novos (`kpi-card`, `mini-metric`, `compare-banner`, `topbar`)
3. PageShell + globals.css (topbar compacto)
4. Sidebar logo mark
5. Dashboard page (bento grid + novos componentes)
6. Backend delta + sparkline endpoint (paralelo)
7. Trocar mock por fetch real em `lib/api/client.ts`

---

## O que não muda

- Nenhuma lógica de negócio ou data fetching existente é removida
- Contratos de API existentes não quebram (delta é campo adicional opcional)
- Páginas internas ganham topbar compacto automaticamente via `PageShell`
- `premium-*` e `signal-chip` CSS permanecem (migração separada)
