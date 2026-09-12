import { BotaoLink } from '../componentes/Botao'
import { Vazio } from '../componentes/Vazio'

export function NaoEncontrada() {
  return (
    <section className="pagina">
      <h1>Página não encontrada</h1>
      <Vazio icone="busca" acao={<BotaoLink para="/">Ir pro Início</BotaoLink>}>
        O endereço que você abriu não existe no Renovo Hub.
      </Vazio>
    </section>
  )
}
