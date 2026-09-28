import { describe, expect, it, vi } from 'vitest'
import { criarInstalacao } from './instalacao'

function eventoDeInstalacao(escolha: 'accepted' | 'dismissed') {
  const evento = new Event('beforeinstallprompt', { cancelable: true })
  const prompt = vi.fn(async () => {})
  Object.assign(evento, { prompt, userChoice: Promise.resolve({ outcome: escolha }) })
  return { evento, prompt }
}

describe('criarInstalacao', () => {
  it('guarda o evento do navegador e segura o aviso automático', () => {
    const alvo = new EventTarget()
    const instalacao = criarInstalacao(alvo)
    const { evento } = eventoDeInstalacao('accepted')

    alvo.dispatchEvent(evento)

    expect(evento.defaultPrevented).toBe(true)
    expect(instalacao.situacao()).toEqual({ disponivel: true, instalado: false })
  })

  it('avisa quem assina quando o evento chega', () => {
    const alvo = new EventTarget()
    const instalacao = criarInstalacao(alvo)
    const avisado = vi.fn()
    instalacao.assinar(avisado)

    alvo.dispatchEvent(eventoDeInstalacao('accepted').evento)

    expect(avisado).toHaveBeenCalled()
  })

  it('abre o diálogo nativo e devolve aceito quando a pessoa instala', async () => {
    const alvo = new EventTarget()
    const instalacao = criarInstalacao(alvo)
    const { evento, prompt } = eventoDeInstalacao('accepted')
    alvo.dispatchEvent(evento)

    expect(await instalacao.instalar()).toBe('aceito')
    expect(prompt).toHaveBeenCalledOnce()
    expect(instalacao.situacao()).toEqual({ disponivel: false, instalado: true })
  })

  it('devolve recusado e gasta o evento quando a pessoa fecha o diálogo', async () => {
    const alvo = new EventTarget()
    const instalacao = criarInstalacao(alvo)
    alvo.dispatchEvent(eventoDeInstalacao('dismissed').evento)

    expect(await instalacao.instalar()).toBe('recusado')
    expect(instalacao.situacao()).toEqual({ disponivel: false, instalado: false })
  })

  it('devolve indisponível sem evento do navegador', async () => {
    const instalacao = criarInstalacao(new EventTarget())

    expect(await instalacao.instalar()).toBe('indisponivel')
  })

  it('marca instalado quando o navegador avisa que o app foi instalado', () => {
    const alvo = new EventTarget()
    const instalacao = criarInstalacao(alvo)
    alvo.dispatchEvent(eventoDeInstalacao('accepted').evento)

    alvo.dispatchEvent(new Event('appinstalled'))

    expect(instalacao.situacao()).toEqual({ disponivel: false, instalado: true })
  })
})
