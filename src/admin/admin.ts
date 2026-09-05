import type { Formacao, MembroComAcesso } from '../api/tipos'
import { formatarDia } from '../dominio'
import type { Funcao, Membro, Naipe } from '../dominio'

export type SecaoDoAdmin = {
  caminho: string
  titulo: string
  dica: string
}

export const SECOES: SecaoDoAdmin[] = [
  { caminho: '/admin/membros', titulo: 'Membros', dica: 'Cadastrar, editar Funções e papéis, remover.' },
  {
    caminho: '/admin/convites',
    titulo: 'Convites e acesso',
    dica: 'Gerar o link de cada Membro, ver quem entrou e ligar a lista do «esqueci».',
  },
  { caminho: '/admin/funcoes', titulo: 'Funções', dica: 'Nome, naipe e ordem de cada Função.' },
  { caminho: '/admin/formacoes', titulo: 'Formações', dica: 'Os grupos que a Equipe aplica de uma vez.' },
  { caminho: '/admin/musicas', titulo: 'Músicas a revisar', dica: 'Arrumar título e artista do que veio da playlist.' },
  { caminho: '/admin/sequencias', titulo: 'Sequências', dica: 'Enviar o Word da letra e guardar as versões.' },
]

export const LIMITE_DO_ANEXO = 1024 * 1024

const NAIPES: { naipe: Naipe; nome: string }[] = [
  { naipe: 'vocal', nome: 'Vocal' },
  { naipe: 'instrumentos', nome: 'Músicos' },
  { naipe: 'tecnica', nome: 'Som' },
]

export type GrupoDeFuncoes = { naipe: Naipe; nome: string; funcoes: Funcao[] }

export function resumoDeAcesso(membro: MembroComAcesso): string {
  if (membro.sessoes === 0) {
    const abertos = membro.convites - membro.convitesUsados

    if (abertos <= 0) return 'Nunca entrou · sem convite'

    return `Nunca entrou · ${abertos} ${abertos === 1 ? 'convite aberto' : 'convites abertos'}`
  }

  const aparelhos = `${membro.sessoes} ${membro.sessoes === 1 ? 'aparelho' : 'aparelhos'}`

  return `${aparelhos} · ${membro.push > 0 ? 'recebe notificação' : 'não recebe notificação'}`
}

export function porNaipe(funcoes: Funcao[]): GrupoDeFuncoes[] {
  return NAIPES.map((grupo) => ({
    ...grupo,
    funcoes: funcoes.filter((funcao) => funcao.naipe === grupo.naipe).sort((a, b) => a.ordem - b.ordem),
  }))
}

export function proximaOrdem(funcoes: Funcao[]): number {
  return funcoes.reduce((maior, funcao) => Math.max(maior, funcao.ordem), 0) + 1
}

export function avisoDeRemocao(membro: Membro): string {
  return `Remover ${membro.nome} apaga as sessões, os convites e as notificações dele, e o tira das Equipes futuras. As Execuções passadas ficam.`
}

export function textoDaRemocao(nome: string, apagado: boolean): string {
  if (apagado) return `${nome} saiu do ministério.`

  return `${nome} já serviu em Escala Realizada: fica no histórico como inativo e sai das Equipes futuras.`
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

  return linhas.length ? linhas.join(', ') : 'Vazia: monte a Equipe de uma Escala e salve por lá.'
}

export function recusaDoArquivo(arquivo: { nome: string; tamanho: number } | null): string | null {
  if (!arquivo) return 'Escolha o arquivo da Sequência.'
  if (!arquivo.nome.toLowerCase().endsWith('.docx')) return 'A Sequência é um arquivo Word (.docx).'
  if (arquivo.tamanho > LIMITE_DO_ANEXO) return 'O arquivo passa de 1 MB.'

  return null
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < LIMITE_DO_ANEXO) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / LIMITE_DO_ANEXO).toFixed(1).replace('.', ',')} MB`
}

export function dataDoEnvio(criadoEm: string): string {
  return formatarDia(criadoEm.slice(0, 10))
}

export function textoDaListaEsqueci(ligada: boolean): string {
  if (ligada) {
    return 'Ligada: qualquer pessoa que abrir o app escolhe um nome da lista e entra. Deixe assim até todo mundo estar com o app instalado.'
  }

  return 'Desligada: quem trocar de celular só volta com um convite novo, gerado aqui.'
}

export function alternar(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((item) => item !== valor) : [...lista, valor]
}
