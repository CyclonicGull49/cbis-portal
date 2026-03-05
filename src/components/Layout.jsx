import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const menuPorRol = {
  admin: [
    { icon: '📊', label: 'Dashboard', path: 'dashboard' },
    { icon: '👨‍🎓', label: 'Estudiantes', path: 'estudiantes' },
    { icon: '💰', label: 'Cobros', path: 'cobros' },
    { icon: '📋', label: 'Contabilidad', path: 'contabilidad' },
    { icon: '👥', label: 'Usuarios', path: 'usuarios' },
    { icon: '⚙️', label: 'Configuración', path: 'configuracion' },
  ],
  recepcion: [
    { icon: '📊', label: 'Dashboard', path: 'dashboard' },
    { icon: '👨‍🎓', label: 'Estudiantes', path: 'estudiantes' },
    { icon: '💰', label: 'Cobros', path: 'cobros' },
  ],
  docente: [
    { icon: '📊', label: 'Dashboard', path: 'dashboard' },
    { icon: '📝', label: 'Mis Clases', path: 'clases' },
    { icon: '✅', label: 'Asistencia', path: 'asistencia' },
    { icon: '🎓', label: 'Notas', path: 'notas' },
    { icon: '📁', label: 'Material', path: 'material' },
  ],
  alumno: [
    { icon: '📊', label: 'Dashboard', path: 'dashboard' },
    { icon: '🎓', label: 'Mis Notas', path: 'notas' },
    { icon: '📁', label: 'Material', path: 'material' },
    { icon: '💰', label: 'Estado de Cuenta', path: 'cuenta' },
  ],
  padre: [
    { icon: '📊', label: 'Dashboard', path: 'dashboard' },
    { icon: '🎓', label: 'Notas', path: 'notas' },
    { icon: '💰', label: 'Estado de Cuenta', path: 'cuenta' },
    { icon: '✅', label: 'Asistencia', path: 'asistencia' },
  ],
}

export default function Layout({ children, paginaActiva, setPagina }) {
  const { perfil, logout } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(true)
  const menu = menuPorRol[perfil?.rol] || []

  return (
    <div style={s.wrap}>
      {/* Sidebar */}
      <div style={{ ...s.sidebar, width: menuAbierto ? 240 : 64 }}>
        {/* Logo */}
        <div style={s.sidebarHeader}>
          {menuAbierto ? (
            <>
              <div style={s.logoBadge}><span style={s.logoText}>CBIS</span></div>
              <div>
                <div style={s.sidebarTitle}>Portal CBIS</div>
                <div style={s.sidebarSub}>Colegio Bautista</div>
              </div>
            </>
          ) : (
            <div style={s.logoBadge}><span style={s.logoText}>CB</span></div>
          )}
        </div>

        {/* Menu items */}
        <nav style={s.nav}>
          {menu.map(item => (
            <button
              key={item.path}
              onClick={() => setPagina(item.path)}
              style={{
                ...s.navItem,
                background: paginaActiva === item.path
                  ? 'rgba(255,255,255,0.15)'
                  : 'transparent',
                borderLeft: paginaActiva === item.path
                  ? '3px solid #4ade80'
                  : '3px solid transparent',
              }}
            >
              <span style={s.navIcon}>{item.icon}</span>
              {menuAbierto && <span style={s.navLabel}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div style={s.sidebarFooter}>
          {menuAbierto && (
            <div style={s.perfilInfo}>
              <div style={s.perfilNombre}>{perfil?.nombre} {perfil?.apellido}</div>
              <div style={s.perfilRol}>{perfil?.rol}</div>
            </div>
          )}
          <button onClick={logout} style={s.logoutBtn} title="Cerrar sesión">
            🚪
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            style={s.menuToggle}
          >
            {menuAbierto ? '◀' : '▶'}
          </button>
          <div style={s.topbarTitle}>
            {menu.find(m => m.path === paginaActiva)?.icon}{' '}
            {menu.find(m => m.path === paginaActiva)?.label || 'Dashboard'}
          </div>
          <div style={s.topbarFecha}>
            {new Date().toLocaleDateString('es-SV', {
              weekday: 'long', year: 'numeric',
              month: 'long', day: 'numeric'
            })}
          </div>
        </div>

        {/* Página activa */}
        <div style={s.content}>
          {children}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  sidebar: { background: 'linear-gradient(180deg, #0f2444 0%, #1a3a6b 100%)', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0 },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoBadge: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2563a8, #4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoText: { color: '#fff', fontWeight: 900, fontSize: 9, letterSpacing: 1 },
  sidebarTitle: { color: '#fff', fontWeight: 800, fontSize: 13 },
  sidebarSub: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500, textAlign: 'left', transition: 'all 0.15s', width: '100%' },
  navIcon: { fontSize: 18, flexShrink: 0 },
  navLabel: { fontWeight: 600 },
  sidebarFooter: { padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  perfilInfo: { overflow: 'hidden' },
  perfilNombre: { color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  perfilRol: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, flexShrink: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', background: '#f0f4ff', minHeight: '100vh' },
  topbar: { background: '#fff', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', flexShrink: 0 },
  menuToggle: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#1e3a5f', padding: 4 },
  topbarTitle: { fontWeight: 800, color: '#1e3a5f', fontSize: 15, flex: 1 },
  topbarFecha: { color: '#aaa', fontSize: 12 },
  content: { flex: 1, padding: 24, overflowY: 'auto' },
}