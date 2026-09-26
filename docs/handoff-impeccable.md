# Handoff: Impeccable no Renovo Hub

Escrito em 26/09/2026 pela sessão que rodou `/impeccable init`, `document` e `critique src/inicio`. A próxima sessão **executa os sete comandos de correção da tela Início em sequência, sem parar entre eles**, roda a crítica de novo e só então volta ao Gabriel. Depois disso, a mesma rotina (crítica, correções, crítica) segue tela por tela.

O objetivo do Gabriel, nas palavras dele: "melhorar o visual e deixar tudo com uma cara mais profissional". É refinamento do visual neutro de 19/09/2026, nunca redesenho.

## Onde está a verdade

- `PRODUCT.md` (raiz): quem usa, cenas, princípios, compromissos de marca. O Ministro montando a semana desempata qualquer conflito de tela. Aparelho de referência: Samsung S23, 360 px.
- `DESIGN.md` (raiz): o sistema visual normativo. Estrela-guia "O Instrumento Bem Feito"; humor refinado, preciso, premium; oito regras nomeadas (Acento Único, Selo Cinza, Par, Família Única, Números Tabulares, Rótulo em Caixa Alta, Três Alturas, Escuro que Sobe). O frontmatter YAML é a fonte dos tokens; a prosa explica onde e por quê.
- `.impeccable/design.json`: sidecar do DESIGN.md (rampas em OKLCH, as cinco sombras, molas de movimento, 11 componentes em HTML e CSS para o painel do modo `live`).
- `.impeccable/config.json`: `{"buildPath": "comp"}`. Tela **nova** começa por uma proposta visual no canvas de Design antes de qualquer código. Refinamento de tela existente não passa por isso.
- `.impeccable/live/config.json`: modo `live` configurado para `index.html`, sem CSP.
- `.impeccable/critique/2026-09-26T02-37-53Z__src-paginas-inicio-tsx.md`: a crítica do Início, 25/40, com os cinco problemas prioritários, as observações menores e as bandeiras por persona. O `polish` lê este arquivo como backlog e o fecha quando o alvo muda.
- Canvas de Design com a paleta, a tela de Início nos dois temas e as pranchas de profundidade e de componentes que o Gabriel comparou: https://claude.ai/artifact/PJLDMcT22v2915PkiPsy5H (privado; só ele abre).
- Glossário do domínio: `CONTEXT.md`. Convenções de código: `docs/handoff-v1.md`, seção "Convenções pra qualquer ajuste". Regra global do Gabriel: sem comentários no código salvo o não óbvio.
- Redesenho anterior e o que ficou pendente dele (Admin e fora da casca, F5 e F6): `docs/handoff-redesenho.md`.

## Decisões já tomadas (não reabrir)

| Decisão | Valor | Quando |
| --- | --- | --- |
| Estrela-guia | "O Instrumento Bem Feito" | 25/09 |
| Humor | refinado, preciso, premium | 25/09 |
| Nomes das cores de acento | Índigo (`--acento`) e Âmbar (`--realce`) | 26/09 |
| Profundidade | **Elevação suave**: cartões em repouso com sombra difusa em duas camadas e sem borda; menu e folha com sombra funda; nada mais tem sombra. Valores exatos em `DESIGN.md`, Elevation & Depth. O código ainda tem a borda de 1 px (`--sombra: 0 0 0 1px var(--linha)`) e trocá-la é trabalho do `polish`. | 26/09 |
| Componentes | Refinados e contidos, como estão: 44 px, raio 12, borda fina onde há borda, peso 600, compressão 0.97 ao toque | 26/09 |
| Título do Início | O `h1` deixa de ser "Oi, Nome" e passa a ser a **data da próxima Escala** ("Seg, 28 de set"); o cumprimento vai para o título encolhido da faixa | 26/09 |
| Prioridade das correções | Acabamento e acessibilidade primeiro, depois a cena do Ministro, depois tipografia | 26/09 |
| Escopo | Tudo: os cinco prioritários e as onze observações menores | 26/09 |
| Rejeições visuais | Cartões coloridos e fundos tingidos, serifa de display, grão de papel, escuro azulado, alerta de repetição fora do fluxo de adicionar | 19/09 |

Como o Gabriel decide: olhando uma proposta pronta e comentando, não lendo direção escrita. Ele dispensou duas rodadas de perguntas de múltipla escolha ("só palavras é difícil") e só decidiu depois de ver o canvas. Se um comando precisar de decisão nova de verdade, mostre a comparação no canvas de Design em vez de perguntar em texto.

## Estado em 26/09/2026

