# Handoff: ajustar a V1 do Renovo Hub em outra sessão

Escrito em 05/09/2026 pra uma sessão nova, sem contexto nenhum, conseguir fazer ajustes no app sem quebrar o que já foi decidido. Numa sessão nova, o primeiro pedido deve ser: **"leia docs/handoff-v1.md antes de qualquer coisa"**. Depois, descreva o ajuste.

## Estado em 05/09/2026

- O app inteiro está na **`main`** desde 05/09/2026, por merge fast-forward da branch `v1` (que continua existindo, idêntica). **Nada foi empurrado pra remoto.**
- A V1 foi construída de madrugada por um loop autônomo de 14 fases (ver [construcao-v1/decisoes.md](construcao-v1/decisoes.md)) e verificada de fora na manhã seguinte: `npm run check` limpo, `npm test` com 565 testes em 47 arquivos, `npm run build` verde, `npm run smoke` com 141 conferências e nenhuma falha. A verificação consertou três coisas: o smoke repetia um pedido num socket keep-alive morto, o CSV da playlist truncava 45 títulos no `|`, e o README não dizia como zerar o banco local.
- Falta, e é tudo humano: publicar no Cloudflare (`wrangler login`), testar o push num iPhone real, cadastrar os Membros de verdade pelo Admin, revisar os títulos das 101 Músicas importadas. Tudo no [README](../README.md).

## Onde está a verdade, em ordem

1. [CONTEXT.md](../CONTEXT.md): o glossário. Membro, Ministro, Função musical e técnica, Escala, Agendada, Realizada, Cancelada, Equipe, Repertório, Item, Trecho, Medley, Execução, Tom, Legado, Arquivada, Sugestão. Se um ajuste muda o significado de um termo, o glossário muda junto, na mesma sessão.
2. [docs/dominio/escala.md](dominio/escala.md): estados, transições, regras da Execução derivada, Tom por Trecho, presença, naipes, Ministro como marca, Formação.
3. [docs/adr/0001](adr/0001-execucao-derivada-do-plano.md): por que a Execução é derivada do plano e não registrada. Difícil de reverter; não mexer sem ADR novo.
4. [.scratch/wayfinder-v1/spec-v1.md](../.scratch/wayfinder-v1/spec-v1.md): a spec da V1. A tabela **Premissas assumidas** no fim lista o que foi decidido só pra construir e ainda vai ser revisto: stack, acesso, notificações, importação, identidade, visão do Membro, onboarding, tom original, cadastro.
5. [docs/construcao-v1/decisoes.md](construcao-v1/decisoes.md): 148 decisões que as iterações do loop tomaram sozinhas, com o porquê. Antes de "consertar" algo que parece estranho no código, procurar aqui: quase sempre foi deliberado.
6. [.scratch/wayfinder-v1/map.md](../.scratch/wayfinder-v1/map.md) e `issues/`: o mapa de decisões. Tickets ainda abertos: 05 cadastro inicial, 07 acesso e permissões, 08 notificações, 09 stack, 10 e 11 importação, 12 identidade visual, 14 visão do Membro, 15 onboarding, 21 tom original no Cifra Club. Uma decisão nova sobre esses assuntos deve fechar o ticket correspondente.
7. A branch `prototype/fluxo-ministro` é a referência de comportamento do fluxo do Ministro, testada pelo Gabriel com dez pontos de feedback, todos absorvidos na V1.
8. `ORCHESTRATION.md` na raiz: existe só no disco desta máquina, fora do git, e é o original do item 5. Não recriar, não apagar.

## Como rodar

Tudo detalhado no README. O essencial:

```sh
npm install
npm run dev
```

O `dev` aplica migrations, roda a semente, faz o build e sobe o app em `http://localhost:8787` com D1 local. Primeiro acesso: `npm run convite -- "Gabriel"` imprime o link de entrada. Banco de demonstração: `npm run db:seed -- --demo`. Zerar o banco local: apagar `.wrangler/state/v3/d1` e rodar o `dev` de novo. Chaves de push locais já estão em `.dev.vars` (ignorado pelo git); `npm run vapid` gera outras.

Portões, nesta ordem:

| Quando | Comando |
| --- | --- |
| Antes de cada commit | `npm run check && npm test` |
| Antes de mergear na `main` ou publicar | `npm run build && npm run smoke` |

