import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { Icone } from '../casca/Icone'
import type { NomeDoIcone } from '../casca/Icone'

export type VarianteDoBotao = 'primario' | 'secundario' | 'terciario' | 'icone' | 'perigo'

type Aparencia = {
  variante?: VarianteDoBotao
  pequeno?: boolean
  largo?: boolean
  icone?: NomeDoIcone
  className?: string
}

type PropriedadesDoBotao = Aparencia &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    carregando?: boolean
    children?: ReactNode
  }

export function classesDoBotao({ variante = 'primario', pequeno, largo, className }: Aparencia): string {
  return ['botao', variante !== 'primario' && variante, pequeno && 'pequeno', largo && 'largo', className]
    .filter(Boolean)
    .join(' ')
}

export function Botao({
  variante,
  pequeno,
  largo,
  icone,
  className,
  carregando = false,
  disabled,
  type = 'button',
  children,
  ...resto
}: PropriedadesDoBotao) {
  return (
    <button
      {...resto}
      type={type}
      className={classesDoBotao({ variante, pequeno, largo, className }) + (carregando ? ' carregando' : '')}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
    >
      {icone && <Icone nome={icone} />}
      {children !== undefined && <span className="conteudo-do-botao">{children}</span>}
      {carregando && <span className="girando-no-botao" aria-hidden="true" />}
    </button>
  )
}

export function BotaoLink({
  para,
  variante,
  pequeno,
  largo,
  icone,
  className,
  children,
  ...resto
}: Aparencia & { para: string; children?: ReactNode; 'aria-label'?: string; title?: string }) {
  return (
    <Link {...resto} to={para} className={classesDoBotao({ variante, pequeno, largo, className })}>
      {icone && <Icone nome={icone} />}
      {children !== undefined && <span className="conteudo-do-botao">{children}</span>}
    </Link>
  )
}
