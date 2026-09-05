import { describe, expect, it } from 'vitest'
import { FILTROS, caminhoDoCatalogo, textoDoVazio } from './catalogo'

describe('filtros do catálogo', () => {
  it('todas não leva nada na URL', () => {
    expect(caminhoDoCatalogo('todas')).toBe('/api/musicas')
  })

  it('Nova e Legado viram o filtro da rota', () => {
    expect(caminhoDoCatalogo('nova')).toBe('/api/musicas?filtro=nova')
    expect(caminhoDoCatalogo('legado')).toBe('/api/musicas?filtro=legado')
  })

  it('faz tempo vira meses, que a rota conta a partir da última Execução', () => {
    expect(caminhoDoCatalogo('meses-3')).toBe('/api/musicas?meses=3')
    expect(caminhoDoCatalogo('meses-12')).toBe('/api/musicas?meses=12')
  })

  it('todo filtro oferecido tem rótulo e caminho', () => {
    expect(FILTROS.map((filtro) => filtro.valor)).toEqual(['todas', 'nova', 'legado', 'meses-3', 'meses-6', 'meses-12'])
    expect(FILTROS.every((filtro) => filtro.rotulo.length > 0)).toBe(true)
    expect(FILTROS.every((filtro) => caminhoDoCatalogo(filtro.valor).startsWith('/api/musicas'))).toBe(true)
  })

  it('os rótulos dos meses dizem o corte', () => {
    expect(FILTROS.find((filtro) => filtro.valor === 'meses-6')?.rotulo).toBe('+ de 6 meses')
  })
})

describe('catálogo vazio', () => {
  it('explica o vazio de cada filtro', () => {
    expect(textoDoVazio('todas', '')).toBe('Nenhuma Música no catálogo ainda.')
    expect(textoDoVazio('nova', '')).toBe('Nenhuma Música Nova: todas já foram tocadas ou vieram da playlist.')
    expect(textoDoVazio('legado', '')).toBe('Nenhuma Música de Legado: todas já foram tocadas no app.')
    expect(textoDoVazio('meses-6', '')).toBe('Nenhuma Música parada há mais de 6 meses.')
  })

  it('com busca, o vazio fala da busca', () => {
    expect(textoDoVazio('todas', 'coracao')).toBe('Nenhuma Música com esse texto.')
    expect(textoDoVazio('legado', 'coracao')).toBe('Nenhuma Música com esse texto.')
  })
})
