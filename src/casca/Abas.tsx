import { NavLink } from 'react-router'
import type { Eu } from '../sessao/sessao'
import { Icone } from './Icone'
import type { NomeDoIcone } from './Icone'

type Aba = {
  para: string
  rotulo: string
  icone: NomeDoIcone
  soMinistro?: boolean
}

const ABAS: Aba[] = [
  { para: '/', rotulo: 'Início', icone: 'inicio' },
  { para: '/mes', rotulo: 'Mês', icone: 'mes', soMinistro: true },
  { para: '/musicas', rotulo: 'Músicas', icone: 'musicas' },
  { para: '/sugestoes', rotulo: 'Sugestões', icone: 'sugestoes' },
  { para: '/perfil', rotulo: 'Perfil', icone: 'perfil' },
]

export function Abas({ eu, sugestoes }: { eu: Eu; sugestoes: number }) {
  const dirige = eu.ministro || eu.admin

  return (
    <nav className="abas" aria-label="Seções do app">
      {ABAS.filter((aba) => dirige || !aba.soMinistro).map((aba) => (
        <NavLink key={aba.para} to={aba.para} end={aba.para === '/'}>
          <Icone nome={aba.icone} />
          <span>{aba.rotulo}</span>
          {aba.icone === 'sugestoes' && sugestoes > 0 && (
            <span className="contagem" aria-label={`${sugestoes} sem promover`}>
              {sugestoes > 99 ? '99+' : sugestoes}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
