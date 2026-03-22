import client from './client'
import { Evidencia, TipoEvidencia } from '../types'

export const uploadEvidencia = async (ncId: string, file: File, tipo: TipoEvidencia = 'OCORRENCIA'): Promise<Evidencia> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post<Evidencia>(`/evidencias/nao-conformidade/${ncId}?tipo=${tipo}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const getEvidencias = async (ncId: string, tipo?: TipoEvidencia): Promise<Evidencia[]> => {
  const params = tipo ? { tipo } : {}
  const res = await client.get<Evidencia[]>(`/evidencias/nao-conformidade/${ncId}`, { params })
  return res.data
}

export const downloadEvidencia = async (id: string): Promise<Blob> => {
  const res = await client.get(`/evidencias/${id}/download`, {
    responseType: 'blob',
  })
  return res.data
}

export const deleteEvidencia = async (id: string): Promise<void> => {
  await client.delete(`/evidencias/${id}`)
}
