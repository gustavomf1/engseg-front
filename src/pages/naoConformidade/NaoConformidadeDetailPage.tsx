import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getNaoConformidade, registrarDevolutiva, registrarExecucaoAcao, validarNaoConformidade } from '../../api/naoConformidade'
import { useAuth } from '../../contexts/AuthContext'
import StatusBadge from '../../components/StatusBadge'
import SeveridadeBadge from '../../components/SeveridadeBadge'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, CheckCircle, Clock, FileText, Shield, RefreshCw } from 'lucide-react'
import EvidenciaUpload from '../../components/EvidenciaUpload'
import { formatDate, formatDateTime } from '../../utils/date'

const devolutivaSchema = z.object({
  descricaoPlanoAcao: z.string().min(1, 'Descrição do plano de ação obrigatória'),
})

const execucaoSchema = z.object({
  descricaoAcaoExecutada: z.string().min(1, 'Descrição da ação executada obrigatória'),
})

const validacaoSchema = z.object({
  parecer: z.enum(['APROVADO', 'REPROVADO']),
  observacao: z.string().optional(),
})

type DevolutivaForm = z.infer<typeof devolutivaSchema>
type ExecucaoForm = z.infer<typeof execucaoSchema>
type ValidacaoForm = z.infer<typeof validacaoSchema>

