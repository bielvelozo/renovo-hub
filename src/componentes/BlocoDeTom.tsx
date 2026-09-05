import type { ExecucaoApresentada, TomSugeridoApresentado } from '../api/tipos'
import { TONS } from '../dominio'
import { textoDoHistorico, textoDoTomSugerido } from '../escalas/rascunho'

export function BlocoDeTom({
  tom,
  sugerido,
  historico,
  escolher,
}: {
  tom: string | null
  sugerido: TomSugeridoApresentado | null
  historico: ExecucaoApresentada[]
  escolher: (tom: string) => void
}) {
  return (
    <div className="secao">
      <h2>Tom</h2>
      <p className="dica">{textoDoTomSugerido(sugerido)}</p>

      <div className="tons">
        {TONS.map((cada) => (
          <button
            key={cada}
            type="button"
            className={sugerido?.tom === cada ? 'sugerido' : undefined}
            aria-pressed={tom === cada}
            onClick={() => escolher(cada)}
          >
            {cada}
          </button>
        ))}
      </div>

      {historico.length > 0 && <p className="dica">Histórico: {textoDoHistorico(historico)}</p>}
    </div>
  )
}
