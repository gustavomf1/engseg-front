import client from './client'
import { TipoRelatorio, RelatorioFiltro } from '../types/relatorio'

export const exportarRelatorio = async (
  tipo: TipoRelatorio,
  filtro: RelatorioFiltro
): Promise<void> => {
  const params: Record<string, string | number | undefined> = {}
  if (filtro.dataInicio) params.dataInicio = filtro.dataInicio
  if (filtro.dataFim) params.dataFim = filtro.dataFim
  if (filtro.estabelecimentoId) params.estabelecimentoId = filtro.estabelecimentoId
  if (filtro.empresaContratadaId) params.empresaContratadaId = filtro.empresaContratadaId
  if (filtro.status) params.status = filtro.status
  if (filtro.diasParaVencer !== undefined) params.diasParaVencer = filtro.diasParaVencer

  const response = await client.get(`/relatorios/${tipo}`, {
    params,
    responseType: 'blob',
  })

  const url = URL.createObjectURL(new Blob([response.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-${tipo}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
