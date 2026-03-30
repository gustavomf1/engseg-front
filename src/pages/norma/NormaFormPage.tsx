import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createNorma, getNorma, salvarConteudoNorma, updateNorma } from '../../api/norma'
import { ArrowLeft, FileText, Save } from 'lucide-react'

const schema = z.object({
  titulo: z.string().min(1, 'Título obrigatório'),
  descricao: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NormaFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id
  const [conteudo, setConteudo] = useState('')
  const [conteudoSalvo, setConteudoSalvo] = useState(false)

  const { data: item } = useQuery({
    queryKey: ['norma', id],
    queryFn: () => getNorma(id!),
    enabled: isEditing,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (item) {
      reset({ titulo: item.titulo, descricao: item.descricao || '' })
      setConteudo(item.conteudo || '')
    }
  }, [item, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing ? updateNorma(id!, { ...data, conteudo }) : createNorma({ ...data, conteudo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['normas'] })
      navigate('/normas')
    },
  })

  const conteudoMutation = useMutation({
    mutationFn: () => salvarConteudoNorma(id!, conteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['norma', id] })
      setConteudoSalvo(true)
      setTimeout(() => setConteudoSalvo(false), 3000)
    },
  })

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">
          {isEditing ? 'Editar Norma' : 'Nova Norma'}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
          <input
            {...register('titulo')}
            placeholder="Ex: NR-12, NR-35, Procedimento Interno 001/2024"
            className={inputClass}
          />
          {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            {...register('descricao')}
            rows={3}
            placeholder="Resumo ou observações sobre a norma"
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="border border-blue-100 rounded-lg p-4 bg-blue-50/40 space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-600" />
            <label className="block text-sm font-semibold text-blue-700">
              Texto completo da NR
            </label>
          </div>
          <p className="text-xs text-slate-500">
            Cole aqui o texto completo da norma. Isso permite usar a busca por IA para encontrar trechos relevantes nas NCs.
          </p>
          <textarea
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            rows={12}
            placeholder="Cole aqui o texto completo da NR..."
            className={`${inputClass} resize-y font-mono text-xs`}
          />
          {isEditing && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => conteudoMutation.mutate()}
                disabled={conteudoMutation.isPending || !conteudo.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                <Save size={14} />
                {conteudoMutation.isPending ? 'Salvando...' : 'Salvar conteúdo'}
              </button>
              {conteudoSalvo && (
                <span className="text-sm text-green-600 font-medium">Conteúdo salvo!</span>
              )}
            </div>
          )}
          {!isEditing && (
            <p className="text-xs text-slate-400">O conteúdo será salvo junto com a norma.</p>
          )}
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
            Erro ao salvar. Verifique os dados e tente novamente.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
