import { StatusNaoConformidade, StatusDesvio } from '../types'

const ncColors: Record<StatusNaoConformidade, string> = {
  ABERTA: 'bg-yellow-100 text-yellow-800',
  AGUARDANDO_APROVACAO_PLANO: 'bg-blue-100 text-blue-800',
  EM_AJUSTE_PELO_EXTERNO: 'bg-orange-100 text-orange-800',
  EM_EXECUCAO: 'bg-purple-100 text-purple-800',
  AGUARDANDO_VALIDACAO_FINAL: 'bg-indigo-100 text-indigo-800',
  CONCLUIDO: 'bg-green-100 text-green-800',
  EM_TRATAMENTO: 'bg-blue-100 text-blue-800',
  NAO_RESOLVIDA: 'bg-red-100 text-red-800',
}

const ncLabels: Record<StatusNaoConformidade, string> = {
  ABERTA: 'Aberta',
  AGUARDANDO_APROVACAO_PLANO: 'Aguard. Aprovação',
  EM_AJUSTE_PELO_EXTERNO: 'Em Ajuste',
  EM_EXECUCAO: 'Em Execução',
  AGUARDANDO_VALIDACAO_FINAL: 'Aguard. Validação',
  CONCLUIDO: 'Concluído',
  EM_TRATAMENTO: 'Em Tratamento',
  NAO_RESOLVIDA: 'Não Resolvida',
}

const desvioColors: Record<StatusDesvio, string> = {
  CONCLUIDO: 'bg-green-100 text-green-800',
}

const desvioLabels: Record<StatusDesvio, string> = {
  CONCLUIDO: 'Concluído',
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
