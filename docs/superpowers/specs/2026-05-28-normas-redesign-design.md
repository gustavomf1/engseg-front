# Design: Normas — Redesign + Metadados de Auditoria

**Data:** 2026-05-28  
**Status:** Aprovado

---

## Contexto

A feature de Normas já existe no backend (`Norma.java`, `NormaService`, `NormaController`) e no frontend (`NormaListPage.tsx`, `NormaFormPage.tsx`), mas:

- O backend não possui campos de auditoria (quem criou/editou e quando).
- O frontend usa um design básico sem página de detalhe.
- Um protótipo visual completo foi elaborado (5 componentes JSX) e aprovado como design-alvo.

## Objetivo

1. Adicionar campos de auditoria ao backend (`criadoEm`, `criadoPorId`, `atualizadoEm`, `atualizadoPorId`).
2. Substituir as páginas de Normas no frontend pelo design do protótipo aprovado.
3. Criar a nova página de detalhe (`NormaDetailPage`) e o modal de desativação (`NormaDeactivateModal`).

---

## Backend

### Novos campos na entidade `Norma`

| Campo Java | Coluna SQL | Tipo | Regra |
|---|---|---|---|
| `criadoEm` | `criado_em` | `TIMESTAMP NOT NULL` | setado no `create`, imutável |
| `criadoPorId` | `criado_por_id` | `UUID NOT NULL FK → usuario(id)` | usuário autenticado no POST |
| `atualizadoEm` | `atualizado_em` | `TIMESTAMP NOT NULL` | setado no `create` e em todo `update` |
| `atualizadoPorId` | `atualizado_por_id` | `UUID NOT NULL FK → usuario(id)` | usuário autenticado no PUT |

- Sem `codigo`, sem `versao`.
- O `NormaService` popula esses campos a partir do `SecurityContext` (padrão já usado no projeto).
- `criadoPorId` e `atualizadoPorId` são **nullable** — se o usuário for removido, `ON DELETE SET NULL` preserva a norma sem o vínculo.

### `NormaResponse` — campos adicionados

```
criadoEm        LocalDateTime
criadoPorNome   String          (lookup pelo criadoPorId)
atualizadoEm    LocalDateTime
atualizadoPorNome String        (lookup pelo atualizadoPorId)
```

O service resolve os nomes via `usuarioRepository.findById(...)` e inclui no response — sem join no SQL.

### Migration Flyway

Novo arquivo `V__add_norma_audit_fields.sql`:

```sql
ALTER TABLE norma
  ADD COLUMN criado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN criado_por_id     UUID      REFERENCES usuario(id) ON DELETE SET NULL,
  ADD COLUMN atualizado_em     TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN atualizado_por_id UUID      REFERENCES usuario(id) ON DELETE SET NULL;
```

> `criado_por_id` e `atualizado_por_id` são nullable por design — o `ON DELETE SET NULL` exige isso.

> Os `DEFAULT NOW()` cobrem registros já existentes. Após a migration, o código não usa mais o default — os valores são sempre explícitos.

---

## Frontend

### Arquivos

| Ação | Caminho |
|---|---|
| SUBSTITUIR | `src/pages/norma/NormaListPage.tsx` |
| SUBSTITUIR | `src/pages/norma/NormaFormPage.tsx` |
| CRIAR | `src/pages/norma/NormaDetailPage.tsx` |
| CRIAR | `src/components/NormaDeactivateModal.tsx` |
| CRIAR | `src/styles/normas.css` |
| ATUALIZAR | `src/types/index.ts` — tipo `Norma` |
| ATUALIZAR | Router — rota `/normas/:id` |

### Tipo `Norma` atualizado

```ts
export interface Norma {
  id: string
  titulo: string
  descricao?: string
  conteudo?: string
  ativo: boolean
  dtInativacao?: string
  criadoEm: string
  criadoPorNome: string
  atualizadoEm: string
  atualizadoPorNome: string
  // contadores calculados via COUNT no NormaService
  totalOcorrencias: number
  totalNcsAtivas: number
}
```

### Fluxo de navegação

```
/normas              → NormaListPage
  clicar na linha    → /normas/:id          NormaDetailPage
  Nova Norma         → /normas/nova         NormaFormPage
/normas/:id          → NormaDetailPage
  Editar             → /normas/:id/editar   NormaFormPage
  Inativar           → NormaDeactivateModal (inline, sem rota)
```

### Adaptações do protótipo

O protótipo usa o padrão `window.*` (vanilla com CDN). A implementação usa ES modules + TypeScript:

| Protótipo | Implementação |
|---|---|
| `window.lucide.*` | `import { ... } from 'lucide-react'` |
| `window.SAMPLE_NORMAS` | `useQuery(['normas'], getNormas)` |
| `window.AppShellHead` | Removido — o shell já envolve a página |
| `window.StatusPill` | Componente local ou existente no projeto |
| `Object.assign(window, {...})` | `export default` / named exports |

**Campos removidos em relação ao protótipo:**
- `codigo` — removido do form, lista e detalhe
- `versao` — removido do sample data e sidebar de metadados
- Import `Building2` não utilizado — removido

**Campos/comportamentos preservados:**
- Filtro admin por empresa na lista (funcionalidade existente, mantida)
- Texto completo / conteúdo com contagem de caracteres
- Timeline de histórico: o protótipo exibe eventos mockados. Como não existe endpoint de histórico no projeto, a aba **Histórico** será omitida do `NormaDetailPage` neste ciclo (as outras duas abas — Texto e Ocorrências — são implementadas normalmente)
- Modal de desativação com lista de impacto

### NormaDetailPage — sidebar de metadados

Exibe os 4 campos de auditoria do backend:

```
Criada em:     {criadoEm formatado}
Criada por:    {criadoPorNome}
Atualizada em: {atualizadoEm formatado}
Atualizada por:{atualizadoPorNome}
```

---

## Fora de escopo

- Migração de dados históricos de auditoria (registros existentes ficam com `DEFAULT NOW()` e sem usuário).
- Busca semântica por IA (feature já existe, não será tocada).
- Mobile (`engseg-mobile`) — sem alterações neste ciclo.
