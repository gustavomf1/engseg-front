import client from './client'
import { Localizacao, LocalizacaoRequest } from '../types'

export const getLocalizacoes = async (estabelecimentoId?: string, ativo?: boolean): Promise<Localizacao[]> => {
  const params: Record<string, string | boolean> = {}
  if (estabelecimentoId) params.estabelecimentoId = estabelecimentoId
  if (ativo !== undefined) params.ativo = ativo
  const res = await client.get<Localizacao[]>('/localizacoes', { params })
  return res.data
}

export const getLocalizacao = async (id: string): Promise<Localizacao> => {
  const res = await client.get<Localizacao>(`/localizacoes/${id}`)
  return res.data
}

export const createLocalizacao = async (data: LocalizacaoRequest): Promise<Localizacao> => {
  const res = await client.post<Localizacao>('/localizacoes', data)
  return res.data
}

export const updateLocalizacao = async (id: string, data: LocalizacaoRequest): Promise<Localizacao> => {
  const res = await client.put<Localizacao>(`/localizacoes/${id}`, data)
  return res.data
}

export const deleteLocalizacao = async (id: string): Promise<void> => {
  await client.delete(`/localizacoes/${id}`)
}

export const reativarLocalizacao = async (id: string): Promise<Localizacao> => {
  const res = await client.put<Localizacao>(`/localizacoes/${id}/reativar`)
  return res.data
}
