import { Link } from 'react-router'
import type { ItemDoCulto } from '../api/tipos'
import { Icone } from '../casca/Icone'
import { BotaoLink } from '../componentes/Botao'
import { Cartao } from '../componentes/Cartao'
import { RodapeDeAcao } from '../componentes/RodapeDeAcao'
import { Vazio } from '../componentes/Vazio'
import { hojeEmBrasilia } from '../dominio'
import { dicaDoItem, quandoAtualizado, tituloDaOrdem, tituloDoCulto, tituloDoItem, tonsDoMedley } from './culto'
import { usarCulto } from './ModoCulto'
import { TopoDoCulto } from './ModoCulto'
import { NotaDoTom } from './NotaDoTom'

export function Ordem() {
  const { escala, catalogo, atualizadoEm, velho, erroAoAtualizar } = usarCulto()
  const hoje = hojeEmBrasilia()

  return (
    <>
      <TopoDoCulto fecharPara={`/escalas/${escala.id}`}>
        <span className="dica cresce">{tituloDoCulto(escala)}</span>
      </TopoDoCulto>

      <div className="rolagem">
        <h1 className="display">{tituloDaOrdem(escala, hoje)}</h1>

        {!erroAoAtualizar && (
          <p className="dica guardado-no-aparelho">
            <Icone nome="confirmar" />
            Guardado no aparelho. Funciona sem internet.
          </p>
        )}

        {velho && atualizadoEm && <p className="dica">atualizado {quandoAtualizado(atualizadoEm)}</p>}

        {erroAoAtualizar && atualizadoEm && (
          <p className="aviso">Não consegui atualizar; mostrando o de {quandoAtualizado(atualizadoEm)}</p>
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
          <Vazio icone="musica">O Ministro ainda não escolheu as músicas</Vazio>
        )}

        {escala.itens.length > 0 && (
          <p className="dica">Toque numa música para abrir a letra. A tela fica acesa enquanto o modo culto estiver aberto.</p>
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
