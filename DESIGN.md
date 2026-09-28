---
name: Renovo Hub
description: Escalas, repertório e Tons do Renovo Music em cinzas neutros, um acento índigo e a Geist como única voz.
colors:
  fundo: "light-dark(#f4f4f2, #0f0f10)"
  superficie: "light-dark(#ffffff, #18181a)"
  superficie-alta: "light-dark(#ededeb, #222225)"
  linha: "light-dark(#e2e2df, #2b2b2f)"
  texto: "light-dark(#19191b, #f2f2f0)"
  texto-2: "light-dark(#5d5d64, #a3a3a8)"
  neutro-suave: "light-dark(rgb(0 0 0 / 5.5%), rgb(255 255 255 / 7%))"
  acento: "light-dark(#3a4789, #a9c0ea)"
  acento-forte: "light-dark(#2d386f, #c2d3f2)"
  acento-suave: "light-dark(#ebedf3, #2c3037)"
  sobre-acento: "light-dark(#ffffff, #0f131b)"
  realce: "light-dark(#b5502d, #eba560)"
  atencao: "light-dark(#9a4f12, #eba560)"
  atencao-suave: "light-dark(#f5ede7, #332a23)"
  perigo: "light-dark(#a8323e, #f08a93)"
  perigo-suave: "light-dark(#f6eaec, #34272a)"
  sucesso: "light-dark(#2c6b42, #7fc79a)"
  sucesso-suave: "light-dark(#eaf0ec, #252f2b)"
  ceia-fundo: "light-dark(#ece8f3, #2b2733)"
  ceia-texto: "light-dark(#57407f, #c9bdea)"
typography:
  display:
    fontFamily: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  caption:
    fontFamily: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  dense:
    fontFamily: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
  control:
    fontFamily: "Geist, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  p: "6px"
  chip: "10px"
  padrao: "12px"
  g: "14px"
  total: "999px"
spacing:
  espaco-1: "4px"
  espaco-2: "8px"
  espaco-3: "12px"
  espaco-4: "16px"
  espaco-6: "24px"
  espaco-8: "32px"
components:
  button-primary:
    backgroundColor: "{colors.acento}"
    textColor: "{colors.sobre-acento}"
    typography: "{typography.control}"
    rounded: "{rounded.padrao}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.acento-forte}"
  button-secondary:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    typography: "{typography.control}"
    rounded: "{rounded.padrao}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.superficie-alta}"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.acento}"
    typography: "{typography.control}"
    rounded: "{rounded.padrao}"
    padding: "0 12px"
    height: "44px"
  button-tertiary-hover:
    backgroundColor: "{colors.acento-suave}"
  button-danger:
    backgroundColor: "{colors.perigo-suave}"
    textColor: "{colors.perigo}"
    typography: "{typography.control}"
    rounded: "{rounded.padrao}"
    padding: "0 20px"
    height: "44px"
  button-small:
    rounded: "{rounded.chip}"
    padding: "0 14px"
    height: "36px"
  chip:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto-2}"
    rounded: "{rounded.chip}"
    padding: "0 14px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.acento-suave}"
    textColor: "{colors.acento}"
  badge:
    backgroundColor: "{colors.neutro-suave}"
    textColor: "{colors.texto-2}"
    typography: "{typography.label}"
    rounded: "{rounded.p}"
    padding: "3px 8px"
  badge-accent:
    backgroundColor: "{colors.acento-suave}"
    textColor: "{colors.acento}"
  badge-warning:
    backgroundColor: "{colors.atencao-suave}"
    textColor: "{colors.atencao}"
  badge-danger:
    backgroundColor: "{colors.perigo-suave}"
    textColor: "{colors.perigo}"
  badge-success:
    backgroundColor: "{colors.sucesso-suave}"
    textColor: "{colors.sucesso}"
  badge-ceia:
    backgroundColor: "{colors.ceia-fundo}"
    textColor: "{colors.ceia-texto}"
  badge-tom:
    backgroundColor: "{colors.neutro-suave}"
    textColor: "{colors.texto}"
  card:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.g}"
    padding: "16px"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.texto}"
    rounded: "{rounded.padrao}"
    padding: "10px 12px"
    height: "44px"
  sheet:
    backgroundColor: "{colors.superficie}"
    rounded: "14px 14px 0 0"
    padding: "8px 16px 20px"
  menu:
    backgroundColor: "{colors.superficie-alta}"
    rounded: "{rounded.g}"
    padding: "6px"
    width: "240px"
  toast:
    backgroundColor: "{colors.texto}"
    textColor: "{colors.fundo}"
    rounded: "{rounded.padrao}"
    padding: "6px 8px 6px 16px"
    height: "48px"
  key-block:
    backgroundColor: "{colors.acento-suave}"
    textColor: "{colors.acento}"
    rounded: "{rounded.g}"
    padding: "6px 10px"
    size: "64px"
