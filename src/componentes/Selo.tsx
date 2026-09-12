import type { ReactNode } from 'react'
import { Icone } from '../casca/Icone'
import type { NomeDoIcone } from '../casca/Icone'

export type VarianteDoSelo =
  | 'neutro'
  | 'acento'
  | 'atencao'
  | 'sucesso'
  | 'perigo'
  | 'ceia'
  | 'trecho'
  | 'realizada'
  | 'cancelada'
  | 'legado'
  | 'tom'

export function Selo({
  variante = 'neutro',
  icone,
  children,
}: {
  variante?: VarianteDoSelo
  icone?: NomeDoIcone
  children: ReactNode
}) {
  return (
    <span className={`selo ${variante}`}>
      {icone && <Icone nome={icone} />}
      {children}
    </span>
  )
}
