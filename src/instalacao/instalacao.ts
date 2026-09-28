type EventoDeInstalacao = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type ResultadoDaInstalacao = 'aceito' | 'recusado' | 'indisponivel'

export type SituacaoDaInstalacao = { disponivel: boolean; instalado: boolean }

export type Instalacao = {
  situacao: () => SituacaoDaInstalacao
  assinar: (avisar: () => void) => () => void
  instalar: () => Promise<ResultadoDaInstalacao>
}

export function criarInstalacao(alvo: EventTarget): Instalacao {
  let evento: EventoDeInstalacao | null = null
  let situacao: SituacaoDaInstalacao = { disponivel: false, instalado: false }
  const assinantes = new Set<() => void>()

  const mudar = (instalado = situacao.instalado) => {
    situacao = { disponivel: evento !== null, instalado }
    assinantes.forEach((avisar) => avisar())
  }

  alvo.addEventListener('beforeinstallprompt', (recebido) => {
    recebido.preventDefault()
    evento = recebido as EventoDeInstalacao
    mudar()
  })

  alvo.addEventListener('appinstalled', () => {
    evento = null
    mudar(true)
  })

  return {
    situacao: () => situacao,
    assinar: (avisar) => {
      assinantes.add(avisar)
      return () => assinantes.delete(avisar)
    },
    instalar: async () => {
      const guardado = evento
      if (!guardado) return 'indisponivel'

      // O navegador só aceita um prompt() por evento.
      evento = null
      mudar()

      try {
        await guardado.prompt()
        const { outcome } = await guardado.userChoice
        if (outcome !== 'accepted') return 'recusado'
        mudar(true)
        return 'aceito'
      } catch {
        return 'indisponivel'
      }
    },
  }
}
