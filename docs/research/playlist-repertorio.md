# Playlist do Repertório no YouTube sem conta

Pesquisa do ticket 20 (Wayfinder v1). Pergunta: o Renovo Hub deve gerar uma playlist com as Músicas inteiras do Repertório de uma Escala, pra quem vai tocar ouvir em loop, sem que ninguém precise de conta do YouTube nem de chave de API. Quatro caminhos foram investigados: o link não documentado `watch_videos`, o embed com `playlist`+`loop`, a YouTube Data API v3 e as políticas do YouTube.

Testes feitos em 2026-09-04 (noite, horário de Brasília; o servidor do YouTube já registrava a data UTC 05/09/2026), com `curl` a partir de rede residencial no Brasil e com Chrome desktop pelo painel de navegador. Os ids reais usados foram os do ticket:

| id | vídeo (título devolvido pelo oEmbed do YouTube) |
|---|---|
| `hRJUcvsnqKs` | Meia Noite (Ao Vivo) \| fhop music |
| `s1oU-6vYc4E` | Nívea Soares - Rio (Ao Vivo) |
| `Yo9G3hvl_UI` | Grato Sou (I Thank God) - Ao vivo • DROPS |

## Resumo executivo

- **`watch_videos` funciona em setembro de 2026.** `https://www.youtube.com/watch_videos?video_ids=<id1>,<id2>,...` responde HTTP 303 para `https://www.youtube.com/watch?v=<id1>&list=TLGG...`, uma playlist temporária chamada "Untitled List" com os vídeos na ordem enviada. Aceita **no máximo 50 ids** (o excedente é descartado em silêncio). Não faz loop sozinho: a pessoa toca em "Repetir playlist" no painel da playlist, e aí o loop funciona (verificado: ao terminar o último vídeo, voltou pro primeiro). Sem o loop ligado, ao terminar o último vídeo o Autoplay do YouTube pula pra um vídeo recomendado fora do Repertório (verificado duas vezes).
- **Um id inexistente derruba a lista inteira**: o YouTube redireciona pra `watch?v=<id1>` sem `list`. O app precisa validar cada id antes de montar o link (o endpoint oEmbed público do YouTube serve pra isso sem chave: devolve 404 pra id inexistente).
- **O id `TLGG...` embute a data UTC** (`TLGG` + base64url de 8 bytes + `DDMMYYYY`). Trocar a data invalida a lista. O app deve sempre gerar o link `watch_videos` na hora do clique, nunca guardar a URL redirecionada.
- **Embed (`/embed?playlist=...&loop=1`) funciona e faz loop sozinho**, aceita pelo menos 245 ids, mas tem dois problemas graves pro caso de uso: (1) vídeo com incorporação desativada pelo canal não toca no embed e **não é pulado automaticamente** (a "Meia Noite" da fhop music, um dos três ids do ticket, dá erro 150 no embed e toca normalmente no youtube.com); (2) o embed precisa ser servido dentro de uma página com `Referer` (erro 153 quando aberto direto), o que prende a reprodução dentro do PWA, onde no iPhone não há garantia de áudio em segundo plano.
- **Data API v3 (`playlists.insert` + `playlistItems.insert`) fica fora**: exige OAuth do usuário com escopo `youtube`/`youtube.force-ssl` (chave de API não basta), custa 50 unidades por inserção contra uma cota padrão de 10.000 unidades/dia, e obriga o app a virar um "API Client" sujeito ao Termos da API, Developer Policies e verificação de escopo do Google.
- **Política**: nada nos Termos de Serviço do YouTube (versão BR de 5 jan 2022; versão US de 15 dez 2023) proíbe montar e abrir um link de youtube.com; a única coisa que o app faz é gerar uma URL que a pessoa abre no navegador ou no app do YouTube. Os Termos da API e as Developer Policies só valem pra quem usa "YouTube API Services" (Data API, player incorporado etc.), o que o link não usa. O risco real do `watch_videos` é ser **não documentado**: o Google pode mudar ou desligar sem aviso.

**Recomendação**: gerar o link `watch_videos` (até 50 ids, validados por oEmbed no cadastro da Música) e abrir fora do PWA, com a instrução "toque em Repetir playlist pra ouvir em loop". Manter o embed como opção secundária dentro do app só se for aceitável perder as músicas sem incorporação. Não usar a Data API.

