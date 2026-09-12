import type { EstadoEscala } from '../dominio'
import { Selo } from './Selo'

export function Selos({ estado, santaCeia }: { estado: EstadoEscala; santaCeia: boolean }) {
  if (estado === 'agendada' && !santaCeia) return null

  return (
    <span className="selos">
      {estado !== 'agendada' && <Selo variante={estado}>{estado}</Selo>}
      {santaCeia && <Selo variante="ceia">Santa Ceia</Selo>}
    </span>
  )
}
