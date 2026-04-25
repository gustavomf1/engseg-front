import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { login as loginApi } from '../api/auth'
import Shield3D from '../components/Shield3D'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [focused, setFocused] = useState<'email' | 'senha' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accent = '#6366f1'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginApi({ email, senha })
      login(res.id, res.token, res.nome, res.email, res.perfil, res.isAdmin)
      navigate(res.perfil === 'EXTERNO' ? '/tratativas' : res.isAdmin ? '/empresas' : '/selecionar')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-white dark:bg-[#0b0b1a]">
      {/* LEFT — hero */}
      <div
        className="relative flex-1 min-h-[380px] lg:min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}
      >
        {/* anéis pulsantes */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/5 animate-pulse-ring"
              style={{
                width: 280 + i * 90,
                height: 280 + i * 90,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>

        {/* brand canto superior */}
        <div className="absolute top-6 left-6 text-white/60 text-xs font-semibold tracking-[0.25em] uppercase">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/10 grid place-items-center">
              <div className="w-2 h-2 rounded-sm bg-white/80" />
            </div>
            SGS
          </div>
        </div>

        {/* rodapé esquerdo */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white/40 text-[11px]">
          <div>© 2026 ERS Engenharia</div>
          <div className="font-mono">v1.0.0</div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-8 py-10">
          <Shield3D size={260} palette="brand" />
          <h2 className="text-white text-2xl md:text-3xl font-bold mt-8 max-w-sm leading-tight">
            Proteção começa com visibilidade.
          </h2>
          <p className="text-white/50 text-sm mt-3 max-w-xs">
            Registre, acompanhe e resolva ocorrências de segurança com clareza.
          </p>
        </div>
      </div>

      {/* RIGHT — formulário */}
      <div className="lg:w-[480px] flex items-center justify-center p-8 lg:p-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Bem-vindo de volta
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-white/50">
              Bom ter você por aqui. Entre pra continuar.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-white/60">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                required
                autoFocus
                className="mt-1 w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                style={focused === 'email' ? { boxShadow: `0 0 0 3px ${accent}33`, borderColor: accent } : undefined}
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-white/60">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onFocus={() => setFocused('senha')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                required
                className="mt-1 w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                style={focused === 'senha' ? { boxShadow: `0 0 0 3px ${accent}33`, borderColor: accent } : undefined}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            style={{
              background: `linear-gradient(180deg, ${accent} 0%, #4338ca 100%)`,
              boxShadow: `0 6px 20px -6px ${accent}80, inset 0 1px 0 0 rgba(255,255,255,0.2)`,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>

          <div className="text-center text-xs text-slate-400 dark:text-white/40">
            Sistema de Gestão de Segurança · v1.0.0
          </div>
        </form>
      </div>
    </div>
  )
}
