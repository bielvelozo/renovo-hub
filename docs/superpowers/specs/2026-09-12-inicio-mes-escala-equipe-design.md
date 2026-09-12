# Início, Mês, Escala e Equipe (F2 e F3)

Spec da terceira fatia do redesenho do Renovo Hub, que junta as fatias F2 (Início e Mês) e F3 (Escala e Equipe) da auditoria. Decidida com o Gabriel em 12/09/2026. Depende da F1 (componentes) e da F4 (memória do repertório: `recente`, `planejadaEm`, `Catalogo`, `LinhaDeMusica` com `tempo="direita"`, `FolhaDeEscolhaDeEscala`, `semanasDeRepeticao`) concluídas e mergeadas na `main`.

Leitura obrigatória junto: [fundação](2026-09-11-fundacao-da-identidade-design.md), [catálogo](2026-09-11-catalogo-sugestoes-perfil-design.md), a [auditoria](2026-09-10-auditoria-de-usabilidade.md) (Parte 2, Parte 3 E1, E3, E6, E7, Parte 4 D1, D2, Parte 5 V3, tabelas de Início, Mês, Escala e Equipe), `CONTEXT.md`, `docs/handoff-v1.md` (convenções).

## Objetivo

Fazer o Início responder "quando eu toco, com quem e o quê" para o Membro e "o que está faltando" para o Ministro; abrir o Mês para todos com as pendências visíveis; dar à Escala a edição do Item, a memória do repertório e o texto de gente; dar à Equipe a memória de pessoas e o resumo do que falta; e lembrar o Ministro, sem exigir nada, de conferir o que foi tocado.

## Decisões já tomadas (não reabrir)

| Decisão | Escolha | Data |
| --- | --- | --- |
| Escopo além da auditoria | Entram: lembrete pós-culto, memória de pessoas na Equipe, "mudou desde a última visita". Fica de fora: modo culto | 12/09 |
| Pendência de Escala | Mínimo por Função configurável pelo Admin (0 = não cobra), mais "sem ministro" e "sem músicas" | 12/09 |
| Início | Opção B: sua escala primeiro, depois Repertório, pendências e sugestões novas | 12/09 |
| Mês | Opção A: lista do mês, sem grade de calendário e sem alternância | 12/09 |
| Escala, Equipe e edição do Item | Propostas aprovadas em mockup ("fechado") | 12/09 |
| Pós-culto | Continua automático; push às 22:30 do dia e cartão no Início até o fim do dia seguinte à Escala (segunda, para o culto de domingo), sem exigir ação | 11/09 |

## 1. Dados e API

### Migration `0010_minimos_e_atualizacao.sql`

- `funcoes.minimo INTEGER NOT NULL DEFAULT 0`.
- `itens.atualizado_em TEXT` (ISO; nulo para Itens antigos, tratado como "sem mudança").

Migration nova é arquivo novo; as existentes não mudam.

### Pendências (`src/dominio/pendencias.ts`, puro, testado)

`pendenciasDaEscala(m, escala)`, só para Escalas com estado `agendada` (para as demais devolve vazio e `pronta = true`):

- `sem-ministro` quando nenhuma entrada da Equipe tem a marca de Ministro.
- Para cada Função com `minimo > 0`: `falta-funcao` com `quantos = minimo - escalados` quando os Membros da Equipe com essa Função são menos que o mínimo (uma pessoa com duas Funções conta uma vez em cada). Texto: "falta 1 vocal", "faltam 2 vocais" (plural pela contagem; o nome da Função em minúscula).
- `sem-musicas` quando `itens.length === 0`.
- `porGrupo`: para cada Grupo de Funções, `{ grupo, escalados, minimo, faltam: string[] }`, onde `escalados` é o número de pessoas distintas com alguma Função do grupo, `minimo` é a soma dos mínimos do grupo e `faltam` são os nomes das Funções em falta. Texto de resumo com o nome do Grupo em minúscula, o mesmo das seções da Equipe: "vocal 2 de 2", "músicos 3 de 4 · falta bateria", "som 1 de 1"; grupo sem mínimo e sem gente: "som 0". ("Banda" é o nome de uma Formação, não do grupo.)
- `pronta = true` quando não há pendência.

