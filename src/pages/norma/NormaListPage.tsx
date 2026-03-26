import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNormas, deleteNorma } from '../../api/norma'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import ConfirmDialog from '../../components/ConfirmDialog'
import { Norma } from '../../types'

export default function NormaListPage() {
  const queryClient = useQueryClient()
  const [confirmando, setConfirmando] = useState<Norma | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('true')

  const ativoParam = filtroStatus === '' ? undefined : filtroStatus === 'true'

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['normas', filtroStatus],
    queryFn: () => getNormas(ativoParam),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNorma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['normas'] })
      setConfirmando(null)
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Normas e Regulamentos</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as normas que podem ser vinculadas às não conformidades</p>
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
          <Link
            to="/normas/novo"
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
          >
            <Plus size={16} />
            Nova Norma
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-8 text-center">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhuma norma cadastrada</p>
          <p className="text-slate-400 text-sm mt-1">Cadastre normas como NR-12, NR-35, procedimentos internos, etc.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Título</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Descrição</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{item.titulo}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-lg">
                    <p className="line-clamp-2">{item.descricao || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/normas/${item.id}/editar`}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => setConfirmando(item)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmando}
        title="Desativar Norma"
        description="A norma ficará inativa e não aparecerá mais para seleção nas não conformidades."
        detail={confirmando && (
          <div>
            <p className="text-sm font-medium text-slate-700">{confirmando.titulo}</p>
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
