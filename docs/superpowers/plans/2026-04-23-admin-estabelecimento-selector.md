# Admin: Seletor de Empresa/Estabelecimento na Criação de Desvio/NC

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que admins selecionem empresa → estabelecimento → empresa filha ao criar um Desvio ou NC, já que eles não têm workspace pré-selecionado.

**Architecture:** Três estados locais + três queries no `RegistroOcorrenciaPage` (habilitadas somente para admin) derivam os valores efetivos de estabelecimento e empresa filha. Todas as queries existentes que dependem do workspace passam a usar esses valores derivados. A permissão do backend para criar/editar NC é expandida para incluir ADMIN.

**Tech Stack:** React + react-hook-form + @tanstack/react-query (frontend); Spring Boot + Spring Security @PreAuthorize (backend)

---

## File Map

| Arquivo | Ação | O quê |
|---|---|---|
| `engseg-api/src/main/java/com/engseg/controller/NaoConformidadeController.java` | Modify | Adiciona `'ADMIN'` no `@PreAuthorize` de create e update |
| `engseg-web/src/pages/RegistroOcorrenciaPage.tsx` | Modify | Imports, estados, queries, useEffect, JSX do campo Estabelecimento |

---

### Task 1: Backend — Permissão ADMIN no NaoConformidadeController

**Files:**
- Modify: `engseg-api/src/main/java/com/engseg/controller/NaoConformidadeController.java`

O `DesvioController` já tem `ADMIN` no `@PostMapping`. O `NaoConformidadeController` precisa da mesma correção em create e update.

- [ ] **Step 1: Localizar as anotações a alterar**

Abrir `NaoConformidadeController.java`. Procurar por todas as ocorrências de:
```
@PreAuthorize("hasAnyRole('TECNICO', 'ENGENHEIRO')")
```
Há três: no `@PostMapping` (create), no `@PutMapping` (update) e no `@DeleteMapping` (delete). As duas primeiras serão alteradas; a de delete fica fora do escopo.

- [ ] **Step 2: Alterar o @PostMapping (create)**

Localizar:
```java
    @PostMapping
    @PreAuthorize("hasAnyRole('TECNICO', 'ENGENHEIRO')")
    public ResponseEntity<NaoConformidadeResponse> create(@Valid @RequestBody NaoConformidadeRequest request) {
```

Substituir por:
```java
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'ENGENHEIRO')")
    public ResponseEntity<NaoConformidadeResponse> create(@Valid @RequestBody NaoConformidadeRequest request) {
```

- [ ] **Step 3: Alterar o @PutMapping (update)**

Localizar:
```java
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECNICO', 'ENGENHEIRO')")
    public ResponseEntity<NaoConformidadeResponse> update(@PathVariable UUID id, @Valid @RequestBody NaoConformidadeRequest request) {
```

Substituir por:
```java
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'ENGENHEIRO')")
    public ResponseEntity<NaoConformidadeResponse> update(@PathVariable UUID id, @Valid @RequestBody NaoConformidadeRequest request) {
```

- [ ] **Step 4: Compilar o backend para verificar**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-api"
./mvnw compile -q
```
Esperado: BUILD SUCCESS sem erros.

- [ ] **Step 5: Commit**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-api"
git add src/main/java/com/engseg/controller/NaoConformidadeController.java
git commit -m "feat: allow ADMIN to create and update NaoConformidade"
```

---

### Task 2: Frontend — Imports, useAuth e estados locais de admin

**Files:**
- Modify: `engseg-web/src/pages/RegistroOcorrenciaPage.tsx`

- [ ] **Step 1: Adicionar imports necessários**

No topo do arquivo, após as importações existentes de contexto e API, adicionar:

```tsx
import { getEmpresasMae } from '../api/empresa'
import { getEstabelecimentos, getEmpresasDoEstabelecimento } from '../api/estabelecimento'
import { useAuth } from '../contexts/AuthContext'
```

