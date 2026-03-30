import client from './client'
import { Norma, NormaRequest } from '../types'

export const getNormas = async (ativo?: boolean): Promise<Norma[]> => {
  const params = ativo !== undefined ? { ativo } : {}
  const res = await client.get<Norma[]>('/normas', { params })
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

export const salvarConteudoNorma = async (id: string, conteudo: string): Promise<Norma> => {
  const res = await client.put<Norma>(`/normas/${id}/conteudo`, { conteudo })
  return res.data
}

export const buscarTrechoNorma = async (id: string, prompt: string): Promise<{ trecho: string; clausulaReferencia?: string }> => {
  const res = await client.post(`/normas/${id}/buscar-trecho`, { prompt })
  return res.data
}

export const deleteNorma = async (id: string): Promise<void> => {
  await client.delete(`/normas/${id}`)
}
