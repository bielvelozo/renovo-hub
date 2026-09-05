import { Navigate } from 'react-router'
import { usarEu } from '../sessao/sessao'
import { EmBreve } from './EmBreve'

export function Admin() {
  const eu = usarEu()

  if (!eu.admin) return <Navigate to="/" replace />

  return (
    <EmBreve
      titulo="Admin"
      descricao="Aqui vai aparecer a gestão: Membros, Funções, Formações, Convites, Músicas a revisar, anexos da Sequência e a configuração da lista do esqueci."
    />
  )
}
