# Orchestration

ESTADO: CONCLUIDA

Entrega: Fundação da identidade visual (F1) do Renovo Hub. Este arquivo é o registro autoritativo da entrega; é ignorado pelo git (`/ORCHESTRATION.md` no `.gitignore`). O registro da entrega anterior (V1) foi arquivado em `docs/construcao-v1/ORCHESTRATION-v1.md` em 11/09/2026 (commit 5431e40), com confirmação do Gabriel.

Sessão mestra: a sessão de brainstorm que escreveu o spec e este plano. Sessão executora: outra sessão, que retoma com `/rb-orchestrate C:\Users\gabri\development\renovo-hub\ORCHESTRATION.md` e recebe a autorização de início lá.

## Spec

- Fonte: `docs/superpowers/specs/2026-09-11-fundacao-da-identidade-design.md`, commit 5c620bd na `main`. Texto integral lá; ler inteiro antes de qualquer fase. Aprovado pelo Gabriel em 11/09/2026 ("Aprovado, pode rodar o /rb-orchestrate") depois de duas rodadas de revisão de spec (aprovado na segunda).
- Leitura obrigatória junto: `docs/superpowers/specs/2026-09-10-auditoria-de-usabilidade.md` (seção final "O que a Fundação (F1) precisa entregar"), `CONTEXT.md` (glossário), `docs/handoff-v1.md` (seção "Convenções pra qualquer ajuste"), `C:\Users\gabri\.claude\CLAUDE.md` (sem comentários no código salvo o não óbvio).
- Raiz: `C:\Users\gabri\development\renovo-hub`. Repositório único, remoto `origin` = `git@github.com:bielvelozo/renovo-hub.git`. Branch de partida: `main` em 5431e40. Branch de trabalho: `redesenho/f1` (a criar no passo 1 do pipeline).
- Objetivo: identidade visual nova (marca, tokens, tipografia, forma, movimento) e os componentes da auditoria aplicados nas 22 telas existentes (10 na casca, 8 de Admin, 4 fora), sem mudar estrutura nem fluxo de nenhuma tela; publicada no Cloudflare depois de validada localmente pelo Gabriel.
- Critério de pronto: as 12 seções do spec implementadas; portões da seção 11 verdes; verificação visual das 22 telas nos dois temas; merge na `main`; validação do Gabriel no app local; deploy respondendo.
- Exclusões (seção 10 do spec): telas novas ou reorganizadas, dados novos na API, notificações novas, gravar títulos limpos no banco, glossário de interface, desktop além do mínimo. Também fora: `git push` (fica com o Gabriel) e as fatias F2 a F6.
- Itens de trabalho: sem tickets. As 7 fases da seção 12 do spec, reproduzidas em Execution strategy. Dependências externas conferidas em 11/09/2026 no npm: `vaul` 1.1.2 (React 19 ok), `@base-ui-components/react` 1.0.0-rc.0, `opentype.js` 2.0.0, `happy-dom` 20.14.3, `@testing-library/react` 16.3.3 (React 19 ok). Node local v24.13.1.
- Referências não versionadas: mockups em `.superpowers/brainstorm/806-1789086701/` (logo B, paletas) e `.superpowers/brainstorm/1490-1789094532/estilo.html` (estilo A). Se não existirem, o spec basta.

## Approved decisions

### Pipeline

Destino: **publicado no Cloudflare**, depois de mergeado na `main` e validado pelo Gabriel no app rodando local. Escolhido pelo Gabriel em 11/09/2026 ("Para na main, e sobe local pra mim validar, após meu ok publicar na claudeflare").

Passos (unidade e evidência):

