# Protótipo do fluxo central do Ministro

Type: prototype
Status: claimed
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
