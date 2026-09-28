import { useState } from 'react'
import { api } from '../api/cliente'
import type { AchadoNoCifraClub, ExecucaoApresentada, TomSugeridoApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { TOM_ORIGINAL, hojeEmBrasilia } from '../dominio'
import { textoDoHistorico, textoDoTomSugerido } from '../escalas/rascunho'
import { Botao, classesDoBotao } from './Botao'
import { SeletorDeTom } from './SeletorDeTom'
import { Vazio } from './Vazio'

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
      <p className="dica">{textoDoTomSugerido(sugerido, hojeEmBrasilia(), tom)}</p>

      <button
        type="button"
        className="chip largo"
        aria-pressed={tom === (tomOriginal ?? TOM_ORIGINAL)}
        onClick={() => escolher(tomOriginal ?? TOM_ORIGINAL)}
      >
        Tom original{tomOriginal ? `: ${tomOriginal}` : ''}
      </button>

      <SeletorDeTom tom={tom} sugerido={sugerido?.tom ?? null} original={tomOriginal} escolher={escolher} />

      <BuscaNoCifraClub musica={musica} aoUsar={aoAcharOriginal} rotulo="Descobrir o tom no Cifra Club" />

      {historico.length > 1 && <p className="dica">Histórico: {textoDoHistorico(historico)}</p>}
    </div>
  )
}

export function BuscaNoCifraClub({
  musica,
  aoUsar,
  rotulo = 'Buscar no Cifra Club',
  classe = 'secundario largo',
}: {
  musica: { titulo: string; artista: string }
  aoUsar: (tom: string) => void
  rotulo?: string
  classe?: string
}) {
  const acao = usarAcao()
  const [achado, guardar] = useState<AchadoNoCifraClub | null>(null)
  const [procurou, marcar] = useState(false)

  const procurar = () =>
    acao.executar(async () => {
      const busca = new URLSearchParams({ termo: musica.titulo, artista: musica.artista })
      const resposta = await api<{ achado: AchadoNoCifraClub | null }>(`/api/cifraclub?${busca}`)
      guardar(resposta.achado)
      marcar(true)
    })

  return (
    <>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <Botao className={classe} carregando={acao.ocupado} onClick={procurar}>
        {rotulo}
      </Botao>

      {achado && (
        <div className="achado">
          <p className="titulo">
            {achado.titulo} · {achado.artista}
          </p>
          <p className="dica">
            No Cifra Club está em <strong>{achado.tom}</strong>. Confira se é a mesma música.
          </p>
          <div className="acoes">
            <Botao
              pequeno
              disabled={acao.ocupado}
              onClick={() => {
                aoUsar(achado.tom)
                guardar(null)
              }}
            >
              Usar {achado.tom}
            </Botao>
            <a className={classesDoBotao({ variante: 'secundario', pequeno: true })} href={achado.url} target="_blank" rel="noopener">
              Abrir
            </a>
            <Botao variante="secundario" pequeno onClick={() => guardar(null)}>
              Não é essa
            </Botao>
          </div>
        </div>
      )}

      {procurou && !achado && !acao.ocupado && (
        <Vazio icone="cifra">O Cifra Club não achou o tom desta música. Escolha à mão no teclado.</Vazio>
      )}
    </>
  )
}
