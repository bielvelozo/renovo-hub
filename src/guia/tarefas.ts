export type Avanco = 'toque' | 'proximo' | 'aparecer' | 'rota'

export type Passo = {
  alvo: string
  titulo: string
  texto: string
  avanco: Avanco
  rota?: RegExp
  opcional?: boolean
  semAlvo?: string
}

export type Comeco = { tipo: 'rota'; caminho: string } | { tipo: 'escala'; sufixo: string } | { tipo: 'culto' }

export type Tarefa = {
  id: IdDaTarefa
  titulo: string
  sub: string
  paraQuemDirige: boolean
  comeco: Comeco
  passos: Passo[]
}

export const IDS_DAS_TAREFAS = [
  'conferir-escala',
  'ler-letra',
  'modo-culto',
  'sugerir',
  'catalogo',
  'criar-escalas',
  'montar-equipe',
  'adicionar-musica',
  'medley',
  'letra',
  'promover',
] as const

export type IdDaTarefa = (typeof IDS_DAS_TAREFAS)[number]

export function ehTarefa(valor: unknown): valor is IdDaTarefa {
  return typeof valor === 'string' && (IDS_DAS_TAREFAS as readonly string[]).includes(valor)
}

export const TAREFAS: Record<IdDaTarefa, Tarefa> = {
  'conferir-escala': {
    id: 'conferir-escala',
    titulo: 'Conferir sua escala',
    sub: 'Músicas, tom e quem toca com você',
    paraQuemDirige: false,
    comeco: { tipo: 'escala', sufixo: '' },
    passos: [
      {
        alvo: 'repertorio',
        titulo: 'O que vai tocar',
        texto: 'As músicas desta escala, na ordem, com o tom de cada uma. Toque numa música pra ver o vídeo e a letra.',
        avanco: 'proximo',
      },
      {
        alvo: 'equipe',
        titulo: 'Quem toca com você',
        texto: 'A equipe desta escala, separada por grupo, com a função de cada pessoa.',
        avanco: 'proximo',
      },
    ],
  },
  'ler-letra': {
    id: 'ler-letra',
    titulo: 'Ler a letra no celular',
    sub: 'Letra grande e rolagem automática',
    paraQuemDirige: false,
    comeco: { tipo: 'rota', caminho: '/musicas' },
    passos: [
      {
        alvo: 'ver',
        titulo: 'Só as que têm letra',
        texto: 'Em Ver, escolha Com letra pra ficar só com as músicas que já têm letra.',
        avanco: 'proximo',
      },
      {
        alvo: 'catalogo-lista',
        titulo: 'Escolha uma música',
        texto: 'Toque numa música da lista.',
        avanco: 'rota',
        rota: /^\/musicas\/[^/]+$/,
      },
      {
        alvo: 'letra',
        titulo: 'Abra a letra',
        texto: 'Toque em Letra.',
        avanco: 'rota',
        rota: /\/letra$/,
        semAlvo: 'Esta música ainda não tem letra. Volte e escolha outra em Ver › Com letra.',
      },
      {
        alvo: 'barra-de-leitura',
        titulo: 'Do seu jeito',
        texto: 'A− e A+ mudam o tamanho. Rolar desce a letra sozinha, e − e + acertam a velocidade.',
        avanco: 'proximo',
      },
    ],
  },
  'modo-culto': {
    id: 'modo-culto',
    titulo: 'Usar o modo culto',
    sub: 'Letra e tom no palco',
    paraQuemDirige: false,
    comeco: { tipo: 'culto' },
    passos: [
      {
        alvo: 'culto-ordem',
        titulo: 'Abra a letra',
        texto: 'Toque numa música e a letra abre com o tom grande.',
        avanco: 'rota',
        rota: /^\/culto\/[^/]+\/item\//,
        semAlvo: 'O ministro ainda não escolheu as músicas desta escala. Quando escolher, elas aparecem aqui.',
      },
      {
        alvo: 'culto-navegar',
        titulo: 'Passe de música',
        texto: 'Deslize pro lado, ou use estes botões, pra ir pra próxima.',
        avanco: 'proximo',
      },
      {
        alvo: 'culto-sair',
        titulo: 'No dia do culto',
        texto: 'O X volta pro app. No dia, o atalho do modo culto aparece sozinho no Início.',
        avanco: 'proximo',
      },
    ],
  },
  sugerir: {
    id: 'sugerir',
    titulo: 'Sugerir uma música',
    sub: 'Pelo nome ou pelo link do YouTube',
    paraQuemDirige: false,
    comeco: { tipo: 'rota', caminho: '/sugestoes' },
    passos: [
      {
        alvo: 'sugerir',
        titulo: 'Toque em Sugerir',
        texto: 'Qualquer pessoa do ministério pode sugerir. Quem dirige vê a lista e leva a música pra uma escala.',
        avanco: 'toque',
      },
      {
        alvo: 'busca',
        titulo: 'Ache a música',
        texto: 'Busque pelo nome ou cole o link do YouTube, e toque na música.',
        avanco: 'aparecer',
      },
      {
        alvo: 'enviar-sugestao',
        titulo: 'Envie',
        texto: 'Conte, se quiser, por que ela combina, e toque em Enviar sugestão.',
        avanco: 'toque',
      },
    ],
  },
  catalogo: {
    id: 'catalogo',
    titulo: 'Achar músicas no catálogo',
    sub: 'Redescobrir, Recentes e filtros',
    paraQuemDirige: false,
    comeco: { tipo: 'rota', caminho: '/musicas' },
    passos: [
      {
        alvo: 'busca',
        titulo: 'Busca',
        texto: 'Digite parte do título ou do artista.',
        avanco: 'proximo',
      },
      {
        alvo: 'abas-do-catalogo',
        titulo: 'Três jeitos de olhar',
        texto:
          'Redescobrir traz o que não toca há tempo. Recentes mostra o que pode soar repetido. Todas é o catálogo de A a Z. Em Ver, filtre por quem escolheu ou só as com letra.',
        avanco: 'proximo',
      },
    ],
  },
  'criar-escalas': {
    id: 'criar-escalas',
    titulo: 'Criar as escalas do mês',
    sub: 'Domingos num toque e eventos à parte',
    paraQuemDirige: true,
    comeco: { tipo: 'rota', caminho: '/mes' },
    passos: [
      {
        alvo: 'criar-domingos',
        titulo: 'Os domingos num toque',
        texto: 'Um toque cria todos os domingos do mês, e o segundo já vem como Santa Ceia às 8h.',
        avanco: 'toque',
        opcional: true,
      },
      {
        alvo: 'nova-escala',
        titulo: 'Evento fora de domingo',
        texto: 'Pra uma conferência ou outro evento, toque em Nova escala e escolha nome, data e horário.',
        avanco: 'proximo',
      },
    ],
  },
  'montar-equipe': {
    id: 'montar-equipe',
    titulo: 'Montar a equipe',
    sub: 'Com uma formação ou pessoa por pessoa',
    paraQuemDirige: true,
    comeco: { tipo: 'escala', sufixo: '/equipe' },
    passos: [
      {
        alvo: 'formacao',
        titulo: 'Os músicos de sempre',
        texto: 'Com uma formação, os músicos de sempre entram num toque. Depois é só ajustar quem faltar.',
        avanco: 'proximo',
        opcional: true,
      },
      {
        alvo: 'funcao',
        titulo: 'Pessoa por pessoa',
        texto: 'Toque na função da pessoa pra escalar, e de novo pra tirar.',
        avanco: 'proximo',
      },
      {
        alvo: 'pronto-equipe',
        titulo: 'Pronto',
        texto: 'Quando terminar, toque em Pronto. Quem entrou recebe o aviso no celular.',
        avanco: 'proximo',
      },
    ],
  },
  'adicionar-musica': {
    id: 'adicionar-musica',
    titulo: 'Adicionar uma música',
    sub: 'Tom, trecho e observação',
    paraQuemDirige: true,
    comeco: { tipo: 'escala', sufixo: '' },
    passos: [
      {
        alvo: 'adicionar-musica',
        titulo: 'Toque em Adicionar música',
        texto: 'Cada música do repertório entra por aqui, uma por vez.',
        avanco: 'toque',
      },
      {
        alvo: 'busca',
        titulo: 'Ache a música',
        texto:
          'Digite o nome ou cole o link do YouTube e toque na música.',
        avanco: 'aparecer',
      },
      {
        alvo: 'tom',
        titulo: 'Escolha o tom',
        texto: 'O app mostra o último tom em que vocês tocaram, e o Cifra Club ajuda a achar o original.',
        avanco: 'proximo',
      },
      {
        alvo: 'como',
        titulo: 'Inteira ou trecho',
        texto: 'Trecho toca só um pedaço do vídeo, com o início e o fim que você marcar.',
        avanco: 'proximo',
        opcional: true,
      },
      {
        alvo: 'confirmar-item',
        titulo: 'Adicione',
        texto: 'Se quiser, deixe uma observação pro grupo, e toque em Adicionar ao repertório.',
        avanco: 'toque',
      },
    ],
  },
  medley: {
    id: 'medley',
    titulo: 'Montar um medley',
    sub: 'Dois ou mais trechos emendados',
    paraQuemDirige: true,
    comeco: { tipo: 'escala', sufixo: '/medley' },
    passos: [
      {
        alvo: 'trecho',
        titulo: 'O primeiro trecho',
        texto: 'Cada trecho é um pedaço de uma música. Toque em Trecho e escolha a música.',
        avanco: 'aparecer',
      },
      {
        alvo: 'ok-trecho',
        titulo: 'Tom e minutagem',
        texto: 'Escolha o tom e o pedaço do vídeo que vocês tocam, e toque em OK, próximo.',
        avanco: 'toque',
      },
      {
        alvo: 'trecho',
        titulo: 'Mais um',
        texto: 'Um medley precisa de pelo menos dois trechos. Adicione o próximo do mesmo jeito.',
        avanco: 'proximo',
      },
      {
        alvo: 'adicionar-medley',
        titulo: 'Adicione o medley',
        texto: 'Com dois ou mais trechos, toque em Adicionar medley ao repertório.',
        avanco: 'proximo',
      },
    ],
  },
  letra: {
    id: 'letra',
    titulo: 'Enviar a letra em Word',
    sub: 'Do jeito que a equipe já escreve',
    paraQuemDirige: true,
    comeco: { tipo: 'rota', caminho: '/musicas' },
    passos: [
      {
        alvo: 'catalogo-lista',
        titulo: 'Escolha a música',
        texto: 'Toque na música da letra, ou busque por ela.',
        avanco: 'rota',
        rota: /^\/musicas\/[^/]+$/,
      },
      {
        alvo: 'mais-da-musica',
        titulo: 'Envie o Word',
        texto:
          'No menu, Enviar letra (Word) manda o arquivo do jeito que ele está. O app lê sozinho: linha colorida ou começada por // vira marcador, negrito vira destaque.',
        avanco: 'proximo',
      },
    ],
  },
  promover: {
    id: 'promover',
    titulo: 'Promover uma sugestão',
    sub: 'Da lista de sugestões pro repertório',
    paraQuemDirige: true,
    comeco: { tipo: 'rota', caminho: '/sugestoes' },
    passos: [
      {
        alvo: 'sugestao',
        titulo: 'Toque numa sugestão',
        texto: 'As sugestões abertas do ministério ficam aqui.',
        avanco: 'toque',
        semAlvo: 'Não tem sugestão aberta agora. Quando alguém sugerir, toque nela e em Promover pra uma escala.',
      },
      {
        alvo: 'promover',
        titulo: 'Leve pra uma escala',
        texto: 'Promover pra uma escala abre a música com tom e trecho, como em Adicionar música, e avisa quem sugeriu.',
        avanco: 'proximo',
      },
    ],
  },
}

