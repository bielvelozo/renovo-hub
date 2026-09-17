import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { ItemApresentado, MusicaNaLista, MusicaResumida } from '../api/tipos'
import { LinhaDeMusica, LinhaDoItem } from './LinhaDeMusica'

const HOJE = '2026-09-13'

const SEM_MEMORIA = { recente: false, ultimaExecucao: null, planejadaEm: [] }

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
  aba: 'redescobrir',
  secao: 'nunca',
  recente: false,
  planejadaEm: [],
  vezesTocada: 0,
  vezesEm6Meses: 0,
  temLetra: false,
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

  it('só mostra o selo de tempo quando o dado existe, e diz «nunca tocada no app» quando é nulo', () => {
    montar(
      <>
        <LinhaDeMusica musica={resumida} modo="leitura" hoje={HOJE} />
        <LinhaDeMusica musica={{ ...naLista, ultimaExecucao: null }} modo="leitura" hoje={HOJE} />
      </>,
    )

    expect(screen.queryByText(/há |nunca/)).not.toBeNull()
    expect(screen.getAllByText('nunca tocada no app').length).toBe(1)
    expect(screen.queryByText(/há \d/)).toBeNull()
  })

  it('com tempo à direita, o tempo sai grande na coluna da direita e o selo pequeno some', () => {
    montar(
      <>
        <LinhaDeMusica musica={naLista} modo="escolha" tempo="direita" hoje={HOJE} />
        <LinhaDeMusica musica={{ ...naLista, id: 'outra', ultimaExecucao: null }} modo="navegacao" tempo="direita" hoje={HOJE} />
        <LinhaDeMusica
          musica={{ ...naLista, id: 'velha', ultimaExecucao: { ...naLista.ultimaExecucao!, data: '2025-07-01' } }}
          modo="leitura"
          tempo="direita"
          hoje={HOJE}
        />
      </>,
    )

    expect(screen.getByText('há 4 semanas').tagName).toBe('B')
    expect(screen.getByText('há 4 semanas').closest('button')).not.toBeNull()
    expect(screen.queryByText('nunca tocada no app')).toBeNull()
    expect(screen.getByText('nunca').tagName).toBe('B')
    expect(screen.getByText('no app')).not.toBeNull()
    expect(screen.getByText('há 1 ano e 2 m.').tagName).toBe('B')
  })

  it('avisa em atenção quando é recente e quando já está planejada, no máximo duas Escalas', () => {
    montar(
      <LinhaDeMusica
        musica={{
          ...naLista,
          recente: true,
          ultimaExecucao: { ...naLista.ultimaExecucao!, data: '2026-09-01', ministradoPorNome: 'Isa' },
          planejadaEm: [
            { escalaId: 'e1', data: '2026-09-20', titulo: 'Culto', ministros: ['Marcos'] },
            { escalaId: 'e2', data: '2026-09-27', titulo: 'Culto', ministros: [] },
            { escalaId: 'e3', data: '2026-10-04', titulo: 'Culto', ministros: [] },
          ],
        }}
        modo="leitura"
        tempo="direita"
        hoje={HOJE}
      />,
    )

    expect(screen.getByText('há 12 dias · Isa').className).toBe('selo atencao')
    expect(screen.getByText('há 12 dias').parentElement?.className).toBe('tempo atencao')
    expect(screen.getByText('no Repertório de dom, 20 de set · Marcos').className).toBe('selo atencao')
    expect(screen.getByText('no Repertório de dom, 27 de set')).not.toBeNull()
    expect(screen.queryByText(/4 de out/)).toBeNull()
    expect(screen.getByText('+1').className).toBe('selo atencao')
  })

  it('mostra trecho, letra e observação', () => {
    montar(
      <LinhaDeMusica
        musica={resumida}
        modo="leitura"
        trecho={{ inicio: '1:05', fim: '3:40' }}
        observacao="Entrar direto"
        letraEm="/escalas/e0913/itens/i1/letra"
      />,
    )

    expect(screen.getByText('trecho 1:05–3:40').className).toBe('selo trecho')
    expect(screen.getByText('letra').className).toBe('selo neutro')
    expect(screen.getByText('letra').getAttribute('href')).toBe('/escalas/e0913/itens/i1/letra')
    expect(screen.getByText('Entrar direto').className).toBe('observacao')
  })

  it('não põe o selo da letra dentro do botão do modo escolha', () => {
    montar(<LinhaDeMusica musica={resumida} modo="escolha" letraEm="/escalas/e0913/itens/i1/letra" />)

    expect(screen.queryByText('letra')).toBeNull()
  })

  it('Medley em leitura lista os Trechos com minutagem e Tom', () => {
    const item: ItemApresentado = {
      id: 'i1',
      tipo: 'medley',
      observacao: '',
      ministradoPor: null,
      ministradoPorNome: null,
      atualizadoEm: null,
      descricao: '',
      memoria: null,
      trechos: [
        {
          musicaId: 'a',
          tom: 'G',
          inicio: '0:00',
          fim: '1:00',
          musica: { ...resumida, id: 'a', titulo: 'Primeira' },
          link: 'https://youtu.be/a',
          memoria: SEM_MEMORIA,
        },
        {
          musicaId: 'b',
          tom: 'Em',
          inicio: '1:00',
          fim: '2:00',
          musica: { ...resumida, id: 'b', titulo: 'Segunda' },
          link: 'https://youtu.be/b?t=60',
          memoria: SEM_MEMORIA,
        },
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
