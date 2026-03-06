import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Estudiantes from './Estudiantes'
import Cobros from './Cobros'
import Contabilidad from './Contabilidad.jsx'

// Páginas placeholder por ahora
function PaginaEnConstruccion({ nombre }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', background: '#fff', borderRadius: 16, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
        <h2 style={{ color: '#1e3a5f', marginBottom: 8 }}>{nombre}</h2>
        <p style={{ color: '#aaa', fontSize: 14 }}>Este módulo está en construcción</p>
      </div>
    </div>
  )
}

function DashboardHome() {
  const { perfil } = useAuth()

  const tarjetas = {
    admin: [
      { icon: '👨‍🎓', label: 'Estudiantes', valor: '—', color: '#3b82f6' },
      { icon: '💰', label: 'Ingresos hoy', valor: '$0.00', color: '#16a34a' },
      { icon: '📋', label: 'Cobros pendientes', valor: '—', color: '#f59e0b' },
      { icon: '🚫', label: 'Pagos vencidos', valor: '—', color: '#ef4444' },
    ],
    recepcion: [
      { icon: '👨‍🎓', label: 'Estudiantes', valor: '—', color: '#3b82f6' },
      { icon: '💰', label: 'Ingresos hoy', valor: '$0.00', color: '#16a34a' },
      { icon: '📋', label: 'Cobros pendientes', valor: '—', color: '#f59e0b' },
    ],
    docente: [
      { icon: '👨‍🎓', label: 'Mis alumnos', valor: '—', color: '#3b82f6' },
      { icon: '📝', label: 'Clases hoy', valor: '—', color: '#8b5cf6' },
      { icon: '✅', label: 'Asistencia hoy', valor: '—', color: '#16a34a' },
    ],
    alumno: [
      { icon: '🎓', label: 'Promedio general', valor: '—', color: '#3b82f6' },
      { icon: '✅', label: 'Asistencia', valor: '—', color: '#16a34a' },
      { icon: '💰', label: 'Saldo pendiente', valor: '$0.00', color: '#f59e0b' },
    ],
    padre: [
      { icon: '🎓', label: 'Promedio hijo', valor: '—', color: '#3b82f6' },
      { icon: '✅', label: 'Asistencia', valor: '—', color: '#16a34a' },
      { icon: '💰', label: 'Saldo pendiente', valor: '$0.00', color: '#f59e0b' },
    ],
  }

  const misTarjetas = tarjetas[perfil?.rol] || []

  return (
    <div>
      {/* Bienvenida */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#1e3a5f', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Bienvenido, {perfil?.nombre} 👋
        </h1>
        <p style={{ color: '#888', fontSize: 14 }}>
          {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Tarjetas KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {misTarjetas.map((t, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderLeft: `4px solid ${t.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: t.color, marginBottom: 4 }}>{t.valor}</div>
            <div style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <h2 style={{ color: '#1e3a5f', fontSize: 15, fontWeight: 800, marginBottom: 16 }}>⚡ Accesos rápidos</h2>
        <p style={{ color: '#aaa', fontSize: 13 }}>Los accesos rápidos aparecerán aquí conforme construyamos los módulos.</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [pagina, setPagina] = useState('dashboard')

  function renderPagina() {
    switch (pagina) {
      case 'dashboard': return <DashboardHome />
      case 'estudiantes': return <Estudiantes />
      case 'cobros': return <Cobros />
      case 'contabilidad': return <Contabilidad />
      default: return <PaginaEnConstruccion nombre={pagina.charAt(0).toUpperCase() + pagina.slice(1)} />
    }
  }

  return (
    <Layout paginaActiva={pagina} setPagina={setPagina}>
      {renderPagina()}
    </Layout>
  )
}