# Reunião

Spec decidida com o Gabriel em 06/10/2026. O desenho aprovado está no canvas de Design https://claude.ai/artifact/HbMKYLFBcPgCS7haFBMQaP (seis telas a 360 px: marcar, Mês, página da reunião, Início claro e escuro, avisos).

Leitura obrigatória junto: `CONTEXT.md` (Escala, Equipe, Função, Agendada, Cancelada), `docs/dominio/escala.md` (estados, presença, criação do mês), `PRODUCT.md` (princípios 2 e 3, "fora do escopo por decisão"), [F2+F3](2026-09-12-inicio-mes-escala-equipe-design.md) (`GET /api/inicio`, linhas do Mês, pendências).

## Objetivo

O ministério marca reunião no app sem fingir que é uma Escala. Todo mundo fica sabendo (aviso, véspera, Início, Mês e texto do WhatsApp), e nada do que existe para a Escala (pendências, presença, Execução, modo culto, criação do mês) enxerga a reunião.

## O que acontece hoje em produção

Lido no D1 remoto em 06/10/2026: três Escalas avulsas "Reunião Mensal", todas no sábado às 13h, criadas em 01/10 com os 13 Membros na Equipe, cada um com uma Função inventada (vocal, bateria, som...) porque a Equipe exige Função.

| id | data | estado |
| --- | --- | --- |
| `4325deec-cdaf-4201-8f3d-648e46d1d07c` | sáb 10/10 13h | Agendada |
| `4ac2b74a-5a10-4c57-8c46-f8077818418a` | sáb 12/12 13h | Agendada |
| `a03fe5c0-ff24-4154-92a9-5df265374377` | sáb 12/12 13h | Cancelada (duplicata da anterior) |

Efeitos medidos e lidos no código:

- 52 pushes saíram: 39 "Você foi escalado... na bateria" (um por Membro por Escala) e 13 "Escala cancelada".
- As três aparecem em "Precisa de atenção" do Ministro com "sem ministro · sem músicas" (`src/dominio/pendencias.ts`).
- Na sexta 09/10 às 10h, os 13 vão receber "Amanhã tem Escala: Escala ainda sem músicas" (`worker/push/gatilhos.ts`, `gerarLembretes`).
- Quando a de 10/10 virar Realizada, todos ganham uma Escala no ano e o fim de semana 10–11 conta como servido para quem não tocou no domingo (`src/dominio/presenca.ts`).
- Reunião marcada num domingo antes de o mês ser criado faria "Criar as escalas do mês" pular aquele culto (`datasJaCriadas` em `worker/rotas/escalas.ts`).

## Decisões já tomadas (não reabrir)

| Decisão | Escolha | Data |
| --- | --- | --- |
| Conceito | Reunião é entidade própria, tabela própria. Não é flag na Escala: cada leitor da Escala esquecido viraria alerta falso | 06/10 |
| Nome | "Reunião" no domínio e na tela. "Evento" fica de fora porque colide com a Escala avulsa | 06/10 |
| Para quem | O ministério inteiro. Sem Equipe, sem Função, sem músicas | 06/10 |
| Quem marca, edita e cancela | Ministro e Admin, como a Escala | 06/10 |
| Campos | Nome, data, horário; local e observação opcionais | 06/10 |
| "Quem vai" | Fora. Seria confirmação exigida (princípio 2) e "disponibilidade do Membro" já está fora do escopo | 06/10 |
| Apagar | Não existe. Cancelar resolve, avisa todo mundo e fica visível | 06/10 |
| Avisos | Para todos os Membros ativos: marcada, véspera às 10h, mudou (data, horário ou local), cancelada | 06/10 |
| WhatsApp | Botão que copia o texto da reunião, porque em 06/10 9 dos 13 não recebiam push | 06/10 |
| Entrada | Botão "Marcar" no Mês abre a folha com segmento Escala/Reunião | 06/10 |
| Início | Cartão "Reunião" abaixo da próxima Escala, a partir de 7 dias antes, nunca no título nem em pendências | 06/10 |
| Mês | Na ordem das datas, selo cinza "reunião", sem selo de pendência | 06/10 |
| Ensaio | Fora desta spec: tem música, mas não deveria gerar Execução, e é outra conversa | 06/10 |

## 1. Domínio

### Regra que separa os dois conceitos

É **Escala** quando o louvor serve: tem Equipe e Repertório, gera Execução, conta presença. É **Reunião** quando o ministério só se encontra: é para todos, não tem Equipe, não tem músicas e não conta nada.

