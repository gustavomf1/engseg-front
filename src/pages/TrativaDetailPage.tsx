import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDesvio } from '../api/desvio'
import { getTrechosNorma } from '../api/ncTrechoNorma'
import {
  getNaoConformidade,
  submeterInvestigacao,
  aprovarPlano,
  rejeitarPlano,
  submeterEvidencias,
  aprovarEvidencias,
  rejeitarEvidencias,
} from '../api/naoConformidade'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft, MapPin, Calendar, Shield, AlertTriangle, FileText,
  CheckCircle, XCircle, Clock, Eye, Building2, User, BookOpen,
  RefreshCw, Plus, Trash2, History, ChevronDown, ChevronUp,
} from 'lucide-react'
import EvidenciaUpload from '../components/EvidenciaUpload'
import { downloadEvidencia } from '../api/evidencia'
import StatusBadge from '../components/StatusBadge'
import SeveridadeBadge from '../components/SeveridadeBadge'
import { formatDate, formatDateTime } from '../utils/date'
import { TipoAcaoHistorico } from '../types'

const acaoLabels: Record<TipoAcaoHistorico, string> = {
  CRIACAO: 'NC Criada',
  SUBMISSAO_INVESTIGACAO: 'Investigação Submetida',
  APROVACAO_PLANO: 'Plano Aprovado',
  REJEICAO_PLANO: 'Plano Rejeitado',
  SUBMISSAO_EVIDENCIAS: 'Evidências Submetidas',
  APROVACAO_EVIDENCIAS: 'Evidências Aprovadas',
  REJEICAO_EVIDENCIAS: 'Evidências Rejeitadas',
}

const acaoColors: Record<TipoAcaoHistorico, string> = {
  CRIACAO: 'bg-slate-100 text-slate-600 border-slate-200',
  SUBMISSAO_INVESTIGACAO: 'bg-blue-50 text-blue-700 border-blue-200',
  APROVACAO_PLANO: 'bg-green-50 text-green-700 border-green-200',
  REJEICAO_PLANO: 'bg-red-50 text-red-700 border-red-200',
  SUBMISSAO_EVIDENCIAS: 'bg-purple-50 text-purple-700 border-purple-200',
  APROVACAO_EVIDENCIAS: 'bg-green-50 text-green-700 border-green-200',
  REJEICAO_EVIDENCIAS: 'bg-red-50 text-red-700 border-red-200',
}

