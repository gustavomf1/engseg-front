import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getDesvio } from '../../api/desvio'
import StatusBadge from '../../components/StatusBadge'
import { ArrowLeft, Shield } from 'lucide-react'

const formatDateTime = (d: string) => new Date(d).toLocaleString('pt-BR')

export default function DesvioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: desvio, isLoading } = useQuery({
    queryKey: ['desvio', id],
    queryFn: () => getDesvio(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <div className="text-slate-400 py-8 text-center">Carregando...</div>
  }

  if (!desvio) {
    return <div className="text-red-500 py-8 text-center">Desvio não encontrado</div>
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Desvio</h2>
            <StatusBadge status={desvio.status} type="desvio" />
            {desvio.regraDeOuro && (
              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                <Shield size={12} />
                Regra de Ouro
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Estabelecimento</p>
            <p className="text-slate-800 font-medium">{desvio.estabelecimentoNome}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Técnico</p>
            <p className="text-slate-800">{desvio.tecnicoNome || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Data de Registro</p>
            <p className="text-slate-800">{formatDateTime(desvio.dataRegistro)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Status</p>
            <StatusBadge status={desvio.status} type="desvio" />
          </div>
          <div className="sm:col-span-2">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Descrição do Desvio</p>
            <p className="text-slate-800">{desvio.descricao}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Orientação Realizada</p>
            <p className="text-slate-800">{desvio.orientacaoRealizada}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
