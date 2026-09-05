# Marca: o que existe hoje

Inventário levantado em 04/09/2026 para o ticket [Coletar assets da marca](../../.scratch/wayfinder-v1/issues/04-assets-de-marca.md). Não é um guia de marca oficial: a Missão Renovo não tem um. É o material real disponível, com as cores medidas dos pixels.

## O achado principal

A conferência **Alto & Sublime Lugar** (29 e 30 de agosto de 2026) não foi um evento com arte própria: foi o início de uma identidade visual nova da igreja, confirmado pelo Gabriel. Então o material da conferência é a referência de marca mais atual que existe, e não uma peça descartável.

O conceito é a **árvore**: a bio do Instagram cita Isaías 11:1-2, o broto que nasce do tronco cortado. É de onde vem o nome Renovo, a árvore no logo e a textura de gravura de árvores em todas as peças. O Renovo Hub deve herdar isso.

## Arquivos

Em [referencias/conferencia-2026/](referencias/conferencia-2026/), baixados de `missaorenovoconf26.carrd.co` (link da bio do Instagram):

| Arquivo | O que é |
| --- | --- |
| `gallery04-d4b173f4_original.jpg` | Arte principal da conferência, 1349×1687. A peça mais representativa. |
| `gallery04-44fc3529_original.jpg` | Sessão 1, com fotos e nomes dos convidados. Mostra o tratamento de foto e a moldura. |
| `gallery04-df0f2098_original.jpg` | Sessão 2, mesmo padrão. |
| `gallery04-633b8573_original.jpg` | Endereço e local. |
| `bg.jpg`, `container02.jpg` | A textura de gravura sozinha, sem texto. Reaproveitável como fundo. |
| `card.jpg` | Print da landing page. Mostra botões, links e hierarquia na web. |
| `image01.png` | Marca do rodapé: "IGREJA MISSÃO" com árvore de folhas verdes. |

## Cores medidas

Amostradas dos pixels das peças, não copiadas do CSS.

| Papel | Hex | Onde aparece |
| --- | --- | --- |
| Fundo escuro neutro | `#282828` | Domina todas as artes, 40 a 67% dos pixels |
| Fundo escuro quente | `#282020` | Landing page, marrom-quase-preto |
| Quase-preto | `#080808` | Bordas e vinhetas da landing |
| Creme (texto e display) | `#E0D8D0` | Títulos grandes das artes |
| Creme claro | `#E8E0D8` | Realce dentro do display |
| Laranja web | `#FF5C30` | Declarado no CSS, usado em links e pontos |
| Laranja botão | `#D04810` | Medido no botão "Confirme sua presença" |
| Laranja queimado | `~#78 2800 a #A34418` | Molduras, setas e rótulos das artes impressas |
| Verde da árvore | `#80B058` | Só na marca antiga do rodapé |

## Restrição de contraste descoberta

Nenhum laranja único atende os dois temas. Medido em WCAG:

| Combinação | Contraste | Veredito |
| --- | --- | --- |
| `#FF5C30` sobre fundo escuro | 4.79:1 | Passa AA |
| `#FF5C30` sobre fundo creme | 2.71:1 | Reprova |
| `#A34418` sobre fundo creme | 5.45:1 | Passa AA |
| `#A34418` sobre fundo escuro | 2.39:1 | Reprova |
| `#E0D8D0` sobre `#282020` | 11.31:1 | Passa AAA |

O tema claro e o tema escuro precisam de **laranjas diferentes** para o mesmo papel semântico. Isso vira token, não escolha caso a caso.

## Tipografia

- **Kodchasan** (300 e 600, com itálico) e **Inter** (700): carregadas do Google Fonts na landing. Kodchasan no corpo, Inter em botões e rótulos maiúsculos. São gratuitas e podem ir direto pro app.
- **Display serifada estilo anos 70**, alto contraste e terminais em bola, usada em "ALTO E SUBLIME LUGAR" e "SESSÃO 1". Não está no Google Fonts do site, veio da arte. **Não identificada.** Quem fez a arte precisa dizer qual é.
- **Manuscrita** nos nomes dos convidados. Decorativa, provavelmente dispensável no app.

## Logo (recebida em 05/09/2026)

Cinco PNGs de 1250 x 1250, RGB sem transparencia, em [logo/](logo/):

| Arquivo | O que e | Uso |
| --- | --- | --- |
| `simbolo-arvore-anel-sobre-branco.png` | So a arvore, metade folhas verdes e metade galhos pretos, com raizes, dentro de um anel escuro sobre branco | Icone do app e do PWA; favicon |
| `logo-circulo-preto.png` | Circulo preto, "IGREJA MISSAO" e "RENOVO" em branco, a arvore como o primeiro O | A marca principal; avatar, splash |
| `logo-anel-sobre-branco.png` | A mesma marca em preto sobre branco, dentro do anel escuro | Tema claro |
| `logo-horizontal-sobre-preto.png` | Marca horizontal, branca sobre quadrado preto | Cabecalho no tema escuro |
| `logo-horizontal-sobre-branco.png` | Marca horizontal, preta sobre quadrado branco | Cabecalho no tema claro |

Cores medidas na arvore: verde `#689C38` (folhas), anel `#242824`, preto puro no circulo, nos galhos e nas raizes. O verde e a unica cor da marca e vira token secundario do app; o laranja da conferencia continua como acento.

Resposta a duvida das duas marcas: e uma so. "IGREJA MISSAO RENOVO" com a arvore no O e a marca; a arvore sozinha e o simbolo, o mesmo do rodape da landing. Nao ha SVG: pra icone mascaravel do PWA, recortar o simbolo e compor sobre a cor de fundo do tema.

## Pendencias

- O nome da fonte display serifada das artes da conferencia, que so quem fez a arte sabe.
