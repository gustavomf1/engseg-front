import { useQuery } from '@tanstack/react-query'
import { getDesvios } from '../../api/desvio'
import { Link } from 'react-router-dom'
import { Plus, Clipboard, Eye } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import { formatDateTime } from '../../utils/date'

export default function DesvioListPage() {
  const { user } = useAuth()
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['desvios'],
    queryFn: getDesvios,
  })

  const canCreate = user?.perfil === 'ENGENHEIRO' || user?.perfil === 'TECNICO'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Desvios</h2>
          <p className="text-slate-500 text-sm mt-1">{items.length} registros</p>
        </div>
        {canCreate && (
          <Link to="/desvios/novo" className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
            <Plus size={16} />
            Novo Desvio
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-8 text-center">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Clipboard size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum desvio registrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Estabelecimento</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Descrição</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Usuário de Registro</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Data</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-slate-700">{item.estabelecimentoNome}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{item.descricao}</td>
                  <td className="px-4 py-3 text-slate-600">{item.tecnicoNome || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{formatDateTime(item.dataRegistro)}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} type="desvio" /></td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/desvios/${item.id}`} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded">
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
