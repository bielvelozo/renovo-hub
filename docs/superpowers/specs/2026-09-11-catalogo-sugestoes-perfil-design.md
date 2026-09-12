# Catálogo, Sugestões e Perfil (F4)

Spec da segunda fatia do redesenho do Renovo Hub, decidida com o Gabriel em 11/09/2026. Depende da F1 (Fundação da identidade visual) concluída e mergeada na `main`: usa os componentes `LinhaDeMusica`, `Capa`, `Selo`, `Botao`, `Busca`, `Segmento`, `Cabecalho`, `Folha`, `Avisos`, `RodapeDeAcao`, `Esqueleto`, `Menu`, `Vazio` e as funções `limparTitulo`, `tempoRelativo`, `formatarDia` definidas em [2026-09-11-fundacao-da-identidade-design.md](2026-09-11-fundacao-da-identidade-design.md).

Leitura obrigatória junto: a [auditoria de usabilidade](2026-09-10-auditoria-de-usabilidade.md), em especial a Parte 1 (memória do repertório), a Parte 3 (E2, E4, E5) e as tabelas "Adicionar música", "Músicas e Música", "Sugestões" e "Perfil"; `CONTEXT.md` (glossário); `docs/handoff-v1.md` (convenções).

## Objetivo

Fazer o catálogo cumprir o trabalho principal do app: mostrar o que faz tempo que não se toca, avisar o que foi tocado há pouco ou já está planejado, e servir isso no mesmo formato em todo lugar em que alguém escolhe música. Junto, dar retorno a quem sugere música e arrumar o Perfil.

## Decisões já tomadas (não reabrir)

| Decisão | Escolha | Data |
| --- | --- | --- |
| Escopo da escolha de música | A F4 entrega o catálogo novo e o aplica na aba Músicas, no Adicionar ao Repertório, no Medley e no Sugerir. A F3 fica com a Escala, a Equipe e o formulário do Item | 11/09 |
| Organização do catálogo | Opção C: segmento **Redescobrir · Recentes · Todas**, abrindo sempre em Redescobrir, em todos os contextos | 11/09 |
| Limite de repetição | 4 semanas por padrão, ajustável pelo Admin | 11/09 |
| Sugestões | Quatro estados: aberta, guardada, aceita, recusada (motivo opcional), com retorno por push a quem sugeriu | 11/09 |
| Perfil | "Fins de semana seguidos" sai da tela e vira "N de 6 fins de semana servidos"; "seguidos" fica na API para a Equipe (F3) | 11/09 |
| Telas | As propostas de Música, Sugestões e Perfil aprovadas em mockup ("perfeito") | 11/09 |

## 1. Memória: dados e regras

Os fatos de memória (recente, planejada, vezes, aba, seção) são calculados no servidor, em `src/dominio/` (puro, testado), e vêm prontos por música na API. O front só agrupa por esses campos, ordena por data ou por título conforme a aba, e aplica busca e o menu Ver sobre a lista já carregada. O agrupamento e a ordenação ficam numa função pura, `agruparCatalogo(musicas, aba, semanas)` em `src/musicas/catalogo.ts`, testada no projeto `workers` do vitest como os testes que já existem ali.

### Configuração

- `semanasDeRepeticao`: inteiro, padrão 4, chave na tabela `configuracoes` (existe desde a migration 0002). Valores aceitos: 2, 4, 6, 8.
- Não entra rota pública de configurações: o front recebe `semanasDeRepeticao` junto com a lista de músicas (seção "API de músicas") e o Painel do Admin usa a rota de Admin. `GET` e `PATCH /api/admin/configuracoes` (existentes) passam a ler e gravar essa chave além de `listaEsqueci`; o `PATCH` vira parcial (cada chave opcional, ao menos uma obrigatória; hoje exige `listaEsqueci`), porque Convites manda só `listaEsqueci` e o Painel mandará só `semanasDeRepeticao`. Valor fora de 2, 4, 6, 8 devolve 422.

### Regras (funções em `src/dominio/execucoes.ts` ou módulo novo `src/dominio/memoria.ts`)

