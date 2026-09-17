# Orchestration

## Spec

- Fonte: `docs/superpowers/specs/2026-09-16-modo-culto-e-letra-design.md`, versão `e891902` (branch `correcoes/pos-f23`). O texto integral está no git; este arquivo não o copia. Aprovado pelo Gabriel em 16/09/2026 depois de três rodadas de revisão por subagente.
- Raiz: `C:\Users\gabri\development\renovo-hub` (checkout principal, hoje em `correcoes/pos-f23`). Execução em worktree `C:\Users\gabri\development\renovo-hub-culto`, branch `modo-culto` criada a partir de `correcoes/pos-f23` (que contém a `main` em `97fb11d` mais `b4b39db` e os três commits do spec).
- Objetivo: no culto, sem internet, qualquer Membro abre a ordem das músicas com tom grande, a letra de cada uma em um toque, troca por deslize e pesquisa qualquer música do catálogo. Letra vem do `.docx` da equipe, extraída no Worker no envio; Medley com Word único no Item.
- Escopo: as cinco fases da seção 9 do spec. Fora do escopo: seção 7 do spec (letra da internet, editor de letra, letra no WhatsApp, Membro comum enviar, tema claro no culto, pacote por push), `git push`, Word reais no repositório.
- Critérios de aceite: seções 1–6 do spec (comportamento e textos) e seção 8 (testes exigidos, smoke, prints a 360 px, teste humano, migration remota, deploy, `CONTEXT.md`/handoff).
- Referências: `CONTEXT.md`, `docs/handoff-v1.md` (convenções), specs F1/F4/F2+F3, `docs/research/2026-09-16-fontes-de-letra.md` (só leitura), mockups em `.superpowers/brainstorm/1990-1789602186/` (`layout-modo-culto.html`, `letra-e-busca-v2.html`), Word reais em `C:\Users\gabri\Downloads\*.docx` (só para `npm run letra` local; nunca no git).
- Itens de trabalho (sem tickets): F1 Letra, F2 Pacote, F3 Modo culto, F4 Letra na Casca, F5 Fechamento.

## Approved decisions

### Pipeline

Resposta do Gabriel (16/09, seletor): "main local, me passa pra testar aqui e depois com meu ok fazer o deploy". Interpretação aprovada: merge `--no-ff` na `main` local sem push → teste local do Gabriel (hard gate humano, ok em texto no chat) → migration 0011 no D1 remoto e `npm run deploy`.

1. Worktree `renovo-hub-culto`, branch `modo-culto` de `correcoes/pos-f23`; `npm ci`.
2. F1 por E1 — commits; check/test rerodados na sessão principal; diff lido (hard gate).
3. F2+F3 por E2 — commits; check/test rerodados; prints escuros conferidos (hard gate).
4. F4 por E3 — commits; check/test rerodados; prints claro/escuro (hard gate).
5. F5 na sessão principal: smoke final, `CONTEXT.md`, handoff, `.gitignore`; `npm run build && npm run smoke` (hard gate).
6. Merge `--no-ff` de `modo-culto` na `main` local via worktree temporário da `main`; sem push — SHA do merge.
7. Teste do Gabriel: `npm run dev` na `main`, `npm run convite -- "Gabriel"`, roteiro em chat (desktop com "offline" do DevTools; S23 em modo avião só depois do deploy, porque o service worker exige HTTPS) — ok em texto (hard gate humano).
8. `npx wrangler d1 migrations apply renovo-hub --remote` e `npm run deploy` — lista de migrations remota, versão publicada, `/api/culto/pacote` respondendo no app publicado (hard gate).

Comandos confirmados: `npm run check`, `npm test`, `npm run build`, `npm run smoke` (`PORTA_DO_SMOKE=8790` se a 8787 estiver ocupada), `npm run dev`, `npm run convite`, `npm run titulos -- --remote` (se a semente mudar), `npx wrangler d1 migrations list renovo-hub --remote`, `npm run deploy`. Wrangler autenticado nesta máquina (conta `de93f72b…`).

### Tracking rules

Desligado (resposta "Só registro local", 16/09). Progresso, evidências e decisões só neste arquivo e no relatório em chat.

### Subagents

"Automático" (16/09), com a restrição do Gabriel em 16/09 (depois do lançamento de E1): **todos os executores seguintes em Opus**. Estratégia concreta na seção abaixo. Executores não iniciam outros agentes; a sessão principal revisa, opera portões e decide.

### Start authorization

