import { useState } from 'react'
import { porNaipe, proximaOrdem } from '../../admin/admin'
import { api } from '../../api/cliente'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Barra } from '../../componentes/Barra'
import { Folha } from '../../componentes/Folha'
import type { Funcao, Naipe } from '../../dominio'

const NAIPES: { valor: Naipe; rotulo: string }[] = [
  { valor: 'vocal', rotulo: 'Vocal' },
  { valor: 'instrumentos', rotulo: 'Músicos' },
  { valor: 'tecnica', rotulo: 'Som' },
]

export function Funcoes() {
  const papeis = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const acao = usarAcao()
  const [edicao, editar] = useState<{ funcao: Funcao | null } | null>(null)

  const funcoes = papeis.dados?.funcoes ?? []

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

      <p className="dica">
A ordem manda na posição em todas as listas.
      </p>

      {porNaipe(funcoes).map((grupo) => (
        <div key={grupo.naipe} className="secao">
          <h2>{grupo.nome}</h2>

          {grupo.funcoes.length === 0 ? (
            <p className="dica">Nenhuma Função neste naipe.</p>
          ) : (
            <ul className="lista cartao">
              {grupo.funcoes.map((funcao) => (
                <li key={funcao.id}>
                  <button type="button" className="toque" onClick={() => editar({ funcao })}>
                    <span className="cresce">
                      <span className="titulo">{funcao.nome}</span>
                      <span className="dica">ordem {funcao.ordem}</span>
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                </li>
              ))}
            </ul>
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
  const [naipe, escolher] = useState<Naipe>(funcao?.naipe ?? 'instrumentos')
  const [ordem, mudarOrdem] = useState(String(funcao?.ordem ?? ordemNova))
  const [confirmando, confirmar] = useState(false)

  const numero = Number(ordem)
  const valida = nome.trim().length > 0 && Number.isInteger(numero)

  const salvar = () =>
    gravar(async () => {
      const corpo = { nome: nome.trim(), naipe, ordem: numero }

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
        <span className="rotulo">Naipe</span>
        <div className="segmento" role="group" aria-label="Naipe">
          {NAIPES.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              aria-pressed={opcao.valor === naipe}
              onClick={() => escolher(opcao.valor)}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      <label className="campo">
        <span className="rotulo">Ordem</span>
        <input inputMode="numeric" value={ordem} onChange={(evento) => mudarOrdem(evento.target.value)} />
      </label>

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
