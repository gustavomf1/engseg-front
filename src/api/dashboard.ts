import client from './client'
import { DashboardStats } from '../types'

export const getDashboardStats = async (params?: { empresaId?: string; estabelecimentoId?: string }): Promise<DashboardStats> => {
  const res = await client.get<DashboardStats>('/dashboard/stats', { params })
  return res.data
}
