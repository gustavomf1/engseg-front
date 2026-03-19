import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDesvio, resolverDesvio } from '../api/desvio'
import { getNaoConformidade, registrarDevolutiva } from '../api/naoConformidade'
import { ArrowLeft, MapPin, Calendar, Shield, AlertTriangle, FileText, Upload } from 'lucide-react'

export default function TrativaDetailPage() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [planoAcao, setPlanoAcao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)

  const isDesvio = tipo === 'DESVIO'

  const { data: desvio } = useQuery({
    queryKey: ['desvio', id],
    queryFn: () => getDesvio(id!),
    enabled: isDesvio,
  })

  const { data: nc } = useQuery({
    queryKey: ['nc', id],
    queryFn: () => getNaoConformidade(id!),
    enabled: !isDesvio,
  })

  const ocorrencia = isDesvio ? desvio : nc

  const mutation = useMutation({
    mutationFn: async () => {
      if (isDesvio) {
        return resolverDesvio(id!)
      } else {
        return registrarDevolutiva(id!, { descricaoPlanoAcao: planoAcao })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
      queryClient.invalidateQueries({ queryKey: [isDesvio ? 'desvio' : 'nc', id] })
      navigate('/tratativas')
    },
  })

  function getDiasRestantes(dataLimite?: string) {
    if (!dataLimite) return null
    const limite = new Date(dataLimite)
    const hoje = new Date()
    return Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  }

  function formatDate(dt?: string) {
    if (!dt) return '-'
    return new Date(dt).toLocaleDateString('pt-BR')
  }

  if (!ocorrencia) {
    return <div className="text-center py-12 text-slate-400">Carregando...</div>
  }

  const dias = !isDesvio ? getDiasRestantes((nc as any)?.dataLimiteResolucao) : null

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/tratativas')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDesvio ? 'bg-yellow-100' : 'bg-red-100'}`}>
              {isDesvio ? <AlertTriangle size={20} className="text-yellow-500" /> : <FileText size={20} className="text-red-500" />}
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDesvio ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {isDesvio ? 'Desvio' : 'Não Conformidade'}
            </span>
          </div>
          {(ocorrencia as any).regraDeOuro && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
              <Shield size={12} /> Regra de Ouro
            </span>
          )}
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-5">{(ocorrencia as any).titulo}</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Left info */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><MapPin size={12} /> Localização</div>
              <div className="text-sm text-slate-700">{(ocorrencia as any).localizacao}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Calendar size={12} /> Data de Registro</div>
              <div className="text-sm text-slate-700">{formatDate((ocorrencia as any).dataRegistro)}</div>
            </div>
            {!isDesvio && (nc as any)?.dataLimiteResolucao && (
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><Calendar size={12} /> Data Limite</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">{formatDate((nc as any).dataLimiteResolucao)}</span>
                  {dias !== null && dias >= 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{dias} dias restantes</span>
                  )}
                </div>
              </div>
            )}
            {!isDesvio && (nc as any)?.nrRelacionada && (
              <div>
                <div className="text-xs text-slate-400 mb-1">Norma/Regra Violada</div>
                <div className="text-sm text-slate-700">{(nc as any).nrRelacionada}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-400 mb-1">Descrição</div>
              <div className="text-sm text-slate-700">{(ocorrencia as any).descricao}</div>
            </div>
          </div>

          {/* Right: evidence placeholder */}
          <div>
            <div className="text-xs text-slate-400 mb-2">Evidência Fotográfica</div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center text-slate-300 space-y-2 px-4 w-full">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-2 bg-gray-200 rounded mx-auto" style={{ width: `${40 + i * 12}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Treatment form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-1">Plano de Ação e Tratativa</h3>
        <p className="text-sm text-blue-500 mb-5">Preencha o plano de ação para resolver esta ocorrência</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Plano de Ação *</label>
            <textarea
              value={planoAcao}
              onChange={e => setPlanoAcao(e.target.value)}
              rows={4}
              placeholder="Descreva detalhadamente as ações que serão tomadas para resolver esta ocorrência..."
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:bg-white transition"
            />
            <p className="text-xs text-blue-400 mt-1">Inclua: ações corretivas, responsáveis, prazos específicos e recursos necessários</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Evidência da Solução *</label>
            <p className="text-xs text-slate-400 mb-2">Anexe foto ou documento comprovando a implementação da solução</p>
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition">
              <input
                type="file"
                accept="image/png,image/jpg,image/jpeg,application/pdf"
                className="hidden"
                onChange={e => setArquivo(e.target.files?.[0] ?? null)}
              />
              <Upload size={28} className="mx-auto text-gray-400 mb-2" />
              {arquivo ? (
                <div className="text-sm text-slate-700 font-medium">{arquivo.name}</div>
              ) : (
                <>
                  <div className="text-sm text-blue-500 font-medium">Clique para anexar evidência</div>
                  <div className="text-xs text-gray-400 mt-1">PNG, JPG ou PDF até 10MB</div>
                </>
              )}
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/tratativas')}
              className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || (!isDesvio && !planoAcao.trim())}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {mutation.isPending ? 'Enviando...' : '✓ Enviar Tratativa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