---

# Design System: Renovo Hub

## Overview

**Creative North Star: "O Instrumento Bem Feito"**

O Renovo Hub é desenhado como um instrumento premium: acabamento fosco, proporções exatas e um único detalhe que brilha. A beleza vem do artesanato, não do enfeite. Nenhuma cor decora; cada tom de cinza tem um papel, cada espaço tem uma razão, e o único acento (o Índigo) aparece onde há ação ou estado ativo, como o filete de madrepérola no braço de uma guitarra. O humor é **refinado, preciso, premium**: cada detalhe parece decidido, e o app se sente caro sem parecer esforçado.

O sistema é neutro de propósito. Cinzas quase sem matiz, uma família tipográfica só (Geist), superfícies que flutuam com sombra difusa sobre um fundo levemente mais escuro, e componentes contidos: 44 px de altura, raio de 12 px, peso 600, nada que salte. A hierarquia nasce do texto (peso, tamanho, caixa alta em rótulos) e do espaço, não de caixas coloridas. O tema escuro não é uma inversão do claro: é o palco, com superfícies um degrau mais claras que o fundo e sombras mais fundas, pensado para o celular no pedestal com pouca luz.

Rejeições confirmadas pelo dono do projeto: fundos tingidos e cartões coloridos, serifa de display (a Fraunces saiu em 19/09/2026), grão ou textura de papel, e o escuro azulado da paleta anterior. Em 25/09/2026 a borda de 1 px dos cartões em repouso foi substituída, como regra, pela elevação suave descrita em Elevation & Depth, que entrou no código em 26/09/2026.

**Key Characteristics:**
- Cinzas neutros em pares claro/escuro, escritos uma vez com `light-dark()`.
- Um acento só, o Índigo, reservado a ação e estado ativo; o Âmbar aparece em dois lugares apenas.
- Geist como única família; hierarquia por peso, tamanho e espaçamento, com rótulos em caixa alta.
- Superfícies em repouso flutuam com sombra difusa em duas camadas; nada mais tem sombra além de menu e folha.
- Componentes de 44 px, raio 12 px, borda fina onde há borda; resposta ao toque por compressão leve (scale 0.97) e molas curtas.
- Selos de estado em cinza por padrão; cor só quando o estado pede atenção, cuidado, sucesso ou marca a Santa Ceia.

## Colors

Uma paleta de cinzas quase sem matiz, um acento índigo que muda de peso entre os temas, e cinco cores semânticas em pares suave/forte.

### Primary
- **Índigo** (`acento`, `light-dark(#3a4789, #a9c0ea)`): a única cor de ação. Botão primário, link, aba ativa, anel de foco, chip selecionado, selo "nova", ponto do tom sugerido no teclado e as cinco barras do selo da marca. No claro é um índigo profundo de tinta; no escuro, um índigo lavado que lê como luz sobre o palco.
- **Índigo profundo** (`acento-forte`, `light-dark(#2d386f, #c2d3f2)`): só o hover do botão primário e o hover de linhas navegáveis.
- **Índigo-suave** (`acento-suave`, `light-dark(#ebedf3, #2c3037)`): o fundo do acento. Chip selecionado, selo destaque, atalho do modo culto, bloco do Tom no culto, item de menu em foco, dia de hoje no Mês, hover do botão terciário.
- **Sobre índigo** (`sobre-acento`, `light-dark(#ffffff, #0f131b)`): texto sobre o Índigo cheio.

