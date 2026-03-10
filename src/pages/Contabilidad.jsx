import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function TicketTérmico({ pago, onClose }) {
  const printRef = useRef()

  function imprimir() {
    const contenido = printRef.current.innerHTML
    const ventana = window.open('', '_blank', 'width=400,height=600')
    ventana.document.write(`
      <html><head><title>Recibo CBIS</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        body { font-family: 'Courier New', monospace; font-size: 11px; width: 80mm; padding: 4mm; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: 900; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .titulo { font-size: 13px; font-weight: 900; }
        .monto { font-size: 18px; font-weight: 900; }
      </style></head><body>${contenido}</body></html>
    `)
    ventana.document.close()
    ventana.focus()
    ventana.print()
    ventana.close()
  }

  const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaPago = new Date(pago.fecha_pago).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={s.modalBg}>
      <div style={{ ...s.modalBox, maxWidth: 420 }}>
        <h2 style={s.modalTitle}>Vista previa del recibo</h2>
        <div ref={printRef} style={{ fontFamily: 'Courier New', fontSize: 12, border: '1px dashed #ccc', padding: 16, borderRadius: 8, background: '#fffef8', maxWidth: 280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.4 }}>
              COLEGIO BAUTISTA<br/>INTERNACIONAL<br/>DE SONSONATE
            </div>
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
            <span style={{ fontWeight: 900 }}>RECIBO</span>
            <span style={{ fontWeight: 900 }}>{fechaPago}</span>
          </div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>Hora: {horaPago}</div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Nombre del estudiante:</div>
            <div style={{ fontWeight: 900 }}>{pago.estudiantes?.nombre} {pago.estudiantes?.apellido}</div>
          </div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Grado:</div>
            <div style={{ fontWeight: 900 }}>{pago.estudiantes?.grados?.nombre}</div>
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Concepto:</div>
            <div style={{ fontWeight: 900 }}>{pago.cobros?.conceptos_cobro?.nombre}</div>
          </div>
          {pago.cobros?.mes && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Mes:</div>
              <div style={{ fontWeight: 900 }}>{pago.cobros.mes} {pago.cobros.year_escolar}</div>
            </div>
          )}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Total pagado:</div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>${parseFloat(pago.monto_pagado).toFixed(2)}</div>
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ textAlign: 'center', fontSize: 9, color: '#555', marginTop: 8 }}>
            <div style={{ fontWeight: 900 }}>PAGO REGISTRADO</div>
            <div style={{ marginTop: 4 }}>Conserve este comprobante</div>
            <div>-- CBIS --</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button onClick={onClose} style={s.btnSecondary}>Cerrar</button>
          <button onClick={imprimir} style={s.btnPrimary}>Imprimir</button>
        </div>
      </div>
    </div>
  )
}

