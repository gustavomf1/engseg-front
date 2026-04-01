import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../api/dashboard'
import { getOcorrencias } from '../api/ocorrencia'
import { useAuth } from '../contexts/AuthContext'
import { TrendingUp, AlertTriangle, ClipboardList, Shield, FilePlus } from 'lucide-react'
import { formatDate } from '../utils/date'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: stats } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardStats })
  const { data: ocorrencias = [] } = useQuery({ queryKey: ['ocorrencias'], queryFn: getOcorrencias })

  const recentes = ocorrencias.filter(item => {
    if (user?.perfil === 'ENGENHEIRO') {
      if (item.tipo === 'NAO_CONFORMIDADE') return item.engResponsavelVerificacaoId === user.id
      return item.usuarioCriacaoEmail === user.email
    }
    if (user?.perfil === 'TECNICO') {
      return item.usuarioCriacaoEmail === user.email || item.engResponsavelVerificacaoId === user.id
    }
    return true
  }).slice(0, 5)

  const cards = [
    { label: 'Total de Ocorrências', value: stats?.totalOcorrencias ?? 0, icon: TrendingUp, bg: 'bg-blue-50', iconColor: 'text-blue-500' },
    { label: 'Desvios', value: stats?.totalDesvios ?? 0, icon: AlertTriangle, bg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
    { label: 'Não Conformidades', value: stats?.totalNaoConformidades ?? 0, icon: ClipboardList, bg: 'bg-red-50', iconColor: 'text-red-500' },
    { label: 'Regra de Ouro', value: stats?.totalRegraDeOuro ?? 0, icon: Shield, bg: 'bg-red-50', iconColor: 'text-red-400' },
  ]

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, bg, iconColor }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-sm text-slate-500 mb-1">{label}</div>
              <div className="text-3xl font-bold text-slate-800">{value}</div>
            </div>
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={22} className={iconColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/ocorrencias/nova')}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-slate-300 transition text-left"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <FilePlus size={22} className="text-blue-500" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Registrar Nova Ocorrência</div>
              <div className="text-sm text-slate-500">Registre desvios ou não conformidades identificadas</div>
            </div>
          </button>
          <button
            onClick={() => navigate('/tratativas')}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-slate-300 transition text-left"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardList size={22} className="text-slate-500" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Visualizar Tratativas</div>
              <div className="text-sm text-slate-500">Gerencie os planos de ação e evidências</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent occurrences */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-700">Ocorrências Recentes</h2>
          <button
            onClick={() => navigate('/tratativas')}
            className="text-sm text-slate-500 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50"
          >
            Ver Todas
          </button>
        </div>
        <div className="space-y-3">
          {recentes.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-slate-400 text-sm">
              Nenhuma ocorrência registrada
            </div>
          )}
          {recentes.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm min-w-0">
              <AlertTriangle size={20} className={`flex-shrink-0 ${item.tipo === 'DESVIO' ? 'text-yellow-400' : 'text-red-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.tipo === 'DESVIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {item.tipo === 'DESVIO' ? 'Desvio' : 'Não Conformidade'}
                  </span>
                  {item.regraDeOuro && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                      <Shield size={10} /> Regra de Ouro
                    </span>
                  )}
                </div>
                <div className="font-medium text-slate-800 text-sm truncate">{item.titulo}</div>
                <div className="text-xs text-slate-500 truncate">{item.localizacao ? `${item.localizacao} • ` : ''}{formatDate(item.dataRegistro)}</div>
              </div>
              <button
                onClick={() => navigate(`/tratativas/${item.tipo}/${item.id}`)}
                className="text-sm text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
              >
                Ver Detalhes →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
