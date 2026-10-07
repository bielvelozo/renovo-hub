import { useState } from 'react'
import { Link } from 'react-router'
import type { PerfilApresentado } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { Icone } from '../casca/Icone'
import { SeloDaMarca } from '../casca/Marca'
import { ProvedorDeAvisos } from '../componentes/Avisos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Folha } from '../componentes/Folha'
import { NotificacoesCompactas } from '../componentes/NotificacoesCompactas'
import { Segmento } from '../componentes/Segmento'
import { IconeDoPasso } from '../instalacao/IconeDoPasso'
import { PLATAFORMAS, passosDeInstalacao, plataformaDoAgente } from '../instalacao/plataforma'
import type { Plataforma } from '../instalacao/plataforma'
import { usarInstalacao } from '../instalacao/prompt'
import { textoDaProximaEscala } from '../perfil/perfil'
import { usarSessao } from '../sessao/sessao'
import type { Eu } from '../sessao/sessao'

export function Instalar() {
  const sessao = usarSessao()
  const instalacao = usarInstalacao()
  const [plataforma, escolher] = useState<Plataforma>(() =>
    plataformaDoAgente(navigator.userAgent, navigator.maxTouchPoints > 1),
  )
  const [passosAbertos, abrirPassos] = useState(false)
  const [instalando, marcarInstalando] = useState(false)
  const peloIcone = abertoPeloIcone()
  const eu = sessao.situacao === 'dentro' ? sessao.eu : null
  const instrucao = passosDeInstalacao(plataforma)

  async function instalar() {
    if (!instalacao.disponivel) {
      abrirPassos(true)
      return
    }

    marcarInstalando(true)
    const resultado = await instalacao.instalar()
    marcarInstalando(false)
    if (resultado === 'indisponivel') abrirPassos(true)
  }

  return (
    <ProvedorDeAvisos>
      <section className="pagina centrada sem-abas boas-vindas">
        <div className="topo-das-boas-vindas">
          <span className="selo-centrado">
            <SeloDaMarca />
          </span>
          <h1>{eu ? `Oi, ${eu.nome}` : 'Boas-vindas ao Renovo Music'}</h1>
          {eu && <p className="dica">Você entrou no Renovo Music.</p>}
        </div>

        {eu && <ProximaEscala eu={eu} />}

        <div className="secao">
          <h2>Neste aparelho</h2>

          {peloIcone || instalacao.instalado ? (
            <div className="cartao cartao-de-instalar">
              <div className="linha-de-instalar">
                <span className="icone-de-instalar" aria-hidden="true">
                  <Icone nome="confirmar" />
                </span>
                <span className="cresce">
                  <span className="titulo">{peloIcone ? 'Pronto, já está instalado' : 'Instalado'}</span>
                  {!peloIcone && <span className="dica">Abra o Renovo Music pelo ícone da tela inicial.</span>}
                </span>
              </div>
            </div>
          ) : (
            <div className="cartao cartao-de-instalar">
              <div className="linha-de-instalar">
                <span className="icone-de-instalar" aria-hidden="true">
                  <Icone nome="celular" />
                </span>
                <span className="cresce">
                  <span className="titulo">Coloque o app na tela inicial</span>
                  {plataforma === 'ios' && <span className="dica">No iPhone, as notificações só chegam pelo ícone.</span>}
                </span>
              </div>
              <Botao largo icone="instalar" carregando={instalando} onClick={instalar}>
                Instalar na tela inicial
              </Botao>
            </div>
          )}

          {eu && (peloIcone || plataforma !== 'ios') && (
            <ul className="lista cartao">
              <NotificacoesCompactas silenciado={eu.silenciado} />
            </ul>
          )}
        </div>

        {peloIcone ? (
          <BotaoLink para="/" largo>
            Continuar
          </BotaoLink>
        ) : (
          <BotaoLink para="/" variante="terciario" className="seguir-no-navegador">
            {instalacao.instalado ? 'Continuar no navegador' : 'Agora não, usar no navegador'}
          </BotaoLink>
        )}

        {passosAbertos && (
          <Folha titulo={instrucao.titulo} fechar={() => abrirPassos(false)}>
            <Segmento
              rotulo="Onde você está"
              opcoes={PLATAFORMAS.map((opcao) => ({ valor: opcao, rotulo: passosDeInstalacao(opcao).aba }))}
              valor={plataforma}
              aoMudar={escolher}
            />
            <ol className="passos">
              {instrucao.passos.map((passo) => (
                <li key={passo.texto}>
                  {passo.texto}
                  {passo.icone && <IconeDoPasso nome={passo.icone} />}
                </li>
              ))}
            </ol>
          </Folha>
        )}
      </section>
    </ProvedorDeAvisos>
  )
}

function ProximaEscala({ eu }: { eu: Eu }) {
  const proxima = usarBusca<PerfilApresentado>(`/api/perfil/${eu.id}`).dados?.proximaEscala

  if (!proxima) return null

  return (
    <div className="secao">
      <h2>Sua próxima escala</h2>
      <ul className="lista cartao">
        <li>
          <Link to={`/escalas/${proxima.id}`} className="toque">
            <span className="cresce">
              <span className="titulo">{proxima.titulo}</span>
              <span className="dica">{textoDaProximaEscala(proxima)}</span>
            </span>
            <Icone nome="seta" />
          </Link>
        </li>
      </ul>
    </div>
  )
}

function abertoPeloIcone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}
