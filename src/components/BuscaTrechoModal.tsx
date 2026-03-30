import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { buscarTrechoNorma } from '../api/norma'
import { vincularTrechoNorma } from '../api/ncTrechoNorma'
import { X, Search, Link } from 'lucide-react'

interface TrechoPendente {
  normaId: string
  normaTitulo: string
  clausulaReferencia?: string
  textoEditado: string
}

interface Props {
  normaId: string
  normaTitulo: string
  // Modo vinculação direta (página de detalhe da NC)
  ncId?: string
  // Modo formulário: devolve o trecho via callback sem chamar a API de vínculo
  onTrechoSelecionado?: (trecho: TrechoPendente) => void
  onClose: () => void
}

export default function BuscaTrechoModal({ normaId, normaTitulo, ncId, onTrechoSelecionado, onClose }: Props) {
  const [prompt, setPrompt] = useState('')
  const [trecho, setTrecho] = useState('')
  const [clausulaReferencia, setClausulaReferencia] = useState('')
  const queryClient = useQueryClient()

  const buscarMutation = useMutation({
    mutationFn: () => buscarTrechoNorma(normaId, prompt),
    onSuccess: (data) => {
      setTrecho(data.trecho)
      setClausulaReferencia(data.clausulaReferencia || '')
    },
  })

  const vincularMutation = useMutation({
    mutationFn: () => vincularTrechoNorma(ncId!, {
      normaId,
      clausulaReferencia: clausulaReferencia || undefined,
      textoEditado: trecho,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trechos-norma', ncId] })
      onClose()
    },
  })

  const handleConfirmar = () => {
    if (onTrechoSelecionado) {
      onTrechoSelecionado({
        normaId,
        normaTitulo,
        clausulaReferencia: clausulaReferencia || undefined,
        textoEditado: trecho,
      })
      onClose()
    } else {
      vincularMutation.mutate()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="font-bold text-slate-800">Buscar trecho por IA</h3>
            <p className="text-xs text-slate-500 mt-0.5">{normaTitulo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              O que você quer encontrar?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && prompt.trim() && buscarMutation.mutate()}
                placeholder='Ex: "linha de vida", "proteção coletiva", "cláusula 7.1.3"'
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <button
                type="button"
                onClick={() => buscarMutation.mutate()}
                disabled={buscarMutation.isPending || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
              >
                <Search size={14} />
                {buscarMutation.isPending ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {buscarMutation.isPending && (
            <div className="text-center py-8 text-slate-500 text-sm">
              <div className="animate-pulse">A IA está lendo a norma...</div>
            </div>
          )}

          {buscarMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              Erro ao buscar trecho. Verifique se a norma possui conteúdo cadastrado e tente novamente.
            </div>
          )}

          {trecho && !buscarMutation.isPending && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Referência da cláusula <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={clausulaReferencia}
                  onChange={e => setClausulaReferencia(e.target.value)}
                  placeholder="Ex: 7.1.3, Art. 5°, item II"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trecho encontrado <span className="text-slate-400 font-normal">(editável)</span>
                </label>
                <textarea
                  value={trecho}
                  onChange={e => setTrecho(e.target.value)}
                  rows={8}
                  className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/30 resize-y"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={vincularMutation.isPending || !trecho.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Link size={14} />
            {vincularMutation.isPending ? 'Vinculando...' : onTrechoSelecionado ? 'Adicionar trecho' : 'Vincular à NC'}
          </button>
        </div>
      </div>
    </div>
  )
}
