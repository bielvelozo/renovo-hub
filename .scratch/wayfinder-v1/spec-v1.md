# Renovo Hub V1: spec pra construção autônoma

Escrita em 05/09/2026 antes de o mapa terminar, por decisão do Gabriel: ter a V1 rodando pra mostrar amanhã e consertar depois. Tudo que o mapa ainda não decidiu está na seção **Premissas assumidas**, com o ticket que vai revisitar. O que o mapa já decidiu é lei: [CONTEXT.md](../../CONTEXT.md), [docs/dominio/escala.md](../../docs/dominio/escala.md), [ADR 0001](../../docs/adr/0001-execucao-derivada-do-plano.md), [premissas.md](./premissas.md), e o módulo `Dominio` do protótipo v2.1 (`git show prototype/fluxo-ministro:prototypes/fluxo-ministro/index.html`), que já modela Escalas, Equipe por naipe, Ministro como marca, Formação, Itens, Trechos, Medley, Execuções derivadas, último Tom, cobertura, texto do WhatsApp e playlist.

## Objetivo

Um PWA em PT-BR, tema escuro e claro, custo zero, sem senha, que notifica, onde o Ministro monta a Escala em menos toques que no WhatsApp e o Membro abre no sábado e sabe o que tirar. Rodando local com um comando e pronto pra publicar no Cloudflare com outro.

## Critério de pronto da V1

1. `npm install && npm run dev` sobe o app em `http://localhost:8787` com banco local e dados de exemplo.
2. `npm test` e `npm run build` passam.
3. Um Admin gera um link de convite, abre no celular, instala na tela inicial, permite notificação e recebe um push de teste.
4. Um Ministro percorre os nove roteiros do protótipo v2.1 no app real.
5. Um Membro vê Início, Músicas, Sugestões e Perfil com os dados da sua Escala.
6. `npm run deploy` publica no Cloudflare depois de `wrangler login` (passo humano, fim da esteira).

## Stack (premissa assumida, ticket 09)

Da pesquisa [Stack de custo zero](./issues/03-stack-custo-zero.md): Cloudflare Workers + D1 + Cron Triggers, front estático servido pelo mesmo Worker via Workers Static Assets.

- **Front**: Vite 6 + React 19 + TypeScript, `react-router`, `vite-plugin-pwa` (manifest e service worker), sem UI kit: CSS próprio com tokens. Empacotável no Capacitor depois: a base é estática e a API fica atrás de `/api`.
- **API**: Hono no Worker, TypeScript. Rotas em `/api/*`. Sessão por cookie.
- **Banco**: D1 (SQLite) com migrations SQL em `migrations/`. Local via `wrangler dev` (Miniflare). Sem KV na V1.
- **Push**: Web Push com VAPID direto do Worker usando WebCrypto (sem o pacote `web-push`, que depende de Node). Chaves VAPID em `.dev.vars` local e em secrets no deploy.
- **Cron**: Trigger a cada 15 minutos pra fila de notificações e lembrete da véspera.
- **Testes**: Vitest pro domínio e pra API (com `@cloudflare/vitest-pool-workers` se couber; senão, testar o domínio puro e as rotas com D1 em memória via Miniflare).
- **Scripts**: `dev`, `build`, `test`, `check` (tsc), `db:migrate` (local), `db:seed`, `deploy`.
- Node 24 e npm 11 já instalados; wrangler 4.95 via `npx`.

## Domínio e dados

O domínio é o de `CONTEXT.md` e `escala.md`, com a versão do protótipo v2.1. Portar o módulo `Dominio` do protótipo pra `src/dominio/` como TypeScript puro, com testes, e usá-lo tanto no Worker quanto no front. Nada de lógica de domínio dentro de componente ou de rota.

Tabelas D1 (nomes em português, snake_case):

- `membros(id, nome, admin, ministro, criado_em)` — `ministro` é o papel dado no cadastro.
- `funcoes(id, nome, naipe, ordem)` — naipe em `vocal | instrumentos | tecnica`.
- `membro_funcoes(membro_id, funcao_id)`.
- `formacoes(id, nome)` e `formacao_entradas(formacao_id, membro_id, funcao_id)`.
- `escalas(id, data, horario, rotulo, santa_ceia, cancelada, criado_em)`.
- `equipe_membros(escala_id, membro_id, ministro)` e `equipe_funcoes(escala_id, membro_id, funcao_id)`.
- `musicas(id, titulo, artista, video_id UNIQUE, spotify_url, legado, tom_conhecido, tom_original, arquivada, revisar, criado_em)`.
- `itens(id, escala_id, ordem, tipo, musica_id, tom, inicio, fim, observacao, ministrado_por, origem_sugestao_id)` com `tipo` em `inteira | trecho | medley`.
- `trechos(id, item_id, ordem, musica_id, tom, inicio, fim)` pros Trechos de um Medley.
- `sugestoes(id, membro_id, musica_id, link, titulo, observacao, data, promovida_em)` e `apoios(sugestao_id, membro_id)`.
- `convites(token, membro_id, criado_em, usado_em)` e `sessoes(token, membro_id, dispositivo, criado_em, ultimo_uso)`.
- `push_inscricoes(id, membro_id, endpoint UNIQUE, p256dh, auth, criado_em)`.
- `anexos(id, musica_id, nome, mime, tamanho, conteudo BLOB, versao, criado_em)` — Sequência em Word, até 1 MB.
- `notificacoes(id, membro_id, tipo, titulo, corpo, url, escala_id, criado_em, enviar_apos, enviada_em)` — fila com agrupamento.

