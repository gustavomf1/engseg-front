import client from './client'
import { LoginRequest, LoginResponse, VerificarOtpResponse } from '../types'

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/login', data)
  return response.data
}

export const solicitarReset = async (email: string): Promise<void> => {
  await client.post('/auth/reset/solicitar', { email })
}

export const verificarOtp = async (email: string, otp: string): Promise<string> => {
  const response = await client.post<VerificarOtpResponse>('/auth/reset/verificar', { email, otp })
  return response.data.resetToken
}

export const redefinirSenha = async (resetToken: string, novaSenha: string): Promise<void> => {
  await client.post('/auth/reset/redefinir', { resetToken, novaSenha })
}
