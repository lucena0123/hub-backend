# Anti-Patterns — Hub B2B

> O que NUNCA fazer. Cada item aqui tem uma alternativa correta.

---

## Anti-Pattern 1: Full-Screen Loading Takeover

```tsx
// ❌ PROIBIDO
<div className="min-h-screen flex items-center justify-center">
  <Loader2 />
</div>

// ✅ CORRETO
<PageShell title="...">
  <div className="py-16 flex justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
</PageShell>
```

**Por quê:** Destrói o contexto do usuário. Sidebar some, breadcrumb some. Parece que o app travou.

---

## Anti-Pattern 2: Todos os Itens com Mesmo Peso Visual

```tsx
// ❌ PROIBIDO — 10 cards iguais sem hierarquia
{items.map(item => <Card key={item.id}>{item.data}</Card>)}

// ✅ CORRETO — agrupado por prioridade
<SeveritySection label="Crítico" count={criticals.length} ...>
  {criticals.map(item => <Card key={item.id} ... />)}
</SeveritySection>
<SeveritySection label="Atenção" count={warnings.length} ...>
  {warnings.map(item => <Card key={item.id} ... />)}
</SeveritySection>
```

**Por quê:** O usuário não sabe onde olhar primeiro. Escaneabilidade zero.

---

## Anti-Pattern 3: signal-chip / Classes Legadas

```tsx
// ❌ PROIBIDO
<div className="signal-chip">Críticos {data.critical}</div>
<div className="edge-card hover-lift">...</div>
<div className="premium-shell">...</div>

// ✅ CORRETO
<StatusPill status="critical" label={`${data.critical} críticos`} />
<div className="rounded-xl border border-border bg-card shadow-sm">...</div>
```

**Por quê:** Classes legadas criam inconsistência e bugs em dark/light mode.

---

## Anti-Pattern 4: Detalhes Técnicos Sempre Expandidos

```tsx
// ❌ PROIBIDO — log técnico visível por padrão
<div className="space-y-4">
  <p>Parâmetro A: {value.paramA}</p>
  <p>Parâmetro B: {value.paramB}</p>
  <p>Timestamp: {value.createdAt}</p>
  <p>Request ID: {value.reqId}</p>
  <p>Threshold: {value.threshold}</p>
</div>

// ✅ CORRETO — detalhe colapsado por padrão
<ExpandableSection title="Detalhes técnicos" defaultOpen={false}>
  <p>Parâmetro A: {value.paramA}</p>
  ...
</ExpandableSection>
```

**Por quê:** Aumenta carga cognitiva. O usuário precisa processar informação que não usa para decidir.

---

## Anti-Pattern 5: Múltiplos SectionHeader para Organizar Conteúdo

```tsx
// ❌ PROIBIDO — SectionHeader usado como separador de tudo
<SectionHeader title="Resumo" />
<div>...</div>
<SectionHeader title="Filtros" />
<div>...</div>
<SectionHeader title="Lista" />
<div>...</div>

// ✅ CORRETO — separação por espaçamento e tipografia
<div className="space-y-8">
  {/* KPI Summary */}
  <div className="grid grid-cols-4 gap-4">...</div>

  {/* Filter bar inline */}
  <div className="flex gap-1.5">...</div>

  {/* List with severity grouping */}
  <div className="space-y-6">
    <SeveritySection ...>...</SeveritySection>
  </div>
</div>
```

**Por quê:** `SectionHeader` é para seções semânticas (IA insights, Performance), não para estrutura visual.

---

## Anti-Pattern 6: Loading Sem Skeleton

```tsx
// ❌ PROIBIDO — tela em branco enquanto carrega
if (loading) return null;

// ❌ PROIBIDO — spinner genérico no meio da tela
if (loading) return <div className="flex justify-center"><Loader2 /></div>;

// ✅ CORRETO — skeleton que preserva o layout
if (loading) return (
  <PageShell title="Central de Ações">
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  </PageShell>
);
```

**Por quê:** Skeleton comunica que o conteúdo está chegando, preserva o layout, reduz ansiedade.

---

## Anti-Pattern 7: Estado Vazio Inline

```tsx
// ❌ PROIBIDO — texto solto sem contexto
{items.length === 0 && (
  <p className="text-muted-foreground text-sm">Nenhum item encontrado.</p>
)}

// ✅ CORRETO — EmptyState padronizado
{items.length === 0 && (
  <EmptyState
    icon={Activity}
    title="Nenhuma tarefa pendente"
    description="Tudo está em dia. Novas tarefas aparecem aqui automaticamente."
  />
)}
```

**Por quê:** Estado vazio sem contexto gera dúvida: "Está carregando ainda? Há um bug? O filtro está errado?"

