# Auditoria de usabilidade do Renovo Hub

Feita em 10 e 11/09/2026, antes do redesenho visual. Método: andar por todas as 24 telas no celular (375 px) com a sessão do Gabriel (Admin), ler o código de cada tela e do domínio, e confrontar o que o app mostra com o trabalho que ele existe para fazer. Cada afirmação sobre comportamento foi conferida no código; onde não deu para conferir, está marcado "verificar".

Severidade:

- **Alta**: o app falha no trabalho principal, esconde informação que a pessoa precisa ou torna uma tarefa comum difícil ou arriscada.
- **Média**: funciona, mas exige esforço, confunde ou parece amador.
- **Baixa**: acabamento.

Cada achado diz em qual fatia do redesenho entra: **F1** Fundação, **F2** Início e Mês, **F3** Escala, **F4** Músicas, Sugestões e Perfil, **F5** Admin, **F6** Fora da casca. Achados que precisam de dado novo na API estão marcados **API**.

## O trabalho que o app existe para fazer

O motivo declarado do app: o ministério não lembrava de músicas que fazia muito tempo que não tocava, e repetia as mesmas músicas várias vezes num período curto. O app é, antes de tudo, a **memória do repertório**. Todo o resto (Escalas, Equipes, notificações) existe em volta disso.

Os três trabalhos, em ordem de importância:

1. **Ministro: escolher bem as músicas.** Saber o que faz tempo que não toca, o que tocou há pouco, o que o outro Ministro já escolheu, em que Tom foi, quem da Equipe sabe tocar.
2. **Membro: chegar preparado.** Saber quando toca, com quem, o que vai tocar, em que Tom, e ter em mãos o vídeo, a letra e a observação do Ministro, inclusive na hora do culto.
3. **Manter o ministério andando.** Montar Equipe com justiça, avisar todo mundo, cuidar do catálogo e das pessoas.

A auditoria anterior (mantida na íntegra na seção "Por tela") olhou cada tela isolada. Esta parte olha o app pelo trabalho, e é onde estão os problemas mais graves.

