# Dashboard Rules — Hub B2B

> Regras específicas para telas de dashboard operacional. Mais restritivas que as regras gerais.

---

## O que é um Dashboard Operacional

Um dashboard operacional não é um relatório. É uma **central de comando** onde o usuário:
- Vê o estado atual do sistema
- Identifica o que precisa de ação
- Executa ou delega ações
- Monitora o resultado

A diferença para um relatório: **o usuário toma decisões aqui, não apenas lê**.

---

## Regra 1: Hierarquia de Conteúdo

Toda tela de dashboard obedece esta ordem vertical:

```
1. Topbar (sempre)
   eyebrow + title + actions + meta com StatusPill

2. KPI Strip / Executive Summary (sempre)
   máx 4 KPIs, sempre visíveis, acima do fold

3. Operational Queue (quando há itens para ação)
   fila de decisão ordenada por urgência

4. Deep Analysis (colapsada por padrão)
   gráficos, tabelas, métricas secundárias

5. Logs & Audit (colapsada por padrão)
   eventos, histórico, outputs de IA
```

**Regra rígida:** Usuário deve ver KPIs e fila de ação **sem fazer scroll**.

---

## Regra 2: Densidade Máxima por Zona

| Zona | Max elementos visíveis | Política de overflow |
|------|----------------------|---------------------|
| KPI Strip | 4 KPIs | Sem scroll — reduzir KPIs |
| Operational Queue | 7 itens | Paginação ou "ver mais" |
| Seção de análise | 1 gráfico ou 1 tabela | Scroll interno |
| Sidebar/drawer | 10 itens | Scroll interno |

---

## Regra 3: KPI Strip Obrigatório

Todo dashboard com dados numéricos deve ter um KPI strip no topo.

**Estrutura:**
```
[Métrica 1: valor (delta)]  [Métrica 2: valor (delta)]  [Métrica 3: valor]  [Métrica 4: valor]
```

**Requisitos:**
- Valor principal: `text-[28-32px] font-extrabold`
- Delta (quando disponível): `StatusPill` ou badge colorido com ▲/▼
- Label: `text-[11-12px] font-semibold uppercase`
- Máximo 4 KPIs — remover os menos críticos
- Sparkline: opcional, mostra tendência de 7 dias
- Implementar com `KpiCard`

---

## Regra 4: Fila Operacional (Operational Queue)

Quando a tela tem itens que exigem ação humana, a fila é obrigatória.

**Regras:**
- Ordenação: crítico → atenção → normal → informativo
- Cada item: 1 linha de título + cliente + 1-2 ações
- Sem detalhes técnicos expandidos na lista
- Separadores de severidade com `SeveritySection`
- Se a fila está vazia: `EmptyState` com mensagem positiva ("Tudo em dia")
- Se há mais de 7 itens críticos: mostrar 5 + "Ver mais (N)"

---

## Regra 5: Gráficos

**Tipos permitidos e quando usar:**
| Tipo | Quando usar | Recharts |
|------|-----------|---------|
| `LineChart` | Tendência temporal | `<LineChart>` |
| `BarChart` / `ComposedChart` | Comparação entre categorias | `<Bar>` |
| Sparkline | Tendência inline em KPI card | `<LineChart>` sem eixos |
| Progress bar | % de conclusão, pacing | `<div>` CSS |

**Regras:**
- Sem eixos em sparklines (modo inline)
- Tooltips: sempre com `contentStyle` usando tokens CSS vars
- Sem animação: `isAnimationActive={false}` (performance em listas longas)
- Sem grid decorativo: gridlines só quando necessário para leitura
- Cores: usar `var(--primary)`, `var(--chart-2)`, etc. — nunca hex hardcoded

---

## Regra 6: Tabelas de Dados

**Quando usar tabelas:**
- Comparação de múltiplos itens em múltiplas dimensões
- Exportável / ordenável
- Mais de 5 colunas de dados

**Regras:**
- Header: `text-[11px] uppercase tracking-wide text-muted-foreground`
- Linha hover: `hover:bg-muted/30 transition-colors`
- Ordenável: indicador de direção na coluna ativa
- Paginação: para mais de 20 linhas
- Nunca mostrar tabela completa como conteúdo principal — usar em Camada 3

---

## Regra 7: Meta do PageShell

O meta slot do `PageShell` (ao lado/abaixo do título) deve conter:
- `StatusPill` com contagens de estados relevantes
- Máx 4 pills
- Nunca: formulários, inputs, botões primários (esses vão no slot `actions`)

**Exemplos corretos:**
```tsx
meta={
  <div className="flex flex-wrap gap-2">
    <StatusPill status="critical" label="3 críticos" />
    <StatusPill status="warning" label="7 atenção" />
    <StatusPill status="pending" label="42 total" />
  </div>
}
```

---

## Regra 8: Actions do PageShell

O slot `actions` do `PageShell` (direita do topbar) contém:
- No máximo 1 botão primário (ação principal da tela)
- No máximo 2 botões secundários (variant="outline" ou "ghost")
- Nunca mais de 3 ações no topbar

**Exemplos:**
```tsx
// ✅ Correto
actions={
  <div className="flex gap-2">
    <Button variant="outline" size="sm">Exportar</Button>
    <Button size="sm">+ Novo Lead</Button>
  </div>
}

// ❌ Errado — muitas ações
actions={
  <div className="flex gap-2">
    <Button>A</Button><Button>B</Button><Button>C</Button><Button>D</Button>
  </div>
}
```

---

## Regra 9: Responsividade em Dashboards

| Breakpoint | Adaptação |
|-----------|-----------|
| Mobile (<768px) | KPI strip: 2 colunas; Fila: 1 coluna; Análise: colapsada |
| Tablet (768-1024px) | KPI strip: 2-4 colunas; Layout: 1 coluna com padding |
| Desktop (≥1024px) | Layout completo: bento grid disponível |

**Prioridade mobile:**
1. KPI strip (sempre visível)
2. Alertas críticos
3. Fila de ação resumida (máx 3 itens)
4. Link "Ver tudo" para Camada 2 completa

---

## Regra 10: Auto-refresh

Quando a tela tem dados em tempo real:
- Mostrar timestamp de última atualização (ex: "Atualizado 2m atrás")
- Auto-refresh: máx a cada 30s para dados críticos, 60s para dados normais
- Indicador visual de refresh: spinner pequeno no timestamp, não na tela inteira
- Botão manual de refresh sempre disponível
- Nunca usar `setInterval` sem cleanup no `useEffect`

---

## Checklist Pré-Deploy de Dashboard

- [ ] KPIs estão acima do fold sem scroll?
- [ ] Fila operacional está ordenada por urgência?
- [ ] Camadas 3 e 4 estão colapsadas por padrão?
- [ ] `EmptyState` existe para todos os casos de lista vazia?
- [ ] `ErrorState` existe dentro do `PageShell` (não full-screen)?
- [ ] Loading state usa skeleton ou spinner dentro do layout?
- [ ] Máx 4 KPIs no strip?
- [ ] StatusPill no meta do PageShell?
- [ ] Nenhum `signal-chip` ou `edge-card` ou classe legada?
- [ ] Cores via tokens CSS vars (não hex hardcoded)?
- [ ] Gráficos com `isAnimationActive={false}`?
- [ ] Ações no topbar: máx 3?
