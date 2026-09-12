import { useRef, useState } from 'react'
import { dataDoEnvio, recusaDoArquivo, tamanhoLegivel } from '../../admin/admin'
import { enviarArquivo } from '../../api/cliente'
import type { Anexo, MusicaNaLista } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Cabecalho } from '../../casca/Cabecalho'
import { Icone } from '../../casca/Icone'
import { Botao } from '../../componentes/Botao'
import { Busca } from '../../componentes/Busca'
import { Campo } from '../../componentes/Campo'
import { Esqueleto } from '../../componentes/Esqueleto'
import { Folha } from '../../componentes/Folha'
import { LinhaDeMusica } from '../../componentes/LinhaDeMusica'
import { Vazio } from '../../componentes/Vazio'
import { combinaBusca } from '../../dominio'

export function Sequencias() {
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>('/api/musicas')
  const [termo, escrever] = useState('')
  const [escolhida, escolher] = useState<MusicaNaLista | null>(null)

  const achadas = (catalogo.dados?.musicas ?? []).filter((musica) => combinaBusca(musica, termo))

  return (
    <section className="pagina">
      <Cabecalho titulo="Sequências" sub="A letra da Música em Word, com versões" voltarPara="/admin" />

      {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
      {catalogo.carregando && <Esqueleto forma="linha-de-musica" quantidade={5} />}

      <p className="dica">Enviar de novo não apaga nada: guarda uma versão nova.</p>

      <Busca valor={termo} aoMudar={escrever} rotulo="Buscar a Música" />

      {catalogo.dados && achadas.length === 0 && <Vazio icone="musica">Nenhuma Música com esse texto.</Vazio>}

      {achadas.length > 0 && (
        <ul className="lista cartao">
          {achadas.slice(0, 30).map((musica) => (
            <LinhaDeMusica key={musica.id} musica={musica} modo="escolha" aoEscolher={() => escolher(musica)} />
          ))}
        </ul>
      )}

      {achadas.length > 30 && <p className="dica">Mostrando as 30 primeiras. Busque pelo título pra achar a sua.</p>}

      {escolhida && <FolhaDaSequencia musica={escolhida} fechar={() => escolher(null)} />}
    </section>
  )
}

function FolhaDaSequencia({ musica, fechar }: { musica: MusicaNaLista; fechar: () => void }) {
  const anexos = usarBusca<{ anexos: Anexo[] }>(`/api/musicas/${musica.id}/anexos`)
  const acao = usarAcao()
  const campo = useRef<HTMLInputElement>(null)
  const [arquivo, guardar] = useState<File | null>(null)

  const recusa = arquivo ? recusaDoArquivo({ nome: arquivo.name, tamanho: arquivo.size }) : null

  const enviar = () => {
    if (!arquivo || recusa) return

    acao.executar(async () => {
      await enviarArquivo<Anexo>(`/api/musicas/${musica.id}/anexos`, arquivo)
      guardar(null)
      if (campo.current) campo.current.value = ''
      anexos.recarregar()
    })
  }

  const lista = anexos.dados?.anexos ?? []

  return (
    <Folha titulo={musica.titulo} fechar={fechar}>
      {anexos.erro && <p className="aviso">{anexos.erro}</p>}
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {lista.length ? (
        <ul className="lista cartao">
          {lista.map((anexo) => (
            <li key={anexo.id}>
              <a className="toque" href={anexo.url}>
                <Icone nome="documento" />
                <span className="cresce">
                  <span className="titulo">{anexo.nome}</span>
                  <span className="dica">
                    versão {anexo.versao} · {tamanhoLegivel(anexo.tamanho)} · {dataDoEnvio(anexo.criadoEm)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <Vazio icone="documento">Nenhuma Sequência anexada ainda.</Vazio>
      )}

      <Campo rotulo="Arquivo Word (.docx, até 1 MB)">
        <input
          ref={campo}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(evento) => guardar(evento.target.files?.[0] ?? null)}
        />
      </Campo>

      {recusa && <p className="aviso">{recusa}</p>}

      <Botao largo disabled={acao.ocupado || !arquivo || !!recusa} onClick={enviar}>
        {lista.length ? 'Enviar nova versão' : 'Enviar Sequência'}
      </Botao>
    </Folha>
  )
}
