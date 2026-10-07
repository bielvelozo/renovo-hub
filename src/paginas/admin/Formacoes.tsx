import { useState } from 'react'
import { Link } from 'react-router'
import { resumoDaFormacao } from '../../admin/admin'
import { api } from '../../api/cliente'
import type { Formacao } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Cabecalho } from '../../casca/Cabecalho'
import { Icone } from '../../casca/Icone'
import { Botao } from '../../componentes/Botao'
import { Campo } from '../../componentes/Campo'
import { Folha } from '../../componentes/Folha'
import { Vazio } from '../../componentes/Vazio'
import type { Funcao, Membro } from '../../dominio'

export function Formacoes() {
  const formacoes = usarBusca<{ formacoes: Formacao[] }>('/api/formacoes')
  const pessoas = usarBusca<{ membros: Membro[] }>('/api/membros')
  const papeis = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const acao = usarAcao()
  const [criando, abrirCriacao] = useState(false)

  const erro = formacoes.erro ?? pessoas.erro ?? papeis.erro
  const lista = formacoes.dados?.formacoes ?? []
  const membros = pessoas.dados?.membros
  const funcoes = papeis.dados?.funcoes

  const criar = (nome: string) => {
    abrirCriacao(false)

    acao.executar(async () => {
      await api('/api/formacoes', { metodo: 'POST', corpo: { nome } })
      formacoes.recarregar()
    })
  }

  return (
    <section className="pagina">
      <Cabecalho
        titulo="Formações"
        sub="Grupos de músicos pra escalar de uma vez"
        voltarPara="/admin"
        acao={
          <Botao pequeno onClick={() => abrirCriacao(true)}>
            Nova
          </Botao>
        }
      />

      {erro && <p className="aviso">{erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {lista.length > 0 && membros && funcoes && (
        <ul className="lista cartao">
          {lista.map((formacao) => (
            <li key={formacao.id}>
              <Link to={`/admin/formacoes/${formacao.id}`} className="toque">
                <span className="cresce">
                  <span className="titulo">{formacao.nome}</span>
                  <span className="dica">{resumoDaFormacao(formacao, membros, funcoes)}</span>
                </span>
                <Icone nome="seta" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {formacoes.dados && lista.length === 0 && <Vazio icone="pessoa">Nenhuma formação ainda.</Vazio>}

      {criando && <FolhaDeCriar fechar={() => abrirCriacao(false)} criar={criar} />}
    </section>
  )
}

function FolhaDeCriar({ fechar, criar }: { fechar: () => void; criar: (nome: string) => void }) {
  const [nome, escrever] = useState('')

  return (
    <Folha titulo="Nova formação" fechar={fechar}>
      <Campo rotulo="Nome">
        <input value={nome} placeholder="Banda" onChange={(evento) => escrever(evento.target.value)} />
      </Campo>
      <Botao largo disabled={!nome.trim()} onClick={() => criar(nome.trim())}>
        Criar formação
      </Botao>
    </Folha>
  )
}
