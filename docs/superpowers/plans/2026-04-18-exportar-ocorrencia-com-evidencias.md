# Exportar Ocorrência com Evidências — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estender o export PDF de ocorrências para embutir fotos na seção "Evidências" e baixar outros arquivos junto ao relatório em um ZIP.

**Architecture:** `exportOcorrenciaToPDF` é refatorada para `buildPDFDoc` (async, retorna `jsPDF`). `exportOcorrenciaBundle` orquestra: separa imagens/outros, monta PDF com fotos embutidas, e decide entre PDF direto ou ZIP. `OcorrenciaDetailPage` busca evidências antes de chamar o bundle e gerencia loading state no botão.

**Tech Stack:** jsPDF 4.x, jspdf-autotable, jszip (novo), TypeScript, React

---

> **Nota:** O projeto não possui framework de testes configurado (sem jest/vitest no package.json). As tasks abaixo não incluem steps de teste automatizado — valide manualmente conforme o checklist na spec.

---

### Task 1: Instalar jszip

**Files:**
- Modify: `package.json` (automaticamente pelo npm)

- [ ] **Step 1: Instalar a dependência**

```bash
cd '/home/mag/Documents/Java Projects/EngSeg/engseg-web'
npm install jszip
npm install --save-dev @types/jszip
```

Resultado esperado: `jszip` aparece em `dependencies` no `package.json`. Se `@types/jszip` não for encontrado (jszip ≥ 3.x inclui types embutidos), o segundo comando pode dar aviso — ignore.

- [ ] **Step 2: Verificar que o projeto ainda compila**

```bash
cd '/home/mag/Documents/Java Projects/EngSeg/engseg-web'
npx tsc --noEmit 2>&1 | head -20
```

Resultado esperado: sem novos erros (pode já ter warnings pré-existentes).

- [ ] **Step 3: Commit**

```bash
cd '/home/mag/Documents/Java Projects/EngSeg/engseg-web'
git add package.json package-lock.json
git commit -m "chore: add jszip for PDF+attachments bundle export"
```

---

### Task 2: Refatorar exportOcorrencia.ts

**Files:**
- Modify: `src/utils/exportOcorrencia.ts`

> Substituição completa do arquivo. A função `exportOcorrenciaToExcel` permanece idêntica. As mudanças na parte PDF são:
> - Nova função interna `buildPDFDoc` (async, retorna `jsPDF`) — contém toda lógica que estava em `exportOcorrenciaToPDF`
> - Funções helper para conversão de blobs e imagens
> - `renderEvidenciasSection` — renderiza seção de fotos no doc
> - `exportOcorrenciaToPDF` — wrapper mantido para compat. (chama `buildPDFDoc` + `doc.save`)
> - `exportOcorrenciaBundle` — nova função pública que orquestra evidências + PDF ± ZIP

- [ ] **Step 1: Substituir o conteúdo de `src/utils/exportOcorrencia.ts`**

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { formatDate } from './date'
import { downloadEvidencia } from '../api/evidencia'
import type { Evidencia } from '../types'

interface NormaTrecho {
  id: string
  normaId: string
  clausulaReferencia?: string
  textoEditado: string
}

interface ExportOptions {
  ocorrencia: any
  trechos?: NormaTrecho[]
  isDesvio: boolean
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

function getExt(nome: string) {
  const dot = nome.lastIndexOf('.')
  return dot >= 0 ? nome.substring(dot + 1).toLowerCase() : ''
}

function sanitize(name: string) {
  return (name || 'ocorrencia').replace(/[^a-z0-9_\-]+/gi, '_').slice(0, 60)
}

function buildFileName(o: ExportOptions, ext: 'pdf' | 'xlsx' | 'zip') {
  const prefix = o.isDesvio ? 'Desvio' : 'NaoConformidade'
  const titulo = sanitize(o.ocorrencia.titulo || o.ocorrencia.id)
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}_${titulo}_${date}.${ext}`
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}

async function gifToDataUrl(blob: Blob): Promise<string> {
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

async function renderEvidenciasSection(doc: jsPDF, imagens: Evidencia[]): Promise<void> {
  if (imagens.length === 0) return

  const pageW = doc.internal.pageSize.getWidth()
  const marginX = 15
  const usableW = pageW - marginX * 2
  const maxImgH = 110
  const legendH = 6
  const gapH = 10

  doc.addPage()
  let y = 20
  let countOnPage = 0

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('Evidências da Ocorrência', marginX, y)
  y += 10

  for (let i = 0; i < imagens.length; i++) {
    if (countOnPage === 2) {
      doc.addPage()
      y = 20
      countOnPage = 0
    }

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
      doc.rect(marginX, y, usableW, 40, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Arquivo indisponível — ${ev.nomeArquivo}`,
        marginX + usableW / 2,
        y + 22,
        { align: 'center' },
      )
      y += 40
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`${i + 1}. ${ev.nomeArquivo}`, marginX, y + 5)
    y += legendH + gapH
    countOnPage++
  }
}