Tipo: `Pendencia = { chave: 'sem-ministro' | 'falta-funcao' | 'sem-musicas'; texto: string; funcaoId?: string }`.

### Presença por Membro (`src/dominio/presenca.ts`)

`presencaDoMembro` já devolve `escalasNoAno`, `ultimaEscala` (data) e `finsDeSemanaSeguidos`. Entra `paradaHaMeses(m, membroId)` = `mesesDesde(ultimaEscala, hoje)` ou `null` quando nunca esteve numa Escala realizada. `GET /api/membros` passa a devolver, por Membro, `presenca: { ultimaVez: string | null; seguidos: number; paradaHaMeses: number | null }`.

### Memória do Item e resumo do Repertório

`ItemApresentado` ganha `memoria: { recente: boolean; ultimaExecucao: ExecucaoApresentada | null; planejadaEm: Planejada[] } | null` (o tipo `Planejada` é o da F4, em `src/dominio/memoria.ts` e `src/api/tipos.ts`; não nasce um segundo) para inteira e trecho (com `planejadaEm` excluindo a própria Escala e usando as funções da F4) e, no Medley, `memoria` por Trecho. Ganha também `atualizadoEm: string | null` e `ministradoPorNome: string | null` (já existe `ministradoPor`).

`EscalaApresentada` ganha `resumoDoRepertorio: { recentes: number; antigas: number; nuncaTocadas: number; total: number }`: `recentes` pelo limite `semanasDeRepeticao`; `antigas` quando a última Execução está há 6 meses ou mais; `nuncaTocadas` sem Execução. Um Item entra em uma categoria só; Medley conta pelos Trechos. Função pura `resumoDoRepertorio(m, escala, semanas)` em `src/dominio/execucoes.ts`.

`EscalaResumida` (lista do Mês e do Início) ganha `pendencias`, `pronta`, `porGrupo` e `minhasFuncoes: string[]` (nomes das Funções da pessoa logada nessa Escala; vazio quando não está).

### `atualizado_em`

Gravado com `agora` ao criar o Item e em todo `PATCH` que mude `tom`, `tipo`, `inicio`, `fim`, `observacao` ou `ministradoPor`, e ao editar Trechos de Medley. Reordenar (`ordem`) não grava. O front usa para a marca "mudou" (seção 2 e 4).

### `PATCH /api/escalas/:id/itens/:itemId`

Passa a aceitar também `tipo` (`inteira` ↔ `trecho`, exigindo `inicio` e `fim` quando vira trecho e apagando-os quando vira inteira; Medley não troca de tipo) e `ministradoPor` (um dos Ministros da Escala, ou nulo para automático; 422 se não for Ministro da Escala). `trechos` já é aceito hoje para Medley; passa a exigir as mesmas músicas na mesma ordem (só Tom e minutagem mudam; 422 se a lista de músicas diferir), o que é uma restrição nova sobre `trocarTrechos`. O push "mudanças na Escala" que já existe (e já cobre Trechos) passa a ser disparado também para `tipo` e `ministradoPor`.

`ministradoPor` também é aceito onde o Item nasce: `POST /api/escalas/:id/itens` já lê pelo `lerMinistradoPor`; `POST /api/sugestoes/:id/promover` hoje ignora o corpo e grava o automático, e passa a ler `ministradoPor` do corpo com a mesma validação.

### Lembrete pós-culto

Tipo novo `pos-culto` em `TipoDeNotificacao`. `src/dominio/datas.ts` ganha `minutosEmBrasilia(agora)` (minutos desde a meia-noite em Brasília, com `hour` e `minute` no `Intl.DateTimeFormat`), porque `horaEmBrasilia` devolve só a hora inteira. Em `worker/push/gatilhos.ts`, gatilho novo executado pelo cron de 15 minutos que já existe (`rodarNotificacoes`): quando `minutosEmBrasilia(agora) >= 22 * 60 + 30` e para cada Escala não cancelada, com pelo menos um Item, com `data === hojeEmBrasilia(agora)`, enfileira para cada Ministro dela um push `{ titulo: 'Todas as músicas de hoje foram tocadas?', corpo: '<nome da Escala> · <N> músicas registradas. Toque para ajustar.', url: caminhoDaEscala(id) }`. Idempotência pelo mecanismo da casa: `jaTeve(db, membroId, 'pos-culto', escalaId)` antes de enfileirar, como `gerarLembretes` faz; nada de coluna nova. Membros sem inscrição de push não recebem nada e não há fallback.