## Comparativo

| Critério | (a) `watch_videos` | (b) Embed `playlist`+`loop` | (c) Data API v3 |
|---|---|---|---|
| Precisa de conta do YouTube | Não (verificado por teste) | Não (verificado) | Sim, OAuth de quem cria (doc oficial) |
| Precisa de chave/projeto Google | Não | Não, mas vira "API Client" sujeito aos Termos da API (doc oficial) | Sim, projeto + OAuth consent screen + cota |
| Documentado pelo YouTube | Não | Sim (`player_parameters`) | Sim |
| Limite de músicas | 50 ids (teste: 51, 100, 200 e 245 ids viram 50) | Pelo menos 245 (teste) | 5.000 vídeos por playlist (Ajuda do YouTube) |
| Loop | Manual: botão "Repetir playlist" (teste) | `loop=1` automático (doc + teste) | Loop manual no YouTube |
| Vídeo com incorporação desativada | Toca normalmente (teste) | Erro 150, não pula (teste) | Toca no YouTube |
| Id inexistente na lista | Lista inteira é descartada (teste) | Id é ignorado, resto toca (teste) | Erro na inserção |
| Abre no app do YouTube no celular | iOS: `/watch_videos` está coberto pelo Universal Link do app (AASA verificado); se o app entende o path, não confirmado. Android: app verificado pra todas as URLs (assetlinks verificado); path não confirmado | Toca dentro do PWA (iframe) | Playlist normal, abre no app |
| Segundo plano / tela bloqueada | No app do YouTube exige Premium (Ajuda); no Safari, não confirmado | Não confirmado; WebKit já teve bug de áudio parando em PWA standalone | Idem (a) |
| Autoplay ao abrir | Página do YouTube decide | Só com gesto do usuário em iOS (WebKit); `autoplay` sujeito a bloqueio (`onAutoplayBlocked`) | n/a |
| Custo por uso | Zero | Zero | 50 unidades por playlist + 50 por música (ex.: 20 músicas = 1.050 de 10.000/dia) |
| Risco de quebrar | Alto: não documentado | Baixo: documentado | Baixo, mas operação pesada |

## (a) Link não documentado `watch_videos`

Acesso e testes: 2026-09-04.

### O que foi verificado por teste

**Redirecionamento.** `curl` sem cookies:

```
GET https://www.youtube.com/watch_videos?video_ids=hRJUcvsnqKs,s1oU-6vYc4E,Yo9G3hvl_UI
303 -> https://www.youtube.com/watch?v=hRJUcvsnqKs&list=TLGGsytnqvInqJswNTA5MjAyNg
```

- Mesmo destino com User-Agent de iPhone (Safari 18) e de Android (Chrome 128): o servidor não muda o comportamento por dispositivo.
- `https://m.youtube.com/watch_videos?...` responde 303 para `https://m.youtube.com/watch?v=...&list=` com o mesmo id de lista.
- `https://youtu.be/watch_videos?...` não é suportado: redireciona para `www.youtube.com/watch?video_ids=...&v=watch_videos`, que é uma página quebrada.
- `&noapp=1` na URL não altera o redirecionamento (relevante pro iOS, ver abaixo).

**Página resultante.** Seguindo o redirecionamento com User-Agent de Chrome e cookie de consentimento, o HTML da página de watch traz `"playlist":{"playlist":{"title":"Untitled List", ...}}`, `"totalVideos":3`, `"isInfinite":false`, os três `playlistPanelVideoRenderer` na ordem enviada e a string "Repetir playlist" (o botão de loop do painel). No Chrome, a página mostra o painel "Untitled List", "1 / 3", com botões "Repetir playlist" e "Modo aleatório". Em `m.youtube.com` com viewport 375x812 e User-Agent móvel (emulado no Chrome desktop, não em iOS real), a página também mostra "Untitled List", "1 / 3" e o botão "Repetir playlist".

**Formato do id da lista.** Os três ids de lista obtidos decodificam (base64url) para 16 bytes: 8 bytes opacos seguidos de `05092026` em ASCII, a data UTC do teste. Pedir o mesmo conjunto de ids duas vezes (e com User-Agents diferentes) devolveu o mesmo id, logo a parte opaca é derivada dos ids. Trocar a data no id (04092026, 06092026, 01012026) e abrir `watch?v=...&list=` devolveu página sem playlist. Conclusão: o id é por dia; se ainda funciona no dia seguinte não foi testado, e o app não deve depender disso.