- `main` local em `575049c`, igual ao que está publicado em https://renovo-hub.renovo.workers.dev. Sem push (política: só o Gabriel dá push).
- **Não rastreados pelo git**: `PRODUCT.md`, `DESIGN.md`, `.impeccable/` e este handoff. Primeira coisa a fazer: commitar os quatro na `main` ("Contexto do Impeccable: produto, sistema visual e crítica do Início") antes de abrir a branch de trabalho.
- D1 local zerado e semeado com `--demo` em 26/09. Nele, Gabriel é Admin na guitarra da "Culto desta semana" (seg 28) e Marcos é o Ministro dela; há "Culto sem ministro", "Culto sem baterista" e "Culto sem músicas" nas quatro semanas seguintes, e um "Culto de ontem". É o estado que a crítica avaliou.
- `dist/` é o build de 19/09, igual à `main`. **O `wrangler dev` serve o `dist/`, não o código-fonte**: depois de cada edição, rodar `npm run build` antes de olhar no navegador, ou usar o Vite (abaixo).
- `.dev.vars` existe. `.claude/launch.json` tem a configuração `renovo-hub` (wrangler dev na 8787).
- `.impeccable/critique/` tem uma rodada só; a tendência começa na segunda.

## O que fazer, nesta ordem

Rodar cada comando abaixo com o alvo `src/paginas/Inicio.tsx`, um após o outro, **sem parar para perguntar entre eles**. Quando um comando fizer uma pergunta que a tabela de decisões já responde, use a decisão. Quando fizer uma pergunta nova, aplique a opção recomendada, siga, e liste a suposição no relatório final. Cada comando carrega o contexto de foco que a crítica deu:

1. **`/impeccable harden src/paginas/Inicio.tsx`**
   Anel de foco visível dentro das listas em cartão: `.lista.cartao` corta com `overflow: hidden` (`src/estilo/base.css:721`) o `outline` de 2 px com `outline-offset: 2px` (`base.css:86`) dos links `.toque`; usar `outline-offset` negativo ou `overflow: clip; overflow-clip-margin: 4px`. `role="alert"` nos `p.aviso` de erro e botão "Tentar de novo" na própria tela (a casca já tem o padrão em `src/casca/Casca.tsx`). Nomes distintos nos links "Tocar no YouTube" das capas (`src/componentes/Capa.tsx`), com o título da música. Heading nos blocos pós-culto, "Culto de hoje" e sugestões. Desfazer ao fechar o pós-culto (hoje é permanente por Escala via localStorage).
2. **`/impeccable adapt src/paginas/Inicio.tsx`**
   A 360 px o `h2` "Repertório · segunda-feira" trunca e "Ouvir tudo" quebra em duas linhas dentro de 36 px: `.secao > .secao-topo { flex-wrap: nowrap }` com ellipsis (`base.css:1033`) e `.botao` sem `white-space: nowrap`. O `h2` vira "Repertório" (a data já está no cartão acima). Área de toque de 44 px em "Ouvir tudo", "Mês" (36 px) e nas capas (56 × 32). Rótulos "seg"/"qua" do `.dia` de 10 px para 11 px (`base.css:796`). No desktop (≥ 900 px), os fatos em grade em vez de rótulo e valor a 900 px de distância, e "Abrir escala" sem 940 px de largura.
3. **`/impeccable clarify src/paginas/Inicio.tsx`**
   No dia do culto, `CartaoDoCulto` (`Inicio.tsx:112`) põe "Modo culto" como primário pequeno abaixo de "Abrir escala": dois primários, contra a Regra do Acento Único. Trocar pelo atalho de 64 px em Índigo-suave da tela de Escala (`src/paginas/Escala.tsx:111`, `.atalho-do-culto`), acima de "Sua próxima escala", e rebaixar "Abrir escala" a secundário nesse dia. "Precisa de atenção · 4 semanas" vira "até 23 out" (a constante `DIAS_DAS_PENDENCIAS` está vazando). "músicas registradas" vira "no histórico". Vazio do Membro ("Nenhuma escala marcada") ganha o próximo passo. "Abrir escala" e "Mês" com nomes que se sustentam fora de contexto para leitor de tela.
4. **`/impeccable typeset src/paginas/Inicio.tsx`**
   O `h1` passa a ser a data da próxima Escala e "Oi, Nome" vai para o título encolhido (`src/casca/Cabecalho.tsx`). O Tom sai do quarto selo da linha e vai para a coluna direita a 15 a 17 px, reaproveitando o padrão `.tempo` de `src/componentes/LinhaDeMusica.tsx` e `componentes.css:424`; o selo fica só para trecho. Acrescentar ao `DESIGN.md` um papel de tipo `dense` de 13 px (linhas densas, legendas, observações), para calar os 22 avisos consultivos "13px fora da rampa" do detector; regenerar o sidecar se mexer no frontmatter.
5. **`/impeccable distill src/paginas/Inicio.tsx`**
   Pendências (`Inicio.tsx:314`, `.estado.atencao`): no máximo duas mais "+N" (mesmo padrão de `MAXIMO_DE_PLANEJADAS` em `LinhaDeMusica.tsx`), texto em Cinza-meio 500 com só o ícone em Atenção, "sem ministro" sempre primeiro, e o link levando à Equipe com a Função em foco (`Pendencia.funcaoId` já existe em `src/dominio/pendencias.ts`). Pilha de iniciais com "+N" além de 6. A linha de sugestões dentro de uma seção com título, não um cartão órfão no fim.
