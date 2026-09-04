# Push em PWA no iPhone: o que funciona de verdade

Type: research
Status: resolved
Findings: branch research/push-pwa-ios, arquivo docs/research/push-pwa-ios.md
Blocked by: 
Map: ../map.md

## Question

Quais são os limites reais de Web Push em PWA instalado no iOS em 2026, segundo fontes primárias (WebKit blog, docs da Apple, spec Web Push/VAPID)? Cobrir: versão mínima e instalação obrigatória (Safari e Chrome no iOS), quando a permissão pode ser pedida, o que acontece com a inscrição quando o ícone é apagado ou o app fica semanas sem abrir, badge no ícone, entrega com app fechado, e diferenças pro Android. Levantar também quais serviços/bibliotecas enviam Web Push de graça (web-push com VAPID direto, FCM for Web, OneSignal free tier) e o que cada um exige do backend. Entregar uma tabela "dá pra prometer / não dá pra prometer" pro time e uma recomendação de mecanismo de envio pra "Travar a stack do v1".

## Answer

Resolvido em 03/09/2026 por subagente de pesquisa. Detalhe completo, com fontes primárias (WebKit, Apple, IETF, W3C) datadas, em `docs/research/push-pwa-ios.md` na branch `research/push-pwa-ios` (commit 772e8e5).

- Web Push no iPhone existe desde o iOS 16.4 e **só no web app adicionado à Tela de Início**; aba do Safari não recebe push.
- Permissão só pode ser pedida por gesto do usuário e, na prática, só dentro do app instalado. O onboarding tem dois passos separados: instalar, depois permitir.
- Instalar por Chrome/Firefox no iOS é permitido desde 16.4; todos rodam WebKit. Orientar pelo Safari como caminho garantido.
- A Apple exige notificação visível em todo push (`userVisibleOnly: true`); após 3 pushes silenciosos a inscrição é revogada. Nada de push "por baixo" pra sincronizar dados.
- Entrega com app fechado funciona (Tela Bloqueada, Central de Notificações, Apple Watch). Badging API funciona no iOS 16.4+, só com permissão concedida.
- **Declarative Web Push** (iOS 18.4+): servidor manda JSON e o sistema exibe sem Service Worker, eliminando o risco de revogação por bug no SW. Adotar o formato desde o v1, com fallback pro SW.
- Negar permissão só reverte em Ajustes > Notificações > (web app). Efeito de apagar o ícone ou ficar semanas sem abrir **não é documentado pela Apple**; mitigar reenviando a inscrição a cada abertura e ouvindo `pushsubscriptionchange`.
- Android/Chrome: push funciona até sem instalar. UE: irrelevante pro Brasil.
- Envio: biblioteca `web-push` com VAPID direto contra Apple/Google/Mozilla é grátis, sem limite e sem intermediário; roda em função serverless e precisa só de um cron externo pro lembrete de véspera. FCM não cita Safari e agendamento exige plano pago; OneSignal Free exclui envio agendado.
- **Recomendação**: `web-push` + VAPID em função serverless gratuita + cron gratuito, payload declarativo. Isso conversa direto com o risco dos 10 ms de CPU da Cloudflare apontado em "Stack de custo zero".
- Não confirmado em fonte primária: efeito de apagar o ícone, TTL máximo da Apple, FCM em Safari, comportamento de "Adicionar à Tela" no Chrome iOS.