## Parte 1 · Memória do repertório: onde o app falha no seu trabalho principal

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| M1 | A redescoberta é a ordem padrão do catálogo, mas é invisível. A lista já abre ordenada por "há mais tempo sem tocar", só que o chip diz "Faz mais tempo" (mais tempo de quê?), nada explica e a linha da música mostra "16/08 · Marcos" em vez de "há 3 semanas". A pessoa vê uma lista qualquer de músicas. | Alta | O catálogo abre como resposta à pergunta "há quanto tempo não tocamos?": seções com título ("Nunca tocada no app · 101", "Há mais de um ano", "Há mais de 6 meses", "Há mais de 3 meses", "Nos últimos 3 meses", "Este mês") e cada linha com o tempo relativo ("há 14 meses"). Sem chips de ordem: a ordem é a seção. F1 e F4. |
| M2 | As músicas do Legado, o repertório antigo (101 músicas da playlist, exatamente as que "fazia muito tempo que tocávamos"), vão para o **fim** da lista "Faz mais tempo": `ordenarPorExecucao` põe quem não tem Execução depois de quem tem (`src/dominio/execucoes.ts:80`). E ficam **fora** dos filtros "+ de 3, 6, 12 meses": `cabeNosMeses` exige uma Execução (`worker/rotas/musicas.ts:210`). O app esconde justamente o que foi feito para lembrar. | Alta | "Sem Execução no app" conta como "há mais tempo que qualquer outra": primeira seção da lista. Na revisão da Música, o Admin pode informar "tocada por último em (ano)" aproximado, para as antigas entrarem na linha do tempo. F4 e F5, API. |
| M3 | Não existe aviso de repetição. Ao adicionar, o app informa "Último Tom: D, tocado em 16/08 com Isa" como texto neutro. Se foi há 13 dias, o texto é igual ao de há 13 meses. Na lista do catálogo o selo de data também não muda de cor. O Ministro tem que calcular de cabeça. | Alta | Alerta explícito, em cor de atenção, na linha da música e no topo do formulário: "Tocada há 13 dias, com a Isa". Limite padrão de 6 semanas; o Admin ajusta. No Repertório da Escala, Itens recentes recebem a mesma marca. F1, F3 e F4. |
| M4 | Músicas já escolhidas para **outras Escalas agendadas** são invisíveis. Só Execuções (Escalas realizadas) entram no histórico. Dois Ministros alternando semanas não veem a escolha um do outro: a Isa monta 13/09, o Marcos monta 20/09 e repete a música sem saber. Esta é a causa mais direta do "repetimos em curto período". | Alta | Selo "no Repertório de 13/09 (Isa)" na linha do catálogo e alerta ao adicionar. No Início do Ministro, os próximos Repertórios lado a lado. F2, F3 e F4, API. |
| M5 | Quantas vezes a música foi tocada não aparece em lugar nenhum da lista. `vezesTocada` existe no domínio, mas `MusicaNaLista` só carrega a última Execução. Repetição é problema de frequência ("5 vezes desde março"), não só de data. | Média | "5× em 6 meses" na linha e no cabeçalho da Música. F4, API. |
| M6 | O Ministro monta o Repertório item a item e nunca vê o conjunto: quantas são recentes, quantas antigas, quantas novas, se o culto inteiro é repetição do mês passado. | Média | Faixa abaixo do Repertório: "2 recentes · 2 há mais de 6 meses · 1 nova", com alerta quando a maioria é recente. F3. |
| M7 | O catálogo está sujo e isso quebra a busca: título cru ("Grato Sou (I Thank God) - Ao vivo • DROPS"), artista igual ao canal do YouTube ("drops", "fhop music"). Buscar pelo artista de verdade não acha; passar o olho na lista é lento; o texto do WhatsApp e as notificações saem com o título cru. A revisão manual de 101 músicas pelo Admin não vai acontecer. | Alta | Limpeza automática na importação e ao adicionar por link (tira o que vem depois de "\|", "//", "•", "-" quando é canal, e parênteses de "Ao Vivo", "Clipe Oficial", "Lyric", "Playback"). Na revisão, a sugestão já vem preenchida para confirmar com um toque. Ministro também pode corrigir título e artista na tela da Música. F1, F4 e F5. |
| M8 | Os dois grupos de chips (ordem e filtro) são visualmente idênticos, cada um com um chip laranja selecionado, sem rótulo. Parece que duas coisas aleatórias estão marcadas. A combinação ordem × filtro é um produto mental que ninguém faz. É a tela do print do Gabriel. | Alta | Chips somem. A ordem vira seção (M1). Sobra um único menu "Ver": "Todas", "Nunca tocadas", "Escolhidas por mim", "Com Sequência". F1 e F4. |
| M9 | Datas absolutas sem ano ("16/08"). O trabalho do app é sobre períodos longos: daqui a um ano, "16/08" não diz se foi este ano ou o passado. | Média | Tempo relativo em toda lista ("há 14 meses"); data completa com ano no detalhe. F1. |
| M10 | Não dá para separar "o que eu escolhi" de "o que o outro Ministro escolheu". O nome aparece no selo, mas não há como ver as próprias escolhas nem as do outro em lista. Cada Ministro lembra das suas e esquece as do colega. | Média | Filtro "Escolhidas por mim" e "Por outros" no menu Ver; na tela da Música, o histórico já tem o nome. F4. |
| M11 | A cobertura ("Gabriel, Pedro já tocaram · Lucas nunca") é a informação que diz quem precisa de ensaio, mas é uma frase corrida no meio do formulário. | Média | Bloco estruturado: "Já tocaram: Gabriel, Pedro" e "Nunca: Lucas" em selos, com Lucas em destaque, para o Ministro mandar a Sequência para ele. F3. |
| M12 | Sugestões não conversam com a memória: uma Sugestão de música tocada há duas semanas aparece igual a qualquer outra. O Ministro vê apoios, não vê recência. | Média | Linha da Sugestão usa o mesmo componente de música, com "tocada há 2 semanas" e "no Repertório de 20/09". F4. |
| M13 | Tom "original" é gravado literalmente e sai no WhatsApp como "Tom original", mesmo quando o Tom original da gravação já está preenchido na Música. | Baixa | Quando `tomOriginal` existe, mostrar e enviar "D (original)". F3. |
| M14 | Músicas sazonais (Natal, Páscoa) vão ressurgir em "há mais de 12 meses" em junho. Sem marca, a redescoberta sugere o que não cabe. | Baixa | Fora do redesenho. Anotar como etiqueta futura ("Natal") que a seção respeita. |

## Parte 2 · Membro: chegar preparado

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| P1 | Não existe "modo culto". No dia, o músico precisa do Tom em letra grande, da ordem, da observação, do vídeo e da letra, em pé, com o celular na mão. O Início mostra isso numa lista comum com títulos de duas linhas e o Tom em texto pequeno. | Alta | Quando a Escala é hoje, o Início vira "Hoje": um bloco por música, Tom enorme, minutagem se for trecho, observação em destaque, play e Sequência a um toque, tela sem apagar. F2. |
| P2 | O Membro não tem calendário (aba Mês só para quem dirige) e não consegue responder "quando eu toco de novo?". Se não está na próxima Escala, o Início mostra a próxima do ministério com "não está nesta Escala". | Alta | Mês para todos, com as Escalas da pessoa marcadas. Início com "Sua próxima escala" e "Próximo culto" separados. F1 e F2. |
| P3 | Sem sinal, o app não funciona. O service worker só guarda fontes e a casca; `/api/*` não tem cache (`vite.config.ts`, `runtimeCaching`). Igreja com sinal ruim é o cenário normal de domingo: o Membro abre para ver o Tom e recebe erro. | Alta | Cache das últimas respostas (stale-while-revalidate) com marca "visto às 17:40"; Escalas dos próximos 7 dias pré-carregadas. F1 (infra) e F2. |
| P4 | A pessoa é avisada por push que "3 mudanças na Escala", mas ao abrir o app nada indica o que mudou. Ela relê tudo. | Média | Marca "novo" ou "mudou" nos Itens alterados desde a última visita; some quando a pessoa abre. F2, API. |
| P5 | Ouvir a música, a ação mais comum, é um link de texto sublinhado embaixo da capa. Capa e título não abrem nada. | Alta | Capa com play abre o vídeo (no ponto do trecho). F1. |
| P6 | Sequência é um `.docx` que baixa e abre no Word ou no Drive. Na hora do culto isso é lento e o link diz só "Sequência: nome (v2)". | Média | Fora do redesenho converter o formato. No redesenho: ícone de documento na linha, rótulo "Letra", abre direto. Anotar como melhoria futura: texto da Sequência dentro do app. F2. |
| P7 | Títulos crus e Tom escondido (ver M7 e achado 13). | Alta | Linha de música limpa com Tom em selo. F1. |
| P8 | O Membro não tem como responder nada: não confirma presença, não avisa que não pode, não pede troca. O Ministro descobre no WhatsApp. É o maior buraco de produto do app, fora do redesenho. | Média | Registrar como próximo projeto: "não posso" com data, visível ao Ministro na Equipe e no Mês. Fora do redesenho. |

