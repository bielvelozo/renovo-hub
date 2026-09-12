import type { ReactNode, Ref } from 'react'
import { Link } from 'react-router'
import type { Anexo, ItemApresentado, MusicaNaLista, MusicaResumida, TrechoApresentado } from '../api/tipos'
import { formatarDia, hojeEmBrasilia, limparTitulo, tempoRelativo } from '../dominio'
import { Icone } from '../casca/Icone'
import { Capa } from './Capa'
import { Selo } from './Selo'

export type ModoDaLinha = 'leitura' | 'navegacao' | 'escolha'

export type PosicaoDoTempo = 'selo' | 'direita'

export type MusicaDaLinha = MusicaResumida &
  Partial<
    Pick<
      MusicaNaLista,
      'ultimaExecucao' | 'legado' | 'nova' | 'revisar' | 'tomConhecido' | 'tomOriginal' | 'recente' | 'planejadaEm'
    >
  >

export type Minutagem = { inicio: string; fim: string }

const MAXIMO_DE_PLANEJADAS = 2

type Comum = {
  modo: ModoDaLinha
  numero?: number
  observacao?: string
  selos?: ReactNode
  direita?: ReactNode
  aoEscolher?: () => void
  anexos?: Anexo[]
  hoje?: string
  ref?: Ref<HTMLLIElement>
  arrastando?: boolean
  desligado?: boolean
  tempo?: PosicaoDoTempo
}

export type PropriedadesDaLinha = Comum &
  ({ musica: MusicaDaLinha; tom?: string | null; trecho?: Minutagem; link?: string; trechos?: undefined } | { trechos: TrechoApresentado[]; musica?: undefined })

export function LinhaDeMusica(props: PropriedadesDaLinha) {
  const {
    modo,
    numero,
    observacao,
    selos,
    direita,
    aoEscolher,
    anexos = [],
    hoje = hojeEmBrasilia(),
    ref,
    arrastando,
    desligado,
    tempo = 'selo',
  } = props
  const ehMedley = props.trechos !== undefined
  const nome = ehMedley ? { titulo: 'Medley', artista: '' } : nomeLimpo(props.musica)
  const capas = ehMedley ? props.trechos.map((trecho) => trecho.musica) : [props.musica]
  const link = ehMedley ? undefined : props.link
  const transicao = !ehMedley && modo === 'navegacao' ? `capa-${props.musica.id}` : undefined
  const tom = ehMedley ? null : (props.tom ?? props.musica.ultimaExecucao?.tom ?? props.musica.tomConhecido ?? props.musica.tomOriginal)
  const ultima = ehMedley ? undefined : props.musica.ultimaExecucao
  const temTempo = ultima !== undefined
  const tempoADireita = temTempo && tempo === 'direita'
  const recente = !ehMedley && !!props.musica.recente && !!ultima
  const planejadas = ehMedley ? [] : (props.musica.planejadaEm ?? [])

  const miolo = (
    <>
      <span className="titulo">
        {numero !== undefined && `${numero}. `}
        {nome.titulo}
      </span>
      {nome.artista && <span className="dica">{nome.artista}</span>}
      <span className="selos">
        {tom && <Selo variante="tom">Tom {tom}</Selo>}
        {temTempo && !tempoADireita && <Selo>{ultima ? tempoRelativo(ultima.data, hoje) : 'nunca tocada no app'}</Selo>}
        {!ehMedley && props.trecho && (
          <Selo variante="trecho">
            trecho {props.trecho.inicio}–{props.trecho.fim}
          </Selo>
        )}
        {!ehMedley && !props.trecho && ultima?.parcial && <Selo variante="trecho">trecho</Selo>}
        {recente && ultima && (
          <Selo variante="atencao">
            {tempoRelativo(ultima.data, hoje)}
            {ultima.ministradoPorNome ? ` · ${ultima.ministradoPorNome}` : ''}
          </Selo>
        )}
        {planejadas.slice(0, MAXIMO_DE_PLANEJADAS).map((planejada) => (
          <Selo key={planejada.escalaId} variante="atencao">
            no Repertório de {formatarDia(planejada.data, hoje)}
            {planejada.ministros.length ? ` · ${planejada.ministros.join(', ')}` : ''}
          </Selo>
        ))}
        {planejadas.length > MAXIMO_DE_PLANEJADAS && (
          <Selo variante="atencao">+{planejadas.length - MAXIMO_DE_PLANEJADAS}</Selo>
        )}
        {!ehMedley && props.musica.legado && tempo === 'selo' && <Selo variante="legado">Legado</Selo>}
        {!ehMedley && props.musica.nova && tempo === 'selo' && <Selo>nova</Selo>}
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

  const coluna = tempoADireita && (
    <span className={`tempo${recente ? ' atencao' : ''}`}>
      {ultima ? (
        <b>{tempoCurto(tempoRelativo(ultima.data, hoje))}</b>
      ) : (
        <>
          <b>nunca</b>
          <span>no app</span>
        </>
      )}
    </span>
  )

  return (
    <li ref={ref} className={`linha-de-musica ${modo}${ehMedley ? ' medley' : ''}${arrastando ? ' arrastando' : ''}`}>
      {modo === 'escolha' ? (
        <button type="button" className="toque-da-linha" disabled={desligado} onClick={aoEscolher}>
          <Capa musicas={capas} />
          <span className="miolo">{miolo}</span>
          {coluna}
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
          {coluna}
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

export function tempoCurto(texto: string): string {
  return texto.replace(/ meses$/, ' m.').replace(/ mês$/, ' m.')
}

function nomeLimpo(musica: MusicaResumida & { revisar?: boolean }): { titulo: string; artista: string } {
  if (musica.revisar) return limparTitulo(musica.titulo, musica.artista)
  return { titulo: musica.titulo, artista: musica.artista }
}
