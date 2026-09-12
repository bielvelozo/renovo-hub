import type { CSSProperties, ReactNode } from 'react'

export type OpcaoDoSegmento<T extends string> = { valor: T; rotulo: ReactNode }

export function Segmento<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
  desligado,
}: {
  rotulo: string
  opcoes: OpcaoDoSegmento<T>[]
  valor: T
  aoMudar: (valor: T) => void
  desligado?: boolean
}) {
  const posicao = Math.max(
    0,
    opcoes.findIndex((opcao) => opcao.valor === valor),
  )
  const estilo = { '--posicao': posicao, '--total': opcoes.length } as CSSProperties

  return (
    <div className="segmento" role="group" aria-label={rotulo} style={estilo}>
      <span className="marcador" aria-hidden="true" />
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          aria-pressed={opcao.valor === valor}
          disabled={desligado}
          onClick={() => aoMudar(opcao.valor)}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  )
}
