import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { Icone } from '../casca/Icone'
import { Botao } from '../componentes/Botao'
import { passarAdiante, sairDoGuia, usarAndamento } from './andamento'
import { TAREFAS } from './tarefas'
import type { Andamento } from './tarefas'

const ESPERA_PELO_ALVO = 1500
const ALTURA_PROVAVEL_DO_BALAO = 210
const FOLGA = 12

export function BalaoDoGuia() {
  const andamento = usarAndamento()
  if (!andamento) return null

  return createPortal(<Balao key={`${andamento.tarefa}:${andamento.passo}`} andamento={andamento} />, document.body)
}

function acharAlvo(nome: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-guia="${nome}"]`)
}

function Balao({ andamento }: { andamento: Andamento }) {
  const tarefa = TAREFAS[andamento.tarefa]
  const passo = tarefa.passos[andamento.passo]
  const proximoAlvo = tarefa.passos[andamento.passo + 1]?.alvo
  const ultimo = andamento.passo === tarefa.passos.length - 1
  const { pathname } = useLocation()
  const [caixa, guardarCaixa] = useState<DOMRect | null>(null)
  const [perdido, marcarPerdido] = useState(false)
  const rolou = useRef(false)

  useEffect(() => {
    const comeco = Date.now()

    const medir = () => {
      const alvo = acharAlvo(passo.alvo)

      if (passo.avanco === 'aparecer' && proximoAlvo && proximoAlvo !== passo.alvo && acharAlvo(proximoAlvo)) {
        passarAdiante()
        return
      }

      if (alvo) {
        if (!rolou.current) {
          alvo.scrollIntoView?.({ block: 'center' })
          rolou.current = true
        }
        guardarCaixa(alvo.getBoundingClientRect())
        marcarPerdido(false)
        return
      }

      guardarCaixa(null)
      if (Date.now() - comeco < ESPERA_PELO_ALVO) return
      if (passo.opcional) passarAdiante()
      else marcarPerdido(true)
    }

    medir()
    const relogio = window.setInterval(medir, 200)
    window.addEventListener('scroll', medir, true)
    window.addEventListener('resize', medir)

    return () => {
      window.clearInterval(relogio)
      window.removeEventListener('scroll', medir, true)
      window.removeEventListener('resize', medir)
    }
  }, [passo, proximoAlvo])

  useEffect(() => {
    if (passo.avanco === 'rota' && passo.rota?.test(pathname)) passarAdiante()
  }, [passo, pathname])

  useEffect(() => {
    if (passo.avanco !== 'toque') return

    // Na captura, antes do próprio alvo tratar o toque: o guia avança e a ação do botão segue normal.
    const aoTocar = (evento: MouseEvent) => {
      const alvo = acharAlvo(passo.alvo)
      if (alvo && evento.target instanceof Node && alvo.contains(evento.target)) window.setTimeout(passarAdiante, 0)
    }

    document.addEventListener('click', aoTocar, true)
    return () => document.removeEventListener('click', aoTocar, true)
  }, [passo])

  const larguraDaTela = window.innerWidth
  const alturaDaTela = window.innerHeight
  const largura = Math.min(larguraDaTela - FOLGA * 2, 400)
  const esquerda = Math.round((larguraDaTela - largura) / 2)
  const alvoGrande = caixa !== null && caixa.height > alturaDaTela * 0.55
  const embaixo = caixa !== null && !alvoGrande && caixa.bottom + ALTURA_PROVAVEL_DO_BALAO + FOLGA < alturaDaTela

  const posicao: CSSProperties =
    caixa === null || alvoGrande
      ? { left: esquerda, width: largura, bottom: FOLGA + 8 }
      : embaixo
        ? { left: esquerda, width: largura, top: caixa.bottom + 14 }
        : { left: esquerda, width: largura, bottom: alturaDaTela - caixa.top + 14 }

  const setaEm =
    caixa === null || alvoGrande
      ? null
      : Math.min(Math.max(caixa.left + caixa.width / 2 - esquerda - 7, 18), largura - 32)

  const texto = perdido ? (passo.semAlvo ?? passo.texto) : passo.texto

  return (
    <>
      {caixa && (
        <div
          className="foco-do-guia"
          aria-hidden="true"
          style={{ top: caixa.top - 6, left: caixa.left - 6, width: caixa.width + 12, height: caixa.height + 12 }}
        />
      )}

      <div className="balao-do-guia" role="dialog" aria-label={`Guia: ${tarefa.titulo}`} style={posicao}>
        {setaEm !== null && <span className={`seta-do-balao ${embaixo ? 'em-cima' : 'embaixo'}`} style={{ left: setaEm }} />}

        <div className="topo-do-balao">
          <span className="rotulo">
            Passo {andamento.passo + 1} de {tarefa.passos.length}
          </span>
          <button type="button" className="botao icone" aria-label="Sair do guia" onClick={sairDoGuia}>
            <Icone nome="remover" />
          </button>
        </div>

        <h2 className="titulo titulo-do-balao">{passo.titulo}</h2>
        <p className="dica">{texto}</p>

        <div className="rodape-do-balao">
          <span className="pontos-do-guia" aria-hidden="true">
            {tarefa.passos.map((_, indice) => (
              <span key={indice} className={indice === andamento.passo ? 'atual' : undefined} />
            ))}
          </span>

          {perdido && passo.semAlvo ? (
            <Botao variante="secundario" pequeno onClick={sairDoGuia}>
              Entendi
            </Botao>
          ) : passo.avanco === 'proximo' ? (
            <Botao pequeno onClick={passarAdiante}>
              {ultimo ? 'Concluir' : 'Próximo'}
            </Botao>
          ) : (
            <span className="sua-vez">Sua vez: toque no destaque</span>
          )}
        </div>
      </div>
    </>
  )
}
