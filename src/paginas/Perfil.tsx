import { Link } from 'react-router'
import { api } from '../api/cliente'
import type { PerfilApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Notificacoes } from '../componentes/Notificacoes'
import { rotuloDeEscalasNoAno, rotuloDeSeguidos, textoDaUltimaEscala } from '../perfil/perfil'
import { usarEu } from '../sessao/sessao'
import { usarTema } from '../tema/ProvedorDeTema'
import { PREFERENCIAS, rotuloDaPreferencia } from '../tema/tema'

export function Perfil() {
  const eu = usarEu()
  const { preferencia, definir } = usarTema()
  const busca = usarBusca<PerfilApresentado>(`/api/perfil/${eu.id}`)
  const acao = usarAcao()

  const sair = () => {
    acao.executar(async () => {
      await api('/api/sair', { metodo: 'POST' })
      window.location.assign('/esqueci')
    })
  }

  return (
    <section className="pagina">
      <h1>{eu.nome}</h1>

      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {busca.carregando && <div className="girando" role="status" aria-label="Carregando" />}

      {busca.dados && (
        <>
          <div className="cartao pagina">
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
          </div>

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

      <Notificacoes silenciado={eu.silenciado} secundario />

      <Link to="/instalar" className="dica">
        Como instalar o app na tela inicial
      </Link>

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <button type="button" className="botao perigo largo" disabled={acao.ocupado} onClick={sair}>
        Sair deste aparelho
      </button>
      <p className="dica">Sair apaga a sessão daqui. Pra voltar, use o link de convite ou a lista do «esqueci».</p>
    </section>
  )
}
