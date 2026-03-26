const TZ = 'America/Sao_Paulo'

// O backend retorna LocalDateTime sem timezone (ex: "2026-03-26T19:51:14").
// Adicionamos "Z" para forçar interpretação como UTC antes de converter para Brasília.
function parseUTC(dateStr: string): Date {
  return new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z')
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return parseUTC(dateStr).toLocaleDateString('pt-BR', { timeZone: TZ })
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—'
  return parseUTC(dateStr).toLocaleString('pt-BR', { timeZone: TZ })
}
