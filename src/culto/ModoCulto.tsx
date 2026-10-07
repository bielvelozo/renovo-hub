import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Outlet, useNavigate, useOutletContext, useParams } from 'react-router'
import type { EscalaDoCulto, MusicaDoCulto } from '../api/tipos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Esqueleto } from '../componentes/Esqueleto'
import { Vazio } from '../componentes/Vazio'
import { marcarTarefa } from '../guia/andamento'
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
}

export function usarCulto(): Culto {
  return useOutletContext<Culto>()
}

export function ModoCulto() {
  const { escalaId = '' } = useParams()
  const navegar = useNavigate()
  const { pacote, atualizadoEm, baixando, erro, semSessao, baixar } = usarPacote()

  usarTelaAcesa()

  useEffect(() => baixar(), [baixar])
  useEffect(() => marcarTarefa('modo-culto'), [])

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
            Essa escala não está neste aparelho. Conecte à internet e toque em Atualizar.
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
      <Esqueleto forma="cartao" quantidade={3} />
    </div>
  )
}

function usarTelaAcesa() {
  useEffect(() => {
    let trava: WakeLockSentinel | null = null
    let saiu = false

    const pedir = async () => {
      try {
        trava = (await navigator.wakeLock?.request('screen')) ?? null
        if (saiu) soltar()
      } catch {
        trava = null
      }
    }

    const soltar = () => {
      trava?.release().catch(() => {})
      trava = null
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
}
