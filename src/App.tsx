import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="registro-ocorrencia" element={<RegistroOcorrenciaPage />} />
            <Route path="tratativas" element={<TrativasListPage />} />
            <Route path="tratativas/:tipo/:id" element={<TrativaDetailPage />} />
            <Route path="empresas" element={<EmpresaListPage />} />
            <Route path="empresas/novo" element={<EmpresaFormPage />} />
            <Route path="empresas/:id/editar" element={<EmpresaFormPage />} />
            <Route path="estabelecimentos" element={<EstabelecimentoListPage />} />
            <Route path="estabelecimentos/novo" element={<EstabelecimentoFormPage />} />
            <Route path="estabelecimentos/:id/editar" element={<EstabelecimentoFormPage />} />
            <Route path="usuarios" element={<UsuarioListPage />} />
            <Route path="usuarios/novo" element={<UsuarioFormPage />} />
            <Route path="usuarios/:id/editar" element={<UsuarioFormPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
