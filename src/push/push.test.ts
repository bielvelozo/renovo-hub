import { describe, expect, it } from 'vitest'
import { base64urlParaBytes, bytesParaBase64url } from './base64'
import {
  chaveDoServidor,
  dadosDaInscricao,
  estaLigado,
  podeAtivar,
  situacaoDoPush,
  textoDaSituacao,
} from './push'
import type { Ambiente } from './push'

const CHAVE = 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4'

const base: Ambiente = {
  suportado: true,
  instalado: true,
  permissao: 'default',
  inscrito: false,
  silenciado: false,
}

describe('base64url', () => {
  it('vai e volta sem perder byte', () => {
    const bytes = base64urlParaBytes(CHAVE)

    expect(bytes.length).toBe(65)
    expect(bytesParaBase64url(bytes)).toBe(CHAVE)
  })

  it('não deixa sobrar «+», «/» nem «=»', () => {
    const texto = bytesParaBase64url(Uint8Array.of(251, 255, 190, 1))

    expect(texto).not.toMatch(/[+/=]/)
    expect(base64urlParaBytes(texto)).toEqual(Uint8Array.of(251, 255, 190, 1))
  })
})

describe('situacaoDoPush', () => {
  it('sem suporte no navegador, nada a fazer', () => {
    expect(situacaoDoPush({ ...base, suportado: false })).toBe('sem-suporte')
  })

  it('fora da tela inicial, manda instalar antes', () => {
    expect(situacaoDoPush({ ...base, instalado: false })).toBe('precisa-instalar')
  })

  it('instalado e sem inscrição, dá pra ativar', () => {
    expect(situacaoDoPush(base)).toBe('pode-ativar')
  })

  it('permissão negada ganha o caminho dos Ajustes', () => {
    expect(situacaoDoPush({ ...base, permissao: 'denied' })).toBe('negada')
  })

  it('inscrito é ligado, e silenciado quando o Membro pediu silêncio', () => {
    expect(situacaoDoPush({ ...base, permissao: 'granted', inscrito: true })).toBe('ligado')
    expect(situacaoDoPush({ ...base, permissao: 'granted', inscrito: true, silenciado: true })).toBe('silenciado')
  })

  it('quem já se inscreveu não volta pro «precisa instalar»', () => {
    expect(situacaoDoPush({ ...base, instalado: false, permissao: 'granted', inscrito: true })).toBe('ligado')
  })
})

describe('podeAtivar e estaLigado', () => {
  it('só libera o botão quando dá pra ativar', () => {
    expect(podeAtivar('pode-ativar')).toBe(true)
    expect(podeAtivar('precisa-instalar')).toBe(false)
    expect(podeAtivar('negada')).toBe(false)
  })

  it('considera ligado tanto o inscrito quanto o silenciado', () => {
    expect(estaLigado('ligado')).toBe(true)
    expect(estaLigado('silenciado')).toBe(true)
    expect(estaLigado('pode-ativar')).toBe(false)
  })
})

describe('textoDaSituacao', () => {
  it('tem texto em PT-BR pra toda situação', () => {
    for (const situacao of ['sem-suporte', 'precisa-instalar', 'pode-ativar', 'negada', 'ligado', 'silenciado'] as const) {
      expect(textoDaSituacao(situacao).length).toBeGreaterThan(10)
    }
  })
})

describe('chaveDoServidor', () => {
  it('devolve o ponto P-256 sem compressão', () => {
    const bytes = chaveDoServidor(CHAVE)

    expect(bytes.length).toBe(65)
    expect(bytes[0]).toBe(4)
  })

  it('recusa chave que não é ponto P-256', () => {
    expect(() => chaveDoServidor('YWJj')).toThrow('Não foi possível ativar as notificações.')
  })
})

describe('dadosDaInscricao', () => {
  it('traduz o que o navegador devolve pro corpo da rota', () => {
    const p256dh = base64urlParaBytes(CHAVE)
    const auth = base64urlParaBytes('BTBZMqHH6r4Tts7J_aSIgg')

    const dados = dadosDaInscricao({
      endpoint: 'https://web.push.apple.com/abc',
      getKey: (nome) => (nome === 'p256dh' ? bufferDe(p256dh) : bufferDe(auth)),
    })

    expect(dados).toEqual({
      endpoint: 'https://web.push.apple.com/abc',
      p256dh: CHAVE,
      auth: 'BTBZMqHH6r4Tts7J_aSIgg',
    })
  })

  it('reclama quando o navegador não devolve as chaves', () => {
    expect(() => dadosDaInscricao({ endpoint: 'https://x', getKey: () => null })).toThrow(
      'Não foi possível ativar as notificações.',
    )
  })
})

function bufferDe(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}
