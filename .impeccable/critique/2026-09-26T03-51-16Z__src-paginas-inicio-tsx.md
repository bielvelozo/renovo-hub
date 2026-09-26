---
target: src/inicio
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\gabri\\development\\renovo-hub\\src\\paginas\\Inicio.tsx"
target_fingerprint: "sha256:a568ef1301b1d8a3e786a3d6b3af838f9ea56a24d2830d3ec43b43b6929816ca"
target_path: "C:\\Users\\gabri\\development\\renovo-hub\\src\\paginas\\Inicio.tsx"
timestamp: 2026-09-26T03-51-16Z
slug: src-paginas-inicio-tsx
---
Method: dual-agent (A: subagente de revisão de design · B: subagente de detector e navegador)

# Crítica: Início (`src/paginas/Inicio.tsx`), segunda rodada

## Design Health Score

| # | Heurística | Nota | Achado-chave |
|---|---|---|---|
| 1 | Visibilidade do estado | 3 | Esqueleto fiel (osso do h1 e dos h2), "visto às" quando o dado envelhece, selo "mudou". Falha de rede com cache continua silenciosa (`usarBusca.ts:37`); o título encolhido diz "Oi, Gabriel" enquanto o h1 diz a data. |
| 2 | Correspondência com o mundo real | 3 | "Sua função: Guitarra", "falta 1 bateria", "em 2 dias", "no histórico". O h1 "Seg, 28 de set" traz duas abreviações e não diz "Hoje" no dia do culto. "Ouvir tudo" abre uma folha cujo botão é "Abrir no YouTube". |
| 3 | Controle e liberdade | 3 | Fechar o pós-culto tem Desfazer; erro tem "Tentar de novo"; capas abrem em nova aba. "Criar as escalas de outubro" cria um mês visível a todos num toque, sem aviso nem desfazer. |
| 4 | Consistência e padrões | 3 | Atalho do modo culto idêntico ao da Escala, `.dia` igual ao do Mês, tokens em tudo. Compressão ao toque 0.98 no atalho contra 0.97 nos botões; `Cartao className="pagina pos-culto"` reaproveita a classe de página. |
| 5 | Prevenção de erros | 3 | Pendência leva ao lugar exato; nomes acessíveis "Abrir escala de seg, 28 de set" e "Mês: todas as escalas"; X do pós-culto com 44 px e desfazer. Criação do mês sem reforço. |
| 6 | Reconhecimento em vez de memória | 3 | Função, Ministro, Tom, observação, Trecho e "mudou" à vista. A Equipe são seis letras ("quem é P?"); ao rolar, a data some da faixa. |
| 7 | Flexibilidade e eficiência | 3 | Pendência → tela certa com a Função em foco; "Criar as escalas" direto do vazio. Falta "Adicionar música" quando o Repertório já tem Itens: a tarefa mais repetida do Ministro exige Abrir escala → adicionar. |
| 8 | Estética e minimalismo | 3 | A 360 px é limpo: um primário (8,6:1), sombra suave no lugar da borda, sem enfeite. Na mesa o Tom fica a ~620 px do título; o Medley ocupa 221 px sempre aberto. |
| 9 | Recuperação de erros | 2 | `ErroDeCarga` com `role="alert"` e "Tentar de novo"; erro de ação inline. Mas toda falha fora da API vira "Algo deu errado por aqui" (`cliente.ts:74-77`): não distingue offline de servidor. |
| 10 | Ajuda e documentação | 2 | Sem ajuda; o microtexto faz o papel ("Quando o Ministro montar o mês, a sua aparece aqui.", "letras e tons, sem internet"). Bom, sem sistema. |
| **Total** | | **28/40** | **Bom** |

## Veredito de especificidade

**Avaliação de design.** Feita para este produto no conteúdo e nas decisões; genérica no esqueleto. O que é do Renovo Hub: o Tom como coluna da direita da linha (17 px/700, rótulo "TOM", `aria-label="Tom D"`), inclusive nos Trechos do Medley; o cartão de fatos "Sua função / Ministro / Equipe"; pendências que dizem o que falta com o vocabulário do ministério e levam ao lugar exato da correção; o pós-culto que transforma o ADR 0001 em frase ("O histórico já foi salvo"); o atalho do modo culto no dia. O esqueleto (saudação, cartão com CTA, lista com miniaturas, lista de atenção, cinco abas) qualquer app de escalas usaria. O visual é neutro por decisão, então o caráter vem do conteúdo, e agora o Tom é a única assinatura de forma. Oportunidades: o h1 nunca diz "Hoje"; a pilha de iniciais é idioma de app de time; no domingo o atalho é mais brando que o primário dos outros dias.

