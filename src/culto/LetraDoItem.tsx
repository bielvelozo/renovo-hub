import { useRef } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import type { ItemDoCulto, MusicaDoCulto } from '../api/tipos'
import { Botao } from '../componentes/Botao'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Vazio } from '../componentes/Vazio'
import { TOM_ORIGINAL } from '../dominio'
import { BarraDeLeitura } from '../letra/BarraDeLeitura'
import { CorpoDaLetra } from '../letra/CorpoDaLetra'
import {
  itemAnterior,
  itemSeguinte,
  letrasDoMedley,
  musicaDoCatalogo,
  posicaoDoItem,
  tituloDoItem,
  tomNoRodape,
  ultimoTomTocado,
} from './culto'
import { TopoDoCulto, usarCulto } from './ModoCulto'
import { NotaDoTom, TomNoPalco } from './NotaDoTom'
import { usarTeclasDoPalco } from './usarTeclasDoPalco'

const DESLIZE_MINIMO = 60

export function LetraDoItem() {
  const { escala, catalogo } = usarCulto()
  const { itemId = '' } = useParams()
  const navegar = useNavigate()
  const comeco = useRef<{ x: number; y: number } | null>(null)
  const corpo = useRef<HTMLDivElement>(null)

  const item = escala.itens.find((candidato) => candidato.id === itemId)
  const anterior = itemAnterior(escala.itens, itemId)
  const seguinte = itemSeguinte(escala.itens, itemId)

  const abrir = (alvo: ItemDoCulto | null) => {
    if (alvo) navegar(`/culto/${escala.id}/item/${alvo.id}`, { replace: true })
  }

  usarTeclasDoPalco(corpo, (lado) => abrir(lado === 'anterior' ? anterior : seguinte))

  if (!item) return <Navigate to={`/culto/${escala.id}`} replace />

  const letra = letrasDoMedley(item, catalogo)

  const comecarODeslize = (evento: React.TouchEvent) => {
    const toque = evento.touches[0] ?? evento.changedTouches[0]
    comeco.current = toque ? { x: toque.clientX, y: toque.clientY } : null
  }

  const terminarODeslize = (evento: React.TouchEvent) => {
    const partiu = comeco.current
    const toque = evento.changedTouches[0]
    comeco.current = null
    if (!partiu || !toque) return

    const andouX = toque.clientX - partiu.x
    const andouY = toque.clientY - partiu.y
    if (Math.abs(andouX) <= DESLIZE_MINIMO || Math.abs(andouX) <= Math.abs(andouY)) return

    abrir(andouX < 0 ? seguinte : anterior)
  }

  return (
    <>
      <TopoDoCulto fecharPara={`/escalas/${escala.id}`}>
        <Link to={`/culto/${escala.id}`} className="volta-do-culto">
          ‹ Ordem
        </Link>
        <span className="dica cresce centro">
          {posicaoDoItem(escala.itens, itemId)} de {escala.itens.length}
        </span>
      </TopoDoCulto>

      <div className="cabecalho-da-letra">
        {item.tipo === 'medley' ? (
          <MedleyNoTopo item={item} />
        ) : (
          <MusicaNoTopo item={item} musica={musicaDoCatalogo(catalogo, item.musicaId)} tomNoPalco={!letra} />
        )}

        {item.observacao && <p className="observacao-do-culto">{item.observacao}</p>}
      </div>

      {letra && <BarraDeLeitura key={itemId} rolagem={corpo} />}

      <div
        className={letra ? 'rolagem' : 'rolagem culto-parado'}
        ref={corpo}
        onTouchStart={comecarODeslize}
        onTouchEnd={terminarODeslize}
      >
        {letra ? (
          <CorpoDaLetra letra={letra} />
        ) : (
          <>
            {item.tipo !== 'medley' && <TomNoPalco tom={item.tom} />}
            <Vazio icone="documento">Sem letra ainda</Vazio>
          </>
        )}
      </div>

      <RodapeDeAcao
        secundario={
          <Botao variante="secundario" disabled={!anterior} onClick={() => abrir(anterior)}>
            {anterior ? <Vizinho item={anterior} lado="anterior" /> : 'Primeira'}
          </Botao>
        }
        primario={
          <Botao disabled={!seguinte} onClick={() => abrir(seguinte)} data-guia="culto-navegar">
            {seguinte ? <Vizinho item={seguinte} lado="seguinte" /> : 'Última'}
          </Botao>
        }
      />
    </>
  )
}

function Vizinho({ item, lado }: { item: ItemDoCulto; lado: 'anterior' | 'seguinte' }) {
  const titulo = tituloDoItem(item)

  return (
    <span className="vizinho">
      <span className="titulo-do-vizinho">{lado === 'anterior' ? `‹ ${titulo}` : `${titulo} ›`}</span>
      <span className="nota-do-vizinho">{tomNoRodape(item)}</span>
    </span>
  )
}

function MusicaNoTopo({
  item,
  musica,
  tomNoPalco,
}: {
  item: ItemDoCulto
  musica: MusicaDoCulto | null
  tomNoPalco: boolean
}) {
  if (item.tipo === 'medley') return null

  const minutagem = item.tipo === 'trecho' ? ` · ${item.inicio}–${item.fim}` : ''
  const ultimo = ultimoTomTocado(musica?.tom ?? null)

  return (
    <div className="topo-da-letra">
      <div className="cresce">
        <h1 className="display">{item.titulo}</h1>
        <p className="dica">
          {item.artista}
          {minutagem}
        </p>
        {ultimo && <p className="dica">{ultimo}</p>}
      </div>
      {!tomNoPalco && (
        <p className="bloco-do-tom">
          {item.tom !== TOM_ORIGINAL && <span className="rotulo-do-tom">Tom</span>}
          <NotaDoTom tom={item.tom} tamanho="grande" />
        </p>
      )}
    </div>
  )
}

function MedleyNoTopo({ item }: { item: ItemDoCulto }) {
  if (item.tipo !== 'medley') return null

  return (
    <>
      <h1 className="display">Medley</h1>
      {item.trechos.map((trecho, indice) => (
        <p key={`${trecho.musicaId}-${indice}`} className="trecho-do-culto">
          <span className="cresce">
            <span className="titulo">{trecho.titulo}</span>
            <span className="dica">
              {trecho.artista} · {trecho.inicio}–{trecho.fim}
            </span>
          </span>
          <NotaDoTom tom={trecho.tom} />
        </p>
      ))}
    </>
  )
}
