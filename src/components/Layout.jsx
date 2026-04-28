import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const CBIS_COLORS = {
  purple: '#5B2D8E', purpleDark: '#3d1f61', purpleLight: '#7B4DB8',
  gold: '#D4A017',
}

function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = window.innerWidth
    if (w < 768)  return 'mobile'
    if (w < 1024) return 'tablet'
    return 'desktop'
  })
  useEffect(() => {
    function onResize() {
      const w = window.innerWidth
      if (w < 768)  setBp('mobile')
      else if (w < 1024) setBp('tablet')
      else setBp('desktop')
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return bp
}

const Icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  estudiantes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  cobros: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  contabilidad: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  usuarios: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  configuracion: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  matricula: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  notas: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  boletas: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
    </svg>
  ),
  asistencia: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </svg>
  ),
  anecdotario: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  permisos: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  solicitudes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  ),
  calendario: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  horario: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.5"/>
      <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.5"/>
      <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.5"/>
      <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth="2.5"/>
      <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5"/>
    </svg>
  ),
  reportes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="12" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  mas: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  logout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

function LogoCBIS({ size = 36 }) {
  return (
    <img src="/logo.png" alt="CBIS"
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
  )
}

const ROL_LABEL = {
  admin: 'Administrador', direccion_academica: 'Dirección Académica',
  registro_academico: 'Registro Académico', recepcion: 'Recepción',
  docente: 'Docente', alumno: 'Alumno', talento_humano: 'Talento Humano',
}

