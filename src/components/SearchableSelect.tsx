import { useState } from 'react'

interface Option {
  id: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  className?: string
  emptyLabel?: string
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Buscar...', className = '', emptyLabel = '— Nenhum —' }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selectedLabel = options.find(o => o.id === value)?.label ?? ''
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? search : selectedLabel}
        onFocus={() => { setOpen(true); setSearch('') }}
        onChange={e => setSearch(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={open ? 'Buscar pelo nome...' : placeholder}
        className={className}
        autoComplete="off"
      />
      {open && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">
          <div
            onMouseDown={() => { onChange(''); setOpen(false) }}
            className="px-3 py-2 text-sm text-slate-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
          >
            {emptyLabel}
          </div>
          {filtered.map(o => (
            <div
              key={o.id}
              onMouseDown={() => { onChange(o.id); setOpen(false); setSearch('') }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${o.id === value ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700'}`}
            >
              {o.label}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400 italic">Nenhum resultado</div>
          )}
        </div>
      )}
    </div>
  )
}
