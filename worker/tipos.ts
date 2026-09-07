import type { Membro } from '../src/dominio/tipos'

export type Ambiente = {
  DB: D1Database
  VAPID_PUBLIC?: string
  VAPID_PRIVATE?: string
  VAPID_SUBJECT?: string
  YOUTUBE_API_KEY?: string
}

export type Contexto = {
  Bindings: Ambiente
  Variables: {
    membro: Membro
    sessao: string
  }
}
