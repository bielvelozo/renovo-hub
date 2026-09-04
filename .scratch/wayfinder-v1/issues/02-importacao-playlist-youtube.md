# Importar a playlist do YouTube: API, cota e o que vem de cada vídeo

Type: research
Status: resolved
Findings: branch research/importacao-playlist-youtube, arquivo docs/research/importacao-playlist-youtube.md
Blocked by: 
Map: ../map.md

## Question

Como ler todos os itens da playlist pública https://www.youtube.com/playlist?list=PLMRN_VbzEeFs e transformar em Músicas Legado? Verificar nas docs oficiais: YouTube Data API v3 (`playlistItems.list`, paginação, cota diária grátis, necessidade de chave e projeto Google Cloud), oEmbed (título e thumbnail sem chave, limites), e alternativas sem chave pra um import único. Confirmar formato de deep link com minutagem (`?t=` / `&start=`) pro YouTube e se o Spotify oferece algo equivalente. Contar quantos vídeos a playlist tem hoje e amostrar 10 títulos pra ver o padrão "Artista - Música" que a regra de importação vai precisar parsear.

## Answer

Resolvido em 03/09/2026 por subagente de pesquisa. Detalhe completo, com fontes e anexo dos 111 itens, em `docs/research/importacao-playlist-youtube.md` na branch `research/importacao-playlist-youtube` (commit 81dab40).

- A playlist é a "Playlist Missão Renovo", do canal Missão Renovo, com 111 itens e 101 vídeos únicos (10 repetidos).
- Caminho oficial: YouTube Data API v3 `playlistItems.list`, 1 unidade por chamada, 50 itens por página. A playlist inteira custa 3 unidades (mais 3 de `videos.list` pra duração) contra uma cota grátis de 10.000 por dia. Playlist pública exige só chave de API, sem OAuth, mas precisa de projeto no Google Cloud. Isso confirma que "Criar projeto Google Cloud e chave da YouTube Data API" deve acontecer.
- oEmbed funciona sem chave, mas só devolve título, canal e thumbnail de um vídeo por vez. Serve pra enriquecer um link colado no app, não pra importar.
- RSS da playlist devolve só 15 itens (limite observado, não documentado). Serve pra detectar novidade, não pra importar.
- yt-dlp traz tudo sem chave, mas é não oficial e viola a política do YouTube; no máximo script local único, nunca no app.
- Títulos não têm padrão único: separadores " - ", " | ", " // ", " • ", e a ordem Artista/Música varia nos dois sentidos. 7 medleys reais, 3 uniões de artistas, 6 lives com mais de 15 minutos, e duas músicas em gravações diferentes. Revisão humana é obrigatória.
- Deep link com minutagem: embed usa `start=` e `end=` em segundos (oficial); link de compartilhamento gera `youtu.be/<id>?t=90` (verificado por comportamento, não documentado). Spotify não tem timestamp pra música.
- Thumbnail deriva do `videoId`: `i.ytimg.com/vi/<id>/hqdefault.jpg` pra lista, `maxresdefault.jpg` com fallback. Guardar só o id.
- Recomendação: import único via Data API em script local gerando CSV com sugestão de título/artista e flags de suspeito; Gabriel revisa as 101 linhas; seed como Legado. Depois o catálogo é mantido no app.
- Não confirmado em fonte primária: limite 15 do RSS, formato `?t=`, comportamento do `t=` abrindo o app do YouTube no iPhone, limites do oEmbed, padrão de URL das thumbnails.
