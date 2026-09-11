# Fundação da identidade visual (F1)

Spec da primeira fatia do redesenho do Renovo Hub. Decidida em conversa com o Gabriel em 10 e 11/09/2026. É a base que as fatias seguintes (F2 Início e Mês, F3 Escala, F4 Músicas, Sugestões e Perfil, F5 Admin, F6 Fora da casca) vão usar; nenhuma delas começa antes desta terminar.

Leitura obrigatória junto com este spec: a [auditoria de usabilidade](2026-09-10-auditoria-de-usabilidade.md), em especial a seção final "O que a Fundação (F1) precisa entregar". O glossário do domínio está em `CONTEXT.md`; as regras do código, em `docs/handoff-v1.md` (seção "Convenções pra qualquer ajuste").

## Objetivo

Trocar a identidade visual do app inteiro (marca, cores, tipografia, forma, movimento) e criar os componentes que a auditoria pediu, aplicando-os nas 22 telas existentes (10 na casca, 8 de Admin, 4 fora da casca, conforme `App.tsx`; `EmBreve.tsx` não é usado e é apagado) sem mudar a estrutura nem o fluxo de nenhuma delas. Ao final, o app inteiro tem a cara nova e as fatias seguintes só reorganizam telas.

## Decisões já tomadas (não reabrir)

| Decisão | Escolha | Data |
| --- | --- | --- |
| Parentesco da marca | Marca do ministério de louvor, "Renovo Music", não da igreja. A árvore da igreja sai do app. | 10/09 |
| Personalidade | Retrô anos 70 | 10/09 |
| Símbolo | Onda sonora (equalizador de cinco barras) | 10/09 |
| Logo | Conceito B, "Selo": emblema circular com "RENOVO" no arco de cima, "MUSIC" no de baixo e a onda no centro | 10/09 |
| Paleta | D "Amanhecer" revisada: claro marfim-ameixa com índigo, escuro ameixa-carvão com azul-jeans claro, coral de realce | 11/09 |
| Estilo | A "Selo e papel": Fraunces nos títulos, Inter no corpo, cantos grandes, sombra macia, grão de papel, selos em pílula | 11/09 |
| Movimento | Inspirado no iOS: molas, toque com resposta, folha arrastável, push lateral, elemento compartilhado | 11/09 |
| Bibliotecas | Sem biblioteca visual (spell.sh, shadcn descartados). Primitivos de comportamento sem CSS: `vaul` para a folha, Base UI para menu, e nada mais que isso em produção. Dependências de teste e de build (ambiente de DOM para o vitest, Testing Library, `opentype.js`) são permitidas | 11/09 |
| Escopo | Pele nova em todas as telas, estrutura igual. Telas novas e dados novos na API ficam para F2 a F6 | 11/09 |

## 1. Marca

### Selo

O selo é composto por dois anéis concêntricos e cinco barras arredondadas. Geometria de referência, em `viewBox="0 0 120 120"`:

```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" stroke-width="4"/>
  <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <g transform="translate(60 60)" fill="var(--acento)">
    <rect x="-28" y="-7"  width="8" height="14" rx="4"/>
    <rect x="-16" y="-15" width="8" height="30" rx="4"/>
    <rect x="-4"  y="-23" width="8" height="46" rx="4"/>
    <rect x="8"   y="-15" width="8" height="30" rx="4"/>
    <rect x="20"  y="-7"  width="8" height="14" rx="4"/>
  </g>
</svg>
```

Os anéis usam a cor de texto do tema; as barras, a cor de acento. Em tamanhos até 32 px (favicon, ícone de aba), o anel interno some e o externo engrossa para 6.

### Selo completo

O selo completo acrescenta texto nos arcos, entre o anel externo e o interno: "RENOVO" no arco de cima em Fraunces 700, `SOFT` 100, tamanho 12.5 e espaçamento 2.2; "MUSIC" no arco de baixo em Inter 700, tamanho 8.5 e espaçamento 3.4; um ponto de raio 1.8 em cada lado (x 14 e x 106). A referência visual está no mockup `logo-conceitos-v2.html` na pasta local `.superpowers/brainstorm/806-1789086701/` (não versionada; se não existir, a descrição acima basta).