export default function NaoConformidadeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: nc, isLoading } = useQuery({
    queryKey: ['nao-conformidade', id],
    queryFn: () => getNaoConformidade(id!),
    enabled: !!id,
  })

  const devolutivaForm = useForm<DevolutivaForm>({ resolver: zodResolver(devolutivaSchema) })
  const execucaoForm = useForm<ExecucaoForm>({ resolver: zodResolver(execucaoSchema) })
  const validacaoForm = useForm<ValidacaoForm>({ resolver: zodResolver(validacaoSchema) })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['nao-conformidade', id] })
    queryClient.invalidateQueries({ queryKey: ['nao-conformidades'] })
  }

  const devolutivaMutation = useMutation({
    mutationFn: (data: DevolutivaForm) => registrarDevolutiva(id!, data),
    onSuccess: () => { invalidate(); devolutivaForm.reset() },
  })

  const execucaoMutation = useMutation({
    mutationFn: (data: ExecucaoForm) => registrarExecucaoAcao(id!, data),
    onSuccess: () => { invalidate(); execucaoForm.reset() },
  })

  const validacaoMutation = useMutation({
    mutationFn: (data: ValidacaoForm) => validarNaoConformidade(id!, data),
    onSuccess: () => { invalidate(); validacaoForm.reset() },
  })

  if (isLoading) {
    return <div className="text-slate-400 py-8 text-center">Carregando...</div>
  }

  if (!nc) {
    return <div className="text-red-500 py-8 text-center">NC não encontrada</div>
  }

  const showDevolutivaForm = nc.status === 'ABERTA' && user?.perfil === 'EXTERNO'
  const showExecucaoForm = nc.status === 'EM_TRATAMENTO' && user?.perfil === 'EXTERNO'
  const showValidacaoForm = nc.status === 'EM_TRATAMENTO' && user?.perfil === 'ENGENHEIRO'

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
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
                <Shield size={12} />
                Regra de Ouro
              </span>
            )}
            {nc.reincidencia && (
              <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                <RefreshCw size={12} />
                Reincidência
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main info */}
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
            <p className="text-slate-800">{nc.usuarioCriacaoNome ? `${nc.usuarioCriacaoNome} (${nc.usuarioCriacaoEmail})` : '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Usuário de Registro</p>
            <p className="text-slate-800">{nc.tecnicoNome || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Eng. Responsável pela Tratativa</p>
            <p className="text-slate-800">{nc.engConstruturaNome ? `${nc.engConstruturaNome} (${nc.engConstrutoraEmail})` : nc.engConstrutoraEmail || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Eng. Responsável</p>
            <p className="text-slate-800">{nc.engVerificacaoNome ? `${nc.engVerificacaoNome} (${nc.engVerificacaoEmail})` : nc.engVerificacaoEmail || '—'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-0.5">Descrição</p>
            <p className="text-slate-800">{nc.descricao}</p>
          </div>
        </div>
      </div>

      {/* Cadeia de reincidências */}
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
            {nc.cadeiaReincidencias?.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/nao-conformidades/${item.id}`)}
                  className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium hover:bg-red-100 transition max-w-[200px] truncate"
                  title={item.titulo}
                >
                  {item.titulo}
                </button>
                <span className="text-slate-300 text-sm">→</span>
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-semibold ring-2 ring-red-300 max-w-[200px] truncate" title={nc.titulo}>
              {nc.titulo}
            </span>
            {nc.reincidencias?.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <span className="text-slate-300 text-sm">→</span>
                <button
                  onClick={() => navigate(`/nao-conformidades/${item.id}`)}
                  className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium hover:bg-orange-100 transition max-w-[200px] truncate"
                  title={item.titulo}
                >
                  {item.titulo}
                </button>
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Clique em qualquer NC para ver seus detalhes</p>
        </div>
      )}

      {/* Evidências */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <EvidenciaUpload naoConformidadeId={nc.id} readOnly={user?.perfil === 'TECNICO' && nc.status !== 'ABERTA'} />
      </div>

      {/* Devolutivas */}
      {nc.devolutivas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-blue-500" />
            <h3 className="font-semibold text-slate-700">Devolutivas / Planos de Ação</h3>
          </div>
          <div className="space-y-3">
            {nc.devolutivas.map((d) => (
              <div key={d.id} className="border border-gray-100 rounded-lg p-4 bg-blue-50">
                <p className="text-sm text-slate-800">{d.descricaoPlanoAcao}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatDateTime(d.dataDevolutiva)}{d.engenheiroNome ? ` — ${d.engenheiroNome}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execucoes */}
      {nc.execucoes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-purple-500" />
            <h3 className="font-semibold text-slate-700">Execuções de Ação</h3>
          </div>
          <div className="space-y-3">
            {nc.execucoes.map((e) => (
              <div key={e.id} className="border border-gray-100 rounded-lg p-4 bg-purple-50">
                <p className="text-sm text-slate-800">{e.descricaoAcaoExecutada}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatDateTime(e.dataExecucao)}{e.engenheiroNome ? ` — ${e.engenheiroNome}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validacao */}
      {nc.validacoes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-green-500" />
            <h3 className="font-semibold text-slate-700">Histórico de Validações</h3>
          </div>
          <div className="space-y-3">
            {nc.validacoes.map(v => (
              <div key={v.id} className={`border border-gray-100 rounded-lg p-4 ${v.parecer === 'APROVADO' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.parecer === 'APROVADO' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {v.parecer === 'APROVADO' ? 'Aprovado' : 'Reprovado'}
                  </span>
                </div>
                {v.observacao && <p className="text-sm text-slate-800">{v.observacao}</p>}
                <p className="text-xs text-slate-500 mt-2">
                  {formatDateTime(v.dataValidacao)}{v.engenheiroNome ? ` — ${v.engenheiroNome}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forms for actions */}
      {showDevolutivaForm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-4">Registrar Devolutiva / Plano de Ação</h3>
          {nc.reincidencia && nc.cadeiaReincidencias?.length > 0 && (
            <div className="mb-4 bg-orange-50 border border-orange-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={15} className="text-orange-600 shrink-0" />
                <p className="text-sm font-semibold text-orange-700">
                  Atenção: esta é a {nc.cadeiaReincidencias.length + 1}ª ocorrência do mesmo problema
                </p>
              </div>
              <p className="text-xs text-orange-600 mb-2">As abordagens anteriores não resolveram. Revise a causa raiz e proponha uma ação diferente.</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {nc.cadeiaReincidencias.map((item) => (
                  <span key={item.id} className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-orange-100 border border-orange-200 text-orange-700 font-medium max-w-[160px] truncate" title={item.titulo}>
                      {item.titulo}
                    </span>
                    <span className="text-orange-300">→</span>
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-semibold max-w-[160px] truncate" title={nc.titulo}>
                  {nc.titulo}
                </span>
              </div>
            </div>
          )}
          <form onSubmit={devolutivaForm.handleSubmit((data) => devolutivaMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Plano de Ação *</label>
              <textarea {...devolutivaForm.register('descricaoPlanoAcao')} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Descreva o plano de ação para resolver esta não conformidade..." />
              {devolutivaForm.formState.errors.descricaoPlanoAcao && (
                <p className="text-red-500 text-xs mt-1">{devolutivaForm.formState.errors.descricaoPlanoAcao.message}</p>
              )}
            </div>
            {devolutivaMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">Erro ao registrar devolutiva.</div>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={devolutivaMutation.isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {devolutivaMutation.isPending ? 'Registrando...' : 'Registrar Devolutiva'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showExecucaoForm && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-4">Registrar Execução de Ação</h3>
          {nc.reincidencia && nc.cadeiaReincidencias?.length > 0 && (
            <div className="mb-4 bg-orange-50 border border-orange-300 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={15} className="text-orange-600 shrink-0" />
                <p className="text-sm font-semibold text-orange-700">
                  Atenção: esta é a {nc.cadeiaReincidencias.length + 1}ª ocorrência do mesmo problema
                </p>
              </div>
              <p className="text-xs text-orange-600 mb-2">Certifique-se de que a ação executada aborda a causa raiz, não apenas o sintoma.</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {nc.cadeiaReincidencias.map((item) => (
                  <span key={item.id} className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-orange-100 border border-orange-200 text-orange-700 font-medium max-w-[160px] truncate" title={item.titulo}>
                      {item.titulo}
                    </span>
                    <span className="text-orange-300">→</span>
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-semibold max-w-[160px] truncate" title={nc.titulo}>
                  {nc.titulo}
                </span>
              </div>
            </div>
          )}
          <form onSubmit={execucaoForm.handleSubmit((data) => execucaoMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição da Ação Executada *</label>
              <textarea {...execucaoForm.register('descricaoAcaoExecutada')} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Descreva a ação executada..." />
              {execucaoForm.formState.errors.descricaoAcaoExecutada && (
                <p className="text-red-500 text-xs mt-1">{execucaoForm.formState.errors.descricaoAcaoExecutada.message}</p>
              )}
            </div>
            {execucaoMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">Erro ao registrar execução.</div>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={execucaoMutation.isPending} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60">
                {execucaoMutation.isPending ? 'Registrando...' : 'Registrar Execução'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showValidacaoForm && (
        <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-4">Validar Não Conformidade</h3>
          <form onSubmit={validacaoForm.handleSubmit((data) => validacaoMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parecer *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...validacaoForm.register('parecer')} type="radio" value="APROVADO" className="text-green-600" />
                  <span className="text-sm text-green-700 font-medium">Aprovado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...validacaoForm.register('parecer')} type="radio" value="REPROVADO" className="text-red-600" />
                  <span className="text-sm text-red-700 font-medium">Reprovado</span>
                </label>
              </div>
              {validacaoForm.formState.errors.parecer && (
                <p className="text-red-500 text-xs mt-1">{validacaoForm.formState.errors.parecer.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observação</label>
              <textarea {...validacaoForm.register('observacao')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="Observações adicionais..." />
            </div>
            {validacaoMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">Erro ao registrar validação.</div>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={validacaoMutation.isPending} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">
                {validacaoMutation.isPending ? 'Validando...' : 'Registrar Validação'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