Regras que a API precisa aplicar, todas já decididas: Escala vira Realizada à meia-noite de Brasília do dia dela (`America/Sao_Paulo`); Execução é derivada, nunca gravada; edição de Realizada é permitida e silenciosa; Cancelada não gera nada; Função técnica não credita; Ministro só pra quem tem o papel; parcial vale tudo; Tom por Trecho; Música com Execução arquiva, sem Execução apaga; fins de semana seguidos como em `escala.md`.

## Seed

`npm run db:seed` carrega, idempotente:

- Funções: vocal e backing (vocal); guitarra, violão, baixo, bateria, teclado (instrumentos); som (técnica).
- Membros de `seed/membros.csv` (`nome,funcoes,ministro,admin`), que começa só com `Gabriel,guitarra,0,1`. O Gabriel preenche o resto amanhã pelo Admin ou no CSV.
- Formação "Banda", vazia até o Admin montar.
- Catálogo de `seed/playlist.csv` (101 vídeos únicos da playlist, copiado de `.scratch/wayfinder-v1/dados/playlist.csv`): cada linha vira Música Legado com `titulo = tituloOriginal`, `artista = canal`, `revisar = 1`, sem Tom. Capa derivada do `video_id` (`https://i.ytimg.com/vi/<id>/hqdefault.jpg`, `maxresdefault` com fallback).
- Sem Escalas de exemplo no seed normal. `npm run db:seed -- --demo` adiciona 3 Escalas Realizadas em agosto e 1 Agendada com Equipe e Repertório, com os nomes do protótipo, pra demonstração.

## Acesso (premissa assumida, ticket 07)

- Admin ou Ministro gera um **link de convite** por Membro: `/entrar/<token>`. Abrir o link cria uma sessão no aparelho (cookie `sessao`, HttpOnly, 1 ano) e leva ao onboarding. O convite não expira e pode ser reaberto em outro aparelho (iPhone e computador): cada abertura cria uma sessão nova.
- **"Esqueci / troquei de celular"**: página `/esqueci` lista os Membros; escolher um cria sessão. Confiança total no grupo, como nas premissas. Admin pode desligar essa lista depois que todo mundo estiver cadastrado (flag em configurações, padrão ligado).
- **Revogar**: Admin remove o Membro, o que apaga sessões, convites e inscrições de push, e o tira das Equipes futuras; Execuções passadas ficam.
- **Matriz**: Admin faz tudo. Ministro (papel) cria e edita qualquer Escala, Equipe, Repertório, Música, Formação, promove Sugestão, gera convite. Membro vê tudo, sugere, apoia, edita o próprio perfil e as próprias inscrições de push. Editar Tom depois de Realizada: Ministro e Admin. Apagar Sugestão alheia: Admin.

## Notificações (premissa assumida, ticket 08)

Web Push, sempre visível, seguindo [Push em PWA no iPhone](./issues/01-push-pwa-ios.md). Quem não instalou aparece pro Ministro como "não recebe notificação".

| Notificação | Gatilho | Destinatários | Texto | Quando |
| --- | --- | --- | --- | --- |
| Você foi escalado | Membro entra numa Equipe de Escala Agendada | o Membro | "Você está na Escala de dom 13/09, 18h, no baixo" | na hora, agrupado: um push por Escala por Membro, mesmo que a Função mude depois |
| Música na sua Escala | Item adicionado, removido ou com Tom/observação alterados em Escala Agendada | Equipe da Escala, menos quem fez | "Meia Noite (Tom G) entrou na Escala de dom 13/09" ou "3 mudanças na Escala de dom 13/09" | agrupado: no máximo um push por hora por Escala, via fila e cron |
| Lembrete da véspera | Cron | Equipe da Escala | "Amanhã 18h: Escala com 4 músicas. Toque pra ver os Tons." | 10h do dia anterior |
| Escala cancelada ou remarcada | Cancelar ou mudar data/horário de Escala Agendada | Equipe | "Culto de dom 27/09 cancelado" | na hora |
| Sugestão nova | Sugestão criada | ninguém | só badge na aba Sugestões | nunca push |

Edição de Escala Realizada nunca notifica. Membro pode silenciar tudo no Perfil (mantém a inscrição, marca `silenciado`).

