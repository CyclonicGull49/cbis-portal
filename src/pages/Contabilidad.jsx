// ── CONTABILIDAD.JSX ── (copy this content to src/pages/Contabilidad.jsx)
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const IcoIngresos = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>)
const IcoPagos = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>)
const IcoAnulado = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>)

function TicketTérmico({ pago, onClose }) {
  const printRef = useRef()
  function imprimir() {
    const contenido = printRef.current.innerHTML
    const ventana = window.open('', '_blank', 'width=400,height=600')
    ventana.document.write(`<html><head><title>Recibo CBIS</title><style>@page{size:80mm auto;margin:0;}body{font-family:'Courier New',monospace;font-size:11px;width:80mm;padding:4mm;color:#000;}.center{text-align:center;}.bold{font-weight:900;}.divider{border-top:1px dashed #000;margin:6px 0;}.monto{font-size:18px;font-weight:900;}</style></head><body>${contenido}</body></html>`)
    ventana.document.close(); ventana.focus(); ventana.print(); ventana.close()
  }
  const fechaPago = new Date(pago.fecha_pago).toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaPago = new Date(pago.fecha_pago).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
  return (
    <div style={s.modalBg}>
      <div style={{ ...s.modalBox, maxWidth: 420 }}>
        <h2 style={s.modalTitle}>Vista previa del recibo</h2>
        <div ref={printRef} style={{ fontFamily: 'Courier New', fontSize: 12, border: '1px dashed #ccc', padding: 16, borderRadius: 8, background: '#fffef8', maxWidth: 280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}><div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.4 }}>COLEGIO BAUTISTA<br/>INTERNACIONAL<br/>DE SONSONATE</div></div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}><span style={{ fontWeight: 900 }}>RECIBO</span><span style={{ fontWeight: 900 }}>{fechaPago}</span></div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>Hora: {horaPago}</div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ marginBottom: 4 }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Nombre del estudiante:</div><div style={{ fontWeight: 900 }}>{pago.estudiantes?.nombre} {pago.estudiantes?.apellido}</div></div>
          <div style={{ marginBottom: 4 }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Grado:</div><div style={{ fontWeight: 900 }}>{pago.estudiantes?.grados?.nombre}</div></div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ marginBottom: 4 }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Concepto:</div><div style={{ fontWeight: 900 }}>{pago.cobros?.conceptos_cobro?.nombre}</div></div>
          {pago.cobros?.mes && (<div style={{ marginBottom: 4 }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Mes:</div><div style={{ fontWeight: 900 }}>{pago.cobros.mes} {pago.cobros.year_escolar}</div></div>)}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ textAlign: 'center', margin: '8px 0' }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Total pagado:</div><div style={{ fontWeight: 900, fontSize: 20 }}>${parseFloat(pago.monto_pagado).toFixed(2)}</div></div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ textAlign: 'center', fontSize: 9, color: '#555', marginTop: 8 }}><div style={{ fontWeight: 900 }}>PAGO REGISTRADO</div><div style={{ marginTop: 4 }}>Conserve este comprobante</div><div>-- CBIS --</div></div>
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

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  useEffect(() => { cargarPagos() }, [])

  async function cargarPagos() {
    setLoading(true)
    const [{ data }, { data: anulados }] = await Promise.all([
      supabase.from('pagos').select(`*, estudiantes(nombre, apellido, grados(nombre)), cobros(mes, year_escolar, conceptos_cobro(nombre, tipo))`).neq('anulado', true).order('fecha_pago', { ascending: false }),
      supabase.from('pagos').select('monto_pagado').eq('anulado', true)
    ])
    setPagos(data || [])
    setTotalAnulado(anulados?.reduce((a, p) => a + parseFloat(p.monto_pagado), 0) || 0)
    setLoading(false)
  }

  async function confirmarAnulacion() {
    if (!motivoAnulacion.trim()) { toast.error('Debes ingresar un motivo para anular el pago'); return }
    setGuardando(true)
    const { error: errPago } = await supabase.from('pagos').update({ anulado: true, motivo_anulacion: motivoAnulacion }).eq('id', pagoSeleccionado.id)
    if (errPago) { toast.error('Error al anular pago: ' + errPago.message); setGuardando(false); return }
    const { error: errCobro } = await supabase.from('cobros').update({ estado: 'pendiente', motivo_anulacion: motivoAnulacion }).eq('id', pagoSeleccionado.cobro_id)
    if (errCobro) { toast.error('Error al actualizar cobro: ' + errCobro.message); setGuardando(false); return }
    setModalAnulacion(false); setPagoSeleccionado(null); setMotivoAnulacion('')
    toast.success('Pago anulado — cobro devuelto a pendiente')
    await cargarPagos(); setGuardando(false)
  }

  const pagosFiltrados = pagos.filter(p => {
    if (filtroMes && p.cobros?.mes !== filtroMes) return false
    if (filtroYear && p.cobros?.year_escolar !== parseInt(filtroYear)) return false
    return true
  })

  const totalFiltrado = pagosFiltrados.reduce((a, p) => a + parseFloat(p.monto_pagado), 0)
  const porConcepto = pagosFiltrados.reduce((acc, p) => { const tipo = p.cobros?.conceptos_cobro?.tipo || 'otro'; acc[tipo] = (acc[tipo] || 0) + parseFloat(p.monto_pagado); return acc }, {})
  const porMes = pagos.reduce((acc, p) => { const mes = p.cobros?.mes || 'Sin mes'; acc[mes] = (acc[mes] || 0) + parseFloat(p.monto_pagado); return acc }, {})
  const tipoLabel = { matricula: 'Matrícula', mensualidad: 'Mensualidad', constancia: 'Constancia', excursion: 'Excursión', otro: 'Otro' }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Contabilidad</h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>Historial de pagos e ingresos</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={s.filtro} value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
          <option value="">Todos los meses</option>
          {meses.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={s.filtro} value={filtroYear} onChange={e => setFiltroYear(e.target.value)}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { icon: <IcoIngresos />, val: `$${totalFiltrado.toFixed(2)}`, label: 'Total ingresado', color: '#16a34a', bg: '#f0fdf4' },
          { icon: <IcoPagos />, val: pagosFiltrados.length, label: 'Pagos registrados', color: '#7B4DB8', bg: '#f3eeff' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', borderTop: `4px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: k.color, letterSpacing: '-0.5px' }}>{loading ? '...' : k.val}</div>
              </div>
              <div style={{ background: k.bg, borderRadius: 10, padding: 10, color: k.color }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Anulados */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', border: '1.5px dashed #e5e7eb', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, boxShadow: '0 2px 16px rgba(61,31,97,0.04)' }}>
        <div style={{ color: '#9ca3af' }}><IcoAnulado /></div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#9ca3af' }}>${totalAnulado.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500 }}>Pagos anulados — no incluidos en el total</div>
        </div>
      </div>

      {/* Desglose */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          { titulo: 'Ingresos por tipo de cobro', datos: Object.entries(porConcepto), labelFn: ([tipo]) => tipoLabel[tipo] || tipo },
          { titulo: 'Ingresos por mes', datos: Object.entries(porMes), labelFn: ([mes]) => mes },
        ].map(({ titulo, datos, labelFn }) => (
          <div key={titulo} style={{ ...s.card, padding: 20 }}>
            <h2 style={{ color: '#3d1f61', fontSize: 14, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.2px' }}>{titulo}</h2>
            {datos.length === 0 ? (<p style={{ color: '#b0a8c0', fontSize: 13 }}>Sin datos</p>) : datos.map(entry => (
              <div key={entry[0]} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3eeff', fontSize: 13 }}>
                <span style={{ color: '#555' }}>{labelFn(entry)}</span>
                <span style={{ fontWeight: 800, color: '#5B2D8E' }}>${entry[1].toFixed(2)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Historial */}
      <div style={{ ...s.card, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#3d1f61', fontSize: 14, fontWeight: 800, marginBottom: 2 }}>Historial de pagos</h2>
            <p style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 500 }}>Todos los pagos registrados en el período</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', background: '#f3eeff', padding: '4px 10px', borderRadius: 100 }}>{pagosFiltrados.length} registros</span>
        </div>
        {loading ? (<p style={{ color: '#b0a8c0', padding: 48, textAlign: 'center', fontSize: 13 }}>Cargando...</p>)
        : pagosFiltrados.length === 0 ? (<p style={{ color: '#b0a8c0', padding: 48, textAlign: 'center', fontSize: 13 }}>No hay pagos registrados</p>)
        : (
          <table style={s.table}>
            <thead><tr style={{ background: '#faf8ff' }}>{['Fecha','Estudiante','Grado','Concepto','Mes','Método','Monto','Acciones'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {pagosFiltrados.map((p, idx) => (
                <tr key={p.id} style={{ ...s.tr, background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <td style={s.td}>{new Date(p.fecha_pago).toLocaleDateString('es-SV')}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B2D8E', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                        {p.estudiantes?.nombre?.charAt(0)}{p.estudiantes?.apellido?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600, color: '#3d1f61', fontSize: 13 }}>{p.estudiantes?.nombre} {p.estudiantes?.apellido}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.gradoBadge}>{p.estudiantes?.grados?.nombre || '—'}</span></td>
                  <td style={s.td}>{p.cobros?.conceptos_cobro?.nombre || '—'}</td>
                  <td style={s.td}>{p.cobros?.mes || '—'}</td>
                  <td style={s.td}><span style={{ ...s.badge, background: '#f3eeff', color: '#5B2D8E' }}>{p.metodo}</span></td>
                  <td style={s.td}><span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: 6 }}>${parseFloat(p.monto_pagado).toFixed(2)}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setPagoSeleccionado(p); setTicketVisible(true) }} style={s.btnReimprimir}>Reimprimir</button>
                      <button onClick={() => { setPagoSeleccionado(p); setMotivoAnulacion(''); setModalAnulacion(true) }} style={s.btnAnular}>Anular</button>
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
              <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><b>Estudiante:</b> {pagoSeleccionado.estudiantes?.nombre} {pagoSeleccionado.estudiantes?.apellido}</p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><b>Concepto:</b> {pagoSeleccionado.cobros?.conceptos_cobro?.nombre}</p>
              {pagoSeleccionado.cobros?.mes && (<p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><b>Mes:</b> {pagoSeleccionado.cobros.mes} {pagoSeleccionado.cobros.year_escolar}</p>)}
              <p style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>Monto: ${parseFloat(pagoSeleccionado.monto_pagado).toFixed(2)}</p>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Motivo de anulación *</label>
              <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)} placeholder="Ej: Pago duplicado, Error de monto..." />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalAnulacion(false); setPagoSeleccionado(null); setMotivoAnulacion('') }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={confirmarAnulacion} style={{ ...s.btnPrimary, background: '#dc2626' }} disabled={guardando || !motivoAnulacion.trim()}>{guardando ? 'Anulando...' : 'Confirmar anulación'}</button>
            </div>
          </div>
        </div>
      )}

      {ticketVisible && pagoSeleccionado && (<TicketTérmico pago={pagoSeleccionado} onClose={() => { setTicketVisible(false); setPagoSeleccionado(null) }} />)}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' },
  filtro: { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#374151', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tr: { borderTop: '1px solid #f3eeff' },
  td: { padding: '12px 18px', fontSize: 13, color: '#333' },
  gradoBadge: { background: '#f3eeff', color: '#5B2D8E', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnAnular: { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnReimprimir: { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f3eeff', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalTitle: { color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20 },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}