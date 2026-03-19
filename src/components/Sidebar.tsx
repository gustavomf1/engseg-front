import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getOcorrencias } from '../api/ocorrencia'
import { Shield, LayoutDashboard, User, FilePlus, ClipboardList, LogOut, Building2, MapPin, Users } from 'lucide-react'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: ocorrencias = [] } = useQuery({
    queryKey: ['ocorrencias'],
    queryFn: getOcorrencias,
  })

  const isEngenheiro = user?.perfil === 'ENGENHEIRO'

  const pendentesValidacao = ocorrencias.filter(o => {
    if (o.tipo !== 'NAO_CONFORMIDADE' || o.status !== 'EM_TRATAMENTO') return false
    return isEngenheiro || o.engResponsavelVerificacaoId === user?.id
  }).length

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
      isActive
        ? 'bg-slate-700 text-white font-medium border-l-2 border-blue-400'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <div className="w-56 bg-slate-900 min-h-screen flex flex-col py-6 px-3 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-6">
        <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">SGS</div>
          <div className="text-slate-500 text-xs">Sistema de Gestão</div>
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center gap-2.5 px-2 mb-6 pb-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {user?.nome?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-white text-sm font-medium truncate">{user?.nome}</div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            <span className="text-slate-400 text-xs">Online</span>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1">
        <NavLink to="/dashboard" className={navItemClass}>
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>
        <NavLink to="/perfil" className={navItemClass}>
          <User size={16} />
          Usuário
        </NavLink>
        {user?.perfil !== 'EXTERNO' && (
          <NavLink to="/registro-ocorrencia" className={navItemClass}>
            <FilePlus size={16} />
            <span>Registro de<br/>Ocorrência</span>
          </NavLink>
        )}
        <NavLink to="/tratativas" className={navItemClass}>
          {({ isActive }) => (
            <>
              <ClipboardList size={16} />
              <span className="flex-1">Tratativas</span>
              {user?.perfil === 'ENGENHEIRO' && pendentesValidacao > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-orange-400 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {pendentesValidacao}
                </span>
              )}
            </>
          )}
        </NavLink>

        {/* Admin section - ENGENHEIRO only */}
        {user?.perfil === 'ENGENHEIRO' && (
          <>
            <div className="pt-4 pb-1 px-2">
              <span className="text-slate-600 text-xs uppercase tracking-wider">Administração</span>
            </div>
            <NavLink to="/empresas" className={navItemClass}>
              <Building2 size={15} />
              Empresas
            </NavLink>
            <NavLink to="/estabelecimentos" className={navItemClass}>
              <MapPin size={15} />
              Estabelecimentos
            </NavLink>
            <NavLink to="/usuarios" className={navItemClass}>
              <Users size={15} />
              Usuários
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom: logout + version */}
      <div className="space-y-2 mt-4 border-t border-slate-800 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <LogOut size={16} />
          Sair do Sistema
        </button>
        <div className="text-center text-slate-600 text-xs">
          <div>Versão 1.0.0</div>
          <div>© 2024 ERS</div>
        </div>
      </div>
    </div>
  )
}
