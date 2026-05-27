import client from './client'
import { EmailPadrao, EmailPadraoEscopo, EmailPadraoRequest } from '../types'

export const getEmailPadraoEscopos = async (): Promise<EmailPadraoEscopo[]> => {
  const res = await client.get<EmailPadraoEscopo[]>('/emails-padrao/escopos')
  return res.data
}

export const getEmailsPadrao = async (
  estabelecimentoId: string,
  empresaId: string
): Promise<EmailPadrao[]> => {
  const res = await client.get<EmailPadrao[]>('/emails-padrao', {
    params: { estabelecimentoId, empresaId },
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
