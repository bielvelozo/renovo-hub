import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { ItemApresentado, MusicaNaLista, MusicaResumida } from '../api/tipos'
import { LinhaDeMusica, LinhaDoItem } from './LinhaDeMusica'

const HOJE = '2026-09-13'

const resumida: MusicaResumida = {
  id: 'meia-noite',
  titulo: 'Meia Noite (Ao Vivo) | fhop music',
  artista: 'fhop music',
  videoId: 'hRJUcvsnqKs',
  capa: 'https://img/meia-noite.jpg',
  capaAlternativa: 'https://img/meia-noite-hq.jpg',
}

const naLista: MusicaNaLista = {
  ...resumida,
  legado: false,
  nova: false,
  arquivada: false,
  revisar: true,
  tomConhecido: null,
  tomOriginal: null,
  ultimaExecucao: {
    escalaId: 'e0816',
    data: '2026-08-16',
    tom: 'C',
    parcial: false,
    ministradoPor: null,
    ministradoPorNome: null,
  },
}

function montar(ui: React.ReactNode) {
  return render(
    <MemoryRouter>
      <ul>{ui}</ul>
    </MemoryRouter>,
  )
}

describe('LinhaDeMusica', () => {
  it('em leitura a capa toca e a linha não navega', () => {
    montar(<LinhaDeMusica musica={resumida} modo="leitura" tom="G" link="https://youtu.be/hRJUcvsnqKs" numero={2} />)

    expect(screen.getByRole('link', { name: 'Tocar no YouTube' }).getAttribute('href')).toBe('https://youtu.be/hRJUcvsnqKs')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getAllByRole('link').length).toBe(1)
    expect(screen.getByText('Tom G').className).toBe('selo tom')
    expect(screen.getByText('2. Meia Noite (Ao Vivo) | fhop music')).not.toBeNull()
  })

  it('em navegação a linha abre a Música e a capa toca sem navegar', () => {
    montar(<LinhaDeMusica musica={naLista} modo="navegacao" link="https://youtu.be/hRJUcvsnqKs" hoje={HOJE} />)

    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['https://youtu.be/hRJUcvsnqKs', '/musicas/meia-noite'])
    expect(screen.getByText('há 4 semanas').className).toBe('selo neutro')
  })

  it('em escolha a linha inteira chama aoEscolher', () => {
    const aoEscolher = vi.fn()
    montar(<LinhaDeMusica musica={naLista} modo="escolha" aoEscolher={aoEscolher} hoje={HOJE} />)

    fireEvent.click(screen.getByRole('button'))
    expect(aoEscolher).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('limpa o título e o artista quando a Música está marcada pra revisar', () => {
    montar(<LinhaDeMusica musica={naLista} modo="leitura" hoje={HOJE} />)

    expect(screen.getByText('Meia Noite').className).toBe('titulo')
    expect(screen.getByText('fhop').className).toBe('dica')
  })

  it('só mostra o selo de tempo quando o dado existe, e diz «nunca tocada» quando é nulo', () => {
    montar(
      <>
        <LinhaDeMusica musica={resumida} modo="leitura" hoje={HOJE} />
        <LinhaDeMusica musica={{ ...naLista, ultimaExecucao: null }} modo="leitura" hoje={HOJE} />
      </>,
    )

    expect(screen.queryByText(/há |nunca/)).not.toBeNull()
    expect(screen.getAllByText('nunca tocada').length).toBe(1)
    expect(screen.queryByText(/há \d/)).toBeNull()
  })

  it('mostra trecho, letra e observação', () => {
    montar(
      <LinhaDeMusica
        musica={resumida}
        modo="leitura"
        trecho={{ inicio: '1:05', fim: '3:40' }}
        observacao="Entrar direto"
        anexos={[{ id: 'a1', musicaId: 'meia-noite', nome: 'x.docx', mime: '', tamanho: 1, versao: 1, criadoEm: '', url: '' }]}
      />,
    )

    expect(screen.getByText('trecho 1:05–3:40').className).toBe('selo trecho')
    expect(screen.getByText('letra').className).toBe('selo neutro')
    expect(screen.getByText('Entrar direto').className).toBe('observacao')
  })

  it('Medley em leitura lista os Trechos com minutagem e Tom', () => {
    const item: ItemApresentado = {
      id: 'i1',
      tipo: 'medley',
      observacao: '',
      ministradoPor: null,
      descricao: '',
      trechos: [
        { musicaId: 'a', tom: 'G', inicio: '0:00', fim: '1:00', musica: { ...resumida, id: 'a', titulo: 'Primeira' }, link: 'https://youtu.be/a' },
        { musicaId: 'b', tom: 'Em', inicio: '1:00', fim: '2:00', musica: { ...resumida, id: 'b', titulo: 'Segunda' }, link: 'https://youtu.be/b?t=60' },
      ],
    }
    montar(<LinhaDoItem item={item} modo="leitura" numero={4} />)

    expect(screen.getByText('4. Medley')).not.toBeNull()
    const trechos = screen.getAllByRole('listitem').slice(1)
    expect(trechos.length).toBe(2)
    expect(screen.getByText('Segunda')).not.toBeNull()
    expect(screen.getByText('Tom Em').className).toBe('selo tom')
    expect(screen.getAllByRole('link', { name: 'Tocar no YouTube' }).length).toBe(2)
  })
})