**Limite de ids.** Com 245 ids reais coletados de páginas de busca do YouTube:

| ids enviados | tamanho da URL | `totalVideos` na página |
|---|---|---|
| 10 | 166 | 10 |
| 50 | 646 | 50 |
| 51 | 658 | 50 |
| 100 | 1246 | 50 |
| 200 | 2446 | 50 |
| 245 | 2986 | 50 |

De 51 em diante o id de lista é idêntico ao de 50: o servidor só considera os 50 primeiros. Nenhuma URL foi rejeitada por tamanho.

**Casos de borda.**

| Entrada | Resultado |
|---|---|
| 1 id | 303 para `watch?v=<id>&list=TLGG...` (lista de 1) |
| `video_ids=` vazio | 303 para `watch?v` (página quebrada) |
| id duplicado (`hRJ,hRJ,Yo9`) | lista com 3 itens, duplicata mantida |
| id inexistente bem formado no fim (`...,zzzzzzzzzzz`) | 303 para `watch?v=hRJUcvsnqKs`, **sem `list`** |
| id inexistente no início (`zzzzzzzzzzz,...`) | 303 para `watch?v=zzzzzzzzzzz`, sem `list` |
| id inexistente no meio (`hRJ,AAAAAAAAAAA,Yo9`) | 303 com `list=TLGG...`, mas a página vem com id `TLPP...` e nenhum vídeo no painel |
| id malformado (`abc`) | 303 para `watch?v=hRJUcvsnqKs`, sem `list` |

Ou seja, qualquer id inválido invalida a playlist toda. O que acontece com um id que existe mas está privado ou foi removido não foi testado (não havia um id assim à mão).

**Validação de id sem chave.** O endpoint oEmbed do YouTube (`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json`) devolveu 200 com título e canal pros três ids do ticket, 404 para `AAAAAAAAAAA` e 400 para `zzzzzzzzzzz`. É uma forma de o app checar um id no momento do cadastro da Música sem conta nem chave. Também é um endpoint de site, não da Data API; a Ajuda/Docs do YouTube não o documentam como serviço pra terceiros (só aparece na lista pública de provedores oEmbed), então vale a mesma ressalva de "pode mudar".

**Loop.** Na página de watch do Chrome, com a lista de 3 no último vídeo (`index` 3/3):

1. Sem tocar em "Repetir playlist", ao chegar ao fim do vídeo a página navegou para `watch?v=8JeWLB0992k` (vídeo recomendado, sem `list`). Repetido uma segunda vez com o mesmo resultado (`watch?v=5yYTU1-fJMk`). É o Autoplay do YouTube.
2. Com "Repetir playlist" ligado (o rótulo do botão muda para "Exibir o vídeo no modo de repetição", que é o próximo estado do ciclo), ao chegar ao fim do último vídeo a página foi para `watch?v=hRJUcvsnqKs&list=TLGG...&index=1`, painel "1 / 3": o loop da playlist funciona com a lista temporária.
3. O estado do loop ficou ligado ao recarregar a mesma lista na mesma aba. Se persiste entre sessões ou aparelhos não foi verificado.

Não existe parâmetro de URL pra ligar o loop na página de watch; é ação da pessoa.

**Vídeo sem incorporação.** `hRJUcvsnqKs` toca normalmente na página de watch (é o primeiro da lista testada). No embed, o mesmo id dá erro 150 (ver seção b). Isso importa porque canais de música gospel frequentemente desativam a incorporação.

### O que veio de fonte primária sobre abrir no app do celular