### `GET /api/inicio` (nova, exige Membro)

Devolve numa resposta só:

```
{
  minhaProxima: EscalaApresentada | null,        // próxima agendada em que a pessoa está na Equipe
  proximoCulto: EscalaApresentada | null,        // próxima agendada do ministério, quando diferente de minhaProxima
  pendencias: EscalaResumida[],                  // agendadas nos próximos 28 dias com pronta === false; vazio para quem não dirige
  posCulto: { escalaId, titulo, data, itens: number } | null,  // só para quem dirige; regra abaixo
  anexosPorMusica: Record<string, Anexo[]>,      // das músicas de minhaProxima e proximoCulto
  semanasDeRepeticao: number,
  proximoMesVazio: string | null                 // 'AAAA-MM' do mês corrente ou do seguinte sem nenhuma Escala, para o botão de criar; só para quem dirige
}
```

Regra única de `posCulto`: a Escala não cancelada, com pelo menos um Item, em que a pessoa logada tem a marca de Ministro, com a maior `data` tal que a janela esteja aberta. A janela abre às 22:30 de Brasília do dia da Escala e fecha às 23:59 do dia seguinte (`data + 1`). Escala de domingo aparece domingo à noite e segunda; Santa Ceia de sábado, sábado à noite e domingo. Fora da janela, `null`. Não filtra por estado `realizada`: pelo domínio, a Escala de hoje continua `agendada` até a meia-noite, e o cartão precisa aparecer justamente nessa noite. O front ainda pode escondê-lo antes por aparelho (seção 2). `Inicio.tsx` deixa de fazer as quatro requisições em cascata.

`carregarMinisterio` ganha um filtro por intervalo de datas (`{ de, ate? }`), usado por `GET /api/inicio` com `de = hoje − 60 dias` e teto aberto (as agendadas são poucas e `minhaProxima`, `proximoCulto` e `proximoMesVazio` precisam enxergar qualquer data futura); `FiltroDeEscalas` passa a aceitar `intervalo` além de `mes` e `ids`.

### Funções

`GET /api/funcoes` devolve `minimo`. `POST` e `PATCH /api/admin/funcoes` aceitam `minimo` (inteiro de 0 a 4; 422 fora disso).

### Semente e demonstração

`FUNCOES` em `src/dominio/exemplo.ts` nasce com mínimos: vocal 2, guitarra 1, baixo 1, bateria 1, teclado 0, violão 0, som 1. `dadosDaDemonstracao` hoje recorta `ministerioDeExemplo()`, que tem datas fixas em torno de `2026-09-08`; passa a receber `hoje` (o `scripts/seed.ts` já tem `agora`) e a deslocar todas as datas de exemplo pela diferença entre `hoje` e `2026-09-08`, mantendo os dias da semana (arredondando o deslocamento para múltiplos de 7). O deslocamento é uma função pura exportada de `src/semente/demonstracao.ts`: `dataDeslocada(dataFixa, hoje)`. Os roteiros do smoke que hoje procuram Escalas de demonstração por data fixa (`scripts/fumaca/roteiros.ts`, `REALIZADA_COM_PEDRO`, `REALIZADA_COM_TRECHO`, `escalaPorData(..., '2026-08-23')`; `scripts/fumaca/notificacoes.ts`, `?mes=2026-08` e `'2026-08-30'`) passam a calcular as datas por `dataDeslocada(dataFixa, hojeDoAmbiente())`, que `cenario.ts` já tem; isso entra na fase 1, para o portão "smoke atual verde" da fase 2 valer. Além disso, a demonstração acrescenta uma Escala em `hoje − 1` com a Isa como Ministra e cinco Itens (para o cartão pós-culto), rótulo "Culto de ontem" e horário 19h, para não se confundir com uma fixa deslocada que caia no mesmo dia (o smoke a acha pelo rótulo); uma agendada pronta em `hoje + 3`; e uma com pendência de cada tipo: sem Ministro em `hoje + 5`, falta de Função em `hoje + 10`, sem músicas em `hoje + 12`. Regra para não atrapalhar o smoke, que monta o mês seguinte com `POST /api/escalas/mes` e confere os domingos criados por posição: **nenhuma Escala agendada da demonstração cai num domingo**. As quatro novas, quando o dia calculado for domingo, avançam um dia; as fixas deslocadas que ficarem agendadas (a `e0913`, por exemplo) também avançam para a segunda-feira seguinte quando caírem em domingo de um mês futuro. E o Roteiro 1 do smoke passa a conferir o conjunto de domingos do mês (`criadas` mais as já existentes) em vez de posições fixas em `criadas`. `ministerioDeExemplo()` continua fixo para os testes de domínio. `scripts/fumaca/notificacoes.ts` passa a importar `hojeDoAmbiente` de `cenario.ts` para calcular as datas.

