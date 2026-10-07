import type { ReactNode, Ref } from 'react'
import { Link } from 'react-router'
import type { ItemApresentado, MusicaNaLista, MusicaResumida, TrechoApresentado } from '../api/tipos'
import { TOM_ORIGINAL, formatarDia, hojeEmBrasilia, limparTitulo, tempoRelativo } from '../dominio'
import { Icone } from '../casca/Icone'
import { Capa } from './Capa'
import { Selo } from './Selo'

export type ModoDaLinha = 'leitura' | 'navegacao' | 'escolha'

export type PosicaoDoTempo = 'selo' | 'direita'

export type PosicaoDoTom = 'selo' | 'direita'

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
  letraEm?: string
  hoje?: string
  ref?: Ref<HTMLLIElement>
  arrastando?: boolean
  desligado?: boolean
  tempo?: PosicaoDoTempo
  posicaoDoTom?: PosicaoDoTom
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
    letraEm,
    hoje = hojeEmBrasilia(),
    ref,
    arrastando,
    desligado,
    tempo = 'selo',
    posicaoDoTom = 'selo',
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
  const tomADireita = posicaoDoTom === 'direita'
  const recente = !ehMedley && !!props.musica.recente && !!ultima
  const planejadas = ehMedley ? [] : (props.musica.planejadaEm ?? [])
  // Dentro de um link ou botão, a letra vira selo: o caminho é a Música ou a folha do Item.
  const mioloInterativo = modo === 'navegacao' || (modo === 'leitura' && !!aoEscolher)

  const miolo = (
    <>
      <span className="titulo">
        {numero !== undefined && `${numero}. `}
        {nome.titulo}
      </span>
      {nome.artista && <span className="dica">{nome.artista}</span>}
      <span className="selos">
        {tom && !tomADireita && <Selo variante="tom">Tom {tom}</Selo>}
        {temTempo && !tempoADireita && (ultima || !props.musica?.legado) && (
          <Selo>{ultima ? tempoRelativo(ultima.data, hoje) : 'nunca tocada'}</Selo>
        )}
        {!ehMedley && props.trecho && (
          <Selo variante="trecho">
            trecho {props.trecho.inicio}–{props.trecho.fim}
          </Selo>
        )}
        {!ehMedley && !props.trecho && ultima?.parcial && <Selo variante="trecho">trecho</Selo>}
        {recente && ultima && (!tempoADireita || ultima.ministradoPorNome) && (
          <Selo variante="atencao">
            {tempoADireita
              ? `com ${ultima.ministradoPorNome}`
              : tempoRelativo(ultima.data, hoje) + (ultima.ministradoPorNome ? ` · ${ultima.ministradoPorNome}` : '')}
          </Selo>
        )}
        {planejadas.slice(0, MAXIMO_DE_PLANEJADAS).map((planejada) => (
          <Selo key={planejada.escalaId} variante="atencao">
            no repertório de {formatarDia(planejada.data, hoje)}
            {planejada.ministros.length ? ` · ${planejada.ministros.join(', ')}` : ''}
          </Selo>
        ))}
        {planejadas.length > MAXIMO_DE_PLANEJADAS && (
          <Selo variante="atencao">+{planejadas.length - MAXIMO_DE_PLANEJADAS}</Selo>
        )}
        {!ehMedley && props.musica.legado && (tempo === 'selo' || !ultima) && <Selo variante="legado">Legado</Selo>}
        {!ehMedley && props.musica.nova && tempo === 'selo' && <Selo>nova</Selo>}
        {letraEm &&
          modo !== 'escolha' &&
          (mioloInterativo ? (
            <Selo icone="documento">letra</Selo>
          ) : (
            <Link className="selo neutro" to={letraEm}>
              <Icone nome="documento" />
              letra
            </Link>
          ))}
        {selos}
      </span>
    </>
  )

  const coluna = tempoADireita ? (
    ultima ? (
      <span className={`tempo${recente ? ' atencao' : ''}`}>
        <b>{tempoCurto(tempoRelativo(ultima.data, hoje))}</b>
      </span>
    ) : (
      !props.musica?.legado && (
        <span className="tempo">
          <b>nunca</b>
        </span>
      )
    )
  ) : (
    tomADireita && tom && <ColunaDoTom tom={tom} />
  )

  // A alça e o que vem em `direita` ficam fora do botão: arrastar a linha pra
  // reordenar não pode abrir a folha do Item.
  const tocavelNaLeitura = modo === 'leitura' && !!aoEscolher

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
          <Capa musicas={capas} tocavel={link} titulo={nome.titulo} transicao={transicao} />
          {modo === 'navegacao' && !ehMedley ? (
            <Link to={`/musicas/${props.musica.id}`} className="miolo">
              {miolo}
            </Link>
          ) : tocavelNaLeitura ? (
            <button type="button" className="toque-da-linha" disabled={desligado} onClick={aoEscolher}>
              <span className="miolo">{miolo}</span>
              {coluna}
            </button>
          ) : (
            <span className="miolo">{miolo}</span>
          )}
          {!tocavelNaLeitura && coluna}
        </>
      )}
      {direita && <span className="direita">{direita}</span>}
      {observacao && <span className="observacao">{observacao}</span>}
      {ehMedley && modo !== 'escolha' && (
        <ol className="trechos-do-medley">
          {props.trechos.map((trecho, posicao) => (
            <li key={`${trecho.musicaId}-${posicao}`}>
              <Capa musicas={[trecho.musica]} tocavel={trecho.link} titulo={nomeLimpo(trecho.musica).titulo} />
              {modo === 'navegacao' ? (
                <Link to={`/musicas/${trecho.musicaId}`} className="cresce">
                  <TituloDoTrecho trecho={trecho} />
                </Link>
              ) : tocavelNaLeitura ? (
                <button type="button" className="toque-do-trecho cresce" disabled={desligado} onClick={aoEscolher}>
                  <TituloDoTrecho trecho={trecho} />
                </button>
              ) : (
                <span className="cresce">
                  <TituloDoTrecho trecho={trecho} />
                </span>
              )}
              {tomADireita ? <ColunaDoTom tom={trecho.tom} /> : <Selo variante="tom">Tom {trecho.tom}</Selo>}
            </li>
          ))}
        </ol>
      )}
    </li>
  )
}

function ColunaDoTom({ tom }: { tom: string }) {
  if (tom === TOM_ORIGINAL)
    return (
      <span className="tempo tom original" aria-label="Tom original">
        <span>tom</span>
        <b>original</b>
      </span>
    )
  return (
    <span className="tempo tom" aria-label={`Tom ${tom}`}>
      <b>{tom}</b>
      <span>tom</span>
    </span>
  )
}

function TituloDoTrecho({ trecho }: { trecho: TrechoApresentado }) {
  return (
    <>
      <span className="titulo">{nomeLimpo(trecho.musica).titulo}</span>
      <span className="dica">
        {trecho.inicio}–{trecho.fim}
      </span>
    </>
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
