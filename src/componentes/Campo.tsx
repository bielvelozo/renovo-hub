import type { ReactNode } from 'react'

export function Campo({
  rotulo,
  dica,
  erro,
  children,
}: {
  rotulo: string
  dica?: string
  erro?: string | null
  children: ReactNode
}) {
  return (
    <label className={`campo${erro ? ' com-erro' : ''}`}>
      <span className="rotulo">{rotulo}</span>
      {children}
      {dica && !erro && <span className="dica">{dica}</span>}
      {erro && (
        <span className="erro" role="alert">
          {erro}
        </span>
      )}
    </label>
  )
}
