import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import {
  adicionarTratativaDesvio,
  removerTratativaDesvio,
  submeterTrativaDesvio,
  aprovarDesvio,
  reprovarDesvio,
} from '../../api/desvio'
import { uploadEvidenciaDesvio, downloadEvidencia } from '../../api/evidencia'
import { Desvio, TrativaDesvio, TrativaDesvioEvidencia } from '../../types'
import {
  Plus, Trash2, CheckCircle, XCircle, Clock, Image,
  Send, ChevronDown, ChevronUp, Upload, Download, FileText,
} from 'lucide-react'
import { formatDateTime } from '../../utils/date'

interface Props {
  desvio: Desvio
  onUpdated: () => void
}

// ── Tipos internos ─────────────────────────────────────────────
type HistoricoItem = Desvio['historico'][number]

interface Plano {
  rodada: number
  tratativas: TrativaDesvio[]
  dataSubmissao?: string
  submissorNome?: string
  resultado: 'REPROVADO' | 'APROVADO' | 'PENDENTE'
  dataResultado?: string
  revisorNome?: string
  comentario?: string
}

// ── Lógica de agrupamento ──────────────────────────────────────
function buildPlanos(tratativas: TrativaDesvio[], historico: HistoricoItem[]): Plano[] {
  const byRodada: Record<number, TrativaDesvio[]> = {}
  tratativas.forEach(t => {
    if (t.rodada != null) {
      if (!byRodada[t.rodada]) byRodada[t.rodada] = []
      byRodada[t.rodada].push(t)
    }
  })

  const submissoes: { dataAcao: string; usuarioNome?: string }[] = []
  const resultados: { tipo: string; dataAcao: string; usuarioNome?: string; comentario?: string }[] = []

  for (const h of historico) {
    if (h.tipo === 'TRATATIVA_SUBMETIDA') submissoes.push({ dataAcao: h.dataAcao, usuarioNome: h.usuarioNome })
    if (h.tipo === 'REPROVADO' || h.tipo === 'APROVADO')
      resultados.push({ tipo: h.tipo, dataAcao: h.dataAcao, usuarioNome: h.usuarioNome, comentario: h.comentario })
  }

  return Object.keys(byRodada)
    .map(Number)
    .sort((a, b) => a - b)
    .map((rodada, i) => {
      const trativs = byRodada[rodada].sort((a, b) => a.numero - b.numero)
      const sub = submissoes[i]
      const res = resultados[i]
      const temReprovada = trativs.some(t => t.status === 'REPROVADO')
      const todosAprovados = trativs.every(t => t.status === 'APROVADO')
      const resultado: Plano['resultado'] = res
        ? (res.tipo === 'REPROVADO' ? 'REPROVADO' : 'APROVADO')
        : temReprovada ? 'REPROVADO' : todosAprovados ? 'APROVADO' : 'PENDENTE'

      return {
        rodada,
        tratativas: trativs,
        dataSubmissao: sub?.dataAcao,
        submissorNome: sub?.usuarioNome,
        resultado,
        dataResultado: res?.dataAcao,
        revisorNome: res?.usuarioNome,
        comentario: res?.comentario,
      }
    })
}

// ── Download de evidência ──────────────────────────────────────
async function handleDownload(evidenciaId: string, nome: string) {
  const blob = await downloadEvidencia(evidenciaId)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nome; a.click()
  URL.revokeObjectURL(url)
}

// ── Badges ─────────────────────────────────────────────────────
function StatusBadgeTratativa({ status }: { status: TrativaDesvio['status'] }) {
  if (status === 'APROVADO') return <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"><CheckCircle size={10} />Aprovada</span>
  if (status === 'REPROVADO') return <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"><XCircle size={10} />Reprovada</span>
  return <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"><Clock size={10} />Em análise</span>
}

function PlanoResultadoBadge({ resultado }: { resultado: Plano['resultado'] }) {
  if (resultado === 'APROVADO') return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-green-500 text-white">Aprovado</span>
  if (resultado === 'REPROVADO') return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500 text-white">Reprovado</span>
  return <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500 text-white">Em análise</span>
}

