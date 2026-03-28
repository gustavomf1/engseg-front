import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getNaoConformidade } from '../../api/naoConformidade'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import SeveridadeBadge from '../../components/SeveridadeBadge'
import { ArrowLeft, CheckCircle, Clock, FileText, Shield, RefreshCw, History } from 'lucide-react'
import EvidenciaUpload from '../../components/EvidenciaUpload'
import { formatDate, formatDateTime } from '../../utils/date'
import { TipoAcaoHistorico } from '../../types'

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

  const { data: nc, isLoading } = useQuery({
    queryKey: ['nao-conformidade', id],
    queryFn: () => getNaoConformidade(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="text-slate-400 py-8 text-center">Carregando...</div>
  if (!nc) return <div className="text-red-500 py-8 text-center">NC não encontrada</div>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-800">NC — {nc.titulo}</h2>
            <StatusBadge status={nc.status} type="nc" />
            <SeveridadeBadge nivel={nc.nivelSeveridade} />
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
            <p className="text-slate-800 break-words">{nc.engConstruturaNome ? `${nc.engConstruturaNome} (${nc.engConstrutoraEmail})` : nc.engConstrutoraEmail || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Eng. Responsável</p>
            <p className="text-slate-800 break-words">{nc.engVerificacaoNome ? `${nc.engVerificacaoNome} (${nc.engVerificacaoEmail})` : nc.engVerificacaoEmail || '—'}</p>
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
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-slate-800 break-words">{p.pergunta}</p>
                  {p.resposta && <p className="text-sm text-slate-600 break-words pl-3 border-l-2 border-blue-200">{p.resposta}</p>}
                </div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-blue-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Causa Raiz</p>
              <p className="text-sm font-medium text-slate-800 bg-blue-50 rounded-lg px-3 py-2">{nc.causaRaiz}</p>
            </div>
          </div>
          {nc.atividades?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-100">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Plano de Atividades</p>
              <div className="space-y-1">
                {nc.atividades.map((a, i) => (
                  <div key={a.id} className="flex gap-2">
                    <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-slate-800 break-words">{a.descricao}</p>
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

      {/* Histórico de decisões */}
      {nc.historico?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
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
    </div>
  )
}
