import { usarEu } from '../sessao/sessao'
import { usarTema } from '../tema/ProvedorDeTema'
import { PREFERENCIAS, rotuloDaPreferencia } from '../tema/tema'

export function Perfil() {
  const eu = usarEu()
  const { preferencia, definir } = usarTema()

  return (
    <section className="pagina">
      <h1>{eu.nome}</h1>

      <div className="cartao pagina">
        <h2>Tema</h2>
        <div className="segmento" role="group" aria-label="Tema">
          {PREFERENCIAS.map((opcao) => (
            <button
              key={opcao}
              type="button"
              aria-pressed={opcao === preferencia}
              onClick={() => definir(opcao)}
            >
              {rotuloDaPreferencia(opcao)}
            </button>
          ))}
        </div>
        <p className="dica">Do sistema segue o tema do seu celular.</p>
      </div>

      <div className="cartao">
        <p className="dica">
          As suas Funções, a última Escala, as Escalas no ano, os fins de semana seguidos, as notificações e o botão de
          sair chegam na próxima etapa.
        </p>
      </div>
    </section>
  )
}
