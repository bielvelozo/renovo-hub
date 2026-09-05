import { useState } from 'react'
import { alternar, avisoDeRemocao, porNaipe, resumoDeAcesso, textoDaRemocao } from '../../admin/admin'
import { api } from '../../api/cliente'
import type { MembroComAcesso } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Barra } from '../../componentes/Barra'
import { Folha } from '../../componentes/Folha'
import type { Funcao, Membro } from '../../dominio'
import { usarEu } from '../../sessao/sessao'

type EmEdicao = { membro: MembroComAcesso | null }

export function Membros() {
  const membros = usarBusca<{ membros: MembroComAcesso[] }>('/api/admin/membros')
  const papeis = usarBusca<{ funcoes: Funcao[] }>('/api/funcoes')
  const acao = usarAcao()
  const [edicao, editar] = useState<EmEdicao | null>(null)
  const [recado, avisar] = useState<string | null>(null)

  const erro = membros.erro ?? papeis.erro
  const lista = membros.dados?.membros ?? []

  return (
    <section className="pagina">
      <Barra
        titulo="Membros"
        sub={`${lista.length} ${lista.length === 1 ? 'cadastrado' : 'cadastrados'}`}
        voltarPara="/admin"
        acao={
          <button type="button" className="botao pequeno" onClick={() => editar({ membro: null })}>
            Novo
          </button>
        }
      />

      {erro && <p className="aviso">{erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      {recado && <p className="dica">{recado}</p>}
      {(membros.carregando || papeis.carregando) && <div className="girando" role="status" aria-label="Carregando" />}

      {lista.length > 0 && (
        <ul className="lista cartao">
          {lista.map((membro) => (
            <li key={membro.id}>
              <button type="button" className="toque" onClick={() => editar({ membro })}>
                <span className="cresce">
                  <span className="titulo">
                    {membro.nome}
                    {membro.inativo && <span className="selo cancelada">inativo</span>}
                  </span>
                  <span className="dica">{papeisEFuncoes(membro, papeis.dados?.funcoes ?? [])}</span>
                  <span className="dica">{resumoDeAcesso(membro)}</span>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {membros.dados && lista.length === 0 && <p className="vazio">Nenhum Membro cadastrado ainda.</p>}

      {edicao && papeis.dados && (
        <FolhaDoMembro
          membro={edicao.membro}
          funcoes={papeis.dados.funcoes}
          fechar={() => editar(null)}
          gravar={(tarefa) => {
            editar(null)
            acao.executar(async () => {
              avisar(await tarefa())
              membros.recarregar()
            })
          }}
        />
      )}
    </section>
  )
}

function FolhaDoMembro({
  membro,
  funcoes,
  fechar,
  gravar,
}: {
  membro: MembroComAcesso | null
  funcoes: Funcao[]
  fechar: () => void
  gravar: (tarefa: () => Promise<string | null>) => void
}) {
  const eu = usarEu()
  const [nome, escrever] = useState(membro?.nome ?? '')
  const [escolhidas, escolher] = useState<string[]>(membro?.funcoes ?? [])
  const [ministro, marcarMinistro] = useState(membro?.ministro ?? false)
  const [admin, marcarAdmin] = useState(membro?.admin ?? false)
  const [confirmando, confirmar] = useState(false)

  const corpo = { nome: nome.trim(), funcoes: escolhidas, ministro, admin }
  const souEu = membro?.id === eu.id

  const salvar = () =>
    gravar(async () => {
      if (membro) await api(`/api/admin/membros/${membro.id}`, { metodo: 'PATCH', corpo })
      else await api('/api/admin/membros', { metodo: 'POST', corpo })

      return null
    })

  const remover = () =>
    gravar(async () => {
      const resposta = await api<{ apagado: boolean }>(`/api/admin/membros/${membro?.id}`, { metodo: 'DELETE' })

      return textoDaRemocao(membro?.nome ?? '', resposta.apagado)
    })

  const reativar = () =>
    gravar(async () => {
      await api(`/api/admin/membros/${membro?.id}`, { metodo: 'PATCH', corpo: { inativo: false } })

      return `${membro?.nome} voltou pro ministério.`
    })

  return (
    <Folha titulo={membro ? membro.nome : 'Novo Membro'} fechar={fechar}>
      <label className="campo">
        <span className="rotulo">Nome</span>
        <input value={nome} placeholder="Como o grupo chama" onChange={(evento) => escrever(evento.target.value)} />
      </label>

      <div className="campo">
        <span className="rotulo">Funções</span>
        {porNaipe(funcoes).map((grupo) => (
          <div key={grupo.naipe} className="grupo">
            <span className="dica">{grupo.nome}</span>
            <span className="chips">
              {grupo.funcoes.map((funcao) => (
                <button
                  key={funcao.id}
                  type="button"
                  className={`chip${funcao.naipe === 'tecnica' ? ' tecnica' : ''}`}
                  aria-pressed={escolhidas.includes(funcao.id)}
                  onClick={() => escolher(alternar(escolhidas, funcao.id))}
                >
                  {funcao.nome}
                </button>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className="campo">
        <span className="rotulo">Papéis</span>
        <span className="chips">
          <button type="button" className="chip ministro" aria-pressed={ministro} onClick={() => marcarMinistro(!ministro)}>
            Ministro
          </button>
          <button type="button" className="chip" aria-pressed={admin} disabled={souEu} onClick={() => marcarAdmin(!admin)}>
            Admin
          </button>
        </span>
        <span className="dica">
          Ministro cria Escalas, monta Equipes e escolhe as músicas. Admin faz tudo isso e mais a gestão desta tela.
          {souEu && ' Você não pode tirar o próprio papel de Admin.'}
        </span>
      </div>

      <button type="button" className="botao largo" disabled={!nome.trim()} onClick={salvar}>
        {membro ? 'Salvar' : 'Cadastrar'}
      </button>

      {membro?.inativo && (
        <button type="button" className="botao secundario largo" onClick={reativar}>
          Trazer de volta
        </button>
      )}

      {membro && !souEu && !membro.inativo && (
        <>
          {confirmando ? (
            <>
              <p className="aviso">{avisoDeRemocao(membro)}</p>
              <button type="button" className="botao perigo largo" onClick={remover}>
                Confirmar a remoção
              </button>
            </>
          ) : (
            <button type="button" className="botao perigo largo" onClick={() => confirmar(true)}>
              Remover do ministério
            </button>
          )}
        </>
      )}
    </Folha>
  )
}

function papeisEFuncoes(membro: Membro, funcoes: Funcao[]): string {
  const nomes = funcoes.filter((funcao) => membro.funcoes.includes(funcao.id)).map((funcao) => funcao.nome)
  const papeis = [membro.ministro && 'Ministro', membro.admin && 'Admin'].filter(Boolean)

  return [...nomes, ...papeis].join(' · ') || 'Sem Função nem papel'
}