O texto vira caminhos no SVG final, para não depender de fonte carregada nem de renderizador com suporte a `@font-face`. Como: um script novo, `scripts/marca.ts`, usa `opentype.js` para converter os dois textos em caminhos ao longo dos arcos e escreve `public/selo-completo.svg` e `public/marca-horizontal.svg`. As fontes vêm de instâncias estáticas versionadas em `docs/brand/fontes/` (licença OFL, copiadas do repositório oficial da Fraunces e do Inter): `Fraunces144ptSoft-Bold.ttf` para o arco e a palavra "Renovo", `Inter-Bold.ttf` para "MUSIC". Se a instância Soft estática não estiver disponível no repositório oficial, usar a instância `Fraunces144pt-Bold.ttf` e registrar a diferença em `docs/brand/README.md`; nunca depender de fonte instalada na máquina. Os SVGs gerados são commitados, para o build não precisar rodar o script.

### Marca horizontal

Selo completo à esquerda, e à direita "Renovo" em Fraunces, `SOFT` 100, com "MUSIC" embaixo em Inter 700, maiúsculas, espaçamento 0.3em, 45% do tamanho. Altura de referência 64 px; no cabeçalho, 28 px. No SVG gerado, "Renovo" usa a instância estática Bold (700) sem o eixo `WONK`, porque instâncias estáticas não carregam eixos; na interface (componente `Marca` com texto vivo), usa 800 com `WONK` 1. A pequena diferença é aceita.

### Arquivos

Em `public/`:

- `selo.svg`: selo sem texto, com `currentColor` nos anéis e `var(--acento)` nas barras; usado inline pelo componente `Marca`.
- `selo-completo.svg`: com os textos em caminhos.
- `marca-horizontal.svg`.
- `icone-192.png`, `icone-512.png`, `favicon-32.png`, `apple-touch-icon.png`: selo completo sobre o fundo escuro `#1F1B22`, anéis em `#F3E9E1`, barras em `#9FB8E6`.
- `icone-mascaravel-512.png`: mesmo, com o selo ocupando 60% do lado, centrado.
- `abertura.png` (tela de abertura para iOS, 1170 × 2532): fundo escuro, selo completo centrado, "Renovo Music" embaixo.

`scripts/icones.ts` passa a rasterizar esses PNGs a partir dos SVGs com `sharp` (que já é dependência), no lugar do recorte dos PNGs da igreja. Como o `selo.svg` inline usa `currentColor` e `var(--acento)`, que o rasterizador não resolve, o script gera em memória uma cópia com as cores fixas (`#F3E9E1` nos anéis, `#9FB8E6` nas barras) sobre o fundo `#1F1B22` antes de rasterizar. Os PNGs da igreja em `public/` (`marca-claro.png`, `marca-escuro.png`) são apagados; os de `docs/brand/logo/` ficam como referência histórica. `docs/brand/README.md` ganha uma seção "Marca do Renovo Music" apontando para os SVGs e para este spec.

`vite.config.ts`: `includeAssets`, `theme_color` e `background_color` do manifesto passam para `#1F1B22`; `index.html` idem no `theme-color` e no script que troca a cor da barra (`#EFEAEC` no claro). `src/tema/tema.ts` (`COR_DA_BARRA`) acompanha.

## 2. Tokens

`src/estilo/tokens.css` é reescrito. Mantém o mecanismo `light-dark()` e os seletores `[data-tema]`. Valores:

| Token | Claro | Escuro |
| --- | --- | --- |
| `--fundo` | #EFEAEC | #1F1B22 |
| `--superficie` | #FBF9FA | #2A2530 |
| `--superficie-alta` | #FFFFFF | #342E3A |
| `--linha` | #DAD3D8 | #443C4A |
| `--texto` | #2A2430 | #F3E9E1 |
| `--texto-2` | #6F6672 | #B4A8A8 |
| `--acento` | #46508F | #9FB8E6 |
| `--acento-forte` | #363F78 | #B8CBF0 |
| `--acento-suave` | #E0E3F3 | #2E3550 |
| `--sobre-acento` | #FFFFFF | #1A1620 |
| `--realce` | #D8683F | #F0906A |
| `--atencao` | #B5502D | #F0906A |
| `--atencao-suave` | #F8E3DA | #4A2E28 |
| `--perigo` | #A8323E | #F08A93 |
| `--perigo-suave` | #F9E0E3 | #4A262B |
| `--sucesso` | #3E7A4F | #9CCFA8 |
| `--sucesso-suave` | #DFEFE3 | #24392B |
| `--realizada-fundo` / `--realizada-texto` | #E6E1E4 / #6F6672 | #34303A / #B4A8A8 |
| `--cancelada-fundo` / `--cancelada-texto` | #F9E0E3 / #A8323E | #4A262B / #F08A93 |
| `--ceia-fundo` / `--ceia-texto` | #E9E0F3 / #5B3F8A | #3A2E4D / #CFC0F5 |
| `--parcial-fundo` / `--parcial-texto` | #F8EBD6 / #8A5A14 | #45361C / #F0C675 |
| `--legado-fundo` / `--legado-texto` | #E6E1E4 / #6F6672 | #34303A / #B4A8A8 |

