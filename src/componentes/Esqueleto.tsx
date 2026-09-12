export type FormaDoEsqueleto = 'linha-de-musica' | 'cartao' | 'paragrafo'

export function Esqueleto({ forma, quantidade = 1 }: { forma: FormaDoEsqueleto; quantidade?: number }) {
  return (
    <div className="esqueleto" role="status" aria-label="Carregando" aria-busy="true">
      {Array.from({ length: quantidade }, (_, i) => (
        <Bloco key={i} forma={forma} />
      ))}
    </div>
  )
}

function Bloco({ forma }: { forma: FormaDoEsqueleto }) {
  if (forma === 'linha-de-musica') {
    return (
      <div className="bloco-do-esqueleto linha">
        <span className="osso imagem" />
        <span className="cresce">
          <span className="osso texto" />
          <span className="osso texto curto" />
          <span className="osso selo" />
        </span>
      </div>
    )
  }

  if (forma === 'cartao') {
    return (
      <div className="bloco-do-esqueleto cartao">
        <span className="osso texto" />
        <span className="osso texto curto" />
        <span className="osso texto" />
      </div>
    )
  }

  return (
    <div className="bloco-do-esqueleto paragrafo">
      <span className="osso texto" />
      <span className="osso texto" />
      <span className="osso texto curto" />
    </div>
  )
}
