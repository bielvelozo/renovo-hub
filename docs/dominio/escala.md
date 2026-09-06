# Escala: estados e regras da Execução

Decidido em 04/09/2026 no ticket [Estados da Escala e regras da Execução](../../.scratch/wayfinder-v1/issues/06-estados-escala-execucao.md). Vocabulário em [CONTEXT.md](../../CONTEXT.md). O porquê de a Execução ser derivada está no [ADR 0001](../adr/0001-execucao-derivada-do-plano.md).

## Estados

Três estados, nenhum rascunho: a Escala é visível a todos os Membros desde que é criada.

| Estado | Significado |
| --- | --- |
| **Agendada** | Tem data e vai acontecer. A Equipe vem antes, o Repertório é preenchido ao longo da semana. Ter ou não Itens não muda o estado. |
| **Realizada** | O dia terminou. Suas Execuções contam. |
| **Cancelada** | Não aconteceu. Não gera Execução e não conta presença de ninguém. |

## Criação e edição

- **Em lote**: um mês de domingos de uma vez. O segundo domingo nasce **Santa Ceia às 08h**; os outros, Culto de Domingo 18h. Santa Ceia é sempre destacada como Escala diferente.
- **Avulsa**: uma Escala com nome, data e horário livres, pra evento fora de domingo.
- Data, horário e a marca de Santa Ceia são editáveis pelo Ministro, em Agendada e em Realizada (regra de edição do passado abaixo).
- Cada Item pode levar uma **observação** do Ministro pro grupo, que viaja pro texto do WhatsApp e pra visão do Membro.

## Transições

- **Agendada → Realizada**: automática, à meia-noite (horário de Brasília) do dia da Escala. Não vira no horário marcado: durante o culto ela continua sendo "a de hoje".
- **Agendada → Cancelada**: Ministro ou Admin marca.
- **Realizada → Cancelada**: Ministro ou Admin marca depois da data ("ontem não teve").
- **Cancelada → Agendada ou Realizada**: Ministro ou Admin desfaz; o destino depende só da data.
- **Adiar não é transição**: é mudar a data da mesma Escala, que segue Agendada.
- **Criar Escala com data passada é permitido**: nasce Realizada. Serve pra registrar o domingo que ninguém cadastrou.

## Execução: derivada do plano

A Execução não é registrada nem confirmada por ninguém. Ela existe porque uma Escala Realizada tem Itens e Equipe.

- Cada Item de uma Escala Realizada gera Execução para cada Música envolvida: Música inteira gera uma Execução inteira; Trecho gera uma Execução parcial; Medley gera uma Execução parcial por Trecho.
- Cada Execução credita os Membros da Equipe daquela Escala que ocupam pelo menos uma **Função musical**. Funções técnicas, como som, não creditam.
- Cada Execução carrega o Tom da Música inteira ou do Trecho, e o "ministrado por" do Item.
- Escala Agendada ou Cancelada não gera Execução alguma.

Consequências assumidas:

- O histórico é tão verdadeiro quanto o plano. Se ninguém corrigir, quem faltou consta como tendo tocado.
- Corrigir o passado é editar a Escala Realizada: tirar quem faltou, colocar quem cobriu, remover Item não tocado, ajustar Tom. As Execuções seguem sozinhas. Não existe "refazer Execuções".
- Editar Escala Realizada é silencioso: não dispara notificação.

## Execução parcial

Vale como Execução para todos os fins e aparece marcada como parcial.

- Tira o Legado da Música.
- Atualiza a "última Execução", que ordena a aba Músicas e alimenta o filtro "há mais de X meses".
- Credita a Equipe em "quem já tocou".
- Seu Tom é o Tom do Trecho e vira o "último Tom" sugerido da Música.

Risco aceito: um Medley em agosto faz a Música sair da lista de "faz tempo" sem ter sido ensaiada inteira. Se incomodar na prática, vira filtro depois.

## Tom

- Música inteira e Trecho carregam Tom. Medley não tem Tom próprio: cada Trecho dele tem o seu.
- Sugestão padrão ao adicionar: último Tom da Música, venha de Execução inteira ou parcial.
- Música Legado não tem Tom até alguém preencher o "último tom conhecido" à mão ou uma Execução acontecer.

