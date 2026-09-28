import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Drawer } from 'vaul'
import { Botao } from './Botao'

export function Folha({
  titulo,
  fechar,
  aberta = true,
  children,
}: {
  titulo: string
  fechar: () => void
  aberta?: boolean
  children: ReactNode
}) {
  const painel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    painel.current?.focus({ preventScroll: true })
  }, [])

  return (
    <Drawer.Root
      open={aberta}
      onOpenChange={(aberto) => {
        if (!aberto) fechar()
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="folha-fundo" />
        <Drawer.Content className="folha" aria-describedby={undefined}>
          <Drawer.Handle className="alca-da-folha" />
          <div className="painel" ref={painel} tabIndex={-1}>
            <Drawer.Title className="titulo-da-folha">{titulo}</Drawer.Title>
            {children}
            <Botao variante="secundario" largo onClick={fechar}>
              Fechar
            </Botao>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