Removidos: `--agendada-*`, `--verde-marca`. Contraste conferido em 11/09: texto sobre fundo acima de 12:1 nos dois temas; acento sobre fundo 6.3:1 (claro) e 8.5:1 (escuro); atenção sobre fundo 5.2:1 (claro). `--realce` não é usado em texto pequeno.

Tokens de forma, sombra, movimento e tipografia:

```css
--fonte-display: 'Fraunces', Georgia, serif;
--fonte-corpo: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
--display-eixos: 'SOFT' 100, 'WONK' 1;

--raio: 12px;        /* campos, chips, capas */
--raio-g: 20px;      /* cartões, folhas */
--raio-total: 999px; /* botões, selos */

--sombra: 0 2px 10px light-dark(rgb(42 36 48 / 8%), rgb(0 0 0 / 30%)), 0 0 0 1px var(--linha);
--sombra-alta: 0 -8px 30px light-dark(rgb(42 36 48 / 14%), rgb(0 0 0 / 45%));

--mola-entrada: linear(0, 0.006, 0.025 2.8%, 0.101 6.1%, 0.539 18.9%, 0.721 25.3%, 0.849 31.5%, 0.937 38.1%, 0.968 41.8%, 0.991 45.7%, 1.006 50.1%, 1.012 54.6%, 1.011 62.6%, 1.006 72.1%, 1);
--mola-saida: cubic-bezier(0.4, 0, 1, 1);
--mola-toque: linear(0, 0.4 20%, 0.9 45%, 1.02 65%, 1);
--tempo-folha: 400ms;
--tempo-aviso: 160ms;
--tempo-toque: 120ms;
--tempo-fade: 120ms;

--espaco-1: 4px; --espaco-2: 8px; --espaco-3: 12px; --espaco-4: 16px; --espaco-6: 24px; --espaco-8: 32px;
--toque: 44px;
```

Com `prefers-reduced-motion: reduce`, os tokens de mola viram `ease-out` e os tempos caem para 80 ms; deslizamentos e cascatas viram fade.

O grão de papel é um `background-image` no `body` com um SVG inline (`feTurbulence` `baseFrequency="0.8"`, `numOctaves="2"`) em `data:` URI, opacidade 4% no claro e 6% no escuro, sobre `--fundo`. Cartões e superfícies não recebem grão.

## 3. Tipografia

`index.html` carrega do Google Fonts:

```
family=Fraunces:opsz,wght,SOFT,WONK@9..144,600..900,100,1
family=Inter:wght@400;500;600;700
```

com `display=swap` e `preconnect` (já existe). Kodchasan sai. O `runtimeCaching` das fontes continua como está.

| Papel | Fonte | Tamanho, peso, entrelinha |
| --- | --- | --- |
| Display (título de tela raiz, saudação, mês) | Fraunces, eixos de display | 28 px, 900, 1.1, espaçamento −0.4 px |
| Título de seção `h2` | Fraunces, eixos de display | 20 px, 800, 1.2 |
| Título de item `h3`, `.titulo` | Inter | 16 px, 600, 1.3 |
| Corpo | Inter | 16 px, 400, 1.5 |
| Dica e metadado `.dica` | Inter, `--texto-2` | 14 px, 400 |
| Rótulo `.rotulo` | Inter, maiúsculas, espaçamento 0.12em | 11 px, 700 |
| Botão e chip | Inter | 15 px, 600 |
| Selo, Tom, números | Inter, `font-variant-numeric: tabular-nums` | 13 px, 700 |

Fraunces aparece só nos três primeiros papéis e na marca. Todo o resto é Inter.

## 4. Casca

### Cabeçalho (`src/casca/Cabecalho.tsx`)

Substitui o cabeçalho fixo com logo e o componente `Barra`. Onde monta: `Casca.tsx` deixa de renderizar o `<header>`; cada tela renderiza `<Cabecalho>` como primeiro filho, dentro de `.conteudo`, com `position: sticky; top: 0`, do mesmo jeito que hoje renderiza `<Barra>`. Como `.conteudo` tem `padding` de 16 px e limita os filhos a 720 px, o `Cabecalho` compensa com margem negativa nos lados e no topo e `max-width: none`, para a faixa fixa cobrir a largura toda e o conteúdo não aparecer rolando por cima nem ao lado dela; o espaço interno do título continua alinhado aos 720 px. As telas de Admin renderizam o seu (`Admin.tsx` continua sendo só o `<Outlet />`); a tela de erro de sessão em `Casca.tsx` renderiza o selo centrado sem cabeçalho. Dois modos, decididos pela tela:

