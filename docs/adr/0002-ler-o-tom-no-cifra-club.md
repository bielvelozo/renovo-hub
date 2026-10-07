---
status: accepted
date: 2026-09-06
---

# Ler o tom no Cifra Club, uma vez por Música e por toque do Ministro

O app sugere o Tom de partida de cada Música: a última Execução, senão o tom preenchido à mão, senão o **Tom original** da gravação. Faltava de onde tirar esse tom original. A pesquisa do ticket 19 concluiu que o Cifra Club é a única fonte que resolve louvor brasileiro, sem chave e sem bloqueio — e que **o Aviso Legal do site proíbe "métodos de extração de dados"**. O problema é contratual, não técnico.

Decidimos ler assim mesmo, com o uso mais estreito que resolve o problema: **uma leitura por Música, disparada pelo Ministro no botão "Buscar no Cifra Club"**, nunca em lote, nunca por cron, nunca no cadastro automático. O que volta é uma **sugestão para confirmar**, não um valor gravado: a tela mostra música, artista e tom, com link pra abrir a cifra, e o Ministro toca em "Usar G" ou em "Não é essa". Confirmado, o tom fica guardado na Música e o site não é consultado de novo.

## Considered Options

- **Ler com confirmação do Ministro** (escolhida). Resolve o problema real, mantém o volume no mínimo defensável e manda gente pro site em vez de substituí-lo. Assume um risco contratual conhecido.
- **Só linkar, o Ministro digita.** Zero risco, mas devolve ao Ministro exatamente o trabalho que o app existe pra tirar — e ele vai procurar no Google na hora de montar a Escala, que é o que já acontecia no WhatsApp.
- **Pedir permissão por escrito ao Cifra Club.** Elimina a dúvida e atrasa indefinidamente uma decisão de um app de 15 pessoas; ninguém do ministério tem canal com eles.

Escolhemos ler porque o app é interno, de 15 voluntários, sem fins comerciais e sem audiência: não republica cifra, não guarda cifra, não concorre com o site e não tira tráfego dele — o cartão de confirmação leva pra lá. O Gabriel tomou a decisão em 06/09/2026, sabendo do Aviso Legal.

## Consequences

- É risco assumido, não permissão. Se o Cifra Club pedir para parar, a saída é apagar `worker/dados/cifraclub.ts` e o botão da tela: o Tom original continua editável à mão no teclado, e nada mais no app depende dessa leitura.
- A leitura é frágil de propósito e falha em silêncio. O tom sai do cartão de `id="key"` da página (as classes são geradas a cada build do site e não servem de âncora) e a busca é o `solr.sscdn.co` que o próprio site usa. Se qualquer um dos dois mudar, a rota devolve `achado: null` e a tela manda escolher à mão.
- A busca erra quando o título é comum — procurar "Como Não Te Amar" devolveu "Amar Como Você", do José Jr. Por isso a confirmação é obrigatória: gravar sozinho poria um tom errado no histórico de uma Música, que é o dado que o Ministro usa pra decidir.
- Se um dia aparecer uma fonte licenciada de tom, ela entra no lugar desta sem mexer no resto: o app só precisa de um `tomOriginal` por Música.

## Atualização de 06/10/2026: o site passou a recusar a leitura

As páginas de cifra agora passam pelo Akamai, que responde `403 Access Denied` a qualquer pedido saído de um Worker da Cloudflare, com ou sem cabeçalho de navegador (testado da borda da Cloudflare com um Worker de sonda). O Cifras.com.br faz o mesmo com o desafio da Cloudflare. A busca `solr.sscdn.co` segue respondendo. Na prática a leitura do tom parou de funcionar em produção, e a tela dizia "não achou o tom" mesmo quando a música estava lá.

Não tentamos contornar o bloqueio: recusar tráfego automatizado é o site dizendo não, e era essa a condição para recuar. Ficou o plano B que a pesquisa do ticket 19 já previa: o app usa a busca para achar a cifra certa e mostra "Abrir a cifra"; o Ministro vê o tom no alto da página e toca nele no teclado. A página não é mais lida pelo servidor e o app não grava o tom sozinho em nenhum caso.

Junto, a conferência do achado ficou mais firme e mais esperta: compara palavras inteiras (um "Fé" não casa com "Café"), exige que o achado cubra o título, olha além do primeiro resultado, prefere a versão do artista da Música e aceita título e artista trocados pelo YouTube. Nas 102 músicas da playlist de semente, a busca acha 82 (antes 76); sobram medleys, compilações e títulos crus mal cortados.
