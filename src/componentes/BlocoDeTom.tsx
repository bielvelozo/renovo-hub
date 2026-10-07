import { useState } from 'react'
import { api } from '../api/cliente'
import type { AchadoNoCifraClub, ExecucaoApresentada, TomSugeridoApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { TOM_ORIGINAL, buscaNoCifraClub, hojeEmBrasilia } from '../dominio'
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
}: {
  tom: string | null
  sugerido: TomSugeridoApresentado | null
  historico: ExecucaoApresentada[]
  tomOriginal: string | null
  musica: { titulo: string; artista: string }
  escolher: (tom: string) => void
}) {
  return (
    <div className="secao" data-guia="tom">
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

      <BuscaNoCifraClub musica={musica} rotulo="Descobrir o tom no Cifra Club" />

      {historico.length > 1 && <p className="dica">Histórico: {textoDoHistorico(historico)}</p>}
    </div>
  )
}

type Procura = { estado: 'parada' } | { estado: 'achou'; achado: AchadoNoCifraClub } | { estado: 'nada' | 'descartou' }

export function BuscaNoCifraClub({
  musica,
  rotulo = 'Buscar no Cifra Club',
  classe = 'secundario largo',
}: {
  musica: { titulo: string; artista: string }
  rotulo?: string
  classe?: string
}) {
  const acao = usarAcao()
  const [procura, mudar] = useState<Procura>({ estado: 'parada' })

  const procurar = () =>
    acao.executar(async () => {
      const busca = new URLSearchParams({ termo: musica.titulo, artista: musica.artista })
      const { achado } = await api<{ achado: AchadoNoCifraClub | null }>(`/api/cifraclub?${busca}`)
      mudar(achado ? { estado: 'achou', achado } : { estado: 'nada' })
    })

  return (
    <>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <Botao className={classe} carregando={acao.ocupado} onClick={procurar}>
        {rotulo}
      </Botao>

      {procura.estado === 'achou' && (
        <div className="achado">
          <p className="titulo">
            {procura.achado.titulo} · {procura.achado.artista}
          </p>
          <p className="dica">O tom fica no alto da cifra. Confira se é a mesma música e escolha o mesmo tom no teclado.</p>
          <div className="acoes">
            <a className={classesDoBotao({ pequeno: true })} href={procura.achado.url} target="_blank" rel="noopener">
              Abrir a cifra
            </a>
            <Botao variante="secundario" pequeno onClick={() => mudar({ estado: 'descartou' })}>
              Não é essa
            </Botao>
          </div>
        </div>
      )}

      {(procura.estado === 'nada' || procura.estado === 'descartou') && !acao.ocupado && (
        <Vazio
          icone="cifra"
          acao={
            <a
              className={classesDoBotao({ variante: 'secundario', pequeno: true })}
              href={buscaNoCifraClub(musica)}
              target="_blank"
              rel="noopener"
            >
              Procurar no Cifra Club
            </a>
          }
        >
          {procura.estado === 'nada'
            ? 'A busca não achou a cifra desta música. Procure no site e escolha o tom no teclado.'
            : 'Procure a versão certa no site e escolha o tom no teclado.'}
        </Vazio>
      )}
    </>
  )
}
