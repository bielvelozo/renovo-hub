# Renovo Music

App interno do ministério de louvor Renovo Music para montar escalas, registrar o repertório tocado e lembrar o que já foi ensaiado, em que tom e por quem.

## Language

### Pessoas

**Membro**:
Pessoa do ministério que pode entrar em uma Equipe. Vê tudo, sugere músicas e mantém o próprio perfil.
_Avoid_: usuário, músico (músico é uma função, não o papel)

**Ministro**:
Membro que o Admin cadastrou como capaz de dirigir o louvor e que, numa Escala, recebe a marca de quem dirige e escolhe as músicas dela. Não é Função: a marca vai por cima das Funções que o Membro já tem naquela Equipe, só pode ir para quem tem o papel, e quem a carrega normalmente segue no vocal. Pode criar Escalas, montar Equipes e adicionar músicas. Uma Escala pode ter mais de um Ministro dividindo a escolha.
_Avoid_: líder, worship leader, função de ministro

**Admin**:
Membro com tudo que o Ministro faz mais a gestão de Membros (convidar, editar papéis).

**Função**:
O que um Membro faz em uma Equipe (vocal, guitarra, violão, baixo, bateria, teclado, som...). Um Membro pode ter mais de uma Função na mesma Escala. Cada Função pertence a um Grupo, definido pelo Admin. Ministro não é Função.
_Avoid_: instrumento, cargo, role

**Grupo de Funções**:
Conjunto de Funções pelo qual a Equipe se organiza, é avisada e sai agrupada no texto do WhatsApp: Vocal (vocal), Músicos (guitarra, violão, baixo, bateria, teclado) e Som (som). Vocal e Ministro são decididos antes, na Escala do mês; Músicos, durante a semana.
_Avoid_: categoria, seção, time

**Função musical**:
Função dos Grupos Vocal e Músicos, de quem toca ou canta a Música. É a única que credita Execução.

**Função técnica**:
Função de quem serve na Escala sem tocar a Música, como som. Entra na Equipe para tudo (escalado, avisado, presença), mas não credita Execução nem aparece em "quem já tocou".
_Avoid_: apoio, produção, staff

### Escala

**Escala**:
Um culto ou evento com data, horário e rótulo, que reúne uma Equipe e um Repertório. Criada uma a uma (para evento fora de domingo) ou um mês de domingos de uma vez; data e horário podem ser editados depois. Visível a todos os Membros desde a criação: não existe rascunho. Nasce Agendada, vira Realizada sozinha quando o dia termina, ou Cancelada se o Ministro marcar que não aconteceu.
_Avoid_: culto, evento, setlist (como sinônimo do todo)

**Equipe**:
Os Membros de uma Escala, cada um com suas Funções e, se for o caso, a marca de Ministro. O vocal é planejado para o mês inteiro antes do Repertório existir; os músicos, na semana, quase sempre a partir de uma Formação.
_Avoid_: escala de pessoas, time

**Formação**:
Conjunto nomeado e reutilizável de Músicos com Função de instrumento, aplicado numa Equipe de uma vez e ajustado depois. Guarda só os músicos: vocal e som não entram nela. Existe porque os músicos são quase sempre os mesmos: sem ela, montar a Equipe cobraria digitar o que no WhatsApp era implícito.
_Avoid_: template, grupo fixo, banda (é o nome de uma Formação, não o conceito)

**Repertório**:
Lista ordenada de Itens de uma Escala. Preenchido ao longo da semana, um item por vez.
_Avoid_: setlist, lista de músicas

**Item**:
Uma entrada do Repertório: uma Música inteira, um Trecho de Música ou um Medley. Música inteira e Trecho carregam o Tom decidido para aquela execução; o Medley não tem Tom próprio, cada Trecho dele tem o seu. Pode levar uma observação do Ministro para o grupo ("começar mais baixo", "solo na transição"), que viaja para o texto do WhatsApp e para a visão do Membro.

**Trecho**:
Parte de uma Música delimitada por minutagem de início e fim no vídeo de referência. Carrega o próprio Tom, com o último Tom da Música como sugestão.
_Avoid_: parte, pedaço

**Medley**:
Item formado por dois ou mais Trechos encadeados. Montado dentro de uma Escala, não é reaproveitado. Cada Trecho conta como Execução parcial da sua Música.

**Ministrado por**:
O Ministro que puxa um Item. Preenchido sozinho quando a Escala tem um só Ministro; explícito quando há mais de um dividindo a escolha.

**Santa Ceia**:
Escala do culto de comunhão, sempre destacada como diferente e normalmente de manhã. Ao criar o mês de uma vez, o segundo domingo nasce Santa Ceia às 08h; qualquer Escala pode receber a marca à mão.
_Avoid_: ceia, culto especial