- **iOS (Universal Links).** O arquivo `https://www.youtube.com/.well-known/apple-app-site-association` (acessado 2026-09-04; idêntico em `m.youtube.com` e `youtu.be`) declara, para o app `com.google.ios.youtube`, um componente de inclusão `"/": "*"` e 105 exclusões. `/watch_videos` **não** está entre as exclusões, então tocar num link `youtube.com/watch_videos?...` a partir de outro app é tratado pelo iOS como link do app do YouTube. Há uma exclusão por query: `{"?": {"noapp": "?*"}, "exclude": true}` com o comentário "exclude uri's with noapp parameter from deeplinks", ou seja, `...&noapp=1` força abrir no Safari. A Ajuda do YouTube ("YouTube Universal Links") confirma: "When you click on any YouTube link (including youtube.com, m.youtube.com, and youtu.be), your iOS device will automatically open the link in the YouTube App", iOS 9 ou superior.
- Consequência: quando o Universal Link dispara, o app do YouTube recebe a URL `/watch_videos?video_ids=` crua, sem passar pelo redirecionamento 303 do servidor. Se o app do iOS entende esse path (ou o `list=TLGG` resultante), **não foi confirmado**: precisa de teste em iPhone real. O `noapp=1` é o plano B verificável: abre no Safari, onde o 303 funciona (verificado com User-Agent de iPhone).
- **Android (App Links).** `https://www.youtube.com/.well-known/assetlinks.json` (acessado 2026-09-04) autoriza `com.google.android.youtube` com `delegate_permission/common.handle_all_urls`. Quais paths o app de fato captura depende dos intent-filters do manifesto do APK, que não são públicos; **não confirmado** pra `/watch_videos`.
- Os fóruns da Apple têm relatos contraditórios sobre Universal Links dispararem em redirecionamentos 302/303 (um relato diz que dispara, outro que a partir do iOS 17 deixou de disparar). Nenhuma resposta oficial da Apple foi encontrada; fica como não confirmado.

## (b) Embed `https://www.youtube.com/embed/<id1>?playlist=<id2>,<id3>&loop=1`

Fonte primária: "YouTube Embedded Players and Player Parameters" (`https://developers.google.com/youtube/player_parameters`, "Last updated 2026-04-28 UTC", acessado 2026-09-04). Trechos:

- `playlist`: "This parameter specifies a comma-separated list of video IDs to play. If you specify a value, the first video that plays will be the VIDEO_ID specified in the URL path, and the videos specified in the playlist parameter will play thereafter."
- `loop`: "In the case of a single video player, a setting of 1 causes the player to play the initial video again and again. In the case of a playlist player (or custom player), the player plays the entire playlist and then starts again at the first video. Supported values are 0 and 1, and the default value is 0. Note: This parameter has limited support in IFrame embeds. To loop a single video, set the loop parameter value to 1 and set the playlist parameter value to the same video ID already specified in the Player API URL: `https://www.youtube.com/embed/VIDEO_ID?playlist=VIDEO_ID&loop=1`".
- `playsinline`: "This parameter controls whether videos play inline or fullscreen on iOS. Valid values are: 0: Results in fullscreen playback. This is currently the default value, though the default is subject to change. 1: Results in inline playback for mobile browsers and for WebViews created with the allowsInlineMediaPlayback property set to YES."
- `autoplay`: "If you enable Autoplay, playback will occur without any user interaction with the player; playback data collection and sharing will therefore occur upon page load."
- `fs`: "Setting this parameter to 0 prevents the fullscreen button from displaying in the player. The default value is 1".
- A doc **não declara limite** de ids em `playlist`.
- Não existe parâmetro `mute` documentado nessa página.

IFrame Player API (`https://developers.google.com/youtube/iframe_api_reference`, "Last updated 2026-09-03 UTC"): `player.loadPlaylist(playlist:String|Array, index, startSeconds)` recebe "an array of YouTube video IDs"; `player.setLoop(loopPlaylists:Boolean)`: "If the parameter value is true, then the video player will continuously play playlists. After playing the last video in a playlist, the video player will go back to the beginning of the playlist and play it again." O evento `onAutoplayBlocked` "fires any time the browser blocks autoplay or scripted video playback features". Sem limite documentado de ids.

Required Minimum Functionality (`https://developers.google.com/youtube/terms/required-minimum-functionality`, "Last updated 2026-04-28 UTC"): "API Clients that use the YouTube embedded player (including the YouTube IFrame Player API) must provide identification through the HTTP Referer request header. [...] YouTube recommends using strict-origin-when-cross-origin Referrer-Policy, which is already the default in many browsers." E: "Embedded players must have a viewport that is at least 200px by 200px." E: "an API Client must not initiate an automatic playback until the player is visible and more than half of the player is visible on the page or screen."

