import type { ReactNode } from 'react'
import { Icone } from '../casca/Icone'
import type { NomeDoIcone } from '../casca/Icone'

export function Vazio({ icone, children, acao }: { icone: NomeDoIcone; children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="vazio">
      <Icone nome={icone} />
      <p>{children}</p>
      {acao}
    </div>
  )
}
