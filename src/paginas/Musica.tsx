import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api } from '../api/cliente'
import type { Anexo, ExecucaoApresentada, MusicaDetalhada } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { BuscaNoCifraClub } from '../componentes/BlocoDeTom'
import { Botao, BotaoLink, classesDoBotao } from '../componentes/Botao'
import { Campo } from '../componentes/Campo'
import { Capa } from '../componentes/Capa'
import { Esqueleto } from '../componentes/Esqueleto'
import { FaixaDeAlerta, frasesDeAlerta } from '../componentes/FaixaDeAlerta'
import { Folha } from '../componentes/Folha'
import { FolhaDaLetra } from '../componentes/FolhaDaLetra'
import { FolhaDeEscolhaDeEscala } from '../componentes/FolhaDeEscolhaDeEscala'
import { Menu } from '../componentes/Menu'
import type { ItemDoMenu } from '../componentes/Menu'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { SeletorDeTom } from '../componentes/SeletorDeTom'
import { Selo } from '../componentes/Selo'
import { Vazio } from '../componentes/Vazio'
import { formatarDia, hojeEmBrasilia, limparTitulo, tempoRelativo } from '../dominio'
import type { TituloLimpo } from '../dominio'
import { usarEu } from '../sessao/sessao'

type FolhaAberta = 'editar' | 'tom' | 'letra' | 'arquivar' | 'apagar' | 'versoes' | 'historico' | 'escala' | null