O bloco de imports completo após a mudança fica:
```tsx
import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDesvio, updateDesvio, getDesvio } from '../api/desvio'
import { createNaoConformidade, updateNaoConformidade, getNaoConformidade, getNaoConformidades } from '../api/naoConformidade'
import { uploadEvidencia, uploadEvidenciaDesvio } from '../api/evidencia'
import { getLocalizacoes } from '../api/localizacao'
import { getUsuarios } from '../api/usuario'
import { getNormas } from '../api/norma'
import { vincularTrechoNorma } from '../api/ncTrechoNorma'
import { getEmpresasMae } from '../api/empresa'
import { getEstabelecimentos, getEmpresasDoEstabelecimento } from '../api/estabelecimento'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import { Camera, AlertCircle, FileText, Calendar, Search, X, PenLine } from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
import BuscaTrechoModal from '../components/BuscaTrechoModal'
import TrechoManualModal from '../components/TrechoManualModal'
```

- [ ] **Step 2: Adicionar useAuth e estados locais de admin**

Dentro de `RegistroOcorrenciaPage()`, logo após as linhas existentes de estado e contexto (após `const { tipo: tipoParam, id } = useParams...` e os `useState` existentes), adicionar:

```tsx
const { user } = useAuth()
const [adminEmpresaId, setAdminEmpresaId] = useState('')
const [adminEstabelecimentoId, setAdminEstabelecimentoId] = useState('')
const [adminEmpresaFilhaId, setAdminEmpresaFilhaId] = useState('')
```

O bloco de inicialização do componente após a mudança (linhas 43-56) fica:
```tsx
export default function RegistroOcorrenciaPage() {
  const { tipo: tipoParam, id } = useParams<{ tipo?: string; id?: string }>()
  const isEditing = !!id && !!tipoParam
  const [tipo, setTipo] = useState<Tipo>(tipoParam === 'NAO_CONFORMIDADE' ? 'NAO_CONFORMIDADE' : 'DESVIO')
  const [arquivos, setArquivos] = useState<File[]>([])
  const [normasSelecionadas, setNormasSelecionadas] = useState<string[]>([])
  const [isReincidencia, setIsReincidencia] = useState(false)
  const [ncAnteriorId, setNcAnteriorId] = useState<string>('')
  const [trechosPendentes, setTrechosPendentes] = useState<TrechoPendente[]>([])
  const [buscaModal, setBuscaModal] = useState<{ normaId: string; normaTitulo: string } | null>(null)
  const [manualModal, setManualModal] = useState<{ normaId: string; normaTitulo: string } | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { estabelecimento: estabelecimentoSelecionado, empresaFilha } = useWorkspace()
  const { user } = useAuth()
  const [adminEmpresaId, setAdminEmpresaId] = useState('')
  const [adminEstabelecimentoId, setAdminEstabelecimentoId] = useState('')
  const [adminEmpresaFilhaId, setAdminEmpresaFilhaId] = useState('')
```

- [ ] **Step 3: Verificar que o TypeScript compila**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
npx tsc --noEmit 2>&1 | head -20
```
Esperado: sem erros novos (pode ter erros pré-existentes, ignorar).

---

### Task 3: Frontend — Queries admin e valores derivados

**Files:**
- Modify: `engseg-web/src/pages/RegistroOcorrenciaPage.tsx`

- [ ] **Step 1: Adicionar as 3 novas queries de admin**

Logo após a linha `const { estabelecimento: estabelecimentoSelecionado, empresaFilha } = useWorkspace()` (e os novos estados do Task 2), adicionar as 3 queries:

```tsx
const { data: empresasAdmin = [] } = useQuery({
  queryKey: ['empresas-mae-admin'],
  queryFn: () => getEmpresasMae(true),
  enabled: !!user?.isAdmin,
})

const { data: estabelecimentosAdmin = [] } = useQuery({
  queryKey: ['estabelecimentos-admin', adminEmpresaId],
  queryFn: () => getEstabelecimentos(true, adminEmpresaId),
  enabled: !!user?.isAdmin && !!adminEmpresaId,
})

