export type AchadoNoCifraClub = {
  titulo: string
  artista: string
  tom: string
  url: string
}

export async function acharNoCifraClub(termo: string): Promise<AchadoNoCifraClub | null> {
  const achado = await primeiroDaBusca(termo)
  if (!achado) return null

  const url = `https://www.cifraclub.com.br/${achado.artista}/${achado.musica}/`
  const tom = await tomDaPagina(url)
  if (!tom) return null

  return { titulo: achado.titulo, artista: achado.nomeDoArtista, tom, url }
}

type Doc = { t?: string; m?: string; a?: string; d?: string; u?: string }

async function primeiroDaBusca(termo: string) {
  const endereco = 'https://solr.sscdn.co/cc/h2/?q=' + encodeURIComponent(termo) + '&e=1'

  let resposta: Response
  try {
    resposta = await fetch(endereco)
  } catch {
    return null
  }

  if (!resposta.ok) return null

  // A busca do Cifra Club responde em JSONP: o JSON vem entre parênteses.
  const bruto = (await resposta.text()).trim().replace(/^\(/, '').replace(/\);?$/, '')

  let dados: { response?: { docs?: Doc[] } }
  try {
    dados = JSON.parse(bruto)
  } catch {
    return null
  }

  const musicas = (dados.response?.docs ?? []).filter((doc) => doc.t === '2' && doc.d && doc.u)
  const primeira = musicas[0]
  if (!primeira) return null

  return {
    artista: primeira.d as string,
    musica: primeira.u as string,
    titulo: primeira.m ?? '',
    nomeDoArtista: primeira.a ?? '',
  }
}

async function tomDaPagina(url: string): Promise<string | null> {
  let resposta: Response
  try {
    resposta = await fetch(url)
  } catch {
    return null
  }

  if (!resposta.ok) return null

  const html = await resposta.text()

  // As classes da página são geradas a cada build; o cartão do tom tem id fixo.
  const inicio = html.indexOf('id="key"')
  if (inicio < 0) return null

  const textos = [...html.slice(inicio, inicio + 1400).matchAll(/>([^<>]{1,6})<\/p>/g)].map((achado) => achado[1])

  return textos.find((texto) => /^[A-G][#b]?m?$/.test(texto.trim())) ?? null
}
