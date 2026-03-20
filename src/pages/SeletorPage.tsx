import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEmpresas } from '../api/empresa'
import { getEstabelecimentos } from '../api/estabelecimento'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import { Empresa, Estabelecimento } from '../types'
import { Building2, MapPin, ChevronRight, ArrowLeft, Shield, LogOut } from 'lucide-react'

type Step = 'empresa' | 'estabelecimento'

export default function SeletorPage() {
  const [step, setStep] = useState<Step>('empresa')
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null)
  const { selecionarEmpresa, selecionarEstabelecimento } = useWorkspace()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data: empresas = [], isLoading: loadingEmpresas } = useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
  })

  const { data: estabelecimentos = [], isLoading: loadingEstabelecimentos } = useQuery({
    queryKey: ['estabelecimentos'],
    queryFn: getEstabelecimentos,
    enabled: step === 'estabelecimento',
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
    selecionarEstabelecimento(est)
    navigate('/dashboard')
  }

  function handleVoltar() {
    setStep('empresa')
    setEmpresaSelecionada(null)
  }

  function handleLogout() {
    logout()
    navigate('/login')
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
              step === 'estabelecimento' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <MapPin size={16} />
              2. Estabelecimento
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            {step === 'empresa' ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Selecione a Empresa</h2>
                  <p className="text-sm text-slate-500 mt-1">Escolha a empresa em que deseja trabalhar</p>
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
            ) : (
              <>
                <div className="mb-6">
                  <button
                    onClick={handleVoltar}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition mb-3"
                  >
                    <ArrowLeft size={14} />
                    Voltar
                  </button>
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
          </div>
        </div>
      </div>
    </div>
  )
}
