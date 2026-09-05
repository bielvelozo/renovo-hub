import { Hono } from 'hono'
import { acesso } from './rotas/acesso'
import { escalas } from './rotas/escalas'
import { formacoes } from './rotas/formacoes'
import { itens } from './rotas/itens'
import { saude } from './rotas/saude'
import type { Ambiente, Contexto } from './tipos'

const app = new Hono<Contexto>()

app.route('/', saude)
app.route('/', acesso)
app.route('/', escalas)
app.route('/', formacoes)
app.route('/', itens)

app.notFound((c) => c.json({ erro: 'Rota não encontrada.' }, 404))

app.onError((erro, c) => {
  console.error(erro)
  return c.json({ erro: 'Algo deu errado por aqui. Tente de novo.' }, 500)
})

export default {
  fetch: app.fetch,
  async scheduled() {},
} satisfies ExportedHandler<Ambiente>
