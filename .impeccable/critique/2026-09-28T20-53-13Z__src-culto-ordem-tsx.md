---
target: src/culto
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\gabri\\development\\renovo-hub\\src\\culto\\Ordem.tsx"
target_fingerprint: "sha256:d93f3a05da5deaa2bad4ba3c27e9d2e8a0e6cfa24cb6416e8b4bbfad2c7a537c"
target_path: "C:\\Users\\gabri\\development\\renovo-hub\\src\\culto\\Ordem.tsx"
timestamp: 2026-09-28T20-53-13Z
slug: src-culto-ordem-tsx
---
Method: dual-agent (A: subagente de revisão de design · B: subagente de detector e navegador)

# Crítica: Modo culto (`src/culto/`, alvo `src/culto/Ordem.tsx`)

## Design Health Score

| # | Heurística | Nota | Achado-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 2 | Sem internet, a Ordem abre com um aviso em Perigo ("Não consegui atualizar; mostrando o de seg, 17h") e esconde "Guardado no aparelho. Funciona sem internet."; "atualizado às" só aparece com pacote de 7+ dias; "A tela fica acesa" é afirmado mesmo quando o wake lock é negado. Bons: "1 de 4", Rolar com `aria-pressed`, esqueleto com `role=status`. |
| 2 | Correspondência com o mundo real | 3 | Vocabulário do ministério certo. Vazam "pacote de hoje", "‹ Início" nas pontas (colide com a aba Início) e os marcadores crus "//VERSO" e "*REFRÃO*" na letra. |
| 3 | Controle e liberdade | 3 | Sair 44×44 sempre no topo; deslize com `replace` (Voltar vai à Ordem); Limpar busca; a rolagem para ao tocar. Falta atualizar o pacote à mão; sessão expirada com internet joga para /esqueci mesmo com pacote guardado. |
| 4 | Consistência e padrões | 2 | O modo promete escuro e renderiza claro sob tema claro (P0). Tamanhos do Tom sem regra: 27 px na Ordem, 28,8 no cabeçalho, 16 nos tons do Medley, selos de 11 px, rótulo "TOM" de 10 px. |
| 5 | Prevenção de erros | 3 | Deslize exige 60 px e dominância horizontal; pontas desabilitadas; pacote guardado em `try/catch`. `autoFocus` no Pesquisar sobe o teclado sobre "Mais tocadas". |
| 6 | Reconhecimento em vez de memória | 3 | Ordem com número, título, artista, Tom e "· letra"; rodapé com o título da próxima. Não mostra o Tom da próxima; "− 2 +" é um número sem unidade. |
| 7 | Flexibilidade e eficiência | 2 | Deslize, botões, tamanho e velocidade persistidos. Nenhum atalho de teclado ou pedal (ArrowLeft/Right, PageDown: nada); da letra não dá para pular a outra música sem voltar à Ordem. |
| 8 | Estética e minimalismo | 3 | Escuro, Geist, hierarquia limpa. Duas frases de ajuda sempre visíveis na Ordem; barra de seis controles mesmo quando a letra cabe; 70 % da tela vazia em "Sem letra ainda". |
| 9 | Recuperação de erros | 2 | "Abra o app com internet uma vez antes do culto" é claro. "Essa escala não está no pacote de hoje" não explica nem diz o que fazer; "Sem letra ainda" é beco sem saída; o estado normal offline veste Perigo. |
| 10 | Ajuda e documentação | 2 | A ajuda explica o óbvio ("Toque numa música para abrir a letra") e não o não-óbvio: o deslize não é anunciado, nem o que "2" significa. |
| **Total** | | **25/40** | **Aceitável** |

## Veredito de especificidade

**Avaliação de design.** Autorado no vocabulário e nos dados: "Ordem de hoje", "Medley: Rio + Dono da Minha Afeição", "último: G · Isa, 27/09", o bloco TOM em Índigo-suave, a observação do Ministro em Atenção-suave, "Guardado no aparelho. Funciona sem internet.", o rodapé que carrega o título da música vizinha. Genérico na composição: a Ordem é uma lista de cartões com coluna à direita e a Letra é um leitor com barra "A− A+ ▷ − 2 +", como qualquer teleprompter. O Tom, que devia ser o herói do palco, tem 27 px na Ordem enquanto o título da tela tem 28; e a promessa central, "sempre escuro", não se cumpre para quem usa tema claro.

