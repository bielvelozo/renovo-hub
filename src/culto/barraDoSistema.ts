import { COR_DA_BARRA } from '../tema/tema'

// O palco é escuro mesmo no tema claro, e no PWA instalado a barra do sistema segue o theme-color:
// enquanto o modo culto está aberto ela acompanha o palco, e volta ao tema da pessoa ao sair.
export function escurecerABarra(documento: Pick<Document, 'querySelector'> = document): () => void {
  const meta = documento.querySelector('meta[name="theme-color"]')
  if (!meta) return () => {}

  const antes = meta.getAttribute('content')
  meta.setAttribute('content', COR_DA_BARRA.escuro)

  return () => {
    if (antes !== null) meta.setAttribute('content', antes)
  }
}
