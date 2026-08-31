import type { NaoConformidade, Desvio } from '../types'

export const CAMPO_OBRIGATORIO_LABELS: Record<string, string> = {
  MATRIZ_RISCO: 'Matriz de risco (severidade e probabilidade)',
  RESPONSAVEL_TRATATIVA: 'Responsável pela tratativa',
  RESPONSAVEL_NC: 'Responsável pela NC',
  NORMA_VINCULADA: 'Norma vinculada',
  DESCRICAO: 'Descrição',
  ORIENTACAO_REALIZADA: 'Orientação realizada',
  RESPONSAVEL_DESVIO: 'Responsável pelo Desvio',
}

export function missingCamposNc(nc: Pick<NaoConformidade,
  'severidade' | 'probabilidade' | 'responsavelTrativaId' | 'responsavelNcId' | 'normas' | 'descricao'
>): string[] {
  const faltantes: string[] = []
  if (nc.severidade == null || nc.probabilidade == null) faltantes.push('MATRIZ_RISCO')
  if (!nc.responsavelTrativaId) faltantes.push('RESPONSAVEL_TRATATIVA')
  if (!nc.responsavelNcId) faltantes.push('RESPONSAVEL_NC')
  if (!nc.normas || nc.normas.length === 0) faltantes.push('NORMA_VINCULADA')
  if (!nc.descricao || nc.descricao.trim() === '') faltantes.push('DESCRICAO')
  return faltantes
}

export function missingCamposDesvio(desvio: Pick<Desvio,
  'descricao' | 'orientacaoRealizada' | 'responsavelDesvioId' | 'responsavelTratativaId'
>): string[] {
  const faltantes: string[] = []
  if (!desvio.descricao || desvio.descricao.trim() === '') faltantes.push('DESCRICAO')
  if (!desvio.orientacaoRealizada || desvio.orientacaoRealizada.trim() === '') faltantes.push('ORIENTACAO_REALIZADA')
  if (!desvio.responsavelDesvioId) faltantes.push('RESPONSAVEL_DESVIO')
  if (!desvio.responsavelTratativaId) faltantes.push('RESPONSAVEL_TRATATIVA')
  return faltantes
}
