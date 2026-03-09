import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Contabilidad() {
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroYear, setFiltroYear] = useState(new Date().getFullYear())

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  useEffect(() => { cargarPagos() }, [])

  async function cargarPagos() {
    setLoading(true)
    const { data } = await supabase
      .from('pagos')
      .select(`
        *,
        estudiantes(nombre, apellido, grados(nombre)),
        cobros(mes, year_escolar, conceptos_cobro(nombre, tipo))
      `)
      .eq('anulado', false)
      .order('fecha_pago', { ascending: false })
    setPagos(data || [])
    setLoading(false)
  }

  const pagosFiltrados = pagos.filter(p => {
    const mes = p.cobros?.mes
    const year = p.cobros?.year_escolar
    if (filtroMes && mes !== filtroMes) return false
    if (filtroYear && year !== parseInt(filtroYear)) return false
    return true
  })

  const totalFiltrado = pagosFiltrados.reduce((a, p) => a + parseFloat(p.monto_pagado), 0)

  // Agrupar por concepto
  const porConcepto = pagosFiltrados.reduce((acc, p) => {
    const tipo = p.cobros?.conceptos_cobro?.tipo || 'otro'
    acc[tipo] = (acc[tipo] || 0) + parseFloat(p.monto_pagado)
    return acc
  }, {})

  // Agrupar por mes
  const porMes = pagos.reduce((acc, p) => {
    const mes = p.cobros?.mes || 'Sin mes'
    acc[mes] = (acc[mes] || 0) + parseFloat(p.monto_pagado)
    return acc
  }, {})

  const tipoLabel = {
    matricula: '📋 Matrícula',
    mensualidad: '📅 Mensualidad',
    constancia: '📄 Constancia',
    excursion: '🎒 Excursión',
    otro: '📦 Otro',
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#5B2D8E', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>📋 Contabilidad</h1>
        <p style={{ color: '#888', fontSize: 13 }}>Historial de pagos e ingresos</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={s.filtro} value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {meses.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={s.filtro} value={filtroYear} onChange={e => setFiltroYear(e.target.value)}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ ...s.kpi, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>💰</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginBottom: 4 }}>${totalFiltrado.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Total ingresado</div>
        </div>
        <div style={{ ...s.kpi, borderLeft: '4px solid #7B4DB8' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🧾</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#7B4DB8', marginBottom: 4 }}>{pagosFiltrados.length}</div>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Pagos registrados</div>
        </div>
      </div>

      {/* Desglose por tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={s.card}>
          <h2 style={s.cardTitle}>Ingresos por tipo de cobro</h2>
          {Object.entries(porConcepto).length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>Sin datos</p>
          ) : (
            Object.entries(porConcepto).map(([tipo, monto]) => (
              <div key={tipo} style={s.conceptoRow}>
                <span style={{ fontSize: 13, color: '#555' }}>{tipoLabel[tipo] || tipo}</span>
                <span style={{ fontWeight: 800, color: '#5B2D8E' }}>${monto.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>Ingresos por mes</h2>
          {Object.entries(porMes).length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>Sin datos</p>
          ) : (
            Object.entries(porMes).map(([mes, monto]) => (
              <div key={mes} style={s.conceptoRow}>
                <span style={{ fontSize: 13, color: '#555' }}>📅 {mes}</span>
                <span style={{ fontWeight: 800, color: '#5B2D8E' }}>${monto.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historial de pagos */}
      <div style={s.card}>
        <h2 style={s.cardTitle}>Historial de pagos</h2>
        {loading ? (
          <p style={{ color: '#aaa', padding: 20, textAlign: 'center' }}>Cargando...</p>
        ) : pagosFiltrados.length === 0 ? (
          <p style={{ color: '#aaa', padding: 20, textAlign: 'center' }}>No hay pagos registrados</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Fecha', 'Estudiante', 'Grado', 'Concepto', 'Mes', 'Método', 'Monto'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.map(p => (
                <tr key={p.id} style={s.tr}>
                  <td style={s.td}>{new Date(p.fecha_pago).toLocaleDateString('es-SV')}</td>
                  <td style={s.td}>{p.estudiantes?.nombre} {p.estudiantes?.apellido}</td>
                  <td style={s.td}><span style={s.gradoBadge}>{p.estudiantes?.grados?.nombre || '—'}</span></td>
                  <td style={s.td}>{p.cobros?.conceptos_cobro?.nombre || '—'}</td>
                  <td style={s.td}>{p.cobros?.mes || '—'}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: '#eff6ff', color: '#5B2D8E' }}>
                      {p.metodo}
                    </span>
                  </td>
                  <td style={s.td}><b style={{ color: '#16a34a' }}>${parseFloat(p.monto_pagado).toFixed(2)}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 20, marginBottom: 0 },
  cardTitle: { color: '#5B2D8E', fontSize: 14, fontWeight: 800, marginBottom: 16 },
  kpi: { background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  filtro: { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #dde3ee', fontSize: 14, background: '#fff', color: '#333', cursor: 'pointer' },
  conceptoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f4ff' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #f0f4ff' },
  tr: { borderBottom: '1px solid #f8faff' },
  td: { padding: '10px 14px', fontSize: 13, color: '#333' },
  gradoBadge: { background: '#eff6ff', color: '#5B2D8E', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
}