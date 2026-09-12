import { useState } from 'react'
import type { EscalaApresentada, ItemApresentado, MusicaDetalhada } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { ehMinutagem, hojeEmBrasilia } from '../dominio'
import { corpoDaEdicao, escolhaDaMusica, rascunhoDoItem } from '../escalas/rascunho'
import type { Rascunho, TrechoPronto } from '../escalas/rascunho'
import { capasDoItem, ministrosDaEscala, tituloDoItem } from '../escalas/repertorio'
import { BlocoDeMinutagem } from './BlocoDeMinutagem'
import { Botao } from './Botao'
import { CamposDoItem, ObservacaoDoItem, QuemPuxa } from './CamposDoItem'
import { Capa } from './Capa'
import { Esqueleto } from './Esqueleto'
import { FaixaDeAlerta, frasesDeAlerta } from './FaixaDeAlerta'
import { Folha } from './Folha'
import { SeletorDeTom } from './SeletorDeTom'

export type PropriedadesDaFolhaDoItem = {
  escala: EscalaApresentada
  item: ItemApresentado
  ocupado: boolean
  fechar: () => void
  salvar: (corpo: Record<string, unknown>) => void
  remover: () => void
  hoje?: string
}

export function FolhaDoItem({ escala, item, ...resto }: PropriedadesDaFolhaDoItem) {
  const detalhe = usarBusca<MusicaDetalhada>(
    item.tipo === 'medley' ? null : `/api/musicas/${item.musicaId}?escalaId=${escala.id}`,
  )

  if (item.tipo !== 'medley' && detalhe.carregando) {
    return (
      <Folha titulo={tituloDoItem(item)} fechar={resto.fechar}>
        <Esqueleto forma="paragrafo" />
      </Folha>
    )
  }

  return <CorpoDaFolhaDoItem escala={escala} item={item} musica={detalhe.dados} {...resto} />
}

export function CorpoDaFolhaDoItem({
  escala,
  item,
  musica,
  ocupado,
  fechar,
  salvar,
  remover,
  hoje = hojeEmBrasilia(),
}: PropriedadesDaFolhaDoItem & { musica: MusicaDetalhada | null }) {
  const ministros = ministrosDaEscala(escala.pessoas)

  return (
    <Folha titulo={tituloDoItem(item)} fechar={fechar}>
      <div className="item">
        <Capa musicas={capasDoItem(item)} />
        <span className="cresce">
          <span className="titulo">{tituloDoItem(item)}</span>
          {item.tipo !== 'medley' && <span className="dica">{item.musica.artista}</span>}
        </span>
      </div>

      {item.memoria && <FaixaDeAlerta frases={frasesDeAlerta(item.memoria, hoje)} />}

      {item.tipo === 'medley' ? (
        <CamposDoMedley
          item={item}
          ministros={ministros}
          ocupado={ocupado}
          salvar={salvar}
          aoSalvar={fechar}
        />
      ) : (
        <CamposDaMusica
          item={item}
          musica={musica}
          ministros={ministros}
          ocupado={ocupado}
          salvar={salvar}
          aoSalvar={fechar}
        />
      )}

      <Botao
        variante="terciario"
        className="perigo"
        largo
        disabled={ocupado}
        onClick={() => {
          remover()
          fechar()
        }}
      >
        Remover do repertório
      </Botao>
    </Folha>
  )
}

function CamposDaMusica({
  item,
  musica,
  ministros,
  ocupado,
  salvar,
  aoSalvar,
}: {
  item: ItemApresentado
  musica: MusicaDetalhada | null
  ministros: ReturnType<typeof ministrosDaEscala>
  ocupado: boolean
  salvar: (corpo: Record<string, unknown>) => void
  aoSalvar: () => void
}) {
  const [rascunho, escrever] = useState<Rascunho>(() => rascunhoDoItem(item, escolhaDoItem(item)))
  const mudar = (mudanca: Partial<Rascunho>) => escrever((antes) => ({ ...antes, ...mudanca }))

  const pronto = !!rascunho.tom && (rascunho.modo === 'inteira' || (ehMinutagem(rascunho.inicio) && ehMinutagem(rascunho.fim)))

  return (
    <>
      <CamposDoItem rascunho={rascunho} mudar={mudar} musica={musica} ministros={ministros} />

      <Botao
        largo
        disabled={ocupado || !pronto}
        onClick={() => {
          salvar(corpoDaEdicao(rascunho))
          aoSalvar()
        }}
      >
        Salvar
      </Botao>
    </>
  )
}

function CamposDoMedley({
  item,
  ministros,
  ocupado,
  salvar,
  aoSalvar,
}: {
  item: ItemApresentado & { tipo: 'medley' }
  ministros: ReturnType<typeof ministrosDaEscala>
  ocupado: boolean
  salvar: (corpo: Record<string, unknown>) => void
  aoSalvar: () => void
}) {
  const [trechos, escreverTrechos] = useState<TrechoPronto[]>(() =>
    item.trechos.map((trecho) => ({
      musicaId: trecho.musicaId,
      tom: trecho.tom,
      inicio: trecho.inicio,
      fim: trecho.fim,
    })),
  )
  const [observacao, escreverObservacao] = useState(item.observacao)
  const [ministradoPor, escolherQuemPuxa] = useState(item.ministradoPor)

  const mudarTrecho = (posicao: number, mudanca: Partial<TrechoPronto>) =>
    escreverTrechos((antes) => antes.map((trecho, outro) => (outro === posicao ? { ...trecho, ...mudanca } : trecho)))

  const pronto = trechos.every((trecho) => trecho.tom && ehMinutagem(trecho.inicio) && ehMinutagem(trecho.fim))

  return (
    <>
      <p className="dica">Para trocar as músicas, remova e monte de novo.</p>

      {item.trechos.map((original, posicao) => (
        <div key={`${original.musicaId}-${posicao}`} className="secao">
          <h2>{original.musica.titulo}</h2>
          <SeletorDeTom tom={trechos[posicao].tom} escolher={(tom) => mudarTrecho(posicao, { tom })} />
          <BlocoDeMinutagem
            inicio={trechos[posicao].inicio}
            fim={trechos[posicao].fim}
            escrever={(campo, valor) => mudarTrecho(posicao, { [campo]: valor })}
          />
        </div>
      ))}

      <QuemPuxa ministros={ministros} valor={ministradoPor} aoMudar={escolherQuemPuxa} />

      <ObservacaoDoItem valor={observacao} aoMudar={escreverObservacao} />

      <Botao
        largo
        disabled={ocupado || !pronto}
        onClick={() => {
          salvar({ trechos, observacao: observacao.trim(), ministradoPor })
          aoSalvar()
        }}
      >
        Salvar
      </Botao>
    </>
  )
}

function escolhaDoItem(item: ItemApresentado) {
  return escolhaDaMusica(item.tipo === 'medley' ? item.trechos[0].musica : item.musica)
}
