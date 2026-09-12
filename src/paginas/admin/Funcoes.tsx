import { useState } from 'react'
import { ordensDepoisDeMover, porGrupo, proximaOrdem } from '../../admin/admin'
import { api } from '../../api/cliente'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Cabecalho } from '../../casca/Cabecalho'
import { Icone } from '../../casca/Icone'
import { Alca } from '../../componentes/Alca'
import { Botao } from '../../componentes/Botao'
import { Campo } from '../../componentes/Campo'
import { Esqueleto } from '../../componentes/Esqueleto'
import { Folha } from '../../componentes/Folha'
import { Segmento } from '../../componentes/Segmento'
import { Selo } from '../../componentes/Selo'
import { usarOrdenacao } from '../../componentes/usarOrdenacao'
import { Vazio } from '../../componentes/Vazio'
import type { Funcao, Grupo } from '../../dominio'

const GRUPOS: { valor: Grupo; rotulo: string }[] = [
  { valor: 'vocal', rotulo: 'Vocal' },
  { valor: 'instrumentos', rotulo: 'Músicos' },
  { valor: 'tecnica', rotulo: 'Som' },
]

const MINIMOS = ['0', '1', '2', '3', '4'].map((valor) => ({ valor, rotulo: valor }))

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
      <Cabecalho
        titulo="Funções"
        sub="O que cada Membro faz numa Equipe"
        voltarPara="/admin"
        acao={
          <Botao pequeno onClick={() => editar({ funcao: null })}>
            Nova
          </Botao>
        }
      />

      {papeis.erro && <p className="aviso">{papeis.erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      {papeis.carregando && <Esqueleto forma="linha-de-musica" quantidade={4} />}

      <p className="dica">Arraste pela alça pra mudar a ordem em que a Função aparece nas listas.</p>

      {porGrupo(funcoes).map((grupo) => (
        <div key={grupo.grupo} className="secao">
          <h2>{grupo.nome}</h2>

          {grupo.funcoes.length === 0 ? (
            <Vazio icone="lista">Nenhuma Função neste grupo.</Vazio>
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
  const [minimo, exigir] = useState(String(funcao?.minimo ?? 0))
  const [confirmando, confirmar] = useState(false)

  const valida = nome.trim().length > 0

  const salvar = () =>
    gravar(async () => {
      const corpo = { nome: nome.trim(), grupo, ordem: funcao?.ordem ?? ordemNova, minimo: Number(minimo) }

      if (funcao) await api(`/api/admin/funcoes/${funcao.id}`, { metodo: 'PATCH', corpo })
      else await api('/api/admin/funcoes', { metodo: 'POST', corpo })
    })

  const apagar = () => gravar(async () => void (await api(`/api/admin/funcoes/${funcao?.id}`, { metodo: 'DELETE' })))

  return (
    <Folha titulo={funcao ? funcao.nome : 'Nova Função'} fechar={fechar}>
      <Campo rotulo="Nome">
        <input value={nome} placeholder="Teclado" onChange={(evento) => escrever(evento.target.value)} />
      </Campo>

      <div className="campo">
        <span className="rotulo">Grupo</span>
        <Segmento rotulo="Grupo" opcoes={GRUPOS} valor={grupo} aoMudar={escolher} />
      </div>

      <div className="campo">
        <span className="rotulo">Mínimo por escala</span>
        <Segmento rotulo="Mínimo por escala" opcoes={MINIMOS} valor={minimo} aoMudar={exigir} />
        <span className="dica">0 não cobra</span>
      </div>

      <Botao largo disabled={!valida} onClick={salvar}>
        {funcao ? 'Salvar' : 'Criar Função'}
      </Botao>

      {funcao &&
        (confirmando ? (
          <>
            <p className="aviso">
              Apagar tira {funcao.nome} de todo mundo. Função já usada em alguma Equipe não apaga: edite o nome.
            </p>
            <Botao variante="perigo" largo onClick={apagar}>
              Confirmar
            </Botao>
          </>
        ) : (
          <Botao variante="perigo" largo onClick={() => confirmar(true)}>
            Apagar Função
          </Botao>
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
            {funcoes[original].minimo > 0 && <Selo>mín. {funcoes[original].minimo}</Selo>}
            <Icone nome="seta" />
          </button>
        </li>
      ))}
    </ul>
  )
}
