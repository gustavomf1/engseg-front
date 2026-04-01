import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDesvio, updateDesvio } from '../api/desvio'
import { getNaoConformidade, updateNaoConformidade } from '../api/naoConformidade'
import { Desvio, NaoConformidade, Norma } from '../types'
import { getTrechosNorma } from '../api/ncTrechoNorma'
import { getEstabelecimentos } from '../api/estabelecimento'
import { getLocalizacoes } from '../api/localizacao'
import { getUsuarios } from '../api/usuario'
import {
  ArrowLeft, Pencil, X, Save, MapPin, Calendar, Shield, AlertTriangle,
  FileText, User, Building2, Clock, CheckCircle, Ban, BookOpen, RefreshCw
} from 'lucide-react'
import EvidenciaUpload from '../components/EvidenciaUpload'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../utils/date'
import { useWorkspace } from '../contexts/WorkspaceContext'

const statusNCMap: Record<string, { label: string; color: string }> = {
  ABERTA:        { label: 'Aberta',           color: 'bg-yellow-100 text-yellow-700' },
  EM_TRATAMENTO: { label: 'Em Tratamento',    color: 'bg-blue-100 text-blue-700' },
  CONCLUIDO:     { label: 'Concluído',         color: 'bg-green-100 text-green-700' },
  NAO_RESOLVIDA: { label: 'Vencida',          color: 'bg-red-100 text-red-700' },
}

const nivelMap: Record<string, string> = {
  BAIXO:   'bg-green-100 text-green-700',
  MEDIO:   'bg-yellow-100 text-yellow-700',
  ALTO:    'bg-orange-100 text-orange-700',
  CRITICO: 'bg-red-100 text-red-700',
}

