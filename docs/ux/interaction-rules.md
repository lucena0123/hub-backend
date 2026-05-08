# Interaction Rules — Hub B2B

> Regras de comportamento interativo. Consistência é mais importante que criatividade.

---

## Regras de Click / Tap

### Elementos clicáveis
- Todo elemento clicável deve ter `cursor-pointer`
- Área mínima de clique: 36×36px (desktop) — preferível 44×44px
- Nunca usar `onClick` em `<div>` sem `role="button"` e `tabIndex={0}`
- Botões de ação: sempre `<button type="button">` ou `<Button>`
- Links de navegação: sempre `<Link>` ou `<a>`

### Estados de hover
- Transição: `transition-colors duration-150` ou `transition-all duration-200`
- Cards: `hover:bg-muted/30` ou `hover:shadow-md hover:-translate-y-0.5`
- Botões: tratados automaticamente pelo componente `Button`
- Links inline: `hover:text-foreground` quando são muted por padrão

### Estados de focus
- `focus-visible:ring-2 focus-visible:ring-primary/50` em elementos interativos
- Nunca remover `outline` sem substituir por alternativa acessível
- Tab order deve seguir a ordem visual da tela

---

## Regras de Loading

### Hierarquia de loading states
1. **Skeleton (preferido):** para conteúdo que tem forma definida
2. **Spinner inline:** para ações de botão (loading após click)
3. **Spinner centralizado:** só para carregamento inicial da tela inteira

### Loading de tela
```tsx
// ✅ Correto — dentro do layout
<PageShell title="...">
  <div className="py-12 flex justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
</PageShell>

// ❌ Errado — substitui o layout inteiro
<div className="min-h-screen flex items-center justify-center">
  <Loader2 />
</div>
```

### Loading de ação (botão)
```tsx
<Button disabled={loading} onClick={handleAction}>
  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
  {loading ? 'Processando...' : 'Executar'}
</Button>
```

**Regras:**
- Botão fica `disabled` durante loading
- Texto muda para indicar o que está acontecendo
- Nunca mostrar spinner fora do contexto da ação
- Loading máx visual: 10 segundos — depois mostrar `ErrorState`

---

## Regras de Feedback

### Sucesso
- Toast: `"Ação executada com sucesso"` — duração 3s
- Estado visual: item atualiza cor/badge sem reload da lista
- Sem modal de confirmação de sucesso

### Erro
- Toast com mensagem específica — duração 5s (mais tempo para ler)
- Botão volta ao estado original (não fica preso em loading)
- Se erro é recuperável: mostrar botão "Tentar novamente" no toast ou inline

### Confirmação de ação destrutiva
- Obrigatória para: deletar, pausar em massa, rollback, logout
- Usar `Dialog` com:
  - Título claro do que será feito
  - Consequências em 1 frase
  - Botão destrutivo vermelho (variant="destructive")
  - Botão de cancelar (variant="outline")
- Nunca usar `window.confirm()`

---

## Regras de Formulário

### Labels
- Sempre visíveis — nunca usar placeholder como label única
- Label: `<label>` com `htmlFor` apontando para o input

### Validação
- Validar no blur (quando o campo perde foco), não no keystroke
- Mensagem de erro: abaixo do campo, em `text-destructive text-xs`
- Campo inválido: `border-destructive focus:ring-destructive`

### Submit
- Desabilitar botão de submit durante loading
- Exibir loading inline no botão
- Após sucesso: fechar modal/form ou redirecionar
- Após erro: manter form preenchido, mostrar erro específico

---

## Regras de Expansão / Accordion

- `defaultOpen={false}` — conteúdo colapsado por padrão (progressive disclosure)
- Exceção: quando há ≤3 itens e todos são relevantes (pode abrir por padrão)
- Animação: `transition-all duration-200 ease-out`
- Ícone de toggle: `ChevronDown` com `rotate-180` quando aberto
- Trigger deve ocupar toda a largura do container (área de clique grande)
- Conteúdo expandido: `px-4 pb-4` de padding interno

---

## Regras de Drawer / Painel Lateral

- Largura: `360px` (mobile: full-width)
- Abrir: slide-in da direita (`translateX(0)`)
- Fechar: slide-out para direita + overlay fade-out
- Overlay: `bg-black/40` — clicável para fechar
- Botão fechar: sempre visível no header do drawer
- Conteúdo: scroll interno, header fixo, footer fixo com ações principais

---

## Regras de Filtros

- Filtro ativo: visualmente claro (`bg-primary text-primary-foreground`)
- Filtro inativo: `bg-card border text-muted-foreground`
- "Todos" / "All": sempre o primeiro item, sempre presente
- Aplicar filtro: imediato (sem botão "Aplicar") — exceto filtros complexos
- Limpar filtros: botão "Limpar" aparece somente quando há filtro ativo
- Filtros com contagem: `ROAS (3)` — quando o número ajuda a decidir

---

## Regras de Animação

- Micro-interações: 150-200ms ease-out
- Transições de página: 200-300ms
- Carregamento de conteúdo: 200-400ms com skeleton
- Nunca usar `transition-all` em elementos com `height: auto` — usar `max-height`
- Respeitar `prefers-reduced-motion`: remover animações não-essenciais
- Sparklines e gráficos: `isAnimationActive={false}` (Recharts) — dados primeiro, animação opcional

---

## Regras de Teclado e Acessibilidade

- Tab order: segue ordem visual (esquerda→direita, topo→baixo)
- Esc: fecha modals, drawers, menus dropdown
- Enter/Space: ativa elemento focado
- Aria labels: obrigatório em ícones e botões sem texto visível
- `aria-hidden="true"` em ícones decorativos
- Contraste: mínimo 4.5:1 para texto normal, 3:1 para texto grande

---

## Regras de Drag and Drop

- Cursor: `cursor-grab` em repouso, `cursor-grabbing` durante drag
- Visual durante drag: `opacity-50` no item original, `shadow-lg` no ghost
- Drop zone ativa: `border-primary border-dashed bg-primary/5`
- Cancelar drag: Esc ou drop fora de zona válida
- Feedback pós-drop: animação de confirmação no destino (ring flash 200ms)
