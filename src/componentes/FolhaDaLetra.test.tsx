import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Anexo } from '../api/tipos'
import type { Letra } from '../dominio'
import { FolhaDaLetra } from './FolhaDaLetra'

const LETRA: Letra = {
  cabecalho: ['Rio – Renovo'],
  blocos: [
    { tipo: 'marcador', texto: '*Verso*' },
    {
      tipo: 'estrofe',
      linhas: [
        { texto: 'E me mostrou um rio', forte: false },
        { texto: 'Um rio de águas vivas', forte: false },
      ],
    },
  ],
}

const anexo = (extra: Partial<Anexo> = {}): Anexo => ({
  id: 'a1',
  musicaId: 'rio',
  itemId: null,
  nome: 'Rio.docx',
  mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  tamanho: 2048,
  temLetra: true,
  versao: 1,
  criadoEm: '2026-09-12T12:00:00.000Z',
  url: '/api/anexos/a1',
  ...extra,
})

function responder(status: number, corpo: unknown) {
  const caminhos: string[] = []
  const chamada = vi.fn(async (caminho: string) => {
    caminhos.push(caminho)
    return { ok: status < 400, status, headers: new Headers(), json: async () => corpo }
  })
  vi.stubGlobal('fetch', chamada)
  return { chamada, caminhos }
}

function escolher(nome = 'Rio.docx') {
  const campo = document.querySelector('input[type=file]') as HTMLInputElement
  const arquivo = new File([new Uint8Array([1, 2, 3])], nome, { type: '' })
  fireEvent.change(campo, { target: { files: [arquivo] } })
  return campo
}

afterEach(() => vi.unstubAllGlobals())

describe('FolhaDaLetra', () => {
  it('mostra a prévia da letra depois do envio', async () => {
    const enviado = anexo({ id: 'a2', versao: 2 })
    const { caminhos } = responder(201, { ...enviado, letra: LETRA })
    const aoEnviar = vi.fn()

    render(
      <FolhaDaLetra titulo="Rio" dono={{ musicaId: 'rio' }} anexos={[]} fechar={vi.fn()} aoEnviar={aoEnviar} />,
    )

    escolher()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar letra' }))

    await waitFor(() => expect(screen.getByText('Verso')).not.toBeNull())

    expect(caminhos[0]).toBe('/api/musicas/rio/anexos')
    expect(aoEnviar).toHaveBeenCalledWith(enviado, LETRA)
    expect(screen.getByText(/E me mostrou um rio/)).not.toBeNull()
    expect(screen.getByText('Não ficou certo? Ajuste o Word e envie de novo.')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Pronto' })).not.toBeNull()
  })

  it('manda pro Item quando o dono é o Medley e avisa na folha quando o Word é ilegível', async () => {
    const recado = 'Não foi possível ler a letra desse Word. Salve como .docx e tente de novo.'
    const { caminhos } = responder(422, { erro: recado })
    const aoEnviar = vi.fn()

    render(
      <FolhaDaLetra
        titulo="Medley"
        dono={{ itemId: 'i1' }}
        anexos={[anexo({ itemId: 'i1', musicaId: null })]}
        fechar={vi.fn()}
        aoEnviar={aoEnviar}
      />,
    )

    const campo = escolher()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar nova versão' }))

    await waitFor(() => expect(screen.getByText(recado)).not.toBeNull())

    expect(caminhos[0]).toBe('/api/itens/i1/anexos')
    expect(aoEnviar).not.toHaveBeenCalled()
    expect(campo.files?.[0]?.name).toBe('Rio.docx')
    expect(screen.getByRole('button', { name: 'Enviar nova versão' })).not.toBeNull()
  })

  it('lista as versões dizendo quais têm letra', () => {
    render(
      <FolhaDaLetra
        titulo="Rio"
        dono={{ musicaId: 'rio' }}
        anexos={[anexo({ id: 'a2', versao: 2 }), anexo({ temLetra: false })]}
        fechar={vi.fn()}
        aoEnviar={vi.fn()}
      />,
    )

    expect(screen.getByText(/versão 2 · .*com letra/)).not.toBeNull()
    expect(screen.getByText(/versão 1 · .*sem letra$/)).not.toBeNull()
  })

  it('recusa arquivo que não é Word antes de mandar', () => {
    const { chamada } = responder(201, {})

    render(<FolhaDaLetra titulo="Rio" dono={{ musicaId: 'rio' }} anexos={[]} fechar={vi.fn()} aoEnviar={vi.fn()} />)

    escolher('letra.pdf')

    expect(screen.getByText('A sequência é um arquivo Word (.docx).')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar letra' }))
    expect(chamada).not.toHaveBeenCalled()
  })
})
