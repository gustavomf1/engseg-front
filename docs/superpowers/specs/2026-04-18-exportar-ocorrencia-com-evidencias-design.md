# Exportar Ocorrência com Evidências — Design

**Data:** 2026-04-18
**Contexto:** Extensão da feature de exportação PDF/Excel já existente em `src/utils/exportOcorrencia.ts`.

## Problema

Hoje, ao exportar uma NC ou Desvio concluído para PDF, o relatório traz apenas os metadados textuais (título, status, estabelecimento, descrição, normas, histórico da tratativa). As evidências anexadas à ocorrência (fotos do local, documentos) ficam de fora. Isso torna o relatório insuficiente como documento probatório para auditoria.

## Objetivo

Incluir no relatório PDF de uma ocorrência as evidências do tipo `OCORRENCIA` anexadas à NC/Desvio, de forma que:
- Fotos sejam visíveis diretamente no relatório.
- Outros arquivos (PDFs, docs, planilhas) sejam entregues junto, preservando o original.

## Escopo

**Em escopo:**
- Apenas o fluxo de exportação **PDF** na tela `OcorrenciaDetailPage`.
- Apenas evidências de tipo `OCORRENCIA` (não inclui `TRATATIVA`).
- Funciona tanto para NC quanto para Desvio (já que ambos usam a mesma tela de detalhes).
- Mantém restrição atual: botão de exportar só existe para ocorrências com status concluído.

**Fora de escopo:**
- Export Excel continua sem evidências.
- Evidências de atividades da tratativa ficam de fora.
- Lista de ocorrências (`OcorrenciasPage`) não muda.

## Comportamento

1. Usuário clica em "Exportar PDF" na tela de detalhes.
2. O handler busca as evidências da ocorrência filtrando por `tipo=OCORRENCIA`:
   - NC: `getEvidencias(ncId, 'OCORRENCIA')`
   - Desvio: `getEvidenciasDesvio(desvioId, 'OCORRENCIA')`
3. As evidências são classificadas por extensão:
   - **Imagens:** `jpg`, `jpeg`, `png`, `gif`, `webp` → embutidas no PDF.
   - **Outros:** `pdf`, `docx`, `xlsx`, `txt`, etc. → anexos soltos.
4. O relatório PDF ganha uma nova seção **"Evidências"** ao final (antes do histórico de tratativa se houver ambos, a decidir na implementação — priorizar legibilidade), contendo as imagens, **2 por página**, com legenda.
5. Decisão de entrega:
   - **0 arquivos não-imagem** (tudo foto ou nenhuma evidência) → baixa o PDF direto, como hoje.
   - **≥ 1 arquivo não-imagem** → gera ZIP contendo `{nome}.pdf` + pasta `anexos/` com cada arquivo original; usuário baixa o ZIP.

## Arquitetura

### Arquivos tocados

#### `src/utils/exportOcorrencia.ts` (alterado)
- `exportOcorrenciaToPDF` passa a ser **async** e recebe `evidencias: Evidencia[]` (default `[]` para compat).
- Nova helper privada `async renderEvidenciasSection(doc, imagens)`:
  - Para cada imagem: baixa blob via `downloadEvidencia(id)`, converte para dataURL via `FileReader`, mede `naturalWidth/Height` via `new Image()` para calcular proporção.
  - Renderiza cabeçalho "Evidências" e dispõe 2 imagens por página A4 com legenda.
  - Em falha de download individual: renderiza um placeholder cinza "Arquivo indisponível — {nome}" e segue.
- Nova função exportada `async exportOcorrenciaBundle(options, evidencias)`:
  - Classifica `evidencias` em `imagens` e `outros` por extensão.
  - Chama `exportOcorrenciaToPDF` passando `imagens` para embutir.
  - Se `outros.length === 0`: `doc.save(nome.pdf)` (comportamento atual).
  - Se `outros.length > 0`: gera ZIP com `{nome}.pdf` + `anexos/{nomeOriginal}` e dispara download do ZIP.
- A função Excel (`exportOcorrenciaToExcel`) não muda.

#### `src/pages/OcorrenciaDetailPage.tsx` (alterado)
- O handler atual do botão "Exportar PDF" chama diretamente `exportOcorrenciaToPDF`. Vira async:
  1. Seta `exporting=true` (loading no botão).
  2. Busca evidências da ocorrência (`OCORRENCIA`).
  3. Chama `exportOcorrenciaBundle({ ocorrencia, trechos, isDesvio }, evidencias)`.
  4. Em erro: toast "Erro ao exportar" + `console.error`.
  5. `exporting=false` no `finally`.