export function Musica() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const eu = usarEu()
  const busca = usarBusca<MusicaDetalhada>(`/api/musicas/${id}`)
  const musica = busca.dados
  const dirige = eu.ministro || eu.admin
  const nome = musica ? nomeExibido(musica) : null
  const hoje = hojeEmBrasilia()
  const [folha, abrirFolha] = useState<FolhaAberta>(null)
  const fecharFolha = () => abrirFolha(null)

  const itensDoMenu: ItemDoMenu[] = musica
    ? [
        ...(dirige
          ? [
              { rotulo: 'Editar título e artista', aoEscolher: () => abrirFolha('editar') },
              { rotulo: 'Tom original', aoEscolher: () => abrirFolha('tom') },
              {
                rotulo: musica.anexos.length ? 'Trocar letra' : 'Enviar letra (Word)',
                icone: 'documento' as const,
                aoEscolher: () => abrirFolha('letra'),
              },
            ]
          : []),
        ...(musica.anexos.length > 1
          ? [{ rotulo: 'Versões da letra', icone: 'documento' as const, aoEscolher: () => abrirFolha('versoes') }]
          : []),
        ...(eu.admin
          ? musica.vezesTocada > 0
            ? [{ rotulo: 'Arquivar', aoEscolher: () => abrirFolha('arquivar') }]
            : [{ rotulo: 'Apagar', icone: 'remover' as const, perigo: true, aoEscolher: () => abrirFolha('apagar') }]
          : []),
      ]
    : []

  const cabecalho = (
    <Cabecalho
      titulo={nome?.titulo ?? 'Música'}
      sub={nome?.artista}
      voltarPara="/musicas"
      acao={itensDoMenu.length > 0 && <Menu itens={itensDoMenu} guia="mais-da-musica" />}
    />
  )

  if (busca.erro) {
    return (
      <section className="pagina">
        {cabecalho}
        <p className="aviso">{busca.erro}</p>
      </section>
    )
  }

  if (!musica || !nome) {
    return (
      <section className="pagina">
        {cabecalho}
        <Esqueleto forma="paragrafo" />
      </section>
    )
  }

  const atualizar = (nova: MusicaDetalhada) => {
    busca.definir(nova)
    fecharFolha()
  }

  const ultimoAnexo = musica.anexos[0]

  return (
    <section className="pagina">
      {cabecalho}

      <div className="cabecalho-da-musica">
        <Capa musicas={[musica]} tamanho="grande" tocavel={musica.link} transicao={`capa-${musica.id}`} />
        <div>
          <p className="titulo-da-musica">{nome.titulo}</p>
          {nome.artista && <p className="dica">{nome.artista}</p>}
        </div>
      </div>

      <div className="selos">
        {musica.tomSugerido && (
          <Selo variante="tom">
            Tom {musica.tomSugerido.tom}
            {musica.tomSugerido.origem === 'original' ? ' · original' : ''}
          </Selo>
        )}
        <Selo>{textoDeVezes(musica)}</Selo>
        {musica.ultimaExecucao?.parcial && <Selo variante="trecho">trecho</Selo>}
      </div>

      <FaixaDeAlerta frases={frasesDeAlerta(musica, hoje)} />

      <div className="acoes-da-musica">
        <a className={classesDoBotao({ variante: 'secundario' })} href={musica.link} target="_blank" rel="noopener">
          Ouvir
        </a>
        <a className={classesDoBotao({ variante: 'secundario' })} href={musica.cifraClub} target="_blank" rel="noopener">
          Cifra Club
        </a>
        {musica.letra ? (
          <BotaoLink para={`/musicas/${musica.id}/letra`} variante="secundario" data-guia="letra">
            Letra
          </BotaoLink>
        ) : (
          ultimoAnexo && (
            <a className={classesDoBotao({ variante: 'secundario' })} href={ultimoAnexo.url}>
              Letra (Word)
            </a>
          )
        )}
      </div>

      <div className="secao">
        <div className="secao-topo">
          <h2>Histórico</h2>
          {musica.historico.length > 5 && (
            <button type="button" className="link-de-secao" onClick={() => abrirFolha('historico')}>
              Ver todas as {musica.historico.length}
            </button>
          )}
        </div>

        {musica.historico.length ? (
          <div className="cartao">
            {musica.historico.slice(0, 5).map((execucao, indice) => (
              <LinhaDeExecucao key={`${execucao.escalaId}-${indice}`} execucao={execucao} hoje={hoje} />
            ))}
          </div>
        ) : (
          <Vazio icone="musica">Ainda não tocada no app.</Vazio>
        )}
      </div>

      {musica.vezesTocada > 0 && (
        <div className="secao">
          <h2>Quem já tocou</h2>
          <div className="selos">
            {musica.coberturaDoMinisterio.ja.map((pessoa) => (
              <Selo key={pessoa}>{pessoa}</Selo>
            ))}
            {musica.coberturaDoMinisterio.nunca.map((pessoa) => (
              <Selo key={pessoa} variante="atencao">
                {pessoa} nunca
              </Selo>
            ))}
          </div>
        </div>
      )}

      {folha === 'editar' && <FolhaDeEdicao musica={musica} fechar={fecharFolha} aoSalvar={atualizar} />}
      {folha === 'tom' && <FolhaDeTom musica={musica} fechar={fecharFolha} aoSalvar={atualizar} />}
      {folha === 'arquivar' && (
        <FolhaDeArquivar musica={musica} fechar={fecharFolha} aoConcluir={() => navegar('/musicas')} />
      )}
      {folha === 'apagar' && (
        <FolhaDeApagar musica={musica} fechar={fecharFolha} aoConcluir={() => navegar('/musicas')} />
      )}
      {folha === 'letra' && (
        <FolhaDaLetra
          titulo={nome.titulo}
          dono={{ musicaId: musica.id }}
          anexos={musica.anexos}
          fechar={fecharFolha}
          aoEnviar={() => busca.recarregar()}
        />
      )}
      {folha === 'versoes' && <FolhaDeVersoes anexos={musica.anexos} fechar={fecharFolha} />}
      {folha === 'historico' && (
        <Folha titulo="Histórico" fechar={fecharFolha}>
          <div className="cartao">
            {musica.historico.map((execucao, indice) => (
              <LinhaDeExecucao key={`${execucao.escalaId}-${indice}`} execucao={execucao} hoje={hoje} />
            ))}
          </div>
        </Folha>
      )}

      <FolhaDeEscolhaDeEscala
        aberta={folha === 'escala'}
        fechar={fecharFolha}
        jaEsta={musica.planejadaEm.map((planejada) => planejada.escalaId)}
        aoEscolher={(escalaId) => navegar(`/escalas/${escalaId}/adicionar?musica=${musica.id}`)}
      />

      {dirige && (
        <RodapeDeAcao
          primario={
            <Botao largo onClick={() => abrirFolha('escala')}>
              Adicionar a uma escala
            </Botao>
          }
        />
      )}
    </section>
  )
}

function LinhaDeExecucao({ execucao, hoje }: { execucao: ExecucaoApresentada; hoje: string }) {
  return (
    <div className="linha-de-execucao">
      <span className="dica">{tempoRelativo(execucao.data, hoje)}</span>
      <Selo variante="tom">Tom {execucao.tom}</Selo>
      <span className="cresce dica">
        {execucao.ministradoPorNome ?? 'sem ministro'}
        {execucao.parcial ? ' · trecho' : ''}
      </span>
      <span className="dica">{formatarDia(execucao.data, hoje)}</span>
    </div>
  )
}