const DE_QUEM_DIRIGE: IdDaTarefa[] = [
  'criar-escalas',
  'montar-equipe',
  'adicionar-musica',
  'medley',
  'letra',
  'promover',
  'modo-culto',
]

const DE_TODOS: IdDaTarefa[] = ['conferir-escala', 'ler-letra', 'modo-culto', 'sugerir', 'catalogo']

export function tarefasDoInicio(dirige: boolean): Tarefa[] {
  return (dirige ? DE_QUEM_DIRIGE : DE_TODOS).map((id) => TAREFAS[id])
}

export function gruposDoGuia(dirige: boolean): { titulo: string; tarefas: Tarefa[] }[] {
  const paraTodos = { titulo: 'Para todos', tarefas: DE_TODOS.map((id) => TAREFAS[id]) }
  if (!dirige) return [paraTodos]

  const soDeQuemDirige = DE_QUEM_DIRIGE.filter((id) => TAREFAS[id].paraQuemDirige).map((id) => TAREFAS[id])
  return [{ titulo: 'Para quem dirige', tarefas: soDeQuemDirige }, paraTodos]
}

export function contarFeitas(tarefas: Tarefa[], feitas: readonly string[]): number {
  return tarefas.filter((tarefa) => feitas.includes(tarefa.id)).length
}

export type Andamento = { tarefa: IdDaTarefa; passo: number }

export function avancar(andamento: Andamento): Andamento | null {
  const proximo = andamento.passo + 1
  return proximo < TAREFAS[andamento.tarefa].passos.length ? { ...andamento, passo: proximo } : null
}
