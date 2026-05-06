import '../pages/registro-ocorrencia.css'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, X, User, Mail, Phone, Building2, ShieldCheck, CheckCheck } from 'lucide-react'
import type { PerfilUsuario } from '../types'

const perfilLabels: Record<PerfilUsuario, string> = {
  ENGENHEIRO: 'Engenheiro',
  TECNICO: 'Técnico',
  EXTERNO: 'Externo',
}

interface Props {
  open: boolean
  onClose: () => void
  nome: string
  email: string
  telefone?: string
  perfil: PerfilUsuario
  empresaNome: string
  isAdmin: boolean
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  errorMessage?: string
  onConfirm: () => void
}

export default function ConfirmModalUsuario({
  open, onClose,
  nome, email, telefone, perfil, empresaNome, isAdmin,
  isPending, isSuccess, isError, errorMessage, onConfirm,
}: Props) {
  const [stage, setStage] = useState<'review' | 'sending' | 'success'>('review')

  useEffect(() => {
    if (open) setStage('review')
  }, [open])

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (open) {
      root.style.filter = 'blur(5px) brightness(0.4)'
      root.style.transition = 'filter 0.2s ease'
    } else {
      root.style.filter = ''
      root.style.transition = ''
    }
    return () => { root.style.filter = ''; root.style.transition = '' }
  }, [open])
  useEffect(() => { if (isPending) setStage('sending') }, [isPending])
  useEffect(() => { if (isSuccess) setStage('success') }, [isSuccess])
  useEffect(() => {
    if (isError && stage === 'sending') setStage('review')
  }, [isError]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  return createPortal(
    <div
      className="nc-modal-backdrop nc-app"
      style={{ zIndex: 9999, backdropFilter: 'none', WebkitBackdropFilter: 'none', background: 'transparent' }}
      onClick={stage === 'review' ? onClose : undefined}
    >
      <div
        className={`nc-modal-card stage-${stage}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ===== REVIEW ===== */}
        {stage === 'review' && (
          <>
            <header className="nc-modal-head">
              <div className="nc-modal-head-title">
                <UserPlus size={20} style={{ color: '#79b8ff' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--nc-fg-0)' }}>
                    Confirmar criação
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--nc-fg-2)' }}>
                    Revise os dados antes de criar o usuário
                  </p>
                </div>
              </div>
              <button type="button" className="nc-modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </header>

            <div className="nc-modal-body">
              <div className="nc-confirm-summary">
                <div className="nc-confirm-row">
                  <span className="nc-confirm-row-icon"><User size={14} /></span>
                  <div className="nc-confirm-row-content">
                    <span className="nc-confirm-row-label">Nome</span>
                    <span className="nc-confirm-row-value">{nome || '—'}</span>
                  </div>
                </div>
                <div className="nc-confirm-row">
                  <span className="nc-confirm-row-icon"><Mail size={14} /></span>
                  <div className="nc-confirm-row-content">
                    <span className="nc-confirm-row-label">Email</span>
                    <span className="nc-confirm-row-value" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email || '—'}
                    </span>
                  </div>
                </div>
                {telefone && (
                  <div className="nc-confirm-row">
                    <span className="nc-confirm-row-icon"><Phone size={14} /></span>
                    <div className="nc-confirm-row-content">
                      <span className="nc-confirm-row-label">Telefone</span>
                      <span className="nc-confirm-row-value">{telefone}</span>
                    </div>
                  </div>
                )}
                <div className="nc-confirm-row">
                  <span className="nc-confirm-row-icon"><Building2 size={14} /></span>
                  <div className="nc-confirm-row-content">
                    <span className="nc-confirm-row-label">Empresa</span>
                    <span className="nc-confirm-row-value">{empresaNome || '—'}</span>
                  </div>
                </div>
                <div className="nc-confirm-row">
                  <span className="nc-confirm-row-icon"><ShieldCheck size={14} /></span>
                  <div className="nc-confirm-row-content">
                    <span className="nc-confirm-row-label">Perfil</span>
                    <span className="nc-confirm-row-value" style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <span className="nc-pill nc-pill-blue">{perfilLabels[perfil]}</span>
                      {isAdmin && <span className="nc-pill nc-pill-amber">Admin</span>}
                    </span>
                  </div>
                </div>
              </div>

              {isError && (
                <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.4)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f85149' }}>
                  {errorMessage || 'Erro ao criar usuário. Verifique os dados e tente novamente.'}
                </div>
              )}
            </div>

            <footer className="nc-modal-foot">
              <button type="button" className="nc-btn nc-btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="button" className="nc-btn nc-btn-primary" onClick={onConfirm}>
                <UserPlus size={15} /> Criar usuário
              </button>
            </footer>
          </>
        )}

        {/* ===== SENDING ===== */}
        {stage === 'sending' && (
          <div className="nc-modal-stage-anim">
            <div className="nc-send-anim">
              <div className="nc-send-anim-orbit" />
              <div className="nc-send-anim-orbit slow" />
              <div className="nc-send-anim-doc">
                <UserPlus size={28} />
              </div>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="nc-send-particle" style={{ '--i': i } as React.CSSProperties}>
                  <ShieldCheck size={12} />
                </div>
              ))}
            </div>
            <h3 className="nc-send-title">Criando usuário…</h3>
            <p className="nc-send-sub">{nome}</p>
            <div className="nc-send-steps">
              <div className="nc-send-step done">
                <span className="nc-send-step-tick"><CheckCheck size={12} /></span>
                Validando dados
              </div>
              <div className="nc-send-step done">
                <span className="nc-send-step-tick"><CheckCheck size={12} /></span>
                Criando registro
              </div>
              <div className="nc-send-step done">
                <span className="nc-send-step-tick"><CheckCheck size={12} /></span>
                Configurando permissões
              </div>
            </div>
          </div>
        )}

        {/* ===== SUCCESS ===== */}
        {stage === 'success' && (
          <div className="nc-modal-stage-anim success">
            <div className="nc-success-check">
              <svg viewBox="0 0 80 80" width="80" height="80">
                <circle className="nc-success-check-circle" cx="40" cy="40" r="36" />
                <path className="nc-success-check-tick" d="M24 41 L36 53 L57 30" />
              </svg>
            </div>
            <h3 className="nc-send-title nc-success-title">Usuário criado com sucesso</h3>
            <p className="nc-send-sub">{nome} · {email}</p>
            <div className="nc-success-meta">
              <div className="nc-success-meta-item">
                <span className="nc-success-meta-label">Perfil</span>
                <span className="nc-success-meta-value">{perfilLabels[perfil]}</span>
              </div>
              <div className="nc-success-meta-divider" />
              <div className="nc-success-meta-item">
                <span className="nc-success-meta-label">Empresa</span>
                <span className="nc-success-meta-value" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {empresaNome}
                </span>
              </div>
            </div>
            <div className="nc-success-actions">
              <button type="button" className="nc-btn nc-btn-primary" onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
