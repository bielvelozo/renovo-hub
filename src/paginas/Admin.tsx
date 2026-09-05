import { Navigate, Outlet } from 'react-router'
import { usarEu } from '../sessao/sessao'

export function Admin() {
  const eu = usarEu()

  if (!eu.admin) return <Navigate to="/" replace />

  return <Outlet />
}
