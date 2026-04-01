import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsuarios, deleteUsuario, reativarUsuario } from '../../api/usuario'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, RotateCcw, Users, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import { Usuario } from '../../types'

const PAGE_SIZES = [15, 25, 50, 100, 200]

const perfilLabels = { ENGENHEIRO: 'Engenheiro', TECNICO: 'Técnico', EXTERNO: 'Externo' }
const perfilColors = {
  ENGENHEIRO: 'bg-blue-100 text-blue-700',
  TECNICO: 'bg-purple-100 text-purple-700',
  EXTERNO: 'bg-orange-100 text-orange-700',
}

export default function UsuarioListPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filtroStatus, setFiltroStatus] = useState<string>('true')
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const ativoParam = filtroStatus === '' ? undefined : filtroStatus === 'true'

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios', filtroStatus],
    queryFn: () => getUsuarios(ativoParam),
  })

  const filtrados = usuarios.filter(u => {
    const q = busca.toLowerCase()
    return !q || u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtrados.length / pageSize)
  const paginados = filtrados.slice((page - 1) * pageSize, page * pageSize)

  function handleBusca(v: string) { setBusca(v); setPage(1) }
  function handlePageSize(v: number) { setPageSize(v); setPage(1) }

  const [confirmando, setConfirmando] = useState<Usuario | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); setConfirmando(null) },
  })

  const reativarMutation = useMutation({
    mutationFn: reativarUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Usuários</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie os usuários do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); setPage(1) }} className="select-std">
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
            <option value="">Todos</option>
          </select>
          {user?.perfil === 'ENGENHEIRO' && (
            <Link to="/usuarios/novo" className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
              <Plus size={16} /> Novo Usuário
            </Link>
          )}
        </div>
      </div>

      {/* Search + page size */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            value={busca}
            onChange={e => handleBusca(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="whitespace-nowrap">Por página:</span>
          <select value={pageSize} onChange={e => handlePageSize(Number(e.target.value))} className="select-std">
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-8 text-center">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{busca ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Perfil</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  {user?.perfil === 'ENGENHEIRO' && (
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginados.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${perfilColors[u.perfil]}`}>{perfilLabels[u.perfil]}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.empresaNome}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    {user?.perfil === 'ENGENHEIRO' && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/usuarios/${u.id}/editar`} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded"><Pencil size={15} /></Link>
                          {u.ativo ? (
                            <button onClick={() => setConfirmando(u)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                          ) : (
                            <button onClick={() => reativarMutation.mutate(u.id)} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded"><RotateCcw size={15} /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}</span>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            <span>Página {page} de {totalPages}</span>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmando}
        title="Desativar Usuário"
        description="O usuário ficará inativo e não conseguirá mais acessar o sistema."
        detail={confirmando && (
          <div>
            <p className="text-sm font-medium text-slate-700">{confirmando.nome}</p>
            <p className="text-xs text-slate-400 mt-0.5">{confirmando.email}</p>
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