- `recente(m, musicaId, semanas)`: verdadeiro quando a última Execução (inteira ou parcial) está a menos de `semanas × 7` dias de `m.hoje`.
- `planejadaEm(m, musicaId, escalaAtualId?)`: lista das Escalas **agendadas** em que a música é Item (inteira, trecho ou dentro de Medley), excluindo `escalaAtualId` quando informado; cada entrada com `escalaId`, `data`, `titulo`, `ministros` (nomes). Ordenada por data.
- `vezesTocada(m, musicaId)` já existe; entra `vezesTocadaDesde(m, musicaId, meses)`.
- `abaDaMusica(m, musica)`: `'redescobrir'` quando não tem Execução ou a última está a 3 meses ou mais (`mesesDesde >= 3`); `'recentes'` quando a última está a menos de 3 meses. Toda música pertence a exatamente uma das duas; Todas inclui as duas.
- `secaoDaMusica(m, musica)`: `'nunca'` (sem Execução: Legado ou Nova), `'paradas'` (aba redescobrir com Execução) ou `null` (aba recentes). Vem preenchida para toda música, em qualquer contexto.
- Ordem, feita no front a partir dos campos: em Redescobrir, primeiro `nunca` por título normalizado, depois `paradas` da mais antiga para a mais nova (`ultimaExecucao.data` crescente). Em Recentes, as `recente` primeiro, depois as demais, sempre da mais nova para a mais antiga. Em Todas, título normalizado (sem acento, sem maiúscula). A função de normalização já existe em `src/dominio/musica.ts`; passa a ser exportada como `normalizarTexto`.
- `coberturaDoMinisterio(m, musicaId)`: como `cobertura`, mas sobre todos os Membros ativos com Função musical, não sobre uma Escala. Devolve `{ ja, nunca }` com nomes.
- `finsDeSemanaServidos(m, membroId, janela = 6)`: entre os últimos `janela` fins de semana que tiveram Escala Realizada, quantos tiveram a pessoa em alguma Equipe. Devolve `{ servidos, de }`; `de` é o número de fins de semana com Escala encontrados, no máximo `janela`.
- `proximaEscalaDoMembro(m, membroId)`: a primeira Escala agendada, por data, em que a pessoa está na Equipe, com as Funções dela nessa Escala.

### API de músicas

`GET /api/musicas` devolve **uma lista só**, com todas as músicas não arquivadas, e o `Catalogo` a carrega uma vez por abertura: as três abas, as contagens do segmento, a busca e o menu Ver são recortes dessa lista no front. Não existe `?aba=`. Cada música (`MusicaNaLista`) ganha, além do que já devolve: `aba: 'redescobrir' | 'recentes'`, `secao: 'nunca' | 'paradas' | null`, `recente: boolean`, `planejadaEm: { escalaId, data, titulo, ministros: string[] }[]`, `vezesTocada: number`, `vezesEm6Meses: number`, `temLetra: boolean` (calculado com uma consulta agregada em `anexos`, `GROUP BY musica_id`, não uma por música). A resposta passa a ser `{ musicas, semanasDeRepeticao }`, para o `Catalogo` montar a seção "Últimas N semanas" sem outra requisição. O servidor devolve as músicas em ordem estável por título normalizado; a ordem de cada aba é feita no front por `agruparCatalogo`. Os parâmetros `filtro=nova|legado|uma-vez`, `meses=` e `ordem=` são removidos (na fase 3, junto com a troca do front, para as telas antigas não ficarem mandando parâmetros ignorados); `filtro=revisar` (Admin) e `arquivadas=1` (usado pelo preparo do smoke) continuam; `?busca=`, que já existe no servidor e o smoke usa, continua funcionando (o front não o usa; busca com `combinaBusca` na lista carregada). `?escalaId=` passa a ser aceito na lista, para `planejadaEm` excluir a Escala atual. `ordenarPorExecucao` e o tipo `OrdemDoCatalogo` ficam sem uso e são apagados.

`GET /api/musicas/:id` ganha `recente`, `planejadaEm`, `vezesTocada`, `vezesEm6Meses`, `temLetra`, `coberturaDoMinisterio` e mantém `cobertura` quando `escalaId` é informado.

