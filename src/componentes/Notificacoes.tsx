import { estaLigado, podeAtivar, textoDaSituacao } from '../push/push'
import { usarPush } from '../push/usarPush'

export function Notificacoes({ silenciado, secundario = false }: { silenciado: boolean; secundario?: boolean }) {
  const push = usarPush(silenciado)
  const ligado = estaLigado(push.situacao)
  const classe = `botao${secundario ? ' secundario' : ''} largo`

  return (
    <div className="cartao pagina">
      <h2>Notificações</h2>

      {!ligado && (
        <button
          type="button"
          className={classe}
          disabled={!podeAtivar(push.situacao) || push.acao.ocupado}
          onClick={push.ativar}
        >
          Ativar notificações
        </button>
      )}

      <p className="dica">{textoDaSituacao(push.situacao)}</p>

      {ligado && (
        <>
          <button type="button" className={classe} disabled={push.acao.ocupado} onClick={push.testar}>
            Enviar push de teste
          </button>

          <div className="segmento" role="group" aria-label="Silenciar">
            <button
              type="button"
              aria-pressed={push.situacao !== 'silenciado'}
              disabled={push.acao.ocupado}
              onClick={() => push.definirSilencio(false)}
            >
              Receber
            </button>
            <button
              type="button"
              aria-pressed={push.situacao === 'silenciado'}
              disabled={push.acao.ocupado}
              onClick={() => push.definirSilencio(true)}
            >
              Silenciar tudo
            </button>
          </div>
          <p className="dica">Silenciar mantém a inscrição deste aparelho: é só religar quando quiser voltar.</p>

          <button
            type="button"
            className="botao secundario largo"
            disabled={push.acao.ocupado}
            onClick={push.desligar}
          >
            Não receber neste aparelho
          </button>
        </>
      )}

      {push.recado && <p className="dica">{push.recado}</p>}
      {push.acao.erro && <p className="aviso">{push.acao.erro}</p>}
    </div>
  )
}