**Varredura determinística.** CLI limpa em `src/culto` e na folha da letra; escopo layout limpo; escopo type com seis consultivos em `culto.css`: três documentados (número 22px, Tom em clamp), três não (tons do Medley em clamp, selos a 11px, h1 da letra em clamp). O `font:` abreviado do rótulo "TOM" a 10px escapou ao CLI e foi pego pelo detector ao vivo como texto funcional abaixo de 11 px.

**Overlays.** Injeção funcionou na Ordem, na letra e no Pesquisar: `overused-font` (Geist, decisão registrada) e `undersized-ui-text` no rótulo "Tom" de 10 px. Nenhuma autodetecção.

**Medidas.** Com `prefers-color-scheme: light` o `.culto` computa `color-scheme: dark` mas fundo `rgb(244,244,242)` e texto `rgb(25,25,27)`: os tokens `light-dark()` são resolvidos na raiz, não na subárvore (sonda: `light-dark()` direto no elemento resolve escuro; `var(--fundo)` resolve claro). Sem rolagem horizontal; alvos abaixo de 44 px: "‹ Ordem" 51×20, "‹ Pesquisa" 66×20, "Limpar busca" 36×36; contraste mínimo 5,85:1 (selo "sem tom"); sem erro de console; sem resposta ≥ 400; landmarks: só `section.culto`; letra lida como parágrafos, marcadores com texto cru; wake lock negado pelo painel (não testável aqui); setas do teclado não trocam de Item.

Onde A e B concordam: o modo não é escuro no tema claro; o rótulo do Tom a 10 px; a volta de 20 px; "Sem letra ainda" em 101 de 102 músicas do catálogo de teste.

## Impressão geral

A base certa (pacote que nunca bloqueia, deslize pensado para a mão ocupada, cabeçalho da letra honesto sobre o Tom) vestida com a tipografia errada para o palco e com uma promessa quebrada: quem escolheu tema claro sobe no palco com a tela branca. Corrigir o escuro é uma linha; fazer o Tom ser lido a um metro é o salto.

## O que funciona

1. **O pacote nunca bloqueia e nunca perde o que tem**: a Ordem nasce do guardado, o novo só substitui quando chega inteiro, tudo em `try/catch`; o wake lock é pedido de novo a cada retorno.
2. **A troca de música pensada para a mão ocupada**: deslize com limiar e dominância horizontal, `replace: true`, rodapé de 52 px na zona do polegar com o título da vizinha.
3. **O cabeçalho da letra é honesto sobre o Tom**: bloco de 64 px em Índigo-suave (11,8:1), "último: G · Isa, 27/09", observação do Ministro em Atenção-suave, Medley com um bloco por Trecho.

## Problemas prioritários

1. [P0] O modo culto não é "sempre escuro": com tema claro ou sistema claro renderiza claro. Os tokens vivem só em `:root` e chegam à subárvore já resolvidos pelo esquema da raiz (`tokens.css`); `.culto { color-scheme: dark }` não alcança. Correção: declarar os tokens em `:root, .culto` e registrar a mecânica na Regra do Par. Comando: /impeccable harden.

2. [P1] Sem internet, a Ordem abre com um aviso de Perigo em vez da garantia. `baixar()` falha offline, o erro esconde "Guardado no aparelho" e mostra "Não consegui atualizar" em vermelho. Correção: estado neutro "Guardado no aparelho · atualizado seg, 17h" com o ícone verde, Perigo só sem pacote ou com pacote de 7+ dias, "atualizado às" sempre visível e tocável para atualizar. Comando: /impeccable clarify.

3. [P1] O Tom não é lido a um metro; o maior texto do palco é o título da tela. Tom 27/30 px na Ordem contra h1 de 28; tons do Medley 16 px; rótulo "TOM" 10 px; selos 11 px; próxima música no rodapé a 14 px cortada e sem o Tom. Correção: nota ≥ 36 px na Ordem com o h1 rebaixado; Tom ≥ 48 px no cabeçalho da letra e maior quando não há letra; tons do Medley ≥ 22 px; rodapé em 16 px com o Tom da vizinha; selos 13 px. Comando: /impeccable typeset.

