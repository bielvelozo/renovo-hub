import { Hono } from 'hono'
import { acesso } from './rotas/acesso'
import { anexos } from './rotas/anexos'
import { escalas } from './rotas/escalas'
import { formacoes } from './rotas/formacoes'
import { itens } from './rotas/itens'
import { musicas } from './rotas/musicas'
import { perfil } from './rotas/perfil'
import { saude } from './rotas/saude'
import { sugestoes } from './rotas/sugestoes'
import type { Ambiente, Contexto } from './tipos'

const app = new Hono<Contexto>()

app.route('/', saude)
app.route('/', acesso)
app.route('/', escalas)
app.route('/', formacoes)
app.route('/', itens)
app.route('/', musicas)
app.route('/', anexos)
app.route('/', sugestoes)
app.route('/', perfil)

app.notFound((c) => c.json({ erro: 'Rota não encontrada.' }, 404))

app.onError((erro, c) => {
  console.error(erro)
  return c.json({ erro: 'Algo deu errado por aqui. Tente de novo.' }, 500)
})

export default {
  fetch: app.fetch,
  async scheduled() {},
} satisfies ExportedHandler<Ambiente>
