# Importação da playlist do YouTube pra Músicas Legado

Ticket: `.scratch/wayfinder-v1/issues/02-importacao-playlist-youtube.md`. Pesquisa feita em 03/09/2026; todos os links abaixo foram acessados nessa data.

## Resumo executivo

1. A playlist `PLMRN_VbzEeFs` chama-se **"Playlist Missão Renovo"**, é do canal **Missão Renovo** (`UCzS-e2NUTKj476luD-PyLhg`, handle `@IgrejaMissãoRenovo`), descrição "Repertório Ministério de Louvor Local", e tem **111 itens** hoje, sendo **101 vídeos únicos** (10 repetidos).
2. O caminho oficial pra ler a playlist inteira é a **YouTube Data API v3, `playlistItems.list`**: 1 unidade de cota por chamada, até 50 itens por página, paginação por `nextPageToken`. A playlist toda custa **3 unidades** de uma cota diária grátis de **10.000**.
3. Pra playlist pública **basta chave de API** (sem OAuth), mas exige projeto no Google Cloud Console com a API habilitada. A chave deve ser restrita (API + aplicativo) e nunca embutida no cliente.
4. O **oEmbed** do YouTube (`youtube.com/oembed`) devolve título, canal e thumbnail de **um vídeo por vez**, sem chave. Pra URL de playlist devolve só os metadados da playlist (título, canal, capa do 1º vídeo), não a lista de itens. Não há doc oficial do Google nem limite publicado.
5. O **RSS** (`feeds/videos.xml?playlist_id=`) funciona sem chave e é ótimo pra checar novidade, mas trouxe **só 15 entradas** de 111. Não serve pra import completo.
6. **yt-dlp** (`--flat-playlist -J`) devolve a playlist inteira com título, canal, duração e thumbnails, sem chave, mas é ferramenta não oficial e a Política de Desenvolvedores do YouTube proíbe scraping. Aceitável no máximo como script único rodado na máquina do Gabriel, nunca dentro do app.
7. Os títulos não seguem um padrão só: 61 usam `" - "`, 50 usam `" | "`, 6 usam `" // "`, 8 usam `" • "` e a ordem Artista/Música varia. O parse automático vai errar; a importação precisa de revisão humana.
8. **11 títulos** têm `+` ou `/` (medley ou música + espontâneo) e **6 vídeos** passam de 15 min (lives com mais de uma música). Esses precisam virar mais de uma Música ou uma Música com Trechos.
9. Deep link com minutagem: `https://youtu.be/<id>?t=90` (segundos) é o que o botão Compartilhar > "Começar em" gera no site e no app do iPhone; no embed o parâmetro oficial é `start=`/`end=` em segundos inteiros. **Spotify não tem** timestamp pra música (só pra episódio de podcast).
10. Thumbnails: a API documenta 5 tamanhos (120×90 a 1280×720); as URLs `https://i.ytimg.com/vi/<id>/{default,mqdefault,hqdefault,sddefault,maxresdefault}.jpg` responderam 200 pros vídeos testados. `hqdefault.jpg` (480×360) é o que o oEmbed e o RSS devolvem e serve de capa.

## Comparativo das fontes

| Fonte | Precisa chave? | Oficial? | Playlist inteira? | Campos por vídeo | Limite |
|---|---|---|---|---|---|
| **Data API v3 `playlistItems.list`** | Sim (chave de API; OAuth só pra dados privados) + projeto Google Cloud | Sim | Sim, paginado (`maxResults` ≤ 50, `nextPageToken`) | `snippet.title`, `snippet.videoOwnerChannelTitle`, `snippet.videoOwnerChannelId`, `snippet.thumbnails.{default,medium,high,standard,maxres}`, `snippet.position`, `snippet.resourceId.videoId`, `contentDetails.videoPublishedAt`, `status.privacyStatus`; **não traz duração** (precisa `videos.list` com `part=contentDetails`, também 1 unidade) | 10.000 unidades/dia; 1 unidade por chamada; reset à meia-noite PT |
| **oEmbed `youtube.com/oembed`** | Não | Endpoint do próprio YouTube, registrado em oembed.com, mas sem doc do Google | Não: 1 vídeo por chamada; URL de playlist devolve só título/canal/capa da playlist | `title`, `author_name`, `author_url`, `thumbnail_url` (hqdefault 480×360), `html` (iframe) | Não publicado |
| **RSS `feeds/videos.xml?playlist_id=`** | Não | Endpoint do YouTube, sem doc oficial encontrada | **Não: 15 entradas** (verificado: 15 de 111) | `title`, `yt:videoId`, `author.name`, `published`, `media:thumbnail` (hqdefault) | 15 itens |
| **yt-dlp `--flat-playlist -J`** | Não | **Não** (projeto comunitário, Unlicense); Política do YouTube proíbe scraping | Sim | `id`, `title`, `uploader`/`channel`, `duration`, `thumbnails`, `playlist_title`, `playlist_count`, `playlist_index`, `webpage_url` | Nenhum formal; quebra quando o YouTube muda o HTML |
| **HTML da página + `ytInitialData`** (o que esta pesquisa usou) | Não | **Não** (scraping) | Sim (100 no HTML + continuação via endpoint interno) | título, canal (`shortBylineText`), duração (`lengthText`), `videoId` | Idem yt-dlp |

## 1. YouTube Data API v3

