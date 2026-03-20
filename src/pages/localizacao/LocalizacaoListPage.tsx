import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLocalizacoes, deleteLocalizacao } from '../../api/localizacao'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function LocalizacaoListPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['localizacoes'],
    queryFn: () => getLocalizacoes(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLocalizacao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['localizacoes'] }),
  })

  const handleDelete = (id: string, nome: string) => {
    if (confirm(`Deseja desativar a localização "${nome}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Localizações</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as localizações dos estabelecimentos</p>
        </div>
        {user?.perfil === 'ENGENHEIRO' && (
          <Link to="/localizacoes/novo" className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
            <Plus size={16} />
            Nova Localização
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-8 text-center">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma localização cadastrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Estabelecimento</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                {user?.perfil === 'ENGENHEIRO' && (
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{item.estabelecimentoNome}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  {user?.perfil === 'ENGENHEIRO' && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/localizacoes/${item.id}/editar`} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded">
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => handleDelete(item.id, item.nome)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded">
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
