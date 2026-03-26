export type PerfilUsuario = 'ENGENHEIRO' | 'TECNICO' | 'EXTERNO'
export type NivelSeveridade = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
export type StatusNaoConformidade = 'ABERTA' | 'EM_TRATAMENTO' | 'CONCLUIDO' | 'NAO_RESOLVIDA'
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
  telefone?: string
  ativo: boolean
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
  ativo: boolean
}

export interface NormaRequest {
  titulo: string
  descricao?: string
}

export interface Localizacao {
  id: string
  nome: string
  estabelecimentoId: string
  estabelecimentoNome: string
  ativo: boolean
}

export interface LocalizacaoRequest {
  nome: string
  estabelecimentoId: string
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
}

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

export type TipoEvidencia = 'OCORRENCIA' | 'TRATATIVA'

export interface Evidencia {
  id: string
  nomeArquivo: string
  urlArquivo: string
  dataUpload: string
  tipoEvidencia: TipoEvidencia
}
