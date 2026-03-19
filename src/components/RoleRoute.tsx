import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PerfilUsuario } from '../types'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  allowed: PerfilUsuario[]
}

export default function RoleRoute({ children, allowed }: Props) {
  const { user } = useAuth()

  if (!user || !allowed.includes(user.perfil)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
