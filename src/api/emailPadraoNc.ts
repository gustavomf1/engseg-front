import client from './client'
import { EmailPadraoNc, EmailPadraoNcRequest } from '../types'

export const getEmailsPadraoNc = async (
  estabelecimentoId: string,
  empresaId: string
): Promise<EmailPadraoNc[]> => {
  const res = await client.get<EmailPadraoNc[]>('/emails-padrao-nc', {
    params: { estabelecimentoId, empresaId },
  })
  return res.data
}

export const createEmailPadraoNc = async (
  data: EmailPadraoNcRequest
): Promise<EmailPadraoNc> => {
  const res = await client.post<EmailPadraoNc>('/emails-padrao-nc', data)
  return res.data
}

export const deleteEmailPadraoNc = async (id: string): Promise<void> => {
  await client.delete(`/emails-padrao-nc/${id}`)
}
