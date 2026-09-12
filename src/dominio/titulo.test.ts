import { describe, expect, it } from 'vitest'
import { limparTitulo } from './titulo'

describe('limparTitulo', () => {
  it('corta no separador de canal e separa artista pelo hífen', () => {
    expect(
      limparTitulo('1 Coríntios 15 (Esse Corpo É Uma Semente) - Eric & Evellyn Emerick | TELOS (Ao Vivo)', 'TELOS'),
    ).toEqual({ titulo: '1 Coríntios 15 (Esse Corpo É Uma Semente)', artista: 'Eric & Evellyn Emerick' })
  })

  it('tira o parêntese de clipe oficial e usa o canal como artista', () => {
    expect(limparTitulo('Algo Bem Maior (Clipe Oficial) • DROPS', 'DROPS')).toEqual({
      titulo: 'Algo Bem Maior',
      artista: 'DROPS',
    })
  })

  it('ignora um pedaço que é só «ao vivo» depois do hífen', () => {
    expect(limparTitulo('Grato Sou (I Thank God) - Ao vivo • DROPS', 'DROPS')).toEqual({
      titulo: 'Grato Sou (I Thank God)',
      artista: 'DROPS',
    })
  })

  it('reconhece o canal na segunda metade', () => {
    expect(limparTitulo('Fez Um Caminho (Ao Vivo) - IIR Music', 'IIR Music')).toEqual({
      titulo: 'Fez Um Caminho',
      artista: 'IIR Music',
    })
  })

  it('remove o sufixo «music» do canal quando não há separador', () => {
    expect(limparTitulo('Meia Noite (Ao Vivo) | fhop music', 'fhop music')).toEqual({
      titulo: 'Meia Noite',
      artista: 'fhop',
    })
  })

  it('reconhece o canal na primeira metade e inverte', () => {
    expect(limparTitulo('Gateway Worship Português - Deus Cuida de Mim', 'Gateway Worship Português')).toEqual({
      titulo: 'Deus Cuida de Mim',
      artista: 'Gateway Worship Português',
    })
  })

  it('compara com o canal sem distinguir maiúsculas e acentos', () => {
    expect(limparTitulo('Oceanos - Ministério Zoe', 'ministerio zoe oficial')).toEqual({
      titulo: 'Oceanos',
      artista: 'Ministério Zoe',
    })
  })

  it('remove colchetes de lyric e áudio', () => {
    expect(limparTitulo('Lugar Secreto [Lyric Video] (Áudio Oficial)', 'Gabriela Rocha')).toEqual({
      titulo: 'Lugar Secreto',
      artista: 'Gabriela Rocha',
    })
  })

  it('usa o travessão como separador', () => {
    expect(limparTitulo('Bondade de Deus – Isaias Saad (Playback)', 'Isaias Saad')).toEqual({
      titulo: 'Bondade de Deus',
      artista: 'Isaias Saad',
    })
  })

  it('apara pontuação solta nas pontas', () => {
    expect(limparTitulo('Teu Amor Não Falha - (Ao Vivo) - ', 'Nívea Soares Oficial')).toEqual({
      titulo: 'Teu Amor Não Falha',
      artista: 'Nívea Soares',
    })
  })

  it('mantém parênteses que fazem parte do nome', () => {
    expect(limparTitulo('Grande É o Senhor (Great Is the Lord)', 'Adhemar de Campos')).toEqual({
      titulo: 'Grande É o Senhor (Great Is the Lord)',
      artista: 'Adhemar de Campos',
    })
  })

  it('devolve o título inteiro quando não há nada pra limpar', () => {
    expect(limparTitulo('Aleluia', 'Coral')).toEqual({ titulo: 'Aleluia', artista: 'Coral' })
  })
})
