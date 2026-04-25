import { NivelRisco } from '../types'

const colors: Record<NivelRisco, string> = {
  BAIXO:    'bg-green-100 text-green-700',
  MODERADO: 'bg-yellow-100 text-yellow-800',
  ALTO:     'bg-orange-100 text-orange-800',
  CRITICO:  'bg-red-100 text-red-800',
}

const labels: Record<NivelRisco, string> = {
  BAIXO:    'Baixo',
  MODERADO: 'Moderado',
  ALTO:     'Alto',
  CRITICO:  'Crítico',
}

interface Props {
  nivel: NivelRisco
}

export default function RiscoBadge({ nivel }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[nivel]}`}>
      {labels[nivel]}
    </span>
  )
}
