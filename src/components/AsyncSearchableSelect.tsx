import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Loader2 } from 'lucide-react'

interface Option {
  id: string
  label: string
}

interface Props<T extends Option> {
  value: string
  onChange: (id: string) => void
  fetchOptions: (query: string) => Promise<T[]>
  selectedLabel?: string
  placeholder?: string
  className?: string
  style?: CSSProperties
  emptyLabel?: string
  debounceMs?: number
  /** Renderização customizada de cada opção. Se omitido, usa `option.label` puro. */
  renderOption?: (option: T) => ReactNode
}

export default function AsyncSearchableSelect<T extends Option = Option>({
  value,
  onChange,
  fetchOptions,
  selectedLabel,
  placeholder = 'Buscar...',
  className = '',
  style,
  emptyLabel = '— Nenhum —',
  debounceMs = 300,
  renderOption,
}: Props<T>) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const requestId = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const id = ++requestId.current
    setLoading(true)
    const timer = setTimeout(() => {
      fetchOptions(search)
        .then(results => { if (id === requestId.current) { setOptions(results); setHighlighted(0) } })
        .finally(() => { if (id === requestId.current) setLoading(false) })
    }, debounceMs)
    return () => clearTimeout(timer)
  }, [open, search, fetchOptions, debounceMs])

  useEffect(() => {
    if (!open) return
    function updateCoords() {
      const rect = inputRef.current?.getBoundingClientRect()
      if (rect) setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width })
    }
    updateCoords()
    window.addEventListener('scroll', updateCoords, true)
    window.addEventListener('resize', updateCoords)
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [open])

  function selectOption(id: string) {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = options[highlighted]
      if (opt) selectOption(opt.id)
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="nc-async-select">
      <span className="nc-async-select-icon">
        <Search size={15} />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={open ? search : (selectedLabel ?? '')}
        onFocus={() => { setOpen(true); setSearch('') }}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={open ? 'Digite para buscar...' : placeholder}
        className={`nc-async-select-input ${className}`}
        style={style}
        autoComplete="off"
      />
      {value && !open && (
        <button
          type="button"
          className="nc-async-select-clear"
          onMouseDown={e => { e.preventDefault(); selectOption('') }}
          aria-label="Limpar seleção"
        >
          <X size={14} />
        </button>
      )}
      {open && coords && createPortal(
        <div
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
          className="nc-async-dropdown"
        >
          <div
            onMouseDown={() => selectOption('')}
            className="nc-async-option nc-async-option-empty"
          >
            {emptyLabel}
          </div>

          {loading && (
            <div className="nc-async-status">
              <Loader2 size={14} className="nc-async-spinner" />
              Buscando...
            </div>
          )}

          {!loading && options.map((o, idx) => (
            <div
              key={o.id}
              onMouseDown={() => selectOption(o.id)}
              onMouseEnter={() => setHighlighted(idx)}
              className={[
                'nc-async-option',
                o.id === value ? 'nc-async-option-selected' : '',
                idx === highlighted ? 'nc-async-option-highlighted' : '',
              ].filter(Boolean).join(' ')}
            >
              {renderOption ? renderOption(o) : <span className="nc-async-option-label">{o.label}</span>}
            </div>
          ))}

          {!loading && options.length === 0 && (
            <div className="nc-async-status nc-async-status-empty">Nenhum resultado encontrado</div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
