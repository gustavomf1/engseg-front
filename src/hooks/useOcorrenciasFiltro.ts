import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEmpresas } from '../api/empresa'
import { getEstabelecimentos } from '../api/estabelecimento'
import { useAuth } from '../contexts/AuthContext'
import { OcorrenciaItem } from '../api/ocorrencia'

export const PAGE_SIZES = [10, 15, 25, 50, 100]

/** Estado e lógica compartilhados entre as listagens de Ocorrências e Tratativas:
 *  busca, filtro de data, paginação e filtros de empresa/estabelecimento (admin). */
export function useOcorrenciasFiltro() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin === true

  const [busca, setBusca] = useState('')
  const [meuPapel, setMeuPapel] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [adminEmpresaId, setAdminEmpresaId] = useState('')
  const [adminEstabelecimentoId, setAdminEstabelecimentoId] = useState('')

  const { data: empresasAdmin = [] } = useQuery({
    queryKey: ['empresas-admin-filter'],
    queryFn: () => getEmpresas(),
    enabled: isAdmin,
  })

  const { data: estabelecimentosAdmin = [] } = useQuery({
    queryKey: ['estabelecimentos-admin-filter', adminEmpresaId],
    queryFn: () => getEstabelecimentos(undefined, adminEmpresaId),
    enabled: isAdmin && !!adminEmpresaId,
  })

  function resetPage() {
    setPage(1)
  }

  function matchBuscaEData(item: OcorrenciaItem) {
    const q = busca.toLowerCase()
    const matchBusca = q === '' ||
      item.titulo.toLowerCase().includes(q) ||
      (item.localizacao || '').toLowerCase().includes(q)
    const dataItem = item.dataRegistro.slice(0, 10)
    const matchInicio = !dataInicio || dataItem >= dataInicio
    const matchFim = !dataFim || dataItem <= dataFim
    return matchBusca && matchInicio && matchFim
  }

  return {
    isAdmin,
    busca, setBusca,
    meuPapel, setMeuPapel,
    page, setPage,
    pageSize, setPageSize,
    dataInicio, setDataInicio,
    dataFim, setDataFim,
    adminEmpresaId, setAdminEmpresaId,
    adminEstabelecimentoId, setAdminEstabelecimentoId,
    empresasAdmin, estabelecimentosAdmin,
    matchBuscaEData,
    resetPage,
  }
}
