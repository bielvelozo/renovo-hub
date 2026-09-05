import { useRef, useState } from 'react'
import { dataDoEnvio, recusaDoArquivo, tamanhoLegivel } from '../../admin/admin'
import { enviarArquivo } from '../../api/cliente'
import type { Anexo, MusicaNaLista } from '../../api/tipos'
import { usarAcao } from '../../api/usarAcao'
import { usarBusca } from '../../api/usarBusca'
import { Barra } from '../../componentes/Barra'
import { Capa } from '../../componentes/Capa'
import { Folha } from '../../componentes/Folha'
import { combinaBusca } from '../../dominio'

export function Sequencias() {
  const catalogo = usarBusca<{ musicas: MusicaNaLista[] }>('/api/musicas')
  const [termo, escrever] = useState('')
  const [escolhida, escolher] = useState<MusicaNaLista | null>(null)

  const achadas = (catalogo.dados?.musicas ?? []).filter((musica) => combinaBusca(musica, termo))

  return (
    <section className="pagina">
      <Barra titulo="Sequências" sub="A letra da Música em Word, com versões" voltarPara="/admin" />

      {catalogo.erro && <p className="aviso">{catalogo.erro}</p>}
      {catalogo.carregando && <div className="girando" role="status" aria-label="Carregando" />}

      <p className="dica">
        A Sequência fica anexada à Música e aparece pro Membro na tela de Início e no detalhe da Música. Enviar de novo
        não apaga nada: guarda uma versão nova.
      </p>

      <label className="campo">
        <span className="rotulo">Buscar a Música</span>
        <input
          type="search"
          placeholder="parte do título ou do artista"
          value={termo}
          onChange={(evento) => escrever(evento.target.value)}
        />
      </label>

      {catalogo.dados && achadas.length === 0 && <p className="vazio">Nenhuma Música com esse texto.</p>}

      {achadas.length > 0 && (
        <ul className="lista cartao">
          {achadas.slice(0, 30).map((musica) => (
            <li key={musica.id}>
              <button type="button" className="toque" onClick={() => escolher(musica)}>
                <Capa musicas={[musica]} />
                <span className="cresce">
                  <span className="titulo">{musica.titulo}</span>
                  <span className="dica">{musica.artista}</span>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
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
        <p className="dica">Nenhuma Sequência anexada ainda.</p>
      )}

      <label className="campo">
        <span className="rotulo">Arquivo Word (.docx, até 1 MB)</span>
        <input
          ref={campo}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(evento) => guardar(evento.target.files?.[0] ?? null)}
        />
      </label>

      {recusa && <p className="aviso">{recusa}</p>}

      <button type="button" className="botao largo" disabled={acao.ocupado || !arquivo || !!recusa} onClick={enviar}>
        {lista.length ? 'Enviar nova versão' : 'Enviar Sequência'}
      </button>
    </Folha>
  )
}
