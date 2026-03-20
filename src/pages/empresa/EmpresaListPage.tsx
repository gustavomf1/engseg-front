import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmpresas, deleteEmpresa } from '../../api/empresa'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function EmpresaListPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: empresas = [], isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEmpresa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empresas'] }),
  })

  const handleDelete = (id: string, nome: string) => {
    if (confirm(`Deseja desativar a empresa "${nome}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Empresas</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as empresas cadastradas</p>
        </div>
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
                          onClick={() => handleDelete(empresa.id, empresa.razaoSocial)}
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
    </div>
  )
}
