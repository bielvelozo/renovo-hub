---
target: src/culto (segunda rodada)
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 6
target_identity: "file:C:\\Users\\gabri\\development\\renovo-hub\\src\\culto\\Ordem.tsx"
target_fingerprint: "sha256:9b730b1a372b7e8c3fbfa3d576ec992dc01c636e565cf1984f85e682a7cb18e0"
target_path: "C:\\Users\\gabri\\development\\renovo-hub\\src\\culto\\Ordem.tsx"
timestamp: 2026-09-29T01-35-37Z
slug: src-culto-ordem-tsx
---
Method: dual-agent (A: subagente de revisão de design · B: subagente de detector e navegador)

# Crítica: Modo culto (`src/culto/`, alvo `src/culto/Ordem.tsx`), segunda rodada

## Design Health Score

| # | Heurística | Nota | Achado-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | "Guardado no aparelho · atualizado seg, 22h" com Atualizar (medido: GET `/api/culto/pacote` ao tocar), "1 de 4", tela acesa só prometida com a trava na mão. Mas Atualizar que falha com pacote recente é mudo (`estadoDoPacote` ignora o erro fora do caso velho) e o carimbo não tem minutos: duas tentativas às 18h10 e 18h25 parecem a mesma. |
| 2 | Correspondência com o mundo real | 3 | Vocabulário do ministério em toda parte ("Ordem de seg, 5 de out", "Medley: Rio + Dono da…", "último: G · Isa"). Vazam "orig." no rodapé e nos tons do Medley e o "próximos 30 dias" para uma vigília que passou da meia-noite. |
| 3 | Controle e liberdade | 3 | Deslize, setas, rodapé de 52 px, Primeira/Última, X que volta à Escala. A Música pesquisada é um beco: sem rodapé, sem "N de M", sem caminho de volta ao Item em que a equipe estava. |
| 4 | Consistência e padrões | 2 | A Regra do Herói do Palco agora existe e o CSS a cumpre (36 → 48 → 101 px medidos), mas com exceções: a Música pesquisada mostra um "G" nu de 48 px sem o bloco Índigo nem o rótulo "Tom" do Item; "tom original" vira selo de 13 px; o h1 da letra em `clamp(22px, 6vw, 26px)` é o único achado do detector sem respaldo no DESIGN.md; a tela fora do pacote não tem h1. |
| 5 | Prevenção de erros | 3 | Deslize com limiar de 60 px e dominância horizontal, pontas desabilitadas, trava de tela com fallback, pesquisa sem roubar o foco. O Worker filtra `data >= hoje` e o culto rebaixa o pacote ao montar: passada a meia-noite, a Escala da vigília pode sumir da tela no meio do culto. |
| 6 | Reconhecimento em vez de memória | 3 | Rodapé com título e Tom da vizinha, "Mais tocadas", "· letra" na dica, marcador em cada título do Medley. A Ordem corta títulos numa linha ("Medley: Rio + Dono da…", "2 trechos") e "D · E" não diz de qual trecho é cada nota. |
| 7 | Flexibilidade e eficiência | 3 | Pedal e teclado (setas trocam, medido), tamanho e velocidade guardados, Rolar some quando cabe (medido). A letra abre em 17 px: o pedestal está seis toques de A+ acima; e as teclas morrem depois de tocar um botão do rodapé, porque o botão fica com foco e o guarda ignora teclas dentro de `button`. |
| 8 | Estética e minimalismo | 3 | Palco preto, um herói só, barra com dois ou três controles. O cabeçalho do Medley (Display, dois trechos, observação) mais a barra empurram a letra a ~350 px do topo e não colapsam ao rolar; "Atualizar" cai sozinho numa segunda linha. |
| 9 | Recuperação de erros | 2 | "Abra o app com internet uma vez antes do culto" e a tela fora do pacote com Atualizar dizem o que fazer. Mas o Atualizar falho é mudo, o cache `NetworkFirst` de 3 s pode devolver um pacote velho como sucesso e limpar o erro, e sessão expirada sem pacote manda para `/esqueci` sem uma frase. |
| 10 | Ajuda e documentação | 3 | A ajuda da Ordem explica o não-óbvio (o deslize) e só promete a tela acesa quando a trava está na mão. Setas, PageDown e Espaço não aparecem em lugar nenhum da interface; a dica é texto permanente. |
| **Total** | | **28/40** | **Bom** |