As duas rotas de músicas já carregam o ministério inteiro (com Escalas); o que falta nelas é só ler `semanasDeRepeticao` de `configuracoes`. O apresentador `naListaDeMusicas` é estendido com os campos novos e passa a ser o único lugar que monta `MusicaNaLista`; a rota de Sugestões o reutiliza (seção 4).

### Títulos limpos no banco

Antes do script, `limparTitulo` (F1, `src/dominio/titulo.ts`) precisa virar idempotente: hoje o ramo com separador " - " não remove os sufixos "music", "oficial", "official" do artista, e o ramo sem separador remove, então aplicar duas vezes muda o resultado ("IIR Music" vira "IIR" na segunda passada; `titulo.test.ts` fixa as duas saídas). A F4 faz a remoção de sufixos valer em todos os ramos, ajusta os casos do teste da F1 para o resultado único e acrescenta o teste "aplicar sobre o próprio resultado não muda nada".

Script `scripts/titulos.ts` (`npm run titulos`): para cada música com `revisar = 1`, aplica `limparTitulo(titulo, artista)` e grava `titulo` e `artista`; mantém `revisar = 1` para o Admin conferir. Idempotente (aplicar duas vezes não muda nada). Roda contra o D1 local no `npm run dev` depois da semente, e uma vez contra o remoto no deploy (`npm run titulos -- --remote`, passo do pipeline, com confirmação). A limpeza na exibição da F1 continua como rede de segurança para músicas novas que entrem por link com título cru; ao criar música por link, o servidor passa a gravar o título já limpo e marca `revisar = 1`. Isso vale para `POST /api/musicas` e para `garantirMusica` em `worker/rotas/sugestoes.ts` (que cria música ao promover Sugestão só de link); `criarMusica` em `worker/dados/musicas.ts` ganha o parâmetro `revisar` (hoje fixa 0).

## 2. Componente `Catalogo`

`src/componentes/Catalogo.tsx`. Substitui `EscolhaDeMusica.tsx` e a lista de `Musicas.tsx`.

Propriedades: `modo: 'navegacao' | 'escolha'`, `escalaId?` (para excluir a Escala atual de `planejadaEm`), `permiteYoutube: boolean` (Adicionar, Medley e Sugerir: sim; aba Músicas: não), `aoEscolher?(escolha)`, `aoEscolherSugestao?(sugestao)` (Adicionar mantém a aba de Sugestões abertas como fonte, ver abaixo), `titulo`, `sub` e `aoVoltar` para o cabeçalho quando em subtela (os três chamadores de escolha voltam para lugares diferentes, como hoje).

A `LinhaDeMusica` da F1 mostra o tempo relativo como selo pequeno. O `Catalogo` usa uma variante nova dela, `tempo="direita"`, que move o tempo para a coluna da direita em letra maior ("há 13 dias", "há 1 ano e 2 m.", ou "nunca" com "no app" embaixo) e suprime o selo pequeno. A variante é adicionada em `LinhaDeMusica.tsx` nesta fatia; no mesmo passo, o texto do selo pequeno muda de "nunca tocada" para "nunca tocada no app" (seção 7), sem efeito em Início e Escala, que não passam `ultimaExecucao`.

Estrutura, de cima para baixo:

1. `Busca` única: placeholder "Buscar ou colar um link". Digitar filtra a lista inteira (as três abas de uma vez) com `combinaBusca`; enquanto há texto, o segmento some e a lista mostra os resultados com um cabeçalho "N resultados". Colar um link do YouTube (detectado por `videoIdDoLink`) chama `POST /api/musicas/resolver` e entrega a escolha, como hoje. Sem resultado: `Vazio` com "Nenhuma música com esse nome"; quando `permiteYoutube`, o `Vazio` traz o botão "Buscar 'x' no YouTube", que faz a busca atual (`/api/musicas/buscar`) e lista os achados para escolher.
2. `Segmento` **Redescobrir · Recentes · Todas**, com contagem em cada. Abre em Redescobrir sempre.
3. Menu **Ver** (chip à direita do segmento): Todas, Escolhidas por mim, Escolhidas por outros, Com letra. Filtra a aba atual. "Escolhidas por mim" usa `ultimaExecucao.ministradoPor === eu.id`; "por outros", diferente de mim e não nulo.
4. Lista da aba:
   - **Redescobrir**: seção "Nunca tocada no app · N" mostrando as três primeiras e a linha "Ver todas as N" que expande no lugar; depois "Paradas há 3 meses ou mais · N", completa (regra `mesesDesde >= 3`). Cabeçalhos de seção em Fraunces com contagem em rótulo.
   - **Recentes**: quando há músicas `recente`, primeiro a seção "Últimas N semanas · K" em cor de atenção (N vem de `semanasDeRepeticao`), depois "Últimos 3 meses". Sem seção de alerta quando `K = 0`.
   - **Todas**: alfabética, com cabeçalhos de letra e um índice de letras encostado à direita, tocável, que rola até a letra.
