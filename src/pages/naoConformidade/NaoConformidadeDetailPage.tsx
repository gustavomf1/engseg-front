import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getNaoConformidade,
  aprovarPlano,
  rejeitarPlano,
  revisarAtividades,
  submeterExecucao,
  revisarExecucao,
  submeterEvidencias,
  aprovarEvidencias,
  rejeitarEvidencias,
  submeterInvestigacao,
  ativarNaoConformidade,
  deleteNaoConformidade,
} from '../../api/naoConformidade'
import type {
  InvestigacaoRequest,
  RevisarAtividadesRequest,
  SubmeterExecucaoRequest,
  RevisarExecucaoRequest,
  SubmeterEvidenciasRequest,
} from '../../types'
import { getTrechosNorma } from '../../api/ncTrechoNorma'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import RiscoBadge from '../../components/RiscoBadge'
import { ArrowLeft, CheckCircle, Clock, FileText, Shield, RefreshCw, History, Search, BookOpen, Trash2, ChevronDown, Pencil } from 'lucide-react'
import EvidenciaUpload from '../../components/EvidenciaUpload'
import BuscaTrechoModal from '../../components/BuscaTrechoModal'
import { formatDate, formatDateTime } from '../../utils/date'
import { TipoAcaoHistorico } from '../../types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deletarTrechoNorma } from '../../api/ncTrechoNorma'

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

