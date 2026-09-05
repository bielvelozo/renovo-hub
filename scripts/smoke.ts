import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fluxosDoAdmin } from './fumaca/administracao'
import {
  derrubarServidor,
  exigirBuild,
  limparAmbiente,
  migrarESemear,
  sessaoPorConvite,
  sessaoPorEsqueci,
  subirServidor,
} from './fumaca/ambiente'
import type { Servidor } from './fumaca/ambiente'
import { hojeDoAmbiente, mesSeguinte, musicasPorVideo } from './fumaca/cenario'
import type { Cenario } from './fumaca/cenario'
import { fluxosDoMembro } from './fumaca/membro'
import { fluxosDeNotificacao } from './fumaca/notificacoes'
import { buscar, criarProva } from './fumaca/prova'
import type { Prova } from './fumaca/prova'
import {
  roteiroDaAvulsa,
  roteiroDaSugestao,
  roteiroDeCancelar,
  roteiroDeCorrigir,
  roteiroDoLink,
  roteiroDoMedley,
  roteiroDoMes,
  roteiroDoTrecho,
  roteiroDoWhatsapp,
} from './fumaca/roteiros'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prova = criarProva()

let servidor: Servidor | null = null

try {
  const cenario = await preparar(prova)

  await roteiroDoMes(prova, cenario)
  await roteiroDoLink(prova, cenario)
  await roteiroDoTrecho(prova, cenario)
  await roteiroDoMedley(prova, cenario)
  await roteiroDaSugestao(prova, cenario)
  await roteiroDoWhatsapp(prova, cenario)
  await roteiroDeCorrigir(prova, cenario)
  await roteiroDeCancelar(prova, cenario)
  await roteiroDaAvulsa(prova, cenario)

  await fluxosDoMembro(prova, cenario)
  await fluxosDoAdmin(prova, cenario)
  await fluxosDeNotificacao(prova, cenario)

  encerrar(prova.encerrar())
} catch (erro) {
  console.error(`\nO smoke parou: ${erro instanceof Error ? erro.message : String(erro)}`)
  prova.encerrar()
  encerrar(1)
}

async function preparar(prova: Prova): Promise<Cenario> {
  prova.grupo('Preparo')

  exigirBuild(raiz)
  console.log('  O smoke apaga o D1 local e semeia de novo, pra sempre partir do mesmo estado.')

  limparAmbiente(raiz)
  migrarESemear(raiz)

  servidor = await subirServidor(raiz)
  prova.conferir('o Worker sobe e responde em /api/saude', true, 'http://127.0.0.1:8787')

  const gabriel = await sessaoPorConvite(raiz, 'Gabriel')
  prova.conferir('o convite do primeiro Admin abre sessão', gabriel.startsWith('sessao='))

  const invalido = await buscar('http://127.0.0.1:8787/entrar/nao-existe', { redirect: 'manual' })
  prova.conferir('convite inválido devolve 404 em PT-BR', invalido.status === 404, String(invalido.status))

  const isa = await sessaoPorEsqueci('isa')
  const julia = await sessaoPorEsqueci('julia')
  prova.conferir('a lista do "esqueci" abre sessão pra quem trocou de celular', !!isa && !!julia)

  const hoje = hojeDoAmbiente()
  const musicas = await musicasPorVideo(prova, gabriel)

  prova.conferir('o seed carrega o catálogo da playlist', musicas.size >= 101, `${musicas.size} Músicas`)

  return {
    raiz,
    gabriel,
    isa,
    julia,
    hoje,
    mesDeTrabalho: mesSeguinte(hoje),
    escalaDoMes: '',
    escalaSobrando: '',
    musicas,
  }
}

function encerrar(codigo: number): never {
  if (servidor) derrubarServidor(servidor)

  process.exit(codigo)
}
