import { useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router'
import { api } from '../api/cliente'
import type { EscalaApresentada, Formacao } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import type { Acao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { usarAviso } from '../componentes/Avisos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Esqueleto } from '../componentes/Esqueleto'
import { Folha } from '../componentes/Folha'
import type { Funcao } from '../dominio'
import { formatarDia } from '../dominio'
import {
  alternarFuncao,
  alternarMinistro,
  comEntrada,
  entradaDoMembro,
  naoRecebeNotificacao,
  podeSerMinistro,
  saiDaEquipe,
  secoesDaEquipe,
} from '../escalas/equipe'
import type { EstadoNaEquipe, MembroComPush, SecaoDaEquipe } from '../escalas/equipe'
import { usarEu } from '../sessao/sessao'

function mensagemDoToggle(nome: string, oQue: string, jaTinha: boolean, proximo: EstadoNaEquipe): string {
  if (saiDaEquipe(proximo)) return `${nome} saiu da Equipe`
  return `${nome} ${jaTinha ? 'tirado' : 'escalado'} ${oQue}`
}

export function Equipe() {
  const { id = '' } = useParams()
  const eu = usarEu()
  const escala = usarBusca<EscalaApresentada>(`/api/escalas/${id}`)
  const pessoas = usarBusca<{ membros: MembroComPush[] }>('/api/membros')
  const papeis = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const formacoes = usarBusca<{ formacoes: Formacao[] }>('/api/formacoes')
  const acao = usarAcao()
  const avisar = usarAviso()
  const [salvando, abrirSalvar] = useState(false)
  const [escolhendo, abrirEscolha] = useState(false)

  const erro = escala.erro ?? pessoas.erro ?? papeis.erro ?? formacoes.erro
  const atual = escala.dados

  if (!eu.ministro && !eu.admin) return <Navigate to={`/escalas/${id}`} replace />

  const cabecalho = (
    <Cabecalho
      titulo="Equipe"
      sub={atual ? `${formatarDia(atual.data)} · toque na Função pra escalar` : undefined}
      voltarPara={`/escalas/${id}`}
      acao={
        <BotaoLink para={`/escalas/${id}`} pequeno>
          Concluir
        </BotaoLink>
      }
    />
  )

  if (erro) {
    return (
      <section className="pagina">
        {cabecalho}
        <p className="aviso">{erro}</p>
      </section>
    )
  }

  if (!atual || !pessoas.dados || !papeis.dados || !formacoes.dados) {
    return (
      <section className="pagina">
        {cabecalho}
        <Esqueleto forma="linha-de-musica" quantidade={4} />
      </section>
    )
  }

  const secoes = secoesDaEquipe(pessoas.dados.membros, papeis.dados.funcoes)
  const lista = formacoes.dados.formacoes

  const gravar = (membroId: string, proximo: EstadoNaEquipe, mensagem: string) => {
    escala.definir({ ...atual, equipe: comEntrada(atual.equipe, membroId, proximo) })
    avisar(mensagem)

    acao.executar(async () => {
      const caminho = `/api/escalas/${id}/equipe/${membroId}`
      const resposta = saiDaEquipe(proximo)
        ? await api<EscalaApresentada>(caminho, { metodo: 'DELETE' })
        : await api<EscalaApresentada>(caminho, { metodo: 'PUT', corpo: proximo })

      escala.definir(resposta)
    })
  }

  const aplicar = (formacaoId: string) => {
    abrirEscolha(false)

    acao.executar(async () => {
      escala.definir(
        await api<EscalaApresentada>(`/api/escalas/${id}/formacao`, { metodo: 'POST', corpo: { formacaoId } }),
      )
    })
  }

  return (
    <section className="pagina">
      {cabecalho}

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {secoes.map((secao) => (
        <Secao
          key={secao.chave}
          secao={secao}
          equipe={atual.equipe}
          acao={acao}
          gravar={gravar}
          formacoes={
            secao.chave === 'musicos' ? (
              <div className="chips formacao">
                <Botao
                  pequeno
                  disabled={acao.ocupado || lista.length === 0}
                  onClick={() => (lista.length === 1 ? aplicar(lista[0].id) : abrirEscolha(true))}
                >
                  {lista.length === 1 ? `Escalar a ${lista[0].nome}` : 'Escalar uma Formação'}
                </Botao>
                <Botao
                  variante="secundario"
                  pequeno
                  disabled={acao.ocupado || atual.equipe.length === 0}
                  onClick={() => abrirSalvar(true)}
                >
                  Salvar como Formação
                </Botao>
                <p className="dica">
                  Formação é um grupo de músicos guardado pra reusar: escalar traz todos de uma vez, salvar guarda os
                  que estão aqui agora.
                </p>
              </div>
            ) : null
          }
        />
      ))}

      {escolhendo && (
        <Folha titulo="Escalar uma Formação" fechar={() => abrirEscolha(false)}>
          <p className="dica">Põe todo mundo da Formação na Equipe de uma vez. Quem já está continua.</p>
          <ul className="lista">
            {lista.map((formacao) => (
              <li key={formacao.id}>
                <button type="button" className="toque" onClick={() => aplicar(formacao.id)}>
                  <span className="cresce">{formacao.nome}</span>
                  <span className="dica">
                    {formacao.entradas.length} {formacao.entradas.length === 1 ? 'Membro' : 'Membros'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Folha>
      )}

      {salvando && (
        <FolhaDeSalvar
          escalaId={id}
          equipe={atual.equipe}
          formacoes={lista}
          acao={acao}
          recarregar={formacoes.recarregar}
          fechar={() => abrirSalvar(false)}
        />
      )}
    </section>
  )
}

function Secao({
  secao,
  equipe,
  acao,
  gravar,
  formacoes,
}: {
  secao: SecaoDaEquipe
  equipe: EscalaApresentada['equipe']
  acao: Acao
  gravar: (membroId: string, proximo: EstadoNaEquipe, mensagem: string) => void
  formacoes: ReactNode
}) {
  return (
    <div className="secao">
      <div className="secao-topo">
        <h2>{secao.nome}</h2>
        {formacoes}
      </div>
      {secao.membros.length === 0 ? (
        <p className="dica">Ninguém com Função deste grupo ainda.</p>
      ) : (
        <ul className="lista cartao">
          {secao.membros.map(({ membro, funcoes }) => {
            const entrada = entradaDoMembro(equipe, membro.id)
            const escalado = Boolean(entrada?.funcoes.length || entrada?.ministro)
            const jaEraMinistro = entrada?.ministro ?? false
            const proximoMinistro = alternarMinistro(entrada)

            return (
              <li key={membro.id} className="pessoa">
                <span className="titulo cresce">
                  {membro.nome}
                  {naoRecebeNotificacao(membro, escalado) && (
                    <small className="dica"> · não recebe notificação</small>
                  )}
                </span>
                <span className="chips">
                  {funcoes.map((funcao) => {
                    const jaTinha = entrada?.funcoes.includes(funcao.id) ?? false
                    const proximo = alternarFuncao(entrada, funcao.id)

                    return (
                      <button
                        key={funcao.id}
                        type="button"
                        className={`chip${funcao.grupo === 'tecnica' ? ' tecnica' : ''}`}
                        aria-pressed={jaTinha}
                        onClick={() =>
                          gravar(membro.id, proximo, mensagemDoToggle(membro.nome, `no ${funcao.nome}`, jaTinha, proximo))
                        }
                      >
                        {funcao.nome}
                      </button>
                    )
                  })}
                  {podeSerMinistro(membro) && (
                    <button
                      type="button"
                      className="chip ministro"
                      aria-pressed={jaEraMinistro}
                      onClick={() =>
                        gravar(
                          membro.id,
                          proximoMinistro,
                          mensagemDoToggle(membro.nome, 'como Ministro', jaEraMinistro, proximoMinistro),
                        )
                      }
                    >
                      Ministro
                    </button>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {acao.ocupado && <span className="dica">salvando…</span>}
    </div>
  )
}

function FolhaDeSalvar({
  escalaId,
  equipe,
  formacoes,
  acao,
  recarregar,
  fechar,
}: {
  escalaId: string
  equipe: EscalaApresentada['equipe']
  formacoes: Formacao[]
  acao: Acao
  recarregar: () => void
  fechar: () => void
}) {
  const avisar = usarAviso()
  const [nome, escrever] = useState('')

  function atualizar(formacao: Formacao) {
    fechar()

    acao.executar(async () => {
      await api(`/api/formacoes/${formacao.id}`, {
        metodo: 'PATCH',
        corpo: { entradas: equipe.map(({ membroId, funcoes }) => ({ membroId, funcoes })) },
      })
      recarregar()
      avisar(`Formação ${formacao.nome} atualizada`)
    })
  }

  function criar() {
    fechar()

    acao.executar(async () => {
      await api('/api/formacoes', { metodo: 'POST', corpo: { nome: nome.trim(), escalaId } })
      recarregar()
      avisar(`Formação ${nome.trim()} criada`)
    })
  }

  return (
    <Folha titulo="Salvar como Formação" fechar={fechar}>
      <p className="dica">Guarda os Músicos que estão na Equipe agora.</p>

      {formacoes.length > 0 && (
        <ul className="lista">
          {formacoes.map((formacao) => (
            <li key={formacao.id}>
              <button type="button" className="toque" onClick={() => atualizar(formacao)}>
                <span className="cresce">Atualizar {formacao.nome}</span>
                <span className="dica">{formacao.entradas.length} agora</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="campo">
        <span className="rotulo">Nova Formação</span>
        <input value={nome} placeholder="Banda de domingo" onChange={(e) => escrever(e.target.value)} />
      </label>

      <Botao largo disabled={!nome.trim()} onClick={criar}>
        Criar Formação
      </Botao>
    </Folha>
  )
}
