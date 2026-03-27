import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDesvio } from '../api/desvio'
import { getNaoConformidade, registrarDevolutiva, validarNaoConformidade } from '../api/naoConformidade'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft, MapPin, Calendar, Shield, AlertTriangle, FileText,
  CheckCircle, XCircle, Clock, Ban, Eye, Building2, User, BookOpen, RefreshCw
} from 'lucide-react'
import EvidenciaUpload from '../components/EvidenciaUpload'
import StatusBadge from '../components/StatusBadge'
import SeveridadeBadge from '../components/SeveridadeBadge'
import { formatDate, formatDateTime } from '../utils/date'

export default function TrativaDetailPage() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [planoAcao, setPlanoAcao] = useState('')
  const [observacao, setObservacao] = useState('')
  const [confirmarEnvio, setConfirmarEnvio] = useState(false)
  const [normaAberta, setNormaAberta] = useState<string | null>(null)

  const toggleNorma = useCallback((id: string) => {
    setNormaAberta(prev => prev === id ? null : id)
  }, [])

  const isDesvio = tipo === 'DESVIO'
  const isEngenheiro = user?.perfil === 'ENGENHEIRO'
  const isExterno = user?.perfil === 'EXTERNO'

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
    queryClient.invalidateQueries({ queryKey: [isDesvio ? 'desvio' : 'nc', id] })
  }

  const mutationDevolutiva = useMutation({
    mutationFn: async () => {
      return registrarDevolutiva(id!, { descricaoPlanoAcao: planoAcao })
    },
    onSuccess: () => {
      invalidate()
      setPlanoAcao('')
    },
  })

  const mutationValidacao = useMutation({
    mutationFn: (parecer: 'APROVADO' | 'REPROVADO') =>
      validarNaoConformidade(id!, { parecer, observacao }),
    onSuccess: () => {
      invalidate()
      navigate('/tratativas')
    },
  })

  function getDiasRestantes(dataLimite?: string) {
    if (!dataLimite) return null
    const limite = new Date(dataLimite)
    const hoje = new Date()
    return Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  }

  const ocorrencia = isDesvio ? desvio : nc

  if (!ocorrencia) {
    return <div className="text-center py-12 text-slate-400">Carregando...</div>
  }

  const dias = !isDesvio ? getDiasRestantes(nc?.dataLimiteResolucao) : null
  const prazoVencido = dias !== null && dias < 0 && nc?.status !== 'CONCLUIDO'

  const showDevolutivaForm = !isDesvio && nc?.status === 'ABERTA' && isExterno
  const showExecucaoForm = false // externo não pode criar execução enquanto engenheiro não validar
  const showAguardandoValidacao = !isDesvio && nc?.status === 'EM_TRATAMENTO' && isExterno
  const showValidacaoForm = !isDesvio && nc?.status === 'EM_TRATAMENTO' && podeValidar

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/tratativas')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDesvio ? 'bg-yellow-100' : 'bg-red-100'}`}>
              {isDesvio ? <AlertTriangle size={20} className="text-yellow-500" /> : <FileText size={20} className="text-red-500" />}
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDesvio ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {isDesvio ? 'Desvio' : 'Não Conformidade'}
            </span>
            {!isDesvio && nc && (
              <>
                <StatusBadge status={nc.status} type="nc" />
                <SeveridadeBadge nivel={nc.nivelSeveridade} />
                {nc.vencida && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                    Vencida
                  </span>
                )}
              </>
            )}
            {isDesvio && desvio && (
              <StatusBadge status={desvio.status} type="desvio" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(ocorrencia as any).regraDeOuro && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 flex items-center gap-1">
                <Shield size={12} /> Regra de Ouro
              </span>
            )}
            {!isDesvio && nc?.reincidencia && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                <RefreshCw size={12} /> Reincidência
              </span>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-5">{(ocorrencia as any).titulo}</h2>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><Building2 size={11} /> Estabelecimento</p>
            <p className="text-slate-800 font-medium">{(ocorrencia as any).estabelecimentoNome}</p>
          </div>
          {(ocorrencia as any).localizacaoNome && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><MapPin size={11} /> Localização</p>
              <p className="text-slate-800 font-medium">{(ocorrencia as any).localizacaoNome}</p>
            </div>
          )}
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><Calendar size={11} /> Data de Registro</p>
            <p className="text-slate-800">{formatDateTime((ocorrencia as any).dataRegistro)}</p>
          </div>
          {!isDesvio && nc?.dataLimiteResolucao && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><Calendar size={11} /> Prazo para Resolução</p>
              <div className="flex items-center gap-2">
                <p className={`font-medium ${prazoVencido ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatDate(nc.dataLimiteResolucao)}
                </p>
                {dias !== null && dias >= 0 && nc.status !== 'CONCLUIDO' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{dias} dias restantes</span>
                )}
                {prazoVencido && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Vencido</span>
                )}
              </div>
            </div>
          )}
          {(ocorrencia as any).tecnicoNome && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><User size={11} /> Usuário de Registro</p>
              <p className="text-slate-800">{(ocorrencia as any).tecnicoNome}</p>
            </div>
          )}
          {!isDesvio && nc?.engConstruturaNome && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><User size={11} /> Eng. Responsável pela Tratativa</p>
              <p className="text-slate-800">{nc.engConstruturaNome}{nc.engConstrutoraEmail ? ` (${nc.engConstrutoraEmail})` : ''}</p>
            </div>
          )}
          {!isDesvio && nc?.engVerificacaoNome && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><User size={11} /> Eng. Responsável</p>
              <p className="text-slate-800">{nc.engVerificacaoNome}{nc.engVerificacaoEmail ? ` (${nc.engVerificacaoEmail})` : ''}</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Descrição</p>
            <p className="text-slate-800 whitespace-pre-wrap break-words overflow-hidden">{(ocorrencia as any).descricao}</p>
          </div>
          {isDesvio && desvio?.orientacaoRealizada && (
            <div className="sm:col-span-2">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Orientação Realizada</p>
              <p className="text-slate-800 whitespace-pre-wrap">{desvio.orientacaoRealizada}</p>
            </div>
          )}
        </div>

        {/* Normas Vinculadas (dentro do card) */}
        {!isDesvio && nc && nc.normas.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-indigo-500" />
              <h3 className="font-semibold text-slate-700">Normas Vinculadas</h3>
            </div>
            <div className="space-y-2">
              {nc.normas.map(n => (
                <div key={n.id} className="border border-indigo-100 rounded-lg bg-indigo-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleNorma(n.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-indigo-100/50 transition"
                  >
                    <span className="text-sm font-medium text-slate-800">{n.titulo}</span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${normaAberta === n.id ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {normaAberta === n.id && n.descricao && (
                    <div className="px-3 pb-3 border-t border-indigo-100">
                      <p className="text-xs text-slate-600 mt-2 break-words whitespace-pre-wrap">{n.descricao}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidências da Ocorrência (dentro do card) */}
        {!isDesvio && id && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="OCORRENCIA" readOnly titulo="Evidências da Ocorrência" />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RASTRO DE REINCIDÊNCIAS */}
      {!isDesvio && nc && (nc.reincidencia || (nc.reincidencias?.length ?? 0) > 0) && (
        <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={15} className="text-orange-500" />
            <h3 className="font-semibold text-slate-700">Rastro de Reincidências</h3>
            <span className="text-xs text-slate-400">
              ({(nc.cadeiaReincidencias?.length ?? 0) + 1 + (nc.reincidencias?.length ?? 0)} ocorrência(s) no total)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {nc.cadeiaReincidencias?.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium max-w-[180px] truncate" title={item.titulo}>
                  {item.titulo}
                </span>
                <span className="text-slate-300 text-sm">→</span>
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-md bg-orange-600 text-white text-xs font-semibold ring-2 ring-orange-300 max-w-[180px] truncate" title={nc.titulo}>
              {nc.titulo}
            </span>
            {nc.reincidencias?.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <span className="text-slate-300 text-sm">→</span>
                <span className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium max-w-[180px] truncate" title={item.titulo}>
                  {item.titulo}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HISTÓRICO - Devolutivas */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!isDesvio && nc && nc.devolutivas.length > 0 && !showAguardandoValidacao && !showValidacaoForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-700">Tratativa / Plano de Ação</h3>
          </div>
          <div className="space-y-3">
            {nc.devolutivas.map(d => (
              <div key={d.id} className="border border-blue-100 rounded-lg p-4 bg-blue-50">
                <p className="text-sm text-slate-800 break-words">{d.descricaoPlanoAcao}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatDateTime(d.dataDevolutiva)}{d.engenheiroNome ? ` — ${d.engenheiroNome}` : ''}
                </p>
              </div>
            ))}
          </div>
          {id && (
            <div className="mt-4">
              <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="TRATATIVA" readOnly titulo="Evidências da Tratativa" />
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HISTÓRICO - Execuções de Ação */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!isDesvio && nc && nc.execucoes.length > 0 && !showAguardandoValidacao && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-purple-500" />
            <h3 className="font-semibold text-slate-700">Execuções de Ação</h3>
          </div>
          <div className="space-y-3">
            {nc.execucoes.map(e => (
              <div key={e.id} className="border border-purple-100 rounded-lg p-4 bg-purple-50">
                <p className="text-sm text-slate-800">{e.descricaoAcaoExecutada}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatDateTime(e.dataExecucao)}{e.engenheiroNome ? ` — ${e.engenheiroNome}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HISTÓRICO - Validação */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!isDesvio && nc && nc.validacoes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-green-500" />
            <h3 className="font-semibold text-slate-700">Histórico de Validações</h3>
          </div>
          <div className="space-y-3">
            {nc.validacoes.map(v => (
              <div key={v.id} className={`border rounded-lg p-4 ${v.parecer === 'APROVADO' ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.parecer === 'APROVADO' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {v.parecer === 'APROVADO' ? 'Aprovado' : 'Reprovado'}
                  </span>
                </div>
                {v.observacao && <p className="text-sm text-slate-800 break-words overflow-hidden">{v.observacao}</p>}
                <p className="text-xs text-slate-500 mt-2">
                  {formatDateTime(v.dataValidacao)}{v.engenheiroNome ? ` — ${v.engenheiroNome}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SEÇÃO DE AÇÃO DO EXTERNO - em destaque */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Desvio - sempre concluído */}
      {isDesvio && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle size={32} className="text-green-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">Desvio Concluído</div>
            <div className="text-sm text-green-600 mt-0.5">Este desvio foi registrado e concluído automaticamente.</div>
          </div>
        </div>
      )}

      {/* NC ABERTA → Formulário de devolutiva (destaque para EXTERNO) */}
      {showDevolutivaForm && (
        <div className="bg-white rounded-xl border-2 border-blue-400 shadow-md p-6 ring-2 ring-blue-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText size={16} className="text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Registrar Devolutiva / Plano de Ação</h3>
          </div>
          <p className="text-sm text-blue-500 mb-5 ml-11">Preencha o plano de ação para resolver esta ocorrência</p>

          <div className="space-y-4">
            {nc?.reincidencia && (nc?.cadeiaReincidencias?.length ?? 0) > 0 && (
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <RefreshCw size={14} className="text-orange-600 shrink-0" />
                  <p className="text-sm font-bold text-orange-700">
                    Esta é a {(nc.cadeiaReincidencias?.length ?? 0) + 1}ª ocorrência do mesmo problema
                  </p>
                </div>
                <p className="text-xs text-orange-600 mb-2">As abordagens anteriores não resolveram o problema. Proponha uma solução diferente que ataque a causa raiz.</p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {nc.cadeiaReincidencias?.map((item) => (
                    <span key={item.id} className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-orange-100 border border-orange-200 text-orange-700 font-medium max-w-[140px] truncate" title={item.titulo}>
                        {item.titulo}
                      </span>
                      <span className="text-orange-300">→</span>
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-semibold max-w-[140px] truncate" title={nc.titulo}>
                    {nc.titulo}
                  </span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Plano de Ação *</label>
              <textarea
                value={planoAcao}
                onChange={e => setPlanoAcao(e.target.value)}
                rows={4}
                placeholder="Descreva detalhadamente as ações que serão tomadas para resolver esta ocorrência..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              />
              <p className="text-xs text-blue-400 mt-1">Inclua: ações corretivas, responsáveis, prazos específicos e recursos necessários</p>
            </div>

            {id && (
              <div>
                <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="TRATATIVA" titulo="Evidências da Tratativa" />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/tratativas')}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => setConfirmarEnvio(true)}
                disabled={!planoAcao.trim()}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <Eye size={16} /> Revisar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NC EM_TRATAMENTO + EXTERNO → Aguardando validação do engenheiro */}
      {showAguardandoValidacao && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-800">Aguardando Validação do Engenheiro</h3>
              <p className="text-sm text-amber-600">Sua tratativa foi enviada e está sendo analisada pelo engenheiro responsável.</p>
            </div>
          </div>

          {nc?.reincidencia && (nc?.cadeiaReincidencias?.length ?? 0) > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <RefreshCw size={14} className="text-orange-600 shrink-0" />
              <p className="text-xs text-orange-700 font-medium">
                Esta é a {(nc.cadeiaReincidencias?.length ?? 0) + 1}ª ocorrência — o engenheiro pode solicitar uma nova abordagem se considerar insuficiente.
              </p>
            </div>
          )}
          {nc?.devolutivas && nc.devolutivas.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Seu Plano de Ação</p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{nc.devolutivas[nc.devolutivas.length - 1].descricaoPlanoAcao}</p>
              <p className="text-xs text-slate-400 mt-2">
                Enviado em {formatDateTime(nc.devolutivas[nc.devolutivas.length - 1].dataDevolutiva)}
              </p>
            </div>
          )}

          {id && (
            <div className="bg-white border border-amber-200 rounded-lg p-4">
              <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="TRATATIVA" readOnly titulo="Evidências Enviadas" />
            </div>
          )}
        </div>
      )}

      {/* NC EM_TRATAMENTO + pode validar → Formulário de validação */}
      {showValidacaoForm && (
        <div className="bg-white rounded-xl border-2 border-green-400 shadow-md p-6 ring-2 ring-green-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Validação da Tratativa</h3>
          </div>
          <p className="text-sm text-green-600 mb-5 ml-11">Revise o plano de ação enviado e aprove ou rejeite a tratativa</p>

          {nc?.reincidencia && (nc?.cadeiaReincidencias?.length ?? 0) > 0 && (
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <RefreshCw size={14} className="text-orange-600 shrink-0" />
                <p className="text-sm font-bold text-orange-700">
                  Atenção: {(nc.cadeiaReincidencias?.length ?? 0) + 1}ª ocorrência do mesmo problema
                </p>
              </div>
              <p className="text-xs text-orange-600 mb-2">Verifique se o plano de ação proposto é diferente das tentativas anteriores e ataca a causa raiz.</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {nc.cadeiaReincidencias?.map((item) => (
                  <span key={item.id} className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-orange-100 border border-orange-200 text-orange-700 font-medium max-w-[140px] truncate" title={item.titulo}>
                      {item.titulo}
                    </span>
                    <span className="text-orange-300">→</span>
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-semibold max-w-[140px] truncate" title={nc.titulo}>
                  {nc.titulo}
                </span>
              </div>
            </div>
          )}

          {nc?.devolutivas && nc.devolutivas.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-5">
              <div className="text-xs text-blue-500 font-medium mb-1">Último Plano de Ação Enviado</div>
              <div className="text-sm text-slate-700 break-words overflow-hidden">{nc.devolutivas[nc.devolutivas.length - 1].descricaoPlanoAcao}</div>
              <div className="text-xs text-slate-400 mt-1">
                Registrado por {nc.devolutivas[nc.devolutivas.length - 1].engenheiroNome ?? 'responsável'} em {formatDate(nc.devolutivas[nc.devolutivas.length - 1].dataDevolutiva)}
              </div>
            </div>
          )}

          {id && (
            <div className="mb-5">
              <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="TRATATIVA" readOnly titulo="Evidências da Tratativa" />
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">Observação (opcional)</label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={3}
              placeholder="Adicione uma observação sobre sua decisão..."
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
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
      )}

      {/* NC EM_TRATAMENTO + sem permissão → aguardando */}
      {!isDesvio && nc?.status === 'EM_TRATAMENTO' && !podeValidar && !isExterno && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-center gap-4">
          <Clock size={32} className="text-blue-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-blue-800 text-base">Aguardando Validação do Engenheiro</div>
            <div className="text-sm text-blue-600 mt-0.5">O plano de ação foi enviado e está sendo analisado pelo engenheiro responsável.</div>
          </div>
        </div>
      )}

      {/* NC Concluída */}
      {!isDesvio && nc?.status === 'CONCLUIDO' && nc.validacoes.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle size={32} className="text-green-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">Não Conformidade Concluída</div>
            <div className="text-sm text-green-600 mt-0.5">Esta ocorrência foi tratada e validada com sucesso.</div>
          </div>
        </div>
      )}

      {/* NC Não Resolvida */}
      {!isDesvio && nc?.status === 'NAO_RESOLVIDA' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-4">
          <Ban size={32} className="text-red-500 flex-shrink-0" />
          <div>
            <div className="font-bold text-red-800 text-base">Prazo Vencido</div>
            <div className="text-sm text-red-600 mt-0.5">O prazo para resolução desta não conformidade expirou sem tratativa.</div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de envio (devolutiva) */}
      {confirmarEnvio && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmarEnvio(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Confirme sua Tratativa</h3>
                  <p className="text-sm text-slate-500">Verifique as informações antes de enviar. Após o envio, não será possível alterar.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Plano de Ação</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap break-words overflow-hidden">
                  {planoAcao}
                </div>
              </div>

              {id && (
                <div>
                  <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="TRATATIVA" readOnly titulo="Evidências Anexadas" />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setConfirmarEnvio(false)}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition"
              >
                Voltar e Revisar
              </button>
              <button
                onClick={() => {
                  setConfirmarEnvio(false)
                  mutationDevolutiva.mutate()
                }}
                disabled={mutationDevolutiva.isPending}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                {mutationDevolutiva.isPending ? 'Enviando...' : 'Confirmar Envio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