1. Criar a branch `redesenho/f1` a partir da `main` (5431e40). Entrega. Evidência: branch existe, `git status` limpo.
2. Por fase: implementar; `npm run check && npm test`; commit em português, sem linha de atribuição, mensagem dizendo o que mudou para quem usa. Fase. Evidência: saída dos dois comandos e SHA registrados em Progress.
3. Depois de 6c e depois de 7: `npm run build && npm run smoke`. Fase. **Hard gate**, confirmado na sessão executora; cobre a migração inteira das telas e o cache da API. O smoke apaga o D1 local e semeia com `--demo`; se um seletor quebrar por causa da troca de componente, ajustar o smoke no mesmo commit.
4. Verificação visual: abrir as 22 telas em 375 px nos dois temas no navegador, um print por tela por tema em `.scratch/f1-evidencias/` (pasta ignorada pelo git via `.scratch/`), conferidos contra o spec (fonte, cores, cantos, ícones, cabeçalho que encolhe, folha que arrasta, aviso com desfazer, esqueleto, capas sem barras). Entrega. **Hard gate**. Evidência: lista dos 44 arquivos e o que foi corrigido a partir deles.
5. Merge de `redesenho/f1` na `main` local. Entrega. Evidência: SHA do merge.
6. Subir local (`npm run dev`, `http://localhost:8787`; gerar convite com `npm run convite -- "Gabriel"` se precisar) e reportar no chat pedindo validação. Entrega. **Hard gate humano**: só avança com "ok" do Gabriel em texto no chat.
7. `npm run deploy`. Entrega. **Hard gate**. Evidência: URL publicada respondendo `/api/saude` com `{"ok":true}` e a tela nova abrindo no navegador. Conferido em 11/09/2026: wrangler autenticado nesta máquina (OAuth, conta soares.velozog@gmail.com) e `wrangler d1 migrations list renovo-hub --remote` sem migration pendente. Sem `git push`.

### Tracking rules

**Desabilitado**. Escolhido pelo Gabriel em 11/09/2026 ("Só registro local e relatório no chat"). Só este arquivo e commits na branch. Nenhuma ação externa. Relatório no chat ao concluir, em bloqueio humano ou em checkpoint.

### Subagents

Política: **automático**, escolhida pelo Gabriel em 11/09/2026. Decisão concreta tomada no plano (ver Execution strategy): execução mista, fases 1 a 5 e 7 diretas, fase 6 delegada a um executor único e sequencial. Executores planejados: 1; concorrência máxima: 1. Modelo do executor: o mais barato capaz que a sessão executora puder escolher (Sonnet); se não puder escolher, o padrão da sessão. O executor não cria outros agentes.

### Políticas operacionais desta entrega (aprovadas com o plano)

- Código sem comentários, salvo o não óbvio. UI e textos em PT-BR. Mensagens de commit em português, sem atribuição. Nunca commitar direto na `main` antes do passo 5; nunca `git push`.
- Não reabrir as decisões da tabela "Decisões já tomadas" do spec. Dúvida que o spec não cobre: escolher o caminho mais simples que respeite o spec e `CONTEXT.md`, registrar em Decision history, seguir.
- Se uma fase não fecha na sessão, commitar o que está verde, registrar em Progress o que falta, e gravar checkpoint (`/rb-orchestrate checkpoint`) para outra sessão retomar.
- Bloqueio humano real (decisão que o spec não dá e não tem caminho simples, ou acesso que falta): registrar em Blockers, trocar `ESTADO:` para BLOQUEADA, reportar no chat.
- Ao concluir o passo 7 com evidência: trocar `ESTADO:` para CONCLUIDA e reportar.

### Start authorization

**Concedida.** Plano aprovado pelo Gabriel em 11/09/2026 no chat da sessão mestra ("Aprovado, pode gravar o ORCHESTRATION.md"). Início autorizado pelo Gabriel em 11/09/2026, em texto no chat da sessão executora ("pode começar"), depois do relatório de conferência registrado em Next action. Vale para toda a entrega até o destino aprovado; retomadas não precisam pedir de novo.

## Execution strategy

Modo: misto. Fases 1 a 5 e 7 diretas na sessão executora, porque exigem julgamento de design e cada uma produz arquivos que a seguinte lê (tokens → primitivos → casca → linha de música). Fase 6 delegada porque é repetitiva, com padrão claro (trocar componente por componente conforme a tabela da seção 8 do spec) e critérios objetivos (check, test, smoke, print), e é a que mais consome contexto.

Medida de progresso: **fases concluídas / 7**, cada uma com SHA e saída dos comandos de evidência; depois, passos 5, 6 e 7 do pipeline marcados em Progress. Fase concluída só com evidência registrada.

