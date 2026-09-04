# Push em PWA no iPhone: o que funciona de verdade

Pesquisa feita em 03/09/2026. Todas as datas de acesso abaixo são 03/09/2026, salvo indicação. Fontes marcadas **[secundária]** não são Apple/W3C/IETF/fornecedor oficial e valem só como pista; **[não verificada hoje]** indica afirmação de conhecimento prévio cuja fonte não foi aberta nesta rodada.

## Resumo executivo

1. Web Push em iPhone existe desde iOS/iPadOS 16.4 (março/2023) e **só funciona no web app adicionado à Tela de Início**; numa aba do Safari não há push no iOS.
2. A permissão só pode ser pedida em resposta a um toque do usuário (botão "Ativar notificações"), nunca no carregamento da página.
3. Desde iOS 16.4 navegadores de terceiros (Chrome, Firefox, etc.) podem oferecer "Adicionar à Tela de Início"; desde iOS 17 isso vale também pra navegadores embutidos em apps. Todos usam o motor WebKit fora da UE, então o comportamento é o do Safari.
4. A Apple exige `userVisibleOnly: true` e que **todo push mostre uma notificação**; push silencioso é proibido e, após 3 violações, a inscrição é revogada e o usuário precisa dar permissão de novo.
5. A entrega com o app fechado funciona: a notificação aparece na Tela Bloqueada, Central de Notificações e Apple Watch, e o ícone pode receber badge numérico (Badging API), desde que a permissão de notificação esteja concedida.
6. Desde iOS 18.4 existe Declarative Web Push: o servidor manda um JSON e o sistema mostra a notificação sem Service Worker, eliminando o risco de revogação por push silencioso.
7. O usuário gerencia a permissão em Ajustes > Notificações, com o web app listado como qualquer app. Se negar no prompt, só reativa por lá.
8. O que acontece com a inscrição ao apagar o ícone ou ficar semanas sem abrir **não está documentado em fonte primária**; o protocolo (RFC 8030) permite ao serviço de push descartar mensagens após o TTL e expirar inscrições (o servidor recebe 404/410).
9. Enviar é grátis nas três opções avaliadas: biblioteca `web-push` (VAPID direto contra Apple/Google/Mozilla, sem intermediário), Firebase Cloud Messaging (sem custo, mas não cita Safari explicitamente) e OneSignal Free (limite de 10.000 inscritos por envio).
10. Recomendação: `web-push` + VAPID rodando numa função serverless gratuita, com um cron gratuito pro lembrete de véspera. Nenhuma das opções exige servidor sempre ligado.

## Tabela pro time do ministério