### Tipo `Reuniao` (`src/dominio/tipos.ts`)

```ts
export type Reuniao = {
  id: string
  data: string
  horario: string
  nome: string
  local: string
  observacao: string
  cancelada: boolean
  criadaPor: string | null
  criadoEm: string
}
```

`local` e `observacao` vazios quando não preenchidos. `criadaPor` é `null` nas reuniões migradas (a tabela `escalas` não guarda autor).

### Estados

Não há Realizada. A reunião é **marcada** ou **cancelada**; "já passou" é só `data < hoje` (horário de Brasília), sem gravar nada. Cancelar e desfazer são permitidos a qualquer momento.

### Funções puras (`src/dominio/reuniao.ts`)

- `reunioesDoInicio(reunioes, hoje)`: as de `hoje` até `hoje + 7` dias, inclusive canceladas (quem não recebe push precisa ver o "cancelada"), ordenadas por data e horário.
- `textoDaReuniaoParaWhatsApp(reuniao)`:
  ```
  *Reunião Mensal 13h · 10/10*
  Local: Igreja · sala 2

  Alinhar o repertório de novembro.
  ```
  Primeira linha no formato do título da Escala (`nome horário · dd/mm`), com ` · cancelada` no fim quando cancelada. Linha de local só se houver; observação depois de uma linha em branco, só se houver.
- `quandoDaReuniao(reuniao, hoje)`: "hoje", "amanhã" ou "em N dias", para a dica do Início.
- Avisos (`avisoDeReuniaoMarcada`, `avisoDeReuniaoLembrete`, `avisoDeReuniaoMudou`, `avisoDeReuniaoCancelada`), com o texto da seção 4 e `url: /reunioes/:id`.

### Vocabulário

`CONTEXT.md` ganha a entrada **Reunião** (definição acima; _Avoid_: evento, encontro, Escala de reunião), e a entrada **Escala** ganha a frase "Reunião não é Escala".

## 2. Dados

### Migração `0014_reunioes.sql`

```sql
CREATE TABLE reunioes (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  nome TEXT NOT NULL,
  local TEXT NOT NULL DEFAULT '',
  observacao TEXT NOT NULL DEFAULT '',
  cancelada INTEGER NOT NULL DEFAULT 0,
  criada_por TEXT REFERENCES membros(id) ON DELETE SET NULL,
  criado_em TEXT NOT NULL
);

CREATE INDEX reunioes_por_data ON reunioes(data);

ALTER TABLE notificacoes ADD COLUMN reuniao_id TEXT REFERENCES reunioes(id) ON DELETE CASCADE;
```

A tabela `notificacoes` hoje só aponta para `escalas` (`escala_id` com cascade). A coluna nova segue o mesmo desenho: o aviso some junto com a reunião, e "já teve esse aviso" passa a poder ser perguntado por reunião.

### Acesso (`worker/dados/reunioes.ts`)

`reunioesDoMes(db, mes)`, `reunioesEntre(db, de, ate)`, `reunioesDoDia(db, data)`, `reuniaoPorId(db, id)`, `criarReuniao`, `atualizarReuniao`, `definirReuniaoCancelada`. A reunião **não** entra em `carregarMinisterio`: quem não pede, não vê.

## 3. API

Todas com o mesmo formato de erro e as mesmas mensagens de validação da Escala (`DATA_INVALIDA`, `HORARIO_INVALIDO`).

| Rota | Quem | O que faz |
| --- | --- | --- |
| `GET /api/escalas?mes=` | Membro | Passa a devolver também `reunioes` do mês, para o Mês montar a lista numa requisição só |
| `GET /api/inicio` | Membro | Passa a devolver `reunioes` (resultado de `reunioesDoInicio`) |
| `GET /api/reunioes/:id` | Membro | A reunião, com o nome de quem marcou quando houver. 404 com "Reunião não encontrada." |
| `POST /api/reunioes` | Ministro | Cria. Corpo `{ data, horario, nome, local?, observacao? }`. Nome vazio vira "Reunião". Data antes de hoje: 422 "Escolha uma data de hoje em diante." Avisa "marcada" |
| `PATCH /api/reunioes/:id` | Ministro | Edita qualquer campo. Mudar a data para antes de hoje: 422 com a mesma mensagem. Avisa "mudou" só se mudou data, horário ou local e a reunião é de hoje em diante |
| `POST /api/reunioes/:id/cancelar` | Ministro | Marca cancelada. Avisa "cancelada" se for de hoje em diante |
| `POST /api/reunioes/:id/desfazer` | Ministro | Desfaz o cancelamento. Avisa "marcada" de novo se for de hoje em diante. Diferente da Escala, que desfaz em silêncio: aqui todo mundo foi avisado do cancelamento |

