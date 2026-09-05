import { useCallback, useEffect, useState } from 'react'
import { usarAcao } from '../api/usarAcao'
import type { Acao } from '../api/usarAcao'
import {
  ativarPush,
  desligarPush,
  enviarPushDeTeste,
  estaInstalado,
  inscricaoAtual,
  permissaoAtual,
  reenviarInscricao,
  silenciar,
  suportaPush,
} from './navegador'
import { situacaoDoPush } from './push'
import type { SituacaoDoPush } from './push'

export type Push = {
  situacao: SituacaoDoPush
  acao: Acao
  recado: string | null
  ativar: () => void
  desligar: () => void
  testar: () => void
  definirSilencio: (silenciado: boolean) => void
}

export function usarPush(silenciadoInicial: boolean): Push {
  const acao = usarAcao()
  const [inscrito, marcarInscrito] = useState(false)
  const [silenciado, marcarSilenciado] = useState(silenciadoInicial)
  const [permissao, marcarPermissao] = useState(permissaoAtual)
  const [recado, contar] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true

    inscricaoAtual()
      .then((inscricao) => {
        if (!vivo) return
        marcarInscrito(inscricao !== null)
        return inscricao ? reenviarInscricao() : undefined
      })
      .catch(() => undefined)

    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => marcarSilenciado(silenciadoInicial), [silenciadoInicial])

  const ativar = useCallback(() => {
    contar(null)
    acao.executar(async () => {
      await ativarPush()
      marcarPermissao(permissaoAtual())
      marcarInscrito(true)
      contar('Pronto: este aparelho vai receber os avisos.')
    })
  }, [acao])

  const desligar = useCallback(() => {
    contar(null)
    acao.executar(async () => {
      await desligarPush()
      marcarInscrito(false)
    })
  }, [acao])

  const testar = useCallback(() => {
    contar(null)
    acao.executar(async () => {
      const aparelhos = await enviarPushDeTeste()
      contar(
        aparelhos
          ? 'Push de teste enviado. Se não chegar em alguns segundos, confira as notificações nos Ajustes.'
          : 'Nada foi enviado: confira se as notificações estão liberadas neste aparelho.',
      )
    })
  }, [acao])

  const definirSilencio = useCallback(
    (proximo: boolean) => {
      contar(null)
      acao.executar(async () => {
        await silenciar(proximo)
        marcarSilenciado(proximo)
      })
    },
    [acao],
  )

  return {
    situacao: situacaoDoPush({
      suportado: suportaPush(),
      instalado: estaInstalado(),
      permissao,
      inscrito,
      silenciado,
    }),
    acao,
    recado,
    ativar,
    desligar,
    testar,
    definirSilencio,
  }
}