- **Raiz** (Início, Mês, Músicas, Sugestões, Perfil): faixa fixa com selo de 28 px à esquerda e ação da tela à direita (ícone ou botão pequeno); título em display logo abaixo da faixa, rolando com o conteúdo. Quando o título grande sai da tela (medido por `IntersectionObserver` num sentinela), a faixa fixa mostra o título em 17 px centralizado, com fade de 200 ms; quando o título grande volta, a faixa esvazia.
- **Subtela**: botão de voltar (ícone) à esquerda, título e subtítulo em Inter no centro-esquerda, ação à direita. Recebe `voltarPara` ou `aoVoltar`, como a `Barra` hoje, para as telas não mudarem de lógica.

A `Barra` é removida depois que todas as telas migrarem. O botão "Admin" sai do cabeçalho: vira a linha "Administração" no Perfil (visível só para Admin) e um ícone de engrenagem na ação do cabeçalho do Início, também só para Admin.

### Abas (`src/casca/Abas.tsx`)

Cinco abas para todos os papéis: Início, Mês, Músicas, Sugestões, Perfil. `soMinistro` some. Ícones do conjunto novo; a aba ativa em `--acento` com o ícone dando um salto de escala 1.15 e volta de mola ao ser selecionada. O badge de Sugestões continua contando as Sugestões abertas, mas só aparece para quem dirige (Ministro ou Admin).

Em largura a partir de 900 px, as abas viram barra lateral à esquerda com ícone e rótulo, e `.conteudo` cresce até 960 px. Só isto de desktop nesta fatia.

### Folha (`src/componentes/Folha.tsx`)

Reimplementada sobre o `vaul` (dependência nova). Mantém a interface atual (`titulo`, `fechar`, filhos). Alça no topo, cantos de `--raio-g`, sobe com `--mola-entrada` em `--tempo-folha`, fundo escurecido a 40% com `backdrop-filter: blur(8px)`, fecha por arrasto, Esc ou toque fora, foco preso dentro. As onze folhas existentes trocam sem mudança nas telas. Como as telas montam a folha condicionalmente (`aberta === 'x' && <Folha>`), a animação de saída não toca nesta fatia; é aceitável. `Folha` aceita opcionalmente `aberta: boolean` para quem quiser a saída animada, e as fatias seguintes migram para essa forma.

### Aviso de rodapé (`src/componentes/Avisos.tsx`, `usarAviso`)

Provedor na casca. `usarAviso()` devolve `avisar(texto, { desfazer?: () => void })`. Um aviso por vez; o novo substitui o anterior. Sobe com mola acima das abas, fica 5 s, sai deslizando. Com `desfazer`, mostra o botão "Desfazer".

Remoção com desfazer é **pendente**: o item some da tela imediatamente; a chamada ao servidor é agendada para 5 s depois e cancelada se a pessoa tocar em "Desfazer". Se a tela desmontar antes (navegação), a chamada é executada na hora. Implementado num gancho reutilizável em `src/componentes/usarRemocaoPendente.ts`, com teste em `usarRemocaoPendente.test.tsx` ao lado (projeto `dom` do vitest).

Aplicações nesta fatia:

- Desfazer: remover Item do Repertório (`Escala.tsx`), apagar Sugestão (`Sugestoes.tsx`), tirar Trecho do Medley (`Medley.tsx`, local, sem servidor).
- Confirmação positiva: escalar ou tirar alguém da Equipe ("Ana escalada no vocal" / "Ana saiu da Equipe"), salvar ou atualizar Formação, copiar texto do WhatsApp e link de convite ("Copiado"), mudar tema, ativar notificações, marcar Música revisada.

### Rodapé de ação (`src/componentes/RodapeDeAcao.tsx`)

Barra fixa acima das abas (ou no fim da tela quando não há abas), com fundo de superfície, sombra alta e `--seguro-baixo`. Recebe um botão primário e opcionalmente um secundário. `.conteudo` ganha `padding-bottom` para o último elemento não ficar embaixo dele. Aplicado a: Adicionar ao Repertório e Promover (`Adicionar.tsx`), Adicionar Medley e "OK, próximo" (`Medley.tsx`), Enviar Sugestão (`Sugestoes.tsx`), Salvar Formação (`EditarFormacao.tsx`), Pronto (`Instalar.tsx`). Os botões duplicados do topo em Medley e EditarFormacao somem.