## Veredito de especificidade

**Avaliação de design.** Autorado onde importa: o Tom é o maior texto de cada tela por regra escrita (36 px na Ordem e na Pesquisa, 48 no cabeçalho, 101 no palco sem letra, 22 no rodapé sob o título da vizinha), o offline é tratado como conquista ("Guardado no aparelho · atualizado seg, 22h" em Sucesso), o rodapé pensa no próximo instrumento e não no próximo clique, o Medley junta as letras com um marcador por título, os marcadores do Word chegam limpos ("VERSO", "Refrão"), o pedal manda setas. Ainda genérico: a barra A−/A+/Rolar é qualquer teleprompter; a Pesquisa é campo com placeholder e lista alfabética (busca "rio" devolve Incensário, Isaías 6 e Pai nosso antes de Rio); "Sem letra ainda" com ícone de documento é vazio de catálogo, não de palco; o "G" solto da Música pesquisada parece inacabado ao lado do bloco Índigo do Item; o esqueleto de três cartões é o mesmo do app inteiro.

**Varredura determinística.** Escopo padrão e `type`: seis consultivos `design-system-font-size`, todos em `culto.css`, cinco documentados no DESIGN.md (número 22px, os quatro `clamp()` do Tom) e um não (h1 da letra em `clamp(22px, 6vw, 26px)`). Escopo `layout`: limpo.

**Overlays.** Sem injeção nesta rodada; o sinal alternativo foram as medidas ao vivo de B.

**Medidas (360 × 800, build `index-Dbsvy1cV.js`, service worker limpo).** Fontes computadas: `.nota` 36 px/700, `.nota.grande` 48, `.nota.palco` 100,8, `.notas` 22, `.nota-do-vizinho` 22, `.rotulo-do-tom` 12 Índigo, título da Ordem 18/600, topo 15/500, letra 17 → 34 em sete toques com o marcador de 12 → 23,8 px junto. Alvos: nenhum abaixo de 44 px (Atualizar 90×36 com `::before` até 44, Limpar busca 36 → 44×44). Contrastes: Cinza-meio 7,63:1 sobre o fundo e 7,06 sobre o cartão, Índigo 10,4:1, vizinho no botão 15,8:1; cartão 1,08:1 sobre o fundo e o anel de 1 px a 1,36:1. Tema claro do sistema: `.culto` continua rgb(15,15,16) com `color-scheme: dark` (o `body` fica claro por baixo, coberto pelos 100dvh). Sem rolagem horizontal, um `main` e um `h1` por tela, exceto a tela fora do pacote (zero h1). Console sem erros e nenhuma resposta ≥ 400 depois do login. Comportamentos: setas trocam de Item e voltam; "Primeira" desabilitado e "Em Teus Braços ›" com "G"; velocidade não aparece sem Rolar; Rolar não apareceu em nenhuma letra do pacote de demonstração porque todas cabem na tela mesmo a 34 px, então velocidade, Parar e PageDown ficaram sem exercício; Pesquisa abre sem foco e sem nenhum selo "sem tom".

Onde A e B concordam: a Música pesquisada desenha o Tom de outro jeito; o h1 da letra está fora do DESIGN.md; o anel do cartão fica abaixo de 3:1; a busca é alfabética.

## Impressão geral

