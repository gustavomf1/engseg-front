export type PerfilUsuario = 'ENGENHEIRO' | 'TECNICO' | 'EXTERNO'
export type NivelSeveridade = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
export type StatusNaoConformidade =
  | 'ABERTA'
  | 'AGUARDANDO_APROVACAO_PLANO'
  | 'EM_AJUSTE_PELO_EXTERNO'
  | 'EM_EXECUCAO'
  | 'AGUARDANDO_VALIDACAO_FINAL'
  | 'CONCLUIDO'
  | 'EM_TRATAMENTO'   // legado
  | 'NAO_RESOLVIDA'   // legado

export type TipoAcaoHistorico =
  | 'CRIACAO'
  | 'SUBMISSAO_INVESTIGACAO'
  | 'APROVACAO_PLANO'
  | 'REJEICAO_PLANO'
  | 'SUBMISSAO_EVIDENCIAS'
  | 'APROVACAO_EVIDENCIAS'
  | 'REJEICAO_EVIDENCIAS'
export type StatusDesvio = 'CONCLUIDO'
export type ParecerValidacao = 'APROVADO' | 'REPROVADO'

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  id: string
  token: string
  nome: string
  email: string
  perfil: PerfilUsuario
}

export interface Empresa {
  id: string
  razaoSocial: string
  cnpj: string
  nomeFantasia?: string
  email?: string
  telefone?: string
  empresaMaeId?: string
  empresaMaeNome?: string
  ativo: boolean
  dtInativacao?: string
}

export interface EmpresaRequest {
  razaoSocial: string
  cnpj: string
  nomeFantasia?: string
  email?: string
  telefone?: string
  empresaMaeId?: string
}

export interface Estabelecimento {
  id: string
  nome: string
  codigo: string
  empresaId: string
  empresaNome: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  ativo: boolean
  dtInativacao?: string
}

export interface EstabelecimentoRequest {
  nome: string
  codigo: string
  empresaId: string
  cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: PerfilUsuario
  empresaId: string
  empresaNome: string
  empresaCnpj?: string
  telefone?: string
  ativo: boolean
  dtCriacao?: string
  dtInativacao?: string
}

export interface UsuarioRequest {
  nome: string
  email: string
  senha?: string
  perfil: PerfilUsuario
  empresaId: string
  telefone?: string
}

export interface DevolutivaResponse {
  id: string
  descricaoPlanoAcao: string
  dataDevolutiva: string
  engenheiroNome?: string
}

export interface ExecucaoAcaoResponse {
  id: string
  descricaoAcaoExecutada: string
  dataExecucao: string
  engenheiroNome?: string
}

export interface ValidacaoResponse {
  id: string
  parecer: ParecerValidacao
  observacao?: string
  dataValidacao: string
  engenheiroNome?: string
}

export interface Norma {
  id: string
  titulo: string
  descricao?: string
  conteudo?: string
  ativo: boolean
  dtInativacao?: string
}

export interface NormaRequest {
  titulo: string
  descricao?: string
  conteudo?: string
}

export interface NcTrechoNorma {
  id: string
  normaId: string
  normaTitulo: string
  clausulaReferencia?: string
  textoEditado: string
  dataVinculo: string
}

export interface Localizacao {
  id: string
  nome: string
  estabelecimentoId: string
  estabelecimentoNome: string
  ativo: boolean
  dtInativacao?: string
}

export interface LocalizacaoRequest {
  nome: string
  estabelecimentoId: string
}

export interface NcResumo {
  id: string
  titulo: string
  dataRegistro: string
  status: StatusNaoConformidade
}

export interface AtividadeResponse {
  id: string
  titulo: string
  descricao: string
  ordem: number
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA'
  motivoRejeicao?: string
  descricaoExecucao?: string
  statusExecucao?: 'PENDENTE' | 'APROVADA' | 'REJEITADA'
  motivoRejeicaoExecucao?: string
  evidencias: Evidencia[]
}

export interface HistoricoNcResponse {
  id: string
  acao: TipoAcaoHistorico
  usuarioNome?: string
  comentario?: string
  statusAnterior?: StatusNaoConformidade
  statusAtual?: StatusNaoConformidade
  dataAcao: string
}

