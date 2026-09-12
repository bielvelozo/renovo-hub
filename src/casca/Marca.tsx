import { ANEL_EXTERNO, ANEL_INTERNO, BARRAS, CENTRO, LADO, LARGURA_DA_BARRA } from '../marca/selo'

export function SeloDaMarca({ pequeno = false }: { pequeno?: boolean }) {
  return (
    <svg className="selo-da-marca" viewBox={`0 0 ${LADO} ${LADO}`} aria-hidden="true">
      <circle
        cx={CENTRO}
        cy={CENTRO}
        r={ANEL_EXTERNO.raio}
        fill="none"
        stroke="currentColor"
        strokeWidth={pequeno ? ANEL_EXTERNO.tracoPequeno : ANEL_EXTERNO.traco}
      />
      {!pequeno && (
        <circle cx={CENTRO} cy={CENTRO} r={ANEL_INTERNO.raio} fill="none" stroke="currentColor" strokeWidth={ANEL_INTERNO.traco} />
      )}
      <g transform={`translate(${CENTRO} ${CENTRO})`} fill="var(--acento)">
        {BARRAS.map(({ x, altura }) => (
          <rect key={x} x={x} y={-altura / 2} width={LARGURA_DA_BARRA} height={altura} rx={LARGURA_DA_BARRA / 2} />
        ))}
      </g>
    </svg>
  )
}

export function Marca({ pequena = false }: { pequena?: boolean }) {
  return (
    <span className="marca" role="img" aria-label="Renovo Music">
      <SeloDaMarca pequeno={pequena} />
      <span className="nome" aria-hidden="true">
        <span className="palavra">Renovo</span>
        <span className="sub">Music</span>
      </span>
    </span>
  )
}
