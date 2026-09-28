---
target: src/paginas/Escala.tsx
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\gabri\\development\\renovo-hub\\src\\paginas\\Escala.tsx"
target_fingerprint: "sha256:4876e6e1ff61e59a3074a9c94452a998496de04f2031a96a2d4f162a66a8d963"
target_path: "C:\\Users\\gabri\\development\\renovo-hub\\src\\paginas\\Escala.tsx"
timestamp: 2026-09-26T04-31-26Z
slug: src-paginas-escala-tsx
closed: true
---
Method: dual-agent (A: subagente de revisão de design · B: subagente de detector e navegador)

# Crítica: Escala (`src/paginas/Escala.tsx`, com `Equipe.tsx` e `Adicionar.tsx`)

## Design Health Score

| # | Heurística | Nota | Achado-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | Esqueleto, "visto às", aviso após cada gravação ("Guitarra: Gabriel entrou", "Item salvo"), otimismo com rollback na Equipe. O fim de Adicionar é mudo (`Adicionar.tsx:196` navega sem avisar) e a música nova entra abaixo da dobra; Realizada só se vê na dica de 14 px para quem dirige, sem selo no cabeçalho. |
| 2 | Correspondência com o mundo real | 3 | "Não vai ter culto dia seg, 28 de set?", "puxa: Isa", "Escalar a Banda", teclado de piano. Contra: "músicos 3 de 3 · falta bateria" (`pendencias.ts:79-86` conta pessoas, não Funções); "Sem tom de partida: escolha." na folha de um Item que já tem Tom D (`BlocoDeTom.tsx:31`). |
| 3 | Controle e liberdade | 3 | Remover com Desfazer de 5 s, Desfazer cancelamento, Esc e arrastar fecham toda folha, setas na alça. Sem desfazer para "Escalar a Banda" e para a data editada; voltar do formulário de Adicionar zera busca e aba; a folha do Item não recebe o foco ao abrir e Esc devolve o foco ao `body`. |
| 4 | Consistência e padrões | 3 | Tokens e componentes únicos; mesmo atalho do culto do Início. Divergências: Tom em selo aqui e coluna no Início; pendências com destino no Início e linhas mortas aqui (`Escala.tsx:113-123`); chips de 32 px contra 36 do sistema; `.nome-do-grupo` a 11 px; contagem do segmento a 11 px. |
| 5 | Prevenção de erros | 3 | Cancelar em folha com "Dá pra desfazer depois."; Salvar desabilitado até haver Tom e minutagem válidos; alerta "Já está no Repertório de X". Brechas: Escala cancelada ainda oferece "Editar" Equipe (`Escala.tsx:268-272` testa `dirige`, não `podeEditar`); "Editar data e horário" aceita data passada e não diz que a Equipe recebe aviso. |
| 6 | Reconhecimento em vez de memória | 3 | "Último Tom: E, tocado em qui, 24 de set com Isa. Já selecionado.", pontos no teclado, cobertura, "?" da Formação. Chegar com `?funcao=bateria` só rola até Músicos: o chip que falta não é destacado; o Medley não avisa que os Trechos não são tocáveis. |
| 7 | Flexibilidade e eficiência | 3 | Formação num toque, link colado resolve sozinho, Função em foco, "Copiar nomes", teclado para reordenar. Adicionar N músicas são N idas ao catálogo com estado zerado; a situação não é atalho. |
| 8 | Estética e minimalismo | 2 | Um primário por tela e cinzas limpos, mas a periferia pesa: a 360 px a Escala gasta 173 px antes da Equipe em atalho e dois vistos verdes que não pedem nada; o formulário de Adicionar abre com capa de 185 px, diz o mesmo Tom três vezes e tem dois Cifra Club; a folha do Item repete o título e fecha com cinco botões largos empilhados. |
| 9 | Recuperação de erros | 2 | Rollback otimista com aviso na Equipe; Cifra Club sem achado orienta. Erro de carga da Escala, da Equipe e de Adicionar é só `p.aviso` sem "Tentar de novo" enquanto `ErroDeCarga` existe; fora da API tudo vira "Algo deu errado por aqui.". |
| 10 | Ajuda e documentação | 3 | Ajuda no ponto de decisão: "?" da Formação com `aria-expanded`, formato da minutagem, explicação de cada aba, legenda de toque e arrasto. Sem sistema, mas o microtexto cobre. |
| **Total** | | **28/40** | **Bom** (no limite inferior da faixa) |

## Veredito de especificidade

**Avaliação de design.** Feita para este produto no conteúdo e nas interações; genérica na composição, e hoje menos assinada que o Início. É do Renovo Hub: o teclado de 14 colunas com ponto Índigo no Tom sugerido e Âmbar no original, a Equipe em Vocal/Músicos/Som com o chip de Ministro tracejado, "Escalar a Banda" num toque, "puxa: Isa" só com dois Ministros, o alerta de repetição confinado ao momento de adicionar, e "Já aconteceu. Mudanças aqui corrigem o histórico e não avisam ninguém." O esqueleto não: cabeçalho de subtela, cartões de lista, rodapé com CTA, folha com formulário, e uma Equipe que é a grade "pessoas × chips" de qualquer app de escala. A Escala não usa a assinatura que o Início ganhou: o Tom segue selo de 13 px (`Escala.tsx:371-390` não passa `posicaoDoTom`). A composição não sabe que dia é: a mesma tela na terça de quem monta e no domingo de quem lê.

