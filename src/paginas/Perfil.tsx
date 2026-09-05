import { Link } from 'react-router'
import { api } from '../api/cliente'
import type { PerfilApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { textoDaUltimaEscala, textoDasEscalasNoAno, textoDeSeguidos } from '../perfil/perfil'
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
              <span className="dica">{textoDasEscalasNoAno(busca.dados.escalasNoAno)} no ano</span>
            </div>
            <div className="numero">
              <b>{busca.dados.finsDeSemanaSeguidos}</b>
              <span className="dica">{textoDeSeguidos(busca.dados.finsDeSemanaSeguidos)}</span>
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

      <div className="cartao pagina">
        <h2>Notificações</h2>
        <button type="button" className="botao secundario largo" disabled>
          Ativar notificações
        </button>
        <p className="dica">
          O aviso de escalado, de mudança no Repertório e o lembrete da véspera chegam na próxima etapa do app. Aí este
          botão liga o push neste aparelho e aparece aqui o silenciar.
        </p>
        <Link to="/instalar" className="dica">
          Como instalar o app na tela inicial
        </Link>
      </div>

      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <button type="button" className="botao perigo largo" disabled={acao.ocupado} onClick={sair}>
        Sair deste aparelho
      </button>
      <p className="dica">Sair apaga a sessão daqui. Pra voltar, use o link de convite ou a lista do «esqueci».</p>
    </section>
  )
}
