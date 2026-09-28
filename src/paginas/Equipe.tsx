import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router'
import { api, textoDoErro } from '../api/cliente'
import type { EscalaApresentada, Formacao } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import type { Acao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { usarAviso } from '../componentes/Avisos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Busca } from '../componentes/Busca'
import { Esqueleto } from '../componentes/Esqueleto'
import { Folha } from '../componentes/Folha'
import { Menu } from '../componentes/Menu'
import { Selo } from '../componentes/Selo'
import type { Funcao } from '../dominio'
import { formatarDia, hojeEmBrasilia, normalizarTexto } from '../dominio'
import {
  PESSOAS_PARA_BUSCA,
  alternarFuncao,
  alternarMinistro,
  comEntrada,
  entradaDoMembro,
  memoriaDoMembro,
  mensagemDaFuncao,
  mensagemDoMinistro,
  naoRecebeNotificacao,
  ordenarPorEscalados,
  podeSerMinistro,
  resumoDaEquipe,
  saiDaEquipe,
  secoesDaEquipe,
  semNotificacao,
  textoDeSemNotificacao,
} from '../escalas/equipe'
import type { EstadoNaEquipe, MembroComPush, SecaoDaEquipe } from '../escalas/equipe'
import { inicialDoNome } from '../perfil/perfil'
import { marcarTarefa } from '../guia/andamento'
import { usarEu } from '../sessao/sessao'

const EXPLICACAO_DA_FORMACAO =
  'Formação é um grupo de músicos guardado pra reusar: escalar traz todos de uma vez, salvar guarda os que estão aqui agora.'

const AVISO_DO_SINO = 'não vai receber aviso pelo app; combine pelo WhatsApp'

export function Equipe() {
  const { id = '' } = useParams()
  const [parametros] = useSearchParams()
  const eu = usarEu()
  const escala = usarBusca<EscalaApresentada>(`/api/escalas/${id}`)
  const pessoas = usarBusca<{ membros: MembroComPush[] }>('/api/membros')
  const papeis = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const formacoes = usarBusca<{ formacoes: Formacao[] }>('/api/formacoes')
  const acao = usarAcao()

  const erro = escala.erro ?? pessoas.erro ?? papeis.erro ?? formacoes.erro
  const atual = escala.dados

  if (!eu.ministro && !eu.admin) return <Navigate to={`/escalas/${id}`} replace />

  const cabecalho = (
    <Cabecalho
      titulo="Equipe"
      sub={atual ? formatarDia(atual.data) : undefined}
      voltarPara={`/escalas/${id}`}
      acao={
        <BotaoLink para={`/escalas/${id}`} pequeno data-guia="pronto-equipe">
          Pronto
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

  return (
    <section className="pagina">
      {cabecalho}

      <CorpoDaEquipe
        escala={atual}
        definir={escala.definir}
        membros={pessoas.dados.membros}
        funcoes={papeis.dados.funcoes}
        formacoes={formacoes.dados.formacoes}
        acao={acao}
        recarregarFormacoes={formacoes.recarregar}
        funcaoEmFoco={parametros.get('funcao')}
      />
    </section>
  )
}

export function CorpoDaEquipe({
  escala,
  definir,
  membros,
  funcoes,
  formacoes,
  acao,
  recarregarFormacoes,
  funcaoEmFoco = null,
  hoje = hojeEmBrasilia(),
}: {
  escala: EscalaApresentada
  definir: (escala: EscalaApresentada) => void
  membros: MembroComPush[]
  funcoes: Funcao[]
  formacoes: Formacao[]
  acao: Acao
  recarregarFormacoes: () => void
  funcaoEmFoco?: string | null
  hoje?: string
}) {
  const avisar = usarAviso()
  const [salvando, abrirSalvar] = useState(false)
  const [explicando, explicar] = useState(false)

  const secoes = secoesDaEquipe(membros, funcoes)
  const grupoEmFoco = funcoes.find((funcao) => funcao.id === funcaoEmFoco)?.grupo ?? null
  const resumo = resumoDaEquipe(funcoes, escala.equipe, membros)
  const mudos = semNotificacao(membros, escala.equipe)
  const lembrete = textoDeSemNotificacao(mudos)

  const gravar = (membroId: string, proximo: EstadoNaEquipe, mensagem: string) => {
    definir({ ...escala, equipe: comEntrada(escala.equipe, membroId, proximo) })
    avisar(mensagem)

    acao.executar(async () => {
      const caminho = `/api/escalas/${escala.id}/equipe/${membroId}`
      try {
        const resposta = saiDaEquipe(proximo)
          ? await api<EscalaApresentada>(caminho, { metodo: 'DELETE' })
          : await api<EscalaApresentada>(caminho, { metodo: 'PUT', corpo: proximo })

        definir(resposta)
        marcarTarefa('montar-equipe')
      } catch (problema) {
        definir(escala)
        avisar(textoDoErro(problema))
      }
    })
  }

  const aplicar = (formacao: Formacao) =>
    acao.executar(async () => {
      definir(
        await api<EscalaApresentada>(`/api/escalas/${escala.id}/formacao`, {
          metodo: 'POST',
          corpo: { formacaoId: formacao.id },
        }),
      )
      avisar(`${formacao.nome} escalada: ${formacao.entradas.length} pessoas`)
      marcarTarefa('montar-equipe')
    })

  const copiarNomes = async () => {
    try {
      await navigator.clipboard.writeText(mudos.join(', '))
      avisar('Copiado')
    } catch {
      // Sem permissão de área de transferência: o Ministro copia os nomes à mão.
    }
  }

  return (
    <>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <div className="selos resumo-da-equipe">
        {resumo.map((selo) => (
          <Selo key={selo.chave} variante={selo.variante}>
            {selo.texto}
          </Selo>
        ))}
      </div>

      {lembrete && (
        <p className="dica sem-notificacao">
          <span className="cresce">{lembrete}</span>
          <Botao variante="terciario" pequeno onClick={copiarNomes}>
            Copiar nomes
          </Botao>
        </p>
      )}

      {secoes.map((secao) => (
        <Secao
          key={secao.chave}
          secao={secao}
          equipe={escala.equipe}
          acao={acao}
          gravar={gravar}
          hoje={hoje}
          emFoco={secao.grupo === grupoEmFoco}
          titulo={
            secao.chave === 'musicos' ? (
              <span className="acao-da-formacao" data-guia="formacao">
                {formacoes.length === 0 ? null : formacoes.length === 1 ? (
                  <Botao variante="secundario" pequeno disabled={acao.ocupado} onClick={() => aplicar(formacoes[0])}>
                    Escalar a {formacoes[0].nome}
                  </Botao>
                ) : (
                  <Menu
                    rotulo="Escalar uma Formação"
                    itens={formacoes.map((formacao) => ({
                      rotulo: formacao.nome,
                      aoEscolher: () => aplicar(formacao),
                    }))}
                    gatilho={
                      <Botao variante="secundario" pequeno disabled={acao.ocupado}>
                        Escalar <Icone nome="seta" />
                      </Botao>
                    }
                  />
                )}
                <Botao
                  variante="icone"
                  aria-label="O que é uma Formação"
                  aria-expanded={explicando}
                  onClick={() => explicar(!explicando)}
                >
                  ?
                </Botao>
              </span>
            ) : null
          }
          rodape={
            secao.chave === 'musicos' ? (
              <>
                {explicando && <p className="dica">{EXPLICACAO_DA_FORMACAO}</p>}
                <Botao
                  variante="terciario"
                  pequeno
                  disabled={acao.ocupado || escala.equipe.length === 0}
                  onClick={() => abrirSalvar(true)}
                >
                  Salvar como formação
                </Botao>
              </>
            ) : null
          }
        />
      ))}

      {salvando && (
        <FolhaDeSalvar
          escalaId={escala.id}
          equipe={escala.equipe}
          formacoes={formacoes}
          acao={acao}
          recarregar={recarregarFormacoes}
          fechar={() => abrirSalvar(false)}
        />
      )}
    </>
  )
}

function Secao({
  secao,
  equipe,
  acao,
  gravar,
  hoje,
  titulo,
  rodape,
  emFoco = false,
}: {
  secao: SecaoDaEquipe
  equipe: EscalaApresentada['equipe']
  acao: Acao
  gravar: (membroId: string, proximo: EstadoNaEquipe, mensagem: string) => void
  hoje: string
  titulo: ReactNode
  rodape: ReactNode
  emFoco?: boolean
}) {
  const [termo, buscar] = useState('')
  const cabecalho = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!emFoco || !cabecalho.current) return
    cabecalho.current.scrollIntoView?.({ block: 'start' })
    cabecalho.current.focus({ preventScroll: true })
  }, [emFoco])

  const ordenadas = ordenarPorEscalados(secao.membros, equipe)
  const busca = normalizarTexto(termo)
  const linhas = busca ? ordenadas.filter((linha) => normalizarTexto(linha.membro.nome).includes(busca)) : ordenadas

  return (
    <div className="secao">
      <div className="secao-topo">
        <h2 ref={cabecalho} tabIndex={emFoco ? -1 : undefined}>
          {secao.nome}
        </h2>
        {titulo}
      </div>

      {secao.membros.length > PESSOAS_PARA_BUSCA && (
        <Busca valor={termo} aoMudar={buscar} rotulo={`Buscar em ${secao.nome}`} placeholder="nome da pessoa" />
      )}

      {secao.membros.length === 0 ? (
        <p className="dica">Ninguém com Função deste grupo ainda.</p>
      ) : (
        <ul className="lista cartao">
          {linhas.map(({ membro, funcoes }) => (
            <Pessoa key={membro.id} membro={membro} funcoes={funcoes} equipe={equipe} gravar={gravar} hoje={hoje} />
          ))}
        </ul>
      )}

      {rodape}

      {acao.ocupado && <span className="dica">salvando…</span>}
    </div>
  )
}

