import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link } from 'react-router'
import { api, enviarArquivo } from '../api/cliente'
import type { PerfilApresentado } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { usarBusca } from '../api/usarBusca'
import { Cabecalho } from '../casca/Cabecalho'
import { Icone } from '../casca/Icone'
import { usarAviso } from '../componentes/Avisos'
import { Botao } from '../componentes/Botao'
import { Cartao } from '../componentes/Cartao'
import { Esqueleto } from '../componentes/Esqueleto'
import { Folha } from '../componentes/Folha'
import { NotificacoesCompactas } from '../componentes/NotificacoesCompactas'
import { Rosto } from '../componentes/Rosto'
import { Segmento } from '../componentes/Segmento'
import { Selo } from '../componentes/Selo'
import { VistoEm } from '../componentes/VistoEm'
import { hojeEmBrasilia } from '../dominio'
import {
  rotuloDeEscalasEmAno,
  rotuloDeServidos,
  textoDaProximaEscala,
  textoDaUltimaEscala,
  textoDeServidos,
} from '../perfil/perfil'
import { reduzirFoto } from '../perfil/reduzirFoto'
import { usarEu, usarTrocaDoEu } from '../sessao/sessao'
import { usarTema } from '../tema/ProvedorDeTema'
import type { Preferencia } from '../tema/tema'
import { PREFERENCIAS, rotuloDaPreferencia } from '../tema/tema'

const TEXTO_DO_TEMA: Record<Preferencia, string> = {
  automatico: 'Tema do sistema',
  claro: 'Tema claro',
  escuro: 'Tema escuro',
}

export function Perfil() {
  const eu = usarEu()
  const { preferencia, definir } = usarTema()
  const busca = usarBusca<PerfilApresentado>(`/api/perfil/${eu.id}`)
  const acao = usarAcao()
  const avisar = usarAviso()
  const [saindo, confirmarSaida] = useState(false)
  const ano = hojeEmBrasilia().slice(0, 4)

  const sair = () => {
    acao.executar(async () => {
      await api('/api/sair', { metodo: 'POST' })
      window.location.assign('/esqueci')
    })
  }

  const perfil = busca.dados

  return (
    <section className="pagina">
      <Cabecalho raiz titulo={eu.nome} semTitulo />
      <VistoEm hora={busca.vistoEm} />

      <div className="cabecalho-do-perfil">
        <FotoDoPerfil />
        <div className="cresce">
          <h1 className="titulo-de-tela display">{eu.nome}</h1>
          <div className="selos">
            {perfil?.membro.funcoes.map((funcao) => (
              <Selo key={funcao.id}>{funcao.nome}</Selo>
            ))}
            {eu.ministro && <Selo variante="acento">Ministro</Selo>}
            {eu.admin && <Selo variante="acento">Admin</Selo>}
          </div>
        </div>
      </div>

      {busca.erro && <p className="aviso">{busca.erro}</p>}
      {busca.carregando && <Esqueleto forma="cartao" />}

      {perfil && (
        <>
          <Cartao className="escalas-do-perfil">
            <LinhaDeEscala
              rotulo="Sua próxima escala"
              texto={textoDaProximaEscala(perfil.proximaEscala)}
              para={perfil.proximaEscala ? `/escalas/${perfil.proximaEscala.id}` : null}
            />
            <LinhaDeEscala
              rotulo="Última"
              texto={textoDaUltimaEscala(perfil.ultimaEscala)}
              para={perfil.ultimaEscala ? `/escalas/${perfil.ultimaEscala.id}` : null}
            />
          </Cartao>

          <div className="numeros numeros-do-perfil">
            <div className="numero">
              <b>{textoDeServidos(perfil.finsDeSemanaServidos.servidos, perfil.finsDeSemanaServidos.de)}</b>
              <span className="dica">{rotuloDeServidos(perfil.finsDeSemanaServidos.de)}</span>
            </div>
            <div className="numero">
              <b>{perfil.escalasNoAno}</b>
              <span className="dica">{rotuloDeEscalasEmAno(perfil.escalasNoAno, ano)}</span>
            </div>
          </div>
        </>
      )}

      <Cartao className="pagina">
        <h2>Tema</h2>
        <Segmento
          rotulo="Tema"
          opcoes={PREFERENCIAS.map((opcao) => ({ valor: opcao, rotulo: rotuloDaPreferencia(opcao) }))}
          valor={preferencia}
          aoMudar={(opcao) => {
            definir(opcao)
            avisar(TEXTO_DO_TEMA[opcao])
          }}
        />
      </Cartao>

      <ul className="lista cartao">
        <NotificacoesCompactas silenciado={eu.silenciado} />
        <li>
          <Link to="/instalar" className="toque">
            <span className="cresce">
              <span className="titulo">Instalar na tela inicial</span>
            </span>
            <Icone nome="seta" />
          </Link>
        </li>
        {eu.admin && (
          <li>
            <Link to="/admin" className="toque">
              <span className="cresce">
                <span className="titulo">Administração</span>
              </span>
              <Icone nome="seta" />
            </Link>
          </li>
        )}
      </ul>

      <Botao variante="terciario" className="perigo" largo onClick={() => confirmarSaida(true)}>
        Sair deste aparelho
      </Botao>

      {saindo && (
        <Folha titulo="Sair deste aparelho?" fechar={() => confirmarSaida(false)}>
          <p className="dica">Pra voltar, use o link de convite ou a lista do «esqueci».</p>
          {acao.erro && <p className="aviso">{acao.erro}</p>}
          <Botao largo variante="perigo" disabled={acao.ocupado} onClick={sair}>
            Sair
          </Botao>
        </Folha>
      )}
    </section>
  )
}