## 2. Início (`Inicio.tsx`)

Dados de `GET /api/inicio`. Ordem, de cima para baixo:

1. `Cabecalho` raiz "Oi, {nome}"; engrenagem para Admin (F1).
2. **Cartão pós-culto** (quando `posCulto` existe e não foi fechado neste aparelho): `Cartao` em `--atencao-suave` com "Ontem: 5 músicas registradas" (ou "Hoje:"), "Tocaram todas? Algum tom mudou?", botão secundário "Ajustar" (abre `/escalas/:id`) e ícone de fechar. Fechar grava `renovo:pos-culto-fechado:<escalaId>` em `localStorage`.
3. **Sua próxima escala** (`minhaProxima`): `Cartao destaque` com o nome, "dom, 13 de set · 18h · em 3 dias" (`formatarDia`, `rotuloDoHorario`, e "hoje", "amanhã" ou "em N dias"), botão "Abrir", e a Equipe em selos: "você: guitarra" (`Selo destaque`), o Ministro com `Selo ministro` ("Isa · ministra"), os demais "Ana vocal" em `neutro`, agrupados por Grupo na ordem Vocal, Músicos, Som. Quando `minhaProxima` é nulo e `proximoCulto` existe: texto "Você não está em nenhuma escala agendada" e o **Próximo culto** no mesmo cartão, sem o selo "você". Quando os dois são nulos: `Vazio` "Nenhuma escala marcada" e, para quem dirige e `proximoMesVazio` existe, botão primário "Criar as escalas de outubro" (`POST /api/escalas/mes`).
4. **Repertório** da Escala mostrada (`minhaProxima` ou `proximoCulto`): título "Repertório de domingo" (dia da semana da Escala) com "▶ Ouvir tudo" à direita (abre a playlist, `FolhaDaPlaylist`); lista de `LinhaDeMusica` em modo leitura com número, Tom em selo à direita, observação com filete, `Selo` "mudou" em atenção quando `atualizadoEm > renovo:escala-vista:<id>`, "Letra" quando há anexo, Medley com Trechos. Sem Itens: "O Ministro ainda não escolheu as músicas". Abrir a Escala grava a visita (seção 4).
5. **Pendências · próximas 4 semanas** (quando `pendencias.length > 0`): título com "Mês ›"; lista com dia grande (`Fraunces`) e dia da semana, nome, e os selos de `pendencias` em atenção. Tocar abre a Escala.
6. **Sugestões novas**: linha "2 sugestões novas · Júlia e Pedro esta semana" quando há Sugestões abertas com `data` posterior a `renovo:sugestoes-vistas-em` (F4), usando `GET /api/sugestoes` que já está em cache; abre `/sugestoes`. Some quando não há.

Somem do Início: o botão "Texto pro WhatsApp" e o botão "Playlist pra ouvir" (vira "Ouvir tudo"). Esqueleto por bloco enquanto carrega; "visto às" da F1 continua.

