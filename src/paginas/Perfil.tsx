import { Link } from 'react-router'
import { api } from '../api/cliente'
import type { PerfilApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { usarAviso } from '../componentes/Avisos'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Cartao } from '../componentes/Cartao'
import { Esqueleto } from '../componentes/Esqueleto'
import { Notificacoes } from '../componentes/Notificacoes'
import { Segmento } from '../componentes/Segmento'
import { rotuloDeEscalasNoAno, rotuloDeSeguidos, textoDaUltimaEscala } from '../perfil/perfil'
import { usarEu } from '../sessao/sessao'
import { usarTema } from '../tema/ProvedorDeTema'
import type { Preferencia } from '../tema/tema'
import { PREFERENCIAS, rotuloDaPreferencia } from '../tema/tema'
import { VistoEm } from '../componentes/VistoEm'

const TEXTO_DO_TEMA: Record<Preferencia, string> = {
  automatico: 'Tema do sistema',
  claro: 'Tema claro',
  escuro: 'Tema escuro',
}

export function Perfil() {
  const eu = usarEu()
  const { preferencia, definir } = usarTema()
  const busca = usarBusca<PerfilApresentado>(`/api/perfil/${eu.id}`)
  const acao = usarAcao()
  const avisar = usarAviso()

  const sair = () => {
    acao.executar(async () => {
      await api('/api/sair', { metodo: 'POST' })
      window.location.assign('/esqueci')
    })
  }

  return (
    <section className="pagina">
      <Cabecalho raiz titulo={eu.nome} />
      <VistoEm hora={busca.vistoEm} />

      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {busca.carregando && <Esqueleto forma="cartao" />}

      {busca.dados && (
        <>
          <Cartao className="pagina">
            <div className="grupo">
              <span className="rotulo">Funções</span>
              <span>
                {busca.dados.membro.funcoes.length
                  ? busca.dados.membro.funcoes.map((funcao) => funcao.nome).join(', ')
                  : 'nenhuma cadastrada'}
                {eu.ministro && ' · Ministro'}
                {eu.admin && ' · Admin'}
              </span>
            </div>

            <div className="grupo">
              <span className="rotulo">Última Escala</span>
              {busca.dados.ultimaEscala ? (
                <Link to={`/escalas/${busca.dados.ultimaEscala.id}`}>
                  {textoDaUltimaEscala(busca.dados.ultimaEscala)}
                </Link>
              ) : (
                <span>{textoDaUltimaEscala(null)}</span>
              )}
            </div>
          </Cartao>

          <div className="numeros">
            <div className="numero">
              <b>{busca.dados.escalasNoAno}</b>
              <span className="dica">{rotuloDeEscalasNoAno(busca.dados.escalasNoAno)}</span>
            </div>
            <div className="numero">
              <b>{busca.dados.finsDeSemanaSeguidos}</b>
              <span className="dica">{rotuloDeSeguidos(busca.dados.finsDeSemanaSeguidos)}</span>
            </div>
          </div>
        </>
      )}

      <Cartao className="pagina">
        <h2>Tema</h2>
        <Segmento
          rotulo="Tema"
          opcoes={PREFERENCIAS.map((opcao) => ({ valor: opcao, rotulo: rotuloDaPreferencia(opcao) }))}
          valor={preferencia}
          aoMudar={(opcao) => {
            definir(opcao)
            avisar(TEXTO_DO_TEMA[opcao])
          }}
        />
        <p className="dica">Do sistema segue o tema do seu celular.</p>
      </Cartao>

      <Notificacoes silenciado={eu.silenciado} secundario />

      {eu.admin && (
        <BotaoLink para="/admin" variante="secundario" largo icone="engrenagem">
          Administração
        </BotaoLink>
      )}

      <Link to="/instalar" className="dica">
        Como instalar o app na tela inicial
      </Link>

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <Botao variante="terciario" className="perigo" largo disabled={acao.ocupado} onClick={sair}>
        Sair deste aparelho
      </Botao>
      <p className="dica">Sair apaga a sessão daqui. Pra voltar, use o link de convite ou a lista do «esqueci».</p>
    </section>
  )
}