## Parte 3 · Pessoas, Equipe e comunicação

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| E1 | A Equipe não tem memória de pessoas. Ao escalar, o Ministro não vê "Ana: última vez há 3 semanas, 4 fins de semana seguidos", "Bia: não toca desde junho". O app tem esses dados (`presencaDoMembro`), mas os mostra no Perfil, para a própria pessoa. Escalar com justiça é o mesmo problema da música: rodízio. | Média | Na Equipe, cada pessoa com "última: há 3 semanas" e alerta quando está em 4 ou mais seguidos ou parada há mais de 2 meses. F3, API. |
| E2 | "Fins de semana seguidos" como número do Perfil lê como sequência a manter, tipo streak de app de exercício. Em ministério voluntário, seguidos é sinal de cansaço, não de mérito. Público e enquadramento errados. | Média | Tirar do Perfil ou reenquadrar ("você serviu em 4 dos últimos 6 fins de semana"). O dado vai para a Equipe (E1). F4. |
| E3 | Com dois Ministros na mesma Escala, "ministrado por" nunca é enviado pela interface: nem Adicionar nem Medley têm o campo; `ministradoPorDe` devolve `null` quando há mais de um marcado (`src/dominio/escala.ts:89`). O histórico da música fica sem autor e o texto do WhatsApp não diz quem puxa. | Média | Campo "Quem puxa" no formulário do Item quando a Escala tem mais de um Ministro, com o último escolhido como padrão. F3. |
| E4 | Quem sugeriu nunca sabe que a Sugestão foi aceita: ela some da lista quando é promovida e não há gatilho de push para isso (`worker/push/gatilhos.ts` só cobre escalado, mudança de música, véspera, cancelada e remarcada). Quem sugere e não vê retorno para de sugerir. | Média | Seção "Aceitas" em Sugestões com a Escala em que entrou, e push "Sua sugestão entrou no dia 20/09". F4, API. |
| E5 | Sugestão não tem "não por agora": fica aberta para sempre ou é apagada sem explicação. | Baixa | "Guardar para depois" com motivo curto opcional, visível a quem sugeriu. F4, API. |
| E6 | Início é a mesma tela para Membro e Ministro. O Ministro precisa de um painel: Escalas próximas com o que falta (Ministro, banda, músicas), Sugestões novas, Músicas a revisar. Hoje ele descobre pendências abrindo Escala por Escala. | Alta | Início do Ministro com "Pendências das próximas 4 semanas" no topo. F2. |
| E7 | "Não recebe notificação" ao lado do nome em cada linha da Equipe (ver achado 36). O dado é importante para o Ministro (quem precisa ser avisado no WhatsApp), mas está implementado como ruído. | Média | Ícone discreto na linha e, no topo da Equipe, "3 pessoas sem notificação: Ana, Isa, Gabriel" com botão "copiar nomes". F3. |
| E8 | Texto do WhatsApp com títulos crus, "Tom original" literal, e sem o horário quando a Escala é fora do padrão. | Baixa | Coberto por M7 e M13; incluir horário sempre. F3. |

## Parte 4 · Confiança nos dados: a memória só vale se for verdadeira

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| D1 | A Escala vira Realizada sozinha à meia-noite e todo Item vira Execução. Se uma música foi cortada por tempo, ou o Tom mudou na hora porque a vocalista trocou, o histórico registra o plano, não o que aconteceu. Ninguém vai lembrar de "editar o passado". Com o tempo a memória fica errada, e o app perde a razão de existir. | Alta | Continua automático: nada é exigido de ninguém (decisão do Gabriel em 11/09). O que entra é um lembrete sem custo: push às 22:30 do dia da Escala para os Ministros dela, "Todas as músicas de hoje foram tocadas? Toque para ajustar", e um cartão no Início de quem dirige, de domingo à noite até segunda, "Ontem: 5 músicas registradas · Ajustar", que some sozinho depois. Ignorar não muda nada; ajustar abre a Escala Realizada com edição de Item (D2). F2, API. |
| D2 | Item do Repertório não tem edição (achado 29). Corrigir Tom ou observação exige remover e adicionar, e a ordem se perde. Também é problema de dado: o Ministro desiste de corrigir. | Alta | Folha de edição do Item. F3. |
| D3 | A mesma música entra duas vezes por links diferentes (ao vivo, estúdio, lyric): `resolver` só reconhece pelo `videoId`. O histórico se divide e a redescoberta mente ("nunca tocada" para a versão nova de uma música tocada mês passado). | Média | Ao adicionar por link, comparar título normalizado com o catálogo: "Parece 'Algo Bem Maior', já no catálogo. É a mesma? Usar a do catálogo / É outra". F3, API. |
| D4 | Um Trecho de 40 segundos num Medley conta como Execução da música e atualiza "última vez". A música some da redescoberta como se tivesse sido tocada inteira. | Média | "última vez" mostra "trecho" com destaque e a seção de redescoberta pesa trecho como meia Execução, ou permite "só inteiras" no Ver. F4, API. |
| D5 | Tom "original" sem nota conhecida vira histórico sem Tom. A música toca, ninguém registra a nota, e a próxima vez repete "original". | Baixa | Na confirmação pós-culto (D1), pedir a nota quando o Tom foi "original". F2. |

