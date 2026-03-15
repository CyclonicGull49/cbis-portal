import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import Estudiantes from './Estudiantes'
import Cobros from './Cobros'
import Contabilidad from './Contabilidad'
import Usuarios from './Usuarios'
import Configuracion from './Configuracion'
import Matricula from './Matricula'
import Reportes from './Reportes'
import Notas from './Notas'
import Boletas from './Boletas'
import PerfilAlumno from './PerfilAlumno'

// KPI icon SVGs
const KpiIcons = {
  estudiantes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  cobradoHoy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  ),
  mes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  pendiente: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  vencidos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  anulado: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
}

// KPI icon SVGs adicionales
const IconNotas = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IconGrados = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)

const NIVEL_COLOR = {
  primera_infancia: { bg: '#e0f7f6', color: '#0e9490', label: 'Primera Infancia' },
  primaria:         { bg: '#fef9c3', color: '#a16207', label: 'Primaria' },
  secundaria:       { bg: '#fff0e6', color: '#c2410c', label: 'Secundaria' },
  bachillerato:     { bg: '#f3eeff', color: '#5B2D8E', label: 'Bachillerato' },
}

function DashboardHome() {
  const { perfil } = useAuth()
  const rol = perfil?.rol

  const verFinanzas  = ['admin', 'recepcion', 'direccion_academica'].includes(rol)
  const verAcademico = ['admin', 'direccion_academica', 'registro_academico'].includes(rol)
  const verDocente   = rol === 'docente'

  const [stats, setStats] = useState({
    totalEstudiantes: 0, estudiantesActivos: 0,
    cobradoHoy: 0, totalMes: 0,
    cobrosPendientes: 0, cobrosVencidos: 0,
    totalPendiente: 0, anuladosMes: 0,
    pagosRecientes: [], porNivel: [], maxNivel: 1,
    notasRegistradas: 0, totalMaterias: 0,
    docenteGrado: null, docenteMaterias: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarStats() }, [])

  async function cargarStats() {
    setLoading(true)
    const year = new Date().getFullYear()
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const hoy = new Date().toISOString().split('T')[0]

    const promises = [
      supabase.from('estudiantes').select('id, estado, grados(nivel)'),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', hoy).neq('anulado', true),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', inicioMes).neq('anulado', true),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', inicioMes).eq('anulado', true),
      supabase.from('cobros').select('id, estado, monto, fecha_vencimiento').neq('estado', 'anulado'),
      supabase.from('pagos').select('id, monto_pagado, fecha_pago, estudiantes(nombre, apellido), cobros(mes, conceptos_cobro(nombre))').neq('anulado', true).order('fecha_pago', { ascending: false }).limit(6),
      supabase.from('notas').select('id', { count: 'exact', head: true }).eq('año_escolar', year),
      supabase.from('materia_grado').select('id', { count: 'exact', head: true }),
    ]

    if (verDocente) {
      promises.push(
        supabase.from('perfiles').select('grado_id, grados(nombre, nivel)').eq('id', perfil.id).single(),
        supabase.from('asignaciones').select('id', { count: 'exact', head: true }).eq('docente_id', perfil.id).eq('año_escolar', year),
      )
    }

    const results = await Promise.all(promises)
    const [
      { data: estudiantes },
      { data: pagosHoy },
      { data: pagosMes },
      { data: pagosAnulados },
      { data: cobros },
      { data: pagosRecientes },
      { count: notasCount },
      { count: materiasGradoCount },
    ] = results

    const nivelMap = {}
    for (const e of (estudiantes || [])) {
      if (e.estado !== 'activo') continue
      const n = e.grados?.nivel || 'otro'
      nivelMap[n] = (nivelMap[n] || 0) + 1
    }
    const nivelOrder = ['primera_infancia', 'primaria', 'secundaria', 'bachillerato']
    const porNivel = Object.entries(nivelMap)
      .map(([nivel, count]) => ({ nivel, count }))
      .sort((a, b) => nivelOrder.indexOf(a.nivel) - nivelOrder.indexOf(b.nivel))
    const maxNivel = Math.max(...porNivel.map(p => p.count), 1)

    let docenteInfo = {}
    if (verDocente && results[8]) {
      const { data: dp } = results[8]
      const { count: matCount } = results[9]
      docenteInfo = { docenteGrado: dp?.grados, docenteMaterias: matCount || 0 }
    }

    setStats({
      totalEstudiantes: estudiantes?.length || 0,
      estudiantesActivos: (estudiantes || []).filter(e => e.estado === 'activo').length,
      cobradoHoy: pagosHoy?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      totalMes: pagosMes?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      anuladosMes: pagosAnulados?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      cobrosPendientes: cobros?.filter(c => c.estado === 'pendiente').length || 0,
      cobrosVencidos: cobros?.filter(c => c.estado === 'pendiente' && c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date()).length || 0,
      totalPendiente: cobros?.filter(c => c.estado === 'pendiente').reduce((a, c) => a + parseFloat(c.monto), 0) || 0,
      pagosRecientes: pagosRecientes || [],
      porNivel, maxNivel,
      notasRegistradas: notasCount || 0,
      totalMaterias: materiasGradoCount || 0,
      ...docenteInfo,
    })
    setLoading(false)
  }

  const Skeleton = () => <span style={{ display: 'inline-block', width: 60, height: 22, borderRadius: 6, background: '#f0ebfa' }} />

  const kpisFinanzas = [
    { icon: KpiIcons.cobradoHoy, label: 'Cobrado hoy',        val: `$${stats.cobradoHoy.toFixed(2)}`,     sub: 'ingresos del día',                         color: '#16a34a', bg: '#f0fdf4' },
    { icon: KpiIcons.mes,        label: 'Cobrado este mes',   val: `$${stats.totalMes.toFixed(2)}`,       sub: 'ingresos del mes',                         color: '#D4A017', bg: '#fffbeb' },
    { icon: KpiIcons.pendiente,  label: 'Pendiente de cobro', val: `$${stats.totalPendiente.toFixed(2)}`, sub: `${stats.cobrosPendientes} cobros pendientes`, color: '#E8573A', bg: '#fff4f0' },
    { icon: KpiIcons.vencidos,   label: 'Cobros vencidos',    val: stats.cobrosVencidos,                  sub: 'requieren atención',                       color: '#dc2626', bg: '#fff0f0' },
  ]

  return (
    <div style={{ maxWidth: '100%', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Bienvenido, {perfil?.nombre} 👋
        </h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Fila 1: Estudiantes + distribución por nivel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', borderTop: '4px solid #5B2D8E', minWidth: 180 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estudiantes activos</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#5B2D8E', marginBottom: 4, letterSpacing: '-1px' }}>
            {loading ? <Skeleton /> : stats.estudiantesActivos}
          </div>
          <div style={{ fontSize: 11, color: '#c4bad4', fontWeight: 500 }}>de {stats.totalEstudiantes} total</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Distribución por nivel</div>
          {loading ? <div style={{ color: '#c4bad4', fontSize: 13 }}>Cargando...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.porNivel.map(({ nivel, count }) => {
                const cfg = NIVEL_COLOR[nivel] || { bg: '#f3f4f6', color: '#6b7280', label: nivel }
                const pct = Math.round((count / stats.maxNivel) * 100)
                return (
                  <div key={nivel} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 10px', borderRadius: 20, minWidth: 130, textAlign: 'center' }}>{cfg.label}</span>
                    <div style={{ flex: 1, background: '#f3eeff', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 100, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#3d1f61', minWidth: 28, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
              {!stats.porNivel.length && <div style={{ color: '#c4bad4', fontSize: 13 }}>Sin estudiantes activos</div>}
            </div>
          )}
        </div>
      </div>

      {/* Fila 2: KPIs finanzas */}
      {verFinanzas && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 16 }}>
          {kpisFinanzas.map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', borderTop: `4px solid ${k.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: k.color, marginBottom: 4, letterSpacing: '-0.5px', lineHeight: 1 }}>
                    {loading ? <Skeleton /> : k.val}
                  </div>
                  <div style={{ fontSize: 11, color: '#c4bad4', fontWeight: 500 }}>{k.sub}</div>
                </div>
                <div style={{ background: k.bg, borderRadius: 12, padding: '10px', color: k.color, flexShrink: 0, marginLeft: 12 }}>{k.icon}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fila 3: KPIs académicos */}
      {verAcademico && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          {[
            { icon: IconNotas,  label: 'Notas registradas',            val: stats.notasRegistradas.toLocaleString(), sub: `año escolar ${new Date().getFullYear()}`, color: '#0e9490', bg: '#e0f7f6' },
            { icon: IconGrados, label: 'Combinaciones materia-grado',  val: stats.totalMaterias,                      sub: 'en el sistema',                          color: '#a16207', bg: '#fef9c3' },
          ].map((k, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', borderTop: `4px solid ${k.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: k.color, marginBottom: 4 }}>{loading ? <Skeleton /> : k.val}</div>
                  <div style={{ fontSize: 11, color: '#c4bad4', fontWeight: 500 }}>{k.sub}</div>
                </div>
                <div style={{ background: k.bg, borderRadius: 12, padding: '10px', color: k.color, flexShrink: 0, marginLeft: 12 }}>{k.icon}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card docente */}
      {verDocente && stats.docenteGrado && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', marginBottom: 16, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tu grado</div>
            <span style={{ ...NIVEL_COLOR[stats.docenteGrado.nivel], padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{stats.docenteGrado.nombre}</span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Materias asignadas</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#5B2D8E' }}>{stats.docenteMaterias}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notas registradas</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0e9490' }}>{loading ? '...' : stats.notasRegistradas.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Tabla pagos recientes */}
      {verFinanzas && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: '#3d1f61', fontSize: 14, fontWeight: 800, marginBottom: 2 }}>Últimos pagos registrados</h2>
              <p style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 500 }}>Actividad más reciente del sistema</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', background: '#f3eeff', padding: '4px 10px', borderRadius: 100 }}>{stats.pagosRecientes.length} registros</span>
          </div>
          {loading ? (
            <p style={{ color: '#c4bad4', textAlign: 'center', padding: 48, fontSize: 13 }}>Cargando...</p>
          ) : !stats.pagosRecientes.length ? (
            <p style={{ color: '#c4bad4', textAlign: 'center', padding: 48, fontSize: 13 }}>No hay pagos registrados aún</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf8ff' }}>
                  {['Estudiante', 'Concepto', 'Mes', 'Monto', 'Fecha'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.pagosRecientes.map((p, idx) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#f3eeff', color: '#5B2D8E', fontSize: 10, fontWeight: 800, marginRight: 10, flexShrink: 0 }}>
                        {p.estudiantes?.nombre?.charAt(0)}{p.estudiantes?.apellido?.charAt(0)}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61' }}>{p.estudiantes?.nombre} {p.estudiantes?.apellido}</span>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#6b7280' }}>{p.cobros?.conceptos_cobro?.nombre || '—'}</td>
                    <td style={{ padding: '13px 20px', fontSize: 13, color: '#6b7280' }}>{p.cobros?.mes || '—'}</td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: 6 }}>${parseFloat(p.monto_pagado).toFixed(2)}</span>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 12, color: '#b0a8c0', fontWeight: 500 }}>{new Date(p.fecha_pago).toLocaleDateString('es-SV')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Fallback */}
      {!verFinanzas && !verAcademico && !verDocente && (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏫</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#3d1f61' }}>Colegio Bautista Internacional de Sonsonate</div>
          <div style={{ fontSize: 13, color: '#b0a8c0', marginTop: 6 }}>Fe, Cultura, Innovación y Disciplina</div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { perfil } = useAuth()
  const esAlumno = perfil?.rol === 'alumno'
  const [pagina, setPagina] = useState(esAlumno ? 'mi-perfil' : 'dashboard')

  function renderPagina() {
    if (pagina.startsWith('perfil-estudiante-')) {
      const id = parseInt(pagina.replace('perfil-estudiante-', ''))
      return <Estudiantes estudianteIdInicial={id} onVolver={() => setPagina('notas')} />
    }
    switch (pagina) {
      case 'reportes':      return <Reportes />
      case 'boletas':       return <Boletas />
      case 'dashboard':     return <DashboardHome />
      case 'estudiantes':   return <Estudiantes />
      case 'cobros':        return <Cobros />
      case 'notas':         return <Notas onVerEstudiante={id => setPagina(`perfil-estudiante-${id}`)} />
      case 'contabilidad':  return <Contabilidad />
      case 'usuarios':      return <Usuarios />
      case 'configuracion': return <Configuracion />
      case 'matricula':     return <Matricula />
      case 'mi-perfil':     return <PerfilAlumno seccion="perfil" />
      case 'mis-cobros':    return <PerfilAlumno seccion="cobros" />
      case 'mis-docs':      return <PerfilAlumno seccion="docs" />
      case 'mis-notas':     return <PerfilAlumno seccion="notas" />
      case 'mi-config':     return <PerfilAlumno seccion="config" />
      default:              return esAlumno ? <PerfilAlumno seccion="perfil" /> : <DashboardHome />
    }
  }

  return (
    <Layout pagina={pagina} setPagina={setPagina}>
      {renderPagina()}
    </Layout>
  )
}