## 3. Mês (`Mes.tsx`)

Para todos os papéis (a aba já é de todos desde a F1).

- `Cabecalho` raiz: nome do mês em display ("Setembro") com o ano em `dica` ao lado e um chevron; tocar abre folha `SeletorDeMes` com os doze meses em grade, setas de ano e botão "Hoje". Setas de mês anterior e próximo à direita do título. Ação do cabeçalho "+ Nova escala" (quem dirige), abrindo a folha atual com `Campo` e rodapé "Criar".
- **Lista única** do mês em `Cartao`, uma linha por Escala, ordenada por data: dia grande em `Fraunces` e dia da semana em rótulo; nome; `dica` "18h · Isa · 5 músicas" (Ministros por nome; "sem músicas" quando zero); selos: "santa ceia" (`ceia`), "você · guitarra" (`minhasFuncoes`, destaque), "cancelada" (`cancelada`), e para quem dirige "pronta" (`sucesso`) ou as `pendencias` (`atencao`). Realizadas com opacidade 0,55 e sem pendências. A linha de **hoje** entra na posição do dia: quando há Escala hoje, a linha dela ganha a marca "hoje" no dia; quando não há, uma linha fina "10 · qui · nada hoje". Tocar abre a Escala.
- **Mês vazio**: `Vazio` "Nenhuma escala em outubro" e, para quem dirige, botão primário "Criar os 4 domingos de outubro" com um "?" que abre "O segundo domingo nasce Santa Ceia às 8h; os outros, Culto de Domingo às 18h". Mês com Escalas mas com domingos faltando: botão secundário "Criar os 2 domingos que faltam" abaixo da lista.
- Sem "agendada" em selo (F1). O parágrafo de regra some da tela.

## 4. Escala (`Escala.tsx`)

- `Cabecalho` subtela: nome, "dom, 13 de set · 18h", voltar para `/mes`, `Menu` "Mais" para quem dirige com: "Editar data e horário" (folha com dois `Campo`), "Marcar como Santa Ceia" ou "Tirar Santa Ceia" (`PATCH` direto, com aviso), "Marcar como cancelada" (folha de confirmação atual) ou "Desfazer cancelamento". A folha de edição atual com o chip de Santa Ceia some.
- **Registro da visita**: ao abrir, grava `renovo:escala-vista:<id> = agora` depois de renderizar (para a marca "mudou" valer nesta abertura e sumir na próxima).
- **Faixa de estado** abaixo do cabeçalho, em selos: para quem dirige, `pendencias` em atenção ou "equipe completa" e "N músicas" em sucesso, mais "N repetições recentes" em atenção quando `resumoDoRepertorio.recentes > 0`; para o Membro, nada, exceto "cancelada". Escala cancelada: `Cartao` de perigo suave com "Este culto não vai acontecer" e, para quem dirige, "Desfazer". Escala realizada, para quem dirige: `dica` "Já aconteceu. Mudanças aqui corrigem o histórico e não avisam ninguém".
- **Equipe**: título com "Editar" ou "Montar" (quem dirige). `Cartao` com pessoas: inicial em círculo, nome, `Selo destaque` "você" quando for a pessoa, Ministro primeiro com `Selo ministro` ("ministra"/"ministro"), depois por Grupo na ordem das Funções; Funções em `Selo neutro`. Mais de seis: seis e "e mais N ›" que expande. Vazia: "Ninguém escalado ainda".
- **Repertório**: título com contagem e "▶ Ouvir tudo". `LinhaDeMusica` modo leitura com: `Alca` (quem dirige e não cancelada), número, capa tocável, título, artista, Tom em `Selo` à direita, observação com filete, selos de memória em atenção quando valem ("tocada há 13 dias · Marcos" de `memoria.recente`, "também dia 20/09" para cada `planejadaEm`, no máximo duas), "mudou" para quem não dirige, "Letra" quando há anexo, "quem puxa" em `dica` quando a Escala tem mais de um Ministro ("puxa: Isa"), Medley com Trechos e Tom por Trecho. Tocar no Item: quem dirige abre `FolhaDoItem`; Membro abre `/musicas/:id` (no Medley, o Trecho tocado). Abaixo da lista, `dica`: "2 recentes · 2 há mais de 6 meses · 1 nunca tocada" (omitindo as categorias zeradas). Sem Itens: "Nenhuma música ainda".
- **Reordenar** por arrasto continua; correção do caso herdado da F1: durante uma remoção pendente, a linha removida fica no DOM com `hidden` visual mas continua medida pela ordenação, até a remoção efetivar ou ser desfeita.
- **Rodapé fixo** (`RodapeDeAcao`, quem dirige e não cancelada): "Adicionar música" (primário, vai para `/escalas/:id/adicionar`) e "WhatsApp" (secundário, abre `FolhaDoWhatsapp`). O botão "Playlist pra ouvir" do fim da tela some (virou "Ouvir tudo"); os chips "+ Música" e "+ Medley" somem.
- **Medley dentro do adicionar**: em `Adicionar.tsx`, quando o `Catalogo` está em modo escolha com `escalaId`, aparece acima do segmento a linha "Montar um medley ›" que leva a `/escalas/:id/medley` (fluxo atual). `Medley.tsx` não muda além de usar `CamposDoItem` (abaixo) na tela de cada Trecho.

