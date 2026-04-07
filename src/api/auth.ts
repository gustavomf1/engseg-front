import client from './client' //rota
import { LoginRequest, LoginResponse } from '../types'

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/login', data)
  return response.data
}
