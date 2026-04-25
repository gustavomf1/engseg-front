import client from './client'
import {
  Desvio,
  DesvioRequest,
  AdicionarTrativaRequest,
  ReprovarTrativasDesvioRequest,
  AprovarDesvioRequest,
} from '../types'

export const getDesvios = async (): Promise<Desvio[]> => {
  const res = await client.get<Desvio[]>('/desvios')
  return res.data
}

export const getDesvio = async (id: string): Promise<Desvio> => {
  const res = await client.get<Desvio>(`/desvios/${id}`)
  return res.data
}

export const createDesvio = async (data: DesvioRequest): Promise<Desvio> => {
  const res = await client.post<Desvio>('/desvios', data)
  return res.data
}

export const updateDesvio = async (id: string, data: DesvioRequest): Promise<Desvio> => {
  const res = await client.put<Desvio>(`/desvios/${id}`, data)
  return res.data
}

export const deleteDesvio = async (id: string): Promise<void> => {
  await client.delete(`/desvios/${id}`)
}

export const adicionarTratativaDesvio = async (
  desvioId: string,
  data: AdicionarTrativaRequest
): Promise<Desvio> => {
  const res = await client.post<Desvio>(`/desvios/${desvioId}/tratativas`, data)
  return res.data
}

export const removerTratativaDesvio = async (
  desvioId: string,
  trativaId: string
): Promise<void> => {
  await client.delete(`/desvios/${desvioId}/tratativas/${trativaId}`)
}

export const submeterTrativaDesvio = async (desvioId: string): Promise<Desvio> => {
  const res = await client.post<Desvio>(`/desvios/${desvioId}/submeter-tratativa`)
  return res.data
}

export const aprovarDesvio = async (
  id: string,
  data: AprovarDesvioRequest
): Promise<Desvio> => {
  const res = await client.post<Desvio>(`/desvios/${id}/aprovar`, data)
  return res.data
}

export const reprovarDesvio = async (
  id: string,
  data: ReprovarTrativasDesvioRequest
): Promise<Desvio> => {
  const res = await client.post<Desvio>(`/desvios/${id}/reprovar`, data)
  return res.data
}
