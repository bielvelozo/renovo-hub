import type { TomDoCulto } from '../api/tipos'
import { Selo } from '../componentes/Selo'
import { TOM_ORIGINAL } from '../dominio'

export type TamanhoDaNota = 'lista' | 'grande' | 'palco'

export function NotaDoTom({ tom, tamanho = 'lista' }: { tom: string; tamanho?: TamanhoDaNota }) {
  if (tom === TOM_ORIGINAL) return <Selo variante="tom">tom original</Selo>

  return <span className={tamanho === 'lista' ? 'nota display' : `nota display ${tamanho}`}>{tom}</span>
}

export function TomDaMusica({ tom, tamanho }: { tom: TomDoCulto | null; tamanho?: TamanhoDaNota }) {
  if (!tom) return <Selo>sem tom</Selo>

  return <NotaDoTom tom={tom.valor} tamanho={tamanho} />
}

export function TomNoPalco({ tom }: { tom: string }) {
  return (
    <p className="tom-no-palco">
      {tom !== TOM_ORIGINAL && <span className="rotulo-do-tom">Tom</span>}
      <NotaDoTom tom={tom} tamanho="palco" />
    </p>
  )
}