## 4. Avisos

Destinatários: todos os Membros ativos (`inativo = 0`), menos o autor da ação em "marcada", "mudou" e "cancelada". O lembrete vai para todos, autor incluído. Quem silenciou no Perfil continua sem receber, porque isso já é resolvido no despacho (`worker/push/despacho.ts`). Reunião passada nunca avisa.

| Tipo | Quando | Título | Corpo |
| --- | --- | --- | --- |
| `reuniao-marcada` | criar ou desfazer cancelamento | Reunião marcada | Reunião Mensal · sáb, 10 de out às 13h · Igreja · sala 2 |
| `reuniao-lembrete` | 10h da véspera, reunião não cancelada | Amanhã tem reunião | Reunião Mensal às 13h · Igreja · sala 2 |
| `reuniao-mudou` | data, horário ou local mudou | Reunião mudou | Reunião Mensal agora é sáb, 17 de out às 13h · Igreja · sala 2 |
| `reuniao-cancelada` | cancelar | Reunião cancelada | Reunião Mensal de sáb, 10 de out cancelada |

O trecho de local só aparece quando há local. Datas com `formatarDia`, horários com `rotuloDoHorario`, como nos avisos da Escala.

O lembrete entra no `rodarNotificacoes` do cron de 15 minutos, ao lado de `gerarLembretes`, com a mesma regra de "já teve" (por Membro, tipo e reunião).

## 5. Telas

Todas seguem o canvas aprovado e os componentes existentes (`Cabecalho`, `Folha`, `Segmento`, `Campo`, `Botao`, `Selo`, `Menu`, `Vazio`).

### Mês (`src/paginas/Mes.tsx`, `src/escalas/mes.ts`)

- O botão "Nova escala" do cabeçalho vira **Marcar** (mantém `data-guia="nova-escala"`). A folha ganha um `Segmento` Escala/Reunião no topo, começando em Escala; o título acompanha ("Nova escala" / "Nova reunião"). O lado Escala fica como está hoje.
- Lado Reunião: dica "Para o ministério inteiro, sem Equipe e sem músicas. Todo mundo recebe o aviso."; campos Nome (placeholder "Reunião do louvor"), Data e Horário lado a lado, Local · opcional, Observação · opcional (área de texto); botão **Marcar reunião**. A data começa em hoje quando o mês visto é o corrente, senão no dia 1 do mês visto. Ao marcar, abre a página da reunião.
- `linhasDoMes` passa a intercalar reuniões e Escalas por data e horário. Linha da reunião: bloco do dia, nome, dica "horário · local", selo cinza "reunião", e selo "cancelada" (perigo) com o nome em cinza quando cancelada. Sem selo de pendência.
- "Hoje não tem nada marcado" considera as reuniões.
- O resumo conta as duas: "4 escalas e 2 reuniões no mês · você está em 3" (o "você está em" continua contando só Escalas).
- O recolhido das passadas conta as duas: "1 escala e 1 reunião já passaram".
- O texto do guia em `src/guia/tarefas.ts` troca "toque em Nova escala" por "toque em Marcar".

### Página da reunião (`/reunioes/:id`, `src/paginas/Reuniao.tsx`)

- Cabeçalho com voltar, nome e "dia, horário". Para Ministro e Admin, menu "···" com **Cancelar reunião** (ou **Desfazer cancelamento**).
- Cartão com três linhas de ícone: data por extenso com horário ("Sábado, 10 de outubro, às 13h"), local (só se houver), "Para todo o ministério".
- Observação em cartão próprio, com rótulo, só se houver.
- Dica "Marcada por Marcos em 1 de out." (sem o "por" quando não há autor).
- Cancelada: faixa de aviso "Reunião cancelada" no topo do conteúdo.
- Rodapé de ação: **WhatsApp** para todos (copia o texto da seção 1); **Editar** ao lado, só para Ministro e Admin, abrindo a mesma folha preenchida, sem segmento, com título "Editar reunião" e botão "Salvar".
- Id inexistente: a mesma tela de "não encontrada" da Escala.