### Secondary
- **Âmbar** (`realce`, `light-dark(#b5502d, #eba560)`): cobre queimado no claro, âmbar no escuro. Aparece em dois lugares só: o coração do apoio a uma Sugestão e o ponto do Tom original no teclado. É o calor raro do sistema; não ganha novos usos sem decisão.

### Semantic
- **Atenção** (`atencao` / `atencao-suave`, `light-dark(#9a4f12, #eba560)` sobre `light-dark(#f5ede7, #332a23)`): repetição recente ("há 12 dias · Isa"), música já no Repertório de outro dia, faixa de alerta, observação do Ministro no culto. No escuro compartilha o valor do Âmbar.
- **Perigo** (`perigo` / `perigo-suave`, `light-dark(#a8323e, #f08a93)` sobre `light-dark(#f6eaec, #34272a)`): Escala cancelada, remover, erro de campo, item de menu destrutivo.
- **Sucesso** (`sucesso` / `sucesso-suave`, `light-dark(#2c6b42, #7fc79a)` sobre `light-dark(#eaf0ec, #252f2b)`): situação resolvida, notificação ativa, pacote guardado no aparelho.
- **Santa Ceia** (`ceia-texto` / `ceia-fundo`, `light-dark(#57407f, #c9bdea)` sobre `light-dark(#ece8f3, #2b2733)`): um lilás discreto que existe só para marcar a Escala de comunhão.

### Neutral
- **Fundo** (`fundo`, `light-dark(#f4f4f2, #0f0f10)`): papel-frio no claro, carvão no escuro. A página inteira e a barra do sistema.
- **Superfície** (`superficie`, `light-dark(#ffffff, #18181a)`): cartões, folha, campos, barra de abas, botão secundário. No escuro é um degrau mais claro que o fundo; é isso, mais a sombra, que faz o cartão existir.
- **Superfície alta** (`superficie-alta`, `light-dark(#ededeb, #222225)`): menu, bloco do dia, capa vazia, inicial de pessoa, hover de linhas, tecla preta do teclado. No claro é mais escura que a superfície, não mais clara: é um "recesso", não uma elevação.
- **Linha** (`linha`, `light-dark(#e2e2df, #2b2b2f)`): separador de listas, borda de campos, chips e botão secundário, alça da folha, trilho do interruptor.
- **Grafite** (`texto`, `light-dark(#19191b, #f2f2f0)`): todo o texto principal, o selo da marca e o fundo do aviso de rodapé.
- **Cinza-meio** (`texto-2`, `light-dark(#5d5d64, #a3a3a8)`): dicas, rótulos, metadados, ícones de apoio, abas inativas.
- **Véu** (`neutro-suave`, `light-dark(rgb(0 0 0 / 5.5%), rgb(255 255 255 / 7%))`): fundo dos selos neutros (Realizada, Legado, Trecho, Tom), do segmento e da grade de meses.

### Named Rules
**Regra do Acento Único.** O Índigo aparece só onde há ação ou estado ativo. Nunca como fundo de seção, cor de título ou decoração. Se uma tela tem mais de um botão primário, está errada.

**Regra do Selo Cinza.** Estado que não pede nada de quem lê fica em Véu e Cinza-meio: Realizada, Legado, Trecho, Tom. Cor só para Atenção, Perigo, Sucesso e Santa Ceia.

**Regra do Par.** Todo token de cor nasce como `light-dark(claro, escuro)` em `src/estilo/tokens.css`. Nenhum hex solto em componente; o modo culto força o escuro trocando só o `color-scheme`.

## Typography

**Display Font:** Geist (com `system-ui`, `-apple-system`, `Segoe UI` como reserva)
**Body Font:** Geist (a mesma)

