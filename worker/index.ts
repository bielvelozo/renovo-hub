import { Hono } from 'hono'
import { acesso } from './rotas/acesso'
import { admin } from './rotas/admin'
import { anexos } from './rotas/anexos'
import { culto } from './rotas/culto'
import { escalas } from './rotas/escalas'
import { formacoes } from './rotas/formacoes'
import { inicio } from './rotas/inicio'
import { itens } from './rotas/itens'
import { musicas } from './rotas/musicas'
import { perfil } from './rotas/perfil'
import { push } from './rotas/push'
import { saude } from './rotas/saude'
import { sugestoes } from './rotas/sugestoes'
import { rodarNotificacoes } from './push/despacho'
import type { Ambiente, Contexto } from './tipos'

const app = new Hono<Contexto>()

app.route('/', saude)
app.route('/', acesso)
app.route('/', inicio)
app.route('/', escalas)
app.route('/', formacoes)
app.route('/', itens)
app.route('/', musicas)
app.route('/', anexos)
app.route('/', culto)
app.route('/', sugestoes)
app.route('/', perfil)
app.route('/', push)
app.route('/', admin)

app.notFound((c) => c.json({ erro: 'Rota não encontrada.' }, 404))

app.onError((erro, c) => {
  console.error(erro)
  return c.json({ erro: 'Algo deu errado por aqui. Tente de novo.' }, 500)
})

export default {
  fetch: app.fetch,
  async scheduled(_evento: ScheduledController, env: Ambiente, contexto: ExecutionContext) {
    contexto.waitUntil(rodarNotificacoes(env))
  },
} satisfies ExportedHandler<Ambiente>