| Fase | Escopo (seção do spec) | Evidência exigida | Dono |
| --- | --- | --- | --- |
| 1 Marca e tokens | Fontes estáticas em `docs/brand/fontes/` (OFL, do repositório oficial da Fraunces e do Inter); `scripts/marca.ts` com `opentype.js` gerando `public/selo-completo.svg` e `public/marca-horizontal.svg`; `public/selo.svg` à mão; `scripts/icones.ts` rasterizando com cores fixas; PNGs (192, 512, favicon, apple-touch, mascarável, abertura); manifesto, `theme-color`, `COR_DA_BARRA`; `tokens.css` reescrito (seção 2); fontes no `index.html` (seção 3), Kodchasan fora; grão no `body`; divisão de `base.css` em `tokens.css`, `base.css`, `componentes.css` (seção 9); `docs/brand/README.md` com a seção nova. `Marca.tsx` passa a usar o selo. | `npm run check`, `npm test`, `npm run build` verdes; SVGs e PNGs commitados; app abre nos dois temas com as cores e fontes novas (print). | Sessão executora |
| 2 Domínio | `limparTitulo`, `tempoRelativo`, `formatarDia` novo, `formatarDiaLongo`, `formatarDiaNumerico` (só WhatsApp), remoção de `rotuloDoDia` (7 chamadores), `notificacoes.ts` sem prefixo `nomeDoDia`, `apiComMeta` em `src/api/cliente.ts` e `vistoEm` em `usarBusca` (seções 6 e 7). Testes da seção 11. | `npm test` inteiro verde com os testes novos (mínimo 10 casos de `limparTitulo` incluindo os 5 títulos do spec). | Sessão executora |
| 3 Primitivos | Ambiente de DOM no vitest (dois projetos, `workers` e `dom`, `happy-dom` ou `jsdom` + Testing Library); `Botao`, `Selo`, `Capa`, `Campo`, `Cartao`, `Vazio`, `Icone` (conjunto novo, renomeação dos cinco nomes atuais), chips roláveis e `Segmento`, `SeletorDeTom` com `original` (seção 5). Nenhuma tela migrada além do que o CSS já muda. | Testes de renderização passando nos dois projetos; `npm run check`. | Sessão executora |
| 4 Casca | `Cabecalho` (dois modos, sticky, colapso por IntersectionObserver, margem negativa), `Abas` para todos com salto do ícone, `Casca.tsx` sem header e com provedor de avisos, `Folha` sobre `vaul` (com `aberta?`), `Avisos` + `usarAviso`, `usarRemocaoPendente` (+ teste `.test.tsx`), `RodapeDeAcao`, `Esqueleto`, `Menu` sobre Base UI (seção 4). Instalação de `vaul` e `@base-ui-components/react`. | Testes do aviso e da remoção pendente; folha abre e fecha por arrasto no navegador (print ou descrição); `npm run check`, `npm test`. | Sessão executora |
| 5 Linha de música e Busca | `LinhaDeMusica` (três modos, selos conforme regra do `ultimaExecucao`, Medley com trechos, `view-transition-name`), `Busca` (seção 5). | Testes dos três modos; `npm run check`, `npm test`. | Sessão executora |
| 6 Migração das telas | Conforme a tabela da seção 8 do spec, em três commits: **6a** Início, Mês, Escala, Equipe; **6b** Adicionar, Medley, Músicas, Música, Sugestões, Perfil; **6c** Admin (8 telas), Entrar, Esqueci, Instalar, Não encontrada. Cada tela: `Cabecalho` no lugar de `Barra`, componentes novos, ícones no lugar de "‹ › ⋯ ×", `Vazio`, esqueleto, avisos, rodapé de ação onde o spec manda, `Segmento` nos seis usos. Apagar `EmBreve.tsx` em 6c. | Por bloco: `npm run check`, `npm test`, SHA; depois de 6c: `npm run build && npm run smoke` (hard gate); prints das telas do bloco nos dois temas em `.scratch/f1-evidencias/`. | Executor `migracao-telas` (delegado); revisão do diff e portões pela sessão executora |
| 7 Cache e fechamento | `runtimeCaching` de `/api/*` (seção 7), "visto às" nas telas raiz e na Escala; remoção de `Barra.tsx`, `marca-claro.png`, `marca-escuro.png` e regras CSS órfãs; passada visual completa das 22 telas nos dois temas; `docs/brand/README.md` conferido. | `npm run build && npm run smoke` (hard gate); 44 prints conferidos (hard gate); `npm run check`, `npm test`. | Sessão executora |

Atribuição do executor `migracao-telas`: recebe o spec (seções 5, 8, 11), a lista de telas do bloco, os componentes prontos das fases 3 a 5 e as convenções (sem comentários, PT-BR, commit em português). Escreve só em `src/paginas/**`, `src/casca/Casca.tsx`, `src/componentes/Notificacoes.tsx`, `src/componentes/FolhasDaEscala.tsx`, `src/estilo/base.css` (seção `/* telas */`) e `src/estilo/componentes.css` (ajustes pequenos que a migração exigir; mudança de API de componente volta para a sessão executora). Devolve por bloco: resumo, SHA, saída de `check` e `test`, lista de prints, riscos e pendências. Mesmo executor para 6a, 6b e 6c, em sequência, reaproveitando o contexto; correções voltam para ele. Um executor, sem paralelismo, porque os três blocos escrevem nos mesmos arquivos CSS.

