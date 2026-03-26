import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmpresasMae, createEmpresa } from '../api/empresa'
import { getEstabelecimentos, createEstabelecimento, getEmpresasDoEstabelecimento, vincularEmpresa } from '../api/estabelecimento'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import { Empresa, Estabelecimento, EmpresaRequest, EstabelecimentoRequest } from '../types'
import { Building2, MapPin, ChevronRight, ArrowLeft, Shield, LogOut, Sun, Moon, Plus, X, Search, Loader2, Briefcase } from 'lucide-react'
import { IMaskInput } from 'react-imask'
import { useTheme } from '../contexts/ThemeContext'

type Step = 'empresa' | 'estabelecimento' | 'empresaFilha'
type Modal = 'empresa' | 'estabelecimento' | 'contratada' | null

export default function SeletorPage() {
  const [step, setStep] = useState<Step>('empresa')
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null)
  const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState<Estabelecimento | null>(null)
  const [modal, setModal] = useState<Modal>(null)
  const [formEmpresa, setFormEmpresa] = useState<EmpresaRequest>({ razaoSocial: '', cnpj: '', nomeFantasia: '', email: '' })
  const [formContratada, setFormContratada] = useState<EmpresaRequest>({ razaoSocial: '', cnpj: '', nomeFantasia: '', email: '' })
  const [formEstabelecimento, setFormEstabelecimento] = useState<EstabelecimentoRequest>({ nome: '', codigo: '', empresaId: '' })
  const [cepEst, setCepEst] = useState('')
  const [cepLoadingEst, setCepLoadingEst] = useState(false)
  const [cepErroEst, setCepErroEst] = useState('')
  const { selecionarEmpresa, selecionarEstabelecimento, selecionarEmpresaFilha } = useWorkspace()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isEngenheiro = user?.perfil === 'ENGENHEIRO'

  const mutCreateEmpresa = useMutation({
    mutationFn: createEmpresa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-mae'] })
      setModal(null)
      setFormEmpresa({ razaoSocial: '', cnpj: '', nomeFantasia: '', email: '' })
    },
  })

  const mutCreateContratada = useMutation({
    mutationFn: async (data: EmpresaRequest) => {
      const novaEmpresa = await createEmpresa({ ...data, empresaMaeId: empresaSelecionada!.id })
      await vincularEmpresa(estabelecimentoSelecionado!.id, novaEmpresa.id)
      return novaEmpresa
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-estabelecimento', estabelecimentoSelecionado?.id] })
      queryClient.invalidateQueries({ queryKey: ['empresas'] })
      setModal(null)
      setFormContratada({ razaoSocial: '', cnpj: '', nomeFantasia: '', email: '' })
    },
  })

  const mutCreateEstabelecimento = useMutation({
    mutationFn: createEstabelecimento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos'] })
      setModal(null)
      setFormEstabelecimento({ nome: '', codigo: '', empresaId: '' })
      setCepEst('')
      setCepErroEst('')
    },
  })

  async function buscarCepEst(valor: string) {
    const numeros = valor.replace(/\D/g, '')
    if (numeros.length !== 8) return
    setCepLoadingEst(true)
    setCepErroEst('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${numeros}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepErroEst('CEP não encontrado.')
      } else {
        setFormEstabelecimento(f => ({
          ...f,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          cep: valor,
        }))
      }
    } catch {
      setCepErroEst('Erro ao buscar CEP.')
    } finally {
      setCepLoadingEst(false)
    }
  }

  const { data: empresas = [], isLoading: loadingEmpresas } = useQuery({
    queryKey: ['empresas-mae'],
    queryFn: () => getEmpresasMae(true),
  })

  const { data: estabelecimentos = [], isLoading: loadingEstabelecimentos } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: () => getEstabelecimentos(true),
    enabled: step === 'estabelecimento' || step === 'empresaFilha',
  })

  const { data: empresasFilhas = [], isLoading: loadingFilhas } = useQuery({
    queryKey: ['empresas-estabelecimento', estabelecimentoSelecionado?.id],
    queryFn: () => getEmpresasDoEstabelecimento(estabelecimentoSelecionado!.id),
    enabled: step === 'empresaFilha' && !!estabelecimentoSelecionado,
  })

  const estabelecimentosFiltrados = estabelecimentos.filter(
    (e: Estabelecimento) => e.empresaId === empresaSelecionada?.id && e.ativo
  )

  function handleSelecionarEmpresa(emp: Empresa) {
    setEmpresaSelecionada(emp)
    selecionarEmpresa(emp)
    setStep('estabelecimento')
  }

  function handleSelecionarEstabelecimento(est: Estabelecimento) {
    setEstabelecimentoSelecionado(est)
    selecionarEstabelecimento(est)
    setStep('empresaFilha')
  }

  function handleSelecionarEmpresaFilha(emp: Empresa) {
    selecionarEmpresaFilha(emp)
    navigate('/dashboard')
  }

  function handleVoltarParaEmpresa() {
    setStep('empresa')
    setEmpresaSelecionada(null)
    setEstabelecimentoSelecionado(null)
  }

  function handleVoltarParaEstabelecimento() {
    setStep('estabelecimento')
    setEstabelecimentoSelecionado(null)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleSubmitEmpresa(e: React.FormEvent) {
    e.preventDefault()
    mutCreateEmpresa.mutate(formEmpresa)
  }

  function handleSubmitEstabelecimento(e: React.FormEvent) {
    e.preventDefault()
    mutCreateEstabelecimento.mutate({ ...formEstabelecimento, empresaId: empresaSelecionada!.id })
  }

  const empresasAtivas = empresas.filter((e: Empresa) => e.ativo)

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-800">SGS</div>
            <div className="text-slate-500 text-xs">Sistema de Gestão</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">Olá, <strong>{user?.nome}</strong></span>
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-gray-100 transition"
            title={theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              step === 'empresa' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              <Building2 size={16} />
              1. Empresa
            </div>
            <ChevronRight size={16} className="text-slate-400" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              step === 'estabelecimento' ? 'bg-slate-900 text-white' : step === 'empresaFilha' ? 'bg-slate-200 text-slate-600' : 'bg-slate-200 text-slate-400'
            }`}>
              <MapPin size={16} />
              2. Estabelecimento
            </div>
            <ChevronRight size={16} className="text-slate-400" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              step === 'empresaFilha' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Briefcase size={16} />
              3. Contratada
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            {/* Step 1: Empresa Mae */}
            {step === 'empresa' && (
              <>
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Selecione a Empresa</h2>
                    <p className="text-sm text-slate-500 mt-1">Escolha a empresa em que deseja trabalhar</p>
                  </div>
                  {isEngenheiro && (
                    <button
                      onClick={() => setModal('empresa')}
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                    >
                      <Plus size={14} />
                      Nova Empresa
                    </button>
                  )}
                </div>

                {loadingEmpresas ? (
                  <div className="text-center py-12 text-slate-400">Carregando empresas...</div>
                ) : empresasAtivas.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">Nenhuma empresa cadastrada</div>
                ) : (
                  <div className="space-y-3">
                    {empresasAtivas.map((emp: Empresa) => (
                      <button
                        key={emp.id}
                        onClick={() => handleSelecionarEmpresa(emp)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-slate-800 hover:bg-slate-50 transition text-left group"
                      >
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition">
                          <Building2 size={20} className="text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-800 truncate">
                            {emp.nomeFantasia || emp.razaoSocial}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{emp.cnpj}</div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 2: Estabelecimento */}
            {step === 'estabelecimento' && (
              <>
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={handleVoltarParaEmpresa}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition mb-3"
                    >
                      <ArrowLeft size={14} />
                      Voltar
                    </button>
                    {isEngenheiro && (
                      <button
                        onClick={() => setModal('estabelecimento')}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                      >
                        <Plus size={14} />
                        Novo Estabelecimento
                      </button>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Selecione o Estabelecimento</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Estabelecimentos de <strong>{empresaSelecionada?.nomeFantasia || empresaSelecionada?.razaoSocial}</strong>
                  </p>
                </div>

                {loadingEstabelecimentos ? (
                  <div className="text-center py-12 text-slate-400">Carregando estabelecimentos...</div>
                ) : estabelecimentosFiltrados.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    Nenhum estabelecimento cadastrado para esta empresa
                  </div>
                ) : (
                  <div className="space-y-3">
                    {estabelecimentosFiltrados.map((est: Estabelecimento) => (
                      <button
                        key={est.id}
                        onClick={() => handleSelecionarEstabelecimento(est)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-slate-800 hover:bg-slate-50 transition text-left group"
                      >
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition">
                          <MapPin size={20} className="text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-800 truncate">{est.nome}</div>
                          <div className="text-xs text-slate-400 truncate">
                            {est.codigo}{est.cidade ? ` - ${est.cidade}` : ''}{est.estado ? `/${est.estado}` : ''}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 3: Empresa Filha / Contratada */}
            {step === 'empresaFilha' && (
              <>
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={handleVoltarParaEstabelecimento}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition mb-3"
                    >
                      <ArrowLeft size={14} />
                      Voltar
                    </button>
                    {isEngenheiro && (
                      <button
                        onClick={() => setModal('contratada')}
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                      >
                        <Plus size={14} />
                        Nova Contratada
                      </button>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Selecione a Empresa Contratada</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Empresas que atuam em <strong>{estabelecimentoSelecionado?.nome}</strong>
                  </p>
                </div>

                {loadingFilhas ? (
                  <div className="text-center py-12 text-slate-400">Carregando empresas contratadas...</div>
                ) : empresasFilhas.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhuma empresa contratada vinculada</p>
                    <p className="text-slate-400 text-sm mt-1">Vincule empresas contratadas na gestão de estabelecimentos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {empresasFilhas.map((emp: Empresa) => (
                      <button
                        key={emp.id}
                        onClick={() => handleSelecionarEmpresaFilha(emp)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-slate-800 hover:bg-slate-50 transition text-left group"
                      >
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition">
                          <Briefcase size={20} className="text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-800 truncate">
                            {emp.nomeFantasia || emp.razaoSocial}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{emp.cnpj}</div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 transition" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal Nova Empresa */}
          {modal === 'empresa' && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-800">Nova Empresa</h3>
                  <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmitEmpresa} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Razão Social *</label>
                    <input
                      type="text"
                      required
                      value={formEmpresa.razaoSocial}
                      onChange={e => setFormEmpresa(f => ({ ...f, razaoSocial: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ *</label>
                    <IMaskInput
                      mask="00.000.000/0000-00"
                      placeholder="00.000.000/0000-00"
                      required
                      value={formEmpresa.cnpj}
                      onAccept={(value: string) => setFormEmpresa(f => ({ ...f, cnpj: value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formEmpresa.nomeFantasia ?? ''}
                      onChange={e => setFormEmpresa(f => ({ ...f, nomeFantasia: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={formEmpresa.email ?? ''}
                      onChange={e => setFormEmpresa(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  {mutCreateEmpresa.isError && (
                    <p className="text-xs text-red-500">Erro ao criar empresa. Tente novamente.</p>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={mutCreateEmpresa.isPending}
                      className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                    >
                      {mutCreateEmpresa.isPending ? 'Salvando...' : 'Criar Empresa'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Novo Estabelecimento */}
          {modal === 'estabelecimento' && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-slate-800">Novo Estabelecimento</h3>
                  <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Empresa: <strong>{empresaSelecionada?.nomeFantasia || empresaSelecionada?.razaoSocial}</strong>
                </p>
                <form onSubmit={handleSubmitEstabelecimento} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome *</label>
                    <input
                      type="text"
                      required
                      value={formEstabelecimento.nome}
                      onChange={e => setFormEstabelecimento(f => ({ ...f, nome: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Código *</label>
                    <input
                      type="text"
                      required
                      value={formEstabelecimento.codigo}
                      onChange={e => setFormEstabelecimento(f => ({ ...f, codigo: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                    <div className="flex gap-2">
                      <IMaskInput
                        mask="00000-000"
                        placeholder="00000-000"
                        value={cepEst}
                        onAccept={(v: string) => {
                          setCepEst(v)
                          setFormEstabelecimento(f => ({ ...f, cep: v }))
                        }}
                        onBlur={() => buscarCepEst(cepEst)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => buscarCepEst(cepEst)}
                        disabled={cepLoadingEst}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-slate-100 border border-gray-300 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition"
                      >
                        {cepLoadingEst ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                        Buscar
                      </button>
                    </div>
                    {cepErroEst && <p className="text-xs text-amber-600 mt-1">{cepErroEst} Preencha manualmente.</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Logradouro</label>
                    <input
                      type="text"
                      placeholder="Rua, Av., Rodovia..."
                      value={formEstabelecimento.logradouro ?? ''}
                      onChange={e => setFormEstabelecimento(f => ({ ...f, logradouro: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Número</label>
                      <input
                        type="text"
                        placeholder="Ex: 100, S/N"
                        value={formEstabelecimento.numero ?? ''}
                        onChange={e => setFormEstabelecimento(f => ({ ...f, numero: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Bairro</label>
                      <input
                        type="text"
                        value={formEstabelecimento.bairro ?? ''}
                        onChange={e => setFormEstabelecimento(f => ({ ...f, bairro: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={formEstabelecimento.cidade ?? ''}
                        onChange={e => setFormEstabelecimento(f => ({ ...f, cidade: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="SP"
                        value={formEstabelecimento.estado ?? ''}
                        onChange={e => setFormEstabelecimento(f => ({ ...f, estado: e.target.value.toUpperCase() }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                    </div>
                  </div>
                  {mutCreateEstabelecimento.isError && (
                    <p className="text-xs text-red-500">Erro ao criar estabelecimento. Tente novamente.</p>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={mutCreateEstabelecimento.isPending}
                      className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                    >
                      {mutCreateEstabelecimento.isPending ? 'Salvando...' : 'Criar Estabelecimento'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Modal Nova Contratada */}
          {modal === 'contratada' && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Nova Empresa Contratada</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vinculada a <strong>{empresaSelecionada?.nomeFantasia || empresaSelecionada?.razaoSocial}</strong> em <strong>{estabelecimentoSelecionado?.nome}</strong>
                    </p>
                  </div>
                  <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={e => { e.preventDefault(); mutCreateContratada.mutate(formContratada) }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Razão Social *</label>
                    <input
                      type="text"
                      required
                      value={formContratada.razaoSocial}
                      onChange={e => setFormContratada(f => ({ ...f, razaoSocial: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">CNPJ *</label>
                    <IMaskInput
                      mask="00.000.000/0000-00"
                      placeholder="00.000.000/0000-00"
                      required
                      value={formContratada.cnpj}
                      onAccept={(value: string) => setFormContratada(f => ({ ...f, cnpj: value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formContratada.nomeFantasia ?? ''}
                      onChange={e => setFormContratada(f => ({ ...f, nomeFantasia: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={formContratada.email ?? ''}
                      onChange={e => setFormContratada(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    />
                  </div>
                  {mutCreateContratada.isError && (
                    <p className="text-xs text-red-500">Erro ao criar empresa contratada. Tente novamente.</p>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setModal(null)}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={mutCreateContratada.isPending}
                      className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                    >
                      {mutCreateContratada.isPending ? 'Criando...' : 'Criar Contratada'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
