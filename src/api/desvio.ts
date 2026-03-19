import client from './client'
import { Desvio, DesvioRequest } from '../types'

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

export const resolverDesvio = async (id: string): Promise<Desvio> => {
  const res = await client.put<Desvio>(`/desvios/${id}/resolver`)
  return res.data
}