## Parte 5 · Primeiro uso, vazio e orientação

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| V1 | Depois do convite, a pessoa cai em Instalar: dois parágrafos, segmento de plataforma, cinco passos, bloco de Notificações e "Pronto" abaixo da dobra. A primeira impressão do app é um manual. | Alta | Boas-vindas curta: "Oi, Gabriel. Você entrou." e duas ações opcionais, "Instalar na tela inicial" e "Ativar notificações", com "Agora não". Os passos abrem só ao tocar em instalar. F6. |
| V2 | O Admin no primeiro uso não tem caminho: cadastrar Membros, depois Funções, depois Formação, depois criar o mês, montar Equipe, escolher músicas. O painel é uma lista de seis links sem ordem nem estado. | Média | Painel com "Primeiros passos" em lista de conferência que some quando tudo está feito, e depois vira painel de pendências (achado 61). F5. |
| V3 | Início vazio diz "Quando o mês for criado, ela aparece aqui" sem link, mesmo para quem pode criar o mês. | Média | Para quem dirige: botão "Criar as Escalas de outubro" ali mesmo. F2. |
| V4 | Estados vazios de listas explicam o jargão em vez de dizer o que fazer ("Nenhuma Música Nova: todas já foram tocadas ou vieram da playlist"). | Baixa | Vazio diz a ação: "Nada aqui. Adicione por link ou busque no YouTube." F1. |

## Parte 6 · Sensação de qualidade (transversal)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| S1 | O Início faz pedidos em cascata: lista de Escalas, depois a Escala, depois Funções e anexos. A tela aparece em três tempos, com círculo girando entre eles. | Média | Um pedido "início" que devolve tudo, ou esqueleto que mantém a estrutura. F2, API. |
| S2 | Capas do YouTube vêm com barras pretas em cima e embaixo (a miniatura `hqdefault` é 4:3 com o vídeo 16:9 dentro). Toda lista tem retângulos com faixas pretas; é o que mais faz o app parecer improvisado nos prints. | Média | Recortar as barras (`object-fit: cover` num contêiner 16:9) ou usar `mqdefault`; cantos arredondados; cor de fundo do tema enquanto carrega. F1. |
| S3 | Ícones desenhados com caracteres de texto ("‹", "⋯", "×", "›"), cada um com peso e alinhamento diferentes. | Baixa | Conjunto único de ícones SVG. F1. |
| S4 | Datas no formato "04/10 (dom)". | Baixa | "dom, 4 de out" nas listas; "domingo, 4 de outubro" no detalhe. F1. |
| S5 | A mesma lista de Itens tem duas implementações (`Inicio.tsx` e `Escala.tsx`) com comportamentos diferentes: uma mostra Sequência, a outra alça de arrastar; nenhuma abre o vídeo pela capa. | Média | Um componente de Item com modos leitura e edição. F1. |
| S6 | Nenhuma transição: folhas e telas trocam de estado num corte seco (verificar no CSS da `Folha`). | Baixa | Folha sobe com transição curta; troca de aba sem animação; lista com fade ao carregar. F1. |
| S7 | Títulos truncados no meio da frase com reticências ("Fez Um Caminho (Ao Vivo) - IIR Musi…"). | Média | Coberto por M7: título limpo cabe em uma linha na maioria dos casos; duas no máximo. F1. |
| S8 | Botão primário laranja para ações de peso diferente na mesma tela; até três botões largos em sequência (Perfil, Equipe). | Média | Um primário por tela; hierarquia primário, secundário, terciário, ícone, perigo. F1. |

## Fora do redesenho, mas registrado

Buracos de produto que a auditoria expôs e que não cabem numa reestilização. Ficam anotados para virar projetos próprios:

- **Disponibilidade**: o Membro dizer "não posso dia 20" e o Ministro ver isso ao montar a Equipe (P8).
- **Sequência dentro do app**: letra em texto, com o gancho em destaque, em vez de `.docx` (P6).
- **Etiquetas de ocasião**: Natal, Páscoa, Santa Ceia, para a redescoberta não sugerir fora de época (M14).
- **Confirmação pós-culto** (D1) precisa de API e gatilho de push; é a mais importante das quatro e pode entrar na fatia F2 se o Gabriel quiser.

