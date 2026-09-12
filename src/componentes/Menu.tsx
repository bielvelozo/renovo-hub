import { Menu as MenuBase } from '@base-ui-components/react/menu'
import { Icone } from '../casca/Icone'
import type { NomeDoIcone } from '../casca/Icone'
import { Botao } from './Botao'

export type ItemDoMenu = {
  rotulo: string
  icone: NomeDoIcone
  aoEscolher: () => void
  perigo?: boolean
  desligado?: boolean
}

export function Menu({ itens, rotulo = 'Mais' }: { itens: ItemDoMenu[]; rotulo?: string }) {
  return (
    <MenuBase.Root>
      <MenuBase.Trigger render={<Botao variante="icone" icone="mais" aria-label={rotulo} />} />
      <MenuBase.Portal>
        <MenuBase.Positioner className="posicao-do-menu" side="bottom" align="end" sideOffset={6}>
          <MenuBase.Popup className="menu">
            {itens.map((item) => (
              <MenuBase.Item
                key={item.rotulo}
                className={`item-do-menu${item.perigo ? ' perigo' : ''}`}
                disabled={item.desligado}
                onClick={item.aoEscolher}
              >
                <Icone nome={item.icone} />
                <span>{item.rotulo}</span>
              </MenuBase.Item>
            ))}
          </MenuBase.Popup>
        </MenuBase.Positioner>
      </MenuBase.Portal>
    </MenuBase.Root>
  )
}
