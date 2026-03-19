import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getOcorrencias, OcorrenciaItem } from '../api/ocorrencia'
import { Search, AlertTriangle, MapPin, Clock, Shield, FilePlus } from 'lucide-react'

export default function TrativasListPage() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'TODOS' | 'DESVIO' | 'NAO_CONFORMIDADE'>('TODOS')

  const { data: ocorrencias = [], isLoading } = useQuery({
    queryKey: ['ocorrencias'],
    queryFn: getOcorrencias,
  })

  const filtradas = ocorrencias.filter(o => {
    const matchFiltro = filtro === 'TODOS' || o.tipo === filtro
    const matchBusca = busca === '' ||
      o.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      o.localizacao.toLowerCase().includes(busca.toLowerCase())
    return matchFiltro && matchBusca
  })

  function getDiasRestantes(dataLimite?: string) {
    if (!dataLimite) return null
    const limite = new Date(dataLimite)
    const hoje = new Date()
    const diff = Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  function getStatusInfo(item: OcorrenciaItem) {
    if (item.tipo === 'DESVIO') {
      if (item.status === 'RESOLVIDO') return { label: 'Resolvido', color: 'text-green-600 bg-green-50' }
      return { label: 'Pendente', color: 'text-yellow-600 bg-yellow-50' }
    }
    if (item.status === 'CONCLUIDA') return { label: 'Concluída', color: 'text-gray-600 bg-gray-100' }
    if (item.status === 'NAO_RESOLVIDA') return { label: 'Vencida', color: 'text-red-600 bg-red-50' }
    const dias = getDiasRestantes(item.dataLimiteResolucao)
    if (dias !== null && dias >= 0) return { label: 'No Prazo', color: 'text-green-600 bg-green-50' }
    return { label: 'Vencida', color: 'text-red-600 bg-red-50' }
  }

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Tratativas</h2>
          <p className="text-sm text-slate-500">{filtradas.length} ocorrências registradas</p>
        </div>
        <button
          onClick={() => navigate('/registro-ocorrencia')}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          <FilePlus size={16} /> Nova Ocorrência
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por título ou localização..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['TODOS', 'DESVIO', 'NAO_CONFORMIDADE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filtro === f ? 'bg-slate-800 text-white' : 'text-slate-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {f === 'TODOS' ? 'Todos' : f === 'DESVIO' ? 'Desvios' : 'Não Conformidades'}
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
          const statusInfo = getStatusInfo(item)
          const dias = item.tipo === 'NAO_CONFORMIDADE' ? getDiasRestantes(item.dataLimiteResolucao) : null

          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5 shadow-sm">
              {/* Thumbnail placeholder */}
              <div className="w-24 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                <div className="space-y-1 px-2 w-full">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-1.5 bg-gray-200 rounded" style={{ width: `${60 + i * 10}%` }} />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className={item.tipo === 'DESVIO' ? 'text-yellow-400' : 'text-red-400'} />
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.tipo === 'DESVIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {item.tipo === 'DESVIO' ? 'Desvio' : 'Não Conformidade'}
                  </span>
                  {item.regraDeOuro && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                      <Shield size={10} /> Regra de Ouro
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-800">{item.titulo}</div>
                <div className="text-sm text-slate-500 truncate">{item.descricao}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={11} />{item.localizacao}</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{formatDate(item.dataRegistro)}</span>
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                  ✓ {statusInfo.label}
                </span>
                {dias !== null && item.status !== 'CONCLUIDA' && (
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Prazo:</div>
                    <div className="text-xs font-medium text-slate-600">
                      {item.dataLimiteResolucao ? new Date(item.dataLimiteResolucao).toLocaleDateString('pt-BR') : '-'}
                    </div>
                    {dias >= 0 && (
                      <div className="text-xs text-green-600">{dias} dias restantes</div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => navigate(`/tratativas/${item.tipo}/${item.id}`)}
                  className="text-sm text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
                >
                  Ver Tratativa →
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
