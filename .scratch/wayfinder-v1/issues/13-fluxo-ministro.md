# Protótipo do fluxo central do Ministro

Type: prototype
Status: resolved
Blocked by: 06
Map: ../map.md

## Question

O fluxo central funciona em menos toques que mandar no WhatsApp? Protótipo clicável (pode ser sem marca, em cinza) de: tela de mês criando as Escalas de domingo em lote e preenchendo Equipe com Funções; na terça, adicionar um Item colando link do YouTube (título e capa automáticos), escolher Tom (com último Tom sugerido e histórico por quem ministrou), marcar inteira ou Trecho com minutagem, ver cobertura da Equipe ("Gabriel e Isa já tocaram, Pedro nunca"); montar um Medley de 2 Trechos; promover uma Sugestão; gerar o texto pra WhatsApp. Contar toques por tarefa e comparar com o WhatsApp. Saída: verdict por tela e ajustes no domínio se o protótipo desmentir alguma premissa.

## Entradas de outros tickets

- De [Estados da Escala](06-estados-escala-execucao.md): no Medley, cada Trecho pede seu Tom (contar esses toques); a cobertura da Equipe lista só Funções musicais; acrescentar ao roteiro "corrigir a Escala de domingo passado: tirar quem faltou, colocar quem cobriu" e "marcar a Escala como Cancelada", porque editar o passado é a única correção de histórico que existe. Regras em [docs/dominio/escala.md](../../../docs/dominio/escala.md).

## Protótipo (04/09/2026)

Branch `prototype/fluxo-ministro`, arquivo `prototypes/fluxo-ministro/index.html`. Um HTML só, sem marca, abre com dois cliques em qualquer navegador; nada é salvo. Pra pegar sem trocar de branch: `git show prototype/fluxo-ministro:prototypes/fluxo-ministro/index.html > fluxo-ministro.html`.

**Pra mandar pro Ministro**: publicado como artefato privado em https://claude.ai/code/artifact/4f70f368-76fa-4af4-be0a-0e59bb0bb623 (compartilhar pelo menu da página). É a variante `artifact.html` da mesma branch, com as capas embutidas porque o artefato bloqueia imagem externa. Verificado rodando no claude.ai em 04/09 (commit 25d16f3 da branch): o frame do artefato impõe Trusted Types, então a casca cria a política padrão antes de desenhar; sem isso a tela fica em branco.

O domínio (Escalas, Equipe, Itens, Execuções derivadas, último Tom, cobertura, texto do WhatsApp) está num módulo puro separado da tela, seguindo `docs/dominio/escala.md`; é a parte que sobrevive ao protótipo. Cada toque e cada tecla dentro do celular contam. Oito roteiros zeram o estado e dizem o que fazer; o painel da direita mostra as Execuções derivadas mudando.

Contagem verificada por script disparando cliques e teclas reais. Os números do WhatsApp são estimativas do agente contando cada letra digitada; o Gabriel corrige.

| Roteiro | Toques no app | WhatsApp hoje (est.) |
| --- | --- | --- |
| 1. Montar o mês de outubro (4 Escalas, Equipe de 6) | 10 | ~200 |
| 2. Terça: adicionar música colando o link | 5 | ~45 |
| 3. Trecho com minutagem digitada | 14 | ~30 |
| 4. Medley de 2 Trechos, Tom por Trecho | 24 | ~70 |
| 5. Promover uma Sugestão | 3 | ~20 |
| 6. Gerar e copiar o texto pro WhatsApp | 2 | ~250 |
| 7. Corrigir o domingo passado (faltou/cobriu) | 4 | não existe |
| 8. Cancelar uma Escala | 3 | ~40 |

Observações do agente, não veredito: (a) nenhuma premissa foi desmentida pela construção; (b) a minutagem digitada domina o custo: no Medley, 18 dos 24 toques são dígitos e foco em campo. Escolher início e fim tocando no player em vez de digitar é o ajuste mais óbvio se o Ministro tropeçar aí; (c) Tom por Trecho custou 1 toque a mais só quando a música não tinha histórico, porque a sugestão já vem selecionada.

**Pendente pro veredito**: Gabriel percorre os oito roteiros e, se der, um Ministro também, sem explicação prévia. Anotar por tela: hesitação, "no WhatsApp eu faria assim", toque que pareceu desnecessário. O ticket fecha com o veredito por tela e os ajustes de domínio que saírem.

## Feedback do Gabriel (teste, 04/09/2026)

