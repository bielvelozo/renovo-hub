import { strToU8, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { WordIlegivel, extrairLetra } from './docx'
import { docxDe } from './docxSintetico'

const VERMELHO = 'FF0000'
const AZUL = '1F4E79'
const ROXO = '7030A0'

describe('extrair a letra de um Word', () => {
  it('lê marcador colorido com asteriscos, estrofes separadas por linha vazia e refrão em negrito', () => {
    const letra = extrairLetra(
      docxDe([
        { runs: [{ texto: 'Me ama – Diante do Trono', cor: VERMELHO }] },
        '',
        { runs: [{ texto: '*Verso*', cor: VERMELHO }] },
        'Eu te busco de manhã',
        'A minha alma tem sede',
        '',
        { runs: [{ texto: '*Refrão: 2 vezes*', cor: VERMELHO }] },
        { runs: [{ texto: 'Me ama como eu sou', negrito: true }] },
      ]),
    )

    expect(letra.cabecalho).toEqual(['Me ama – Diante do Trono'])
    expect(letra.blocos).toEqual([
      { tipo: 'marcador', texto: '*Verso*' },
      {
        tipo: 'estrofe',
        linhas: [
          { texto: 'Eu te busco de manhã', forte: false },
          { texto: 'A minha alma tem sede', forte: false },
        ],
      },
      { tipo: 'marcador', texto: '*Refrão: 2 vezes*' },
      { tipo: 'estrofe', linhas: [{ texto: 'Me ama como eu sou', forte: true }] },
    ])
  })

  it('lê marcador azul em negrito, marcador vazio e marcador roxo', () => {
    const letra = extrairLetra(
      docxDe([
        { runs: [{ texto: '// INTRO', cor: AZUL, negrito: true }] },
        { runs: [{ texto: '//VERSO-1', cor: AZUL, negrito: true }] },
        'E me mostrou um rio',
        { runs: [{ texto: '//', cor: AZUL, negrito: true }] },
        { runs: [{ texto: '//SOLO', cor: ROXO }] },
        'Toda a terra vai louvar',
      ]),
    )

    expect(letra.cabecalho).toEqual([])
    expect(letra.blocos).toEqual([
      { tipo: 'marcador', texto: '// INTRO' },
      { tipo: 'marcador', texto: '//VERSO-1' },
      { tipo: 'estrofe', linhas: [{ texto: 'E me mostrou um rio', forte: false }] },
      { tipo: 'marcador', texto: '//' },
      { tipo: 'marcador', texto: '//SOLO' },
      { tipo: 'estrofe', linhas: [{ texto: 'Toda a terra vai louvar', forte: false }] },
    ])
  })

  it('lê marcador só pelo prefixo, sem cor nenhuma', () => {
    const letra = extrairLetra(docxDe(['Sobre todo nome', '//REFRÃO-2X', 'Cristo é o Senhor', '*Final*']))

    expect(letra.blocos).toEqual([
      { tipo: 'estrofe', linhas: [{ texto: 'Sobre todo nome', forte: false }] },
      { tipo: 'marcador', texto: '//REFRÃO-2X' },
      { tipo: 'estrofe', linhas: [{ texto: 'Cristo é o Senhor', forte: false }] },
      { tipo: 'marcador', texto: '*Final*' },
    ])
  })

  it('a linha é forte quando a maioria dos caracteres, sem contar espaços, está em negrito', () => {
    const letra = extrairLetra(
      docxDe([
        { runs: [{ texto: 'N' }, { texto: 'ão há nada', negrito: true }] },
        { runs: [{ texto: 'Oh, Ele' }, { texto: ' me amou', negrito: true }] },
      ]),
    )

    expect(letra.blocos).toEqual([
      {
        tipo: 'estrofe',
        linhas: [
          { texto: 'Não há nada', forte: true },
          { texto: 'Oh, Ele me amou', forte: false },
        ],
      },
    ])
  })

  it('cada quebra dentro do parágrafo vira uma linha da mesma estrofe', () => {
    const letra = extrairLetra(
      docxDe([{ runs: [{ texto: 'Primeira' }, { quebra: true, texto: 'Segunda' }, { quebra: true, texto: 'Terceira' }] }]),
    )

    expect(letra.blocos).toEqual([
      {
        tipo: 'estrofe',
        linhas: [
          { texto: 'Primeira', forte: false },
          { texto: 'Segunda', forte: false },
          { texto: 'Terceira', forte: false },
        ],
      },
    ])
  })

  it('parágrafo centralizado e tamanho de fonte não mudam nada', () => {
    const letra = extrairLetra(
      docxDe([
        { runs: [{ texto: 'Santo é o Senhor', tamanho: 48 }], centralizado: true },
        { runs: [{ texto: 'Digno de louvor' }], centralizado: true },
      ]),
    )

    expect(letra.blocos).toEqual([
      {
        tipo: 'estrofe',
        linhas: [
          { texto: 'Santo é o Senhor', forte: false },
          { texto: 'Digno de louvor', forte: false },
        ],
      },
    ])
  })

  it('guarda como cabeçalho a linha do topo em negrito, sem as marcas', () => {
    const letra = extrairLetra(
      docxDe([
        { runs: [{ texto: '*Nada que o teu amor não possa – Lauras Souguellis*', negrito: true }] },
        '',
        'Nada que o teu amor não possa',
      ]),
    )

    expect(letra.cabecalho).toEqual(['Nada que o teu amor não possa – Lauras Souguellis'])
    expect(letra.blocos).toEqual([
      { tipo: 'estrofe', linhas: [{ texto: 'Nada que o teu amor não possa', forte: false }] },
    ])
  })

  it('guarda como cabeçalho as duas linhas coloridas do topo', () => {
    const letra = extrairLetra(
      docxDe([
        { runs: [{ texto: 'SUBLIME', cor: AZUL, negrito: true }] },
        { runs: [{ texto: 'FHOP MUSIC', cor: AZUL, negrito: true }] },
        '',
        'Sublime graça',
      ]),
    )

    expect(letra.cabecalho).toEqual(['SUBLIME', 'FHOP MUSIC'])
    expect(letra.blocos).toEqual([{ tipo: 'estrofe', linhas: [{ texto: 'Sublime graça', forte: false }] }])
  })

  it('marcador seguido de letra sem linha vazia não é cabeçalho', () => {
    const letra = extrairLetra(docxDe([{ runs: [{ texto: '//VERSO1', cor: AZUL }] }, 'E me mostrou um rio']))

    expect(letra.cabecalho).toEqual([])
    expect(letra.blocos).toEqual([
      { tipo: 'marcador', texto: '//VERSO1' },
      { tipo: 'estrofe', linhas: [{ texto: 'E me mostrou um rio', forte: false }] },
    ])
  })

  it('o topo com letra comum antes da linha vazia não é cabeçalho', () => {
    const letra = extrairLetra(docxDe(['Eu te busco de manhã', '', 'A minha alma tem sede']))

    expect(letra.cabecalho).toEqual([])
    expect(letra.blocos).toEqual([
      { tipo: 'estrofe', linhas: [{ texto: 'Eu te busco de manhã', forte: false }] },
      { tipo: 'estrofe', linhas: [{ texto: 'A minha alma tem sede', forte: false }] },
    ])
  })

  it('ignora o texto removido no controle de alterações, desfaz as entidades e troca a tabulação por espaço', () => {
    const letra = extrairLetra(
      docxDe([
        { runs: [{ texto: 'Fica', removido: true }, { texto: 'Graça & paz' }] },
        { runs: [{ texto: 'Deus' }, { tab: true }, { texto: 'é fiel' }] },
        { runs: [{ texto: '"Aleluia" <sempre>' }] },
      ]),
    )

    expect(letra.blocos).toEqual([
      {
        tipo: 'estrofe',
        linhas: [
          { texto: 'Graça & paz', forte: false },
          { texto: 'Deus é fiel', forte: false },
          { texto: '"Aleluia" <sempre>', forte: false },
        ],
      },
    ])
  })

  it('negrito ligado conta e negrito desligado não', () => {
    const comNegrito = (valor: string) =>
      comParagrafos(`<w:p><w:r><w:rPr><w:b w:val="${valor}"/></w:rPr><w:t>Sem peso nenhum</w:t></w:r></w:p>`)

    expect(comNegrito('true').blocos).toEqual([
      { tipo: 'estrofe', linhas: [{ texto: 'Sem peso nenhum', forte: true }] },
    ])
    expect(comNegrito('0').blocos).toEqual([
      { tipo: 'estrofe', linhas: [{ texto: 'Sem peso nenhum', forte: false }] },
    ])
    expect(comNegrito('false').blocos).toEqual([
      { tipo: 'estrofe', linhas: [{ texto: 'Sem peso nenhum', forte: false }] },
    ])
  })

  it('cor preta e cor automática não fazem marcador', () => {
    const letra = extrairLetra(
      docxDe([{ runs: [{ texto: 'Preto no branco', cor: '000000' }] }, { runs: [{ texto: 'Automático', cor: 'auto' }] }]),
    )

    expect(letra.blocos).toEqual([
      {
        tipo: 'estrofe',
        linhas: [
          { texto: 'Preto no branco', forte: false },
          { texto: 'Automático', forte: false },
        ],
      },
    ])
  })

  it('recusa documento só com marcadores', () => {
    expect(() => extrairLetra(docxDe(['//INTRO', '*Refrão*']))).toThrow(WordIlegivel)
  })

  it('recusa bytes que não são um zip', () => {
    const erro = pegarErro(() => extrairLetra(Uint8Array.from([1, 2, 3, 4])))

    expect(erro).toBeInstanceOf(WordIlegivel)
    expect((erro as WordIlegivel).motivo).toBeTruthy()
  })

  it('recusa zip sem o documento do Word', () => {
    const bytes = zipSync({ 'outro.xml': strToU8('<nada/>') })

    expect(() => extrairLetra(bytes)).toThrow(WordIlegivel)
  })
})

function comParagrafos(paragrafos: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><w:document><w:body>${paragrafos}</w:body></w:document>`

  return extrairLetra(zipSync({ 'word/document.xml': strToU8(xml) }))
}

function pegarErro(rodar: () => unknown): unknown {
  try {
    rodar()
    return null
  } catch (erro) {
    return erro
  }
}