5. Linha: `LinhaDeMusica` com `tempo="direita"`, com o tempo relativo grande à direita ("há 13 dias", "há 1 ano e 2 m.", "nunca" + "no app"), Tom em selo, `Selo` "trecho" quando a última foi parcial, e os selos de alerta em `atencao`: "há 13 dias · Isa" quando `recente`, "no Repertório de dom 20/09 · Marcos" para cada entrada de `planejadaEm` (no máximo duas, depois "+1").

Fonte "Sugestões" dentro do Adicionar: hoje `EscolhaDeMusica` tem abas Catálogo e Sugestões. No `Catalogo`, quando `aoEscolherSugestao` é passado, o menu Ver ganha a opção "Sugestões abertas · N", que troca a lista pelas Sugestões com `estado = 'aberta'` (mesma linha, com quem sugeriu e apoios, e os selos de memória que a API de Sugestões passa a devolver, ver seção 4); escolher navega como hoje para `?sugestao=`.

Esqueleto de linha de música enquanto carrega; erro em `aviso` no lugar da lista.

Aplicação:

- `Musicas.tsx`: cabeçalho raiz "Músicas" e `<Catalogo modo="navegacao" permiteYoutube={false} />`.
- `Adicionar.tsx`: `<Catalogo modo="escolha" escalaId={id} permiteYoutube aoEscolher aoEscolherSugestao />` no lugar de `EscolhaDeMusica`. Também passa a aceitar `?musica=:id` (seção 3).
- `Medley.tsx`: `<Catalogo modo="escolha" escalaId={id} permiteYoutube aoEscolher />`.
- `Sugestoes.tsx` (passo de escolher): `<Catalogo modo="escolha" permiteYoutube aoEscolher />`.

`EscolhaDeMusica.tsx`, `FILTROS`, `ORDENS`, `caminhoDoCatalogo`, `textoDoVazio`, o tipo `FiltroDoCatalogo`, `ordenarPorExecucao` e `OrdemDoCatalogo` são apagados no fim da fase 3.

## 3. Tela da Música (`Musica.tsx`)

**Cabeçalho** subtela: voltar e `Menu` "Mais". Itens, para quem dirige: "Editar título e artista" (folha com dois `Campo`, salva por `PATCH /api/musicas/:id` com `revisar: false`), "Tom original" (folha com `SeletorDeTom`, salva como hoje). Para Admin, ainda: "Arquivar" quando `vezesTocada > 0` ou "Apagar" quando `0`, com confirmação em folha; rotas existentes. O texto de situação ("Legado: veio da playlist…") some.

**Topo**: `Capa grande` tocável; título e artista; selos: Tom sugerido (`tomSugerido`, com "original" quando a origem é o Tom original), "tocada N× em 6 meses" (ou "tocada N×" quando só antes de 6 meses, ou "nunca tocada no app"), "trecho" quando a última foi parcial. Faixa de alerta (fundo `--atencao-suave`, ícone de atenção) com até duas frases: "Tocada há 13 dias, com a Isa." e "Já está no Repertório de dom 20/09 (Marcos)." Só aparece quando uma das duas vale.

**Ações**: três botões secundários em linha: "Ouvir" (abre `link`), "Cifra Club" (abre `cifraClub`), "Letra" (abre o `anexo` mais recente; o botão some sem anexo).

