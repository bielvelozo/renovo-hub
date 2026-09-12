import type { Escala, Funcao, Item, Membro, Ministerio, Musica, Trecho } from './tipos'

export const FUNCOES: Funcao[] = [
  { id: 'vocal', nome: 'Vocal', grupo: 'vocal', ordem: 1, minimo: 2 },
  { id: 'guitarra', nome: 'Guitarra', grupo: 'instrumentos', ordem: 2, minimo: 1 },
  { id: 'violao', nome: 'Violão', grupo: 'instrumentos', ordem: 3, minimo: 0 },
  { id: 'baixo', nome: 'Baixo', grupo: 'instrumentos', ordem: 4, minimo: 1 },
  { id: 'bateria', nome: 'Bateria', grupo: 'instrumentos', ordem: 5, minimo: 1 },
  { id: 'teclado', nome: 'Teclado', grupo: 'instrumentos', ordem: 6, minimo: 0 },
  { id: 'som', nome: 'Som', grupo: 'tecnica', ordem: 7, minimo: 1 },
]

export const TONS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

const membro = (id: string, nome: string, funcoes: string[], papeis: Partial<Membro> = {}): Membro => ({
  id,
  nome,
  funcoes,
  ministro: false,
  admin: false,
  inativo: false,
  ...papeis,
})

const musica = (
  id: string,
  titulo: string,
  artista: string,
  videoId: string,
  tomOriginal: string | null,
  tomConhecido: string | null = null,
): Musica => ({ id, titulo, artista, videoId, legado: true, tomOriginal, tomConhecido, arquivada: false, revisar: false })

const equipe = (membroId: string, funcoes: string[], ministro = false) => ({ membroId, funcoes, ministro })

export const inteira = (id: string, musicaId: string, tom: string, observacao = ''): Item => ({
  id,
  tipo: 'inteira',
  musicaId,
  tom,
  observacao,
  ministradoPor: null,
})

export const trecho = (id: string, musicaId: string, tom: string, inicio: string, fim: string): Item => ({
  id,
  tipo: 'trecho',
  musicaId,
  tom,
  inicio,
  fim,
  observacao: '',
  ministradoPor: null,
})

export const medley = (id: string, trechos: Trecho[], observacao = ''): Item => ({
  id,
  tipo: 'medley',
  trechos,
  observacao,
  ministradoPor: null,
})

const escala = (
  id: string,
  data: string,
  equipes: Escala['equipe'],
  itens: Item[],
  extra: Partial<Escala> = {},
): Escala => ({
  id,
  data,
  horario: '18:00',
  rotulo: 'Culto de Domingo',
  santaCeia: false,
  cancelada: false,
  equipe: equipes,
  itens,
  ...extra,
})

export function ministerioDeExemplo(hoje = '2026-09-08'): Ministerio {
  return {
    hoje,
    funcoes: FUNCOES,
    membros: [
      membro('gabriel', 'Gabriel', ['guitarra'], { admin: true }),
      membro('isa', 'Isa', ['vocal'], { ministro: true }),
      membro('marcos', 'Marcos', ['vocal', 'violao'], { ministro: true }),
      membro('pedro', 'Pedro', ['baixo']),
      membro('ana', 'Ana', ['vocal']),
      membro('lucas', 'Lucas', ['bateria']),
      membro('rafa', 'Rafa', ['baixo', 'teclado']),
      membro('bia', 'Bia', ['vocal']),
      membro('julia', 'Júlia', ['vocal', 'teclado']),
      membro('davi', 'Davi', ['som']),
    ],
    musicas: [
      musica('meia-noite', 'Meia Noite', 'Fhop Music', 'hRJUcvsnqKs', 'G'),
      musica('firme', 'Firme Fundamento', 'Central MSC', 'FKKytz49Fhg', 'C'),
      musica('grato', 'Grato Sou', 'DROPS', 'Yo9G3hvl_UI', 'C', 'Bb'),
      musica('permanecerei', 'Permanecerei', 'Eric & Evellyn Emerick', '0qTF7saPK7o', 'B', 'A'),
      musica('em-teus-bracos', 'Em Teus Braços', 'Laura Souguellis', 'IxpWNuxGmzc', 'G'),
      musica('sublime', 'Sublime', 'Fhop Music', '7GWZwO0MdsY', 'A'),
      musica('fez-um-caminho', 'Fez Um Caminho', 'IIR Music', 'pXQRyiSZ8mQ', 'D'),
      musica('como-nao-te-amar', 'Como Não Te Amar', 'Gabi Sampaio', 'kJ9Yy-YGTNo', 'C'),
      musica('rio', 'Rio', 'Nívea Soares', 's1oU-6vYc4E', 'D'),
      musica('dono', 'Dono da Minha Afeição', 'Fhop Music', '2anDhu7L-Cc', 'E'),
    ],
    escalas: [
      escala(
        'e0816',
        '2026-08-16',
        [
          equipe('marcos', ['vocal', 'violao'], true),
          equipe('gabriel', ['guitarra']),
          equipe('pedro', ['baixo']),
          equipe('ana', ['vocal']),
          equipe('lucas', ['bateria']),
          equipe('davi', ['som']),
        ],
        [inteira('i1', 'meia-noite', 'E'), inteira('i2', 'firme', 'C')],
      ),
      escala(
        'e0823',
        '2026-08-23',
        [
          equipe('isa', ['vocal'], true),
          equipe('gabriel', ['guitarra']),
          equipe('rafa', ['baixo']),
          equipe('julia', ['vocal']),
          equipe('lucas', ['bateria']),
          equipe('bia', ['vocal']),
          equipe('davi', ['som']),
        ],
        [inteira('i3', 'grato', 'Bb'), inteira('i4', 'permanecerei', 'A')],
      ),
      escala(
        'e0830',
        '2026-08-30',
        [
          equipe('isa', ['vocal'], true),
          equipe('gabriel', ['guitarra']),
          equipe('marcos', ['violao']),
          equipe('ana', ['vocal']),
          equipe('lucas', ['bateria']),
          equipe('bia', ['vocal']),
          equipe('davi', ['som']),
        ],
        [
          inteira('i5', 'meia-noite', 'G', 'Começar mais baixo, diferente do clipe'),
          inteira('i6', 'em-teus-bracos', 'G'),
          trecho('i7', 'sublime', 'A', '2:10', '4:35'),
        ],
      ),
      escala(
        'e0906',
        '2026-09-06',
        [
          equipe('marcos', ['vocal', 'violao'], true),
          equipe('gabriel', ['guitarra']),
          equipe('pedro', ['baixo']),
          equipe('julia', ['vocal']),
          equipe('lucas', ['bateria']),
          equipe('davi', ['som']),
        ],
        [inteira('i8', 'fez-um-caminho', 'D'), inteira('i9', 'como-nao-te-amar', 'C')],
        { horario: '08:00', santaCeia: true },
      ),
      escala(
        'e0913',
        '2026-09-13',
        [
          equipe('isa', ['vocal'], true),
          equipe('gabriel', ['guitarra']),
          equipe('pedro', ['baixo']),
          equipe('ana', ['vocal']),
          equipe('lucas', ['bateria']),
          equipe('davi', ['som']),
        ],
        [],
      ),
      escala('e0920', '2026-09-20', [], []),
      escala('e0927', '2026-09-27', [], []),
    ],
  }
}
