import { useState, useEffect } from 'react'
import {
  FileCheck, X, Mail, Building2, MapPin, ShieldAlert,
  Calendar, Send, CheckCheck, Plus, Check,
} from 'lucide-react'
import type { EmailPadrao } from '../types'

interface DynamicRecipient {
  name: string
  email: string
  tag: string
}

interface Props {
  open: boolean
  onClose: () => void
  tipo: 'DESVIO' | 'NAO_CONFORMIDADE'
  titulo: string
  estabelecimentoNome: string
  localizacaoNome?: string
  severidade: number
  probabilidade: number
  prazoStr: string
  dynamicRecipients: DynamicRecipient[]
  emailsPadrao: EmailPadrao[]
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  createdId?: string
  onConfirm: (opts: { emailsManuais: string[]; emailsPadraoExcluidos: string[] }) => void
  onNavigate: () => void
}

export default function ConfirmModalOcorrencia({
  open, onClose, tipo, titulo, estabelecimentoNome, localizacaoNome,
  severidade, probabilidade, prazoStr, dynamicRecipients, emailsPadrao,
  isPending, isSuccess, isError, createdId, onConfirm, onNavigate,
}: Props) {
  const [stage, setStage] = useState<'review' | 'sending' | 'success'>('review')
  const [localExcluidos, setLocalExcluidos] = useState<string[]>([])
  const [localManuaisDinamico, setLocalManuaisDinamico] = useState<string[]>([])
  const [localManuaisPadrao, setLocalManuaisPadrao] = useState<{ email: string; checked: boolean }[]>([])
  const [manualInput, setManualInput] = useState('')
  const [manualTipo, setManualTipo] = useState<'DINAMICO' | 'PADRAO'>('DINAMICO')

  useEffect(() => {
    if (open) {
      setStage('review')
      setLocalExcluidos([])
      setLocalManuaisDinamico([])
      setLocalManuaisPadrao([])
      setManualInput('')
      setManualTipo('DINAMICO')
    }
  }, [open])

  useEffect(() => { if (isPending) setStage('sending') }, [isPending])
  useEffect(() => { if (isSuccess) setStage('success') }, [isSuccess])
  useEffect(() => {
    if (isError && stage === 'sending') setStage('review')
  }, [isError]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const score = severidade * probabilidade
  const scoreLevel = score <= 4 ? { label: 'Baixo', color: '#3fb950' }
    : score <= 9 ? { label: 'Moderado', color: '#d29922' }
    : score <= 16 ? { label: 'Alto', color: '#f97316' }
    : { label: 'Crítico', color: '#f85149' }

  const totalCount = dynamicRecipients.length + localManuaisDinamico.length +
    emailsPadrao.filter(ep => !localExcluidos.includes(ep.email)).length +
    localManuaisPadrao.filter(e => e.checked).length

  const handleConfirm = () => {
    const emailsManuais = [
      ...localManuaisDinamico,
      ...localManuaisPadrao.filter(e => e.checked).map(e => e.email),
    ]
    onConfirm({ emailsManuais, emailsPadraoExcluidos: localExcluidos })
  }

  const addManual = () => {
    const em = manualInput.trim()
    if (!em) return
    if (manualTipo === 'DINAMICO') {
      if (!localManuaisDinamico.includes(em)) {
        setLocalManuaisDinamico(prev => [...prev, em])
        setManualInput('')
      }
    } else {
      if (!localManuaisPadrao.some(e => e.email === em)) {
        setLocalManuaisPadrao(prev => [...prev, { email: em, checked: true }])
        setManualInput('')
      }
    }
  }

  return (
    <div
      className="nc-modal-backdrop"
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
                <FileCheck size={20} style={{ color: '#79b8ff' }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--fg-0)' }}>
                    Confirmar registro
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-2)' }}>
                    {tipo === 'NAO_CONFORMIDADE'
                      ? 'Revise os dados antes de criar a Não Conformidade'
                      : 'Revise os dados antes de registrar o Desvio'}
                  </p>
                </div>
              </div>
              <button type="button" className="nc-modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </header>

            <div className="nc-modal-body">
              {/* Summary */}
              <div className="nc-confirm-summary">
                <div className="nc-confirm-row">
                  <span className="nc-confirm-row-icon"><FileCheck size={14} /></span>
                  <div className="nc-confirm-row-content">
                    <span className="nc-confirm-row-label">Tipo</span>
                    <span className="nc-confirm-row-value">
                      <span className={`nc-pill ${tipo === 'NAO_CONFORMIDADE' ? 'nc-pill-blue' : 'nc-pill-amber'}`}>
                        {tipo === 'NAO_CONFORMIDADE' ? 'Não Conformidade' : 'Desvio'}
                      </span>
                    </span>
                  </div>
                </div>
                {titulo && (
                  <div className="nc-confirm-row">
                    <span className="nc-confirm-row-icon" style={{ color: 'var(--accent)' }}><FileCheck size={14} /></span>
                    <div className="nc-confirm-row-content">
                      <span className="nc-confirm-row-label">Título</span>
                      <span className="nc-confirm-row-value" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titulo}</span>
                    </div>
                  </div>
                )}
                <div className="nc-confirm-row">
                  <span className="nc-confirm-row-icon"><Building2 size={14} /></span>
                  <div className="nc-confirm-row-content">
                    <span className="nc-confirm-row-label">Estabelecimento</span>
                    <span className="nc-confirm-row-value">{estabelecimentoNome || '—'}</span>
                  </div>
                </div>
                {localizacaoNome && (
                  <div className="nc-confirm-row">
                    <span className="nc-confirm-row-icon"><MapPin size={14} /></span>
                    <div className="nc-confirm-row-content">
                      <span className="nc-confirm-row-label">Localização</span>
                      <span className="nc-confirm-row-value">{localizacaoNome}</span>
                    </div>
                  </div>
                )}
                {tipo === 'NAO_CONFORMIDADE' && (
                  <div className="nc-confirm-row">
                    <span className="nc-confirm-row-icon">
                      <ShieldAlert size={14} style={{ color: scoreLevel.color }} />
                    </span>
                    <div className="nc-confirm-row-content">
                      <span className="nc-confirm-row-label">Risco</span>
                      <span className="nc-confirm-row-value">
                        {severidade > 0 && probabilidade > 0 ? (
                          <span
                            className="nc-pill"
                            style={{ background: scoreLevel.color + '22', color: scoreLevel.color }}
                          >
                            {scoreLevel.label} · {score}/25
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-3)', fontSize: 12 }}>Não definido</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
                {tipo === 'NAO_CONFORMIDADE' && prazoStr && (
                  <div className="nc-confirm-row">
                    <span className="nc-confirm-row-icon"><Calendar size={14} /></span>
                    <div className="nc-confirm-row-content">
                      <span className="nc-confirm-row-label">Prazo tratativa</span>
                      <span className="nc-confirm-row-value">
                        {prazoStr} <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>(30 dias)</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recipients */}
              <div className="nc-confirm-section">
                <div className="nc-confirm-section-head">
                  <h3 className="nc-confirm-section-title">
                    <Mail size={14} /> Destinatários do email de abertura
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>{totalCount} selecionados</span>
                </div>

                {/* Dynamic */}
                <div className="nc-recipients-group">
                  <div className="nc-recipients-group-label">Dinâmicos (automáticos)</div>
                  {dynamicRecipients.map((r, i) => (
                    <div key={i} className="nc-recipient-row">
                      <span className="nc-recipient-dot" style={{ background: '#58a6ff' }} />
                      <span className="nc-recipient-name">{r.name}</span>
                      <span className="nc-recipient-email">&lt;{r.email}&gt;</span>
                      <span className="nc-recipient-tag">{r.tag}</span>
                    </div>
                  ))}
                  {localManuaisDinamico.map(email => (
                    <div key={email} className="nc-recipient-row">
                      <span className="nc-recipient-dot" style={{ background: '#58a6ff' }} />
                      <span className="nc-recipient-name">Manual</span>
                      <span className="nc-recipient-email">&lt;{email}&gt;</span>
                      <button
                        type="button"
                        onClick={() => setLocalManuaisDinamico(prev => prev.filter(e => e !== email))}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', padding: '2px 4px', borderRadius: 4 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Default (toggleable) */}
                {(emailsPadrao.length > 0 || localManuaisPadrao.length > 0) && (
                  <div className="nc-recipients-group">
                    <div className="nc-recipients-group-label">Padrão (desmarcáveis)</div>
                    {emailsPadrao.map(ep => {
                      const excluido = localExcluidos.includes(ep.email)
                      return (
                        <label key={ep.id} className="nc-recipient-row toggleable">
                          <span className={`nc-checkbox ${!excluido ? 'checked' : ''}`}>
                            {!excluido && <Check size={11} strokeWidth={3} />}
                          </span>
                          <input
                            type="checkbox"
                            checked={!excluido}
                            onChange={() =>
                              setLocalExcluidos(prev =>
                                excluido ? prev.filter(e => e !== ep.email) : [...prev, ep.email]
                              )
                            }
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                          />
                          <span className="nc-recipient-name">{ep.email}</span>
                          {ep.descricao && <span className="nc-recipient-tag">— {ep.descricao}</span>}
                        </label>
                      )
                    })}
                    {localManuaisPadrao.map(({ email, checked }) => (
                      <label key={email} className="nc-recipient-row toggleable">
                        <span className={`nc-checkbox ${checked ? 'checked' : ''}`}>
                          {checked && <Check size={11} strokeWidth={3} />}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setLocalManuaisPadrao(prev =>
                              prev.map(e => e.email === email ? { ...e, checked: !e.checked } : e)
                            )
                          }
                          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                        />
                        <span className="nc-recipient-name">{email}</span>
                        <span className="nc-recipient-tag">— Manual</span>
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); setLocalManuaisPadrao(prev => prev.filter(e2 => e2.email !== email)) }}
                          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', padding: '2px 4px', borderRadius: 4 }}
                        >
                          <X size={12} />
                        </button>
                      </label>
                    ))}
                  </div>
                )}

                {/* Add manual */}
                <div className="nc-recipients-add" style={{ flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-start' }}>
                    {(['DINAMICO', 'PADRAO'] as const).map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setManualTipo(tipo)}
                        style={{
                          padding: '3px 10px',
                          fontSize: 11,
                          fontWeight: 500,
                          borderRadius: 6,
                          border: '1px solid',
                          cursor: 'pointer',
                          transition: 'all .15s',
                          borderColor: manualTipo === tipo ? '#1f6feb' : 'var(--border)',
                          background: manualTipo === tipo ? 'rgba(31,111,235,.18)' : 'transparent',
                          color: manualTipo === tipo ? '#79b8ff' : 'var(--fg-3)',
                        }}
                      >
                        {tipo === 'DINAMICO' ? 'Dinâmico' : 'Padrão'}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                    <input
                      type="email"
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManual() } }}
                      placeholder="email@empresa.com"
                      className="nc-input"
                    />
                    <button type="button" className="nc-btn nc-btn-blue" onClick={addManual}>
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {isError && (
                <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.4)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f85149' }}>
                  Erro ao registrar ocorrência. Verifique os dados e tente novamente.
                </div>
              )}
            </div>

            <footer className="nc-modal-foot">
              <button type="button" className="nc-btn nc-btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="button" className="nc-btn nc-btn-primary" onClick={handleConfirm}>
                <Send size={15} /> Registrar e notificar
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
                <FileCheck size={36} />
              </div>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="nc-send-particle" style={{ '--i': i } as React.CSSProperties}>
                  <Mail size={14} />
                </div>
              ))}
            </div>
            <h3 className="nc-send-title">Registrando ocorrência…</h3>
            <p className="nc-send-sub">Notificando {totalCount} destinatário{totalCount !== 1 ? 's' : ''}</p>
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
                Enviando emails
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
            <h3 className="nc-send-title nc-success-title">
              {tipo === 'NAO_CONFORMIDADE' ? 'NC registrada com sucesso' : 'Desvio registrado com sucesso'}
            </h3>
            <p className="nc-send-sub">
              {createdId ? (
                <>Protocolo <span style={{ color: '#79b8ff', fontWeight: 600 }}>#{createdId.slice(0, 8).toUpperCase()}</span> criado</>
              ) : 'Registro criado com sucesso'}
            </p>
            <div className="nc-success-meta">
              <div className="nc-success-meta-item">
                <span className="nc-success-meta-label">Notificados</span>
                <span className="nc-success-meta-value">{totalCount} contatos</span>
              </div>
              <div className="nc-success-meta-divider" />
              {tipo === 'NAO_CONFORMIDADE' && (
                <>
                  <div className="nc-success-meta-item">
                    <span className="nc-success-meta-label">Prazo</span>
                    <span className="nc-success-meta-value">{prazoStr}</span>
                  </div>
                  <div className="nc-success-meta-divider" />
                </>
              )}
              <div className="nc-success-meta-item">
                <span className="nc-success-meta-label">Status</span>
                <span className="nc-success-meta-value" style={{ color: '#d29922' }}>Aberta</span>
              </div>
            </div>
            <div className="nc-success-actions">
              <button type="button" className="nc-btn nc-btn-ghost" onClick={onNavigate}>
                Fechar
              </button>
              <button type="button" className="nc-btn nc-btn-primary" onClick={onNavigate}>
                Ver ocorrências
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
