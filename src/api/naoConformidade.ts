import client from './client'
import {
  NaoConformidade,
  NaoConformidadeRequest,
  DevolutivaRequest,
  ExecucaoAcaoRequest,
  ValidacaoRequest,
  StatusNaoConformidade
} from '../types'

export const getNaoConformidades = async (params?: {
  status?: StatusNaoConformidade
  estabelecimentoId?: string
}): Promise<NaoConformidade[]> => {
  const res = await client.get<NaoConformidade[]>('/nao-conformidades', { params })
  return res.data
}

export const getNaoConformidade = async (id: string): Promise<NaoConformidade> => {
  const res = await client.get<NaoConformidade>(`/nao-conformidades/${id}`)
  return res.data
}

export const createNaoConformidade = async (data: NaoConformidadeRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>('/nao-conformidades', data)
  return res.data
}

export const registrarDevolutiva = async (id: string, data: DevolutivaRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/devolutiva`, data)
  return res.data
}

export const registrarExecucaoAcao = async (id: string, data: ExecucaoAcaoRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/execucao-acao`, data)
  return res.data
}

export const validarNaoConformidade = async (id: string, data: ValidacaoRequest): Promise<NaoConformidade> => {
  const res = await client.post<NaoConformidade>(`/nao-conformidades/${id}/validacao`, data)
  return res.data
}
