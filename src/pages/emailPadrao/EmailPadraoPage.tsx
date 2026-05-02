import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEstabelecimentos, getEmpresasDoEstabelecimento } from '../../api/estabelecimento'
import { getEmailsPadrao, createEmailPadrao, deleteEmailPadrao, TipoEmailPadrao } from '../../api/emailPadrao'
import { Mail, Plus, Trash2 } from 'lucide-react'
import SearchableSelect from '../../components/SearchableSelect'
import { Estabelecimento, Empresa, EmailPadrao } from '../../types'

const TIPOS: { value: TipoEmailPadrao; label: string }[] = [
  { value: 'NC', label: 'Não Conformidade' },
  { value: 'DESVIO', label: 'Desvio' },
]

export default function EmailPadraoPage() {
  const [tipo, setTipo] = useState<TipoEmailPadrao>('NC')
  const [estabelecimentoId, setEstabelecimentoId] = useState('')
  const [empresaId, setEmpresaId] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const queryClient = useQueryClient()

  const { data: estabelecimentos = [] } = useQuery<Estabelecimento[]>({
    queryKey: ['estabelecimentos'],
    queryFn: () => getEstabelecimentos(true),
  })

  const { data: empresas = [] } = useQuery<Empresa[]>({
    queryKey: ['empresas-estabelecimento', estabelecimentoId],
    queryFn: () => getEmpresasDoEstabelecimento(estabelecimentoId),
    enabled: !!estabelecimentoId,
  })

  const { data: emails = [], isLoading } = useQuery<EmailPadrao[]>({
    queryKey: ['emails-padrao', tipo, estabelecimentoId, empresaId],
    queryFn: () => getEmailsPadrao(estabelecimentoId, empresaId, tipo),
    enabled: !!estabelecimentoId && !!empresaId,
  })

  const criarMutation = useMutation({
    mutationFn: () =>
      createEmailPadrao({
        estabelecimentoId,
        empresaId,
        email: novoEmail.trim(),
        descricao: novaDescricao.trim() || undefined,
        tipo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails-padrao', tipo, estabelecimentoId, empresaId] })
      setNovoEmail('')
      setNovaDescricao('')
    },
  })

  const removerMutation = useMutation({
    mutationFn: (id: string) => deleteEmailPadrao(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['emails-padrao', tipo, estabelecimentoId, empresaId] }),
  })

  const estOptions = estabelecimentos.map(e => ({ id: e.id, label: e.nome }))
  const empOptions = empresas.map(e => ({
    id: e.id,
    label: e.nomeFantasia || e.razaoSocial,
  }))

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:bg-white transition'

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Mail size={22} className="text-slate-600" />
        <h2 className="text-2xl font-bold text-slate-800">Emails Padrão</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Destinatários padrão de notificação por email por (estabelecimento + empresa contratada).
      </p>

      {/* Tabs NC / Desvio */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TIPOS.map(t => (
          <button
            key={t.value}
            onClick={() => {
              setTipo(t.value)
              setNovoEmail('')
              setNovaDescricao('')
            }}
            className={`px-4 py-2 text-sm rounded-md font-medium transition ${
              tipo === t.value
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Selecionar escopo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Estabelecimento *</label>
            <SearchableSelect
              options={estOptions}
              value={estabelecimentoId}
              onChange={v => { setEstabelecimentoId(v); setEmpresaId('') }}
              placeholder="Selecione..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Empresa Contratada *</label>
            <SearchableSelect
              options={empOptions}
              value={empresaId}
              onChange={setEmpresaId}
              placeholder={estabelecimentoId ? 'Selecione...' : 'Selecione um estabelecimento primeiro'}
            />
          </div>
        </div>
      </div>

      {estabelecimentoId && empresaId && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Adicionar email</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="email"
                placeholder="Email *"
                className={inputClass}
                value={novoEmail}
                onChange={e => setNovoEmail(e.target.value)}
              />
              <input
                type="text"
                placeholder="Descrição (ex: Diretor)"
                className={inputClass}
                value={novaDescricao}
                onChange={e => setNovaDescricao(e.target.value)}
              />
            </div>
            <button
              onClick={() => criarMutation.mutate()}
              disabled={!novoEmail.trim() || criarMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <Plus size={15} />
              {criarMutation.isPending ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-slate-700">
                Emails cadastrados {isLoading ? '...' : `(${emails.length})`}
              </h3>
            </div>
            {!isLoading && emails.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-sm">
                Nenhum email padrão cadastrado para este par.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {emails.map(e => (
                  <li key={e.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <span className="text-sm text-slate-800">{e.email}</span>
                      {e.descricao && (
                        <span className="ml-2 text-xs text-slate-400">— {e.descricao}</span>
                      )}
                    </div>
                    <button
                      onClick={() => removerMutation.mutate(e.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