## Progress

| Item | Estado | Revisão | Evidência |
| --- | --- | --- | --- |
| Pipeline 1 · branch `redesenho/f1` | concluído | 11/09/2026 | Branch criada a partir de 5431e40; `.gitignore` ganha `.scratch/f1-evidencias/` (commit 117cfd6). Baseline antes de mexer: `npm run check` ok, `npm test` 48 arquivos / 635 testes ok. |
| Fase 1 · Marca e tokens | concluída | 11/09/2026 | Commit 117cfd6. `npm run check` ok, `npm test` 635/635 ok, `npm run build` ok (PWA 11 entradas). Fontes OFL em `docs/brand/fontes/`; `scripts/marca.ts` gera `selo.svg`, `selo-completo.svg`, `marca-horizontal.svg`; `scripts/icones.ts` gera os 6 PNGs (incl. `abertura.png`); tokens, tipografia, grão, CSS dividido em 3 arquivos; `Marca.tsx` com `SeloDaMarca`. Prints: `.scratch/f1-evidencias/fase1-{01-inicio,03-escala,07-musicas,10-perfil,21-instalar}-{claro,escuro}.png` (10 arquivos), conferidos: paleta, Fraunces/Inter, selo no cabeçalho, pílulas. |
| Fase 2 · Domínio | concluída | 11/09/2026 | Commit aaeabde. `npm run check` ok, `npm test` 50 arquivos / 660 testes ok (25 novos: `titulo.test.ts` 12 casos com os 5 títulos do spec, `datas.test.ts` formatarDia/Longo/tempoRelativo, `visto.test.ts`), `npm run build` ok. `rotuloDoDia` removida (7 chamadores), push sem `nomeDoDia`, `apiComMeta` e `vistoEm`. |
| Fase 3 · Primitivos | concluída | 11/09/2026 | Commit 8573162. `npm run check` ok, `npm test` 57 arquivos / 679 testes ok (19 no projeto `dom`: Botao, Selo+Selos, Capa, Campo, Segmento, Vazio, SeletorDeTom), `npm run build` ok. Prints `fase3-{03-escala,05-adicionar,07-musicas,08-musica}-{claro,escuro}.png`: chips roláveis com sombra nas bordas, selos novos, botões em pílula. |
| Fase 4 · Casca | concluída | 11/09/2026 | Commit 6240cb6. `npm run check` ok, `npm test` 60 arquivos / 687 testes ok (dom: Avisos 3, usarRemocaoPendente 3, Cabecalho 2), `npm run build` ok. Folha sobre vaul conferida no navegador (Escala → Texto pro WhatsApp): abre com alça e fundo desfocado, fecha por arrasto. Prints `fase4-{01-inicio,03-escala}-claro.png` (estado transitório: telas ainda com `Barra`, sem header da casca). |
| Fase 5 · Linha de música e Busca | concluída | 11/09/2026 | Commit e901345. `npm run check` ok, `npm test` 62 arquivos / 696 testes ok (dom: LinhaDeMusica 7 casos com os três modos, regra do `ultimaExecucao`, título limpo, Medley; Busca 2), `npm run build` ok. Sem tela migrada ainda; a verificação visual da linha fica com os prints da fase 6. |
| Fase 6a · Início, Mês, Escala, Equipe | concluída (com 2 correções pedidas) | 11/09/2026 | Commit 78c22ee do executor; revisado o diff (Cabecalho, Menu, remoção pendente com desfazer, avisos na Equipe, CSS órfão removido). `npm run check` ok, `npm test` 62/696 ok, build ok. Prints `6a-{01-inicio,02-mes,03-escala,04-equipe}-{claro,escuro}.png` conferidos (Escala vista pela sessão). Pendências devolvidas ao executor: Escala ainda não usava `LinhaDoItem` (faltava `ref`/`arrastando` na linha → adicionados em 498df1a); folha "Nova escala" do Mês sem `Campo`. Executor prossegue com 6b. |
| Fase 6b · Adicionar, Medley, Músicas, Música, Sugestões, Perfil | concluída | 12/09/2026 | Commits 34aaa96 (correções do 6a) e 0431f38 (bloco) do executor; revisão da sessão em 4192db3: `LinhaDeMusica` deduz o Tom (o catálogo tinha ficado sem selo de Tom da última Execução), ganha `desligado` no modo escolha, `BlocoDeMinutagem`/`BuscaNoCifraClub` migrados, faixa do cabeçalho sticky também dentro de `section.pagina` (o seletor `.conteudo > .faixa` não pegava) e espaço sob a faixa reduzido. check ok, test 62/696 ok, build ok. Prints `6b-{05..10}-{claro,escuro}.png` (12) + `rev-07-musicas-claro.png` conferido pela sessão. |
| Fase 6c · Admin e fora da casca | concluída | 12/09/2026 | Commit 8f29505 do executor. Revisado: 8 telas de Admin com Cabecalho/Campo/Segmento/LinhaDeMusica/Busca/RodapeDeAcao, telas fora da casca com selo centrado, `EmBreve.tsx` apagado, nenhuma tela importa `Barra`, zero `girando`/`vazio`/`botao` crus fora de Barra.tsx e das 3 âncoras externas. Executor achou e corrigiu: `Instalar` quebrava porque `Notificacoes` chama `usarAviso()` fora da casca → `Instalar` tem o próprio `ProvedorDeAvisos`. check ok, test 62/696 ok, build ok. Prints `6c-11..22-{claro,escuro}.png` (24); `6c-21-instalar-claro` conferido pela sessão. Servidor local caiu uma vez durante o bloco (deadlock do esbuild no wrangler dev), religado pela sessão. |
| Portão · build e smoke depois de 6c | verde | 12/09/2026 | `npm run build` ok; `npm run smoke` em 8f29505: 143 conferências, nenhuma falha (log em `.scratch/f1-smoke-6c.log`). Nenhum seletor do smoke precisou de ajuste. |
| Fase 7 · Cache e fechamento | concluída | 12/09/2026 | Commits aeb9d7b (runtimeCaching de `/api/*` GET NetworkFirst 3 s/200/7 dias; `VistoEm` em Início, Mês, Músicas, Sugestões, Perfil e Escala; `Barra.tsx` e `.barra` removidos; PNGs da igreja já tinham saído na fase 1) e aaff384 (correções da passada visual: chips dentro de linhas sem margem negativa nem sombra, marcador do `Segmento` visível no escuro, `.cabecalho-da-musica` em coluna). `docs/brand/README.md` conferido na fase 1. check ok, test 62/696 ok, build ok. |
| Portão · build e smoke depois de 7 | verde | 12/09/2026 | `npm run build && npm run smoke` em aeb9d7b: 143 conferências, nenhuma falha (`.scratch/f1-smoke-6c.log` e `.scratch/f1-fase7.log`). As correções de CSS de aaff384 não tocam seletor nem fluxo. |
| Portão · verificação visual (44 prints) | verde | 12/09/2026 | `.scratch/f1-evidencias/f1-{01..22}-{claro,escuro}.png` (44, gerados em aaff384 por `scripts/prints.ts`), conferidos pela sessão em folhas de contato (11 folhas de 4). Corrigido a partir deles: chips cobrindo o nome nas linhas da Equipe e da Formação, marcador do Segmento invisível no escuro, legenda ao lado da capa grande na Música. Conferido: Fraunces/Inter, paleta nos dois temas, cantos, ícones no lugar de ‹ › ⋯ ×, cabeçalho raiz/subtela, selos, esqueleto, capas sem barras, rodapé de ação. `f1-19-entrar` é a página HTML do Worker para link inválido (sem estilo do app; fora do spec). |
| Pipeline 5 · merge na `main` | concluído | 12/09/2026 | Merge 01a343f (`--no-ff`) de `redesenho/f1` (aaff384) na `main` local. Sem push. |
| Pipeline 6 · validação do Gabriel no app local | concluído | 12/09/2026 | Gabriel validou no app local e respondeu "ok" em texto no chat (12/09/2026). |
| Pipeline 7 · deploy no Cloudflare | concluído | 12/09/2026 | `npm run deploy` da `main` (01a343f): 15 assets, Worker `renovo-hub`, versão cf89c5e3-e334-4209-81f8-5aded4ae5ddf, https://renovo-hub.renovo.workers.dev. Conferido: `/api/saude` → `{"ok":true}`; `/` 200 com as fontes novas no HTML; `/esqueci` aberta no navegador com o selo e a paleta nova. Sem `git push`. |

