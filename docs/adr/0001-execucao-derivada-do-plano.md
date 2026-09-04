---
status: accepted
date: 2026-09-04
---

# Execução derivada do plano, sem registro de presença

O app precisa responder "quem já tocou essa música" e "quando tocamos pela última vez", e a fonte natural seria alguém registrar o que aconteceu no culto. Decidimos que não existe registro: a Execução é uma vista derivada de Escala Realizada, seus Itens e sua Equipe, e nada mais. Corrigir o passado é editar a Escala Realizada, que fica editável por Ministro e Admin sem prazo e sem avisar ninguém.

## Considered Options

- **Derivar do plano** (escolhida). Zero trabalho depois do culto. O histórico erra sempre que alguém falta ou uma música cai na hora, até alguém editar a Escala.
- **Confirmação obrigatória pelo Ministro** depois do culto. Histórico exato, mas cria uma tarefa de domingo à noite que voluntário não faz, e quando não faz o histórico simplesmente para.
- **Derivado com conceito próprio de correção** ("Pedro não veio"). Mais fiel, mas introduz um segundo modelo de verdade convivendo com o plano.

Escolhemos derivar porque são 15 pessoas de confiança total, a experiência não pode ser mais difícil que o WhatsApp, e um app que depende de disciplina pós-culto pra ter história não terá história.

## Consequences

- Não existe o conceito de presença ou falta. Se um dia precisar, será um registro novo a reconciliar com um histórico que até então veio do plano, e é por isso que esta decisão fica registrada.
- Toda consulta de histórico (perfil, cobertura da Equipe, ordenação por última Execução) lê o plano das Escalas Realizadas. Não há tabela de Execuções a manter.
- Edição de Escala Realizada é silenciosa por definição: é correção, não mudança de plano.
