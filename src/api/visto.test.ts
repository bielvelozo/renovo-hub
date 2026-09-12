import { describe, expect, it } from 'vitest'
import { horaVista } from './visto'

const AGORA = new Date('2026-09-13T20:40:00Z')

describe('horaVista', () => {
  it('fica vazio quando a resposta é recente', () => {
    expect(horaVista('Sun, 13 Sep 2026 20:39:30 GMT', AGORA)).toBeNull()
    expect(horaVista('Sun, 13 Sep 2026 20:41:00 GMT', AGORA)).toBeNull()
  })

  it('mostra a hora de Brasília quando a resposta veio do cache', () => {
    expect(horaVista('Sun, 13 Sep 2026 20:38:59 GMT', AGORA)).toBe('17:38')
    expect(horaVista('Sun, 13 Sep 2026 12:05:00 GMT', AGORA)).toBe('09:05')
  })

  it('ignora cabeçalho ausente ou inválido', () => {
    expect(horaVista(null, AGORA)).toBeNull()
    expect(horaVista('ontem', AGORA)).toBeNull()
  })
})
