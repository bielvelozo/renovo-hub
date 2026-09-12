import type { EscalaResumida } from '../api/tipos'
import { usarBusca } from '../api/usarBusca'
import { formatarDia, nomeDaEscala } from '../dominio'
import { Esqueleto } from './Esqueleto'
import { Folha } from './Folha'
import { Selo } from './Selo'
import { Vazio } from './Vazio'

export function FolhaDeEscolhaDeEscala({
  aberta,
  fechar,
  jaEsta,
  aoEscolher,
}: {
  aberta: boolean
  fechar: () => void
  jaEsta: string[]
  aoEscolher: (escalaId: string) => void
}) {
  const busca = usarBusca<{ escalas: EscalaResumida[] }>(aberta ? '/api/escalas' : null)

  return (
    <Folha titulo="Pra qual escala?" fechar={fechar} aberta={aberta}>
      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {busca.carregando && <Esqueleto forma="linha-de-musica" quantidade={3} />}
      {busca.dados && <ListaDeEscalas escalas={busca.dados.escalas} jaEsta={jaEsta} aoEscolher={aoEscolher} />}
    </Folha>
  )
}

export function ListaDeEscalas({
  escalas,
  jaEsta,
  aoEscolher,
}: {
  escalas: EscalaResumida[]
  jaEsta: string[]
  aoEscolher: (escalaId: string) => void
}) {
  const agendadas = escalas.filter((escala) => escala.estado === 'agendada')

  if (agendadas.length === 0) return <Vazio icone="calendario">Nenhuma escala agendada.</Vazio>

  return (
    <ul className="lista">
      {agendadas.map((escala) => {
        const jaAqui = jaEsta.includes(escala.id)

        return (
          <li key={escala.id}>
            <button type="button" className="toque" disabled={jaAqui} onClick={() => aoEscolher(escala.id)}>
              <span className="cresce">
                <span className="titulo">{nomeDaEscala(escala)}</span>
                <span className="dica">
                  {formatarDia(escala.data)} · {escala.ministros.join(', ') || 'sem ministro'}
                </span>
              </span>
              {jaAqui ? (
                <Selo variante="atencao">já está aqui</Selo>
              ) : (
                <span className="dica">
                  {escala.quantidadeDeItens} música{escala.quantidadeDeItens === 1 ? '' : 's'}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
