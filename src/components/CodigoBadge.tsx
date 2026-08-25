import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  codigo: string
  size?: 'sm' | 'md'
}

export default function CodigoBadge({ codigo, size = 'md' }: Props) {
  const [copiado, setCopiado] = useState(false)

  function handleCopiar(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-2.5 py-1 gap-1.5'

  return (
    <button
      onClick={handleCopiar}
      title="Copiar número"
      className={`inline-flex items-center font-mono font-bold rounded-lg border flex-shrink-0 transition ${sizeClasses} ${
        copiado
          ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-500/20'
      }`}
    >
      {codigo}
      {copiado ? <Check size={size === 'sm' ? 11 : 13} /> : <Copy size={size === 'sm' ? 11 : 13} />}
    </button>
  )
}