---

## Anti-Pattern 8: Cores Hardcoded (Hex ou Rgb)

```tsx
// ❌ PROIBIDO
<div style={{ backgroundColor: '#6366F1' }}>
<div className="bg-[#050505]">
<div style={{ color: 'rgba(255,255,255,0.7)' }}>

// ✅ CORRETO — sempre tokens
<div className="bg-primary">
<div className="bg-background">
<div className="text-foreground/70">
```

**Por quê:** Quebra dark/light mode. Impossível de manter a escala.

---

## Anti-Pattern 9: Ação Primária Escondida

```tsx
// ❌ PROIBIDO — 3 botões com mesmo peso, ação principal perdida
<div className="flex gap-2">
  <Button variant="outline">Performance</Button>
  <Button variant="outline">Board</Button>
  <Button variant="outline">Regras</Button>
</div>

// ✅ CORRETO — 1 primário, resto subordinado
<div className="flex items-center gap-2">
  <Button size="sm">Performance</Button>
  <Link href="..." className="text-xs text-muted-foreground hover:text-foreground">Board</Link>
  <Link href="..." className="text-xs text-muted-foreground hover:text-foreground">Regras</Link>
</div>
```

**Por quê:** O usuário perde tempo avaliando qual botão clicar quando todos têm o mesmo peso.

---

## Anti-Pattern 10: Modal de Confirmação para Ações Não-Destrutivas

```tsx
// ❌ PROIBIDO — confirmar ação reversível
<Dialog>
  <DialogTrigger>Marcar como visto</DialogTrigger>
  <DialogContent>
    <p>Tem certeza?</p>
    <Button>Confirmar</Button>
  </DialogContent>
</Dialog>

// ✅ CORRETO — ação direta com undo via toast
<Button onClick={handleMarkSeen}>Marcar como visto</Button>
// → toast: "Marcado como visto [Desfazer]"
```

**Por quê:** Modais de confirmação desnecessários treinam o usuário a ignorar todos os modais (incluindo os importantes).

---

## Anti-Pattern 11: Dashboard sem Fluxo Operacional

```tsx
// ❌ PROIBIDO — listagem de dados sem hierarquia ou ação
<div className="space-y-4">
  {clients.map(client => (
    <div key={client.id}>
      <p>{client.name}</p>
      <p>{client.spend}</p>
      <p>{client.cpl}</p>
    </div>
  ))}
</div>

// ✅ CORRETO — fila operacional com ação clara
<SeveritySection label="Atenção urgente" count={3} ...>
  {atRiskClients.map(client => (
    <OperationalHealthCard
      key={client.id}
      client={client}
      primaryAction={{ label: "Ver performance", href: `/clients/${client.id}/performance` }}
    />
  ))}
</SeveritySection>
```

**Por quê:** O usuário não sabe o que fazer. Um dashboard sem ação é um relatório estático.

---

## Anti-Pattern 12: Excesso de Scroll Vertical em Conteúdo Crítico

```tsx
// ❌ PROIBIDO — conteúdo crítico abaixo do fold
// (KPIs na linha 1, alertas críticos na linha 500)

// ✅ CORRETO — conteúdo crítico sempre acima do fold
// Regra: sem scroll para ver KPIs + fila de ação principal
```

**Por quê:** O usuário precisa de contexto ao abrir a tela. Scroll para encontrar informação crítica é falha de hierarquia.

---

## Anti-Pattern 13: Componentes Redundantes

```tsx
// ❌ PROIBIDO — reinventar Badge, Alert, Skeleton
<div className="px-2 py-0.5 text-xs font-semibold rounded bg-red-500/10 text-red-500">
  Crítico
</div>

// ✅ CORRETO — usar StatusPill
<StatusPill status="critical" />
```

**Por quê:** Código duplicado = bugs duplicados = inconsistência visual.

---

## Checklist Anti-Pattern

Antes de commitar, verificar:
- [ ] Sem `min-h-screen` em loading/error states
- [ ] Sem `signal-chip`, `edge-card`, `premium-*`, `hover-lift` legados
- [ ] Sem hex/rgb hardcoded no JSX ou `style={{}}`
- [ ] Sem listas flat sem hierarquia de severidade
- [ ] Sem detalhes técnicos expandidos por padrão
- [ ] Sem estado vazio como `<p>Nenhum item.</p>` solto
- [ ] Sem 3+ botões com mesmo peso visual
- [ ] Sem modal de confirmação para ações não-destrutivas
- [ ] Sem `SectionHeader` como separador genérico de layout
- [ ] Sem conteúdo crítico que requer scroll para ver
