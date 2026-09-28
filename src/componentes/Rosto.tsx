import { useState } from 'react'
import { inicialDoNome, urlDaFoto } from '../perfil/perfil'
import type { Rosto as DadosDoRosto } from '../perfil/perfil'

type Props = DadosDoRosto & { tamanho?: 'pequena' | 'mini' }

export function Rosto({ membroId, nome, foto, tamanho }: Props) {
  const [quebrada, marcarQuebrada] = useState<string | null>(null)
  const url = foto ? urlDaFoto(membroId, foto) : null

  return (
    <span className={tamanho ? `inicial ${tamanho}` : 'inicial'} aria-hidden="true">
      {url && url !== quebrada ? (
        <img src={url} alt="" loading="lazy" decoding="async" onError={() => marcarQuebrada(url)} />
      ) : (
        inicialDoNome(nome)
      )}
    </span>
  )
}