O modo entrega o que promete no caso feliz: escuro numa subárvore só, lê do pacote guardado, o Tom é o maior texto de cada tela e o rodapé carrega o Tom da próxima. As falhas que restam são de borda e de consistência, não de conceito: o Tom "original" foge da regra do herói e vira um selo de 13 px; a vigília que cruza a meia-noite pode perder a Escala; a atualização do pacote é muda quando falha, justo quando o Ministro mudou a ordem; a letra abre em 17 px para quem lê a um metro; o pedal morre depois de um toque no rodapé; e a barra do sistema segue o tema claro da pessoa sobre o palco escuro. Nada exige repensar o modo; tudo exige fechar cantos.

## O que funciona

1. **O Tom é o herói de verdade, com hierarquia progressiva.** 36 na Ordem e na Pesquisa, 48 no cabeçalho, 101 no palco sem letra, com o título da Ordem rebaixado a 18 px e o h1 da letra em 22: o olho vai primeiro para a nota, e o rodapé repete o Tom da vizinha em 22 px para o Guitarrista entre uma música e outra.
2. **Sem internet é o estado normal, não o de erro.** `estadoDoPacote` só veste Perigo com pacote de mais de 7 dias que não atualizou; a linha do pacote fica em Sucesso com Atualizar ao lado; guardar tolera quota e navegação privada; sessão expirada não tira o palco de quem tem pacote; a tela fora do pacote explica os 30 dias e deixa atualizar.
3. **A mão ocupada foi levada a sério.** Deslize com limiar, setas e PageDown de pedal com repetição ignorada, rolagem automática que para ao primeiro toque, trava de tela repedida ao voltar do segundo plano, rodapé de 52 px, volta em link de 44 px, Pesquisa que não sobe o teclado antes da decisão.

## Problemas prioritários