function Pessoa({
  membro,
  funcoes,
  equipe,
  gravar,
  hoje,
}: {
  membro: MembroComPush
  funcoes: Funcao[]
  equipe: EscalaApresentada['equipe']
  gravar: (membroId: string, proximo: EstadoNaEquipe, mensagem: string) => void
  hoje: string
}) {
  const [avisando, avisarDoSino] = useState(false)

  const entrada = entradaDoMembro(equipe, membro.id)
  const escalado = Boolean(entrada?.funcoes.length || entrada?.ministro)
  const jaEraMinistro = entrada?.ministro ?? false
  const proximoMinistro = alternarMinistro(entrada)
  const memoria = memoriaDoMembro(membro, hoje)

  return (
    <li className="pessoa">
      <span className="inicial pequena" aria-hidden="true">
        {inicialDoNome(membro.nome)}
      </span>

      <span className="cresce grupo">
        <span className="titulo">{membro.nome}</span>
        <span className="memoria">
          <span className="dica">{memoria.texto}</span>
          {memoria.alerta && <Selo variante="atencao">{memoria.alerta}</Selo>}
        </span>
      </span>

      {naoRecebeNotificacao(membro, escalado) && (
        <Botao
          variante="icone"
          icone="sino-cortado"
          aria-label={`${membro.nome} ${AVISO_DO_SINO}`}
          aria-expanded={avisando}
          onClick={() => avisarDoSino(!avisando)}
        />
      )}

      <span className="chips" data-guia="funcao">
        {funcoes.map((funcao) => {
          const jaTinha = entrada?.funcoes.includes(funcao.id) ?? false
          const proximo = alternarFuncao(entrada, funcao.id)

          return (
            <button
              key={funcao.id}
              type="button"
              className={`chip${funcao.grupo === 'tecnica' ? ' tecnica' : ''}`}
              aria-pressed={jaTinha}
              onClick={() => gravar(membro.id, proximo, mensagemDaFuncao(membro.nome, funcao.nome, jaTinha, proximo))}
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
              gravar(membro.id, proximoMinistro, mensagemDoMinistro(membro.nome, jaEraMinistro, proximoMinistro))
            }
          >
            Ministro
          </button>
        )}
      </span>

      {avisando && <p className="dica aviso-do-sino">{AVISO_DO_SINO}</p>}
    </li>
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
    <Folha titulo="Salvar como formação" fechar={fechar}>
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
