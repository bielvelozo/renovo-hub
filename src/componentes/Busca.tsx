import { Icone } from '../casca/Icone'

export function Busca({
  valor,
  aoMudar,
  placeholder = 'parte do título ou do artista',
  rotulo = 'Buscar',
  autoFoco,
  guia,
}: {
  valor: string
  aoMudar: (valor: string) => void
  placeholder?: string
  rotulo?: string
  autoFoco?: boolean
  guia?: string
}) {
  return (
    <div className="busca" data-guia={guia}>
      <Icone nome="busca" />
      <input
        type="search"
        value={valor}
        placeholder={placeholder}
        aria-label={rotulo}
        autoFocus={autoFoco}
        autoComplete="off"
        onChange={(evento) => aoMudar(evento.target.value)}
      />
      {valor && (
        <button type="button" className="limpar" aria-label="Limpar busca" onClick={() => aoMudar('')}>
          <Icone nome="limpar" />
        </button>
      )}
    </div>
  )
}
