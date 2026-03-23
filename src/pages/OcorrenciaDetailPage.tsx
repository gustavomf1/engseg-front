import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDesvio, updateDesvio } from '../api/desvio'
import { getNaoConformidade, updateNaoConformidade } from '../api/naoConformidade'
import { Desvio, NaoConformidade } from '../types'
import { getEstabelecimentos } from '../api/estabelecimento'
import { getLocalizacoes } from '../api/localizacao'
import { getUsuarios } from '../api/usuario'
import {
  ArrowLeft, Pencil, X, Save, MapPin, Calendar, Shield, AlertTriangle,
  FileText, User, Building2, Clock, CheckCircle, Ban
} from 'lucide-react'
import EvidenciaUpload from '../components/EvidenciaUpload'
import { useAuth } from '../contexts/AuthContext'

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
  const isDesvio = tipo === 'DESVIO'
  const isTecnico = user?.perfil === 'TECNICO'

  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})

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

  const { data: estabelecimentos = [] } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: getEstabelecimentos,
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
    queryFn: getUsuarios,
    enabled: editando && !isDesvio,
  })

  const engenheiros = (usuarios as Array<{ id: string; nome: string; perfil: string; ativo: boolean }>)
    .filter(u => u.perfil === 'ENGENHEIRO' && u.ativo)

  const externos = (usuarios as Array<{ id: string; nome: string; perfil: string; ativo: boolean }>)
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
        nrRelacionada: nc.nrRelacionada,
        estabelecimentoId: nc.estabelecimentoId,
        engResponsavelConstrutoraId: nc.engResponsavelConstrutoraId ?? '',
        engResponsavelVerificacaoId: nc.engResponsavelVerificacaoId ?? '',
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
          nrRelacionada: form.nrRelacionada || '',
          nivelSeveridade: 'MEDIO',
          estabelecimentoId: form.estabelecimentoId,
          engResponsavelConstrutoraId: form.engResponsavelConstrutoraId || undefined,
          engResponsavelVerificacaoId: form.engResponsavelVerificacaoId || undefined,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
      queryClient.invalidateQueries({ queryKey: [isDesvio ? 'desvio' : 'nc', id] })
      setEditando(false)
    },
  })

  function formatDate(dt?: string) {
    if (!dt) return '-'
    return new Date(dt).toLocaleDateString('pt-BR')
  }

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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
        </div>

        {/* Título */}
        <div className="mb-6">
          {editando
            ? <input value={form.titulo} onChange={e => set('titulo', e.target.value)} className={`${inputClass} text-lg font-bold`} />
            : <h2 className="text-xl font-bold text-slate-800">{(ocorrencia as any).titulo}</h2>
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
                : <div className={`${valueClass} whitespace-pre-wrap`}>{(ocorrencia as any).descricao}</div>
              }
            </Field>

            {/* NC-only fields */}
            {!isDesvio && (
              <>
                <Field label="Norma/Regra Violada">
                  {editando
                    ? <input value={form.nrRelacionada} onChange={e => set('nrRelacionada', e.target.value)} className={inputClass} />
                    : <div className={valueClass}>{nc!.nrRelacionada || '-'}</div>
                  }
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

      {/* Histórico de tratativa (NC only, read-only) */}
      {!isDesvio && (nc!.devolutivas?.length > 0 || nc!.execucoes?.length > 0 || nc!.validacao) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-4">Histórico da Tratativa</h3>

          {nc!.devolutivas?.map((d, i) => (
            <div key={d.id} className="flex gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={13} className="text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-blue-600 font-medium">Plano de Ação #{i + 1}</div>
                <div className="text-sm text-slate-700 mt-0.5">{d.descricaoPlanoAcao}</div>
                <div className="text-xs text-slate-400 mt-1">{d.engenheiroNome ?? '-'} · {formatDate(d.dataDevolutiva)}</div>
              </div>
            </div>
          ))}

          {nc!.execucoes?.map((e, i) => (
            <div key={e.id} className="flex gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={13} className="text-orange-600" />
              </div>
              <div>
                <div className="text-xs text-orange-600 font-medium">Execução #{i + 1}</div>
                <div className="text-sm text-slate-700 mt-0.5">{e.descricaoAcaoExecutada}</div>
                <div className="text-xs text-slate-400 mt-1">{e.engenheiroNome ?? '-'} · {formatDate(e.dataExecucao)}</div>
              </div>
            </div>
          ))}

          {nc!.validacao && (
            <div className="flex gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${nc!.validacao.parecer === 'APROVADO' ? 'bg-green-100' : 'bg-red-100'}`}>
                {nc!.validacao.parecer === 'APROVADO'
                  ? <CheckCircle size={13} className="text-green-600" />
                  : <Ban size={13} className="text-red-600" />}
              </div>
              <div>
                <div className={`text-xs font-medium ${nc!.validacao.parecer === 'APROVADO' ? 'text-green-600' : 'text-red-600'}`}>
                  Validação — {nc!.validacao.parecer === 'APROVADO' ? 'Aprovada' : 'Reprovada'}
                </div>
                {nc!.validacao.observacao && <div className="text-sm text-slate-700 mt-0.5">{nc!.validacao.observacao}</div>}
                <div className="text-xs text-slate-400 mt-1">{nc!.validacao.engenheiroNome ?? '-'} · {formatDate(nc!.validacao.dataValidacao)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
