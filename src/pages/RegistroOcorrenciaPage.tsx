import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDesvio } from '../api/desvio'
import { createNaoConformidade } from '../api/naoConformidade'
import { getEstabelecimentos } from '../api/estabelecimento'
import { Camera, AlertCircle, FileText, Calendar } from 'lucide-react'

type Tipo = 'DESVIO' | 'NAO_CONFORMIDADE'

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  localizacao: z.string().min(1, 'Localização obrigatória'),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  nrRelacionada: z.string().optional(),
  regraDeOuro: z.boolean().optional(),
  estabelecimentoId: z.string().min(1, 'Selecione um estabelecimento'),
})

type FormData = z.infer<typeof schema>

export default function RegistroOcorrenciaPage() {
  const [tipo, setTipo] = useState<Tipo>('DESVIO')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: estabelecimentos = [] } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: getEstabelecimentos,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { regraDeOuro: false },
  })

  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() + 30)
  const dataLimiteStr = dataLimite.toLocaleDateString('pt-BR')

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const base = {
        titulo: data.titulo,
        localizacao: data.localizacao,
        descricao: data.descricao,
        estabelecimentoId: data.estabelecimentoId,
        regraDeOuro: data.regraDeOuro ?? false,
      }
      if (tipo === 'DESVIO') {
        return createDesvio({ ...base, orientacaoRealizada: data.descricao })
      } else {
        return createNaoConformidade({
          ...base,
          nrRelacionada: data.nrRelacionada || '',
          nivelSeveridade: 'MEDIO',
          engResponsavelConstrutoraId: '',
          engResponsavelVerificacaoId: '',
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/tratativas')
    },
  })

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:bg-white transition"

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">Registro de Ocorrência</h2>
          <p className="text-sm text-blue-500 mt-1">Preencha os dados da ocorrência identificada</p>
        </div>

        {/* Type selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Ocorrência *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipo('DESVIO')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition ${tipo === 'DESVIO' ? 'border-slate-800 bg-slate-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <AlertCircle size={20} className={tipo === 'DESVIO' ? 'text-slate-800' : 'text-gray-400'} />
              <div>
                <div className={`font-medium text-sm ${tipo === 'DESVIO' ? 'text-slate-800' : 'text-gray-500'}`}>Desvio</div>
                <div className="text-xs text-gray-400">Situação pontual</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTipo('NAO_CONFORMIDADE')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition ${tipo === 'NAO_CONFORMIDADE' ? 'border-slate-800 bg-slate-50' : 'border-gray-200 hover:border-gray-300'}`}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estabelecimento *</label>
            <select {...register('estabelecimentoId')} className={inputClass}>
              <option value="">Selecione o estabelecimento</option>
              {(estabelecimentos as Array<{ id: string; nome: string; ativo: boolean }>).filter(e => e.ativo).map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
            {errors.estabelecimentoId && <p className="text-red-500 text-xs mt-1">{errors.estabelecimentoId.message}</p>}
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
            <input {...register('titulo')} placeholder="Título resumido da ocorrência" className={inputClass} />
            {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Localização *</label>
            <input {...register('localizacao')} placeholder="Ex: Setor A - Área de Produção" className={inputClass} />
            {errors.localizacao && <p className="text-red-500 text-xs mt-1">{errors.localizacao.message}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {tipo === 'DESVIO' ? 'Descrição Curta *' : 'Descrição Detalhada *'}
            </label>
            <textarea
              {...register('descricao')}
              rows={3}
              placeholder={tipo === 'DESVIO' ? 'Descreva brevemente o desvio identificado' : 'Descreva detalhadamente a não conformidade identificada'}
              className={inputClass}
            />
            {errors.descricao && <p className="text-red-500 text-xs mt-1">{errors.descricao.message}</p>}
          </div>

          {/* NF-only fields */}
          {tipo === 'NAO_CONFORMIDADE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Norma/Regra Violada *</label>
                <input {...register('nrRelacionada')} placeholder="Ex: NR-12, Procedimento Interno 001/2024" className={inputClass} />
                {errors.nrRelacionada && <p className="text-red-500 text-xs mt-1">{errors.nrRelacionada.message}</p>}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <input type="checkbox" {...register('regraDeOuro')} id="regraDeOuro" className="mt-0.5 h-4 w-4 rounded" />
                <div>
                  <label htmlFor="regraDeOuro" className="font-medium text-sm text-slate-800 cursor-pointer">Regra de Ouro</label>
                  <p className="text-xs text-slate-500 mt-0.5">Marque se a ocorrência viola uma regra crítica de segurança</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <span className="flex items-center gap-2"><Calendar size={14} /> Data Limite para Tratativa *</span>
                </label>
                <input
                  type="text"
                  value={dataLimiteStr}
                  readOnly
                  className={`${inputClass} bg-gray-100 cursor-not-allowed text-blue-600 font-medium`}
                />
                <p className="text-xs text-blue-500 mt-1">Prazo padrão: 30 dias a partir do registro</p>
              </div>
            </>
          )}

          {/* Regra de Ouro for Desvio */}
          {tipo === 'DESVIO' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <input type="checkbox" {...register('regraDeOuro')} id="regraDeOuroDesvio" className="mt-0.5 h-4 w-4 rounded" />
              <div>
                <label htmlFor="regraDeOuroDesvio" className="font-medium text-sm text-slate-800 cursor-pointer">Regra de Ouro</label>
                <p className="text-xs text-slate-500 mt-0.5">Marque se a ocorrência viola uma regra crítica de segurança</p>
              </div>
            </div>
          )}

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Evidência Fotográfica *</label>
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition">
              <input
                type="file"
                accept="image/png,image/jpg,image/jpeg,application/pdf"
                className="hidden"
                onChange={e => setArquivo(e.target.files?.[0] ?? null)}
              />
              <Camera size={28} className="mx-auto text-gray-400 mb-2" />
              {arquivo ? (
                <div className="text-sm text-slate-700 font-medium">{arquivo.name}</div>
              ) : (
                <>
                  <div className="text-sm text-blue-500 font-medium">Clique para anexar foto</div>
                  <div className="text-xs text-gray-400 mt-1">PNG, JPG até 10MB</div>
                </>
              )}
            </label>
          </div>

          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              Erro ao registrar ocorrência. Verifique os dados e tente novamente.
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60 transition flex items-center justify-center gap-2 mt-2"
          >
            {mutation.isPending ? 'Registrando...' : '↓ Registrar Ocorrência'}
          </button>
        </form>
      </div>
    </div>
  )
}
