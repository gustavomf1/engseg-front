import client from './client'
import { Usuario, UsuarioRequest } from '../types'

export const getUsuarios = async (ativo?: boolean, empresaId?: string): Promise<Usuario[]> => {
  const params: Record<string, boolean | string> = {}
  if (ativo !== undefined) params.ativo = ativo
  if (empresaId) params.empresaId = empresaId
  const res = await client.get<Usuario[]>('/usuarios', { params })
  return res.data
}

export const getUsuario = async (id: string): Promise<Usuario> => {
  const res = await client.get<Usuario>(`/usuarios/${id}`)
  return res.data
}

export const createUsuario = async (data: UsuarioRequest): Promise<Usuario> => {
  const res = await client.post<Usuario>('/usuarios', data)
  return res.data
}

export const updateUsuario = async (id: string, data: UsuarioRequest): Promise<Usuario> => {
  const res = await client.put<Usuario>(`/usuarios/${id}`, data)
  return res.data
}

export const deleteUsuario = async (id: string): Promise<void> => {
  await client.delete(`/usuarios/${id}`)
}

export const reativarUsuario = async (id: string): Promise<Usuario> => {
  const res = await client.put<Usuario>(`/usuarios/${id}/reativar`)
  return res.data
}