Progresso: 7 / 7 fases. Pipeline 1 a 7 concluídos. Entrega concluída em 12/09/2026.

### Tracking actions

Nenhuma (tracking desabilitado).

## Blockers

Nenhum.

## Next action

12/09/2026: ENTREGA CONCLUÍDA. Publicada em https://renovo-hub.renovo.workers.dev a partir da `main` local 01a343f. Push feito a pedido do Gabriel em 12/09/2026: `main` (4802cec..01a343f) e `redesenho/f1` (nova no remoto). Próximas fatias (F2 a F6) começam por um spec novo; este arquivo pode ser arquivado em `docs/construcao-v1/` ou substituído.

12/09/2026: entrega mergeada na `main` local (01a343f). Aguardando validação do Gabriel no app local (hard gate humano). Com o "ok": rodar `npm run deploy` (pipeline 7), conferir `/api/saude` e a tela nova na URL publicada, trocar `ESTADO:` para CONCLUIDA e reportar. Sem `git push`.

11/09/2026 23:30: fase 5 concluída e commitada. Próximo: fase 6 delegada ao executor `migracao-telas` (blocos 6a, 6b, 6c em sequência), com revisão do diff e portões (check, test, build+smoke depois de 6c) na sessão executora.

11/09/2026 23:05: fase 4 concluída e commitada. Próximo: fase 5 — `LinhaDeMusica` (leitura/navegação/escolha, selos, Medley com trechos, `view-transition-name`) e `Busca`, com testes dos três modos.

