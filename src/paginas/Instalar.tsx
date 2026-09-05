import { useState } from 'react'
import { Link } from 'react-router'
import { Marca } from '../casca/Marca'
import { Notificacoes } from '../componentes/Notificacoes'
import { PLATAFORMAS, passosDeInstalacao, plataformaDoAgente } from '../instalacao/plataforma'
import type { Plataforma } from '../instalacao/plataforma'
import { usarSessao } from '../sessao/sessao'

export function Instalar() {
  const sessao = usarSessao()
  const [plataforma, escolher] = useState<Plataforma>(() =>
    plataformaDoAgente(navigator.userAgent, navigator.maxTouchPoints > 1),
  )
  const instrucao = passosDeInstalacao(plataforma)
  const instalado = jaInstalado()

  return (
    <section className="pagina centrada">
      <Marca />

      <h1>{sessao.situacao === 'dentro' ? `Oi, ${sessao.eu.nome}` : 'Bem-vindo ao Renovo Hub'}</h1>
      <p className="dica">
        O Renovo Hub é o app das Escalas do Renovo Music. Deixe ele na tela inicial do seu celular: é assim que ele abre
        rápido e pode avisar você quando entrar numa Escala.
      </p>

      {instalado ? (
        <div className="cartao">
          <h2>Pronto, já está instalado</h2>
          <p className="dica">Você está usando o Renovo Hub pelo ícone da tela inicial. É daqui que ele notifica você.</p>
        </div>
      ) : (
        <div className="cartao pagina">
          <div className="segmento" role="group" aria-label="Onde você está">
            {PLATAFORMAS.map((opcao) => (
              <button
                key={opcao}
                type="button"
                aria-pressed={opcao === plataforma}
                onClick={() => escolher(opcao)}
              >
                {passosDeInstalacao(opcao).aba}
              </button>
            ))}
          </div>

          <h2>{instrucao.titulo}</h2>
          <ol className="passos">
            {instrucao.passos.map((passo) => (
              <li key={passo}>{passo}</li>
            ))}
          </ol>
        </div>
      )}

      <Notificacoes silenciado={sessao.situacao === 'dentro' && sessao.eu.silenciado} />

      <Link to="/" className="botao largo">
        Pronto
      </Link>
    </section>
  )
}

function jaInstalado(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}
