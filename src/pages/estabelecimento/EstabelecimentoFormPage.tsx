import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEstabelecimento, getEstabelecimento, updateEstabelecimento, getEmpresasDoEstabelecimento, vincularEmpresa, desvincularEmpresa } from '../../api/estabelecimento'
import { getEmpresas } from '../../api/empresa'
import { getEmpresasFilhas } from '../../api/empresa'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { ArrowLeft, Search, Loader2, Plus, X, Briefcase } from 'lucide-react'
import { IMaskInput } from 'react-imask'
import { Empresa } from '../../types'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  codigo: z.string().min(1, 'Código obrigatório'),
  empresaId: z.string().uuid('Empresa obrigatória'),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
})

type FormData = z.infer<typeof schema>

export default function EstabelecimentoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { empresa: empresaSelecionada } = useWorkspace()
  const isEditing = !!id

  const { data: item } = useQuery({
    queryKey: ['estabelecimento', id],
    queryFn: () => getEstabelecimento(id!),
    enabled: isEditing,
  })

  const { data: empresas = [] } = useQuery({
    queryKey: ['empresas'],
    queryFn: () => getEmpresas(true),
  })

  // Empresas filhas vinculadas a este estabelecimento
  const { data: empresasVinculadas = [] } = useQuery({
    queryKey: ['estabelecimento-empresas', id],
    queryFn: () => getEmpresasDoEstabelecimento(id!),
    enabled: isEditing,
  })

  // Empresas filhas disponíveis para vincular (da empresa mãe do estabelecimento)
  const empresaMaeId = item?.empresaId
  const { data: todasFilhas = [] } = useQuery({
    queryKey: ['empresas-filhas', empresaMaeId],
    queryFn: () => getEmpresasFilhas(empresaMaeId!, true),
    enabled: isEditing && !!empresaMaeId,
  })

  const filhasDisponiveis = todasFilhas.filter(
    (f: Empresa) => !empresasVinculadas.some((v: Empresa) => v.id === f.id)
  )

  const [showVincular, setShowVincular] = useState(false)
  const [filhaSelecionada, setFilhaSelecionada] = useState('')

  const vincularMut = useMutation({
    mutationFn: (empresaId: string) => vincularEmpresa(id!, empresaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimento-empresas', id] })
      setShowVincular(false)
      setFilhaSelecionada('')
    },
  })

  const desvincularMut = useMutation({
    mutationFn: (empresaId: string) => desvincularEmpresa(id!, empresaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimento-empresas', id] })
    },
  })

  const [cep, setCep] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepErro, setCepErro] = useState('')

  async function buscarCep(valor: string) {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length !== 8) return
    setCepLoading(true)
    setCepErro('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${numeros}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepErro('CEP não encontrado.')
      } else {
        setValue('logradouro', data.logradouro)
        setValue('bairro', data.bairro)
        setValue('cidade', data.localidade)
        setValue('estado', data.uf)
      }
    } catch {
      setCepErro('Erro ao buscar CEP. Preencha manualmente.')
    } finally {
      setCepLoading(false)
    }
  }

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      empresaId: empresaSelecionada?.id || '',
    },
  })

  useEffect(() => {
    if (item) {
      if (item.cep) setCep(item.cep)
      reset({
        nome: item.nome,
        codigo: item.codigo,
        empresaId: item.empresaId,
        logradouro: item.logradouro || '',
        numero: item.numero || '',
        bairro: item.bairro || '',
        cidade: item.cidade || '',
        estado: item.estado || '',
      })
    }
  }, [item, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing ? updateEstabelecimento(id!, data) : createEstabelecimento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos'] })
      navigate('/estabelecimentos')
    },
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">
          {isEditing ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
        </h2>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa *</label>
            <select {...register('empresaId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500">
              <option value="">Selecione uma empresa</option>
              {empresas.filter((e: Empresa) => e.ativo && !e.empresaMaeId).map((e: Empresa) => (
                <option key={e.id} value={e.id}>{e.razaoSocial}</option>
              ))}
            </select>
            {errors.empresaId && <p className="text-red-500 text-xs mt-1">{errors.empresaId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
            <input {...register('nome')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Código *</label>
            <input {...register('codigo')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
            {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
            <div className="flex gap-2">
              <IMaskInput
                mask="00000-000"
                placeholder="00000-000"
                value={cep}
                onAccept={(v: string) => setCep(v)}
                onBlur={() => buscarCep(cep)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <button
                type="button"
                onClick={() => buscarCep(cep)}
                disabled={cepLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-100 border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition"
              >
                {cepLoading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                Buscar
              </button>
            </div>
            {cepErro && <p className="text-xs text-amber-600 mt-1">{cepErro} Preencha os campos abaixo manualmente.</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Logradouro</label>
            <input {...register('logradouro')} placeholder="Rua, Av., Rodovia..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número *</label>
            <input {...register('numero')} placeholder="Ex: 100, S/N" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
            <input {...register('bairro')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
            <input {...register('cidade')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado (UF)</label>
            <input {...register('estado')} maxLength={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" placeholder="SP" />
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

      {/* Seção de Empresas Contratadas - só aparece ao editar */}
      {isEditing && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-slate-600" />
              <h3 className="text-lg font-bold text-slate-800">Empresas Contratadas</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowVincular(!showVincular)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
            >
              <Plus size={14} />
              Vincular
            </button>
          </div>

          {showVincular && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-lg">
              <select
                value={filhaSelecionada}
                onChange={e => setFilhaSelecionada(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">Selecione uma empresa contratada</option>
                {filhasDisponiveis.map((f: Empresa) => (
                  <option key={f.id} value={f.id}>{f.nomeFantasia || f.razaoSocial}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!filhaSelecionada || vincularMut.isPending}
                onClick={() => vincularMut.mutate(filhaSelecionada)}
                className="px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
              >
                {vincularMut.isPending ? 'Vinculando...' : 'Vincular'}
              </button>
              <button
                type="button"
                onClick={() => { setShowVincular(false); setFilhaSelecionada('') }}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {filhasDisponiveis.length === 0 && todasFilhas.length === 0 && (
            <p className="text-sm text-slate-400 mb-2">
              Nenhuma empresa contratada cadastrada para esta empresa mãe. Cadastre primeiro em Empresas.
            </p>
          )}

          {empresasVinculadas.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhuma empresa contratada vinculada</p>
          ) : (
            <div className="space-y-2">
              {empresasVinculadas.map((emp: Empresa) => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{emp.nomeFantasia || emp.razaoSocial}</p>
                    <p className="text-xs text-slate-400">{emp.cnpj}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => desvincularMut.mutate(emp.id)}
                    disabled={desvincularMut.isPending}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Desvincular"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