**Histórico**: até cinco Execuções, cada uma com tempo relativo, `Selo` de Tom, quem ministrou, "trecho" quando parcial e `formatarDia`; "Ver todas as N" abre folha com a lista inteira. Sem Execução: `Vazio` curto "Ainda não tocada no app".

**Quem já tocou**: selos com os nomes de `coberturaDoMinisterio.ja` e, em `atencao`, "Nome nunca" para cada um de `nunca`. Some quando a música nunca foi tocada.

**Versões da letra**: quando há mais de um anexo, o menu "Mais" ganha "Versões da letra", que abre folha com a lista de versões (nome, versão, data, tamanho).

**Rodapé fixo** (só para quem dirige): botão primário "Adicionar a uma escala". Abre a folha **"Pra qual escala?"** (componente novo `FolhaDeEscolhaDeEscala`, também usada por Sugestões): lista das Escalas agendadas com `formatarDia`, Ministros e "N músicas"; quando `planejadaEm` contém a Escala, a linha mostra "já está aqui" em `atencao` e fica desabilitada. Escolher navega para `/escalas/:id/adicionar?musica=:musicaId`.

`Adicionar.tsx` passa a aceitar `musica` na query, do mesmo jeito que `sugestao`: busca `/api/musicas/:id?escalaId=` e abre direto o formulário do Item com `escolhaDaMusica`. Para `?sugestao=`, Adicionar deixa de usar `?promovidas=1` (que some) e passa a buscar `GET /api/sugestoes/:id` (rota nova, seção 4), porque a Sugestão que está sendo promovida ainda é `aberta` ou `guardada`. O texto de situação do formulário ("Legado: veio da playlist…") fica como está: é território da F3. Fora isso, nada mais muda em `Adicionar.tsx` além da troca do `Catalogo`.

"Apagar" no menu da Música: a rota já devolve 409 quando a música nunca foi tocada mas está no Repertório de uma Escala agendada; a folha de confirmação só mostra esse erro em `aviso` (o texto da API já diz para tirar da Escala antes). Não oferece "Arquivar", porque arquivar exige Execução e devolveria 422.

Membro vê a mesma tela sem o rodapé e sem os itens de edição do menu.

## 4. Sugestões

### Dados

Migration `0009_sugestoes_estado.sql`: em `sugestoes`, colunas `estado TEXT NOT NULL DEFAULT 'aberta'` (`aberta` | `guardada` | `aceita` | `recusada`), `motivo TEXT NOT NULL DEFAULT ''`, `decidida_em TEXT`, `decidida_por TEXT REFERENCES membros(id) ON DELETE SET NULL`, `escala_id TEXT REFERENCES escalas(id) ON DELETE SET NULL`. Linhas existentes com `promovida_em` preenchido recebem `estado = 'aceita'`, `decidida_em = promovida_em`. `promovida_em` continua sendo gravada por compatibilidade.

`SugestaoApresentada` ganha `estado`, `motivo`, `decididaEm`, `decididaPor: MembroResumido | null`, `escala: { id, data, titulo } | null`. E, para a linha mostrar memória: `musica` passa de `MusicaResumida` para `MusicaNaLista | null`, montada pelo mesmo `naListaDeMusicas` da lista de músicas (todos os campos, inclusive `aba`, `secao`, `vezesEm6Meses` e `temLetra` via a mesma consulta agregada de `anexos`), o que exige que **todas** as rotas que devolvem `SugestaoApresentada` (`GET`, `GET /:id`, `apoiar`, `guardar`, `reabrir`, `recusar`, `promover`) carreguem o ministério com as Escalas e leiam `semanasDeRepeticao`, pelo mesmo `responder` (hoje várias carregam com `{ ids: [] }`); senão, tocar no coração faria os selos de memória sumirem da linha, porque a tela substitui a linha pela resposta.

Transições como função pura em `src/dominio/sugestao.ts`: `transicao(estado, acao)` devolve o estado novo ou `null` quando proibida. Permitidas: `aberta → guardada` (guardar), `guardada → aberta` (reabrir), `aberta | guardada → aceita` (promover), `aberta | guardada → recusada` (recusar). Tudo o mais é proibido, inclusive qualquer saída de `aceita` e `recusada`.