export default function Layout({ pagina, setPagina, children }) {
  const { perfil, signOut } = useAuth()
  const bp = useBreakpoint()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [masOpen,     setMasOpen]     = useState(false)

  const isMobile  = bp === 'mobile'
  const isTablet  = bp === 'tablet'
  const isDesktop = bp === 'desktop'

  function navegar(id) {
    setPagina(id)
    setSidebarOpen(false)
    setMasOpen(false)
  }

  // ── Menús por rol ─────────────────────────────────────────
  const menuAdmin = [
    { id: 'dashboard',     label: 'Dashboard',     icon: Icons.dashboard },
    { id: 'estudiantes',   label: 'Estudiantes',   icon: Icons.estudiantes },
    { id: 'matricula',     label: 'Matrícula',     icon: Icons.matricula },
    { id: 'notas',         label: 'Notas',         icon: Icons.notas },
    { id: 'asistencia',    label: 'Asistencia',    icon: Icons.asistencia },
    { id: 'anecdotario',   label: 'Anecdotario',   icon: Icons.anecdotario },
    { id: 'permisos',      label: 'Permisos',      icon: Icons.permisos },
    { id: 'boletas',       label: 'Boletas',       icon: Icons.boletas },
    { id: 'cobros',        label: 'Cobros',        icon: Icons.cobros },
    { id: 'contabilidad',  label: 'Contabilidad',  icon: Icons.contabilidad },
    { id: 'solicitudes',   label: 'Solicitudes',   icon: Icons.solicitudes },
    { id: 'reportes',      label: 'Reportes',      icon: Icons.reportes },
    { id: 'usuarios',      label: 'Usuarios',      icon: Icons.usuarios },
    { id: 'horario',       label: 'Horario',       icon: Icons.horario },
    { id: 'calendario',    label: 'Calendario',    icon: Icons.calendario },
    { id: 'configuracion', label: 'Configuración', icon: Icons.configuracion },
  ]

  const menuRecepcion = [
    { id: 'dashboard',   label: 'Dashboard',   icon: Icons.dashboard },
    { id: 'estudiantes', label: 'Estudiantes', icon: Icons.estudiantes },
    { id: 'matricula',   label: 'Matrícula',   icon: Icons.matricula },
    { id: 'cobros',      label: 'Cobros',      icon: Icons.cobros },
    { id: 'solicitudes', label: 'Solicitudes', icon: Icons.solicitudes },
    { id: 'reportes',    label: 'Reportes',    icon: Icons.reportes },
    { id: 'calendario',  label: 'Calendario',  icon: Icons.calendario },
  ]

  const menuDireccion = [
    { id: 'dashboard',    label: 'Dashboard',    icon: Icons.dashboard },
    { id: 'estudiantes',  label: 'Estudiantes',  icon: Icons.estudiantes },
    { id: 'notas',        label: 'Notas',        icon: Icons.notas },
    { id: 'asistencia',   label: 'Asistencia',   icon: Icons.asistencia },
    { id: 'anecdotario',  label: 'Anecdotario',  icon: Icons.anecdotario },
    { id: 'permisos',     label: 'Permisos',     icon: Icons.permisos },
    { id: 'cobros',       label: 'Cobros',       icon: Icons.cobros },
    { id: 'contabilidad', label: 'Contabilidad', icon: Icons.contabilidad },
    { id: 'solicitudes',  label: 'Solicitudes',  icon: Icons.solicitudes },
    { id: 'reportes',     label: 'Reportes',     icon: Icons.reportes },
    { id: 'horario',      label: 'Horario',      icon: Icons.horario },
    { id: 'calendario',   label: 'Calendario',   icon: Icons.calendario },
  ]

  const menuRegistro = [
    { id: 'dashboard',    label: 'Dashboard',    icon: Icons.dashboard },
    { id: 'estudiantes',  label: 'Estudiantes',  icon: Icons.estudiantes },
    { id: 'matricula',    label: 'Matrícula',    icon: Icons.matricula },
    { id: 'notas',        label: 'Notas',        icon: Icons.notas },
    { id: 'asistencia',   label: 'Asistencia',   icon: Icons.asistencia },
    { id: 'boletas',      label: 'Boletas',      icon: Icons.boletas },
    { id: 'cobros',       label: 'Cobros',       icon: Icons.cobros },
    { id: 'solicitudes',  label: 'Solicitudes',  icon: Icons.solicitudes },
    { id: 'reportes',     label: 'Reportes',     icon: Icons.reportes },
    { id: 'horario',      label: 'Horario',      icon: Icons.horario },
    { id: 'calendario',   label: 'Calendario',   icon: Icons.calendario },
  ]

  const menuDocente = [
    { id: 'dashboard',    label: 'Dashboard',    icon: Icons.dashboard },
    { id: 'notas',        label: 'Notas',        icon: Icons.notas },
    { id: 'asistencia',   label: 'Asistencia',   icon: Icons.asistencia },
    { id: 'anecdotario',  label: 'Anecdotario',  icon: Icons.anecdotario },
    { id: 'permisos',     label: 'Permisos',     icon: Icons.permisos },
    { id: 'solicitudes',  label: 'Solicitudes',  icon: Icons.solicitudes },
    { id: 'reportes',     label: 'Reportes',     icon: Icons.reportes },
    { id: 'horario',      label: 'Horario',      icon: Icons.horario },
    { id: 'calendario',   label: 'Calendario',   icon: Icons.calendario },
  ]

  const menuAlumno = [
    { id: 'mi-perfil',  label: 'Mi Perfil',     icon: Icons.estudiantes },
    { id: 'mis-notas',  label: 'Mis Notas',     icon: Icons.notas },
    { id: 'mis-cobros', label: 'Mis Cobros',    icon: Icons.cobros },
    { id: 'mis-docs',   label: 'Documentos',    icon: Icons.contabilidad },
    { id: 'horario',    label: 'Horario',       icon: Icons.horario },
    { id: 'calendario', label: 'Calendario',    icon: Icons.calendario },
    { id: 'mi-config',  label: 'Configuración', icon: Icons.configuracion },
  ]

  const menuTalentoHumano = [
    { id: 'dashboard',     label: 'Dashboard',     icon: Icons.dashboard },
    { id: 'estudiantes',   label: 'Estudiantes',   icon: Icons.estudiantes },
    { id: 'usuarios',      label: 'Usuarios',      icon: Icons.usuarios },
    { id: 'horario',       label: 'Horario',       icon: Icons.horario },
    { id: 'calendario',    label: 'Calendario',    icon: Icons.calendario },
    { id: 'reportes',      label: 'Reportes',      icon: Icons.reportes },
    { id: 'configuracion', label: 'Configuración', icon: Icons.configuracion },
  ]

  const menuPorRol = {
    admin:               menuAdmin,
    direccion_academica: menuDireccion,
    registro_academico:  menuRegistro,
    recepcion:           menuRecepcion,
    docente:             menuDocente,
    alumno:              menuAlumno,
    talento_humano:      menuTalentoHumano,
  }

  const menu = menuPorRol[perfil?.rol] || menuRecepcion

  // ── Barra inferior móvil ──────────────────────────────────
  const PRIORIDAD_MOVIL = {
    admin:               ['dashboard', 'notas', 'asistencia', 'cobros'],
    direccion_academica: ['dashboard', 'notas', 'asistencia', 'reportes'],
    registro_academico:  ['dashboard', 'notas', 'boletas', 'cobros'],
    recepcion:           ['dashboard', 'estudiantes', 'cobros', 'solicitudes', 'reportes'],
    docente:             ['dashboard', 'notas', 'asistencia', 'horario'],
    alumno:              ['mi-perfil', 'mis-notas', 'horario', 'calendario'],
    talento_humano:      ['dashboard', 'estudiantes', 'usuarios', 'reportes'],
  }
  const prioIds   = PRIORIDAD_MOVIL[perfil?.rol] || menu.slice(0, 4).map(m => m.id)
  const barraItems = menu.filter(m => prioIds.includes(m.id))
  const masItems   = menu.filter(m => !prioIds.includes(m.id))

  // ── Grupos de menú ────────────────────────────────────────
  const GRUPOS = {
    admin:               [{ label: 'Principal', ids: ['dashboard'] }, { label: 'Académico', ids: ['estudiantes','matricula','notas','asistencia','boletas','anecdotario','permisos'] }, { label: 'Administración', ids: ['cobros','contabilidad','solicitudes','reportes','usuarios'] }, { label: 'Planificación', ids: ['horario','calendario','configuracion'] }],
    direccion_academica: [{ label: 'Principal', ids: ['dashboard'] }, { label: 'Académico', ids: ['estudiantes','notas','asistencia','anecdotario','permisos'] }, { label: 'Administración', ids: ['cobros','contabilidad','solicitudes','reportes'] }, { label: 'Planificación', ids: ['horario','calendario'] }],
    registro_academico:  [{ label: 'Principal', ids: ['dashboard'] }, { label: 'Académico', ids: ['estudiantes','matricula','notas','asistencia','boletas'] }, { label: 'Administración', ids: ['cobros','solicitudes','reportes'] }, { label: 'Planificación', ids: ['horario','calendario'] }],
    recepcion:           [{ label: 'Principal', ids: ['dashboard'] }, { label: 'Gestión', ids: ['estudiantes','matricula','cobros','solicitudes','reportes','permisos','calendario'] }],
    docente:             [{ label: 'Principal', ids: ['dashboard'] }, { label: 'Mi trabajo', ids: ['notas','asistencia','anecdotario','permisos'] }, { label: 'Gestión', ids: ['solicitudes','reportes','horario','calendario'] }],
    alumno:              [{ label: 'Mi espacio', ids: ['mi-perfil','mis-notas'] }, { label: 'Colegio', ids: ['horario','calendario'] }],
    talento_humano:      [{ label: 'Principal', ids: ['dashboard'] }, { label: 'Gestión', ids: ['estudiantes','usuarios','reportes'] }, { label: 'Planificación', ids: ['horario','calendario','configuracion'] }],
  }
  const grupos = GRUPOS[perfil?.rol] || [{ label: '', ids: menu.map(m => m.id) }]

  // ── Sidebar content ───────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div className="sb-blob-v" />
      <div className="sb-blob-o" />
      <div className="sb-blob-g" />
      <div className="sb-blob-d" />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '28px 28px' }} />

      {/* Header */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', flexShrink: 0 }}>
            <LogoCBIS size={38} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 5 }}>
              CBIS
              <svg width="13" height="13" viewBox="0 0 28 28" fill="none"><rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/><rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/></svg>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontStyle: 'italic', lineHeight: 1.3 }}>Fe, Innovación, Cultura y Disciplina</div>
          </div>
        </div>
        {isTablet && (
          <button onClick={() => setSidebarOpen(false)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
            {Icons.close}
          </button>
        )}
      </div>

      {/* Nav agrupado */}
      <nav style={{ flex: 1, padding: '8px 8px 4px', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        {grupos.map((grupo, gi) => {
          const itemsGrupo = grupo.ids.map(id => menu.find(m => m.id === id)).filter(Boolean)
          if (!itemsGrupo.length) return null
          return (
            <div key={gi} style={{ marginBottom: 4 }}>
              {grupo.label && (
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '8px 10px 4px' }}>
                  {grupo.label}
                </div>
              )}
              {itemsGrupo.map(item => {
                const activo = pagina === item.id
                return (
                  <button key={item.id} onClick={() => navegar(item.id)} className="nav-btn"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 10, border: 'none', background: activo ? 'rgba(255,255,255,0.11)' : 'transparent', color: activo ? '#fff' : 'rgba(255,255,255,0.48)', fontSize: 12.5, fontWeight: activo ? 700 : 500, cursor: 'pointer', textAlign: 'left', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', transition: 'all 0.15s', marginBottom: 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: activo ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.06)', border: activo ? '1px solid rgba(212,160,23,0.28)' : '1px solid rgba(255,255,255,0.06)', color: activo ? '#D4A017' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>
                      {item.icon}
                    </div>
                    <span style={{ flex: 1, letterSpacing: '-0.1px' }}>{item.label}</span>
                    {activo && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D4A017', flexShrink: 0 }} />}
                  </button>
                )
              })}
              {gi < grupos.length - 1 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 10px' }} />
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', marginBottom: 6, border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #D4A017, #b8860b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.25)', border: '1.5px solid rgba(255,255,255,0.15)' }}>
            {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
              {perfil?.nombre} {perfil?.apellido}
            </div>
            <div style={{ color: '#D4A017', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 1 }}>
              {ROL_LABEL[perfil?.rol] || perfil?.rol}
            </div>
          </div>
        </div>
        <button onClick={() => signOut()} className="logout-btn"
          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icons.logout} Cerrar sesión
        </button>
      </div>
    </>
  )

  const sidebarStyle = {
    width: 228, flexShrink: 0,
    background: 'linear-gradient(180deg, #1a0d30 0%, #2d1554 45%, #5B2D8E 100%)',
    display: 'flex', flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(61,31,97,0.35)',
    position: 'relative', overflow: 'hidden',
  }

  const paginaLabel = menu.find(m => m.id === pagina)?.label
    || [...barraItems, ...masItems].find(m => m.id === pagina)?.label
    || 'Dashboard'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .layout-root { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .nav-btn:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .nav-btn:hover > div:first-child { background: rgba(255,255,255,0.1) !important; }
        .logout-btn:hover { background: rgba(239,68,68,0.12) !important; color: #fca5a5 !important; border-color: rgba(239,68,68,0.2) !important; }
        .bottom-btn:hover { background: rgba(91,45,142,0.08) !important; }
        :root {
          --sat: env(safe-area-inset-top, 0px);
          --sar: env(safe-area-inset-right, 0px);
          --sab: env(safe-area-inset-bottom, 0px);
          --sal: env(safe-area-inset-left, 0px);
        }
        .sb-blob-v { position: absolute; border-radius: 50%; pointer-events: none; width: 280px; height: 280px; background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, transparent 100%); filter: blur(50px); top: -60px; left: -60px; }
        .sb-blob-o { position: absolute; border-radius: 50%; pointer-events: none; width: 180px; height: 180px; background: radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%); filter: blur(40px); top: 120px; right: -40px; }
        .sb-blob-g { position: absolute; border-radius: 50%; pointer-events: none; width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%); filter: blur(45px); bottom: 120px; left: -30px; }
        .sb-blob-d { position: absolute; border-radius: 50%; pointer-events: none; width: 220px; height: 220px; background: radial-gradient(circle, rgba(212,160,23,0.10) 0%, transparent 70%); filter: blur(50px); bottom: -40px; right: -40px; }
      `}</style>

      <div className="layout-root" style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#F4F7FC' }}>

        {/* Desktop sidebar */}
        {isDesktop && (
          <div style={sidebarStyle}>
            <SidebarContent />
          </div>
        )}

        {/* Tablet drawer */}
        {isTablet && (
          <>
            {sidebarOpen && (
              <div onClick={() => setSidebarOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }} />
            )}
            <div style={{ ...sidebarStyle, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease' }}>
              <SidebarContent />
            </div>
          </>
        )}

        {/* Contenido principal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: isMobile ? 'calc(60px + env(safe-area-inset-bottom, 0px))' : 0 }}>

          {/* Topbar sticky */}
          <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
            {isMobile && (
              <div style={{ height: 'env(safe-area-inset-top, 44px)', background: '#1a0d30', minHeight: 44 }} />
            )}
            <div style={{ background: '#fff', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(91,45,142,0.07)', borderBottom: '3px solid transparent', backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(90deg, #7B3FE4, #EA580C, #D4A017, #16A34A)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {isTablet && (
                  <button onClick={() => setSidebarOpen(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: CBIS_COLORS.purpleDark, display: 'flex', padding: 4 }}>
                    {Icons.menu}
                  </button>
                )}
                {isMobile && <LogoCBIS size={28} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 4, height: 20, borderRadius: 2, background: `linear-gradient(180deg, ${CBIS_COLORS.purpleDark}, ${CBIS_COLORS.purple})`, flexShrink: 0 }} />
                  <span style={{ color: CBIS_COLORS.purpleDark, fontWeight: 800, fontSize: isMobile ? 14 : 15, letterSpacing: '-0.3px' }}>
                    {paginaLabel}
                  </span>
                </div>
              </div>
              {!isMobile && (
                <span style={{ color: '#b0a8c0', fontSize: 12, fontWeight: 500 }}>
                  {new Date().toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${CBIS_COLORS.gold}, #b8860b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11 }}>
                    {perfil?.nombre?.charAt(0)}{perfil?.apellido?.charAt(0)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Página */}
          <div style={{ flex: 1, padding: isMobile ? 16 : 28, overflowY: 'auto', paddingBottom: isMobile ? 'calc(76px + env(safe-area-inset-bottom, 0px))' : 28 }}>
            {children}
          </div>
        </div>

        {/* Móvil: barra inferior */}
        {isMobile && (
          <>
            {masOpen && (
              <div onClick={() => setMasOpen(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 199 }} />
            )}
            {masOpen && masItems.length > 0 && (
              <div style={{ position: 'fixed', bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', borderRadius: '16px 16px 0 0', zIndex: 200, padding: '16px 8px 8px', boxShadow: '0 -4px 24px rgba(61,31,97,0.12)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {masItems.map(item => {
                    const activo = pagina === item.id
                    return (
                      <button key={item.id} onClick={() => navegar(item.id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, border: 'none', background: activo ? '#f3eeff' : 'transparent', color: activo ? CBIS_COLORS.purple : '#6b7280', fontFamily: 'inherit', cursor: 'pointer', fontSize: 10, fontWeight: activo ? 700 : 500 }}>
                        <span style={{ color: activo ? CBIS_COLORS.purple : '#9ca3af' }}>{item.icon}</span>
                        {item.label}
                      </button>
                    )
                  })}
                  <button onClick={() => signOut()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 10, border: 'none', background: 'transparent', color: '#ef4444', fontFamily: 'inherit', cursor: 'pointer', fontSize: 10, fontWeight: 500 }}>
                    <span>{Icons.logout}</span>
                    Salir
                  </button>
                </div>
              </div>
            )}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', zIndex: 200, boxShadow: '0 -2px 16px rgba(61,31,97,0.1)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div style={{ display: 'flex', width: '100%', height: 60 }}>
                {barraItems.map(item => {
                  const activo = pagina === item.id
                  return (
                    <button key={item.id} onClick={() => navegar(item.id)} className="bottom-btn"
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
                      {activo && <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 3, borderRadius: '0 0 4px 4px', background: CBIS_COLORS.purple }} />}
                      <span style={{ color: activo ? CBIS_COLORS.purple : '#9ca3af', transition: 'color 0.15s' }}>{item.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: activo ? 700 : 500, color: activo ? CBIS_COLORS.purple : '#9ca3af', transition: 'color 0.15s' }}>{item.label}</span>
                    </button>
                  )
                })}
                {masItems.length > 0 && (
                  <button onClick={() => setMasOpen(v => !v)} className="bottom-btn"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%', border: 'none', background: masOpen ? '#f3eeff' : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span style={{ color: masOpen ? CBIS_COLORS.purple : '#9ca3af' }}>{Icons.mas}</span>
                    <span style={{ fontSize: 10, fontWeight: masOpen ? 700 : 500, color: masOpen ? CBIS_COLORS.purple : '#9ca3af' }}>Más</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}