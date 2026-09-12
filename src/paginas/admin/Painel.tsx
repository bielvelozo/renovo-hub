import { useState } from 'react'
import { Link } from 'react-router'
import { SECOES } from '../../admin/admin'
import { api } from '../../api/cliente'
import type { Configuracoes } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Cabecalho } from '../../casca/Cabecalho'
import { Icone } from '../../casca/Icone'
import { usarAviso } from '../../componentes/Avisos'
import { Folha } from '../../componentes/Folha'
import { Segmento } from '../../componentes/Segmento'

const SEMANAS = ['2', '4', '6', '8'] as const

export function Painel() {
  const configuracoes = usarBusca<Configuracoes>('/api/admin/configuracoes')
  const acao = usarAcao()
  const avisar = usarAviso()
  const [folha, abrirFolha] = useState(false)
  const semanas = configuracoes.dados?.semanasDeRepeticao

  const salvar = (valor: (typeof SEMANAS)[number]) =>
    acao.executar(async () => {
      configuracoes.definir(
        await api<Configuracoes>('/api/admin/configuracoes', {
          metodo: 'PATCH',
          corpo: { semanasDeRepeticao: Number(valor) },
        }),
      )
      avisar('Limite salvo')
      abrirFolha(false)
    })

  return (
    <section className="pagina">
      <Cabecalho titulo="Admin" voltarPara="/perfil" />

      {configuracoes.erro && <p className="aviso">{configuracoes.erro}</p>}

      <ul className="lista cartao">
        <li>
          <button type="button" className="toque" disabled={!semanas} onClick={() => abrirFolha(true)}>
            <span className="cresce">
              <span className="titulo">Repertório</span>
              <span className="dica">alerta de repetição: {semanas ? `${semanas} semanas` : '…'}</span>
            </span>
            <Icone nome="seta" />
          </button>
        </li>
      </ul>

      <ul className="lista cartao">
        {SECOES.map((secao) => (
          <li key={secao.caminho}>
            <Link to={secao.caminho} className="toque">
              <span className="cresce">
                <span className="titulo">{secao.titulo}</span>
                <span className="dica">{secao.dica}</span>
              </span>
              <Icone nome="seta" />
            </Link>
          </li>
        ))}
      </ul>

      {folha && semanas && (
        <Folha titulo="Alerta de repetição" fechar={() => abrirFolha(false)}>
          <p className="dica">
            Música tocada há menos tempo que isso aparece com alerta no catálogo, na tela da música e nas sugestões.
          </p>
          {acao.erro && <p className="aviso">{acao.erro}</p>}
          <Segmento
            rotulo="Semanas"
            opcoes={SEMANAS.map((valor) => ({ valor, rotulo: `${valor} sem.` }))}
            valor={String(semanas) as (typeof SEMANAS)[number]}
            aoMudar={salvar}
            desligado={acao.ocupado}
          />
        </Folha>
      )}
    </section>
  )
}
