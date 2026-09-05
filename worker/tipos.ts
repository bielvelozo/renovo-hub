import type { Membro } from '../src/dominio/tipos'

export type Ambiente = {
  DB: D1Database
}

export type Contexto = {
  Bindings: Ambiente
  Variables: {
    membro: Membro
    sessao: string
  }
}