### `FolhaDoItem` (`src/componentes/FolhaDoItem.tsx`, nova)

Abre sobre a Escala, sem navegar. Conteúdo: título e capa pequena; frase de memória em atenção quando vale ("Tocada há 13 dias com o Marcos, em F" e/ou "Também está no dia 20/09 (Marcos)"); `CamposDoItem`; botão "Salvar" (`PATCH` do Item, fecha com aviso "Item salvo"); no fim, "Remover do repertório" em texto de perigo, com remoção pendente e desfazer (padrão da F1). Para Medley: lista dos Trechos, cada um com título, `SeletorDeTom` compacto e `BlocoDeMinutagem`; observação e quem puxa; sem trocar músicas (texto: "Para trocar as músicas, remova e monte de novo").

### `CamposDoItem` (`src/componentes/CamposDoItem.tsx`, novo)

Componente compartilhado entre `FolhaDoItem`, o formulário de `Adicionar.tsx` e a tela de Trecho de `Medley.tsx`. Blocos: **Tom** (`SeletorDeTom` com `sugerido` no último Tom e `original`, maior ou menor, `BuscaNoCifraClub`); **Como** (`Segmento` Inteira ou Trecho, com `BlocoDeMinutagem` quando Trecho; não aparece no Medley); **Quem puxa** (`Segmento` com os Ministros da Escala, padrão o único ou o último escolhido nesta Escala; só quando há mais de um Ministro); **Observação** (`Campo`). Recebe e devolve um `Rascunho` (tipo de `src/escalas/rascunho.ts`, que ganha `ministradoPor`). `corpoDoItem` e `corpoDaPromocao` passam a incluir `ministradoPor`. O texto de situação ("Legado: veio da playlist…") de `Adicionar.tsx` some; no lugar, a mesma frase de memória da folha.

## 5. Equipe (`Equipe.tsx`)