### Esqueleto (`src/componentes/Esqueleto.tsx`)

Três formas: `linha-de-musica`, `cartao`, `paragrafo`, com brilho lento de 1.6 s. Substitui `<div className="girando">` em todas as telas: cada `usarBusca` carregando renderiza o esqueleto da forma correspondente no lugar do bloco, não no lugar da tela.

### Menu (`src/componentes/Menu.tsx`)

Sobre `@base-ui-components/react` Menu. Gatilho é um botão de ícone "Mais"; itens com ícone e rótulo; item de perigo em `--perigo`. Usado na Escala (Editar data, horário e Santa Ceia; Marcar como Cancelada) no lugar da folha de menu atual.

## 5. Componentes de conteúdo

Todos em `src/componentes/`, com CSS em `src/estilo/componentes.css`.

### `LinhaDeMusica`

Substitui as listas de música de `Inicio.tsx`, `Escala.tsx`, `Musicas.tsx`, `EscolhaDeMusica.tsx`, `Sugestoes.tsx`, `Medley.tsx`, `MusicasARevisar.tsx` e `Sequencias.tsx`.

Propriedades: `musica` (`MusicaResumida` mais o que houver de `MusicaNaLista`), `modo` (`leitura` | `navegacao` | `escolha`), `numero?`, `tom?`, `trecho?` (`{ inicio, fim }`), `observacao?`, `selos?` (lista extra), `direita?` (alça ou ação), `aoEscolher?`, `link?` (vídeo, com minutagem quando trecho), `anexos?`.

Anatomia: `Capa` à esquerda; título limpo (ver `limparTitulo`) em `.titulo`, limitado a duas linhas com `-webkit-line-clamp`; artista em `.dica`; linha de selos: Tom (quando há), tempo relativo da última Execução ou "nunca tocada" **só quando o dado existe** (`ultimaExecucao !== undefined`, isto é, quando a música veio como `MusicaNaLista`; Itens do Repertório trazem `MusicaResumida` e não mostram esse selo), "trecho" com minutagem, "letra" quando há anexo; observação em bloco com filete esquerdo em `--atencao`; espaço à direita. Os selos "nova", "nunca tocada" e tempo relativo usam a variante `neutro`; "legado" usa `legado`; "trecho" usa `trecho`.

Modos: **leitura** (capa toca o vídeo; linha não navega), **navegação** (linha inteira abre `/musicas/:id`; capa toca o vídeo sem navegar), **escolha** (linha inteira chama `aoEscolher`). Medley em leitura mostra os Trechos numa lista interna, cada um com capa pequena, minutagem e Tom. A linha ganha `view-transition-name` na capa quando em modo navegação.

### `Capa`

Contêiner 16:9 com `--raio`, `overflow: hidden`, fundo `--acento-suave`; imagem com `object-fit: cover` (recorta as barras pretas da miniatura do YouTube), `loading="lazy"`, fallback em `capaAlternativa` e, se falhar, nota musical sobre `--realce`. Com `tocavel`, sobrepõe um círculo com ícone de play e vira botão que abre o link em nova aba. Tamanhos: `pequena` (72 × 40) nas listas, `grande` (largura total) nos detalhes. Mosaico de até quatro para Medley, como hoje.

### `Selo`

Variantes: `neutro`, `acento`, `atencao`, `sucesso`, `perigo`, `ceia`, `trecho`, `realizada`, `cancelada`, `legado`, `tom`. `tom` usa algarismos tabulares. Ícone opcional à esquerda. `Selos.tsx` (estado da Escala) passa a não renderizar nada para `agendada`, e usa `Selo` para o resto. `SelosDaMusica` usa `Selo`, com o selo de data trocado por tempo relativo.

### `Botao`

Variantes `primario` (padrão), `secundario`, `terciario`, `icone`, `perigo`; `pequeno`; `largo`; `carregando` (spinner no lugar do texto, largura mantida) e `disabled`. Escala 0.97 em `:active` com `--tempo-toque`, volta com `--mola-toque`. As classes atuais continuam funcionando (`botao`, `secundario`, `pequeno`, `largo`, `perigo`, `icone`) porque o componente as gera; telas podem migrar aos poucos, mas todas migram nesta fatia.

### `Busca`

Campo com ícone de lupa, `type="search"`, botão de limpar quando há texto, altura `--toque`, foco em `--acento`. Substitui os campos de busca de `Musicas.tsx`, `EscolhaDeMusica.tsx` (só o do catálogo; o do YouTube continua como está até a F4) e `Sequencias.tsx`.

