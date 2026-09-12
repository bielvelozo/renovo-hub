import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { Anexo, ItemApresentado, MusicaNaLista, MusicaResumida, TrechoApresentado } from '../api/tipos'
import { hojeEmBrasilia, limparTitulo, tempoRelativo } from '../dominio'
import { Icone } from '../casca/Icone'
import { Capa } from './Capa'
import { Selo } from './Selo'

export type ModoDaLinha = 'leitura' | 'navegacao' | 'escolha'

export type MusicaDaLinha = MusicaResumida & Partial<Pick<MusicaNaLista, 'ultimaExecucao' | 'legado' | 'nova' | 'revisar'>>

export type Minutagem = { inicio: string; fim: string }

type Comum = {
  modo: ModoDaLinha
  numero?: number
  observacao?: string
  selos?: ReactNode
  direita?: ReactNode
  aoEscolher?: () => void
  anexos?: Anexo[]
  hoje?: string
}

export type PropriedadesDaLinha = Comum &
  ({ musica: MusicaDaLinha; tom?: string | null; trecho?: Minutagem; link?: string; trechos?: undefined } | { trechos: TrechoApresentado[]; musica?: undefined })

export function LinhaDeMusica(props: PropriedadesDaLinha) {
  const { modo, numero, observacao, selos, direita, aoEscolher, anexos = [], hoje = hojeEmBrasilia() } = props
  const ehMedley = props.trechos !== undefined
  const nome = ehMedley ? { titulo: 'Medley', artista: '' } : nomeLimpo(props.musica)
  const capas = ehMedley ? props.trechos.map((trecho) => trecho.musica) : [props.musica]
  const link = ehMedley ? undefined : props.link
  const transicao = !ehMedley && modo === 'navegacao' ? `capa-${props.musica.id}` : undefined

  const miolo = (
    <>
      <span className="titulo">
        {numero !== undefined && `${numero}. `}
        {nome.titulo}
      </span>
      {nome.artista && <span className="dica">{nome.artista}</span>}
      <span className="selos">
        {!ehMedley && props.tom && <Selo variante="tom">Tom {props.tom}</Selo>}
        {!ehMedley && props.musica.ultimaExecucao !== undefined && (
          <Selo>{props.musica.ultimaExecucao ? tempoRelativo(props.musica.ultimaExecucao.data, hoje) : 'nunca tocada'}</Selo>
        )}
        {!ehMedley && props.trecho && (
          <Selo variante="trecho">
            trecho {props.trecho.inicio}–{props.trecho.fim}
          </Selo>
        )}
        {!ehMedley && props.musica.legado && <Selo variante="legado">Legado</Selo>}
        {!ehMedley && props.musica.nova && <Selo>nova</Selo>}
        {anexos.map((anexo) => (
          <a key={anexo.id} className="selo neutro" href={anexo.url}>
            <Icone nome="documento" />
            letra{anexos.length > 1 ? ` v${anexo.versao}` : ''}
          </a>
        ))}
        {selos}
      </span>
    </>
  )

  return (
    <li className={`linha-de-musica ${modo}${ehMedley ? ' medley' : ''}`}>
      {modo === 'escolha' ? (
        <button type="button" className="toque-da-linha" onClick={aoEscolher}>
          <Capa musicas={capas} />
          <span className="miolo">{miolo}</span>
        </button>
      ) : (
        <>
          <Capa musicas={capas} tocavel={link} transicao={transicao} />
          {modo === 'navegacao' && !ehMedley ? (
            <Link to={`/musicas/${props.musica.id}`} className="miolo">
              {miolo}
            </Link>
          ) : (
            <span className="miolo">{miolo}</span>
          )}
        </>
      )}
      {direita && <span className="direita">{direita}</span>}
      {observacao && <span className="observacao">{observacao}</span>}
      {ehMedley && modo !== 'escolha' && (
        <ol className="trechos-do-medley">
          {props.trechos.map((trecho, posicao) => (
            <li key={`${trecho.musicaId}-${posicao}`}>
              <Capa musicas={[trecho.musica]} tocavel={trecho.link} />
              <span className="cresce">
                <span className="titulo">{nomeLimpo(trecho.musica).titulo}</span>
                <span className="dica">
                  {trecho.inicio}–{trecho.fim}
                </span>
              </span>
              <Selo variante="tom">Tom {trecho.tom}</Selo>
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}

export function LinhaDoItem({
  item,
  ...resto
}: Comum & { item: ItemApresentado }) {
  if (item.tipo === 'medley') return <LinhaDeMusica {...resto} trechos={item.trechos} observacao={item.observacao || resto.observacao} />

  return (
    <LinhaDeMusica
      {...resto}
      musica={item.musica}
      tom={item.tom}
      trecho={item.tipo === 'trecho' ? { inicio: item.inicio, fim: item.fim } : undefined}
      link={item.link}
      observacao={item.observacao || resto.observacao}
    />
  )
}

function nomeLimpo(musica: MusicaResumida & { revisar?: boolean }): { titulo: string; artista: string } {
  if (musica.revisar) return limparTitulo(musica.titulo, musica.artista)
  return { titulo: musica.titulo, artista: musica.artista }
}