### O que foi verificado por teste

Página local servida em `http://127.0.0.1:8765` (pra ter `Referer`), Chrome desktop, IFrame Player API com `enablejsapi=1` pra ler `getPlaylist()`, `getPlaylistIndex()`, `onError` e `onStateChange`.

- Abrir a URL do embed **direto na barra de endereço** (sem `Referer`) mostra "Erro de configuração do player de vídeo. Erro 153" e nada toca. A IFrame API documenta o código: "153 – The request does not include the HTTP Referer header or equivalent API Client identification." Logo, o embed só serve dentro de uma página do próprio app.
- `embed/hRJUcvsnqKs?playlist=s1oU-6vYc4E,Yo9G3hvl_UI&loop=1`: `getPlaylist()` devolveu `["s1oU-6vYc4E","Yo9G3hvl_UI"]` (2 itens) e o primeiro vídeo tocado foi `s1oU-6vYc4E`. O id do path sumiu porque `hRJUcvsnqKs` não é incorporável: sozinho (`embed/hRJUcvsnqKs`) o player mostra "Este vídeo não está disponível" e dispara `onError` com código 150. Na doc da IFrame API: "101 – The owner of the requested video does not allow it to be played in embedded players. 150 – This error is the same as 101."
- `embed?playlist=hRJUcvsnqKs,s1oU-6vYc4E,Yo9G3hvl_UI&loop=1` (sem id no path): `getPlaylist()` com os 3 ids; `playVideo()` dispara erro 150 no índice 0 e o player **fica parado** (estado -1 após 6 s), sem pular pro próximo. Quem ouve teria que avançar na mão.
- Id inexistente em `playlist` (`AAAAAAAAAAA`) é simplesmente ignorado; o resto toca.
- Loop: com a lista de 2, `playVideoAt(1)` e `seekTo(fim-3)`; ao terminar, o player voltou ao índice 0 tocando `s1oU-6vYc4E`. `loop=1` com `playlist` funciona como documentado.
- Limite: `playlist` com 59, 119 e 244 ids (mais o do path) devolveu `getPlaylist().length` de 60, 120 e 245. Não há corte em 50 como no `watch_videos`.

### iOS / PWA instalado (fonte primária, sem teste em aparelho)

- Início da reprodução: WebKit, "New `<video>` Policies for iOS" (2016-07-25): "`<video autoplay>` elements will be allowed to autoplay without a user gesture if their source media contains no audio tracks"; vídeo com áudio precisa de gesto do usuário; "On iPhone, `<video playsinline>` elements will now be allowed to play inline, and will not automatically enter fullscreen mode when playback begins", e vídeos sem `playsinline` "will continue to require fullscreen mode for playback on iPhone". Somado ao `playsinline=0` padrão do embed: no iPhone, dar play abre a tela cheia nativa por padrão; com `playsinline=1` toca inline e o botão de tela cheia do player (`fs=1`) continua disponível.
- Segundo plano: WebKit Bugzilla #198277, "Audio stops playing when standalone web app is no longer in foreground" (aberto 2019-05-27, fechado como duplicata em 2022-05-12; o relato diz que a correção veio no iOS 15.4). O bug trata de `<audio>`/Web Audio em PWA standalone; como um `<video>` do YouTube dentro de um iframe no PWA se comporta ao bloquear a tela **não foi confirmado**.
- No app do YouTube, tocar em segundo plano é benefício Premium: "Background play is available on YouTube, YouTube Music, and YouTube Kids mobile apps [...] when you're signed in with your YouTube Premium membership account" (Ajuda do YouTube, "Use your YouTube Premium benefits"). Isso afeta (a), não (b).
- Safari 16.4 (WebKit blog, 2023-03-27) trouxe Web Push e Badging pra web apps na tela inicial e o Fullscreen API sem prefixo "on macOS and iPadOS"; nada explícito sobre iPhone nesse post.

### Ônus regulatório do embed

O player incorporado é um "YouTube API Service": as Developer Policies (2026-06-24) listam "the YouTube Data API service, YouTube Reporting API service, YouTube Analytics API service, and YouTube embedded player" entre os serviços, e o RMF fala em "API Clients that use the YouTube embedded player". Ou seja, usar o embed coloca o Renovo Hub sob o YouTube API Services Terms of Service e as Developer Policies (política de privacidade obrigatória no app, regras de autoplay, tamanho mínimo, não sobrepor o player, consultar status "Made for Kids" de cada vídeo incorporado). Nada disso exige conta ou chave, mas é obrigação contínua.