O smoke apaga o D1 local, semeia com `--demo`, sobe o Worker sozinho e percorre por HTTP os nove roteiros do Ministro, o Membro, o Admin e as notificações. Ele deixa Escalas e Sugestões de teste no banco; zerar depois se for demonstrar.

## Mapa do código

- `src/dominio/`: domínio puro em TypeScript, sem DOM e sem D1, com testes ao lado. Estados da Escala com meia-noite de Brasília, Execuções derivadas, último Tom, cobertura, grupos da Equipe, texto do WhatsApp, playlist, presença. Usado pelo Worker e pelo front. Regra: lógica de negócio nova entra aqui, nunca em componente ou rota.
- `src/`: front React com Vite. Pastas por tela: `inicio`, `escalas`, `musicas`, `perfil`, `admin`, `instalacao`; `casca` (abas e rotas), `componentes`, `estilo` (tokens de tema escuro e claro), `tema`, `sessao`, `push`, `api` (cliente HTTP). `src/semente/` e `src/fumaca/` são a parte pura dos scripts de seed e smoke, testadas no vitest.
- `worker/`: API Hono e cron. `index.ts`, `autenticacao.ts`, `rotas/` (uma por área), `dados/` (acesso ao D1), `http/`, `push/` (VAPID via WebCrypto e fila), `testes/` (rodam no pool de Workers com D1 real).
- `migrations/`: quatro migrations SQL do D1; migration nova é um arquivo novo, nunca editar as existentes.
- `seed/`: `membros.csv` (só Gabriel) e `playlist.csv` (101 vídeos).
- `scripts/`: `seed.ts`, `convite.ts`, `vapid.ts`, `icones.ts` (gera os ícones do PWA a partir da logo), `smoke.ts` com `fumaca/`, e `ralph.ps1` com `ralph-prompt.md`, o loop autônomo.
- `docs/brand/`: logo real em `logo/`, cores medidas e fontes em `README.md`.

## Convenções pra qualquer ajuste

- Tudo em PT-BR: código, textos de tela, commits, testes. Commits em português, um assunto por commit, sem linha de atribuição.
- Sem comentário no código, salvo o que explica um porquê não óbvio.
- TDD: teste vermelho, código, teste verde. Componentes sem lógica podem ficar sem teste; regra de negócio nunca.
- Trabalhar na `main` ou numa branch criada a partir dela. Não dar `git push` sem o Gabriel pedir.
- Ajuste que muda domínio atualiza `CONTEXT.md` e `escala.md` na mesma sessão; ajuste que contraria uma decisão de `construcao-v1/decisoes.md` registra a decisão nova lá embaixo, com data e motivo.
- Ajuste que resolve um ticket aberto do mapa fecha o ticket (`Status: resolved`, `## Answer`) e aponta no `map.md`.

## Pontos vistos na verificação que merecem olhar

- Uma Escala criada uma a uma e marcada como Santa Ceia aparece no Mês como "Santa Ceia 08h", e o rótulo dela (por exemplo "Conferência") some do título. Decidir se Santa Ceia substitui o rótulo ou acompanha.
- Os títulos importados da playlist vêm crus do YouTube, com o canal depois do `|` ("Meia Noite (Ao Vivo) | fhop music"). Estão marcados `revisar` e o Admin arruma um a um; se forem muitos, vale limpar no seed.
- Na primeira abertura pelo convite, o front chama `/api/eu` antes de o cookie existir e o console mostra um 401 inofensivo.
- `npm run dev` roda migration, semente e build toda vez antes de subir. Rápido hoje; se incomodar, `npm run dev:front` com o Worker de pé dá hot reload.

## Ajustes em lote com o loop

Pra uma lista grande de ajustes, o mesmo mecanismo da construção serve: escrever um `ORCHESTRATION.md` novo na raiz seguindo o template da skill `rb-orchestrate` (fases pequenas, evidência por fase, política de uma fase por sessão), e rodar:

```sh
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ralph.ps1
```

O loop chama `claude -p` com `--dangerously-skip-permissions`, uma fase por sessão, até o arquivo marcar `ESTADO: CONCLUIDA`. Precisa da máquina acordada. Antes de sobrescrever o `ORCHESTRATION.md` atual, conferir que `construcao-v1/decisoes.md` está atualizado com o Decision history dele.
