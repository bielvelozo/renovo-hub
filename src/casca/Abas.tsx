import { useState } from 'react'
import { NavLink } from 'react-router'
import type { Eu } from '../sessao/sessao'
import { Icone } from './Icone'
import type { NomeDoIcone } from './Icone'

type Aba = {
  para: string
  rotulo: string
  icone: NomeDoIcone
}

const ABAS: Aba[] = [
  { para: '/', rotulo: 'Início', icone: 'casa' },
  { para: '/mes', rotulo: 'Mês', icone: 'calendario' },
  { para: '/musicas', rotulo: 'Músicas', icone: 'musica' },
  { para: '/sugestoes', rotulo: 'Sugestões', icone: 'lampada' },
  { para: '/perfil', rotulo: 'Perfil', icone: 'pessoa' },
]

export function Abas({ eu, sugestoes }: { eu: Eu; sugestoes: number }) {
  const dirige = eu.ministro || eu.admin
  const [saltando, saltar] = useState<string | null>(null)

  return (
    <nav className="abas" aria-label="Seções do app">
      {ABAS.map((aba) => (
        <NavLink key={aba.para} to={aba.para} end={aba.para === '/'} onClick={() => saltar(aba.para)}>
          <span
            className={`icone-da-aba${saltando === aba.para ? ' saltando' : ''}`}
            onAnimationEnd={() => saltar(null)}
          >
            <Icone nome={aba.icone} />
          </span>
          <span>{aba.rotulo}</span>
          {aba.icone === 'lampada' && dirige && sugestoes > 0 && (
            <span className="contagem" aria-label={`${sugestoes} sem promover`}>
              {sugestoes > 99 ? '99+' : sugestoes}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
