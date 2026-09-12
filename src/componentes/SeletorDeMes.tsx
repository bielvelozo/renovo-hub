import { useState } from 'react'
import { mesDaData, nomeDoMes } from '../escalas/mes'
import { Botao } from './Botao'
import { Folha } from './Folha'

export function SeletorDeMes({
  mes,
  hoje,
  fechar,
  aoEscolher,
}: {
  mes: string
  hoje: string
  fechar: () => void
  aoEscolher: (mes: string) => void
}) {
  return (
    <Folha titulo="Ver outro mês" fechar={fechar}>
      <GradeDeMeses
        mes={mes}
        hoje={hoje}
        aoEscolher={(escolhido) => {
          aoEscolher(escolhido)
          fechar()
        }}
      />
    </Folha>
  )
}

export function GradeDeMeses({
  mes,
  hoje,
  aoEscolher,
}: {
  mes: string
  hoje: string
  aoEscolher: (mes: string) => void
}) {
  const [ano, verAno] = useState(() => Number(mes.slice(0, 4)))
  const meses = Array.from({ length: 12 }, (_, indice) => `${ano}-${String(indice + 1).padStart(2, '0')}`)

  return (
    <div className="pagina">
      <div className="ano-do-seletor">
        <Botao variante="icone" icone="voltar" aria-label="Ano anterior" onClick={() => verAno(ano - 1)} />
        <span className="titulo">{ano}</span>
        <Botao variante="icone" icone="seta" aria-label="Próximo ano" onClick={() => verAno(ano + 1)} />
      </div>

      <div className="grade-de-meses">
        {meses.map((deste) => (
          <button
            key={deste}
            type="button"
            aria-pressed={deste === mes}
            onClick={() => aoEscolher(deste)}
          >
            {nomeDoMes(deste)}
          </button>
        ))}
      </div>

      <Botao variante="secundario" largo onClick={() => aoEscolher(mesDaData(hoje))}>
        Hoje
      </Botao>
    </div>
  )
}
