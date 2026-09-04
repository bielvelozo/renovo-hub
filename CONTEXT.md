# Renovo Hub

App interno do ministério de louvor Renovo Music para montar escalas, registrar o repertório tocado e lembrar o que já foi ensaiado, em que tom e por quem.

## Language

### Pessoas

**Membro**:
Pessoa do ministério que pode entrar em uma Equipe. Vê tudo, sugere músicas e mantém o próprio perfil.
_Avoid_: usuário, músico (músico é uma função, não o papel)

**Ministro**:
Membro que dirige o louvor em uma Escala e escolhe as músicas dela. Pode criar Escalas, montar Equipes e adicionar músicas. Uma Escala pode ter mais de um Ministro dividindo a escolha.
_Avoid_: líder, worship leader

**Admin**:
Membro com tudo que o Ministro faz mais a gestão de Membros (convidar, editar papéis).

**Função**:
O que um Membro faz em uma Equipe (vocal, guitarra, baixo, bateria, teclado, ministro...). Um Membro pode ter mais de uma Função.
_Avoid_: instrumento, cargo, role

### Escala

**Escala**:
Um culto ou evento com data, que reúne uma Equipe e um Repertório. Criada livremente, não amarrada a fim de semana. Vira Realizada automaticamente quando a data passa.
_Avoid_: culto, evento, setlist (como sinônimo do todo)

**Equipe**:
Os Membros de uma Escala, cada um com sua Função. Normalmente planejada para o mês inteiro antes do Repertório existir.
_Avoid_: escala de pessoas, time

**Repertório**:
Lista ordenada de Itens de uma Escala. Preenchido ao longo da semana, um item por vez.
_Avoid_: setlist, lista de músicas

**Item**:
Uma entrada do Repertório: uma Música inteira, um Trecho de Música ou um Medley. Carrega o Tom decidido para aquela execução.

**Trecho**:
Parte de uma Música delimitada por minutagem de início e fim no vídeo de referência.
_Avoid_: parte, pedaço

**Medley**:
Item formado por dois ou mais Trechos encadeados. Montado dentro de uma Escala, não é reaproveitado. Cada Trecho conta como Execução parcial da sua Música.

**Ministrado por**:
O Ministro que puxa um Item. Preenchido sozinho quando a Escala tem um só Ministro; explícito quando há mais de um dividindo a escolha.

**Realizada**:
Estado da Escala cuja data já passou. Só Execuções de Escalas Realizadas entram no histórico.

### Músicas

**Música**:
Canção do catálogo do ministério, com link de referência (YouTube e/ou Spotify), data de entrada e histórico de Execuções.

**Tom**:
Tonalidade em que uma Música foi tocada em uma Execução. Pertence ao Item, não à Música; o último Tom é a sugestão padrão.
_Avoid_: key

**Execução**:
Registro de que uma Música foi tocada em uma Escala Realizada, por qual Equipe, em qual Tom, inteira ou parcial. É o que responde "quem já tocou isso" e "quando tocamos pela última vez".
_Avoid_: play, histórico (o histórico é o conjunto de Execuções)

**Nova**:
Música sem nenhuma Execução e sem marca de Legado. Independe de quando foi adicionada.

**Legado**:
Música importada da playlist do YouTube, tocada antes do app existir: sem Execução, data e Tom desconhecidos. Deixa de ser Legado na primeira Execução.

**Sequência**:
Documento com a letra da Música na ordem em que é cantada, repetições por extenso e gancho em destaque. Hoje é um arquivo Word; anexado à Música, com versões.
_Avoid_: arranjo, cifra, estrutura

**Sugestão**:
Música proposta por qualquer Membro para ser tocada, nova ou já conhecida, com link e observação. O Ministro pode promovê-la a Item de uma Escala.
