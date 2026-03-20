import client from './client'
import { Localizacao, LocalizacaoRequest } from '../types'

export const getLocalizacoes = async (estabelecimentoId?: string): Promise<Localizacao[]> => {
  const params = estabelecimentoId ? { estabelecimentoId } : {}
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
