import type { HTMLAttributes, ReactNode } from 'react'

export function Cartao({
  destaque,
  className,
  children,
  ...resto
}: { destaque?: boolean; className?: string; children: ReactNode } & Omit<HTMLAttributes<HTMLDivElement>, 'className'>) {
  return (
    <div {...resto} className={['cartao', destaque && 'destaque', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
