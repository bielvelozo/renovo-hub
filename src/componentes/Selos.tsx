import type { EstadoEscala } from '../dominio'

export function Selos({ estado, santaCeia }: { estado: EstadoEscala; santaCeia: boolean }) {
  return (
    <span className="selos">
      <span className={`selo ${estado}`}>{estado}</span>
      {santaCeia && <span className="selo ceia">Santa Ceia</span>}
    </span>
  )
}
