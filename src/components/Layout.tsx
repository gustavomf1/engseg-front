import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const pageTitles: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Sistema de Gestão de Segurança do Trabalho', sub: 'Controle e gerenciamento de ocorrências' },
  '/perfil': { title: 'Sistema de Gestão de Segurança do Trabalho', sub: 'Controle e gerenciamento de ocorrências' },
  '/registro-ocorrencia': { title: 'Sistema de Gestão de Segurança do Trabalho', sub: 'Controle e gerenciamento de ocorrências' },
  '/tratativas': { title: 'Sistema de Gestão de Segurança do Trabalho', sub: 'Controle e gerenciamento de ocorrências' },
}

export default function Layout() {
  const location = useLocation()
  const page = pageTitles[location.pathname] || { title: 'Sistema de Gestão de Segurança do Trabalho', sub: 'Controle e gerenciamento de ocorrências' }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-lg font-bold text-slate-800">{page.title}</h1>
          <p className="text-sm text-slate-500">{page.sub}</p>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