11/09/2026 22:20: fase 3 concluída e commitada. Próximo: fase 4 (casca) — instalar `vaul` e `@base-ui-components/react`; `Cabecalho`, `Abas` para todos com salto do ícone, `Casca.tsx` sem header e com provedor de avisos, `Folha` sobre vaul, `Avisos`/`usarAviso`, `usarRemocaoPendente` + teste, `RodapeDeAcao`, `Esqueleto`, `Menu`.

11/09/2026 21:40: fase 2 concluída e commitada. Próximo: fase 3 (primitivos) — projeto `dom` no vitest com happy-dom + Testing Library, `Botao`, `Selo`, `Capa`, `Campo`, `Cartao`, `Vazio`, `Icone` (conjunto novo), chips roláveis e `Segmento`, `SeletorDeTom` com `original`.

11/09/2026 21:05: fase 1 concluída e commitada. Próximo: fase 2 (domínio) na sessão executora — `limparTitulo`, `tempoRelativo`, `formatarDia`/`formatarDiaLongo`/`formatarDiaNumerico`, remoção de `rotuloDoDia`, `notificacoes.ts` sem `nomeDoDia`, `apiComMeta` e `vistoEm`.

11/09/2026: plano gravado pela sessão mestra. Aguardando a sessão executora retomar com `/rb-orchestrate C:\Users\gabri\development\renovo-hub\ORCHESTRATION.md`, ler o spec inteiro e os documentos de leitura obrigatória, e pedir ao Gabriel a autorização de início no chat. Com a autorização: registrar em Start authorization, criar a branch `redesenho/f1` (pipeline 1) e começar a fase 1.

11/09/2026, sessão executora: retomada. Lidos o spec inteiro, a seção final da auditoria, `CONTEXT.md`, as convenções do `docs/handoff-v1.md` e o `CLAUDE.md` global. Estado conferido: `main` em 5431e40, árvore limpa, branch `redesenho/f1` ainda não existe, os arquivos que o spec cita existem, mockups presentes em `.superpowers/brainstorm/`, Node v24.13.1, wrangler autenticado, npm e Google Fonts acessíveis. **Autorização de início pedida ao Gabriel no chat; aguardando resposta.** Nenhuma implementação até lá.

Duas observações levantadas na conferência, ambas com caminho simples (sem bloqueio):

- `.gitignore` ignora `.scratch/*.png`, que não pega subpasta: os prints em `.scratch/f1-evidencias/` apareceriam como não rastreados. Caminho: acrescentar `.scratch/f1-evidencias/` ao `.gitignore` no passo 1 do pipeline e registrar em Decision history.
- Instância estática `Fraunces144ptSoft-Bold.ttf` no repositório oficial ainda não localizada (a API do GitHub respondeu, a listagem da pasta de estáticas não). Caminho, na ordem: procurar de novo no repositório oficial; se não houver, baixar a instância estática que o Google Fonts serve para os eixos do spec (mesma licença OFL) ou usar `Fraunces144pt-Bold.ttf`, registrando a diferença em `docs/brand/README.md`, como o próprio spec manda.

## Decision history

- 11/09/2026 (executora, fase 6a): o executor caiu por erro de conexão da API no meio do bloco (edições no disco, sem commit) e foi retomado com a mesma conversa; sem perda. Risco aceito e registrado: enquanto um Item está com remoção pendente (5 s), ele sai da lista e o `usarOrdenacao` mede uma linha a menos; arrastar nesse intervalo pode errar a posição. Não muda a política, fica em Deferred work.

