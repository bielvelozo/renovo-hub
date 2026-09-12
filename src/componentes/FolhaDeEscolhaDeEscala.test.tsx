import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { EscalaResumida } from '../api/tipos'
import { ListaDeEscalas } from './FolhaDeEscolhaDeEscala'

const escala = (id: string, extra: Partial<EscalaResumida> = {}): EscalaResumida => ({
  id,
  data: '2026-09-20',
  horario: '18:00',
  rotulo: 'Culto da noite',
  santaCeia: false,
  cancelada: false,
  estado: 'agendada',
  titulo: 'dom, 20 de set',
  ministros: ['Marcos'],
  membros: [],
  quantidadeNaEquipe: 4,
  quantidadeDeItens: 6,
  ...extra,
})

describe('ListaDeEscalas', () => {
  it('desabilita a Escala onde a música já está, com «já está aqui», e chama aoEscolher nas outras', () => {
    const aoEscolher = vi.fn()
    const escalas = [escala('e1'), escala('e2', { data: '2026-09-27', quantidadeDeItens: 3 })]

    render(<ListaDeEscalas escalas={escalas} jaEsta={['e1']} aoEscolher={aoEscolher} />)

    const botoes = screen.getAllByRole('button')
    expect(botoes).toHaveLength(2)

    expect((botoes[0] as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText('já está aqui')).not.toBeNull()
    expect(screen.getByText('3 músicas')).not.toBeNull()

    fireEvent.click(botoes[1])
    expect(aoEscolher).toHaveBeenCalledWith('e2')

    fireEvent.click(botoes[0])
    expect(aoEscolher).toHaveBeenCalledTimes(1)
  })

  it('ignora Escalas não agendadas e mostra vazio quando não sobra nenhuma', () => {
    render(<ListaDeEscalas escalas={[escala('e1', { estado: 'realizada' })]} jaEsta={[]} aoEscolher={vi.fn()} />)

    expect(screen.getByText('Nenhuma escala agendada.')).not.toBeNull()
  })
})
