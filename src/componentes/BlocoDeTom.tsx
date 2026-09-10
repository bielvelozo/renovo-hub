import { useState } from 'react'
import { api } from '../api/cliente'
import type { AchadoNoCifraClub, ExecucaoApresentada, TomSugeridoApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { tituloParaBusca } from '../dominio'
import { textoDoHistorico, textoDoTomSugerido } from '../escalas/rascunho'
import { SeletorDeTom } from './SeletorDeTom'

export function BlocoDeTom({
  tom,
  sugerido,
  historico,
  tomOriginal,
  musica,
  escolher,
  aoAcharOriginal,
}: {
  tom: string | null
  sugerido: TomSugeridoApresentado | null
  historico: ExecucaoApresentada[]
  tomOriginal: string | null
  musica: { titulo: string; artista: string }
  escolher: (tom: string) => void
  aoAcharOriginal: (tom: string) => void
}) {
  return (
    <div className="secao">
      <h2>Tom</h2>
      <p className="dica">{textoDoTomSugerido(sugerido)}</p>

      {tomOriginal && (
        <button type="button" className="chip largo" aria-pressed={tom === tomOriginal} onClick={() => escolher(tomOriginal)}>
          Tom original: {tomOriginal}
        </button>
      )}

      <SeletorDeTom tom={tom} sugerido={sugerido?.tom ?? null} escolher={escolher} />

      <BuscaNoCifraClub musica={musica} aoUsar={aoAcharOriginal} />

      {historico.length > 0 && <p className="dica">Histórico: {textoDoHistorico(historico)}</p>}
    </div>
  )
}

export function BuscaNoCifraClub({
  musica,
  aoUsar,
}: {
  musica: { titulo: string; artista: string }
  aoUsar: (tom: string) => void
}) {
  const acao = usarAcao()
  const [achado, guardar] = useState<AchadoNoCifraClub | null>(null)
  const [procurou, marcar] = useState(false)

  const procurar = () =>
    acao.executar(async () => {
      const busca = new URLSearchParams({ termo: tituloParaBusca(musica.titulo), artista: musica.artista })
      const resposta = await api<{ achado: AchadoNoCifraClub | null }>(`/api/cifraclub?${busca}`)
      guardar(resposta.achado)
      marcar(true)
    })

  return (
    <>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <button type="button" className="botao secundario largo" disabled={acao.ocupado} onClick={procurar}>
        Buscar tom no Cifra Club
      </button>

      {achado && (
        <div className="achado">
          <p className="titulo">
            {achado.titulo} · {achado.artista}
          </p>
          <p className="dica">
            No Cifra Club está em <strong>{achado.tom}</strong>. Confira se é a mesma música.
          </p>
          <div className="acoes">
            <button
              type="button"
              className="botao pequeno"
              disabled={acao.ocupado}
              onClick={() => {
                aoUsar(achado.tom)
                guardar(null)
              }}
            >
              Usar {achado.tom}
            </button>
            <a className="botao pequeno secundario" href={achado.url} target="_blank" rel="noopener">
              Abrir
            </a>
            <button type="button" className="botao pequeno secundario" onClick={() => guardar(null)}>
              Não é essa
            </button>
          </div>
        </div>
      )}

      {procurou && !achado && !acao.ocupado && (
        <p className="vazio">O Cifra Club não achou o tom desta música. Escolha à mão.</p>
      )}
    </>
  )
}
