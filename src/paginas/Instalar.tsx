import { useState } from 'react'
import { SeloDaMarca } from '../casca/Marca'
import { ProvedorDeAvisos } from '../componentes/Avisos'
import { BotaoLink } from '../componentes/Botao'
import { Notificacoes } from '../componentes/Notificacoes'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Segmento } from '../componentes/Segmento'
import { IconeDoPasso } from '../instalacao/IconeDoPasso'
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
    <ProvedorDeAvisos>
      <section className="pagina centrada sem-abas">
        <span className="selo-centrado">
          <SeloDaMarca />
        </span>

        <h1>{sessao.situacao === 'dentro' ? `Oi, ${sessao.eu.nome}` : 'Bem-vindo ao Renovo Hub'}</h1>
        <p className="dica">
          O Renovo Hub é o app das Escalas do Renovo Music. Deixe ele na tela inicial do seu celular: é assim que ele
          abre rápido e pode avisar você quando entrar numa Escala.
        </p>

        {instalado ? (
          <div className="cartao">
            <h2>Pronto, já está instalado</h2>
            <p className="dica">Você está usando o Renovo Hub pelo ícone da tela inicial. É daqui que ele notifica você.</p>
          </div>
        ) : (
          <div className="cartao pagina">
            <Segmento
              rotulo="Onde você está"
              opcoes={PLATAFORMAS.map((opcao) => ({ valor: opcao, rotulo: passosDeInstalacao(opcao).aba }))}
              valor={plataforma}
              aoMudar={escolher}
            />

            <h2>{instrucao.titulo}</h2>
            <ol className="passos">
              {instrucao.passos.map((passo) => (
                <li key={passo.texto}>
                  {passo.texto}
                  {passo.icone && <IconeDoPasso nome={passo.icone} />}
                </li>
              ))}
            </ol>
          </div>
        )}

        <Notificacoes silenciado={sessao.situacao === 'dentro' && sessao.eu.silenciado} />

        <RodapeDeAcao primario={<BotaoLink para="/" largo>Pronto</BotaoLink>} />
      </section>
    </ProvedorDeAvisos>
  )
}

function jaInstalado(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}
