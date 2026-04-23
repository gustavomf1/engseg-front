# Export Tratativa PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar botão de exportação PDF na tela `/tratativas/:tipo/:id` que gera um relatório completo com dados da ocorrência + tratativa (5 porquês, causa raiz, plano de ação com evidências por atividade).

**Architecture:** Criar `src/utils/exportTratativa.ts` espelhando o padrão de `exportOcorrencia.ts`. Exportar helpers compartilhados de `exportOcorrencia.ts` para reutilização. Adicionar botão dropdown no `TrativaDetailPage.tsx` visível apenas para status `CONCLUIDO` e perfis autorizados.

**Tech Stack:** jsPDF 4.x, jspdf-autotable 5.x, React + TypeScript, Axios (via api/evidencia.ts)

---

## File Map

| Ação | Arquivo | O que muda |
|------|---------|------------|
| Modify | `src/utils/exportOcorrencia.ts` | Exportar 6 helpers: `blobToDataUrl`, `getImageDimensions`, `gifToDataUrl`, `IMAGE_EXTS`, `getExt`, `renderEvidenciasSection` |
| Create | `src/utils/exportTratativa.ts` | Função pública `exportTratativaBundle(nc, trechos)` + helpers privados |
| Modify | `src/pages/TrativaDetailPage.tsx` | Import, 2 estados, handler `handleExportPDF`, botão dropdown na UI |

---

## Task 1: Exportar helpers de `exportOcorrencia.ts`

**Files:**
- Modify: `src/utils/exportOcorrencia.ts`

- [ ] **Step 1: Adicionar `export` aos 6 símbolos**

Abrir `src/utils/exportOcorrencia.ts` e adicionar `export` antes de cada um:

```ts
// linha ~27 — era: const IMAGE_EXTS = ...
export const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

// linha ~29 — era: function getExt(...)
export function getExt(nome: string) {
  const dot = nome.lastIndexOf('.')
  return dot >= 0 ? nome.substring(dot + 1).toLowerCase() : ''
}

// linha ~45 — era: function blobToDataUrl(...)
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// linha ~54 — era: function getImageDimensions(...)
export function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

// linha ~63 — era: async function gifToDataUrl(...)
export async function gifToDataUrl(blob: Blob): Promise<string> {
  const dataUrl = await blobToDataUrl(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

// linha ~79 — era: async function renderEvidenciasSection(...)
export async function renderEvidenciasSection(doc: jsPDF, imagens: Evidencia[]): Promise<void> {
  // corpo inalterado
```

- [ ] **Step 2: Verificar build**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
npm run build 2>&1 | tail -20
```

Expected: sem erros de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/utils/exportOcorrencia.ts
git commit -m "refactor: export shared PDF helpers from exportOcorrencia"
```

---

## Task 2: Criar `src/utils/exportTratativa.ts`

**Files:**
- Create: `src/utils/exportTratativa.ts`

- [ ] **Step 1: Criar o arquivo com o conteúdo abaixo**

```ts
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDate } from './date'
import { getEvidencias, getEvidenciasAtividade, downloadEvidencia } from '../api/evidencia'
import {
  blobToDataUrl,
  getImageDimensions,
  gifToDataUrl,
  IMAGE_EXTS,
  getExt,
  renderEvidenciasSection,
} from './exportOcorrencia'
import type { NaoConformidade, Evidencia } from '../types'

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number }
  }
}

interface NormaTrecho {
  id: string
  normaId: string
  clausulaReferencia?: string
  textoEditado: string
}

function sanitize(name: string) {
  return (name || 'tratativa').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 60)
}

async function renderAtividadeImagens(
  doc: jsPDF,
  imagens: Evidencia[],
  y: number,
  pageW: number,
  marginX: number,
): Promise<number> {
  const usableW = pageW - marginX * 2
  const maxImgH = 90
  const legendH = 6
  const gapH = 6

  for (let i = 0; i < imagens.length; i++) {
    if (y > 245) { doc.addPage(); y = 20 }

    const ev = imagens[i]
    const ext = getExt(ev.nomeArquivo)

    try {
      const blob = await downloadEvidencia(ev.id)
      let dataUrl: string
      let format: string

      if (ext === 'gif') {
        dataUrl = await gifToDataUrl(blob)
        format = 'PNG'
      } else {
        dataUrl = await blobToDataUrl(blob)
        format = ext === 'png' ? 'PNG' : ext === 'webp' ? 'WEBP' : 'JPEG'
      }

      const { w: imgW, h: imgH } = await getImageDimensions(dataUrl)
      const scale = Math.min(usableW / imgW, maxImgH / imgH)
      const drawW = imgW * scale
      const drawH = imgH * scale
      const x = marginX + (usableW - drawW) / 2

      doc.addImage(dataUrl, format, x, y, drawW, drawH)
      y += drawH
    } catch {
      doc.setFillColor(241, 245, 249)
      doc.rect(marginX, y, usableW, 28, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Arquivo indisponível — ${ev.nomeArquivo}`,
        marginX + usableW / 2,
        y + 16,
        { align: 'center' },
      )
      y += 28
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text(`${i + 1}. ${ev.nomeArquivo}`, marginX, y + 4)
    y += legendH + gapH
  }

  return y
}

