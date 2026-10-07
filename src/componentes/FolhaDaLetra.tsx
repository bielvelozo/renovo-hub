import { useState } from 'react'
import { dataDoEnvio, recusaDoArquivo, tamanhoLegivel } from '../admin/admin'
import { enviarArquivo } from '../api/cliente'
import { marcarTarefa } from '../guia/andamento'
import type { Anexo } from '../api/tipos'
import { usarAcao } from '../api/usarAcao'
import { Icone } from '../casca/Icone'
import type { Letra } from '../dominio'
import { CorpoDaLetra } from '../letra/CorpoDaLetra'
import { Botao } from './Botao'
import { Campo } from './Campo'
import { Folha } from './Folha'

export type DonoDaLetra = { musicaId: string } | { itemId: string }

const ACEITA = '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function FolhaDaLetra({
  titulo,
  dono,
  anexos,
  fechar,
  aoEnviar,
}: {
  titulo: string
  dono: DonoDaLetra
  anexos: Anexo[]
  fechar: () => void
  aoEnviar: (anexo: Anexo, letra: Letra) => void
}) {
  const acao = usarAcao()
  const [arquivo, guardar] = useState<File | null>(null)
  const [lida, guardarLida] = useState<Letra | null>(null)

  const recusa = arquivo ? recusaDoArquivo({ nome: arquivo.name, tamanho: arquivo.size }) : null

  const enviar = () => {
    if (!arquivo || recusa) return

    acao.limpar()
    acao.executar(async () => {
      const { letra, ...anexo } = await enviarArquivo<Anexo & { letra: Letra }>(caminhoDoDono(dono), arquivo)
      guardarLida(letra)
      marcarTarefa('letra')
      aoEnviar(anexo, letra)
    })
  }

  if (lida) {
    return (
      <Folha titulo={titulo} fechar={fechar}>
        <div className="previa-da-letra">
          <CorpoDaLetra letra={lida} />
        </div>

        <Botao largo onClick={fechar}>
          Pronto
        </Botao>

        <p className="dica">Não ficou certo? Ajuste o Word e envie de novo.</p>
      </Folha>
    )
  }

  return (
    <Folha titulo={titulo} fechar={fechar}>
      {acao.erro && <p className="aviso">{acao.erro}</p>}

      {anexos.length > 0 && <Versoes anexos={anexos} />}

      <Campo rotulo="Arquivo Word (.docx, até 1 MB)">
        <input type="file" accept={ACEITA} onChange={(evento) => guardar(evento.target.files?.[0] ?? null)} />
      </Campo>

      {recusa && <p className="aviso">{recusa}</p>}

      <Botao largo disabled={acao.ocupado || !arquivo || !!recusa} onClick={enviar}>
        {anexos.length ? 'Enviar nova versão' : 'Enviar letra'}
      </Botao>
    </Folha>
  )
}

function Versoes({ anexos }: { anexos: Anexo[] }) {
  return (
    <ul className="lista cartao">
      {anexos.map((anexo) => (
        <li key={anexo.id}>
          <a className="toque" href={anexo.url}>
            <Icone nome="documento" />
            <span className="cresce">
              <span className="titulo">{anexo.nome}</span>
              <span className="dica">
                versão {anexo.versao} · {tamanhoLegivel(anexo.tamanho)} · {dataDoEnvio(anexo.criadoEm)} ·{' '}
                {anexo.temLetra ? 'com letra' : 'sem letra'}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function caminhoDoDono(dono: DonoDaLetra): string {
  return 'musicaId' in dono ? `/api/musicas/${dono.musicaId}/anexos` : `/api/itens/${dono.itemId}/anexos`
}
