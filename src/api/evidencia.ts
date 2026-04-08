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

export const uploadEvidenciaDesvio = async (desvioId: string, file: File, tipo: TipoEvidencia = 'OCORRENCIA'): Promise<Evidencia> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post<Evidencia>(`/evidencias/desvio/${desvioId}?tipo=${tipo}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const getEvidenciasDesvio = async (desvioId: string, tipo?: TipoEvidencia): Promise<Evidencia[]> => {
  const params = tipo ? { tipo } : {}
  const res = await client.get<Evidencia[]>(`/evidencias/desvio/${desvioId}`, { params })
  return res.data
}

export const uploadEvidenciaAtividade = async (atividadeId: string, file: File): Promise<Evidencia> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post<Evidencia>(`/evidencias/atividade/${atividadeId}?tipo=TRATATIVA`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const getEvidenciasAtividade = async (atividadeId: string): Promise<Evidencia[]> => {
  const res = await client.get<Evidencia[]>(`/evidencias/atividade/${atividadeId}`)
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