- 11/09/2026 (executora, antes da fase 6): o limite de escrita do executor ganha `src/componentes/EscolhaDeMusica.tsx`, porque as tabelas das seções 5 e 8 do spec mandam trocar a lista do catálogo e a busca dentro dele; reagrupamento dentro da política aprovada. O selo «letra» da `LinhaDeMusica` vira link para o anexo (commit 2fd3b48), para o Início não perder o acesso à Sequência quando trocar a lista.

- 11/09/2026 (executora, fase 5): `LinhaDeMusica` aceita `musica` (com o que houver de `MusicaNaLista`) ou `trechos` (Medley), e o wrapper `LinhaDoItem` mapeia um `ItemApresentado` direto (tom, trecho, link, observação, Medley), para a migração das listas de Repertório ser um para um. A linha é um `<li>`; o miolo vira `Link` (navegação) ou o `<li>` inteiro vira `button` (escolha, sem capa tocável, porque link dentro de botão é HTML inválido). `Capa` ganha `transicao` (`view-transition-name`), que a linha usa em navegação como `capa-<id>`; a tela Música deve usar o mesmo nome na capa grande.

- 11/09/2026 (executora, fase 4): `Cabecalho` devolve dois irmãos (`.faixa` sticky e `h1.titulo-de-tela`) em vez de um só `<header>`, porque sticky dentro de um pai baixo deixaria de grudar; a faixa cobre o padding de `.conteudo` com margem negativa e fundo translúcido com blur. O colapso observa o próprio `h1` com `rootMargin` negativo da altura da faixa. `RodapeDeAcao` é fixo acima das abas e `.conteudo:has(.rodape-de-acao)` dá o padding inferior; `.sem-abas` zera a altura das abas para telas fora da casca. Desktop ≥ 900 px: `.casca` vira linha, `nav.abas` vira coluna de 220 px à esquerda (`order: -1`). vaul: a transição de entrada usa `--mola-entrada`/`--tempo-folha` com seletor mais específico que o estilo injetado pela biblioteca; `aria-describedby={undefined}` cala o aviso do Radix. Menu do Base UI com `render` no `Trigger` apontando para `Botao` (React 19 passa `ref` como prop, então não precisa de forwardRef). O `Fechar` da folha continua, porque as telas dependem dele.

- 11/09/2026 (executora, fase 3): vitest com `projects` (`workers` e `dom`); os `.test.tsx` são checados pelo `tsconfig.app.json` (deixou de excluí-los), sem projeto de tsconfig extra. Sem `@testing-library/jest-dom`: os testes usam asserções simples. `Botao` expõe `BotaoLink` para os `<Link className="botao">` das telas e `classesDoBotao` para quem precisa só das classes; `Capa` mantém `grande?: boolean` além de `tamanho` para as telas atuais não quebrarem antes da fase 6. `Selo` neutro usa os tokens `realizada` (cinza). O `.selo.parcial` das telas vira variante `trecho` na migração.

- 11/09/2026 (executora, fase 2): `limparTitulo` também descarta um pedaço que seja só ruído depois do hífen ("Grato Sou (I Thank God) - Ao vivo • DROPS" daria artista "Ao vivo" pela regra literal); e quando a metade coincide com o canal, compara sem os sufixos music/oficial/official. Helpers de texto puros (`textoDoUltimoTom`, `selosDaMusica`, `textoDoTomSugerido`, `textoDoHistorico`, `descricaoNaLista`, `dataDoEnvio`, `diaDaSugestao`, `textoDaUltimaEscala`) ganham `hoje` opcional com padrão `hojeEmBrasilia()`, para os testes não dependerem do ano corrente; `notificacoes.test.ts` congela o relógio com `vi.useFakeTimers`. Os testes do worker usam Escalas em 2099 e agora esperam "de 2099" no texto, que é o comportamento certo.
- 11/09/2026 (executora, fase 2): os tipos de `puppeteer-core` trazem a lib DOM para o projeto `tsconfig.node.json`, e `CryptoKey` em `scripts/fumaca/notificacoes.ts` passou a colidir com o do `node:crypto`; anotado como `webcrypto.CryptoKey`.

