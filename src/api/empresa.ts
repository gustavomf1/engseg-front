import client from './client'
import { Empresa, EmpresaRequest } from '../types'

export const getEmpresas = async (ativo?: boolean): Promise<Empresa[]> => {
  const params = ativo !== undefined ? { ativo } : {}
  const res = await client.get<Empresa[]>('/empresas', { params })
  return res.data
}

export const getEmpresasMae = async (ativo?: boolean): Promise<Empresa[]> => {
  const params: Record<string, boolean> = { empresaMae: true }
  if (ativo !== undefined) params.ativo = ativo
  const res = await client.get<Empresa[]>('/empresas', { params })
  return res.data
}

export const getEmpresasFilhas = async (empresaMaeId: string, ativo?: boolean): Promise<Empresa[]> => {
  const params = ativo !== undefined ? { ativo } : {}
  const res = await client.get<Empresa[]>(`/empresas/${empresaMaeId}/filhas`, { params })
  return res.data
}

export const getEmpresa = async (id: string): Promise<Empresa> => {
  const res = await client.get<Empresa>(`/empresas/${id}`)
  return res.data
}

export const createEmpresa = async (data: EmpresaRequest): Promise<Empresa> => {
  const res = await client.post<Empresa>('/empresas', data)
  return res.data
}

export const updateEmpresa = async (id: string, data: EmpresaRequest): Promise<Empresa> => {
  const res = await client.put<Empresa>(`/empresas/${id}`, data)
  return res.data
}

export const deleteEmpresa = async (id: string): Promise<void> => {
  await client.delete(`/empresas/${id}`)
}

export const reativarEmpresa = async (id: string): Promise<Empresa> => {
  const res = await client.put<Empresa>(`/empresas/${id}/reativar`)
  return res.data
}