1. **Tela de Equipe (roteiro 1)**: precisa separar Vocal de Músicos. O vocal é decidido antes (Equipe do mês); os músicos são decididos durante a semana. Pros músicos, precisa existir um grupo pré-definido, editável, aplicado de uma vez: hoje há um músico por instrumento, então a formação é sempre a mesma e o ministério nem monta escala de músico. Sem isso o app regride em relação ao WhatsApp, onde ninguém digita o nome dos músicos porque está implícito.
2. **Seleção de Função (chip "Ministro ⇄ Violão")**: Ministro não é Função separada, é incremento. Quem é Ministro também é vocal, e pode também tocar violão. O chip que alterna entre Ministro e Violão como alternativas exclusivas está errado: o Membro carrega suas Funções normais e, por cima, a marca de que dirige aquela Escala. Revisa a premissa "Ministro é uma Função da Equipe".
3. **Música nova pelo link (roteiro 2)**: ao cadastrar Música nova, o app precisa buscar o tom original da gravação de algum lugar, senão quem monta a Escala vai procurar no Google na hora. É esforço a mais que o fluxo não pode cobrar. Hoje a tela diz "Sem histórico: escolha o Tom". Fonte do tom original é pergunta de pesquisa (cifra, metadados do vídeo, serviço de áudio). Obs.: o link colado no teste era de um vídeo fora da tabela fake do protótipo, por isso apareceu "Canal desconhecido"; no app real o oEmbed traz título e canal.
4. **Capa do Medley (roteiro 4)**: a capa do Medley no Repertório tem que ser uma montagem das capas de todas as músicas dele, não só da primeira. Hoje mostra a thumb do primeiro Trecho, o que faz o Medley parecer uma música só.
5. **Texto pro WhatsApp (roteiro 6)**: a Equipe na mensagem tem que vir separada em grupos (ministros, músicos, backing, som), não numa lista única com a Função entre parênteses. Mesma separação que o ponto 1 pede na tela de Equipe. Obs. do agente na captura: o Ministro digitou "2" e "7" como minutagem e o protótipo aceitou; o campo precisa de formato guiado, e é mais um sinal de que digitar minutagem é o ponto fraco do fluxo.
6. **Sugestões (roteiro 5)**: cada Sugestão precisa mostrar a data em que foi feita, e ter um voto ("também quero") pra Membro que gostou da ideia mas não pode promover. Hoje a Sugestão só tem quem sugeriu e a observação. Muda o domínio: Sugestão ganha data e apoio de outros Membros.
7. **Tela de mês (roteiro 1)**: além de "criar os domingos do mês", precisa de "criar Escala avulsa" pra evento que não é domingo (conferência, evento especial), com data, horário e rótulo livres. A premissa "criação livre, não presa a fim de semana" existe no domínio mas não estava na tela.
8. **Tela da Escala**: precisa editar data e horário, e marcar a Escala como Santa Ceia (rótulo), porque Santa Ceia é sempre destacada como Escala diferente e o culto é de manhã. Regra pedida: ao gerar os domingos do mês, o primeiro domingo já nasce às 08h e marcado como Santa Ceia; qualquer outra Escala pode ser marcada como Santa Ceia à mão. Isso muda o preset "Culto de Domingo 18h": o lote do mês tem dois formatos, não um.
9. **Repertório como playlist**: seria bom o app gerar uma playlist a partir do Repertório da Escala, pra quem vai tocar ouvir em loop. Gabriel não sabe a complexidade e aceita que fique pra v2. Obs. do agente: o YouTube tem um link não documentado que monta playlist anônima a partir de uma lista de ids de vídeo, sem conta nem chave; se confirmar em pesquisa, custa quase nada e cabe no v1. Trecho e Medley não entram na playlist, só a Música inteira.
10. **Observação no Item**: tanto na Música quanto no Medley o Ministro precisa poder escrever uma observação livre. Exemplos reais: "essa música vamos começar mais baixo, diferente de como está no clipe"; no Medley, "pra transição das músicas seria legal um solo de guitarra". Muda o domínio: Item ganha observação, e ela entra no texto do WhatsApp e na visão do Membro.

## Correções da versão 2 (04/09/2026)

Protótipo reescrito com os dez pontos, commitado na branch `prototype/fluxo-ministro` e republicado na mesma URL do artefato. O que mudou por ponto:

1. Equipe por naipe (Vocal, Músicos, Som) e a Formação "Banda", com "Aplicar Banda" e "Salvar como Banda". Domínio: Naipe e Formação entraram no CONTEXT.md e em `docs/dominio/escala.md`.
2. Ministro virou chip por cima das Funções: Marcos pode ser vocal, violão e Ministro ao mesmo tempo. Domínio: Ministro deixou de ser Função; premissa corrigida.
3. Tom original da gravação virou a terceira fonte da sugestão (última Execução, tom à mão, gravação). No protótipo é simulado; de onde vem de verdade é o ticket 19, pesquisa já disparada.
4. Capa do Medley é montagem das capas dos Trechos.
5. Texto do WhatsApp sai com a Equipe agrupada (Ministro, Vocal, Músicos, Som), a observação de cada Item e o link da playlist.
6. Sugestão mostra data e apoios, com "Apoiar" pra quem não pode promover. Domínio: Sugestão tem data e apoio.
7. "+ Escala avulsa" na tela de mês, com nome, data e hora. Virou o roteiro 9.
8. Menu da Escala tem "Editar data, horário e Santa Ceia"; o lote do mês nasce com o primeiro domingo Santa Ceia às 08h (06/09 e 04/10 nos dados de exemplo). Domínio: Santa Ceia no glossário; preset das premissas corrigido.
9. "Ouvir o Repertório no YouTube" com o link não documentado de playlist anônima, também no texto do WhatsApp. Se funciona no iPhone é o ticket 20, pesquisa já disparada.
10. Observação livre no Item, na Música e no Medley; aparece no Repertório, no texto e no painel.