## Resumo priorizado

Os quinze achados que mais mudam a experiência, em ordem:

1. Redescoberta invisível e o Legado escondido no fim da lista e fora dos filtros (M1, M2).
2. Sem aviso de repetição, nem por data nem por outra Escala agendada (M3, M4).
3. Histórico que mente porque a Escala vira Realizada sozinha, sem confirmação (D1).
4. Chips de ordem e filtro idênticos e sem rótulo, na tela mais usada pelo Ministro (M8, achado 41).
5. Catálogo sujo que quebra busca, listas, WhatsApp e notificações (M7).
6. Membro sem calendário e sem "sua próxima escala" (P2).
7. Sem "modo culto" no dia (P1).
8. Sem cache da API: sem sinal, sem app (P3).
9. Item do Repertório sem edição (D2).
10. Início igual para Ministro e Membro; Ministro sem painel de pendências (E6, achado 23).
11. Remoções sem confirmação nem desfazer (achado 5).
12. Ouvir a música é link de rodapé; capa não faz nada (P5).
13. Onboarding é um manual (V1).
14. Equipe sem memória de pessoas; "seguidos" no público errado (E1, E2).
15. Capas com barras pretas e ícones de texto (S2, S3).

## Por tela (auditoria original, mantida)

Os 68 achados abaixo foram levantados tela a tela em 10/09/2026. Continuam válidos; onde a Parte 1 a 6 aprofunda o mesmo ponto, o número está citado.

### Casca, navegação e componentes (F1)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 1 | Aba Mês escondida do Membro (`Abas.tsx`, `soMinistro`). | Alta | Mês para todos, só leitura para quem não dirige, com as Escalas em que a pessoa está destacadas. |
| 2 | Cabeçalho fixo com logo e botão Admin, sem título da tela; o título vem depois, dentro do conteúdo, e some ao rolar. | Média | Cabeçalho contextual: selo pequeno à esquerda, título da tela, ação da tela à direita. Admin vira uma entrada no Perfil ou ícone de engrenagem. |
| 3 | Ícones desenhados com caracteres de texto: "‹" para voltar, "⋯" para menu, "×" para remover, "›" nas listas. Cada um com peso e alinhamento diferentes. | Baixa | Conjunto único de ícones SVG, mesmo traço, no `Icone.tsx`. |
| 4 | Carregamento troca a tela inteira por um círculo girando, inclusive quando só um bloco está carregando (por exemplo, o Repertório dentro do Início). | Média | Esqueleto por bloco, com a estrutura da tela já visível. |
| 5 | Ações destrutivas sem confirmação nem desfazer: "×" no Item do Repertório, "×" na Sugestão, destoggle de Função na Equipe. Cancelar Escala tem confirmação; o resto não. | Alta | Padrão único: remoção mostra aviso no rodapé com "Desfazer" por alguns segundos. |
| 6 | Nenhuma confirmação positiva: escalar alguém, salvar Formação, gerar link, mudar tema acontecem em silêncio. Na Equipe aparece um "salvando…" pequeno embaixo da seção. | Média | Aviso curto no rodapé ("Ana escalada no vocal") para ações que não mudam de tela. |
| 7 | Parágrafos de regra dentro das telas: Formação (3 linhas), Convites (3 linhas), Instalar (2 parágrafos), Perfil ("Sair apaga a sessão daqui…"), Mês ("O segundo domingo nasce Santa Ceia…"). | Média | Explicação só na primeira vez ou atrás de um "?" ao lado do título. A tela mostra o que fazer, não o porquê. |
| 8 | Corpo em Kodchasan peso 300 sobre fundo escuro: traço fino, legibilidade baixa em texto corrido e em "dica". | Média | Corpo em Inter 400 (decidido no estilo A). Peso leve só em display. |
| 9 | Selo de estado "agendada" em minúscula, azul, ao lado da data em toda lista, inclusive quando todas as Escalas da lista são agendadas. Ruído sem informação. | Baixa | Selo só quando o estado é exceção (Cancelada, Realizada em lista de futuras, Santa Ceia). Agendada é o padrão e não precisa de selo. |
| 10 | Badge da aba Sugestões conta todas as Sugestões abertas para todo mundo. Nunca zera enquanto houver uma Sugestão, e vira ruído permanente. | Média | Contar só as novas desde a última visita da pessoa, ou tirar o badge para quem não dirige. |
| 11 | Botão primário largo laranja usado para ações de peso diferente na mesma tela (por exemplo, "Criar os 3 domingos" e "Escalar uma Formação"). Hierarquia de botões não separa o principal do secundário. | Média | Um botão primário por tela, no máximo. O resto é secundário, terciário ou ícone. |
| 12 | Botão de ação principal no fim de telas longas (Adicionar ao Repertório, Enviar Sugestão, Pronto em Instalar), abaixo da dobra. | Média | Rodapé fixo com a ação principal nas telas de formulário. |
| 13 | Título de música exibido cru em todas as listas: título com "(Ao Vivo)", "\| canal", "• DROPS", em duas ou três linhas, truncado com reticências. | Alta | Componente de linha de música com título limpo (M7), artista numa linha, Tom em selo à direita. Máximo de duas linhas. |
| 14 | Capa da música não é tocável; "Abrir no YouTube" é link de texto abaixo. | Alta | Capa com ícone de play abre o vídeo. Linha inteira abre a Música quando estiver em contexto de catálogo. |
| 15 | Em desktop, o app é uma coluna de 720 px com abas de celular embaixo. Funciona, mas não usa a tela. | Baixa | Em largura maior, abas viram barra lateral e a coluna cresce. Só se couber na fatia. |
| 16 | Vocabulário do domínio com maiúscula na interface ("Escala", "Equipe", "Execução", "Item"). Preciso internamente; estranho para quem usa. | Média | Na interface: "escala", "equipe", "já tocada em", "música". Maiúscula fica na documentação e no código. |

