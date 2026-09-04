# Renovo Hub: mapa do v1

Label: wayfinder:map

## Destination

Spec de v1 do Renovo Hub pronta pra virar plano de implementação: glossário (CONTEXT.md), modelo de domínio com estados e regras, decisões de acesso, notificação e stack travadas, e o fluxo central (Equipe do mês, Repertório ao longo da semana, notificação, visão do músico) validado com protótipo clicável na mão de pelo menos um Ministro. Construir o app fica fora deste mapa.

## Notes

- Domínio: ministério de louvor Renovo Music (Igreja Missão Renovo). Vocabulário em [CONTEXT.md](../../CONTEXT.md); decisões de partida em [premissas.md](./premissas.md). Toda sessão lê os dois antes de escolher ticket.
- Skills: tickets `grilling` usam `/grilling` + `/domain-modeling` (atualizar CONTEXT.md inline, ADR só quando difícil de reverter). Tickets `prototype` usam `/prototype` (branch `prototype/<slug>`, fora da main). Tickets `research` usam `/research` em subagente, achados em `docs/research/<slug>.md` numa branch `research/<slug>` criada via `git worktree`.
- Preferências fixas: menor custo possível (zero se der); PWA primeiro, código empacotável com Capacitor; o app tem que notificar; sem senha; UX que não pode ser mais difícil que o WhatsApp; tema escuro e claro; PT-BR. Sem comentários no código salvo o não óbvio.
- Quem dirige o mapa: Gabriel (guitarrista, Admin). Ministro testador do protótipo a definir em "Cadastro inicial: Membros, Funções, Ministros e o Ministro testador".
- Tracker: markdown local, ver [docs/agents/issue-tracker.md](../../docs/agents/issue-tracker.md). Frontier = tickets `open`, sem `Blocked by` pendente, menor número primeiro.

## Decisions so far

<!-- uma linha por ticket resolvido: [título](issues/NN-slug.md) e gist -->

- [Importar a playlist do YouTube: API, cota e o que vem de cada vídeo](issues/02-importacao-playlist-youtube.md): 101 vídeos únicos; importar uma vez via Data API v3 (precisa de chave, 3 unidades de cota), revisão humana obrigatória porque os títulos não têm padrão; oEmbed pra enriquecer link colado; thumbnail derivada do videoId; Spotify sem minutagem.
- [Stack de custo zero pra um PWA com push, arquivos e acesso por link](issues/03-stack-custo-zero.md): Cloudflare Workers + D1 + KV + Cron é a única stack zero sem cartão e sem pausa, com o risco dos 10 ms de CPU por invocação no envio de push (fan-out obrigatório); Supabase Free pausa após 1 semana; Firebase Spark não serve; front Vite+React ou SvelteKit estático, Next.js export perde o PWA oficial.
- [Push em PWA no iPhone: o que funciona de verdade](issues/01-push-pwa-ios.md): funciona desde iOS 16.4 só com o app na Tela de Início e permissão pedida por gesto; toda notificação tem que ser visível (3 silenciosas revogam a inscrição); Declarative Web Push (iOS 18.4+) elimina o risco do Service Worker; enviar com `web-push` + VAPID em função serverless e cron, sem intermediário.
- [Coletar assets da marca (logo, cores, fonte) da Missão Renovo](issues/04-assets-de-marca.md): não existe paleta nem guia oficial, mas a conferência Alto & Sublime Lugar estreou uma identidade nova da igreja e é ela que o app herda; artes em alta e cores medidas em docs/brand/; conceito é a árvore de Isaías 11:1-2; Kodchasan e Inter livres do Google Fonts, display dos títulos não identificada; nenhum laranja único passa contraste nos dois temas, então o acento é um par; logo em alta ainda não existe.

## Not yet specified

<!-- see "Fog of war" -->

- **Fonte display própria do Renovo Hub**: a serifada anos 70 das artes da conferência não foi identificada e pode ser paga. Se "Identidade visual" decidir que o app precisa de voz de display, vira busca por uma alternativa livre.
- **Editor estruturado de Sequência**: substituir o Word por blocos de letra ordenados com repetições e destaque do gancho, e a visão unificada do Medley usar isso. Depende de ver como o anexo é usado na v1.
- **Sugestão automática de músicas pra Escala** ("faz 4 meses que não tocamos X e a Equipe toda já sabe"). Só depois de ver o Ministro usando a lista ordenada.
- **Achievements leves** em cima do streak e das Execuções, sem competição. Depois da v1 rodar.
- **Indisponibilidade de Membros** no planejamento mensal da Equipe. Depende de ver como a tela de mês é usada.
- **Troca da gravação de referência** de uma Música e o que acontece com Trechos e minutagens antigas.
- **Metadados via Spotify** (busca, capa) além do link colado.
- **Re-sincronizar com a playlist do YouTube** depois do import único (RSS detecta os 15 mais novos e poderia virar Sugestão automática). Depende de ver se o Ministro continua alimentando a playlist depois do app existir.
- **Escala cancelada ou adiada**: hoje só "data passou = Realizada". Vira ticket assim que "Estados da Escala e regras da Execução" resolver.

## Out of scope

- **Publicar app nativo via Capacitor / App Store** (Unlisted Distribution, TestFlight, US$ 99/ano, Mac ou build na nuvem). PWA primeiro foi a decisão; volta como esforço novo só se o push de PWA falhar na prática.
- **Canal pago de notificação** (WhatsApp Business API, SMS). Fallback é o texto colado no WhatsApp.
- **Importar histórico de Tons e datas**: não existe registro, só a playlist.
- **Substituir o WhatsApp como canal de conversa** do grupo.
- **Editor de cifras/arranjo**: é app de cifra, não este.