| Promessa | Veredito | Por quê |
|---|---|---|
| "Você vai receber aviso no iPhone quando for escalado, mesmo com o app fechado" | **Dá pra prometer** | Web Push em web app instalado, iOS 16.4+ ([WebKit 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). |
| "Basta abrir o link no Safari" | **Não dá pra prometer** | Tem que adicionar à Tela de Início e tocar em "permitir" dentro do app instalado. |
| "Funciona se você usa Chrome no iPhone" | **Depende** | O Chrome no iOS pode oferecer "Adicionar à Tela de Início" (iOS 16.4+), mas o caminho mais testado é Safari > Compartilhar > Adicionar à Tela de Início. |
| "O ícone mostra um numerozinho com o que tem de novo" | **Dá pra prometer** (iOS 16.4+) | Badging API; exige permissão de notificação; o usuário pode desligar só o badge em Ajustes. |
| "Vai chegar lembrete na véspera do culto" | **Dá pra prometer, com cron** | Precisa de uma tarefa agendada no backend; o push em si não agenda. |
| "Se você apagou o ícone e instalou de novo, as notificações voltam sozinhas" | **Não dá pra prometer** | Sem fonte primária; assumir que precisa permitir de novo. |
| "Se você negou sem querer, é só tocar de novo no botão" | **Não dá pra prometer** | Depois de negar, só reativa em Ajustes > Notificações > (nome do app). |
| "Se ficar um mês sem abrir o app, os avisos continuam chegando" | **Depende** | Não documentado pela Apple; o protocolo permite ao serviço expirar a inscrição. Mitigar reenviando a inscrição a cada abertura. |
| "No Android é igual" | **Dá pra prometer e é mais fácil** | No Chrome/Android o push funciona até sem instalar; o Chrome oferece prompt de instalação. |
| "Push sem barulho, só pra atualizar o app por baixo" | **Não dá pra prometer** | Apple revoga a inscrição após 3 pushes sem notificação visível. |
| "iPhone antigo (iOS 15 ou menos)" | **Não dá pra prometer** | Sem Web Push antes do 16.4. |

## 1. Versão mínima, instalação obrigatória e navegadores

- Web Push chegou a Home Screen web apps em **iOS e iPadOS 16.4**, anúncio de 16/02/2023 ([WebKit, "Web Push for Web Apps on iOS and iPadOS"](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). O texto é explícito que o recurso é pra web apps adicionados à Tela de Início; o manifest precisa de `display: standalone` ou `fullscreen` pra se comportar como app.
- No mesmo post: "In iOS and iPadOS 16.4, third-party browsers can now offer their users the ability to add websites and web apps to the Home Screen from the Share menu". Ou seja, instalar pelo Chrome/Firefox/Edge no iOS é possível se o navegador implementou a opção (com entitlement da Apple). Fora da UE todos usam WebKit, então o app instalado é o mesmo independentemente do navegador de origem.
- iOS 17 ampliou: "Add to Home Screen is now available in Safari View Controller", cobrindo navegadores embutidos em apps ([WWDC23 10120, "What's new in web apps"](https://developer.apple.com/videos/play/wwdc2023/10120/)).
- **[não verificada hoje]** O Chrome para iOS passou a exibir "Adicionar à Tela de Início" em 2023; não abri a nota de release do Google nesta rodada. Recomendação prática: o onboarding do Renovo Hub deve orientar pelo Safari, que é o caminho garantido pela Apple.
- Declarative Web Push: disponível em "web apps saved to the home screen on iOS 18.4 and iPadOS 18.4 and later" e Safari 18.5 no macOS ([WebKit, "Meet Declarative Web Push"](https://webkit.org/blog/16535/meet-declarative-web-push/), 27/03/2025). Continua exigindo instalação no iOS.

## 2. Quando a permissão pode ser pedida

- "permission to receive push notifications as long as that request is in response to direct user interaction — such as tapping on a 'subscribe' button" ([WebKit 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- "requesting a push subscription requires an explicit user gesture" ([WebKit 12945, "Meet Web Push"](https://webkit.org/blog/12945/meet-web-push/), 07/06/2022) e "subscribing for push requires a user gesture" ([WWDC22 10098, "Meet Web Push for Safari"](https://developer.apple.com/videos/play/wwdc2022/10098/)).
- Como no iOS o Push só existe no web app instalado (item 1), na prática o pedido só faz sentido depois da instalação. Um `Notification.requestPermission()` disparado numa aba do Safari no iOS não vai habilitar push.
- Implicação de produto: o onboarding precisa ter duas telas distintas: (a) "adicione à Tela de Início" com instruções do Compartilhar; (b) já dentro do app instalado, um botão "Ativar notificações" que chama `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`.

## 3. Ciclo de vida da inscrição: apagar ícone, inatividade, negar e reativar

- **Apagar o ícone**: nenhuma das fontes primárias abertas ([WebKit 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [WWDC23 10120](https://developer.apple.com/videos/play/wwdc2023/10120/)) descreve o que acontece com a inscrição. O que está documentado: "Cookies and storage are separate after the web app is added", ou seja, o web app instalado tem armazenamento próprio, distinto do Safari (WWDC23). É razoável assumir que apagar o ícone descarta esse armazenamento e a inscrição, mas isso é inferência, não fonte. O backend deve tratar respostas 404/410 do endpoint da Apple como "inscrição morta" e apagá-la.
- **Semanas sem abrir**: a Apple não publica prazo de validade. Pela [RFC 8030 §5.2](https://www.rfc-editor.org/rfc/rfc8030.html) o serviço de push guarda a mensagem só pelo TTL que o servidor pediu (podendo reduzi-lo) e, pela §7.3, pode expirar a inscrição, respondendo 404 ao servidor. A spec do Push API prevê `expirationTime` e o evento `pushsubscriptionchange` pra o Service Worker reinscrever ([W3C Push API](https://w3c.github.io/push-api/)). Mitigação: a cada abertura do app, ler `pushManager.getSubscription()` e reenviar ao backend; implementar `pushsubscriptionchange`.
- **Push silencioso**: "after three push events where you fail to post a notification in a timely manner, your site's push subscription will be revoked. You will need to go through the permission workflow again" ([WWDC22 10098](https://developer.apple.com/videos/play/wwdc2022/10098/); dito sobre o beta do macOS Ventura, mas a regra de revogação é reafirmada em [WebKit 12945](https://webkit.org/blog/12945/meet-web-push/) e em [WebKit 16535](https://webkit.org/blog/16535/meet-declarative-web-push/)).
- **Negar e reativar**: os usuários podem "manage those permissions per web app in Notifications Settings — just like any other app" ([WebKit 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). Ou seja, Ajustes > Notificações > (nome do web app). Depois de "Não permitir" no prompt, o app não consegue pedir de novo; a tela de onboarding deve detectar `Notification.permission === 'denied'` e mostrar o passo a passo pra Ajustes.

## 4. Badging API no iOS

- "Home Screen web apps on iOS and iPadOS 16.4 now support the Badging API"; `setAppBadge`/`clearAppBadge` funcionam com o app em primeiro plano ou durante o tratamento de um evento `push` ([WebKit 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- "the badge will only appear if the user has granted notifications permission"; o usuário pode manter as notificações e desligar só o badge em Ajustes, e "we never expose this user preference to the web app" ([WebKit 14112, "Badging for Home Screen Web Apps"](https://webkit.org/blog/14112/badging-for-home-screen-web-apps/), 25/04/2023).
- "When users allow a web app to send notifications, that includes permissions for the web app to use badging" ([WWDC23 10120](https://developer.apple.com/videos/play/wwdc2023/10120/)).
- Em Declarative Web Push, o JSON aceita o campo `"app_badge"` pra atualizar o badge sem Service Worker ([WebKit 16535](https://webkit.org/blog/16535/meet-declarative-web-push/)).
- Pra premissa "sugestão nova vira badge na aba, sem push": badge **na aba interna** do app é UI própria, sem relação com a API. Badge **no ícone** da Tela de Início com o app fechado só via push (ou Declarative Web Push com `app_badge`), e sempre acompanhado de notificação visível.

## 5. Entrega com o app fechado, `userVisibleOnly` e push silencioso

- Notificações "show on the Lock Screen, in Notification Center, and on a paired Apple Watch" e respeitam modos de Foco ([WebKit 13878](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). Som ligado por padrão no iOS, desligado no macOS; controlável com `silent: true/false` na Notification API ([WWDC23 10120](https://developer.apple.com/videos/play/wwdc2023/10120/)).
- "It also requires you set the `userVisibleOnly` flag to true, and fulfill that promise by always showing a notification in response to a push message" e "Violations of the `userVisibleOnly` promise will result in a push subscription being revoked" ([WebKit 12945](https://webkit.org/blog/12945/meet-web-push/)). Na spec W3C o `userVisibleOnly` é opcional e o user agent "SHOULD enforce it" ([W3C Push API](https://w3c.github.io/push-api/)); a Apple escolheu exigir.
- "Handling a push event is not an invitation for your JavaScript to get silent background runtime" ([WWDC22 10098](https://developer.apple.com/videos/play/wwdc2022/10098/)). Portanto: não usar push pra sincronizar dados em silêncio; toda mensagem do Renovo Hub deve ser algo que o Membro quer ver ("você foi escalado", "música alterada", "lembrete de amanhã").
- Declarative Web Push (iOS 18.4+): o servidor manda JSON com `title`, `body`, `navigate`, etc.; o sistema exibe a notificação sem acordar o Service Worker, e "removes the silent push violation concern". Tem caminho de compatibilidade: navegadores sem suporte tratam o mesmo JSON no Service Worker ([WebKit 16535](https://webkit.org/blog/16535/meet-declarative-web-push/)). Vale adotar o formato declarativo desde o v1.
- Endpoints: "make sure you allow URLs from any subdomain of push.apple.com" ([WWDC22 10098](https://developer.apple.com/videos/play/wwdc2022/10098/)). Apple usa VAPID "the same as other browsers".
- Protocolo comum a todos (Apple, Google, Mozilla): [RFC 8030](https://www.rfc-editor.org/rfc/rfc8030.html) define `TTL` (segundos de retenção no serviço; §5.2), `Urgency` (very-low/low/normal/high; §5.3) e `Topic` (até 32 chars; mensagem nova substitui a pendente de mesmo tópico; §5.4). Pra lembrete de véspera, usar `Topic` por Escala evita duplicatas se o cron rodar duas vezes.

## 6. Diferenças pro Android/Chrome

- Fonte primária comum: a [spec Push API](https://w3c.github.io/push-api/) não exige instalação; no Chrome/Android e desktop o push funciona numa aba comum, com a permissão pedida por gesto do usuário (política do Chrome). **[não verificada hoje]** A página do Chrome sobre installability ([developer.chrome.com/docs/web-platform/installable-web-apps](https://developer.chrome.com/docs/web-platform/installable-web-apps)) retornou 404 nesta rodada; o evento `beforeinstallprompt` e o prompt automático de instalação são conhecimento prévio, não conferidos hoje.
- Consequência prática: no Android o fluxo pode ser "abrir o link > permitir notificações", com instalação opcional; no iOS a instalação é obrigatória antes de qualquer coisa.
- Confiabilidade: **[não verificada hoje]** fabricantes Android com otimização agressiva de bateria (Xiaomi, Huawei, Samsung em alguns modos) atrasam ou descartam push do Chrome; não há fonte oficial única. Como o time é maioria iPhone, o risco relevante é o do iOS (revogação por silêncio e expiração não documentada).
- FCM e OneSignal cobrem Chrome/Android sem ressalva; a `web-push` também ([README](https://github.com/web-push-libs/web-push): Chrome 42+, Firefox 44+, Edge 17+, Safari 16+).

## 7. União Europeia (registro, irrelevante pro Brasil)

- No beta do iOS 17.4 a Apple removeu Home Screen web apps na UE (PWAs passaram a abrir no Safari), registrado no bug [WebKit 268643](https://bugs.webkit.org/show_bug.cgi?id=268643); depois voltou atrás e manteve os web apps na UE, ainda sobre WebKit ([9to5mac, 15/02/2024](https://9to5mac.com/2024/02/15/ios-17-4-web-apps-european-union/) **[secundária]**). A página oficial [developer.apple.com/support/dma-and-apps-in-the-eu](https://developer.apple.com/support/dma-and-apps-in-the-eu/) hoje trata de motores de navegador alternativos, não de web apps na Tela de Início. Não afeta o Brasil.

## 8. Como enviar Web Push de graça

### 8.1 `web-push` (npm) com VAPID direto

- Biblioteca Node que implementa criptografia [RFC 8291](https://www.rfc-editor.org/rfc/rfc8291.html) e VAPID ([RFC 8292](https://www.rfc-editor.org/rfc/rfc8292.html)); `generateVAPIDKeys()` gera o par uma vez ("create these keys once, store them and use them for all future messages"); `sendNotification(subscription, payload, { TTL, urgency, topic, headers })`, TTL padrão de 4 semanas ([README](https://github.com/web-push-libs/web-push)). Versão atual 3.6.7, licença MPL-2.0, Node >= 16 ([npm registry](https://registry.npmjs.org/web-push/latest)).
- Backend: precisa de código rodando **no momento do envio** (uma função serverless serve; não precisa de servidor sempre ligado), a chave privada VAPID guardada como segredo, e uma tabela de inscrições (endpoint + chaves `p256dh`/`auth`) por dispositivo. Sem limite mensal: fala direto com `web.push.apple.com`, `fcm.googleapis.com` e `updates.push.services.mozilla.com`, todos gratuitos pelo protocolo aberto.
- Agendamento: não tem. O lembrete de véspera exige um cron externo que chame a função no horário. Opções gratuitas: agendador do próprio backend (ex.: Supabase `pg_cron` + Edge Function, Vercel Cron, Cloudflare Cron Triggers) ou GitHub Actions `schedule`. **[não verificada hoje]** Limites de cron dos planos gratuitos desses provedores não foram abertos nesta rodada; conferir antes de travar a stack.
- Nota de runtime: `web-push` usa `crypto` do Node; em runtime Edge/Workers (sem Node completo) é preciso uma lib compatível com WebCrypto. **[não verificada hoje]** Supabase Edge Functions (Deno) aceitam `npm:web-push`; confirmar num protótipo.

### 8.2 Firebase Cloud Messaging for Web

- Custo: "Cloud Messaging (FCM) — No-cost" em todos os planos ([Firebase Pricing](https://firebase.google.com/pricing)).
- Suporte: o SDK JS funciona em "browsers that support the Push API"; a página **não cita Safari nem web apps iOS nominalmente** e exige `firebase-messaging-sw.js` na raiz, HTTPS e chave VAPID gerada no console ([FCM JS client](https://firebase.google.com/docs/cloud-messaging/js/client)). Safari 16+ implementa Push API com VAPID, então em tese funciona, mas fica sem garantia oficial e adiciona SDK + projeto Google no cliente.
- Backend: o envio via FCM HTTP v1 exige credencial de service account (chave privada Google) e código rodando no momento do envio; agendamento nativo não existe (precisa de Cloud Scheduler + Functions, que no plano Spark não estão disponíveis; Functions exige Blaze).
- Avaliação: pra 15 pessoas o FCM não traz nada que a `web-push` não traga, e acrescenta dependência do Google e incerteza sobre Safari.

### 8.3 OneSignal Free

- Plano Free ([OneSignal Pricing](https://onesignal.com/pricing)): web push com "Max 10,000 subscribers per send", envio via API ilimitado, entrega por fuso horário, 3 journeys ativas, 6 segmentos, 6 tags, histórico de 30 dias. A página lista como **não incluídos** no Free: intelligent delivery, time-delayed sends e retargeting.
- Backend: mínimo; o envio é uma chamada REST com App ID + REST API key (segredo). SDK JS deles no cliente. Agendamento: a API tem `send_after` **[não verificada hoje]**; a página de preços sugere que "time-delayed sends" fica fora do Free, então o lembrete de véspera pode precisar de cron do nosso lado mesmo assim.
- Suporte a Safari/iOS web app: **[não verificada hoje]** OneSignal documenta suporte a Safari web push; não abri a doc nesta rodada.
- Avaliação: resolve dashboard e histórico de graça, mas cria dependência de terceiro com termos que mudam e um SDK a mais no PWA.

### Outros com tier grátis

Não pesquisados nesta rodada (limite de buscas). Candidatos conhecidos **[não verificados hoje]**: Pushpad, PushAlert, Novu (open source, self-host). Pra 15 usuários nenhum deles justifica o custo de avaliação frente à `web-push`.

## Recomendação de envio pra backend de custo zero

**Usar `web-push` com VAPID próprio, disparada por função serverless gratuita, com cron gratuito pro lembrete de véspera. Payload no formato de Declarative Web Push desde o v1.**

Motivos:
- Protocolo aberto, zero intermediário, zero limite mensal, funciona igual com Apple, Google e Mozilla ([README web-push](https://github.com/web-push-libs/web-push); [WWDC22 10098](https://developer.apple.com/videos/play/wwdc2022/10098/) confirma VAPID na Apple).
- Não exige servidor ligado: a função sobe no evento ("Ministro salvou Escala") ou no cron ("véspera 18h").
- O formato declarativo é lido nativamente pelo iOS 18.4+ e cai no Service Worker nos demais ([WebKit 16535](https://webkit.org/blog/16535/meet-declarative-web-push/)), e o `Topic` do RFC 8030 dedupe lembretes.
- Se o push de PWA decepcionar e o app virar Capacitor (premissa), o mesmo backend de inscrições continua servindo, trocando só o transporte.

Riscos:
1. Revogação por push silencioso: qualquer bug em que o `push` handler não chame `showNotification` derruba a inscrição após 3 vezes. Mitigar com Declarative Web Push e teste automatizado do Service Worker.
2. Expiração não documentada da inscrição no iOS: reenviar a inscrição ao backend em cada abertura; tratar 404/410 apagando o registro; escutar `pushsubscriptionchange`.
3. Onboarding no iPhone tem 2 passos manuais (instalar, permitir) e o "negar" só reverte em Ajustes; prever tela de recuperação.
4. Chave privada VAPID: se vazar, qualquer um manda push pro time; guardar como segredo do provedor, nunca no repositório. Trocar a chave invalida todas as inscrições (todos precisam reinscrever).
5. Limites de cron do plano gratuito do provedor escolhido ainda não confirmados; se o cron diário não for possível de graça, alternativa é GitHub Actions `schedule` chamando a função.
6. Runtime: `web-push` depende de Node `crypto`; em Deno/Edge validar num protótipo antes de travar a stack.

## O que NÃO consegui confirmar em fonte primária

- O que acontece com a inscrição push quando o usuário apaga o ícone do web app no iOS (nenhuma menção na Apple/WebKit).
- Prazo de expiração ou TTL máximo do serviço `web.push.apple.com` (a Apple não publica).
- Se o limite de "3 pushes silenciosos" anunciado no beta do macOS Ventura (WWDC22) é exatamente o mesmo número no iOS atual; a Apple só reafirma que "revoga".
- A página [developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) não pôde ser lida (renderização por JavaScript); limites de payload e headers aceitos pela Apple ficaram sem conferência direta.
- Chrome para iOS oferecer "Adicionar à Tela de Início" (fonte do Google não aberta).
- Critérios de instalação e `beforeinstallprompt` no Chrome/Android (página do Chrome retornou 404).
- FCM suportar oficialmente Safari/iOS web app (a doc só diz "browsers that support the Push API").
- OneSignal: suporte a Safari web push e se `send_after` (agendamento por API) está no Free.
- Limites de cron dos planos gratuitos (Supabase, Vercel, Cloudflare, GitHub Actions) e compatibilidade de `web-push` com Deno/Edge.
