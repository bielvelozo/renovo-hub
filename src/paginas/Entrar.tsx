import { useEffect } from 'react'
import { Esqueleto } from '../componentes/Esqueleto'

// O Worker é o dono de /entrar/* (run_worker_first no wrangler.toml): ele abre a sessão e manda
// pra /instalar. Esta página só existe pro caso de o roteador do front pegar a rota antes,
// e o que ela faz é sair do SPA e deixar o Worker responder.
export function Entrar() {
  useEffect(() => {
    window.location.replace(window.location.pathname)
  }, [])

  return <Esqueleto forma="paragrafo" />
}