1. [P1] O Tom "original" quebra a Regra do Herói do Palco: `NotaDoTom` troca a nota por um selo de 13 px ("tom original") na Ordem e no palco, e o rodapé e os tons do Medley abreviam para "orig.". O domínio conhece `musica.tomOriginal`, mas o pacote passa `item.tom` como está. Correção: resolver "original" para a nota conhecida no pacote e mostrá-la grande com um selo pequeno "original" embaixo; só cair no texto quando a nota é de fato desconhecida, e aí "Tom original" em 22 px, nunca 13. Comando: /impeccable harden (dado) + /impeccable typeset (nota).
2. [P1] A barra do sistema segue o tema claro sobre o palco escuro: `ProvedorDeTema` grava `meta[name=theme-color]` a partir do tema escolhido e nada no culto sobrescreve; no PWA instalado (`standalone`) quem usa tema claro sobe no palco com a barra de status em `#F4F4F2` sobre `#0F0F10`. Correção: fixar `theme-color` no escuro ao montar o modo culto e restaurar ao sair. Comando: /impeccable harden.
3. [P1] Vigília que passa da meia-noite pode perder a Escala no meio do culto: o pacote só traz `data >= hoje` e qualquer atualização bem-sucedida às 00h05 (mount, Atualizar, reabrir o app) substitui as escalas sem a de ontem; a tela cai em "não está guardada no aparelho", que ainda por cima é falso. Correção: o Worker incluir a Escala de ontem (ou até N horas depois do horário) e o cliente nunca descartar a Escala aberta ao trocar de pacote. Comando: /impeccable harden.
4. [P1] Atualizar é mudo quando falha e pode mentir quando "funciona": `estadoDoPacote` ignora o erro enquanto o pacote não é velho; o Workbox serve `/api/*` em `NetworkFirst` com 3 s, então numa rede fraca o Atualizar volta o pacote em cache com 200 e limpa o erro; o carimbo só tem dia e hora; não há pulso de atualização (visibilidade, `online`, volta à Ordem) nem aviso de "Ordem atualizada" quando os Itens mudam. Correção: "Não deu para atualizar agora · mostrando o de dom, 17h40" ao falhar, minutos no carimbo, rebaixar o pacote ao voltar à Ordem e ao ficar online, aviso curto quando a ordem mudar. Comando: /impeccable clarify (estado) + /impeccable harden (gatilhos).
5. [P1] A letra abre em 17 px para quem lê a um metro: `PASSO_PADRAO = 1` numa rampa que vai até 34, com tamanho global compartilhado com a letra da casca; o Vocal precisa de seis toques de A+ na primeira vez. Correção: passo padrão próprio do palco (26 ou 30) em chave separada, ou um botão "Pedestal" que salta para 34. Comando: /impeccable adapt.
6. [P1] O pedal morre depois de um toque no rodapé: `usarTeclasDoPalco` ignora qualquer tecla cujo alvo esteja em `button, a, input…`; depois de tocar "Em Teus Braços ›" o botão fica com foco (a rota troca com `replace`, o componente não desmonta) e a próxima seta é engolida; PageDown também. Correção: ignorar só campos editáveis e deixar setas e PageDown passarem em botões e links (o Espaço num botão continua sendo clique). Comando: /impeccable harden.
7. [P2] A Música pesquisada é um beco e desenha o Tom de outro jeito: sem rodapé, sem "N de M", sem "voltar ao Item 3"; o Tom fica num `p.tom-grande` nu, sem o bloco Índigo-suave nem o rótulo "Tom", e sem a linha "último: G · Isa, 21/09" que o Item mostra. Correção: mesmo bloco de Tom com rótulo, a linha do último Tom, e um rodapé "‹ Voltar à Ordem" que lembra o último Item aberto. Comando: /impeccable distill (consistência) + /impeccable layout (rodapé).
8. [P2] No tamanho de pedestal o cabeçalho engole o palco: no Medley com observação a letra começa a ~350 px do topo e o rodapé toma 78 px; a 34 px sobram umas sete linhas. Correção: ao rolar, encolher o cabeçalho para uma faixa de uma linha com título e Tom, e esconder a observação depois de lida. Comando: /impeccable layout + /impeccable distill.
9. [P2] A busca é alfabética por substring: "rio" devolve Incensário, Isaías 6 e Pai nosso antes de Rio, e ignora `vezesTocada`. Correção: título que começa pelo termo primeiro, depois palavra inteira, depois substring, desempate por vezes tocada. Comando: /impeccable harden.
10. [P2] O anel de 1 px dos cartões da Ordem fica em 1,36:1 sobre o fundo (cartão 1,08:1): abaixo dos 3:1 que separariam o cartão num LCD com brilho baixo. Validar no S23 antes de mexer; se falhar, Superfície alta como fundo do cartão no culto. Comando: /impeccable polish.

## Bandeiras vermelhas por persona

Casey (uma mão, pressa): cartões de 76 px, rodapé no polegar, "Pesquisar música" largo no pé da Ordem e deslize ajudam; "‹ Ordem", "‹ Pesquisa" e o X moram nos cantos de cima, não dá para abrir a Pesquisa a partir da letra, e o Atualizar é um botão pequeno que cai sozinho numa segunda linha.

Sam (baixa visão, tema claro, leitor de tela): h1 em cada tela (menos a fora do pacote), rótulos e `aria-pressed` na barra, foco Índigo de 2 px, Cinza-meio a 7,6:1 e Índigo a 10,4:1 ajudam; atrapalham a barra de status clara sobre o palco escuro, o leitor de tela ouvindo "1 Fez Um Caminho IIR Music D" sem a palavra "Tom" na Ordem e "D · E" sem dizer de qual trecho, os títulos cortados numa linha e o anel do cartão a 1,36:1.

Riley (vigília, sessão expirada, escala de ontem, sem internet): sessão expirada com pacote mantém o palco e o vazio sem pacote diz o que fazer; a Escala pode sumir do pacote ao cruzar a meia-noite, sem pacote e sem sessão a pessoa cai em `/esqueci` sem uma frase, e uma Escala realizada ontem só abre pelo menu "Modo culto" da Escala, que Riley não sabe que existe.

