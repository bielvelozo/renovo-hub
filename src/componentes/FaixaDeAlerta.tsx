import { Icone } from '../casca/Icone'

export function FaixaDeAlerta({ frases }: { frases: string[] }) {
  if (frases.length === 0) return null

  return (
    <div className="faixa-de-alerta">
      <Icone nome="atencao" />
      <div>
        {frases.map((frase) => (
          <p key={frase}>{frase}</p>
        ))}
      </div>
    </div>
  )
}
