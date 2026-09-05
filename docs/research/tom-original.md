# Tom original de uma Música nova: de onde tirar

Ticket: `.scratch/wayfinder-v1/issues/19-tom-original-musica-nova.md`. Pesquisa feita em **04/09/2026**; todos os links foram acessados nessa data, salvo indicação contrária. Onde a fonte primária não respondeu (Cloudflare, 403, 404), a afirmação está marcada como **não confirmado** e listada na seção final.

Cenário: ao cadastrar uma Música nova pelo link do YouTube, o app precisa sugerir o tom original da gravação. Custo zero, sem chave paga, sem violar termos de uso. Teste com três músicas reais: **"Meia Noite"** (fhop music, 2024/2025), **"Rio"** (Nívea Soares, 2007) e **"Grato Sou (I Thank God)"** (DROPS, 2022).

## Resumo executivo

1. **Só o Cifra Club entrega o tom das três músicas.** O campo `Tom:` vem no HTML renderizado no servidor (Rio → **C**, Meia Noite → **Bm**, Grato Sou → **A**), sem chave, sem login, sem Cloudflare, e as páginas de cifra não são bloqueadas pelo `robots.txt`. Não existe API oficial; o `robots.txt` bloqueia `/api/`.
2. **O risco do Cifra Club é contratual, não técnico.** O Aviso Legal proíbe "usar quaisquer métodos de prospecção ou métodos semelhantes de extração de dados" (cláusula (b) das obrigações do usuário). Uma leitura por Música, disparada por gesto humano, com cache permanente e link de volta, é o uso mais defensável possível, mas continua sendo extração automatizada. É uma decisão a ser tomada com consciência, não um "está liberado".
3. **Spotify está fechado pra este app.** Audio Features e Audio Analysis aparecem como **Deprecated** na referência oficial; desde 27/11/2024 apps novos não acessam; o modo estendido só aceita organizações com ≥ 250 mil usuários ativos mensais (desde maio/2025). Estado confirmado em 04/09/2026.
4. **YouTube não tem tom.** `videos.list` devolve título, descrição (com capítulos só como texto) e tags; não há campo musical. Nas descrições dos três vídeos oficiais: **zero** menções a tom, BPM ou cifra e **zero** capítulos. O oEmbed devolve só título, canal e thumbnail.
5. **Deezer, MusicBrainz, AcousticBrainz e ReccoBeats não servem.** Deezer acha as três músicas sem chave, mas o objeto Track não tem tom (só `bpm`, zerado em duas delas). MusicBrainz não tem campo de tom e nem cadastra fhop music ou Drops INA. AcousticBrainz parou de coletar em 2022 e não tem nenhuma das três. ReccoBeats (gratuito, sem chave, dados do Spotify) devolveu **0 resultados** pras três.
6. **Chordify e Ultimate Guitar não têm API pública**, e o Chordify está inteiro atrás de um challenge da Cloudflare (403 até no `robots.txt`). O UG tem Nívea Soares mas não tem "Rio" nem "Meia Noite" da fhop.
7. **Estimativa de tom no cliente é inviável no cenário real.** Não há caminho legal nem técnico pra obter o áudio do YouTube num PWA (o player embutido não expõe áudio; baixar viola os Termos e as Developer Policies III.E.1 e III.I.7; `getDisplayMedia` não existe no Safari iOS). O essentia.js tem `KeyExtractor`, mas é **AGPL-3.0**, último release em 2021 e 10 MB; o meyda é MIT mas só dá `chroma`. Precisão de detectores de tom em pop (MIREX 2019, Billboard): 36–87% de acerto exato, com o erro clássico de trocar relativa maior/menor.
8. **Recomendação:** fonte principal **Cifra Club** (busca do próprio site + leitura de uma página por Música, no servidor, uma vez, com cache e crédito), sempre exibido como *sugestão editável*. Fallback: **o Ministro digita**, com o app abrindo o link da cifra encontrada (ou da busca) pra ele conferir em dois toques. Se a equipe julgar a cláusula (b) inaceitável, o fallback vira o principal sem mudar nada além de tirar a leitura automática.

## Comparativo das fontes

Legenda: ✅ atende; ⚠️ com ressalva; ❌ não atende. "Cobertura" = quantas das três músicas a fonte resolveu.

