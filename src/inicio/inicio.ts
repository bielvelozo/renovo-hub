import type { EscalaApresentada, PosCultoApresentado, SugestaoApresentada } from '../api/tipos'
import type { PessoaDaEquipe } from '../dominio'
import { diasEntre, formatarDia, rotuloDoHorario } from '../dominio'
import { novasDesde } from '../escalas/sugestoes'

export type SeloDaEquipe = {
  membroId: string
  texto: string
  variante: 'destaque' | 'ministro' | 'neutro'
}

export function chaveDoPosCultoFechado(escalaId: string): string {
  return `renovo:pos-culto-fechado:${escalaId}`
}

export function textoDoPosCulto(posCulto: PosCultoApresentado, hoje: string): string {
  const quando = posCulto.data === hoje ? 'Hoje' : 'Ontem'
  const musicas = posCulto.itens === 1 ? '1 música registrada' : `${posCulto.itens} músicas registradas`

  return `${quando}: ${musicas}`
}

export function quandoAcontece(data: string, hoje: string): string {
  const dias = diasEntre(hoje, data)

  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'amanhã'

  return `em ${dias} dias`
}

export function linhaDaEscala(escala: Pick<EscalaApresentada, 'data' | 'horario'>, hoje: string): string {
  return [formatarDia(escala.data, hoje), rotuloDoHorario(escala.horario), quandoAcontece(escala.data, hoje)].join(' · ')
}

export function selosDaEquipe(pessoas: PessoaDaEquipe[], euId: string): SeloDaEquipe[] {
  return [...pessoas]
    .sort((a, b) => Number(b.membroId === euId) - Number(a.membroId === euId))
    .map((pessoa) => {
      const funcoes = pessoa.funcoes.map((funcao) => funcao.toLowerCase())

      if (pessoa.membroId === euId) {
        const papeis = [...(pessoa.ministro ? ['ministro'] : []), ...funcoes]

        return { membroId: pessoa.membroId, texto: papeis.length ? `você: ${papeis.join(', ')}` : 'você', variante: 'destaque' as const }
      }

      if (pessoa.ministro) return { membroId: pessoa.membroId, texto: `${pessoa.nome} · ministro`, variante: 'ministro' as const }

      return {
        membroId: pessoa.membroId,
        texto: [pessoa.nome, funcoes.join(', ')].filter(Boolean).join(' '),
        variante: 'neutro' as const,
      }
    })
}

export function textoDeSugestoesNovas(sugestoes: SugestaoApresentada[], vistasEm: string | null): string | null {
  const novas = novasDesde(sugestoes, vistasEm)
  if (!novas.length) return null

  const quantas = novas.length === 1 ? '1 sugestão nova' : `${novas.length} sugestões novas`

  return `${quantas} · ${quemSugeriu([...new Set(novas.map((sugestao) => sugestao.membro.nome))])}`
}

function quemSugeriu(nomes: string[]): string {
  if (nomes.length === 1) return nomes[0]
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`

  return `${nomes[0]}, ${nomes[1]} e mais ${nomes.length - 2}`
}