**Varredura determinística.** CLI limpa em Escala, Equipe, Adicionar, Medley, `src/escalas` e `src/componentes` (0 achados) e no escopo layout. Escopo type: os mesmos 3 consultivos de sempre em `componentes.css` (`.botao.icone` 20px, contagem do segmento 11px, `.inicial.mini` 11px); nenhum coberto pelo DESIGN.md. O `.nome-do-grupo` a 11 px (`font:` abreviado) escapa ao detector.

**Overlays.** Injeção funcionou nas três páginas ("Renovo Hub [Human]"). Escala: `clipped-overflow-container` em `.casca` (os filhos posicionados são os `.play` das capas e o rodapé fixo; mesmo provável falso positivo das rodadas anteriores) e `overused-font`. Equipe: só `overused-font`. Adicionar: `low-contrast` no placeholder da busca no escuro, 3,8:1 (`#757575` do navegador sobre `#18181a`), o único par abaixo de AA em todas as rotas. `dark-glow #ffba00` de novo só depois do overlay do próprio detector: autodetecção. Servidor auxiliar parado.

Onde A e B concordam: alvos pequenos (16 chips de 32 px, "Editar", "Ouvir tudo", "Pronto" e "Escalar a Banda" com 36 px, alça com 34 px de largura, o botão do Medley com 19,5 px de altura), sem rolagem horizontal, sem erro de console, sem resposta ≥ 400, foco visível nas 25 paradas de cada rota. Onde B mede o que A não viu: quatro paradas de Tab na Escala caem sob o rodapé fixo ("Ouvir tudo", a linha 3, "4. Medley" e a alça do Medley), porque `.conteudo` tem `padding-bottom` mas não `scroll-padding-bottom`; a folha do Item não move o foco para dentro ao abrir e Esc solta o foco no `body`; o menu "…" fechou no `pointerup` de um clique sintetizado (a verificar no aparelho: as animações não avançaram com o painel oculto). Onde A vê o que B não mede: a ordem da tela contra o Princípio 1 e a folha do Item com cinco botões largos.

## Impressão geral

A Escala tem as melhores frases e as melhores decisões de domínio do app (memória do repertório no ponto de decisão, Equipe que responde sem pedir permissão, destrutivo sem cerimônia), e a pior composição: quem monta rola uma tela inteira para chegar no que já montou, passando por um atalho de domingo e vistos verdes. O maior salto é dar dois rostos à tela, o da terça e o do domingo, e trazer para cá a coluna do Tom que o Início já tem.

## O que funciona

1. **Memória do repertório no ponto de decisão.** "Tocada há 2 dias, com Isa.", cobertura da Equipe, Tom sugerido já selecionado e marcado no teclado, histórico em uma linha (`Adicionar.tsx:200-226`, `BlocoDeTom.tsx`).
2. **Equipe que responde e não pede permissão.** Chip com `aria-pressed`, gravação otimista com rollback e aviso por nome, Formação num toque, "?" contextual, memória por pessoa ("última há 13 dias", "4 seguidos").
3. **Destrutivo sem cerimônia e sem susto.** Remover com Desfazer, cancelar com uma pergunta em português e caminho de volta, Realizada com a regra explicada numa frase. A alça tem nome com instrução.

## Problemas prioritários

1. [P1] A Escala é composta para quem lê, não para quem monta. Ordem fixa atalho do culto → situação → Equipe → Repertório (`Escala.tsx:111-158`); a 360×800 o Repertório começa em y=742 de 1541; Escala completa mostra 96 px de vistos verdes; Realizada mantém o atalho de um culto passado e o WhatsApp. Correção: para quem dirige, Repertório antes da Equipe, com a Equipe resumida numa linha ("6 pessoas · Isa dirige" com Editar); situação só quando há pendência, e cada linha levando ao destino (`/equipe?funcao=`, `/adicionar`); atalho do culto só no dia, como no Início; em Realizada, sem atalho e sem WhatsApp. Comando: /impeccable layout.

2. [P1] O Medley tem um alvo de 20 px e promete o que não faz. `LinhaDeMusica.tsx:136-161` põe só o miolo dentro do botão; observação e Trechos ficam fora. Medido: botão "4. Medley" 156×19,5 px; Trechos de 44 px não tocáveis; legenda "Toque numa música para mudar o tom…". Correção: em leitura tocável, o botão envolve a linha inteira (título, observação, Trechos) com a alça fora; ou cada Trecho abre a folha já no seu bloco. Comando: /impeccable harden.

3. [P2] Acabamento de acessibilidade e toque. Quatro paradas de Tab sob o rodapé fixo (falta `scroll-padding-bottom` no `.conteudo`); a folha do Item não recebe foco ao abrir e Esc devolve ao `body`; 16 chips de 32 px na Equipe; placeholder da busca a 3,8:1 no escuro; erro de carga sem "Tentar de novo" em três telas. Comando: /impeccable harden.