O Vocal no pedestal: gancho em negrito, marcadores limpos que crescem com a letra, rolagem que para ao toque e Tom sempre à vista; mas 17 px de saída, cabeçalho que não encolhe, velocidade só ajustável depois de começar a rolar e nenhum sinal quando um toque acidental interrompe a rolagem.

O Guitarrista entre uma música e outra: a Ordem inteira com as notas em 36 px numa coluna e o rodapé com o Tom da próxima; mas "tom original" em 13 px e "orig.", "D · E" sem o trecho, e o Tom da vizinha em 22 px é lido no braço, não a um metro.

O Ministro que muda a ordem na hora: sair pelo X leva direto à Escala e o mount rebaixa o pacote; mas os aparelhos da equipe não sabem que algo mudou, não há gatilho automático com o culto aberto, um Item removido faz a letra da pessoa saltar para a Ordem sem aviso e a observação dele só aparece na letra.

## Observações menores

- A tela fora do pacote não tem h1; o esqueleto de espera também não.
- O h1 da letra (`clamp(22px, 6vw, 26px)`) e o peso 700 do número do Item não estão no DESIGN.md.
- "Culto de Domingo · 18h" no topo e "Ordem de seg, 5 de out" logo abaixo repetem a data de formas diferentes.
- O ramo `!atualizadoEm` de `estadoDoPacote` é código morto: a Ordem só renderiza com pacote, e todo pacote tem `geradoEm`.
- Nenhuma letra do pacote de demonstração passa da dobra, nem a 34 px: Rolar, velocidade, Parar e PageDown não são testáveis sem uma letra longa no cenário.
- Sem `touch-action: pan-y` no corpo da letra, o deslize horizontal disputa com a rolagem nativa e não dá feedback durante o gesto.
- A rolagem automática segue com a tela em segundo plano até o `requestAnimationFrame` congelar; ao voltar, a letra dá um salto proporcional ao tempo ausente.
- Geist vem do Google Fonts em `CacheFirst`; se a primeira abertura com internet não baixou os quatro pesos, o palco offline cai em `system-ui`. Verificar no aparelho.
- `.previa-da-letra` vive em `culto.css` mas é da casca.
- A tarefa guiada promete que o atalho do culto "aparece sozinho no Início", mas só no dia exato: a vigília de sábado perde o atalho às 00h00.
- No tema claro do sistema o `body` fica claro por baixo do palco; hoje coberto por `height: 100dvh` e `overflow: hidden`.

## Perguntas a considerar

1. Se o Tom é o herói, por que um Item pode ser "original" sem que o pacote resolva isso para uma nota? O dado existe em `tomOriginal`; a palavra no lugar da nota é decisão do palco ou herança do formulário?
2. Para Sam, que escolheu o tema claro talvez por halo ou astigmatismo, o escuro forçado é acessibilidade ou o contrário? Vale um "palco claro" escondido, ou pelo menos um contraste mais alto no escuro?
3. A letra na casca e a letra no palco compartilham o mesmo tamanho guardado. É de propósito (uma pessoa, um olho) ou herança do componente? Se o sofá quer 17 e o pedestal quer 34, que chave guarda cada um?
4. Quem é a fonte da verdade da ordem durante o culto: o pacote de cada aparelho ou o Ministro? Se é o Ministro, o pacote precisa de um pulso e de um sinal de "mudou"; se é o aparelho, a linha do pacote precisa dizer que pode estar velha.
5. A Ordem sabe qual Item está aberto em cada aparelho, mas não guarda isso. Uma marca "você estava no 3" e um "‹ Voltar ao 3" na Música pesquisada custam pouco; por que a navegação do palco esquece o lugar?
6. O rodapé é para o polegar (título grande, nota menor) ou para o olho (nota grande, título menor)? Hoje tenta os dois e serve o primeiro.
