import { achadoCombina, nomeEstaEm, pedacosDoTitulo } from '../../src/dominio'
export type AchadoNoCifraClub = {
  titulo: string
  artista: string
  url: string
}

export async function acharNoCifraClub(titulo: string, artista = ''): Promise<AchadoNoCifraClub | null> {
  const nome = artista.trim()
  const termos = pedacosDoTitulo(titulo).flatMap((pedaco) => (nome ? [`${pedaco} ${nome}`, pedaco] : [pedaco]))

  const combina = (achado: AchadoNoCifraClub) =>
    achadoCombina(achado.titulo, titulo) ||
    (nome !== '' && achadoCombina(achado.titulo, nome) && nomeEstaEm(achado.artista, titulo))

  const doMesmoArtista = (achado: AchadoNoCifraClub) =>
    nome !== '' && (nomeEstaEm(achado.artista, nome) || nomeEstaEm(nome, achado.artista))

  for (const termo of [...new Set(termos)]) {
    const combinam = (await musicasDaBusca(termo)).filter(combina)
    const escolhido = combinam.find(doMesmoArtista) ?? combinam[0]
    if (escolhido) return escolhido
  }

  return null
}

type Doc = { t?: string; m?: string; a?: string; d?: string; u?: string }

async function musicasDaBusca(termo: string): Promise<AchadoNoCifraClub[]> {
  const endereco = 'https://solr.sscdn.co/cc/h2/?q=' + encodeURIComponent(termo) + '&e=1'

  let resposta: Response
  try {
    resposta = await fetch(endereco)
  } catch {
    return []
  }

  if (!resposta.ok) return []

  const bruto = (await resposta.text()).trim().replace(/^\(/, '').replace(/\);?$/, '')

  let dados: { response?: { docs?: Doc[] } }
  try {
    dados = JSON.parse(bruto)
  } catch {
    return []
  }

  return (dados.response?.docs ?? [])
    .filter((doc) => doc.t === '2' && doc.d && doc.u)
    .map((doc) => ({
      titulo: doc.m ?? '',
      artista: doc.a ?? '',
      url: `https://www.cifraclub.com.br/${doc.d}/${doc.u}/`,
    }))
}
