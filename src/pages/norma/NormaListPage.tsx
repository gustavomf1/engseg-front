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

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['normas'],
    queryFn: getNormas,
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
        <Link
          to="/normas/novo"
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
        >
          <Plus size={16} />
          Nova Norma
        </Link>
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
