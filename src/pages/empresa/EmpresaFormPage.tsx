import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEmpresa, getEmpresa, updateEmpresa } from '../../api/empresa'
import { ArrowLeft } from 'lucide-react'
import MaskedInput from '../../components/MaskedInput'

const schema = z.object({
  razaoSocial: z.string().min(1, 'Razão social obrigatória'),
  cnpj: z.string().min(18, 'CNPJ inválido'),
  nomeFantasia: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function EmpresaFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const { data: empresa } = useQuery({
    queryKey: ['empresa', id],
    queryFn: () => getEmpresa(id!),
    enabled: isEditing,
  })

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (empresa) {
      reset({
        razaoSocial: empresa.razaoSocial,
        cnpj: empresa.cnpj,
        nomeFantasia: empresa.nomeFantasia || '',
        email: empresa.email || '',
        telefone: empresa.telefone || '',
      })
    }
  }, [empresa, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing ? updateEmpresa(id!, data) : createEmpresa(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      navigate('/empresas')
    },
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social *</label>
            <input {...register('razaoSocial')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
            {errors.razaoSocial && <p className="text-red-500 text-xs mt-1">{errors.razaoSocial.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ *</label>
            <MaskedInput control={control} name="cnpj" mask="00.000.000/0000-00" placeholder="00.000.000/0000-00" />
            {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia</label>
            <input {...register('nomeFantasia')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <MaskedInput control={control} name="telefone" mask="(00) 00000-0000" placeholder="(00) 00000-0000" />
          </div>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
            Erro ao salvar empresa. Verifique os dados e tente novamente.
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