| Fonte | Chave / conta | Custo | Tem campo de tom? | Cobertura (3) | Precisão observada | Termos / robots | Veredito |
|---|---|---|---|---|---|---|---|
| **Cifra Club** (HTML) | ❌ nenhuma | US$ 0 | ✅ `Tom:` server-side, 1 por página | **3/3** | 3/3 batem com Spotify (via Tunebat/SongBPM) e outros sites de cifra | ⚠️ robots libera as cifras e bloqueia `/api/`; Aviso Legal proíbe "extração de dados" | **Principal (com ressalva)** |
| Cifra Club (busca `solr.sscdn.co`) | ❌ | US$ 0 | ❌ só título/artista/slug | 3/3 | n/a | ⚠️ endpoint interno não documentado, CORS `*` | Resolver a URL da cifra |
| Letras.mus.br | ❌ | US$ 0 | ❌ letra, sem tom | n/a | n/a | Aviso Legal sem cláusula de scraping | ❌ |
| Chordify | conta (freemium) | grátis/pago | ⚠️ mostra tom no Transpose (não confirmado) | não testável | n/a | ❌ Cloudflare bloqueia tudo (403); ToS não lido | ❌ |
| Ultimate Guitar | ❌ | US$ 0 | ⚠️ não verificado | Nívea sim; "Rio" e fhop não | n/a | ToS 6.2 proíbe reproduzir conteúdo; sem cláusula de bot; sem API oficial | ❌ |
| YouTube Data API v3 `videos.list` | chave (ticket 11) | 1 unidade/chamada de 10 000/dia | ❌ só descrição/tags | 0/3 mencionam tom | n/a | ✅ oficial | ❌ como fonte de tom |
| YouTube oEmbed | ❌ | US$ 0 | ❌ título/canal/thumb | n/a | n/a | ✅ | ❌ |
| Spotify Audio Features/Analysis | app + Premium + ≥ 250k MAU | US$ 0 mas inacessível | ✅ `key`, `mode`, `key_confidence` | inacessível | (era boa) | ❌ **Deprecated**; restrito a apps novos desde 27/11/2024 | ❌ |
| Deezer API | conta de dev (ToS); na prática sem chave | US$ 0, uso não comercial | ❌ só `bpm` e `gain` | 3/3 achadas | `bpm` = 0 em 2/3 | ToS: não comercial, sem engenharia reversa | ❌ |
| MusicBrainz | ❌ (User-Agent obrigatório, 1 req/s) | US$ 0 | ❌ | 1/3 (só Nívea) | n/a | ✅ | ❌ |
| AcousticBrainz | ❌ | US$ 0 | ✅ `tonal.key_key` | **0/3** | n/a | coleta encerrada em 2022 | ❌ |
| ReccoBeats | ❌ | US$ 0, comercial ok | ✅ (via Spotify) | **0/3** | n/a | ToS 25/05/2026 | ❌ |
| GetSongBPM API | chave por e-mail | US$ 0 + **backlink obrigatório** | ✅ `key_of` (não confirmado) | não testado | n/a | site atrás de Cloudflare; termos não lidos | ⚠️ candidato secundário não confirmado |
| Tunebat / SongBPM | ❌ | US$ 0 | ✅ (dados Spotify) | 3/3 (2 lidas) | Meia Noite B menor 98 BPM; Grato Sou A maior 130 BPM | Cloudflare; sem API | Só pra conferência manual |
| essentia.js (cliente) | ❌ | US$ 0 | ✅ `KeyExtractor` | sem áudio legal | 36–87% (MIREX 2019, outros sistemas) | **AGPL-3.0**; áudio do YouTube proibido | ❌ |
| meyda (cliente) | ❌ | US$ 0 | ❌ só `chroma` | sem áudio legal | teria que implementar | MIT | ❌ |

## Teste com as três músicas

