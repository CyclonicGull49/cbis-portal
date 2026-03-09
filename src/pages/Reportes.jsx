import { useState } from 'react'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../context/AuthContext'

const PURPLE = '#5B2D8E'

export default function Reportes() {
  const [loading, setLoading] = useState(null)
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [buscando, setBuscando] = useState(false)
  const { perfil } = useAuth()
  const esRecepcion = perfil?.rol === 'recepcion'

  function cabeceraPDF(doc, titulo, subtitulo) {
    doc.setFillColor(61, 31, 97)
    doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CBIS+', 14, 12)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Colegio Bautista Internacional de Sonsonate', 14, 19)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(61, 31, 97)
    doc.text(titulo, 14, 38)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(subtitulo, 14, 44)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-SV')} ${new Date().toLocaleTimeString('es-SV')}`, 14, 50)
    doc.setDrawColor(91, 45, 142)
    doc.setLineWidth(0.5)
    doc.line(14, 54, 196, 54)
    return 62
  }

  // REPORTE 1: Pagos del día
  async function reportePagosHoy() {
    setLoading('hoy')
    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('pagos')
      .select(`monto_pagado, metodo, fecha_pago,
        estudiantes(nombre, apellido, grados(nombre)),
        cobros(mes, conceptos_cobro(nombre))`)
      .gte('fecha_pago', hoy)
      .neq('anulado', true)
      .order('fecha_pago', { ascending: false })

    const doc = new jsPDF()
    const startY = cabeceraPDF(doc, 'Reporte de Pagos del Día', `Fecha: ${new Date().toLocaleDateString('es-SV')}`)
    const total = data?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0

    doc.setTextColor(91, 45, 142)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total cobrado hoy: $${total.toFixed(2)}`, 14, startY)
    doc.text(`Pagos registrados: ${data?.length || 0}`, 120, startY)

    autoTable(doc, {
      startY: startY + 8,
      head: [['Estudiante', 'Grado', 'Concepto', 'Mes', 'Método', 'Monto']],
      body: data?.map(p => [
        `${p.estudiantes?.nombre} ${p.estudiantes?.apellido}`,
        p.estudiantes?.grados?.nombre || '—',
        p.cobros?.conceptos_cobro?.nombre || '—',
        p.cobros?.mes || '—',
        p.metodo || '—',
        `$${parseFloat(p.monto_pagado).toFixed(2)}`
      ]) || [],
      headStyles: { fillColor: [61, 31, 97], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      foot: [['', '', '', '', 'TOTAL', `$${total.toFixed(2)}`]],
      footStyles: { fillColor: [243, 238, 255], textColor: [61, 31, 97], fontStyle: 'bold' },
    })

    doc.save(`pagos-dia-${hoy}.pdf`)
    setLoading(null)
  }

  // REPORTE 2: Pagos del mes
  async function reportePagosMes() {
    setLoading('mes')
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString()
    const { data } = await supabase.from('pagos')
      .select(`monto_pagado, metodo, fecha_pago,
        estudiantes(nombre, apellido, grados(nombre)),
        cobros(mes, conceptos_cobro(nombre))`)
      .gte('fecha_pago', inicioMes)
      .neq('anulado', true)
      .order('fecha_pago', { ascending: false })

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    const nombreMes = meses[ahora.getMonth()]
    const doc = new jsPDF()
    const startY = cabeceraPDF(doc, `Reporte de Pagos — ${nombreMes} ${ahora.getFullYear()}`, `Mes en curso`)
    const total = data?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0

    doc.setTextColor(91, 45, 142)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total del mes: $${total.toFixed(2)}`, 14, startY)
    doc.text(`Pagos: ${data?.length || 0}`, 120, startY)

    autoTable(doc, {
      startY: startY + 8,
      head: [['Fecha', 'Estudiante', 'Grado', 'Concepto', 'Método', 'Monto']],
      body: data?.map(p => [
        new Date(p.fecha_pago).toLocaleDateString('es-SV'),
        `${p.estudiantes?.nombre} ${p.estudiantes?.apellido}`,
        p.estudiantes?.grados?.nombre || '—',
        p.cobros?.conceptos_cobro?.nombre || '—',
        p.metodo || '—',
        `$${parseFloat(p.monto_pagado).toFixed(2)}`
      ]) || [],
      headStyles: { fillColor: [61, 31, 97], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      foot: [['', '', '', '', 'TOTAL', `$${total.toFixed(2)}`]],
      footStyles: { fillColor: [243, 238, 255], textColor: [61, 31, 97], fontStyle: 'bold' },
    })

    doc.save(`pagos-${nombreMes.toLowerCase()}-${ahora.getFullYear()}.pdf`)
    setLoading(null)
  }

  // REPORTE 3: Cobros pendientes/vencidos
  async function reportePendientes() {
    setLoading('pendientes')
    const { data } = await supabase.from('cobros')
      .select(`monto, mes, fecha_vencimiento, estado,
        estudiantes(nombre, apellido, grados(nombre)),
        conceptos_cobro(nombre)`)
      .eq('estado', 'pendiente')
      .order('fecha_vencimiento', { ascending: true })

    const hoy = new Date()
    const doc = new jsPDF()
    const startY = cabeceraPDF(doc, 'Reporte de Cobros Pendientes', `Al ${hoy.toLocaleDateString('es-SV')}`)
    const total = data?.reduce((a, c) => a + parseFloat(c.monto), 0) || 0
    const vencidos = data?.filter(c => c.fecha_vencimiento && new Date(c.fecha_vencimiento) < hoy) || []

    doc.setTextColor(91, 45, 142)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total pendiente: $${total.toFixed(2)}`, 14, startY)
    doc.text(`Vencidos: ${vencidos.length}`, 120, startY)

    autoTable(doc, {
      startY: startY + 8,
      head: [['Estudiante', 'Grado', 'Concepto', 'Mes', 'Vencimiento', 'Monto', 'Estado']],
      body: data?.map(c => {
        const vencido = c.fecha_vencimiento && new Date(c.fecha_vencimiento) < hoy
        return [
          `${c.estudiantes?.nombre} ${c.estudiantes?.apellido}`,
          c.estudiantes?.grados?.nombre || '—',
          c.conceptos_cobro?.nombre || '—',
          c.mes || '—',
          c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-SV') : '—',
          `$${parseFloat(c.monto).toFixed(2)}`,
          vencido ? 'VENCIDO' : 'Pendiente'
        ]
      }) || [],
      headStyles: { fillColor: [61, 31, 97], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.cell.raw === 'VENCIDO') {
          data.cell.styles.textColor = [220, 38, 38]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      foot: [['', '', '', '', '', 'TOTAL', `$${total.toFixed(2)}`]],
      footStyles: { fillColor: [243, 238, 255], textColor: [61, 31, 97], fontStyle: 'bold' },
    })

    doc.save(`cobros-pendientes-${hoy.toISOString().split('T')[0]}.pdf`)
    setLoading(null)
  }

  // REPORTE 4: Estado de cuenta por estudiante
  async function buscarEstudiantes(q) {
    setBusquedaEstudiante(q)
    if (q.length < 2) { setEstudiantes([]); return }
    setBuscando(true)
    const { data } = await supabase.from('estudiantes')
      .select('id, nombre, apellido, grados(nombre)')
      .or(`nombre.ilike.%${q}%,apellido.ilike.%${q}%`)
      .eq('estado', 'activo')
      .limit(8)
    setEstudiantes(data || [])
    setBuscando(false)
  }

  async function reporteEstadoCuenta(estudiante) {
    setLoading('cuenta')
    setEstudiantes([])
    setBusquedaEstudiante(`${estudiante.nombre} ${estudiante.apellido}`)

    const { data: cobros } = await supabase.from('cobros')
      .select(`id, monto, mes, estado, fecha_vencimiento, conceptos_cobro(nombre)`)
      .eq('estudiante_id', estudiante.id)
      .order('fecha_vencimiento', { ascending: true })

    const pagados = cobros?.filter(c => c.estado === 'pagado') || []
    const pendientes = cobros?.filter(c => c.estado === 'pendiente') || []
    const totalPagado = pagados.reduce((a, c) => a + parseFloat(c.monto), 0)
    const totalPendiente = pendientes.reduce((a, c) => a + parseFloat(c.monto), 0)

    const doc = new jsPDF()
    const startY = cabeceraPDF(doc,
      `Estado de Cuenta — ${estudiante.nombre} ${estudiante.apellido}`,
      `Grado: ${estudiante.grados?.nombre || '—'}`)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74)
    doc.text(`Total pagado: $${totalPagado.toFixed(2)}`, 14, startY)
    doc.setTextColor(232, 87, 58)
    doc.text(`Total pendiente: $${totalPendiente.toFixed(2)}`, 90, startY)
    doc.setTextColor(100, 100, 100)
    doc.text(`Total cobros: ${cobros?.length || 0}`, 166, startY)

    autoTable(doc, {
      startY: startY + 10,
      head: [['Concepto', 'Mes', 'Monto', 'Vencimiento', 'Estado']],
      body: cobros?.map(c => [
        c.conceptos_cobro?.nombre || '—',
        c.mes || '—',
        `$${parseFloat(c.monto).toFixed(2)}`,
        c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-SV') : '—',
        c.estado.toUpperCase()
      ]) || [],
      headStyles: { fillColor: [61, 31, 97], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      didParseCell: (data) => {
        if (data.column.index === 4) {
          if (data.cell.raw === 'PAGADO') data.cell.styles.textColor = [22, 163, 74]
          if (data.cell.raw === 'PENDIENTE') data.cell.styles.textColor = [232, 87, 58]
          if (data.cell.raw === 'ANULADO') data.cell.styles.textColor = [150, 150, 150]
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

    doc.save(`estado-cuenta-${estudiante.nombre}-${estudiante.apellido}.pdf`.toLowerCase().replace(/ /g, '-'))
    setLoading(null)
  }

  const reportes = [
    {
      id: 'hoy', icon: '📅', titulo: 'Pagos del día',
      desc: 'Todos los pagos registrados hoy con totales',
      color: '#16a34a', bg: '#f0fdf4',
      accion: reportePagosHoy
    },
    {
      id: 'mes', icon: '📊', titulo: 'Pagos del mes',
      desc: 'Historial completo de pagos del mes en curso',
      color: PURPLE, bg: '#f3eeff',
      accion: reportePagosMes
    },
    {
      id: 'pendientes', icon: '⏳', titulo: 'Cobros pendientes y vencidos',
      desc: 'Lista de cobros sin pagar con estado de vencimiento',
      color: '#E8573A', bg: '#fff4f0',
      accion: reportePendientes
    },
  ]

  const reportesMostrar = esRecepcion
    ? reportes.filter(r => r.id === 'hoy')
    : reportes

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 900, marginBottom: 4 }}>📄 Reportes</h1>
        <p style={{ color: '#888', fontSize: 13 }}>Genera y descarga reportes en PDF</p>
      </div>

      {/* Reportes generales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
        {reportesMostrar.map(r => (
          <div key={r.id} style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(91,45,142,0.08)', borderTop: `4px solid ${r.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ background: r.bg, borderRadius: 12, padding: '10px 14px', fontSize: 24 }}>{r.icon}</div>
              <div>
                <div style={{ fontWeight: 800, color: '#3d1f61', fontSize: 15 }}>{r.titulo}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{r.desc}</div>
              </div>
            </div>
            <button
              onClick={r.accion}
              disabled={loading === r.id}
              style={{
                width: '100%', padding: '11px', borderRadius: 10, border: 'none',
                background: loading === r.id ? '#e0d6f0' : r.color,
                color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: loading === r.id ? 'not-allowed' : 'pointer'
              }}>
              {loading === r.id ? 'Generando...' : '⬇️ Descargar PDF'}
            </button>
          </div>
        ))}
      </div>

      {/* Estado de cuenta — solo Admin */}
      {!esRecepcion && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(91,45,142,0.08)', borderTop: '4px solid #D4A017' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ background: '#fffbeb', borderRadius: 12, padding: '10px 14px', fontSize: 24 }}>🎓</div>
            <div>
              <div style={{ fontWeight: 800, color: '#3d1f61', fontSize: 15 }}>Estado de cuenta por estudiante</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Historial completo de cobros y pagos de un alumno</div>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              value={busquedaEstudiante}
              onChange={e => buscarEstudiantes(e.target.value)}
              placeholder="🔍 Buscar estudiante por nombre..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e0d6f0', fontSize: 14, background: '#faf8ff', boxSizing: 'border-box' }}
            />
            {estudiantes.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden', marginTop: 4 }}>
                {estudiantes.map(est => (
                  <div key={est.id}
                    onClick={() => reporteEstadoCuenta(est)}
                    style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid #f3eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#3d1f61' }}>{est.nombre} {est.apellido}</span>
                    <span style={{ fontSize: 12, color: '#888' }}>{est.grados?.nombre}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {loading === 'cuenta' && <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>Generando estado de cuenta...</p>}
        </div>
      )}
    </div>
  )
}