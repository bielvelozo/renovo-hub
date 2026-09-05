import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErroDaApi, enviarArquivo } from './cliente'

const original = globalThis.fetch

afterEach(() => {
  globalThis.fetch = original
})

function responder(corpo: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(corpo), { status })) as unknown as typeof fetch
}

describe('enviarArquivo', () => {
  it('manda o arquivo como multipart, sem content-type à mão', async () => {
    const espia = responder({ id: 'a1' }, 201)
    globalThis.fetch = espia

    const arquivo = new File(['letra'], 'Sequência.docx')
    const resposta = await enviarArquivo<{ id: string }>('/api/musicas/rio/anexos', arquivo)

    expect(resposta).toEqual({ id: 'a1' })

    const [caminho, opcoes] = (espia as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(caminho).toBe('/api/musicas/rio/anexos')
    expect(opcoes.method).toBe('POST')
    expect(opcoes.credentials).toBe('same-origin')
    expect(opcoes.headers).toBeUndefined()

    const enviado = (opcoes.body as FormData).get('arquivo')
    expect(enviado).toBeInstanceOf(File)
    expect((enviado as File).name).toBe('Sequência.docx')
  })

  it('devolve o texto do Worker quando o arquivo é recusado', async () => {
    globalThis.fetch = responder({ erro: 'O arquivo passa de 1 MB.' }, 413)

    const envio = enviarArquivo('/api/musicas/rio/anexos', new File(['x'], 'x.docx'))

    await expect(envio).rejects.toThrow('O arquivo passa de 1 MB.')
    await expect(envio).rejects.toBeInstanceOf(ErroDaApi)
  })

  it('trata queda de rede como falha de conexão, não como erro do servidor', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError('failed to fetch')
    }) as unknown as typeof fetch

    await expect(enviarArquivo('/api/musicas/rio/anexos', new File(['x'], 'x.docx'))).rejects.toThrow(/Sem conexão/)
  })
})
