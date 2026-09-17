import { useCallback, useEffect, useState } from 'react'
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

  useEffect(() => assinarPacote(() => guardar(pacoteDoAparelho())), [])

  const baixar = useCallback(() => {
    marcarBaixando(true)

    baixarPacote()
      .then(() => guardarErro(null))
      .catch((problema: unknown) => {
        if (problema instanceof ErroDaApi && precisaEntrar(problema.status)) marcarSemSessao(true)
        guardarErro(textoDoErro(problema))
      })
      .finally(() => marcarBaixando(false))
  }, [])

  return { pacote, atualizadoEm: pacote?.geradoEm ?? null, baixando, erro, semSessao, baixar }
}