**Character:** Uma família só, geométrica e neutra, carregada do Google Fonts nos pesos 400, 500, 600 e 700. A hierarquia vem de peso, tamanho, espaçamento de letras e caixa alta, nunca de trocar de fonte. Títulos grandes fecham o espaçamento (-0.025em); rótulos abrem (+0.06em) e sobem para caixa alta.

### Hierarchy
- **Display** (700, 28px, 1.15, -0.025em): o título de cada tela (`h1`, `.display`) e a palavra "Renovo" na marca. Um por tela.
- **Headline** (600, 18px, 1.25, -0.01em): título da folha que sobe.
- **Title** (600, 17px, 1.3, -0.01em): título de cartão, título de subtela e o título encolhido que aparece na faixa ao rolar. O título de Música usa 700 em 19px.
- **Body** (400, 15px, 1.45): o corpo do app, definido no `body`. Linhas de lista e itens de menu sobem para 500.
- **Caption** (400, 14px, Cinza-meio): a "dica" que acompanha títulos e linhas.
- **Dense** (400, 13px, 1.4, Cinza-meio): o degrau abaixo da Caption para o que se lê de relance dentro de uma linha: observação do Ministro, legenda, "visto às", situação da Escala, dica do atalho do culto, pretas do teclado. Sobe para 500 ou 600 quando é estado ("falta 1 bateria") e nunca desce de 13px.
- **Tom na lista** (700, 17px, tabular, Grafite): a nota do Tom na coluna direita das linhas de leitura do Repertório, com o rótulo "tom" em Label embaixo. É a resposta à pergunta número um do Membro, por isso é o maior texto da linha; o selo de Tom fica só onde não há coluna (linhas de edição).
- **Label** (600, 12px, 1.3, +0.06em, caixa alta, Cinza-meio): `h2` de seção, rótulo de campo, nome de Grupo na Equipe, mês no bloco do dia, marcador na letra. Nunca em corpo de texto.
- **Control** (600, 15px, 1): botões. Chips, segmento e botão pequeno descem para 14px; abas usam 500 em 11px.
- **Tom no culto**: `clamp(26px, 7.5vw, 30px)` com altura de linha 1, e `clamp(28px, 8vw, 34px)` no bloco grande. É o maior texto do app e existe para ser lido a um metro.

### Named Rules
**Regra da Família Única.** Geist é a única família. Não há serifa de display, não há segunda sans, não há monoespaçada; a Fraunces e a Inter saíram em 19/09/2026 e só sobrevivem nos SVGs gerados da marca.

**Regra dos Números Tabulares.** Datas, contagens, tempos relativos, minutagem e Tons usam `font-variant-numeric: tabular-nums` para alinhar em listas.

**Regra do Rótulo em Caixa Alta.** Só o papel Label sobe para caixa alta. Botões, chips, selos e títulos ficam em caixa normal.

## Layout

Coluna única, celular primeiro. O conteúdo tem 16 px de margem lateral e largura máxima de 720 px centrada; a 900 px ou mais as abas viram um trilho lateral de 220 px à esquerda e o conteúdo abre para 960 px. O aparelho de referência tem 360 px de largura (Samsung S23): tudo precisa caber nele antes de crescer.

A página não rola; quem rola é `.conteudo`, entre uma faixa de cabeçalho fixa (56 px, com desfoque de 12 px e fundo a 96 %) e a barra de abas (62 px mais a área segura inferior). O rodapé de ação e os avisos ficam fixos acima das abas. Áreas seguras do sistema entram por `env(safe-area-inset-*)` no topo da faixa, no pé das abas, da folha e do rodapé.

Escala de espaço em seis passos: 4, 8, 12, 16, 24 e 32 px. Ritmo observado: seções separadas por 16 px; dentro de um cartão, 12 px entre blocos; listas com linhas de 44 a 52 px separadas por uma Linha de 1 px; cabeçalhos de seção com 32 px de altura e 4 px de recuo lateral para alinhar o rótulo ao conteúdo do cartão. Alvo de toque mínimo de 44 px (`--toque`) em botões, linhas, abas, teclas e alça.

