# Tom original: ler do Cifra Club automaticamente ou só linkar

Type: grilling
Status: resolved
Blocked by: 19
Map: ../map.md

## Question

A pesquisa [Tom original de uma Música nova: de onde tirar](19-tom-original-musica-nova.md) concluiu que o Cifra Club é a única fonte que resolve, sem chave e sem bloqueio, mas o Aviso Legal do site proíbe "métodos de extração de dados". Decidir com o Gabriel, sabendo que o app é interno, de 15 pessoas e sem fins comerciais: (a) o app lê o tom da página do Cifra Club uma vez por Música, no toque do Ministro, com cache permanente e link de volta pra cifra, assumindo o risco contratual; (b) o app só acha a cifra pela busca do site e mostra um botão "Conferir no Cifra Club", e o Ministro digita o tom (dois toques a mais); (c) pedir permissão por escrito ao Cifra Club antes de decidir, o que atrasa mas elimina a dúvida. Registrar como ADR se a escolha for (a), porque um leitor futuro vai perguntar "isso pode?". Saída: decisão no glossário (o que é "tom original" e de onde vem) e ajuste no protótipo do Ministro, que hoje simula a leitura automática.


## Answer

Resolvido em 06/09/2026, decisão do Gabriel: **opção (a)** — o app lê o tom da página do Cifra Club, uma leitura por Música, disparada pelo Ministro, com o tom guardado depois e link de volta pra cifra. Registrado em [ADR 0002](../../../docs/adr/0002-ler-o-tom-no-cifra-club.md), como o ticket pedia, com o Aviso Legal citado e a saída de emergência escrita.

Duas coisas mudaram em relação ao que o ticket imaginava, e as duas por causa do que a implementação descobriu:

**A leitura é uma sugestão, nunca uma gravação.** A busca do site (`solr.sscdn.co/cc/h2`, JSONP, os mesmos dados da busca do Cifra Club) erra quando o título é comum: procurar "Como Não Te Amar" devolveu "Amar Como Você", do José Jr. Então a tela mostra o que achou — música, artista, tom e link pra abrir — e o Ministro toca em "Usar G" ou em "Não é essa". Gravar sozinho poria tom errado no histórico, que é justamente o dado em que o Ministro se apoia pra escolher.

**O tom vem como o da gravação, inclusive menor.** "Meia Noite" do fhop está em `Bm`, e o seletor da V1 só tinha as doze maiores. O Tom passou a ser nota mais qualidade, e o seletor virou um teclado de piano (cinco pretas na fresta das sete brancas) com um botão de `maior | menor`: 14 alvos pras 24 tonalidades, porque 24 botões de uma vez não cabem no celular. Está em `src/componentes/SeletorDeTom.tsx`.

O tom sai do cartão de `id="key"` da página. As classes do Cifra Club são geradas a cada build e não servem de âncora; o id serve. Se a busca ou a página mudarem, a rota devolve `achado: null` e a tela manda escolher à mão — o Tom original continua editável no teclado, que é o fallback do ticket 19 e existe independente desta leitura.

Saída do ticket, cumprida: o glossário ([CONTEXT.md](../../../CONTEXT.md), verbete Tom) diz o que é o Tom original e de onde vem.