Plano aprovado em texto ("aprovado, pode gravar e começar", 16/09/2026). A mesma mensagem autoriza o início da execução. Válida até o objetivo ou até pedido de pausa/cancelamento do Gabriel.

## Execution strategy

Modo misto. Motivo: as fases 1, 2+3 e 4 são implementação extensa com spec fechado; mantê-las na sessão mestra consumiria o contexto com diffs e logs. A sessão principal revisa cada diff, reroda os portões e faz a fase 5, curta e dependente das permissões daqui.

| Bloco | Executor | Modelo | Escopo (limites de escrita) | Depende de | Retorno esperado |
| --- | --- | --- | --- | --- | --- |
| F1 Letra | E1 (relançado como E1b) | Opus | `src/letra/`, `src/dominio/tipos.ts` (+`index.ts`), `migrations/0011_*.sql`, `worker/dados/anexos.ts`, `worker/dados/catalogo.ts`, `worker/rotas/{anexos,musicas,itens}.ts`, `worker/http/{responder,musica}.ts`, `worker/rotas/inicio.ts`, `src/api/tipos.ts`, `src/paginas/{Escala,Inicio}.tsx` (só rename), `src/dominio/musica.ts` (`combinaBusca` com `Pick`), `scripts/letra.ts`, `package.json` (`fflate`, script `letra`), `scripts/fumaca/*`, testes correspondentes | — | commits na `modo-culto`; saída de check/test/smoke; saída de `npm run letra` num Word sintético; riscos e pendências |
| F2+F3 Pacote e modo culto | E2 | Opus | `worker/rotas/culto.ts` (+registro em `worker/index.ts`), `src/culto/`, `src/letra/CorpoDaLetra.tsx`, `src/estilo/culto.css`, `src/main.tsx` (import do css), `src/App.tsx`, `src/casca/{Casca,Icone}.tsx`, `src/paginas/Inicio.tsx` (cartão), `src/paginas/Escala.tsx` (menu), testes, `.scratch/culto-evidencias/` (prints escuros), `.gitignore` | F1 revisada | commits; check/test; prints a 360 px medidos por JS |
| F4 Letra na Casca | E3 | Opus | `src/paginas/Musica.tsx`, `src/componentes/{FolhaDaLetra,FolhaDoItem,LinhaDeMusica}.tsx`, `src/paginas/admin/Sequencias.tsx`, `src/admin/admin.ts`, rotas novas em `src/App.tsx`, páginas `LetraNaCasca`/`LetraDoItemNaCasca` em `src/letra/` ou `src/paginas/`, testes, prints claro/escuro | F3 revisada (usa `CorpoDaLetra`) | commits; check/test; prints |
| F5 Fechamento | sessão principal | — | smoke final, `CONTEXT.md`, `docs/handoff-redesenho.md`, merge, teste humano, deploy | F1–F4 | — |
| F6 Barra de leitura (escopo acrescentado em 17/09) | E4 | Opus | `src/culto/`, `src/letra/`, `src/paginas/{LetraNaCasca,LetraDoItemNaCasca}.tsx`, `src/estilo/culto.css`, testes | F1–F5 (branch `modo-culto-leitura` a partir da `main` `1ec8096`) | commits; check/test; medição a 360 px |

Executores planejados: 3; concorrência máxima: 1 (F4 toca `App.tsx`, `LinhaDeMusica` e `FolhaDoItem`, que F3 também toca). Correções voltam ao executor da fase enquanto o contexto dele servir; se o agente não estiver mais disponível, novo executor com o mesmo bloco.

Progresso: fases concluídas / 5. Uma fase conta quando o portão dela passou na sessão principal.

## Progress

