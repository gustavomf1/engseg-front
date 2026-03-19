import { StatusNaoConformidade, StatusDesvio } from '../types'

const ncColors: Record<StatusNaoConformidade, string> = {
  ABERTA: 'bg-yellow-100 text-yellow-800',
  EM_TRATAMENTO: 'bg-blue-100 text-blue-800',
  CONCLUIDA: 'bg-green-100 text-green-800',
  NAO_RESOLVIDA: 'bg-red-100 text-red-800',
}

const ncLabels: Record<StatusNaoConformidade, string> = {
  ABERTA: 'Aberta',
  EM_TRATAMENTO: 'Em Tratamento',
  CONCLUIDA: 'Concluída',
  NAO_RESOLVIDA: 'Não Resolvida',
}

const desvioColors: Record<StatusDesvio, string> = {
  REGISTRADO: 'bg-yellow-100 text-yellow-800',
  RESOLVIDO: 'bg-green-100 text-green-800',
}

const desvioLabels: Record<StatusDesvio, string> = {
  REGISTRADO: 'Registrado',
  RESOLVIDO: 'Resolvido',
}

interface NcProps {
  status: StatusNaoConformidade
  type: 'nc'
}

interface DesvioProps {
  status: StatusDesvio
  type: 'desvio'
}

type Props = NcProps | DesvioProps

export default function StatusBadge(props: Props) {
  if (props.type === 'nc') {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ncColors[props.status]}`}>
        {ncLabels[props.status]}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${desvioColors[props.status]}`}>
      {desvioLabels[props.status]}
    </span>
  )
}
