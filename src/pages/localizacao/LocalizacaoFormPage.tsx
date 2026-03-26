import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLocalizacao, getLocalizacao, updateLocalizacao } from '../../api/localizacao'
import { getEstabelecimentos } from '../../api/estabelecimento'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  estabelecimentoId: z.string().uuid('Estabelecimento obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function LocalizacaoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { estabelecimento: estabelecimentoSelecionado } = useWorkspace()
  const isEditing = !!id

  const { data: item } = useQuery({
    queryKey: ['localizacao', id],
    queryFn: () => getLocalizacao(id!),
    enabled: isEditing,
  })

  const { data: estabelecimentos = [] } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: () => getEstabelecimentos(true),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      estabelecimentoId: estabelecimentoSelecionado?.id || '',
    },
  })

  useEffect(() => {
    if (item) {
      reset({
        nome: item.nome,
        estabelecimentoId: item.estabelecimentoId,
      })
    }
  }, [item, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing ? updateLocalizacao(id!, data) : createLocalizacao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['localizacoes'] })
      navigate('/localizacoes')
    },
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">
          {isEditing ? 'Editar Localização' : 'Nova Localização'}
        </h2>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Estabelecimento *</label>
            <select {...register('estabelecimentoId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500">
              <option value="">Selecione um estabelecimento</option>
              {estabelecimentos.filter(e => e.ativo).map(e => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
            {errors.estabelecimentoId && <p className="text-red-500 text-xs mt-1">{errors.estabelecimentoId.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
            <input {...register('nome')} placeholder="Ex: Ala Ar, Ala Terra, Setor A" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
            Erro ao salvar. Verifique os dados e tente novamente.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-lg">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60">
            {mutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