6. **`/impeccable layout src/paginas/Inicio.tsx`**
   Ordem dos blocos pelo Princípio 1: se o Ministro dirige uma Escala mais adiante mas a deste domingo está sem músicas, o domingo vem antes do repertório da outra. Padding do `.cartao.pos-culto` de volta aos 16 px (`base.css:513`). Fim do `margin-top: -8px` do `VistoEm` (`base.css:258`). Osso de esqueleto para os `h2`, para a tela não pular quando o dado chega.
7. **`/impeccable polish src/paginas/Inicio.tsx`**
   A borda de 1 px dos cartões vira a sombra suave do `DESIGN.md` (tokens novos em `src/estilo/tokens.css`: cartão em repouso, flutuando, cobrindo; `--sombra` e `--sombra-alta` atuais são substituídos, não somados). O selo Tom fica numa posição só na lista. O passe lê o snapshot da crítica como backlog e fecha o que sobrou.

Depois dos sete: `npm run build`, capturas nos dois temas, e **`/impeccable critique src/inicio`** de novo. A nota de partida é 25/40. Se algum P1 continuar, corrigir antes de dar por pronto.

Regras durante a execução:
- Cada comando do Impeccable roda o detector mecânico ao final (`impeccable detect --json <arquivos mudados>`); o hook automático não está ligado.
- Antes de qualquer edição de UI, o skill manda ler `reference/craft-floor.md`; obedecer.
- Um passe de verificação por comando, em lote (360 px e desktop, claro e escuro), correção do que apareceu, no máximo mais um passe. Sem loop aberto de captura e ajuste.
- `npm run check && npm test` antes de cada commit. Um commit por comando, em português, sem linha de atribuição.
- Mudança de domínio ou de vocabulário atualiza `CONTEXT.md` na mesma sessão. Mudança de regra visual atualiza `DESIGN.md` e regenera `.impeccable/design.json`.

## Como rodar e olhar

```sh
npm run build                      # obrigatório depois de editar: o Worker serve dist/
npm run convite -- "Gabriel"       # link de entrada do Admin escalado na guitarra
npm run convite -- "Marcos"        # link de entrada do Ministro
```

Subir o app: `preview_start` com o nome `renovo-hub` (abre `http://localhost:8787`). Abrir o link do convite na aba do painel cria a sessão; depois navegar para `/`. Para iteração com recarga instantânea, `npm run dev:front` sobe o Vite na 5173 com proxy de `/api` e `/entrar` para a 8787, com o Worker de pé.

Capturas em arquivo, com Chrome sem janela (o painel de preview falha em capturas):

```sh
npm exec tsx scripts/prints.ts -- --telas inicio --pasta .scratch/impeccable-inicio
```

Gera `01-inicio-claro.png` e `01-inicio-escuro.png` a 375 px, entrando como Gabriel (`--membro Marcos` para o Ministro). Em Git Bash, rotas que começam com `/` pedem `MSYS_NO_PATHCONV=1`.

Se o banco local estiver estranho: `rm -rf .wrangler/state/v3/d1 && npm run db:migrate && npm run db:seed -- --demo && npm run titulos`.

Antes de dar por pronto: `npm run build && npm run smoke` (apaga e semeia o D1 local de novo, precisa de `.dev.vars` e internet; `PORTA_DO_SMOKE=8790` se a 8787 estiver ocupada).

## Depois do Início

A mesma rotina, uma tela por vez, nesta ordem: `src/paginas/Escala.tsx` (com `Equipe.tsx` e `Adicionar.tsx`), `src/culto/` (modo culto), `src/paginas/Musicas.tsx` e `Musica.tsx`, `src/paginas/Perfil.tsx`. Para cada uma: `critique`, os comandos que a crítica indicar, `critique` de novo. Não pular a crítica: é ela que gera o backlog que o `polish` fecha.

Admin (`src/paginas/admin/`) e as telas fora da casca (Entrar, Esqueci, Instalar, Não encontrada) ainda estão no redesenho anterior (F5 e F6 em `docs/handoff-redesenho.md`). São telas novas para efeito do Impeccable: passam por `/impeccable shape`, e o `buildPath: comp` manda mostrar a proposta no canvas de Design antes de codar.

Publicar (`npm run deploy`) só quando o Gabriel pedir. Ele tem dispensado a validação local nas últimas entregas, mas o deploy continua sendo pedido dele.

## Prompt de abertura sugerido para a próxima sessão

> Leia docs/handoff-impeccable.md e as memórias do projeto. Commite PRODUCT.md, DESIGN.md, .impeccable/ e o handoff na main, abra a branch impeccable/inicio e rode os sete comandos do Impeccable na tela Início na ordem do handoff, sem parar entre eles; use a tabela de decisões para qualquer pergunta que os comandos fizerem e liste as suposições no fim. Depois rode a crítica de novo e me mostre a nota e as capturas.
