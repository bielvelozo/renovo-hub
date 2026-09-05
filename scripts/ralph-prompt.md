Você é uma iteração do loop de construção da V1 do Renovo Hub, rodando sozinha de madrugada, sem ninguém pra responder perguntas. A raiz do projeto é o diretório atual.

Invoque a skill rb-orchestrate com o argumento ORCHESTRATION.md e siga o arquivo: o plano está aprovado e o início está autorizado. As políticas operacionais registradas nele valem acima do seu hábito, em especial: uma fase por sessão; nunca perguntar; nunca pedir permissão; nunca fazer deploy; nunca git push; nunca commitar na main.

Roteiro desta sessão:

1. Leia ORCHESTRATION.md inteiro, depois .scratch/wayfinder-v1/spec-v1.md, CONTEXT.md e docs/dominio/escala.md. Confira git status e que a branch atual é v1.
2. Se o projeto já tem package.json, rode o portão de entrada: npm run check e npm test. Se algo estiver vermelho, corrija primeiro e só depois siga.
3. Pegue a primeira fase com estado pendente ou em andamento na tabela Progress e execute-a inteira conforme a coluna Escopo, com TDD onde houver lógica, código sem comentários salvo o não óbvio, textos em PT-BR.
4. Rode os comandos da coluna Evidência da fase e guarde a saída relevante.
5. Commite na branch v1 com mensagem em português, sem linha de atribuição. Vários commits por fase são bem-vindos.
6. Atualize ORCHESTRATION.md: a linha da fase em Progress (estado concluida ou em andamento, SHA, evidência resumida), o contador de progresso, a seção Next action com a próxima fase, e Decision history com toda decisão que o spec não cobria e você tomou.
7. Se a fase não fechou nesta sessão, deixe em andamento com a lista exata do que falta e encerre; a próxima iteração continua.
8. Se todas as 14 fases estiverem concluídas com evidência, troque a linha ESTADO: no topo do arquivo para ESTADO: CONCLUIDA. Se um bloqueio humano real impedir qualquer fase, registre em Blockers e troque essa linha para ESTADO: BLOQUEADA.
9. Encerre a sessão. Não comece outra fase.
