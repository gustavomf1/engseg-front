export type TipoRelatorio = 'ncs' | 'desvios' | 'ncs-vencidas' | 'resumo-empresa'

export interface RelatorioFiltro {
  dataInicio?: string
  dataFim?: string
  estabelecimentoId?: string
  empresaContratadaId?: string
  status?: string
  diasParaVencer?: number
}

export const TIPOS_RELATORIO: { value: TipoRelatorio; label: string }[] = [
  { value: 'ncs',            label: 'NCs por Período' },
  { value: 'desvios',        label: 'Desvios por Período' },
  { value: 'ncs-vencidas',   label: 'NCs Vencidas / A Vencer' },
  { value: 'resumo-empresa', label: 'Resumo por Empresa Contratada' },
]

export const STATUS_NC_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'EM_TRATAMENTO', label: 'Em Tratamento' },
  { value: 'AGUARDANDO_TRATATIVA', label: 'Aguardando Tratativa' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'NAO_RESOLVIDA', label: 'Não Resolvida' },
]

export const STATUS_DESVIO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'AGUARDANDO_TRATATIVA', label: 'Aguardando Tratativa' },
  { value: 'CONCLUIDO', label: 'Concluído' },
]
