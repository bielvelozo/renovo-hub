import { useState } from 'react'
import { resumoDeAcesso, textoDaListaEsqueci } from '../../admin/admin'
import { api } from '../../api/cliente'
import type { Convite, MembroComAcesso } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Cabecalho } from '../../casca/Cabecalho'
import { usarAviso } from '../../componentes/Avisos'
import { Botao } from '../../componentes/Botao'
import { Folha } from '../../componentes/Folha'
import { Segmento } from '../../componentes/Segmento'

export function Convites() {
  const membros = usarBusca<{ membros: MembroComAcesso[] }>('/api/admin/membros')
  const configuracoes = usarBusca<{ listaEsqueci: boolean }>('/api/admin/configuracoes')
  const acao = usarAcao()
  const [gerado, guardar] = useState<Convite | null>(null)

  const lista = (membros.dados?.membros ?? []).filter((membro) => !membro.inativo)
  const erro = membros.erro ?? configuracoes.erro

  const gerar = (membroId: string) => {
    acao.executar(async () => {
      guardar(await api<Convite>('/api/admin/convites', { metodo: 'POST', corpo: { membroId } }))
      membros.recarregar()
    })
  }

  const definirLista = (ligada: boolean) => {
    acao.executar(async () => {
      configuracoes.definir(
        await api<{ listaEsqueci: boolean }>('/api/admin/configuracoes', {
          metodo: 'PATCH',
          corpo: { listaEsqueci: ligada },
        }),
      )
    })
  }

  return (
    <section className="pagina">
      <Cabecalho titulo="Convites e acesso" sub="Um link por membro" voltarPara="/admin" />

      {erro && <p className="aviso">{erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <p className="dica">O link é pessoal: quem abrir entra como essa pessoa. Mande só pra ela.</p>

      {lista.length > 0 && (
        <ul className="lista cartao">
          {lista.map((membro) => (
            <li key={membro.id} className="pessoa">
              <span className="cresce">
                <span className="titulo">{membro.nome}</span>
                <span className="dica">{resumoDeAcesso(membro)}</span>
              </span>
              <Botao pequeno disabled={acao.ocupado} onClick={() => gerar(membro.id)}>
                Gerar link
              </Botao>
            </li>
          ))}
        </ul>
      )}

      {configuracoes.dados && (
        <div className="secao">
          <h2>Entrar escolhendo o nome</h2>
          <Segmento
            rotulo="Entrar escolhendo o nome"
            opcoes={[
              { valor: 'ligada', rotulo: 'Ligada' },
              { valor: 'desligada', rotulo: 'Desligada' },
            ]}
            valor={configuracoes.dados.listaEsqueci ? 'ligada' : 'desligada'}
            aoMudar={(valor) => definirLista(valor === 'ligada')}
          />
          <p className="dica">{textoDaListaEsqueci(configuracoes.dados.listaEsqueci)}</p>
        </div>
      )}

      {gerado && <FolhaDoLink convite={gerado} fechar={() => guardar(null)} />}
    </section>
  )
}

function FolhaDoLink({ convite, fechar }: { convite: Convite; fechar: () => void }) {
  const avisar = usarAviso()
  const endereco = `${window.location.origin}${convite.link}`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(endereco)
      avisar('Copiado')
    } catch {
    }
  }

  return (
    <Folha titulo={`Link de ${convite.membro.nome}`} fechar={fechar}>
      <textarea className="texto-longo" readOnly rows={3} value={endereco} />
      <Botao largo onClick={copiar}>
        Copiar
      </Botao>
    </Folha>
  )
}
