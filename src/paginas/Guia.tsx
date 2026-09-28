import { api, textoDoErro } from '../api/cliente'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { usarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { Esqueleto } from '../componentes/Esqueleto'
import { ListaDeTarefas } from '../guia/ListaDeTarefas'
import type { Guia as DadosDoGuia } from '../guia/PrimeirosPassos'
import { gruposDoGuia } from '../guia/tarefas'
import { usarEu } from '../sessao/sessao'

export function Guia() {
  const eu = usarEu()
  const dirige = eu.ministro || eu.admin
  const busca = usarBusca<DadosDoGuia>('/api/guia')
  const avisar = usarAviso()
  const guia = busca.dados

  const mostrarNoInicio = async () => {
    try {
      busca.definir(await api<DadosDoGuia>('/api/guia/escondido', { metodo: 'POST', corpo: { escondido: false } }))
      avisar('Primeiros passos de volta no Início')
    } catch (problema) {
      avisar(textoDoErro(problema))
    }
  }

  return (
    <section className="pagina">
      <Cabecalho titulo="Guia do app" sub="Refaça qualquer tarefa quando quiser" voltarPara="/perfil" />

      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {!guia && !busca.erro && <Esqueleto forma="linha-de-musica" quantidade={5} />}

      {guia &&
        gruposDoGuia(dirige).map((grupo) => (
          <div key={grupo.titulo} className="secao">
            <h2>{grupo.titulo}</h2>
            <div className="cartao">
              <ListaDeTarefas tarefas={grupo.tarefas} feitas={guia.feitas} dirige={dirige} />
            </div>
          </div>
        ))}

      {guia?.escondido && (
        <Botao variante="terciario" onClick={mostrarNoInicio}>
          Mostrar os Primeiros passos no Início
        </Botao>
      )}
    </section>
  )
}
