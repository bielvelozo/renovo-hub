import type { MusicaNaLista } from '../api/tipos'
import { selosDaMusica } from '../musicas/catalogo'

export function SelosDaMusica({ musica }: { musica: MusicaNaLista }) {
  return (
    <span className="selos musica">
      {selosDaMusica(musica).map((selo) => (
        <span key={selo.chave} className={`selo ${selo.chave}`}>
          {selo.texto}
        </span>
      ))}
    </span>
  )
}
