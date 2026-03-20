import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { login as loginApi } from '../api/auth'
import { Shield, Mail, Lock, Eye, EyeOff, CheckCircle2, TrendingUp, ClipboardList, Clock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi({ email, senha })
      login(res.id, res.token, res.nome, res.perfil)
      navigate(res.perfil === 'EXTERNO' ? '/tratativas' : '/selecionar')
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left dark panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg">SGS</div>
            <div className="text-slate-400 text-sm">Sistema de Gestão</div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-3">Bem-vindo ao Sistema</h1>
            <p className="text-slate-400 leading-relaxed">
              Plataforma completa para gerenciamento de ocorrências e tratativas de segurança do trabalho.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: TrendingUp, title: 'Registro de Ocorrências', sub: 'Desvios e não conformidades' },
              { icon: ClipboardList, title: 'Gestão de Tratativas', sub: 'Planos de ação e evidências' },
              { icon: Clock, title: 'Controle de Prazos', sub: 'Acompanhamento em tempo real' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={16} className="text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-sm">{title}</div>
                  <div className="text-slate-400 text-xs">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-slate-500 text-sm">© 2024 ERS - Todos os direitos reservados</div>
      </div>

      {/* Right white panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Shield size={28} className="text-slate-800" />
            <span className="font-bold text-xl text-slate-800">SGS</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800">Acessar Sistema</h2>
            <p className="text-slate-500 mt-1">Digite suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-2"><Mail size={14} /> Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-2"><Lock size={14} /> Senha</span>
              </label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:bg-white transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60 transition"
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="text-center text-sm text-slate-400">
            Problemas para acessar?{' '}
            <span className="text-slate-700 font-medium underline cursor-pointer">Entre em contato com o suporte</span>
          </div>
        </div>
      </div>
    </div>
  )
}
