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

function DashboardHome() {
  const { perfil } = useAuth()
  const [stats, setStats] = useState({
    totalEstudiantes: 0, estudiantesActivos: 0,
    cobradoHoy: 0, totalMes: 0,
    cobrosPendientes: 0, cobrosVencidos: 0,
    totalPendiente: 0, anuladosMes: 0,
    pagosRecientes: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarStats() }, [])

  async function cargarStats() {
    setLoading(true)
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const hoy = new Date().toISOString().split('T')[0]

    const [
      { data: estudiantes },
      { data: cobros },
      { data: pagosHoy },
      { data: pagosMes },
      { data: pagosAnulados },
      { data: pagosRecientes }
    ] = await Promise.all([
      supabase.from('estudiantes').select('id, estado'),
      supabase.from('cobros').select('id, estado, monto, fecha_vencimiento').neq('estado', 'anulado'),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', hoy).neq('anulado', true),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', inicioMes).neq('anulado', true),
      supabase.from('pagos').select('monto_pagado').gte('fecha_pago', inicioMes).eq('anulado', true),
      supabase.from('pagos').select(`
        id, monto_pagado, fecha_pago,
        estudiantes(nombre, apellido),
        cobros(mes, conceptos_cobro(nombre))
      `).neq('anulado', true).order('fecha_pago', { ascending: false }).limit(5)
    ])

    setStats({
      anuladosMes: pagosAnulados?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      totalEstudiantes: estudiantes?.length || 0,
      estudiantesActivos: estudiantes?.filter(e => e.estado === 'activo').length || 0,
      cobradoHoy: pagosHoy?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      totalMes: pagosMes?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0,
      cobrosPendientes: cobros?.filter(c => c.estado === 'pendiente').length || 0,
      cobrosVencidos: cobros?.filter(c => c.estado === 'pendiente' && c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date()).length || 0,
      totalPendiente: cobros?.filter(c => c.estado === 'pendiente').reduce((a, c) => a + parseFloat(c.monto), 0) || 0,
      pagosRecientes: pagosRecientes || []
    })
    setLoading(false)
  }

  const kpis = [
    {
      icon: KpiIcons.estudiantes,
      label: 'Estudiantes activos',
      val: stats.estudiantesActivos,
      sub: `de ${stats.totalEstudiantes} total`,
      color: '#5B2D8E', bg: '#f3eeff',
    },
    {
      icon: KpiIcons.cobradoHoy,
      label: 'Cobrado hoy',
      val: `$${stats.cobradoHoy.toFixed(2)}`,
      sub: 'ingresos del día',
      color: '#16a34a', bg: '#f0fdf4',
    },
    {
      icon: KpiIcons.mes,
      label: 'Cobrado este mes',
      val: `$${stats.totalMes.toFixed(2)}`,
      sub: 'ingresos del mes',
      color: '#D4A017', bg: '#fffbeb',
    },
    {
      icon: KpiIcons.pendiente,
      label: 'Pendiente de cobro',
      val: `$${stats.totalPendiente.toFixed(2)}`,
      sub: `${stats.cobrosPendientes} cobros pendientes`,
      color: '#E8573A', bg: '#fff4f0',
    },
    {
      icon: KpiIcons.vencidos,
      label: 'Cobros vencidos',
      val: stats.cobrosVencidos,
      sub: 'requieren atención',
      color: '#dc2626', bg: '#fff0f0',
    },
    {
      icon: KpiIcons.anulado,
      label: 'Anulado este mes',
      val: `$${stats.anuladosMes?.toFixed(2) || '0.00'}`,
      sub: 'no incluido en total',
      color: '#9ca3af', bg: '#f9fafb',
    },
  ]

  return (
    <div style={{ maxWidth: '100%', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Bienvenido, {perfil?.nombre} 👋
        </h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            background: '#fff',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: '0 2px 16px rgba(61,31,97,0.07)',
            borderTop: `4px solid ${k.color}`,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: k.color, marginBottom: 4, letterSpacing: '-0.5px', lineHeight: 1 }}>
                  {loading ? (
                    <span style={{ display: 'inline-block', width: 70, height: 26, borderRadius: 6, background: '#f3eeff', animation: 'pulse 1.5s infinite' }} />
                  ) : k.val}
                </div>
                <div style={{ fontSize: 11, color: '#c4bad4', fontWeight: 500 }}>{k.sub}</div>
              </div>
              <div style={{
                background: k.bg,
                borderRadius: 12, padding: '10px',
                color: k.color, flexShrink: 0, marginLeft: 12,
              }}>
                {k.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de pagos recientes */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(61,31,97,0.07)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f3eeff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ color: '#3d1f61', fontSize: 14, fontWeight: 800, marginBottom: 2, letterSpacing: '-0.2px' }}>
              Últimos pagos registrados
            </h2>
            <p style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 500 }}>Actividad más reciente del sistema</p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#5B2D8E',
            background: '#f3eeff', padding: '4px 10px', borderRadius: 100,
          }}>
            {stats.pagosRecientes.length} registros
          </span>
        </div>

        {loading ? (
          <p style={{ color: '#c4bad4', textAlign: 'center', padding: 48, fontSize: 13, fontWeight: 500 }}>Cargando...</p>
        ) : stats.pagosRecientes.length === 0 ? (
          <p style={{ color: '#c4bad4', textAlign: 'center', padding: 48, fontSize: 13, fontWeight: 500 }}>No hay pagos registrados aún</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
            <thead>
              <tr style={{ background: '#faf8ff' }}>
                {['Estudiante', 'Concepto', 'Mes', 'Monto', 'Fecha'].map(h => (
                  <th key={h} style={{
                    padding: '10px 20px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: '#5B2D8E',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.pagosRecientes.map((p, idx) => (
                <tr key={p.id} style={{
                  borderTop: '1px solid #f3eeff',
                  background: idx % 2 === 0 ? '#fff' : '#fdfcff',
                }}>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#f3eeff', color: '#5B2D8E',
                      fontSize: 10, fontWeight: 800, marginRight: 10,
                      flexShrink: 0,
                    }}>
                      {p.estudiantes?.nombre?.charAt(0)}{p.estudiantes?.apellido?.charAt(0)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61' }}>
                      {p.estudiantes?.nombre} {p.estudiantes?.apellido}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: '#6b7280' }}>
                    {p.cobros?.conceptos_cobro?.nombre || '—'}
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: '#6b7280' }}>
                    {p.cobros?.mes || '—'}
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: '#16a34a',
                      background: '#f0fdf4', padding: '3px 8px', borderRadius: 6,
                    }}>
                      ${parseFloat(p.monto_pagado).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 12, color: '#b0a8c0', fontWeight: 500 }}>
                    {new Date(p.fecha_pago).toLocaleDateString('es-SV')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { perfil } = useAuth()
  const esAlumno = perfil?.rol === 'alumno'
  const [pagina, setPagina] = useState(esAlumno ? 'mi-perfil' : 'dashboard')

  function renderPagina() {
    switch (pagina) {
      case 'reportes':      return <Reportes />
      case 'dashboard':     return <DashboardHome />
      case 'estudiantes':   return <Estudiantes />
      case 'cobros':        return <Cobros />
      case 'notas':         return <Notas />
      case 'contabilidad':  return <Contabilidad />
      case 'usuarios':      return <Usuarios />
      case 'configuracion': return <Configuracion />
      case 'matricula':     return <Matricula />
      // Vistas alumno
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