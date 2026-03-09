import { useAuth } from '../context/AuthContext'

const CBIS_COLORS = {
  purple: '#5B2D8E',
  purpleDark: '#3d1f61',
  purpleLight: '#7B4DB8',
  gold: '#D4A017',
  pink: '#E91E8C',
  teal: '#2ABFBF',
  orange: '#E8573A',
  yellow: '#F5C518',
}

function LogoCBIS({ size = 36 }) {
  return (
    <img 
  src="/logo.png" 
  alt="CBIS" 
  style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }} 
/>
  )
}

export default function Layout({ pagina, setPagina, children }) {
  const { perfil, signOut } = useAuth()

  const menuAdmin = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'estudiantes', label: 'Estudiantes', icon: '🎓' },
    { id: 'cobros', label: 'Cobros', icon: '💰' },
    { id: 'contabilidad', label: 'Contabilidad', icon: '📋' },
    { id: 'usuarios', label: 'Usuarios', icon: '👥' },
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' },
    { id: 'matricula', label: 'Matrícula', icon: '📋' },
    { id: 'reportes', label: 'Reportes', icon: '📄' },
  ]

  const menuRecepcion = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'cobros', label: 'Cobros', icon: '💰' },
  { id: 'estudiantes', label: 'Estudiantes', icon: '🎓' },
  { id: 'matricula', label: 'Matrícula', icon: '📋' },
  { id: 'reportes', label: 'Reportes', icon: '📄' },
]

  const menu = perfil?.rol === 'admin' ? menuAdmin : menuRecepcion

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#f4f0fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Sidebar */}
      <div style={{
        width: 220, flexShrink: 0,
        background: `linear-gradient(180deg, ${CBIS_COLORS.purpleDark} 0%, ${CBIS_COLORS.purple} 60%, ${CBIS_COLORS.purpleLight} 100%)`,
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(91,45,142,0.25)',
        position: 'relative', overflow: 'hidden'
      }}>

        {/* Decoración fondo */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: 60, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Header sidebar */}
        <div style={{ padding: '24px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <LogoCBIS size={40} />
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, letterSpacing: 0.5 }}>CBIS+</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>Fé, Cultura, Innovación y Disciplina</div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {menu.map(item => {
            const activo = pagina === item.id
            return (
              <button
                key={item.id}
                onClick={() => setPagina(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, border: 'none',
                  background: activo ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: activo ? '#fff' : 'rgba(255,255,255,0.65)',
                  fontWeight: activo ? 700 : 500, fontSize: 13,
                  cursor: 'pointer', marginBottom: 2,
                  borderLeft: activo ? `3px solid ${CBIS_COLORS.gold}` : '3px solid transparent',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: CBIS_COLORS.gold,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 13, flexShrink: 0
            }}>
              {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {perfil?.nombre} {perfil?.apellido}
              </div>
              <div style={{ color: CBIS_COLORS.gold, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                {perfil?.rol}
              </div>
            </div>
          </div>
          <button onClick={() => signOut()} style={{
  width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none',
  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left'
}}>
  🚪 Cerrar sesión
</button>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div style={{
          background: '#fff', padding: '14px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(91,45,142,0.08)',
          borderBottom: `3px solid ${CBIS_COLORS.gold}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 4, height: 24, borderRadius: 2, background: CBIS_COLORS.purple }} />
            <span style={{ color: CBIS_COLORS.purple, fontWeight: 800, fontSize: 16 }}>
              {menu.find(m => m.id === pagina)?.icon} {menu.find(m => m.id === pagina)?.label || 'Dashboard'}
            </span>
          </div>
          <span style={{ color: '#aaa', fontSize: 12 }}>
            {new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Página */}
        <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}