export default function Contabilidad() {
  const { perfil } = useAuth()
  const [pagos, setPagos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroYear, setFiltroYear] = useState(new Date().getFullYear())
  const [totalAnulado, setTotalAnulado] = useState(0)
  const [ticketVisible, setTicketVisible] = useState(false)
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null)
  const [modalAnulacion, setModalAnulacion] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [guardando, setGuardando] = useState(false)

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  useEffect(() => { cargarPagos() }, [])

  async function cargarPagos() {
    setLoading(true)
    const [{ data }, { data: anulados }] = await Promise.all([
      supabase.from('pagos').select(`
        *,
        estudiantes(nombre, apellido, grados(nombre)),
        cobros(mes, year_escolar, conceptos_cobro(nombre, tipo))
      `).neq('anulado', true).order('fecha_pago', { ascending: false }),
      supabase.from('pagos').select('monto_pagado').eq('anulado', true)
    ])
    setPagos(data || [])
    setTotalAnulado(anulados?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0)
    setLoading(false)
  }

  async function confirmarAnulacion() {
  if (!motivoAnulacion.trim()) {
    toast.error('Debes ingresar un motivo para anular el pago')
    return
  }
  setGuardando(true)

  const { error: errPago } = await supabase.from('pagos')
    .update({ anulado: true, motivo_anulacion: motivoAnulacion })
    .eq('id', pagoSeleccionado.id)

  if (errPago) {
    toast.error('Error al anular pago: ' + errPago.message)
    setGuardando(false)
    return
  }

  const { error: errCobro } = await supabase.from('cobros')
    .update({ estado: 'pendiente', motivo_anulacion: motivoAnulacion })
    .eq('id', pagoSeleccionado.cobro_id)

  if (errCobro) {
    toast.error('Error al actualizar cobro: ' + errCobro.message)
    setGuardando(false)
    return
  }

  setModalAnulacion(false)
  setPagoSeleccionado(null)
  setMotivoAnulacion('')
  toast.success('Pago anulado — cobro devuelto a pendiente')
  await cargarPagos()
  setGuardando(false) 
}

  const pagosFiltrados = pagos.filter(p => {
    const mes = p.cobros?.mes
    const year = p.cobros?.year_escolar
    if (filtroMes && mes !== filtroMes) return false
    if (filtroYear && year !== parseInt(filtroYear)) return false
    return true
  })

  const totalFiltrado = pagosFiltrados.reduce((a, p) => a + parseFloat(p.monto_pagado), 0)

  const porConcepto = pagosFiltrados.reduce((acc, p) => {
    const tipo = p.cobros?.conceptos_cobro?.tipo || 'otro'
    acc[tipo] = (acc[tipo] || 0) + parseFloat(p.monto_pagado)
    return acc
  }, {})

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
      <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '20px 24px', border: '1.5px dashed #ddd', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>↩️</span>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#888' }}>${totalAnulado.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>Pagos anulados — no incluidos en el total</div>
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
                {['Fecha', 'Estudiante', 'Grado', 'Concepto', 'Mes', 'Método', 'Monto', 'Acciones'].map(h => (
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
                    <span style={{ ...s.badge, background: '#eff6ff', color: '#5B2D8E' }}>{p.metodo}</span>
                  </td>
                  <td style={s.td}><b style={{ color: '#16a34a' }}>${parseFloat(p.monto_pagado).toFixed(2)}</b></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => { setPagoSeleccionado(p); setTicketVisible(true) }}
                        style={s.btnReimprimir}>
                        Reimprimir
                      </button>
                      <button
                        onClick={() => { setPagoSeleccionado(p); setMotivoAnulacion(''); setModalAnulacion(true) }}
                        style={s.btnAnular}>
                        Anular
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal anulación */}
      {modalAnulacion && pagoSeleccionado && (
        <div style={s.modalBg} onClick={() => { setModalAnulacion(false); setPagoSeleccionado(null); setMotivoAnulacion('') }}>
          <div style={{ ...s.modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Anular pago</h2>
            <div style={{ background: '#fff4f0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                <b>Estudiante:</b> {pagoSeleccionado.estudiantes?.nombre} {pagoSeleccionado.estudiantes?.apellido}
              </p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                <b>Concepto:</b> {pagoSeleccionado.cobros?.conceptos_cobro?.nombre}
              </p>
              {pagoSeleccionado.cobros?.mes && (
                <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                  <b>Mes:</b> {pagoSeleccionado.cobros.mes} {pagoSeleccionado.cobros.year_escolar}
                </p>
              )}
              <p style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>
                Monto: ${parseFloat(pagoSeleccionado.monto_pagado).toFixed(2)}
              </p>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Motivo de anulación *</label>
              <textarea
                style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                value={motivoAnulacion}
                onChange={e => setMotivoAnulacion(e.target.value)}
                placeholder="Ej: Pago duplicado, Error de monto, Devolución solicitada..."
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalAnulacion(false); setPagoSeleccionado(null); setMotivoAnulacion('') }} style={s.btnSecondary}>
                Cancelar
              </button>
              <button onClick={confirmarAnulacion} style={{ ...s.btnPrimary, background: '#dc2626' }} disabled={guardando || !motivoAnulacion.trim()}>
                {guardando ? 'Anulando...' : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket térmico */}
      {ticketVisible && pagoSeleccionado && (
        <TicketTérmico
          pago={pagoSeleccionado}
          onClose={() => { setTicketVisible(false); setPagoSeleccionado(null) }}
        />
      )}
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
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #dde3ee', background: '#fff', color: '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnAnular: { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  btnReimprimir: { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#eff6ff', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { color: '#5B2D8E', fontSize: 17, fontWeight: 800, marginBottom: 20 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #dde3ee', fontSize: 14, background: '#f8faff', color: '#222', boxSizing: 'border-box' },
}