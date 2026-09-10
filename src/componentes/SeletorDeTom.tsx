import { useState } from 'react'
import { NOTAS_BRANCAS, NOTAS_PRETAS, partesDoTom, tomDe } from '../dominio'

export function SeletorDeTom({
  tom,
  sugerido,
  desligado,
  escolher,
}: {
  tom: string | null
  sugerido?: string | null
  desligado?: boolean
  escolher: (tom: string) => void
}) {
  const escolhido = partesDoTom(tom ?? '')
  const [preferida, definirPreferida] = useState(partesDoTom(sugerido ?? '').menor)

  // Enquanto há nota escolhida, quem manda é ela: o Tom pode ter vindo de fora
  // (do chip de Tom original, do Cifra Club) e o botão tem que acompanhar.
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
  desligado,
  escolher,
}: {
  nota: string
  preta?: boolean
  menor: boolean
  escolhido: { nota: string; menor: boolean }
  sugerido?: string | null
  desligado?: boolean
  escolher: (tom: string) => void
}) {
  return (
    <button
      type="button"
      className={`tecla${preta ? ' preta' : ''}${partesDoTom(sugerido ?? '').nota === nota ? ' sugerido' : ''}`}
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
