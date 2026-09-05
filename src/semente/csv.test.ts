import { expect, it } from 'vitest'
import { lerCsv } from './csv'

it('lê o cabeçalho e devolve uma linha por registro', () => {
  const linhas = lerCsv('nome,funcoes\nGabriel,guitarra\nIsa,vocal\n')

  expect(linhas).toEqual([
    { nome: 'Gabriel', funcoes: 'guitarra' },
    { nome: 'Isa', funcoes: 'vocal' },
  ])
})

it('respeita vírgula dentro de campo entre aspas', () => {
  const linhas = lerCsv('videoId,tituloOriginal\nkJ9,"Como Não Te Amar - Gabi Sampaio, Lucas Magno"\n')

  expect(linhas[0].tituloOriginal).toBe('Como Não Te Amar - Gabi Sampaio, Lucas Magno')
})

it('desescapa aspas dobradas', () => {
  const linhas = lerCsv('titulo\n"Ele disse ""vem"""\n')

  expect(linhas[0].titulo).toBe('Ele disse "vem"')
})

it('ignora BOM, CRLF e linhas em branco', () => {
  const linhas = lerCsv('﻿nome\r\nGabriel\r\n\r\n')

  expect(linhas).toEqual([{ nome: 'Gabriel' }])
})

it('completa com vazio a coluna que a linha não trouxe', () => {
  const linhas = lerCsv('nome,funcoes,ministro\nGabriel,guitarra\n')

  expect(linhas[0].ministro).toBe('')
})
