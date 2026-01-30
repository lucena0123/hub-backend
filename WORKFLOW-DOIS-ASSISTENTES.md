# Workflow para Trabalho com Dois Assistentes

## 🎯 Estratégia Recomendada: Divisão por Camadas

### **Claude** (Backend & Infraestrutura)
```
Responsabilidades:
✅ Backend (Fastify, APIs)
✅ Banco de dados (PostgreSQL, migrations, queries)
✅ Redis (cache, sessions)
✅ Infraestrutura (Docker, deployment)
✅ Lógica BPMN e processos
✅ Gerenciadores (queue, capacity, lock, audit)
```

### **Codex** (Frontend & UI)
```
Responsabilidades:
✅ Frontend (Next.js, React)
✅ Componentes UI (shadcn/ui, custom)
✅ Páginas e rotas
✅ Estilização (TailwindCSS)
✅ Gráficos e visualizações (Recharts)
✅ UX e interações
```

---

## 📋 Workflow Git

### **Setup Inicial** (já feito ✅)
```bash
# Repositório inicializado
# Branches criadas:
- main          # Código em produção
- claude-work   # Trabalho do Claude
- codex-work    # Trabalho do Codex
```

### **Fluxo de Trabalho**

#### **Para Claude:**
```bash
# 1. Mudar para sua branch
git checkout claude-work

# 2. Trabalhar normalmente
# ... fazer mudanças em backend/ ...

# 3. Commit
git add backend/
git commit -m "feat: adiciona endpoint X"

# 4. Merge para main quando pronto
git checkout main
git merge claude-work
```

#### **Para Codex:**
```bash
# 1. Mudar para sua branch
git checkout codex-work

# 2. Trabalhar normalmente
# ... fazer mudanças em frontend/ ...

# 3. Commit
git add frontend/
git commit -m "feat: adiciona componente Y"

# 4. Merge para main quando pronto
git checkout main
git merge codex-work
```

---

## 🔄 Sincronização entre Assistentes

### **Quando Claude termina uma feature:**
1. Claude faz commit em `claude-work`
2. Merge para `main`
3. **Você avisa Codex**: "Claude atualizou a API X, merge main na sua branch"
4. Codex: `git checkout codex-work && git merge main`

### **Quando Codex termina uma feature:**
1. Codex faz commit em `codex-work`
2. Merge para `main`
3. **Você avisa Claude**: "Codex criou componente Y, merge main se precisar"
4. Claude: `git checkout claude-work && git merge main`

---

## 📁 Estrutura de Arquivos (Evitar Conflitos)

```
Hub/
├── backend/              ← CLAUDE trabalha aqui
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── frontend/             ← CODEX trabalha aqui
│   ├── app/
│   ├── components/
│   └── package.json
│
├── docker-compose.yml    ← CLAUDE (infraestrutura)
│
└── *.md                  ← AMBOS podem editar (com coordenação)
```

---

## 🚨 Regras para Evitar Conflitos

### ❌ **NÃO FAZER:**
- Ambos editando o mesmo arquivo simultaneamente
- Trabalhar direto na branch `main`
- Fazer merge sem testar
- Ignorar conflitos de merge

### ✅ **FAZER:**
- Cada um trabalha em sua branch
- Comunicar mudanças que afetam o outro
- Testar antes de merge
- Resolver conflitos imediatamente

---

## 💬 Comunicação Através de Você

### **Template de Mensagem:**

**Para Claude:**
```
Claude, o Codex criou um novo componente Dashboard que precisa de um
endpoint GET /api/dashboard/metrics. Pode implementar?
```

**Para Codex:**
```
Codex, o Claude atualizou a API de clients para retornar também
o campo 'tier'. Atualize o tipo TypeScript em types/index.ts
```

---

## 📝 Sistema de TODOs no Código

### **Claude deixa TODOs para Codex:**
```typescript
// backend/src/server.ts
app.get('/api/new-feature', async (req, res) => {
  // TODO-CODEX: Criar interface para este endpoint em frontend
  return { data: "nova feature" };
});
```

### **Codex deixa TODOs para Claude:**
```typescript
// frontend/components/feature.tsx
// TODO-CLAUDE: Implementar endpoint POST /api/feature
const handleSubmit = async () => {
  // await apiClient.post('/api/feature', data);
};
```

---

## 🔍 Checklist Antes de Merge

### **Claude (Backend):**
- [ ] Backend compila sem erros
- [ ] Testes passando (se houver)
- [ ] APIs documentadas
- [ ] Tipos TypeScript atualizados
- [ ] Docker ainda funciona

### **Codex (Frontend):**
- [ ] Frontend compila sem erros
- [ ] Build de produção funciona
- [ ] Componentes renderizam corretamente
- [ ] Tipos TypeScript sincronizados com backend
- [ ] UI responsiva

---

## 🎯 Exemplo de Sessão de Trabalho

### **Cenário: Adicionar feature de "Campanhas Ativas"**

#### **Passo 1 - Você define as responsabilidades:**
```
Claude: Crie endpoint GET /api/campaigns/active
Codex: Crie página /campaigns/active usando o endpoint do Claude
```

#### **Passo 2 - Claude trabalha:**
```bash
git checkout claude-work
# ... implementa endpoint ...
git commit -m "feat: add GET /api/campaigns/active endpoint"
git checkout main && git merge claude-work
```

#### **Passo 3 - Você avisa Codex:**
```
Codex, o endpoint está pronto. Faça merge da main e crie a página.
```

#### **Passo 4 - Codex trabalha:**
```bash
git checkout codex-work
git merge main  # pega mudanças do Claude
# ... implementa página ...
git commit -m "feat: add /campaigns/active page"
git checkout main && git merge codex-work
```

---

## 🚀 Estado Atual

### **Pronto para Uso:**
- ✅ Repositório Git inicializado
- ✅ Branches `claude-work` e `codex-work` criadas
- ✅ Commit inicial feito na `main`
- ✅ Backend funcionando (porta 3001)
- ✅ Frontend funcionando (porta 3000)

### **Próximos Passos:**
1. Você decide qual assistente trabalha em qual feature
2. Direciona cada um para sua branch
3. Coordena merges quando features estão prontas

---

## ⚡ Comandos Rápidos

### **Status do projeto:**
```bash
git status
git log --oneline --graph --all
```

### **Ver diferenças entre branches:**
```bash
git diff main..claude-work
git diff main..codex-work
```

### **Resolver conflitos:**
```bash
git merge --abort  # cancela merge problemático
git merge main     # tenta novamente
# ... resolve conflitos manualmente ...
git add .
git commit
```

---

## 📊 Monitoramento

### **Verificar trabalho de cada assistente:**
```bash
# Commits do Claude
git log claude-work --oneline

# Commits do Codex
git log codex-work --oneline

# Arquivos modificados por branch
git diff --name-only main..claude-work
git diff --name-only main..codex-work
```
