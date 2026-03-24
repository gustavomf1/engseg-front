import client from './client'
import { Norma, NormaRequest } from '../types'

export const getNormas = async (): Promise<Norma[]> => {
  const res = await client.get<Norma[]>('/normas')
  return res.data
}

export const getNorma = async (id: string): Promise<Norma> => {
  const res = await client.get<Norma>(`/normas/${id}`)
  return res.data
}

export const createNorma = async (data: NormaRequest): Promise<Norma> => {
  const res = await client.post<Norma>('/normas', data)
  return res.data
}

export const updateNorma = async (id: string, data: NormaRequest): Promise<Norma> => {
  const res = await client.put<Norma>(`/normas/${id}`, data)
  return res.data
}

export const deleteNorma = async (id: string): Promise<void> => {
  await client.delete(`/normas/${id}`)
}
