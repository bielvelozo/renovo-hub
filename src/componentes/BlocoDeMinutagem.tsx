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
      <p className="dica">O trecho do vídeo de referência, no formato 1:05.</p>

      <div className="minutagem">
        <Campo rotulo="Início">
          <input
            inputMode="numeric"
            placeholder="0:00"
            value={inicio}
            onChange={(evento) => escrever('inicio', evento.target.value)}
          />
        </Campo>

        <Campo rotulo="Fim">
          <input
            inputMode="numeric"
            placeholder="3:45"
            value={fim}
            onChange={(evento) => escrever('fim', evento.target.value)}
          />
        </Campo>
      </div>
    </div>
  )
}
