import { NivelSeveridade } from '../types'

const colors: Record<NivelSeveridade, string> = {
  BAIXO: 'bg-gray-100 text-gray-700',
  MEDIO: 'bg-yellow-100 text-yellow-800',
  ALTO: 'bg-orange-100 text-orange-800',
  CRITICO: 'bg-red-100 text-red-800',
}

const labels: Record<NivelSeveridade, string> = {
  BAIXO: 'Baixo',
  MEDIO: 'Médio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
}

interface Props {
  nivel: NivelSeveridade
}

export default function SeveridadeBadge({ nivel }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[nivel]}`}>
      {labels[nivel]}
    </span>
  )
}
