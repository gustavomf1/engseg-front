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