export default function OcorrenciaDetailPage() {
  const { tipo, id } = useParams<{ tipo: string; id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { empresaFilha } = useWorkspace()
  const isDesvio = tipo === 'DESVIO'
  const isTecnico = user?.perfil === 'TECNICO'

  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [normaModal, setNormaModal] = useState<Norma | null>(null)

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

  const { data: estabelecimentos = [] } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: () => getEstabelecimentos(true),
    enabled: editando,
  })

  const { data: localizacoes = [] } = useQuery({
    queryKey: ['localizacoes'],
    queryFn: () => getLocalizacoes(),
    enabled: editando,
  })

  const localizacoesAtivas = (localizacoes as Array<{ id: string; nome: string; ativo: boolean; estabelecimentoId: string }>)
    .filter(l => l.ativo && l.estabelecimentoId === form.estabelecimentoId)

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => getUsuarios(true),
    enabled: editando && !isDesvio,
  })

  const { data: usuariosFilha = [] } = useQuery({
    queryKey: ['usuarios', 'empresa', empresaFilha?.id],
    queryFn: () => getUsuarios(true, empresaFilha!.id),
    enabled: editando && !isDesvio && !!empresaFilha,
  })

  const engenheiros = (usuarios as Array<{ id: string; nome: string; perfil: string; ativo: boolean }>)
    .filter(u => u.perfil === 'ENGENHEIRO' && u.ativo)

  const externos = (usuariosFilha as Array<{ id: string; nome: string; perfil: string; ativo: boolean }>)
    .filter(u => (u.perfil === 'EXTERNO' || u.perfil === 'ENGENHEIRO') && u.ativo)

  const ocorrencia = isDesvio ? desvio : nc

  useEffect(() => {
    if (desvio && isDesvio) {
      setForm({
        titulo: desvio.titulo,
        localizacaoId: desvio.localizacaoId || '',
        descricao: desvio.descricao,
        regraDeOuro: desvio.regraDeOuro,
        estabelecimentoId: desvio.estabelecimentoId,
      })
    }
  }, [desvio, isDesvio])

  useEffect(() => {
    if (nc && !isDesvio) {
      setForm({
        titulo: nc.titulo,
        localizacaoId: nc.localizacaoId || '',
        descricao: nc.descricao,
        regraDeOuro: nc.regraDeOuro,
        estabelecimentoId: nc.estabelecimentoId,
        engResponsavelConstrutoraId: nc.engResponsavelConstrutoraId ?? '',
        engResponsavelVerificacaoId: nc.engResponsavelVerificacaoId ?? '',
        reincidencia: nc.reincidencia ?? false,
        ncAnteriorId: nc.ncAnteriorId ?? '',
      })
    }
  }, [nc, isDesvio])

  const mutation = useMutation<Desvio | NaoConformidade, Error, void>({
    mutationFn: () => {
      if (isDesvio) {
        return updateDesvio(id!, {
          titulo: form.titulo,
          localizacaoId: form.localizacaoId || undefined,
          descricao: form.descricao,
          regraDeOuro: form.regraDeOuro,
          estabelecimentoId: form.estabelecimentoId,
          orientacaoRealizada: form.descricao,
        })
      } else {
        return updateNaoConformidade(id!, {
          titulo: form.titulo,
          localizacaoId: form.localizacaoId || undefined,
          descricao: form.descricao,
          regraDeOuro: form.regraDeOuro,
          nivelSeveridade: 'MEDIO',
          estabelecimentoId: form.estabelecimentoId,
          engResponsavelConstrutoraId: form.engResponsavelConstrutoraId || undefined,
          engResponsavelVerificacaoId: form.engResponsavelVerificacaoId || undefined,
          reincidencia: form.reincidencia ?? false,
          ncAnteriorId: form.reincidencia && form.ncAnteriorId ? form.ncAnteriorId : undefined,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
      queryClient.invalidateQueries({ queryKey: [isDesvio ? 'desvio' : 'nc', id] })
      setEditando(false)
    },
  })

  function set(field: string, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (!ocorrencia) {
    return <div className="text-center py-12 text-slate-400">Carregando...</div>
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
  const valueClass = "text-sm text-slate-800"

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div>
        <div className="text-xs text-slate-400 mb-1">{label}</div>
        {children}
      </div>
    )
  }

  const estabList = estabelecimentos as Array<{ id: string; nome: string; ativo: boolean }>

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/ocorrencias')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex gap-2">
          {/* Técnico só pode editar NC com status ABERTA */}
          {(() => {
            const ncEmTratamento = !isDesvio && nc && nc.status !== 'ABERTA'
            const bloqueado = isTecnico && ncEmTratamento
            if (bloqueado) return null

            return editando ? (
              <>
                <button
                  onClick={() => setEditando(false)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition"
                >
                  <X size={15} /> Cancelar
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-60 transition"
                >
                  <Save size={15} /> {mutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-slate-700 hover:bg-gray-50 transition"
              >
                <Pencil size={15} /> Editar
              </button>
            )
          })()}
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDesvio ? 'bg-yellow-100' : 'bg-red-100'}`}>
              {isDesvio
                ? <AlertTriangle size={20} className="text-yellow-500" />
                : <FileText size={20} className="text-red-500" />}
            </div>
            <div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDesvio ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {isDesvio ? 'Desvio' : 'Não Conformidade'}
              </span>
            </div>
            {!isDesvio && (ocorrencia as any).regraDeOuro && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                <Shield size={12} /> Regra de Ouro
              </span>
            )}
            {!isDesvio && (ocorrencia as any).reincidencia && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                <RefreshCw size={12} /> Reincidência
              </span>
            )}
          </div>

          {/* Status badge */}
          {isDesvio
            ? <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                Concluído
              </span>
            : <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusNCMap[nc!.status]?.color}`}>
                {statusNCMap[nc!.status]?.label}
              </span>
          }
          {!isDesvio && nc?.vencida && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              Vencida
            </span>
          )}
        </div>

        {/* Título */}
        <div className="mb-6">
          {editando
            ? <input value={form.titulo} onChange={e => set('titulo', e.target.value)} className={`${inputClass} text-lg font-bold`} />
            : <h2 className="text-xl font-bold text-slate-800 break-words overflow-hidden">{(ocorrencia as any).titulo}</h2>
          }
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <Field label="Estabelecimento">
              {editando
                ? <select value={form.estabelecimentoId} onChange={e => set('estabelecimentoId', e.target.value)} className={inputClass}>
                    {estabList.filter(e => e.ativo).map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                : <div className={`${valueClass} flex items-center gap-1.5`}><Building2 size={13} className="text-slate-400" />{(ocorrencia as any).estabelecimentoNome}</div>
              }
            </Field>

            <Field label="Localização">
              {editando
                ? <select value={form.localizacaoId} onChange={e => set('localizacaoId', e.target.value)} className={inputClass}>
                    <option value="">— Nenhuma —</option>
                    {localizacoesAtivas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                : <div className={`${valueClass} flex items-center gap-1.5`}><MapPin size={13} className="text-slate-400" />{(ocorrencia as any).localizacaoNome || '—'}</div>
              }
            </Field>

            <Field label="Data de Registro">
              <div className={`${valueClass} flex items-center gap-1.5`}><Calendar size={13} className="text-slate-400" />{formatDate((ocorrencia as any).dataRegistro)}</div>
            </Field>

            {(ocorrencia as any).usuarioCriacaoNome && (
              <Field label="Registrado por">
                <div className={`${valueClass} flex items-center gap-1.5`}><User size={13} className="text-slate-400" />{(ocorrencia as any).usuarioCriacaoNome}{(ocorrencia as any).usuarioCriacaoEmail ? ` (${(ocorrencia as any).usuarioCriacaoEmail})` : ''}</div>
              </Field>
            )}
            {!(ocorrencia as any).usuarioCriacaoNome && (ocorrencia as any).tecnicoNome && (
              <Field label="Registrado por">
                <div className={`${valueClass} flex items-center gap-1.5`}><User size={13} className="text-slate-400" />{(ocorrencia as any).tecnicoNome}</div>
              </Field>
            )}

            {!isDesvio && (
              <Field label="Regra de Ouro">
                {editando
                  ? <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.regraDeOuro} onChange={e => set('regraDeOuro', e.target.checked)} className="h-4 w-4 rounded" />
                      <span className="text-sm text-slate-700">Sim, viola uma regra crítica</span>
                    </label>
                  : <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${form.regraDeOuro ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-slate-500'}`}>
                      {form.regraDeOuro ? 'Sim' : 'Não'}
                    </span>
                }
              </Field>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Field label="Descrição">
              {editando
                ? <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={4} className={inputClass} />
                : <div className={`${valueClass} whitespace-pre-wrap break-words overflow-hidden`}>{(ocorrencia as any).descricao}</div>
              }
            </Field>

            {/* NC-only fields */}
            {!isDesvio && (
              <>
                <Field label="Normas Vinculadas">
                  <div className="space-y-2">
                    {nc!.normas && nc!.normas.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {nc!.normas.map(n => {
                          const count = trechos.filter(t => t.normaId === n.id).length
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => setNormaModal(n)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                            >
                              <BookOpen size={11} />
                              {n.titulo}
                              {count > 0 && (
                                <span className="ml-0.5 bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                                  {count}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className={valueClass}>—</div>
                    )}
                  </div>
                </Field>

                <Field label="Nível de Severidade">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${nivelMap[nc!.nivelSeveridade]}`}>
                    {nc!.nivelSeveridade}
                  </span>
                </Field>

                <Field label="Data Limite">
                  <div className={`${valueClass} flex items-center gap-1.5`}><Clock size={13} className="text-slate-400" />{formatDate(nc!.dataLimiteResolucao)}</div>
                </Field>
              </>
            )}
          </div>
        </div>

        {/* NC engenheiros */}
        {!isDesvio && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 pt-6 border-t border-gray-100">
            <Field label="Eng. Responsável pela Tratativa">
              {editando
                ? <select value={form.engResponsavelConstrutoraId} onChange={e => set('engResponsavelConstrutoraId', e.target.value)} className={inputClass}>
                    <option value="">— Nenhum —</option>
                    {externos.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.perfil})</option>)}
                  </select>
                : <div className={`${valueClass} flex items-center gap-1.5`}>
                    <User size={13} className="text-slate-400" />
                    {nc!.engConstruturaNome ? `${nc!.engConstruturaNome} (${nc!.engConstrutoraEmail})` : nc!.engConstrutoraEmail || '—'}
                  </div>
              }
            </Field>

            <Field label="Eng. Responsável pela NC">
              {editando
                ? <select value={form.engResponsavelVerificacaoId} onChange={e => set('engResponsavelVerificacaoId', e.target.value)} className={inputClass}>
                    <option value="">— Nenhum —</option>
                    {engenheiros.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                : <div className={`${valueClass} flex items-center gap-1.5`}>
                    <User size={13} className="text-slate-400" />
                    {nc!.engVerificacaoNome ? `${nc!.engVerificacaoNome} (${nc!.engVerificacaoEmail})` : nc!.engVerificacaoEmail || '—'}
                  </div>
              }
            </Field>
          </div>
        )}
      </div>

      {/* Evidências da Ocorrência */}
      {id && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <EvidenciaUpload
            {...(isDesvio ? { desvioId: id } : { naoConformidadeId: id })}
            tipoEvidencia="OCORRENCIA"
            readOnly={isTecnico && (isDesvio || (!!nc && nc.status !== 'ABERTA'))}
            titulo="Evidências da Ocorrência"
          />
        </div>
      )}

      {/* Evidências da Tratativa */}
      {!isDesvio && id && nc && nc.status !== 'ABERTA' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <EvidenciaUpload naoConformidadeId={id} tipoEvidencia="TRATATIVA" readOnly titulo="Evidências da Tratativa" />
        </div>
      )}

      {/* Cadeia de reincidências (NC only) */}
      {!isDesvio && nc && (nc.reincidencia || (nc.reincidencias?.length ?? 0) > 0) && (
        <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={15} className="text-red-500" />
            <h3 className="text-base font-bold text-slate-800">Rastro de Reincidências</h3>
            <span className="text-xs text-slate-400">
              ({(nc.cadeiaReincidencias?.length ?? 0) + 1 + (nc.reincidencias?.length ?? 0)} ocorrência(s))
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {nc.cadeiaReincidencias?.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/ocorrencias/NAO_CONFORMIDADE/${item.id}`)}
                  className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium hover:bg-red-100 transition max-w-[180px] truncate"
                  title={item.titulo}
                >
                  {item.titulo}
                </button>
                <span className="text-slate-300 text-sm">→</span>
              </span>
            ))}
            <span className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-semibold ring-2 ring-red-300 max-w-[180px] truncate" title={nc.titulo}>
              {nc.titulo}
            </span>
            {nc.reincidencias?.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <span className="text-slate-300 text-sm">→</span>
                <button
                  onClick={() => navigate(`/ocorrencias/NAO_CONFORMIDADE/${item.id}`)}
                  className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium hover:bg-orange-100 transition max-w-[180px] truncate"
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

      {/* Histórico de tratativa (NC only, read-only) */}
      {!isDesvio && (nc!.devolutivas?.length > 0 || nc!.execucoes?.length > 0 || nc!.validacoes?.length > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">Histórico da Tratativa</h3>

          {nc!.devolutivas?.map((d, i) => (
            <div key={d.id} className="flex gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={13} className="text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-blue-600 font-medium">Plano de Ação #{i + 1}</div>
                <div className="text-sm text-slate-700 mt-0.5 break-words overflow-hidden">{d.descricaoPlanoAcao}</div>
                <div className="text-xs text-slate-400 mt-1">{d.engenheiroNome ?? '-'} · {formatDate(d.dataDevolutiva)}</div>
              </div>
            </div>
          ))}

          {nc!.execucoes?.map((e, i) => (
            <div key={e.id} className="flex gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={13} className="text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-orange-600 font-medium">Execução #{i + 1}</div>
                <div className="text-sm text-slate-700 mt-0.5 break-words overflow-hidden">{e.descricaoAcaoExecutada}</div>
                <div className="text-xs text-slate-400 mt-1">{e.engenheiroNome ?? '-'} · {formatDate(e.dataExecucao)}</div>
              </div>
            </div>
          ))}

          {nc!.validacoes?.map((v, i) => (
            <div key={v.id} className="flex gap-3 mb-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${v.parecer === 'APROVADO' ? 'bg-green-100' : 'bg-red-100'}`}>
                {v.parecer === 'APROVADO'
                  ? <CheckCircle size={13} className="text-green-600" />
                  : <Ban size={13} className="text-red-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-medium ${v.parecer === 'APROVADO' ? 'text-green-600' : 'text-red-600'}`}>
                  Validação #{i + 1} — {v.parecer === 'APROVADO' ? 'Aprovada' : 'Reprovada'}
                </div>
                {v.observacao && <div className="text-sm text-slate-700 mt-0.5 break-words overflow-hidden">{v.observacao}</div>}
                <div className="text-xs text-slate-400 mt-1">{v.engenheiroNome ?? '-'} · {formatDate(v.dataValidacao)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {/* Modal detalhes da norma */}

      {normaModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setNormaModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col" style={{height: '80vh'}} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{normaModal.titulo}</h3>
                  <p className="text-xs text-slate-400">Norma / Regulamento</p>
                </div>
              </div>
              <button onClick={() => setNormaModal(null)} className="text-slate-400 hover:text-slate-600 transition p-1">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {normaModal.descricao ? (
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">{normaModal.descricao}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">Nenhuma descrição cadastrada para esta norma.</p>
              )}
              {trechos.filter(t => t.normaId === normaModal.id).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Trechos Vinculados à NC</p>
                  <div className="space-y-3">
                    {trechos.filter(t => t.normaId === normaModal.id).map(t => (
                      <div key={t.id} className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                        {t.clausulaReferencia && (
                          <p className="text-xs font-semibold text-blue-700 mb-1.5">{t.clausulaReferencia}</p>
                        )}
                        <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{t.textoEditado}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end p-6 pt-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setNormaModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-lg transition">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