const { data: empresasFilhaAdmin = [] } = useQuery({
  queryKey: ['empresas-filha-admin', adminEstabelecimentoId],
  queryFn: () => getEmpresasDoEstabelecimento(adminEstabelecimentoId),
  enabled: !!user?.isAdmin && !!adminEstabelecimentoId,
})
```

- [ ] **Step 2: Adicionar os valores derivados**

Logo após as novas queries, antes das queries existentes de localizações, adicionar:

```tsx
const estabelecimentoEfetivo = user?.isAdmin
  ? { id: adminEstabelecimentoId }
  : estabelecimentoSelecionado

const empresaFilhaEfetiva = user?.isAdmin
  ? { id: adminEmpresaFilhaId }
  : empresaFilha
```

- [ ] **Step 3: Atualizar query de localizacoes para usar estabelecimentoEfetivo**

Localizar:
```tsx
  const { data: localizacoes = [] } = useQuery({
    queryKey: ['localizacoes', estabelecimentoSelecionado?.id],
    queryFn: () => getLocalizacoes(estabelecimentoSelecionado?.id),
  })
```

Substituir por:
```tsx
  const { data: localizacoes = [] } = useQuery({
    queryKey: ['localizacoes', estabelecimentoEfetivo?.id],
    queryFn: () => getLocalizacoes(estabelecimentoEfetivo?.id),
  })
```

- [ ] **Step 4: Atualizar localizacoesAtivas para usar estabelecimentoEfetivo**

Localizar:
```tsx
  const localizacoesAtivas = (localizacoes as Array<{ id: string; nome: string; ativo: boolean; estabelecimentoId: string }>)
    .filter(l => l.ativo && l.estabelecimentoId === estabelecimentoSelecionado?.id)
```

Substituir por:
```tsx
  const localizacoesAtivas = (localizacoes as Array<{ id: string; nome: string; ativo: boolean; estabelecimentoId: string }>)
    .filter(l => l.ativo && l.estabelecimentoId === estabelecimentoEfetivo?.id)
```

- [ ] **Step 5: Atualizar query de usuariosFilha para usar empresaFilhaEfetiva**

Localizar:
```tsx
  const { data: usuariosFilha = [] } = useQuery({
    queryKey: ['usuarios', 'empresa', empresaFilha?.id],
    queryFn: () => getUsuarios(true, empresaFilha!.id),
    enabled: !!empresaFilha,
  })
```

Substituir por:
```tsx
  const { data: usuariosFilha = [] } = useQuery({
    queryKey: ['usuarios', 'empresa', empresaFilhaEfetiva?.id],
    queryFn: () => getUsuarios(true, empresaFilhaEfetiva!.id),
    enabled: !!empresaFilhaEfetiva?.id,
  })
```

- [ ] **Step 6: Atualizar query de ncsEstabelecimento para usar estabelecimentoEfetivo**

Localizar:
```tsx
  const { data: ncsEstabelecimento = [] } = useQuery({
    queryKey: ['nao-conformidades', 'estabelecimento', estabelecimentoSelecionado?.id],
    queryFn: () => getNaoConformidades({ estabelecimentoId: estabelecimentoSelecionado?.id }),
    enabled: tipo === 'NAO_CONFORMIDADE' && !!estabelecimentoSelecionado?.id,
  })
```

Substituir por:
```tsx
  const { data: ncsEstabelecimento = [] } = useQuery({
    queryKey: ['nao-conformidades', 'estabelecimento', estabelecimentoEfetivo?.id],
    queryFn: () => getNaoConformidades({ estabelecimentoId: estabelecimentoEfetivo?.id }),
    enabled: tipo === 'NAO_CONFORMIDADE' && !!estabelecimentoEfetivo?.id,
  })
```

- [ ] **Step 7: Verificar TypeScript**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
npx tsc --noEmit 2>&1 | head -20
```
Esperado: sem erros novos.

---

### Task 4: Frontend — useEffect e JSX dos seletores em cascata

**Files:**
- Modify: `engseg-web/src/pages/RegistroOcorrenciaPage.tsx`

- [ ] **Step 1: Adicionar useEffect que sincroniza adminEstabelecimentoId com o form**

