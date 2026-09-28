---
target: src/paginas/Escala.tsx
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\gabri\\development\\renovo-hub\\src\\paginas\\Escala.tsx"
target_fingerprint: "sha256:bfdbc39e6de7211d3d6704eac5c32bc8ac41b7d763caf2cc7a94f648a0c4dcac"
target_path: "C:\\Users\\gabri\\development\\renovo-hub\\src\\paginas\\Escala.tsx"
timestamp: 2026-09-28T20-13-12Z
slug: src-paginas-escala-tsx
---
Method: dual-agent (A: subagente de revisão de design · B: subagente de detector e navegador, em duas passadas: a primeira perdeu a sessão e mediu só o detector; a segunda entrou pelo convite e mediu tudo)

# Crítica: Escala (`src/paginas/Escala.tsx`, com `Equipe.tsx` e `Adicionar.tsx`), segunda rodada

## Design Health Score

| # | Heurística | Nota | Achado-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | "Hoje, 18h" e "Amanhã" na faixa, selo realizada/cancelada, "Repertório · 4 músicas", aviso em toda mutação, "Adicionada: Rio em D" com rolagem até o Item. A folha fecha no Salvar antes da resposta; reordenar não confirma. |
| 2 | Correspondência com o mundo real | 4 | Escala, Equipe, Repertório, Tom, Trecho, Medley, "Quem puxa", "Isa dirige"; "Não vai ter culto dia seg, 5 de out?"; WhatsApp na forma que o grupo já usa. |
| 3 | Controle e liberdade | 3 | Remoção com Desfazer, Desfazer cancelamento, Esc e arrastar em toda folha, busca e aba preservadas ao voltar (medido: "rio" e 5 resultados). Erro no Salvar perde o rascunho; janela de desfazer fixa em 5 s. |
| 4 | Consistência e padrões | 3 | Tokens e 44 px cumpridos (alça 34×44, chips 36 com área de 44, foco nunca sob o rodapé). Desvios: rodapé e avisos ignoram o trilho de 220 px a ≥ 900 px; `<a>` "letra" dentro do botão da linha; "4 músicas" no cabeçalho e "5 músicas" na playlist. |
| 5 | Prevenção de erros | 3 | Cancelar pede confirmação plana; Salvar travado sem Tom ou minutagem; alerta de repetição no Adicionar. Duplicata dentro da própria Escala passa em silêncio (`memoria.ts` exclui a Escala atual). |
| 6 | Reconhecimento em vez de memória | 3 | Tom sugerido pré-marcado com o porquê, cobertura, "última ontem · 4 seguidos". A lista precisa de legenda para explicar toque e alça; "Rio" sai em quarto na busca "rio". |
| 7 | Flexibilidade e eficiência | 3 | Setas na alça, Formação num toque, link colado resolve sozinho, "Ouvir tudo", WhatsApp. Quem dirige não chega à Música pela Escala; sem "repetir o Repertório de domingo passado". |
| 8 | Estética e minimalismo | 3 | Uma cor de ação, selos cinza, sombras nas três alturas. A 360 px a linha de edição sobra 115 px para o título: quatro títulos em duas linhas, artista em três, selo de trecho quebrado; "TOM" seis vezes na tela. |
| 9 | Recuperação de erros | 3 | `ErroDeCarga` com "Tentar de novo" nas três telas; mutação falha avisa e recarrega a verdade; Equipe reverte o otimismo. A folha já fechou quando o erro chega. |
| 10 | Ajuda e documentação | 3 | "?" da Formação, sino que explica, dicas de Tom e minutagem, "Quem está na Equipe recebe um aviso da nova data.". |
| **Total** | | **31/40** | **Bom** |

## Veredito de especificidade

**Avaliação de design.** Autoral: a coluna "Tom na lista" com o rótulo em Label, o Medley com Trechos recuados e Tom por Trecho, a linha da Equipe que fala como o ministério ("Isa dirige · Ana, Gabriel, Pedro, Lucas e Davi"), a pendência sem cartão e só com o ícone em Atenção, o WhatsApp agrupado, "Dá pra desfazer depois." e "Já aconteceu. Mudanças aqui corrigem o histórico e não avisam ninguém.". O teclado de Tom com pontos Índigo e Âmbar é a única peça de brilho e está onde a decisão acontece. Onde ainda é categoria: a anatomia da linha (capa, título, subtítulo, alça, seta) e a legenda permanente sob a lista, que confessa que a linha não diz sozinha que é editável.

**Varredura determinística.** CLI limpa em Escala, Equipe, Adicionar, Medley, `src/escalas` e `src/componentes`; escopo layout limpo; escopo type com os dois consultivos de sempre em `componentes.css` (`.botao.icone` 20px e `.inicial.mini` 11px), nenhum tocado por esta rodada. Detector ao vivo na Escala: só `overused-font` (Geist em 100 % do texto, que é a Regra da Família Única).

**Medidas.** Sem rolagem horizontal a 360 e 1280; nenhuma parada de Tab sob o rodapé fixo (o `scroll-padding-bottom` funciona); contraste mínimo 5,18:1 (selo Atenção no claro) e o placeholder da busca agora a 6,53:1; sem erro de console; sem resposta ≥ 400; headings h1 → h2 → h2 nas três telas; todos os botões de ícone nomeados. Alvos abaixo de 44 px: "Ouvir tudo" e "Editar" (36, com área de 44), a alça (34 de largura) e o link "letra" dentro do botão da linha (61×23).

Onde A e B concordam: a folha do Item não recebe o foco (medido: `activeElement` fica no gatilho, um Tab vai para a alça atrás da folha; Esc fecha e devolve ao gatilho). Onde B mede o que A não viu: a área estendida dos botões pequenos responde acima mas o cartão seguinte cobre a extensão de baixo. Onde A vê o que B não mede: a linha de edição apertada a 360 px e a duplicata silenciosa dentro da própria Escala.

