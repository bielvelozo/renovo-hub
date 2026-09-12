import { expect, it } from 'vitest'
import { FUNCOES } from '../dominio/exemplo'
import { DATA_BASE_DA_DEMONSTRACAO, dadosDaDemonstracao } from './demonstracao'
import { membrosDoCsv, musicasDoCsv, sqlBase, sqlDemonstracao } from './roteiro'

const AGORA = '2026-09-05T04:00:00.000Z'
const HOJE = DATA_BASE_DA_DEMONSTRACAO

const base = () =>
  sqlBase({
    agora: AGORA,
    funcoes: FUNCOES,
    membros: membrosDoCsv('nome,funcoes,ministro,admin\nGabriel,guitarra,0,1\n'),
    catalogo: musicasDoCsv('videoId,tituloOriginal,canal,duracao\nhRJUcvsnqKs,Meia Noite,Fhop Music,7:12\n'),
    formacoes: ['Banda'],
  })

it('lê o membro do CSV com papéis e função', () => {
  const membros = membrosDoCsv('nome,funcoes,ministro,admin\nGabriel,guitarra,0,1\n')

  expect(membros).toEqual([{ id: 'gabriel', nome: 'Gabriel', funcoes: ['guitarra'], ministro: false, admin: true }])
})

it('aceita várias funções no mesmo campo', () => {
  const membros = membrosDoCsv('nome,funcoes,ministro,admin\nMarcos,"vocal;violão",1,0\n')

  expect(membros[0]).toMatchObject({ id: 'marcos', funcoes: ['vocal', 'violao'], ministro: true, admin: false })
})

it('importa cada vídeo da playlist como Música Legado a revisar, sem Tom', () => {
  const musicas = musicasDoCsv('videoId,tituloOriginal,canal,duracao\n0qTF7saPK7o,Permanecerei,ONE Sounds,6:32\n')

  expect(musicas).toEqual([
    {
      id: '0qTF7saPK7o',
      videoId: '0qTF7saPK7o',
      titulo: 'Permanecerei',
      artista: 'ONE Sounds',
      legado: true,
      revisar: true,
      tomConhecido: null,
      tomOriginal: null,
    },
  ])
})

it('descarta vídeo repetido no CSV', () => {
  const musicas = musicasDoCsv(
    'videoId,tituloOriginal,canal\nhRJUcvsnqKs,Meia Noite,Fhop\nhRJUcvsnqKs,Meia Noite de novo,Fhop\n',
  )

  expect(musicas).toHaveLength(1)
})

it('semeia as sete Funções com grupo, ordem e mínimo por escala', () => {
  const sql = base()

  expect(sql).toContain(
    "INSERT OR IGNORE INTO funcoes (id, nome, grupo, ordem, minimo) VALUES ('som', 'Som', 'tecnica', 7, 1);",
  )
  expect(sql).toContain(
    "INSERT OR IGNORE INTO funcoes (id, nome, grupo, ordem, minimo) VALUES ('vocal', 'Vocal', 'vocal', 1, 2);",
  )
  expect(sql.match(/INSERT OR IGNORE INTO funcoes /g)).toHaveLength(7)
})

it('semeia o membro, suas funções e a Formação Banda vazia', () => {
  const sql = base()

  expect(sql).toContain("INSERT OR IGNORE INTO membro_funcoes (membro_id, funcao_id) VALUES ('gabriel', 'guitarra');")
  expect(sql).toContain("INSERT OR IGNORE INTO formacoes (id, nome) VALUES ('banda', 'Banda');")
  expect(sql).not.toContain('formacao_entradas')
})

it('todo comando do seed é idempotente', () => {
  const sql = base() + sqlDemonstracao({ ...dadosDaDemonstracao(HOJE), agora: AGORA })

  const comandos = sql.split('\n').filter((linha) => linha.trim().startsWith('INSERT'))

  expect(comandos.length).toBeGreaterThan(0)
  expect(comandos.every((linha) => linha.startsWith('INSERT OR IGNORE INTO'))).toBe(true)
})

it('a demonstração tem as Escalas fixas de agosto e as que giram com a data de hoje', () => {
  const dados = dadosDaDemonstracao(HOJE)

  expect(dados.escalas.map((e) => e.id)).toEqual([
    'e0816',
    'e0823',
    'e0830',
    'e0913',
    'd-ontem',
    'd-pronta',
    'd-sem-ministro',
    'd-sem-bateria',
    'd-sem-musicas',
  ])
  expect(dados.escalas.filter((e) => e.data < '2026-09-01')).toHaveLength(3)
})

it('a Escala agendada da demonstração vem com Equipe e Repertório', () => {
  const agendada = dadosDaDemonstracao(HOJE).escalas.find((e) => e.id === 'e0913')!

  expect(agendada.equipe.length).toBeGreaterThan(0)
  expect(agendada.itens.map((i) => i.tipo)).toContain('medley')
  expect(agendada.itens.map((i) => i.tipo)).toContain('trecho')
  expect(agendada.itens.map((i) => i.tipo)).toContain('inteira')
})

it('liga o Item à Música pelo video_id, não pelo id do exemplo', () => {
  const sql = sqlDemonstracao({ ...dadosDaDemonstracao(HOJE), agora: AGORA })

  expect(sql).toContain("(SELECT id FROM musicas WHERE video_id = 'hRJUcvsnqKs')")
  expect(sql).not.toContain("VALUES ('i1', 'e0816', 0, 'inteira', 'meia-noite'")
})

it('grava a Equipe com o Ministro marcado e uma linha por Função', () => {
  const sql = sqlDemonstracao({ ...dadosDaDemonstracao(HOJE), agora: AGORA })

  expect(sql).toContain(
    "INSERT OR IGNORE INTO equipe_membros (escala_id, membro_id, ministro) VALUES ('e0816', 'marcos', 1);",
  )
  expect(sql).toContain(
    "INSERT OR IGNORE INTO equipe_funcoes (escala_id, membro_id, funcao_id) VALUES ('e0816', 'marcos', 'violao');",
  )
})

it('grava o Medley como Item sem Tom e um Trecho por Música, com Tom próprio', () => {
  const dados = dadosDaDemonstracao(HOJE)
  const medley = dados.escalas.find((e) => e.id === 'e0913')!.itens.find((i) => i.tipo === 'medley')!
  const sql = sqlDemonstracao({ ...dados, agora: AGORA })

  const trechos = sql.split('\n').filter((linha) => linha.startsWith('INSERT OR IGNORE INTO trechos '))

  expect(trechos).toHaveLength(2)
  expect(trechos[0]).toContain(`'${medley.id}-t1'`)
  expect(sql).toContain(`VALUES ('${medley.id}', 'e0913'`)
})

it('grava a data da Escala como texto YYYY-MM-DD, separada do horário', () => {
  const sql = sqlDemonstracao({ ...dadosDaDemonstracao(HOJE), agora: AGORA })
  const escalas = sql.split('\n').filter((linha) => linha.startsWith('INSERT OR IGNORE INTO escalas '))
  const dataEHorario = /VALUES [(]'[^']+', '\d{4}-\d{2}-\d{2}', '\d{2}:\d{2}'/

  expect(escalas).toHaveLength(9)
  expect(escalas[0]).toContain("'e0816', '2026-08-16', '18:00', 'Culto de Domingo'")
  expect(escalas.every((linha) => dataEHorario.test(linha))).toBe(true)
})

it('a Santa Ceia de agosto não entra: a demonstração usa os domingos comuns', () => {
  expect(dadosDaDemonstracao(HOJE).escalas.some((e) => e.santaCeia)).toBe(false)
})