export default function NaoConformidadeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [buscaModal, setBuscaModal] = useState<{ normaId: string; normaTitulo: string } | null>(null)
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [showAtivarModal, setShowAtivarModal] = useState(false)
  const [showRevisarPlanoModal, setShowRevisarPlanoModal] = useState(false)
  const [showRevisarAtividadesModal, setShowRevisarAtividadesModal] = useState(false)
  const [showRevisarExecucaoModal, setShowRevisarExecucaoModal] = useState(false)
  const [decisoesMap, setDecisoesMap] = useState<Record<string, { status: 'APROVADA' | 'REJEITADA'; motivo: string }>>({})
  const [emailManualInput, setEmailManualInput] = useState('')
  const [emailsManuaisAcao, setEmailsManuaisAcao] = useState<string[]>([])

  function resetEmailManual() {
    setEmailManualInput('')
    setEmailsManuaisAcao([])
  }

  const { data: nc, isLoading } = useQuery({
    queryKey: ['nao-conformidade', id],
    queryFn: () => getNaoConformidade(id!),
    enabled: !!id,
  })

  const { data: trechos = [] } = useQuery({
    queryKey: ['trechos-norma', id],
    queryFn: () => getTrechosNorma(id!),
    enabled: !!id,
  })

  const deletarTrechoMutation = useMutation({
    mutationFn: (trechoId: string) => deletarTrechoNorma(id!, trechoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trechos-norma', id] }),
  })

  const submeterInvestigacaoMutation = useMutation({
    mutationFn: (data: InvestigacaoRequest) =>
      submeterInvestigacao(id!, { ...data, emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const aprovarPlanoMutation = useMutation({
    mutationFn: () => aprovarPlano(id!, { emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const rejeitarPlanoMutation = useMutation({
    mutationFn: (motivo: string) => rejeitarPlano(id!, { motivo, emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const revisarAtividadesMutation = useMutation({
    mutationFn: (data: RevisarAtividadesRequest) =>
      revisarAtividades(id!, { ...data, emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const submeterExecucaoMutation = useMutation({
    mutationFn: (data: SubmeterExecucaoRequest) =>
      submeterExecucao(id!, { ...data, emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const revisarExecucaoMutation = useMutation({
    mutationFn: (data: RevisarExecucaoRequest) =>
      revisarExecucao(id!, { ...data, emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const submeterEvidenciasMutation = useMutation({
    mutationFn: (data: SubmeterEvidenciasRequest) =>
      submeterEvidencias(id!, { ...data, emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const aprovarEvidenciasMutation = useMutation({
    mutationFn: () => aprovarEvidencias(id!, { emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const rejeitarEvidenciasMutation = useMutation({
    mutationFn: (motivo: string) => rejeitarEvidencias(id!, { motivo, emailsManuais: emailsManuaisAcao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      resetEmailManual()
    },
  })

  const ativarMutation = useMutation({
    mutationFn: () => ativarNaoConformidade(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
      setShowAtivarModal(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteNaoConformidade(id!),
    onSuccess: () => navigate('/ocorrencias'),
  })

  if (isLoading) return <div className="text-slate-400 py-8 text-center">Carregando...</div>
  if (!nc) return <div className="text-red-500 py-8 text-center">NC não encontrada</div>

  const isCriadorNc = user?.id === nc.usuarioCriacaoId && user?.perfil !== 'EXTERNO'
  const podeEditarExcluirNc = nc.status === 'ABERTA' && (isCriadorNc || !!user?.isAdmin)

  const EmailManualSection = (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
      <p className="text-xs font-medium text-slate-600 mb-2">
        Notificar email adicional (opcional)
      </p>
      <div className="flex gap-2 mb-2">
        <input
          type="email"
          placeholder="email@empresa.com"
          className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          value={emailManualInput}
          onChange={e => setEmailManualInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const em = emailManualInput.trim()
              if (em && !emailsManuaisAcao.includes(em)) {
                setEmailsManuaisAcao(prev => [...prev, em])
                setEmailManualInput('')
              }
            }
          }}
        />
        <button
          type="button"
          onClick={() => {
            const em = emailManualInput.trim()
            if (em && !emailsManuaisAcao.includes(em)) {
              setEmailsManuaisAcao(prev => [...prev, em])
              setEmailManualInput('')
            }
          }}
          className="px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
        >
          +
        </button>
      </div>
      {emailsManuaisAcao.length > 0 && (
        <ul className="space-y-0.5">
          {emailsManuaisAcao.map(e => (
            <li key={e} className="flex items-center justify-between text-xs text-slate-700">
              <span>{e}</span>
              <button
                type="button"
                onClick={() => setEmailsManuaisAcao(prev => prev.filter(x => x !== e))}
                className="text-slate-400 hover:text-red-400 ml-2"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-800 break-words min-w-0 w-full">{nc.titulo}</h2>
            <StatusBadge status={nc.status} type="nc" />
            <RiscoBadge nivel={nc.nivelRisco} />
            <span className="text-sm text-gray-600">
              Severidade {nc.severidade} · Probabilidade {nc.probabilidade}
            </span>
            {nc.vencida && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                Vencida
              </span>
            )}
            {nc.regraDeOuro && (
              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                <Shield size={12} /> Regra de Ouro
              </span>
            )}
            {nc.reincidencia && (
              <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                <RefreshCw size={12} /> Reincidência
              </span>
            )}
          </div>
        </div>
        {podeEditarExcluirNc && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => navigate(`/ocorrencias/NAO_CONFORMIDADE/${nc.id}/editar`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              onClick={() => { if (window.confirm('Tem certeza que deseja excluir esta NC?')) deleteMutation.mutate() }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 size={14} /> Excluir
            </button>
          </div>
        )}
      </div>

      {/* Informações gerais */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h3 className="font-semibold text-slate-700 mb-4">Informações Gerais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Estabelecimento</p>
            <p className="text-slate-800 font-medium">{nc.estabelecimentoNome}</p>
          </div>
          {nc.localizacaoNome && (
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Localização</p>
              <p className="text-slate-800 font-medium">{nc.localizacaoNome}</p>
            </div>
          )}
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Data de Registro</p>
            <p className="text-slate-800">{formatDateTime(nc.dataRegistro)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Prazo para Resolução</p>
            <p className={`font-medium ${new Date(nc.dataLimiteResolucao) < new Date() && nc.status !== 'CONCLUIDO' ? 'text-red-600' : 'text-slate-800'}`}>
              {formatDate(nc.dataLimiteResolucao)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Usuário de Criação</p>
            <p className="text-slate-800 break-words">{nc.usuarioCriacaoNome ? `${nc.usuarioCriacaoNome} (${nc.usuarioCriacaoEmail})` : '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Usuário de Registro</p>
            <p className="text-slate-800 break-words">{nc.tecnicoNome || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Eng. Responsável pela Tratativa</p>
            <p className="text-slate-800 break-words">{nc.responsavelTrativaNome ? `${nc.responsavelTrativaNome} (${nc.responsavelTrativaEmail})` : nc.responsavelTrativaEmail || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Eng. Responsável</p>
            <p className="text-slate-800 break-words">{nc.responsavelNcNome ? `${nc.responsavelNcNome} (${nc.responsavelNcEmail})` : nc.responsavelNcEmail || '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Descrição</p>
            <p className="text-slate-800 whitespace-pre-wrap break-words">{nc.descricao}</p>
          </div>
        </div>
      </div>

      {/* Rastro de reincidências */}
      {(nc.reincidencia || nc.reincidencias?.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={16} className="text-red-500" />
            <h3 className="font-semibold text-slate-700">Rastro de Reincidências</h3>
            <span className="text-xs text-slate-400 ml-1">
              ({(nc.cadeiaReincidencias?.length ?? 0) + 1 + (nc.reincidencias?.length ?? 0)} ocorrência(s) no total)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {nc.cadeiaReincidencias?.map(item => (
              <span key={item.id} className="flex items-center gap-2">
                <button onClick={() => navigate(`/nao-conformidades/${item.id}`)}
                  className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium hover:bg-red-100 transition max-w-[200px] truncate" title={item.titulo}>
                  {item.titulo}
                </button>
                <span className="text-slate-300 text-sm">→</span>
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-semibold ring-2 ring-red-300 max-w-[200px] truncate" title={nc.titulo}>
              {nc.titulo}
            </span>
            {nc.reincidencias?.map(item => (
              <span key={item.id} className="flex items-center gap-2">
                <span className="text-slate-300 text-sm">→</span>
                <button onClick={() => navigate(`/nao-conformidades/${item.id}`)}
                  className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium hover:bg-orange-100 transition max-w-[200px] truncate" title={item.titulo}>
                  {item.titulo}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Evidências da ocorrência */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <EvidenciaUpload naoConformidadeId={nc.id} readOnly={user?.perfil === 'TECNICO' && nc.status !== 'ABERTA'} />
      </div>

      {/* Investigação — 5 Porquês */}
      {nc.porqueUm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-700">Análise de Causa Raiz — 5 Porquês</h3>
          </div>
          <div className="space-y-4">
            {[
              { pergunta: nc.porqueUm, resposta: nc.porqueUmResposta },
              { pergunta: nc.porqueDois, resposta: nc.porqueDoisResposta },
              { pergunta: nc.porqueTres, resposta: nc.porqueTresResposta },
              { pergunta: nc.porqueQuatro, resposta: nc.porqueQuatroResposta },
              { pergunta: nc.porqueCinco, resposta: nc.porqueCincoResposta },
            ].map((p, i) => p.pergunta && (
              <div key={i} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-1">{i + 1}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-slate-800 break-words">{p.pergunta}</p>
                  {p.resposta && <p className="text-sm text-slate-600 break-words pl-3 border-l-2 border-blue-200">{p.resposta}</p>}
                </div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-blue-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Causa Raiz</p>
              <p className="text-sm font-medium text-slate-800 bg-blue-50 rounded-lg px-3 py-2 break-words">{nc.causaRaiz}</p>
            </div>
          </div>
          {nc.atividades?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Plano de Atividades</p>
              <div className="space-y-2">
                {nc.atividades.map((a, i) => (
                  <div key={a.id} className={`flex gap-2 overflow-hidden ${a.status === 'REJEITADA' ? 'p-2 bg-red-50 border border-red-200 rounded-lg' : ''}`}>
                    <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${a.status === 'REJEITADA' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 break-words">{a.titulo}</p>
                      <p className="text-xs text-slate-600 break-words">{a.descricao}</p>
                      {a.status === 'REJEITADA' && a.motivoRejeicao && (
                        <p className="text-xs text-red-600 mt-0.5 break-words">Rejeitada: {a.motivoRejeicao}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Descrição da execução + evidências */}
      {nc.descricaoExecucao && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-purple-500" />
            <h3 className="font-semibold text-slate-700">O que foi executado</h3>
          </div>
          <p className="text-sm text-slate-800 whitespace-pre-wrap break-words mb-4">{nc.descricaoExecucao}</p>
          <EvidenciaUpload naoConformidadeId={nc.id} tipoEvidencia="TRATATIVA" readOnly titulo="Evidências da Execução" />
        </div>
      )}

      {/* Normas vinculadas + trechos */}
      {nc.normas?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-700">Normas Vinculadas</h3>
          </div>
          <div className="space-y-3">
            {nc.normas.map(norma => {
              const trechosNorma = trechos.filter(t => t.normaId === norma.id)
              return (
                <div key={norma.id} className="rounded-lg border border-gray-100 bg-gray-50 overflow-hidden">
                  {/* Cabeçalho da norma */}
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{norma.titulo}</p>
                      {norma.descricao && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{norma.descricao}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setBuscaModal({ normaId: norma.id, normaTitulo: norma.titulo })}
                      title={norma.conteudo ? 'Buscar trecho por IA' : 'Esta norma não possui conteúdo cadastrado'}
                      disabled={!norma.conteudo}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                    >
                      <Search size={12} />
                      Buscar trecho
                    </button>
                  </div>
                  {/* Trechos vinculados a esta norma */}
                  {trechosNorma.length > 0 && (
                    <div className="border-t border-gray-100 divide-y divide-blue-50">
                      {trechosNorma.map(t => (
                        <div key={t.id} className="px-3 py-3 bg-blue-50/40">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {t.clausulaReferencia && (
                                <span className="text-xs font-semibold text-blue-700">{t.clausulaReferencia}</span>
                              )}
                              <span className="text-xs text-slate-400">{formatDateTime(t.dataVinculo)}</span>
                            </div>
                            {(user?.perfil === 'ENGENHEIRO' || user?.perfil === 'TECNICO') && (
                              <button
                                onClick={() => deletarTrechoMutation.mutate(t.id)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition shrink-0"
                                title="Remover trecho"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{t.textoEditado}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Histórico de decisões */}
      {nc.historico?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
          <button
            onClick={() => setHistoricoAberto(v => !v)}
            className="w-full flex items-center justify-between gap-2 px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-500" />
              <h3 className="font-semibold text-slate-700">Histórico</h3>
              <span className="text-xs text-slate-400">({nc.historico.length})</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${historicoAberto ? 'rotate-180' : ''}`}
            />
          </button>
          {historicoAberto && (
            <div className="px-6 pb-6 space-y-2">
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
          )}
        </div>
      )}

      {/* Ações — ativar NC (ABERTA → AGUARDANDO_TRATATIVA) */}
      {nc.status === 'ABERTA' && (isCriadorNc || user?.isAdmin) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">Enviar para Plano de Ação</h3>
          <p className="text-sm text-slate-500 mb-3">
            Após confirmar, a NC avança para o fluxo de investigação e plano de ação. Não será possível editar os dados cadastrais.
          </p>
          <button
            type="button"
            onClick={() => setShowAtivarModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Enviar para Plano de Ação →
          </button>
        </div>
      )}

      {/* Modal — Ativar NC */}
      {showAtivarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Confirmar Envio para Plano de Ação</h3>
            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1">
              <p><span className="text-slate-500">NC:</span> <strong>{nc.titulo}</strong></p>
              <p><span className="text-slate-500">Estabelecimento:</span> {nc.estabelecimentoNome}</p>
            </div>
            <p className="text-sm text-orange-700 bg-orange-50 rounded-lg p-3">
              Após confirmar, <strong>não será possível editar</strong> os dados da NC.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAtivarModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => ativarMutation.mutate()}
                disabled={ativarMutation.isPending}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {ativarMutation.isPending ? 'Enviando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status — aguardando tratativa (responsável preenche investigação) */}
      {nc.status === 'AGUARDANDO_TRATATIVA' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-500 font-bold text-sm">⏳ Aguardando Investigação</span>
          </div>
          <p className="text-sm text-orange-700">
            O responsável pela tratativa <strong>{nc.responsavelTrativaNome || '—'}</strong> deve preencher o plano de investigação (5 Porquês + Causa Raiz + Atividades).
          </p>
        </div>
      )}

      {/* Ações — aprovar / rejeitar plano */}
      {nc.status === 'AGUARDANDO_APROVACAO_PLANO' && user?.perfil === 'ENGENHEIRO' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">Revisar Plano de Ação</h3>
          {EmailManualSection}
          <button
            type="button"
            onClick={() => { setDecisoesMap({}); setShowRevisarPlanoModal(true) }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Revisar Plano →
          </button>
        </div>
      )}

      {/* Ações — revisar atividades (EM_AJUSTE_PELO_EXTERNO) */}
      {nc.status === 'EM_AJUSTE_PELO_EXTERNO' && user?.perfil === 'ENGENHEIRO' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">Revisar Atividades</h3>
          {EmailManualSection}
          <button
            type="button"
            onClick={() => { setDecisoesMap({}); setShowRevisarAtividadesModal(true) }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Revisar Atividades →
          </button>
        </div>
      )}

      {/* Ações — submeter execução */}
      {nc.status === 'EM_EXECUCAO' && user?.perfil === 'ENGENHEIRO' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">Submeter Execução</h3>
          {EmailManualSection}
          <button
            type="button"
            disabled={submeterExecucaoMutation.isPending}
            onClick={() => submeterExecucaoMutation.mutate({ atividades: [] })}
            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submeterExecucaoMutation.isPending ? 'Enviando...' : 'Submeter Execução'}
          </button>
        </div>
      )}

      {/* Ações — revisar execução */}
      {nc.status === 'AGUARDANDO_VALIDACAO_FINAL' && user?.perfil === 'ENGENHEIRO' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-3">Revisar Execução</h3>
          {EmailManualSection}
          <button
            type="button"
            onClick={() => { setDecisoesMap({}); setShowRevisarExecucaoModal(true) }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Revisar Execução →
          </button>
        </div>
      )}


      {/* Concluída */}
      {nc.status === 'CONCLUIDO' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4 mb-4">
          <CheckCircle size={32} className="text-green-500 shrink-0" />
          <div>
            <div className="font-bold text-green-800 text-base">Não Conformidade Concluída</div>
            <div className="text-sm text-green-600 mt-0.5">Esta ocorrência foi tratada e validada com sucesso.</div>
          </div>
        </div>
      )}

      {buscaModal && (
        <BuscaTrechoModal
          ncId={id!}
          normaId={buscaModal.normaId}
          normaTitulo={buscaModal.normaTitulo}
          onClose={() => setBuscaModal(null)}
        />
      )}

      {/* Modal — Revisar Plano (AGUARDANDO_APROVACAO_PLANO) */}
      {showRevisarPlanoModal && nc && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-6 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-slate-800">Revisar Plano de Ação</h3>
              <button type="button" onClick={() => setShowRevisarPlanoModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* 5 Porquês */}
              {nc.porqueUm && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">5 Porquês</p>
                  <div className="space-y-2">
                    {[
                      { id: 'p1', label: nc.porqueUm, resp: nc.porqueUmResposta },
                      { id: 'p2', label: nc.porqueDois, resp: nc.porqueDoisResposta },
                      { id: 'p3', label: nc.porqueTres, resp: nc.porqueTresResposta },
                      { id: 'p4', label: nc.porqueQuatro, resp: nc.porqueQuatroResposta },
                      { id: 'p5', label: nc.porqueCinco, resp: nc.porqueCincoResposta },
                    ].filter(p => p.label).map((p, i) => {
                      const d = decisoesMap[p.id]
                      return (
                        <div key={p.id} className={`rounded-lg border p-3 transition ${d?.status === 'REJEITADA' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex gap-3 items-start">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 break-words">{p.label}</p>
                              {p.resp && <p className="text-xs text-slate-500 mt-0.5 break-words pl-2 border-l-2 border-blue-200">{p.resp}</p>}
                              {d?.status === 'REJEITADA' && (
                                <input
                                  type="text"
                                  placeholder="Motivo da rejeição..."
                                  value={d.motivo}
                                  onChange={e => setDecisoesMap(prev => ({ ...prev, [p.id]: { status: 'REJEITADA', motivo: e.target.value } }))}
                                  className="mt-1.5 w-full border border-red-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                                />
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button type="button" onClick={() => setDecisoesMap(prev => { const n = { ...prev }; delete n[p.id]; return n })} className={`px-2 py-1 rounded text-xs font-medium transition ${!d ? 'bg-green-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-green-100'}`}>✓ OK</button>
                              <button type="button" onClick={() => setDecisoesMap(prev => ({ ...prev, [p.id]: { status: 'REJEITADA', motivo: '' } }))} className={`px-2 py-1 rounded text-xs font-medium transition ${d?.status === 'REJEITADA' ? 'bg-red-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-red-100'}`}>✗ Reprovar</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {/* Atividades */}
              {nc.atividades?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Atividades do Plano</p>
                  <div className="space-y-2">
                    {nc.atividades.map((a, i) => {
                      const d = decisoesMap[a.id]
                      return (
                        <div key={a.id} className={`rounded-lg border p-3 transition ${d?.status === 'REJEITADA' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex gap-3 items-start">
                            <span className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 bg-blue-100 text-blue-700">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 break-words">{a.titulo}</p>
                              {a.descricao && <p className="text-xs text-slate-500 mt-0.5 break-words">{a.descricao}</p>}
                              {d?.status === 'REJEITADA' && (
                                <input
                                  type="text"
                                  placeholder="Motivo da rejeição..."
                                  value={d.motivo}
                                  onChange={e => setDecisoesMap(prev => ({ ...prev, [a.id]: { status: 'REJEITADA', motivo: e.target.value } }))}
                                  className="mt-1.5 w-full border border-red-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                                />
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button type="button" onClick={() => setDecisoesMap(prev => { const n = { ...prev }; delete n[a.id]; return n })} className={`px-2 py-1 rounded text-xs font-medium transition ${!d ? 'bg-green-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-green-100'}`}>✓ OK</button>
                              <button type="button" onClick={() => setDecisoesMap(prev => ({ ...prev, [a.id]: { status: 'REJEITADA', motivo: '' } }))} className={`px-2 py-1 rounded text-xs font-medium transition ${d?.status === 'REJEITADA' ? 'bg-red-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-red-100'}`}>✗ Reprovar</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button type="button" onClick={() => setShowRevisarPlanoModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
              {(() => {
                const rejeitados = Object.values(decisoesMap).filter(d => d.status === 'REJEITADA')
                if (rejeitados.length > 0) {
                  return (
                    <button
                      type="button"
                      disabled={rejeitarPlanoMutation.isPending}
                      onClick={() => {
                        const motivo = Object.entries(decisoesMap)
                          .filter(([, d]) => d.status === 'REJEITADA')
                          .map(([id, d]) => {
                            const atv = nc.atividades?.find(a => a.id === id)
                            const pqLabels: Record<string, string> = { p1: nc.porqueUm ?? '', p2: nc.porqueDois ?? '', p3: nc.porqueTres ?? '', p4: nc.porqueQuatro ?? '', p5: nc.porqueCinco ?? '' }
                            const label = atv ? `Atividade "${atv.titulo}"` : `Porquê ${id.replace('p', '')}: "${pqLabels[id]}"`
                            return d.motivo ? `${label} — ${d.motivo}` : label
                          }).join('; ')
                        rejeitarPlanoMutation.mutate(motivo, { onSuccess: () => setShowRevisarPlanoModal(false) })
                      }}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {rejeitarPlanoMutation.isPending ? 'Rejeitando...' : `Rejeitar Plano (${rejeitados.length} item${rejeitados.length > 1 ? 's' : ''})`}
                    </button>
                  )
                }
                return (
                  <button
                    type="button"
                    disabled={aprovarPlanoMutation.isPending}
                    onClick={() => aprovarPlanoMutation.mutate(undefined, { onSuccess: () => setShowRevisarPlanoModal(false) })}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {aprovarPlanoMutation.isPending ? 'Aprovando...' : 'Aprovar Plano ✓'}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal — Revisar Atividades (EM_AJUSTE_PELO_EXTERNO) */}
      {showRevisarAtividadesModal && nc && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-6 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-slate-800">Revisar Atividades Revisadas</h3>
              <button type="button" onClick={() => setShowRevisarAtividadesModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* 5 Porquês — leitura */}
              {nc.porqueUm && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">5 Porquês (referência)</p>
                  <div className="space-y-2">
                    {[
                      { label: nc.porqueUm, resp: nc.porqueUmResposta },
                      { label: nc.porqueDois, resp: nc.porqueDoisResposta },
                      { label: nc.porqueTres, resp: nc.porqueTresResposta },
                      { label: nc.porqueQuatro, resp: nc.porqueQuatroResposta },
                      { label: nc.porqueCinco, resp: nc.porqueCincoResposta },
                    ].filter(p => p.label).map((p, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 break-words">{p.label}</p>
                          {p.resp && <p className="text-xs text-slate-500 mt-0.5 break-words pl-2 border-l-2 border-blue-200">{p.resp}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Atividades pendentes */}
              {nc.atividades?.filter(a => a.status === 'PENDENTE').length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Atividades</p>
                  <div className="space-y-2">
                    {nc.atividades.filter(a => a.status === 'PENDENTE').map((a, i) => {
                      const d = decisoesMap[a.id]
                      return (
                        <div key={a.id} className={`rounded-lg border p-3 transition ${d?.status === 'REJEITADA' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex gap-3 items-start">
                            <span className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 bg-blue-100 text-blue-700">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 break-words">{a.titulo}</p>
                              {a.descricao && <p className="text-xs text-slate-500 mt-0.5 break-words">{a.descricao}</p>}
                              {d?.status === 'REJEITADA' && (
                                <input
                                  type="text"
                                  placeholder="Motivo da rejeição..."
                                  value={d.motivo}
                                  onChange={e => setDecisoesMap(prev => ({ ...prev, [a.id]: { status: 'REJEITADA', motivo: e.target.value } }))}
                                  className="mt-1.5 w-full border border-red-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                                />
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button type="button" onClick={() => setDecisoesMap(prev => { const n = { ...prev }; delete n[a.id]; return n })} className={`px-2 py-1 rounded text-xs font-medium transition ${!d ? 'bg-green-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-green-100'}`}>✓ OK</button>
                              <button type="button" onClick={() => setDecisoesMap(prev => ({ ...prev, [a.id]: { status: 'REJEITADA', motivo: '' } }))} className={`px-2 py-1 rounded text-xs font-medium transition ${d?.status === 'REJEITADA' ? 'bg-red-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-red-100'}`}>✗ Reprovar</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button type="button" onClick={() => setShowRevisarAtividadesModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
              <button
                type="button"
                disabled={revisarAtividadesMutation.isPending}
                onClick={() => {
                  const pendentes = nc.atividades?.filter(a => a.status === 'PENDENTE') ?? []
                  const decisoes = pendentes.map(a => {
                    const d = decisoesMap[a.id]
                    return { atividadeId: a.id, status: (d?.status ?? 'APROVADA') as 'APROVADA' | 'REJEITADA', motivo: d?.motivo }
                  })
                  revisarAtividadesMutation.mutate({ decisoes }, { onSuccess: () => setShowRevisarAtividadesModal(false) })
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {revisarAtividadesMutation.isPending ? 'Enviando...' : 'Confirmar Revisão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Revisar Execução (AGUARDANDO_VALIDACAO_FINAL) */}
      {showRevisarExecucaoModal && nc && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl my-6 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-slate-800">Revisar Execução das Atividades</h3>
              <button type="button" onClick={() => setShowRevisarExecucaoModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* 5 Porquês — leitura */}
              {nc.porqueUm && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">5 Porquês (referência)</p>
                  <div className="space-y-2">
                    {[
                      { label: nc.porqueUm, resp: nc.porqueUmResposta },
                      { label: nc.porqueDois, resp: nc.porqueDoisResposta },
                      { label: nc.porqueTres, resp: nc.porqueTresResposta },
                      { label: nc.porqueQuatro, resp: nc.porqueQuatroResposta },
                      { label: nc.porqueCinco, resp: nc.porqueCincoResposta },
                    ].filter(p => p.label).map((p, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 break-words">{p.label}</p>
                          {p.resp && <p className="text-xs text-slate-500 mt-0.5 break-words pl-2 border-l-2 border-blue-200">{p.resp}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Atividades com execução */}
              {nc.atividades?.filter(a => a.statusExecucao === 'PENDENTE').length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Atividades Executadas</p>
                  <div className="space-y-2">
                    {nc.atividades.filter(a => a.statusExecucao === 'PENDENTE').map((a, i) => {
                      const d = decisoesMap[a.id]
                      return (
                        <div key={a.id} className={`rounded-lg border p-3 transition ${d?.status === 'REJEITADA' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex gap-3 items-start">
                            <span className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center shrink-0 bg-blue-100 text-blue-700">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 break-words">{a.titulo}</p>
                              {a.descricaoExecucao && <p className="text-xs text-blue-600 mt-0.5 break-words italic">Execução: {a.descricaoExecucao}</p>}
                              {d?.status === 'REJEITADA' && (
                                <input
                                  type="text"
                                  placeholder="Motivo da rejeição..."
                                  value={d.motivo}
                                  onChange={e => setDecisoesMap(prev => ({ ...prev, [a.id]: { status: 'REJEITADA', motivo: e.target.value } }))}
                                  className="mt-1.5 w-full border border-red-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                                />
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button type="button" onClick={() => setDecisoesMap(prev => { const n = { ...prev }; delete n[a.id]; return n })} className={`px-2 py-1 rounded text-xs font-medium transition ${!d ? 'bg-green-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-green-100'}`}>✓ OK</button>
                              <button type="button" onClick={() => setDecisoesMap(prev => ({ ...prev, [a.id]: { status: 'REJEITADA', motivo: '' } }))} className={`px-2 py-1 rounded text-xs font-medium transition ${d?.status === 'REJEITADA' ? 'bg-red-600 text-white' : 'bg-gray-100 text-slate-500 hover:bg-red-100'}`}>✗ Reprovar</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button type="button" onClick={() => setShowRevisarExecucaoModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
              <button
                type="button"
                disabled={revisarExecucaoMutation.isPending}
                onClick={() => {
                  const pendentes = nc.atividades?.filter(a => a.statusExecucao === 'PENDENTE') ?? []
                  const decisoes = pendentes.map(a => {
                    const d = decisoesMap[a.id]
                    return { atividadeId: a.id, status: (d?.status ?? 'APROVADA') as 'APROVADA' | 'REJEITADA', motivo: d?.motivo }
                  })
                  revisarExecucaoMutation.mutate({ decisoes }, { onSuccess: () => setShowRevisarExecucaoModal(false) })
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {revisarExecucaoMutation.isPending ? 'Enviando...' : 'Confirmar Revisão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