**Varredura determinística.** CLI limpa em `src/paginas/Inicio.tsx`, `src/inicio`, `src/casca`, `src/componentes` (0 achados, exit 0) e no escopo layout. Escopo type: 3 consultivos em `componentes.css`, nenhum na tela ou por causa dela (`.botao.icone` 20px, contagem do segmento do Catálogo 11px, `.inicial.mini` 11px). Os 22 avisos "13px fora da rampa" da rodada anterior sumiram com o papel Dense no DESIGN.md. Nota do detector: o `.dia` está a 11px enquanto o DESIGN.md chama o mês do bloco de Label (12px).

**Overlays.** Injeção funcionou na aba "Renovo Hub [Human]": 2 ocorrências, `clipped-overflow-container` em `.casca` (`base.css:99`, o mesmo provável falso positivo da rodada anterior: a faixa sticky e a contagem da aba são os filhos posicionados) e `overused-font` (Geist em 100% do texto, que é a Regra da Família Única). Um `dark-glow #ffba00` só apareceu depois de o overlay do próprio detector ser desenhado: autodetecção. Servidor auxiliar parado; abas fechadas.

Onde A e B concordam: nenhum par de texto abaixo de AA (mínimos 5,57:1 no claro e 5,85:1 no escuro), sem rolagem horizontal a 360 e 1280, anel de foco visível nos 18 alvos (inclusive dentro das listas em cartão, com offset -3 px), sem erro de console, sem resposta ≥ 400, Geist carregada nos quatro pesos, headings em ordem (h1 → h2 → h3 → h2 → h2). Onde B mede o que A não vê: "Ouvir tudo" e "Mês" continuam com 36 px visuais, mas a área de toque estendida responde a ±3 px. Onde A vê o que B não mede: a ordem dos blocos para quem dirige e o cartão escuro que quase não se separa do fundo.

## Impressão geral

Uma tela que passou de "app de agenda" a "instrumento": o Tom manda na linha, a data manda no topo, a pendência sabe onde dói e leva até lá, e o acabamento (foco, toque, sombra, erro) não trai mais o "preciso". O que falta é pôr o Ministro no comando da composição inteira, não só das pendências, e conferir o escuro no aparelho.

## O que funciona

1. **A coluna do Tom.** 17 px/700 com "TOM" em Label embaixo, 17,56:1 no claro e 15,82:1 no escuro, repetida em cada Trecho do Medley na mesma coluna. É a "Regra do Tom na lista" do DESIGN.md cumprida e o único elemento com forma própria da tela.
2. **Pendências com verbo e destino.** "sem ministro", "falta 1 bateria", "sem músicas", ordenadas por gravidade, com teto de duas e "mais N", cada linha indo à Equipe com a Função em foco ou a adicionar música.
3. **O sistema conta a verdade sem pedir nada.** Esqueleto que não pula, "visto às" quando o dado envelhece, "mudou" desde a última visita, pós-culto que confirma o histórico com Desfazer. Princípio 2 em prática.

## Problemas prioritários

1. [P1] O trabalho de quem dirige fica embaixo da visão do Membro. Com Escala próxima, a ordem é cartão → Repertório → pendências; as pendências só sobem quando uma Escala pendente vem antes da mostrada (`inicio.ts`, `pendenciasVemAntes`). Medido: "Precisa de atenção" em y=1052 de 1334 px a 360×800. Correção: para quem dirige e não é o Ministro da Escala mostrada (Admin escalado como músico, Ministro escalado noutra Equipe), as pendências vêm antes do Repertório; o Ministro da Escala mostrada mantém o próprio Repertório primeiro, e ganha "Adicionar música" no fim da lista quando já há Itens. Comando: /impeccable layout.

2. [P2] O h1 é uma data abreviada que nunca diz "Hoje", e a faixa fixa diz outra coisa. "Seg, 28 de set" com duas abreviações; no dia do culto o h1 segue a data enquanto o cartão diz "hoje" e o atalho "Hoje às 18h"; o título encolhido é "Oi, Gabriel" (decisão de 26/09). Correção possível: "Hoje" / "Amanhã" / "Segunda, 28 de set" no h1, com a mesma string no título encolhido. Comando: /impeccable clarify. Depende de reabrir a decisão do título encolhido.

