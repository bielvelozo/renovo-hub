# Stack de custo zero pra um PWA com push, arquivos e acesso por link

Type: research
Status: resolved
Findings: branch research/stack-custo-zero, arquivo docs/research/stack-custo-zero.md
Blocked by: 
Map: ../map.md

## Question

Comparar, com base em docs e páginas de preço oficiais, as combinações viáveis de custo zero pra: hospedar um PWA (service worker, manifest, instalação no iOS), backend com banco relacional pequeno (15 usuários), envio de Web Push agendado (lembrete na véspera exige cron/job), armazenamento de arquivos Word/PDF pequenos (Sequências), e autenticação customizada por link de convite (sem e-mail, sem senha, sessão longa por dispositivo). Candidatos mínimos: Supabase, Firebase, Cloudflare (Pages/Workers/D1/R2/Cron Triggers), Vercel + Neon. Pro framework, avaliar Vite+React SPA, Next.js (export estático) e SvelteKit sob dois critérios: qualidade da experiência PWA e compatibilidade com empacotamento futuro via Capacitor (que exige build estático). Não escolher por familiaridade do dev. Entregar tabela de limites do free tier e uma recomendação com riscos.

## Answer

Resolvido em 03/09/2026 por subagente de pesquisa. Detalhe completo, com tabelas de free tier e fontes datadas, em `docs/research/stack-custo-zero.md` na branch `research/stack-custo-zero` (commit 5186193).

- **Cloudflare Workers Free** é a única combinação que cobre tudo a custo zero, sem cartão e sem pausa por inatividade: assets estáticos ilimitados, D1 (SQLite, 500 MB por banco, 100 mil escritas por dia), KV pra arquivos (25 MiB por valor, 1 GB), Cron Triggers a cada minuto (5 por conta), Queues. R2 exige cartão (fonte só da comunidade).
- Risco central da Cloudflare: **10 ms de CPU por invocação**, inclusive no cron. Enviar N pushes (criptografia ECDH + AES-GCM + assinatura VAPID) numa invocação pode estourar; o desenho precisa de fan-out (Queues ou uma invocação por destinatário) desde o início. É o primeiro spike a fazer se a stack for essa.
- **Supabase Free** tem o backend mais rico (Postgres, Storage 1 GB, Edge Functions, pg_cron, anonymous sign-in com RLS), mas **pausa o projeto após 1 semana sem atividade**, o que mata o lembrete agendado em silêncio. Só 2 projetos ativos por conta.
- **Firebase Spark** não roda Functions nem Storage (Storage exige Blaze desde fevereiro de 2026). Blaze é zero dentro das cotas, mas exige conta de faturamento. Firestore não é relacional. Descartado.
- **Vercel Hobby + Neon**: custo zero e uso não comercial permitido, mas cron 1 vez por dia com precisão de até 59 minutos e Neon dorme. Viável como plano C.
- **Netlify Free** tem teto de créditos que pausa o site; **Fly.io** não tem free tier. Descartados.
- Web Push no iOS é VAPID padrão, então qualquer backend serve; a diferença está no cron e no CPU.
- Auth por convite não existe pronto em nenhum provedor: token próprio virando JWT longo por dispositivo funciona em todos; no Supabase, anonymous sign-in com vínculo ganha RLS de graça.
- Frameworks: **Vite+React SPA** e **SvelteKit adapter-static em modo SPA** empatam como melhores pra PWA (vite-plugin-pwa/Workbox) e pra Capacitor (webDir estático). Next.js export funciona, mas o guia PWA oficial depende de Server Actions, que o export não suporta. Astro não é pra app com estado.
- Recomendação: **Stack A** = Cloudflare Workers + D1 + KV + Cron Triggers, front Vite+React ou SvelteKit. Plano B: Supabase com keep-alive externo. Plano C: Vercel + Neon aceitando cron impreciso. Com 50 pessoas nenhuma cota estoura.
- Não confirmado em fonte primária: cartão no Supabase Free, cartão do R2, se pg_cron conta como atividade contra a pausa, medição real de CPU por push no Workers, entre outros listados no doc.
