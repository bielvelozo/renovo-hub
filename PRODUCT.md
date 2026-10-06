# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Voluntários do ministério de louvor Renovo Music, até 15 pessoas, em três papéis definidos em `CONTEXT.md`:

- **Membro**: vê tudo, sugere músicas, mantém o próprio perfil. Usa só o celular, para conferir se está escalado, em que Função, com quais músicas e em que Tom.
- **Ministro**: dirige o louvor numa Escala, monta a Equipe e escolhe o Repertório. É o **usuário principal**: quando dois usos conflitam numa decisão de tela, vence o Ministro montando a semana. Usa o celular e, às vezes, o computador para montar o mês e o Repertório.
- **Admin**: tudo que o Ministro faz mais a gestão de Membros, Funções, Formações, convites e catálogo. Também usa o computador para revisar o catálogo.

Cenas de uso, em ordem de peso confirmada:

1. Ministro durante a semana, item por item, com o histórico dizendo o que repete e em que Tom foi tocado.
2. Membro no celular, a qualquer hora, conferindo a escala e o que vai tocar.
3. Equipe no domingo, no palco, com o celular no pedestal: modo culto, sem internet e com pouca luz.

O aparelho de referência do dono do projeto é um Samsung S23 (360 px de largura). O computador só importa para montar e revisar; nenhuma tela do Membro precisa de layout de mesa.

## Product Purpose

App interno para montar Escalas, registrar o repertório tocado e lembrar o que já foi ensaiado, em que Tom e por quem. Substitui o grupo de WhatsApp como fonte da verdade do ministério.

Sucesso tem três faces, sem ordem entre elas:

- ninguém precisa perguntar no WhatsApp: escala, Tom e músicas estão no app;
- o repertório tem memória: músicas param de repetir sem querer e as antigas voltam;
- o domingo roda sem papel: letra e Tom no palco pelo modo culto.

## Positioning

Conforme os ADRs e o README do projeto:

- **A Execução é derivada do plano** (ADR 0001): o histórico de quem tocou o quê, em que Tom, nasce sozinho de cada Item quando a Escala vira Realizada. Ninguém confirma nada depois do culto. É o que faz o histórico existir sem cobrar trabalho de voluntário.
- **Sem senha e sem cadastro**: entra-se por link de convite, com sessão de um ano. Custo zero de hospedagem (Cloudflare Workers, D1, Web Push próprio).
- **A Sequência é o Word do ministério, lido como está**: linha colorida ou começada por `//` e `*` é marcador, negrito é destaque; nada é interpretado. O app não pede que ninguém reescreva a letra num formato novo.
- **Modo culto sem internet**, a partir do Pacote do culto baixado em segundo plano.

## Operating Context

- **Ritmo mensal**: o Ministro cria o mês de domingos de uma vez; o segundo domingo nasce Santa Ceia às 08h. Vocal e a marca de Ministro são decididos no mês.
- **Ritmo semanal**: os Músicos entram na semana, quase sempre aplicando uma Formação (conjunto reutilizável de instrumentistas) e ajustando. O Repertório é preenchido um Item por vez: Música inteira, Trecho com minutagem ou Medley, cada um com Tom e observação opcional do Ministro.
- **Adicionar música**: por link do YouTube ou Spotify, ou busca por nome pela YouTube Data API (100 buscas por dia; sem chave, o app pede o link). O Tom original pode vir do Cifra Club (ADR 0002). O alerta de repetição ("tocada há N dias", "também dia X") aparece só nesse momento.
- **Comunicação**: o app gera o texto do WhatsApp agrupado por Grupo de Funções (Vocal, Músicos, Som) e manda push: "você foi escalado", "música na sua Escala" (agrupada, no máximo um por hora por Escala), cancelamento ou remarcação, lembrete às 10h da véspera. Editar Escala Realizada nunca avisa ninguém.
- **Domingo**: o modo culto mostra a ordem dos Itens com o Tom em letra grande e a Sequência a um toque, lendo só do Pacote do culto. A Escala vira Realizada à meia-noite do dia, não no horário marcado.
- **Depois**: Escalas Realizadas continuam editáveis sem prazo, em silêncio; é a única forma de corrigir o histórico.
- **Instalação**: PWA. No iPhone, o push só funciona com o app na tela inicial; o botão de ativar fica desabilitado até lá, explicando o porquê.
- **Ferramentas ao redor**: WhatsApp (grupo do ministério), YouTube (referência de cada Música), Word (Sequências), Cifra Club (Tom original).

## Capabilities and Constraints

