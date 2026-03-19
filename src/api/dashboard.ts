import client from './client'
import { DashboardStats } from '../types'

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await client.get<DashboardStats>('/dashboard/stats')
  return res.data
}
