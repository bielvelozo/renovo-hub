import type { KeyboardEvent, PointerEvent } from 'react'

export function Alca({
  rotulo,
  onPointerDown,
  onKeyDown,
}: {
  rotulo: string
  onPointerDown: (evento: PointerEvent<HTMLElement>) => void
  onKeyDown: (evento: KeyboardEvent<HTMLElement>) => void
}) {
  return (
    <button
      type="button"
      className="alca"
      aria-label={`Mover ${rotulo}. Use as setas pra cima e pra baixo.`}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="6" r="1.6" />
        <circle cx="15" cy="6" r="1.6" />
        <circle cx="9" cy="12" r="1.6" />
        <circle cx="15" cy="12" r="1.6" />
        <circle cx="9" cy="18" r="1.6" />
        <circle cx="15" cy="18" r="1.6" />
      </svg>
    </button>
  )
}