Extra, fora dos dez pontos: o artefato tinha ficado em branco no navegador. A causa mais provável é o runtime da página bloquear montagem de HTML por string; a v2 registra uma política padrão de Trusted Types e, se a tela não montar, escreve o erro na própria tela em vez de ficar branca.

Contagem v2, verificada por script:

| Roteiro | v1 | v2 | WhatsApp (est.) |
| --- | --- | --- | --- |
| 1. Montar o mês (Santa Ceia automática, Ministra, vocal, Banda num toque) | 10 | 7 | ~200 |
| 2. Colar link, tom original já sugerido | 5 | 4 | ~45 |
| 3. Trecho com minutagem digitada | 14 | 14 | ~30 |
| 4. Medley de 2 Trechos | 24 | 23 | ~70 |
| 5. Promover Sugestão | 3 | 3 | ~20 |
| 6. Texto pro WhatsApp | 2 | 2 | ~250 |
| 7. Corrigir domingo passado | 4 | 4 | não existe |
| 8. Cancelar Escala | 3 | 3 | ~40 |
| 9. Escala avulsa (nome, data e hora digitados) | — | 26 | ~60 |

**Pendente pro veredito**: Gabriel confere a v2 e, se der, um Ministro percorre os nove roteiros sem explicação prévia. O ticket fecha com o veredito por tela.

11. **Chip Ministro (depois da v2)**: só deve aparecer pra quem tem a opção pré-definida no cadastro. Corrigido: Membro ganha o papel de Ministro no cadastro (Isa e Marcos nos dados de exemplo), o chip só aparece pra eles e o domínio recusa a marca pra quem não tem o papel. Glossário e `escala.md` ajustados.

Confirmado pelo Gabriel em 04/09/2026: depois da v2 o artefato passou a montar a tela no navegador. A causa do branco era o runtime do artefato bloquear HTML montado por string; a política padrão de Trusted Types resolveu. Fica como regra pra qualquer protótipo publicado como artefato.

## Answer

Resolvido em 05/09/2026. Veredito do Gabriel sobre a v2.1: "ficou bom". Protótipo em `prototype/fluxo-ministro` (commit f6dbf9d, `index.html` e `artifact.html`), publicado em https://claude.ai/code/artifact/4f70f368-76fa-4af4-be0a-0e59bb0bb623 pra mandar pro Ministro.

**Resposta à pergunta do ticket: sim, o fluxo central sai em menos toques que no WhatsApp em todas as nove tarefas**, e em duas delas faz o que o WhatsApp não faz (corrigir o domingo passado e sugerir Tom com histórico e cobertura). Onde o app ganha por muito, é porque tira digitação: montar o mês com a Banda num toque (7 contra ~200), texto pronto pro grupo (2 contra ~250), promover Sugestão (3 contra ~20). Onde ganha por pouco, é porque ainda digita: Trecho com minutagem (14 contra ~30), Medley (23 contra ~70, 18 toques são dígitos e foco em campo), Escala avulsa (26 contra ~60). A digitação de minutagem é o ponto fraco declarado e foi pra neblina.

**Veredito por tela**, a partir dos onze pontos do teste:

- **Mês**: aprovada depois de ganhar Escala avulsa e o lote com o primeiro domingo Santa Ceia às 08h.
- **Escala**: aprovada depois de ganhar edição de data e horário, marca de Santa Ceia, playlist do Repertório e observação por Item.
- **Equipe**: era a tela mais errada. Reescrita por naipe (Vocal decidido no mês, Músicos na semana, Som), com Ministro como marca só pra quem tem o papel no cadastro e a Formação "Banda" aplicável num toque.
- **Adicionar música e Tom**: aprovada depois do tom original da gravação como terceira fonte da sugestão.
- **Medley**: aprovada depois da capa em montagem e da observação.
- **Sugestões**: aprovada depois de data e apoio.
- **Texto pro WhatsApp**: aprovado depois de agrupar a Equipe por naipe e levar observação e playlist.

**Premissas desmentidas pelo protótipo**, já corrigidas no glossário, em `docs/dominio/escala.md` e com ponteiro em `premissas.md`: Ministro não é Função (é papel no cadastro e marca na Escala); a Equipe não é um-por-Função montada do zero (é vocal no mês, músicos na semana a partir de uma Formação); o preset do mês não é um só (Santa Ceia no primeiro domingo); Sugestão não é só link e observação (tem data e apoio).

**Gerado pra outros tickets**: pesquisas 19 (tom original, resolvida) e 20 (playlist, resolvida); decisão 21 (ler do Cifra Club ou só linkar); entradas nos tickets 05, 07, 08, 14, 15 e 16.

**Regra que fica**: protótipo publicado como artefato precisa registrar política padrão de Trusted Types, senão a tela fica em branco.
