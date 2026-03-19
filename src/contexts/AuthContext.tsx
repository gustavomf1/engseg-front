import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { PerfilUsuario } from '../types'

interface AuthUser {
  id: string
  nome: string
  perfil: PerfilUsuario
  token: string
}

interface AuthContextData {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (id: string, token: string, nome: string, perfil: PerfilUsuario) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem('engseg_user')
    const token = localStorage.getItem('engseg_token')
    if (raw && token) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage)

  const login = useCallback((id: string, token: string, nome: string, perfil: PerfilUsuario) => {
    const authUser: AuthUser = { id, token, nome, perfil }
    localStorage.setItem('engseg_token', token)
    localStorage.setItem('engseg_user', JSON.stringify(authUser))
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('engseg_token')
    localStorage.removeItem('engseg_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
