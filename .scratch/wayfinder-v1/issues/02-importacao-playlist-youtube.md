# Importar a playlist do YouTube: API, cota e o que vem de cada vídeo

Type: research
Status: open
Blocked by: 
Map: ../map.md

## Question

Como ler todos os itens da playlist pública https://www.youtube.com/playlist?list=PLMRN_VbzEeFs e transformar em Músicas Legado? Verificar nas docs oficiais: YouTube Data API v3 (`playlistItems.list`, paginação, cota diária grátis, necessidade de chave e projeto Google Cloud), oEmbed (título e thumbnail sem chave, limites), e alternativas sem chave pra um import único. Confirmar formato de deep link com minutagem (`?t=` / `&start=`) pro YouTube e se o Spotify oferece algo equivalente. Contar quantos vídeos a playlist tem hoje e amostrar 10 títulos pra ver o padrão "Artista - Música" que a regra de importação vai precisar parsear.