## Impressão geral

A Escala virou instrumento: o Ministro abre pelo Repertório, o Tom manda na linha, a Equipe cabe numa frase, a pendência é discreta e o fim do Adicionar avisa e rola até a música. O que sobra é acabamento de teclado (a folha precisa receber o foco) e a linha de edição no aparelho de referência, que hoje lê melhor no computador do que no S23.

## O que funciona

1. **Tom na lista**, agora na Escala e nos Trechos, o maior texto da linha, com `aria-label="Tom D"`.
2. **Memória na hora da decisão**: Tom certo já marcado com o motivo, cobertura, alerta de repetição, busca e aba preservadas ao voltar, "Adicionada: Rio em D" com rolagem até o Item novo.
3. **Voz e estados que falam como o ministério**, com o tema escuro coerente e sem hex solto.

## Problemas prioritários

1. [P1] A folha do Item não recebe nem prende o foco. O drawer tem `autoFocus=false` por padrão e cancela o foco automático; o `useEffect` da Folha rodou antes de o painel existir. Medido: o foco fica no gatilho, Tab vai para a alça atrás da folha, Esc devolve ao gatilho. Correção: focar o painel no `onOpenAutoFocus` do conteúdo do drawer, que roda quando o painel já está montado. Comando: /impeccable harden.

2. [P1] Coluna de leitura de 115 px a 360 px na linha de edição. Capa 86 + alça 34 + Tom 29 e folgas; quatro títulos em duas linhas, artista em três, selo "trecho 1:05–3:40" em duas, linha de 172 px. A 1280 a mesma linha tem 725 px de miolo. Correção: capa de 64 × 36 nas linhas com alça, artista numa linha com reticências, selo de trecho sem quebra. Comando: /impeccable layout.

3. [P2] Duplicata dentro da própria Escala passa em silêncio. "Rio" já é Trecho do Medley e o formulário só avisou de outras Escalas. Correção: um fato próprio no alerta ("Já está nesta Escala, no Medley") e um selo na linha do catálogo, sem bloquear. Comando: /impeccable harden.

4. [P2] Rodapé e avisos ignoram o trilho lateral a ≥ 900 px: as regras de 900 px de `base.css` perdem para `componentes.css` pela ordem de importação; medido a 1280, o rodapé cobre o pé do trilho. Comando: /impeccable adapt.

5. [P2] Salvar na folha fecha antes da resposta; erro chega com a folha já fechada e o rascunho perdido. Correção: manter a folha aberta com o botão em carregando até o PATCH resolver. Comando: /impeccable harden.

## Bandeiras vermelhas por persona

Alex: Tab passa por três paradas por linha (capa, linha, alça); a folha não prende o foco; "Rio" em quarto de cinco na busca "rio"; rodapé desalinhado a 1280.

Sam: folha abre sem foco (P1); link "letra" aninhado no botão da linha; Desfazer em `role="status"` por 5 s sem extensão. Do lado bom: alça com instrução, chips e segmento com `aria-pressed`, foco no h2 "Músicos" com anel visível ao chegar com a Função em foco, coluna do Tom com nome.

Casey: primário no polegar e Esc em toda folha; a folha do Medley pede 1319 px de rolagem; "Editar" e a linha da Equipe fazem quase a mesma coisa.

Marcos (terça à noite): o fluxo Escala → Adicionar → busca → formulário → Voltar → WhatsApp é redondo e o Tom já vem certo; duplicata na própria Escala sem aviso; títulos em duas linhas atrasam a varredura; três selos verdes na Equipe quando nada pede atenção.

Membro: "Hoje, 18h", Tom grande, "mudou" desde a última visita, Equipe por Grupo com "você". "TOM" sob cada nota é redundante para quem só quer a nota.

## Observações menores

- `<a>` "letra" dentro do botão da linha (aninhamento inválido, 61×23 px); quando o miolo é interativo, a letra deve ser um selo e o caminho é a folha ou a Música.
- "Repertório · 4 músicas" no cabeçalho e "Abrir no YouTube (5 músicas)" na playlist (conta vídeos).
- A linha da Equipe repete as pessoas três vezes (pilha, contagem, nomes) e mede 104 a 118 px; a pendência quebra ao lado da pilha.
- "Editar" e a linha inteira levam a URLs diferentes quando há pendência.
- Repertório vazio é uma frase cinza solta; o catálogo usa o estado vazio com ícone.
- Legenda permanente sob a lista; "TOM" seis vezes.
- Busca do catálogo por substring sem prioridade de título exato.
- `/api/sugestoes` pedido duas vezes por carga.
- Área estendida dos botões pequenos: a extensão de baixo é coberta pelo cartão seguinte; a de cima responde.
- Menu "…" com Esc: inconclusivo no painel; conferir no aparelho.
- "Pronto" na Equipe é o único primário e na prática é Voltar.

## Perguntas a considerar

1. Se o Tom é a resposta número um, por que a capa ainda ganha mais espaço que o título no S23? O que a capa responde para quem monta?
2. A legenda "Toque numa música para mudar o tom…" é uma confissão: o que na própria linha poderia dizer "sou editável"?
3. O Medley é um Item ou uma mini-Escala? Dois teclados numa folha e "remova e monte de novo" sugerem que editar Medley merece a tela de Montar.
4. Por decisão a Escala nunca se declara pronta; o WhatsApp copiado é o "pronto" implícito. Ele deveria ser o fecho visível da tela?
5. "TOM" seis vezes na mesma tela: o cabeçalho da seção pode carregar o rótulo uma vez?
