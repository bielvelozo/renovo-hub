# Premissas fechadas na cartografia (03/09/2026)

Decisões tomadas nas três rodadas de grilling que abriram o mapa. Não são tickets: são o chão em que os tickets pisam. Vocabulário em [CONTEXT.md](../../CONTEXT.md).

## Quem e onde
- Ministério Renovo Music, da Igreja Missão Renovo (@igrejamissaorenovo). 13 a 15 Membros, 5 Ministros que se revezam. Culto recorrente: domingo 18h. Um só ministério, uma só igreja.
- Papéis: **Membro** (vê tudo, sugere, edita o próprio perfil), **Ministro** (cria Escala, monta Equipe, adiciona Itens), **Admin** (tudo do Ministro mais gestão de Membros). Uma Escala pode ter mais de um Ministro dividindo a escolha; cada Item registra "ministrado por".
- Funções: lista fixa editável pelo Admin. Um Membro pode ocupar mais de uma Função na mesma Escala. "Ministro" é uma Função da Equipe e dá permissão de editar o Repertório daquela Escala. **Atualizado em 04/09/2026** pelo teste do protótipo: Ministro não é Função, é marca por cima das Funções do Membro; Funções se agrupam em Naipes e os músicos vêm de uma Formação. Ver [ticket 13](./issues/13-fluxo-ministro.md) e CONTEXT.md.

## Escala e histórico
- Escala = data + horário + rótulo opcional, criação livre (não presa a fim de semana). Preset: "Culto de Domingo 18h". **Atualizado em 04/09/2026**: o lote do mês nasce com o primeiro domingo como Santa Ceia às 08h; existe Escala avulsa pra evento fora de domingo; data e horário são editáveis. Ver [ticket 13](./issues/13-fluxo-ministro.md).
- Equipe do mês é montada antes; o Repertório é preenchido ao longo da semana, um Item por vez.
- Escala vira Realizada automaticamente quando a data passa. Só Execuções de Escalas Realizadas contam.
- Tom pertence ao Item (execução), não à Música. Último Tom é a sugestão padrão; histórico mostra Tom por quem ministrou.
- Medley é montado dentro da Escala, não reutilizado. Cada Trecho conta como Execução parcial.
- Sequência (ordem das músicas) é o Repertório ordenado. Sequência interna da música é um arquivo (Word) anexado à Música, com versões; editor estruturado fica pra depois.
- Música = título + artista + link de referência no YouTube (a versão que tocam) + link opcional do Spotify. Uma música, um vídeo.
- Importação inicial: playlist pública "Playlist Missão Renovo" (https://www.youtube.com/playlist?list=PLMRN_VbzEeFs). Importadas entram como Legado, sem Tom; Ministro preenche "último tom conhecido" à mão.
- Nova = sem Execução e não Legado. Sugestão: qualquer Membro, música nova ou já conhecida, com link e observação; Ministro promove a Item.
- Perfil do Membro: última vez que tocou, Escalas no ano, streak informativo (fins de semana consecutivos), sem ranking nem badge na v1.
- Ciclagem: aba Músicas ordenada por última Execução com filtros (Nova, Legado, há mais de X meses); ao adicionar Item, cobertura da Equipe ("quem já tocou, quem nunca tocou").

## Plataforma e acesso
- **PWA primeiro**, custo zero; código nasce empacotável com Capacitor se o push de PWA decepcionar. Sem Mac, sem conta Apple Developer hoje.
- **O app tem que notificar.** v1: "você foi escalado", "música adicionada/alterada na sua Escala", lembrete na véspera. Sugestão nova vira badge na aba, sem push. Onboarding exige adicionar à tela inicial e permitir notificações (iOS 16.4+).
- WhatsApp continua como canal paralelo; o app gera texto pronto pra colar (Equipe + Itens + Tom + links).
- Acesso sem senha: link pessoal de convite enviado pelo Ministro/Admin grava o dispositivo; "esqueci" mostra a lista de Membros pra escolher. Confiança total no grupo.
- Framework e backend escolhidos pelo que funciona melhor como PWA (e futura aprovação Apple), não por familiaridade. Menor custo possível.
- Identidade visual própria do Renovo Hub derivada da logo da igreja (círculo preto, "RENOVO" branco, "O" como árvore). **Atualizado em 04/09/2026**: a igreja estreou uma identidade nova na conferência Alto & Sublime Lugar e é ela que o app herda; ver [Coletar assets da marca](./issues/04-assets-de-marca.md) e [docs/brand/README.md](../../docs/brand/README.md). Tema escuro **e** claro na v1. Navegação inspirada no Spotify, thumbnail do YouTube como capa da Música. Idioma: PT-BR.
- Ferramentas prontas (Planning Center, Holyrics) descartadas: exigem login, pesadas ou em inglês.