| Fase | Estado | Evidência |
| --- | --- | --- |
| Preparação (worktree, npm ci) | feita | worktree `renovo-hub-culto` em `e891902`, branch `modo-culto`; `npm ci` 508 pacotes; `.dev.vars` copiado |
| F1 Letra | concluída (portão passou 16/09) | commits `58a2c27`, `41a13f5`, `a5c607b`, `9f64e3b` na `modo-culto`; sessão principal rerodou `npm run check` (verde) e `npm test` (946/947; a falha é `admin.test.ts` › presença, anterior à fatia e dependente da data); diff de `docx.ts`, migration 0011 e `rotas/anexos.ts` lido; `npm run letra` nos Word reais Me ama, Sublime e Maranata bateu com a regra do spec |
| F2 Pacote | concluída (portão passou 17/09) | commits `4e6d091`, `72b0336`; check verde e 1001/1002 testes rerodados aqui (mesma falha antiga); `worker/rotas/culto.ts` e `src/culto/pacote.ts` lidos |
| F3 Modo culto | concluída (portão passou 17/09) | commits `b175fa3`, `80a74fe`, `6d18f70`; `ModoCulto.tsx` lido; prints `01-ordem`, `02-letra-observacao`, `03-letra-medley`, `04-pesquisar`, `05-sem-pacote` em `.scratch/culto-evidencias/` (worktree) conferidos a 360 px: layout B, números em display, selo "tom original", Medley com E·A, "Mais tocadas" |
| F4 Letra na Casca | concluída (portão passou 17/09) | commits `4e762e4`, `713ffba`, `2681a38`, `cad75c7`; check verde e 1013/1014 rerodados aqui; `FolhaDaLetra.tsx` e diff da `LinhaDeMusica` lidos; prints `1x-*-{claro,escuro}.png` conferidos a 360 px |
| F6 Barra de leitura | concluída (portão passou 17/09) | commits `a7d6662`, `6bf0cb9`, `09b8b0d`; check limpo e 1039/1039 rerodados aqui; `BarraDeLeitura.tsx` lido; merge `eb25d3b` na `main`; rebuild servido em `localhost:8787` |
| F5 Fechamento | concluída (17/09) | `4a7a3c7` (smoke e teste de presença alinhados), `676620f` (CONTEXT e handoff), `0c286d1` (smoke do culto: 9 conferências); `npm test` 1014/1014; `npm run build && npm run smoke` 194/194; merge `--no-ff` `62630e7` na `main` (worktree temporário removido); checkout principal em `main`, D1 local migrado até 0011 e semeado com `--demo`; servidor em `localhost:8787` (preview `renovo-hub`); Escala de teste de hoje `cfa04be0` com 4 itens e dois Word sintéticos; conferido no navegador a 360 px: Início com cartão "Culto de hoje", Ordem com os 4 itens e `/api/culto/pacote` 200 |

Progresso: 6/6. ESTADO: CONCLUIDA.

### Tracking actions

Nenhuma (tracking desligado).

## Blockers

Nenhum.

## Next action

17/09/2026: entrega concluída. Teste local do Gabriel terminou com "ok, pode fazer o deploy". Migration 0011 aplicada no D1 remoto (`wrangler d1 migrations apply --remote`: ✅, lista sem pendências); `npm run deploy` publicou a versão `110d1757` em https://renovo-hub.renovo.workers.dev; conferido: `/` 200 com o bundle `index-N9txsrKa.js` (igual ao `dist/` local) e `/api/culto/pacote` 401 sem sessão (rota no ar). Falta só o teste do Gabriel no S23 em modo avião, que é dele. Este arquivo foi arquivado em `docs/construcao-v1/ORCHESTRATION-culto.md`; worktree `renovo-hub-culto` e branches `modo-culto`/`modo-culto-leitura` removidos. Link de entrada entregue em chat (`/entrar/21ef6ef1-…`). Depois do ok: `npx wrangler d1 migrations apply renovo-hub --remote`, `npm run deploy`, conferir versão e `/api/culto/pacote` no app publicado, arquivar este arquivo em `docs/construcao-v1/ORCHESTRATION-culto.md`, remover o worktree `renovo-hub-culto`. Ao retornar: ler o diff, rerodar `npm run check && npm test` no worktree, registrar e lançar E2.

## Decision history

