# Modo culto e letra no app

Spec da fatia "modo culto", decidida com o Gabriel em 16/09/2026. É a primeira fatia fora do redesenho visual: entra depois das correções pós-F2+F3 (branch `correcoes/pos-f23`, mergeada na `main`) e não depende da F5+F6. Ela cobre o que a auditoria registrou como P1 ("não existe modo culto") e P6 ("Sequência é um `.docx` que baixa e abre no Word").

Leitura obrigatória junto: `CONTEXT.md` (Item, Trecho, Medley, Tom, Sequência), `docs/handoff-v1.md` (convenções de código e portões), [fundação](2026-09-11-fundacao-da-identidade-design.md) (componentes `Cabecalho`, `Folha`, `Cartao`, `Selo`, `Vazio`, `Botao`, `Campo`, `Menu`, tokens), [F2+F3](2026-09-12-inicio-mes-escala-equipe-design.md) (`GET /api/inicio`, `LinhaDeMusica` em modo leitura, `FolhaDoItem`). A pesquisa sobre letra da internet está em `docs/research/2026-09-16-fontes-de-letra.md` e **não** entra nesta fatia.

## Objetivo

No culto, com o celular na mão e sem internet, qualquer Membro abre a ordem das músicas com o tom em letra grande, entra na letra de cada uma em um toque, troca de música com um deslize e acha o tom (e a letra, se houver) de qualquer música do catálogo. A letra é o Word que a equipe já escreve hoje, lido pelo app na hora do envio, e o envio passa a ficar na própria Música, para Ministro e Admin.

## Decisões já tomadas (não reabrir)

| Decisão | Escolha | Data |
| --- | --- | --- |
| Alcance do offline | Escala do dia mais o catálogo inteiro com tom e letra, tudo guardado no aparelho como texto | 16/09 |
| Extração do Word | Mostrar como está no Word: marcador colorido ou com `//` ou `*` vira marcador em cor, texto preto vira letra, negrito vira destaque. O app não interpreta "Refrão" nem conta "2x" | 16/09 |
| Quem envia a letra | Ministro e Admin, na tela da Música e, para Medley, na folha do Item | 16/09 |
| Letra da internet | Fora desta fatia. A pesquisa ficou em `docs/research/`; se voltar, a fonte recomendada é o LRCLIB com confirmação do Ministro e uma ADR nova | 16/09 |
| Entrada no modo culto | Sozinho no dia: cartão "Culto de hoje" no Início quando há Escala hoje; e "Modo culto" no menu de qualquer Escala | 16/09 |
| Layout | Opção B "Ordem primeiro": lista com tom grande; letra abre por cima com anterior/próxima; números mais destacados; botão "Pesquisar música" | 16/09 |
| Tom sem nota | "tom original" e "sem tom" são selos pequenos na coluna do tom, nunca letra grande | 16/09 |
| Onde o conteúdo fica no aparelho | Pacote único (`GET /api/culto/pacote`) em `localStorage`, baixado em segundo plano a cada abertura do app; o modo culto lê só do pacote | 16/09 |
| Onde o Word vira texto | No Worker, na hora do envio, com `fflate`; Word ilegível é recusado | 16/09 |
| Letra do Medley | No Item da Escala (`anexos.item_id`), com Word único que substitui as letras das músicas do Medley | 16/09 |

## 1. Letra: domínio e extração

### Tipo `Letra` (`src/dominio/tipos.ts`)

```ts
type Linha = { texto: string; forte: boolean }
type Bloco = { tipo: 'marcador'; texto: string } | { tipo: 'estrofe'; linhas: Linha[] }
type Letra = { cabecalho: string[]; blocos: Bloco[] }
```

`cabecalho` guarda o título e o artista que vieram do Word (não são exibidos; a tela usa o título da Música). `blocos` é a letra na ordem do documento.

### Extração (`src/letra/docx.ts`, puro, testado)

`extrairLetra(bytes: Uint8Array): Letra` lança `WordIlegivel` (classe própria, com `motivo`) quando não consegue. Passos:

1. Descompactar com `unzipSync` do `fflate` (dependência nova, MIT, ~8 KB minificado; funciona no Worker e no Vitest). Sem `word/document.xml` → ilegível.
2. Decodificar o XML como UTF-8 e percorrer os parágrafos `<w:p …>…</w:p>` por expressão regular (o Worker não tem `DOMParser`; o XML do Word é regular o bastante). Em cada parágrafo, percorrer os `<w:r>`: o texto vem dos `<w:t>` (com entidades `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;` desfeitas), `<w:br/>` vira quebra de linha, `<w:b/>` ou `<w:b w:val="true"/>` marca o run como negrito (`w:val="0"`/`"false"` não), `<w:color w:val="RRGGBB"/>` com valor diferente de `000000` e `auto` marca o run como colorido. `<w:tab/>` vira espaço. Texto em `<w:del>` (alteração controlada rejeitada) é ignorado; `<w:ins>` é lido.
3. Cada parágrafo vira uma ou mais **linhas** (uma por `<w:br/>`). Uma linha é **marcador** quando algum run do parágrafo é colorido ou quando o texto, sem espaços à esquerda, começa com `//` ou `*`. Uma linha é **forte** quando os caracteres em runs negritos, sem contar espaços, são a maioria dos caracteres da linha (o Word solta o primeiro caractere às vezes: `N` sem negrito, `ão há nada` com negrito). Linha vazia (só espaços) é **vazia**.
4. **Cabeçalho**: as linhas do topo até a primeira vazia, quando todas são marcador ou fortes, saem de `blocos` e vão para `cabecalho` (o texto cru, sem `*` ou `//`). Se o documento não tem linha vazia no topo, ou alguma das linhas do topo é letra comum, não há cabeçalho. Exemplos reais: "Nada que o teu amor não possa – Lauras Souguellis" (negrito, uma linha), "SUBLIME" + "FHOP MUSIC" (negrito azul, duas linhas), "Me ama – Diante do Trono" (vermelho). "//VERSO1" seguido de "E me mostrou um rio" sem linha vazia não é cabeçalho.
5. **Blocos**: marcador vira `{ tipo: 'marcador', texto }` com o texto como está (`*Refrão: 2 vezes*`, `//REFRAO 8X`, `//`, `// (PRA CIMA)`); marcador vazio (`//` sozinho) é mantido porque separa repetições. Linhas comuns consecutivas viram uma estrofe; linha vazia fecha a estrofe; duas vazias seguidas não criam estrofe vazia. Espaços nas pontas das linhas são removidos; alinhamento (centralizado) é ignorado.
6. Resultado sem nenhuma estrofe → ilegível ("não tem letra, só marcadores").

Não interpreta o marcador: nada de reconhecer "Refrão", contar "2x" ou compactar. Isso é a decisão da tabela.

### Testes da extração (`src/letra/docx.test.ts`)