### Início (F2)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 17 | Quando o Membro não está na próxima Escala, a tela mostra a próxima do ministério com "Você: não está nesta Escala" e uma dica. A pergunta dele ("quando eu toco?") fica sem resposta. | Alta | Dois blocos: "Sua próxima escala" e "Próximo culto". Se a pessoa não está em nenhuma, dizer isso com clareza e mostrar o mês. |
| 18 | O cartão da próxima Escala mostra "Você: Guitarra" e "Ministro: Isa", mas não mostra com quem a pessoa toca. Para ver a Equipe é preciso "Abrir". | Média | Linha de Equipe no cartão: nomes ou iniciais dos escalados, agrupados. |
| 19 | Quanto falta para a Escala não aparece ("04/10 (dom)"). | Baixa | "domingo, 4 de outubro · em 3 dias". |
| 20 | Tom do Item aparece em texto "dica", pequeno, depois do título gigante. É o dado que o músico consulta. | Média | Selo de Tom destacado à direita da linha. Com "trecho" e minutagem quando for Trecho. |
| 21 | "Playlist pra ouvir" e "Texto pro WhatsApp" no fim, iguais. O texto do WhatsApp não serve ao Membro comum. | Média | Playlist como ação primária no topo do Repertório. WhatsApp só para quem dirige, na tela da Escala. |
| 22 | Sequência (arquivo Word) aparece como link de texto "Sequência: nome (v2)" solto embaixo do Item. | Baixa | Ícone de documento na linha do Item; abre a Sequência. |

### Mês (F2)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 23 | Linha da Escala resume "6 na Equipe · 5 no Repertório · Isa". Não diz o que falta. Para saber se falta Ministro, vocal, banda ou músicas é preciso abrir cada uma. | Alta | Indicadores de pendência por Escala, com cor de alerta: "sem Ministro", "sem banda", "sem músicas". Quando está completa, um "pronta" discreto. |
| 24 | Hoje não é marcado; passado e futuro têm o mesmo peso. | Média | Dia de hoje marcado; Escalas Realizadas mais apagadas. |
| 25 | As Escalas em que a própria pessoa está não se destacam. | Média | Marca "você" na linha, para todos os papéis. |
| 26 | "Criar os 3 domingos de Setembro" é o botão mais forte da tela mesmo quando o mês já tem Escalas. | Média | Quando o mês está vazio, é a ação principal e ocupa o lugar da lista. Quando já há Escalas, vira ação secundária no topo. |
| 27 | O título da Escala carrega o horário ("Culto de Domingo 18h"). O dado é derivado e acompanha edições, mas visualmente o horário parece parte do nome e compete com a data logo abaixo. | Baixa | Nome e horário separados: "Culto de Domingo" em título, "dom 13/09 · 18h" numa linha só. |
| 28 | Navegação de mês só por setas; não dá para pular para um mês distante nem voltar para hoje. | Baixa | Toque no nome do mês abre um seletor; botão "hoje". |

### Escala (F3)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 29 | Não existe edição de Item do Repertório. Tom, observação, trecho e "ministrado por" só podem ser definidos ao adicionar. Para mudar, remove e adiciona de novo, e a ordem se perde. | Alta | Tocar no Item abre folha de edição com Tom, inteira ou trecho, observação e, quando houver mais de um Ministro, quem puxa (E3). |
| 30 | "×" remove o Item na hora, sem confirmação nem desfazer. | Alta | Coberto pelo padrão de desfazer (achado 5). |
| 31 | "+ Música" e "+ Medley" são chips pequenos abaixo da lista. Adicionar música é a ação principal do Ministro na Escala. | Média | Botão primário "Adicionar música" logo abaixo do Repertório. Medley entra como opção dentro do fluxo de adicionar. |
| 32 | Equipe é texto corrido por grupo: "Gabriel (guitarra), Pedro (baixo), Lucas (bateria)". Não destaca a própria pessoa nem quem é o Ministro. | Média | Lista de pessoas com Função em selo, "você" destacado, Ministro em primeiro. |
| 33 | "Ministrado por" não aparece em lugar nenhum da tela da Escala nem do formulário de adicionar. Confirmado: a interface nunca envia o campo (E3). | Média | Expor na edição do Item (achado 29) e na linha do Item. |
| 34 | Aviso "Editar aqui não avisa ninguém." em Escala Realizada é críptico. | Baixa | "Escala já realizada. Mudanças aqui corrigem o histórico e não notificam ninguém." |
| 35 | Menu "⋯" esconde "Editar data, horário e Santa Ceia" e "Cancelar". Aceitável, mas o nome do menu é um caractere. | Baixa | Ícone de menu com rótulo "Mais". |

