export type PerfilUsuario = 'ENGENHEIRO' | 'TECNICO' | 'EXTERNO'
export type NivelSeveridade = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
export type StatusNaoConformidade = 'ABERTA' | 'EM_TRATAMENTO' | 'CONCLUIDA' | 'NAO_RESOLVIDA'
export type StatusDesvio = 'REGISTRADO' | 'RESOLVIDO'
export type ParecerValidacao = 'APROVADO' | 'REPROVADO'

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  token: string
  nome: string
  perfil: PerfilUsuario
}

export interface Empresa {
  id: string
  razaoSocial: string
  cnpj: string
  nomeFantasia?: string
  email?: string
  telefone?: string
  ativo: boolean
}

export interface EmpresaRequest {
  razaoSocial: string
  cnpj: string
  nomeFantasia?: string
  email?: string
  telefone?: string
}

export interface Estabelecimento {
  id: string
  nome: string
  codigo: string
  empresaId: string
  empresaNome: string
  cidade?: string
  estado?: string
  ativo: boolean
}

export interface EstabelecimentoRequest {
  nome: string
  codigo: string
  empresaId: string
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

export interface NaoConformidade {
  id: string
  estabelecimentoId: string
  estabelecimentoNome: string
  titulo: string
  localizacao: string
  descricao: string
  dataRegistro: string
  tecnicoNome?: string
  regraDeOuro: boolean
  nrRelacionada: string
  nivelSeveridade: NivelSeveridade
  engResponsavelConstrutoraId: string
  engConstrutoraEmail: string
  engResponsavelVerificacaoId: string
  engVerificacaoEmail: string
  dataLimiteResolucao: string
  status: StatusNaoConformidade
  devolutivas: DevolutivaResponse[]
  execucoes: ExecucaoAcaoResponse[]
  validacao?: ValidacaoResponse
}

export interface NaoConformidadeRequest {
  estabelecimentoId: string
  titulo: string
  localizacao: string
  descricao: string
  nrRelacionada: string
  nivelSeveridade: NivelSeveridade
  engResponsavelConstrutoraId?: string
  engResponsavelVerificacaoId?: string
  regraDeOuro: boolean
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
  localizacao: string
  descricao: string
  dataRegistro: string
  tecnicoNome?: string
  regraDeOuro: boolean
  orientacaoRealizada: string
  status: StatusDesvio
}

export interface DesvioRequest {
  estabelecimentoId: string
  titulo: string
  localizacao: string
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
  totalDesviosRegistrados: number
  totalDesviosResolvidos: number
}
