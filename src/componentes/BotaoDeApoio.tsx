import { Icone } from '../casca/Icone'

export function BotaoDeApoio({
  apoios,
  apoiei,
  desligado,
  aoTocar,
}: {
  apoios: number
  apoiei: boolean
  desligado?: boolean
  aoTocar: () => void
}) {
  return (
    <button
      type="button"
      className={`botao-de-apoio${apoiei ? ' apoiado' : ''}`}
      aria-pressed={apoiei}
      disabled={desligado}
      aria-label={apoiei ? 'Desapoiar' : 'Apoiar'}
      onClick={aoTocar}
    >
      <Icone nome="coracao" />
      <span>{apoios}</span>
    </button>
  )
}
