import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { login as loginApi } from '../api/auth'
import { Shield, Mail, Lock, Eye, EyeOff, CheckCircle2, TrendingUp, ClipboardList, Clock, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { ShaderWallpaper } from '../components/ShaderWallpaper'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi({ email, senha })
      login(res.id, res.token, res.nome, res.email, res.perfil, res.isAdmin)
      navigate(res.perfil === 'EXTERNO' ? '/tratativas' : res.isAdmin ? '/empresas' : '/selecionar')
    } catch {
      setError('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel with interactive shader wallpaper */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950">
        <ShaderWallpaper />

        {/* Content layer on top */}
        <div className="relative z-[1] flex flex-col justify-between p-12 text-white w-full pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid rgba(56, 189, 248, 0.30)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.18)',
                }}
              >
                <Shield size={22} className="text-sky-300" />
              </div>
              <div>
                <div className="font-bold text-lg tracking-wide" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>SGS</div>
                <div className="text-sky-200/70 text-sm" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>Sistema de Gestão</div>
              </div>
            </div>

            {/* SafeCorp company mark */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-auto"
              style={{
                background: 'rgba(8, 14, 28, 0.55)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }}
              />
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-sky-100">SafeCorp</span>
            </div>
          </div>

          <div className="space-y-8 pointer-events-auto max-w-lg">
            <div>
              <h1
                className="text-4xl font-bold mb-3 leading-tight"
                style={{ textShadow: '0 4px 24px rgba(0,0,0,0.65)' }}
              >
                Bem-vindo ao <span className="text-sky-300">Sistema</span>
              </h1>
              <p
                className="text-slate-200/85 leading-relaxed"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.75)' }}
              >
                Plataforma completa para gerenciamento de ocorrências e tratativas de segurança do trabalho.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { icon: TrendingUp, title: 'Registro de Ocorrências', sub: 'Desvios e não conformidades' },
                { icon: ClipboardList, title: 'Gestão de Tratativas', sub: 'Planos de ação e evidências' },
                { icon: Clock, title: 'Controle de Prazos', sub: 'Acompanhamento em tempo real' },
              ].map(({ icon: Icon, title, sub }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl"
                  style={{
                    background: 'rgba(8, 14, 28, 0.35)',
                    border: '1px solid rgba(56, 189, 248, 0.12)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    <Icon size={15} className="text-sky-300" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">{title}</div>
                    <div className="text-slate-300/75 text-xs">{sub}</div>
                  </div>
                  <CheckCircle2 size={14} className="text-sky-400/70 ml-auto" />
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-auto flex items-center justify-between text-xs">
            <div className="text-slate-400" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
              © 2024 <span className="text-sky-300 font-semibold tracking-wider">SafeCorp</span> · Todos os direitos reservados
            </div>
            <div className="text-slate-500/80 italic" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
              mova o mouse · clique
            </div>
          </div>
        </div>
      </div>

      {/* Right white panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white relative">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-gray-100 transition"
          title={theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
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