Densidade confortável, não compacta: uma Escala por cartão, uma pessoa por linha, uma música por linha com capa de 84 a 108 px. Grades só onde a informação é de fato tabular: números do perfil (2 ou 3 colunas), meses do seletor (3 colunas), teclado de Tom (14 colunas, para as pretas caírem nas frestas).

## Elevation & Depth

Elevação suave, decidida em 25/09/2026. Superfícies em repouso flutuam sobre o fundo com uma sombra difusa em duas camadas, sem borda; o que abre por cima (menu, folha) ganha uma sombra mais funda; tudo o mais é plano. No tema escuro a sombra sozinha quase não lê, então quem separa é o degrau de cinza entre Fundo e Superfície, e a sombra só reforça. Os tokens vivem em `src/estilo/tokens.css` (`--sombra-cartao`, `--sombra-curta`, `--sombra-flutuando`, `--sombra-cobrindo`); a borda de 1 px dos cartões saiu em 26/09/2026.

### Shadow Vocabulary
- **Cartão em repouso** (`--sombra-cartao`: `0 1px 2px light-dark(rgb(25 25 27 / 6%), rgb(0 0 0 / 35%)), 0 8px 24px light-dark(rgb(25 25 27 / 8%), rgb(0 0 0 / 45%))`): cartões, listas em cartão, esqueleto de cartão, atalho do modo culto.
- **Flutuando** (`--sombra-flutuando`: `0 12px 32px light-dark(rgb(25 25 27 / 18%), rgb(0 0 0 / 60%))`): menu de mais opções e a linha que está sendo arrastada. O marcador do segmento e a bolinha do interruptor usam a versão curta (`--sombra-curta`: `0 1px 2px light-dark(rgb(25 25 27 / 8%), rgb(0 0 0 / 40%))`).
- **Cobrindo** (`--sombra-cobrindo`: `0 -12px 40px light-dark(rgb(25 25 27 / 18%), rgb(0 0 0 / 60%))`): a folha que sobe do rodapé, sobre o fundo escurecido a 40 % com desfoque de 8 px.
- **Inicial sobreposta** (`box-shadow: 0 0 0 2px var(--superficie)`): não é sombra, é o recorte entre iniciais empilhadas; continua como está.

### Named Rules
**Regra das Três Alturas.** Repouso, flutuando, cobrindo. Nada mais recebe sombra: botões, chips, selos, campos, abas e o bloco do dia ficam planos e se separam por cor ou borda.

**Regra do Escuro que Sobe.** No escuro, cada camada acima é um cinza mais claro (Fundo, Superfície, Superfície alta). A sombra acompanha, mas nunca substitui esse degrau.

## Shapes

Retângulos de cantos macios, em cinco raios com papel fixo: 6 px para selos, 10 px para chips, botão pequeno e bloco do dia, 12 px para botões, campos, itens de menu e avisos, 14 px para cartões, folha, menu e atalho do culto, e 999 px só para o que é pílula de verdade (alça da folha, contagem na aba, interruptor, índice de letras). Capas de música usam 8 px; iniciais de pessoa e o botão de limpar busca são círculos.

Borda de 1 px em Linha onde a superfície é interativa e está em repouso: campos, botão secundário, chip não selecionado, tecla branca. O chip de Ministro é tracejado até ser escolhido, quando vira Grafite sólido. Cartões e folha não têm borda: separam-se por sombra e degrau de cinza. Nenhum canto totalmente redondo em botão ou campo: a forma do sistema é o retângulo suave, não a pílula.

A marca é a exceção geométrica: um selo circular de dois anéis com cinco barras de onda sonora, desenhado inline em `currentColor` com as barras em Índigo.

## Components

