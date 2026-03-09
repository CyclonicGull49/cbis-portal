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

function DashboardHome() {
  const { perfil } = useAuth()
  const [stats, setStats] = useState({
    totalEstudiantes: 0, estudiantesActivos: 0,
    cobradoHoy: 0, totalMes: 0,
    cobrosPendientes: 0, cobrosVencidos: 0,
    totalPendiente: 0, pagosRecientes: []
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
    { icon: '🎓', label: 'Estudiantes activos', val: stats.estudiantesActivos, sub: `de ${stats.totalEstudiantes} total`, color: '#5B2D8E', bg: '#f3eeff' },
    { icon: '💰', label: 'Cobrado hoy', val: `$${stats.cobradoHoy.toFixed(2)}`, sub: 'ingresos del día', color: '#16a34a', bg: '#f0fdf4' },
    { icon: '📅', label: 'Cobrado este mes', val: `$${stats.totalMes.toFixed(2)}`, sub: 'ingresos del mes', color: '#D4A017', bg: '#fffbeb' },
    { icon: '⏳', label: 'Pendiente de cobro', val: `$${stats.totalPendiente.toFixed(2)}`, sub: `${stats.cobrosPendientes} cobros`, color: '#E8573A', bg: '#fff4f0' },
    { icon: '🚨', label: 'Cobros vencidos', val: stats.cobrosVencidos, sub: 'requieren atención', color: '#dc2626', bg: '#fff0f0' },
    { icon: '↩️', label: 'Anulado este mes', val: `$${stats.anuladosMes?.toFixed(2) || '0.00'}`, sub: 'no incluido en total', color: '#888', bg: '#f5f5f5' },
  ]

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
          Bienvenido, {perfil?.nombre}! 👋
        </h1>
        <p style={{ color: '#888', fontSize: 13 }}>
          {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 16, padding: '20px 22px',
            boxShadow: '0 2px 16px rgba(91,45,142,0.08)',
            borderTop: `4px solid ${k.color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: k.color, marginBottom: 4 }}>
                  {loading ? '...' : k.val}
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{k.sub}</div>
              </div>
              <div style={{ background: k.bg, borderRadius: 12, padding: '10px 12px', fontSize: 22 }}>
                {k.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(91,45,142,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#3d1f61', fontSize: 15, fontWeight: 800 }}>🧾 Últimos pagos registrados</h2>
          <span style={{ fontSize: 12, color: '#888' }}>{stats.pagosRecientes.length} registros</span>
        </div>
        {loading ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Cargando...</p>
        ) : stats.pagosRecientes.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>No hay pagos registrados aún</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#faf8ff' }}>
                {['Estudiante', 'Concepto', 'Mes', 'Monto', 'Fecha'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.pagosRecientes.map(p => (
                <tr key={p.id} style={{ borderTop: '1px solid #f3eeff' }}>
                  <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: '#3d1f61' }}>
                    {p.estudiantes?.nombre} {p.estudiantes?.apellido}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#555' }}>
                    {p.cobros?.conceptos_cobro?.nombre || '—'}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: '#555' }}>
                    {p.cobros?.mes || '—'}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 800, color: '#16a34a' }}>
                    {'$'}{parseFloat(p.monto_pagado).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 20px', fontSize: 12, color: '#aaa' }}>
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
  const [pagina, setPagina] = useState('dashboard')

  function renderPagina() {
    switch (pagina) {
      case 'reportes': return <Reportes />
      case 'dashboard': return <DashboardHome />
      case 'estudiantes': return <Estudiantes />
      case 'cobros': return <Cobros />
      case 'contabilidad': return <Contabilidad />
      case 'usuarios': return <Usuarios />
      case 'configuracion': return <Configuracion />
      case 'matricula': return <Matricula />
      default: return <DashboardHome />
      
    }
  }

  return (
    <Layout pagina={pagina} setPagina={setPagina}>
      {renderPagina()}
    </Layout>
  )
}