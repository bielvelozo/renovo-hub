import { expect, it } from 'vitest'
import { cru, idDoNome, inserirOuIgnorar, valorSql } from './sql'

it('escapa apóstrofo dobrando', () => {
  expect(valorSql("Terra d'Água")).toBe("'Terra d''Água'")
})

it('converte nulo, booleano e número', () => {
  expect(valorSql(null)).toBe('NULL')
  expect(valorSql(true)).toBe('1')
  expect(valorSql(false)).toBe('0')
  expect(valorSql(7)).toBe('7')
})

it('deixa o valor cru passar sem aspas', () => {
  expect(valorSql(cru("(SELECT id FROM musicas WHERE video_id = 'abc')"))).toBe(
    "(SELECT id FROM musicas WHERE video_id = 'abc')",
  )
})

it('monta um INSERT OR IGNORE com as colunas na ordem dada', () => {
  const sql = inserirOuIgnorar('membros', { id: 'gabriel', nome: 'Gabriel', admin: true })

  expect(sql).toBe("INSERT OR IGNORE INTO membros (id, nome, admin) VALUES ('gabriel', 'Gabriel', 1);")
})

it('deriva o id do nome sem acento e sem caixa', () => {
  expect(idDoNome('Violão')).toBe('violao')
  expect(idDoNome('Júlia')).toBe('julia')
  expect(idDoNome('Santa Ceia')).toBe('santa-ceia')
  expect(idDoNome('  Som  ')).toBe('som')
})