## (c) YouTube Data API v3: `playlists.insert` + `playlistItems.insert`

Fonte primária (acessado 2026-09-04, todas "Last updated 2026-09-04 UTC"):

- `playlists.insert`: "Quota impact: A call to this method has a quota cost of 50 units." "This request requires authorization with at least one of the following scopes": `https://www.googleapis.com/auth/youtubepartner`, `https://www.googleapis.com/auth/youtube`, `https://www.googleapis.com/auth/youtube.force-ssl`. Chave de API sozinha não serve.
- `playlistItems.insert`: mesmos 50 unidades e mesmos escopos.
- Quota (`determine_quota_cost`): "Projects that enable the YouTube Data API have a default quota allocation of 100 search.list calls, 100 videos.insert calls, and 10,000 units per day combined for all other endpoints. [...] Daily quotas reset at midnight Pacific Time (PT)." Tabela: `playlists.insert` 50, `playlistItems.insert` 50.
- Ajuda do YouTube ("Explore the You tab"): "A maximum of 5,000 videos can be displayed in a playlist."
- Google OAuth verification ("Verification requirements", support.google.com/cloud/answer/13464321): "Apps requesting access to sensitive or restricted scopes must complete the following requirements in addition to Brand Verification Requirements", incluindo vídeo demonstrando o fluxo OAuth. Se os escopos do YouTube são classificados como "sensitive" não consta nessa página (fica em não confirmado), mas o escopo `youtube` dá escrita no canal da pessoa, e a Developer Policies exige política de privacidade, consentimento e tratamento de dados de API.

Por que não:

1. Alguém (o Ministro) precisaria de conta Google e de autorizar o app via OAuth; a playlist nasce no canal dessa pessoa e some se ela revogar o acesso.
2. Projeto no Google Cloud com tela de consentimento, verificação de marca e possivelmente de escopo, além de compliance audit pra API Clients: operação pesada pra um app de 15 pessoas de custo zero.
3. Cota: uma Escala com 20 músicas custa 1.050 unidades (1 playlist + 20 itens), então a cota padrão dá pra criar no máximo 9 playlists por dia, e cada edição do Repertório vira novas chamadas (update/delete a 50 cada). Isso resolve, mas é atrito desnecessário.
4. Cria estado persistente fora do app (playlists no YouTube) que precisa acompanhar edições da Escala; o link `watch_videos` é derivado do Repertório na hora, sem estado.

## (d) Políticas do YouTube

- **Termos de Serviço do YouTube, versão Brasil** ("Em vigor a partir de 5 de janeiro de 2022", `https://www.youtube.com/t/terms?hl=pt-BR&gl=BR`, acessado 2026-09-04), "Permissões e restrições": "O acesso e o uso do Serviço é permitido, desde que cumpra este Contrato e a legislação aplicável. Você pode ver ou ouvir o Conteúdo para uso pessoal e não comercial. Você também pode reproduzir vídeos do YouTube por meio do player incorporado." Restrições relevantes: "acessar, reproduzir, fazer download, distribuir, transmitir, exibir, vender, licenciar, alterar, modificar ou usar de outra forma qualquer parte do Serviço ou qualquer Conteúdo, exceto: (a) se autorizado de forma expressa pelo Serviço; [...]"; "burlar, desabilitar, fraudar ou interferir com qualquer parte do Serviço"; "acessar o Serviço usando qualquer meio automatizado (como robôs, botnets ou scrapers)"; "usar o Serviço para assistir ou ouvir Conteúdo para fins comerciais, não pessoais (por exemplo, a exibição de vídeos ou reprodução de músicas no Serviço para fins públicos não é permitido)". A versão US ("Effective as of December 15, 2023") tem o mesmo teor.
- Leitura: o link `watch_videos` é uma URL de youtube.com aberta pela própria pessoa no navegador ou no app do YouTube; o Renovo Hub não faz requisição nenhuma ao YouTube, não automatiza, não baixa nem altera conteúdo. Não há cláusula que proíba montar um link, e nas versões atuais não existe restrição a "acessar o Conteúdo só pelas páginas de reprodução ou pelo player incorporável" (versões antigas dos Termos não foram consultadas). O que os Termos não dão é garantia: `watch_videos` não é "autorizado de forma expressa" nem documentado; é comportamento do site que pode mudar.
- **YouTube API Services Terms of Service** (2026-04-28) e **Developer Policies** (2026-06-24) se aplicam a quem usa "YouTube API Services". O link não usa nenhum. A proibição de scraping das Policies ("You and your API Clients must not [...] scrape YouTube Applications or Google Applications, or obtain scraped YouTube data or content") não alcança gerar um link; alcançaria se o app baixasse páginas do YouTube pra extrair dados. O uso do oEmbed pra validar id no cadastro é uma chamada HTTP do app a um endpoint público do site, sem extração de página; fica na zona cinzenta de "não documentado", igual ao `watch_videos`.
- Uso "pessoal e não comercial": ouvir o repertório pra ensaiar é pessoal. Tocar a playlist pelo YouTube como sonorização do culto (execução pública) seria outro assunto e não é o objetivo do ticket.

