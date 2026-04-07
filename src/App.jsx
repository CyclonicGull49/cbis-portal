import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RegistroPadre from './pages/RegistroPadre'

function RutaProtegida({ children, soloRoles }) {
  const { perfil, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f4f0fa' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
        <p style={{ color: '#5B2D8E', fontWeight: 700 }}>Cargando CBIS+...</p>
      </div>
    </div>
  )
  if (!perfil) return <Navigate to="/login" />
  if (soloRoles && !soloRoles.includes(perfil.rol)) return <Navigate to="/dashboard" />
  return children
}

function PublicRoute({ children }) {
  const { perfil, loading } = useAuth()
  if (loading) return null
  if (perfil) {
    // Redirigir padres a su portal, resto al dashboard
    return <Navigate to={perfil.rol === 'padres' ? '/padre' : '/dashboard'} />
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 600 },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        error: { iconTheme: { primary: '#dc2626', secondary: '#fff' }, duration: 4000 },
      }} />
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/registro-padre" element={<PublicRoute><RegistroPadre /></PublicRoute>} />

          {/* Portal staff/alumnos */}
          <Route path="/dashboard" element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          } />

          {/* Portal padres — rutas pendientes de implementar */}
          <Route path="/padre/*" element={
            <RutaProtegida soloRoles={['padres']}>
              {/* PadreLayout se agregará en el siguiente paso */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f4f0fa' }}>
                <p style={{ color:'#5B2D8E', fontWeight:700 }}>Portal de padres — próximamente</p>
              </div>
            </RutaProtegida>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
