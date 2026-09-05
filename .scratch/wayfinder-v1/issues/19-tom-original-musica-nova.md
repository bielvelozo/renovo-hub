# Tom original de uma Música nova: de onde tirar

Type: research
Status: resolved
Blocked by: 
Map: ../map.md

## Question

Surgiu no teste do protótipo do Ministro (ticket 13, ponto 3): ao cadastrar uma Música nova pelo link do YouTube, o app precisa sugerir o tom original da gravação, senão quem monta a Escala vai procurar no Google na hora. De onde tirar esse tom, a custo zero e sem violar termos de uso? Candidatos a investigar em fonte primária: Cifra Club e similares (têm campo "tom" por cifra; existe API ou só HTML?), Letras.mus.br, Chordify, Ultimate Guitar, metadados do próprio vídeo (descrição, capítulos), Spotify Audio Features (`key`, mas o endpoint foi restringido pra apps novos em novembro de 2024: confirmar o estado atual), Deezer, MusicBrainz/AcousticBrainz, e estimativa de tom no cliente por análise de áudio (viável num PWA? bibliotecas JS, licença). Pra cada fonte: precisa de chave ou conta, custo, cobertura de louvor brasileiro, precisão do tom, termos de uso. Saída: recomendação de uma fonte principal e um fallback (o Ministro digita), com o que não foi confirmado marcado.

## Answer

Resolvido em 04/09/2026 por subagente de pesquisa (a primeira tentativa travou; a segunda concluiu). Detalhe completo, com fontes, datas de acesso e testes, em `docs/research/tom-original.md` na branch `research/tom-original` (commit 68b1885).

**Só uma fonte resolve: o Cifra Club.** Foi a única que devolveu o tom das três músicas de teste (Rio em C, Meia Noite em Bm, Grato Sou em A). O tom vem no HTML da página da cifra, num único atributo, sem chave e sem bloqueio; a busca interna do site aceita chamada do navegador e acha a cifra a partir do título do vídeo do YouTube. Não existe API oficial.

**O problema é contratual, não técnico.** O Aviso Legal do Cifra Club proíbe "métodos de extração de dados". Uma leitura por Música, disparada pelo Ministro ao cadastrar, com cache permanente e link de volta pra cifra, é o uso mais defensável, mas é uma decisão consciente de risco, não algo liberado. Isso virou o ticket [Tom original: ler do Cifra Club automaticamente ou só linkar](21-tom-original-decisao.md).

**Fallback: o Ministro digita**, com um botão "Conferir no Cifra Club" apontando pra cifra encontrada (dois toques). Se a decisão for não ler automaticamente, esse fallback vira o principal só removendo a leitura.

**Descartados com teste ou fonte primária**: Spotify (Audio Features marcado como descontinuado, apps novos bloqueados desde 27/11/2024, modo estendido só pra organizações com 250 mil usuários mensais); YouTube Data API (`videos.list` não tem campo de tom e nenhuma das três descrições ajuda; as Developer Policies inviabilizam analisar o áudio do vídeo); Deezer (sem tom); MusicBrainz e AcousticBrainz (nada nas três, coleta parada em 2022); ReccoBeats (nada); Chordify (bloqueia tudo com 403); Ultimate Guitar (sem API, sem as músicas); análise de áudio no cliente (essentia.js é AGPL e parado desde 2021, captura de áudio inexistente no Safari iOS, precisão de 36 a 87% em música pop).

**Não confirmado em fonte primária** (14 itens no documento), os que mais pesam: termos do Chordify e do GetSongBPM (atrás de Cloudflare); se o "Tom" do Cifra Club é sempre o da gravação de referência, e não de uma versão simplificada (só evidência empírica, 3 de 3); a mudança de fevereiro de 2026 do Spotify, vista só em imprensa.