// ─────────────────────── PDF (interno) ────────────────────────────────────
async function buildPDFDoc(options: ExportOptions, imagens: Evidencia[]): Promise<jsPDF> {
  const { ocorrencia, trechos = [], isDesvio } = options
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const marginX = 15
  let y = 18

  // Header bar
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('SGS — Sistema de Gestão de Segurança', marginX, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(186, 230, 253)
  doc.text(isDesvio ? 'Relatório de Desvio' : 'Relatório de Não Conformidade', marginX, 22)
  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8)
  doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, pageW - marginX, 22, { align: 'right' })

  y = 38

  // Title
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const tituloLines = doc.splitTextToSize(ocorrencia.titulo || '—', pageW - marginX * 2)
  doc.text(tituloLines, marginX, y)
  y += tituloLines.length * 6 + 2

  // Status + tags row
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  const tags: string[] = []
  tags.push(`Status: ${ocorrencia.status || 'CONCLUÍDO'}`)
  if (ocorrencia.regraDeOuro) tags.push('Regra de Ouro')
  if (ocorrencia.reincidencia) tags.push('Reincidência')
  if (!isDesvio && ocorrencia.nivelSeveridade) tags.push(`Severidade: ${ocorrencia.nivelSeveridade}`)
  doc.text(tags.join('  ·  '), marginX, y)
  y += 8

  // Info table
  const rows: [string, string][] = [
    ['Estabelecimento', ocorrencia.estabelecimentoNome || '—'],
    ['Localização', ocorrencia.localizacaoNome || '—'],
    ['Data de Registro', formatDate(ocorrencia.dataRegistro) || '—'],
    ['Registrado por', ocorrencia.usuarioCriacaoNome || ocorrencia.tecnicoNome || '—'],
  ]
  if (!isDesvio) {
    rows.push(['Data Limite', formatDate(ocorrencia.dataLimiteResolucao) || '—'])
    rows.push(['Eng. Responsável pela Tratativa',
      ocorrencia.engConstruturaNome
        ? `${ocorrencia.engConstruturaNome} (${ocorrencia.engConstrutoraEmail ?? ''})`
        : ocorrencia.engConstrutoraEmail || '—'])
    rows.push(['Eng. Responsável pela NC',
      ocorrencia.engVerificacaoNome
        ? `${ocorrencia.engVerificacaoNome} (${ocorrencia.engVerificacaoEmail ?? ''})`
        : ocorrencia.engVerificacaoEmail || '—'])
  }

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [['Campo', 'Valor']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [3, 105, 161], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', textColor: [71, 85, 105] } },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Descrição
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text('Descrição', marginX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  const descLines = doc.splitTextToSize(ocorrencia.descricao || '—', pageW - marginX * 2)
  if (y + descLines.length * 5 > 275) { doc.addPage(); y = 20 }
  doc.text(descLines, marginX, y)
  y += descLines.length * 5 + 6

  // Normas (NC only)
  if (!isDesvio && ocorrencia.normas && ocorrencia.normas.length > 0) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Normas Vinculadas', marginX, y)
    y += 3

    const normaRows: [string, string, string][] = []
    for (const n of ocorrencia.normas) {
      const ts = trechos.filter((t: NormaTrecho) => t.normaId === n.id)
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
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Histórico de Tratativa (NC only)
  if (!isDesvio) {
    const hist: [string, string, string, string][] = []
    ocorrencia.devolutivas?.forEach((d: any, i: number) => {
      hist.push([`Plano de Ação #${i + 1}`, d.descricaoPlanoAcao || '', d.engenheiroNome || '—', formatDate(d.dataDevolutiva)])
    })
    ocorrencia.execucoes?.forEach((e: any, i: number) => {
      hist.push([`Execução #${i + 1}`, e.descricaoAcaoExecutada || '', e.engenheiroNome || '—', formatDate(e.dataExecucao)])
    })
    ocorrencia.validacoes?.forEach((v: any, i: number) => {
      hist.push([
        `Validação #${i + 1} — ${v.parecer === 'APROVADO' ? 'Aprovada' : 'Reprovada'}`,
        v.observacao || '',
        v.engenheiroNome || '—',
        formatDate(v.dataValidacao),
      ])
    })

    if (hist.length > 0) {
      if (y > 240) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text('Histórico da Tratativa', marginX, y)
      autoTable(doc, {
        startY: y + 3,
        margin: { left: marginX, right: marginX },
        head: [['Etapa', 'Detalhes', 'Responsável', 'Data']],
        body: hist,
        theme: 'grid',
        headStyles: { fillColor: [3, 105, 161], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold' }, 2: { cellWidth: 35 }, 3: { cellWidth: 25 } },
      })
    }
  }

  // Seção de evidências (imagens embutidas, após histórico)
  await renderEvidenciasSection(doc, imagens)

  // Footer em todas as páginas
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

// ───────────────────── PDF (público — mantido para compat.) ────────────────
export async function exportOcorrenciaToPDF(options: ExportOptions) {
  const doc = await buildPDFDoc(options, [])
  doc.save(buildFileName(options, 'pdf'))
}

// ─────────────────────── Bundle PDF ± ZIP ─────────────────────────────────
export async function exportOcorrenciaBundle(
  options: ExportOptions,
  evidencias: Evidencia[],
): Promise<void> {
  const imagens = evidencias.filter(e => IMAGE_EXTS.has(getExt(e.nomeArquivo)))
  const outros = evidencias.filter(e => !IMAGE_EXTS.has(getExt(e.nomeArquivo)))

  const doc = await buildPDFDoc(options, imagens)

  if (outros.length === 0) {
    doc.save(buildFileName(options, 'pdf'))
    return
  }

  const pdfBlob = doc.output('blob')
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  zip.file(buildFileName(options, 'pdf'), pdfBlob)

  const folder = zip.folder('anexos')!
  const usedNames = new Set<string>()

  for (const ev of outros) {
    try {
      const blob = await downloadEvidencia(ev.id)
      let name = ev.nomeArquivo
      if (usedNames.has(name)) {
        const dot = name.lastIndexOf('.')
        const base = dot >= 0 ? name.slice(0, dot) : name
        const ext = dot >= 0 ? name.slice(dot) : ''
        let n = 2
        while (usedNames.has(`${base}_${n}${ext}`)) n++
        name = `${base}_${n}${ext}`
      }
      usedNames.add(name)
      folder.file(name, blob)
    } catch {
      console.warn(`[exportOcorrencia] Falha ao baixar anexo ${ev.id} (${ev.nomeArquivo})`)
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = buildFileName(options, 'zip')
  a.click()
  URL.revokeObjectURL(url)
}

// ───────────────────────────── Excel ───────────────────────────────────────
export function exportOcorrenciaToExcel({ ocorrencia, trechos = [], isDesvio }: ExportOptions) {
  const wb = XLSX.utils.book_new()

  // Resumo
  const resumo: (string | number | null)[][] = [
    ['Campo', 'Valor'],
    ['Tipo', isDesvio ? 'Desvio' : 'Não Conformidade'],
    ['Título', ocorrencia.titulo || ''],
    ['Status', ocorrencia.status || 'CONCLUIDO'],
    ['Estabelecimento', ocorrencia.estabelecimentoNome || ''],
    ['Localização', ocorrencia.localizacaoNome || ''],
    ['Data de Registro', formatDate(ocorrencia.dataRegistro) || ''],
    ['Registrado por', ocorrencia.usuarioCriacaoNome || ocorrencia.tecnicoNome || ''],
    ['Descrição', ocorrencia.descricao || ''],
    ['Regra de Ouro', ocorrencia.regraDeOuro ? 'Sim' : 'Não'],
  ]
  if (!isDesvio) {
    resumo.push(['Reincidência', ocorrencia.reincidencia ? 'Sim' : 'Não'])
    resumo.push(['Nível de Severidade', ocorrencia.nivelSeveridade || ''])
    resumo.push(['Data Limite', formatDate(ocorrencia.dataLimiteResolucao) || ''])
    resumo.push(['Eng. Responsável pela Tratativa',
      ocorrencia.engConstruturaNome
        ? `${ocorrencia.engConstruturaNome} (${ocorrencia.engConstrutoraEmail ?? ''})`
        : ocorrencia.engConstrutoraEmail || ''])
    resumo.push(['Eng. Responsável pela NC',
      ocorrencia.engVerificacaoNome
        ? `${ocorrencia.engVerificacaoNome} (${ocorrencia.engVerificacaoEmail ?? ''})`
        : ocorrencia.engVerificacaoEmail || ''])
  }
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo)
  wsResumo['!cols'] = [{ wch: 28 }, { wch: 70 }]
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

  // Normas (NC only)
  if (!isDesvio && ocorrencia.normas && ocorrencia.normas.length > 0) {
    const normas: (string | null)[][] = [['Norma', 'Cláusula', 'Trecho']]
    for (const n of ocorrencia.normas) {
      const ts = trechos.filter((t: NormaTrecho) => t.normaId === n.id)
      if (ts.length === 0) normas.push([n.titulo, '', ''])
      else for (const t of ts) normas.push([n.titulo, t.clausulaReferencia || '', t.textoEditado])
    }
    const wsNormas = XLSX.utils.aoa_to_sheet(normas)
    wsNormas['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 70 }]
    XLSX.utils.book_append_sheet(wb, wsNormas, 'Normas')
  }

  // Histórico (NC only)
  if (!isDesvio) {
    const hist: (string | null)[][] = [['Etapa', 'Detalhes', 'Responsável', 'Data']]
    ocorrencia.devolutivas?.forEach((d: any, i: number) =>
      hist.push([`Plano de Ação #${i + 1}`, d.descricaoPlanoAcao || '', d.engenheiroNome || '', formatDate(d.dataDevolutiva)]))
    ocorrencia.execucoes?.forEach((e: any, i: number) =>
      hist.push([`Execução #${i + 1}`, e.descricaoAcaoExecutada || '', e.engenheiroNome || '', formatDate(e.dataExecucao)]))
    ocorrencia.validacoes?.forEach((v: any, i: number) =>
      hist.push([
        `Validação #${i + 1} — ${v.parecer === 'APROVADO' ? 'Aprovada' : 'Reprovada'}`,
        v.observacao || '',
        v.engenheiroNome || '',
        formatDate(v.dataValidacao),
      ]))
    if (hist.length > 1) {
      const wsHist = XLSX.utils.aoa_to_sheet(hist)
      wsHist['!cols'] = [{ wch: 28 }, { wch: 60 }, { wch: 30 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, wsHist, 'Tratativa')
    }
  }

  XLSX.writeFile(wb, buildFileName({ ocorrencia, trechos, isDesvio }, 'xlsx'))
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd '/home/mag/Documents/Java Projects/EngSeg/engseg-web'
npx tsc --noEmit 2>&1 | head -30
```

Resultado esperado: sem erros em `src/utils/exportOcorrencia.ts`. Outros erros pré-existentes podem aparecer — ignore-os.

- [ ] **Step 3: Commit**

```bash
cd '/home/mag/Documents/Java Projects/EngSeg/engseg-web'
git add src/utils/exportOcorrencia.ts
git commit -m "feat: extend PDF export with embedded photos and ZIP for other attachments"
```

---

### Task 3: Atualizar OcorrenciaDetailPage.tsx

**Files:**
- Modify: `src/pages/OcorrenciaDetailPage.tsx`

- [ ] **Step 1: Atualizar imports**

Linha 21 atual:
```typescript
import { exportOcorrenciaToPDF, exportOcorrenciaToExcel } from '../utils/exportOcorrencia'
```

Substituir por:
```typescript
import { exportOcorrenciaBundle, exportOcorrenciaToExcel } from '../utils/exportOcorrencia'
import { getEvidencias, getEvidenciasDesvio } from '../api/evidencia'
```

- [ ] **Step 2: Adicionar estado `exporting`**

Após a linha do `const [exportMenuOpen, setExportMenuOpen] = useState(false)` (linha 51), adicionar:
```typescript
const [exporting, setExporting] = useState(false)
```

- [ ] **Step 3: Adicionar função handler `handleExportPDF`**

Logo abaixo da função `set` (após linha ~177 onde está `function set(field, value)`), adicionar:

```typescript
async function handleExportPDF() {
  if (!ocorrencia || !id) return
  setExporting(true)
  setExportMenuOpen(false)
  try {
    const evidencias = isDesvio
      ? await getEvidenciasDesvio(id, 'OCORRENCIA')
      : await getEvidencias(id, 'OCORRENCIA')
    await exportOcorrenciaBundle({ ocorrencia, trechos, isDesvio }, evidencias)
  } catch (err) {
    console.error('[exportPDF]', err)
    alert('Erro ao exportar o relatório. Tente novamente.')
  } finally {
    setExporting(false)
  }
}
```

- [ ] **Step 4: Atualizar o botão "Exportar PDF" no dropdown**

Localizar o bloco do botão (linhas ~226-232):
```tsx
<button
  onMouseDown={e => e.preventDefault()}
  onClick={() => {
    exportOcorrenciaToPDF({ ocorrencia, trechos, isDesvio })
    setExportMenuOpen(false)
  }}
  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition text-left"
>
  <FileDown size={15} className="text-red-500" /> Exportar PDF
</button>
```

Substituir por:
```tsx
<button
  onMouseDown={e => e.preventDefault()}
  onClick={handleExportPDF}
  disabled={exporting}
  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 transition text-left disabled:opacity-60"
>
  <FileDown size={15} className="text-red-500" />
  {exporting ? 'Exportando...' : 'Exportar PDF'}
</button>
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd '/home/mag/Documents/Java Projects/EngSeg/engseg-web'
npx tsc --noEmit 2>&1 | head -30
```

Resultado esperado: sem novos erros em `OcorrenciaDetailPage.tsx`.

- [ ] **Step 6: Commit**

```bash
cd '/home/mag/Documents/Java Projects/EngSeg/engseg-web'
git add src/pages/OcorrenciaDetailPage.tsx
git commit -m "feat: fetch evidencias and call exportOcorrenciaBundle on PDF export"
```

---

## Checklist de validação manual

Após completar as tasks, testar no navegador com o dev server (`npm run dev`):

- [ ] NC concluída **sem evidências** → baixa só o PDF, sem seção "Evidências"
- [ ] NC concluída com **fotos (JPG/PNG)** → baixa só o PDF com seção "Evidências" (2 por página)
- [ ] NC concluída com **1 foto + 1 PDF** → baixa ZIP com `NaoConformidade_*.pdf` + `anexos/*.pdf`
- [ ] Desvio concluído com **só 1 .xlsx** → baixa ZIP com PDF + `anexos/planilha.xlsx`
- [ ] Foto panorâmica e retrato → aspect-ratio preservado, sem distorção
- [ ] Dois anexos com mesmo nome → `nome.pdf` e `nome_2.pdf` no ZIP
- [ ] Durante exportação → botão mostra "Exportando..." e fica desabilitado
- [ ] Erro de rede → alert de erro, botão volta ao normal
- [ ] **Export Excel continua funcionando** sem alteração
- [ ] **Desvio e NC não-concluídas** não têm botão de exportar (comportamento preservado)
