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
  nivelSeveridade?: string
  estabelecimentoNome: string
  engResponsavelConstrutoraId?: string
  engResponsavelVerificacaoId?: string
  vencida?: boolean
  primeiraEvidenciaId?: string
  primeiraEvidenciaNome?: string
}

export const getOcorrencias = () =>
  client.get<OcorrenciaItem[]>('/ocorrencias').then(r => r.data)

export const getRecentesOcorrencias = () =>
  client.get<OcorrenciaItem[]>('/dashboard/recentes').then(r => r.data)

export const deleteNaoConformidade = (id: string) =>
  client.delete(`/nao-conformidades/${id}`)

export const deleteDesvio = (id: string) =>
  client.delete(`/desvios/${id}`)
