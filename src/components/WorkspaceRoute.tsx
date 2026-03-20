import { Navigate } from 'react-router-dom'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function WorkspaceRoute({ children }: Props) {
  const { selecionado } = useWorkspace()

  if (!selecionado) {
    return <Navigate to="/selecionar" replace />
  }

  return <>{children}</>
}