### Buttons
Contidos e precisos: a mesma altura dos campos, texto em 600, resposta ao toque por compressão e não por sombra.
- **Shape:** cantos de 12 px (`--raio`); 10 px no tamanho pequeno.
- **Primary:** Índigo cheio com texto Sobre índigo, 44 px de altura, 20 px de recuo lateral, fonte Control. Hover em Índigo profundo.
- **Secondary:** Superfície com borda de 1 px em Linha e texto Grafite; hover em Superfície alta.
- **Tertiary:** sem fundo, texto Índigo, recuo de 12 px; hover em Índigo-suave. Na variante perigo, texto Perigo e hover em Perigo-suave.
- **Danger:** Perigo-suave com texto Perigo; hover escurece 6 % por filtro.
- **Icon:** 44 px quadrado, sem fundo, ícone de 24 px em Grafite; hover em Superfície alta.
- **States:** toque comprime a 0.97 por 120 ms com a mola de toque; carregando esconde o rótulo e mostra um anel de 18 px girando; desabilitado a 50 % de opacidade.
- **Small:** 36 px de altura, 14 px de recuo, ícone de 16 px.

### Chips
- **Style:** 36 px, raio 10 px, Superfície com borda Linha, texto Cinza-meio em 600 14px; rolam em linha com máscara de desvanecimento nas bordas.
- **State:** selecionado vira Índigo-suave com texto Índigo e borda transparente. Função técnica selecionada usa Cinza-meio cheio com texto Superfície. Ministro é tracejado, e selecionado vira Grafite cheio com texto Fundo.

### Segmento
Trilho em Véu com 3 px de recuo e raio 12 px; o marcador desliza com a mola de entrada (400 ms) e leva a sombra curta. Botões de 44 px em 600 14px, ativo em Grafite, inativo em Cinza-meio, com a contagem em 500 13px tabular.

### Selos
- **Style:** 3 × 8 px de recuo, raio 6 px, 600 12px tabular, uma linha só.
- **Variants:** neutro (Véu sobre Cinza-meio) para Realizada, Legado, Trecho e "nunca tocada"; Tom em Véu sobre Grafite a 13px onde a linha não tem coluna da direita; acento e "nova" em Índigo-suave; atenção, sucesso, perigo e cancelada nos pares semânticos; Santa Ceia em lilás; Ministro só com contorno de 1 px em Linha.

### Cards / Containers
- **Corner Style:** 14 px.
- **Background:** Superfície; cancelada ganha um anel interno em Perigo-suave e título em Perigo.
- **Shadow Strategy:** "Cartão em repouso" de Elevation & Depth (`--sombra-cartao`).
- **Border:** nenhuma.
- **Internal Padding:** 16 px; listas em cartão zeram o recuo e usam 14 px por linha.

### Inputs / Fields
- **Style:** 44 px, raio 12 px, Superfície com borda Linha, texto em 400 16px (o tamanho impede o zoom do iPhone); rótulo em Label acima, dica em Caption abaixo.
- **Focus:** borda e anel de 1 px em Índigo, sem contorno do navegador.
- **Error / Disabled:** borda em Perigo e mensagem em Perigo 14px com `role="alert"`.
- **Busca:** ícone de lupa a 12 px da esquerda, recuo interno de 42 px dos dois lados, botão circular de limpar à direita.

### Navigation
- **Faixa:** 56 px, fixa no topo do conteúdo, fundo a 96 % com desfoque; selo da marca de 28 px à esquerda em telas raiz, voltar em subtelas; ação de 44 px à direita. Ao rolar, o título da tela aparece encolhido no centro (600 17px) e a faixa ganha uma linha de 1 px embaixo.
- **Abas:** cinco, em Superfície com Linha no topo; ícone de 24 px e rótulo 500 11px em Cinza-meio; ativa em Índigo e 600, com um salto de 1.15 na mola de entrada ao tocar. Contagem de Sugestões em pílula Índigo de 17 px. A 900 px viram trilho de 220 px com itens de 15px e fundo Índigo-suave no ativo.

### Folha
Sobe do rodapé com a mola de entrada em 400 ms e desce com a mola de saída; alça de 40 × 5 px em Linha; título em Headline; painel com 12 px entre blocos e 16 px de margem; largura máxima de 720 px; fundo da página escurecido a 40 % com desfoque de 8 px.

