import client from './client'
import { NcTrechoNorma } from '../types'

export const getTrechosNorma = async (ncId: string): Promise<NcTrechoNorma[]> => {
  const res = await client.get<NcTrechoNorma[]>(`/nao-conformidades/${ncId}/trechos-norma`)
  return res.data
}

export const vincularTrechoNorma = async (
  ncId: string,
  data: { normaId: string; clausulaReferencia?: string; textoEditado: string }
): Promise<NcTrechoNorma> => {
  const res = await client.post<NcTrechoNorma>(`/nao-conformidades/${ncId}/trechos-norma`, data)
  return res.data
}

export const deletarTrechoNorma = async (ncId: string, id: string): Promise<void> => {
  await client.delete(`/nao-conformidades/${ncId}/trechos-norma/${id}`)
}
