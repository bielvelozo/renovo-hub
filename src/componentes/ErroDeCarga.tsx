import { Botao } from './Botao'

export function ErroDeCarga({ mensagem, tentarDeNovo }: { mensagem: string; tentarDeNovo: () => void }) {
  return (
    <div className="erro-de-carga">
      <p className="aviso" role="alert">
        {mensagem}
      </p>
      <Botao largo onClick={tentarDeNovo}>
        Tentar de novo
      </Botao>
    </div>
  )
}