3. [P2] No escuro, o cartão quase não existe. `--superficie` `#18181a` sobre `--fundo` `#0f0f10` = 1,08:1; separador 1,26:1; a sombra escura (35 %/45 % de preto) sobre quase preto. O DESIGN.md diz que "quem separa é o degrau", e o degrau é 1,08. Correção: subir o par escuro de Superfície (~`#1c1c1f`) ou um filete interno de 6 % de branco dentro do token de sombra, só no escuro. Validar no S23 a 20 % de brilho antes de decidir. Comando: /impeccable colorize.

4. [P2] Capa de 86 px baixa `maxresdefault.jpg` de 1280×720. Sete imagens por tela, ~1 MB no 3G para 86×60 (`Capa.tsx`, `--largura-da-capa`). Correção: `mqdefault.jpg` (320×180) na linha e `maxresdefault` só na capa grande, mantendo a alternativa como reserva. Comando: /impeccable optimize.

5. [P2] Na mesa, o Tom fica a ~620 px do título. A 1280 a lista tem 960 px; título termina em x≈557 e o Tom fica em x=1180. Correção: limitar `.lista.cartao` e `.proxima-escala` a 720 px a ≥ 900 px, ou fixar a coluna do Tom logo após o miolo. Comando: /impeccable adapt.

## Bandeiras vermelhas por persona

Alex: "Adicionar música" só existe quando o Repertório está vazio; "Ouvir tudo" são dois toques para uma intenção; sem forma de recarregar o Início; "· mais 1" esconde a terceira pendência.

Sam: 13 paradas de Tab antes da barra de abas; links externos sem "abre em nova aba" no nome; nome acessível da pendência é a concatenação "30 qua Culto sem ministro sem ministro"; o h1 em carga é `role="img" aria-label="Carregando"`.

Casey: sete `maxresdefault.jpg` por tela; engrenagem e X do pós-culto fora do polegar; falha de rede com cache só se vê no "visto às" de 13 px.

Marcos (Ministro, terça à noite): vê a própria Escala e o Repertório que escreveu; a quinta música exige Abrir escala; as pendências dos outros domingos estão 600 px abaixo; "até 24 out" diz a janela, não a contagem.

Lu (Membro, no ônibus): "Sua função: Vocal", Tom por música e observação inline resolvem em um olhar. Quem canta com ela são seis letras; a linha não é tocável (só a capa, que sai para o YouTube); fora de qualquer Escala lê "Você: não está nesta escala" sem saber que não está em nenhuma.

## Observações menores

- `dados.proximoCulto` nunca é mostrado quando `minhaProxima` existe: culto de hoje com outra Equipe não aparece nem ganha o atalho. Verificar se é intenção.
- "Você: não está nesta escala" deveria dizer "em nenhuma escala marcada" (é o que `minhaProxima === null` significa).
- "Criar as escalas de outubro" sem aviso depois ("Outubro criado: 4 domingos, Santa Ceia dia 11").
- Compressão ao toque 0.98 no atalho vs 0.97 do sistema.
- `Cartao className="pagina pos-culto"` funciona por acidente do `gap`.
- `.dia` a 11px enquanto o DESIGN.md chama o mês do bloco de Label (12px); `.inicial.mini` a 11px sem papel.
- `h2` de seção com ellipsis: "PRECISA DE ATENÇÃO · ATÉ 24 OUT" mede 226 px, cabe a 360 e corta a 320.
- `.casca` com `overflow: hidden` segue apontado pelo detector; provável falso positivo, confirmar no audit.
- "Ouvir tudo" e "Mês" com 36 px visuais e 44 px de toque; a sonda 3 px abaixo falhou duas vezes logo após um reload e passou depois de assentar.

## Perguntas a considerar

1. Se o Ministro montando a semana desempata, o Início dele deve começar pelo que falta ou pelo que ele já montou? E o Admin escalado como músico, é Ministro ou Membro nessa tela?
2. O h1 é uma data. E se fosse a resposta a quem olha ("Hoje", "Amanhã", "Domingo")? E se a faixa fixa repetisse essa resposta em vez de "Oi, Gabriel"?
3. Seis letras respondem "quem toca comigo"? Se não, o que "6 pessoas" sozinho perde?
4. Sem borda e com sombra a 45 % sobre `#0F0F10`, o cartão existe no S23 a 20 % de brilho? Qual é o degrau mínimo que ainda parece elevação e não borda?
5. O que a mesa do Início deveria fazer pelo Ministro além de esticar a lista a 960 px?