## Telas

Todas em PT-BR, tema escuro e claro, navegação de abas inferiores (Início, Mês, Músicas, Sugestões, Perfil), capa da Música é a thumbnail do YouTube.

**Onboarding** (`/entrar/<token>` → `/instalar`): "Oi, Gabriel", passo a passo de adicionar à tela inicial (iOS: compartilhar → Adicionar à Tela de Início; Android: menu → Instalar app), botão "Ativar notificações" (só funciona instalado; explicar por quê), push de teste, "Pronto". `/esqueci` com a lista de Membros.

**Ministro** (as telas do protótipo v2.1, mesmas contagens de toques ou menos): Mês com lote de domingos (primeiro domingo Santa Ceia 08h) e Escala avulsa; Escala com Equipe agrupada por naipe, edição de data, horário e Santa Ceia, cancelar e desfazer, Repertório, texto pro WhatsApp e playlist (só inteiras, máximo 50 ids validados pelo oEmbed, link gerado a cada toque, instrução "toque em Repetir playlist"); Equipe por naipe com chips de Função, marca Ministro só pra quem tem o papel, Aplicar e Salvar Formação; Adicionar música por link (oEmbed traz título, canal e capa) ou catálogo, com Tom sugerido (última Execução, senão tom à mão, senão tom original), cobertura da Equipe, Inteira ou Trecho com minutagem, observação; Medley com Trecho, Tom e minutagem por Trecho, capa em montagem, observação; Sugestões com Promover.

**Membro**: Início (próxima Escala: minha Função, Ministro, Itens com Tom, link que abre na minutagem, Medley com os Trechos encadeados, observação, anexo da Sequência, botão da playlist, texto pro WhatsApp); Músicas ordenadas por última Execução com filtros Nova, Legado e "há mais de X meses", busca, detalhe com histórico de Tons por quem ministrou e anexos; Sugestões (enviar com link ou música do catálogo e observação; apoiar; ver apoios e data); Perfil (última Escala, Escalas no ano, fins de semana seguidos, tema, notificações, silenciar).

**Admin** (`/admin`): Membros (criar, editar nome, Funções, papel Ministro, Admin; remover), Funções (criar, editar naipe, ordem), Formações, Convites (gerar link por Membro, copiar, ver quem já entrou e quem recebe push), Músicas com `revisar` (título e artista), anexos da Sequência (enviar .docx até 1 MB, versões), configuração da lista "esqueci".

## Identidade visual (premissa assumida, ticket 12)

De [docs/brand/README.md](../../docs/brand/README.md). Tokens em `src/estilo/tokens.css`, tema por `prefers-color-scheme` com alternância manual guardada em `localStorage`:

- Escuro: fundo `#282828`, superfície `#2f2f2f`, texto `#E0D8D0`, texto secundário `#a8a29e`, acento `#FF5C30`, acento sobre fundo escuro passa AA.
- Claro: fundo `#F5F0E8`, superfície `#ffffff`, texto `#282020`, texto secundário `#6b6560`, acento `#A34418`.
- Fontes: Kodchasan 300 e 600 pro corpo, Inter 700 pra rótulos e botões, via Google Fonts, com fallback do sistema. Sem fonte display na V1.
- Logotipo provisório: a palavra RENOVO HUB em Inter 700; ícone do PWA provisório em SVG com a palavra e o acento. O arquivo real vem no ticket 18.
- Estados: Agendada azul discreto, Realizada verde discreto, Cancelada vermelho discreto, Santa Ceia roxo discreto, Legado cinza, parcial âmbar, como no protótipo.

## Fora da V1

Editor estruturado de Sequência; Sugestão automática por tempo sem tocar; achievements; indisponibilidade de Membros; troca da gravação de referência; metadados via Spotify; re-sincronização com a playlist; registro de presença real; app nativo; canal pago de notificação; ler o tom do Cifra Club automaticamente (só link "Conferir no Cifra Club" com busca pelo título, ticket 21).

## Premissas assumidas (revisitar no mapa)

| Assunto | Assumido na V1 | Ticket |
| --- | --- | --- |
| Stack | Workers + D1 + Cron, Vite + React, Hono, Web Push via WebCrypto | 09 |
| Acesso e permissões | link de convite sem validade, cookie de 1 ano, lista "esqueci" ligada, matriz acima | 07 |
| Notificações | catálogo acima, agrupamento por hora, lembrete 10h da véspera | 08 |
| Importação | seed do CSV da pesquisa, tudo Legado com `revisar`, sem chave da API | 10, 11 |
| Identidade | tokens acima, logotipo provisório | 12, 18 |
| Visão do Membro | telas acima, sem teste com Membro real | 14 |
| Onboarding | fluxo acima, sem teste em iPhone real | 15 |
| Tom original | só link pro Cifra Club, Ministro digita | 21 |
| Cadastro | só o Gabriel no seed, resto pelo Admin | 05 |
