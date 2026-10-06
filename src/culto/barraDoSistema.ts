import { COR_DA_BARRA } from '../tema/tema'

export function escurecerABarra(documento: Pick<Document, 'querySelector'> = document): () => void {
  const meta = documento.querySelector('meta[name="theme-color"]')
  if (!meta) return () => {}

  const antes = meta.getAttribute('content')
  meta.setAttribute('content', COR_DA_BARRA.escuro)

  return () => {
    if (antes !== null) meta.setAttribute('content', antes)
  }
}
