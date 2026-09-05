# Renovo Hub

App interno do ministério de louvor Renovo Music: escalas, repertório, histórico de execuções e notificações. PWA em PT-BR, tema escuro e claro, custo zero.

Vocabulário e regras do domínio: [CONTEXT.md](./CONTEXT.md) e [docs/dominio/escala.md](./docs/dominio/escala.md). O porquê de a Execução ser derivada do plano está no [ADR 0001](./docs/adr/0001-execucao-derivada-do-plano.md).

## Stack

Cloudflare Workers + D1 + Cron Triggers, com o front estático servido pelo mesmo Worker (Workers Static Assets).

- Front: Vite + React + TypeScript, `react-router`, `vite-plugin-pwa`, CSS próprio com tokens.
- API: Hono no Worker, rotas em `/api/*`, sessão por cookie.
- Banco: D1 (SQLite), migrations em `migrations/`.
- Push: Web Push com VAPID escrito direto no Worker com WebCrypto, sem dependência.
- Testes: Vitest rodando dentro do runtime dos Workers (`@cloudflare/vitest-pool-workers`), com D1 real.

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `src/` | front React |
| `src/dominio/` | domínio puro em TypeScript, compartilhado entre front e Worker |
| `src/semente/` | leitura dos CSVs e geração do SQL da carga inicial |
| `src/fumaca/` | parte pura do smoke (relatório e leitura da saída dos scripts) |
| `worker/` | API Hono, gatilhos de push e o handler `scheduled` do cron |
| `migrations/` | SQL do D1 |
| `seed/` | CSVs de carga inicial |
| `scripts/` | utilitários em TypeScript rodados com `tsx` |
| `public/` | estáticos e o `push.js` que entra no service worker |
| `dist/` | build do front, servido pelo Worker |

Testes ficam ao lado do código, em `*.test.ts`.

## Primeira vez na máquina

```sh
npm install
npm run vapid          # imprime as três linhas do .dev.vars
```

Crie um arquivo `.dev.vars` na raiz e cole o que o `npm run vapid` imprimiu:

```
VAPID_PUBLIC=...
VAPID_PRIVATE=...
VAPID_SUBJECT=mailto:seu-email@exemplo.com
```

O `.dev.vars` é ignorado pelo git. **Trocar as chaves invalida as inscrições de push já feitas**: quem já tinha ativado precisa ativar de novo.

Depois, um comando só:

```sh
npm run dev
```

O `dev` aplica as migrations, roda a semente, faz o build do front e sobe o app em `http://localhost:8787` com D1 local. Migration e semente são idempotentes, então rodar de novo não duplica nada. Para começar com as Escalas de demonstração, rode `npm run db:seed -- --demo` uma vez.

Para desenvolver o front com recarga instantânea, use `npm run dev:front` (Vite na 5173, com proxy de `/api` e `/entrar` para a 8787) com o `npm run dev` rodando em outro terminal.

## Entrar no app pela primeira vez

Não existe senha. Quem entra, entra por link de convite:

```sh
npm run convite -- "Gabriel"
```

O script insere o convite direto no D1 local e imprime `http://localhost:8787/entrar/<token>`. Abrir esse link no navegador cria a sessão (cookie de um ano) e leva para `/instalar`. O convite não expira e pode ser reaberto em outro aparelho: cada abertura cria uma sessão nova.

Depois do primeiro Admin, os convites saem pela tela: **Admin → Convites e acesso → Gerar link**, um por Membro. A página `/esqueci` lista os Membros para quem trocou de celular, e o Admin pode desligar essa lista quando todo mundo já estiver com o app instalado.

## Semente

`npm run db:seed` é idempotente e carrega:

- as 8 Funções (vocal e backing no naipe Vocal; guitarra, violão, baixo, bateria e teclado em Músicos; som em Som);
- os Membros de `seed/membros.csv`, que começa só com `Gabriel,guitarra,0,1`;
- a Formação "Banda", vazia até alguém montar;
- as 101 Músicas de `seed/playlist.csv`, todas como Legado e marcadas para revisão.

O campo `funcoes` do CSV aceita mais de uma Função separada por `;` ou `|` (`Marcos,"vocal;violão",1,0`), já que a vírgula é o separador do arquivo. `ministro` e `admin` aceitam `1`, `sim` ou `true`.

`npm run db:seed -- --demo` acrescenta 3 Escalas Realizadas em agosto e 1 Agendada com Equipe e Repertório, com os nomes do protótipo. Serve para demonstrar e é o que o smoke usa.

Para recomeçar do zero (por exemplo, depois de um `npm run smoke`, que deixa as Escalas e Sugestões de teste no banco local), apague o D1 local e rode o `dev` de novo:

```sh
rm -rf .wrangler/state/v3/d1
npm run dev
```

No PowerShell, o equivalente do `rm -rf` é `Remove-Item -Recurse -Force .wrangler\state3\d1`.

## Como adicionar os Membros

Duas formas, e as duas valem:

