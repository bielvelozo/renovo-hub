# Playlist do Repertório no YouTube sem conta

Type: research
Status: resolved
Blocked by: 
Map: ../map.md

## Question

Surgiu no teste do protótipo do Ministro (ticket 13, ponto 9): o app deveria gerar uma playlist a partir das Músicas inteiras do Repertório de uma Escala, pra quem vai tocar ouvir em loop, sem que ninguém precise de conta do YouTube nem de chave de API. Investigar em fonte primária e por teste real: o link `https://www.youtube.com/watch_videos?video_ids=<id1>,<id2>,...` (não documentado): ainda funciona, quantos ids aceita, abre no app do YouTube no iPhone e no Android ou só no navegador, faz loop; a alternativa por embed `youtube.com/embed/<id1>?playlist=<id2>,<id3>&loop=1` (documentada nos parâmetros do player): funciona em Safari iOS dentro de um PWA, dá pra ir de tela cheia; e o caminho oficial `playlists.insert` da Data API v3 (OAuth do usuário, 50 unidades por inserção) só pra registrar por que não. Saída: recomendação com o que foi verificado por teste e o que ficou sem confirmação.

## Answer

Resolvido em 04/09/2026 por subagente de pesquisa. Detalhe completo, com fontes, datas de acesso e os testes feitos, em `docs/research/playlist-repertorio.md` na branch `research/playlist-repertorio` (commit f3f36f5).

**Recomendação: o link `https://www.youtube.com/watch_videos?video_ids=<id1>,<id2>,...`**, gerado na hora do toque e aberto fora do PWA, com a instrução "toque em Repetir playlist". Data API descartada (exige OAuth do usuário e 50 unidades por inserção); embed só como opção secundária.

Verificado por teste em 04/09/2026 (curl e Chrome):

- O link responde 303 pra `watch?v=<id1>&list=TLGG…`, uma lista temporária "Untitled List". Mesmo destino com user agent de iPhone e Android e em `m.youtube.com`. `youtu.be/watch_videos` não funciona.
- **Máximo 50 ids**: 51, 100, 200 e 245 ids viram 50. Duplicatas são mantidas.
- **Qualquer id inexistente ou malformado derruba a lista inteira**: redireciona pra `watch?v=` sem `list`. O app precisa validar os ids antes; o oEmbed do YouTube serve pra isso sem chave (200 pra id real, 404 pra inexistente, 400 pra malformado).
- O id `TLGG…` embute a data UTC; trocar a data invalida a lista. **Nunca guardar a URL redirecionada**, só regenerar o link `watch_videos` a cada toque.
- Loop no `watch_videos` é manual: botão "Repetir playlist" (desktop e m.youtube.com). Ligado, o último vídeo volta pro primeiro; desligado, o Autoplay pula pra vídeo recomendado fora do Repertório.
- Embed (`embed/<id>?playlist=…&loop=1`): loop automático funciona, aceita 245 ids, id inválido é ignorado. Mas o vídeo da Fhop (`hRJUcvsnqKs`) **não é incorporável** (erro 150) e o player trava sem pular, e abrir o embed sem Referer dá erro 153. Só funciona dentro de página do app, e não com todo vídeo.

Doc oficial: `playlist`, `loop` e `playsinline` existem nos parâmetros do IFrame Player, sem limite documentado; a Data API exige escopo `youtube` ou `youtube.force-ssl`, 50 unidades por `playlists.insert` e por `playlistItems.insert`, cota de 10.000 por dia. Os Termos de Serviço BR (2022) e US (2023) não proíbem montar o link; as Developer Policies só valem pra "API Services", e o link não é um.

**Não confirmado em fonte primária**: validade do `TLGG…` além do dia; id existente mas privado; persistência do botão de loop; comportamento em Safari iOS e dentro do PWA (autoplay, tela cheia, segundo plano); se o app do YouTube no iPhone e no Android abre o caminho `/watch_videos` (o AASA do youtube.com cobre o caminho, mas precisa de aparelho real); qualquer declaração oficial sobre `watch_videos`.

Consequências pro v1: o botão "Ouvir o Repertório no YouTube" do protótipo já faz o certo (link gerado na hora, só Músicas inteiras). Faltam: limitar a 50, validar ids via oEmbed antes de montar, e o texto "toque em Repetir playlist". O teste no iPhone real entra no ticket do onboarding, que já exige aparelho de verdade.
