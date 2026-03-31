import { useState } from 'react'
import { X, PenLine } from 'lucide-react'

interface Props {
  normaId: string
  normaTitulo: string
  onSalvar: (trecho: { normaId: string; normaTitulo: string; clausulaReferencia: string; textoEditado: string }) => void
  onClose: () => void
}

export default function TrechoManualModal({ normaId, normaTitulo, onSalvar, onClose }: Props) {
  const [clausula, setClausula] = useState('')
  const [texto, setTexto] = useState('')

  function handleSalvar() {
    if (!texto.trim()) return
    onSalvar({ normaId, normaTitulo, clausulaReferencia: clausula.trim(), textoEditado: texto.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <PenLine size={16} className="text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Escrever trecho manual</p>
              <p className="text-xs text-slate-400">{normaTitulo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Cláusula / Item <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              value={clausula}
              onChange={e => setClausula(e.target.value)}
              placeholder="Ex: 12.38, item 4.2..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Texto do trecho <span className="text-red-500">*</span>
            </label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Cole ou escreva o trecho da norma aqui..."
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1">{texto.length} caracteres</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={!texto.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Adicionar trecho
          </button>
        </div>
      </div>
    </div>
  )
}
