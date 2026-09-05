import { usarTema } from '../tema/ProvedorDeTema'

export function Marca() {
  const { tema } = usarTema()

  return (
    <img
      className="marca"
      src={tema === 'escuro' ? '/marca-escuro.png' : '/marca-claro.png'}
      alt="Igreja Missão Renovo"
      width={470}
      height={128}
    />
  )
}
