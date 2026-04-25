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
  responsavelTratativaId?: string
  responsavelDesvioId?: string
  vencida?: boolean
  primeiraEvidenciaId?: string
  primeiraEvidenciaNome?: string
  quantidadeAtividades?: number
  quantidadeHistorico?: number
}

export const getOcorrencias = async (params?: {
  estabelecimentoId?: string
  empresaId?: string
}): Promise<OcorrenciaItem[]> => {
  const response = await client.get<OcorrenciaItem[]>('/ocorrencias', { params })
  return response.data
}

export const getRecentesOcorrencias = () =>
  client.get<OcorrenciaItem[]>('/dashboard/recentes').then(r => r.data)

export const deleteNaoConformidade = (id: string) =>
  client.delete(`/nao-conformidades/${id}`)

export const deleteDesvio = (id: string) =>
  client.delete(`/desvios/${id}`)
