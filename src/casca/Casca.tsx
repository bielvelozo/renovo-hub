import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import type { SugestaoApresentada } from '../api/tipos'
import { api } from '../api/cliente'
import { ProvedorDeAvisos } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { Esqueleto } from '../componentes/Esqueleto'
import { baixarPacote } from '../culto/pacote'
import { CHAVE_DE_VISITA_DAS_SUGESTOES, contarNovas } from '../escalas/sugestoes'
import { ProvedorDoEu, usarSessao } from '../sessao/sessao'
import type { Eu } from '../sessao/sessao'
import { Abas } from './Abas'
import { SeloDaMarca } from './Marca'

export function Casca() {
  const sessao = usarSessao()

  if (sessao.situacao === 'carregando') {
    return (
      <div className="pagina centrada" role="status" aria-label="Carregando">
        <Esqueleto forma="cartao" />
      </div>
    )
  }
  if (sessao.situacao === 'fora') return <Navigate to="/esqueci" replace />

  if (sessao.situacao === 'erro') {
    return (
      <section className="pagina centrada">
        <span className="selo-centrado">
          <SeloDaMarca />
        </span>
        <p className="aviso">{sessao.mensagem}</p>
        <Botao largo onClick={sessao.recarregar}>
          Tentar de novo
        </Botao>
      </section>
    )
  }

  return <Dentro eu={sessao.eu} />
}

function Dentro({ eu }: { eu: Eu }) {
  const sugestoes = usarContagemDeSugestoes()

  // O pacote do culto é melhor esforço: quem avisa da falha é o modo culto, não o app inteiro.
  useEffect(() => {
    baixarPacote().catch(() => {})
  }, [])

  return (
    <ProvedorDoEu eu={eu}>
      <ProvedorDeAvisos>
        <div className="casca">
          <main className="conteudo">
            <Outlet />
          </main>
          <Abas sugestoes={sugestoes} />
        </div>
      </ProvedorDeAvisos>
    </ProvedorDoEu>
  )
}

function usarContagemDeSugestoes(): number {
  const [quantas, guardar] = useState(0)
  const { pathname } = useLocation()

  useEffect(() => {
    const controle = new AbortController()

    api<{ sugestoes: SugestaoApresentada[] }>('/api/sugestoes', { sinal: controle.signal })
      .then(({ sugestoes }) => guardar(contarNovas(sugestoes, localStorage.getItem(CHAVE_DE_VISITA_DAS_SUGESTOES))))
      .catch(() => guardar(0))

    return () => controle.abort()
  }, [pathname])

  return quantas
}