4. [P1] A volta para a Ordem é um link de 51×20 px, o menor alvo do modo; a ponta desabilitada diz "‹ Início", que no app é a aba. Correção: altura de toque e variante terciária; "Primeira"/"Última" ou esconder a ponta morta. Comando: /impeccable adapt.

5. [P2] A barra de leitura e o marcador não foram feitos para o pedestal: seis controles em 44 px com dois pares ± e um "2" sem unidade; marcador fixo em 12 px enquanto a letra escala até 26; "//" e "*" impressos; "Rolar" aparece mesmo quando a letra cabe. Correção: A−/A+ e Rolar visíveis, velocidade só enquanto rola, marcador em `em` da letra sem os símbolos, passos de 30 e 34 px, Rolar escondido quando não há o que rolar. Comando: /impeccable distill e /impeccable typeset.

## Bandeiras vermelhas por persona

Casey: "‹ Ordem" 51×20 e Sair no canto de cima, fora do polegar; `autoFocus` no Pesquisar sobe o teclado antes de decidir. A favor: tamanho da letra e velocidade persistem; rodapé de 52 px no polegar.

Sam: o P0 atinge quem escolheu "claro" por legibilidade; "TOM" 10 px, selos 11 px, marcador 12 px; pontas a 50 % de opacidade. A favor: nomes nos controles da barra, `aria-pressed` em Rolar, foco visível, deslize com equivalente em botão.

Riley: `/culto/d-ontem` (Realizada) responde "não está no pacote de hoje"; uma vigília que passa da meia-noite perde a Ordem no próximo download; 401 com internet joga fora um pacote válido; "Rolar" numa letra que cabe liga e desliga no primeiro quadro; busca "rio" devolve Incensário e Isaías 6 antes de Rio.

O Vocal no pedestal: letra a 17 px com teto de 26, marcador a 12; qualquer toque para a rolagem e ela zera a cada música; "Sem letra ainda" sem saída.

O Guitarrista entre uma música e outra: o rodapé diz o título da próxima em 14 px cortado, sem o Tom; tons do Medley a 16 px; "tom original" é um selo de 11 px que não revela a nota mesmo quando o catálogo a conhece.

O Ministro que muda a ordem na hora: a mudança não chega à banda; `baixar()` só ao montar, sem atualizar à mão, sem "atualizado há N min".

## Observações menores

- Cartões da Ordem sem sombra a 1,08:1 do fundo: bem no OLED, quase invisível em LCD.
- "Toque numa música para abrir a letra. A tela fica acesa…" sempre visível; a segunda frase o código não garante.
- "pacote de hoje" é termo interno.
- "1 de 4" e "Culto de Domingo · 18h" em 14 px cinza: a orientação mais útil do palco no menor tamanho.
- `--tamanho-da-letra` é gravado no `documentElement` e vaza para as letras da Casca (intencional pela spec).
- Esqueleto de três cartões sem texto enquanto baixa o primeiro pacote.
- Pesquisar mostra "sem tom" em 94 de 102 músicas do catálogo de teste: uma parede de selos cinza de 11 px.
- Sem Itens: "O Ministro ainda não escolheu as músicas" + "Pesquisar música" é um bom fallback.
- Nenhum landmark além de `section.culto`; a Pesquisa não tem h1.

## Perguntas a considerar

1. Se o Tom é a pergunta número um do Membro, por que "Ordem de seg, 5 de out" é o maior texto do palco?
2. E se a tela sem letra virasse a tela do Tom: a nota em 96 px ocupando o vazio, com "último: G · Isa" embaixo?
3. Por que o palco vê "Não consegui atualizar" em vermelho mas nunca vê "atualizado há 12 min"?
4. Músico no palco usa pedal Bluetooth (PageDown, ArrowRight). O que "a mão está ocupada" vira se o princípio for levado ao pé da letra?
5. "Mostrar como está no Word" inclui os `//` e `*`, ou só significa "não interpretar"?
6. A Ordem deve continuar legível depois da meia-noite, numa vigília ou na segunda de manhã? A janela do pacote começa em hoje.