- 11/09/2026 (executora, fase 1): pontos laterais do selo completo em raio 38 (x 22/98) em vez de x 14/106 do spec, porque com anéis em 55/47 os pontos cairiam sobre o anel interno; textos dos arcos entre o anel interno e as barras (linha de base em raio 36), como no mockup. `selo.svg` sai do mesmo script (`scripts/marca.ts`) a partir de `src/marca/selo.ts`, que o componente `Marca` e `scripts/icones.ts` compartilham, para a geometria existir num lugar só. Registrado em `docs/brand/README.md`.
- 11/09/2026 (executora, fase 1): `opentype.js` quebra em `stringToGlyphs` com a GSUB da Fraunces (lookup 6 formato 2); o script mapeia letra a letra com `charToGlyph`, suficiente porque os textos são só maiúsculas latinas.
- 11/09/2026 (executora, fase 1): `scripts/prints.ts` (com `puppeteer-core` sobre o Chrome instalado, devDependency) tira os prints das 22 telas em 375 px nos dois temas, entrando pelo convite gerado na hora; é a ferramenta dos portões visuais desta entrega e do executor da fase 6. O Browser pane da sessão não salva arquivo em disco. Uso: `npx tsx scripts/prints.ts [--prefixo x] [--telas a,b] [--tema claro|escuro]` com o servidor em 8787 de pé.
- 11/09/2026 (executora, fase 1): `favicon-32.png` usa a variante pequena do selo (sem anel interno, traço 6), como a regra de tamanhos até 32 px manda; os demais PNGs usam o selo completo. `abertura.png` entra em `index.html` como `apple-touch-startup-image` do iPhone 390×844 @3x. PNGs da igreja apagados já na fase 1, porque nada mais os referencia.

- 10/09/2026: brainstorm com o Gabriel decide marca do ministério (não da igreja), personalidade retrô anos 70, símbolo onda sonora, logo B "Selo".
- 11/09/2026: paleta D "Amanhecer" revisada e estilo A "Selo e papel" escolhidos entre mockups; movimento inspirado em iOS; spell.sh e shadcn descartados, `vaul` e Base UI aceitos como primitivos sem CSS.
- 11/09/2026: redesenho quebrado em seis fatias (F1 a F6); esta orquestração cobre só a F1. Ordem sugerida pela sessão mestra para as seguintes: F4, depois F2 com F3, depois F5 com F6.
- 11/09/2026: auditoria de usabilidade (115 achados) escrita e aprovada; confirmação pós-culto fica automática com lembrete opcional (decisão do Gabriel), fora desta fatia.
- 11/09/2026: spec da F1 escrito, revisado em duas rodadas (7 issues corrigidas na primeira, aprovado na segunda), commit 5c620bd.
- 11/09/2026: Gabriel escolhe opção 2 (spec novo) e autoriza arquivar o `ORCHESTRATION.md` da V1 em `docs/construcao-v1/ORCHESTRATION-v1.md` (commit 5431e40).
- 11/09/2026: decisões do plano pelo Gabriel: destino "main, sobe local para validar, depois publica no Cloudflare"; tracking só local; subagentes automático. Plano aprovado em texto no chat.

## Deferred work

- Página HTML do Worker para convite inválido (`/entrar/:token` inexistente) continua sem o estilo do app. Motivo: fora do spec (a F1 cobre as 22 telas do front). Fatia F6.
- No catálogo, o selo de «há quanto tempo» deixou de trazer o nome de quem ministrou e a marca de trecho que `SelosDaMusica` mostrava. Motivo: anatomia da `LinhaDeMusica` na seção 5 do spec. Se fizer falta, F4.
- Os testes do worker com Escalas em 2099 e os de domínio com relógio congelado dependem de `formatarDia` acrescentar o ano só quando difere de hoje; helpers de texto ganharam `hoje` opcional para isso. Motivo: decisão de teste, sem impacto no app.

- Reordenar o Repertório durante os 5 s de uma remoção pendente pode errar a posição (a linha some da lista e da medição). Motivo: caso raro; corrigir exigiria manter a linha oculta com ref. Fatia F3.

- Achados da auditoria fora da F1: todos os das partes 1 a 6 e por tela marcados F2 a F6 (ver `docs/superpowers/specs/2026-09-10-auditoria-de-usabilidade.md`). Motivo: escopo da Fundação é pele e componentes.
- Buracos de produto registrados na auditoria ("Fora do redesenho, mas registrado"): disponibilidade do Membro, letra dentro do app, etiquetas de ocasião, confirmação pós-culto automática com lembrete. Motivo: exigem API e desenho próprio.
- Saída animada da `Folha` nas telas que montam condicionalmente: aceita perdida na F1; as fatias seguintes migram para `aberta?`.
- Texto vivo da marca horizontal em 800 com `WONK` 1 vs. SVG gerado em 700 sem `WONK`: diferença aceita (spec, seção 1).
