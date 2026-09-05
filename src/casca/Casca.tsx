import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { api } from '../api/cliente'
import { ProvedorDoEu, usarSessao } from '../sessao/sessao'
import type { Eu } from '../sessao/sessao'
import { Abas } from './Abas'
import { Marca } from './Marca'

export function Casca() {
  const sessao = usarSessao()

  if (sessao.situacao === 'carregando') return <div className="girando" role="status" aria-label="Carregando" />
  if (sessao.situacao === 'fora') return <Navigate to="/esqueci" replace />

  if (sessao.situacao === 'erro') {
    return (
      <section className="pagina centrada">
        <h1>Renovo Hub</h1>
        <p className="aviso">{sessao.mensagem}</p>
        <button type="button" className="botao largo" onClick={sessao.recarregar}>
          Tentar de novo
        </button>
      </section>
    )
  }

  return <Dentro eu={sessao.eu} />
}

function Dentro({ eu }: { eu: Eu }) {
  const sugestoes = usarContagemDeSugestoes()

  return (
    <ProvedorDoEu eu={eu}>
      <div className="casca">
        <header className="cabecalho">
          <Link to="/" aria-label="Início">
            <Marca />
          </Link>
          <span className="cresce" />
          {eu.admin && (
            <Link to="/admin" className="botao secundario pequeno">
              Admin
            </Link>
          )}
        </header>
        <main className="conteudo">
          <Outlet />
        </main>
        <Abas eu={eu} sugestoes={sugestoes} />
      </div>
    </ProvedorDoEu>
  )
}

function usarContagemDeSugestoes(): number {
  const [quantas, guardar] = useState(0)
  const { pathname } = useLocation()

  useEffect(() => {
    const controle = new AbortController()

    api<{ sugestoes: unknown[] }>('/api/sugestoes', { sinal: controle.signal })
      .then(({ sugestoes }) => guardar(sugestoes.length))
      .catch(() => guardar(0))

    return () => controle.abort()
  }, [pathname])

  return quantas
}
