import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ErroDaApi, api, textoDoErro } from '../api/cliente'
import { SeloDaMarca } from '../casca/Marca'
import { Esqueleto } from '../componentes/Esqueleto'
import { Vazio } from '../componentes/Vazio'

type Resumo = { id: string; nome: string }

export function Esqueci() {
  const [membros, guardar] = useState<Resumo[] | null>(null)
  const [listaDesligada, desligarLista] = useState(false)
  const [erro, marcarErro] = useState<string | null>(null)
  const [entrando, marcarEntrando] = useState<string | null>(null)
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const conviteInvalido = parametros.get('convite') === 'invalido'

  useEffect(() => {
    const controle = new AbortController()

    api<{ membros: Resumo[] }>('/api/esqueci', { sinal: controle.signal })
      .then(({ membros }) => guardar(membros))
      .catch((problema: unknown) => {
        if (controle.signal.aborted) return
        if (problema instanceof ErroDaApi && problema.status === 403) return desligarLista(true)
        marcarErro(textoDoErro(problema))
      })

    return () => controle.abort()
  }, [])

  if (listaDesligada) {
    return (
      <section className="pagina centrada">
        <span className="selo-centrado">
          <SeloDaMarca />
        </span>
        <h1>Entrar no Renovo Music</h1>
        <p className="dica">
          {conviteInvalido
            ? 'Esse link de convite não vale mais. Peça um novo a um ministro.'
            : 'Peça seu link de convite a um ministro.'}
        </p>
      </section>
    )
  }

  async function entrar(membro: Resumo) {
    marcarErro(null)
    marcarEntrando(membro.id)

    try {
      await api('/api/esqueci', { metodo: 'POST', corpo: { membroId: membro.id } })
      navegar('/instalar', { replace: true })
    } catch (problema) {
      marcarErro(textoDoErro(problema))
      marcarEntrando(null)
    }
  }

  return (
    <section className="pagina centrada">
      <span className="selo-centrado">
        <SeloDaMarca />
      </span>
      <h1>Quem é você?</h1>
      {conviteInvalido && <p className="aviso">Esse link de convite não vale mais. Se o seu nome está aqui, é só tocar nele.</p>}
      <p className="dica">
        Toque no seu nome pra entrar neste aparelho. Se o seu nome não estiver aqui, peça um link de convite a um
        ministro.
      </p>

      {erro && <p className="aviso">{erro}</p>}

      {!membros && !erro && <Esqueleto forma="linha-de-musica" quantidade={3} />}

      {membros && membros.length === 0 && <Vazio icone="pessoa">Nenhum membro cadastrado ainda.</Vazio>}

      {membros && membros.length > 0 && (
        <ul className="lista cartao">
          {membros.map((membro) => (
            <li key={membro.id}>
              <button type="button" className="toque" disabled={entrando !== null} onClick={() => entrar(membro)}>
                <span className="cresce">{membro.nome}</span>
                {entrando === membro.id && <span className="dica">entrando…</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
