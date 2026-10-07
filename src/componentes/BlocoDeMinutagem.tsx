import { normalizarMinutagem } from '../dominio'
import { Campo } from './Campo'

export function BlocoDeMinutagem({
  inicio,
  fim,
  escrever,
}: {
  inicio: string
  fim: string
  escrever: (campo: 'inicio' | 'fim', valor: string) => void
}) {
  return (
    <div className="secao">
      <h2>Minutagem</h2>

      <div className="minutagem">
        <Campo rotulo="Início">
          <input
            inputMode="numeric"
            placeholder="0:00"
            value={inicio}
            onChange={(evento) => escrever('inicio', evento.target.value)}
            onBlur={() => escrever('inicio', normalizarMinutagem(inicio) ?? inicio)}
          />
        </Campo>

        <Campo rotulo="Fim">
          <input
            inputMode="numeric"
            placeholder="3:45"
            value={fim}
            onChange={(evento) => escrever('fim', evento.target.value)}
            onBlur={() => escrever('fim', normalizarMinutagem(fim) ?? fim)}
          />
        </Campo>
      </div>
    </div>
  )
}
