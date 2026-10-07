import { useRef, useState } from 'react'
import type { Anexo, EscalaApresentada, ItemApresentado, MusicaDetalhada } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { formatarDiaNumerico, normalizarMinutagem } from '../dominio'
import { corpoDaEdicao, escolhaDaMusica, rascunhoDoItem, trechosNormalizados } from '../escalas/rascunho'
import type { Rascunho, TrechoPronto } from '../escalas/rascunho'
import { capasDoItem, ministrosDaEscala, tituloDoItem } from '../escalas/repertorio'
import { BlocoDeMinutagem } from './BlocoDeMinutagem'
import { Botao } from './Botao'
import { CamposDoItem, ObservacaoDoItem, QuemPuxa } from './CamposDoItem'
import { Capa } from './Capa'
import { Esqueleto } from './Esqueleto'
import { Folha } from './Folha'
import { FolhaDaLetra } from './FolhaDaLetra'
import { SeletorDeTom } from './SeletorDeTom'

export type PropriedadesDaFolhaDoItem = {
  escala: EscalaApresentada
  item: ItemApresentado
  ocupado: boolean
  fechar: () => void
  salvar: (corpo: Record<string, unknown>) => void
  remover: () => void
  anexos?: Anexo[]
  recarregar?: () => void
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
  anexos = [],
  recarregar,
}: PropriedadesDaFolhaDoItem & { musica: MusicaDetalhada | null }) {
  const ministros = ministrosDaEscala(escala.pessoas)
  const [letra, abrirLetra] = useState(false)
  const enviou = useRef(false)

  const fecharALetra = () => {
    abrirLetra(false)
    if (enviou.current) recarregar?.()
    enviou.current = false
  }

  return (
    <Folha titulo={tituloDoItem(item)} fechar={fechar}>
      <div className="item">
        <Capa musicas={capasDoItem(item)} />
        <span className="cresce">
          <span className="titulo">{tituloDoItem(item)}</span>
          {item.tipo !== 'medley' && <span className="dica">{item.musica.artista}</span>}
        </span>
      </div>


      {item.tipo === 'medley' ? (
        <CamposDoMedley
          item={item}
          ministros={ministros}
          ocupado={ocupado}
          salvar={salvar}
          aoSalvar={fechar}
          anexos={anexos}
          abrirLetra={() => abrirLetra(true)}
        />
      ) : (
        <CamposDaMusica
          item={item}
          musica={musica}
          ministros={ministros}
          ocupado={ocupado}
          salvar={salvar}
          aoSalvar={fechar}
          anexos={anexos}
          abrirLetra={() => abrirLetra(true)}
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

      {letra && (
        <FolhaDaLetra
          titulo={tituloDoItem(item)}
          dono={item.tipo === 'medley' ? { itemId: item.id } : { musicaId: item.musicaId }}
          anexos={anexos}
          fechar={fecharALetra}
          aoEnviar={() => {
            enviou.current = true
          }}
        />
      )}
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
  anexos,
  abrirLetra,
}: {
  item: ItemApresentado
  musica: MusicaDetalhada | null
  ministros: ReturnType<typeof ministrosDaEscala>
  ocupado: boolean
  salvar: (corpo: Record<string, unknown>) => void
  aoSalvar: () => void
  anexos: Anexo[]
  abrirLetra: () => void
}) {
  const [rascunho, escrever] = useState<Rascunho>(() => rascunhoDoItem(item, escolhaDoItem(item)))
  const mudar = (mudanca: Partial<Rascunho>) => escrever((antes) => ({ ...antes, ...mudanca }))

  const pronto = !!rascunho.tom && (rascunho.modo === 'inteira' || (normalizarMinutagem(rascunho.inicio) !== null && normalizarMinutagem(rascunho.fim) !== null))

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

      <BlocoDaLetra titulo="Letra" anexos={anexos} abrirLetra={abrirLetra} />
    </>
  )
}

function CamposDoMedley({
  item,
  ministros,
  ocupado,
  salvar,
  aoSalvar,
  anexos,
  abrirLetra,
}: {
  item: ItemApresentado & { tipo: 'medley' }
  ministros: ReturnType<typeof ministrosDaEscala>
  ocupado: boolean
  salvar: (corpo: Record<string, unknown>) => void
  aoSalvar: () => void
  anexos: Anexo[]
  abrirLetra: () => void
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

  const pronto = trechos.every((trecho) => trecho.tom && normalizarMinutagem(trecho.inicio) !== null && normalizarMinutagem(trecho.fim) !== null)

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
          salvar({ trechos: trechosNormalizados(trechos), observacao: observacao.trim(), ministradoPor })
          aoSalvar()
        }}
      >
        Salvar
      </Botao>

      <BlocoDaLetra titulo="Letra do medley" anexos={anexos} abrirLetra={abrirLetra} />
    </>
  )
}

function BlocoDaLetra({
  titulo,
  anexos,
  abrirLetra,
}: {
  titulo: string
  anexos: Anexo[]
  abrirLetra: () => void
}) {
  const maisNovo = anexos[0]

  return (
    <div className="secao">
      <h2>{titulo}</h2>

      {maisNovo && <p className="dica">Letra enviada em {formatarDiaNumerico(maisNovo.criadoEm.slice(0, 10))}</p>}

      <Botao variante="secundario" onClick={abrirLetra}>
        {maisNovo ? 'Trocar' : 'Enviar letra (Word)'}
      </Botao>
    </div>
  )
}

function escolhaDoItem(item: ItemApresentado) {
  return escolhaDaMusica(item.tipo === 'medley' ? item.trechos[0].musica : item.musica)
}