- 16/09/2026 — Fonte: spec em `docs/superpowers/specs/2026-09-16-modo-culto-e-letra-design.md`; não havia `ORCHESTRATION.md` na raiz (as correções pós-F23 foram feitas sem plano), nada a arquivar. Aprovado pelo Gabriel.
- 16/09/2026 — Destino, tracking e subagentes escolhidos pelo Gabriel no seletor (ver Approved decisions). Plano apresentado em chat e aprovado em texto junto com a autorização de início.
- 16/09/2026 — E1 (Sonnet) terminou cedo por `ConnectionRefused` da API, ainda na leitura; nada foi escrito. Relançado como E1b em Opus, já dentro da regra nova do Gabriel.
- 16/09/2026 — Gabriel pediu, com E1 (Sonnet) já em andamento, que os próximos executores sejam todos Opus. E1 continua até terminar; E2 e E3 passam a Opus (E3 era Sonnet). Correções da F1, se E1 já não estiver disponível, também vão para Opus.
- 17/09/2026 — Durante o teste, o Gabriel não achou onde enviar a letra de uma música inteira (estava só na tela da Música). Pedido e feito direto na `main`: bloco "Letra" na `FolhaDoItem` para inteira/trecho (`5ffcc31`), gravando na Música; depois movido para baixo do "Salvar" com a linha "já guardada na Música", porque parecia exigir salvar (`26687fa`). 1040 testes.
- 17/09/2026 — Logo após o deploy, a borda da Cloudflare ainda serviu por ~20 s o bundle antigo e 404 em `/api/culto/pacote`; depois da propagação, bundle novo e 401. Nada a corrigir.
- 17/09/2026 — F6: E4 escolheu 4 × velocidade px/s (4–20) em vez dos 12 × sugeridos, porque 12 × acabava uma letra de 60 linhas em 100 s na velocidade 1; tamanho aplicado em `:root` (vale nas duas casas e na prévia); na Casca a barra rola com a página (não `sticky`). Risco anotado: na Casca o botão Parar sai da tela durante a rolagem; encostar na tela para.
- 17/09/2026 — Teste do Gabriel achou o rodapé da letra estourando com título longo (`min-width: fit-content` do `.rodape-interno > .botao` impedia encolher); corrigido direto na `main` (`1ec8096`), medido a 360 px. Ele pediu duas funções novas: tamanho da letra (A−/A+) e rolagem automática com velocidade, como no Cifra Club. Desenho proposto em chat (barra de leitura entre cabeçalho e letra; 6 passos de 15 a 26 px; velocidade 1–5, padrão 2; para no fim, no toque, na rolagem manual e ao trocar de música; guardado no aparelho) e **aprovado em texto** ("aprovado, pode fazer"). Entra como fase F6 desta entrega, executor E4 em Opus, na branch `modo-culto-leitura` a partir da `main`.
- 17/09/2026 — F5: as 3 falhas antigas do smoke e o teste de presença por data eram expectativas desatualizadas (convite inválido redireciona desde `2bd0794`; o Ministro sai como "Isa (Vocal)" desde o mesmo commit; a fixture `hoje − 14` só cai em fim de semana quando hoje é fim de semana). Corrigidas em `4a7a3c7` para o portão "tudo verde" valer; nenhum defeito real.
- 17/09/2026 — Roteiro do smoke `scripts/fumaca/culto.ts` (Word no Medley, letra do Item, recusa fora do Medley, pacote) acrescentado pela sessão principal, como o spec pedia para a fase 5.
- 16/09/2026 — Execução em worktree para não mexer no checkout principal enquanto a fatia roda; merge final por worktree temporário da `main` (a `main` não está com checkout, mas o merge `--no-ff` precisa de uma árvore).

## Deferred work

- `worker/rotas/admin.test.ts` › "GET /api/membros traz presença" falha conforme a data de hoje (`PASSADO = hoje − 14` precisa cair num fim de semana para `seguidos: 1`). Anterior à fatia (falha também em `e891902`). Decisão: corrigir a fixture na F5 (é o que destrava o portão "testes verdes"), registrando aqui.
- Smoke em `e891902` já tinha 3 falhas: "convite inválido devolve 404 em PT-BR" (hoje redireciona 302 para o Esqueci, expectativa desatualizada desde `2bd0794`), "a marca de Ministro vai pra quem tem o papel" e "aplicar a Formação preserva a marca de Ministro" (`scripts/fumaca/roteiros.ts:73,139`; causa a investigar). Decisão: investigar na F5; corrigir se for expectativa desatualizada, reportar ao Gabriel se for defeito real.
- `GET /api/culto/pacote` recalcula `execucoes(m)` por música (O(n²), igual a `GET /api/musicas`); passa com 102 músicas, olhar se o pacote ficar lento (achado do E2).
- O service worker (`NetworkFirst` em `/api/*`) pode servir `/api/culto/pacote` do cache dele e mascarar a falta de internet; o mecanismo do modo culto continua sendo o `localStorage` (achado do E2). Script de prints reutilizável, não rastreado: `renovo-hub-culto/.scratch/prints-culto.ts`.
- Regra "qualquer run colorido vira marcador" fez de "Oh, Ele me amou" (Me ama, um run vermelho no meio da linha) um marcador. É o que o spec pede e reflete o Word; anotado para o teste do Gabriel decidir se a regra passa a ser por maioria de caracteres coloridos.

- Letra da internet (LRCLIB com confirmação e ADR nova): pesquisa em `docs/research/2026-09-16-fontes-de-letra.md`; fora por decisão do Gabriel (opção C).
- Deploy publicado em 10/09 (`f3124b83`) parece anterior às correções pós-F23 que a memória diz publicadas (versão 8289655c); conferir na hora do deploy desta fatia e registrar o que subiu.
