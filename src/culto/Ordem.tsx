import { Link } from 'react-router'
import type { ItemDoCulto } from '../api/tipos'
import { Icone } from '../casca/Icone'
import { Botao, BotaoLink } from '../componentes/Botao'
import { Cartao } from '../componentes/Cartao'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Vazio } from '../componentes/Vazio'
import { hojeEmBrasilia } from '../dominio'
import { dicaDoItem, estadoDoPacote, tituloDaOrdem, tituloDoCulto, tituloDoItem, tonsDoMedley } from './culto'
import { usarCulto } from './ModoCulto'
import { TopoDoCulto } from './ModoCulto'
import { NotaDoTom } from './NotaDoTom'

export function Ordem() {
  const { escala, catalogo, atualizadoEm, velho, erroAoAtualizar, baixando, atualizar } = usarCulto()
  const hoje = hojeEmBrasilia()
  const pacote = estadoDoPacote(atualizadoEm, velho, erroAoAtualizar)

  return (
    <>
      <TopoDoCulto fecharPara={`/escalas/${escala.id}`}>
        <span className="dica cresce">{tituloDoCulto(escala)}</span>
      </TopoDoCulto>

      <div className="rolagem">
        <h1 className="titulo-da-ordem">{tituloDaOrdem(escala, hoje)}</h1>

        {pacote && (
          <p className={pacote.alerta ? 'aviso estado-do-pacote' : 'dica estado-do-pacote'}>
            {!pacote.alerta && <Icone nome="confirmar" />}
            {pacote.texto}
            <Botao variante="terciario" pequeno onClick={atualizar} carregando={baixando}>
              Atualizar
            </Botao>
          </p>
        )}

        {escala.itens.length ? (
          <div className="ordem" data-guia="culto-ordem">
            {escala.itens.map((item, indice) => (
              <Cartao key={item.id} className="item-do-culto">
                <Link to={`/culto/${escala.id}/item/${item.id}`} className="toque-do-culto">
                  <span className="numero-do-culto display">{indice + 1}</span>
                  <span className="cresce">
                    <span className="titulo">{tituloDoItem(item)}</span>
                    <span className="dica">{dicaDoItem(item, catalogo)}</span>
                  </span>
                  <TomDoItem item={item} />
                </Link>
              </Cartao>
            ))}
          </div>
        ) : (
          <Vazio icone="musica">O ministro ainda não escolheu as músicas</Vazio>
        )}

      </div>

      <RodapeDeAcao
        primario={
          <BotaoLink para={`/culto/${escala.id}/pesquisar`} variante="secundario" largo icone="busca">
            Pesquisar música
          </BotaoLink>
        }
      />
    </>
  )
}

function TomDoItem({ item }: { item: ItemDoCulto }) {
  if (item.tipo === 'medley') return <span className="notas display">{tonsDoMedley(item)}</span>

  return <NotaDoTom tom={item.tom} />
}
