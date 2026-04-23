# Admin: Seletor de Empresa/Estabelecimento na Criação de Desvio/NC

**Data:** 2026-04-23  
**Escopo:** `RegistroOcorrenciaPage.tsx` + `NaoConformidadeController.java`

## Problema

Admins não têm workspace selecionado (`WorkspaceRoute` bypassa o seletor para `user?.isAdmin`). O `RegistroOcorrenciaPage` usa `useWorkspace()` para obter `estabelecimentoSelecionado` e `empresaFilha`, que são `null` para admin. Isso causa:

- Campo "Estabelecimento" exibe vazio (read-only)
- `estabelecimentoId` defaults para `''`, falha na validação do Zod
- Query de localizações retorna vazia (`estabelecimentoSelecionado?.id` é undefined)
- Query de usuários da empresa filha não executa (`empresaFilha?.id` é undefined)
- Admin não consegue criar nenhum Desvio ou NC

A mudança afeta **somente admins** — ENGENHEIRO e TECNICO não têm nenhuma alteração.

## Solução: Opção A — Estado local no componente

Adicionar 3 estados locais e 3 queries no `RegistroOcorrenciaPage`, ativas somente quando `user?.isAdmin`. Derivar valores efetivos de estabelecimento e empresa filha a partir do estado local (admin) ou do workspace (usuários normais).

## Design

### Frontend — `RegistroOcorrenciaPage.tsx`

#### Novos estados locais

```ts
const [adminEmpresaId, setAdminEmpresaId] = useState('')
const [adminEstabelecimentoId, setAdminEstabelecimentoId] = useState('')
const [adminEmpresaFilhaId, setAdminEmpresaFilhaId] = useState('')
```

#### Novas queries (enabled somente quando admin)

```ts
// Empresas-mãe ativas
const { data: empresasAdmin = [] } = useQuery({
  queryKey: ['empresas-mae', true],
  queryFn: () => getEmpresasMae(true),
  enabled: !!user?.isAdmin,
})

// Estabelecimentos ativos da empresa selecionada
const { data: estabelecimentosAdmin = [] } = useQuery({
  queryKey: ['estabelecimentos', adminEmpresaId],
  queryFn: () => getEstabelecimentos(true, adminEmpresaId),
  enabled: !!user?.isAdmin && !!adminEmpresaId,
})

// Empresas vinculadas ao estabelecimento selecionado
const { data: empresasFilhaAdmin = [] } = useQuery({
  queryKey: ['empresas-filha', adminEstabelecimentoId],
  queryFn: () => getEmpresasDoEstabelecimento(adminEstabelecimentoId),
  enabled: !!user?.isAdmin && !!adminEstabelecimentoId,
})
```

#### Valores derivados

```ts
const estabelecimentoEfetivo = user?.isAdmin
  ? { id: adminEstabelecimentoId }
  : estabelecimentoSelecionado

const empresaFilhaEfetiva = user?.isAdmin
  ? { id: adminEmpresaFilhaId }
  : empresaFilha
```

#### Queries existentes atualizadas

- `localizacoes`: `queryKey` e `queryFn` passam `estabelecimentoEfetivo?.id`
- `localizacoesAtivas`: filtro usa `estabelecimentoEfetivo?.id`
- `usuariosFilha`: `enabled` e `queryFn` usam `empresaFilhaEfetiva?.id`
- `ncsEstabelecimento`: `enabled` usa `estabelecimentoEfetivo?.id`

#### Novo `useEffect`

```ts
useEffect(() => {
  if (user?.isAdmin) {
    setValue('estabelecimentoId', adminEstabelecimentoId)
  }
}, [adminEstabelecimentoId, user?.isAdmin, setValue])
```

#### UI — campo "Estabelecimento"

Condição: `user?.isAdmin && !isEditing` → exibe seletores em cascata:

```
[Empresa *]             — dropdown: empresasAdmin
  ↓ (após selecionar)
[Estabelecimento *]     — dropdown: estabelecimentosAdmin (filtrado pela empresa)
  ↓ (após selecionar)
[Empresa Filha]         — dropdown: empresasFilhaAdmin (vinculadas ao estab.)
```

Comportamento:
- Mudar empresa → limpa `adminEstabelecimentoId` e `adminEmpresaFilhaId`
- Mudar estabelecimento → limpa `adminEmpresaFilhaId`, dispara `setValue('estabelecimentoId', ...)`

Condição: `!user?.isAdmin || isEditing` → exibe campo read-only atual (sem mudança).

### Backend — `NaoConformidadeController.java`

O `DesvioController` já permite ADMIN no POST. O `NaoConformidadeController` precisa da mesma correção:

```java
// @PostMapping — criar NC
// Antes:
@PreAuthorize("hasAnyRole('TECNICO', 'ENGENHEIRO')")
// Depois:
@PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'ENGENHEIRO')")

// @PutMapping — editar NC (consistência)
// Antes:
@PreAuthorize("hasAnyRole('TECNICO', 'ENGENHEIRO')")
// Depois:
@PreAuthorize("hasAnyRole('ADMIN', 'TECNICO', 'ENGENHEIRO')")
```

## Arquivos alterados

| Arquivo | Tipo |
|---|---|
| `engseg-web/src/pages/RegistroOcorrenciaPage.tsx` | Frontend — principal |
| `engseg-api/src/main/java/com/engseg/controller/NaoConformidadeController.java` | Backend — permissão |

## Fora de escopo

- Exibição do nome do estabelecimento na tela de **edição** para admin (visual, não bloqueia fluxo)
- Outras páginas que usam `useWorkspace()` (não relacionadas à criação de ocorrência)