### Equipe (F3)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 36 | "· não recebe notificação" inline ao lado do nome, em cada linha, quebra o nome em duas linhas e assusta. | Média | Ícone discreto de sino cortado ao lado do nome; resumo no topo (E7). |
| 37 | Bloco "Escalar uma Formação" (primário laranja), "Salvar como Formação" e um parágrafo de três linhas ficam entre o título "Músicos" e a lista. | Média | Uma linha compacta: "Formação: Banda ▾" que aplica, mais "Salvar" em texto. Explicação atrás de "?". |
| 38 | Sem resumo do que já está montado. Para saber se falta alguém, rola a lista inteira. | Média | Faixa no topo: "Vocal 2 · Banda 3 · Som 1", com o que falta em alerta. |
| 39 | "Concluir" laranja no topo só volta; tudo já está salvo a cada toque. O nome sugere que sem ele nada é gravado. | Baixa | "Pronto" ou só a seta de voltar; indicador "salvo" discreto. |
| 40 | Chips de Função de todos os Membros, mesmo quem nunca toca, numa lista longa. | Baixa | Quem está escalado sobe para o topo do grupo; busca por nome quando a lista passa de dez. |

### Adicionar música e escolha de música (F3 e F4)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 41 | Dois campos de busca na mesma tela: "Buscar no YouTube" (campo mais botão) e "Buscar no catálogo". Mais duas linhas de chips de ordem e duas de filtro antes da primeira música. | Alta | Um campo só. Digitar filtra o catálogo na hora. Colar link resolve o vídeo. Se nada bate no catálogo, aparece "Buscar 'x' no YouTube". Ordem vira seção (M1); filtro vira menu Ver (M8). |
| 42 | Rótulos de ordem "Faz mais tempo" e "Faz menos tempo" não dizem tempo de quê. | Média | Somem com as seções (M1). |
| 43 | Filtros "Novas", "Legado", "Tocadas uma vez", "+ de 3 meses", "+ de 6 meses", "+ de 12 meses". Seis chips, dois com jargão. | Média | Somem com as seções (M1) e o menu Ver (M8). |
| 44 | Situação da música em texto: "Legado: veio da playlist, sem histórico no app." e "Nova: está no catálogo e ainda não foi tocada." | Baixa | "Ainda não tocada no app" e nada mais. |
| 45 | Tela de detalhes longa: capa grande, situação, cobertura, Tom (dica, chip original, maior/menor, teclado, Cifra Club, histórico), Como, minutagem, observação, link Cifra Club, botão. O botão de confirmar fica abaixo da dobra. | Média | Botão fixo no rodapé. Capa menor com título e artista ao lado. Alerta de repetição no topo (M3, M4). Cifra Club uma vez só. |
| 46 | Teclado de piano para o Tom é bom. Mas o chip "Tom original: D" acima e o teclado abaixo mostram o mesmo dado duas vezes quando o Tom escolhido é o original. | Baixa | Marcar a tecla do original com um ponto e tirar o chip; "usar o original" vira um toque na tecla. |
| 47 | Medley: botão "Adicionar" pequeno no topo e "Adicionar Medley ao Repertório" largo no fim fazem a mesma coisa. | Baixa | Só o do rodapé fixo. |

### Músicas e Música (F4)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 48 | Catálogo repete a estrutura de Adicionar: campo, duas linhas de ordem, duas de filtro, lista. Para o Membro o catálogo serve para ouvir e ver o Tom. | Média | Mesmo componente de busca única, seções por tempo e menu Ver. |
| 49 | Na tela da Música, "Abrir no YouTube" e "Cifra Club" só no fim; a capa grande não faz nada. | Alta | Capa com play. Ações no topo, abaixo do título. |
| 50 | Tom original ocupa um teclado inteiro no meio da tela para o Ministro, para uma edição rara. | Média | Mostrar "Tom original: D" com "editar"; o teclado abre numa folha. |
| 51 | Histórico como linhas "Tom D · 16/08 · Marcos". Bom conteúdo, sem hierarquia. | Baixa | Data como primeira coluna, Tom em selo, quem ministrou em texto. |
| 52 | Sem "última vez tocada" e "quantas vezes" em destaque no topo da Música. | Média | Cabeçalho com "tocada 4 vezes · última há 3 semanas no Tom D" (M5). |

### Sugestões (F4)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 53 | Cada linha tem três ações à direita (Apoiar, Promover, ×) empilhadas, espremendo título e observação. | Média | Apoiar vira coração com contagem na própria linha. Promover e apagar só para quem pode, atrás do toque na linha. |
| 54 | Sugestão promovida some da lista. Quem sugeriu não sabe que foi aceita nem para qual Escala. Confirmado: não há push para isso (E4). | Média | Seção "Aceitas" com a Escala em que entrou, e push. |
| 55 | "N apoios" em texto dica, com o próprio botão "Apoiado" ao lado. Dois lugares para a mesma informação. | Baixa | Coberto pelo achado 53. |

