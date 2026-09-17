import type { TomDoCulto } from '../api/tipos'
import { Selo } from '../componentes/Selo'
import { TOM_ORIGINAL } from '../dominio'

export function NotaDoTom({ tom, grande }: { tom: string; grande?: boolean }) {
  if (tom === TOM_ORIGINAL) return <Selo variante="tom">tom original</Selo>

  return <span className={grande ? 'nota display grande' : 'nota display'}>{tom}</span>
}

export function TomDaMusica({ tom, grande }: { tom: TomDoCulto | null; grande?: boolean }) {
  if (!tom) return <Selo>sem tom</Selo>

  return <NotaDoTom tom={tom.valor} grande={grande} />
}
