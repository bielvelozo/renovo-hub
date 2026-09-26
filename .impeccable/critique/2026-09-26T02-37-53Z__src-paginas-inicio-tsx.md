---
target: src/inicio
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\gabri\\development\\renovo-hub\\src\\paginas\\Inicio.tsx"
target_fingerprint: "sha256:42a783d5d89ef6f4845b536f7beccaeb3fcd2d517f4e51fd26cbe63885736bdb"
target_path: "C:\\Users\\gabri\\development\\renovo-hub\\src\\paginas\\Inicio.tsx"
timestamp: 2026-09-26T02-37-53Z
slug: src-paginas-inicio-tsx
---
Method: dual-agent (A: subagente de revisão de design · B: subagente de detector e navegador)

# Crítica: Início (`src/paginas/Inicio.tsx`)

## Design Health Score

| # | Heurística | Nota | Achado-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | Esqueleto ao carregar, "visto às" com cache, "em 3 dias", selo "mudou". Falta um sinal claro de "sem internet" além do horário. |
| 2 | Correspondência com o mundo real | 3 | Vocabulário do ministério certo. "Precisa de atenção · 4 semanas" é a constante de código vazando; "músicas registradas" sugere que alguém registrou. |
| 3 | Controle e liberdade | 2 | Fechar o pós-culto é permanente por Escala, sem desfazer; a capa abre o YouTube em nova aba sem aviso; erro de carga sem "tentar de novo" na tela. |
| 4 | Consistência e padrões | 2 | "Modo culto" tem três aparências (atalho na Escala, primário pequeno no Início, item de menu). No domingo há dois botões primários. A data aparece em três formatos. |
| 5 | Prevenção de erros | 3 | "Criar as escalas de outubro" cria o mês num toque, coerente com o Princípio 2. O link "letra" dentro da linha tem cerca de 23 px de alvo. |
| 6 | Reconhecimento em vez de memória | 3 | Tudo à vista. "Repertório · segunda-feira" exige lembrar a data do cartão de cima; "4 semanas" exige saber a regra. |
| 7 | Flexibilidade e eficiência | 2 | A tarefa número um do Ministro (adicionar Item) só tem atalho quando o Repertório está vazio. A pendência sabe a Função que falta mas linka a Escala inteira. A 1280 px nada usa a largura. |
| 8 | Estética e minimalismo | 3 | Sistema aplicado com rigor. O h1 gasta o Display com "Oi, Nome"; a 360 px o h2 trunca e "Ouvir tudo" quebra em duas linhas. |
| 9 | Recuperação de erros | 2 | Mensagens em linguagem natural com "tente de novo", mas sem botão de repetir na tela e sem `role="alert"`; a casca tem o botão, a tela não. |
| 10 | Ajuda e documentação | 2 | O pós-culto explica bem. Nada explica "4 semanas", "Ouvir tudo" nem o vazio do Membro. |
| **Total** | | **25/40** | **Aceitável** |

## Veredito de especificidade

**Avaliação de design.** A tela é limpa, disciplinada e obedece ao sistema: um acento, selos cinza, Geist, números tabulares. Mas a composição é a de um app de escala qualquer. Saudação em Display, bloco de calendário, cartão rótulo-valor com botão primário, lista com miniaturas, lista de pendências com setas. Troque os substantivos e vira o app de turnos de um restaurante. O que carrega "O Instrumento Bem Feito" está no texto pequeno: o selo Tom D, o Medley recuado com minutagem, a observação do Ministro, "falta 1 bateria". O produto existe na tela, só não está no comando dela. Três chances perdidas: o Tom é a pergunta número um do Membro e é o menor texto da linha; o domingo não organiza nada, com a data em três formas e o h1 gasto num cumprimento; a memória do repertório não tem substituto de caráter no Início.

