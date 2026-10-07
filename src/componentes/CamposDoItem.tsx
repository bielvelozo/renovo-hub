import type { MusicaDetalhada } from '../api/tipos'
import type { PessoaDaEquipe } from '../dominio'
import type { Rascunho } from '../escalas/rascunho'
import { BlocoDeMinutagem } from './BlocoDeMinutagem'
import { BlocoDeTom } from './BlocoDeTom'
import { Campo } from './Campo'
import { Segmento } from './Segmento'

export function CamposDoItem({
  rascunho,
  mudar,
  musica,
  ministros = [],
  como = true,
  observacao = true,
}: {
  rascunho: Rascunho
  mudar: (mudanca: Partial<Rascunho>) => void
  musica: MusicaDetalhada | null
  ministros?: PessoaDaEquipe[]
  como?: boolean
  observacao?: boolean
}) {
  return (
    <>
      <BlocoDeTom
        tom={rascunho.tom}
        sugerido={musica?.tomSugerido ?? null}
        historico={musica?.historico ?? []}
        tomOriginal={musica?.tomOriginal ?? null}
        musica={rascunho.escolha.resumo}
        escolher={(tom) => mudar({ tom })}
      />

      {como && (
        <div className="secao" data-guia="como">
          <h2>Como</h2>
          <Segmento
            rotulo="Como"
            opcoes={[
              { valor: 'inteira', rotulo: 'Inteira' },
              { valor: 'trecho', rotulo: 'Trecho' },
            ]}
            valor={rascunho.modo}
            aoMudar={(modo) => mudar({ modo })}
          />
        </div>
      )}

      {rascunho.modo === 'trecho' && (
        <BlocoDeMinutagem
          inicio={rascunho.inicio}
          fim={rascunho.fim}
          escrever={(campo, valor) => mudar({ [campo]: valor })}
        />
      )}

      <QuemPuxa
        ministros={ministros}
        valor={rascunho.ministradoPor}
        aoMudar={(ministradoPor) => mudar({ ministradoPor })}
      />

      {observacao && (
        <ObservacaoDoItem valor={rascunho.observacao} aoMudar={(texto) => mudar({ observacao: texto })} />
      )}
    </>
  )
}

export function QuemPuxa({
  ministros,
  valor,
  aoMudar,
}: {
  ministros: PessoaDaEquipe[]
  valor: string | null
  aoMudar: (membroId: string) => void
}) {
  if (ministros.length < 2) return null

  return (
    <div className="secao">
      <h2>Quem puxa</h2>
      <Segmento
        rotulo="Quem puxa"
        opcoes={ministros.map((pessoa) => ({ valor: pessoa.membroId, rotulo: pessoa.nome }))}
        valor={valor ?? ministros[0].membroId}
        aoMudar={aoMudar}
      />
    </div>
  )
}

export function ObservacaoDoItem({ valor, aoMudar }: { valor: string; aoMudar: (texto: string) => void }) {
  return (
    <Campo rotulo="Observação pro grupo">
      <input
        placeholder="opcional: começar mais baixo, solo na transição…"
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
      />
    </Campo>
  )
}
