import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

const RegistroPadre   = lazy(() => import('./pages/RegistroPadre'))
const ResetPassword   = lazy(() => import('./pages/ResetPassword'))
const PadreLayout     = lazy(() => import('./pages/padre/PadreLayout'))
const PadreInicio     = lazy(() => import('./pages/padre/PadreInicio'))
const PadreNotas      = lazy(() => import('./pages/padre/PadreNotas'))
const PadreCobros     = lazy(() => import('./pages/padre/PadreCobros'))
const PadreDocumentos = lazy(() => import('./pages/padre/PadreDocumentos'))
const PadreSolicitudes= lazy(() => import('./pages/padre/PadreSolicitudes'))
const PadreCalendario = lazy(() => import('./pages/padre/PadreCalendario'))
const DesignPreview   = lazy(() => import('./pages/DesignPreview'))

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f4f0fa' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{
          width: 44, height: 44, margin: '0 auto 14px',
          border: '3px solid rgba(91, 45, 142, 0.15)',
          borderTopColor: '#5B2D8E',
          borderRadius: '50%',
          animation: 'cbisSpin 0.8s linear infinite',
        }} />
        <p style={{ color:'#5B2D8E', fontWeight:700, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Cargando CBIS+...</p>
        <style>{`@keyframes cbisSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function RutaProtegida({ children, soloRoles }) {
  const { perfil, loading } = useAuth()
  if (loading) return <Spinner />
  if (!perfil) return <Navigate to="/login" />
  if (soloRoles && !soloRoles.includes(perfil.rol)) {
    return <Navigate to={perfil.rol === 'padres' ? '/padre/inicio' : '/dashboard'} />
  }
  return children
}

function PublicRoute({ children }) {
  const { perfil, loading } = useAuth()
  if (loading) return null
  if (perfil) return <Navigate to={perfil.rol === 'padres' ? '/padre/inicio' : '/dashboard'} />
  return children
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { borderRadius:12, padding:'12px 16px', fontSize:14, fontWeight:600 },
        success: { iconTheme: { primary:'#16a34a', secondary:'#fff' } },
        error:   { iconTheme: { primary:'#dc2626', secondary:'#fff' }, duration:4000 },
      }} />
      <BrowserRouter>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/registro-padre" element={<PublicRoute><RegistroPadre /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={
              <RutaProtegida>
                <Dashboard />
              </RutaProtegida>
            } />

            <Route path="/padre" element={
              <RutaProtegida soloRoles={['padres']}>
                <PadreLayout />
              </RutaProtegida>
            }>
              <Route index              element={<Navigate to="inicio" replace />} />
              <Route path="inicio"      element={<PadreInicio />} />
              <Route path="notas"       element={<PadreNotas />} />
              <Route path="cobros"      element={<PadreCobros />} />
              <Route path="documentos"  element={<PadreDocumentos />} />
              <Route path="solicitudes" element={<PadreSolicitudes />} />
              <Route path="calendario"  element={<PadreCalendario />} />
            </Route>

            <Route path="/design-preview" element={<DesignPreview />} />

            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
