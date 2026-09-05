export function EmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <section className="pagina">
      <h1>{titulo}</h1>
      <div className="cartao">
        <p className="dica">{descricao}</p>
      </div>
    </section>
  )
}