### Rotas (`worker/rotas/sugestoes.ts`)

- `GET /api/sugestoes` devolve todas as Sugestões com `estado`; o front separa. `?promovidas=1` some.
- `GET /api/sugestoes/:id` (nova, Membro): uma Sugestão, para o Adicionar promover.
- `POST /api/sugestoes/:id/promover` (existe) passa a gravar `estado = 'aceita'`, `escala_id`, `decidida_em`, `decidida_por`.
- `POST /api/sugestoes/:id/guardar` (Ministro): `aberta → guardada`.
- `POST /api/sugestoes/:id/reabrir` (Ministro): `guardada → aberta`.
- `POST /api/sugestoes/:id/recusar` (Ministro), corpo `{ motivo?: string }` até 80 caracteres (81 dá 422): `aberta | guardada → recusada`.
- `DELETE /api/sugestoes/:id` (existe): só o autor, só enquanto `aberta`; Admin sempre.
- Transições proibidas devolvem 409.
- `POST /api/sugestoes` (existe): quando já há Sugestão `aberta` da mesma música (`musica_id` igual, ou, para Sugestões só de link, o mesmo `videoId`), devolve 409 com `{ erro, sugestaoId }` para o front oferecer apoiar.

Efeitos colaterais no que já existe: o badge da casca (`Casca.tsx`, `usarContagemDeSugestoes`) hoje conta `sugestoes.length`; passa a contar só `aberta` com `data` posterior à última visita (seção "Badge"). No smoke, a asserção do Roteiro 5 "promover tira a Sugestão do mural" vira "promover muda `estado` para `aceita` e preenche `escala`"; em `scripts/fumaca/membro.ts`, as chamadas a `filtro=legado|nova` e `meses=` e a asserção "o catálogo sai faz-mais-tempo-primeiro" (que dependia da ordem do servidor) são substituídas por asserções sobre `aba`, `secao`, `recente` e `semanasDeRepeticao` na lista única; `filtro=revisar` em `administracao.ts` e `arquivadas=1` em `cenario.ts` ficam.

### Pushes (`worker/push/gatilhos.ts` e `src/dominio/notificacoes.ts`)

Só para quem sugeriu, no momento da transição, com três tipos novos em `TipoDeNotificacao`: `sugestao-aceita`, `sugestao-guardada`, `sugestao-recusada`. Enfileirados pelo mesmo `enfileirar` das notificações atuais, com `escalaId` nulo exceto na aceita.

- `sugestao-aceita`: título "Sua sugestão entrou", corpo "Bondade de Deus no dia dom 20/09", URL da Escala.
- `sugestao-guardada`: "Sua sugestão foi guardada pra depois", corpo com o título da música, URL de Sugestões.
- `sugestao-recusada`: "Sua sugestão não entrou desta vez", corpo com o título e o motivo quando houver, URL de Sugestões.

Apoiar e reabrir não notificam. Quem decide não recebe o próprio push.

### Tela (`Sugestoes.tsx`)

Cabeçalho raiz "Sugestões" com ação "+ Sugerir". `Segmento` **Abertas · N · Guardadas · N · Aceitas · N**.

Linha (`LinhaDeMusica` com `direita`): título limpo e artista (ou o título da Sugestão quando é só link); "Júlia sugeriu · há 3 dias"; observação com filete; selos de memória (Tom, tempo relativo ou "nunca no app", e os alertas de `recente` e `planejadaEm` quando a música está no catálogo); à direita, coração com a contagem de apoios, preenchido quando `apoiei`; tocar no coração apoia ou desapoia (otimista, com aviso de erro). Em Aceitas, no lugar do coração, "entrou em dom 20/09 · Isa"; no fim da lista, "Ver N recusadas" expande as recusadas no lugar, cada uma com "não entrou · motivo" quando houver. Em Guardadas, a linha mostra "guardada há 2 semanas".