Localizar o bloco de `useEffect` existente para `ncData` (por volta da linha 157). Logo após o último `useEffect` existente (o que trata `ncData`), adicionar:

```tsx
  useEffect(() => {
    if (user?.isAdmin) {
      setValue('estabelecimentoId', adminEstabelecimentoId)
    }
  }, [adminEstabelecimentoId, user?.isAdmin, setValue])
```

- [ ] **Step 2: Substituir o campo read-only de Estabelecimento no JSX**

Localizar o bloco exato:
```tsx
          {/* Estabelecimento — fixo do workspace */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estabelecimento *</label>
            <input
              type="text"
              value={estabelecimentoSelecionado?.nome ?? ''}
              readOnly
              className={`${inputClass} bg-gray-100 cursor-not-allowed`}
            />
          </div>
```

Substituir por:
```tsx
          {/* Estabelecimento */}
          {user?.isAdmin && !isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa *</label>
                <select
                  value={adminEmpresaId}
                  onChange={e => {
                    setAdminEmpresaId(e.target.value)
                    setAdminEstabelecimentoId('')
                    setAdminEmpresaFilhaId('')
                  }}
                  className={inputClass}
                >
                  <option value="">Selecione a empresa</option>
                  {(empresasAdmin as Array<{ id: string; razaoSocial: string }>).map(e => (
                    <option key={e.id} value={e.id}>{e.razaoSocial}</option>
                  ))}
                </select>
              </div>
              {adminEmpresaId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Estabelecimento *</label>
                  <select
                    value={adminEstabelecimentoId}
                    onChange={e => {
                      setAdminEstabelecimentoId(e.target.value)
                      setAdminEmpresaFilhaId('')
                    }}
                    className={inputClass}
                  >
                    <option value="">Selecione o estabelecimento</option>
                    {(estabelecimentosAdmin as Array<{ id: string; nome: string }>).map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              {adminEstabelecimentoId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Filha (Contratada)</label>
                  <select
                    value={adminEmpresaFilhaId}
                    onChange={e => setAdminEmpresaFilhaId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Nenhuma</option>
                    {(empresasFilhaAdmin as Array<{ id: string; razaoSocial: string }>).map(e => (
                      <option key={e.id} value={e.id}>{e.razaoSocial}</option>
                    ))}
                  </select>
                </div>
              )}
              {errors.estabelecimentoId && (
                <p className="text-red-500 text-xs mt-1">{errors.estabelecimentoId.message}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estabelecimento *</label>
              <input
                type="text"
                value={
                  isEditing
                    ? (desvioData?.estabelecimentoNome ?? ncData?.estabelecimentoNome ?? '')
                    : (estabelecimentoSelecionado?.nome ?? '')
                }
                readOnly
                className={`${inputClass} bg-gray-100 cursor-not-allowed`}
              />
            </div>
          )}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
npx tsc --noEmit 2>&1 | head -30
```
Esperado: sem erros novos.

- [ ] **Step 4: Iniciar o dev server e testar manualmente como admin**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
npm run dev
```

Abrir `http://localhost:5173` e logar como admin. Navegar para `/ocorrencias/nova` e verificar:

1. O campo "Estabelecimento *" read-only **não aparece** para admin
2. Dropdown "Empresa *" aparece com a lista de empresas-mãe ativas
3. Ao selecionar uma empresa, dropdown "Estabelecimento *" aparece filtrado
4. Ao selecionar um estabelecimento, dropdown "Empresa Filha" aparece com as empresas vinculadas
5. O campo Localização carrega opções do estabelecimento selecionado
6. Submeter um Desvio com todos os campos — verificar que é criado com sucesso
7. Submeter uma NC — verificar que é criada com sucesso (requer backend rodando com a mudança do Task 1)
8. Logar como ENGENHEIRO — verificar que o campo Estabelecimento read-only ainda aparece normalmente

- [ ] **Step 5: Commit**

```bash
cd "/home/mag/Documents/Java Projects/EngSeg/engseg-web"
git add src/pages/RegistroOcorrenciaPage.tsx
git commit -m "feat: add empresa/estabelecimento cascaded selector for admin on ocorrencia creation"
```
