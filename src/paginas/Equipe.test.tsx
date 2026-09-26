import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { EscalaApresentada } from '../api/tipos'
import { ProvedorDeAvisos } from '../componentes/Avisos'
import { FUNCOES } from '../dominio'
import type { MembroComPush } from '../escalas/equipe'
import { CorpoDaEquipe } from './Equipe'

const HOJE = '2026-09-13'

const membro = (id: string, nome: string, funcoes: string[], extra: Partial<MembroComPush> = {}): MembroComPush => ({
  id,
  nome,
  funcoes,
  ministro: false,
  admin: false,
  inativo: false,
  push: 1,
  silenciado: false,
  presenca: { ultimaVez: null, seguidos: 0, paradaHaMeses: null },
  ...extra,
})

const MEMBROS = [
  membro('ana', 'Ana', ['vocal']),
  membro('bia', 'Bia', ['vocal'], { push: 0 }),
  membro('isa', 'Isa', ['vocal'], { ministro: true, presenca: { ultimaVez: '2026-08-23', seguidos: 4, paradaHaMeses: 0 } }),
  membro('pedro', 'Pedro', ['baixo']),
]

const escala: EscalaApresentada = {
  id: 'e0913',
  data: HOJE,
  horario: '18:00',
  rotulo: 'Culto de Domingo',
  santaCeia: false,
  cancelada: false,
  equipe: [],
  itens: [],
  estado: 'agendada',
  titulo: 'Culto de Domingo 18h',
  grupos: [],
  pessoas: [],
  resumoDoRepertorio: { recentes: 0, antigas: 0, nuncaTocadas: 0, total: 0 },
  pendencias: [],
  pronta: false,
}

const acao = { ocupado: false, erro: null, executar: vi.fn(), limpar: vi.fn() }

function Tela({ funcaoEmFoco }: { funcaoEmFoco?: string }) {
  const [atual, definir] = useState(escala)

  return (
    <CorpoDaEquipe
      escala={atual}
      definir={definir}
      membros={MEMBROS}
      funcoes={FUNCOES}
      formacoes={[]}
      acao={acao}
      recarregarFormacoes={vi.fn()}
      funcaoEmFoco={funcaoEmFoco}
      hoje={HOJE}
    />
  )
}

function mostrar(funcaoEmFoco?: string) {
  render(
    <MemoryRouter>
      <ProvedorDeAvisos>
        <Tela funcaoEmFoco={funcaoEmFoco} />
      </ProvedorDeAvisos>
    </MemoryRouter>,
  )
}

describe('Função em foco', () => {
  it('leva o foco ao Grupo da Função que a pendência apontou', () => {
    mostrar('baixo')

    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Músicos' }))
  })
})

describe('resumo da Equipe', () => {
  it('recalcula a cada toque', () => {
    mostrar()

    expect(screen.getByText('vocal 0 de 2 · falta vocal')).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button', { name: 'Vocal' })[0])
    expect(screen.getByText('vocal 1 de 2 · falta vocal')).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button', { name: 'Vocal' })[1])
    expect(screen.getByText('vocal 2 de 2')).toBeTruthy()
  })

  it('mostra quem dirige assim que a marca é dada', () => {
    mostrar()

    expect(screen.getByText('sem ministro')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ministro' }))
    expect(screen.getByText('ministro: Isa')).toBeTruthy()
  })
})

describe('lembrete de notificação', () => {
  it('só aparece quando alguém escalado não vai receber', () => {
    mostrar()

    expect(screen.queryByText(/sem notificação/)).toBeNull()

    fireEvent.click(screen.getAllByRole('button', { name: 'Vocal' })[1])

    expect(screen.getByText('1 pessoa sem notificação: Bia')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Copiar nomes' })).toBeTruthy()
  })
})

describe('memória de cada pessoa', () => {
  it('mostra a última vez e alerta quem está há quatro seguidos', () => {
    mostrar()

    expect(screen.getAllByText('nenhuma escala ainda').length).toBeGreaterThan(0)
    expect(screen.getByText('4 seguidos')).toBeTruthy()
  })
})
