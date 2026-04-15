import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import PrivateRoute from './components/PrivateRoute'
import WorkspaceRoute from './components/WorkspaceRoute'
import RoleRoute from './components/RoleRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SeletorPage from './pages/SeletorPage'
import DashboardPage from './pages/DashboardPage'
import OcorrenciasPage from './pages/OcorrenciasPage'
import OcorrenciaDetailPage from './pages/OcorrenciaDetailPage'
import RegistroOcorrenciaPage from './pages/RegistroOcorrenciaPage'
import TrativasListPage from './pages/TrativasListPage'
import TrativaDetailPage from './pages/TrativaDetailPage'
import EmpresaListPage from './pages/empresa/EmpresaListPage'
import EmpresaFormPage from './pages/empresa/EmpresaFormPage'
import EstabelecimentoListPage from './pages/estabelecimento/EstabelecimentoListPage'
import EstabelecimentoFormPage from './pages/estabelecimento/EstabelecimentoFormPage'
import UsuarioListPage from './pages/usuario/UsuarioListPage'
import UsuarioFormPage from './pages/usuario/UsuarioFormPage'
import LocalizacaoListPage from './pages/localizacao/LocalizacaoListPage'
import LocalizacaoFormPage from './pages/localizacao/LocalizacaoFormPage'
import NormaListPage from './pages/norma/NormaListPage'
import NormaFormPage from './pages/norma/NormaFormPage'
import ConvitePage from './pages/ConvitePage'

function DefaultRedirect() {
  const { user } = useAuth()
  if (user?.perfil === 'EXTERNO') return <Navigate to="/tratativas" replace />
  if (user?.isAdmin) return <Navigate to="/empresas" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/convite/:token" element={<ConvitePage />} />
            <Route path="/selecionar" element={
              <PrivateRoute>
                <SeletorPage />
              </PrivateRoute>
            } />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <WorkspaceRoute>
                    <Layout />
                  </WorkspaceRoute>
                </PrivateRoute>
              }
            >
              <Route index element={<DefaultRedirect />} />
              <Route path="dashboard" element={<RoleRoute allowed={['ENGENHEIRO', 'TECNICO']}><DashboardPage /></RoleRoute>} />
              <Route path="ocorrencias" element={<RoleRoute allowed={['ENGENHEIRO', 'TECNICO']}><OcorrenciasPage /></RoleRoute>} />
              <Route path="ocorrencias/nova" element={<RoleRoute allowed={['ENGENHEIRO', 'TECNICO']}><RegistroOcorrenciaPage /></RoleRoute>} />
              <Route path="ocorrencias/:tipo/:id" element={<RoleRoute allowed={['ENGENHEIRO', 'TECNICO']}><OcorrenciaDetailPage /></RoleRoute>} />
              <Route path="tratativas" element={<RoleRoute allowed={['ENGENHEIRO', 'EXTERNO']}><TrativasListPage /></RoleRoute>} />
              <Route path="tratativas/:tipo/:id" element={<RoleRoute allowed={['ENGENHEIRO', 'EXTERNO']}><TrativaDetailPage /></RoleRoute>} />
              <Route path="empresas" element={<RoleRoute allowed={['ENGENHEIRO']}><EmpresaListPage /></RoleRoute>} />
              <Route path="empresas/novo" element={<RoleRoute allowed={['ENGENHEIRO']}><EmpresaFormPage /></RoleRoute>} />
              <Route path="empresas/:id/editar" element={<RoleRoute allowed={['ENGENHEIRO']}><EmpresaFormPage /></RoleRoute>} />
              <Route path="estabelecimentos" element={<RoleRoute allowed={['ENGENHEIRO']}><EstabelecimentoListPage /></RoleRoute>} />
              <Route path="estabelecimentos/novo" element={<RoleRoute allowed={['ENGENHEIRO']}><EstabelecimentoFormPage /></RoleRoute>} />
              <Route path="estabelecimentos/:id/editar" element={<RoleRoute allowed={['ENGENHEIRO']}><EstabelecimentoFormPage /></RoleRoute>} />
              <Route path="localizacoes" element={<RoleRoute allowed={['ENGENHEIRO']}><LocalizacaoListPage /></RoleRoute>} />
              <Route path="localizacoes/novo" element={<RoleRoute allowed={['ENGENHEIRO']}><LocalizacaoFormPage /></RoleRoute>} />
              <Route path="localizacoes/:id/editar" element={<RoleRoute allowed={['ENGENHEIRO']}><LocalizacaoFormPage /></RoleRoute>} />
              <Route path="usuarios" element={<RoleRoute allowed={['ENGENHEIRO']}><UsuarioListPage /></RoleRoute>} />
              <Route path="usuarios/novo" element={<RoleRoute allowed={['ENGENHEIRO']}><UsuarioFormPage /></RoleRoute>} />
              <Route path="usuarios/:id/editar" element={<RoleRoute allowed={['ENGENHEIRO']}><UsuarioFormPage /></RoleRoute>} />
              <Route path="normas" element={<RoleRoute allowed={['ENGENHEIRO']}><NormaListPage /></RoleRoute>} />
              <Route path="normas/novo" element={<RoleRoute allowed={['ENGENHEIRO']}><NormaFormPage /></RoleRoute>} />
              <Route path="normas/:id/editar" element={<RoleRoute allowed={['ENGENHEIRO']}><NormaFormPage /></RoleRoute>} />
            </Route>
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}
