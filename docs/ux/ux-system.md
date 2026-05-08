# UX System — Hub B2B Radar Operacional

> Documento mestre do sistema de UX. Todas as decisões de interface devem ser validadas contra este documento.

---

## Identidade do Produto

**Hub B2B** é um sistema operacional para gestão de agências de tráfego pago. Não é um dashboard genérico — é uma ferramenta de decisão contínua usada por operadores treinados em fluxo de trabalho intenso.

**Usuários primários:**
- Operadores de tráfego (uso diário, múltiplas vezes ao dia)
- Gestores de CS (uso diário)
- Diretores de agência (uso semanal, visão executiva)

**Contexto de uso:**
- Desktop — tela ≥ 1280px é o caso principal
- Sessões longas (30min–3h)
- Alta frequência de decisões em paralelo
- Ambiente de múltiplas abas/telas abertas

---

## Filosofia Central

A interface deve comunicar:

> **"Estou no controle. Sei o que é urgente. Sei o que fazer agora."**

Cada tela deve responder a estas três perguntas em menos de 3 segundos de leitura:
1. O que está crítico/quebrado?
2. O que precisa de ação minha?
3. O que está funcionando (posso ignorar por ora)?

---

## Arquitetura de Camadas

Toda tela segue exatamente 4 camadas hierárquicas:

### Camada 1 — Executive Summary
Sempre visível. Nunca colapsa. Ocupa máximo 15% da altura da tela.
- KPIs principais (máx 4)
- Status de saúde operacional
- Contagem de alertas críticos
- Próxima ação recomendada (1 botão primário)

### Camada 2 — Operational Queue
Fila de decisão. Sempre na metade superior da tela. Itens ordenados por urgência.
- Itens que precisam de ação AGORA (severidade crítica)
- Itens que precisam de revisão (severidade média)
- Cada item: resumo em 1 linha + 1-2 ações contextuais
- Sem detalhes técnicos — só o necessário para decidir

### Camada 3 — Deep Analysis
Acessível por accordion, aba ou drawer. Nunca expandida por padrão.
- Gráficos de tendência
- Tabelas completas com filtros
- Métricas detalhadas por dimensão
- Análises comparativas

### Camada 4 — Logs & Audit
Sempre colapsada por padrão. Abre em accordion ou drawer lateral.
- Histórico de eventos
- Audit trail de ações
- Outputs de IA detalhados
- Logs técnicos

---

## Princípios Obrigatórios

### 1. Progressive Disclosure
- Mostrar resumo → expandir detalhes sob demanda
- Cards mostram: status + valor principal + 1 ação
- Detalhes ficam em: accordion / drawer / modal / tela de detalhe
- **Regra:** se o usuário não precisa ver para decidir, esconder por padrão

### 2. Hierarquia Visual Real
- Crítico > Atenção > Normal > Histórico
- Hierarquia expressa por: tamanho tipográfico, peso, contraste, espaçamento — nunca só por cor
- Card de KPI deve ser visualmente mais pesado que card de log
- Ação primária deve ser impossível de perder

### 3. Escaneabilidade
- Usuário deve entender o estado da tela em 3 segundos sem ler nada
- Status semântico visível no primeiro glyph de cada item
- Agrupamento por prioridade, não por tipo ou ordem alfabética
- Densidade máxima: 5-7 itens visíveis sem scroll

### 4. Estados Semânticos Consistentes
Usar sempre `StatusPill` do design system:
| Estado | Cor | Uso |
|--------|-----|-----|
| `critical` | Vermelho destructive | Ação urgente — risco imediato |
| `warning` | Âmbar | Atenção necessária — risco em crescimento |
| `healthy` | Verde | Operando bem — pode ignorar |
| `completed` | Roxo/Primary | Finalizado com sucesso |
| `blocked` | Laranja | Impedimento ativo — precisa de intervenção |
| `pending` | Cinza/Muted | Aguardando — sem urgência |
| `info` | Azul/Primary | Informativo — sem ação necessária |

### 5. Ação Contextual
- Cada bloco deve ter no máximo 1 ação primária (botão filled)
- Ações secundárias: links ou botões ghost
- Ações destrutivas: sempre com confirmação e visual vermelho
- Ações em lote: só aparecem quando há seleção ativa

### 6. Organização Operacional
- Filas de decisão > listas alfabéticas
- Agrupamento por urgência > agrupamento por tipo
- Resumo > detalhe completo visível
- Próxima ação clara > informação passiva

---

## Tokens Visuais

### Tipografia (escala de hierarquia)
| Uso | Tamanho | Peso |
|-----|---------|------|
| Eyebrow | 11px | 600 semibold |
| Page title | 22px | 800 extrabold |
| Section header | 14px | 700 bold |
| Card title | 13px | 600 semibold |
| Body | 13-14px | 400 regular |
| Caption / meta | 11-12px | 500 medium |
| Metric value | 24-32px | 700-800 |

### Espaçamento
- Base: 4dp/8dp grid
- Card padding: `px-4 py-3` (compacto) ou `px-5 py-4` (padrão)
- Section gap: `space-y-6` ou `gap-6`
- Item gap dentro de lista: `space-y-2`

### Bordas e Raio
- Cards: `rounded-xl` (12px)
- Pills: `rounded-full`
- Inputs/badges small: `rounded-lg` (8px)
- Severity border: `border-l-[3px]` com cor semântica

### Sombras
- Card padrão: `shadow-sm`
- Card elevado (hover): `shadow-md`
- Modal/drawer: `shadow-xl`

---

## Regras de Densidade

| Contexto | Max itens visíveis | Scroll |
|----------|-------------------|--------|
| Operational Queue | 5-7 | Não (colapsar o resto) |
| Lista principal | 10-15 | Sim, com paginação |
| Tabela de análise | 20+ | Sim, com virtualização |
| Sidebar/drawer | 8-12 | Sim, natural |

---

## Responsividade

| Breakpoint | Comportamento |
|-----------|---------------|
| < 768px (mobile) | Sidebar colapsada, cards em coluna única, Camada 3/4 escondidas por padrão |
| 768-1024px (tablet) | 2 colunas, drawer em vez de sidebar lateral |
| ≥ 1024px (desktop) | Layout completo com sidebar expandida |
| ≥ 1280px (large) | Grade bento, painéis laterais visíveis |

---

## O que a Interface NÃO deve ser

- Dashboard genérico sem fluxo operacional
- Template de admin com dados listados
- Painel decorativo sem hierarquia funcional
- Interface que requer leitura de todo o conteúdo para entender o estado