## Recomendação

1. **Caminho principal: link `watch_videos`.** Gerar `https://www.youtube.com/watch_videos?video_ids=` com os ids das Músicas do Repertório na ordem da Escala, no momento do toque (não persistir a URL redirecionada). Abrir fora do PWA (`target="_blank"`, `rel="noopener"`). Mostrar ao lado: "No YouTube, toque em Repetir playlist pra ouvir em loop".
2. **Regras de montagem que os testes impõem:** validar cada id com `^[A-Za-z0-9_-]{11}$` e com oEmbed no cadastro da Música (404 = id inválido, não salvar); no clique, pular Músicas sem id válido em vez de derrubar a lista; cortar em 50 ids (avisar se o Repertório passar disso); manter duplicatas só se fizer sentido no Repertório.
3. **iPhone:** testar em aparelho real se o app do YouTube abre o link `/watch_videos` com a lista montada. Se não abrir, acrescentar `&noapp=1` (força o Safari, comportamento documentado no AASA) ou gerar o link do redirecionamento no servidor. Android: testar também; não há fonte pública sobre os paths capturados pelo app.
4. **Embed só como opção secundária dentro do app**, e só se for aceitável que músicas com incorporação desativada não toquem (uma das três do ticket já não toca). Se entrar: usar `embed?playlist=<ids>&loop=1&playsinline=1` (sem id no path, pra não perder o primeiro vídeo), dentro de uma página do PWA com Referrer-Policy padrão, iniciar por toque do usuário, player com pelo menos 200x200 px, e assumir as obrigações de "API Client" (política de privacidade, Made for Kids). Sem promessa de áudio em segundo plano no iPhone.
5. **Não usar a Data API** pra este caso.
6. Registrar em ADR que o caminho principal depende de comportamento não documentado do YouTube, e que a alternativa se ele sumir é o embed (com a perda de músicas não incorporáveis) ou a Data API (com conta e OAuth).

## O que não foi confirmado em fonte primária

- Se o app do YouTube no iOS interpreta a URL `/watch_videos?video_ids=` (ou `list=TLGG...`) quando o Universal Link dispara. Só há o AASA (path coberto) e a Ajuda ("any YouTube link" abre no app). Precisa de iPhone real.
- Se o app do YouTube no Android captura `/watch_videos`. O `assetlinks.json` verifica o app pra `handle_all_urls`, mas os intent-filters do manifesto não são públicos.
- Se Universal Links disparam em redirecionamentos 303 no Safari (relatos contraditórios em fóruns da Apple, sem resposta oficial).
- Validade do id `TLGG...` além do dia UTC em que foi gerado.
- Comportamento do `watch_videos` com id de vídeo existente mas privado ou removido (só ids inexistentes foram testados).
- Persistência do botão "Repetir playlist" entre sessões, aparelhos ou no app.
- Teste real em Safari iOS / PWA instalado: autoplay, tela cheia a partir de iframe, áudio com tela bloqueada. Só há a política do WebKit de 2016, o post do Safari 16.4 e o bug #198277.
- O teste de `m.youtube.com` foi com Chrome desktop emulando viewport 375x812 e User-Agent móvel, não com iOS real.
- Se os escopos `youtube`/`youtube.force-ssl` são classificados como "sensitive" pela verificação OAuth do Google (a página de requisitos não lista escopos).
- Qualquer declaração oficial do YouTube sobre `watch_videos` ou sobre o oEmbed como serviço pra terceiros: não foi encontrada nenhuma, nem a favor nem contra.
- Limite superior real do `playlist` do embed (testado até 245, sem corte).

