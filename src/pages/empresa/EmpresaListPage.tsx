import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmpresas, deleteEmpresa } from '../../api/empresa'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import { Empresa } from '../../types'

export default function EmpresaListPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [confirmando, setConfirmando] = useState<Empresa | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('true')

  const ativoParam = filtroStatus === '' ? undefined : filtroStatus === 'true'

  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ['empresas', filtroStatus],
    queryFn: () => getEmpresas(ativoParam),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEmpresa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      setConfirmando(null)
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Empresas</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as empresas cadastradas</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
            <option value="">Todos</option>
          </select>
          {user?.perfil === 'ENGENHEIRO' && (
            <Link
              to="/empresas/novo"
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
            >
              <Plus size={16} />
              Nova Empresa
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-8 text-center">Carregando...</div>
      ) : empresas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma empresa cadastrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Razão Social</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">CNPJ</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Nome Fantasia</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                {user?.perfil === 'ENGENHEIRO' && (
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {empresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{empresa.razaoSocial}</td>
                  <td className="px-4 py-3 text-slate-600">{empresa.cnpj}</td>
                  <td className="px-4 py-3 text-slate-600">{empresa.nomeFantasia || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{empresa.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${empresa.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {empresa.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  {user?.perfil === 'ENGENHEIRO' && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/empresas/${empresa.id}/editar`}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setConfirmando(empresa)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmando}
        title="Desativar Empresa"
        description="A empresa ficará inativa e não aparecerá mais nas listagens."
        detail={confirmando && (
          <div>
            <p className="text-sm font-medium text-slate-700">{confirmando.nomeFantasia || confirmando.razaoSocial}</p>
            <p className="text-xs text-slate-400 mt-0.5">CNPJ: {confirmando.cnpj}</p>
          </div>
        )}
        confirmLabel="Desativar"
        isLoading={deleteMutation.isPending}
        isError={deleteMutation.isError}
        onConfirm={() => confirmando && deleteMutation.mutate(confirmando.id)}
        onCancel={() => setConfirmando(null)}
      />
    </div>
  )
}
