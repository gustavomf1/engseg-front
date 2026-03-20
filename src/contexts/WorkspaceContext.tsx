import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Empresa, Estabelecimento } from '../types'

interface WorkspaceContextData {
  empresa: Empresa | null
  estabelecimento: Estabelecimento | null
  selecionado: boolean
  selecionarEmpresa: (empresa: Empresa) => void
  selecionarEstabelecimento: (estabelecimento: Estabelecimento) => void
  limpar: () => void
}

const WorkspaceContext = createContext<WorkspaceContextData>({} as WorkspaceContextData)

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(() => loadFromStorage('engseg_empresa'))
  const [estabelecimento, setEstabelecimento] = useState<Estabelecimento | null>(() => loadFromStorage('engseg_estabelecimento'))

  const selecionarEmpresa = useCallback((emp: Empresa) => {
    localStorage.setItem('engseg_empresa', JSON.stringify(emp))
    localStorage.removeItem('engseg_estabelecimento')
    setEmpresa(emp)
    setEstabelecimento(null)
  }, [])

  const selecionarEstabelecimento = useCallback((est: Estabelecimento) => {
    localStorage.setItem('engseg_estabelecimento', JSON.stringify(est))
    setEstabelecimento(est)
  }, [])

  const limpar = useCallback(() => {
    localStorage.removeItem('engseg_empresa')
    localStorage.removeItem('engseg_estabelecimento')
    setEmpresa(null)
    setEstabelecimento(null)
  }, [])

  const selecionado = !!empresa && !!estabelecimento

  return (
    <WorkspaceContext.Provider value={{ empresa, estabelecimento, selecionado, selecionarEmpresa, selecionarEstabelecimento, limpar }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return useContext(WorkspaceContext)
}
