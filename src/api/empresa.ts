import client from './client'
import { Empresa, EmpresaRequest } from '../types'

export const getEmpresas = async (): Promise<Empresa[]> => {
  const res = await client.get<Empresa[]>('/empresas')
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
