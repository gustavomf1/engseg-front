import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNormas, deleteNorma, reativarNorma } from '../../api/norma'
import { getEmpresas } from '../../api/empresa'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, RotateCcw, BookOpen, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import { Norma } from '../../types'

const PAGE_SIZES = [15, 25, 50, 100, 200]

export default function NormaListPage() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin === true
  const queryClient = useQueryClient()
  const [confirmando, setConfirmando] = useState<Norma | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<string>('true')
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [adminEmpresaId, setAdminEmpresaId] = useState('')

  const ativoParam = filtroStatus === '' ? undefined : filtroStatus === 'true'

  const { data: empresasAdmin = [] } = useQuery({
    queryKey: ['empresas-admin-filter'],
    queryFn: () => getEmpresas(),
    enabled: isAdmin,
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['normas', filtroStatus, adminEmpresaId],
    queryFn: () => getNormas(ativoParam, isAdmin && adminEmpresaId ? adminEmpresaId : undefined),
  })

  const filtradas = items.filter(i => {
    const q = busca.toLowerCase()
    return !q || i.titulo.toLowerCase().includes(q) || (i.descricao ?? '').toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtradas.length / pageSize)
  const paginadas = filtradas.slice((page - 1) * pageSize, page * pageSize)

  function handleBusca(v: string) { setBusca(v); setPage(1) }
  function handlePageSize(v: number) { setPageSize(v); setPage(1) }

  const deleteMutation = useMutation({
    mutationFn: deleteNorma,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['normas'] }); setConfirmando(null) },
  })

  const reativarMutation = useMutation({
    mutationFn: reativarNorma,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['normas'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Normas e Regulamentos</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as normas que podem ser vinculadas às não conformidades</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); setPage(1) }} className="select-std">
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
            <option value="">Todos</option>
          </select>
          <Link to="/normas/novo" className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
            <Plus size={16} /> Nova Norma
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={busca}
            onChange={e => handleBusca(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-gray-400"
          />
        </div>
        {isAdmin && (
          <select className="select-std" value={adminEmpresaId} onChange={e => { setAdminEmpresaId(e.target.value); setPage(1) }}>
            <option value="">Todas as empresas</option>
            {empresasAdmin.map(e => (
              <option key={e.id} value={e.id}>{e.nomeFantasia || e.razaoSocial}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-500 ml-auto">
          <span className="whitespace-nowrap text-xs">Por página:</span>
          <select value={pageSize} onChange={e => handlePageSize(Number(e.target.value))} className="select-std">
            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-8 text-center">Carregando...</div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{busca ? 'Nenhuma norma encontrada' : 'Nenhuma norma cadastrada'}</p>
        </div>
      ) : (
        <>
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
                {paginadas.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{item.titulo}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-lg"><p className="line-clamp-2">{item.descricao || '—'}</p></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/normas/${item.id}/editar`} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded"><Pencil size={15} /></Link>
                        {item.ativo ? (
                          <button onClick={() => setConfirmando(item)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                        ) : (
                          <button onClick={() => reativarMutation.mutate(item.id)} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded"><RotateCcw size={15} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>{filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}</span>
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            <span>Página {page} de {totalPages}</span>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmando}
        title="Desativar Norma"
        description="A norma ficará inativa e não aparecerá mais para seleção nas não conformidades."
        detail={confirmando && <p className="text-sm font-medium text-slate-700">{confirmando.titulo}</p>}
        confirmLabel="Desativar"
        isLoading={deleteMutation.isPending}
        isError={deleteMutation.isError}
        onConfirm={() => confirmando && deleteMutation.mutate(confirmando.id)}
        onCancel={() => setConfirmando(null)}
      />
    </div>
  )
}
