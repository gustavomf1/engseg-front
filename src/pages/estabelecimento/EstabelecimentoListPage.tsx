import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEstabelecimentos, deleteEstabelecimento, reativarEstabelecimento } from '../../api/estabelecimento'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, RotateCcw, MapPin, Eye, X, Building2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import { Estabelecimento } from '../../types'

export default function EstabelecimentoListPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [confirmando, setConfirmando] = useState<Estabelecimento | null>(null)
  const [detalhes, setDetalhes] = useState<Estabelecimento | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('true')

  const ativoParam = filtroStatus === '' ? undefined : filtroStatus === 'true'

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['estabelecimentos', filtroStatus],
    queryFn: () => getEstabelecimentos(ativoParam),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEstabelecimento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos'] })
      setConfirmando(null)
    },
  })

  const reativarMutation = useMutation({
    mutationFn: reativarEstabelecimento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos'] })
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Estabelecimentos</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie os estabelecimentos cadastrados</p>
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
            <Link to="/estabelecimentos/novo" className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
              <Plus size={16} />
              Novo Estabelecimento
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-8 text-center">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum estabelecimento cadastrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Código</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Empresa</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Cidade/UF</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{item.codigo}</td>
                  <td className="px-4 py-3 text-slate-600">{item.empresaNome}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.cidade && item.estado ? `${item.cidade} / ${item.estado}` : item.cidade || item.estado || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setDetalhes(item)} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded" title="Ver detalhes">
                        <Eye size={15} />
                      </button>
                      {user?.perfil === 'ENGENHEIRO' && (
                        <>
                          <Link to={`/estabelecimentos/${item.id}/editar`} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded">
                            <Pencil size={15} />
                          </Link>
                          {item.ativo ? (
                            <button onClick={() => setConfirmando(item)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded" title="Desativar">
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <button onClick={() => reativarMutation.mutate(item.id)} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded" title="Reativar">
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detalhes && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetalhes(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <MapPin size={20} className="text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{detalhes.nome}</h3>
                  <p className="text-xs text-slate-400">Código: {detalhes.codigo}</p>
                </div>
              </div>
              <button onClick={() => setDetalhes(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                <Building2 size={15} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Empresa</p>
                  <p className="text-sm font-medium text-slate-700">{detalhes.empresaNome}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Status</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${detalhes.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {detalhes.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {detalhes.cep && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400">CEP</p>
                    <p className="text-sm font-medium text-slate-700">{detalhes.cep}</p>
                  </div>
                )}
              </div>

              {(detalhes.logradouro || detalhes.numero) && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Logradouro</p>
                  <p className="text-sm font-medium text-slate-700">
                    {[detalhes.logradouro, detalhes.numero].filter(Boolean).join(', nº ')}
                  </p>
                </div>
              )}

              {detalhes.bairro && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Bairro</p>
                  <p className="text-sm font-medium text-slate-700">{detalhes.bairro}</p>
                </div>
              )}

              {(detalhes.cidade || detalhes.estado) && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400">Cidade / Estado</p>
                  <p className="text-sm font-medium text-slate-700">
                    {[detalhes.cidade, detalhes.estado].filter(Boolean).join(' / ')}
                  </p>
                </div>
              )}

              {!detalhes.cep && !detalhes.logradouro && !detalhes.bairro && !detalhes.cidade && !detalhes.estado && (
                <p className="text-xs text-slate-400 text-center py-2">Endereço não cadastrado</p>
              )}
            </div>

            <div className="flex justify-end mt-5">
              <button onClick={() => setDetalhes(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-lg transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmando}
        title="Desativar Estabelecimento"
        description="O estabelecimento ficará inativo e não aparecerá mais nas listagens."
        detail={confirmando && (
          <div>
            <p className="text-sm font-medium text-slate-700">{confirmando.nome}</p>
            <p className="text-xs text-slate-400 mt-0.5">Código: {confirmando.codigo}</p>
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
