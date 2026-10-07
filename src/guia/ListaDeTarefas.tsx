import { useNavigate } from 'react-router'
import { Icone } from '../casca/Icone'
import { usarAviso } from '../componentes/Avisos'
import { comecarTarefa } from './andamento'
import type { Tarefa } from './tarefas'

export function ListaDeTarefas({ tarefas, feitas, dirige }: { tarefas: Tarefa[]; feitas: readonly string[]; dirige: boolean }) {
  const navegar = useNavigate()
  const avisar = usarAviso()

  const comecar = (tarefa: Tarefa) => {
    comecarTarefa(tarefa.id, navegar, dirige)
      .then((problema) => problema && avisar(problema))
      .catch(() => avisar('Não foi possível abrir o guia agora. Tente de novo.'))
  }

  return (
    <ul className="lista tarefas-do-guia">
      {tarefas.map((tarefa) => {
        const feita = feitas.includes(tarefa.id)

        return (
          <li key={tarefa.id}>
            <button type="button" className={`toque${feita ? ' feita' : ''}`} onClick={() => comecar(tarefa)}>
              <span className="marca-da-tarefa" aria-hidden="true">
                {feita && <Icone nome="confirmar" />}
              </span>
              <span className="cresce">
                <span className="titulo">{tarefa.titulo}</span>
                <span className="dica">{feita ? 'Feito · toque pra rever' : tarefa.sub}</span>
              </span>
              <Icone nome="seta" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