Os Word reais que o Gabriel passou (seis, em `C:\Users\gabri\Downloads\`) **não entram no repositório**: letra é obra protegida. Os testes usam fixtures sintéticas: um ajudante `docxDe(paragrafos: ParagrafoSintetico[])` que monta um `document.xml` mínimo e zipa com `zipSync`. Casos, cada um espelhando um padrão real:

- marcador por cor vermelha com asteriscos (`*Verso*`, `*Refrão: 2 vezes*`), estrofes separadas por linha vazia, refrão em negrito → estrofes com `forte: true`;
- marcador azul em negrito com barras (`//VERSO-1`, `// INTRO`, `//`), marcador roxo (`//SOLO`);
- marcador só por prefixo, sem cor (`//REFRÃO-2X` em preto, como no fim do Colossenses);
- negrito parcial: `N` comum + `ão há nada` negrito → `forte: true`; `Oh, Ele` comum + ` me amou` negrito → `forte: false` (menos da metade);
- `<w:br/>` no parágrafo vira três linhas na mesma estrofe;
- parágrafos centralizados (`<w:jc w:val="center"/>`) não mudam nada;
- cabeçalho de uma linha em negrito; cabeçalho de duas linhas coloridas; documento que começa por marcador seguido de letra sem linha vazia → `cabecalho: []`;
- cabeçalho com tamanho de fonte diferente é irrelevante (não se lê `w:sz`);
- `<w:del>` ignorado, entidades desfeitas, `<w:tab/>` vira espaço;
- documento só com marcadores → `WordIlegivel`; bytes que não são zip → `WordIlegivel`; zip sem `document.xml` → `WordIlegivel`.

Script local `scripts/letra.ts` (`npm run letra -- "<caminho do .docx>"`) imprime a extração de um Word real no terminal, com `[M]` antes de marcador e `[F]` antes de linha forte, para o Gabriel conferir com os arquivos dele. Não faz parte dos testes.

## 2. Dados e API

### Migration `0011_anexos_de_item_e_letra.sql`

Recria `anexos` (a produção tem 0 linhas; o local pode ter linhas do smoke, copiadas com `letra = NULL`):

```sql
CREATE TABLE anexos_novo (
  id TEXT PRIMARY KEY,
  musica_id TEXT REFERENCES musicas(id) ON DELETE CASCADE,
  item_id TEXT REFERENCES itens(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  mime TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  conteudo BLOB NOT NULL,
  letra TEXT,
  versao INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  CHECK ((musica_id IS NULL) <> (item_id IS NULL))
);
INSERT INTO anexos_novo (id, musica_id, nome, mime, tamanho, conteudo, versao, criado_em)
  SELECT id, musica_id, nome, mime, tamanho, conteudo, versao, criado_em FROM anexos;
DROP TABLE anexos;
ALTER TABLE anexos_novo RENAME TO anexos;
CREATE INDEX anexos_por_musica ON anexos(musica_id, versao);
CREATE INDEX anexos_por_item ON anexos(item_id, versao);
```

`letra` é o JSON de `Letra`. Anexo antigo sem `letra` continua válido: só baixa.

### `worker/dados/anexos.ts`

- `Anexo` ganha `itemId: string | null`, `musicaId: string | null` e `temLetra: boolean`. A letra em si sai por `lerLetra(db, anexoId): Letra | null` e pelas leituras agregadas abaixo; não viaja nas listas.
- `criarAnexo(db, dono: { musicaId } | { itemId }, novo: NovoAnexo & { letra: Letra })`; versão é por dono.
- `lerAnexosDoDono`, `lerAnexosDeMusicas` (existe) e `lerAnexosDeItens(db, itemIds)` (nova).
- `anexosPorDono(anexos): Record<string, Anexo[]>` substitui `anexosPorMusica`: chave `musicaId` para música e `item:<itemId>` para Item. Os campos `anexosPorMusica` de `EscalaApresentada` e `InicioApresentado` passam a se chamar `anexosPorDono` e incluem os Itens Medley da Escala.
- `letrasMaisNovas(db): { porMusica: Record<string, Letra>; porItem: Record<string, Letra> }` para o pacote: um `SELECT` com `max(versao)` por dono, só de anexos com `letra` não nula.

### Rotas de anexo (`worker/rotas/anexos.ts`)

- `POST /api/musicas/:id/anexos` (existe; Ministro): antes de gravar, `extrairLetra(bytes)`; `WordIlegivel` → `422 { erro: 'Não consegui ler a letra desse Word. Salve como .docx e tente de novo.' }`, nada gravado. Sucesso → `201` com o `Anexo` e mais `letra`. As validações atuais (arquivo presente, 1 MB) continuam.
- `POST /api/itens/:id/anexos` (nova; Ministro): Item inexistente → 404; Item que não é `medley` → `422 { erro: 'Só um Medley recebe letra pela Escala. Para uma música, envie na tela dela.' }`; resto igual à de Música.
- `GET /api/musicas/:id/anexos` e `GET /api/escalas/:id/anexos` continuam (o segundo passa a incluir os anexos dos Itens Medley).
- `GET /api/itens/:id/letra` (nova; Membro): `{ letra: Letra | null }` do anexo mais novo do Item. Usada pela tela de letra dentro da `Casca`.
- `GET /api/anexos/:id` (download) continua igual.
- `GET /api/musicas/:id` passa a devolver `letra: Letra | null` (do anexo mais novo com letra).

### `GET /api/culto/pacote` (nova; Membro; `worker/rotas/culto.ts`)

```ts
type MusicaDoCulto = {
  id: string; titulo: string; artista: string
  tom: { valor: string; origem: 'execucao' | 'conhecido' | 'original'; data?: string; ministradoPorNome?: string | null } | null
  vezesTocada: number
  letra: Letra | null
}
type TrechoDoCulto = { musicaId: string; titulo: string; artista: string; tom: string; inicio: string; fim: string }
type ItemDoCulto =
  | { id: string; tipo: 'inteira' | 'trecho'; musicaId: string; titulo: string; artista: string; tom: string; inicio: string | null; fim: string | null; observacao: string }
  | { id: string; tipo: 'medley'; trechos: TrechoDoCulto[]; observacao: string; letra: Letra | null }
type EscalaDoCulto = { id: string; data: string; horario: string; titulo: string; itens: ItemDoCulto[] }
type Pacote = { geradoEm: string; escalas: EscalaDoCulto[]; catalogo: MusicaDoCulto[] }
```

- `escalas`: `carregarMinisterio` com `intervalo: { de: hoje, ate: hoje + 30 dias }` (Brasília), sem canceladas, ordenadas por data; `titulo` por `tituloEscala`. Só Itens; sem Equipe.
- `catalogo`: todas as Músicas não arquivadas, `titulo`/`artista` já limpos como em `resumirMusica`, `tom` por `ultimoTom` (regra que já existe: última Execução → `tomConhecido` → `tomOriginal`; `original` como valor de tom vem com `valor: 'original'`), `vezesTocada`, `letra` de `letrasMaisNovas.porMusica`.
- A letra de uma música inteira ou trecho **não** é repetida no Item: a tela busca no `catalogo` pelo `musicaId`. O Medley leva a própria `letra` (do Item) ou `null`.
- Tamanho esperado: 102 músicas com letra de ~3 KB dão ~300 KB. Não há paginação nem compressão além do gzip do Cloudflare.
- Teste de rota: janela de 30 dias, cancelada fora, arquivada fora, Medley com letra do Item, música com letra, `tom` nas três origens e nulo, `geradoEm` presente.

## 3. Pacote no aparelho (`src/culto/pacote.ts`, `usarPacote`)

- Chave `renovo:culto` em `localStorage`, valor `Pacote` em JSON. `guardarPacote`, `lerPacote` e `idadeDoPacote(pacote, agora)` são puros sobre um `Storage` injetável; toda leitura e escrita em `try/catch` (quota cheia, navegação privada, `localStorage` inexistente): falha em silêncio e o pacote fica só em memória.
- `baixarPacote()`: `api<Pacote>('/api/culto/pacote')`, guarda e avisa os `usarPacote` montados (um `EventTarget` no módulo; sem `storage` event, que não dispara na mesma aba). O pacote antigo só é substituído quando o novo chega inteiro.
- Quando baixa: a `Casca` chama `baixarPacote()` uma vez ao montar (depois do primeiro render, sem bloquear nada); o modo culto chama ao montar a rota `/culto/:escalaId`. Nunca em cascata com outras buscas e nunca mostra tela de espera.
- `usarPacote()` devolve `{ pacote: Pacote | null; atualizadoEm: string | null; baixando: boolean; erro: string | null; baixar: () => void }`. `atualizadoEm` é o `geradoEm` do pacote guardado.
- O `usarBusca` e o cache em memória da API não entram aqui: o pacote tem ciclo próprio.

Fica registrado que o cache `NetworkFirst` do service worker (vite.config.ts) continua igual; ele não é o mecanismo do modo culto.

## 4. Modo culto (`src/culto/`)

Rotas fora da `Casca`, irmãs de `/instalar` em `App.tsx`:

- `/culto/:escalaId` → `Ordem`
- `/culto/:escalaId/item/:itemId` → `LetraDoItem`
- `/culto/:escalaId/pesquisar` → `Pesquisar`
- `/culto/:escalaId/musica/:musicaId` → `LetraDaMusica`

Todas dentro de `<ModoCulto>`, componente que: envolve em `<section className="culto" data-theme="escuro">` (o tema escuro é forçado por esse atributo com `color-scheme: dark` em CSS; a `Casca` não é montada, então o interruptor do Perfil não é tocado); pede `navigator.wakeLock?.request('screen')` ao montar e a cada `visibilitychange` para visível, solta ao desmontar, e ignora qualquer erro ou ausência da API (a tipagem entra por `src/culto/wakeLock.d.ts` se o `lib.dom` do projeto não tiver); lê o pacote com `usarPacote()`; resolve a Escala por `escalaId`.

Estados do `ModoCulto` antes de qualquer tela:

- Sem pacote e baixando: `Esqueleto`.
- Sem pacote e com erro: `Vazio` "Abra o app com internet uma vez antes do culto" e `Botao` "Tentar de novo" (chama `baixar`). Botão "Sair" volta para `/`.
- Pacote sem a Escala: tenta baixar; se depois de baixar continua sem, "Essa escala não está no pacote de hoje" com "Sair". (Acontece para Escala com mais de 30 dias ou cancelada.)
- Pacote com mais de 7 dias (`idadeDoPacote`): linha `dica` no topo da Ordem, "atualizado sáb, 14h" (`formatarDia` curto + hora).
- Erro ao baixar com pacote guardado: `aviso` discreto na Ordem, "Não consegui atualizar; mostrando o de sáb, 14h". Nunca apaga o guardado.

### Ordem (`Ordem.tsx`)

Layout B aprovado. Topo: `titulo · horário` ("Culto de Domingo · 18h") à esquerda, botão redondo ✕ à direita (volta para `/escalas/:id`). Título "Ordem de hoje" em display (quando a `data` não é hoje: "Ordem de dom, 20 de set"). Lista, um `Cartao` por Item:

- **número** em `Fraunces`, no mesmo tamanho do tom (a nota grande), cor `--texto-2`;
- título (`titulo` do Item; no Medley, "Medley: A + B" com os títulos dos trechos), `dica` com artista e " · letra" quando o Item tem letra (inteira/trecho: a música tem `letra` no catálogo; Medley: `letra` do Item ou alguma música dele com letra); no Medley a dica é "2 trechos · letra";
- coluna do tom, à direita: nota em `Fraunces` grande (`clamp(28px, 8vw, 34px)`) em `--acento`; `tom === 'original'` → `Selo` pequeno "tom original"; Medley → as notas dos trechos separadas por "·" em tamanho menor (`clamp(14px, 4vw, 18px)`), com "original" abreviado como "orig." dentro dessa linha.

Sem Itens: `Vazio` "O Ministro ainda não escolheu as músicas". Rodapé fixo (`RodapeDeAcao`): `Botao` largo secundário "🔍 Pesquisar música" (ícone `busca`). Tocar num Item abre `/culto/:escalaId/item/:itemId` com push lateral (View Transitions, como as outras telas).

### Letra do Item (`LetraDoItem.tsx`)

- Topo: "‹ Ordem" (volta), "N de M" no centro, ✕.
- Cabeçalho fixo (não rola): título em display, artista em `dica`; tom grande (`clamp(40px, 12vw, 48px)`) e ao lado, em `dica`, o último tom tocado quando existe: "último: G · Isa, 24/08" (do `tom` da música no catálogo, com `origem: 'execucao'`); quando o tom do Item é `original`, a nota grande é substituída por `Selo` "tom original". Observação do Ministro, quando há, em bloco com filete coral (`--realce`) e fundo `--superficie`.
- Trecho: "1:10–2:40" em `dica` ao lado do artista.
- Medley: no lugar de título/tom, um bloco por trecho (título, artista, minutagem, tom à direita), separados por linha tracejada; observação abaixo. A letra é a do Item; sem ela, `letrasDoMedley(item, catalogo)` concatena as letras das músicas com um marcador `{ tipo: 'marcador', texto: titulo }` antes de cada uma (músicas sem letra ficam de fora; se nenhuma tem, cai no vazio abaixo).
- Corpo: `<CorpoDaLetra letra={…} />` (seção 5) rolando. Sem letra: `Vazio` "Sem letra ainda" (com o cabeçalho de tom em cima, que é o que o músico mais precisa).
- Rodapé fixo: dois `Botao`, "‹ {título anterior}" secundário e "{título seguinte} ›" primário, títulos cortados com reticências; nas pontas, o botão que não existe fica desabilitado com "‹ Início" / "Fim ›".
- Deslize horizontal: `touchstart`/`touchend` no corpo; conta quando o deslocamento horizontal passa de 60 px e é maior que o vertical; esquerda → próxima, direita → anterior. Navegação por `navigate(..., { replace: true })` para não empilhar histórico a cada deslize.
- `itemAnterior`/`itemSeguinte` e `letrasDoMedley` em `src/culto/culto.ts` (puro, testado).

### Pesquisar (`Pesquisar.tsx`)

- Topo: "‹ Ordem", ✕. `Busca` com foco automático e rótulo "Pesquisar música".
- Antes de digitar: as 8 músicas com maior `vezesTocada` (desempate por título), sob o rótulo "Mais tocadas". Com texto: `combinaBusca` (título e artista, sem acento) sobre `catalogo`, até 50 resultados, ordem alfabética; nada → `Vazio` "Nenhuma música com esse texto".
- Linha igual à da Ordem, sem número: título, `dica` "artista · letra", coluna do tom com a nota grande, `Selo` "tom original" ou `Selo` neutro "sem tom".
- Tocar abre `/culto/:escalaId/musica/:musicaId`: `LetraDaMusica`, a mesma tela de letra com "‹ Pesquisa", sem "N de M", sem rodapé de anterior/próxima e sem observação (não há Item).

### CSS

`src/estilo/culto.css`, importado por `main.tsx`: `.culto` ocupa `100dvh` com `padding` das áreas seguras, `color-scheme: dark`, fundo `--fundo`; letra em 17 px, `line-height` 1,45; marcador em `--realce`, 12 px, versalete com `letter-spacing: .06em`, margem em cima; estrofe com margem de 12 px; `forte` em peso 700 e `--texto`. Larguras testadas a 360 px.

### Entradas

- **Início**: quando a Escala mostrada (`minhaProxima` ou `proximoCulto`) tem `data === hoje`, um `Cartao destaque` acima do Repertório: "Culto de hoje", `dica` "5 músicas · 18h", `Botao` primário "Modo culto" → `/culto/:id`. Aparece para qualquer Membro. Quando a Escala não tem Itens, o cartão aparece mesmo assim (o modo culto mostra o vazio).
- **Escala**: `MenuDaEscala` passa a existir para todo Membro; o primeiro item é "Modo culto" (ícone `musica`) → `/culto/:id`; os itens de edição continuam só para quem dirige. Escala cancelada não mostra "Modo culto".

## 5. Letra fora do modo culto

### `CorpoDaLetra` (`src/letra/CorpoDaLetra.tsx`)

Renderiza `Letra`: `<div className="letra">`, marcador em `<p className="marcador">`, estrofe em `<p>` com `<br/>` entre linhas e `<strong>` na linha forte. Só isso; quem monta cabeçalho e rodapé é a tela. Teste `dom`: marcador, estrofe, forte, letra vazia.

### Tela da Música (`Musica.tsx`)

- O botão "Letra" abre `/musicas/:id/letra` (rota nova dentro da `Casca`, `LetraNaCasca`): `Cabecalho` com o título da Música e `voltarPara` a Música; abaixo, o tom sugerido em `Selo` como já é na Música, e `CorpoDaLetra` com `musica.letra`. No tema da pessoa. Quando o anexo mais novo não tem `letra` (anexo anterior a esta fatia), o botão continua sendo o download, com rótulo "Letra (Word)".
- Menu, para quem dirige: "Enviar letra (Word)" sem anexo, "Trocar letra" com anexo. Abre `FolhaDaLetra` (seção abaixo). Depois do envio com sucesso, `busca.definir` com a Música atualizada (`anexos` e `letra`).
- "Versões da letra" continua (download por versão).

### `FolhaDaLetra` (`src/componentes/FolhaDaLetra.tsx`)

Props `{ titulo; dono: { musicaId } | { itemId }; anexos: Anexo[]; fechar; aoEnviar(anexo, letra) }`. Conteúdo: `dica` "Enviar de novo não apaga nada: guarda uma versão nova."; `Campo` "Arquivo Word (.docx, até 1 MB)" com `input type=file` e `accept` do `.docx` (mesmo do Admin); `recusaDoArquivo` do `src/admin/admin.ts` continua valendo; `Botao` largo "Enviar letra" / "Enviar nova versão". Envio por `enviarArquivo` para `/api/musicas/:id/anexos` ou `/api/itens/:id/anexos`. Sucesso: a folha troca para a prévia, "Letra lida: N linhas", `CorpoDaLetra` limitado a 8 linhas com degradê, e `Botao` "Pronto" (fecha) mais `dica` "Não ficou certo? Ajuste o Word e envie de novo." Erro 422 ou outro: `aviso` na folha, arquivo mantido no campo.

### Medley na Escala

- `FolhaDoItem` do Medley: bloco "Letra do medley" abaixo dos Trechos: sem anexo, `Botao` secundário "Enviar letra (Word)"; com anexo, `dica` "letra v2 · 12/09" e `Botao` secundário "Trocar". Os dois abrem `FolhaDaLetra` com `dono: { itemId }` (folha sobre folha: fechar a de letra volta à do Item, e a Escala recarrega). `CamposDoItem` não muda.
- `LinhaDeMusica` em modo leitura: o selo "letra" passa a ser um `Link` para `/escalas/:id/itens/:itemId/letra` (rota nova na `Casca`, `LetraDoItemNaCasca`: `Cabecalho` com o título do Item, `voltarPara` a Escala, tom e observação como no modo culto, `CorpoDaLetra`; Medley usa `GET /api/itens/:id/letra` e, sem ela, as letras das músicas pelo `GET /api/musicas/:id` de cada uma). O selo aparece para inteira/trecho quando `anexosPorDono[musicaId]` tem anexo com `temLetra`, e para Medley quando `anexosPorDono['item:' + id]` tem, ou alguma música dele tem. O download do arquivo sai da linha (fica nas "Versões da letra" da Música e na Sequências do Admin).
- No Início, o `RepertorioDoInicio` usa a mesma `LinhaDeMusica`, então herda o comportamento.

### Admin › Sequências

Continua como atalho de lote. `FolhaDaSequencia` passa a usar `FolhaDaLetra`; a lista de versões mostra "letra lida" (`temLetra`) ou "sem letra (enviado antes)". A dica da seção no `Painel` muda para "Enviar o Word da letra de várias músicas".

## 6. Textos

| Onde | Texto |
| --- | --- |
| Início, cartão | "Culto de hoje" · "5 músicas · 18h" · botão "Modo culto" |
| Menu da Escala | "Modo culto" |
| Ordem, título | "Ordem de hoje" / "Ordem de dom, 20 de set" |
| Ordem, rodapé | "Pesquisar música" |
| Ordem, sem itens | "O Ministro ainda não escolheu as músicas" |
| Ordem, pacote velho | "atualizado sáb, 14h" |
| Ordem, erro ao atualizar | "Não consegui atualizar; mostrando o de sáb, 14h" |
| Sem pacote | "Abra o app com internet uma vez antes do culto" · "Tentar de novo" · "Sair" |
| Escala fora do pacote | "Essa escala não está no pacote de hoje" |
| Letra, topo | "‹ Ordem" · "2 de 5" · "‹ Pesquisa" |
| Letra, último tom | "último: G · Isa, 24/08" |
| Letra, sem letra | "Sem letra ainda" |
| Letra, rodapé nas pontas | "‹ Início" · "Fim ›" |
| Selos de tom | "tom original" · "sem tom" · "orig." dentro do Medley |
| Pesquisar | rótulo "Pesquisar música" · "Mais tocadas" · "Nenhuma música com esse texto" |
| Música, botão | "Letra" · "Letra (Word)" (anexo antigo) |
| Música, menu | "Enviar letra (Word)" · "Trocar letra" · "Versões da letra" |
| FolhaDaLetra | "Arquivo Word (.docx, até 1 MB)" · "Enviar letra" · "Enviar nova versão" · "Letra lida: 42 linhas" · "Pronto" · "Não ficou certo? Ajuste o Word e envie de novo." |
| Word ilegível (422) | "Não consegui ler a letra desse Word. Salve como .docx e tente de novo." |
| Item que não é Medley (422) | "Só um Medley recebe letra pela Escala. Para uma música, envie na tela dela." |
| FolhaDoItem, Medley | "Letra do medley" · "Enviar letra (Word)" · "letra v2 · 12/09" · "Trocar" |
| Sequências | "letra lida" · "sem letra (enviado antes)" |

## 7. Fora do escopo

- Letra da internet (LRCLIB ou qualquer fonte). Fica a pesquisa.
- Editar a letra dentro do app; interpretar marcadores ("Refrão ×2"); gancho em destaque automático.
- Letra no texto do WhatsApp; letra sincronizada com o vídeo; cifra.
- Membro comum enviar letra.
- Modo culto com Equipe, presença ou registro do que foi tocado (o pós-culto continua como está).
- Baixar o pacote por push ou em horário; ele só baixa quando o app abre.
- Tema claro no modo culto.

## 8. Portões e evidência

- `npm run check && npm test` antes de cada commit; `npm run build && npm run smoke` antes de dar a fatia por pronta (`PORTA_DO_SMOKE=8790` se a 8787 estiver ocupada).
- Testes exigidos: os da extração (seção 1); `src/culto/culto.test.ts` (`itemAnterior`/`itemSeguinte` nas pontas, `letrasDoMedley` com e sem letras, `maisTocadas` com desempate, busca por acento); `src/culto/pacote.test.ts` (guardar/ler com `Storage` falso, `try/catch` com `Storage` que lança, `idadeDoPacote`); rotas `anexos.test.ts` (Música e Item, 422 de Word ilegível e de Item que não é Medley, `temLetra`, `anexosPorDono` com `item:`), `culto.test.ts`, `musicas.test.ts` (`letra` no detalhe); componentes `dom`: `CorpoDaLetra`, `Ordem` (selos de tom, Medley), `LetraDoItem` (deslize troca; ponta desabilitada), `FolhaDaLetra` (prévia após envio; 422 na folha), `Inicio` (cartão só quando é hoje).
- Smoke: o roteiro do Ministro envia um Word sintético (gerado no próprio smoke com `zipSync`, letra inventada) numa Música e num Medley, lê `/api/culto/pacote` e confere a letra dos dois; o roteiro do Membro lê o pacote e confere `catalogo` e `escalas`. O smoke passa a gerar o Word sintético em `scripts/fumaca/`, sem arquivo real no repositório.
- Prints a **360 px** (o S23 do Gabriel), medidos por JS, em `.scratch/culto-evidencias/` (ignorado): tema escuro do modo culto (Ordem com Medley e "tom original", Letra com observação, Letra do Medley, Pesquisar com "Mais tocadas", estado sem pacote); tema claro e escuro da `Casca` (Música com botão Letra, `/musicas/:id/letra`, `FolhaDaLetra` com prévia, `FolhaDoItem` do Medley com "Letra do medley", Início com o cartão "Culto de hoje"). Catorze prints.
- Teste humano do Gabriel antes do deploy: abrir o app com internet, pôr o S23 em modo avião, entrar no modo culto pelo cartão do Início e percorrer as quatro telas; conferir a extração de dois dos Word reais com `npm run letra`.
- Migration `0011` e `npm run deploy` no fim, como nas fatias anteriores; `main` sem push.
- `CONTEXT.md`: Sequência passa a dizer "arquivo Word anexado à Música ou ao Medley; o app lê o texto na hora do envio e o mostra no modo culto"; entra o termo **Pacote do culto**. `docs/handoff-redesenho.md` ganha uma linha dizendo que o modo culto saiu da lista "fora do redesenho".

## 9. Fases sugeridas para a orquestração

1. **Letra**: `fflate`, tipo `Letra`, `src/letra/docx.ts` com testes e `npm run letra`; migration 0011; `worker/dados/anexos.ts` com dono e `letra`; `POST` de Música e de Item; `GET /api/itens/:id/letra`; `letra` em `GET /api/musicas/:id`; `anexosPorDono` no lugar de `anexosPorMusica` (Escala e Início). Testes de rota; smoke atual verde.
2. **Pacote**: `GET /api/culto/pacote` com testes; `src/culto/pacote.ts`, `usarPacote`, download na `Casca`.
3. **Modo culto**: `ModoCulto`, `Ordem`, `LetraDoItem`, `Pesquisar`, `LetraDaMusica`, `culto.css`, deslize, wake lock, cartão no Início, "Modo culto" no menu da Escala. Prints do tema escuro.
4. **Letra na `Casca`**: `CorpoDaLetra`, `/musicas/:id/letra`, `FolhaDaLetra` na Música e no `FolhaDoItem` do Medley, selo "letra" abrindo `/escalas/:id/itens/:itemId/letra`, Sequências. Prints da `Casca`.
5. **Fechamento**: smoke com Word sintético, `CONTEXT.md`, handoff, migration remota, deploy.
