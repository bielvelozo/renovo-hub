import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { alternar } from '../../admin/admin'
import { api } from '../../api/cliente'
import type { Formacao } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Cabecalho } from '../../casca/Cabecalho'
import { usarAviso } from '../../componentes/Avisos'
import { Botao } from '../../componentes/Botao'
import { Campo } from '../../componentes/Campo'
import { Esqueleto } from '../../componentes/Esqueleto'
import { RodapeDeAcao } from '../../componentes/RodapeDeAcao'
import { Vazio } from '../../componentes/Vazio'
import type { Funcao, Membro } from '../../dominio'
import { musicosDaFormacao } from '../../escalas/equipe'

type Entrada = { membroId: string; funcoes: string[] }

export function EditarFormacao() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const avisar = usarAviso()
  const formacoes = usarBusca<{ formacoes: Formacao[] }>('/api/formacoes')
  const pessoas = usarBusca<{ membros: Membro[] }>('/api/membros')
  const papeis = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const acao = usarAcao()
  const [rascunho, mudar] = useState<{ nome: string; entradas: Entrada[] } | null>(null)
  const [confirmando, confirmar] = useState(false)

  const erro = formacoes.erro ?? pessoas.erro ?? papeis.erro
  const formacao = formacoes.dados?.formacoes.find((x) => x.id === id)

  const cabecalho = <Cabecalho titulo={formacao?.nome ?? 'Formação'} voltarPara="/admin/formacoes" />

  if (erro) {
    return (
      <section className="pagina">
        {cabecalho}
        <p className="aviso">{erro}</p>
      </section>
    )
  }

  if (!formacoes.dados || !pessoas.dados || !papeis.dados) {
    return (
      <section className="pagina">
        {cabecalho}
        <Esqueleto forma="paragrafo" />
      </section>
    )
  }

  if (!formacao) {
    return (
      <section className="pagina">
        {cabecalho}
        <p className="aviso">Formação não encontrada.</p>
      </section>
    )
  }

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
      avisar('Formação salva')
      navegar('/admin/formacoes')
    })
  }

  const apagar = () => {
    acao.executar(async () => {
      await api(`/api/formacoes/${id}`, { metodo: 'DELETE' })
      navegar('/admin/formacoes')
    })
  }

  const musicos = musicosDaFormacao(pessoas.dados.membros, papeis.dados.funcoes)
  const quantos = atual.entradas.length

  return (
    <section className="pagina">
      <Cabecalho
        titulo={formacao.nome}
        sub={`${quantos} ${quantos === 1 ? 'membro' : 'membros'} · toque na função pra incluir`}
        voltarPara="/admin/formacoes"
      />

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <Campo rotulo="Nome">
        <input value={atual.nome} onChange={(evento) => mudar({ ...atual, nome: evento.target.value })} />
      </Campo>

      <div className="secao">
        <h2>Músicos</h2>

        {musicos.length === 0 ? (
          <Vazio icone="pessoa">Ninguém com função de instrumento.</Vazio>
        ) : (
          <ul className="lista cartao">
            {musicos.map(({ membro, funcoes }) => {
              const entrada = atual.entradas.find((x) => x.membroId === membro.id)

              return (
                <li key={membro.id} className="pessoa">
                  <span className="titulo cresce">{membro.nome}</span>
                  <span className="chips">
                    {funcoes.map((funcao) => (
                      <button
                        key={funcao.id}
                        type="button"
                        className="chip"
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

      {confirmando ? (
        <>
          <p className="aviso">Apagar {formacao.nome}?</p>
          <Botao variante="perigo" largo disabled={acao.ocupado} onClick={apagar}>
            Confirmar
          </Botao>
        </>
      ) : (
        <Botao variante="perigo" largo onClick={() => confirmar(true)}>
          Apagar formação
        </Botao>
      )}

      <RodapeDeAcao
        primario={
          <Botao largo disabled={acao.ocupado || !atual.nome.trim()} onClick={salvar}>
            Salvar formação
          </Botao>
        }
      />
    </section>
  )
}