Toque na linha: quem dirige abre folha com "Ouvir", "Promover pra uma escala" (abre `FolhaDeEscolhaDeEscala`; escolher navega para `/escalas/:id/adicionar?sugestao=`), "Guardar pra depois" ou "Reabrir" conforme o estado, "Recusar" (abre `Campo` de motivo opcional e botão "Recusar"). Membro: abre a Música quando `sugestao.musica` existe; abre o vídeo quando é só link. Apagar a própria Sugestão aberta: item "Apagar" na folha do autor, com desfazer pendente.

Sugerir: passo 1 `Catalogo` modo escolha; passo 2 tela de envio com `Capa grande`, faixa de alerta de memória quando a música está no catálogo e é `recente` ou `planejadaEm`, `Campo` "Por que essa música?", `RodapeDeAcao` "Enviar sugestão". Se a API devolver 409 de duplicata, a tela troca o botão por "Pedro já sugeriu esta música · Apoiar", que apoia e volta para a lista.

Badge da aba Sugestões (contagem em `Casca.tsx`, exibição em `Abas.tsx`): conta as Sugestões `aberta` com `data` posterior à última visita, guardada em `localStorage` (`renovo:sugestoes-vistas-em`) ao abrir a tela de Sugestões. Vale para todos os papéis; a restrição da F1 (só para quem dirige) cai.

## 5. Perfil (`Perfil.tsx`)

**API** `GET /api/perfil/:id` ganha `proximaEscala: { id, data, titulo, funcoes: string[] } | null` e `finsDeSemanaServidos: { servidos, de }`. Mantém `finsDeSemanaSeguidos` e `escalasNoAno`.

**Tela**: cabeçalho raiz sem título; abaixo, inicial do nome em círculo de `--acento-suave` com a letra em Fraunces, nome em display, selos das Funções (neutro) e do papel (Ministro, Admin em `acento`). Cartão com "Sua próxima escala" (data curta e as Funções, ou "você não está em nenhuma escala agendada") e "Última" (data curta ou "nenhuma ainda"); tocar abre a Escala. Dois cartões de número: "N de M fins de semana servidos" e "N escalas em AAAA". `Segmento` do tema. Lista: "Notificações" com interruptor e estado embaixo (textos de `textoDaSituacao`); tocar no texto abre folha com "Enviar push de teste", "Silenciar tudo / Receber" e "Não receber neste aparelho"; "Instalar na tela inicial" (vai para `/instalar`); "Administração" (só Admin, vai para `/admin`). No fim, "Sair deste aparelho" como botão terciário em `--perigo`, com folha de confirmação "Sair deste aparelho?" e o texto curto "Pra voltar, use o link de convite ou a lista do esqueci".

`Notificacoes.tsx` continua sendo usado por `Instalar.tsx`; o Perfil passa a usar uma versão compacta (`NotificacoesCompactas`) que reaproveita `usarPush`.

## 6. Configuração no Admin (`Painel.tsx`)

O painel do Admin ganha, acima da lista de seções, a linha "Repertório · alerta de repetição: 4 semanas", que abre folha com `Segmento` de 2, 4, 6 e 8 semanas e salva por `PATCH /api/admin/configuracoes`. Aviso "Limite salvo" ao gravar. Nada mais muda no Admin nesta fatia.

## 7. Textos

Nesta fatia, nas telas tocadas, os textos seguem o glossário de interface da auditoria (achado 16): "escala", "equipe", "música", "já tocada em", sem "Execução", "Legado", "Item" nem "Nova" na interface. "Nunca tocada no app" substitui Legado e Nova. Os `Vazio` dizem a ação: "Nenhuma música com esse nome. Cole um link ou busque no YouTube." (quando permitido), "Nenhuma sugestão aberta. Toque em Sugerir para pedir uma música.", "Nada guardado pra depois.", "Nenhuma sugestão aceita ainda.".

## 8. Fora do escopo

- Escala, Equipe, formulário do Item (Tom, trecho, observação, quem puxa), Início, Mês, modo culto, confirmação pós-culto, alerta de repetição dentro do Repertório da Escala (F2 e F3; o dado `recente` e `planejadaEm` já fica pronto na API para elas).
- Admin além da linha de configuração (F5): revisão de músicas com sugestão automática, painel de pendências.
- Etiquetas de ocasião, disponibilidade, letra dentro do app (fora do redesenho).
- Desktop além do que a F1 entregou.

