import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Outlet, useNavigate, useOutletContext, useParams } from 'react-router'
import type { EscalaDoCulto, MusicaDoCulto } from '../api/tipos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Esqueleto } from '../componentes/Esqueleto'
import { Vazio } from '../componentes/Vazio'
import { marcarTarefa } from '../guia/andamento'
import { escurecerABarra } from './barraDoSistema'
import { DIAS_PARA_PACOTE_VELHO, idadeDoPacote } from './pacote'
import { usarPacote } from './usarPacote'

export type Culto = {
  escala: EscalaDoCulto
  catalogo: MusicaDoCulto[]
  atualizadoEm: string | null
  velho: boolean
  erroAoAtualizar: string | null
  baixando: boolean
  atualizar: () => void
  telaAcesa: boolean
}

export function usarCulto(): Culto {
  return useOutletContext<Culto>()
}

export function ModoCulto() {
  const { escalaId = '' } = useParams()
  const navegar = useNavigate()
  const { pacote, atualizadoEm, baixando, erro, semSessao, baixar } = usarPacote()

  const telaAcesa = usarTelaAcesa()

  useEffect(() => baixar(), [baixar])
  useEffect(() => marcarTarefa('modo-culto'), [])
  useEffect(() => escurecerABarra(), [])

  // Sessão expirada não tira o palco de quem já tem o pacote guardado; sem pacote, só entrando de novo.
  useEffect(() => {
    if (semSessao && !pacote) navegar('/esqueci', { replace: true })
  }, [semSessao, pacote, navegar])

  return <main className="culto">{dentro()}</main>

  function dentro(): ReactNode {
    if (!pacote) {
      if (erro && !baixando) {
        return (
          <Fora>
            <Vazio
              icone="sem-conexao"
              acao={
                <Botao onClick={baixar} carregando={baixando}>
                  Tentar de novo
                </Botao>
              }
            >
              Abra o app com internet uma vez antes do culto
            </Vazio>
          </Fora>
        )
      }

      return <Esperando />
    }

    const escala = pacote.escalas.find((candidata) => candidata.id === escalaId)

    if (!escala) {
      if (baixando) return <Esperando />

      return (
        <Fora>
          <Vazio
            icone="calendario"
            acao={
              <Botao onClick={baixar} carregando={baixando}>
                Atualizar
              </Botao>
            }
          >
            Essa escala não está guardada no aparelho. O modo culto guarda as escalas dos próximos 30 dias; com
            internet, atualize para buscá-la.
          </Vazio>
        </Fora>
      )
    }

    const culto: Culto = {
      escala,
      catalogo: pacote.catalogo,
      atualizadoEm,
      velho: idadeDoPacote(pacote, new Date()) > DIAS_PARA_PACOTE_VELHO,
      erroAoAtualizar: erro,
      baixando,
      atualizar: baixar,
      telaAcesa,
    }

    return <Outlet context={culto} />
  }
}

export function TopoDoCulto({ fecharPara, children }: { fecharPara: string; children: ReactNode }) {
  return (
    <div className="topo-do-culto">
      {children}
      <BotaoLink para={fecharPara} variante="icone" icone="remover" aria-label="Sair do modo culto" data-guia="culto-sair" />
    </div>
  )
}

function Fora({ children }: { children: ReactNode }) {
  return (
    <div className="rolagem culto-parado">
      <h1 className="visualmente-oculto">Modo culto</h1>
      {children}
      <BotaoLink para="/" variante="secundario">
        Sair
      </BotaoLink>
    </div>
  )
}

function Esperando() {
  return (
    <div className="rolagem">
      <h1 className="visualmente-oculto">Modo culto</h1>
      <Esqueleto forma="cartao" quantidade={3} />
    </div>
  )
}

function usarTelaAcesa(): boolean {
  const [acesa, marcarAcesa] = useState(false)

  useEffect(() => {
    let trava: WakeLockSentinel | null = null
    let saiu = false

    // Aparelho sem a API, navegador que nega ou aba em segundo plano: o culto segue sem travar a tela,
    // e a Ordem só promete a tela acesa enquanto a trava está de fato na mão.
    const pedir = async () => {
      try {
        trava = (await navigator.wakeLock?.request('screen')) ?? null
        if (saiu) return soltar()

        trava?.addEventListener('release', () => marcarAcesa(false))
        marcarAcesa(!!trava)
      } catch {
        trava = null
        marcarAcesa(false)
      }
    }

    const soltar = () => {
      trava?.release().catch(() => {})
      trava = null
      marcarAcesa(false)
    }

    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void pedir()
    }

    void pedir()
    document.addEventListener('visibilitychange', aoVoltar)

    return () => {
      saiu = true
      document.removeEventListener('visibilitychange', aoVoltar)
      soltar()
    }
  }, [])

  return acesa
}
