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

  // EXTERNO não precisa selecionar workspace
  if (user?.perfil === 'EXTERNO') {
    return <>{children}</>
  }

  if (!selecionado) {
    return <Navigate to="/selecionar" replace />
  }

  return <>{children}</>
}
