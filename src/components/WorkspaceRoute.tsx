import { Navigate } from 'react-router-dom'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function WorkspaceRoute({ children }: Props) {
  const { selecionado } = useWorkspace()
  const { user } = useAuth()

  // EXTERNO e ADMIN não precisam selecionar workspace
  if (user?.perfil === 'EXTERNO' || user?.isAdmin) {
    return <>{children}</>
  }

  if (!selecionado) {
    return <Navigate to="/selecionar" replace />
  }

  return <>{children}</>
}
