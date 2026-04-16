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
  usuarioCriacaoEmail?: string
  vencida?: boolean
  primeiraEvidenciaId?: string
  primeiraEvidenciaNome?: string
  quantidadeAtividades?: number
  quantidadeHistorico?: number
}

export const getOcorrencias = (estabelecimentoId?: string, params?: { empresaId?: string; estabelecimentoId?: string }) => {
  const queryParams: Record<string, string> = {}
  if (estabelecimentoId) queryParams.estabelecimentoId = estabelecimentoId
  if (params?.empresaId) queryParams.empresaId = params.empresaId
  if (params?.estabelecimentoId) queryParams.estabelecimentoId = params.estabelecimentoId
  return client.get<OcorrenciaItem[]>('/ocorrencias', { params: queryParams }).then(r => r.data)
}

export const getRecentesOcorrencias = () =>
  client.get<OcorrenciaItem[]>('/dashboard/recentes').then(r => r.data)

export const deleteNaoConformidade = (id: string) =>
  client.delete(`/nao-conformidades/${id}`)

export const deleteDesvio = (id: string) =>
  client.delete(`/desvios/${id}`)
