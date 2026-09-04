# Estados da Escala e regras da Execução

Type: grilling
Status: resolved
Blocked by: 
Map: ../map.md

## Question

Quais são os estados de uma Escala (planejada sem Repertório, com Repertório em construção, Realizada) e o que exatamente dispara cada Execução? Cenários a fechar com o Gabriel: Membro escalado que faltou e outro cobriu (histórico segue quem tocou de fato?); Item removido do Repertório na sexta; Escala que não aconteceu (cancelada) ou mudou de data; edição de Equipe/Repertório depois de Realizada (permitida por quanto tempo? refaz Execuções?); Medley com Trecho de uma Música Legado; Música apagada do catálogo com Execuções. Saída: estados e transições escritos em `docs/dominio/escala.md`, CONTEXT.md atualizado, e ADR só se alguma regra for difícil de reverter.

## Answer

Resolvido em 04/09/2026 em três rodadas de grilling com o Gabriel. Documento completo em [docs/dominio/escala.md](../../../docs/dominio/escala.md); glossário atualizado em [CONTEXT.md](../../../CONTEXT.md); a decisão difícil de reverter está no [ADR 0001](../../../docs/adr/0001-execucao-derivada-do-plano.md).

**Execução é derivada do plano, ponto.** Gabriel escolheu o modelo mais simples contra a recomendação de ter correção opcional: nada é confirmado depois do culto. A Execução existe porque uma Escala Realizada tem Itens e Equipe. Corrigir o passado é editar a Escala Realizada, por Ministro ou Admin, sem prazo e sem notificar. "Faltou e outro cobriu" só se conserta assim.

**Três estados, sem rascunho.** Agendada, Realizada, Cancelada. A Escala nasce visível pra todo mundo. Vira Realizada à meia-noite do dia dela, não no horário, pra continuar sendo "a de hoje" durante o culto. Cancelada não gera Execução nem conta presença; pode ser marcada antes ou depois da data e desfeita. Adiar é mudar a data. Criar Escala com data passada é permitido e nasce Realizada.

**Execução parcial vale tudo, marcada como parcial.** Tira o Legado, atualiza última Execução, credita a Equipe. Risco aceito: Medley pode tirar uma Música da lista de "faz tempo" sem ensaio inteiro.

**Tom é por Trecho.** Medley não tem Tom próprio. Sugestão padrão continua sendo o último Tom da Música, venha de onde vier.

**Função é musical ou técnica.** Surgiu do Gabriel: o responsável pela mesa de som precisa estar na Equipe pra se sentir incluído, mas não toca a música. Função técnica entra em tudo (escalado, avisado, Escalas no ano, fins de semana seguidos) menos em "quem já tocou". Perfil passa a mostrar "última Escala" em vez de "última vez que tocou".

**Fins de semana seguidos** é o nome do streak, por extenso, porque "sequência" já é a letra da Música. Só quebra quando houve Escala Realizada e o Membro não estava; sem Escala ou só Cancelada é neutro.

**Música com Execução não se apaga, arquiva.** Sem Execução, apaga de verdade.

Entradas geradas pra outros tickets: cadastro inicial (05) precisa incluir o som e marcar as Funções; permissões (07) ganha as ações de cancelar, desfazer, editar Realizada, criar no passado e arquivar; notificações (08) herda "editar Realizada é silencioso" e a pergunta sobre Item removido e Cancelada; protótipo do Ministro (13) ganha Tom por Trecho no Medley, cobertura só de Funções musicais e o roteiro de corrigir domingo passado.