### Chips e `Segmento`

`.chips` em linha única com rolagem horizontal, sem quebra, com sombras nas bordas indicando conteúdo escondido; chip marcado em `--acento-suave` com texto em `--acento`. `Segmento` formaliza em componente a classe `.segmento` que já existe. Usos atuais, todos migrados: tema (Perfil), plataforma (Instalar), Inteira ou Trecho (Adicionar), Ligada ou Desligada (Convites), Grupo (Funções), Receber ou Silenciar (Notificações). Duas a três posições com marcador deslizante em `--superficie-alta` que se move com `--mola-entrada`. O CSS atual de `.segmento` é substituído, não duplicado. O "maior ou menor" do teclado de Tom continua sendo dois chips (`.qualidades`) nesta fatia.

### `Campo`

Rótulo acima em `.rotulo`, borda `--linha`, foco `--acento`, `erro?` em `--perigo` abaixo. Envolve `input`, `textarea`, `select` e os nativos de data e hora.

### `Cartao`

`--superficie`, `--raio-g`, `--sombra`. Variante `destaque` com `--acento-suave` de fundo. Sem borda dura.

### `Vazio`

Ícone, uma frase que diz o que fazer, botão opcional. Substitui todos os `<p className="vazio">`. Textos novos, sem jargão (ver a auditoria, achados 44 e V4): por exemplo, "Nenhuma música com esse nome. Cole um link ou busque no YouTube."

### `Icone`

`src/casca/Icone.tsx` cresce para o conjunto: `voltar`, `mais`, `remover`, `arrastar`, `play`, `documento`, `sino`, `sino-cortado`, `calendario`, `musica`, `lampada`, `pessoa`, `casa`, `engrenagem`, `busca`, `limpar`, `seta`, `copiar`, `confirmar`, `atencao`, `whatsapp`, `youtube`, `cifra`, `lista`, `desfazer`, `sol`, `lua`, `sistema`. Os nomes atuais `inicio`, `mes`, `musicas`, `sugestoes`, `perfil` são renomeados para `casa`, `calendario`, `musica`, `lampada`, `pessoa` (sem manter os antigos). Traço 1.8, 24 px, `currentColor`. Todos os caracteres "‹", "›", "⋯", "×" somem das telas.

### Teclado de Tom

`SeletorDeTom` ganha uma propriedade opcional `original?: string | null` e passa a marcar essa tecla com um ponto em `--realce`; `BlocoDeTom` passa `tomOriginal` para ela, e `TomOriginal` em `Musica.tsx` passa o próprio `tom`. Fora isso, só CSS: teclas com `--raio`, tecla sugerida com ponto em `--acento`, tecla marcada em `--acento`.

## 6. Domínio

Em `src/dominio/`, funções puras com testes ao lado:

- `limparTitulo(titulo: string, canal: string): { titulo: string; artista: string }`. O `canal` é o campo `artista` de `MusicaResumida`, que hoje guarda o canal do YouTube nas músicas importadas. Regras, nesta ordem: corta o título no primeiro "|", "//" ou "•"; remove parênteses e colchetes cujo conteúdo contenha "ao vivo", "live", "clipe oficial", "official", "lyric", "playback", "vídeo oficial", "visualizer", "áudio" (sem distinguir maiúsculas e acentos); se sobrar " - " ou " – ", a metade que coincidir com o canal (normalizados) vira artista e a outra vira título; se nenhuma coincidir, a segunda metade vira artista; sem separador, artista é o canal com sufixos "music", "oficial", "official" removidos; apara espaços e pontuação solta nas pontas. Testes com pelo menos os títulos do `seed/playlist.csv` citados na auditoria ("1 Coríntios 15 (Esse Corpo É Uma Semente) - Eric & Evellyn Emerick | TELOS (Ao Vivo)", "Algo Bem Maior (Clipe Oficial) • DROPS", "Grato Sou (I Thank God) - Ao vivo • DROPS", "Fez Um Caminho (Ao Vivo) - IIR Music", "Meia Noite (Ao Vivo) | fhop music").
- `tempoRelativo(data: string, hoje: string): string`: "hoje", "ontem", "há N dias" até 13, "há N semanas" até 7, "há N meses" até 11, "há 1 ano", "há 1 ano e N meses", "há N anos".
- Datas. A implementação atual de `formatarDia` (numérica, "16/08") é renomeada para `formatarDiaNumerico` e passa a ser usada só por `src/dominio/texto.ts` (texto do WhatsApp). `formatarDia(data, hoje = hojeEmBrasilia())` passa a devolver "dom, 4 de out" e ganha a irmã `formatarDiaLongo` ("domingo, 4 de outubro"); ambas incluem o ano ("dom, 4 de out de 2025") quando não é o ano de `hoje`. `rotuloDoDia` (`src/escalas/mes.ts`) é removida e seus sete chamadores (`Equipe.tsx`, três em `Escala.tsx`, `Inicio.tsx`, `Sugestoes.tsx`, `src/perfil/perfil.ts`) passam a usar `formatarDia`. Em `src/dominio/notificacoes.ts`, o texto do push deixa de prefixar `nomeDoDia`, porque `formatarDia` já traz o dia da semana. Todos os outros chamadores de `formatarDia` (histórico, selos, cabeçalhos) ficam com o formato novo.