async function buildTratativaPDFDoc(
  nc: NaoConformidade,
  trechos: NormaTrecho[],
  ocorrenciaImagens: Evidencia[],
  atividadeEvidencias: Map<string, Evidencia[]>,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const marginX = 15
  let y: number

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('SGS — Sistema de Gestão de Segurança', marginX, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(186, 230, 253)
  doc.text('Relatório de Tratativa de Não Conformidade', marginX, 22)
  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8)
  doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, pageW - marginX, 22, { align: 'right' })

  y = 38

  // ── Título + tags ──────────────────────────────────────────────────────────
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const tituloLines = doc.splitTextToSize(nc.titulo || '—', pageW - marginX * 2)
  doc.text(tituloLines, marginX, y)
  y += tituloLines.length * 6 + 2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  const tags: string[] = [`Status: ${nc.status}`]
  if (nc.nivelSeveridade) tags.push(`Severidade: ${nc.nivelSeveridade}`)
  if (nc.regraDeOuro) tags.push('Regra de Ouro')
  if (nc.reincidencia) tags.push('Reincidência')
  doc.text(tags.join('  ·  '), marginX, y)
  y += 8

  // ── Informações da Ocorrência ─────────────────────────────────────────────
  const rows: [string, string][] = [
    ['Estabelecimento', nc.estabelecimentoNome || '—'],
    ['Localização', nc.localizacaoNome || '—'],
    ['Data de Registro', formatDate(nc.dataRegistro) || '—'],
    ['Prazo para Resolução', formatDate(nc.dataLimiteResolucao) || '—'],
    ['Usuário de Registro', nc.usuarioCriacaoNome || nc.tecnicoNome || '—'],
    [
      'Eng. Responsável pela NC',
      nc.engVerificacaoNome
        ? `${nc.engVerificacaoNome} (${nc.engVerificacaoEmail ?? ''})`
        : nc.engVerificacaoEmail || '—',
    ],
    [
      'Eng. Responsável pela Tratativa',
      nc.engConstruturaNome
        ? `${nc.engConstruturaNome} (${nc.engConstrutoraEmail ?? ''})`
        : nc.engConstrutoraEmail || '—',
    ],
  ]

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Campo', 'Valor']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [3, 105, 161], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 65, fontStyle: 'bold', textColor: [71, 85, 105] } },
  })
  y = doc.lastAutoTable.finalY + 8

  // ── Descrição ──────────────────────────────────────────────────────────────
  if (y > 250) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('Descrição', marginX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  const descLines = doc.splitTextToSize(nc.descricao || '—', pageW - marginX * 2)
  if (y + descLines.length * 5 > 275) { doc.addPage(); y = 20 }
  doc.text(descLines, marginX, y)
  y += descLines.length * 5 + 6

  // ── Normas Vinculadas ──────────────────────────────────────────────────────
  if (nc.normas && nc.normas.length > 0) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Normas Vinculadas', marginX, y)
    y += 3

    const normaRows: [string, string, string][] = []
    for (const n of nc.normas) {
      const ts = trechos.filter(t => t.normaId === n.id)
      if (ts.length === 0) {
        normaRows.push([n.titulo, '—', '—'])
      } else {
        for (const t of ts) {
          normaRows.push([n.titulo, t.clausulaReferencia || '—', t.textoEditado])
        }
      }
    }

    autoTable(doc, {
      startY: y + 2,
      margin: { left: marginX, right: marginX },
      head: [['Norma', 'Cláusula', 'Trecho']],
      body: normaRows,
      theme: 'grid',
      headStyles: { fillColor: [3, 105, 161], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 30 } },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Evidências da Ocorrência ───────────────────────────────────────────────
  // renderEvidenciasSection faz addPage() próprio; não precisamos gerenciar y aqui
  await renderEvidenciasSection(doc, ocorrenciaImagens)
  if (ocorrenciaImagens.length > 0) {
    doc.addPage()
    y = 20
  }

  // ── 5 Porquês ──────────────────────────────────────────────────────────────
  const porques = [
    { pergunta: nc.porqueUm, resposta: nc.porqueUmResposta },
    { pergunta: nc.porqueDois, resposta: nc.porqueDoisResposta },
    { pergunta: nc.porqueTres, resposta: nc.porqueTresResposta },
    { pergunta: nc.porqueQuatro, resposta: nc.porqueQuatroResposta },
    { pergunta: nc.porqueCinco, resposta: nc.porqueCincoResposta },
  ].filter(p => p.pergunta)

  if (porques.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Investigação — 5 Porquês', marginX, y)
    y += 3

    autoTable(doc, {
      startY: y + 2,
      margin: { left: marginX, right: marginX },
      head: [['#', 'Pergunta', 'Resposta']],
      body: porques.map((p, i) => [`${i + 1}`, p.pergunta || '—', p.resposta || '—']),
      theme: 'grid',
      headStyles: { fillColor: [3, 105, 161], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' as const }, 1: { cellWidth: 80 } },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // ── Causa Raiz ─────────────────────────────────────────────────────────────
  if (nc.causaRaiz) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Causa Raiz', marginX, y)
    y += 5

    const causaLines = doc.splitTextToSize(nc.causaRaiz, pageW - marginX * 2 - 10)
    const blockH = Math.max(causaLines.length * 5 + 8, 18)
    doc.setFillColor(239, 246, 255)
    doc.rect(marginX, y - 2, pageW - marginX * 2, blockH, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 58, 138)
    doc.text(causaLines, marginX + 5, y + 4)
    y += blockH + 6
  }

  // ── Plano de Ação ──────────────────────────────────────────────────────────
  if (nc.atividades && nc.atividades.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Plano de Ação', marginX, y)
    y += 6

    for (const atividade of nc.atividades) {
      if (y > 255) { doc.addPage(); y = 20 }

      const statusLabel =
        atividade.status === 'APROVADA' ? 'Aprovada'
        : atividade.status === 'REJEITADA' ? 'Rejeitada'
        : 'Pendente'

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(15, 23, 42)
      doc.text(`${atividade.ordem}. ${atividade.titulo}`, marginX, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(`Status: ${statusLabel}`, pageW - marginX, y, { align: 'right' })
      y += 5

      const atDescLines = doc.splitTextToSize(atividade.descricao || '—', pageW - marginX * 2)
      if (y + atDescLines.length * 4.5 > 270) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(30, 41, 59)
      doc.text(atDescLines, marginX + 4, y)
      y += atDescLines.length * 4.5 + 4

      const imagens = atividadeEvidencias.get(atividade.id) ?? []
      if (imagens.length > 0) {
        y = await renderAtividadeImagens(doc, imagens, y, pageW, marginX)
      }

      doc.setDrawColor(226, 232, 240)
      doc.line(marginX, y, pageW - marginX, y)
      y += 6
    }
  }

  // ── Footer em todas as páginas ────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Página ${p} de ${totalPages}`, pageW - marginX, 290, { align: 'right' })
    doc.text('SafeCorp · SGS — Documento gerado automaticamente', marginX, 290)
  }

  return doc
}

export async function exportTratativaBundle(
  nc: NaoConformidade,
  trechos: NormaTrecho[] = [],
): Promise<void> {
  const [ocorrenciaEvidencias, ...atividadesEvs] = await Promise.all([
    getEvidencias(nc.id, 'OCORRENCIA'),
    ...nc.atividades.map(a => getEvidenciasAtividade(a.id)),
  ])

  const ocorrenciaImagens = ocorrenciaEvidencias.filter(e => IMAGE_EXTS.has(getExt(e.nomeArquivo)))

  const atividadeEvidencias = new Map<string, Evidencia[]>()
  nc.atividades.forEach((a, i) => {
    const imgs = atividadesEvs[i].filter(e => IMAGE_EXTS.has(getExt(e.nomeArquivo)))
    atividadeEvidencias.set(a.id, imgs)
  })

  const doc = await buildTratativaPDFDoc(nc, trechos, ocorrenciaImagens, atividadeEvidencias)

  const titulo = sanitize(nc.titulo || nc.id)
  const date = new Date().toISOString().slice(0, 10)
  doc.save(`Tratativa_NC_${titulo}_${date}.pdf`)
}
```

- [ ] **Step 2: Verificar build**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
npm run build 2>&1 | tail -20
```

Expected: sem erros de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/utils/exportTratativa.ts
git commit -m "feat: add exportTratativaBundle PDF utility"
```

---

## Task 3: Integrar botão de export no `TrativaDetailPage.tsx`

**Files:**
- Modify: `src/pages/TrativaDetailPage.tsx`

- [ ] **Step 1: Adicionar imports**

Localizar a linha de import do lucide-react (que começa com `ArrowLeft, MapPin, ...`) e adicionar `Download, FileDown`:

```ts
import {
  ArrowLeft, MapPin, Calendar, Shield, AlertTriangle, FileText,
  CheckCircle, XCircle, Clock, Eye, Building2, User, BookOpen,
  RefreshCw, Plus, Trash2, History, ChevronDown, ChevronUp,
  Download, FileDown,
} from 'lucide-react'
```

Adicionar import da função de export logo após os outros imports de utils:

```ts
import { exportTratativaBundle } from '../utils/exportTratativa'
```

- [ ] **Step 2: Adicionar estados**

Após `const [confirmarEnvio, setConfirmarEnvio] = useState(false)` (por volta da linha 91), adicionar:

```ts
const [exportMenuOpen, setExportMenuOpen] = useState(false)
const [exporting, setExporting] = useState(false)
```

- [ ] **Step 3: Adicionar handler**

Após os handlers de download existentes (após `handleDownloadEvidencia`), adicionar:

```ts
async function handleExportPDF() {
  if (!nc) return
  setExporting(true)
  setExportMenuOpen(false)
  try {
    await exportTratativaBundle(nc, trechos)
  } catch (err) {
    console.error('[exportTratativa]', err)
    alert('Erro ao exportar o relatório. Tente novamente.')
  } finally {
    setExporting(false)
  }
}
```

- [ ] **Step 4: Adicionar botão na UI**

Localizar o botão "Voltar" (com `<ArrowLeft`) no JSX — ficará em uma `div` do tipo header/toolbar no topo do conteúdo. Adicionar o dropdown de export ao lado:

```tsx
{/* Export — apenas quando CONCLUIDO */}
{(() => {
  const podeExportar =
    nc?.status === 'CONCLUIDO' &&
    (user?.perfil === 'ENGENHEIRO' || user?.perfil === 'TECNICO' || user?.isAdmin)
  if (!podeExportar) return null
  return (
    <div className="relative">
      <button
        onClick={() => setExportMenuOpen(v => !v)}
        onBlur={() => setTimeout(() => setExportMenuOpen(false), 150)}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <Download size={15} /> Exportar
      </button>
      {exportMenuOpen && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={handleExportPDF}
            disabled={exporting}
          >
            <FileDown size={15} className="text-sky-600" />
            {exporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      )}
    </div>
  )
})()}
```

Posicionar este bloco na mesma `div` que contém o botão `← Voltar`, à direita dele. Verificar o padrão em `OcorrenciaDetailPage.tsx` linhas 225–260 para referência de posicionamento exato.

- [ ] **Step 5: Verificar build**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
npm run build 2>&1 | tail -20
```

Expected: sem erros de TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/pages/TrativaDetailPage.tsx
git commit -m "feat: add PDF export button to TrativaDetailPage"
```

---

## Task 4: Verificação manual

- [ ] **Step 1: Iniciar dev server**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
npm run dev
```

- [ ] **Step 2: Testar golden path**

1. Navegar para uma tratativa com `status = CONCLUIDO`
2. Verificar que o botão "Exportar" aparece no topo
3. Clicar → "Exportar PDF"
4. Verificar que o arquivo `Tratativa_NC_<titulo>_<data>.pdf` é baixado
5. Abrir o PDF e checar:
   - Header azul com título correto
   - Tabela de informações da ocorrência completa
   - Descrição
   - Normas vinculadas (se houver)
   - Evidências da ocorrência embutidas (se houver)
   - Seção "Investigação — 5 Porquês" com tabela
   - Bloco azul da causa raiz
   - Seção "Plano de Ação" com cada atividade + imagens inline
   - Footer com numeração de páginas

- [ ] **Step 3: Testar casos negativos**

1. Tratativa com status `EM_EXECUCAO` → botão NÃO deve aparecer
2. Login com perfil `EXTERNO` → botão NÃO deve aparecer
3. Tratativa sem evidências → PDF gerado normalmente (sem seção de imagens)
4. Tratativa sem 5 porquês preenchidos → seção omitida do PDF

---

## Spec Coverage Check

| Requisito do spec | Task que implementa |
|---|---|
| Novo arquivo `exportTratativa.ts` | Task 2 |
| Exportar helpers de `exportOcorrencia.ts` | Task 1 |
| Header PDF | Task 2 — `buildTratativaPDFDoc` header |
| Informações da Ocorrência | Task 2 — tabela `rows` |
| Descrição | Task 2 — seção Descrição |
| Normas Vinculadas com trechos | Task 2 — seção Normas |
| Evidências da Ocorrência | Task 2 — `renderEvidenciasSection` |
| 5 Porquês | Task 2 — seção 5 Porquês |
| Causa Raiz | Task 2 — bloco azul |
| Plano de Ação com evidências por atividade | Task 2 — loop atividades + `renderAtividadeImagens` |
| Footer | Task 2 — loop footer |
| Botão visível só para CONCLUIDO | Task 3 — condição `podeExportar` |
| Perfis autorizados: ENGENHEIRO, TECNICO, ADMIN | Task 3 — condição `podeExportar` |
| `trechos` passado ao export | Task 3 — `exportTratativaBundle(nc, trechos)` |
