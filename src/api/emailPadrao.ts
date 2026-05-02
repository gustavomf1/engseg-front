import client from './client'
import { EmailPadrao, EmailPadraoRequest } from '../types'

export type TipoEmailPadrao = 'NC' | 'DESVIO'

export const getEmailsPadrao = async (
  estabelecimentoId: string,
  empresaId: string,
  tipo: TipoEmailPadrao
): Promise<EmailPadrao[]> => {
  const res = await client.get<EmailPadrao[]>('/emails-padrao', {
    params: { estabelecimentoId, empresaId, tipo },
  })
  return res.data
}

export const createEmailPadrao = async (
  data: EmailPadraoRequest
): Promise<EmailPadrao> => {
  const res = await client.post<EmailPadrao>('/emails-padrao', data)
  return res.data
}

export const deleteEmailPadrao = async (id: string): Promise<void> => {
  await client.delete(`/emails-padrao/${id}`)
}
