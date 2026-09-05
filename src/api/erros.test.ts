import { describe, expect, it } from 'vitest'
import { SEM_CONEXAO, mensagemDeErro, precisaEntrar } from './erros'

describe('mensagemDeErro', () => {
  it('usa o texto que o Worker mandou', () => {
    expect(mensagemDeErro(403, { erro: 'Só um Ministro ou Admin pode fazer isso.' })).toBe(
      'Só um Ministro ou Admin pode fazer isso.',
    )
    expect(mensagemDeErro(422, { erro: 'Escolha o Tom.' })).toBe('Escolha o Tom.')
  })

  it('ignora corpo sem erro em texto e cai no padrão do status', () => {
    expect(mensagemDeErro(404, {})).toBe('Não encontrei o que você pediu.')
    expect(mensagemDeErro(404, { erro: '' })).toBe('Não encontrei o que você pediu.')
    expect(mensagemDeErro(404, { erro: 7 })).toBe('Não encontrei o que você pediu.')
    expect(mensagemDeErro(404, null)).toBe('Não encontrei o que você pediu.')
    expect(mensagemDeErro(404, 'página em html')).toBe('Não encontrei o que você pediu.')
  })

  it('tem texto próprio pros status que o app trata', () => {
    expect(mensagemDeErro(401, null)).toBe('Entre pelo seu link de convite.')
    expect(mensagemDeErro(403, null)).toBe('Você não tem permissão pra fazer isso.')
    expect(mensagemDeErro(413, null)).toBe('Arquivo grande demais.')
    expect(mensagemDeErro(500, null)).toBe('Algo deu errado por aqui. Tente de novo.')
    expect(mensagemDeErro(503, null)).toBe('Algo deu errado por aqui. Tente de novo.')
  })

  it('status zero é falha de rede', () => {
    expect(mensagemDeErro(0, null)).toBe(SEM_CONEXAO)
  })

  it('status sem texto próprio ainda devolve algo em PT-BR', () => {
    expect(mensagemDeErro(418, null)).toBe('Não consegui completar. Tente de novo.')
  })
})

describe('precisaEntrar', () => {
  it('só o 401 manda pra tela de entrar', () => {
    expect(precisaEntrar(401)).toBe(true)
    expect(precisaEntrar(403)).toBe(false)
    expect(precisaEntrar(0)).toBe(false)
  })
})