export default function TrativaDetailPage() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const isDesvio = tipo === 'DESVIO'
  const isEngenheiro = user?.perfil === 'ENGENHEIRO'
  const isExterno = user?.perfil === 'EXTERNO'
  const isTecnico = user?.perfil === 'TECNICO'

  // State — investigação (pergunta + resposta por porquê)
  const [porques, setPorques] = useState<{ pergunta: string; resposta: string }[]>([
    { pergunta: '', resposta: '' },
  ])
  const [causaRaiz, setCausaRaiz] = useState('')
  const [atividades, setAtividades] = useState<string[]>([''])
  const [normaAberta, setNormaAberta] = useState<string | null>(null)

  // State — execução
  const [descricaoExecucao, setDescricaoExecucao] = useState('')

  // State — snapshots expandidos
  const [expandedSnapshotIds, setExpandedSnapshotIds] = useState<Set<string>>(new Set())
  const toggleSnapshot = (id: string) => setExpandedSnapshotIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  // State — aprovação/rejeição
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [comentarioAprovacao, setComentarioAprovacao] = useState('')

  // State — confirmação
  const [confirmarEnvio, setConfirmarEnvio] = useState(false)

  const initialized = useRef(false)

  const toggleNorma = useCallback((nId: string) => {
    setNormaAberta(prev => prev === nId ? null : nId)
  }, [])

  const handleDownloadEvidencia = async (evidenciaId: string, nomeArquivo: string) => {
    const blob = await downloadEvidencia(evidenciaId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo
    a.click()
    URL.revokeObjectURL(url)
  }

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

  const { data: trechos = [] } = useQuery({
    queryKey: ['trechos-norma', id],
    queryFn: () => getTrechosNorma(id!),
    enabled: !isDesvio && !!id,
  })

  // Pré-popula formulário de investigação ao carregar dados
  useEffect(() => {
    if (nc && !initialized.current) {
      initialized.current = true
      if (nc.porqueUm) {
        setPorques([
          { pergunta: nc.porqueUm, resposta: nc.porqueUmResposta ?? '' },
          ...(nc.porqueDois ? [{ pergunta: nc.porqueDois, resposta: nc.porqueDoisResposta ?? '' }] : []),
          ...(nc.porqueTres ? [{ pergunta: nc.porqueTres, resposta: nc.porqueTresResposta ?? '' }] : []),
          ...(nc.porqueQuatro ? [{ pergunta: nc.porqueQuatro, resposta: nc.porqueQuatroResposta ?? '' }] : []),
          ...(nc.porqueCinco ? [{ pergunta: nc.porqueCinco, resposta: nc.porqueCincoResposta ?? '' }] : []),
        ])
      }
      if (nc.causaRaiz) setCausaRaiz(nc.causaRaiz)
      if (nc.atividades?.length > 0) setAtividades(nc.atividades.map(a => a.descricao))
    }
  }, [nc])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
    queryClient.invalidateQueries({ queryKey: ['nc', id] })
  }

  const mutSubmeterInvestigacao = useMutation({
    mutationFn: () => submeterInvestigacao(id!, {
      porques,
      causaRaiz,
      atividades: atividades.filter(a => a.trim()),
    }),
    onSuccess: () => { invalidate(); setConfirmarEnvio(false) },
  })

  const mutAprovarPlano = useMutation({
    mutationFn: () => aprovarPlano(id!, { comentario: comentarioAprovacao || undefined }),
    onSuccess: () => { invalidate(); setComentarioAprovacao('') },
  })

  const mutRejeitarPlano = useMutation({
    mutationFn: () => rejeitarPlano(id!, { comentario: motivoRejeicao }),
    onSuccess: () => { invalidate(); setMotivoRejeicao('') },
  })

  const mutSubmeterEvidencias = useMutation({
    mutationFn: () => submeterEvidencias(id!, { descricaoExecucao }),
    onSuccess: () => { invalidate(); setDescricaoExecucao('') },
  })

  const mutAprovarEvidencias = useMutation({
    mutationFn: () => aprovarEvidencias(id!, { comentario: comentarioAprovacao || undefined }),
    onSuccess: () => { invalidate(); navigate('/tratativas') },
  })

  const mutRejeitarEvidencias = useMutation({
    mutationFn: () => rejeitarEvidencias(id!, { comentario: motivoRejeicao }),
    onSuccess: () => { invalidate(); setMotivoRejeicao('') },
  })

  function getDiasRestantes(dataLimite?: string) {
    if (!dataLimite) return null
    const limite = new Date(dataLimite)
    const hoje = new Date()
    return Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  }

  const ocorrencia = isDesvio ? desvio : nc
  if (!ocorrencia) return <div className="text-center py-12 text-slate-400">Carregando...</div>

  const dias = !isDesvio ? getDiasRestantes(nc?.dataLimiteResolucao) : null
  const prazoVencido = dias !== null && dias < 0 && nc?.status !== 'CONCLUIDO'

  // Condições de exibição por status
  const showInvestigacaoForm = !isDesvio && (nc?.status === 'ABERTA' || nc?.status === 'EM_AJUSTE_PELO_EXTERNO') && (isExterno || isTecnico)
  const showAguardandoAprovacaoPlano = !isDesvio && nc?.status === 'AGUARDANDO_APROVACAO_PLANO' && isExterno
  const showAprovacaoPlanoForm = !isDesvio && nc?.status === 'AGUARDANDO_APROVACAO_PLANO' && isEngenheiro
  const showExecucaoForm = !isDesvio && nc?.status === 'EM_EXECUCAO' && (isExterno || isTecnico)
  const showEngenheiroAguardaExecucao = !isDesvio && nc?.status === 'EM_EXECUCAO' && isEngenheiro
  const showAguardandoValidacaoFinal = !isDesvio && nc?.status === 'AGUARDANDO_VALIDACAO_FINAL' && isExterno
  const showAprovacaoEvidenciasForm = !isDesvio && nc?.status === 'AGUARDANDO_VALIDACAO_FINAL' && isEngenheiro
  const showAbertaEngenheiro = !isDesvio && nc?.status === 'ABERTA' && isEngenheiro

  const investigacaoValida = porques.every(p => p.pergunta.trim() && p.resposta.trim()) && causaRaiz.trim() && atividades.some(a => a.trim())

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button onClick={() => navigate('/tratativas')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* ═══ HEADER ═══ */}
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
            {isDesvio && desvio && <StatusBadge status={desvio.status} type="desvio" />}
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

        <h2 className="text-xl font-bold text-slate-800 mb-5 break-words">{(ocorrencia as any).titulo}</h2>

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
                <p className={`font-medium ${prazoVencido ? 'text-red-600' : 'text-slate-800'}`}>{formatDate(nc.dataLimiteResolucao)}</p>
                {dias !== null && dias >= 0 && nc.status !== 'CONCLUIDO' && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{dias} dias restantes</span>
                )}
                {prazoVencido && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Vencido</span>}
              </div>
            </div>
          )}
          {(ocorrencia as any).tecnicoNome && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><User size={11} /> Usuário de Registro</p>
              <p className="text-slate-800 break-words">{(ocorrencia as any).tecnicoNome}</p>
            </div>
          )}
          {!isDesvio && nc?.engConstruturaNome && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><User size={11} /> Eng. Responsável pela Tratativa</p>
              <p className="text-slate-800 break-words">{nc.engConstruturaNome}{nc.engConstrutoraEmail ? ` (${nc.engConstrutoraEmail})` : ''}</p>
            </div>
          )}
          {!isDesvio && nc?.engVerificacaoNome && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5 flex items-center gap-1"><User size={11} /> Eng. Responsável</p>
              <p className="text-slate-800 break-words">{nc.engVerificacaoNome}{nc.engVerificacaoEmail ? ` (${nc.engVerificacaoEmail})` : ''}</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Descrição</p>
            <p className="text-slate-800 whitespace-pre-wrap break-words overflow-hidden">{(ocorrencia as any).descricao}</p>
          </div>
          {isDesvio && desvio?.orientacaoRealizada && (
            <div className="sm:col-span-2">
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Orientação Realizada</p>
              <p className="text-slate-800 whitespace-pre-wrap break-words">{desvio.orientacaoRealizada}</p>
            </div>
          )}
        </div>

        {/* Normas */}
        {!isDesvio && nc && nc.normas.length > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-indigo-500" />
              <h3 className="font-semibold text-slate-700">Normas Vinculadas</h3>
            </div>
            <div className="space-y-2">
              {nc.normas.map(n => {
                const trechosNorma = trechos.filter(t => t.normaId === n.id)
                return (
                  <div key={n.id} className="border border-indigo-100 rounded-lg bg-indigo-50 overflow-hidden">
                    <button type="button" onClick={() => toggleNorma(n.id)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-indigo-100/50 transition">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">{n.titulo}</span>
                        {trechosNorma.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                            {trechosNorma.length} trecho{trechosNorma.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${normaAberta === n.id ? 'rotate-180' : ''}`} />
                    </button>
                    {normaAberta === n.id && (
                      <div className="border-t border-indigo-100">
                        {n.descricao && (
                          <p className="text-xs text-slate-600 px-3 pt-2 pb-2 break-words whitespace-pre-wrap">{n.descricao}</p>
                        )}
                        {trechosNorma.length > 0 && (
                          <div className={`divide-y divide-blue-100 ${n.descricao ? 'border-t border-indigo-100' : ''}`}>
                            {trechosNorma.map(t => (
                              <div key={t.id} className="px-3 py-2.5 bg-blue-50/50">
                                {t.clausulaReferencia && (
                                  <p className="text-xs font-semibold text-blue-700 mb-1">{t.clausulaReferencia}</p>
                                )}
                                <p className="text-xs text-slate-700 whitespace-pre-wrap break-words">{t.textoEditado}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Evidências da ocorrência */}
        {!isDesvio && id && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="OCORRENCIA" readOnly titulo="Evidências da Ocorrência" />
          </div>
        )}
      </div>

      {/* ═══ RASTRO DE REINCIDÊNCIAS ═══ */}
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
            {nc.cadeiaReincidencias?.map(item => (
              <span key={item.id} className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium max-w-[180px] truncate" title={item.titulo}>{item.titulo}</span>
                <span className="text-slate-300 text-sm">→</span>
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-md bg-orange-600 text-white text-xs font-semibold ring-2 ring-orange-300 max-w-[180px] truncate" title={nc.titulo}>{nc.titulo}</span>
            {nc.reincidencias?.map(item => (
              <span key={item.id} className="flex items-center gap-2">
                <span className="text-slate-300 text-sm">→</span>
                <span className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium max-w-[180px] truncate" title={item.titulo}>{item.titulo}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ INVESTIGAÇÃO — histórico de submissões ═══ */}
      {!isDesvio && nc && nc.investigacaoSnapshots?.length > 0 && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-700">Análise de Causa Raiz — 5 Porquês</h3>
            {nc.investigacaoSnapshots.length > 1 && (
              <span className="text-xs text-slate-400 ml-1">({nc.investigacaoSnapshots.length} submissões)</span>
            )}
          </div>
          <div className="space-y-3">
            {nc.investigacaoSnapshots.map((snap, idx) => {
              const isLatest = idx === nc.investigacaoSnapshots.length - 1
              const isExpanded = isLatest || expandedSnapshotIds.has(snap.id)
              const statusColor = snap.status === 'APROVADO'
                ? 'bg-green-50 text-green-700 border-green-200'
                : snap.status === 'REPROVADO'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              const statusLabel = snap.status === 'APROVADO' ? 'Aprovada' : snap.status === 'REPROVADO' ? 'Reprovada' : 'Pendente'
              return (
                <div key={snap.id} className={`rounded-lg border ${isLatest ? 'border-blue-200' : 'border-gray-200'}`}>
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3 text-left gap-3 ${!isLatest ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'} rounded-lg`}
                    onClick={() => !isLatest && toggleSnapshot(snap.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-500">Submissão {idx + 1}</span>
                      <span className="text-xs text-slate-400">{formatDateTime(snap.dataSubmissao)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
                    </div>
                    {!isLatest && (
                      isExpanded ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {snap.comentarioRevisao && (
                        <div className={`rounded-lg px-3 py-2 text-xs border ${snap.status === 'REPROVADO' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                          <span className="font-semibold">{snap.status === 'REPROVADO' ? 'Motivo da reprovação: ' : 'Comentário: '}</span>
                          {snap.comentarioRevisao}
                        </div>
                      )}
                      <div className="space-y-3">
                        {[
                          { pergunta: snap.porqueUm, resposta: snap.porqueUmResposta },
                          { pergunta: snap.porqueDois, resposta: snap.porqueDoisResposta },
                          { pergunta: snap.porqueTres, resposta: snap.porqueTresResposta },
                          { pergunta: snap.porqueQuatro, resposta: snap.porqueQuatroResposta },
                          { pergunta: snap.porqueCinco, resposta: snap.porqueCincoResposta },
                        ].map((p, i) => p.pergunta && (
                          <div key={i} className="flex gap-3">
                            <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-1">{i + 1}</span>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium text-slate-800 break-words">{p.pergunta}</p>
                              {p.resposta && <p className="text-sm text-slate-600 break-words pl-3 border-l-2 border-blue-200">{p.resposta}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-3 border-t border-blue-100">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Causa Raiz Identificada</p>
                        <p className="text-sm font-medium text-slate-800 bg-blue-50 rounded-lg px-3 py-2 break-words">{snap.causaRaiz}</p>
                      </div>
                      {snap.atividades?.length > 0 && (
                        <div className="pt-3 border-t border-blue-100">
                          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Plano de Atividades</p>
                          <div className="space-y-2">
                            {snap.atividades.map((a, i) => (
                              <div key={i} className="flex gap-3 items-start">
                                <span className="w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                <p className="text-sm text-slate-800 break-words">{a}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ EXECUÇÃO — histórico de submissões ═══ */}
      {!isDesvio && nc && nc.execucaoSnapshots?.length > 0 && (
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-purple-500" />
            <h3 className="font-semibold text-slate-700">O que foi executado</h3>
            {nc.execucaoSnapshots.length > 1 && (
              <span className="text-xs text-slate-400 ml-1">({nc.execucaoSnapshots.length} submissões)</span>
            )}
          </div>
          <div className="space-y-3">
            {nc.execucaoSnapshots.map((snap, idx) => {
              const isLatest = idx === nc.execucaoSnapshots.length - 1
              const isExpanded = isLatest || expandedSnapshotIds.has(snap.id)
              const statusColor = snap.status === 'APROVADO'
                ? 'bg-green-50 text-green-700 border-green-200'
                : snap.status === 'REPROVADO'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              const statusLabel = snap.status === 'APROVADO' ? 'Aprovada' : snap.status === 'REPROVADO' ? 'Reprovada' : 'Pendente'
              return (
                <div key={snap.id} className={`rounded-lg border ${isLatest ? 'border-purple-200' : 'border-gray-200'}`}>
                  <button
                    className={`w-full flex items-center justify-between px-4 py-3 text-left gap-3 ${!isLatest ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'} rounded-lg`}
                    onClick={() => !isLatest && toggleSnapshot(snap.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-500">Submissão {idx + 1}</span>
                      <span className="text-xs text-slate-400">{formatDateTime(snap.dataSubmissao)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
                    </div>
                    {!isLatest && (
                      isExpanded ? <ChevronUp size={14} className="text-slate-400 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {snap.comentarioRevisao && (
                        <div className={`rounded-lg px-3 py-2 text-xs border ${snap.status === 'REPROVADO' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                          <span className="font-semibold">{snap.status === 'REPROVADO' ? 'Motivo da reprovação: ' : 'Comentário: '}</span>
                          {snap.comentarioRevisao}
                        </div>
                      )}
                      <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{snap.descricaoExecucao}</p>
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Evidências da Execução</p>
                        {snap.evidencias?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {snap.evidencias.map(ev => (
                              <button
                                key={ev.id}
                                onClick={() => handleDownloadEvidencia(ev.id, ev.nomeArquivo)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                              >
                                <FileText size={12} />
                                {ev.nomeArquivo}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Nenhuma evidência anexada</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ HISTÓRICO DE DECISÕES ═══ */}
      {!isDesvio && nc && nc.historico?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <History size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-700">Histórico</h3>
          </div>
          <div className="space-y-2">
            {nc.historico.map(h => (
              <div key={h.id} className={`border rounded-lg p-3 ${acaoColors[h.acao]}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold">{acaoLabels[h.acao]}</span>
                  <span className="text-xs opacity-70 min-w-0 break-words">{formatDateTime(h.dataAcao)}{h.usuarioNome ? ` — ${h.usuarioNome}` : ''}</span>
                </div>
                {h.comentario && <p className="text-xs mt-1.5 break-words">{h.comentario}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ÁREA DE AÇÃO — depende de status + perfil */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* Desvio — sempre concluído */}
      {isDesvio && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle size={32} className="text-green-500 shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">Desvio Concluído</div>
            <div className="text-sm text-green-600 mt-0.5">Este desvio foi registrado e concluído automaticamente.</div>
          </div>
        </div>
      )}

      {/* ABERTA + Engenheiro → aguardando investigação do Externo */}
      {showAbertaEngenheiro && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center gap-4">
          <Clock size={32} className="text-amber-500 shrink-0" />
          <div>
            <div className="font-bold text-amber-800 text-base">Aguardando Investigação</div>
            <div className="text-sm text-amber-600 mt-0.5">O responsável da empresa contratada deve preencher os 5 Porquês e o plano de atividades.</div>
          </div>
        </div>
      )}

      {/* ABERTA ou EM_AJUSTE + Externo/Tecnico → Formulário de investigação */}
      {showInvestigacaoForm && (
        <div className="bg-white rounded-xl border-2 border-blue-400 shadow-md p-6 ring-2 ring-blue-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText size={16} className="text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {nc?.status === 'EM_AJUSTE_PELO_EXTERNO' ? 'Ajustar Investigação e Plano de Ação' : 'Preencher Investigação e Plano de Ação'}
            </h3>
          </div>
          {nc?.status === 'EM_AJUSTE_PELO_EXTERNO' && (
            <p className="text-sm text-orange-600 mb-5 ml-11">O engenheiro solicitou ajustes. Verifique o histórico abaixo e corrija o plano.</p>
          )}

          {/* Alerta de reincidência */}
          {nc?.reincidencia && (nc?.cadeiaReincidencias?.length ?? 0) > 0 && (
            <div className="mb-5 bg-orange-50 border border-orange-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw size={14} className="text-orange-600 shrink-0" />
                <p className="text-sm font-bold text-orange-700">Esta é a {(nc.cadeiaReincidencias?.length ?? 0) + 1}ª ocorrência do mesmo problema</p>
              </div>
              <p className="text-xs text-orange-600">Proponha uma solução diferente que ataque a causa raiz.</p>
            </div>
          )}

          <div className="space-y-5">
            {/* Porquês dinâmicos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-700">Análise dos Porquês * <span className="text-xs font-normal text-slate-400">(mín. 1, máx. 5)</span></p>
                {porques.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setPorques([...porques, { pergunta: '', resposta: '' }])}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Plus size={13} /> Adicionar porquê
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {porques.map((p, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-2">{i + 1}</span>
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Pergunta *</label>
                        <input
                          type="text"
                          value={p.pergunta}
                          onChange={e => {
                            const novo = [...porques]
                            novo[i] = { ...novo[i], pergunta: e.target.value }
                            setPorques(novo)
                          }}
                          placeholder={`Por que ${i + 1}? (ex: Por que o funcionário estava sem capacete?)`}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Resposta *</label>
                        <input
                          type="text"
                          value={p.resposta}
                          onChange={e => {
                            const novo = [...porques]
                            novo[i] = { ...novo[i], resposta: e.target.value }
                            setPorques(novo)
                          }}
                          placeholder="Resposta..."
                          className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition"
                        />
                      </div>
                    </div>
                    {porques.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPorques(porques.filter((_, j) => j !== i))}
                        className="mt-2 text-slate-400 hover:text-red-500 transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Causa raiz */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Causa Raiz Identificada *</label>
              <textarea
                value={causaRaiz}
                onChange={e => setCausaRaiz(e.target.value)}
                rows={3}
                placeholder="Descreva a causa raiz identificada pela análise dos 5 Porquês..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              />
            </div>

            {/* Atividades */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-700">Plano de Atividades *</p>
                <button
                  type="button"
                  onClick={() => setAtividades([...atividades, ''])}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus size={13} /> Adicionar atividade
                </button>
              </div>
              <div className="space-y-2">
                {atividades.map((a, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 mt-2">{i + 1}</span>
                    <input
                      type="text"
                      value={a}
                      onChange={e => {
                        const novas = [...atividades]
                        novas[i] = e.target.value
                        setAtividades(novas)
                      }}
                      placeholder={`Atividade ${i + 1}...`}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
                    />
                    {atividades.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setAtividades(atividades.filter((_, j) => j !== i))}
                        className="mt-2 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/tratativas')}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button
                onClick={() => setConfirmarEnvio(true)}
                disabled={!investigacaoValida}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <Eye size={16} /> Revisar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AGUARDANDO_APROVACAO_PLANO + Externo → aguardando */}
      {showAguardandoAprovacaoPlano && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-800">Aguardando Aprovação do Plano</h3>
              <p className="text-sm text-amber-600">Sua investigação e plano de atividades estão sendo analisados pelo engenheiro.</p>
            </div>
          </div>
        </div>
      )}

      {/* AGUARDANDO_APROVACAO_PLANO + Engenheiro → aprovar/rejeitar plano */}
      {showAprovacaoPlanoForm && (
        <div className="bg-white rounded-xl border-2 border-green-400 shadow-md p-6 ring-2 ring-green-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Aprovação do Plano de Ação</h3>
          </div>
          <p className="text-sm text-green-600 mb-5 ml-11">Revise a investigação e o plano de atividades acima e aprove ou rejeite.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comentário (opcional para aprovação)</label>
              <textarea
                value={comentarioAprovacao}
                onChange={e => setComentarioAprovacao(e.target.value)}
                rows={2}
                placeholder="Adicione um comentário sobre sua decisão..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">Motivo da Rejeição (obrigatório para reprovar)</label>
              <textarea
                value={motivoRejeicao}
                onChange={e => setMotivoRejeicao(e.target.value)}
                rows={3}
                placeholder="Explique o motivo da rejeição para que o responsável possa ajustar..."
                className="w-full border border-red-200 rounded-lg px-4 py-3 text-sm bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/tratativas')}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button
                onClick={() => mutRejeitarPlano.mutate()}
                disabled={!motivoRejeicao.trim() || mutRejeitarPlano.isPending}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> {mutRejeitarPlano.isPending ? 'Enviando...' : 'Rejeitar Plano'}
              </button>
              <button
                onClick={() => mutAprovarPlano.mutate()}
                disabled={mutAprovarPlano.isPending}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> {mutAprovarPlano.isPending ? 'Enviando...' : 'Aprovar Plano'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EM_EXECUCAO + Externo/Tecnico → upload evidências + descrição */}
      {showExecucaoForm && (
        <div className="bg-white rounded-xl border-2 border-purple-400 shadow-md p-6 ring-2 ring-purple-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <FileText size={16} className="text-purple-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Execução e Envio de Evidências</h3>
          </div>
          <p className="text-sm text-purple-600 mb-5 ml-11">Execute as atividades do plano, anexe as evidências e descreva o que foi feito.</p>

          <div className="space-y-4">
            {id && (
              <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="TRATATIVA" titulo="Evidências da Execução (PDF / Imagens)" />
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do que foi executado *</label>
              <textarea
                value={descricaoExecucao}
                onChange={e => setDescricaoExecucao(e.target.value)}
                rows={4}
                placeholder="Descreva as ações realizadas para resolver a não conformidade..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/tratativas')}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button
                onClick={() => mutSubmeterEvidencias.mutate()}
                disabled={!descricaoExecucao.trim() || mutSubmeterEvidencias.isPending}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> {mutSubmeterEvidencias.isPending ? 'Enviando...' : 'Enviar para Validação Final'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EM_EXECUCAO + Engenheiro → aguardando */}
      {showEngenheiroAguardaExecucao && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 flex items-center gap-4">
          <Clock size={32} className="text-purple-500 shrink-0" />
          <div>
            <div className="font-bold text-purple-800 text-base">Plano Aprovado — Aguardando Execução</div>
            <div className="text-sm text-purple-600 mt-0.5">O responsável está executando as atividades e irá enviar as evidências quando concluir.</div>
          </div>
        </div>
      )}

      {/* AGUARDANDO_VALIDACAO_FINAL + Externo → aguardando */}
      {showAguardandoValidacaoFinal && (
        <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={20} className="text-indigo-600 shrink-0" />
            <div>
              <h3 className="font-bold text-indigo-800">Aguardando Validação Final</h3>
              <p className="text-sm text-indigo-600">Suas evidências foram enviadas e estão sendo validadas pelo engenheiro.</p>
            </div>
          </div>
        </div>
      )}

      {/* AGUARDANDO_VALIDACAO_FINAL + Engenheiro → aprovar/rejeitar evidências */}
      {showAprovacaoEvidenciasForm && (
        <div className="bg-white rounded-xl border-2 border-green-400 shadow-md p-6 ring-2 ring-green-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Validação Final das Evidências</h3>
          </div>
          <p className="text-sm text-green-600 mb-5 ml-11">Revise as evidências e a descrição da execução acima. Aprove para concluir a NC ou rejeite para solicitar reenvio.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Comentário (opcional para aprovação)</label>
              <textarea
                value={comentarioAprovacao}
                onChange={e => setComentarioAprovacao(e.target.value)}
                rows={2}
                placeholder="Adicione um comentário sobre sua decisão..."
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-red-700 mb-1">Motivo da Rejeição (obrigatório para reprovar)</label>
              <textarea
                value={motivoRejeicao}
                onChange={e => setMotivoRejeicao(e.target.value)}
                rows={3}
                placeholder="Explique o motivo da rejeição das evidências..."
                className="w-full border border-red-200 rounded-lg px-4 py-3 text-sm bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white transition"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/tratativas')}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button
                onClick={() => mutRejeitarEvidencias.mutate()}
                disabled={!motivoRejeicao.trim() || mutRejeitarEvidencias.isPending}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> {mutRejeitarEvidencias.isPending ? 'Enviando...' : 'Rejeitar Evidências'}
              </button>
              <button
                onClick={() => mutAprovarEvidencias.mutate()}
                disabled={mutAprovarEvidencias.isPending}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} /> {mutAprovarEvidencias.isPending ? 'Enviando...' : 'Aprovar e Concluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONCLUIDO */}
      {!isDesvio && nc?.status === 'CONCLUIDO' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle size={32} className="text-green-500 shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">Não Conformidade Concluída</div>
            <div className="text-sm text-green-600 mt-0.5">Esta ocorrência foi tratada e validada com sucesso.</div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de envio da investigação */}
      {confirmarEnvio && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmarEnvio(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Confirmar Envio</h3>
                  <p className="text-sm text-slate-500">Verifique antes de enviar. Você poderá ajustar caso o engenheiro solicite.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">5 Porquês</p>
                <div className="space-y-3">
                  {porques.map((p, i) => p.pergunta && (
                    <div key={i} className="flex gap-2">
                      <span className="font-semibold text-slate-500 shrink-0 text-sm">{i + 1}.</span>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-700 break-words">{p.pergunta}</p>
                        {p.resposta && <p className="text-sm text-slate-500 break-words pl-2 border-l-2 border-blue-200">{p.resposta}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Causa Raiz</p>
                <p className="text-sm text-slate-700 bg-gray-50 rounded-lg p-3 break-words">{causaRaiz}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Atividades do Plano</p>
                <div className="space-y-1">
                  {atividades.filter(a => a.trim()).map((a, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="font-semibold text-slate-500 shrink-0">{i + 1}.</span>
                      <span className="text-slate-700 break-words">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setConfirmarEnvio(false)}
                className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition">
                Voltar e Revisar
              </button>
              <button
                onClick={() => mutSubmeterInvestigacao.mutate()}
                disabled={mutSubmeterInvestigacao.isPending}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                {mutSubmeterInvestigacao.isPending ? 'Enviando...' : 'Confirmar Envio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
