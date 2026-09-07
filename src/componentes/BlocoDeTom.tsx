import type { ExecucaoApresentada, TomSugeridoApresentado } from '../api/tipos'
import { textoDoHistorico, textoDoTomSugerido } from '../escalas/rascunho'
import { SeletorDeTom } from './SeletorDeTom'

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

      <SeletorDeTom tom={tom} sugerido={sugerido?.tom ?? null} escolher={escolher} />

      {historico.length > 0 && <p className="dica">Histórico: {textoDoHistorico(historico)}</p>}
    </div>
  )
}
