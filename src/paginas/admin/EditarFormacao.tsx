import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { alternar } from '../../admin/admin'
import { api } from '../../api/cliente'
import type { Formacao } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Barra } from '../../componentes/Barra'
import type { Funcao, Membro } from '../../dominio'
import { secoesDaEquipe } from '../../escalas/equipe'

type Entrada = { membroId: string; funcoes: string[] }

export function EditarFormacao() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const formacoes = usarBusca<{ formacoes: Formacao[] }>('/api/formacoes')
  const pessoas = usarBusca<{ membros: Membro[] }>('/api/membros')
  const papeis = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const acao = usarAcao()
  const [rascunho, mudar] = useState<{ nome: string; entradas: Entrada[] } | null>(null)
  const [confirmando, confirmar] = useState(false)

  const erro = formacoes.erro ?? pessoas.erro ?? papeis.erro
  const formacao = formacoes.dados?.formacoes.find((x) => x.id === id)

  if (erro) return <p className="aviso">{erro}</p>
  if (!formacoes.dados || !pessoas.dados || !papeis.dados) {
    return <div className="girando" role="status" aria-label="Carregando" />
  }
  if (!formacao) return <p className="aviso">Formação não encontrada.</p>

  const atual = rascunho ?? { nome: formacao.nome, entradas: formacao.entradas }

  const trocar = (membroId: string, funcaoId: string) => {
    const entrada = atual.entradas.find((x) => x.membroId === membroId)
    const funcoes = alternar(entrada?.funcoes ?? [], funcaoId)
    const semEle = atual.entradas.filter((x) => x.membroId !== membroId)

    mudar({ ...atual, entradas: funcoes.length ? [...semEle, { membroId, funcoes }] : semEle })
  }

  const salvar = () => {
    acao.executar(async () => {
      await api(`/api/formacoes/${id}`, {
        metodo: 'PATCH',
        corpo: { nome: atual.nome.trim(), entradas: atual.entradas },
      })
      navegar('/admin/formacoes')
    })
  }

  const apagar = () => {
    acao.executar(async () => {
      await api(`/api/formacoes/${id}`, { metodo: 'DELETE' })
      navegar('/admin/formacoes')
    })
  }

  const quantos = atual.entradas.length

  return (
    <section className="pagina">
      <Barra
        titulo={formacao.nome}
        sub={`${quantos} ${quantos === 1 ? 'Membro' : 'Membros'} · toque na Função pra incluir`}
        voltarPara="/admin/formacoes"
        acao={
          <button type="button" className="botao pequeno" disabled={acao.ocupado || !atual.nome.trim()} onClick={salvar}>
            Salvar
          </button>
        }
      />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <label className="campo">
        <span className="rotulo">Nome</span>
        <input value={atual.nome} onChange={(evento) => mudar({ ...atual, nome: evento.target.value })} />
      </label>

      <p className="dica">A marca de Ministro não entra na Formação: ela é decidida em cada Escala.</p>

      {secoesDaEquipe(pessoas.dados.membros, papeis.dados.funcoes).map((secao) => (
        <div key={secao.chave} className="secao">
          <h2>{secao.nome}</h2>

          {secao.membros.length === 0 ? (
            <p className="dica">Ninguém com Função deste naipe.</p>
          ) : (
            <ul className="lista cartao">
              {secao.membros.map(({ membro, funcoes }) => {
                const entrada = atual.entradas.find((x) => x.membroId === membro.id)

                return (
                  <li key={membro.id} className="pessoa">
                    <span className="titulo cresce">{membro.nome}</span>
                    <span className="chips">
                      {funcoes.map((funcao) => (
                        <button
                          key={funcao.id}
                          type="button"
                          className={`chip${funcao.naipe === 'tecnica' ? ' tecnica' : ''}`}
                          aria-pressed={entrada?.funcoes.includes(funcao.id) ?? false}
                          onClick={() => trocar(membro.id, funcao.id)}
                        >
                          {funcao.nome}
                        </button>
                      ))}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ))}

      {confirmando ? (
        <>
          <p className="aviso">Apagar a Formação não mexe em nenhuma Escala já montada com ela.</p>
          <button type="button" className="botao perigo largo" disabled={acao.ocupado} onClick={apagar}>
            Confirmar
          </button>
        </>
      ) : (
        <button type="button" className="botao perigo largo" onClick={() => confirmar(true)}>
          Apagar Formação
        </button>
      )}
    </section>
  )
}