| Música | Cifra Club (URL real) | Tom no Cifra Club | Conferência externa | Deezer | MusicBrainz | Descrição do vídeo oficial |
|---|---|---|---|---|---|---|
| Meia Noite, fhop music | [`/florianopolis-house-of-prayer/meia-noite/`](https://www.cifraclub.com.br/florianopolis-house-of-prayer/meia-noite/) | **Bm**, sem capotraste, `bpm: 100` no payload | SongBPM "B", 98 BPM, "Song data provided by Spotify"; Tunebat "B minor" | achada (`3150925331`, ISRC BXBFY2400126), `bpm: 0` | artista não existe | `hRJUcvsnqKs`: 0 menções, 0 capítulos |
| Rio, Nívea Soares | [`/nivea-soares/rio/`](https://www.cifraclub.com.br/nivea-soares/rio/) | **C**, sem capotraste | cifras.com.br, ukecifras e vagalume também em C | achada (`554479992`, ISRC BR0561700026), `bpm: 116.13` | 3 gravações "Rio", nenhuma no AcousticBrainz | `SRn3Nv4A8K8`: 0 menções, 0 capítulos |
| Grato Sou (I Thank God), DROPS | [`/drops-ina/grato-sou-i-thank-god/`](https://www.cifraclub.com.br/drops-ina/grato-sou-i-thank-god/) | **A**, sem capotraste | Tunebat "A major", 130 BPM | achada (`1981551197`, ISRC BC5LK2200005), `bpm: 0` | artista não existe | `Yo9G3hvl_UI`: 0 menções, 0 capítulos |

Lição do teste: os slugs "óbvios" deram 404 (`/fhop-music/meia-noite/`, `/drops/grato-sou/`). O Cifra Club cadastra a fhop como "Florianópolis House Of Prayer (fhop music)" e o DROPS como "Drops INA". Resolver a URL exige a busca do site, e o título do YouTube precisa de normalização antes ("Meia Noite (Ao Vivo) | fhop music" → "meia noite fhop").

## Detalhe por fonte

### Cifra Club

- **robots.txt** ([link](https://www.cifraclub.com.br/robots.txt)): `User-Agent: *` com `Disallow` em `/api/`, `/ajax/*.php`, `/esi/`, `/enviar/` etc. Páginas de artista e cifra não são bloqueadas. Há `Sitemap`.
- **Aviso Legal** ([link](https://www.cifraclub.com.br/aviso-legal.html), sem data de atualização; aplica-se a cifraclub.com.br, palcomp3.com, forum.cifraclub.com.br, guitarbattle.com.br e formesuabanda.com.br). Trecho literal: *"Ao utilizar qualquer de nossos sites você se compromete a nunca: (a) violar direitos autorais ou direitos da personalidade de terceiros; (b) usar quaisquer métodos de prospecção ou métodos semelhantes de extração de dados; (c) manipular ou de qualquer forma apresentar o site ou conteúdo usando 'enquadramento' ou tecnologia de navegação semelhante"*. Não há cláusula sobre API nem sobre desenvolvedores; a única menção a API é que "as aplicações do Cifra Club utilizam os serviços da API do YouTube".
- **API oficial:** não existe. A busca só devolve projetos não oficiais de scraping ([rafaelbmateus/cifraclub-api](https://github.com/code4music/cifraclub-api), [lucis/cifra-club-api](https://github.com/lucis/cifra-club-api)).
- **Onde está o tom no HTML:** página Next.js (~500 KB), renderizada no servidor. O rótulo `Tom<!-- -->:` é seguido de `<button type="button" class="…" data-anchor="--chord-tone">Bm</button>`. O atributo `data-anchor="--chord-tone"` aparece **exatamente uma vez** em cada uma das três páginas; as classes são hasheadas e não servem de seletor. Na mesma área vêm "Capotraste: Sem capotraste" e "Afinação: Padrão"; no payload escapado do React há `"strummings":[{"bpm":100,…}]` quando existe batida cadastrada.
- **Busca do site:** o HTML da cifra referencia `solr.sscdn.co`; `GET https://solr.sscdn.co/cc/h2/?q=meia%20noite%20fhop&wt=json` devolve `{"m":"Meia Noite","a":"Florianópolis House Of Prayer (fhop music)","d":"florianopolis-house-of-prayer","u":"meia-noite"}` (título, artista, slug do artista, slug da música; `t:"2"` parece marcar "música"). Responde com `Access-Control-Allow-Origin: *`, ou seja, pode ser chamada do próprio PWA. É endpoint interno, não documentado.
- **CORS da página de cifra:** nenhum header `Access-Control-*`; `Cache-Control: private, no-cache`. A leitura do HTML precisa passar por um servidor (um Worker da Stack A do ticket 03: 1 subrequest por Música nova).
- **Postura anti-bot:** nenhuma. `curl` com User-Agent padrão devolve 200; não há Cloudflare nem challenge.
- **O "Tom" é o da gravação?** O [guia oficial de envio](https://suporte.cifraclub.com.br/pt-BR/support/solutions/articles/64000236814-guia-para-envio-de-cifras-tablaturas-e-outras-transcric%C3%B5es) e o [post do blog](https://www.cifraclub.com.br/blog/como-enviar-cifras/) não dizem que o campo deve ser o tom da gravação; é o tom em que o colaborador escreveu a cifra principal. Empiricamente, nas três músicas coincidiu com o tom que o Spotify calculou (visto via Tunebat/SongBPM) e com os outros sites de cifra.
- **Custo pro app:** zero. Um Worker fazendo 1 fetch de ~500 KB por Música nova cabe folgado nos 100 mil requests/dia e nos 10 ms de CPU se o parsing for por `indexOf` em vez de DOM completo.

### Letras.mus.br

- **robots.txt** ([link](https://www.letras.mus.br/robots.txt)): bloqueia só rotas administrativas e `*ouvir.html`; as letras são indexáveis.
- **Aviso Legal** ([link](https://www.letras.mus.br/aviso-legal.html)): texto diferente do Cifra Club; não há cláusula sobre robôs ou extração. Sobre conteúdo: *"O conteúdo da assinatura é protegido por direitos autorais e disponibilizado mediante licença limitada, individual, intransferível e exclusivamente para uso pessoal e não comercial. É vedada sua reprodução, distribuição, exibição pública, modificação ou uso comercial sem autorização expressa"*.
- **Tom:** a página de letra não tem. Curiosidade que vira risco: `https://www.letras.mus.br/nivea-soares/rio/` redirecionou pra **"Há Um Rio"**, outra música. Slug parecido não garante a música certa.
- Veredito: não é fonte de tom.

### Chordify

- `https://chordify.net/robots.txt`, `/pages/terms-and-conditions/`, `/pages/terms` e o post de suporte "Share Chordify API" responderam **403 "Just a moment…"** (Cloudflare managed challenge) tanto via `curl` com User-Agent de navegador quanto via WebFetch. Qualquer acesso automatizado está bloqueado na prática.
- Segundo os resultados de busca (não confirmado na página): os Termos proíbem coletar conteúdo "using automated means (such as harvesting bots, robots, spiders, or scrapers)"; o pedido de API na comunidade de suporte não tem API pública como resposta; a ferramenta Transpose "shows you in which key the song is written" ([post do blog](https://chordify.net/pages/video-transpose-songs-to-any-key/), não aberto).
- Veredito: descartado.

### Ultimate Guitar

- **robots.txt** ([www](https://www.ultimate-guitar.com/robots.txt), [tabs](https://tabs.ultimate-guitar.com/robots.txt)): libera as páginas de tab; bloqueia `/search.php`, `/tab/applicature/transpose`, `/tab/download`, `/user/tab/view?*`.
- **Termos** ([link](https://www.ultimate-guitar.com/about/tos.htm), "Last updated August 24, 2026"): não há cláusula sobre bots, scraping ou API (a palavra "APIs" só aparece no título "ULTIMATE GUITAR WEBSITE, APPS, APIs. AND WIDGETS"). Cláusula 6.2: *"you have no right to provide any files obtained through the Service to any other party or through any other means. You agree that you will not duplicate or otherwise reproduce the Content, or any portion thereof […] except, however, that you may print out text-based Tablature and/or Lyrics for your personal, non-commercial use"*.
- **API oficial:** nenhuma; só scrapers da API do app móvel no GitHub ([Pilfer/ultimate-guitar-scraper](https://github.com/Pilfer/ultimate-guitar-scraper), [joncardasis/ultimate-api](https://github.com/joncardasis/ultimate-api)).
- **Cobertura:** Nívea Soares tem ≥ 10 tabs (Abre os Selos, Reina Sobre Mim, Que Se Abram os Céus…), mas "Rio" não apareceu; "Meia Noite" da fhop não existe; Drops não verificado.
- Veredito: descartado (cobertura fraca e sem API).

### YouTube: Data API v3, oEmbed e descrição do vídeo

- **`videos.list`** ([doc](https://developers.google.com/youtube/v3/docs/videos)): `snippet.title` (≤ 100 caracteres), `snippet.description` (≤ 5 000 bytes; "pode incluir timestamps formatados para criar capítulos"), `snippet.tags[]`, `contentDetails.duration`, `topicDetails.relevantTopicIds[]` (só gêneros como `/m/04rlf` Music). **Não há campo de tom nem de capítulos estruturados.** Custo **1 unidade** por chamada, cota padrão **10 000 unidades/dia** ([quota](https://developers.google.com/youtube/v3/determine_quota_cost)). Exige chave (a mesma do ticket 11).
- **oEmbed** (`https://www.youtube.com/oembed?url=…&format=json`, testado sem chave): devolve `title`, `author_name`, `author_url`, `thumbnail_url`, `html`. Sem descrição.
- **Descrições dos vídeos oficiais** (lidas pra esta pesquisa a partir do `shortDescription` da página; no app, só via `videos.list`): Meia Noite (`hRJUcvsnqKs`, 4 288 caracteres: letra e compositores), Rio Versão Estendida (`SRn3Nv4A8K8`, 1 871: links e tags) e Grato Sou (`Yo9G3hvl_UI`, 4 512: playlist e outras músicas). Contagem de "tom", "tom:", "key", "tonalidade", "bpm", "cifra", "acorde": **0** em todas. Linhas com timestamp: **0**. Descrição não é fonte de tom nesse repertório.
- **Termos de Serviço** ([link](https://www.youtube.com/t/terms), versão pt-BR): proíbe "acessar, reproduzir, fazer download, distribuir […] qualquer parte do Serviço ou qualquer Conteúdo, exceto (a) se autorizado de forma expressa pelo Serviço; ou (b) mediante uma permissão prévia por escrito do YouTube" e "acessar o Serviço usando qualquer meio automatizado (como robôs, botnets ou scrapers), exceto (a) no caso de mecanismos de pesquisa públicos compatíveis com o arquivo robots.txt do YouTube".
- **Developer Policies** ([link](https://developers.google.com/youtube/terms/developer-policies)): III.E.1 proíbe "download, import, backup, cache, or store copies of YouTube audiovisual content"; III.I.7 proíbe "separate, isolate, or modify the audio or video components"; III.E.6 proíbe scraping; III.I.14 proíbe "use any technology other than YouTube API Services to access or retrieve API Data"; III.E.4 limita o armazenamento de dados não autorizados a 30 dias. O tom digitado ou confirmado pelo Ministro é dado do app, não "API Data".
- Veredito: útil pra título e canal (já previsto no ticket 02), inútil pra tom.

### Spotify Web API

- **Referência de Audio Features** ([link](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)) e **Audio Analysis** ([link](https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis)): ambas com marcador **"Deprecated"** em 04/09/2026. Campos: `key` ("Integers map to pitches using standard Pitch Class notation. E.g. 0 = C, 1 = C♯/D♭, 2 = D, and so on. If no key was detected, the value is -1"), `mode` ("Major is represented by 1 and minor is 0"), e na análise `key_confidence` (0–1).
- **Anúncio de 27/11/2024** ([link](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api)): restringiu Related Artists, Recommendations, **Audio Features**, **Audio Analysis**, Featured Playlists, Category's Playlists, preview de 30 s em multi-get e playlists editoriais, pra "apps em modo desenvolvimento sem requisição de extensão pendente" e "aplicações registradas a partir de 27 de novembro de 2024". Apps com acesso estendido prévio mantêm.
- **Quota modes** ([link](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)): Development Mode aceita "up to 5 authenticated Spotify users", cada um allowlistado, e o dono precisa de Premium. Extended Quota Mode, "conforme atualização de maio de 2025", só pra organizações: entidade comercial legalmente estabelecida, serviço lançado, **≥ 250 000 usuários ativos mensais**, presença em mercados-chave, viabilidade comercial.
- Contexto de 2026 (secundário, [TechCrunch 06/02/2026](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/)): usuários de teste caíram de 25 pra 5 e Premium passou a ser obrigatório. Alternativas apontadas pela comunidade (ReccoBeats) abaixo.
- Veredito: fechado. Um app novo de ministério não tem como obter `key` do Spotify.

### Deezer API

- **Simple API testada sem chave:** `GET https://api.deezer.com/search?q=nivea%20soares%20rio` e `GET https://api.deezer.com/track/{id}` respondem. Campos do Track: `available_countries, bpm, disk_number, duration, explicit_*, gain, id, isrc, link, md5_image, preview, rank, readable, release_date, share, title, title_short, title_version, track_position, track_token, type` + `artist`, `album`, `contributors`. **Sem tom.** `bpm` = 116.13 (Rio), 0 (Meia Noite), 0 (Grato Sou). `preview` é um MP3 de 30 s com token.
- **Termos** ([link](https://developers.deezer.com/termsofuse)): exige conta de desenvolvedor com "informações verdadeiras e completas"; "o uso dos Serviços é estritamente limitado para fins não comerciais"; proíbe "modificar, editar, desmontar ou fazer engenharia reversa" e contornar DRM. A página de docs do objeto Track ([link](https://developers.deezer.com/api/track)) pede login pra aceitar os termos da Simple API.
- Veredito: boa pra ISRC e metadados, inútil pra tom.

### MusicBrainz e AcousticBrainz

- **MusicBrainz API** ([doc](https://musicbrainz.org/doc/MusicBrainz_API)): sem chave ("you must have a meaningful user-agent string"), limite de "ONE call per second". Não há atributo de tonalidade em recording nem em work. Teste: artista "Nívea Soares" existe (`f1ec7cab-…`) com 3 gravações "Rio"; "fhop music" e "Drops INA" não existem; lookup por ISRC das três gravações (vindos da Deezer) devolveu **404**.
- **AcousticBrainz** ([home](https://acousticbrainz.org/)): "In 2022, the decision was made to stop collecting data"; "For now, the website and its API will continue to be available"; última estatística 2022-07-06. A API ainda responde e tem `tonal.key_key`, `key_scale`, `key_strength` (teste com uma gravação famosa devolveu D# major, strength 0.86), mas as 3 gravações de "Rio" deram **404** e `count` devolveu mapeamento vazio. Nada lançado depois de 2022 vai existir lá.
- Veredito: descartado.

### Fontes extras que apareceram na pesquisa

- **ReccoBeats** ([ToS 25/05/2026](https://reccobeats.com/docs/documentation/terms-of-service), [rate limit](https://reccobeats.com/docs/documentation/rate-limiting)): "does not require an API access key or any authentication. The service is entirely free to use for both personal and commercial projects"; metadados-base "aggregated from Spotify data"; limites internos não divulgados (429 ao estourar). Teste `GET https://api.reccobeats.com/v1/track/search?searchText=…`: `totalElements: 0` pras três músicas. Sem cobertura de louvor brasileiro.
- **GetSongBPM** ([api](https://getsongbpm.com/api), 403 Cloudflare): pelas fontes secundárias ([MusicTech Lab](https://musictechlab.io/blog/software-development/integrating-tempus-metronome-with-the-getsongbpm-api-what-bpm-really-means-and-how-to-use-it), [FindAPIs](https://findapis.com/en/api/getsong-bpm)), chave gratuita por cadastro de e-mail, "3,000 requests per hour", campo `key_of`, e "The API terms require a backlink to GetSongBPM in your app or website" (conta suspensa sem aviso se faltar). `GET https://api.getsong.co/search/?type=song&lookup=…` sem chave responde `{"error":"API Key is missing."}` (401), então a API está no ar. Cobertura de louvor brasileiro não testada.
- **Tunebat e SongBPM**: mostram tom e BPM "provided by Spotify" (SongBPM diz isso na página). Tunebat tem [Rio](https://tunebat.com/Info/Rio-N-vea-Soares/3qqgkNkNwblf0lZmgsEbDe), [Meia Noite](https://tunebat.com/Info/Meia-Noite-Ao-Vivo-fhop-music/1CJmhl3D2xcWhEC4nTslPD) e Grato Sou. Ambos atrás de Cloudflare, sem API. Servem pro Ministro conferir à mão, não pro app.

### Estimativa de tom no cliente (análise de áudio)

- **De onde viria o áudio?** O IFrame Player não expõe o sinal de áudio pra Web Audio (origem cruzada). Baixar o áudio do vídeo viola os Termos do YouTube ("fazer download") e as Developer Policies III.E.1 e III.I.7. Capturar o som da aba com `getDisplayMedia({audio:true})` não existe no Safari iOS (`version_added: false` no [browser-compat-data do MDN](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/MediaDevices.json)), e a equipe é majoritariamente iPhone (ticket 03). Sobra o microfone (`getUserMedia`, Safari 11+), ou seja, "encosta o celular na caixa": legal, mas precisão sem medição e UX ruim. O `preview` de 30 s da Deezer seria tecnicamente analisável, mas os termos são não comerciais e não tratam de análise de áudio; não explorado.
- **essentia.js** ([GitHub](https://github.com/MTG/essentia.js), [npm](https://registry.npmjs.org/essentia.js)): licença **AGPL-3.0**; último release **v0.1.3 em 24/06/2021**, 10,1 MB descompactado; repositório não arquivado, último push 10/12/2025, 49 issues abertas. Tem `KeyExtractor(audio, …, profileType='bgate', …)` → `{key, scale, strength}` e `Key(pcp, …)` ([API](https://mtg.github.io/essentia.js/docs/api/Essentia.html)). A [política de licenciamento do Essentia](https://essentia.upf.edu/licensing_information.html) é AGPLv3 "for non-commercial applications" com licença comercial via MTG/UPF. Num PWA o código roda no navegador do usuário, o que caracteriza distribuição: o app passaria a ter que ser AGPL (interpretação minha, não jurídica).
- **meyda** ([GitHub](https://github.com/meyda/meyda), [features](https://meyda.js.org/audio-features)): **MIT**, v5.6.3 (21/04/2024), 556 KB. Tem `chroma` ("how much of each chromatic pitch class […] exists in the signal"), mas não tem detecção de tom; seria preciso implementar Krumhansl-Schmuckler em cima.
- **Precisão:** a [referência do algoritmo Key do Essentia](https://essentia.upf.edu/reference/std_Key.html) lista 14 perfis (krumhansl, temperley, edma, bgate…) sem números; só diz que "krumhansl funciona bem em pop". No [MIREX 2019](https://music-ir.org/mirex/wiki/2019:Audio_Key_Detection_Results) (outros sistemas, não o Essentia), no dataset pop Billboard2012Key o acerto exato ("Correct") variou de **36,3% a 87,0%**, com 4–13% de erro pra relativa (Bm ↔ D) e 1–14% pra paralela; no GiantSteps (EDM) 39,7–69,0%. Pra louvor, com pads, introduções modais e final em relativa, é esperar erro frequente justamente no caso que mais importa pra quem canta.
- Veredito: descartado. Sem fonte legal de áudio no iOS, com licença AGPL na única lib pronta e precisão que exigiria confirmação humana de qualquer jeito.

## Recomendação

**Fonte principal: Cifra Club, campo `Tom:` da cifra principal, lido uma vez por Música e sempre mostrado como sugestão editável.**

Fluxo proposto no cadastro pelo link do YouTube:

1. O app já tem título e canal via `videos.list` (ticket 02/11). Normaliza o título: remove "(Ao Vivo)", "| canal", "Clipe Oficial", "Lyric Video", e monta a query "título artista".
2. Chama a busca do próprio Cifra Club (`solr.sscdn.co/cc/h2/?q=…&wt=json`), que tem CORS aberto e responde do cliente. Mostra os candidatos (título + artista como o Cifra Club cadastra) e o Ministro escolhe; quando só há um resultado com score alto, pré-seleciona.
3. Um Worker faz **um** `fetch` da página `https://www.cifraclub.com.br/{d}/{u}/`, localiza `data-anchor="--chord-tone"` e extrai o texto do botão. Guarda em `Música.tomOriginalSugerido` junto com `fonte` ("Cifra Club"), `url` e `data`. Nunca guarda a cifra, só o tom e o link.
4. O Ministro vê "Tom original sugerido: Bm (Cifra Club)" com o link, confirma ou edita. Depois da primeira Execução, a sugestão passa a ser o "último Tom" (regra já escrita em `docs/dominio/escala.md`); o tom original fica como referência.

Por que é o mais defensável possível diante da cláusula (b) do Aviso Legal: uma página por Música, disparada por um gesto humano, resultado guardado pra sempre (tom não muda), User-Agent identificando o app e um contato, nenhum conteúdo republicado além do tom, e link de volta ao Cifra Club. Ainda assim é "extração de dados" no sentido literal. Se a equipe não quiser carregar esse risco, a variante limpa é o fallback abaixo com deep link: custa um botão e zero servidor.

**Fallback: o Ministro digita.** O campo aceita `A`, `Bm`, `F#m` etc. e o app oferece "Conferir no Cifra Club" apontando pra URL da cifra encontrada no passo 2 (ou pra `https://www.cifraclub.com.br/?q=…` se não houver candidato) e, opcionalmente, um link de busca no Tunebat. São dois toques em vez de "procurar no Google na hora", e é 100% dentro dos termos de todo mundo.

Descartados e por quê: Spotify (deprecado e restrito a organizações com 250 mil MAU), YouTube (sem campo de tom; 0/3 descrições ajudam), Deezer (sem tom), MusicBrainz/AcousticBrainz (sem cobertura; coleta parada em 2022), ReccoBeats (0/3), Chordify (Cloudflare, sem API), Ultimate Guitar (sem API, cobertura fraca), análise no cliente (sem áudio legal no iOS, AGPL, precisão insuficiente). GetSongBPM fica como candidato secundário a testar se um dia o Cifra Club falhar: custa cadastro de e-mail e um backlink permanente.

Implicação pro domínio: Música ganha `tomOriginal` (com fonte e data) separado de `últimoTom`. Música Legado importada da playlist (ticket 02) pode passar pelo mesmo fluxo em lote **só se** for disparado item a item pelo Ministro; rodar 101 fetches automáticos na importação é exatamente a "prospecção" que o Aviso Legal proíbe.

## O que não foi confirmado em fonte primária

1. **Chordify**: robots.txt, Termos e existência de API. Tudo respondeu 403 (Cloudflare). O que está aqui vem de trechos de resultados de busca.
2. **GetSongBPM**: termos oficiais, campos exatos (`key_of`), limite de 3 000 req/h e regra de backlink. A página `getsongbpm.com/api` respondeu 403; fontes são um blog de integração e um diretório de APIs. Cobertura de louvor brasileiro não testada (exige chave).
3. **Se a cláusula (b) do Aviso Legal do Cifra Club alcança uma leitura por Música disparada por humano.** É interpretação minha; não houve contato com a Studio Sol. Também não achei termos específicos pro endpoint `solr.sscdn.co`, que é interno e pode mudar ou ganhar limite sem aviso.
4. **"Tom" do Cifra Club = tom da gravação.** Nenhuma regra editorial encontrada no guia de envio nem no blog. Confirmação é só empírica (3/3 coincidem com dados derivados do Spotify e com outros sites de cifra).
5. **Mudança de fevereiro/2026 no Development Mode do Spotify** (5 usuários, Premium obrigatório): o post oficial na comunidade respondeu 403; a fonte é o TechCrunch. A página oficial de Quota Modes reflete o estado atual (5 usuários, Premium) e foi lida.
6. **Precisão do essentia.js em louvor brasileiro**: nenhuma medição; os números do MIREX são de outros sistemas e datasets. A referência do Essentia não publica acurácia.
7. **Ultimate Guitar**: se o campo de tonalidade existe nas páginas e a cobertura de Drops/fhop. A busca do site (`/search.php`) é vedada no robots.txt e não foi usada.
8. **Tunebat, tom de "Rio"**: página existe mas não foi aberta (Cloudflare). Meia Noite e Grato Sou vieram de snippets de busca e da página do SongBPM.
9. **MusicBrainz**: "fhop music" e "Drops INA" podem existir sob outros nomes; a busca foi por esses dois termos e por ISRC.
10. **AcousticBrainz**: "for now" não tem data de desligamento.
11. **Deezer**: se um app de ministério sem receita conta como "não comercial" pros termos; se a análise do `preview` de 30 s seria permitida. Não avaliado.
12. **`getUserMedia` em PWA standalone no iOS**: o browser-compat-data diz que Safari iOS espelha o Safari (11+); peculiaridades do modo standalone não foram verificadas.
13. **Custo de CPU do parsing de 500 KB num Worker Free (10 ms)**: não medido; a estimativa de "cabe com `indexOf`" é raciocínio, não teste.
14. **Interpretação da AGPL-3.0 pra código rodando no navegador**: leitura leiga da licença; não é parecer jurídico.

## Fontes

Acessadas em 04/09/2026.

- Cifra Club: [robots.txt](https://www.cifraclub.com.br/robots.txt), [Aviso Legal](https://www.cifraclub.com.br/aviso-legal.html), [Rio](https://www.cifraclub.com.br/nivea-soares/rio/), [Meia Noite](https://www.cifraclub.com.br/florianopolis-house-of-prayer/meia-noite/), [Grato Sou (I Thank God)](https://www.cifraclub.com.br/drops-ina/grato-sou-i-thank-god/), [guia de envio](https://suporte.cifraclub.com.br/pt-BR/support/solutions/articles/64000236814-guia-para-envio-de-cifras-tablaturas-e-outras-transcric%C3%B5es), [blog: como enviar cifras](https://www.cifraclub.com.br/blog/como-enviar-cifras/), busca interna `https://solr.sscdn.co/cc/h2/?q=…&wt=json`.
- Letras.mus.br: [robots.txt](https://www.letras.mus.br/robots.txt), [Aviso Legal](https://www.letras.mus.br/aviso-legal.html).
- Chordify: [robots.txt](https://chordify.net/robots.txt) (403), [Termos](https://chordify.net/pages/terms-and-conditions/) (403), [post "Share Chordify API"](https://support.chordify.net/hc/en-us/community/posts/360005529718-Share-Chordify-API) (403).
- Ultimate Guitar: [robots.txt](https://www.ultimate-guitar.com/robots.txt), [robots.txt tabs](https://tabs.ultimate-guitar.com/robots.txt), [Terms of Service](https://www.ultimate-guitar.com/about/tos.htm).
- YouTube: [videos resource](https://developers.google.com/youtube/v3/docs/videos), [quota cost](https://developers.google.com/youtube/v3/determine_quota_cost), [Developer Policies](https://developers.google.com/youtube/terms/developer-policies), [Termos de Serviço](https://www.youtube.com/t/terms), oEmbed `https://www.youtube.com/oembed`, vídeos `hRJUcvsnqKs`, `SRn3Nv4A8K8`, `Yo9G3hvl_UI`.
- Spotify: [Get Track's Audio Features](https://developer.spotify.com/documentation/web-api/reference/get-audio-features), [Get Track's Audio Analysis](https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis), [Changes to the Web API, 27/11/2024](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api), [Quota modes](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), [TechCrunch 06/02/2026](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/) (secundária).
- Deezer: [Terms of use](https://developers.deezer.com/termsofuse), [Track](https://developers.deezer.com/api/track), `https://api.deezer.com/search`, `https://api.deezer.com/track/{id}`.
- MusicBrainz / AcousticBrainz: [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API), `https://musicbrainz.org/ws/2/…`, [AcousticBrainz](https://acousticbrainz.org/), `https://acousticbrainz.org/api/v1/{mbid}/low-level`.
- ReccoBeats: [Terms of Service](https://reccobeats.com/docs/documentation/terms-of-service), [Rate limiting](https://reccobeats.com/docs/documentation/rate-limiting), `https://api.reccobeats.com/v1/track/search`.
- GetSongBPM: [API](https://getsongbpm.com/api) (403), [MusicTech Lab](https://musictechlab.io/blog/software-development/integrating-tempus-metronome-with-the-getsongbpm-api-what-bpm-really-means-and-how-to-use-it), [FindAPIs](https://findapis.com/en/api/getsong-bpm), `https://api.getsong.co/search/`.
- Tunebat / SongBPM: [Rio](https://tunebat.com/Info/Rio-N-vea-Soares/3qqgkNkNwblf0lZmgsEbDe), [Meia Noite](https://tunebat.com/Info/Meia-Noite-Ao-Vivo-fhop-music/1CJmhl3D2xcWhEC4nTslPD), [SongBPM Meia Noite](https://songbpm.com/@fhop-music/meia-noite-ao-vivo-m0smq), [SongBPM Grato Sou](https://songbpm.com/@drops-ina/grato-sou-i-thank-god-ao-vivo-lu6tk).
- Análise de áudio: [essentia.js](https://github.com/MTG/essentia.js), [essentia.js API](https://mtg.github.io/essentia.js/docs/api/Essentia.html), [npm essentia.js](https://registry.npmjs.org/essentia.js), [Essentia licensing](https://essentia.upf.edu/licensing_information.html), [Essentia Key](https://essentia.upf.edu/reference/std_Key.html), [meyda](https://github.com/meyda/meyda), [meyda features](https://meyda.js.org/audio-features), [npm meyda](https://registry.npmjs.org/meyda), [MIREX 2019 Audio Key Detection Results](https://music-ir.org/mirex/wiki/2019:Audio_Key_Detection_Results), [MDN browser-compat-data MediaDevices](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/MediaDevices.json).
- Outros sites de cifra usados só pra conferência: [cifras.com.br Rio](https://www.cifras.com.br/cifra/nivea-soares/rio), [ukecifras Rio](https://www.ukecifras.com.br/nivea-soares/rio), [vagalume Rio](https://www.vagalume.com.br/nivea-soares/rio-cifrada.html).
