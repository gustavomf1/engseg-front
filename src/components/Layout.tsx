import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-[var(--bg-surface)] border-b border-gray-200 dark:border-[var(--border-main)] px-4 lg:px-8 py-4 flex-shrink-0 flex items-center gap-3">
          {/* Mobile: abre drawer. Desktop: colapsa/expande */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(true)
              } else {
                setCollapsed(c => !c)
              }
            }}
            className="p-1.5 text-slate-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={22} />
          </button>
          <div>
            <h1 className="text-base lg:text-lg font-bold text-slate-800">Sistema de Gestão de Segurança do Trabalho</h1>
            <p className="text-xs lg:text-sm text-slate-500">Controle e gerenciamento de ocorrências</p>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto bg-[var(--bg-base)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
