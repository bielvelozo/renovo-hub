import type { ExecucaoApresentada } from '../api/tipos'
import { Icone } from '../casca/Icone'
import { formatarDia, tempoRelativo } from '../dominio'
import type { Planejada } from '../dominio'

export type MemoriaDaMusica = {
  recente: boolean
  ultimaExecucao: ExecucaoApresentada | null
  planejadaEm: Planejada[]
}

export function FaixaDeAlerta({ frases }: { frases: string[] }) {
  if (frases.length === 0) return null

  return (
    <div className="faixa-de-alerta" role="status">
      <Icone nome="atencao" />
      <div>
        {frases.map((frase) => (
          <p key={frase} className="frase">
            {frase}
          </p>
        ))}
      </div>
    </div>
  )
}

export function frasesDeAlerta(memoria: MemoriaDaMusica, hoje: string): string[] {
  const frases: string[] = []
  const ultima = memoria.ultimaExecucao

  if (memoria.recente && ultima) {
    const quem = ultima.ministradoPorNome ? `, com ${ultima.ministradoPorNome}` : ''
    frases.push(`Tocada ${tempoRelativo(ultima.data, hoje)}${quem}.`)
  }

  for (const planejada of memoria.planejadaEm) {
    if (frases.length >= 2) break
    const quem = planejada.ministros.length ? ` (${planejada.ministros.join(', ')})` : ''
    frases.push(`Já está no Repertório de ${formatarDia(planejada.data, hoje)}${quem}.`)
  }

  return frases
}