4. [P2] O Tom não segue a regra da casa na Escala. Selo de 13 px no meio da fila de selos para o Membro (modo navegação), não a coluna de 17 px do Início e do DESIGN.md; na folha, "Sem tom de partida: escolha." aparece com D já pressionado. Correção: `posicaoDoTom="direita"` em navegação e nos Trechos; selo só nas linhas com alça; na folha, "Tom desta escala: D" e sugestão só quando diferir. Comando: /impeccable typeset (coluna) e /impeccable clarify (dica).

5. [P2] O formulário de Adicionar diz demais e termina em silêncio. Capa de 185 px empurra o Tom para y=394; o mesmo fato "E, 24 de set, Isa" em três lugares; "Descobrir o tom no Cifra Club" escondido sob o rodapé fixo na primeira dobra e "Conferir no Cifra Club" mais abaixo; voltar zera aba e busca; confirmar navega sem aviso. Correção: capa pequena ao lado do título; um Cifra Club só, dentro do bloco do Tom; guardar termo e aba ao voltar; ao confirmar, aviso "Adicionada: Dono da Minha Afeição em E" e rolar até a linha nova. Comando: /impeccable distill.

## Bandeiras vermelhas por persona

Alex: cada música é catálogo → formulário → topo da Escala, com aba e busca zeradas; não há "repetir o Repertório de 21 de set"; "Ouvir tudo" são dois toques para um link; a situação não é atalho.

Sam: cada linha de situação lê "Falta 1 bateriana equipe" (texto e dica sem separador); os chips não estão associados à pessoa ("Vocal, botão alternável, pressionado", de quem?); a folha abre sem receber o foco; Trechos do Medley sem controle algum.

Casey: chips de 32 px com 6 px de vão; "Editar" e "Ouvir tudo" de 36 px no canto superior direito; alvo de 20 px do Medley; rascunho do formulário só em memória; capas `maxresdefault` e a capa grande 16:9 no 3G.

Marcos (Ministro, terça à noite): abre a Escala e vê o atalho do domingo, dois vistos verdes e a Equipe que já fechou no mês; o Repertório depois de uma tela. Adiciona quatro músicas caindo mudo no topo a cada uma, com o catálogo de volta em "Redescobrir". No Medley toca em "Rio" para ajustar o Tom e nada acontece. Ao ver "falta 1 bateria", não pode tocar; vai por Editar e procura o chip "Bateria".

Lu (Membro): "você" e "ministro" nos selos, observação inline, "mudou" desde a última visita respondem rápido. Mas o Tom é um selo de 13 px no meio de outros; numa Realizada nada além da data diz que já passou.

## Observações menores

- "Editar" Equipe aparece em Escala cancelada (`Escala.tsx:268-272`); `Equipe.tsx` não bloqueia por estado.
- `FolhaDaData`: sem menção ao aviso de remarcação nem à regra de data passada → Realizada; o rótulo "Culto de Domingo" não acompanha a data.
- Cabeçalho da Escala sem selo de estado nem de Santa Ceia.
- Folha do Item: título repetido; "Salvar" entre dois secundários e "Fechar" depois de "Remover"; bloco Letra depois do Salvar.
- Em "Recentes" do catálogo cada linha diz "há 2 dias" duas vezes (coluna e selo).
- `.pessoa .chip` 32 px vs 36 do DESIGN.md; `.nome-do-grupo` 11 px vs Label 12; segmento 13 px + contagem 11 px; `.atalho-do-culto:active` 0.98 vs 0.97.
- Itens do menu mediram 41 px (CSS pede 44); provável leitura durante a animação.
- Mesa a 1280: rodapé limitado a 720 px enquanto o conteúdo vai a 960; na Equipe o nome fica em x=320 e a Função em x=1174.
- Lembrete "6 pessoas sem notificação" repete o que os seis sinos já dizem.
- `/api/sugestoes` é pedido duas vezes por carga.
- Cartão escuro a 1,08:1 do fundo, o mesmo achado do Início; sem pares de texto abaixo de AA além do placeholder.

## Perguntas a considerar

1. Se o Ministro monta a semana item por item, por que a Escala abre pelo atalho do domingo e pela Equipe que ele já fechou no mês? E se a tela tivesse dois rostos, o da terça e o do domingo?
2. O que "Equipe completa" e "Músicas escolhidas" em verde entregam a quem monta? Se o silêncio fosse a confirmação, o que sobraria no topo?
3. Um Medley é um Item ou três? Se cada Trecho carrega Tom e o Tom é a pergunta número um, por que o Trecho não é tocável e não recebe a coluna?
4. A folha do Item é o mesmo formulário de Adicionar com Remover no fim. Quando a música já está decidida, o Ministro vem trocar o Tom, escrever uma observação ou tirar a música? Qual dos três merece o primeiro toque?
5. O fluxo mais repetido do produto termina com um `navegar` mudo para o topo. Como seria o fim de "Adicionar ao Repertório" se ele fosse desenhado para ser lembrado?
