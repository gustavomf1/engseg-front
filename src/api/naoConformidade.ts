import client from './client'
import {
  NaoConformidade,
  NaoConformidadeRequest,
  InvestigacaoRequest,
  AprovarRejeitarRequest,
  SubmeterEvidenciasRequest,
  HistoricoNcResponse,
  StatusNaoConformidade,
} from '../types'

export const getNaoConformidades = async (params?: {
  status?: StatusNaoConformidade
  estabelecimentoId?: string
}): Promise<NaoConformidade[]> => {
  const res = await client.get<NaoConformidade[]>('/nao-conformidades', { params })
  return res.data
}

export const getNaoConformidade = async (id: string): Promise<NaoConformidade> => {
  const res = await client.get<NaoConformidade>(`/nao-conformidades/${id}`)
  return res.data
}

export const createNaoConformidade = async (data: NaoConformidadeRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>('/nao-conformidades', data)
  return res.data
}

export const updateNaoConformidade = async (id: string, data: NaoConformidadeRequest): Promise<NaoConformidade> => {
  const res = await client.put<NaoConformidade>(`/nao-conformidades/${id}`, data)
  return res.data
}

export const deleteNaoConformidade = async (id: string): Promise<void> => {
  await client.delete(`/nao-conformidades/${id}`)
}

// Novo fluxo
export const submeterInvestigacao = async (id: string, data: InvestigacaoRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/investigacao`, data)
  return res.data
}

export const aprovarPlano = async (id: string, data?: AprovarRejeitarRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/aprovar-plano`, data ?? {})
  return res.data
}

export const rejeitarPlano = async (id: string, data: AprovarRejeitarRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/rejeitar-plano`, data)
  return res.data
}

export const submeterEvidencias = async (id: string, data: SubmeterEvidenciasRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/submeter-evidencias`, data)
  return res.data
}

export const aprovarEvidencias = async (id: string, data?: AprovarRejeitarRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/aprovar-evidencias`, data ?? {})
  return res.data
}

export const rejeitarEvidencias = async (id: string, data: AprovarRejeitarRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/rejeitar-evidencias`, data)
  return res.data
}

export const getHistorico = async (id: string): Promise<HistoricoNcResponse[]> => {
  const res = await client.get<HistoricoNcResponse[]>(`/nao-conformidades/${id}/historico`)
  return res.data
}
