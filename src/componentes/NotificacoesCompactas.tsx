import { useEffect, useRef, useState } from 'react'
import { estaLigado, podeAtivar, textoDaSituacao } from '../push/push'
import { usarPush } from '../push/usarPush'
import { usarAviso } from './Avisos'
import { Botao } from './Botao'
import { Folha } from './Folha'
import { Segmento } from './Segmento'

export function NotificacoesCompactas({ silenciado }: { silenciado: boolean }) {
  const push = usarPush(silenciado)
  const avisar = usarAviso()
  const [folha, abrirFolha] = useState(false)
  const ligado = estaLigado(push.situacao)
  const podeMexer = podeAtivar(push.situacao) || ligado
  const anterior = useRef(push.situacao)

  useEffect(() => {
    if (!estaLigado(anterior.current) && estaLigado(push.situacao)) avisar('Notificações ativadas')
    anterior.current = push.situacao
  }, [push.situacao, avisar])

  const alternar = () => {
    if (push.situacao === 'pode-ativar') push.ativar()
    else if (push.situacao === 'ligado') push.definirSilencio(true)
    else if (push.situacao === 'silenciado') push.definirSilencio(false)
  }

  return (
    <li className="linha-com-interruptor">
      <button type="button" className="toque" onClick={() => abrirFolha(true)}>
        <span className="cresce">
          <span className="titulo">Notificações</span>
          <span className="dica">{textoDaSituacao(push.situacao)}</span>
        </span>
      </button>
      <button
        type="button"
        role="switch"
        className="interruptor"
        aria-label="Notificações"
        aria-checked={push.situacao === 'ligado'}
        disabled={!podeMexer || push.acao.ocupado}
        onClick={alternar}
      >
        <span className="bolinha" aria-hidden="true" />
      </button>

      {folha && (
        <Folha titulo="Notificações" fechar={() => abrirFolha(false)}>
          <p className="dica">{textoDaSituacao(push.situacao)}</p>

          {podeAtivar(push.situacao) && (
            <Botao largo disabled={push.acao.ocupado} onClick={push.ativar}>
              Ativar notificações
            </Botao>
          )}

          {ligado && (
            <>
              <Botao variante="secundario" largo disabled={push.acao.ocupado} onClick={push.testar}>
                Enviar push de teste
              </Botao>

              <Segmento
                rotulo="Silenciar"
                opcoes={[
                  { valor: 'receber', rotulo: 'Receber' },
                  { valor: 'silenciar', rotulo: 'Silenciar tudo' },
                ]}
                valor={push.situacao === 'silenciado' ? 'silenciar' : 'receber'}
                aoMudar={(valor) => push.definirSilencio(valor === 'silenciar')}
                desligado={push.acao.ocupado}
              />

              <Botao variante="terciario" largo disabled={push.acao.ocupado} onClick={push.desligar}>
                Não receber neste aparelho
              </Botao>
            </>
          )}

          {push.recado && <p className="dica">{push.recado}</p>}
          {push.acao.erro && <p className="aviso">{push.acao.erro}</p>}
        </Folha>
      )}
    </li>
  )
}
