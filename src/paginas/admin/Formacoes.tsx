import { useState } from 'react'
import { Link } from 'react-router'
import { resumoDaFormacao } from '../../admin/admin'
import { api } from '../../api/cliente'
import type { Formacao } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Barra } from '../../componentes/Barra'
import { Folha } from '../../componentes/Folha'
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
      <Barra
        titulo="Formações"
        sub="Grupos que a Equipe aplica de uma vez"
        voltarPara="/admin"
        acao={
          <button type="button" className="botao pequeno" onClick={() => abrirCriacao(true)}>
            Nova
          </button>
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
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {formacoes.dados && lista.length === 0 && <p className="vazio">Nenhuma Formação ainda.</p>}

      {criando && <FolhaDeCriar fechar={() => abrirCriacao(false)} criar={criar} />}
    </section>
  )
}

function FolhaDeCriar({ fechar, criar }: { fechar: () => void; criar: (nome: string) => void }) {
  const [nome, escrever] = useState('')

  return (
    <Folha titulo="Nova Formação" fechar={fechar}>
      <label className="campo">
        <span className="rotulo">Nome</span>
        <input value={nome} placeholder="Banda" onChange={(evento) => escrever(evento.target.value)} />
      </label>
      <p className="dica">Ela nasce vazia; monte quem entra na tela seguinte.</p>
      <button type="button" className="botao largo" disabled={!nome.trim()} onClick={() => criar(nome.trim())}>
        Criar Formação
      </button>
    </Folha>
  )
}
