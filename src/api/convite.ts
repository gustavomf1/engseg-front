import client from './client'

export interface ConviteInfo {
  token: string
  empresaNome: string
  empresaCnpj: string
  perfil: string
  expiresAt: string
}

export const criarConvite = (data: { empresaId: string; perfil: string; minutos: number }) =>
  client.post<ConviteInfo>('/convites', data).then(r => r.data)

export const buscarConvite = (token: string) =>
  client.get<ConviteInfo>(`/convites/${token}`).then(r => r.data)

export const registrarViaConvite = (token: string, data: {
  nome: string
  email: string
  senha: string
  telefone?: string
}) => client.post(`/convites/${token}/registrar`, data)