import { usarEu } from '../sessao/sessao'
import { EmBreve } from './EmBreve'

export function Inicio() {
  const eu = usarEu()

  return (
    <EmBreve
      titulo={`Oi, ${eu.nome}`}
      descricao="Aqui vai aparecer a sua próxima Escala: a sua Função, quem ministra, o Repertório com os Tons, os links no ponto certo do vídeo, a playlist e o texto pro grupo."
    />
  )
}
