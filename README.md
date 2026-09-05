# Renovo Hub

App interno do ministério de louvor Renovo Music: escalas, repertório, histórico de execuções e notificações. PWA em PT-BR, tema escuro e claro, custo zero.

Vocabulário e regras do domínio: [CONTEXT.md](./CONTEXT.md) e [docs/dominio/escala.md](./docs/dominio/escala.md).

## Stack

Cloudflare Workers + D1 + Cron Triggers, com o front estático servido pelo mesmo Worker (Workers Static Assets).

- Front: Vite + React + TypeScript, `react-router`, `vite-plugin-pwa`, CSS próprio com tokens.
- API: Hono no Worker, rotas em `/api/*`, sessão por cookie.
- Banco: D1 (SQLite), migrations em `migrations/`.
- Testes: Vitest rodando dentro do runtime dos Workers (`@cloudflare/vitest-pool-workers`).

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `src/` | front React |
| `src/dominio/` | domínio puro em TypeScript, compartilhado entre front e Worker |
| `worker/` | API Hono e o handler `scheduled` do cron |
| `migrations/` | SQL do D1 |
| `seed/` | CSVs de carga inicial |
| `scripts/` | utilitários em TypeScript rodados com `tsx` |
| `public/` | estáticos e ícones |
| `dist/` | build do front, servido pelo Worker |

Testes ficam ao lado do código, em `*.test.ts`.

## Rodar local

```sh
npm install
npm run dev
```

O app sobe em `http://localhost:8787`, com D1 local. Para desenvolver o front com recarga instantânea, use `npm run dev:front` (Vite na 5173, com proxy de `/api` para a 8787) com o `npm run dev` rodando em outro terminal.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | build do front e Worker local na porta 8787 |
| `npm run dev:front` | Vite com recarga instantânea, proxy de `/api` |
| `npm run build` | build do front em `dist/` |
| `npm run check` | checagem de tipos |
| `npm test` | testes |
| `npm run db:migrate` | aplica as migrations no D1 local |
| `npm run db:seed` | carrega funções, membros e catálogo (`-- --demo` para dados de exemplo) |
| `npm run smoke` | percorre os fluxos por HTTP contra o servidor local |
| `npm run deploy` | publica no Cloudflare (exige `wrangler login`) |

## Publicar

Roteiro completo na fase de fechamento. Em resumo: `wrangler login`, `wrangler d1 create renovo-hub`, colar o `database_id` no `wrangler.toml`, `wrangler d1 migrations apply renovo-hub --remote`, `wrangler secret put` das chaves VAPID e `npm run deploy`.
