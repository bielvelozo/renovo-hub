import { api, textoDoErro } from '../api/cliente'
import { usarBusca } from '../api/usarBusca'
import { usarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { ListaDeTarefas } from './ListaDeTarefas'
import { contarFeitas, tarefasDoInicio } from './tarefas'

export type Guia = { feitas: string[]; escondido: boolean }

export function PrimeirosPassos({ dirige }: { dirige: boolean }) {
  const busca = usarBusca<Guia>('/api/guia')
  const avisar = usarAviso()
  const guia = busca.dados

  if (!guia || guia.escondido) return null

  const tarefas = tarefasDoInicio(dirige)
  const feitas = contarFeitas(tarefas, guia.feitas)
  if (feitas === tarefas.length) return null

  const esconder = async () => {
    try {
      busca.definir(await api<Guia>('/api/guia/escondido', { metodo: 'POST', corpo: { escondido: true } }))
      avisar('Guia escondido. Ele continua no Perfil.')
    } catch (problema) {
      avisar(textoDoErro(problema))
    }
  }

  return (
    <section className="cartao primeiros-passos" aria-labelledby="titulo-dos-primeiros-passos">
      <div className="topo-dos-primeiros-passos">
        <span className="cresce">
          <h2 id="titulo-dos-primeiros-passos" className="titulo titulo-do-cartao">
            Primeiros passos
          </h2>
          <span className="dica">Toque numa tarefa: o app leva você e mostra onde tocar.</span>
        </span>
        <span className="contagem-dos-passos">
          {feitas} de {tarefas.length}
        </span>
      </div>

      <div
        className="barra-dos-passos"
        role="progressbar"
        aria-label="Tarefas feitas"
        aria-valuemin={0}
        aria-valuemax={tarefas.length}
        aria-valuenow={feitas}
      >
        <span style={{ width: `${Math.round((feitas / tarefas.length) * 100)}%` }} />
      </div>

      <ListaDeTarefas tarefas={tarefas} feitas={guia.feitas} dirige={dirige} />

      <Botao variante="terciario" pequeno className="esconder-o-guia" onClick={esconder}>
        Esconder o guia
      </Botao>
    </section>
  )
}
