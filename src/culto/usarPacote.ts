import { useCallback, useEffect, useRef, useState } from 'react'
import { ErroDaApi, textoDoErro } from '../api/cliente'
import { precisaEntrar } from '../api/erros'
import type { Pacote } from '../api/tipos'
import { assinarPacote, baixarPacote, pacoteDoAparelho } from './pacote'

export type PacoteNaTela = {
  pacote: Pacote | null
  atualizadoEm: string | null
  baixando: boolean
  erro: string | null
  semSessao: boolean
  baixar: () => void
}

export function usarPacote(): PacoteNaTela {
  const [pacote, guardar] = useState<Pacote | null>(pacoteDoAparelho)
  const [baixando, marcarBaixando] = useState(false)
  const [erro, guardarErro] = useState<string | null>(null)
  const [semSessao, marcarSemSessao] = useState(false)
  const emAndamento = useRef(false)

  useEffect(() => assinarPacote(() => guardar(pacoteDoAparelho())), [])

  const baixar = useCallback(() => {
    if (emAndamento.current) return
    emAndamento.current = true
    marcarBaixando(true)

    baixarPacote()
      .then(() => guardarErro(null))
      .catch((problema: unknown) => {
        if (problema instanceof ErroDaApi && precisaEntrar(problema.status)) marcarSemSessao(true)
        guardarErro(textoDoErro(problema))
      })
      .finally(() => {
        emAndamento.current = false
        marcarBaixando(false)
      })
  }, [])

  // O Ministro pode mudar a ordem com o culto aberto: o pacote pulsa ao voltar a ter internet
  // e ao voltar para o app, além do mount e do botão Atualizar.
  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') baixar()
    }

    window.addEventListener('online', baixar)
    document.addEventListener('visibilitychange', aoVoltar)

    return () => {
      window.removeEventListener('online', baixar)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [baixar])

  return { pacote, atualizadoEm: pacote?.geradoEm ?? null, baixando, erro, semSessao, baixar }
}
