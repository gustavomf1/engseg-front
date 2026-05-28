import { BookOpen, Check, Circle } from 'lucide-react'
import { Norma, NaoConformidade } from '../../types'
import { formatDate, formatDateTime } from '../../utils/date'

export function normaStatus(norma: Pick<Norma, 'ativo'>) {
  return norma.ativo ? 'ativo' : 'inativo'
}

export function StatusPill({ ativo }: { ativo: boolean }) {
  return (
    <span className={`nm-pill ${ativo ? 'nm-pill-green' : 'nm-pill-slate'}`}>
      <span className="nm-pill-dot" />
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function hashAvatar(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return `nm-avatar-c${(Math.abs(h) % 5) + 1}`
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

export function Avatar({ name, size = 22 }: { name?: string; size?: number }) {
  const safeName = name || 'Sistema'
  return (
    <span
      className={`nm-avatar-sm ${hashAvatar(safeName)}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {initialsOf(safeName)}
    </span>
  )
}

export function formatAuditDate(value?: string) {
  return value ? formatDateTime(value) : '—'
}

export function formatAuditShort(value?: string) {
  return value ? formatDate(value) : '—'
}

export function firstName(value?: string) {
  return value?.split(/\s+/)[0] || '—'
}

export function hasConteudo(norma?: Pick<Norma, 'conteudo'>) {
  return !!norma?.conteudo?.trim()
}

export function countChars(value?: string) {
  return value?.length ?? 0
}

export function formatCount(value?: number) {
  return (value ?? 0).toLocaleString('pt-BR')
}

export function normalizeTextFileName(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'norma'
}

export function ChecklistItem({ done, label, optional }: { done: boolean; label: string; optional?: boolean }) {
  return (
    <div className="nm-checklist-item">
      <span className={`nm-checklist-icon ${done ? 'done' : ''}`}>
        {done ? <Check size={11} strokeWidth={3} /> : <Circle size={9} />}
      </span>
      <span className={done ? 'done' : ''}>{label}</span>
      {optional && <span className="nm-checklist-optional">opcional</span>}
    </div>
  )
}

export function NormaIcon() {
  return (
    <span className="nm-norm-id-icon">
      <BookOpen size={14} />
    </span>
  )
}

export function statusNcMeta(status: NaoConformidade['status']) {
  const map: Record<string, { label: string; pill: string }> = {
    ABERTA: { label: 'Aberta', pill: 'nm-pill-amber' },
    AGUARDANDO_TRATATIVA: { label: 'Aguard. Tratativa', pill: 'nm-pill-blue' },
    AGUARDANDO_APROVACAO_PLANO: { label: 'Aguard. Aprovação', pill: 'nm-pill-blue' },
    EM_AJUSTE_PELO_EXTERNO: { label: 'Reprovado', pill: 'nm-pill-red' },
    EM_EXECUCAO: { label: 'Em Execução', pill: 'nm-pill-purple' },
    AGUARDANDO_VALIDACAO_FINAL: { label: 'Aguard. Validação', pill: 'nm-pill-blue' },
    CONCLUIDO: { label: 'Concluído', pill: 'nm-pill-green' },
    EM_TRATAMENTO: { label: 'Em Tratamento', pill: 'nm-pill-blue' },
    NAO_RESOLVIDA: { label: 'Não Resolvida', pill: 'nm-pill-red' },
  }
  return map[status] ?? { label: status, pill: 'nm-pill-slate' }
}

export function riscoMeta(risco?: NaoConformidade['nivelRisco']) {
  const map: Record<string, { label: string; tone: 'green' | 'amber' | 'red'; pill: string }> = {
    BAIXO: { label: 'Baixo', tone: 'green', pill: 'nm-pill-green' },
    MODERADO: { label: 'Moderado', tone: 'amber', pill: 'nm-pill-amber' },
    ALTO: { label: 'Alto', tone: 'red', pill: 'nm-pill-red' },
    CRITICO: { label: 'Crítico', tone: 'red', pill: 'nm-pill-red' },
  }
  return risco ? map[risco] ?? { label: risco, tone: 'amber', pill: 'nm-pill-amber' } : null
}
