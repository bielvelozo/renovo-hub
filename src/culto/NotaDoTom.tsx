import type { TomDoCulto } from '../api/tipos'
import { Selo } from '../componentes/Selo'
import { TOM_ORIGINAL } from '../dominio'

export type TamanhoDaNota = 'lista' | 'grande' | 'palco'

type Nota = { tom: string; original?: boolean; tamanho?: TamanhoDaNota }

export function NotaDoTom({ tom, original = false, tamanho = 'lista' }: Nota) {
  if (tom === TOM_ORIGINAL) return <span className="nota-em-texto">Tom original</span>

  const nota = <span className={tamanho === 'lista' ? 'nota display' : `nota display ${tamanho}`}>{tom}</span>
  if (!original) return nota

  return (
    <span className="nota-com-selo">
      {nota}
      <Selo variante="tom">original</Selo>
    </span>
  )
}

export function TomDaMusica({ tom, tamanho }: { tom: TomDoCulto | null; tamanho?: TamanhoDaNota }) {
  if (!tom) return <Selo>sem tom</Selo>

  return <NotaDoTom tom={tom.valor} tamanho={tamanho} />
}

export function TomNoPalco({ tom, original }: { tom: string; original?: boolean }) {
  return (
    <p className="tom-no-palco">
      {tom !== TOM_ORIGINAL && <span className="rotulo-do-tom">Tom</span>}
      <NotaDoTom tom={tom} original={original} tamanho="palco" />
    </p>
  )
}
