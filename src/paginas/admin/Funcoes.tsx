import { useState } from 'react'
import { ordensDepoisDeMover, porGrupo, proximaOrdem } from '../../admin/admin'
import { api } from '../../api/cliente'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Barra } from '../../componentes/Barra'
import { Alca } from '../../componentes/Alca'
import { Folha } from '../../componentes/Folha'
import { usarOrdenacao } from '../../componentes/usarOrdenacao'
import type { Funcao, Grupo } from '../../dominio'

const GRUPOS: { valor: Grupo; rotulo: string }[] = [
  { valor: 'vocal', rotulo: 'Vocal' },
  { valor: 'instrumentos', rotulo: 'Músicos' },
  { valor: 'tecnica', rotulo: 'Som' },
]

export function Funcoes() {
  const papeis = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const acao = usarAcao()
  const [edicao, editar] = useState<{ funcao: Funcao | null } | null>(null)

  const funcoes = papeis.dados?.funcoes ?? []

  const reordenar = (grupo: Grupo, de: number, para: number) =>
    acao.executar(async () => {
      for (const nova of ordensDepoisDeMover(funcoes, grupo, de, para)) {
        await api(`/api/admin/funcoes/${nova.id}`, { metodo: 'PATCH', corpo: { ordem: nova.ordem } })
      }
      papeis.recarregar()
    })

  return (
    <section className="pagina">
      <Barra
        titulo="Funções"
        sub="O que cada Membro faz numa Equipe"
        voltarPara="/admin"
        acao={
          <button type="button" className="botao pequeno" onClick={() => editar({ funcao: null })}>
            Nova
          </button>
        }
      />

      {papeis.erro && <p className="aviso">{papeis.erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      {papeis.carregando && <div className="girando" role="status" aria-label="Carregando" />}

      <p className="dica">Arraste pela alça pra mudar a ordem em que a Função aparece nas listas.</p>

      {porGrupo(funcoes).map((grupo) => (
        <div key={grupo.grupo} className="secao">
          <h2>{grupo.nome}</h2>

          {grupo.funcoes.length === 0 ? (
            <p className="vazio">Nenhuma Função neste grupo.</p>
          ) : (
            <ListaDeFuncoes
              funcoes={grupo.funcoes}
              aoMover={(de, para) => reordenar(grupo.grupo, de, para)}
              editar={(funcao) => editar({ funcao })}
            />
          )}
        </div>
      ))}

      {edicao && (
        <FolhaDaFuncao
          funcao={edicao.funcao}
          ordemNova={proximaOrdem(funcoes)}
          fechar={() => editar(null)}
          gravar={(tarefa) => {
            editar(null)
            acao.executar(async () => {
              await tarefa()
              papeis.recarregar()
            })
          }}
        />
      )}
    </section>
  )
}

function FolhaDaFuncao({
  funcao,
  ordemNova,
  fechar,
  gravar,
}: {
  funcao: Funcao | null
  ordemNova: number
  fechar: () => void
  gravar: (tarefa: () => Promise<void>) => void
}) {
  const [nome, escrever] = useState(funcao?.nome ?? '')
  const [grupo, escolher] = useState<Grupo>(funcao?.grupo ?? 'instrumentos')
  const [confirmando, confirmar] = useState(false)

  const valida = nome.trim().length > 0

  const salvar = () =>
    gravar(async () => {
      const corpo = { nome: nome.trim(), grupo, ordem: funcao?.ordem ?? ordemNova }

      if (funcao) await api(`/api/admin/funcoes/${funcao.id}`, { metodo: 'PATCH', corpo })
      else await api('/api/admin/funcoes', { metodo: 'POST', corpo })
    })

  const apagar = () => gravar(async () => void (await api(`/api/admin/funcoes/${funcao?.id}`, { metodo: 'DELETE' })))

  return (
    <Folha titulo={funcao ? funcao.nome : 'Nova Função'} fechar={fechar}>
      <label className="campo">
        <span className="rotulo">Nome</span>
        <input value={nome} placeholder="Teclado" onChange={(evento) => escrever(evento.target.value)} />
      </label>

      <div className="campo">
        <span className="rotulo">Grupo</span>
        <div className="segmento" role="group" aria-label="Grupo">
          {GRUPOS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={opcao.valor === grupo}
              onClick={() => escolher(opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="botao largo" disabled={!valida} onClick={salvar}>
        {funcao ? 'Salvar' : 'Criar Função'}
      </button>

      {funcao &&
        (confirmando ? (
          <>
            <p className="aviso">
              Apagar tira {funcao.nome} de todo mundo. Função já usada em alguma Equipe não apaga: edite o nome.
            </p>
            <button type="button" className="botao perigo largo" onClick={apagar}>
              Confirmar
            </button>
          </>
        ) : (
          <button type="button" className="botao perigo largo" onClick={() => confirmar(true)}>
            Apagar Função
          </button>
        ))}
    </Folha>
  )
}

function ListaDeFuncoes({
  funcoes,
  aoMover,
  editar,
}: {
  funcoes: Funcao[]
  aoMover: (de: number, para: number) => void
  editar: (funcao: Funcao) => void
}) {
  const ordenacao = usarOrdenacao(funcoes.length, aoMover)

  return (
    <ul className="lista cartao">
      {ordenacao.ordem.map((original, indice) => (
        <li
          key={funcoes[original].id}
          className={`item${ordenacao.arrastando === indice ? ' arrastando' : ''}`}
          ref={ordenacao.linha(indice)}
        >
          <Alca rotulo={funcoes[original].nome} {...ordenacao.alca(indice)} />
          <button type="button" className="toque" onClick={() => editar(funcoes[original])}>
            <span className="cresce">
              <span className="titulo">{funcoes[original].nome}</span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