A limpeza de título é aplicada **na exibição** por `LinhaDeMusica`, `Cabecalho` da Música e notificações do front, só para músicas com `revisar = true`. O banco não muda nesta fatia.

## 7. Cache da API

`vite.config.ts`, `runtimeCaching`: entrada para `({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET'` com `NetworkFirst`, `networkTimeoutSeconds: 3`, `cacheName: 'api'`, `expiration` de 200 entradas e 7 dias. Escritas nunca são cacheadas.

Para a tela saber que o dado veio do cache: `src/api/cliente.ts` ganha `apiComMeta<T>(caminho, opcoes): Promise<{ dados: T; data: string | null }>`, que devolve o corpo e o cabeçalho `date` da `Response` (a função `api` atual continua igual, implementada por cima). `usarBusca` passa a usar `apiComMeta` e expõe `vistoEm: string | null`, preenchido quando a diferença entre `date` e o relógio do aparelho passa de 60 s. As telas raiz e a Escala mostram "visto às 17:40" em `.dica` logo abaixo do cabeçalho quando `vistoEm` existe. Se o plugin `cachedResponseWillBeUsed` do Workbox for fácil de usar no `generateSW` para marcar a resposta com um cabeçalho, pode substituir a comparação de relógio; não é obrigatório.

## 8. Aplicação nas telas

Cada tela troca para os componentes novos onde a troca é um para um. Nenhuma tela muda de estrutura, de ordem de blocos ou de fluxo. Lista do que muda em cada uma:

| Tela | Troca |
| --- | --- |
| Casca | Header removido (cada tela renderiza o seu `Cabecalho`), provedor de avisos, abas novas, grão |
| Início | Cabeçalho raiz "Oi, Gabriel"; cartão da Escala em `Cartao destaque`; `LinhaDeMusica` leitura; esqueleto; `Selos` sem "agendada"; botões |
| Mês | Cabeçalho raiz com o mês e setas como ação; linhas com `Selo`; botões; folha nova |
| Escala | Cabeçalho subtela; menu "Mais"; `LinhaDeMusica` leitura com alça e remover com desfazer; botões; folhas |
| Equipe | Cabeçalho subtela; chips novos; avisos de escalado; botões; folhas |
| Adicionar e Medley | Cabeçalho subtela; `Busca` no catálogo; chips roláveis; `LinhaDeMusica` escolha; `Segmento` em Inteira ou Trecho; `Campo`; rodapé de ação; teclado restilizado |
| Músicas | Cabeçalho raiz; `Busca`; chips roláveis; `LinhaDeMusica` navegação; esqueleto; `Vazio` |
| Música | Cabeçalho subtela com título limpo; `Capa grande` tocável; `Selo`; botões |
| Sugestões | Cabeçalho raiz; `LinhaDeMusica` leitura com ações à direita; apagar com desfazer; rodapé no envio |
| Perfil | Cabeçalho raiz; `Cartao`; `Segmento` do tema; linha "Administração" para Admin; botão Sair vira terciário em `--perigo` |
| Admin (8 telas) | Cabeçalho subtela; `LinhaDeMusica` em Revisar e Sequências; `Campo`; `Segmento`; botões; folhas; rodapé em EditarFormacao |
| Entrar, Esqueci, Instalar, Não encontrada | Selo no topo em vez da logo da igreja; botões; `Segmento` de plataforma; rodapé em Instalar |

Textos: onde uma tela for tocada, os caracteres "‹ › ⋯ ×" viram ícones e os `vazio` viram `Vazio`. Nenhum outro texto muda nesta fatia (o glossário de interface é trabalho das fatias seguintes).

## 9. Organização dos arquivos de estilo

`src/estilo/base.css` (981 linhas) é dividido em:

