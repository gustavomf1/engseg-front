import { useState } from 'react'
import { exportarRelatorio } from '../../api/relatorios'
import {
  TipoRelatorio,
  RelatorioFiltro,
  TIPOS_RELATORIO,
  STATUS_NC_OPTIONS,
  STATUS_DESVIO_OPTIONS,
} from '../../types/relatorio'

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState<TipoRelatorio>('ncs')
  const [filtro, setFiltro] = useState<RelatorioFiltro>({})
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const handleExportar = async () => {
    setLoading(true)
    setErro(null)
    try {
      await exportarRelatorio(tipo, filtro)
    } catch {
      setErro('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleTipoChange = (novoTipo: TipoRelatorio) => {
    setTipo(novoTipo)
    setFiltro({})
  }

  const statusOptions = tipo === 'desvios' ? STATUS_DESVIO_OPTIONS : STATUS_NC_OPTIONS
  const mostrarStatus = tipo !== 'resumo-empresa'
  const mostrarDiasParaVencer = tipo === 'ncs-vencidas'
  const mostrarPeriodo = tipo !== 'ncs-vencidas'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Relatórios</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar: seletor de tipo */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium mb-2">Tipo de Relatório</label>
          <div className="space-y-2">
            {TIPOS_RELATORIO.map((t) => (
              <button
                key={t.value}
                onClick={() => handleTipoChange(t.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                  tipo === t.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main: filtros + export */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Filtros
            </h2>

            {/* Período */}
            {mostrarPeriodo && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Data início</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filtro.dataInicio ?? ''}
                    onChange={(e) => setFiltro({ ...filtro, dataInicio: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Data fim</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    value={filtro.dataFim ?? ''}
                    onChange={(e) => setFiltro({ ...filtro, dataFim: e.target.value || undefined })}
                  />
                </div>
              </div>
            )}

            {/* Dias para vencer (só NCs vencidas) */}
            {mostrarDiasParaVencer && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Incluir NCs que vencem nos próximos N dias (0 = só vencidas)
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filtro.diasParaVencer ?? 0}
                  onChange={(e) =>
                    setFiltro({ ...filtro, diasParaVencer: Number(e.target.value) })
                  }
                />
              </div>
            )}

            {/* Estabelecimento */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Estabelecimento ID</label>
              <input
                type="text"
                placeholder="UUID do estabelecimento (opcional)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filtro.estabelecimentoId ?? ''}
                onChange={(e) =>
                  setFiltro({ ...filtro, estabelecimentoId: e.target.value || undefined })
                }
              />
            </div>

            {/* Empresa contratada */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Empresa Contratada ID</label>
              <input
                type="text"
                placeholder="UUID da empresa contratada (opcional)"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                value={filtro.empresaContratadaId ?? ''}
                onChange={(e) =>
                  setFiltro({ ...filtro, empresaContratadaId: e.target.value || undefined })
                }
              />
            </div>

            {/* Status */}
            {mostrarStatus && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  value={filtro.status ?? ''}
                  onChange={(e) =>
                    setFiltro({ ...filtro, status: e.target.value || undefined })
                  }
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {erro && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {erro}
            </div>
          )}

          <button
            onClick={handleExportar}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition text-sm"
          >
            {loading ? 'Gerando...' : 'Exportar Excel'}
          </button>
        </div>
      </div>
    </div>
  )
}