function LinhaDeEscala({ rotulo, texto, para }: { rotulo: string; texto: string; para: string | null }) {
  const miolo = (
    <>
      <span className="cresce">
        <span className="rotulo">{rotulo}</span>
        <span className="titulo">{texto}</span>
      </span>
      {para && <Icone nome="seta" />}
    </>
  )

  if (para) {
    return (
      <Link to={para} className="toque">
        {miolo}
      </Link>
    )
  }

  return <div className="toque sem-acao">{miolo}</div>
}

const FOTO_ILEGIVEL = 'Não consegui abrir essa imagem. Tente outra foto.'

function FotoDoPerfil() {
  const eu = usarEu()
  const trocarEu = usarTrocaDoEu()
  const acao = usarAcao()
  const avisar = usarAviso()
  const seletor = useRef<HTMLInputElement>(null)
  const [opcoesAbertas, abrirOpcoes] = useState(false)
  const [ilegivel, marcarIlegivel] = useState(false)

  const escolher = () => seletor.current?.click()

  const enviar = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return

    abrirOpcoes(false)
    acao.limpar()
    marcarIlegivel(false)
    acao.executar(async () => {
      const reduzida = await reduzirFoto(arquivo).catch(() => null)
      if (!reduzida) return marcarIlegivel(true)

      const { foto } = await enviarArquivo<{ foto: string }>(`/api/membros/${eu.id}/foto`, reduzida)
      trocarEu({ ...eu, foto })
      avisar('Foto atualizada')
    })
  }

  const remover = () => {
    acao.limpar()
    acao.executar(async () => {
      await api(`/api/membros/${eu.id}/foto`, { metodo: 'DELETE' })
      trocarEu({ ...eu, foto: null })
      abrirOpcoes(false)
      avisar('Foto removida')
    })
  }

  const erro = ilegivel ? FOTO_ILEGIVEL : acao.erro

  return (
    <>
      <button
        type="button"
        className={acao.ocupado ? 'toque-da-foto carregando' : 'toque-da-foto'}
        aria-label={eu.foto ? 'Trocar ou remover sua foto' : 'Pôr uma foto sua'}
        disabled={acao.ocupado}
        onClick={eu.foto ? () => abrirOpcoes(true) : escolher}
      >
        <Rosto membroId={eu.id} nome={eu.nome} foto={eu.foto} />
        <span className="selo-da-camera" aria-hidden="true">
          <Icone nome="camera" />
        </span>
      </button>
      <input ref={seletor} type="file" accept="image/*" hidden onChange={enviar} />
      {erro && !opcoesAbertas && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}

      {opcoesAbertas && (
        <Folha titulo="Sua foto" fechar={() => abrirOpcoes(false)}>
          {erro && <p className="aviso">{erro}</p>}
          <Botao largo disabled={acao.ocupado} onClick={escolher}>
            Escolher outra foto
          </Botao>
          <Botao largo variante="terciario" className="perigo" disabled={acao.ocupado} onClick={remover}>
            Remover foto
          </Botao>
        </Folha>
      )}
    </>
  )
}