export interface NaoConformidade {
  id: string
  estabelecimentoId: string
  estabelecimentoNome: string
  titulo: string
  localizacaoId: string
  localizacaoNome: string
  descricao: string
  dataRegistro: string
  tecnicoNome?: string
  regraDeOuro: boolean
  nivelSeveridade: NivelSeveridade
  engResponsavelConstrutoraId: string
  engConstruturaNome: string
  engConstrutoraEmail: string
  engResponsavelVerificacaoId: string
  engVerificacaoNome: string
  engVerificacaoEmail: string
  dataLimiteResolucao: string
  usuarioCriacaoNome?: string
  usuarioCriacaoEmail?: string
  status: StatusNaoConformidade
  vencida: boolean
  reincidencia: boolean
  ncAnteriorId?: string
  ncAnteriorTitulo?: string
  cadeiaReincidencias: NcResumo[]
  reincidencias: NcResumo[]
  // Investigação — pergunta + resposta por porquê
  porqueUm?: string
  porqueUmResposta?: string
  porqueDois?: string
  porqueDoisResposta?: string
  porqueTres?: string
  porqueTresResposta?: string
  porqueQuatro?: string
  porqueQuatroResposta?: string
  porqueCinco?: string
  porqueCincoResposta?: string
  causaRaiz?: string
  descricaoExecucao?: string
  atividades: AtividadeResponse[]
  historico: HistoricoNcResponse[]
  investigacaoSnapshots: InvestigacaoSnapshot[]
  execucaoSnapshots: ExecucaoSnapshot[]
  // Legado
  devolutivas: DevolutivaResponse[]
  execucoes: ExecucaoAcaoResponse[]
  validacoes: ValidacaoResponse[]
  normas: Norma[]
}

export interface NaoConformidadeRequest {
  estabelecimentoId: string
  titulo: string
  localizacaoId?: string
  descricao: string
  nivelSeveridade: NivelSeveridade
  engResponsavelConstrutoraId?: string
  engResponsavelVerificacaoId?: string
  regraDeOuro: boolean
  normaIds?: string[]
  reincidencia: boolean
  ncAnteriorId?: string
}

export interface InvestigacaoRequest {
  porques: { pergunta: string; resposta: string }[]
  causaRaiz: string
  atividades: { titulo: string; descricao: string }[]
}

export interface RevisarAtividadesRequest {
  decisoes: { atividadeId: string; status: 'APROVADA' | 'REJEITADA'; motivo?: string }[]
  comentario?: string
}

export interface AprovarRejeitarRequest {
  comentario?: string
}

export interface SubmeterEvidenciasRequest {
  descricaoExecucao: string
}

export interface SubmeterExecucaoRequest {
  atividades: { atividadeId: string; descricaoExecucao?: string }[]
}

export interface RevisarExecucaoRequest {
  decisoes: { atividadeId: string; status: 'APROVADA' | 'REJEITADA'; motivo?: string }[]
  comentario?: string
}

// Legado
export interface DevolutivaRequest {
  descricaoPlanoAcao: string
}

export interface ExecucaoAcaoRequest {
  descricaoAcaoExecutada: string
}

export interface ValidacaoRequest {
  parecer: ParecerValidacao
  observacao?: string
}

export interface Desvio {
  id: string
  estabelecimentoId: string
  estabelecimentoNome: string
  titulo: string
  localizacaoId: string
  localizacaoNome: string
  descricao: string
  dataRegistro: string
  tecnicoNome?: string
  usuarioCriacaoNome?: string
  usuarioCriacaoEmail?: string
  regraDeOuro: boolean
  orientacaoRealizada: string
  status: StatusDesvio
}

export interface DesvioRequest {
  estabelecimentoId: string
  titulo: string
  localizacaoId?: string
  descricao: string
  orientacaoRealizada: string
  regraDeOuro: boolean
}

export interface DashboardStats {
  totalOcorrencias: number
  totalDesvios: number
  totalNaoConformidades: number
  totalRegraDeOuro: number
  ncAbertas: number
  ncEmTratamento: number
  ncConcluidas: number
  ncNaoResolvidas: number
  totalDesviosConcluidos: number
}

export type StatusSnapshot = 'PENDENTE' | 'APROVADO' | 'REPROVADO'

export interface InvestigacaoSnapshot {
  id: string
  porqueUm: string
  porqueUmResposta: string
  porqueDois: string
  porqueDoisResposta: string
  porqueTres: string
  porqueTresResposta: string
  porqueQuatro: string
  porqueQuatroResposta: string
  porqueCinco: string
  porqueCincoResposta: string
  causaRaiz: string
  atividades: string[]
  dataSubmissao: string
  status: StatusSnapshot
  comentarioRevisao?: string
}

export interface ExecucaoSnapshot {
  id: string
  descricaoExecucao: string
  dataSubmissao: string
  status: StatusSnapshot
  comentarioRevisao?: string
  evidencias: Evidencia[]
  atividades: string[]
}

export type TipoEvidencia = 'OCORRENCIA' | 'TRATATIVA'

export interface Evidencia {
  id: string
  nomeArquivo: string
  urlArquivo: string
  dataUpload: string
  tipoEvidencia?: TipoEvidencia
}
