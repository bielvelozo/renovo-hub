import { useEffect } from 'react'
import type { ReactNode } from 'react'

export function Folha({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const naTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fechar()
    }

    document.addEventListener('keydown', naTecla)
    return () => document.removeEventListener('keydown', naTecla)
  }, [fechar])

  return (
    <div className="folha" onClick={fechar}>
      <div className="painel" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        {children}
        <button type="button" className="botao secundario largo" onClick={fechar}>
          Fechar
        </button>
      </div>
    </div>
  )
}
