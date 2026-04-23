import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDesvio, updateDesvio, getDesvio } from '../api/desvio'
import { createNaoConformidade, updateNaoConformidade, getNaoConformidade, getNaoConformidades } from '../api/naoConformidade'
import { uploadEvidencia, uploadEvidenciaDesvio } from '../api/evidencia'
import { getLocalizacoes } from '../api/localizacao'
import { getUsuarios } from '../api/usuario'
import { getNormas } from '../api/norma'
import { vincularTrechoNorma } from '../api/ncTrechoNorma'
import { getEmpresasMae } from '../api/empresa'
import { getEstabelecimentos, getEmpresasDoEstabelecimento } from '../api/estabelecimento'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import { Camera, AlertCircle, FileText, Calendar, Search, X, PenLine } from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
import BuscaTrechoModal from '../components/BuscaTrechoModal'
import TrechoManualModal from '../components/TrechoManualModal'

interface TrechoPendente {
  normaId: string
  normaTitulo: string
  clausulaReferencia?: string
  textoEditado: string
}

type Tipo = 'DESVIO' | 'NAO_CONFORMIDADE'

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  localizacaoId: z.string().optional(),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  regraDeOuro: z.boolean().optional(),
  estabelecimentoId: z.string().min(1, 'Selecione um estabelecimento'),
  engResponsavelConstrutoraId: z.string().optional(),
  engResponsavelVerificacaoId: z.string().optional(),
  responsavelDesvioId: z.string().optional(),
  responsavelTratativaId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegistroOcorrenciaPage() {
  const { tipo: tipoParam, id } = useParams<{ tipo?: string; id?: string }>()
  const isEditing = !!id && !!tipoParam
  const [tipo, setTipo] = useState<Tipo>(tipoParam === 'NAO_CONFORMIDADE' ? 'NAO_CONFORMIDADE' : 'DESVIO')
  const [arquivos, setArquivos] = useState<File[]>([])
  const [normasSelecionadas, setNormasSelecionadas] = useState<string[]>([])
  const [isReincidencia, setIsReincidencia] = useState(false)
  const [ncAnteriorId, setNcAnteriorId] = useState<string>('')
  const [trechosPendentes, setTrechosPendentes] = useState<TrechoPendente[]>([])
  const [buscaModal, setBuscaModal] = useState<{ normaId: string; normaTitulo: string } | null>(null)
  const [manualModal, setManualModal] = useState<{ normaId: string; normaTitulo: string } | null>(null)
  const [adminEmpresaId, setAdminEmpresaId] = useState('')
  const [adminEstabelecimentoId, setAdminEstabelecimentoId] = useState('')
  const [adminEmpresaFilhaId, setAdminEmpresaFilhaId] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { estabelecimento: estabelecimentoSelecionado, empresaFilha } = useWorkspace()
  const { user } = useAuth()

  const { data: empresasAdmin = [] } = useQuery({
    queryKey: ['empresas-mae-admin'],
    queryFn: () => getEmpresasMae(true),
    enabled: !!user?.isAdmin,
  })

  const { data: estabelecimentosAdmin = [] } = useQuery({
    queryKey: ['estabelecimentos-admin', adminEmpresaId],
    queryFn: () => getEstabelecimentos(true, adminEmpresaId),
    enabled: !!user?.isAdmin && !!adminEmpresaId,
  })

  const { data: empresasFilhaAdmin = [] } = useQuery({
    queryKey: ['empresas-filha-admin', adminEstabelecimentoId],
    queryFn: () => getEmpresasDoEstabelecimento(adminEstabelecimentoId),
    enabled: !!user?.isAdmin && !!adminEstabelecimentoId,
  })

  const estabelecimentoEfetivo = useMemo(
    () => user?.isAdmin ? { id: adminEstabelecimentoId } : estabelecimentoSelecionado,
    [user?.isAdmin, adminEstabelecimentoId, estabelecimentoSelecionado]
  )

  const empresaFilhaEfetiva = useMemo(
    () => user?.isAdmin ? { id: adminEmpresaFilhaId } : empresaFilha,
    [user?.isAdmin, adminEmpresaFilhaId, empresaFilha]
  )

  const { data: localizacoes = [] } = useQuery({
    queryKey: ['localizacoes', estabelecimentoEfetivo?.id],
    queryFn: () => getLocalizacoes(estabelecimentoEfetivo?.id),
    enabled: !!estabelecimentoEfetivo?.id,
  })

  const localizacoesAtivas = (localizacoes as Array<{ id: string; nome: string; ativo: boolean; estabelecimentoId: string }>)
    .filter(l => l.ativo && l.estabelecimentoId === estabelecimentoEfetivo?.id)

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => getUsuarios(true),
  })

  const { data: usuariosFilha = [] } = useQuery({
    queryKey: ['usuarios', 'empresa', empresaFilhaEfetiva?.id],
    queryFn: () => getUsuarios(true, empresaFilhaEfetiva?.id ?? ''),
    enabled: !!empresaFilhaEfetiva?.id,
  })

  const engenheiros = (usuarios as Array<{ id: string; nome: string; perfil: string; ativo: boolean }>)
    .filter(u => (u.perfil === 'ENGENHEIRO' || u.perfil === 'TECNICO') && u.ativo)

  const externos = (usuariosFilha as Array<{ id: string; nome: string; perfil: string; ativo: boolean }>)
    .filter(u => (u.perfil === 'EXTERNO' || u.perfil === 'ENGENHEIRO') && u.ativo)

  const { data: normas = [] } = useQuery({
    queryKey: ['normas'],
    queryFn: () => getNormas(true),
  })

  const { data: ncsEstabelecimento = [] } = useQuery({
    queryKey: ['nao-conformidades', 'estabelecimento', estabelecimentoEfetivo?.id],
    queryFn: () => getNaoConformidades({ estabelecimentoId: estabelecimentoEfetivo?.id }),
    enabled: tipo === 'NAO_CONFORMIDADE' && !!estabelecimentoEfetivo?.id,
  })

  type NcItem = { id: string; titulo: string; status: string; dataRegistro: string; ncAnteriorId?: string }

  const ncsParaAnterior = useMemo(() =>
    (ncsEstabelecimento as NcItem[]).filter(nc => nc.id !== id),
    [ncsEstabelecimento, id]
  )

  const reincidenciaWarning = useMemo(() => {
    if (!ncAnteriorId) return null
    const allNcs = ncsEstabelecimento as NcItem[]
    // verifica se a NC selecionada já é ncAnterior de alguma outra NC (exceto a que está sendo editada)
    const successor = allNcs.find(nc => nc.ncAnteriorId === ncAnteriorId && nc.id !== id)
    if (!successor) return null
    // percorre a cadeia até o fim real
    let fim = successor
    while (true) {
      const prox = allNcs.find(nc => nc.ncAnteriorId === fim.id && nc.id !== id)
      if (!prox) break
      fim = prox
    }
    return fim
  }, [ncAnteriorId, ncsEstabelecimento, id])

  const { data: ncAnteriorData } = useQuery({
    queryKey: ['nc-anterior-preview', ncAnteriorId],
    queryFn: () => getNaoConformidade(ncAnteriorId),
    enabled: isReincidencia && !!ncAnteriorId,
  })

  const { data: desvioData } = useQuery({
    queryKey: ['desvio', id],
    queryFn: () => getDesvio(id!),
    enabled: isEditing && tipoParam === 'DESVIO',
  })

  const { data: ncData } = useQuery({
    queryKey: ['nc', id],
    queryFn: () => getNaoConformidade(id!),
    enabled: isEditing && tipoParam === 'NAO_CONFORMIDADE',
  })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      regraDeOuro: false,
      estabelecimentoId: estabelecimentoSelecionado?.id || '',
    },
  })

  useEffect(() => {
    if (desvioData) {
      reset({
        titulo: desvioData.titulo,
        localizacaoId: desvioData.localizacaoId || '',
        descricao: desvioData.descricao,
        regraDeOuro: desvioData.regraDeOuro,
        estabelecimentoId: desvioData.estabelecimentoId,
        responsavelDesvioId: desvioData.responsavelDesvioId || '',
        responsavelTratativaId: desvioData.responsavelTratativaId || '',
      })
    }
  }, [desvioData, reset])

  useEffect(() => {
    if (ncData) {
      reset({
        titulo: ncData.titulo,
        localizacaoId: ncData.localizacaoId || '',
        descricao: ncData.descricao,
        regraDeOuro: ncData.regraDeOuro,
        estabelecimentoId: ncData.estabelecimentoId,
        engResponsavelConstrutoraId: ncData.engResponsavelConstrutoraId ?? '',
        engResponsavelVerificacaoId: ncData.engResponsavelVerificacaoId ?? '',
      })
      if (ncData.normas) {
        setNormasSelecionadas(ncData.normas.map(n => n.id))
      }
      setIsReincidencia(ncData.reincidencia ?? false)
      setNcAnteriorId(ncData.ncAnteriorId ?? '')
    }
  }, [ncData, reset])

  useEffect(() => {
    if (user?.isAdmin && !isEditing) {
      setValue('estabelecimentoId', adminEstabelecimentoId)
    }
  }, [adminEstabelecimentoId, user?.isAdmin, isEditing, setValue])

  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() + 30)
  const dataLimiteStr = dataLimite.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const base = {
        titulo: data.titulo,
        localizacaoId: data.localizacaoId || undefined,
        descricao: data.descricao,
        estabelecimentoId: data.estabelecimentoId,
        regraDeOuro: data.regraDeOuro ?? false,
      }
      let result
      if (tipo === 'DESVIO') {
        if (!data.responsavelDesvioId) throw new Error('Responsável pelo desvio obrigatório')
        if (!data.responsavelTratativaId) throw new Error('Responsável pela tratativa obrigatório')
        const req = {
          ...base,
          orientacaoRealizada: data.descricao,
          responsavelDesvioId: data.responsavelDesvioId,
          responsavelTratativaId: data.responsavelTratativaId,
        }
        result = isEditing ? await updateDesvio(id!, req) : await createDesvio(req)
      } else {
        const req = {
          ...base,
          nivelSeveridade: 'MEDIO' as const,
          engResponsavelConstrutoraId: data.engResponsavelConstrutoraId || undefined,
          engResponsavelVerificacaoId: data.engResponsavelVerificacaoId || undefined,
          normaIds: normasSelecionadas.length > 0 ? normasSelecionadas : undefined,
          reincidencia: isReincidencia,
          ncAnteriorId: isReincidencia && ncAnteriorId ? ncAnteriorId : undefined,
        }
        result = isEditing ? await updateNaoConformidade(id!, req) : await createNaoConformidade(req)
      }

      // Upload evidence files
      if (arquivos.length > 0 && result?.id) {
        for (const file of arquivos) {
          if (tipo === 'DESVIO') {
            await uploadEvidenciaDesvio(result.id, file)
          } else {
            await uploadEvidencia(result.id, file)
          }
        }
      }

      // Vincular trechos pendentes (somente na criação de NC)
      if (!isEditing && tipo === 'NAO_CONFORMIDADE' && result?.id && trechosPendentes.length > 0) {
        for (const t of trechosPendentes) {
          await vincularTrechoNorma(result.id, {
            normaId: t.normaId,
            clausulaReferencia: t.clausulaReferencia,
            textoEditado: t.textoEditado,
          })
        }
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/ocorrencias')
    },
  })

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:bg-white transition"

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Editar Ocorrência' : 'Registro de Ocorrência'}
          </h2>
          <p className="text-sm text-blue-500 mt-1">
            {isEditing ? 'Altere os dados da ocorrência' : 'Preencha os dados da ocorrência identificada'}
          </p>
        </div>

        {/* Type selector — desabilitado na edição */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Ocorrência *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => !isEditing && setTipo('DESVIO')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition ${tipo === 'DESVIO' ? 'border-slate-800 bg-slate-50' : 'border-gray-200'} ${isEditing ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-300'}`}
            >
              <AlertCircle size={20} className={tipo === 'DESVIO' ? 'text-slate-800' : 'text-gray-400'} />
              <div>
                <div className={`font-medium text-sm ${tipo === 'DESVIO' ? 'text-slate-800' : 'text-gray-500'}`}>Desvio</div>
                <div className="text-xs text-gray-400">Situação pontual</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => !isEditing && setTipo('NAO_CONFORMIDADE')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition ${tipo === 'NAO_CONFORMIDADE' ? 'border-slate-800 bg-slate-50' : 'border-gray-200'} ${isEditing ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-300'}`}
            >
              <FileText size={20} className={tipo === 'NAO_CONFORMIDADE' ? 'text-slate-800' : 'text-gray-400'} />
              <div>
                <div className={`font-medium text-sm ${tipo === 'NAO_CONFORMIDADE' ? 'text-slate-800' : 'text-gray-500'}`}>Não Conformidade</div>
                <div className="text-xs text-gray-400">Requer tratativa formal</div>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          {/* Estabelecimento */}
          {user?.isAdmin && !isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa *</label>
                <select
                  value={adminEmpresaId}
                  onChange={e => {
                    setAdminEmpresaId(e.target.value)
                    setAdminEstabelecimentoId('')
                    setAdminEmpresaFilhaId('')
                  }}
                  className={inputClass}
                >
                  <option value="">Selecione a empresa</option>
                  {(empresasAdmin as Array<{ id: string; razaoSocial: string }>).map(e => (
                    <option key={e.id} value={e.id}>{e.razaoSocial}</option>
                  ))}
                </select>
              </div>
              {adminEmpresaId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estabelecimento *</label>
                  <select
                    value={adminEstabelecimentoId}
                    onChange={e => {
                      setAdminEstabelecimentoId(e.target.value)
                      setAdminEmpresaFilhaId('')
                    }}
                    className={inputClass}
                  >
                    <option value="">Selecione o estabelecimento</option>
                    {(estabelecimentosAdmin as Array<{ id: string; nome: string }>).map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              {adminEstabelecimentoId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Filha (Contratada)</label>
                  <select
                    value={adminEmpresaFilhaId}
                    onChange={e => setAdminEmpresaFilhaId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Nenhuma</option>
                    {(empresasFilhaAdmin as Array<{ id: string; razaoSocial: string }>).map(e => (
                      <option key={e.id} value={e.id}>{e.razaoSocial}</option>
                    ))}
                  </select>
                </div>
              )}
              {errors.estabelecimentoId && (
                <p className="text-red-500 text-xs mt-1">{errors.estabelecimentoId.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estabelecimento *</label>
              <input
                type="text"
                value={
                  isEditing
                    ? (desvioData?.estabelecimentoNome ?? ncData?.estabelecimentoNome ?? '')
                    : (estabelecimentoSelecionado?.nome ?? '')
                }
                readOnly
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
              />
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
            <input {...register('titulo')} placeholder="Título resumido da ocorrência" className={inputClass} />
            {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Localização</label>
            <select {...register('localizacaoId')} className={inputClass}>
              <option value="">Selecione a localização</option>
              {localizacoesAtivas.map(l => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
            {errors.localizacaoId && <p className="text-red-500 text-xs mt-1">{errors.localizacaoId.message}</p>}
          </div>

          {/* NC-only: Eng. responsáveis — acima da descrição */}
          {tipo === 'NAO_CONFORMIDADE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Eng. Responsável pela Tratativa</label>
                <SearchableSelect
                  options={externos.map(u => ({ id: u.id, label: `${u.nome} (${u.perfil})` }))}
                  value={watch('engResponsavelConstrutoraId') ?? ''}
                  onChange={id => setValue('engResponsavelConstrutoraId', id)}
                  placeholder="Selecione o responsável pela tratativa"
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 mt-1">Quem irá enviar o plano de ação (geralmente EXTERNO)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Eng. Responsável pela NC</label>
                <SearchableSelect
                  options={engenheiros.map(u => ({ id: u.id, label: `${u.nome} (${u.perfil})` }))}
                  value={watch('engResponsavelVerificacaoId') ?? ''}
                  onChange={id => setValue('engResponsavelVerificacaoId', id)}
                  placeholder="Selecione o responsável pela verificação"
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 mt-1">Quem irá validar (aprovar/reprovar) a tratativa</p>
              </div>
            </>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {tipo === 'DESVIO' ? 'Descrição Curta *' : 'Descrição Detalhada *'}
            </label>
            <textarea
              {...register('descricao')}
              rows={8}
              placeholder={tipo === 'DESVIO' ? 'Descreva brevemente o desvio identificado' : 'Descreva detalhadamente a não conformidade identificada'}
              className={inputClass}
            />
            {errors.descricao && <p className="text-red-500 text-xs mt-1">{errors.descricao.message}</p>}
          </div>

          {/* Desvio-only: responsáveis */}
          {tipo === 'DESVIO' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsável pelo Desvio *</label>
                <SearchableSelect
                  options={engenheiros.map(u => ({ id: u.id, label: `${u.nome} (${u.perfil})` }))}
                  value={watch('responsavelDesvioId') ?? ''}
                  onChange={id => setValue('responsavelDesvioId', id)}
                  placeholder="Selecione quem vai aprovar/reprovar a tratativa"
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 mt-1">Quem irá validar (aprovar/reprovar) a tratativa</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsável pela Tratativa *</label>
                <SearchableSelect
                  options={[...engenheiros, ...externos].map(u => ({ id: u.id, label: `${u.nome} (${u.perfil})` }))}
                  value={watch('responsavelTratativaId') ?? ''}
                  onChange={id => setValue('responsavelTratativaId', id)}
                  placeholder="Selecione quem irá executar a tratativa"
                  className={inputClass}
                />
                <p className="text-xs text-slate-400 mt-1">Quem irá enviar a observação e evidência da tratativa</p>
              </div>
            </>
          )}

          {/* NF-only fields */}
          {tipo === 'NAO_CONFORMIDADE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Normas / Regras Violadas</label>
                {normas.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-1">
                    Nenhuma norma cadastrada.{' '}
                    <a href="/normas/novo" className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">
                      Cadastre uma norma
                    </a>{' '}
                    para vincular aqui.
                  </p>
                ) : (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {normas.map(norma => (
                      <div key={norma.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50">
                        <label className="flex items-start gap-3 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded"
                            checked={normasSelecionadas.includes(norma.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setNormasSelecionadas(prev => [...prev, norma.id])
                              } else {
                                setNormasSelecionadas(prev => prev.filter(nid => nid !== norma.id))
                              }
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">{norma.titulo}</p>
                            {norma.descricao && (
                              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{norma.descricao}</p>
                            )}
                          </div>
                        </label>
                        {normasSelecionadas.includes(norma.id) && !isEditing && (
                          <div className="flex gap-1 shrink-0">
                            {norma.conteudo && (
                              <button
                                type="button"
                                onClick={() => setBuscaModal({ normaId: norma.id, normaTitulo: norma.titulo })}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                              >
                                <Search size={11} />
                                Buscar trecho
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setManualModal({ normaId: norma.id, normaTitulo: norma.titulo })}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 transition"
                            >
                              <PenLine size={11} />
                              Escrever manual
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {trechosPendentes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Trechos a vincular ({trechosPendentes.length})</p>
                    {trechosPendentes.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-blue-700">{t.normaTitulo}{t.clausulaReferencia ? ` — ${t.clausulaReferencia}` : ''}</p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{t.textoEditado}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTrechosPendentes(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1 text-slate-400 hover:text-red-500 transition shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-red-100 rounded-lg p-4 space-y-3 bg-red-50/40">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="reincidencia"
                    className="mt-0.5 h-4 w-4 rounded accent-red-600"
                    checked={isReincidencia}
                    onChange={e => {
                      setIsReincidencia(e.target.checked)
                      if (!e.target.checked) setNcAnteriorId('')
                    }}
                  />
                  <div>
                    <label htmlFor="reincidencia" className="font-medium text-sm text-red-700 cursor-pointer">Reincidência</label>
                    <p className="text-xs text-slate-500 mt-0.5">Marque se esta NC é recorrência de uma ocorrência anterior</p>
                  </div>
                </div>
                {isReincidencia && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">NC Anterior *</label>
                      <select
                        value={ncAnteriorId}
                        onChange={e => setNcAnteriorId(e.target.value)}
                        className={`${inputClass} ${reincidenciaWarning ? 'border-orange-400 ring-1 ring-orange-300' : ''}`}
                      >
                        <option value="">Selecione a NC anterior</option>
                        {ncsParaAnterior.map(nc => (
                          <option key={nc.id} value={nc.id}>
                            {nc.titulo} — {nc.status}
                          </option>
                        ))}
                      </select>
                      {reincidenciaWarning && (
                        <div className="mt-2 bg-orange-50 border border-orange-300 rounded-lg p-3 text-sm">
                          <p className="font-semibold text-orange-700 mb-1">⚠ Esta NC já possui uma reincidência registrada</p>
                          <p className="text-orange-600 text-xs mb-2">
                            Para manter o rastro linear, selecione a última NC da cadeia:
                          </p>
                          <button
                            type="button"
                            onClick={() => setNcAnteriorId(reincidenciaWarning.id)}
                            className="inline-flex items-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-semibold px-3 py-1.5 rounded-md transition"
                          >
                            Usar "{reincidenciaWarning.titulo}"
                          </button>
                        </div>
                      )}
                    </div>
                    {ncAnteriorId && ncAnteriorData && (
                      <div className="bg-white border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Rastro de reincidências</p>
                        <div className="flex flex-wrap items-center gap-1 text-sm">
                          {ncAnteriorData.cadeiaReincidencias.map((item, idx) => (
                            <span key={item.id} className="flex items-center gap-1">
                              <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium max-w-[160px] truncate" title={item.titulo}>
                                {item.titulo}
                              </span>
                              <span className="text-slate-400 text-xs">→</span>
                            </span>
                          ))}
                          <span className="px-2 py-0.5 rounded bg-red-200 text-red-800 text-xs font-semibold max-w-[160px] truncate" title={ncAnteriorData.titulo}>
                            {ncAnteriorData.titulo}
                          </span>
                          <span className="text-slate-400 text-xs">→</span>
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-white text-xs font-semibold">Esta NC</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <input type="checkbox" {...register('regraDeOuro')} id="regraDeOuro" className="mt-0.5 h-4 w-4 rounded" />
                <div>
                  <label htmlFor="regraDeOuro" className="font-medium text-sm text-slate-800 cursor-pointer">Regra de Ouro</label>
                  <p className="text-xs text-slate-500 mt-0.5">Marque se a ocorrência viola uma regra crítica de segurança</p>
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <span className="flex items-center gap-2"><Calendar size={14} /> Data Limite para Tratativa</span>
                  </label>
                  <input
                    type="text"
                    value={dataLimiteStr}
                    readOnly
                    className={`${inputClass} bg-gray-100 cursor-not-allowed text-blue-600 font-medium`}
                  />
                  <p className="text-xs text-blue-500 mt-1">Prazo padrão: 30 dias a partir do registro</p>
                </div>
              )}
            </>
          )}

          {/* File upload — múltiplos arquivos */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Evidências Fotográficas</label>
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition">
                <input
                  type="file"
                  accept="image/png,image/jpg,image/jpeg,application/pdf"
                  multiple
                  className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? [])
                    if (files.length > 0) setArquivos(prev => [...prev, ...files])
                    e.target.value = ''
                  }}
                />
                <Camera size={28} className="mx-auto text-gray-400 mb-2" />
                <div className="text-sm text-blue-500 font-medium">Clique para anexar fotos ou documentos</div>
                <div className="text-xs text-gray-400 mt-1">PNG, JPG, PDF — múltiplos arquivos permitidos</div>
              </label>
              {arquivos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {arquivos.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-red-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setArquivos(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 text-slate-400 hover:text-red-500 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              Erro ao salvar ocorrência. Verifique os dados e tente novamente.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/ocorrencias')}
              className="flex-1 py-3 border border-gray-200 rounded-lg text-sm text-slate-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {mutation.isPending ? 'Salvando...' : isEditing ? '✓ Salvar Alterações' : '↓ Registrar Ocorrência'}
            </button>
          </div>
        </form>
      </div>

      {buscaModal && (
        <BuscaTrechoModal
          normaId={buscaModal.normaId}
          normaTitulo={buscaModal.normaTitulo}
          onTrechoSelecionado={trecho => setTrechosPendentes(prev => [...prev, trecho])}
          onClose={() => setBuscaModal(null)}
        />
      )}
      {manualModal && (
        <TrechoManualModal
          normaId={manualModal.normaId}
          normaTitulo={manualModal.normaTitulo}
          onSalvar={trecho => setTrechosPendentes(prev => [...prev, trecho])}
          onClose={() => setManualModal(null)}
        />
      )}
    </div>
  )
}
