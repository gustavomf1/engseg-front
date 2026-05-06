import '../pages/registro-ocorrencia.css'
import { createPortal } from 'react-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { Trash2, X, CheckCheck, AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description?: string
  message?: string
  detail?: ReactNode
  confirmLabel?: string
  successTitle?: string
  successMessage?: string
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmActionModal({
  open, title, description = 'Esta ação não pode ser desfeita',
  message, detail, confirmLabel = 'Sim, excluir',
  successTitle, successMessage,
  isLoading = false, isSuccess = false, isError = false,
  onConfirm, onCancel,
}: Props) {
  const [stage, setStage] = useState<'confirm' | 'loading' | 'success'>('confirm')

  useEffect(() => { if (open) setStage('confirm') }, [open])
  useEffect(() => { if (isLoading) setStage('loading') }, [isLoading])
  useEffect(() => { if (isSuccess) setStage('success') }, [isSuccess])
  useEffect(() => {
    if (isError && stage === 'loading') setStage('confirm')
  }, [isError]) // eslint-disable-line react-hooks/exhaustive-deps

  // blur root when open
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

  if (!open) return null

  const resolvedSuccessTitle = successTitle ?? title.replace(/^(Excluir|Criar|Deletar)\s/i, '') + ' excluído com sucesso'
  const resolvedSuccessMessage = successMessage ?? 'A operação foi concluída com sucesso.'

  return createPortal(
    <div
      className="nc-modal-backdrop nc-app"
      style={{ zIndex: 9999, backdropFilter: 'none', WebkitBackdropFilter: 'none', background: 'transparent' }}
      onClick={stage === 'confirm' ? onCancel : undefined}
    >
      <div
        className={`nc-modal-card stage-${stage}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ===== CONFIRM ===== */}
        {stage === 'confirm' && (
          <>
            <header className="nc-modal-head">
              <div className="nc-modal-head-title">
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Trash2 size={17} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--nc-fg-0)' }}>
                    {title}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--nc-fg-2)' }}>
                    {description}
                  </p>
                </div>
              </div>
              <button type="button" className="nc-modal-close" onClick={onCancel}>
                <X size={18} />
              </button>
            </header>

            <div className="nc-modal-body">
              {message && (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--nc-fg-1)' }}>{message}</p>
              )}
              {detail && (
                <div className="nc-confirm-summary">{detail}</div>
              )}
              {isError && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ef4444',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <AlertTriangle size={14} />
                  Erro ao excluir. Verifique suas permissões e tente novamente.
                </div>
              )}
            </div>

            <footer className="nc-modal-foot">
              <button type="button" className="nc-btn nc-btn-ghost" onClick={onCancel}>Cancelar</button>
              <button
                type="button"
                onClick={onConfirm}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.background = '#b91c1c')}
                onMouseOut={e => (e.currentTarget.style.background = '#dc2626')}
              >
                <Trash2 size={14} /> {confirmLabel}
              </button>
            </footer>
          </>
        )}

        {/* ===== LOADING ===== */}
        {stage === 'loading' && (
          <div className="nc-modal-stage-anim">
            <div className="nc-send-anim">
              <div className="nc-send-anim-orbit" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />
              <div className="nc-send-anim-orbit slow" style={{ borderColor: 'rgba(220,38,38,0.15)' }} />
              <div className="nc-send-anim-doc" style={{ background: 'linear-gradient(135deg, #991b1b, #dc2626)' }}>
                <Trash2 size={28} />
              </div>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="nc-send-particle" style={{ '--i': i } as React.CSSProperties}>
                  <X size={10} />
                </div>
              ))}
            </div>
            <h3 className="nc-send-title">Excluindo…</h3>
            <p className="nc-send-sub">{title.replace(/^Excluir\s/i, '')}</p>
            <div className="nc-send-steps">
              <div className="nc-send-step done">
                <span className="nc-send-step-tick"><CheckCheck size={12} /></span>
                Validando permissões
              </div>
              <div className="nc-send-step done">
                <span className="nc-send-step-tick"><CheckCheck size={12} /></span>
                Removendo registro
              </div>
              <div className="nc-send-step done">
                <span className="nc-send-step-tick"><CheckCheck size={12} /></span>
                Atualizando dados
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
            <h3 className="nc-send-title nc-success-title">{resolvedSuccessTitle}</h3>
            <p className="nc-send-sub">{resolvedSuccessMessage}</p>
            <div className="nc-success-actions">
              <button type="button" className="nc-btn nc-btn-primary" onClick={onCancel}>
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
