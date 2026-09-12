import type { MusicaNaLista } from '../api/tipos'
import { selosDaMusica } from '../musicas/catalogo'
import type { SeloDaMusica } from '../musicas/catalogo'
import { Selo } from './Selo'
import type { VarianteDoSelo } from './Selo'

const VARIANTES: Record<SeloDaMusica['chave'], VarianteDoSelo> = {
  tom: 'tom',
  quando: 'neutro',
  parcial: 'trecho',
  nunca: 'neutro',
  legado: 'legado',
  nova: 'neutro',
}

export function SelosDaMusica({ musica }: { musica: MusicaNaLista }) {
  return (
    <span className="selos musica">
      {selosDaMusica(musica).map((selo) => (
        <Selo key={selo.chave} variante={VARIANTES[selo.chave]}>
          {selo.texto}
        </Selo>
      ))}
    </span>
  )
}
