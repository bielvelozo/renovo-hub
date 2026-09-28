import { Menu as MenuBase } from '@base-ui-components/react/menu'
import type { ReactElement } from 'react'
import { Icone } from '../casca/Icone'
import type { NomeDoIcone } from '../casca/Icone'
import { Botao } from './Botao'

export type ItemDoMenu = {
  rotulo: string
  icone?: NomeDoIcone
  aoEscolher: () => void
  perigo?: boolean
  desligado?: boolean
  marcado?: boolean
}

export function Menu({
  itens,
  rotulo = 'Mais',
  gatilho,
  guia,
}: {
  itens: ItemDoMenu[]
  rotulo?: string
  gatilho?: ReactElement
  guia?: string
}) {
  return (
    <MenuBase.Root>
      <MenuBase.Trigger data-guia={guia} render={gatilho ?? <Botao variante="icone" icone="mais" aria-label={rotulo} />} />
      <MenuBase.Portal>
        <MenuBase.Positioner className="posicao-do-menu" side="bottom" align="end" sideOffset={6}>
          <MenuBase.Popup className="menu">
            {itens.map((item) => (
              <MenuBase.Item
                key={item.rotulo}
                className={`item-do-menu${item.perigo ? ' perigo' : ''}${item.marcado ? ' marcado' : ''}`}
                disabled={item.desligado}
                onClick={item.aoEscolher}
              >
                {item.icone ? <Icone nome={item.icone} /> : item.marcado ? <Icone nome="confirmar" /> : <span className="icone" aria-hidden="true" />}
                <span>{item.rotulo}</span>
              </MenuBase.Item>
            ))}
          </MenuBase.Popup>
        </MenuBase.Positioner>
      </MenuBase.Portal>
    </MenuBase.Root>
  )
}