- `Cabecalho` subtela "Equipe", "dom, 13 de set", ação "Pronto" (volta). Tudo salva a cada toque, com aviso: "Ana escalada no vocal", "Ana saiu da equipe", "Isa é a ministra", "Banda escalada: 4 pessoas".
- **Resumo** no topo, em selos a partir de `porGrupo` recalculado a cada toque no front (função pura de `pendencias.ts` aplicada ao estado local): "vocal 2 de 2" (`sucesso`), "músicos 3 de 4 · falta bateria" (`atencao`), "som 1 de 1", "ministra: Isa" (`ministro`) ou "sem ministro" (`atencao`).
- **Lembrete de notificação** (quando alguém escalado não vai receber push: sem inscrição, `push === 0`, ou `silenciado`): `dica` "3 pessoas sem notificação: Ana, Isa, Gabriel" com "Copiar nomes" (aviso "Copiado"). `GET /api/membros` já devolve `push`; passa a devolver `silenciado` também.
- **Seções por Grupo** (Vocal, Músicos, Som): escalados em cima, o resto em ordem alfabética. Cada pessoa: inicial em círculo, nome, ícone `sino-cortado` quando não recebe notificação (toque mostra `dica` "não vai receber aviso pelo app; combine pelo WhatsApp"), linha de memória em `dica`: "última há 3 sem." (`tempoRelativo` de `presenca.ultimaVez`), e em atenção "4 seguidos" quando `seguidos >= 4` ou "parada há 3 meses" quando `paradaHaMeses >= 2`; "nunca escalada" quando `ultimaVez` é nulo. Chips de Função como hoje (`aria-pressed`), "Ministro" em chip próprio para quem tem o papel. Grupo com mais de dez pessoas: `Busca` por nome acima da lista.
- **Formação**: no título de Músicos, "Banda ▾ · Escalar" (o menu lista as Formações; escolher aplica); quando há uma só, o botão diz "Escalar a Banda". Abaixo da seção, "Salvar como formação" em texto, abrindo a folha atual. O parágrafo explicativo some; "?" ao lado abre a explicação.
- O texto "· não recebe notificação" inline sai.

## 6. Mínimo por Função no Admin (`Funcoes.tsx`)

A folha da Função ganha "Mínimo por escala" em `Segmento` de 0 a 4, abaixo do Grupo, com `dica` "0 não cobra". A lista mostra `Selo` "mín. 2" ao lado do nome quando maior que zero. Nada mais muda no Admin.

## 6b. Ajustes nos componentes da F1 e da F4

Mudanças pequenas que esta fatia faz nos componentes existentes, para o plano não descobrir na hora:

- `Cabecalho` raiz aceita, além de `titulo: string`, um `tituloRico?: ReactNode` (o Mês usa para nome em display, ano em `dica` e chevron tocável) e `navegacao?: ReactNode` (as setas de mês).
- `Catalogo` ganha `acima?: ReactNode`, renderizado entre a busca e o segmento (a linha "Montar um medley ›").
- `Segmento` continua genérico em texto; o mínimo por Função usa valores `'0'` a `'4'` convertidos na borda.
- `Selo` ganha a variante `destaque` (texto do tema sobre fundo de texto invertido) para "você: guitarra" e a variante `ministro` (mesmas cores de `ceia`) para a marca de Ministro, em vez de reaproveitar `ceia` pelo nome.
- `LinhaDeMusica`: sem propriedades novas. Os selos de memória e "quem puxa" entram por `selos?` (que já existe), e `aoEscolher?` passa a valer também no modo leitura (a linha inteira chama, a capa continua tocando o vídeo), para a Escala abrir a `FolhaDoItem`. Como no modo escolha da F1, a `Alca` e o que vem em `direita` ficam fora do botão da linha, para arrastar não abrir a folha.

## 7. Textos

Nas telas tocadas, glossário de interface da auditoria: "escala", "equipe", "música", "já tocada", sem "Execução", "Item", "Legado", "Nova", "Função técnica". Estados de vazio dizem a ação. Textos de push novos e alterados ficam em `src/dominio/notificacoes.ts` com teste.

## 8. Fora do escopo

- Modo culto (Início no dia da Escala com Tom grande), registrado para depois.
- Disponibilidade do Membro, letra dentro do app, etiquetas de ocasião.
- Admin além do mínimo por Função (F5); telas fora da casca (F6).
- Confirmação pós-culto que exija ação: o cartão e o push são só lembrete.
- Mudança nas regras de estado da Escala e de Execução (`CONTEXT.md` continua valendo).

## 9. Portões e evidência

`npm run check && npm test` antes de cada commit; `npm run build && npm run smoke` antes de dar a fatia por pronta; verificação visual em 375 px nos dois temas, um print por tela por tema em `.scratch/f23-evidencias/` (ignorado): Início do Membro, Início do Ministro (com cartão pós-culto e pendências), Mês, Escala do Membro, Escala do Ministro, `FolhaDoItem` (inteira e Medley), Equipe, Adicionar (com "Montar um medley"), Funções no Admin. Dezoito prints.