## Fontes

Todas acessadas em 2026-09-04.

Testes (dados brutos gerados na sessão, não versionados):
- `curl` contra `https://www.youtube.com/watch_videos`, `https://m.youtube.com/watch_videos`, `https://youtu.be/watch_videos`, `https://www.youtube.com/watch?v=...&list=TLGG...`, `https://www.youtube.com/playlist?list=TLGG...`, `https://www.youtube.com/oembed`.
- Chrome desktop (painel de navegador) em `https://www.youtube.com/watch?v=Yo9G3hvl_UI&list=TLGGsytnqvInqJswNTA5MjAyNg`, `https://m.youtube.com/watch?v=hRJUcvsnqKs&list=TLGGsytnqvInqJswNTA5MjAyNg` e em página local com IFrame Player API.

Documentação oficial do YouTube / Google:
- YouTube Embedded Players and Player Parameters: https://developers.google.com/youtube/player_parameters (2026-04-28)
- YouTube IFrame Player API Reference: https://developers.google.com/youtube/iframe_api_reference (2026-09-03)
- YouTube API Services, Required Minimum Functionality: https://developers.google.com/youtube/terms/required-minimum-functionality (2026-04-28)
- YouTube API Services Terms of Service: https://developers.google.com/youtube/terms/api-services-terms-of-service (2026-04-28)
- YouTube API Services, Developer Policies: https://developers.google.com/youtube/terms/developer-policies (2026-06-24)
- Data API, Playlists: insert: https://developers.google.com/youtube/v3/docs/playlists/insert (2026-09-04)
- Data API, PlaylistItems: insert: https://developers.google.com/youtube/v3/docs/playlistItems/insert (2026-09-04)
- Data API, Quota Calculator: https://developers.google.com/youtube/v3/determine_quota_cost (2026-09-04)
- Data API, Getting started (cota): https://developers.google.com/youtube/v3/getting-started
- Termos de Serviço do YouTube (Brasil, 2022-01-05): https://www.youtube.com/t/terms?hl=pt-BR&gl=BR
- YouTube Terms of Service (US, 2023-12-15): https://www.youtube.com/t/terms?hl=en&gl=US
- Ajuda do YouTube, YouTube Universal Links: https://support.google.com/youtube/answer/7174035
- Ajuda do YouTube, Use your YouTube Premium benefits (Background play): https://support.google.com/youtube/answer/6308116
- Ajuda do YouTube, Explore the You tab (5.000 vídeos por playlist): https://support.google.com/youtube/answer/9209643
- Google Cloud, OAuth verification requirements: https://support.google.com/cloud/answer/13464321
- Arquivos de deep link do YouTube: https://www.youtube.com/.well-known/apple-app-site-association, https://m.youtube.com/.well-known/apple-app-site-association, https://youtu.be/.well-known/apple-app-site-association, https://www.youtube.com/.well-known/assetlinks.json

Apple / WebKit:
- WebKit, New `<video>` Policies for iOS (2016-07-25): https://webkit.org/blog/6784/new-video-policies-for-ios/
- WebKit, WebKit Features in Safari 16.4 (2023-03-27): https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
- WebKit Bugzilla #198277, Audio stops playing when standalone web app is no longer in foreground: https://bugs.webkit.org/show_bug.cgi?id=198277
- Apple, Supporting universal links in your app: https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app (não trata de redirecionamentos)

Secundárias (só pra contexto, não sustentam nenhuma afirmação acima):
- Simon Willison, "YouTube embeds fail with a 153 error" (2025-12-01): https://simonwillison.net/2025/Dec/1/youtube-embed-153-error/ (aponta pro RMF)
- Apple Developer Forums, threads 725403 e 747131 sobre Universal Links e redirecionamentos (relatos de usuários, sem resposta da Apple)
