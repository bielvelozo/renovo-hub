import { useEffect } from 'react'
import { Esqueleto } from '../componentes/Esqueleto'

export function Entrar() {
  useEffect(() => {
    window.location.replace(window.location.pathname)
  }, [])

  return <Esqueleto forma="paragrafo" />
}
