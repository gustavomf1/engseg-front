import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDesvio, resolverDesvio } from '../api/desvio'
import { getNaoConformidade, registrarDevolutiva, validarNaoConformidade } from '../api/naoConformidade'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, MapPin, Calendar, Shield, AlertTriangle, FileText, Upload, CheckCircle, XCircle, Clock, Ban } from 'lucide-react'

export default function TrativaDetailPage() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [planoAcao, setPlanoAcao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [observacao, setObservacao] = useState('')

  const isDesvio = tipo === 'DESVIO'
  const isEngenheiro = user?.perfil === 'ENGENHEIRO'

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

  const podeValidar = isEngenheiro || (nc?.engResponsavelVerificacaoId != null && nc.engResponsavelVerificacaoId === user?.id)

  const ocorrencia = isDesvio ? desvio : nc

  const mutationDevolutiva = useMutation({
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

  const mutationValidacao = useMutation({
    mutationFn: (parecer: 'APROVADO' | 'REPROVADO') =>
      validarNaoConformidade(id!, { parecer, observacao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
      queryClient.invalidateQueries({ queryKey: ['nc', id] })
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
  const ncStatus = !isDesvio ? (nc as any)?.status : null
  const desvioStatus = isDesvio ? (desvio as any)?.status : null

  // Determine which bottom section to render
  function renderBottomSection() {
    // Desvio já resolvido
    if (isDesvio && desvioStatus === 'RESOLVIDO') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle size={32} className="text-green-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">Desvio Resolvido</div>
            <div className="text-sm text-green-600 mt-0.5">Este desvio foi resolvido e encerrado com sucesso.</div>
          </div>
        </div>
      )
    }

    // NC Concluída
    if (!isDesvio && ncStatus === 'CONCLUIDA') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle size={32} className="text-green-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">Não Conformidade Concluída</div>
            <div className="text-sm text-green-600 mt-0.5">Esta ocorrência foi tratada e validada com sucesso.</div>
            {nc?.validacao && (
              <div className="mt-2 text-sm text-green-700">
                <span className="font-medium">Validado por:</span> {nc.validacao.engenheiroNome ?? '-'}
                {nc.validacao.observacao && <span className="ml-2">— {nc.validacao.observacao}</span>}
              </div>
            )}
          </div>
        </div>
      )
    }

    // NC Não Resolvida (vencida)
    if (!isDesvio && ncStatus === 'NAO_RESOLVIDA') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <Ban size={32} className="text-red-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-red-800 text-base">Prazo Vencido</div>
            <div className="text-sm text-red-600 mt-0.5">O prazo para resolução desta não conformidade expirou sem tratativa.</div>
          </div>
        </div>
      )
    }

    // NC EM_TRATAMENTO + responsável pela verificação → validar
    if (!isDesvio && ncStatus === 'EM_TRATAMENTO' && podeValidar) {
      const devolutiva = nc?.devolutivas?.[nc.devolutivas.length - 1]
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-1">Validação da Tratativa</h3>
          <p className="text-sm text-blue-500 mb-5">Revise o plano de ação enviado e aprove ou rejeite a tratativa</p>

          {devolutiva && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
              <div className="text-xs text-blue-500 font-medium mb-1">Plano de Ação Enviado</div>
              <div className="text-sm text-slate-700">{devolutiva.descricaoPlanoAcao}</div>
              <div className="text-xs text-slate-400 mt-1">
                Registrado por {devolutiva.engenheiroNome ?? 'responsável'} em {formatDate(devolutiva.dataDevolutiva)}
              </div>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">Observação (opcional)</label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={3}
              placeholder="Adicione uma observação sobre sua decisão..."
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/tratativas')}
              className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => mutationValidacao.mutate('REPROVADO')}
              disabled={mutationValidacao.isPending}
              className="flex-1 bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              <XCircle size={16} />
              {mutationValidacao.isPending ? 'Enviando...' : 'Reprovar'}
            </button>
            <button
              onClick={() => mutationValidacao.mutate('APROVADO')}
              disabled={mutationValidacao.isPending}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              {mutationValidacao.isPending ? 'Enviando...' : 'Aprovar'}
            </button>
          </div>
        </div>
      )
    }

    // NC EM_TRATAMENTO + sem permissão para validar → aguardando validação
    if (!isDesvio && ncStatus === 'EM_TRATAMENTO' && !podeValidar) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center gap-4">
          <Clock size={32} className="text-blue-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-blue-800 text-base">Aguardando Validação do Engenheiro</div>
            <div className="text-sm text-blue-600 mt-0.5">O plano de ação foi enviado e está sendo analisado pelo engenheiro responsável.</div>
          </div>
        </div>
      )
    }

    // NC ABERTA ou Desvio REGISTRADO → formulário de tratativa
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-1">Plano de Ação e Tratativa</h3>
        <p className="text-sm text-blue-500 mb-5">Preencha o plano de ação para resolver esta ocorrência</p>

        <div className="space-y-4">
          {!isDesvio && (
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
          )}

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
              onClick={() => mutationDevolutiva.mutate()}
              disabled={mutationDevolutiva.isPending || (!isDesvio && !planoAcao.trim())}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {mutationDevolutiva.isPending ? 'Enviando...' : '✓ Enviar Tratativa'}
            </button>
          </div>
        </div>
      </div>
    )
  }

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

      {/* Bottom section — conditional */}
      {renderBottomSection()}
    </div>
  )
}