function FolhaDeEdicao({
  musica,
  fechar,
  aoSalvar,
}: {
  musica: MusicaDetalhada
  fechar: () => void
  aoSalvar: (nova: MusicaDetalhada) => void
}) {
  const acao = usarAcao()
  const nome = nomeExibido(musica)
  const [titulo, escreverTitulo] = useState(nome.titulo)
  const [artista, escreverArtista] = useState(nome.artista)

  const salvar = () =>
    acao.executar(async () => {
      aoSalvar(
        await api<MusicaDetalhada>(`/api/musicas/${musica.id}`, {
          metodo: 'PATCH',
          corpo: { titulo, artista, revisar: false },
        }),
      )
    })

  return (
    <Folha titulo="Editar título e artista" fechar={fechar}>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <Campo rotulo="Título">
        <input value={titulo} onChange={(evento) => escreverTitulo(evento.target.value)} />
      </Campo>
      <Campo rotulo="Artista">
        <input value={artista} onChange={(evento) => escreverArtista(evento.target.value)} />
      </Campo>

      <Botao largo disabled={acao.ocupado || !titulo.trim()} onClick={salvar}>
        Salvar
      </Botao>
    </Folha>
  )
}

function FolhaDeTom({
  musica,
  fechar,
  aoSalvar,
}: {
  musica: MusicaDetalhada
  fechar: () => void
  aoSalvar: (nova: MusicaDetalhada) => void
}) {
  const acao = usarAcao()

  const definir = (tom: string | null) =>
    acao.executar(async () => {
      aoSalvar(
        await api<MusicaDetalhada>(`/api/musicas/${musica.id}`, { metodo: 'PATCH', corpo: { tomOriginal: tom } }),
      )
    })

  return (
    <Folha titulo="Tom original" fechar={fechar}>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      <SeletorDeTom
        tom={musica.tomOriginal}
        original={musica.tomOriginal}
        desligado={acao.ocupado}
        escolher={(tom) => definir(musica.tomOriginal === tom ? null : tom)}
      />

      <BuscaNoCifraClub musica={musica} aoUsar={definir} />
    </Folha>
  )
}

function FolhaDeArquivar({
  musica,
  fechar,
  aoConcluir,
}: {
  musica: MusicaDetalhada
  fechar: () => void
  aoConcluir: () => void
}) {
  const acao = usarAcao()
  const nome = nomeExibido(musica)

  const confirmar = () =>
    acao.executar(async () => {
      await api(`/api/musicas/${musica.id}/arquivar`, { metodo: 'POST' })
      aoConcluir()
    })

  return (
    <Folha titulo="Arquivar música?" fechar={fechar}>
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      <p className="dica">{nome.titulo} sai do catálogo ativo e fica só no histórico.</p>
      <Botao largo variante="perigo" disabled={acao.ocupado} onClick={confirmar}>
        Arquivar
      </Botao>
    </Folha>
  )
}

function FolhaDeApagar({
  musica,
  fechar,
  aoConcluir,
}: {
  musica: MusicaDetalhada
  fechar: () => void
  aoConcluir: () => void
}) {
  const acao = usarAcao()
  const nome = nomeExibido(musica)

  const confirmar = () =>
    acao.executar(async () => {
      await api(`/api/musicas/${musica.id}`, { metodo: 'DELETE' })
      aoConcluir()
    })

  return (
    <Folha titulo="Apagar música?" fechar={fechar}>
      {acao.erro && <p className="aviso">{acao.erro}</p>}
      <p className="dica">{nome.titulo} some do catálogo. Essa ação não pode ser desfeita.</p>
      <Botao largo variante="perigo" disabled={acao.ocupado} onClick={confirmar}>
        Apagar
      </Botao>
    </Folha>
  )
}

function FolhaDeVersoes({ anexos, fechar }: { anexos: Anexo[]; fechar: () => void }) {
  return (
    <Folha titulo="Versões da letra" fechar={fechar}>
      <ul className="lista">
        {anexos.map((anexo) => (
          <li key={anexo.id}>
            <a className="toque" href={anexo.url}>
              <span className="cresce">
                <span className="titulo">{anexo.nome}</span>
                <span className="dica">
                  versão {anexo.versao} · {formatarDia(anexo.criadoEm.slice(0, 10))} · {formatarTamanho(anexo.tamanho)}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Folha>
  )
}

export function nomeExibido(musica: MusicaDetalhada): TituloLimpo {
  if (musica.revisar) return limparTitulo(musica.titulo, musica.artista)
  return { titulo: musica.titulo, artista: musica.artista }
}

function textoDeVezes(musica: MusicaDetalhada): string {
  if (musica.vezesEm6Meses > 0) return `tocada ${musica.vezesEm6Meses}× em 6 meses`
  if (musica.vezesTocada > 0) return `tocada ${musica.vezesTocada}×`
  return 'nunca tocada no app'
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