### Início (`src/paginas/Inicio.tsx`)

- Depois do cartão da próxima Escala (ou do vazio, quando não há Escala), rótulo **Reunião** e um cartão com uma linha por reunião de `reunioesDoInicio`: bloco do dia, nome, dica "horário · local · em N dias" ("hoje", "amanhã"), seta para a página. Cancelada leva o selo "cancelada".
- A reunião nunca muda o título do Início, nunca entra em "Precisa de atenção", nunca vira "Culto de hoje" nem atalho do modo culto.

## 6. Migração dos dados de produção

Roda uma vez, à mão, depois que a `0014` estiver aplicada no remoto e o Worker novo publicado, por `wrangler d1 execute renovo-hub --remote`:

```sql
INSERT INTO reunioes (id, data, horario, nome, local, observacao, cancelada, criada_por, criado_em)
SELECT id, data, horario, rotulo, '', '', 0, NULL, criado_em FROM escalas
WHERE id IN ('4325deec-cdaf-4201-8f3d-648e46d1d07c', '4ac2b74a-5a10-4c57-8c46-f8077818418a');

DELETE FROM escalas WHERE id IN (
  '4325deec-cdaf-4201-8f3d-648e46d1d07c',
  '4ac2b74a-5a10-4c57-8c46-f8077818418a',
  'a03fe5c0-ff24-4154-92a9-5df265374377'
);
```

- A duplicata cancelada de 12/12 não vira reunião: mostraria uma "cancelada" ao lado da de verdade.
- É silenciosa: nenhum "Reunião marcada" para quem já sabe.
- O `DELETE` leva junto, por cascade, a Equipe inventada e as notificações antigas; presença e pendências se corrigem sozinhas porque são calculadas.
- Prazo: antes de **sexta, 09/10, às 10h** (horário de Brasília). Depois disso o cron manda "Amanhã tem Escala: Escala ainda sem músicas" para os 13.
- Antes de rodar, conferir de novo as três linhas: se alguém tiver criado outra "Reunião" como Escala até lá, ela entra na lista.
- Push antigo apontando para `/escalas/<id>` dessas três passa a abrir "não encontrada". Aceito.

## 7. Documentação

- `CONTEXT.md`: entrada Reunião e a frase na Escala (seção 1).
- `docs/adr/0003-reuniao-fora-da-escala.md`: por que tabela própria e não flag, com a evidência de produção.
- `PRODUCT.md`: Reunião na lista de telas e em Comunicação; "quem vai" e recorrência em "fora do escopo".
- `docs/dominio/escala.md`: uma linha em "Fora deste documento" apontando para a Reunião.
- `README.md` (em inglês): a funcionalidade na lista.

## 8. Testes

- `src/dominio/reuniao.test.ts`: janela do Início (limites de 0 e 7 dias, canceladas incluídas, ordem), texto do WhatsApp (com e sem local, com e sem observação, cancelada), textos dos quatro avisos, "hoje/amanhã/em N dias".
- `src/escalas/mes.test.ts`: linhas intercaladas, "hoje não tem nada" com reunião hoje, resumo e recolhido contando as duas.
- `worker/rotas/reunioes.test.ts`: Membro não cria nem edita (403); data passada recusada; criar avisa todos os ativos menos o autor e nenhum inativo; editar só nome ou observação não avisa; editar data avisa "mudou"; cancelar e desfazer avisam; reunião passada não avisa; 404.
- `worker/push/gatilhos.test.ts`: lembrete da véspera para todos, uma vez só, nada para cancelada.
- `worker/rotas/escalas.test.ts` e `inicio.test.ts`: `reunioes` nas respostas, e a prova de que a reunião não aparece em pendências, presença, pacote do culto nem bloqueia a criação do mês.
- `worker/testes/migracoes.test.ts`: a `0014` aplica sobre o banco atual.
- `src/paginas/Inicio.test.tsx` e um teste da página da reunião: cartão renderiza, Editar só para quem dirige.

## Fora desta spec

- Confirmação de presença ("quem vai").
- Recorrência. Sinal registrado: a "Reunião Mensal" caiu no segundo sábado em outubro e dezembro. Se marcar uma por mês virar atrito, vem uma "repetir todo mês" depois.
- Apagar reunião.
- Ensaio.
- Reunião no Pacote do culto, no modo culto e no texto do WhatsApp da Escala.
- Redirecionar as URLs antigas `/escalas/<id>` das três migradas.
