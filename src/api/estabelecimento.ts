import client from './client'
import { Empresa, Estabelecimento, EstabelecimentoRequest } from '../types'

export const getEstabelecimentos = async (ativo?: boolean, empresaId?: string): Promise<Estabelecimento[]> => {
  const params: Record<string, boolean | string> = {}
  if (ativo !== undefined) params.ativo = ativo
  if (empresaId) params.empresaId = empresaId
  const res = await client.get<Estabelecimento[]>('/estabelecimentos', { params })
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

export const reativarEstabelecimento = async (id: string): Promise<Estabelecimento> => {
  const res = await client.put<Estabelecimento>(`/estabelecimentos/${id}/reativar`)
  return res.data
}

// Empresas vinculadas a um estabelecimento
export const getEmpresasDoEstabelecimento = async (estabelecimentoId: string): Promise<Empresa[]> => {
  const res = await client.get<Empresa[]>(`/estabelecimentos/${estabelecimentoId}/empresas`)
  return res.data
}

export const vincularEmpresa = async (estabelecimentoId: string, empresaId: string): Promise<void> => {
  await client.post(`/estabelecimentos/${estabelecimentoId}/empresas`, { empresaId })
}

export const desvincularEmpresa = async (estabelecimentoId: string, empresaId: string): Promise<void> => {
  await client.delete(`/estabelecimentos/${estabelecimentoId}/empresas/${empresaId}`)
}