**Varredura determinística.** A CLI foi limpa nos TSX (`src/paginas/Inicio.tsx`, `src/inicio`, `src/casca`, `src/componentes`), também nos escopos layout e type e sem config. Esperado: o estilo vive em `src/estilo/*.css`. O detector vivo, injetado na página, achou 6 ocorrências: 4 textos funcionais a 10 px (os rótulos "seg" e "qua" do bloco `.dia`, em `src/estilo/base.css:796`), 1 `.casca` com `overflow: hidden` recortando um filho posicionado (`src/estilo/base.css:93`) e 1 aviso de família única, que é falso positivo por regra do próprio DESIGN.md. Nos CSS, 27 achados só consultivos, 22 deles "13px fora da rampa": o DESIGN.md registra 13 px como o tamanho de linhas densas, então é ruído a resolver adicionando o papel à rampa, não mudando o app.

**Overlays.** A injeção funcionou na aba "Renovo Hub [Human]", com o console reportando as 6 ocorrências acima. O servidor auxiliar foi parado.

Onde A e B concordam: alvos pequenos ("Ouvir tudo" e "Mês" com 36 px, capas com 32 px de altura), os 10 px do bloco de dia, a estrutura de headings com um único h1. Onde B cobre o que A não viu: contraste AA com folga nos cinco pares testados nos dois temas (mínimo 5,93:1 no claro, 7,06:1 no escuro), sem erros de console, sem rolagem horizontal a 375 px, Geist carregada nos quatro pesos. Onde A cobre o que B não mede: o anel de foco cortado dentro das listas em cartão, verificado por Tab no navegador.

## Impressão geral

Uma tela correta, sem ruído e sem erro técnico, que parece um bom app de agenda em vez do instrumento do ministério. O maior salto não é decoração: é pôr o Ministro e o domingo no comando da composição, dar ao Tom o tamanho da pergunta que ele responde, e fechar quatro defeitos de acabamento que hoje traem o "preciso" do humor.

## O que funciona

1. A lista de fatos do cartão ("Sua função" em forte, valores à direita com tabular-nums, `dt`/`dd` semânticos) responde a pergunta número um numa olhada.
2. O cartão pós-culto aparece só na janela certa, fala em fatos, oferece o ajuste como terciário e some com um toque. Encarna o ADR 0001.
3. A linha de música em leitura reúne Tom, trecho com minutagem, observação do Ministro e Medley recuado numa linha só. O cache-first faz a tela abrir com dado antigo e "visto às" em vez de erro.

## Problemas prioritários

1. [P1] Anel de foco invisível em toda lista em cartão. `.lista.cartao` corta com `overflow: hidden` (`src/estilo/base.css:721`) o `outline` de 2 px com `outline-offset: 2px` (`src/estilo/base.css:86`) dos links `.toque` de 100 % de largura. Confirmado por Tab a 360 px. Correção: `.lista.cartao .toque:focus-visible { outline-offset: -3px }` ou `overflow: clip; overflow-clip-margin: 4px`. Comando: /impeccable harden.

2. [P1] No dia do culto, dois primários e a ação certa embaixo e menor. `CartaoDoCulto` (`src/paginas/Inicio.tsx:112`) põe "Modo culto" como primário pequeno de 36 px abaixo de "Abrir escala" (primário largo). Viola a Regra do Acento Único. Correção: quando `escala.data === hoje`, usar o atalho de 64 px em Índigo-suave da tela de Escala, acima de "Sua próxima escala", e rebaixar "Abrir escala" a secundário nesse dia. Comando: /impeccable clarify.

3. [P1] O cabeçalho do Repertório não cabe a 360 px, e quatro alvos ficam abaixo de 44 px. O h2 trunca em "SEGUNDA-FE…" e "Ouvir tudo" quebra em duas linhas dentro de 36 px. Causa: `.secao > .secao-topo { flex-wrap: nowrap }` com ellipsis no h2 (`src/estilo/base.css:1033`) e `.botao` sem `white-space: nowrap`. Medido: "Ouvir tudo" 124×36, "Mês" 77×36, capas "Tocar no YouTube" 56×32. Correção: `.botao { white-space: nowrap; flex: none }`; h2 vira "Repertório"; capas e botões pequenos ganham área de toque de 44 px. Comando: /impeccable polish.

