# Stack de custo zero pra um PWA com push, arquivos e acesso por link

Type: research
Status: claimed
Findings: branch research/stack-custo-zero, arquivo docs/research/stack-custo-zero.md
Blocked by: 
Map: ../map.md

## Question

Comparar, com base em docs e páginas de preço oficiais, as combinações viáveis de custo zero pra: hospedar um PWA (service worker, manifest, instalação no iOS), backend com banco relacional pequeno (15 usuários), envio de Web Push agendado (lembrete na véspera exige cron/job), armazenamento de arquivos Word/PDF pequenos (Sequências), e autenticação customizada por link de convite (sem e-mail, sem senha, sessão longa por dispositivo). Candidatos mínimos: Supabase, Firebase, Cloudflare (Pages/Workers/D1/R2/Cron Triggers), Vercel + Neon. Pro framework, avaliar Vite+React SPA, Next.js (export estático) e SvelteKit sob dois critérios: qualidade da experiência PWA e compatibilidade com empacotamento futuro via Capacitor (que exige build estático). Não escolher por familiaridade do dev. Entregar tabela de limites do free tier e uma recomendação com riscos.
