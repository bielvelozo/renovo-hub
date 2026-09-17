# Handoff: sessão mestra do redesenho

Escrito em 12/09/2026 pela sessão que conduziu o brainstorm do redesenho visual do Renovo Hub. A próxima sessão assume o mesmo papel: **sessão mestra**, que fecha specs com o Gabriel, revisa, grava planos com `/rb-orchestrate` e entrega handoffs para sessões executoras. Ela não implementa fatias grandes por conta própria.

O que a próxima sessão tem que fazer, nesta ordem:

1. **Fatia de correção**: coletar do Gabriel os detalhes que ele achou testando o app publicado, juntar com os defeitos já conhecidos (abaixo), escrever um spec curto, revisar e orquestrar.
2. **F5 e F6**, a última fatia do redesenho: brainstorm, spec, revisão, orquestração.

## Onde está a verdade

- Auditoria de usabilidade (115 achados, por trabalho e por tela, com a fatia de cada um): `docs/superpowers/specs/2026-09-10-auditoria-de-usabilidade.md`.
- Specs implementados: F1 `2026-09-11-fundacao-da-identidade-design.md`, F4 `2026-09-11-catalogo-sugestoes-perfil-design.md`, F2+F3 `2026-09-12-inicio-mes-escala-equipe-design.md`, todos em `docs/superpowers/specs/`. As tabelas "Decisões já tomadas" de cada um não se reabrem.
- Registros de orquestração concluídos: `docs/construcao-v1/ORCHESTRATION-{v1,f1,f4,f23}.md`. Cada um tem Decision history (decisões que a execução tomou sozinha) e Deferred work (o que ficou para depois). Ler as duas seções da F4 e da F2+F3 antes de escrever a fatia de correção.
- Glossário do domínio: `CONTEXT.md`. Convenções de código e portões: `docs/handoff-v1.md`, seção "Convenções pra qualquer ajuste". Regra global do Gabriel: sem comentários no código salvo o não óbvio (`~/.claude/CLAUDE.md`).
- Memória do agente (carregada automaticamente): `redesenho-visual-2026-09` (decisões, fatias, processo) e `gabriel-analise-profunda` (como o Gabriel quer análise e o que ele não aceita).

## Estado em 12/09/2026

- `main` local em `048e350`, árvore limpa, **21 commits à frente do `origin/main`**: ninguém deu `git push` (política de todas as entregas). O push é do Gabriel.
- Publicado no Cloudflare: https://renovo-hub.renovo.workers.dev com a `main` até `8e0aa22` (F1 + F4 + F2+F3). D1 publicado com as migrations até `0010` e os títulos limpos aplicados. Wrangler autenticado nesta máquina.
- Worktree `C:\Users\gabri\development\renovo-hub-f23` (branch `redesenho/f23`, mesmo commit da `main` antes do arquivamento) ainda existe; tem os 20 prints da noite em `.scratch/f23-evidencias/`. Pode ser removido com `git worktree remove` quando não fizer mais falta. Branches `redesenho/f1` e `redesenho/f4` também podem ser apagadas (já mergeadas).
- Pasta `C:\Users\gabri\development\renovo-hub-noite\` (fora do git): `noite.ps1`, `prompt.md`, o `ORCHESTRATION.md` original da F2+F3 e os logs das 9 iterações. É o mecanismo de loop noturno; reutilizável para a próxima fatia trocando o arquivo de plano, a branch e a condição de espera.
- Mockups do brainstorm: `.superpowers/brainstorm/` (ignorado pelo git), com o servidor do skill `brainstorming` (`scripts/start-server.sh`), que cai sozinho depois de 30 minutos parado.
- Banco local do checkout principal: recém-semeado com `--demo` e títulos limpos; `npm run dev` sobe em `http://localhost:8787`; `npm run convite -- "Nome"` gera link de entrada.

## Processo que vem funcionando

1. Brainstorm com o skill `brainstorming`: uma pergunta por vez; opções visuais no navegador (mockups em HTML na pasta do skill); decisões registradas na tabela "Decisões já tomadas" do spec.
2. Spec em `docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md`, autossuficiente para outra sessão, com: decisões fechadas, dados e API, telas, ajustes em componentes existentes, textos, fora do escopo, portões e testes exigidos, fases sugeridas.
3. Revisão do spec por subagente (prompt em `~/.claude/skills/brainstorming/spec-document-reviewer-prompt.md`), pedindo também conferência de viabilidade contra o código. Todas as rodadas acharam coisa real; máximo de três, depois avisar o Gabriel.
4. Spec commitado na `main`. Se outra sessão estiver usando o checkout principal, escrever num worktree (`git worktree add ../renovo-hub-specs -b mestra/specs main`) e avançar a `main` com `git push . mestra/specs:main` (só funciona quando a `main` não está com checkout; senão `git merge --ff-only` no checkout).
5. `/rb-orchestrate <spec>`: escolha da fonte (arquivar o `ORCHESTRATION.md` anterior em `docs/construcao-v1/` com confirmação do Gabriel), três decisões (destino, tracking, subagentes), plano em chat, aprovação em texto, arquivo gravado na raiz com início pendente.
6. Execução por outra sessão: interativa (`/rb-orchestrate C:\...\ORCHESTRATION.md`, autorização de início no chat) ou loop noturno (`noite.ps1`, com autorização registrada no arquivo e sem portão humano, como o Gabriel autorizou na F2+F3).
7. Destino de todas as fatias até aqui: merge na `main` local, validação do Gabriel (dispensada nas duas últimas), migrations e títulos no D1 remoto, `npm run deploy`. Nunca `git push`.