// ── Histórico de Planos ────────────────────────────────────────
function HistoricoPlanosSection({ desvio }: { desvio: Desvio }) {
  const planos = buildPlanos(desvio.tratativas ?? [], desvio.historico ?? [])
  const [abertasSet, setAbertasSet] = useState<Set<number>>(new Set([planos.length - 1]))

  if (planos.length === 0) return null

  function toggle(i: number) {
    setAbertasSet(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })
  }

  return (
    <div className="bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <FileText size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          O que foi submetido{' '}
          <span className="text-slate-400 font-normal">({planos.length} plano{planos.length > 1 ? 's' : ''})</span>
        </h3>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {planos.map((plano, i) => {
          const aberto = abertasSet.has(i)
          const borderColor = plano.resultado === 'APROVADO' ? 'border-l-green-500'
            : plano.resultado === 'REPROVADO' ? 'border-l-red-500' : 'border-l-indigo-400'

          return (
            <div key={plano.rodada} className={`border-l-4 ${borderColor}`}>
              {/* Header do plano */}
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Plano {plano.rodada}</span>
                  {plano.dataSubmissao && <span className="text-xs text-slate-400">{formatDateTime(plano.dataSubmissao)}</span>}
                  <PlanoResultadoBadge resultado={plano.resultado} />
                </div>
                {aberto ? <ChevronUp size={15} className="text-slate-400 shrink-0" /> : <ChevronDown size={15} className="text-slate-400 shrink-0" />}
              </button>

              {/* Conteúdo expandido */}
              {aberto && (
                <div className="px-5 pb-5 space-y-3">
                  {/* Comentário de aprovação */}
                  {plano.resultado === 'APROVADO' && plano.comentario && (
                    <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2">
                      <CheckCircle size={13} className="text-green-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-green-700 dark:text-green-400">Comentário: {plano.comentario}</p>
                    </div>
                  )}

                  {/* Tratativas do plano */}
                  <div className="space-y-3">
                    {plano.tratativas.map(t => (
                      <div key={t.id} className={`rounded-xl border p-4 ${
                        t.status === 'APROVADO' ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/10'
                        : t.status === 'REPROVADO' ? 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/10'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                      }`}>
                        <div className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {t.numero}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.titulo}</p>
                              <StatusBadgeTratativa status={t.status} />
                            </div>
                            <p className="text-xs text-slate-500 break-words mb-2">{t.descricao}</p>

                            {/* Motivo de reprovação */}
                            {t.motivoReprovacao && (
                              <div className="flex items-start gap-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2 mb-2">
                                <XCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700 dark:text-red-400 font-medium break-words">
                                  Motivo: {t.motivoReprovacao}
                                </p>
                              </div>
                            )}

                            {/* Evidências com download */}
                            {t.evidencias?.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Anexos ({t.evidencias.length})</p>
                                <div className="flex flex-wrap gap-2">
                                  {t.evidencias.map(ev => (
                                    <button
                                      key={ev.id}
                                      onClick={() => handleDownload(ev.id, ev.nome)}
                                      className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition max-w-[200px]"
                                    >
                                      {ev.nome.match(/\.(jpg|jpeg|png|webp|gif)$/i)
                                        ? <Image size={12} className="shrink-0" />
                                        : <Download size={12} className="shrink-0" />
                                      }
                                      <span className="truncate">{ev.nome}</span>
                                      <Download size={10} className="shrink-0 opacity-50" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rodapé com info do revisor */}
                  {plano.revisorNome && (
                    <p className="text-xs text-slate-400 pt-1">
                      {plano.resultado === 'REPROVADO' ? 'Reprovado' : 'Aprovado'} por{' '}
                      <span className="font-medium">{plano.revisorNome}</span>
                      {plano.dataResultado && ` • ${formatDateTime(plano.dataResultado)}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TrativaCard (pendentes) ────────────────────────────────────
function TrativaCard({ tratativa: t, onRemover, canRemove }: { tratativa: TrativaDesvio; onRemover?: () => void; canRemove?: boolean }) {
  return (
    <div className="flex items-start gap-3 border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800/50">
      <span className="w-7 h-7 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{t.numero}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.titulo}</p>
        <p className="text-xs text-slate-500 mt-0.5 break-words">{t.descricao}</p>
        {t.evidencias?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {t.evidencias.map(ev => (
              <button
                key={ev.id}
                onClick={() => handleDownload(ev.id, ev.nome)}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition max-w-[180px]"
              >
                {ev.nome.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? <Image size={10} className="shrink-0" /> : <Download size={10} className="shrink-0" />}
                <span className="truncate">{ev.nome}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {canRemove && onRemover && (
        <button onClick={onRemover} className="text-red-400 hover:text-red-600 transition shrink-0 mt-0.5">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────
export default function DesvioTrativaSection({ desvio, onUpdated }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const isResponsavelTratativa = desvio.responsavelTratativaId === user?.id
  const isResponsavelDesvio = desvio.responsavelDesvioId === user?.id
  const isAdmin = user?.isAdmin === true
  const canAddTratativa = (isResponsavelTratativa || isAdmin) && desvio.status === 'AGUARDANDO_TRATATIVA'
  const canReview = (isResponsavelDesvio || isAdmin) && desvio.status === 'AGUARDANDO_APROVACAO'

  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fotosSelecionadas, setFotosSelecionadas] = useState<TrativaDesvioEvidencia[]>([])
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [decisoes, setDecisoes] = useState<Record<string, { reprovado: boolean; motivo: string }>>({})
  const [comentarioAprovacao, setComentarioAprovacao] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['desvio', desvio.id] })
    queryClient.invalidateQueries({ queryKey: ['ocorrencias'] })
    onUpdated()
  }

  const mutAdicionar = useMutation({
    mutationFn: () => adicionarTratativaDesvio(desvio.id, { titulo, descricao, evidenciaIds: fotosSelecionadas.map(f => f.id) }),
    onSuccess: () => { invalidate(); resetForm() },
  })
  const mutRemover = useMutation({
    mutationFn: (trativaId: string) => removerTratativaDesvio(desvio.id, trativaId),
    onSuccess: () => invalidate(),
  })
  const mutSubmeter = useMutation({
    mutationFn: () => submeterTrativaDesvio(desvio.id),
    onSuccess: () => invalidate(),
  })
  const mutAprovar = useMutation({
    mutationFn: () => aprovarDesvio(desvio.id, { comentario: comentarioAprovacao || undefined }),
    onSuccess: () => { invalidate(); setComentarioAprovacao('') },
  })
  const mutReprovar = useMutation({
    mutationFn: (itens: { trativaId: string; motivo: string }[]) => reprovarDesvio(desvio.id, { itens }),
    onSuccess: () => { invalidate(); setDecisoes({}) },
  })

  function resetForm() { setTitulo(''); setDescricao(''); setFotosSelecionadas([]); setShowForm(false) }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const ev = await uploadEvidenciaDesvio(desvio.id, file, 'TRATATIVA')
      setFotosSelecionadas(prev => [...prev, { id: ev.id, nome: ev.nomeArquivo, url: ev.urlArquivo }])
    } catch { alert('Erro ao fazer upload. Tente novamente.') }
    finally { setUploadingFoto(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  function handleConfirmarRevisao() {
    const reprovadas = Object.entries(decisoes)
      .filter(([, d]) => d.reprovado)
      .map(([trativaId, d]) => ({ trativaId, motivo: d.motivo }))
    if (reprovadas.some(r => !r.motivo.trim())) { alert('Preencha o motivo de todas as reprovadas.'); return }
    reprovadas.length === 0 ? mutAprovar.mutate() : mutReprovar.mutate(reprovadas)
  }

  const tratativas = desvio.tratativas ?? []
  const pendentes = tratativas.filter(t => t.status === 'PENDENTE')
  const aprovadas = tratativas.filter(t => t.status === 'APROVADO')

  // ── CONCLUÍDO ──────────────────────────────────────────────────
  if (desvio.status === 'CONCLUIDO') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle size={22} className="text-green-500 shrink-0" />
            <div>
              <div className="font-bold text-green-800 dark:text-green-300">Desvio Concluído</div>
              <div className="text-sm text-green-600 dark:text-green-400">{aprovadas.length} tratativa(s) aprovada(s).</div>
            </div>
          </div>
        </div>
        <HistoricoPlanosSection desvio={desvio} />
      </div>
    )
  }

  // ── AGUARDANDO APROVAÇÃO — responsavelDesvio ───────────────────
  if (desvio.status === 'AGUARDANDO_APROVACAO' && canReview) {
    const algumaReprovada = pendentes.some(t => decisoes[t.id]?.reprovado)
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-[var(--bg-surface)] rounded-xl border-2 border-indigo-400 shadow-md p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <CheckCircle size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Revisar Tratativas</h3>
              <p className="text-xs text-slate-500">Marque as que devem ser reprovadas e informe o motivo</p>
            </div>
          </div>

          <div className="space-y-3">
            {pendentes.map(t => {
              const dec = decisoes[t.id] ?? { reprovado: false, motivo: '' }
              return (
                <div key={t.id} className={`rounded-xl border p-4 transition ${dec.reprovado ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{t.numero}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5 break-words mb-1">{t.descricao}</p>
                      {t.evidencias?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {t.evidencias.map(ev => (
                            <button key={ev.id} onClick={() => handleDownload(ev.id, ev.nome)}
                              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition max-w-[180px]">
                              {ev.nome.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? <Image size={10} className="shrink-0" /> : <Download size={10} className="shrink-0" />}
                              <span className="truncate">{ev.nome}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer shrink-0 ml-2">
                      <input type="checkbox" checked={dec.reprovado}
                        onChange={e => setDecisoes(prev => ({ ...prev, [t.id]: { ...dec, reprovado: e.target.checked } }))}
                        className="w-4 h-4 accent-red-500" />
                      <span className="text-xs text-red-500 font-medium">Reprovar</span>
                    </label>
                  </div>
                  {dec.reprovado && (
                    <div className="mt-3 ml-10">
                      <textarea value={dec.motivo}
                        onChange={e => setDecisoes(prev => ({ ...prev, [t.id]: { ...dec, motivo: e.target.value } }))}
                        placeholder="Motivo da reprovação (obrigatório)..." rows={2}
                        className="w-full text-sm border border-red-300 dark:border-red-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white dark:bg-slate-900 resize-none"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-5 space-y-3">
            {!algumaReprovada && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Comentário (opcional)</label>
                <input type="text" value={comentarioAprovacao} onChange={e => setComentarioAprovacao(e.target.value)}
                  placeholder="Observações sobre a aprovação..."
                  className="w-full text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )}
            <button onClick={handleConfirmarRevisao}
              disabled={mutAprovar.isPending || mutReprovar.isPending}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${algumaReprovada ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
              {mutAprovar.isPending || mutReprovar.isPending ? 'Processando...'
                : algumaReprovada ? `Reprovar ${pendentes.filter(t => decisoes[t.id]?.reprovado).length} tratativa(s)`
                : 'Aprovar Todas'}
            </button>
          </div>
        </div>
        <HistoricoPlanosSection desvio={desvio} />
      </div>
    )
  }

  // ── AGUARDANDO APROVAÇÃO — responsavelTratativa ────────────────
  if (desvio.status === 'AGUARDANDO_APROVACAO') {
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={22} className="text-indigo-500 shrink-0" />
            <div>
              <div className="font-bold text-indigo-800 dark:text-indigo-300">Aguardando Revisão</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">
                As tratativas foram enviadas para {desvio.responsavelDesvioNome ?? 'o responsável'} revisar.
              </div>
            </div>
          </div>
          <div className="space-y-2">{pendentes.map(t => <TrativaCard key={t.id} tratativa={t} />)}</div>
        </div>
        <HistoricoPlanosSection desvio={desvio} />
      </div>
    )
  }

  // ── AGUARDANDO TRATATIVA ───────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[var(--bg-surface)] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-slate-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              Tratativas do Novo Plano {pendentes.length > 0 ? `(${pendentes.length})` : ''}
            </h3>
          </div>
          {canAddTratativa && (
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
              <Plus size={13} /> Nova tratativa
            </button>
          )}
        </div>

        {pendentes.length === 0 && !showForm && (
          <div className="text-center py-8 text-slate-400 text-sm">
            {canAddTratativa ? 'Clique em "Nova tratativa" para montar o plano.' : 'Nenhuma tratativa adicionada ainda.'}
          </div>
        )}

        <div className="space-y-3">
          {pendentes.map(t => <TrativaCard key={t.id} tratativa={t} canRemove={canAddTratativa} onRemover={() => mutRemover.mutate(t.id)} />)}
        </div>

        {/* Form nova tratativa */}
        {showForm && canAddTratativa && (
          <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nova Tratativa</p>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Título *</label>
              <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Instalação de proteção coletiva..."
                className="w-full text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descrição *</label>
              <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva o que foi feito..." rows={3}
                className="w-full text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-500">Fotos / Evidências *</label>
                <span className="text-xs text-slate-400">{fotosSelecionadas.length} anexo(s)</span>
              </div>
              {fotosSelecionadas.length > 0 && (
                <div className="space-y-1 mb-2">
                  {fotosSelecionadas.map(f => (
                    <div key={f.id} className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-1.5">
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                      <span className="text-xs text-green-700 dark:text-green-400 flex-1 truncate">{f.nome}</span>
                      <button onClick={() => setFotosSelecionadas(prev => prev.filter(x => x.id !== f.id))} className="text-slate-400 hover:text-red-500 transition">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileSelect} className="hidden" id="foto-tratativa-upload" />
              <label htmlFor="foto-tratativa-upload"
                className={`flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-500 hover:border-blue-300 hover:text-blue-600 transition ${uploadingFoto ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={14} />
                {uploadingFoto ? 'Enviando...' : fotosSelecionadas.length > 0 ? '+ Adicionar outra foto' : 'Selecionar foto ou PDF'}
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => mutAdicionar.mutate()}
                disabled={!titulo.trim() || !descricao.trim() || fotosSelecionadas.length === 0 || mutAdicionar.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-40">
                {mutAdicionar.isPending ? 'Adicionando...' : 'Adicionar Tratativa'}
              </button>
              <button onClick={resetForm} className="px-4 py-2 text-sm text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {canAddTratativa && pendentes.length > 0 && !showForm && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={() => mutSubmeter.mutate()} disabled={mutSubmeter.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Send size={15} />
              {mutSubmeter.isPending ? 'Enviando...' : 'Enviar Plano para Aprovação'}
            </button>
          </div>
        )}
      </div>

      <HistoricoPlanosSection desvio={desvio} />
    </div>
  )
}
