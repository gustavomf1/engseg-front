import client from './client'
import { Estabelecimento, EstabelecimentoRequest } from '../types'

export const getEstabelecimentos = async (): Promise<Estabelecimento[]> => {
  const res = await client.get<Estabelecimento[]>('/estabelecimentos')
  return res.data
}

export const getEstabelecimento = async (id: string): Promise<Estabelecimento> => {
  const res = await client.get<Estabelecimento>(`/estabelecimentos/${id}`)
  return res.data
}

export const createEstabelecimento = async (data: EstabelecimentoRequest): Promise<Estabelecimento> => {
  const res = await client.post<Estabelecimento>('/estabelecimentos', data)
  return res.data
}

export const updateEstabelecimento = async (id: string, data: EstabelecimentoRequest): Promise<Estabelecimento> => {
  const res = await client.put<Estabelecimento>(`/estabelecimentos/${id}`, data)
  return res.data
}

export const deleteEstabelecimento = async (id: string): Promise<void> => {
  await client.delete(`/estabelecimentos/${id}`)
}