## Fatia de correção: o que já se sabe

Defeitos e pendências conhecidos, além do que o Gabriel vai relatar do teste no celular:

- **Equipe**: pessoa com dois chips de Função (Isa com Vocal e Ministro) tem o bloco de nome e memória espremido; "última ontem" quebra em duas linhas e o sino cortado cai no meio do texto (Deferred work da F2+F3, com o que já foi tentado).
- **Convite inválido** (`/entrar/:token` inexistente) é uma página HTML do Worker sem o estilo do app (adiado desde a F1; é território da F6, pode entrar lá).
- **Saída animada da `Folha`** nas telas que ainda a montam condicionalmente: migrar para `aberta?` onde for simples.
- **Limpeza pendente**: `selosDaMusica` em `src/musicas/catalogo.ts` e `SelosDaMusica.tsx` sem uso desde a F4.
- **Smoke não roda `npm run titulos`** depois da semente: os pushes do smoke saem com título cru. Decidir se o smoke passa a rodar o script.
- **Textos sem gênero** ("Isa · ministro", "Vocal: Ana entrou"): decisão da noite por falta de campo de gênero em `Membro`. Se o Gabriel quiser "ministra", precisa de campo novo ou de regra; não deduzir pelo nome.
- **"Escalar ▾"** no lugar de "Banda ▾ · Escalar" e memória por extenso ("há 3 semanas") na Equipe: decisões da noite que divergem do desenho aprovado; confirmar com o Gabriel se ficam.

Sugestão de formato: spec curto `2026-09-1X-correcoes-pos-f23-design.md` com uma tabela (defeito, tela, correção, evidência) e uma fase só, executada por sessão interativa ou pelo loop. Se os achados do Gabriel forem poucos, dá para juntar com a F5+F6 numa orquestração só, o que ele já disse que aceita.

## F5 e F6: o que a auditoria pede

Da auditoria (tabelas "Admin (F5)" e "Fora da casca (F6)", mais Parte 5):

- **Admin**: painel com números de pendência ("12 músicas a revisar", "3 Membros sem acesso") e lista de "Primeiros passos" para o primeiro uso; revisão de músicas com o título e o artista limpos já sugeridos (a função `limparTitulo` existe e é idempotente); Convites com o texto atrás de "?" e a lista do "esqueci" como seção; Membro sem acesso com selo de alerta; Formação criada já abrindo a montagem. O mínimo por Função já entrou na F2+F3 e o limite de repetição na F4.
- **Fora da casca**: boas-vindas curta depois do convite (duas ações opcionais, instalar e notificações, "Agora não", "Pronto" sempre visível; passos de instalação só ao tocar em instalar); "esqueci" com uma linha explicando; Não encontrada, erro de sessão e convite inválido com o selo e o tom da marca.
- **Registrado como fora do redesenho** (não puxar sem o Gabriel pedir): disponibilidade do Membro, etiquetas de ocasião. O modo culto e a letra dentro do app saíram desta lista em 16/09/2026: viraram a fatia `docs/superpowers/specs/2026-09-16-modo-culto-e-letra-design.md`, entregue na branch `modo-culto`.

Os mockups da F5+F6 ainda não existem; os das fatias anteriores mostram o padrão (uma proposta por tela quando não há decisão a tomar, duas ou três opções quando há).

## Comandos

```
npm run check && npm test          # antes de cada commit
npm run build && npm run smoke     # antes de dar por pronto (PORTA_DO_SMOKE=8790 se a 8787 estiver ocupada)
npm run dev                        # migra, semeia, limpa títulos, builda e sobe em :8787
npm run convite -- "Gabriel"       # link de entrada local
npx wrangler d1 migrations list renovo-hub --remote
npm run titulos -- --remote
npm run deploy
```

## Skills a invocar

- `brainstorming` para a F5+F6 (e para a fatia de correção se ela tiver decisão de desenho).
- `rb-orchestrate` para gravar cada plano.
- `code-review` se o Gabriel quiser revisar o que a noite fez antes de corrigir.
- `writing-plans` não foi usado: o `rb-orchestrate` cumpre o papel.

## Prompt de abertura sugerido para a próxima sessão

> Leia docs/handoff-redesenho.md e as memórias do projeto. Você é a sessão mestra do redesenho do Renovo Hub. Primeiro vou te passar os detalhes que achei testando o app publicado; monte com eles e com os defeitos conhecidos uma fatia de correção (spec, revisão, orquestração). Depois começamos o brainstorm da F5+F6.
