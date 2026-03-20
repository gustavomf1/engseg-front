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
import PerfilPage from './pages/PerfilPage'
import EmpresaListPage from './pages/empresa/EmpresaListPage'
import EmpresaFormPage from './pages/empresa/EmpresaFormPage'
import EstabelecimentoListPage from './pages/estabelecimento/EstabelecimentoListPage'
import EstabelecimentoFormPage from './pages/estabelecimento/EstabelecimentoFormPage'
import UsuarioListPage from './pages/usuario/UsuarioListPage'
import UsuarioFormPage from './pages/usuario/UsuarioFormPage'
import LocalizacaoListPage from './pages/localizacao/LocalizacaoListPage'
import LocalizacaoFormPage from './pages/localizacao/LocalizacaoFormPage'

function DefaultRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.perfil === 'EXTERNO' ? '/tratativas' : '/dashboard'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="ocorrencias" element={<RoleRoute allowed={['ENGENHEIRO', 'TECNICO']}><OcorrenciasPage /></RoleRoute>} />
              <Route path="ocorrencias/nova" element={<RoleRoute allowed={['ENGENHEIRO', 'TECNICO']}><RegistroOcorrenciaPage /></RoleRoute>} />
              <Route path="ocorrencias/:tipo/:id" element={<RoleRoute allowed={['ENGENHEIRO', 'TECNICO']}><OcorrenciaDetailPage /></RoleRoute>} />
              <Route path="tratativas" element={<TrativasListPage />} />
              <Route path="tratativas/:tipo/:id" element={<TrativaDetailPage />} />
              <Route path="empresas" element={<EmpresaListPage />} />
              <Route path="empresas/novo" element={<EmpresaFormPage />} />
              <Route path="empresas/:id/editar" element={<EmpresaFormPage />} />
              <Route path="estabelecimentos" element={<EstabelecimentoListPage />} />
              <Route path="estabelecimentos/novo" element={<EstabelecimentoFormPage />} />
              <Route path="estabelecimentos/:id/editar" element={<EstabelecimentoFormPage />} />
              <Route path="localizacoes" element={<LocalizacaoListPage />} />
              <Route path="localizacoes/novo" element={<LocalizacaoFormPage />} />
              <Route path="localizacoes/:id/editar" element={<LocalizacaoFormPage />} />
              <Route path="usuarios" element={<UsuarioListPage />} />
              <Route path="usuarios/novo" element={<UsuarioFormPage />} />
              <Route path="usuarios/:id/editar" element={<UsuarioFormPage />} />
            </Route>
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}
