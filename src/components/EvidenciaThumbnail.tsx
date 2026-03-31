import { useEffect, useState } from 'react'
import { FileText, Download, X, ZoomIn } from 'lucide-react'
import client from '../api/client'

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])

function getExt(nome: string) {
  const dot = nome.lastIndexOf('.')
  return dot >= 0 ? nome.substring(dot + 1).toLowerCase() : ''
}

function useEvidenciaBlob(evidenciaId: string, enabled: boolean) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    let url: string
    client
      .get(`/evidencias/${evidenciaId}/download`, { responseType: 'blob' })
      .then(r => { url = URL.createObjectURL(r.data); setBlobUrl(url) })
      .catch(() => setBlobUrl(null))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [evidenciaId, enabled])
  return blobUrl
}

function handleDownload(evidenciaId: string, nomeArquivo: string) {
  client
    .get(`/evidencias/${evidenciaId}/download`, { responseType: 'blob' })
    .then(r => {
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeArquivo
      a.click()
      URL.revokeObjectURL(url)
    })
}

interface ModalProps {
  evidenciaId: string
  nomeArquivo: string
  isImage: boolean
  onClose: () => void
}

function EvidenciaModal({ evidenciaId, nomeArquivo, isImage, onClose }: ModalProps) {
  const blobUrl = useEvidenciaBlob(evidenciaId, isImage)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-slate-700 truncate max-w-xs">{nomeArquivo}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(evidenciaId, nomeArquivo)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
            >
              <Download size={13} /> Baixar
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
              <X size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex items-center justify-center min-h-48 bg-gray-50">
          {isImage ? (
            blobUrl ? (
              <img src={blobUrl} alt={nomeArquivo} className="max-h-[70vh] max-w-full object-contain rounded" />
            ) : (
              <div className="w-64 h-48 bg-gray-200 animate-pulse rounded" />
            )
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-slate-500">
              <FileText size={56} className="text-red-400" />
              <p className="text-sm">{nomeArquivo}</p>
              <button
                onClick={() => handleDownload(evidenciaId, nomeArquivo)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700 transition"
              >
                <Download size={15} /> Baixar arquivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface Props {
  evidenciaId: string
  nomeArquivo: string
}

export default function EvidenciaThumbnail({ evidenciaId, nomeArquivo }: Props) {
  const ext = getExt(nomeArquivo)
  const isImage = IMAGE_EXTENSIONS.has(ext)
  const [modalOpen, setModalOpen] = useState(false)
  const blobUrl = useEvidenciaBlob(evidenciaId, isImage)

  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setModalOpen(true) }}
        className="relative w-full h-full group"
        title="Visualizar"
      >
        {isImage ? (
          blobUrl ? (
            <>
              <img src={blobUrl} alt={nomeArquivo} className="w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition rounded-lg flex items-center justify-center">
                <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse" />
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 w-full h-full text-red-400 group-hover:text-red-500 transition">
            <FileText size={28} />
            <span className="text-[10px] text-gray-400 group-hover:text-gray-500">Ver arquivo</span>
          </div>
        )}
      </button>

      {modalOpen && (
        <EvidenciaModal
          evidenciaId={evidenciaId}
          nomeArquivo={nomeArquivo}
          isImage={isImage}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
