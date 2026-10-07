import type { Formacao, MembroComAcesso } from '../api/tipos'
import { mover } from '../componentes/ordenacao'
import { formatarDia, hojeEmBrasilia } from '../dominio'
import type { Funcao, Grupo, Membro } from '../dominio'

export type SecaoDoAdmin = {
  caminho: string
  titulo: string
  dica: string
}

export const SECOES: SecaoDoAdmin[] = [
  { caminho: '/admin/membros', titulo: 'Membros', dica: 'Cadastrar, editar funções e papéis, remover.' },
  {
    caminho: '/admin/convites',
    titulo: 'Convites e acesso',
    dica: 'Gerar o link de cada membro e ver quem entrou.',
  },
  { caminho: '/admin/funcoes', titulo: 'Funções', dica: 'Nome, grupo e ordem de cada função.' },
  { caminho: '/admin/formacoes', titulo: 'Formações', dica: 'Grupos de músicos pra escalar de uma vez.' },
  { caminho: '/admin/musicas', titulo: 'Músicas a revisar', dica: 'Arrumar título e artista do que veio da playlist.' },
  { caminho: '/admin/sequencias', titulo: 'Sequências', dica: 'Enviar o Word da letra de várias músicas' },
]

export const LIMITE_DO_ANEXO = 1024 * 1024

const GRUPOS: { grupo: Grupo; nome: string }[] = [
  { grupo: 'vocal', nome: 'Vocal' },
  { grupo: 'instrumentos', nome: 'Músicos' },
  { grupo: 'tecnica', nome: 'Som' },
]

export type GrupoDeFuncoes = { grupo: Grupo; nome: string; funcoes: Funcao[] }

export function resumoDeAcesso(membro: MembroComAcesso): string {
  if (membro.sessoes === 0) {
    const abertos = membro.convites - membro.convitesUsados

    if (abertos <= 0) return 'Nunca entrou · sem convite'

    return `Nunca entrou · ${abertos} ${abertos === 1 ? 'convite aberto' : 'convites abertos'}`
  }

  const aparelhos = `${membro.sessoes} ${membro.sessoes === 1 ? 'aparelho' : 'aparelhos'}`

  return `${aparelhos} · ${membro.push > 0 ? 'recebe notificação' : 'não recebe notificação'}`
}

export function porGrupo(funcoes: Funcao[]): GrupoDeFuncoes[] {
  return GRUPOS.map((cada) => ({
    ...cada,
    funcoes: funcoes.filter((funcao) => funcao.grupo === cada.grupo).sort((a, b) => a.ordem - b.ordem),
  }))
}

export function proximaOrdem(funcoes: Funcao[]): number {
  return funcoes.reduce((maior, funcao) => Math.max(maior, funcao.ordem), 0) + 1
}

export function avisoDeRemocao(membro: Membro): string {
  return `${membro.nome} perde o acesso e sai das escalas futuras. O histórico continua.`
}

export function textoDaRemocao(nome: string, apagado: boolean): string {
  if (apagado) return `${nome} saiu do ministério.`

  return `${nome} saiu do ministério. O histórico continua.`
}

export function resumoDaFormacao(formacao: Formacao, membros: Membro[], funcoes: Funcao[]): string {
  const linhas = formacao.entradas.flatMap((entrada) => {
    const membro = membros.find((x) => x.id === entrada.membroId)
    if (!membro) return []

    const nomes = entrada.funcoes
      .map((id) => funcoes.find((funcao) => funcao.id === id)?.nome)
      .filter((nome): nome is string => !!nome)

    return [nomes.length ? `${membro.nome} (${nomes.join(', ')})` : membro.nome]
  })

  return linhas.length ? linhas.join(', ') : 'Vazia. Monte a equipe de uma escala e salve como formação.'
}

export function recusaDoArquivo(arquivo: { nome: string; tamanho: number } | null): string | null {
  if (!arquivo) return 'Escolha o arquivo da sequência.'
  if (!arquivo.nome.toLowerCase().endsWith('.docx')) return 'A sequência é um arquivo Word (.docx).'
  if (arquivo.tamanho > LIMITE_DO_ANEXO) return 'O arquivo passa de 1 MB.'

  return null
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < LIMITE_DO_ANEXO) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / LIMITE_DO_ANEXO).toFixed(1).replace('.', ',')} MB`
}

export function dataDoEnvio(criadoEm: string, hoje = hojeEmBrasilia()): string {
  return formatarDia(criadoEm.slice(0, 10), hoje)
}

export function textoDaListaEsqueci(ligada: boolean): string {
  if (ligada) {
    return 'Qualquer pessoa que abrir o app escolhe um nome da lista e entra.'
  }

  return 'Quem trocar de celular só volta com um convite novo, gerado aqui.'
}

export function alternar(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor]
}

export type NovaOrdem = { id: string; ordem: number }

export function ordensDepoisDeMover(funcoes: Funcao[], grupo: Grupo, de: number, para: number): NovaOrdem[] {
  const inteira = porGrupo(funcoes).flatMap((cada) =>
    cada.grupo === grupo ? mover(cada.funcoes, de, para) : cada.funcoes,
  )

  return inteira
    .map((funcao, indice) => ({ id: funcao.id, ordem: indice + 1 }))
    .filter(({ id, ordem }) => funcoes.find((funcao) => funcao.id === id)?.ordem !== ordem)
}
