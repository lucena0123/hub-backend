# 🚀 Quick Reference - Trabalho com Dois Assistentes

## 📋 Divisão de Responsabilidades

| Área | Assistente | Arquivos |
|------|-----------|----------|
| **Backend API** | Claude | `backend/src/*.ts` |
| **Database** | Claude | `backend/prisma/*`, `*.sql` |
| **Infraestrutura** | Claude | `docker-compose.yml` |
| **Frontend** | Codex | `frontend/app/*`, `frontend/components/*` |
| **UI Components** | Codex | `frontend/components/ui/*` |
| **Estilos** | Codex | `frontend/app/globals.css` |

---

## 🌿 Branches

- `main` - Código estável
- `claude-work` - Trabalho do Claude
- `codex-work` - Trabalho do Codex

---

## ⚡ Comandos Essenciais

### Para Claude
```bash
git checkout claude-work    # Ir para branch de trabalho
# ... fazer mudanças ...
git add backend/
git commit -m "sua mensagem"
git checkout main
git merge claude-work
```

### Para Codex
```bash
git checkout codex-work     # Ir para branch de trabalho
# ... fazer mudanças ...
git add frontend/
git commit -m "sua mensagem"
git checkout main
git merge codex-work
```

### Sincronizar com mudanças do outro assistente
```bash
git checkout sua-branch
git merge main              # Pega atualizações da main
```

---

## 💡 Templates de Mensagem

### Pedir feature para Claude:
> "Claude, preciso que você implemente o endpoint GET /api/X que retorna Y. O Codex vai consumir isso no frontend."

### Pedir feature para Codex:
> "Codex, o Claude criou o endpoint GET /api/X. Crie uma página em /app/X que mostre esses dados."

### Avisar sobre atualização:
> "Claude/Codex, faça merge da main. O outro assistente atualizou [X]."

---

## 🔍 Verificar Status

```bash
# Ver em qual branch está
git branch

# Ver diferenças
git diff main..claude-work
git diff main..codex-work

# Ver commits recentes
git log --oneline -5

# Ver quais arquivos mudaram
git status
```

---

## 🚨 Resolver Conflitos

```bash
# Se der conflito no merge:
git merge --abort           # Cancela
# ... coordena com assistentes ...
git merge main              # Tenta de novo

# Ou resolve manualmente:
# 1. Edite os arquivos com conflito
# 2. git add .
# 3. git commit
```

---

## 📊 Estado Atual dos Servidores

| Serviço | Porta | Status |
|---------|-------|--------|
| Backend API | 3001 | ✅ Running |
| Frontend | 3000 | ✅ Running |
| PostgreSQL | 5433 | ✅ Connected |
| Redis | 6379 | ✅ Connected |

---

## 🎯 Workflow Típico

1. **Você decide** qual feature implementar
2. **Você delega** para Claude ou Codex
3. **Assistente trabalha** em sua branch
4. **Assistente faz commit** e merge para main
5. **Você avisa o outro** se houver dependências
6. **Ciclo continua**

---

## ✅ Boas Práticas

- ✅ Sempre trabalhar nas branches específicas
- ✅ Fazer commits pequenos e frequentes
- ✅ Mensagens de commit descritivas
- ✅ Testar antes de fazer merge
- ✅ Comunicar mudanças que afetam o outro

## ❌ Evitar

- ❌ Trabalhar direto na main
- ❌ Commits gigantes
- ❌ Merge sem testar
- ❌ Mudanças sem comunicar