- Telas: Início, Mês, Escala (com Equipe, Adicionar, Medley e letra do Item), Músicas (catálogo com abas, Música, letra), Sugestões, Perfil, Admin (Painel, Membros, Convites, Funções, Formações, Músicas a revisar, Sequências) e, fora da casca, Entrar, Esqueci, Instalar, Não encontrada e o modo culto (Ordem, Letra do Item, Pesquisar, Letra da Música).
- Estados da Escala: Agendada, Realizada, Cancelada. Sem rascunho: toda Escala é visível a todos desde a criação.
- Música: Nova, Legado (importada da playlist, sem Execução), Arquivada (fora das buscas, presente no histórico). Tom pode ser `original`.
- Membro removido que já serviu vira inativo em vez de apagado, para não reescrever o histórico.
- Temas claro, escuro e "do sistema", escolhidos no Perfil; o modo culto segue o tema escolhido (desde 04/10/2026; antes era sempre escuro).
- PT-BR em toda a interface. Vocabulário e termos a evitar em `CONTEXT.md`: Membro (não usuário), Função (não instrumento), Equipe (não time), Repertório (não setlist), Execução (não play), Sugestão (não pedido nem voto), Tom (não key).
- Textos sem gênero deduzido pelo nome ("Isa · ministro"): não há campo de gênero em Membro. **Em aberto**: se um dia houver "ministra", precisa de campo novo ou regra, nunca dedução.
- Stack fixa: Vite + React + TypeScript no front, CSS próprio com tokens em `src/estilo/`, Hono no Worker, D1, Vitest no runtime dos Workers, `vaul` e Base UI como únicos primitivos de comportamento. Sem biblioteca visual.
- **Fora do escopo por decisão** (não puxar sem pedido): disponibilidade do Membro, etiquetas de ocasião.
- **Pendente de verificação**: push recebido em aparelho real (iPhone e Android); validação do visual neutro publicado no S23; teste do modo culto no S23.

## Brand Commitments

- Nome do produto: **Renovo Music**, o mesmo do ministério (decisão de 28/09/2026; até então o app se chamava Renovo Hub). A marca carregada é a do ministério, não a da igreja (decisão de 11/09/2026). O Worker, o banco e o endereço publicado continuam com `renovo-hub` no nome. O material da Igreja Missão Renovo em `docs/brand/` é referência histórica e não entra no app.
- Selo circular com anéis e onda sonora de cinco barras, geometria em `src/marca/selo.ts`, SVGs e PNGs do PWA em `public/`. O selo não muda.
- Decisão vinculante de 19/09/2026, aprovada pelo dono do projeto: cinzas neutros (fundo escuro `#0F0F10`, claro `#F4F4F2`), um acento só (o Índigo, em botão primário, link e aba ativa), **Geist como única família**, sem grão de papel. Não reintroduzir cartões coloridos, Fraunces nem alertas de repetição fora do fluxo de adicionar.
- Em 25/09/2026 o dono do projeto trocou a borda de 1 px dos cartões pela **elevação suave** (sombra difusa em repouso, mais funda em menu e folha) e manteve os componentes refinados e contidos. A regra está em `DESIGN.md` e entrou no código em 26/09/2026.
- Voz: PT-BR direto, texto que explica a tela em vez de identidade decorativa; cor só onde significa algo. Avisos ficam com o fato ("tocada há 12 dias"), sem frase de permissão ("pode adicionar mesmo assim").

## Evidence on Hand

- Catálogo real: 101 Músicas em `seed/playlist.csv`, importadas da playlist do ministério como Legado.
- Membros: `seed/membros.csv` começa só com o dono do projeto; os demais entram pela tela. Escalas de demonstração por `npm run db:seed -- --demo`.
- Marca: `public/selo.svg`, `public/selo-completo.svg`, `public/marca-horizontal.svg` e os PNGs do PWA. Logos da igreja em `docs/brand/logo/` e artes da conferência em `docs/brand/referencias/` (histórico, não usar). Fontes em `docs/brand/fontes/` servem só para gerar os SVGs.
- Pesquisa e decisões: auditoria de usabilidade com 115 achados (`docs/superpowers/specs/2026-09-10-auditoria-de-usabilidade.md`), specs de cada fatia do redesenho em `docs/superpowers/specs/`, ADRs em `docs/adr/`, glossário em `CONTEXT.md`, regras da Escala em `docs/dominio/escala.md`.
- App publicado em https://renovo-hub.renovo.workers.dev.
- **Não existem**: depoimentos, métricas de uso, fotos do ministério ou da equipe, materiais de divulgação. Nenhum deve ser inventado.

## Product Principles

1. **O Ministro montando a semana desempata.** Quando uma tela precisa escolher a quem servir, serve a quem monta.
2. **Automático com aviso, nunca confirmação exigida.** A Execução nasce do plano, a Escala vira Realizada sozinha, o alerta de repetição informa e não bloqueia. Passo extra para voluntário é atrito.
3. **Cor e destaque só onde significam algo.** O visual é neutro de propósito; o que chama atenção é o que importa naquele momento (Tom, Santa Ceia, cancelamento).
4. **O palco é escuro e a mão está ocupada.** O modo culto lê de longe, sem internet, com a ação principal ao alcance do polegar.
5. **Sem atrito de entrada.** Sem senha, sem cadastro, sem custo; o vocabulário é o do ministério, não o de software.

## Accessibility & Inclusion

Necessidade confirmada: **leitura no palco com pouca luz**. Tom e letra precisam ser lidos à distância de um pedestal, no escuro, com tipografia grande; o modo culto segue o tema escolhido no Perfil, para quem toca de manhã ou num salão claro poder ler no claro. Nenhuma outra necessidade específica foi estabelecida além de contraste e tamanho razoáveis nos dois temas.
