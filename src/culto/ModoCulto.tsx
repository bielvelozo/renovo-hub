import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Outlet, useNavigate, useOutletContext, useParams } from 'react-router'
import type { EscalaDoCulto, MusicaDoCulto } from '../api/tipos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Esqueleto } from '../componentes/Esqueleto'
import { Vazio } from '../componentes/Vazio'
import { DIAS_PARA_PACOTE_VELHO, idadeDoPacote } from './pacote'
import { usarPacote } from './usarPacote'

export type Culto = {
  escala: EscalaDoCulto
  catalogo: MusicaDoCulto[]
  atualizadoEm: string | null
  velho: boolean
  erroAoAtualizar: string | null
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

  useEffect(() => {
    if (semSessao) navegar('/esqueci', { replace: true })
  }, [semSessao, navegar])

  return <section className="culto">{dentro()}</section>

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
          <Vazio icone="calendario">Essa escala não está no pacote de hoje</Vazio>
        </Fora>
      )
    }

    const culto: Culto = {
      escala,
      catalogo: pacote.catalogo,
      atualizadoEm,
      velho: idadeDoPacote(pacote, new Date()) > DIAS_PARA_PACOTE_VELHO,
      erroAoAtualizar: erro,
    }

    return <Outlet context={culto} />
  }
}

export function TopoDoCulto({ fecharPara, children }: { fecharPara: string; children: ReactNode }) {
  return (
    <div className="topo-do-culto">
      {children}
      <BotaoLink para={fecharPara} variante="icone" icone="remover" aria-label="Sair do modo culto" />
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

function usarTelaAcesa(): void {
  useEffect(() => {
    let trava: WakeLockSentinel | null = null
    let saiu = false

    // Aparelho sem a API, navegador que nega ou aba em segundo plano: o culto segue sem travar a tela.
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