4. [P2] As pendências viram uma parede laranja sem triagem. `.estado.atencao` em 600 13 px na cor de Atenção, com todos os textos concatenados (`src/paginas/Inicio.tsx:314`). A pendência sabe a Função que falta, mas o link abre a Escala inteira. Correção: no máximo 2 pendências mais "+N"; texto em Cinza-meio 500 com só o ícone em Atenção; "sem ministro" primeiro; "· 4 semanas" vira "até 23 out"; link para a Equipe com a Função em foco. Comando: /impeccable distill.

5. [P2] O Tom é o menor texto da linha e o h1 é o maior sem dizer nada; os rótulos do dia têm 10 px. Selo de Tom a 13 px como quarto elemento; no escuro o véu a 7 % quase some. Display de 28 px em "Oi, Gabriel". "seg"/"qua" do `.dia` a 10 px. Correção: Tom na coluna direita da linha reaproveitando `.tempo` (700, 15 a 17 px, tabular), selo só para trecho; h1 com a data da próxima Escala e o cumprimento no título encolhido; `.dia` a 11 px. Comando: /impeccable typeset.

## Bandeiras vermelhas por persona

Casey: "Ouvir tudo" no canto superior direito, 36 px, duas linhas, fora do polegar. Capa joga para o YouTube em nova aba sem aviso. "X" do pós-culto colado ao título esconde o cartão para sempre, sem desfazer. Pendências a cerca de 900 px de rolagem.

Jordan: "Precisa de atenção · 4 semanas" sem explicação. "Ouvir tudo" abre folha com um único botão "Abrir no YouTube". Selo da marca é link para "/" que no Início não faz nada. Vazio do Membro diz só "Nenhuma escala marcada".

Sam: anel de foco cortado em todas as listas em cartão. Quatro links "Tocar no YouTube" iguais. "Abrir escala" e "Mês" genéricos. Pós-culto, "Culto de hoje" e sugestões sem heading. Erro em `p.aviso` sem `role="alert"`. "6 pessoas" sem nomes.

Marcos: adicionar Item sem entrada direta quando já há Item. "falta 1 bateria" abre a Escala inteira. Ordem dos blocos serve o Membro, contra o Princípio 1. Desktop com `dt`/`dd` a 900 px e botão de 940 px. Pós-culto só aparece se havia Itens.

## Observações menores

- Cartões ainda com borda de 1 px; o DESIGN.md já manda sombra suave. Dívida conhecida para o polish.
- `.cartao.pos-culto` com padding `12px 8px 8px 14px` fora dos 16 px do sistema.
- Selo Tom em duas posições na mesma lista.
- `VistoEm` com `margin-top: -8px`.
- Esqueleto sem osso para os h2.
- "músicas registradas" versus Execução.
- Pilha de iniciais para em 6 sem "+N".
- Rótulo livre pode contradizer a data.
- Linha de sugestões é cartão órfão sem seção.
- `.casca` com `overflow: hidden` apontado pelo detector: provável falso positivo, confirmar no audit.
- 13 px "fora da rampa" pedem um papel dense no DESIGN.md.

## Perguntas a considerar

1. Se o Ministro desempata, por que o Início ordena os blocos para o Membro?
2. O que "Oi, Gabriel" faz por alguém que abre o app quarenta vezes por mês? E se o h1 fosse "Domingo, 28"?
3. O que muda se o Tom ocupar a coluna da direita a 17 px, como o tempo no catálogo?
4. Por que a mesma ação "modo culto" tem três aparências?
5. A pendência sabe qual Função falta; por que manda o Ministro para a Escala inteira?
