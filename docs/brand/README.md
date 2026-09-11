# Marca do Renovo Music

Desde 11/09/2026 o app carrega a marca do ministério de louvor, não a da igreja. As decisões (selo circular com onda sonora de cinco barras, paleta "Amanhecer", Fraunces nos títulos e Inter no corpo) estão no spec [Fundação da identidade visual](../superpowers/specs/2026-09-11-fundacao-da-identidade-design.md), seção 1.

## Arquivos

Em `public/`:

| Arquivo | O que é | Como nasce |
| --- | --- | --- |
| `selo.svg` | Anéis e barras, sem texto. `currentColor` nos anéis, `var(--acento)` nas barras. É o que o componente `Marca` desenha inline. | `npm exec tsx scripts/marca.ts` |
| `selo-completo.svg` | Selo com "RENOVO" e "MUSIC" nos arcos, já como caminhos, sem depender de fonte | idem |
| `marca-horizontal.svg` | Selo completo à esquerda, "Renovo" e "MUSIC" à direita, altura de referência 64 | idem |
| `icone-192.png`, `icone-512.png`, `favicon-32.png`, `apple-touch-icon.png`, `icone-mascaravel-512.png`, `abertura.png` | PNGs do PWA, selo sobre `#1F1B22`, anéis `#F3E9E1`, barras `#9FB8E6` | `npm exec tsx scripts/icones.ts` |

A geometria fica em `src/marca/selo.ts`, que o componente e os dois scripts compartilham. Os SVGs e PNGs são commitados: o build não roda os scripts.

## Fontes

Em [fontes/](fontes/), instâncias estáticas sob a licença OFL, usadas só para gerar os caminhos dos SVGs:

- `Fraunces144ptSoft-Bold.ttf`, do [repositório oficial da Fraunces](https://github.com/googlefonts/fraunces) (`fonts/static/ttf/`), com a licença em `OFL-Fraunces.txt`.
- `Inter-Bold.ttf`, do [Inter 4.1](https://github.com/rsms/inter/releases/tag/v4.1) (`extras/ttf/`), com a licença em `OFL-Inter.txt`.

Na interface, "Renovo" do componente `Marca` usa Fraunces 800 com o eixo `WONK` 1; o SVG gerado usa a instância estática Bold (700) sem `WONK`, porque instância estática não carrega eixo. Diferença aceita no spec.

## Geometria que difere do texto do spec

O spec diz que os pontos laterais ficam em x 14 e x 106; com os anéis em raio 55 e 47, isso cairia em cima do anel interno. Os pontos ficam em raio 38 (x 22 e x 98), na mesma faixa dos textos dos arcos, que ficam entre o anel interno e as barras (raio 36 de linha de base).

---

# Marca da igreja: o que existia

Material da Igreja Missão Renovo, mantido como referência histórica. O app deixou de usá-lo em 11/09/2026.

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

Cinco PNGs de 1250 x 1250, RGB sem transparência, em [logo/](logo/):

| Arquivo | O que é | Uso |
| --- | --- | --- |
| `símbolo-árvore-anel-sobre-branco.png` | Só a árvore, metade folhas verdes e metade galhos pretos, com raízes, dentro de um anel escuro sobre branco | Ícone do app e do PWA; favicon |
| `logo-círculo-preto.png` | Círculo preto, "IGREJA MISSÃO" e "RENOVO" em branco, a árvore como o primeiro O | A marca principal; avatar, splash |
| `logo-anel-sobre-branco.png` | A mesma marca em preto sobre branco, dentro do anel escuro | Tema claro |
| `logo-horizontal-sobre-preto.png` | Marca horizontal, branca sobre quadrado preto | Cabeçalho no tema escuro |
| `logo-horizontal-sobre-branco.png` | Marca horizontal, preta sobre quadrado branco | Cabeçalho no tema claro |

Cores medidas na árvore: verde `#689C38` (folhas), anel `#242824`, preto puro no círculo, nos galhos e nas raízes. O verde é a única cor da marca e vira token secundario do app; o laranja da conferência continua como acento.

Resposta à dúvida das duas marcas: é uma só. "IGREJA MISSÃO RENOVO" com a árvore no O é a marca; a árvore sozinha é o símbolo, o mesmo do rodapé da landing. Não há SVG: pra ícone mascarável do PWA, recortar o símbolo e compor sobre a cor de fundo do tema.

## Pendências

- O nome da fonte display serifada das artes da conferência, que só quem fez a arte sabe.