### Perfil (F4)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 56 | "Sair deste aparelho" é um botão vermelho largo, o elemento mais chamativo da tela. | Média | Sair como texto discreto no fim. |
| 57 | Bloco de Notificações com até quatro botões e dois parágrafos (ativar, testar, receber ou silenciar, não receber neste aparelho). | Média | Um interruptor "Notificações" com estado embaixo; "testar" e "só neste aparelho" atrás de "opções". |
| 58 | Sem avatar ou inicial; o nome é o título da página. Funções e papéis numa linha de texto. | Baixa | Cabeçalho com inicial em círculo, nome, Funções em selos, papel em selo. |
| 59 | O Membro não edita nada do próprio perfil (nome, Funções), embora o glossário diga que "mantém o próprio perfil". | Baixa | Confirmar a intenção. Se for para manter, nada a fazer; se não, editar nome pelo menos. |
| 60 | Link "Como instalar o app na tela inicial" em texto dica entre o bloco de Notificações e o botão Sair. | Baixa | Linha de lista "Instalar na tela inicial" com seta. |

### Admin (F5)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 61 | Painel é uma lista de seis links com dica. Não mostra pendências (quantas Músicas a revisar, quem nunca abriu o convite, Formações vazias). | Média | Painel com números: "12 músicas a revisar", "3 Membros sem acesso". A lista continua embaixo (V2). |
| 62 | Músicas a revisar: 101 títulos crus para arrumar um a um, digitando. | Alta | Sugestão automática de título e artista limpos já preenchida na folha; o Admin confirma com um toque ou corrige (M7). |
| 63 | Convites: texto de três linhas no topo, lista com "Gerar link" por pessoa, e o interruptor da lista do "esqueci" no fim, sem relação visual com o resto. | Baixa | Texto vira "?"; a lista do "esqueci" vira uma seção com título e interruptor. |
| 64 | Membros: folha de edição é boa. Na lista, "Sem Função nem papel" e o resumo de acesso ficam iguais em peso. | Baixa | Membro sem acesso ganha selo de alerta. |
| 65 | Formações: criar nasce vazia e manda para outra tela montar. Dois passos para uma coisa só. | Baixa | Criar já abre a tela de montagem com o nome no topo. |

### Fora da casca (F6)

| # | Achado | Severidade | Proposta |
| --- | --- | --- | --- |
| 66 | Depois do convite, a pessoa cai em Instalar: dois parágrafos, segmento de plataforma, cinco passos, bloco de Notificações e o botão "Pronto" abaixo da dobra. | Alta | Ver V1. |
| 67 | Esqueci: lista de nomes para entrar sem senha. Decisão consciente com interruptor no Admin. A tela não diz que isso é normal nem que só funciona se o Admin permitir. | Baixa | Uma linha: "Entrar só com o nome funciona porque o ministério é pequeno. O Admin pode desligar." |
| 68 | Não encontrada e erro de sessão são telas nuas, sem o selo. | Baixa | Selo no topo e tom de voz da marca. |

## O que a Fundação (F1) precisa entregar por causa desta auditoria

Além de tokens, tipografia e logo, a fatia 1 precisa criar os componentes que resolvem os achados transversais, senão as fatias seguintes repetem o problema:

- **Linha de música** única, usada em Início, Escala, catálogo, Adicionar, Sugestões e Admin: título limpo, artista, Tom em selo, tempo relativo ("há 14 meses"), alerta de repetição e de "planejada para", capa 16:9 sem barras e com play (M1, M3, M4, M7, S2, S5, achados 13, 14, 20).
- **Lista por seções de tempo** para o catálogo, com cabeçalhos e contagem, sem chips de ordem (M1, M2, M8).
- **Busca única** com filtro compacto "Ver", reutilizada em Adicionar, Músicas e Sequências (achados 41, 48).
- **Limpeza de título** como função de domínio, aplicada na importação, no link e na revisão (M7, achado 62).
- **Tempo relativo** como função de domínio e formato de data "dom, 4 de out" (M9, S4).
- Cabeçalho contextual com título da tela e ação (achado 2).
- Abas para todos, Mês incluído (achado 1).
- Aviso de rodapé com "Desfazer" e confirmação positiva (achados 5 e 6).
- Rodapé fixo para ação principal em formulários (achado 12).
- Esqueleto de carregamento por bloco (achado 4, S1).
- Cache das respostas da API no service worker (P3).
- Hierarquia de botões: primário, secundário, terciário, ícone, perigo (achado 11, S8).
- Conjunto de ícones SVG (achado 3, S3).
- Selos: estado só quando é exceção, Tom, Função, "você", "recente", "planejada" (achados 9, 20, 25, M3, M4).
- Glossário de interface: termos de gente, sem maiúscula de domínio (achado 16).

Dados novos na API que as fatias F2 a F5 vão pedir: vezes tocadas por período, "planejada para" (Itens de Escalas agendadas), última vez por pessoa na Equipe, Sugestões aceitas com a Escala, confirmação pós-culto, marca de "mudou desde a última visita".
