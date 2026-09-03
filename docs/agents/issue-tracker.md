# Issue tracker: Local Markdown

Issues e mapas deste repo vivem em `.scratch/` como markdown.

## Wayfinding operations

- **Map**: `.scratch/<esforço>/map.md`
- **Child ticket**: `.scratch/<esforço>/issues/NN-<slug>.md`, numerado de `01`, com `Type:` (`research`/`prototype`/`grilling`/`task`) e `Status:` (`open`/`claimed`/`resolved`).
- **Blocking**: linha `Blocked by: NN, NN`. Desbloqueado quando todos os listados estão `resolved`.
- **Frontier**: arquivos `open`, desbloqueados e sem claim; menor número primeiro.
- **Claim**: `Status: claimed` antes de qualquer trabalho.
- **Resolve**: resposta em `## Answer`, `Status: resolved`, e ponteiro (gist + link) em Decisions-so-far do `map.md`.
