# Playlist do Repertório no YouTube sem conta

Type: research
Status: open
Blocked by: 
Map: ../map.md

## Question

Surgiu no teste do protótipo do Ministro (ticket 13, ponto 9): o app deveria gerar uma playlist a partir das Músicas inteiras do Repertório de uma Escala, pra quem vai tocar ouvir em loop, sem que ninguém precise de conta do YouTube nem de chave de API. Investigar em fonte primária e por teste real: o link `https://www.youtube.com/watch_videos?video_ids=<id1>,<id2>,...` (não documentado): ainda funciona, quantos ids aceita, abre no app do YouTube no iPhone e no Android ou só no navegador, faz loop; a alternativa por embed `youtube.com/embed/<id1>?playlist=<id2>,<id3>&loop=1` (documentada nos parâmetros do player): funciona em Safari iOS dentro de um PWA, dá pra ir de tela cheia; e o caminho oficial `playlists.insert` da Data API v3 (OAuth do usuário, 50 unidades por inserção) só pra registrar por que não. Saída: recomendação com o que foi verificado por teste e o que ficou sem confirmação.
