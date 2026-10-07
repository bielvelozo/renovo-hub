import { useEffect, useRef } from 'react'
import { estaLigado, podeAtivar, textoDaSituacao } from '../push/push'
import { usarPush } from '../push/usarPush'
import { usarAviso } from './Avisos'
import { Botao } from './Botao'
import { Cartao } from './Cartao'
import { Segmento } from './Segmento'

export function Notificacoes({ silenciado, secundario = false }: { silenciado: boolean; secundario?: boolean }) {
  const push = usarPush(silenciado)
  const avisar = usarAviso()
  const ligado = estaLigado(push.situacao)
  const variante = secundario ? 'secundario' : 'primario'
  const anterior = useRef(push.situacao)

  useEffect(() => {
    if (!estaLigado(anterior.current) && estaLigado(push.situacao)) avisar('Notificações ativadas')
    anterior.current = push.situacao
  }, [push.situacao, avisar])

  return (
    <Cartao className="pagina">
      <h2>Notificações</h2>

      {!ligado && (
        <Botao variante={variante} largo disabled={!podeAtivar(push.situacao) || push.acao.ocupado} onClick={push.ativar}>
          Ativar notificações
        </Botao>
      )}

      <p className="dica">{textoDaSituacao(push.situacao)}</p>

      {ligado && (
        <>
          <Botao variante={variante} largo disabled={push.acao.ocupado} onClick={push.testar}>
            Testar notificação
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

          <Botao variante="secundario" largo disabled={push.acao.ocupado} onClick={push.desligar}>
            Não receber neste aparelho
          </Botao>
        </>
      )}

      {push.recado && <p className="dica">{push.recado}</p>}
      {push.acao.erro && <p className="aviso">{push.acao.erro}</p>}
    </Cartao>
  )
}
