import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLocalizacoes, deleteLocalizacao, reativarLocalizacao } from '../../api/localizacao'
import { getEstabelecimentos } from '../../api/estabelecimento'
import { getEmpresas } from '../../api/empresa'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, RotateCcw, MapPin, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import ConfirmDialog from '../../components/ConfirmDialog'
import Pagination from '../../components/Pagination'
import { Estabelecimento } from '../../types'

const PAGE_SIZES = [15, 25, 50, 100, 200]

const selectClass = "appearance-none border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-700 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat focus:outline-none focus:ring-2 focus:ring-slate-300"

export default function LocalizacaoListPage() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin === true
  const { estabelecimento: estabelecimentoAtual } = useWorkspace()
  const queryClient = useQueryClient()
  const [filtroStatus, setFiltroStatus] = useState<string>('true')
  const [filtroEstabelecimento, setFiltroEstabelecimento] = useState<string>('')
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [adminEmpresaId, setAdminEmpresaId] = useState('')
  const [adminEstabelecimentoId, setAdminEstabelecimentoId] = useState('')

  const ativoParam = filtroStatus === '' ? undefined : filtroStatus === 'true'
  const estabelecimentoIdParam = isAdmin ? (adminEstabelecimentoId || undefined) : (filtroEstabelecimento || undefined)

  const { data: empresasAdmin = [] } = useQuery({
    queryKey: ['empresas-admin-filter'],
    queryFn: () => getEmpresas(),
    enabled: isAdmin,
  })

  const { data: estabelecimentosAdmin = [] } = useQuery({
    queryKey: ['estabelecimentos-admin-filter', adminEmpresaId],
    queryFn: () => getEstabelecimentos(undefined, adminEmpresaId),
    enabled: isAdmin && !!adminEmpresaId,
  })

  const { data: estabelecimentos = [] } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: () => getEstabelecimentos(true),
    enabled: !isAdmin,
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['localizacoes', filtroEstabelecimento, filtroStatus, adminEmpresaId, adminEstabelecimentoId],
    queryFn: () => getLocalizacoes(estabelecimentoIdParam, ativoParam),
  })

  const filtrados = items.filter(i => {
    const q = busca.toLowerCase()
    return !q || i.nome.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtrados.length / pageSize)
  const paginados = filtrados.slice((page - 1) * pageSize, page * pageSize)

  function handleBusca(v: string) { setBusca(v); setPage(1) }
  function handlePageSize(v: number) { setPageSize(v); setPage(1) }

  const [confirmando, setConfirmando] = useState<{ id: string; nome: string } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: deleteLocalizacao,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['localizacoes'] }); setConfirmando(null) },
  })

  const reativarMutation = useMutation({
    mutationFn: reativarLocalizacao,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['localizacoes'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Localizações</h2>
          <p className="text-slate-500 text-sm mt-1">Gerencie as localizações dos estabelecimentos</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {!isAdmin && (
            <select value={filtroEstabelecimento} onChange={e => { setFiltroEstabelecimento(e.target.value); setPage(1) }} className={selectClass}>
              <option value="">Todos estabelecimentos</option>
              {estabelecimentoAtual && (
                <option value={estabelecimentoAtual.id}>{estabelecimentoAtual.nome} (atual)</option>
              )}
              {estabelecimentos
                .filter((e: Estabelecimento) => e.id !== estabelecimentoAtual?.id)
                .map((e: Estabelecimento) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          )}
          <select value={filtroStatus} onChange={e => { setFiltroStatus(e.target.value); setPage(1) }} className={selectClass}>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
            <option value="">Todos</option>
          </select>
          {user?.perfil === 'ENGENHEIRO' && (
            <Link to="/localizacoes/novo" className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
              <Plus size={16} /> Nova Localização
            </Link>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={busca}
            onChange={e => handleBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-gray-400"
          />
        </div>
        {isAdmin && (
          <>
            <select
              className="select-std"
              value={adminEmpresaId}
              onChange={e => { setAdminEmpresaId(e.target.value); setAdminEstabelecimentoId('') }}
            >
              <option value="">Todas as empresas</option>
              {empresasAdmin.map(e => (
                <option key={e.id} value={e.id}>{e.nomeFantasia || e.razaoSocial}</option>
              ))}
            </select>
            <select
              className="select-std disabled:opacity-40 disabled:cursor-not-allowed"
              value={adminEstabelecimentoId}
              disabled={!adminEmpresaId}
              onChange={e => setAdminEstabelecimentoId(e.target.value)}
            >
              <option value="">Todos os estabelecimentos</option>
              {estabelecimentosAdmin.map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </>
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
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{busca ? 'Nenhuma localização encontrada' : 'Nenhuma localização cadastrada'}</p>
        </div>
      ) : (
        <>
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
                {paginados.map(item => (
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
                          <Link to={`/localizacoes/${item.id}/editar`} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-gray-100 rounded"><Pencil size={15} /></Link>
                          {item.ativo ? (
                            <button onClick={() => setConfirmando({ id: item.id, nome: item.nome })} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                          ) : (
                            <button onClick={() => reativarMutation.mutate(item.id)} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded"><RotateCcw size={15} /></button>
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
        title="Desativar Localização"
        description="A localização ficará inativa e não aparecerá mais nas listagens."
        detail={confirmando && <p className="text-sm font-medium text-slate-700">{confirmando.nome}</p>}
        confirmLabel="Desativar"
        isLoading={deleteMutation.isPending}
        isError={deleteMutation.isError}
        onConfirm={() => confirmando && deleteMutation.mutate(confirmando.id)}
        onCancel={() => setConfirmando(null)}
      />
    </div>
  )
}
