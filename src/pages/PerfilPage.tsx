import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { getOcorrencias } from '../api/ocorrencia'
import { Camera, User } from 'lucide-react'

const perfilLabels: Record<string, string> = {
  ENGENHEIRO: 'Engenheiro',
  TECNICO: 'Técnico',
  EXTERNO: 'Externo',
}

export default function PerfilPage() {
  const { user } = useAuth()
  const { data: ocorrencias = [] } = useQuery({ queryKey: ['ocorrencias'], queryFn: getOcorrencias })

  const concluidas = ocorrencias.filter(o => o.status === 'CONCLUIDO').length
  const pendentes = ocorrencias.filter(o => o.status !== 'CONCLUIDO' && o.status !== 'NAO_RESOLVIDA').length

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Perfil do Usuário</h2>
        <p className="text-sm text-blue-500 mt-1">Gerencie suas informações pessoais e de acesso</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center">
            <User size={40} className="text-slate-400" />
          </div>
          <button className="flex items-center gap-2 text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            <Camera size={14} /> Alterar Foto
          </button>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">Nível de Acesso</div>
            <span className="bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full">
              {perfilLabels[user?.perfil || ''] || user?.perfil}
            </span>
          </div>
        </div>

        {/* Info card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nome Completo</label>
            <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-slate-700">{user?.nome}</div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-slate-700">
              usuário@empresa.com
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Cargo</label>
              <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-slate-700">
                {perfilLabels[user?.perfil || ''] || user?.perfil} de Segurança
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Setor/Departamento</label>
              <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-slate-700">
                Departamento de Segurança do Trabalho
              </div>
            </div>
          </div>
          <button className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2">
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-slate-700 mb-4">Suas Estatísticas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-slate-800">{ocorrencias.length}</div>
            <div className="text-sm text-slate-500 mt-1">Ocorrências Registradas</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-800">{concluidas}</div>
            <div className="text-sm text-slate-500 mt-1">Tratativas Concluídas</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-800">{pendentes}</div>
            <div className="text-sm text-slate-500 mt-1">Pendentes</div>
          </div>
        </div>
      </div>
    </div>
  )
}
