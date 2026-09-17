# Letra de uma Música sem anexo: dá para buscar na internet?

Pesquisa feita em **16/09/2026**. Todos os links foram acessados nessa data, salvo indicação contrária. O que não pôde ser lido em fonte primária está marcado como **não confirmado** e listado no fim.

Pergunta: quando uma Música do catálogo não tem a Sequência (o .docx da equipe), o app pode buscar a letra na internet, guardar e mostrar no modo culto (offline, só leitura)? Quais fontes existem em setembro de 2026 e qual é a mais viável?

Onde os testes rodaram: `curl` e Python a partir do computador do Gabriel, numa rede corporativa (PRODESP/CEETEPS) que **bloqueia `vagalume.com.br` e `songselect.ccli.com`** na categoria "Streaming Media and Download". O bloqueio é da rede, não dos sites. Não contornei o bloqueio: essas duas fontes ficaram sem teste direto e foram avaliadas só por busca na web. Os testes também não saíram de um Worker da Cloudflare, e sim de um IP brasileiro comum (ver "Viabilidade a partir do Worker").

## Resumo

**Dá para fazer, e a fonte mais viável é o [LRCLIB](https://lrclib.net/docs)**, lido pelo Worker quando o Ministro toca num botão, com confirmação antes de guardar. Nenhuma fonte gratuita licencia a letra. A decisão é de risco, no estilo da ADR 0002, e o risco é maior que o do tom.

Por que o LRCLIB:

1. **É a única fonte gratuita feita para ser consumida por apps.** API documentada, sem chave, sem cadastro, JSON com a letra inteira em texto puro (`plainLyrics`), CORS aberto, limite de uso "generoso". O que ela exige: identificar o app no `User-Agent` e respeitar o `429`.
2. **Não tem termo de uso que proíba o uso.** Não achei termos de uso nem no site nem no repositório. Letras.mus.br também não proíbe robôs de forma explícita, mas não tem API. Cifra Club e Genius proíbem extração com todas as letras.
3. **Cobertura boa no repertório real: 8 de 10 certas.** Achou 9 das 10 músicas da amostra. Uma veio **errada**: "Sobre as Águas" com o mesmo título e o mesmo artista (Isaías Saad), mas outra música. Não achou "Ambição" (Som do Céu).
4. **A letra acompanha a gravação que a equipe usa.** Nas 8 certas, o LRCLIB tem uma versão com duração a ±3 s do vídeo do YouTube no CSV. Como a letra sincronizada é feita sobre o áudio, a ordem e as repetições tendem a ser as daquela gravação, que é o mais perto da Sequência que uma fonte externa chega.

Como ficaria: o Worker busca por título e artista, prefere a versão com duração mais próxima do vídeo, e o Ministro vê título, artista, álbum e o começo da letra antes de tocar em "Usar esta letra". Confirmado, o texto fica guardado na Música com fonte e data, e o modo culto lê do que está guardado. Quando o LRCLIB não acha (2 em 10), fica o caminho de hoje: anexar o .docx. Opcionalmente, um link "Procurar no Letras" que só abre o site, sem leitura pelo app.

O que **não** recomendo:

- **Tirar a letra da página do Cifra Club que o app já lê para o tom.** Tecnicamente é a mais barata: nenhuma requisição a mais, 10 de 10, seções rotuladas e repetições por extenso. Mas o Aviso Legal proíbe extração com todas as letras, e a ADR 0002 aceitou o risco justamente porque o app "não guarda cifra". Guardar a letra que está dentro da cifra desfaz essa premissa. Além disso, o texto sai com sujeira de formatação (ver detalhe).
- **Genius**: os termos proíbem scraping e a API oficial não entrega letra.
- **Musixmatch**: é licenciado, mas pago (a partir de US$ 49/mês), e **guardar a letra só é permitido no plano Enterprise (a partir de US$ 2.000/mês)**. Isso inviabiliza o modo offline. Cada exibição ainda exige um pixel de rastreio, o que exige estar online.
- **lyrics.ovh**: é um raspador de Genius, Letras e outros sites, com cobertura de 5 de 10.
- **CCLI SongSelect**: o programa de parceiros da API foi encerrado e não aceita novos parceiros.
- **LyricFind**: vende só para empresas, sem API aberta.
- **Vagalume**: a API é oficial, mas exige conta e selo, e a própria documentação avisa que não transfere o direito de exibir a letra. A cobertura não pôde ser testada.

## Comparativo

"Guardar" significa manter a letra no banco do app e no aparelho para o modo offline. "Cobertura" conta as letras **certas** entre as 10 músicas da amostra.

| Fonte | API pública hoje | Chave / custo | Letra completa? | Termos sobre robôs e guardar | Cobertura (10) | Formato | Bloqueio / CORS | Veredito |
|---|---|---|---|---|---|---|---|---|
| **LRCLIB** | sim, documentada | nenhuma; grátis; limite "generoso" com `429` | sim (`plainLyrics` + `syncedLyrics`) | nenhum termo de uso encontrado; exige `User-Agent` identificado | **8** (9 achadas, 1 errada) | JSON, texto puro, estrofes separadas por linha em branco, sem rótulos de seção | Cloudflare na frente, sem desafio; CORS `*` | **Recomendada** |
| Letras.mus.br | não (só o endpoint interno de busca) | nenhuma; grátis | sim | sem cláusula explícita contra robôs; proíbe "fins não autorizados" e violar direito autoral | **10** | HTML; `<p>` por estrofe, sem rótulos de seção | nginx, sem desafio; busca com CORS `*`, página sem CORS | Alternativa, se a cobertura pesar mais |
| Cifra Club (letra dentro da cifra) | não | nenhuma | sim, entremeada com acordes | **proíbe extração de dados** (cláusula b) | **10** | HTML; seções `[Refrão]` etc., repetições por extenso, sujeira de formatação | nginx, sem desafio; sem CORS | Não recomendada (contrato) |
| Cifra Club, página `/letra/` | não | nenhuma | sim (mesmo texto do Letras) | mesma cláusula (b) | 8 | HTML; `<p>` por estrofe | idem | Não recomendada |
| Genius | sim, mas **sem letra** | token OAuth; uso comercial só com licença | só pela página | **proíbe scraping, robôs e mineração**; robots.txt veta `/api/*` | 8 (pela página) | HTML; seções `[Chorus]` | Cloudflare; um desafio visto com UA genérico | Descartada |
| Musixmatch | sim | **US$ 49 a 499/mês**; Enterprise a partir de US$ 2.000/mês | sim nos planos pagos; 30% no gratuito **não confirmado** (não há plano gratuito na página de preços) | proíbe scraping; **guardar só no Enterprise**; exige pixel de rastreio e crédito | não testada (exige conta paga) | JSON | site com desafio do AWS WAF | Descartada (custo e offline) |
| lyrics.ovh | sim | nenhuma | às vezes condensada | sem termos; **raspa** Genius, Letras, AZLyrics e outros | 5 | JSON, texto puro | CORS `*` | Descartada |
| Vagalume | sim (`search.php`) | chave obrigatória (cadastro); grátis | sim (**não confirmado**) | exige logo e link; a documentação diz que a API **não transfere** o direito de exibir a letra | **não testada** (rede bloqueou); índice web: 0 de 4 das menos conhecidas | JSON | não testado | Não agora |
| CCLI SongSelect | API de parceiros **encerrada** | licença da igreja + assinatura | sim, para parceiros | licenciado | não testada (rede bloqueou) | JSON/ChordPro | n/a | Descartada como API |
| LyricFind | não (B2B) | contrato | sim | licenciado | não testada | n/a | n/a | Descartada |

## Teste de cobertura

### Como foi feito

Dez músicas do `seed/playlist.csv`: 8 em português (populares e pouco conhecidas) e 2 em inglês. Para cada fonte, a busca usou título e artista (e nomes alternativos do artista quando a primeira tentativa falhou), sempre em sequência, com 1 s entre chamadas e `User-Agent: RenovoHub-pesquisa/0.1 (...)`.

Critério de "letra certa":

1. o título achado, sem parênteses, é igual ao título da música;
2. o artista bate com um dos nomes esperados;
3. o vocabulário da letra bate com o das outras fontes. Comparei o conjunto de palavras de cada fonte com as palavras presentes na maioria delas.

O terceiro critério foi o que pegou o erro do LRCLIB: 15% de sobreposição, contra 96–100% das outras fontes. Diferenças de 60–90% foram conferidas à mão e eram **versões** (ao vivo com espontâneo contra estúdio), não músicas erradas. Nenhuma letra é reproduzida neste documento.

Endpoints usados:

- Cifra Club: `GET https://solr.sscdn.co/cc/h2/?q={título artista}&e=1` (JSONP, a mesma busca de `worker/dados/cifraclub.ts`), depois `GET https://www.cifraclub.com.br/{d}/{u}/` e `GET .../{u}/letra/`
- Letras: `GET https://solr.sscdn.co/letras/m1/?q={título artista}&wt=json` (JSONP `LetrasSug(...)`), depois `GET https://www.letras.mus.br/{dns}/{url}/`
- LRCLIB: `GET https://lrclib.net/api/search?track_name={título}&artist_name={artista}`, com recaída para `?q=` e `?track_name=`; também `GET /api/get?...&duration=`
- lyrics.ovh: `GET https://api.lyrics.ovh/v1/{artista}/{título}`
- Genius: `GET https://genius.com/api/search/song?q=` (endpoint interno do site, **vetado pelo robots.txt**; usado uma vez por música só para medir cobertura), depois a página da letra. `GET https://api.genius.com/search` sem token devolve `401`.
- Musixmatch: `GET https://api.musixmatch.com/ws/1.1/track.search` sem chave devolve `401`.

### Resultado

"sim" = letra certa; "não" = não achou; "errada" = achou outra música; "redireciona" = a página `/letra/` não existe e manda de volta para a cifra.

| # | Música (vídeo do CSV) | Perfil | Cifra Club (cifra) | Cifra Club `/letra/` | Letras | LRCLIB | lyrics.ovh | Genius |
|---|---|---|---|---|---|---|---|---|
| 1 | Rio, Nívea Soares (8:32) | pt, clássica | sim | sim | sim | sim | não | sim |
| 2 | A Ele a Glória, Gabriela Rocha (7:19) | pt, muito popular | sim¹ | sim | sim | sim | sim | sim¹ |
| 3 | Vida aos Sepulcros, Gabriela Rocha (4:57) | pt, versão de hit em inglês | sim | sim | sim | sim | sim | sim |
| 4 | Sobre as Águas, Rapha Gonçalves e Isaías Saad (7:39) | pt, popular | sim | redireciona | sim² | **errada** | não | não |
| 5 | Só Tu És Santo, Morada (6:27) | pt, popular | sim | sim | sim | sim | sim³ | sim |
| 6 | Meia Noite, fhop music (3:45) | pt, média | sim | sim | sim | sim | não | sim |
| 7 | Permanecerei, Eric & Evellyn Emerick (6:32) | pt, pouco conhecida | sim | redireciona | sim² | sim | não | não |
| 8 | Ambição, Gabi Sampaio e Som do Céu (16:59) | pt, pouco conhecida | sim | sim | sim⁴ | não | não | sim |
| 9 | Holy Forever, Bethel Music (10:44) | en, muito popular | sim | sim | sim | sim | sim | sim |
| 10 | You Are Good, Israel Houghton (6:25) | en, clássica | sim | sim | sim | sim | sim³ | sim |
| | **Letras certas** | | **10** | **8** | **10** | **8** | **5** | **8** |

1. Na versão do Cifra Club e na do Genius falta um trecho que as outras três fontes têm. Leio isso como versão diferente, não como erro.
2. No Letras, a música está sob outro artista: "Isaías Saad (part. Dunamis Music e Rapha Gonçalves)" e "Eric Emerick (part. Evellyn Chaves)". Por isso a página `/letra/` do Cifra Club, que usa o artista do Cifra Club, não existe para essas duas.
3. Versão condensada: 13 e 10 linhas, sem repetições.
4. Versão longa, com a ministração ao vivo do vídeo de 17 minutos.

Não testadas: **Vagalume** e **SongSelect** (bloqueados pela rede) e **Musixmatch** (exige conta paga). Como indício, e só isso, a busca `site:vagalume.com.br` não trouxe página do Vagalume para nenhuma das quatro menos conhecidas (4, 6, 7, 8). Para "Meia Noite" e "Sobre as Águas" apareceram só músicas homônimas de outros artistas. A busca `site:musixmatch.com` para 6 e 7 também não trouxe nada. O índice pode simplesmente não ter essas páginas.

URLs das letras certas:

- Cifra Club: [1](https://www.cifraclub.com.br/nivea-soares/rio/), [2](https://www.cifraclub.com.br/gabriela-rocha/a-ele-a-gloria/), [3](https://www.cifraclub.com.br/gabriela-rocha/vida-aos-sepulcros-part-elevation-worship/), [4](https://www.cifraclub.com.br/rapha-goncalves/sobre-as-aguas-rapha-goncalves-e-isaias-saad/), [5](https://www.cifraclub.com.br/ministerio-morada/so-tu-s-santo/), [6](https://www.cifraclub.com.br/florianopolis-house-of-prayer/meia-noite/), [7](https://www.cifraclub.com.br/eric-e-evellyn-emerick/permanecerei/), [8](https://www.cifraclub.com.br/som-do-ceu/ambicao-part-gabi-sampaio-thiago-henrique-e-marllon-ribeiro/), [9](https://www.cifraclub.com.br/bethel-music/holy-forever/), [10](https://www.cifraclub.com.br/israel-houghton/you-are-good/). As páginas `/letra/` são essas mesmas com `letra/` no fim.
- Letras: [1](https://www.letras.mus.br/nivea-soares/961239/), [2](https://www.letras.mus.br/gabriela-rocha/a-ele-a-gloria/), [3](https://www.letras.mus.br/gabriela-rocha/vida-aos-sepulcros-part-elevation-worship/), [4](https://www.letras.mus.br/isaias-saad/sobre-as-aguas-part-dunamis-music-e-rapha-goncalves/), [5](https://www.letras.mus.br/ministerio-morada/so-tu-es-santo/), [6](https://www.letras.mus.br/florianopolis-house-of-prayer/meia-noite/), [7](https://www.letras.mus.br/eric-emerick/permanecerei-part-evellyn-chaves/), [8](https://www.letras.mus.br/gabi-sampaio/ambicao-part-som-do-ceu-thiago-henrique-marllon-ribeiro/), [9](https://www.letras.mus.br/bethel-music/holy-forever/), [10](https://www.letras.mus.br/israel-houghton/1808027/)
- LRCLIB: [1](https://lrclib.net/api/get/28847557), [2](https://lrclib.net/api/get/9256279), [3](https://lrclib.net/api/get/12867590), [5](https://lrclib.net/api/get/9256953), [6](https://lrclib.net/api/get/25827064), [7](https://lrclib.net/api/get/35679407), [9](https://lrclib.net/api/get/33750135), [10](https://lrclib.net/api/get/35273891). A errada foi [4](https://lrclib.net/api/get/37118997).
- lyrics.ovh: 2, 3, 5, 9 e 10 em `https://api.lyrics.ovh/v1/{artista}/{título}`, com os artistas Gabriela Rocha, Morada, Bethel Music e Israel Houghton.
- Genius: [1](https://genius.com/Nivea-soares-rio-lyrics), [2](https://genius.com/Gabriela-rocha-a-ele-a-gloria-ao-vivo-lyrics), [3](https://genius.com/Gabriela-rocha-vida-aos-sepulcros-lyrics), [5](https://genius.com/Morada-so-tu-es-santo-ao-vivo-lyrics), [6](https://genius.com/Fhop-music-meia-noite-ao-vivo-lyrics), [8](https://genius.com/Gabi-sampaio-marllon-ribeiro-thiago-henrique-and-som-do-ceu-ambicao-lyrics), [9](https://genius.com/Bethel-music-and-jenn-johnson-holy-forever-lyrics), [10](https://genius.com/Israel-and-new-breed-you-are-good-lyrics)

### O que o teste ensinou

- **Título e artista iguais não garantem a música certa.** O LRCLIB tem uma "Sobre As Águas" de Isaías Saad que é outra canção. A confirmação do Ministro, vendo o começo da letra, é obrigatória, pelo mesmo motivo da ADR 0002.
- **A duração do vídeo resolve a versão, mas não serve de filtro exato.** Nas 8 certas, o LRCLIB tem pelo menos uma versão a ±3 s da duração do vídeo do CSV. Exemplos: Rio 512 s contra 512 s; Holy Forever 643 s contra 644 s; Só Tu És Santo 387 s contra 387 s. Vários registros até levam o título do vídeo ("… (CLIPE OFICIAL)"). Já o `GET /api/get` com a duração do vídeo acertou só 1 de 5, porque exige nome da faixa exato e tolera só ±2 s. O caminho prático é `search` seguido de "duração mais próxima".
- **No Letras, o id numérico não é endereço confiável.** A busca devolve `imu` (id) e `url` (slug). `https://www.letras.mus.br/gabriela-rocha/3243678/`, com o id que a busca deu para "A Ele a Glória", redirecionou para "When I Wake Up". Com o slug (`/gabriela-rocha/a-ele-a-gloria/`) veio a música certa. Algumas músicas têm slug numérico (Rio, `961239`), e funciona porque é o slug.
- **A página `/letra/` do Cifra Club é o texto do Letras.** O conteúdo tem as mesmas estrofes, e o payload da página carrega o id do Letras (`lyricsSlug`). A página da cifra também aponta para o "corrigir letra" do Letras com esse id.
- **A letra dentro da cifra é a mais parecida com a Sequência, e a mais suja.** Ela vem com rótulos (`[Primeira Parte]`, `[Refrão]`, `[Ponte]`) e repetições por extenso. Depois de remover as linhas que só têm acordes e as linhas de tablatura, ainda sobram:
  - sublinhados no meio das palavras para alinhar acordes;
  - rótulos como "Parte 1 de 2" dos blocos de tablatura;
  - linhas de acorde com "x4";
  - anotações como "(repeat)";
  - uma seção `[Chords]` em música estrangeira.

  Limpar isso exige heurística, e a heurística quebra quando o site muda.

## Detalhe por fonte

### LRCLIB

- **Documentação** ([lrclib.net/docs](https://lrclib.net/docs); a página é uma SPA e o texto foi lido no bundle JS servido pelo site):
  - a API tem um limite de uso descrito como "generoso", é aberta a todos os apps e não pede chave nem cadastro;
  - pede que o cliente se identifique no `User-Agent` com nome, versão e um link ou e-mail. No navegador, que não deixa mudar esse cabeçalho, vale `X-User-Agent` ou `Lrclib-Client`;
  - ao passar do limite, responde `429` com `Retry-After`, que o cliente **deve** respeitar, sob pena de bloqueio temporário;
  - para lotes, recomenda chamadas em sequência com 200–500 ms de intervalo.
- **Endpoints**:
  - `GET /api/get`: `track_name` e `artist_name` obrigatórios; `album_name` e `duration` opcionais, com casamento em ±2 s;
  - `GET /api/get/{id}`;
  - `GET /api/search`: `q` ou `track_name`, mais `artist_name` e `album_name` opcionais; no máximo 20 resultados, sem paginação;
  - `POST /api/publish` e `POST /api/flag`, com token de prova de trabalho. O `flag` existe para denunciar, entre outras coisas, violação de direito autoral.
- **Retorno**: `id`, `trackName`, `artistName`, `albumName`, `duration`, `instrumental`, `plainLyrics`, `syncedLyrics` (LRC com `[mm:ss.xx]`) e `lyricsfile` (YAML). Não há rótulos de seção.
- **Termos**: não achei página de termos no site nem menção a direitos no README do [servidor](https://github.com/tranxuanthang/lrclib), que é MIT, tem 2.050 estrelas e último push em 07/08/2026. As letras entram por publicação anônima (`/api/publish`), sem origem declarada. O site oferece dumps completos do banco em SQLite (página `/db-dumps`).
- **Técnica**:
  - Cloudflare na frente, sem desafio com nenhum dos três `User-Agent` testados;
  - `Access-Control-Allow-Origin: *`, então daria para chamar até do navegador;
  - uma busca por `track_name`+`artist_name` pesou 39 KB; por `q`, 137 KB; um `get/{id}`, 4 KB.
- **Veredito**: principal.

### Letras.mus.br

- **API**: não há API pública. `api.letras.mus.br/`, `/v2/` e `www.letras.mus.br/api/` devolvem `404`. O [robots.txt](https://www.letras.mus.br/robots.txt) libera as páginas de letra e bloqueia `/contribuicoes/` e `/api/v2/survey/`.
- **Busca**: `https://solr.sscdn.co/letras/m1/?q=…&wt=json`.
  - O próprio site usa essa busca: o bundle JS monta a URL com host `solr.sscdn.co`, caminho `/letras` e callback `LetrasSug`.
  - Responde JSONP com CORS `*` e `Cache-Control: max-age=14400`.
  - Campos úteis: `txt` (título), `art`, `dns` (slug do artista), `url` (slug da música), `imu` (id) e `t: "2"` (música).
  - É endpoint interno, sem documentação.
- **Página**: HTML de ~145 KB, renderizado no servidor, sem CORS. A letra fica em `div.lyric-original`, com `<p>` por estrofe e `<br/>` por linha. Não há rótulos de seção, e em algumas músicas as repetições vêm por extenso.
- **Termos** ([Termos de uso e privacidade](https://www.letras.mus.br/aviso-legal.html), sem data):
  - quem assina é a **Vignoli Comunicação Ltda.** (CNPJ 07.175.186/0001-69), não a Studio Sol, mas o texto cita o "Cifra Club ID" como login único e "serviços compartilhados com outros produtos da Studio Sol";
  - a lista de obrigações proíbe violar direitos autorais, uso ilícito, acessar áreas restritas ou burlar medidas de segurança, spam, e usar os sites para fins não autorizados;
  - **não há cláusula explícita sobre robôs ou extração**, ao contrário do Cifra Club;
  - a licença restrita a uso pessoal, individual e não comercial aparece só na seção da assinatura paga, não na das letras abertas;
  - a retirada de conteúdo é feita por e-mail, e o foro é Belo Horizonte.
- **Veredito**: a melhor cobertura (10 de 10) e o texto mais limpo, mas sem API e com dois endpoints internos no caminho. É a alternativa se o Gabriel preferir cobertura a ter uma API aberta.

### Cifra Club (letra na cifra e página `/letra/`)

- **Aviso Legal** ([link](https://www.cifraclub.com.br/aviso-legal.html)):
  - vale para cifraclub.com.br, palcomp3.com, fórum, guitarbattle e formesuabanda, de propriedade da Studio Sol Comunicação Digital Ltda. (o rodapé traz Cifra Club Ventures Comércio e Serviços Ltda., CNPJ 37.767.251/0001-06);
  - **não lista o letras.mus.br**;
  - a cláusula (b) das obrigações continua igual à lida em 04/09: o usuário se compromete a nunca "usar quaisquer métodos de prospecção ou métodos semelhantes de extração de dados".
- **[robots.txt](https://www.cifraclub.com.br/robots.txt)**: bloqueia `/api/` e libera as páginas de cifra.
- **Página da cifra**: ~523 KB, sem CORS, sem desafio.
  - A letra está no `<pre data-chord-content="true">`, entremeada com `<b data-chord-name>`, em blocos `div` com classe gerada no build.
  - Tem rótulos entre colchetes e repetições por extenso.
  - A sujeira está descrita em "O que o teste ensinou".
  - O app já baixa essa página em `tomDaPagina`, então a letra sairia sem requisição a mais.
- **Página `/letra/`**: ~457 KB, renderizada no servidor, com `<p>` por estrofe dentro de `div[data-chord-content]`. É o texto do Letras sob o Aviso Legal do Cifra Club. Existe para 8 das 10 músicas; nas outras 2, responde `307` de volta para a cifra.
- **A ADR 0002 não cobre isso.** A decisão aceitou ler **um fato** (o tom) e se apoia em "não republica cifra, não guarda cifra". Guardar a letra é guardar parte do conteúdo da cifra, uma obra protegida.
- **Veredito**: não recomendada. Se o Gabriel quiser estender a ADR 0002, é a opção de menor esforço técnico e maior exposição contratual.

### Vagalume

- A documentação ([api.vagalume.com.br/docs](https://api.vagalume.com.br/docs/)) está bloqueada nesta rede. O que segue vem **só de trechos do buscador** e fica **não confirmado** na página:
  - chave obrigatória desde 23/11/2015, criada com cadastro no Vagalume;
  - uso gratuito, com logo e link para a página do Vagalume obrigatórios;
  - `GET https://api.vagalume.com.br/search.php?art=…&mus=…&apikey=…`, com `type` igual a `exact`, `aprox`, `song_notfound` ou `notfound`, e objetos `art` e `mus`;
  - pode ser chamada do navegador;
  - **usar a API não transfere o direito de exibir as letras**, que teria de ser obtido com os titulares; quem não tiver esse direito deve usar só o link para o Vagalume.
- O repositório oficial de exemplos (`github.com/vagalume/api-exemplos`), citado pelos buscadores, hoje responde `404`. A organização `vagalume` no GitHub tem um único repositório, de 2016.
- **Cobertura**: não testada. Indício fraco pelo índice web: nenhuma das quatro menos conhecidas apareceu.
- **Veredito**: não agora. Exige que o Gabriel crie conta e chave, põe um selo na tela, e a própria documentação diz que a API não licencia a letra. Juridicamente, não é melhor que o LRCLIB. Vale testar a cobertura de uma rede sem bloqueio se o LRCLIB decepcionar.

### Genius

- **API oficial** ([docs.genius.com](https://docs.genius.com/)):
  - OAuth2 obrigatório; sem token, `api.genius.com/search` devolve `401`;
  - a página abre avisando que o uso comercial da API exige licença;
  - `GET /songs/:id` descreve metadados e referências. A resposta não pôde ser inspecionada sem token, e a documentação não lista corpo de letra (**não confirmado diretamente**).
- **Termos** ([genius.com/static/terms](https://genius.com/static/terms), atualizados em 13/01/2026): proíbem copiar, raspar ou distribuir o conteúdo do Genius, e usar mineração de dados, robôs, scraping ou métodos semelhantes de coleta.
- **[robots.txt](https://genius.com/robots.txt)**: veta `/api/*` e `/search?*`.
- **Técnica**:
  - Cloudflare na frente;
  - o `User-Agent` "Mozilla/5.0" sozinho levou `403` com `cf-mitigated: challenge`, enquanto `curl`, ausente ou de Chrome passaram;
  - a letra está em `div[data-lyrics-container]` aninhados, com rótulos de seção;
  - a página tem ~250 KB.
- **Veredito**: descartada por contrato.

### Musixmatch

- **Documentação** ([docs.musixmatch.com](https://docs.musixmatch.com/getting-started)):
  - chave obrigatória;
  - na exibição, é preciso mostrar `lyrics_copyright`, incluir o script ou pixel de rastreio a cada exibição ([Lyrics views tracking](https://docs.musixmatch.com/lyrics-views-tracking)) e o selo "Lyrics powered by" com link ([Implementation guidelines](https://docs.musixmatch.com/implementation-guidelines));
  - letras restritas vêm com `lyrics_body` vazio ([Content Restrictions](https://docs.musixmatch.com/content-restrictions)).
- **Preços** ([musixmatch.com/pro/api/pricing](https://www.musixmatch.com/pro/api/pricing), lidos no bundle da página):

  | Plano | Preço | Chamadas por dia | O que inclui |
  |---|---|---|---|
  | Basic | US$ 49/mês | 5 mil no total, 500 de letra | letra estática; **sem** "Lyrics caching" |
  | Grow | US$ 199/mês | 20 mil no total, 2 mil de letra | letra sincronizada; sem caching |
  | Scale | US$ 499/mês | 100 mil no total, 10 mil de letra | sem caching |
  | Enterprise | a partir de US$ 2.000/mês | sob contrato | o único com "Lyrics caching", descrito como "Cache lyrics (licensed only)" |

  **Não há plano gratuito na página.** O "30% da letra no plano grátis" aparece só em diretórios de terceiros: não confirmado para 2026.
- **Termos da API** ([about.musixmatch.com/apiterms](https://about.musixmatch.com/apiterms), atualizados em 24/06/2025):
  - licença só para fins não comerciais, salvo acordo (1.1);
  - crédito e link (2.1.5) e permissão de rastreio (2.1.11) são obrigatórios;
  - proíbe scraping fora da API (2.2.4) e uso com IA sem aprovação (2.2.14);
  - no fim do contrato, os dados obtidos precisam ser apagados (7.2.1).
- **Técnica**: o site responde `202` com `x-amzn-waf-action: challenge` (AWS WAF). A API sem chave devolve `401`.
- **Cobertura**: não testada.
- **Veredito**: descartada. Custa dinheiro, e o modo offline exige guardar a letra, o que só o Enterprise permite. O pixel por exibição também não funciona offline.

### lyrics.ovh

- **API**: `GET https://api.lyrics.ovh/v1/{artist}/{title}` e `GET /suggest/{termo}`, que usa a Deezer, conforme o [README](https://github.com/NTag/lyrics.ovh). Código MIT, último push em 20/06/2026.
- O README e o `lyrics.js` mostram que a letra vem de **raspagem em paralelo** de Genius, AZLyrics, Paroles.net, LyricsMania, Letras.mus.br e Lyrics.com. A primeira que responder vence, e a resposta não diz de qual site veio.
- Sem termos, CORS `*`, algumas respostas demoraram vários segundos.
- **Veredito**: descartada. Herda os riscos de Genius e Letras sem deixar escolher, e a cobertura foi de 5 em 10.

### CCLI SongSelect

- **API**: a documentação oficial da [SongSelect Partner API](https://documenter.getpostman.com/view/604633/TzseGkmA) abre com o aviso de que a CCLI **encerrou o programa de parceiros da API e não aceita novos parceiros**. A API v2 tem `GET /v2/songs/:id/lyrics`, com OAuth 2.0 (PKCE) e chave de assinatura.
- **No Brasil**: a CCLI tem site da América Latina em português ([ccli.com/latam/pt](https://ccli.com/latam/pt)).
  - A [Licença de Direitos Autorais da Igreja](https://ccli.com/latam/pt/church-copyright-license) cobre projetar e imprimir letras e dá acesso às letras do SongSelect.
  - O preço não foi lido (**não confirmado**; uma fonte secundária fala em US$ 342 a mais de US$ 1.000 por ano).
  - Fontes secundárias de 2012 relatam oposição do ECAD à atuação da CCLI no Brasil (**não confirmado**).
- **Cobertura de louvor brasileiro**: o site está bloqueado nesta rede. Pelo índice web há o catálogo "Editora Adorando Ltda", com 114 músicas (Nívea Soares, Fernandinho). Quais músicas da playlist estão lá: **não confirmado**.
- **Veredito**: não serve como API para o app. É o único caminho licenciado barato para a igreja, com a equipe copiando à mão do SongSelect, e isso é decisão da liderança, não do app.

### LyricFind

- O [site](https://www.lyricfind.com/) oferece só produtos B2B ([Lyric Display](https://www.lyricfind.com/products/lyric-display) em formato estático, linha a linha ou palavra a palavra), com contato comercial. Não há API aberta nem preço publicado.
- **Veredito**: descartada.

### Outras

- **Deezer**: o objeto Track da API pública não tem letra, conforme a pesquisa de 04/09/2026 sobre o tom (`docs/research/tom-original.md` na branch `research/tom-original`).
- **Spotify, Apple Music e legendas do YouTube**: não investigados. Não conheço endpoint público de letra em nenhum deles (**não confirmado**).

## Viabilidade a partir do Worker

- **Limites do plano gratuito** ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)): 10 ms de CPU e 50 subrequisições por requisição, 100 mil requisições por dia.
  - Um fluxo LRCLIB gasta 1 a 3 subrequisições e ~40 KB de JSON.
  - O Letras gasta 2 subrequisições e ~150 KB de HTML, cortado por `indexOf`.
  - Tirar a letra da cifra não gasta requisição a mais, mas processa ~520 KB.
  - O custo de CPU de cada um **não foi medido**.
- **Identificação**: a Cloudflare acrescenta o cabeçalho `CF-Worker`, com o nome da zona dona do Worker, a toda subrequisição feita por `fetch()` ([HTTP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/)). Qualquer destino pode reconhecer e bloquear o tráfego do app. Qual valor o cabeçalho leva num Worker em `workers.dev`: não confirmado.
- **Testes** (sem `User-Agent`, com o do `curl` e com um de Chrome Android):
  - Cifra Club, Letras (busca e página), LRCLIB e lyrics.ovh responderam igual nos três casos;
  - o Genius também, fora o desafio com "Mozilla/5.0" puro.
  - Nenhum teste saiu de IP da Cloudflare: **não confirmado** como esses sites tratam o tráfego de Workers. O app já faz esse caminho com o Cifra Club para o tom (`worker/dados/cifraclub.ts`).
- **CORS**, se um dia fosse do navegador:
  - busca do Cifra Club e do Letras, LRCLIB e lyrics.ovh: `*`;
  - páginas HTML do Cifra Club, do Letras e do Genius: nenhum cabeçalho, então só pelo servidor.
- **Formato**:

  | Fonte | Formato | Rótulos de seção | Repetições |
  |---|---|---|---|
  | LRCLIB | texto puro, com opção sincronizada | não | seguem a gravação |
  | Letras | HTML `<p>`/`<br>` | não | variam |
  | Cifra Club (cifra) | HTML com acordes | sim | por extenso |
  | Genius | HTML aninhado | sim | por extenso |
  | lyrics.ovh | texto puro | não | condensadas |

## Riscos

### Contratuais e autorais

1. **Letra é obra protegida e nenhuma fonte gratuita a licencia.** A Lei 9.610/98 ([texto na Câmara](https://www2.camara.leg.br/legin/fed/lei/1998/lei-9610-19-fevereiro-1998-365399-normaatualizada-pl.html)) exige autorização prévia e expressa do autor para "a reprodução parcial ou integral" (art. 29, I) e para "a inclusão em base de dados, o armazenamento em computador" (art. 29, IX). A exceção de uso privado cobre só "pequenos trechos" (art. 46, II). Guardar a letra no D1 e no aparelho é armazenamento. É o mesmo risco que os .docx digitados pela equipe já carregam hoje; o app só automatiza a origem. Isto é leitura leiga, não parecer jurídico.
2. **O risco é maior que o da ADR 0002.** Lá o app lê um **fato**, o tom; aqui guarda a **obra**. A justificativa "não guarda cifra" não se aplica.
3. **Cifra Club e Genius proíbem extração nos termos.** Usá-los para letra é descumprimento contratual direto, além da questão autoral.
4. **LRCLIB e Letras não proíbem, mas também não autorizam.** O LRCLIB não tem termos; o Letras fala genericamente em "fins não autorizados". Se um titular ou o site pedir para parar, a saída é a mesma da ADR 0002: apagar o módulo e o botão, e apagar as letras guardadas.
5. **As fontes licenciadas não cabem no app.** Musixmatch custa dinheiro e não deixa guardar abaixo do Enterprise; LyricFind é B2B; a API do SongSelect está fechada.

### Técnicos

1. **Música errada com o mesmo título e artista** (caso real no LRCLIB). A mitigação é confirmar vendo o começo da letra, álbum e duração.
2. **Versão errada** (estúdio contra ao vivo com espontâneo, como em Ambição e You Are Good). A mitigação é preferir a duração mais próxima do vídeo.
3. **Dependência de serviço mantido por uma pessoa.** O LRCLIB não tem SLA e pode sair do ar ou mudar limites. Os dumps públicos em SQLite mitigam só em parte.
4. **Endpoints internos e markup do Letras e do Cifra Club** podem mudar sem aviso. O endereço do Letras precisa usar o slug, não o id.
5. **Bloqueio do tráfego de Workers** pelo cabeçalho `CF-Worker`: possível em qualquer fonte, não observado.
6. **A letra externa não é a Sequência.** Ela não tem gancho em destaque e nem sempre segue a ordem cantada pela equipe. A tela precisa deixar claro de onde veio, e o .docx, quando existir, deve continuar prevalecendo.

## O que o Gabriel precisa decidir

No formato da ADR 0002. As decisões dependem umas das outras na ordem abaixo.

1. **Aceitar guardar letra sem licença?**
   - *Sim*: segue para as próximas.
   - *Não*: o app só oferece um link de busca (Letras ou YouTube) e o .docx continua sendo a única letra no modo culto. Risco zero, sem letra offline para as músicas sem anexo.
2. **Qual fonte?**
   - *LRCLIB* (recomendada): API aberta, sem termos contra, 8 de 10.
   - *Letras*: 10 de 10, sem API, sem cláusula explícita contra robôs.
   - *Cifra Club, da página que já é lida*: 10 de 10, zero requisição a mais, cláusula (b) explícita, e exige reabrir a ADR 0002.
3. **O que fazer quando a fonte não acha** (2 em 10 no LRCLIB)?
   - *Ficar como hoje* (recomendado): anexar o .docx, com um link "Procurar no Letras" que só abre o site.
   - *Segunda leitura automática no Letras*: mais cobertura, mais uma fonte de risco.
4. **Quando buscar?**
   - *Toque do Ministro, uma Música por vez, com confirmação* (recomendado, igual à ADR 0002).
   - *Automático no cadastro*: o LRCLIB tolera, mas grava letra sem ninguém conferir e repete o erro de "Sobre as Águas".
   - Em lote nas 101 Músicas legadas: não recomendado.
5. **Que contato vai no `User-Agent`?** O LRCLIB exige link ou e-mail. Pode ser o link do repositório, se for público, ou um e-mail que o Gabriel escolher.
6. **Fora do app: licença CCLI?** Se a liderança quiser regularizar projeção e letras da igreja, é a via licenciada. Não resolve o app (sem API) e a cobertura de louvor brasileiro não foi confirmada.

Se a decisão for seguir, a mudança no domínio é pequena: a Música ganha uma letra de referência (texto, fonte, id na fonte, data), separada dos anexos, e o modo culto mostra o anexo quando existir e a letra de referência quando não. Isto é sugestão, não parte da pesquisa.

## O que não foi confirmado

1. **Vagalume**: documentação, obrigatoriedade da chave, campo do texto da letra, termos e cobertura. A rede bloqueou o domínio, e tudo veio de trechos do buscador.
2. **SongSelect**: cobertura das músicas da playlist, preço da licença no Brasil e situação com o ECAD. A rede bloqueou o domínio; o preço e o ECAD vêm de fontes secundárias.
3. **Musixmatch**: existência de plano gratuito com 30% da letra em 2026 (só em diretórios de terceiros) e cobertura de louvor brasileiro (exige conta paga).
4. **Genius**: que `GET /songs/:id` não traz a letra. Não inspecionei a resposta sem token, e a conclusão vem da documentação não listar o campo.
5. **LRCLIB**: origem das letras, existência de algum termo de uso fora do site e do repositório, e valor numérico do "limite generoso".
6. **Tráfego saindo de Worker**: se Cifra Club, Letras, LRCLIB ou Genius tratam diferente IPs da Cloudflare ou o cabeçalho `CF-Worker`, e qual valor o cabeçalho leva em `workers.dev`.
7. **CPU no Worker** para processar 150–520 KB de HTML: não medido.
8. **Leitura jurídica** da Lei 9.610/98 aplicada a um app interno de igreja: interpretação leiga.
9. **Cobertura fora da amostra**: 10 músicas de 101 dão ordem de grandeza, não taxa.

## Fontes

Acessadas em 16/09/2026.

- LRCLIB: [documentação](https://lrclib.net/docs) (texto lido no bundle `https://lrclib.net/assets/index-a8f56a9e.js`), [servidor no GitHub](https://github.com/tranxuanthang/lrclib), `https://lrclib.net/api/search`, `https://lrclib.net/api/get`.
- Letras.mus.br: [Termos de uso e privacidade](https://www.letras.mus.br/aviso-legal.html), [robots.txt](https://www.letras.mus.br/robots.txt), bundle `https://akamai.sscdn.co/letras/desktop/static/js/index-pt.v79493154.js`, busca `https://solr.sscdn.co/letras/m1/`.
- Cifra Club: [Aviso Legal](https://www.cifraclub.com.br/aviso-legal.html), [robots.txt](https://www.cifraclub.com.br/robots.txt), busca `https://solr.sscdn.co/cc/h2/`, páginas de cifra e `/letra/` listadas no teste; `docs/adr/0002-ler-o-tom-no-cifra-club.md` e `worker/dados/cifraclub.ts` deste repositório.
- Vagalume: [documentação](https://api.vagalume.com.br/docs/) e [letras](https://api.vagalume.com.br/docs/letras/) (bloqueadas nesta rede, lidas via buscador), `https://github.com/vagalume/api-exemplos` (404).
- Genius: [documentação da API](https://docs.genius.com/), [Terms of Service](https://genius.com/static/terms), [robots.txt](https://genius.com/robots.txt), `https://api.genius.com/search` (401 sem token).
- Musixmatch: [Getting started](https://docs.musixmatch.com/getting-started), [Implementation guidelines](https://docs.musixmatch.com/implementation-guidelines), [Checklist](https://docs.musixmatch.com/checklist), [Lyrics views tracking](https://docs.musixmatch.com/lyrics-views-tracking), [Content Restrictions](https://docs.musixmatch.com/content-restrictions), [índice llms.txt](https://docs.musixmatch.com/llms.txt), [preços](https://www.musixmatch.com/pro/api/pricing) (lidos no bundle `https://www.musixmatch.com/pro/api/assets/index-wzOs4PgS.js`), [API Terms](https://about.musixmatch.com/apiterms).
- lyrics.ovh: [README e código](https://github.com/NTag/lyrics.ovh), `https://api.lyrics.ovh/v1/`.
- CCLI: [SongSelect Partner API](https://documenter.getpostman.com/view/604633/TzseGkmA), [CCLI LATAM em português](https://ccli.com/latam/pt), [Licença de Direitos Autorais da Igreja](https://ccli.com/latam/pt/church-copyright-license), [SongSelect LATAM](https://ccli.com/latam/pt/songselect); secundárias: [Portal Sala Musical](https://portalsalamusical.com.br/como-deixar-o-culto-online-da-igreja-no-youtube-de-forma-legal-entenda-o-papel-da-ccli-ccs-e-do-ecad/), [Instituto Paracleto (2012)](https://institutoparacleto.org/2012/10/21/acao-da-ccli-junto-as-igrejas-no-brasil/).
- LyricFind: [site](https://www.lyricfind.com/), [Lyric Display](https://www.lyricfind.com/products/lyric-display).
- Cloudflare: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [HTTP headers (`CF-Worker`)](https://developers.cloudflare.com/fundamentals/reference/http-headers/).
- Lei 9.610/98: [texto atualizado na Câmara dos Deputados](https://www2.camara.leg.br/legin/fed/lei/1998/lei-9610-19-fevereiro-1998-365399-normaatualizada-pl.html) (o site do Planalto não respondeu desta rede).
- Pesquisa anterior: `docs/research/tom-original.md` na branch `research/tom-original` (Deezer, Aviso Legal do Cifra Club em 04/09/2026).
