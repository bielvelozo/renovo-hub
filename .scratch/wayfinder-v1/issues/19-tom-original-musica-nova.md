# Tom original de uma Música nova: de onde tirar

Type: research
Status: open
Blocked by: 
Map: ../map.md

## Question

Surgiu no teste do protótipo do Ministro (ticket 13, ponto 3): ao cadastrar uma Música nova pelo link do YouTube, o app precisa sugerir o tom original da gravação, senão quem monta a Escala vai procurar no Google na hora. De onde tirar esse tom, a custo zero e sem violar termos de uso? Candidatos a investigar em fonte primária: Cifra Club e similares (têm campo "tom" por cifra; existe API ou só HTML?), Letras.mus.br, Chordify, Ultimate Guitar, metadados do próprio vídeo (descrição, capítulos), Spotify Audio Features (`key`, mas o endpoint foi restringido pra apps novos em novembro de 2024: confirmar o estado atual), Deezer, MusicBrainz/AcousticBrainz, e estimativa de tom no cliente por análise de áudio (viável num PWA? bibliotecas JS, licença). Pra cada fonte: precisa de chave ou conta, custo, cobertura de louvor brasileiro, precisão do tom, termos de uso. Saída: recomendação de uma fonte principal e um fallback (o Ministro digita), com o que não foi confirmado marcado.
