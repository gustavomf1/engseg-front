# Design: Exportar Tratativa para PDF

**Data:** 2026-04-20  
**Status:** Aprovado

## Objetivo

Adicionar botão de exportação PDF na tela de detalhe da tratativa (`/tratativas/:tipo/:id`), gerando um relatório completo da ocorrência concluída, incluindo dados da tratativa (5 porquês, causa raiz, plano de ação com evidências por atividade).

## Estrutura do PDF

Seções em ordem:

1. **Header** — barra azul escura, "Relatório de Tratativa de Não Conformidade", data de emissão
2. **Informações da Ocorrência** — tabela: estabelecimento, localização, data de registro, prazo, usuário de registro, eng. responsável pela NC, eng. responsável pela tratativa, severidade, flags (Regra de Ouro, Reincidência)
3. **Descrição** — texto livre da ocorrência
4. **Normas Vinculadas** — tabela norma/cláusula/trecho (apenas NCs, não Desvios)
5. **Evidências da Ocorrência** — imagens embutidas (2 por página, legenda com nome do arquivo)
6. **Investigação — 5 Porquês** — tabela com colunas: #, Pergunta, Resposta (apenas porquês preenchidos, omite os vazios)
7. **Causa Raiz** — texto em bloco de destaque
8. **Plano de Ação** — para cada atividade: cabeçalho com título + status badge textual, descrição, seguido das imagens dessa atividade embutidas
9. **Footer** — "Página X de Y" em todas as páginas

## Arquitetura

### Novo arquivo: `src/utils/exportTratativa.ts`

Função pública exportada:
```ts
export async function exportTratativaBundle(nc: NaoConformidade): Promise<void>
```

Fluxo interno:
1. Busca evidências da ocorrência: `getEvidencias(nc.id, 'OCORRENCIA')`
2. Para cada atividade, busca evidências em paralelo: `Promise.all(nc.atividades.map(a => getEvidenciasAtividade(a.id)))`
3. Separa imagens dos outros arquivos (por extensão) para evidências da ocorrência
4. Para evidências de atividade: apenas imagens são embutidas (não-imagens ignoradas por hora)
5. Monta PDF via `buildTratativaPDFDoc()` (função interna)
6. Salva diretamente como `.pdf` (sem ZIP nesta versão)

Helpers reutilizados:
- `blobToDataUrl`, `getImageDimensions`, `gifToDataUrl` → exportar de `exportOcorrencia.ts` e importar em `exportTratativa.ts`
- `formatDate` → importar de `./date`

### Modificações em `TrativaDetailPage.tsx`

- Importar `exportTratativaBundle` e ícone `Download` do lucide-react
- Adicionar estados: `exporting: boolean`, `exportMenuOpen: boolean`
- Botão dropdown "Exportar" renderizado condicionalmente:
  - `nc.status === 'CONCLUIDO'`
  - `user.perfil` in `['ENGENHEIRO', 'TECNICO', 'ADMIN']`
- Posição: canto superior direito, junto ao botão "Voltar" (mesmo padrão de `OcorrenciaDetailPage`)
- Handler `handleExportPDF`: seta `exporting = true`, chama `exportTratativaBundle(nc)`, reseta estado

## Restrições

- Apenas PDF nesta versão (Excel será adicionado futuramente)
- Exportação disponível somente para status `CONCLUIDO`
- Não inclui histórico de eventos da tratativa (não solicitado)
- Evidências de atividade não-imagem não são incluídas no PDF (sem ZIP)
