import client from './client'

export interface OcorrenciaItem {
  tipo: 'DESVIO' | 'NAO_CONFORMIDADE'
  id: string
  titulo: string
  localizacao: string
  descricao: string
  dataRegistro: string
  regraDeOuro: boolean
  status: string
  dataLimiteResolucao?: string
  nrRelacionada?: string
  nivelSeveridade?: string
  estabelecimentoNome: string
}

export const getOcorrencias = () =>
  client.get<OcorrenciaItem[]>('/ocorrencias').then(r => r.data)

export const getRecentesOcorrencias = () =>
  client.get<OcorrenciaItem[]>('/dashboard/recentes').then(r => r.data)
