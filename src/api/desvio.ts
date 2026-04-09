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

export const updateDesvio = async (id: string, data: DesvioRequest): Promise<Desvio> => {
  const res = await client.put<Desvio>(`/desvios/${id}`, data)
  return res.data
}

export const deleteDesvio = async (id: string): Promise<void> => {
  await client.delete(`/desvios/${id}`)
}