**Agendada**:
Estado da Escala que ainda vai acontecer. Ter ou não Itens no Repertório não muda o estado.
_Avoid_: planejada, prevista, aberta, rascunho

**Realizada**:
Estado da Escala cujo dia terminou: vira à meia-noite do dia da Escala, não no horário marcado, para continuar sendo "a de hoje" durante o culto. Só Execuções de Escalas Realizadas entram no histórico. Continua editável por Ministro e Admin sem prazo, inclusive para virar Cancelada; editar o passado é a única forma de corrigir o histórico, e é silencioso: não avisa ninguém.

**Cancelada**:
Estado da Escala que não aconteceu, marcado pelo Ministro antes ou depois da data. Não gera Execução nem conta a favor ou contra a presença de ninguém. Adiar não é cancelar: adiar é mudar a data da mesma Escala.
_Avoid_: adiada, suspensa

### Músicas

**Música**:
Canção do catálogo do ministério, com link de referência (YouTube e/ou Spotify), data de entrada e histórico de Execuções.

**Tom**:
Tonalidade em que uma Música foi tocada em uma Execução. Pertence à Música inteira ou ao Trecho dentro do Item, nunca à Música do catálogo. Escrito como nota mais qualidade — `G` ou `Bm` —, escolhido num teclado de doze notas com um botão de maior ou menor. Pode também ser o valor **`original`**, que quer dizer "toca no tom da gravação": é o que o Ministro escolhe quando ninguém sabe a nota ainda, e vira nota quando um músico tirar a música e avisar. Vale como Tom em tudo — texto do WhatsApp, notificação, histórico. A sugestão padrão é o último Tom de cada Música, venha de Execução inteira ou parcial; sem Execução, o último tom conhecido preenchido à mão; sem nada, o **Tom original**: o tom da gravação, guardado na Música e preenchido pelo Ministro ou pelo Admin, à mão ou confirmando o que o Cifra Club devolveu.
_Avoid_: key

**Execução**:
Registro de que uma Música foi tocada em uma Escala Realizada, por qual Equipe, em qual Tom, inteira ou parcial. Derivada do plano: nasce sozinha de cada Item quando a Escala vira Realizada, creditando os Membros da Equipe daquela Escala que têm Função musical. Não é registrada à parte nem confirmada depois. Uma Execução parcial vem de um Trecho e vale como Execução para todos os fins, marcada como parcial. É o que responde "quem já tocou isso" e "quando tocamos pela última vez".
_Avoid_: play, histórico (o histórico é o conjunto de Execuções)

**Nova**:
Música sem nenhuma Execução e sem marca de Legado. Independe de quando foi adicionada.

**Legado**:
Música importada da playlist do YouTube, tocada antes do app existir: sem Execução, data e Tom desconhecidos. Deixa de ser Legado na primeira Execução, inteira ou parcial.

**Arquivada**:
Música com Execuções que saiu de uso. Fora das buscas e de "adicionar Item", mas presente no histórico de todo mundo. Música sem nenhuma Execução não se arquiva: apaga-se.
_Avoid_: excluída, deletada, inativa

**Sequência**:
Documento com a letra da Música na ordem em que é cantada, repetições por extenso e gancho em destaque. É um arquivo Word anexado à Música ou a um Medley (um Word único para o Medley inteiro, que vale no lugar das letras das Músicas dele), com versões. O app lê o texto na hora do envio e o mostra como está no Word: linha colorida ou começada por `//` ou `*` é marcador, negrito é destaque; nada é interpretado. Enviada por Ministro ou Admin.
_Avoid_: arranjo, cifra, estrutura

**Modo culto**:
Tela inteira, escura e sem internet, para o dia da Escala: a ordem dos Itens com o Tom em letra grande, a Sequência de cada um a um toque, troca por deslize e busca de qualquer Música do catálogo. Lê só do Pacote do culto.
_Avoid_: modo palco, apresentação

**Pacote do culto**:
Cópia guardada no aparelho das Escalas dos próximos 30 dias e do catálogo inteiro com Tom e Sequência, baixada em segundo plano toda vez que o app abre com internet. É o que o Modo culto usa; sem pacote e sem internet, o Modo culto pede para abrir o app com internet antes.
_Avoid_: cache, sincronização

**Sugestão**:
Música proposta por qualquer Membro para ser tocada, nova ou já conhecida, com link, observação e data. Outros Membros podem apoiá-la, para o Ministro ver quantos querem a música antes de promovê-la a Item de uma Escala.
_Avoid_: pedido, voto (apoiar não é votação, é adesão)