- Botão ganha estado de loading (ex: ícone gira / texto "Exportando…") e fica `disabled` enquanto rodando.

### Nova dependência

- `jszip` (~100KB minified+gzip). Já é um padrão de mercado e tem types embutidos.

### Layout das fotos no PDF

- Página A4 (usa `doc.internal.pageSize`): útil ~180mm×260mm (margins de 15mm).
- Cabeçalho da seção "Evidências" ocupa ~10mm no topo da primeira página da seção.
- Cada bloco (imagem + legenda): altura máx 130mm.
  - Imagem: largura máx 180mm, altura máx 110mm, **respeitando proporção** (`min(maxW/naturalW, maxH/naturalH)`).
  - Centralizada horizontalmente no bloco.
  - Legenda logo abaixo, fonte 8pt cinza (`rgb(100,116,139)`): `"{n}. {nomeOriginalDoArquivo}"`.
- 2 blocos por página, separados por ~5mm. Quebra de página automática após o segundo bloco.
- Formato passado ao `doc.addImage`: deduzido da extensão (`jpg|jpeg → 'JPEG'`, `png → 'PNG'`, `webp → 'WEBP'`, `gif → 'JPEG'` — converte via canvas pq jsPDF não suporta GIF direto).

### Montagem do ZIP

- Estrutura:
  ```
  NaoConformidade_{titulo}_{data}.zip
    ├── NaoConformidade_{titulo}_{data}.pdf
    └── anexos/
        ├── laudo-eletrico.pdf
        ├── croqui.dwg
        └── planilha-medicoes.xlsx
  ```
- Nome do ZIP reusa `buildFileName(..., 'zip')` com novo ramo no switch.
- Colisão de nomes dentro de `anexos/`: se `foto.pdf` aparecer duas vezes, a segunda vira `foto_2.pdf`, terceira `foto_3.pdf`.
- Arquivo não-imagem que falhar no download: **não entra no ZIP**; log no console com o id da evidência.
- Método: `jszip.generateAsync({ type: 'blob' })` → cria `<a download>` → click → revoga URL.

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Falha ao buscar lista de evidências | Toast "Erro ao carregar evidências"; aborta a exportação. |
| Falha ao baixar uma imagem | Placeholder "Arquivo indisponível — {nome}" no PDF, segue para as próximas. |
| Falha ao baixar um anexo não-imagem | Omite do ZIP; `console.warn` com id. |
| Nenhuma evidência e nenhuma falha | Comportamento igual ao atual: baixa PDF direto. |
| jsPDF falha ao adicionar imagem (formato inesperado) | Try/catch individual; renderiza placeholder e segue. |

## Testes manuais

Antes de entregar:
- [ ] NC concluída **sem evidências** → baixa só o PDF, sem seção "Evidências".
- [ ] NC concluída com **3 fotos (JPG, PNG, WEBP)** → baixa só o PDF, com seção "Evidências" mostrando as 3 fotos em 2 páginas.
- [ ] NC concluída com **1 foto + 1 PDF + 1 DOCX** → baixa ZIP com PDF (incluindo a foto embutida) + pasta `anexos/` com os 2 arquivos.
- [ ] Desvio concluído com **só 1 documento (.xlsx)** → baixa ZIP com PDF (sem seção "Evidências") + `anexos/planilha.xlsx`.
- [ ] Foto panorâmica muito larga e foto retrato muito alta → não distorcem, aspect ratio preservado.
- [ ] Dois anexos com mesmo nome → viram `nome.pdf` e `nome_2.pdf`.
- [ ] Durante export: botão mostra loading e fica desabilitado.
- [ ] Erro de rede ao buscar evidências → toast de erro, botão volta ao normal.

## Decisões abertas na implementação

- **Ordem da seção "Evidências" no PDF:** após "Histórico da Tratativa" ou antes? Proposta: **depois** do histórico, já que evidências são material probatório anexo. A decisão final fica para o plano de implementação.
- **Renderização do GIF:** jsPDF não tem suporte nativo. Opção: converter o primeiro frame via canvas para PNG antes de chamar `addImage`. Custo baixo.
