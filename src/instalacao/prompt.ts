import { useSyncExternalStore } from 'react'
import { criarInstalacao } from './instalacao'
import type { Instalacao, ResultadoDaInstalacao, SituacaoDaInstalacao } from './instalacao'

const SEM_NAVEGADOR: Instalacao = {
  situacao: () => ({ disponivel: false, instalado: false }),
  assinar: () => () => {},
  instalar: async () => 'indisponivel',
}

let doApp: Instalacao = SEM_NAVEGADOR

// Precisa rodar antes do React montar: o Chrome dispara beforeinstallprompt cedo, uma vez por carregamento.
export function ouvirInstalacao(alvo: EventTarget = window): void {
  doApp = criarInstalacao(alvo)
}

export function usarInstalacao(): SituacaoDaInstalacao & { instalar: () => Promise<ResultadoDaInstalacao> } {
  const situacao = useSyncExternalStore(doApp.assinar, doApp.situacao)
  return { ...situacao, instalar: doApp.instalar }
}