- **`playlistItems.list`**: "A call to this method has a quota cost of 1 unit." Parâmetro obrigatório `part` (`snippet`, `contentDetails`, `id`, `status`) e um filtro (`playlistId` ou `id`). `maxResults`: "Acceptable values are 0 to 50, inclusive. The default value is 5." Paginação com `pageToken`/`nextPageToken`; `pageInfo` traz `totalResults` e `resultsPerPage`. Fonte: [developers.google.com/youtube/v3/docs/playlistItems/list](https://developers.google.com/youtube/v3/docs/playlistItems/list).
- **Recurso `playlistItem`**: `snippet.title`, `snippet.videoOwnerChannelTitle` (canal que fez upload; `snippet.channelTitle` é o canal dono da playlist, ou seja, "Missão Renovo"), `snippet.position` (base zero), `snippet.resourceId.videoId`, `snippet.thumbnails` com `default` 120×90, `medium` 320×180, `high` 480×360, `standard` 640×480, `maxres` 1280×720; `contentDetails.videoId`, `contentDetails.videoPublishedAt`, `contentDetails.note`; `status.privacyStatus`. Fonte: [developers.google.com/youtube/v3/docs/playlistItems](https://developers.google.com/youtube/v3/docs/playlistItems).
- **Cota**: "Projects that enable the YouTube Data API have a default quota allocation of 100 `search.list` calls, 100 `videos.insert` calls, and 10,000 units per day combined for all other endpoints." `playlistItems.list`, `playlists.list`, `videos.list`, `channels.list` custam 1 unidade cada. Fontes: [getting-started](https://developers.google.com/youtube/v3/getting-started), [determine_quota_cost](https://developers.google.com/youtube/v3/determine_quota_cost).
- **Custo do import**: 111 itens ÷ 50 = 3 chamadas = 3 unidades. Se quiser duração, mais 3 chamadas de `videos.list` (até 50 ids por chamada) = 6 unidades no total. Um re-sync diário custaria o mesmo; sobra cota pra qualquer uso razoável.
- **Chave vs OAuth**: "A request that does not provide an OAuth 2.0 token must send an API key." Requisições sem autorização recuperam só dados públicos, o que é o caso desta playlist. Precisa criar projeto no Google Cloud Console, habilitar a YouTube Data API v3 e gerar credencial em Create credentials > API key. Fontes: [registering_an_application](https://developers.google.com/youtube/registering_an_application), [getting-started](https://developers.google.com/youtube/v3/getting-started).
- **Restrições de chave**: chave de API não autentica ninguém, só associa a requisição ao projeto pra cota e cobrança. "Unrestricted API keys are insecure." Restrições disponíveis: referenciadores HTTP (sites), endereços IP, apps Android, apps iOS; e restrição de API (só YouTube Data API v3). Não embutir a chave em código cliente. Pra um script rodado localmente, restrição por API basta (restrição por IP se o IP for fixo). Fonte: [docs.cloud.google.com/docs/authentication/api-keys](https://docs.cloud.google.com/docs/authentication/api-keys).
- **Política de dados**: dados não autorizados obtidos pela API podem ficar armazenados por até 30 dias; depois "must either delete or refresh". Isso afeta o que o app guarda (título, canal, thumbnail URL): estritamente, precisaria re-buscar a cada 30 dias. Na prática o catálogo do app vira dado do ministério (o Ministro edita título/artista), mas vale registrar o risco. A política também proíbe scraping: "You must not use any technology other than YouTube API Services to access or retrieve API Data." Fonte: [developer-policies](https://developers.google.com/youtube/terms/developer-policies).
- **Thumbnail fora do player**: a única regra encontrada nos Requisitos Mínimos é "Any YouTube thumbnail that initiates a playback must be at least 120 pixels wide and 70 pixels tall." Não achei proibição de usar thumbnail como capa linkando pro YouTube. Fonte: [required-minimum-functionality](https://developers.google.com/youtube/terms/required-minimum-functionality).

## 2. oEmbed

- Spec oEmbed: resposta tem `type` e `version` obrigatórios; `title`, `author_name`, `author_url`, `provider_name`, `thumbnail_url`, `thumbnail_width`, `thumbnail_height` opcionais; `html`, `width`, `height` obrigatórios pro tipo `video`. Erros: 404 (sem resposta pra URL), 401 (recurso privado), 501 (formato não suportado). A spec não prevê autenticação. Fonte: [oembed.com](https://oembed.com/).
- O YouTube está registrado em [oembed.com/providers.json](https://oembed.com/providers.json) com endpoint `https://www.youtube.com/oembed` e schemes `https://*.youtube.com/watch*`, `https://youtu.be/*`, `https://*.youtube.com/playlist?list=*`, `https://*.youtube.com/shorts*`, `https://*.youtube.com/embed/*`, `https://*.youtube.com/live*`.
- **Vídeo** (`?url=https://www.youtube.com/watch?v=hRJUcvsnqKs&format=json`, testado): `title` "Meia Noite (Ao Vivo) | fhop music", `author_name` "Fhop Music", `author_url` `https://www.youtube.com/@fhopmusic`, `thumbnail_url` `https://i.ytimg.com/vi/hRJUcvsnqKs/hqdefault.jpg` (480×360), `html` com iframe. Sem chave, HTTP 200.
- **Playlist** (`?url=https://www.youtube.com/playlist?list=PLMRN_VbzEeFs&format=json`, testado): `title` "Playlist Missão Renovo", `author_name` "Missão Renovo", `author_url` `/@IgrejaMiss%C3%A3oRenovo`, `thumbnail_url` do 1º vídeo (`0qTF7saPK7o`), `html` com `embed/videoseries?list=PLMRN_VbzEeFs`. **Não devolve os itens.**
- ID inválido devolve HTTP 400 (testado).
- Não há documentação do Google pro endpoint (busca em developers.google.com não retornou nada) nem limite publicado. Uso razoável: validar/enriquecer um link colado pelo Membro (Sugestão, cadastro manual de Música) no momento do cadastro, uma chamada por vídeo. 101 chamadas seguidas num import único também deve passar, mas sem garantia.

## 3. Alternativas sem chave pra import único

**RSS/Atom**: `https://www.youtube.com/feeds/videos.xml?playlist_id=PLMRN_VbzEeFs`. Devolveu título do feed, autor (`Missão Renovo`, URI do canal `UCzS-e2NUTKj476luD-PyLhg`), e **15 `<entry>`** com `title`, `yt:videoId`, `author.name` (canal do vídeo), `published` (data de publicação do vídeo, não da adição à playlist) e `media:thumbnail` hqdefault. O teto de 15 não está documentado pelo Google (a Ajuda do YouTube não tem artigo sobre RSS acessível); é comportamento observado e amplamente relatado. Serve pra detectar vídeo novo na playlist, não pra importar tudo.

**yt-dlp**: `yt-dlp --flat-playlist -J "https://www.youtube.com/playlist?list=PLMRN_VbzEeFs"`. README: `--flat-playlist` "Do not extract a playlist's URL result entries; some entry metadata may be missing and downloading may be bypassed"; `-J` "print JSON information for each URL or infojson passed". Campos: `id`, `title`, `uploader`, `channel`, `duration`, `thumbnails`, `playlist_title`, `playlist_count`, `playlist_index`, `webpage_url`. Licença Unlicense. Fonte: [README do yt-dlp](https://raw.githubusercontent.com/yt-dlp/yt-dlp/master/README.md). Não estava instalado nesta máquina; não testei. Prós: um comando, sem conta Google, traz duração. Contras: não oficial, viola a Política de Desenvolvedores se o resultado for usado com dados da API, quebra sem aviso.

**HTML + `ytInitialData`** (usado aqui pra contar): a página da playlist embute JSON com os primeiros 100 `playlistVideoRenderer` (`videoId`, `title`, `shortBylineText`, `lengthText`) e um `continuationCommand`; a continuação vem de um POST ao endpoint interno `/youtubei/v1/browse`. Mesmos contras do yt-dlp, com mais trabalho.

## A playlist hoje (03/09/2026)

- **Título**: Playlist Missão Renovo. **Descrição**: "Repertório Ministério de Louvor Local". **Canal**: Missão Renovo (`UCzS-e2NUTKj476luD-PyLhg`, `@IgrejaMissãoRenovo`).
- **Contagem**: 111 itens (o HTML mostra "111 vídeos"; coletei 100 + 11 da continuação). **101 vídeos únicos**; 10 aparecem duas vezes: `pXQRyiSZ8mQ`, `kJ9Yy-YGTNo`, `s1oU-6vYc4E`, `Yo9G3hvl_UI`, `FKKytz49Fhg`, `hRJUcvsnqKs`, `YXnQ02HYB1w`, `CmM1pcHohdI`, `7GWZwO0MdsY`, `2anDhu7L-Cc`. Deduplicar por `videoId` é obrigatório.
- **Canais mais frequentes**: Fhop Music 23, drops 8, Dunamis Music 6, Nívea Soares 6, Som do Reino 5, ONE Sounds 4, Central MSC 4, MORADA 4.
- **Rótulos**: 69 títulos mencionam "Ao Vivo"/"Live"; 12 mencionam "Clipe Oficial".

### Amostra de títulos (15 primeiros, com canal e duração)

| # | Título | Canal | Duração |
|---|---|---|---|
| 1 | Permanecerei - Eric & Evellyn Emerick | ONE Sounds | 6:32 |
| 2 | Ambição - Gabi Sampaio, SOM DO CÉU | Gabi Sampaio e SOM DO CÉU | 16:59 |
| 3 | Fez Um Caminho (Ao Vivo) - IIR Music e Rafael Faleiro | IIR Music e Rafael Faleiro | 11:32 |
| 4 | Como Não Te Amar - Gabi Sampaio, Lucas Magno & SOM DO CÉU | Gabi Sampaio e mais 2 | 11:54 |
| 5 | Em Teus Braços - Laura Souguellis // Fornalha Dunamis - Março 2015 | Dunamis Music | 12:24 |
| 6 | Nívea Soares - Rio (Ao Vivo) | Nívea Soares | 8:32 |
| 7 | Grato Sou (I Thank God) - Ao vivo • DROPS | drops | 4:52 |
| 8 | Firme Fundamento (Ao Vivo) - Central MSC feat. Ana Paula Rocha, Henrique Rocha | Central MSC | 6:48 |
| 9 | Meia Noite (Ao Vivo) \| fhop music | Fhop Music | 3:45 |
| 10 | Tu és + Águas Purificadoras (Ao Vivo) \| Fhop Music | Fhop Music | 7:57 |
| 11 | Bendito É O Rei (Ao Vivo) \| Fhop Music | Fhop Music | 5:27 |
| 12 | Sublime (Ao Vivo) \| fhop music | Fhop Music | 9:41 |
| 13 | Dono da Minha Afeição (Ao Vivo) \| fhop music | Fhop Music | 5:58 |
| 14 | Volto Os Meus Olhos + Vem Derrama // Dunamis Sounds | Dunamis Music | 7:04 |
| 15 | Santo Espírito - Laura Souguellis // Fornalha Dunamis - Março 2015 | Dunamis Music | 9:14 |

A lista completa dos 111 itens está no anexo no fim deste arquivo.

### Padrões observados (pra o ticket 10, "Regras de importação")

- **Separadores**: `" - "` em 61 títulos, `" | "` em 50, `" // "` em 6, `" || "` em 2, `" • "` em 8 (todos do canal drops), 8 sem nenhum dos três primeiros. Vários títulos usam dois ou três separadores ao mesmo tempo.
- **Ordem não é fixa**: "Música - Artista" (ex. "Permanecerei - Eric & Evellyn Emerick"), "Artista - Música" (ex. "Nívea Soares - Rio (Ao Vivo)", "GABRIELA ROCHA - A ELE A GLÓRIA"), "Música | Artista" (Fhop na maioria) e "Artista | Música" ("fhop music | HERDEIRO DE TUDO + PORQUE ELE VIVE"). Nenhuma heurística por separador resolve sozinha; usar o canal (`videoOwnerChannelTitle`) como candidato a artista e comparar com os lados do título ajuda (ex. se um lado contém o nome do canal, o outro é a música).
- **Ruído a remover**: "(Ao Vivo)", "(AO VIVO)", "(Live)", "(Clipe Oficial)", "(CLIPE OFICIAL)", "(LETRA/LEGENDADO)", "(Legendado)", "[Oficial]", "(OVERMISSION 2025)", "(LIVE AT HOME VI)", "(Conferência JesusCopy 24')", "Ministração Ao Vivo", "Ao Vivo na CEIZS", "Camp Session Portugal", "Som do Secreto Vol.2 | Som do Reino | 04", "DVD FornalhaOficial", "- Março 2015", `@MarsenaOficial`, CAIXA ALTA em ~15 títulos.
- **Medley / mais de uma música (11 títulos)**: "Tu és + Águas Purificadoras", "Volto Os Meus Olhos + Vem Derrama", "Há Poder + Espontâneo", "Pardal + Espontâneo", "HERDEIRO DE TUDO + PORQUE ELE VIVE", "AH, JESUS / CORAÇÃO IGUAL AO TEU", "Só Quero Ver Você + There is Only One", "Quebro Meu Vaso - André Aquino + Luma Elpídio" (aqui o `+` junta artistas, não músicas), "UNIDOS EM FÉ | fhop music + Upstream Quest" (idem), "Som do Reino + TOMATULUGAR" (idem). Ou seja, `+` é ambíguo: 7 medleys reais, 3 uniões de artistas. "Espontâneo" não é música do catálogo.
- **Lives longas (≥ 15 min, 6 vídeos)**: "Ambição" 16:59, "Em teus braços (OVERMISSION 2025)" 21:20, "Som do Secreto Vol.3 - Cristo" 15:57, "Fez um caminho para mim (Juliano Son) | Fhop - Páscoa" 22:41, "Ao Que Está Assentado Sobre o Trono" 16:31, "Tudo Que Eu Tenho (LIVE AT HOME VI)" 23:09. Provavelmente contêm mais de uma música ou momentos espontâneos; candidatos a Trechos com minutagem. Duração só vem via `videos.list` (`contentDetails.duration`) ou yt-dlp, não via `playlistItems.list`, oEmbed ou RSS.
- **Mesma música, gravações diferentes**: "Em Teus Braços" (Dunamis 2015 e OVERMISSION 2025), "Fez Um Caminho" (IIR e Fhop Páscoa). A premissa "uma música, um vídeo" exige escolher a versão de referência; a outra vira descarte ou 2ª Música.
- **Não parece haver vídeo que não seja música** na amostra completa; todos são louvores.

## 4. Deep links com minutagem

- **Player embutido (oficial)**: `start` "causes the player to begin playing the video at the given number of seconds from the start of the video. The parameter value is a positive integer"; `end` "specifies the time, measured in seconds from the start of the video, when the player should stop playing the video". Ex.: `https://www.youtube.com/embed/<id>?start=90&end=150`. Playlist no embed: `https://www.youtube.com/embed?listType=playlist&list=PL...`. Fonte: [player_parameters](https://developers.google.com/youtube/player_parameters). A Ajuda confirma "add '?start=' to a video's embed code, followed by the time in seconds" ([answer/171780](https://support.google.com/youtube/answer/171780)).
- **Link de compartilhamento**: a Ajuda descreve o recurso "Start at" no computador ("check this box and enter the start time before you copy the link... enter '2:30'") e no iPhone/iPad ("Toggle on the 'Minute : Second' bar... turn on the '2:30' toggle"), mas **não documenta o formato da URL** gerada. Fontes: [answer/57741 (Computer)](https://support.google.com/youtube/answer/57741?hl=en), [answer/57741 (iOS)](https://support.google.com/youtube/answer/57741?co=GENIE.Platform%3DiOS&hl=en).
- **Formato de fato** (verificado): `https://youtu.be/<id>?t=90` redireciona (HTTP 303) pra `https://www.youtube.com/watch?t=90&v=<id>&feature=youtu.be`, e a página de `watch?v=<id>&t=90s` embute `"startSeconds":90` no player. Tanto `t=90` quanto `t=90s`/`t=1m30s` são aceitos na prática; o mais seguro pra gerar é **inteiro em segundos**: `https://www.youtube.com/watch?v=<id>&t=<segundos>` ou `https://youtu.be/<id>?t=<segundos>`. Não há `end` no link de watch; só no embed.
- **iPhone**: a Ajuda pra iOS confirma que o app gera e consome links com "Começar em". Que um `t=` aberto a partir do PWA abra o app no ponto certo é comportamento esperado (universal link), mas **não encontrei doc oficial** afirmando isso; testar no aparelho.
- **Spotify**: a API de Track expõe só `external_urls.spotify` (`https://open.spotify.com/track/<id>`) e `uri` (`spotify:track:<id>`), sem parâmetro de posição ([get-track](https://developer.spotify.com/documentation/web-api/reference/get-track)). O recurso de timestamp do Spotify existe **só pra podcasts**: "you can now share podcast episodes beginning at a particular moment" ([newsroom, 10/05/2021](https://newsroom.spotify.com/2021-05-10/3-new-ways-to-share-the-music-and-podcasts-you-love-on-social/)); a página de compartilhamento não menciona timestamp pra músicas ([share-from-spotify](https://support.spotify.com/us/article/share-from-spotify/)). Conclusão: Trecho com minutagem só faz sentido com o link do YouTube; o link do Spotify fica como referência da música inteira.

## 5. Thumbnails

- **Tamanhos documentados pela API** (recurso `video.snippet.thumbnails`): `default` 120×90, `medium` 320×180, `high` 480×360, `standard` 640×480, `maxres` 1280×720. Fonte: [docs/videos](https://developers.google.com/youtube/v3/docs/videos). `standard` e `maxres` nem sempre existem (a API só inclui as chaves disponíveis).
- **URLs de fato** (testadas em `0qTF7saPK7o` e `hRJUcvsnqKs`, todas HTTP 200): `https://i.ytimg.com/vi/<id>/default.jpg` (120×90), `mqdefault.jpg` (320×180), `hqdefault.jpg` (480×360), `sddefault.jpg` (640×480), `maxresdefault.jpg` (1280×720), `hq720.jpg` (mesmo binário do maxres), `0.jpg` (mesmo binário do hqdefault), `1.jpg`/`2.jpg`/`3.jpg` (frames pequenos). Também `https://i.ytimg.com/vi_webp/<id>/hqdefault.webp`. Esse padrão de URL **não é documentado** pelo Google; a forma oficial é ler `snippet.thumbnails.*.url` da API, que aponta pros mesmos caminhos. oEmbed e RSS devolvem `hqdefault.jpg` (o RSS usa hosts `i1..i4.ytimg.com`, equivalentes).
- **Recomendação de capa**: guardar só o `videoId` e montar `hqdefault.jpg` (480×360, 4:3 com barras) pra lista e `maxresdefault.jpg` com fallback pra `hqdefault.jpg` pra tela da Música. `hqdefault` e `mqdefault` existem pra todo vídeo; `maxresdefault`/`sddefault` podem dar 404 em vídeos antigos ou de baixa resolução.

## Recomendação

**Import único pela Data API v3** (script Node/TS rodado uma vez na máquina do Gabriel, não no app):

1. Criar projeto no Google Cloud, habilitar YouTube Data API v3, gerar chave restrita à API (ticket 11). Chave em `.env.local`, fora do git.
2. `GET playlistItems.list?part=snippet,contentDetails&playlistId=PLMRN_VbzEeFs&maxResults=50` com `pageToken` até acabar (3 chamadas). Guardar `videoId`, `title`, `videoOwnerChannelTitle`, `position`, `thumbnails.high.url`, `privacyStatus`.
3. `GET videos.list?part=contentDetails&id=<50 ids>` pra `duration` (3 chamadas). Total 6 unidades.
4. Deduplicar por `videoId` (111 → 101). Marcar como suspeitos: `+`/`/` no título, duração ≥ 12 min, `privacyStatus` ≠ `public`.
5. Gerar CSV/JSON com colunas `videoId, tituloOriginal, canal, duracao, tituloSugerido, artistaSugerido, suspeito, observacao` aplicando as heurísticas do ticket 10. **O Gabriel revisa a planilha inteira antes de virar catálogo** (101 linhas é uma noite de trabalho); só depois o seed entra no banco como Legado.
6. Persistir na Música: `videoId`, título e artista revisados, `thumbnailVideoId` (capa derivada, não a URL), posição original na playlist.

Por que a API e não yt-dlp: mesmo custo de esforço, mas fica dentro da Política do YouTube, e a chave criada serve depois pro app validar links colados. Por que não oEmbed pro import: não lista a playlist. Por que não RSS: 15 itens.

**Depois do import**: a playlist deixa de ser fonte da verdade; o catálogo passa a ser mantido no app (Sugestão → Item → Música). Se o ministério continuar alimentando a playlist, duas opções baratas:
- **Manual**: o Ministro cola o link do vídeo novo no app; o app chama oEmbed (sem chave, no cliente ou numa function) pra preencher título/canal/thumbnail e o Ministro ajusta. Recomendado pra v1.
- **Re-sync semi-automático**: uma function agendada lê o RSS da playlist (sem chave, 15 itens mais recentes) e cria Sugestões pendentes pros `videoId` desconhecidos, sem tocar nas Músicas já revisadas. Cobre o caso "adicionaram na playlist e esqueceram do app". Fica pra depois da v1.

**Riscos**:
- Parse automático erra a ordem Artista/Música em parte dos títulos; sem revisão humana o catálogo nasce sujo.
- 30 dias de retenção de dados da API (Política): como título/artista viram dados editados do ministério e a capa é derivada do `videoId`, o risco é baixo, mas o app não deve guardar cópias de `description`/estatísticas.
- Vídeos podem ser removidos ou ficar privados; a Música precisa sobreviver sem o vídeo (título/artista próprios) e a capa cair num placeholder quando a thumbnail der 404.
- oEmbed sem doc nem SLA: usar só em ação do usuário, uma chamada por vez, com fallback pra preenchimento manual.
- yt-dlp/scraping no app: não fazer.

## O que não foi confirmado em fonte primária

- Limite de 15 itens do RSS: só observado (15 de 111), sem doc do Google.
- Formato `?t=` do link de compartilhamento: só observado (redirect do youtu.be e `startSeconds` no player); a Ajuda descreve o recurso mas não a URL.
- Que um link `t=` abre o app do YouTube no iPhone no ponto certo: não encontrado; testar no aparelho.
- Limite de uso e status oficial do oEmbed do YouTube: não há doc do Google; só o registro em oembed.com e teste empírico.
- Padrão de URL `i.ytimg.com/vi/<id>/*.jpg`: só observado; a doc oficial descreve tamanhos, não caminhos.
- yt-dlp não foi executado (não instalado); campos citados vêm do README.
- Contagem "111 vídeos" e títulos vieram do HTML da playlist (scraping pontual, só pra esta pesquisa), não da API; a API pode divergir se houver vídeo privado/removido (`privacyStatus`).

## Fontes

- https://developers.google.com/youtube/v3/docs/playlistItems/list (03/09/2026)
- https://developers.google.com/youtube/v3/docs/playlistItems (03/09/2026)
- https://developers.google.com/youtube/v3/docs/videos (03/09/2026)
- https://developers.google.com/youtube/v3/getting-started (03/09/2026)
- https://developers.google.com/youtube/v3/determine_quota_cost (03/09/2026)
- https://developers.google.com/youtube/registering_an_application (03/09/2026)
- https://developers.google.com/youtube/terms/developer-policies (03/09/2026)
- https://developers.google.com/youtube/terms/required-minimum-functionality (03/09/2026)
- https://developers.google.com/youtube/player_parameters (03/09/2026)
- https://docs.cloud.google.com/docs/authentication/api-keys (03/09/2026)
- https://support.google.com/youtube/answer/57741 (Computer e iOS) (03/09/2026)
- https://support.google.com/youtube/answer/171780 (03/09/2026)
- https://oembed.com/ e https://oembed.com/providers.json (03/09/2026)
- https://www.youtube.com/oembed?url=... (vídeo e playlist, testado 03/09/2026)
- https://www.youtube.com/feeds/videos.xml?playlist_id=PLMRN_VbzEeFs (03/09/2026)
- https://www.youtube.com/playlist?list=PLMRN_VbzEeFs (HTML, 03/09/2026)
- https://raw.githubusercontent.com/yt-dlp/yt-dlp/master/README.md (03/09/2026)
- https://developer.spotify.com/documentation/web-api/reference/get-track (03/09/2026)
- https://newsroom.spotify.com/2021-05-10/3-new-ways-to-share-the-music-and-podcasts-you-love-on-social/ (03/09/2026)
- https://support.spotify.com/us/article/share-from-spotify/ (03/09/2026)

## Anexo: os 111 itens da playlist em 03/09/2026

Posição, `videoId`, título original, canal do vídeo e duração, na ordem da playlist.

| # | videoId | Título original | Canal | Duração |
|---|---|---|---|---|
| 1 | `0qTF7saPK7o` | Permanecerei - Eric & Evellyn Emerick | ONE Sounds | 6:32 |
| 2 | `8aCWzCKlIlI` | Ambição - Gabi Sampaio, SOM DO CÉU | Gabi Sampaio e SOM DO CÉU | 16:59 |
| 3 | `pXQRyiSZ8mQ` | Fez Um Caminho (Ao Vivo) - IIR Music e Rafael Faleiro | IIR Music e Rafael Faleiro | 11:32 |
| 4 | `kJ9Yy-YGTNo` | Como Não Te Amar - Gabi Sampaio, Lucas Magno & SOM DO CÉU | Gabi Sampaio e mais 2 | 11:54 |
| 5 | `IxpWNuxGmzc` | Em Teus Braços - Laura Souguellis // Fornalha Dunamis - Março 2015 | Dunamis Music | 12:24 |
| 6 | `s1oU-6vYc4E` | Nívea Soares - Rio (Ao Vivo) | Nívea Soares | 8:32 |
| 7 | `Yo9G3hvl_UI` | Grato Sou (I Thank God) - Ao vivo • DROPS | drops | 4:52 |
| 8 | `FKKytz49Fhg` | Firme Fundamento (Ao Vivo) - Central MSC feat. Ana Paula Rocha, Henrique Rocha | Central MSC | 6:48 |
| 9 | `hRJUcvsnqKs` | Meia Noite (Ao Vivo) \| fhop music | Fhop Music | 3:45 |
| 10 | `YXnQ02HYB1w` | Tu és + Águas Purificadoras (Ao Vivo) \| Fhop Music | Fhop Music | 7:57 |
| 11 | `CmM1pcHohdI` | Bendito É O Rei (Ao Vivo) \| Fhop Music | Fhop Music | 5:27 |
| 12 | `7GWZwO0MdsY` | Sublime (Ao Vivo) \| fhop music | Fhop Music | 9:41 |
| 13 | `2anDhu7L-Cc` | Dono da Minha Afeição (Ao Vivo) \| fhop music | Fhop Music | 5:58 |
| 14 | `q-xrKrybvmc` | Volto Os Meus Olhos + Vem Derrama // Dunamis Sounds | Dunamis Music | 7:04 |
| 15 | `J2rTdu7vqTE` | Santo Espírito - Laura Souguellis // Fornalha Dunamis - Março 2015 | Dunamis Music | 9:14 |
| 16 | `hQzS_NRmO8w` | Isaías 6 - Ministério Morada (Legendado) | Igreja do Nazareno Central de Mirassol (Nazareno Mirassol Oficial) | 7:37 |
| 17 | `ov-Dr9qSGCU` | Doce Presença | Alessandro Vilas Boas | 2:40 |
| 18 | `ERsqk3w25A4` | À Espreita de Ti - Emanuelle Carvalho e Henrique Machado (LIVE AT HOME VI) | ONE Sounds | 13:28 |
| 19 | `XRB1MZVgGnE` | Preciso de Ti (Ao Vivo) - Diante do Trono, Ana Paula Valadão | Diante do Trono | 6:25 |
| 20 | `BiXBpWz2sP0` | Alessandro Vilas Boas CONVIDA Henrique Machado \| DESEJO ETERNO | Alessandro Vilas Boas e Henrique Machado | 14:37 |
| 21 | `gS0Y4ID0HbY` | TU ÉS DEUS (A ELE) - O Canto das Igrejas, Paulo Cesar Baruk, Lucas & Evelyn Cortazio | O CANTO DAS IGREJAS e mais 2 | 5:08 |
| 22 | `7j5aLkEe_vE` | Vineyard - Vem, Esta é a Hora (Come, Now Is The Time To Worship) - Ao Vivo | Musile Records | 5:13 |
| 23 | `6v9i3YVSHIY` | Relevans Worship Moments \|\| Abra os Olhos do Meu Coração \| Léo Schiappadini | Relevans | 8:49 |
| 24 | `ENW5PIXKb_E` | Exaltamos Yahweh | Fhop Music | 5:05 |
| 25 | `L3b2gRB7YVc` | É Ele (Ao Vivo) • DROPS | drops | 8:16 |
| 26 | `4WmlJFsxDv4` | Há Poder + Espontâneo (Ao Vivo) \| fhop music | Fhop Music | 10:28 |
| 27 | `7eujlWBhS5Y` | Som do Secreto Vol.2 \| Som do Reino \| 04 \| Para Que Entre o Rei \| Brunão Morada | Som do Reino | 6:12 |
| 28 | `SyUKh4z1Xn4` | Pardal + Espontâneo (Ao Vivo) • DROPS, Nívea Soares | drops | 12:40 |
| 29 | `-JcxXQbqfns` | Senhor Tu És Bom \| Comunidade Zona Sul \| Ao Vivo na CEIZS | CEIZS | 4:30 |
| 30 | `EqTai69cQU4` | UPPERROOM \| Abra o Livro (Live In Brazil) [feat. Laura Souguellis] | UPPERROOM Latinoamérica e mais 2 | 10:48 |
| 31 | `Kh14SNPaHco` | Só tu és Santo - Morada (Ao Vivo) | MORADA | 6:27 |
| 32 | `hm210FfEVbk` | Fé (Ao Vivo) \| fhop music | Fhop Music | 3:46 |
| 33 | `9p3qBC3VotM` | GABRIELA ROCHA - A ELE A GLÓRIA (CLIPE OFICIAL) | Gabriela Rocha | 7:19 |
| 34 | `VhdAZ2aQtBk` | Holy Forever (Live) - Bethel Music, Jenn Johnson, feat. CeCe Winans | Bethel Music e Jenn Johnson | 10:44 |
| 35 | `pXQRyiSZ8mQ` | Fez Um Caminho (Ao Vivo) - IIR Music e Rafael Faleiro | IIR Music e Rafael Faleiro | 11:32 |
| 36 | `ye9caqETC0A` | Paulo Cesar Baruk, @MarsenaOficial  - Clamo Jesus (I Speak Jesus) | Baruk TV e mais 3 | 7:18 |
| 37 | `qpvH0VEiBxc` | fhop music \| HERDEIRO DE TUDO + PORQUE ELE VIVE (Ao Vivo) | Fhop Music | 10:26 |
| 38 | `v34CAdVy-V4` | Momento Solene - O Nome de Jesus (Clipe Oficial) | Momento Solene | 7:54 |
| 39 | `fQZjavJe_uo` | Felipe Rodrigues - Oh Quão Lindo Esse Nome é \| Ministração Ao Vivo | Felipe Rodrigues | 6:45 |
| 40 | `CmM1pcHohdI` | Bendito É O Rei (Ao Vivo) \| Fhop Music | Fhop Music | 5:27 |
| 41 | `30VagMEospM` | Incensário (Conferência JesusCopy 24’) \| Laura Souguellis | Laura Souguellis | 9:46 |
| 42 | `FKKytz49Fhg` | Firme Fundamento (Ao Vivo) - Central MSC feat. Ana Paula Rocha, Henrique Rocha | Central MSC | 6:48 |
| 43 | `IATcQyf1JMY` | UNIDOS EM FÉ \| fhop music + Upstream Quest \| Camp Session Portugal | Fhop Music e Upstream Quest | 4:37 |
| 44 | `bbxs1IJNork` | Que Se Abram os Céus  - Nívea Soares (LETRA/LEGENDADO) | WillSong | 5:14 |
| 45 | `s1oU-6vYc4E` | Nívea Soares - Rio (Ao Vivo) | Nívea Soares | 8:32 |
| 46 | `Vcgu6b4UZLM` | EU ME ALEGRAREI (AO VIVO) \| MORADA | MORADA | 4:51 |
| 47 | `RjXzYmFE7ZU` | NÃO CHORE JOÃO (AO VIVO) \| MORADA | MORADA | 8:24 |
| 48 | `zctEo-Xaouw` | Alessandro Vilas Boas CONVIDA Eric & Evellyn Emerick \| A CIDADE DESCEU | Alessandro Vilas Boas | 9:39 |
| 49 | `D-5UjAfWK08` | Nada Que o Teu Amor Não Possa \| Laura Souguellis (Ao Vivo) | Laura Souguellis | 12:11 |
| 50 | `ldK43s9UyQI` | JULLIANY SOUZA - AH, JESUS / CORAÇÃO IGUAL AO TEU (AO VIVO) | Julliany Souza | 12:28 |
| 51 | `1htnqzaKLP8` | Juliano Son \| Eu vou Construir (Livres Ao Vivo Em São Paulo) | Livres Oficial | 8:15 |
| 52 | `WfxtWHnmg_0` | LAURA SOUGUELLIS - Em teus braços (OVERMISSION 2025)[Oficial] | OVERMISSION ® | 21:20 |
| 53 | `fOBGrF-bQbA` | Uma Vez (Ao Vivo) \| Fhop Music | Fhop Music | 4:24 |
| 54 | `7Y9Telk1rGI` | Leo Schiappadini - FILHO PRÓDIGO (Ao Vivo) | Leo Schiappadini | 6:15 |
| 55 | `8JeWLB0992k` | Estações (Ao Vivo) \| Matheus Gonçalves & Mateus Brito | Dunamis Music | 7:44 |
| 56 | `kJ9Yy-YGTNo` | Como Não Te Amar - Gabi Sampaio, Lucas Magno & SOM DO CÉU | Gabi Sampaio e mais 2 | 11:54 |
| 57 | `ePdRgBWhvog` | É TUDO SOBRE VOCÊ \| MORADA (CLIPE OFICIAL) | MORADA | 8:28 |
| 58 | `z9yAfggwIR8` | Os Bravos - Tua Presença Vale Mais (Ao Vivo na Conferência JesusCopy 23') | JesusCopy | 14:34 |
| 59 | `d_zt_dO8vTE` | DIGNO DE TUDO (Ao Vivo) \| Emi Sousa \| fhop music | Fhop Music | 8:21 |
| 60 | `g8o7WynQThE` | JESUS, TU ÉS BELO (JESUS, YOU'RE BEAUTIFUL) \| Ao Vivo \| fhop music | Fhop Music | 7:18 |
| 61 | `4jMFEt-I3Yc` | 1 Coríntios 15 (Esse Corpo É Uma Semente) - Eric & Evellyn Emerick \| TELOS (Ao Vivo) | ONE Sounds | 6:28 |
| 62 | `iWYcaIeo9E8` | Som do Secreto Vol.3 - Cristo - (Clipe Oficial) - Alessandro Vilas Boas \| Os Bravos | Som do Reino | 15:57 |
| 63 | `OQ-tBAPHb2o` | Fez um caminho para mim (Juliano Son) \| Fhop - Páscoa | Paula Gama | 22:41 |
| 64 | `Yo9G3hvl_UI` | Grato Sou (I Thank God) - Ao vivo • DROPS | drops | 4:52 |
| 65 | `oE_brFKwldk` | MARAVILHADO - NÍVEA SOARES \| AO VIVO | Nívea Soares | 7:38 |
| 66 | `ORWfJj_AJg8` | Quero Jesus (Live In Brazil) \| UPPERROOM | UPPERROOM Latinoamérica e mais 2 | 13:05 |
| 67 | `mSXgE_SS2y8` | Carol Braga \| Isaías 9 - Ao Vivo | Carol Braga | 10:43 |
| 68 | `63B6H9Dra_8` | Tua Alegria (Ao Vivo) • DROPS | drops | 5:00 |
| 69 | `NVMCYDmSd1k` | Ele é Exaltado (Ao Vivo) - Central MSC feat. Fhop Music (Emi Sousa) & Renato Mimessi | Central MSC | 9:35 |
| 70 | `6d2zq20By_E` | Maranata (Clipe Oficial) - Alessandro Vilas Boas \| David Cardoso \| Som do Reino | Som do Reino | 9:40 |
| 71 | `KRbFkwWfO1Q` | JOSÉ JR - Me ama (OVERMISSION 2025)[Oficial] | OVERMISSION ® | 11:42 |
| 72 | `UQC1cGnAUo4` | Tudo Mudou - SOM DO CÉU, Gabi Sampaio, Lucas Magno, Sarah Lanza | SOM DO CÉU | 6:44 |
| 73 | `1IkfSTFGjyI` | Seja o Centro (Ao Vivo) - SOM DO CÉU, Gabi Sampaio, Matheus França, Murilo Schiappadini | Gabi Sampaio | 8:06 |
| 74 | `0ZF5em0MTwY` | JULLIANY SOUZA - QUEM É ESSE? (AO VIVO) | Julliany Souza | 9:31 |
| 75 | `NYFcTj-KmvI` | Ministério Pedras Vivas - Pai nosso (Our father) | Pedras Vivas | 7:05 |
| 76 | `afI7c26HHEk` | Fred Arrais - Tremenda Graça (Ao Vivo) | Fred Arrais | 4:45 |
| 77 | `tp1eH8Ry6TM` | Lugar da Habitação - Os Bravos feat. Alessandro Vilas Boas - Ao Vivo na Conferência JesusCopy 2024 | JesusCopy Music | 13:44 |
| 78 | `rVJxohBP59c` | Canção de Simeão (Ao Vivo no Rio de Janeiro) • DROPS | drops | 7:41 |
| 79 | `7BoTTLK1K_4` | Só Quero Ver Você + There is Only One - Laura Souguellis & Rodolfo Abrantes // DVD FornalhaOficial | Dunamis Music | 10:11 |
| 80 | `8h_ygiJBPjk` | fhop music \| BONDADE DE DEUS (Ao vivo) | Fhop Music | 5:38 |
| 81 | `1yorXvlZd6s` | Tudo é Teu (Ao Vivo) • DROPS | drops | 7:11 |
| 82 | `_X4_sUMGw14` | Somos (Ao Vivo) - Central MSC, fhop music, Drops INA, Edificando Adoradores, Videira Music | Central MSC | 5:11 |
| 83 | `Yrw6dnDWIqE` | Ao Que Está Assentado Sobre o Trono (Clip Oficial) - Americas \| Som do Reino + TOMATULUGAR | Som do Reino | 16:31 |
| 84 | `YFodlzMw8gI` | Toma o Teu Lugar - TBC Music, Netto (O Canto das Igrejas) | O CANTO DAS IGREJAS | 6:49 |
| 85 | `j940PKO3F4A` | Nívea Soares - Abre Os Selos (Ao Vivo) | Nívea Soares | 7:55 |
| 86 | `RXlDfjDg738` | Quebro Meu Vaso - André Aquino + Luma Elpídio // Som do Secreto (Vol.2) \| Som Do Reino | Som do Reino | 12:26 |
| 87 | `X-IYqtdWsF4` | PODEROSO DEUS AO VIVO 2024 - ANTÔNIO CIRILO (CLIPE OFICIAL) | Antônio Cirilo | 14:16 |
| 88 | `8b1JRbbSc7E` | Relevans Worship Moments \|\| Meu Respirar : Meu Prazer \| João Rinaldi | Relevans | 7:06 |
| 89 | `l_YmyECnUYw` | Se tu olhares (Dá-me um coração igual ao teu) - IBAB | As melhores músicas gospel | 3:10 |
| 90 | `YapdWk-Uh_8` | Felipe Rodrigues - Aclame Ao Senhor - Ministração ao vivo | Felipe Rodrigues | 5:36 |
| 91 | `DiWAXBX2SIE` | Quebrantado (Sweetly Broken) - Vineyard Piratininga feat. Brunão Morada (Clipe Oficial) | O CANTO DAS IGREJAS | 5:27 |
| 92 | `hRJUcvsnqKs` | Meia Noite (Ao Vivo) \| fhop music | Fhop Music | 3:45 |
| 93 | `kFuONCt_QCI` | JESUS TE AMAMOS - O Canto das Igrejas, @MarsenaOficial (Ao Vivo) | O CANTO DAS IGREJAS e Marsena | 6:19 |
| 94 | `k7tGP-vidwc` | Gabriel Guedes - Vitorioso És (Clipe Oficial) | Gabriel Guedes | 5:48 |
| 95 | `JheqX_w3m08` | VINHO E PÃO \| IPALPHA Música | IPALPHA - Igreja Presbiteriana | 4:46 |
| 96 | `cegHLh3Xbl8` | GABRIELA ROCHA FEAT. ELEVATION WORSHIP - VIDA AOS SEPULCROS (CLIPE OFICIAL) | Gabriela Rocha | 4:57 |
| 97 | `QRilv78Rroc` | Nívea Soares - Quem É Como Nosso Deus? (Ao Vivo) | Nívea Soares | 8:10 |
| 98 | `90krowvsQsE` | fhop music \| ÚNICO (Ao Vivo) | Fhop Music | 7:23 |
| 99 | `7GWZwO0MdsY` | Sublime (Ao Vivo) \| fhop music | Fhop Music | 9:41 |
| 100 | `XUs7nuz6c0M` | Sobre as Águas (Ao Vivo) \| Rapha Gonçalves & @IsaiasSaadOfficial | Dunamis Music | 7:39 |
| 101 | `WLM7GbpHj8U` | Bruna Olly - Gratidão (Gratitude - Brandon Lake) - Ao Vivo | Musile Records | 7:17 |
| 102 | `MeJ9m4bxk_E` | Canção do Apocalipse - Rapha Gonçalves & Matheus Gonçalves // Zion Church | Gabriel Frame | 6:02 |
| 103 | `ky1WiHBOb_E` | Algo Bem Maior (Clipe Oficial) • DROPS | drops | 6:13 |
| 104 | `7p0V0LE9Avw` | NÍVEA SOARES \| NÃO MAIS ESCRAVOS (CLIPE OFICIAL) | Nívea Soares | 6:47 |
| 105 | `Dv-7mBQNEIo` | fhop music \| OS QUE OLHAM PARA TI (Ao Vivo) | Fhop Music | 13:58 |
| 106 | `2anDhu7L-Cc` | Dono da Minha Afeição (Ao Vivo) \| fhop music | Fhop Music | 5:58 |
| 107 | `MeX0yHMs9Nk` | fhop music, Marco Telles \| COLOSSENSES E SUAS LINHAS DE AMOR (Ao Vivo) | Fhop Music | 8:15 |
| 108 | `dlGOiuxSzVw` | A Boa Parte (Ao Vivo) \| Fhop Music, Nívea Soares | Fhop Music | 5:51 |
| 109 | `N5AMmLZjaaM` | fhop music \| NADA MAIS (Ao Vivo) | Fhop Music | 11:46 |
| 110 | `9DsWIcJhUu8` | Tudo Que Eu Tenho - Eric & Evellyn Emerick  e Filipe Emerick (LIVE AT HOME VI) | ONE Sounds | 23:09 |
| 111 | `YXnQ02HYB1w` | Tu és + Águas Purificadoras (Ao Vivo) \| Fhop Music | Fhop Music | 7:57 |
