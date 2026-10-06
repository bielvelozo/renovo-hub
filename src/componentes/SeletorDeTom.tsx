import { useState } from 'react'
import { NOTAS_BRANCAS, NOTAS_PRETAS, partesDoTom, tomDe } from '../dominio'

export function SeletorDeTom({
  tom,
  sugerido,
  original,
  desligado,
  escolher,
}: {
  tom: string | null
  sugerido?: string | null
  original?: string | null
  desligado?: boolean
  escolher: (tom: string) => void
}) {
  const escolhido = partesDoTom(tom ?? '')
  const [preferida, definirPreferida] = useState(partesDoTom(sugerido ?? '').menor)

  const menor = escolhido.nota ? escolhido.menor : preferida

  const trocarQualidade = (cada: boolean) => {
    definirPreferida(cada)
    if (escolhido.nota) escolher(tomDe(escolhido.nota, cada))
  }

  return (
    <>
      <div className="qualidades" role="group" aria-label="Maior ou menor">
        {[false, true].map((cada) => (
          <button
            key={String(cada)}
            type="button"
            className="chip"
            aria-pressed={menor === cada}
            disabled={desligado}
            onClick={() => trocarQualidade(cada)}
          >
            {cada ? 'menor' : 'maior'}
          </button>
        ))}
      </div>

      <div className="teclado">
        {NOTAS_PRETAS.map((nota) => (
          <Tecla
            key={nota}
            nota={nota}
            preta
            menor={menor}
            escolhido={escolhido}
            sugerido={sugerido}
            original={original}
            desligado={desligado}
            escolher={escolher}
          />
        ))}
        {NOTAS_BRANCAS.map((nota) => (
          <Tecla
            key={nota}
            nota={nota}
            menor={menor}
            escolhido={escolhido}
            sugerido={sugerido}
            original={original}
            desligado={desligado}
            escolher={escolher}
          />
        ))}
      </div>
    </>
  )
}

function Tecla({
  nota,
  preta,
  menor,
  escolhido,
  sugerido,
  original,
  desligado,
  escolher,
}: {
  nota: string
  preta?: boolean
  menor: boolean
  escolhido: { nota: string; menor: boolean }
  sugerido?: string | null
  original?: string | null
  desligado?: boolean
  escolher: (tom: string) => void
}) {
  const ehSugerida = partesDoTom(sugerido ?? '').nota === nota
  const ehOriginal = partesDoTom(original ?? '').nota === nota

  return (
    <button
      type="button"
      className={`tecla${preta ? ' preta' : ''}${ehSugerida ? ' sugerido' : ''}${ehOriginal ? ' original' : ''}`}
      data-original={ehOriginal || undefined}
      data-nota={nota}
      aria-pressed={escolhido.nota === nota}
      aria-label={tomDe(nota, menor)}
      disabled={desligado}
      onClick={() => escolher(tomDe(nota, menor))}
    >
      {nota}
      {menor && <span className="qualidade">m</span>}
    </button>
  )
}
