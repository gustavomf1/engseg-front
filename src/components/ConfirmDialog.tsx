import { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  message?: string
  detail?: ReactNode
  warning?: ReactNode
  confirmLabel?: string
  isLoading?: boolean
  isError?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description = 'Esta ação não pode ser desfeita',
  message,
  detail,
  warning,
  confirmLabel = 'Confirmar',
  isLoading = false,
  isError = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>

        {message && (
          <p className="text-sm text-slate-600 mb-4">{message}</p>
        )}

        {detail && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            {detail}
          </div>
        )}

        {warning && (
          <div className="mb-4">{warning}</div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm">
            Erro ao excluir. Verifique suas permissões e tente novamente.
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition"
          >
            {isLoading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