### Menu
240 px de largura mínima, 6 px de recuo, Superfície alta, raio 14 px, escala de 0.94 para 1 em 160 ms; itens de 44 px em 500 15px, foco em Índigo-suave, destrutivo em Perigo com foco em Perigo-suave.

### Aviso de rodapé
Grafite cheio com texto Fundo, 48 px, raio 12 px, sobe 24 px com a mola de entrada e some em 160 ms; "Desfazer" em Índigo-suave dentro dele. Fica 12 px acima das abas.

### Linha de música
A assinatura do app: capa de 84 a 108 px por 60 px com cantos de 8 px (64 × 36 nas linhas que carregam a alça de reordenar, para o título caber a 360 px), título em 600 15px com no máximo duas linhas, artista em Caption numa linha só, selos em fila (tempo, trecho, atenção, Legado, nova, letra). No Repertório (Início e Escala, leitura ou edição) o Tom vai para a coluna da direita ("Tom na lista"), inclusive nos Trechos do Medley, e a alça de reordenar fica depois dele; no catálogo, onde a coluna da direita é o tempo, o Tom continua como primeiro selo. Variantes leitura, navegação (hover em Índigo profundo) e escolha (a linha inteira é botão). Medley abre uma lista recuada com Linha de 2 px à esquerda. Arrastar destaca a linha em Superfície alta.

### Teclado de Tom
Sete teclas brancas e cinco pretas numa grade de 14 colunas: brancas de 44 px em Superfície com borda Linha e 700 15px; pretas de 38 px em Superfície alta com Cinza-meio 13px. Ponto de 6 px no canto: Índigo à direita para o Tom sugerido, Âmbar à esquerda para o Tom original. Tecla escolhida em Índigo cheio.

### Modo culto
Sempre escuro pelo `color-scheme`, sem abas. Itens de 76 px com número em 22px Cinza-meio tabular e título 18px; o Tom em bloco de 64 px em Índigo-suave com rótulo Label em Índigo; letra em 17px por padrão (ajustável), marcadores em Label, negrito em Grafite; observação do Ministro em Atenção-suave.

### Esqueleto e vazio
Ossos em gradiente entre Linha e Superfície alta, brilho de 1.6 s (desligado com `prefers-reduced-motion`); estado vazio centrado com ícone de 32 px e texto de até 28em em Cinza-meio.

## Do's and Don'ts

### Do:
- **Do** escrever toda cor nova como par `light-dark()` em `tokens.css` e usá-la por `var()`.
- **Do** reservar o Índigo a ação e estado ativo, e o Âmbar ao apoio e ao Tom original; qualquer outro uso é decisão a registrar aqui.
- **Do** manter 44 px como altura de botões, campos, linhas e alvos, e 16px no texto de campo para o iPhone não dar zoom.
- **Do** separar superfícies em repouso por sombra suave e degrau de cinza; menu e folha por sombra funda; nada mais por sombra.
- **Do** usar Label em caixa alta para cabeçalhos de seção e rótulos, e só para eles.
- **Do** manter os selos de estado em cinza salvo Atenção, Perigo, Sucesso e Santa Ceia.
- **Do** responder ao toque com compressão (0.97, 120 ms) e às entradas com as molas `--mola-entrada` e `--mola-saida`, respeitando `prefers-reduced-motion`.
- **Do** testar cada tela a 360 px antes de qualquer largura maior.

### Don't:
- **Don't** reintroduzir cartões coloridos, fundos tingidos, grão de papel ou a serifa de display.
- **Don't** usar uma segunda família, nem pesos fora de 400, 500, 600 e 700.
- **Don't** colocar sombra em botão, chip, selo, campo ou aba; a Regra das Três Alturas vale para tudo.
- **Don't** arredondar botão ou campo até virar pílula; pílula é só alça, contagem, interruptor e índice.
- **Don't** usar mais de um botão primário por tela, nem Índigo como cor de título ou de fundo de seção.
- **Don't** usar hex solto em componente; se o token não existe, ele nasce em `tokens.css` primeiro.
- **Don't** mostrar alerta de repetição fora do fluxo de adicionar música; música na Escala é música decidida.