## Presença e "fins de semana seguidos"

- **Escalas no ano**: Escalas Realizadas em que o Membro estava na Equipe, com qualquer Função.
- **Última Escala**: a Escala Realizada mais recente com o Membro na Equipe. Substitui "última vez que tocou" no Perfil: pro músico dá a mesma data, pro técnico faz sentido.
- **Fins de semana seguidos**: um fim de semana conta como presente se o Membro estava na Equipe de pelo menos uma Escala Realizada dele. Quebra quando houve Escala Realizada no fim de semana e o Membro não estava em nenhuma. Fim de semana sem Escala, ou só com Cancelada, é neutro: não sobe e não quebra. Ninguém perde sequência por feriado.
- Não se chama "sequência": esse nome já é o documento da letra. Mostrar por extenso, "5 fins de semana seguidos".

## Funções, Naipes, Ministro e Formação

Revisado em 04/09/2026 pelo teste do protótipo do Ministro (ticket 13).

- Cada Função pertence a um **Naipe**, definido pelo Admin: **Vocal** (vocal, backing), **Músicos** (guitarra, violão, baixo, bateria, teclado) e **Som** (som).
- **Ministro não é Função**: é um papel que o Admin dá no cadastro do Membro e, em cada Escala, uma marca por cima das Funções de quem dirige. Só quem tem o papel pode receber a marca. Quem dirige normalmente segue no vocal e pode também tocar (Marcos: vocal, violão e Ministro).
- Vocal e Ministro são decididos antes, na Escala do mês. Músicos são decididos na semana e são quase sempre os mesmos: a **Formação** (a "Banda") aplica o grupo de uma vez e o Ministro ajusta o que mudou. Formação é nomeada, reutilizável e editável, e guarda **só Funções de instrumento**: salvar a Formação a partir de uma Equipe deixa vocal e som de fora.
- Quando existe **um único Membro ativo com Função de Som**, ele já entra na Equipe no momento em que a Escala é criada, sem notificação: não há o que decidir, e avisar a cada mês seria ruído.
- Vocal e Músicos creditam Execução (Função musical). Som não credita (Função técnica), mas entra na Equipe pra tudo o mais: "você foi escalado", Escalas no ano, fins de semana seguidos, texto do WhatsApp, ver o Repertório. Só não aparece em "quem já tocou" nem na cobertura da Equipe.
- Membro com uma Função musical e uma técnica na mesma Escala credita Execução.
- No texto do WhatsApp e na tela, a Equipe sai agrupada: Ministro(s), Vocal, Músicos, Som.

## Cenários do ticket

| Cenário | Regra |
| --- | --- |
| Membro escalado faltou e outro cobriu | O histórico segue o plano até alguém editar a Equipe da Escala Realizada. Depois disso as Execuções creditam quem ficou. |
| Item removido do Repertório na sexta | Escala Agendada: o Item some e nunca houve Execução. Avisar quem já viu é assunto do catálogo de notificações. |
| Escala cancelada | Vira Cancelada. Sem Execução, neutra na presença. |
| Escala mudou de data | Muda a data, mesma Escala, continua Agendada. |
| Edição depois de Realizada | Ministro e Admin, sem prazo, silenciosa. Execuções recalculam sozinhas. |
| Medley com Trecho de Música Legado | O Trecho gera Execução parcial; a Música deixa de ser Legado; o Tom do Trecho vira o último Tom dela. |
| Música apagada com Execuções | Não apaga: arquiva. Sai das buscas e do "adicionar Item", fica no histórico. Sem nenhuma Execução, apaga de verdade. |
| Domingo que ninguém cadastrou | Cria com data passada; nasce Realizada e gera Execuções. |
| Evento de sábado à noite | Mesma regra: Realizada à meia-noite do dia dele. |

## Fora deste documento

- Quem pode fazer cada ação: [Acesso por link de convite e matriz de permissões](../../.scratch/wayfinder-v1/issues/07-acesso-convite-permissoes.md).
- Quando cada mudança avisa quem: [Catálogo final de notificações](../../.scratch/wayfinder-v1/issues/08-notificacoes-catalogo.md).