Testes exigidos:

- Domínio: `pendenciasDaEscala` (sem Ministro; mínimo com pessoa em duas Funções; plural; Repertório vazio; `pronta`; `porGrupo`; realizada e cancelada devolvem vazio), `paradaHaMeses` (nunca escalada), `resumoDoRepertorio` (uma categoria por Item, Medley pelos Trechos), `minutosEmBrasilia` (22:29 e 22:30 em UTC−3), gatilho pós-culto (às 22:29 não dispara, às 22:30 dispara; dispara uma vez por Ministro por Escala via `jaTeve`; só Ministros; não para cancelada nem sem Itens), `posCulto` do Início (22:29 do dia não mostra; 22:30 mostra; dia seguinte mostra; dois dias depois não; Escala mais recente vence), agregação de `GET /api/inicio` (minhaProxima vs proximoCulto; pendencias vazias para Membro; `proximoMesVazio`; intervalo de 60 dias), deslocamento de datas de `dadosDaDemonstracao` (dias da semana preservados; Escala em `hoje − 1`), `Rascunho` com `ministradoPor`.
- Rotas (pool de Workers): `GET /api/inicio`; `presenca` e `silenciado` em `GET /api/membros`; `atualizado_em` gravado em cada campo editável e não no reordenar; `PATCH` do Item com `tipo`, `ministradoPor` (422 para não Ministro) e `trechos` (422 com músicas diferentes); `ministradoPor` em `promover`; `minimo` em Funções (422 fora de 0 a 4); `pendencias` e `minhasFuncoes` em `GET /api/escalas?mes=`; push de mudanças para `ministradoPor` e `tipo`; `intervalo` em `carregarMinisterio`.
- Componentes (projeto `dom`): cartão pós-culto fecha por aparelho; marca "mudou" some depois da visita; `FolhaDoItem` mostra "Quem puxa" só com dois Ministros e remove com desfazer; resumo da Equipe recalcula a cada toque; `SeletorDeMes` volta para hoje.
- Smoke: roteiro do Ministro ganha "editar Item pela folha (Tom, trecho, quem puxa), mínimo de Função e pendências no Mês, Início com pós-culto"; roteiro do Membro confere `GET /api/inicio` e `minhasFuncoes`.

## 10. Fases sugeridas para a orquestração

1. **Dados e domínio**: migration 0010, `pendencias.ts`, `paradaHaMeses`, `resumoDoRepertorio`, `memoria` do Item, `atualizado_em`, `minutosEmBrasilia`, `Rascunho.ministradoPor`, textos de push, semente com mínimos e demonstração com datas relativas. Testes de domínio.
2. **API**: `carregarMinisterio` com `intervalo`, `GET /api/inicio`, `presenca` e `silenciado` em membros, campos novos em `EscalaResumida` e `EscalaApresentada`, `PATCH` do Item ampliado, `ministradoPor` em `promover`, `minimo` em Funções, gatilho pós-culto com `jaTeve`. Testes de rota; smoke atual verde.
3. **Início**: tela nova sobre `GET /api/inicio`, cartão pós-culto, "mudou", sugestões novas.
4. **Mês**: lista nova, `SeletorDeMes`, hoje, vazios e criação de domingos.
5. **Escala**: cabeçalho e menu, faixa de estado, Equipe como pessoas, Repertório com memória, `CamposDoItem`, `FolhaDoItem`, rodapé, Medley dentro do adicionar, correção do reordenar durante remoção pendente.
6. **Equipe e Funções no Admin**: resumo, memória de pessoas, Formação compacta, lembrete de notificação, mínimo por Função.
7. **Verificação, smoke e limpeza**: 18 prints, roteiros novos do smoke, remoção do que ficou sem uso (`FolhaDeEdicao` da Escala, botões antigos do Início).

Se a orquestração preferir dois planos, o corte natural é fases 1 a 4 (dados, API, Início, Mês) e 5 a 7 (Escala, Equipe, Admin, verificação); a decisão fica com a sessão que planejar.
