import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getOcorrencias, OcorrenciaItem } from '../api/ocorrencia'
import { useAuth } from '../contexts/AuthContext'
import { Search, AlertTriangle, MapPin, Clock, Shield, FilePlus } from 'lucide-react'

type TipoFiltro = 'TODOS' | 'DESVIO' | 'NAO_CONFORMIDADE'
type StatusFiltro = 'TODOS' | 'AGUARDANDO_TRATATIVA' | 'AGUARDANDO_VALIDACAO' | 'CONCLUIDAS' | 'VENCIDAS'

export default function TrativasListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('TODOS')
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>('TODOS')

  const isEngenheiro = user?.perfil === 'ENGENHEIRO'

  const { data: ocorrencias = [], isLoading } = useQuery({
    queryKey: ['ocorrencias'],
    queryFn: getOcorrencias,
  })

  // Filtra por visibilidade: NCs só aparecem se o usuário é o eng responsável pela tratativa ou é ENGENHEIRO
  const visiveis = ocorrencias.filter(o => {
    if (o.tipo === 'DESVIO') return true
    return isEngenheiro || o.engResponsavelConstrutoraId === user?.id
  })

  function getStatusFiltroLabel(item: OcorrenciaItem): StatusFiltro {
    if (item.tipo === 'DESVIO') return 'CONCLUIDAS'
    if (item.status === 'ABERTA') return 'AGUARDANDO_TRATATIVA'
    if (item.status === 'EM_TRATAMENTO') return 'AGUARDANDO_VALIDACAO'
    if (item.status === 'CONCLUIDO') return 'CONCLUIDAS'
    if (item.status === 'NAO_RESOLVIDA') return 'VENCIDAS'
    const dias = getDiasRestantes(item.dataLimiteResolucao)
    if (dias !== null && dias < 0) return 'VENCIDAS'
    return 'TODOS'
  }

  const filtradas = visiveis.filter(o => {
    const matchTipo = filtroTipo === 'TODOS' || o.tipo === filtroTipo
    const matchBusca = busca === '' ||
      o.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (o.localizacao || '').toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'TODOS' || getStatusFiltroLabel(o) === filtroStatus
    return matchTipo && matchBusca && matchStatus
  })

  const contadores = {
    AGUARDANDO_TRATATIVA: visiveis.filter(o => getStatusFiltroLabel(o) === 'AGUARDANDO_TRATATIVA').length,
    AGUARDANDO_VALIDACAO: visiveis.filter(o => getStatusFiltroLabel(o) === 'AGUARDANDO_VALIDACAO').length,
    CONCLUIDAS: visiveis.filter(o => getStatusFiltroLabel(o) === 'CONCLUIDAS').length,
    VENCIDAS: visiveis.filter(o => getStatusFiltroLabel(o) === 'VENCIDAS').length,
  }

  function getDiasRestantes(dataLimite?: string) {
    if (!dataLimite) return null
    const limite = new Date(dataLimite)
    const hoje = new Date()
    const diff = Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  function getStatusInfo(item: OcorrenciaItem) {
    if (item.tipo === 'DESVIO') {
      return { label: 'Concluído', color: 'text-green-600 bg-green-50' }
    }
    if (item.status === 'CONCLUIDO') return { label: 'Concluído', color: 'text-green-600 bg-green-50' }
    if (item.status === 'NAO_RESOLVIDA') return { label: 'Vencida', color: 'text-red-600 bg-red-50' }
    if (item.status === 'EM_TRATAMENTO') return { label: 'Aguardando Validação', color: 'text-blue-600 bg-blue-50' }
    const dias = getDiasRestantes(item.dataLimiteResolucao)
    if (dias !== null && dias < 0) return { label: 'Vencida', color: 'text-red-600 bg-red-50' }
    return { label: 'Aguardando Tratativa', color: 'text-yellow-600 bg-yellow-50' }
  }

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('pt-BR')
  }

  const statusTabs: { key: StatusFiltro; label: string; count?: number; activeColor: string }[] = [
    { key: 'TODOS', label: 'Todos', activeColor: 'bg-slate-800 text-white' },
    { key: 'AGUARDANDO_TRATATIVA', label: 'Aguardando Tratativa', count: contadores.AGUARDANDO_TRATATIVA, activeColor: 'bg-yellow-600 text-white' },
    { key: 'AGUARDANDO_VALIDACAO', label: 'Aguardando Validação', count: contadores.AGUARDANDO_VALIDACAO, activeColor: 'bg-blue-600 text-white' },
    { key: 'CONCLUIDAS', label: 'Concluídos', count: contadores.CONCLUIDAS, activeColor: 'bg-green-600 text-white' },
    { key: 'VENCIDAS', label: 'Vencidas', count: contadores.VENCIDAS, activeColor: 'bg-red-600 text-white' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Tratativas</h2>
          <p className="text-sm text-slate-500">{filtradas.length} ocorrências registradas</p>
        </div>
      </div>

      {/* Search + tipo filters */}
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
          {(['TODOS', 'DESVIO', 'NAO_CONFORMIDADE'] as TipoFiltro[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltroTipo(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${filtroTipo === f ? 'bg-slate-800 text-white' : 'text-slate-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {f === 'TODOS' ? 'Todos' : f === 'DESVIO' ? 'Desvios' : 'NCs'}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap overflow-x-auto pb-1">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFiltroStatus(tab.key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
              filtroStatus === tab.key
                ? tab.activeColor
                : 'text-slate-600 border border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filtroStatus === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
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
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3 sm:gap-5">
                {/* Thumbnail - hidden on mobile */}
                <div className="hidden sm:flex w-24 h-20 bg-gray-100 rounded-lg flex-shrink-0 items-center justify-center">
                  <div className="space-y-1 px-2 w-full">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-1.5 bg-gray-200 rounded" style={{ width: `${60 + i * 10}%` }} />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <AlertTriangle size={16} className={item.tipo === 'DESVIO' ? 'text-yellow-400' : 'text-red-400'} />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.tipo === 'DESVIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {item.tipo === 'DESVIO' ? 'Desvio' : 'NC'}
                    </span>
                    {item.regraDeOuro && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                        <Shield size={10} /> Regra de Ouro
                      </span>
                    )}
                    <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 truncate">{item.titulo}</div>
                  <div className="text-sm text-slate-500 truncate">{item.descricao}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                    {item.localizacao && <span className="flex items-center gap-1"><MapPin size={11} />{item.localizacao}</span>}
                    <span className="flex items-center gap-1"><Clock size={11} />{formatDate(item.dataRegistro)}</span>
                    {dias !== null && item.status !== 'CONCLUIDO' && dias >= 0 && (
                      <span className="text-green-600">{dias}d restantes</span>
                    )}
                  </div>
                </div>

                {/* Right side - desktop */}
                <button
                  onClick={() => navigate(`/tratativas/${item.tipo}/${item.id}`)}
                  className="hidden sm:block text-sm text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition whitespace-nowrap flex-shrink-0"
                >
                  Ver Tratativa →
                </button>
              </div>
              {/* Mobile button */}
              <button
                onClick={() => navigate(`/tratativas/${item.tipo}/${item.id}`)}
                className="sm:hidden w-full mt-3 text-sm text-slate-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-center"
              >
                Ver Tratativa →
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
