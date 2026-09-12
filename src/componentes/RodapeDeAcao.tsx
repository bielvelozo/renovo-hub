import type { ReactNode } from 'react'

export function RodapeDeAcao({ primario, secundario }: { primario: ReactNode; secundario?: ReactNode }) {
  return (
    <div className="rodape-de-acao">
      <div className="rodape-interno">
        {secundario}
        {primario}
      </div>
    </div>
  )
}
