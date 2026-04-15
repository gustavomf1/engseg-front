import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function AdminRoute({ children }: Props) {
  const { user } = useAuth()
  return user?.isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />
}
