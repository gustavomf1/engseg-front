import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getOcorrencias, OcorrenciaItem, deleteNaoConformidade, deleteDesvio } from '../api/ocorrencia'
import { useAuth } from '../contexts/AuthContext'
import { Search, AlertTriangle, MapPin, Clock, Shield, FilePlus, Trash2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { formatDate } from '../utils/date'

export default function OcorrenciasPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'TODOS' | 'DESVIO' | 'NAO_CONFORMIDADE'>('TODOS')
  const [excluindo, setExcluindo] = useState<OcorrenciaItem | null>(null)

  const isTecnico = user?.perfil === 'TECNICO'

  const { data: ocorrencias = [], isLoading } = useQuery({
    queryKey: ['ocorrencias'],
    queryFn: getOcorrencias,
  })

  const deleteMutation = useMutation({
    mutationFn: (item: OcorrenciaItem) =>
      item.tipo === 'DESVIO' ? deleteDesvio(item.id) : deleteNaoConformidade(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setExcluindo(null)
    },
  })

  const filtradas = ocorrencias.filter(o => {
    const matchTipo = filtro === 'TODOS' || o.tipo === filtro
    const matchBusca = busca === '' ||
      o.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (o.localizacao || '').toLowerCase().includes(busca.toLowerCase())
    return matchTipo && matchBusca
  })

  function getStatusLabel(item: OcorrenciaItem) {
    if (item.tipo === 'DESVIO') {
      return { label: 'Concluído', color: 'text-green-600 bg-green-50' }
    }
    const map: Record<string, { label: string; color: string }> = {
      ABERTA: { label: 'Aberta', color: 'text-yellow-600 bg-yellow-50' },
      AGUARDANDO_APROVACAO_PLANO: { label: 'Aguard. Aprovação', color: 'text-blue-600 bg-blue-50' },
      EM_AJUSTE_PELO_EXTERNO: { label: 'Em Ajuste', color: 'text-orange-600 bg-orange-50' },
      EM_EXECUCAO: { label: 'Em Execução', color: 'text-purple-600 bg-purple-50' },
      AGUARDANDO_VALIDACAO_FINAL: { label: 'Aguard. Validação', color: 'text-indigo-600 bg-indigo-50' },
      CONCLUIDO: { label: 'Concluído', color: 'text-green-600 bg-green-50' },
      EM_TRATAMENTO: { label: 'Em Tratamento', color: 'text-blue-600 bg-blue-50' },
      NAO_RESOLVIDA: { label: 'Não Resolvida', color: 'text-red-600 bg-red-50' },
    }
    return map[item.status] ?? { label: item.status, color: 'text-slate-600 bg-slate-100' }
  }

  function podeExcluir(item: OcorrenciaItem) {
    // Técnico só pode excluir NC com status ABERTA; desvio só engenheiro pode excluir
    if (isTecnico && item.tipo === 'DESVIO') {
      return false
    }
    if (isTecnico && item.tipo === 'NAO_CONFORMIDADE' && item.status !== 'ABERTA') {
      return false
    }
    return true
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ocorrências</h2>
          <p className="text-sm text-slate-500">{filtradas.length} ocorrências registradas</p>
        </div>
        <button
          onClick={() => navigate('/ocorrencias/nova')}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          <FilePlus size={16} /> Nova Ocorrência
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por título ou localização..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['TODOS', 'DESVIO', 'NAO_CONFORMIDADE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${filtro === f ? 'bg-slate-800 text-white' : 'text-slate-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {f === 'TODOS' ? 'Todos' : f === 'DESVIO' ? 'Desvios' : 'NCs'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading && <div className="text-center text-slate-400 py-12">Carregando...</div>}
      {!isLoading && filtradas.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-slate-400">
          Nenhuma ocorrência encontrada
        </div>
      )}
      <div className="space-y-3">
        {filtradas.map(item => {
          const statusInfo = getStatusLabel(item)
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3 sm:gap-5">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.tipo === 'DESVIO' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <AlertTriangle size={18} className={item.tipo === 'DESVIO' ? 'text-yellow-500' : 'text-red-500'} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.tipo === 'DESVIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {item.tipo === 'DESVIO' ? 'Desvio' : 'Não Conformidade'}
                    </span>
                    {item.regraDeOuro && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                        <Shield size={10} /> Regra de Ouro
                      </span>
                    )}
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {item.vencida && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                        Vencida
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-800 truncate">{item.titulo}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                    {item.localizacao && <span className="flex items-center gap-1"><MapPin size={11} />{item.localizacao}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} />{formatDate(item.dataRegistro)}</span>
                    <span className="text-slate-300 hidden sm:inline">{item.estabelecimentoNome}</span>
                  </div>
                </div>

                {/* Right - desktop */}
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  {podeExcluir(item) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExcluindo(item) }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/ocorrencias/${item.tipo}/${item.id}`)}
                    className="flex items-center gap-1.5 text-sm text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    Ver detalhes →
                  </button>
                </div>
              </div>
              {/* Mobile buttons */}
              <div className="sm:hidden flex gap-2 mt-3">
                <button
                  onClick={() => navigate(`/ocorrencias/${item.tipo}/${item.id}`)}
                  className="flex-1 text-sm text-slate-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-center"
                >
                  Ver detalhes →
                </button>
                {podeExcluir(item) && (
                  <button
                    onClick={() => setExcluindo(item)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg transition"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!excluindo}
        title="Excluir Ocorrência"
        detail={excluindo && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${excluindo.tipo === 'DESVIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {excluindo.tipo === 'DESVIO' ? 'Desvio' : 'NC'}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700">{excluindo.titulo}</p>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(excluindo.dataRegistro)}</p>
          </div>
        )}
        confirmLabel="Excluir"
        isLoading={deleteMutation.isPending}
        isError={deleteMutation.isError}
        onConfirm={() => excluindo && deleteMutation.mutate(excluindo)}
        onCancel={() => setExcluindo(null)}
      />
    </div>
  )
}
