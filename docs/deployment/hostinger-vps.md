# Deploy do Hub na VPS Hostinger

Raiz do projeto: `E:\hub-backend`.

## VPS atual

- VPS ID: `1383688`
- IP: `187.77.44.192`
- Sistema: Ubuntu 24.04 with Docker
- Projeto existente: `evolution-api-1irj`

O projeto Evolution existente não deve ser alterado pelo deploy do Hub.

## Arquivos de produção

- `docker-compose.prod.yml`: sobe Hub API, frontend, Postgres, Redis e Caddy.
- `backend/Dockerfile`: build e runtime do Fastify/Prisma.
- `frontend/Dockerfile`: build standalone do Next.js.
- `ops/deploy/caddy/Caddyfile`: proxy HTTPS para frontend e API.
- `.env.production.example`: modelo de variáveis. Copie para `.env.production` apenas no ambiente local/servidor.

## DNS necessário

Antes do deploy público, apontar os registros para `187.77.44.192`:

- `HUB_DOMAIN` -> registro `A`
- `HUB_API_DOMAIN` -> registro `A`

Exemplo:

```text
hub.seudominio.com.br      A 187.77.44.192
api.hub.seudominio.com.br  A 187.77.44.192
```

## Deploy manual via Docker Compose

No servidor, com o código disponível e `.env.production` preenchido:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f hub-backend
```

O backend executa `prisma migrate deploy` antes de iniciar via script `prestart`.

## Validação

```bash
curl -I https://$HUB_DOMAIN
curl https://$HUB_API_DOMAIN/health
```

## Observações

- Não versionar `.env.production`.
- Não reutilizar os containers Postgres/Redis do Evolution para o Hub.
- O Caddy usa portas `80` e `443`; confirme que não há outro proxy usando essas portas antes de subir.
