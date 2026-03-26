import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEmpresa, getEmpresa, updateEmpresa } from '../../api/empresa'
import { getEstabelecimentos, vincularEmpresa } from '../../api/estabelecimento'
import { ArrowLeft, MapPin } from 'lucide-react'
import MaskedInput from '../../components/MaskedInput'
import { Estabelecimento } from '../../types'

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
  const [searchParams] = useSearchParams()
  const empresaMaeId = searchParams.get('empresaMaeId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id
  const isCriandoContratada = !!empresaMaeId && !isEditing

  const [estabelecimentosSelecionados, setEstabelecimentosSelecionados] = useState<string[]>([])

  const { data: empresa } = useQuery({
    queryKey: ['empresa', id],
    queryFn: () => getEmpresa(id!),
    enabled: isEditing,
  })

  const { data: empresaMae } = useQuery({
    queryKey: ['empresa', empresaMaeId],
    queryFn: () => getEmpresa(empresaMaeId!),
    enabled: isCriandoContratada,
  })

  const { data: todosEstabelecimentos = [] } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: () => getEstabelecimentos(true),
    enabled: isCriandoContratada,
  })

  const estabelecimentosDaEmpresaMae = (todosEstabelecimentos as Estabelecimento[]).filter(
    (e) => e.empresaId === empresaMaeId
  )

  const parentName = isEditing
    ? (empresa?.empresaMaeNome || null)
    : (empresaMae?.nomeFantasia || empresaMae?.razaoSocial || null)

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

  function toggleEstabelecimento(estId: string) {
    setEstabelecimentosSelecionados(prev =>
      prev.includes(estId) ? prev.filter(id => id !== estId) : [...prev, estId]
    )
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        empresaMaeId: isEditing ? empresa?.empresaMaeId : (empresaMaeId || undefined),
      }
      const novaEmpresa = isEditing
        ? await updateEmpresa(id!, payload)
        : await createEmpresa(payload)

      if (!isEditing && estabelecimentosSelecionados.length > 0) {
        await Promise.all(
          estabelecimentosSelecionados.map(estId => vincularEmpresa(estId, novaEmpresa.id))
        )
      }

      return novaEmpresa
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      queryClient.invalidateQueries({ queryKey: ['empresas-mae'] })
      queryClient.invalidateQueries({ queryKey: ['estabelecimento-empresas'] })
      navigate('/empresas')
    },
  })

  const titulo = empresaMaeId
    ? 'Nova Empresa Contratada'
    : isEditing
    ? 'Editar Empresa'
    : 'Nova Empresa'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{titulo}</h2>
          {parentName && (
            <p className="text-sm text-slate-500 mt-0.5">
              Vinculada a: <strong>{parentName}</strong>
            </p>
          )}
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

        {/* Seleção de estabelecimentos — só aparece ao criar contratada */}
        {isCriandoContratada && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-slate-500" />
              <label className="text-sm font-medium text-slate-700">
                Vincular a estabelecimentos
              </label>
              <span className="text-xs text-slate-400">(opcional)</span>
            </div>
            {estabelecimentosDaEmpresaMae.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum estabelecimento cadastrado para esta empresa mãe.</p>
            ) : (
              <div className="space-y-2">
                {estabelecimentosDaEmpresaMae.map((est) => (
                  <label
                    key={est.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={estabelecimentosSelecionados.includes(est.id)}
                      onChange={() => toggleEstabelecimento(est.id)}
                      className="rounded border-gray-300 text-slate-800 focus:ring-slate-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{est.nome}</p>
                      {est.cidade && (
                        <p className="text-xs text-slate-400">{est.cidade}{est.estado ? `/${est.estado}` : ''}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

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