1. **Pela tela**, em `/admin/membros`: criar, dar Funções, marcar Ministro e Admin. É o caminho normal do dia a dia.
2. **Pelo CSV**, editando `seed/membros.csv` e rodando `npm run db:seed` de novo. O seed é idempotente (id derivado do nome), então rodar duas vezes não duplica ninguém.

Remover Membro tem duas pontas, e o app escolhe sozinho: quem nunca serviu em Escala Realizada é apagado de verdade; quem já serviu vira **inativo** — some das listas e das Equipes futuras, perde sessões, convites e push, mas continua nas Escalas passadas, porque a Execução é derivada da Equipe e apagá-lo reescreveria o histórico. "Trazer de volta" desfaz.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | migration, semente, build do front e Worker local na porta 8787 |
| `npm run dev:front` | Vite com recarga instantânea, proxy de `/api` e `/entrar` |
| `npm run build` | build do front em `dist/` |
| `npm run check` | checagem de tipos (`tsc -b`) |
| `npm test` | testes |
| `npm run db:migrate` | aplica as migrations no D1 local |
| `npm run db:seed` | carrega Funções, Membros e catálogo (`-- --demo` para dados de exemplo) |
| `npm run convite -- "Nome"` | gera um link de convite pelo banco local |
| `npm run vapid` | gera um par de chaves VAPID e mostra onde pôr |
| `npm run smoke` | percorre o app inteiro por HTTP contra o servidor local |
| `npm run deploy` | publica no Cloudflare (exige `wrangler login`) |

## O smoke

`npm run smoke` é a prova de que o app está de pé. Ele **apaga o D1 local**, migra, semeia com `--demo`, sobe o `wrangler dev` sozinho, gera o convite do primeiro Admin e percorre por HTTP:

- os nove roteiros do protótipo (montar o mês, adicionar por link, Trecho com minutagem, Medley, promover Sugestão, texto do WhatsApp, corrigir o domingo passado, cancelar, Escala avulsa);
- as telas do Membro (Início, Músicas com filtros e busca, Sugestões, Perfil) e o portão de papel;
- as telas do Admin (Membros, Funções, Formações, Músicas a revisar, Sequência, Convites e a lista do "esqueci");
- o Web Push de ponta a ponta, contra um serviço de push falso que **decifra** o que o Worker manda, mais o cron por `/__scheduled`.

Antes de rodar, precisa de três coisas: `npm run build` já feito (o Worker serve o `dist/`), o `.dev.vars` com as chaves VAPID, e internet — os roteiros batem no oEmbed de verdade do YouTube. Ele mata qualquer `wrangler dev` que tenha ficado para trás e derruba o que subiu ao terminar. Cada conferência sai numa linha; no fim vem o resumo por grupo e a lista das falhas, e o processo sai com código 1 se alguma falhou.

## Publicar no Cloudflare

Tudo isto é um passo humano, feito uma vez:

```sh
npx wrangler login
npx wrangler d1 create renovo-hub
```

O `d1 create` imprime um `database_id`. Cole no `wrangler.toml`, no lugar de `trocar-no-deploy`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "renovo-hub"
database_id = "<o id que o comando imprimiu>"
migrations_dir = "migrations"
```

Depois:

```sh
npx wrangler d1 migrations apply renovo-hub --remote
npx wrangler secret put VAPID_PUBLIC
npx wrangler secret put VAPID_PRIVATE
npx wrangler secret put VAPID_SUBJECT
npm run deploy
```

O `deploy` faz o build e publica o Worker com o front junto. O cron de 15 em 15 minutos (`[triggers]` no `wrangler.toml`) sobe com ele.

Para carregar Funções, Membros e o catálogo no banco publicado, gere o SQL rodando o seed local uma vez (ele escreve em `.wrangler/tmp/semente.sql`) e aplique:

```sh
npm run db:seed
npx wrangler d1 execute renovo-hub --remote --file .wrangler/tmp/semente.sql
```

Depois é só gerar o primeiro convite pela tela do Admin — ou, se ainda não houver Admin nenhum lá, aplicar um `insert` de convite pelo mesmo `d1 execute --remote`.

## Notificações

O catálogo é o do spec: "você foi escalado", "música na sua Escala" (agrupada, no máximo um push por hora por Escala), "escala cancelada ou remarcada" e o lembrete das 10h da véspera. Editar Escala Realizada nunca avisa ninguém. Cada Membro pode silenciar tudo no Perfil, o que mantém a inscrição.

No iPhone, o Web Push **só funciona com o app na tela inicial**. Por isso o botão de ativar notificações fica desabilitado até o app estar instalado, com o texto explicando. O caminho é: abrir o convite no Safari → Compartilhar → Adicionar à Tela de Início → abrir pelo ícone → Perfil ou `/instalar` → Ativar notificações → Enviar push de teste.

**Ainda falta a verificação em aparelho de verdade.** Todo o caminho até o serviço de push está provado no smoke (corpo `aes128gcm` decifrado, JWT VAPID conferido com a chave anunciada, inscrição morta removida no 410, cron entregando), mas com um serviço falso na própria máquina. Instalar num iPhone ou Android, permitir a notificação e receber o push de teste é o passo que só o aparelho fecha.