## 9. Portões e evidência

`npm run check && npm test` antes de cada commit; `npm run build && npm run smoke` antes de dar a fatia por pronta; verificação visual das telas tocadas (Músicas, Música, Adicionar, Medley, Sugestões e envio, Perfil, Painel do Admin) em 375 px nos dois temas, com print por tela por tema em `.scratch/f4-evidencias/` (adicionar ao `.gitignore` como a F1 fez com `f1-evidencias`).

Testes novos exigidos:

- Domínio: `recente` nos limites (exatamente `semanas × 7` dias não é recente), `planejadaEm` exclui a Escala atual e inclui Medley, `abaDaMusica` em 3 meses exatos, `agruparCatalogo` (seções, ordem de Redescobrir, Recentes e Todas, contagens), `coberturaDoMinisterio` ignora inativos e Funções técnicas, `finsDeSemanaServidos` com menos de 6 fins de semana com Escala, `proximaEscalaDoMembro`, transições de estado da Sugestão (todas as permitidas e três proibidas), `limparTitulo` idempotente sobre o resultado.
- Rotas (pool de Workers): campos novos de `GET /api/musicas` (`aba`, `secao`, `recente`, `planejadaEm`, `temLetra`) e `/:id`, `GET /api/sugestoes/:id`, `configuracoes` (PATCH parcial só Admin, valores fora de 2/4/6/8 dão 422, `semanasDeRepeticao` refletido em `GET /api/musicas`), `guardar`, `reabrir`, `recusar` (motivo com 81 caracteres dá 422), 409 nas transições proibidas e na duplicata, `promover` gravando `escala_id`, pushes disparados para o autor e não para quem decide, `perfil` com os campos novos, `POST /api/musicas` gravando título limpo.
- Componentes (projeto `dom`): `Catalogo` troca de aba e mantém a busca; busca esconde o segmento; YouTube só com `permiteYoutube`; `FolhaDeEscolhaDeEscala` desabilita a Escala onde a música já está; coração apoia e desapoia; badge conta só as novas.
- Smoke: roteiro novo "sugestões" (sugerir, apoiar, guardar, reabrir, recusar com motivo, promover, conferir `estado` e `escala`), ajuste do Roteiro 5 e do roteiro do Membro conforme a seção 4 ("Efeitos colaterais").

## 10. Fases sugeridas para a orquestração

1. **Dados e domínio**: migration 0009, `configuracoes`, funções de memória, `src/dominio/sugestao.ts`, `finsDeSemanaServidos`, `proximaEscalaDoMembro`, `limparTitulo` idempotente (com ajuste do teste da F1), `scripts/titulos.ts`, título limpo no `POST /api/musicas`. Testes de domínio. Evidência: `npm test` verde, `npm run titulos` idempotente no D1 local.
2. **API**: músicas (lista única `{ musicas, semanasDeRepeticao }` com campos novos; os parâmetros antigos ainda aceitos), sugestões (`GET /:id`, rotas novas, 409, pushes, `musica` como `MusicaNaLista`), perfil, configurações (PATCH parcial). Testes de rota. Evidência: testes verdes; smoke ajustado (Roteiro 5 e Membro) e verde.
3. **`Catalogo`** (com `agruparCatalogo` e a variante `tempo="direita"`) e aplicação em Músicas, Adicionar (com `?musica=`), Medley e Sugerir; remoção de `EscolhaDeMusica`, dos filtros antigos no front e dos parâmetros `filtro=nova|legado|uma-vez`, `meses=`, `ordem=` no servidor. Evidência: testes de componente e de `agruparCatalogo`, prints das quatro telas nos dois temas.
4. **Música** e `FolhaDeEscolhaDeEscala`. Evidência: prints, fluxo "Adicionar a uma escala" percorrido no navegador.
5. **Sugestões**: tela, folhas, envio com duplicata, badge. Evidência: prints, roteiro do smoke novo verde.
6. **Perfil e Painel do Admin**; verificação visual completa; `npm run build && npm run smoke`; passo `npm run titulos -- --remote` antes do deploy, com confirmação.
