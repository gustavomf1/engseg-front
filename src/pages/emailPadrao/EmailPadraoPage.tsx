import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail, Plus, Trash2, AtSign, Pencil, Search,
  ShieldCheck, AlertTriangle, MailPlus, BellRing,
} from 'lucide-react'
import { getEmailPadraoEscopos, getEmailsPadrao, createEmailPadrao, deleteEmailPadrao } from '../../api/emailPadrao'
import { EmailPadrao, EmailPadraoEscopo } from '../../types'
import './emails-padrao.css'

// ─── helpers ────────────────────────────────────────────────
function hashColor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return `ep-avatar-c${(Math.abs(h) % 7) + 1}`
}
function initials(s: string) {
  return (s || '?').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || s[0]?.toUpperCase() || '?'
}
function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}
function scopeKey(estId: string, empId: string) {
  return `${estId}|${empId}`
}

// ─── AddEmailInline ──────────────────────────────────────────
function AddEmailInline({ onAdd }: { onAdd: (email: string, desc: string) => void }) {
  const [email, setEmail] = useState('')
  const [desc, setDesc] = useState('')
  const valid = isValidEmail(email)

  const submit = () => {
    if (!valid) return
    onAdd(email.trim(), desc.trim())
    setEmail('')
    setDesc('')
  }

  return (
    <div className="ep-add-row">
      <div className="ep-input-wrap has-icon">
        <span className="ep-input-icon"><AtSign size={13} /></span>
        <input
          className="ep-input"
          type="email"
          placeholder="email@dominio.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>
      <div className="ep-add-divider" />
      <div className="ep-input-wrap has-icon">
        <span className="ep-input-icon"><Pencil size={13} /></span>
        <input
          className="ep-input"
          placeholder="Descrição (ex: Diretor)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>
      <button className="ep-btn ep-btn-primary" onClick={submit} disabled={!valid}>
        <Plus size={14} />
        Adicionar
      </button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function EmailPadraoPage() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'covered' | 'empty'>('all')
  const [query, setQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: escopos = [] } = useQuery<EmailPadraoEscopo[]>({
    queryKey: ['email-padrao-escopos'],
    queryFn: getEmailPadraoEscopos,
  })

  const selected = useMemo(
    () => escopos.find(s => scopeKey(s.estabelecimentoId, s.empresaId) === selectedKey) ?? null,
    [escopos, selectedKey],
  )

  const { data: emails = [], isLoading: loadingEmails } = useQuery<EmailPadrao[]>({
    queryKey: ['emails-padrao', selected?.estabelecimentoId, selected?.empresaId],
    queryFn: () => getEmailsPadrao(selected!.estabelecimentoId, selected!.empresaId),
    enabled: !!selected,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['email-padrao-escopos'] })
    if (selected) {
      queryClient.invalidateQueries({
        queryKey: ['emails-padrao', selected.estabelecimentoId, selected.empresaId],
      })
    }
  }

  const criarMutation = useMutation({
    mutationFn: ({ email, descricao }: { email: string; descricao?: string }) =>
      createEmailPadrao({
        estabelecimentoId: selected!.estabelecimentoId,
        empresaId: selected!.empresaId,
        email,
        descricao,
      }),
    onSuccess: invalidateAll,
  })

  const removerMutation = useMutation({
    mutationFn: (id: string) => deleteEmailPadrao(id),
    onSuccess: invalidateAll,
  })

  // Derived stats
  const totalEmails = escopos.reduce((sum, s) => sum + s.emailCount, 0)
  const emptyScopeCount = escopos.filter(s => s.emailCount === 0).length
  const coveredCount = escopos.length - emptyScopeCount

  // Filtered scope list
  const filteredScopes = useMemo(() => {
    return escopos.filter(s => {
      if (filter === 'covered' && s.emailCount === 0) return false
      if (filter === 'empty' && s.emailCount > 0) return false
      if (query) {
        const q = query.toLowerCase()
        return s.estabelecimentoNome.toLowerCase().includes(q) || s.empresaNome.toLowerCase().includes(q)
      }
      return true
    })
  }, [escopos, filter, query])

  // Live email count for selected scope (prefer fresh data from emails query when loaded)
  const liveCount = selected
    ? loadingEmails
      ? selected.emailCount
      : emails.length
    : 0

  return (
    <div className="ep-page">
      {/* Page header */}
      <div className="ep-pageheader">
        <div className="ep-pageheader-icon">
          <Mail size={22} />
        </div>
        <div className="ep-pageheader-text">
          <h1 className="ep-pageheader-title">Emails Padrão</h1>
          <p className="ep-pageheader-sub">
            Destinatários padrão para notificações por email, agrupados por{' '}
            <strong>estabelecimento × empresa contratada</strong>.
            Toda nova ocorrência aberta neste escopo será enviada para a lista abaixo.
          </p>
        </div>
        <span className="ep-pageheader-stat">
          <span className="ep-pageheader-stat-dot" />
          {totalEmails} destinatário{totalEmails !== 1 ? 's' : ''} ativo{totalEmails !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="ep-md-grid">

        {/* LEFT — scope list */}
        <aside className="ep-card ep-scope-list">
          {/* Search */}
          <div className="ep-scope-list-search">
            <div className="ep-input-wrap has-icon">
              <span className="ep-input-icon"><Search size={13} /></span>
              <input
                className="ep-input"
                placeholder="Buscar estabelecimento ou empresa..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="ep-scope-list-filter">
            <button
              className={`ep-filter-chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todos · {escopos.length}
            </button>
            <button
              className={`ep-filter-chip ${filter === 'covered' ? 'active' : ''}`}
              onClick={() => setFilter('covered')}
            >
              Coberto · {coveredCount}
            </button>
            <button
              className={`ep-filter-chip ${filter === 'empty' ? 'active' : ''}`}
              onClick={() => setFilter('empty')}
            >
              Sem cobertura · {emptyScopeCount}
            </button>
          </div>

          {/* Scope items */}
          <div className="ep-scope-scroll">
            {filteredScopes.length === 0 && (
              <div className="ep-scope-empty">Nenhum escopo encontrado.</div>
            )}
            {filteredScopes.map(s => {
              const key = scopeKey(s.estabelecimentoId, s.empresaId)
              const isSel = key === selectedKey
              const isEmpty = s.emailCount === 0
              // use live count if this is the selected scope
              const count = isSel && !loadingEmails ? emails.length : s.emailCount
              return (
                <div
                  key={key}
                  className={`ep-scope-item ${isSel ? 'selected' : ''}`}
                  onClick={() => setSelectedKey(key)}
                >
                  {isEmpty && !isSel && <span className="ep-scope-warn" title="Sem destinatários" />}
                  <div className="ep-scope-item-text">
                    <div className="ep-scope-item-est">{s.estabelecimentoNome}</div>
                    <div className="ep-scope-item-emp">{s.empresaNome}</div>
                  </div>
                  <span className={`ep-scope-item-count ${count === 0 ? 'empty' : 'has'}`}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </aside>

        {/* RIGHT — stats + detail */}
        <div>
          {/* Stats strip */}
          <div className="ep-stat-strip">
            <div className="ep-stat">
              <div className="ep-stat-label">Escopos</div>
              <div className="ep-stat-value">
                <span className="ep-stat-num">{escopos.length}</span>
              </div>
              <div className="ep-stat-foot">combinações configuradas</div>
            </div>
            <div className="ep-stat">
              <div className="ep-stat-label">Destinatários</div>
              <div className="ep-stat-value">
                <span className="ep-stat-num ok">{totalEmails}</span>
              </div>
              <div className="ep-stat-foot">somando todos os escopos</div>
            </div>
            <div className="ep-stat">
              <div className="ep-stat-label">Sem cobertura</div>
              <div className="ep-stat-value">
                <span className={`ep-stat-num ${emptyScopeCount > 0 ? 'warn' : 'ok'}`}>
                  {emptyScopeCount}
                </span>
              </div>
              <div className="ep-stat-foot">
                {emptyScopeCount > 0 ? 'escopos sem destinatários' : 'todos os escopos cobertos'}
              </div>
            </div>
          </div>

          {/* Detail card */}
          {!selected ? (
            <div className="ep-card">
              <div className="ep-list-empty" style={{ padding: '56px 20px' }}>
                <div className="ep-list-empty-icon"><Mail size={22} /></div>
                <div className="ep-list-empty-title">Nenhum escopo selecionado</div>
                <div className="ep-list-empty-sub">
                  Selecione um escopo na lista à esquerda para gerenciar os destinatários.
                </div>
              </div>
            </div>
          ) : (
            <section className="ep-card">
              <div className="ep-detail-head">
                <div className="ep-detail-head-icon">
                  {selected.estabelecimentoNome.slice(0, 1)}
                </div>
                <div className="ep-detail-head-text">
                  <div className="ep-detail-head-title">
                    {selected.estabelecimentoNome}{' '}
                    <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>×</span>{' '}
                    {selected.empresaNome}
                  </div>
                  <div className="ep-detail-head-sub">
                    <span>{liveCount} destinatário{liveCount !== 1 ? 's' : ''}</span>
                    <span className="ep-detail-head-dot" />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <BellRing size={12} />
                      Notificação ativa para novas ocorrências
                    </span>
                  </div>
                </div>
              </div>

              <div className="ep-detail-body">
                {/* Coverage banner */}
                {liveCount === 0 ? (
                  <div className="ep-coverage warn">
                    <span className="ep-coverage-icon"><AlertTriangle size={15} /></span>
                    <span className="ep-coverage-text">
                      <strong>Sem cobertura.</strong> Ocorrências abertas neste escopo não disparam notificação.
                    </span>
                  </div>
                ) : (
                  <div className="ep-coverage ok">
                    <span className="ep-coverage-icon"><ShieldCheck size={15} /></span>
                    <span className="ep-coverage-text">
                      <strong>Coberto.</strong> {liveCount} destinatário{liveCount !== 1 ? 's' : ''} receberá{liveCount !== 1 ? 'ão' : ''} cada nova ocorrência neste escopo.
                    </span>
                  </div>
                )}

                {/* Add */}
                <div>
                  <div className="ep-section-title">
                    <span className="ep-section-title-num">+</span>
                    <span className="ep-section-title-text">Adicionar destinatário</span>
                  </div>
                  <AddEmailInline
                    onAdd={(email, desc) =>
                      criarMutation.mutate({ email, descricao: desc || undefined })
                    }
                  />
                </div>

                {/* Email list */}
                <div>
                  <div className="ep-list-head">
                    <span>Lista atual · {loadingEmails ? '…' : emails.length}</span>
                  </div>
                  <div className="ep-list">
                    {loadingEmails ? (
                      <div className="ep-list-empty">
                        <div className="ep-list-empty-sub">Carregando...</div>
                      </div>
                    ) : emails.length === 0 ? (
                      <div className="ep-list-empty">
                        <div className="ep-list-empty-icon"><MailPlus size={22} /></div>
                        <div className="ep-list-empty-title">Nenhum destinatário neste escopo</div>
                        <div className="ep-list-empty-sub">
                          Adicione o primeiro email usando o formulário acima.
                        </div>
                      </div>
                    ) : (
                      emails.map(e => (
                        <div key={e.id} className="ep-row">
                          <div className={`ep-avatar ${hashColor(e.email)}`}>
                            {initials(e.email)}
                          </div>
                          <div className="ep-row-content">
                            <div className="ep-row-top">
                              <span className="ep-row-email">{e.email}</span>
                            </div>
                            {e.descricao && <div className="ep-row-desc">{e.descricao}</div>}
                          </div>
                          <div className="ep-row-actions">
                            <button
                              className="ep-btn ep-btn-icon danger"
                              onClick={() => removerMutation.mutate(e.id)}
                              title="Remover"
                              disabled={removerMutation.isPending}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

      </div>
    </div>
  )
}