- `tokens.css`: só variáveis (seção 2).
- `base.css`: reset, tipografia, casca (cabeçalho, abas, conteúdo, rolagem), utilitários (`.cresce`, `.pagina`, `.secao`), e uma seção final marcada `/* telas */` com o que sobrou de regra específica de tela.
- `componentes.css`: um bloco por componente da seção 4 e 5, na ordem em que aparecem aqui.

`main.tsx` importa os três. Nenhuma regra é copiada em dois lugares.

## 10. Fora do escopo

- Telas novas ou reorganizadas: Início do Ministro, modo culto, seções do catálogo por tempo, menu "Ver", fusão das buscas, edição de Item, onboarding, painel do Admin com pendências.
- Dados novos na API: vezes tocada, "planejada para", última vez por pessoa, Sugestões aceitas, confirmação pós-culto, "mudou desde a última visita".
- Notificações novas.
- Gravar títulos limpos no banco (F5).
- Textos e glossário de interface.
- Sidebar completa de desktop além do mínimo da seção 4.

## 11. Portões e evidência

Comandos, como em `docs/handoff-v1.md`: `npm run check` e `npm test` antes de cada commit; `npm run build` e `npm run smoke` antes de dar a fatia por pronta. O smoke não muda de roteiro; se um seletor de tela quebrar por causa da troca de componente, o smoke é ajustado no mesmo commit.

Testes novos exigidos: `limparTitulo` (mínimo dez casos, incluindo os cinco títulos citados), `tempoRelativo` (limites de cada faixa), `formatarDia` e `formatarDiaLongo` (com e sem ano), `usarRemocaoPendente` (desfaz, executa após 5 s, executa na desmontagem), `LinhaDeMusica` (três modos renderizam a ação correta), `Selos` (agendada não renderiza).

Ambiente de teste de componentes: hoje o vitest roda tudo no `@cloudflare/vitest-pool-workers` e não há ambiente de DOM. A fase de primitivos adiciona `jsdom` (ou `happy-dom`) e `@testing-library/react` como devDependencies e divide o `vitest.config.ts` em dois projetos: `workers` (o atual, para `worker/`, `src/dominio/`, `src/escalas/`, `src/semente/`, `src/fumaca/` e demais `.test.ts`) e `dom` (para `*.test.tsx` em `src/componentes/` e `src/casca/`). `npm test` roda os dois.

Verificação visual, obrigatória antes de concluir: abrir cada uma das 22 telas no navegador em 375 px, nos dois temas, e conferir contra este spec: fonte, cores, cantos, ícones, cabeçalho que encolhe, folha que arrasta, aviso com desfazer, esqueleto, capas sem barras pretas. Registrar um print por tela por tema na pasta de evidências da orquestração.

## 12. Fases sugeridas para a orquestração

Ordem por dependência; cada fase fecha com `check` e `test` verdes e um commit.

1. **Marca e tokens**: fontes estáticas em `docs/brand/fontes/`, `scripts/marca.ts`, SVGs, `scripts/icones.ts`, PNGs, manifesto, `tokens.css`, fontes no `index.html`, grão, divisão dos arquivos de estilo. Evidência: build verde, SVGs e ícones gerados e commitados, tokens carregando nos dois temas.
2. **Domínio**: `limparTitulo`, `tempoRelativo`, `formatarDia`, `formatarDiaNumerico`, `apiComMeta`, testes; migração dos chamadores de `rotuloDoDia` e do texto do push. Evidência: testes novos passando, `npm test` inteiro verde.
3. **Primitivos**: ambiente de DOM no vitest, `Botao`, `Selo`, `Capa`, `Campo`, `Cartao`, `Vazio`, `Icone`, chips e `Segmento`, teclado com `original`. Evidência: testes de renderização; nenhuma tela ainda migrada além do que o CSS já muda.
4. **Casca**: `Cabecalho`, `Abas`, `Folha` sobre `vaul`, `Avisos`, `RodapeDeAcao`, `Esqueleto`, `Menu`; instalação das dependências. Evidência: testes do aviso com desfazer; folha abre e fecha por arrasto no navegador.
5. **Linha de música e Busca**: componentes e testes dos modos.
6. **Migração das telas**, em três commits: (a) Início, Mês, Escala, Equipe; (b) Adicionar, Medley, Músicas, Música, Sugestões, Perfil; (c) Admin e fora da casca. Evidência: smoke verde depois de cada commit; prints das telas.
7. **Cache da API e verificação final**: `runtimeCaching`, "visto às", passada visual completa, `docs/brand/README.md` atualizado, `Barra` e PNGs antigos removidos.
