import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const IcoMoney = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IcoList = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IcoAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

function TicketTérmico({ cobro, pago, onClose }) {
  const printRef = useRef()
  function imprimir() {
    const contenido = printRef.current.innerHTML
    const ventana = window.open('', '_blank', 'width=400,height=600')
    ventana.document.write(`<html><head><title>Recibo CBIS</title><style>@page{size:80mm auto;margin:0;}body{font-family:'Courier New',monospace;font-size:11px;width:80mm;padding:4mm;color:#000;}.center{text-align:center;}.bold{font-weight:900;}.divider{border-top:1px dashed #000;margin:6px 0;}.row{display:flex;justify-content:space-between;margin:3px 0;}.titulo{font-size:13px;font-weight:900;}.monto{font-size:18px;font-weight:900;}</style></head><body>${contenido}</body></html>`)
    ventana.document.close(); ventana.focus(); ventana.print(); ventana.close()
  }
  const fechaPago = new Date().toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaPago = new Date().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
  return (
    <div style={s.modalBg}>
      <div style={{ ...s.modalBox, maxWidth: 420 }}>
        <h2 style={s.modalTitle}>Vista previa del recibo</h2>
        <div ref={printRef} style={{ fontFamily: 'Courier New', fontSize: 12, border: '1px dashed #ccc', padding: 16, borderRadius: 8, background: '#fffef8', maxWidth: 280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.4 }}>COLEGIO BAUTISTA<br/>INTERNACIONAL<br/>DE SONSONATE</div>
          </div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
            <span style={{ fontWeight: 900 }}>RECIBO</span><span style={{ fontWeight: 900 }}>{fechaPago}</span>
          </div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>Hora: {horaPago}</div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ marginBottom: 4 }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Nombre del estudiante:</div><div style={{ fontWeight: 900 }}>{cobro.estudiantes?.nombre} {cobro.estudiantes?.apellido}</div></div>
          <div style={{ marginBottom: 4 }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Grado:</div><div style={{ fontWeight: 900 }}>{cobro.estudiantes?.grados?.nombre}</div></div>
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ marginBottom: 4 }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Concepto:</div><div style={{ fontWeight: 900 }}>{cobro.conceptos_cobro?.nombre}</div></div>
          {cobro.mes && (<div style={{ marginBottom: 4 }}><div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Mes:</div><div style={{ fontWeight: 900 }}>{cobro.mes} {cobro.year_escolar}</div></div>)}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Total pagado:</div>
            <div style={{ fontWeight: 900, fontSize: 20 }}>${parseFloat(cobro.monto).toFixed(2)}</div>
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

export default function Cobros() {
  const { perfil } = useAuth()
  const esRecepcion = perfil?.rol === 'recepcion'
  const [estudiantes, setEstudiantes] = useState([])
  const [conceptos, setConceptos] = useState([])
  const [cobros, setCobros] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null)
  const [vista, setVista] = useState('estudiantes')
  const [modalCobro, setModalCobro] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [modalMora, setModalMora] = useState(false)
  const [modalAnulacion, setModalAnulacion] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [ticketVisible, setTicketVisible] = useState(false)
  const [cobroSeleccionado, setCobroSeleccionado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [cobrosSeleccionados, setCobrosSeleccionados] = useState([])
  const [modalPagoMultiple, setModalPagoMultiple] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ estudiante_id: '', concepto_id: '', monto: '', mes: '', year_escolar: new Date().getFullYear() })

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  useEffect(() => { cargarDatos() }, [])
  useEffect(() => { setCobrosSeleccionados([]) }, [estudianteSeleccionado])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: est }, { data: con }, { data: cob }] = await Promise.all([
      supabase.from('estudiantes').select('id, nombre, apellido, grado_id, grados(nombre)').eq('estado', 'activo').order('apellido'),
      supabase.from('conceptos_cobro').select('*').eq('activo', true).order('tipo'),
      supabase.from('cobros').select(`*, estudiantes(nombre, apellido, grados(nombre)), conceptos_cobro(nombre, tipo)`).order('fecha_vencimiento', { ascending: true })
    ])
    setEstudiantes(est || []); setConceptos(con || []); setCobros(cob || [])
    setLoading(false)
  }

  function onConceptoChange(concepto_id) {
    const concepto = conceptos.find(c => c.id === parseInt(concepto_id))
    setForm({ ...form, concepto_id, monto: concepto?.monto || '' })
  }

  function calcularVencimiento(mes, year) {
    if (!mes) return null
    const idxMes = meses.indexOf(mes)
    if (idxMes === -1) return null
    return new Date(year, idxMes, 10).toISOString().split('T')[0]
  }

  function hayMora(mes, year) {
    if (!mes) return false
    return new Date() > new Date(year, meses.indexOf(mes), 10)
  }

  async function guardarCobro() {
    const estId = estudianteSeleccionado?.id || form.estudiante_id
    if (!estId || !form.concepto_id || !form.monto) { setError('Estudiante, concepto y monto son obligatorios'); return }
    setGuardando(true); setError('')
    const vencimiento = calcularVencimiento(form.mes, form.year_escolar)
    const { error } = await supabase.from('cobros').insert([{ estudiante_id: parseInt(estId), concepto_id: parseInt(form.concepto_id), monto: parseFloat(form.monto), fecha_vencimiento: vencimiento, mes: form.mes || null, year_escolar: form.year_escolar, estado: 'pendiente' }])
    if (error) { setError('Error: ' + error.message) } else { setModalCobro(false); resetForm(); toast.success('Cobro registrado exitosamente'); cargarDatos() }
    setGuardando(false)
  }

  function iniciarPago(cobro) {
    setCobroSeleccionado(cobro)
    if (cobro.conceptos_cobro?.tipo === 'mensualidad' && hayMora(cobro.mes, cobro.year_escolar)) { setModalMora(true) }
    else { setModalPago(true) }
  }

  async function registrarPago(conMora = false) {
    if (!cobroSeleccionado) return
    setGuardando(true)
    const montoBase = parseFloat(cobroSeleccionado.monto)
    const montoFinal = conMora ? parseFloat((montoBase * 1.25).toFixed(2)) : montoBase
    const { error } = await supabase.from('pagos').insert([{ cobro_id: cobroSeleccionado.id, estudiante_id: cobroSeleccionado.estudiante_id, monto_pagado: montoFinal, metodo: 'presencial', recibido_por: perfil.id, fecha_pago: new Date().toISOString() }])
    if (!error) {
      await supabase.from('cobros').update({ estado: 'pagado', monto: montoFinal }).eq('id', cobroSeleccionado.id)
      setCobroSeleccionado({ ...cobroSeleccionado, monto: montoFinal })
      setModalMora(false); setModalPago(false)
      toast.success('Pago registrado exitosamente')
      await cargarDatos(); setTicketVisible(true)
    } else { toast.error('Error al registrar pago: ' + error.message) }
    setGuardando(false)
  }

  function iniciarAnulacion(cobro) { setCobroSeleccionado(cobro); setMotivoAnulacion(''); setModalAnulacion(true) }

  async function confirmarAnulacion() {
    if (!motivoAnulacion.trim()) { toast.error('Debes ingresar un motivo para anular el cobro'); return }
    setGuardando(true)
    await supabase.from('cobros').update({ estado: 'anulado', motivo_anulacion: motivoAnulacion }).eq('id', cobroSeleccionado.id)
    await supabase.from('pagos').update({ anulado: true, motivo_anulacion: motivoAnulacion }).eq('cobro_id', cobroSeleccionado.id)
    setModalAnulacion(false); setCobroSeleccionado(null); setMotivoAnulacion('')
    toast.success('Cobro anulado correctamente'); cargarDatos(); setGuardando(false)
  }

  async function registrarPagoMultiple() {
    const cobrosAPagar = cobrosPendientesEst.filter(c => cobrosSeleccionados.includes(c.id))
    setGuardando(true)
    for (const cobro of cobrosAPagar) {
      const tieneMora = cobro.conceptos_cobro?.tipo === 'mensualidad' && hayMora(cobro.mes, cobro.year_escolar)
      const monto = tieneMora ? parseFloat((parseFloat(cobro.monto) * 1.25).toFixed(2)) : parseFloat(cobro.monto)
      await supabase.from('pagos').insert({ cobro_id: cobro.id, estudiante_id: cobro.estudiante_id, monto_pagado: monto, metodo: 'presencial', recibido_por: perfil.id, fecha_pago: new Date().toISOString() })
      await supabase.from('cobros').update({ estado: 'pagado', monto }).eq('id', cobro.id)
    }
    setModalPagoMultiple(false); setCobrosSeleccionados([])
    toast.success(`${cobrosAPagar.length} cobro(s) registrados exitosamente`)
    await cargarDatos(); setGuardando(false)
  }

  function resetForm() { setForm({ estudiante_id: '', concepto_id: '', monto: '', mes: '', year_escolar: new Date().getFullYear() }); setError('') }
  function abrirNuevoCobro() { resetForm(); if (estudianteSeleccionado) { setForm(f => ({ ...f, estudiante_id: estudianteSeleccionado.id })) }; setModalCobro(true) }

  const estadoColor = {
    pendiente: { bg: '#fef9c3', color: '#854d0e' },
    pagado: { bg: '#dcfce7', color: '#16a34a' },
    vencido: { bg: '#fee2e2', color: '#dc2626' },
    anulado: { bg: '#f3f4f6', color: '#6b7280' },
  }

  const estudiantesFiltrados = estudiantes.filter(e => {
    const nombre = `${e.nombre} ${e.apellido}`.toLowerCase()
    return nombre.includes(busqueda.toLowerCase()) || e.grados?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  })

  const cobrosEstudiante = estudianteSeleccionado ? cobros.filter(c => c.estudiante_id === estudianteSeleccionado.id) : []
  const cobrosPendientesEst = cobrosEstudiante.filter(c => c.estado === 'pendiente')
  const cobrosHistorialEst = cobrosEstudiante.filter(c => c.estado !== 'pendiente')
  const filtradosTodos = cobros.filter(c => {
    const nombre = `${c.estudiantes?.nombre} ${c.estudiantes?.apellido}`.toLowerCase()
    return nombre.includes(busqueda.toLowerCase()) || c.conceptos_cobro?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  })

  const totalPendiente = cobros.filter(c => c.estado === 'pendiente').reduce((a, c) => a + parseFloat(c.monto), 0)

  const kpis = [
    { icon: <IcoMoney />, val: `$${totalPendiente.toFixed(2)}`, label: 'Pendiente de cobro', color: '#f59e0b', bg: '#fffbeb' },
    { icon: <IcoList />, val: cobros.filter(c => c.estado === 'pendiente').length, label: 'Cobros pendientes', color: '#7B4DB8', bg: '#f3eeff' },
    { icon: <IcoAlert />, val: cobros.filter(c => c.estado === 'pendiente' && c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date()).length, label: 'Cobros vencidos', color: '#ef4444', bg: '#fff0f0' },
  ]

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Cobros</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
            {estudianteSeleccionado ? `${cobrosEstudiante.length} cobros de ${estudianteSeleccionado.nombre} ${estudianteSeleccionado.apellido}` : `${cobros.length} cobros registrados`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {estudianteSeleccionado && (<button onClick={() => setEstudianteSeleccionado(null)} style={s.btnSecondary}>Volver a lista</button>)}
          <button onClick={abrirNuevoCobro} style={s.btnPrimary}>+ {esRecepcion ? 'Registrar cobro' : 'Nuevo cobro'}</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', borderTop: `4px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: k.color, letterSpacing: '-0.5px' }}>{loading ? '...' : k.val}</div>
              </div>
              <div style={{ background: k.bg, borderRadius: 10, padding: 10, color: k.color }}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs vista */}
      {!estudianteSeleccionado && !esRecepcion && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {[{ id: 'estudiantes', label: 'Por estudiante' }, { id: 'todos', label: 'Todos los cobros' }].map(v => (
            <button key={v.id} onClick={() => setVista(v.id)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: vista === v.id ? '#5B2D8E' : '#fff', color: vista === v.id ? '#fff' : '#5B2D8E', fontWeight: 700, fontSize: 13, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', boxShadow: vista === v.id ? 'none' : '0 1px 4px rgba(0,0,0,0.08)' }}>{v.label}</button>
          ))}
        </div>
      )}

      {/* Buscador */}
      <input style={s.search} placeholder={estudianteSeleccionado ? 'Buscar en cobros...' : (vista === 'estudiantes' ? 'Buscar estudiante por nombre o grado...' : 'Buscar por estudiante o concepto...')} value={busqueda} onChange={e => setBusqueda(e.target.value)} />

      {/* Vista: estudiante seleccionado */}
      {estudianteSeleccionado && (
        <div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
              {estudianteSeleccionado.nombre?.charAt(0)}{estudianteSeleccionado.apellido?.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#3d1f61' }}>{estudianteSeleccionado.nombre} {estudianteSeleccionado.apellido}</div>
              <div style={{ fontSize: 13, color: '#b0a8c0' }}>{estudianteSeleccionado.grados?.nombre}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total pendiente</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: cobrosPendientesEst.length > 0 ? '#f59e0b' : '#16a34a' }}>
                ${cobrosPendientesEst.reduce((a, c) => a + parseFloat(c.monto), 0).toFixed(2)}
              </div>
            </div>
          </div>

          {cobrosPendientesEst.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ color: '#3d1f61', fontSize: 14, fontWeight: 800 }}>Cobros pendientes ({cobrosPendientesEst.length})</h3>
                <button onClick={() => { if (cobrosSeleccionados.length === cobrosPendientesEst.length) { setCobrosSeleccionados([]) } else { setCobrosSeleccionados(cobrosPendientesEst.map(c => c.id)) } }}
                  style={{ fontSize: 12, color: '#5B2D8E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
                  {cobrosSeleccionados.length === cobrosPendientesEst.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cobrosPendientesEst.map(c => {
                  const vencido = c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date()
                  const seleccionado = cobrosSeleccionados.includes(c.id)
                  return (
                    <div key={c.id} onClick={() => setCobrosSeleccionados(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                      style={{ background: seleccionado ? '#f3eeff' : '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 2px 8px rgba(61,31,97,0.07)', borderLeft: `4px solid ${seleccionado ? '#5B2D8E' : vencido ? '#ef4444' : '#f59e0b'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${seleccionado ? '#5B2D8E' : '#ddd'}`, background: seleccionado ? '#5B2D8E' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {seleccionado && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 4 }}>{c.conceptos_cobro?.nombre}</div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888' }}>
                            {c.mes && <span>{c.mes} {c.year_escolar}</span>}
                            {c.fecha_vencimiento && (<span style={{ color: vencido ? '#dc2626' : '#888' }}>Vence: {new Date(c.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-SV')}{vencido && ' ⚠ vencido'}</span>)}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#3d1f61', marginRight: 8 }}>${parseFloat(c.monto).toFixed(2)}</div>
                        <button onClick={e => { e.stopPropagation(); iniciarPago(c) }} style={s.btnPagar}>Pagar</button>
                        {!esRecepcion && (<button onClick={e => { e.stopPropagation(); iniciarAnulacion(c) }} style={s.btnAnular}>Anular</button>)}
                      </div>
                    </div>
                  )
                })}
              </div>

              {cobrosSeleccionados.length > 1 && (
                <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', borderRadius: 16, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 32px rgba(61,31,97,0.4)', zIndex: 50, minWidth: 340, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
                  <div>
                    <div style={{ color: '#d4b8ff', fontSize: 11, fontWeight: 600 }}>{cobrosSeleccionados.length} cobros seleccionados</div>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>
                      ${cobrosPendientesEst.filter(c => cobrosSeleccionados.includes(c.id)).reduce((a, c) => a + parseFloat(c.monto), 0).toFixed(2)}
                    </div>
                  </div>
                  <button onClick={() => setModalPagoMultiple(true)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#D4A017', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>Pagar seleccionados</button>
                </div>
              )}
            </div>
          )}

          {cobrosHistorialEst.length > 0 && (
            <div>
              <h3 style={{ color: '#9ca3af', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Historial ({cobrosHistorialEst.length})</h3>
              <div style={s.card}>
                <table style={s.table}>
                  <thead><tr style={{ background: '#faf8ff' }}>{['Concepto','Mes','Monto','Estado','Acción'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {cobrosHistorialEst.map(c => (
                      <tr key={c.id} style={s.tr}>
                        <td style={s.td}>{c.conceptos_cobro?.nombre}</td>
                        <td style={s.td}>{c.mes || '—'}</td>
                        <td style={s.td}><b>${parseFloat(c.monto).toFixed(2)}</b></td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, background: estadoColor[c.estado]?.bg, color: estadoColor[c.estado]?.color }}>{c.estado}</span>
                          {c.estado === 'anulado' && c.motivo_anulacion && (<div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{c.motivo_anulacion}</div>)}
                        </td>
                        <td style={s.td}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {c.estado === 'pagado' && (<button onClick={() => { setCobroSeleccionado(c); setTicketVisible(true) }} style={s.btnReimprimir}>Reimprimir</button>)}
                            {c.estado === 'pagado' && !esRecepcion && (<button onClick={() => iniciarAnulacion(c)} style={s.btnAnular}>Anular</button>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista: lista de estudiantes */}
      {!estudianteSeleccionado && (vista === 'estudiantes' || esRecepcion) && (
        <div style={s.card}>
          {loading ? (<p style={{ textAlign: 'center', color: '#b0a8c0', padding: 48, fontSize: 13 }}>Cargando...</p>)
          : estudiantesFiltrados.length === 0 ? (<p style={{ textAlign: 'center', color: '#b0a8c0', padding: 48, fontSize: 13 }}>No se encontraron estudiantes</p>)
          : (
            <table style={s.table}>
              <thead><tr style={{ background: '#faf8ff' }}>{['Estudiante','Grado','Pendientes','Total pendiente',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {estudiantesFiltrados.map((e, idx) => {
                  const pendientes = cobros.filter(c => c.estudiante_id === e.id && c.estado === 'pendiente')
                  const totalPend = pendientes.reduce((a, c) => a + parseFloat(c.monto), 0)
                  const tieneVencidos = pendientes.some(c => c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date())
                  return (
                    <tr key={e.id} style={{ ...s.tr, cursor: 'pointer', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }} onClick={() => { setEstudianteSeleccionado(e); setBusqueda('') }}>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            {e.nombre?.charAt(0)}{e.apellido?.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 700, color: '#3d1f61', fontSize: 13 }}>{e.nombre} {e.apellido}</span>
                        </div>
                      </td>
                      <td style={s.td}><span style={s.gradoBadge}>{e.grados?.nombre || '—'}</span></td>
                      <td style={s.td}>
                        {pendientes.length > 0 ? (<span style={{ ...s.badge, background: tieneVencidos ? '#fee2e2' : '#fef9c3', color: tieneVencidos ? '#dc2626' : '#854d0e' }}>{pendientes.length} pendiente{pendientes.length > 1 ? 's' : ''}{tieneVencidos && ' (vencidos)'}</span>)
                        : (<span style={{ ...s.badge, background: '#dcfce7', color: '#16a34a' }}>Al día</span>)}
                      </td>
                      <td style={s.td}><b style={{ color: totalPend > 0 ? '#f59e0b' : '#16a34a' }}>${totalPend.toFixed(2)}</b></td>
                      <td style={s.td}><span style={{ color: '#c4bad4', fontSize: 18 }}>›</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Vista: todos los cobros */}
      {!estudianteSeleccionado && vista === 'todos' && !esRecepcion && (
        <div style={s.card}>
          {loading ? (<p style={{ textAlign: 'center', color: '#b0a8c0', padding: 48, fontSize: 13 }}>Cargando...</p>)
          : filtradosTodos.length === 0 ? (<p style={{ textAlign: 'center', color: '#b0a8c0', padding: 48, fontSize: 13 }}>No hay cobros registrados</p>)
          : (
            <table style={s.table}>
              <thead><tr style={{ background: '#faf8ff' }}>{['Estudiante','Grado','Concepto','Mes','Monto','Vencimiento','Estado','Acción'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtradosTodos.map((c, idx) => (
                  <tr key={c.id} style={{ ...s.tr, background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                    <td style={s.td}>{c.estudiantes?.nombre} {c.estudiantes?.apellido}</td>
                    <td style={s.td}><span style={s.gradoBadge}>{c.estudiantes?.grados?.nombre || '—'}</span></td>
                    <td style={s.td}>{c.conceptos_cobro?.nombre}</td>
                    <td style={s.td}>{c.mes || '—'}</td>
                    <td style={s.td}><b>${parseFloat(c.monto).toFixed(2)}</b></td>
                    <td style={s.td}>{c.fecha_vencimiento ? new Date(c.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-SV') : '—'}</td>
                    <td style={s.td}><span style={{ ...s.badge, background: estadoColor[c.estado]?.bg, color: estadoColor[c.estado]?.color }}>{c.estado}</span></td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.estado === 'pendiente' && (<button onClick={() => iniciarPago(c)} style={s.btnPagar}>Pagar</button>)}
                        {c.estado === 'pendiente' && (<button onClick={() => iniciarAnulacion(c)} style={s.btnAnular}>Anular</button>)}
                        {c.estado === 'pagado' && (<button onClick={() => { setCobroSeleccionado(c); setTicketVisible(true) }} style={s.btnReimprimir}>Reimprimir</button>)}
                        {c.estado === 'pagado' && (<button onClick={() => iniciarAnulacion(c)} style={s.btnAnular}>Anular</button>)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal nuevo cobro */}
      {modalCobro && (
        <div style={s.modalBg} onClick={() => { setModalCobro(false); resetForm() }}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Nuevo Cobro</h2>
            {!estudianteSeleccionado && (
              <div style={s.field}><label style={s.label}>Estudiante *</label>
                <select style={s.input} value={form.estudiante_id} onChange={e => setForm({ ...form, estudiante_id: e.target.value })}>
                  <option value="">— Seleccione un estudiante —</option>
                  {estudiantes.map(e => (<option key={e.id} value={e.id}>{e.apellido}, {e.nombre} — {e.grados?.nombre}</option>))}
                </select>
              </div>
            )}
            {estudianteSeleccionado && (<div style={{ background: '#f3eeff', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#5B2D8E', fontWeight: 600 }}>Estudiante: {estudianteSeleccionado.nombre} {estudianteSeleccionado.apellido} — {estudianteSeleccionado.grados?.nombre}</div>)}
            <div style={s.field}><label style={s.label}>Concepto *</label>
              <select style={s.input} value={form.concepto_id} onChange={e => onConceptoChange(e.target.value)}>
                <option value="">— Seleccione un concepto —</option>
                {['matricula','mensualidad','mora','constancia','excursion'].map(tipo => (
                  <optgroup key={tipo} label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}>
                    {conceptos.filter(c => c.tipo === tipo).map(c => (<option key={c.id} value={c.id}>{c.nombre} — ${c.monto}</option>))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={s.grid2}>
              <div style={s.field}><label style={s.label}>Monto (USD) *</label><input style={s.input} type="number" step="0.01" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0.00" /></div>
              <div style={s.field}><label style={s.label}>Mes</label>
                <select style={s.input} value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })}>
                  <option value="">— Sin mes —</option>
                  {meses.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            {form.mes && (<div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#0369a1' }}>Fecha de vencimiento: <b>10 de {form.mes} {form.year_escolar}</b>{hayMora(form.mes, form.year_escolar) && (<span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 8 }}>Ya venció — aplica mora</span>)}</div>)}
            <div style={s.field}><label style={s.label}>Año escolar</label><input style={s.input} type="number" value={form.year_escolar} onChange={e => setForm({ ...form, year_escolar: parseInt(e.target.value) })} /></div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalCobro(false); resetForm() }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={guardarCobro} style={s.btnPrimary} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal mora */}
      {modalMora && cobroSeleccionado && (
        <div style={s.modalBg} onClick={() => setModalMora(false)}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Este cobro tiene mora</h2>
            <p style={{ color: '#555', fontSize: 13, marginBottom: 8, lineHeight: 1.7 }}>El plazo de pago venció el <b>10 de {cobroSeleccionado.mes}</b>.<br/>Aplica un recargo del <b>25%</b> por atraso.</p>
            <div style={{ background: '#fef9c3', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Monto original: <b>${parseFloat(cobroSeleccionado.monto).toFixed(2)}</b></div>
              <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 4 }}>+ Mora (25%): <b>${(parseFloat(cobroSeleccionado.monto) * 0.25).toFixed(2)}</b></div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#5B2D8E' }}>Total: <b>${(parseFloat(cobroSeleccionado.monto) * 1.25).toFixed(2)}</b></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setModalMora(false); setModalPago(true) }} style={s.btnSecondary}>Sin mora</button>
              <button onClick={() => registrarPago(true)} style={{ ...s.btnPrimary, background: '#dc2626' }} disabled={guardando}>{guardando ? 'Registrando...' : 'Cobrar con mora'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar pago */}
      {modalPago && cobroSeleccionado && (
        <div style={s.modalBg} onClick={() => { setModalPago(false); setCobroSeleccionado(null) }}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Confirmar pago presencial</h2>
            <div style={{ background: '#faf8ff', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}><b>Estudiante:</b> {cobroSeleccionado.estudiantes?.nombre} {cobroSeleccionado.estudiantes?.apellido}</p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}><b>Concepto:</b> {cobroSeleccionado.conceptos_cobro?.nombre}</p>
              {cobroSeleccionado.mes && (<p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}><b>Mes:</b> {cobroSeleccionado.mes} {cobroSeleccionado.year_escolar}</p>)}
              <p style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', marginTop: 10 }}>Total: ${parseFloat(cobroSeleccionado.monto).toFixed(2)}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setModalPago(false); setCobroSeleccionado(null) }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={() => registrarPago(false)} style={s.btnPrimary} disabled={guardando}>{guardando ? 'Registrando...' : 'Confirmar pago'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal anulación */}
      {modalAnulacion && cobroSeleccionado && (
        <div style={s.modalBg} onClick={() => { setModalAnulacion(false); setCobroSeleccionado(null); setMotivoAnulacion('') }}>
          <div style={{ ...s.modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Anular cobro</h2>
            <div style={{ background: '#fff4f0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><b>Estudiante:</b> {cobroSeleccionado.estudiantes?.nombre} {cobroSeleccionado.estudiantes?.apellido}</p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 4 }}><b>Concepto:</b> {cobroSeleccionado.conceptos_cobro?.nombre}</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>Monto: ${parseFloat(cobroSeleccionado.monto).toFixed(2)}</p>
            </div>
            <div style={s.field}><label style={s.label}>Motivo de anulación *</label><textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)} placeholder="Ej: Pago duplicado, Error de monto..." /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalAnulacion(false); setCobroSeleccionado(null); setMotivoAnulacion('') }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={confirmarAnulacion} style={{ ...s.btnPrimary, background: '#dc2626' }} disabled={guardando || !motivoAnulacion.trim()}>{guardando ? 'Anulando...' : 'Confirmar anulación'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pago múltiple */}
      {modalPagoMultiple && (
        <div style={s.modalBg} onClick={() => setModalPagoMultiple(false)}>
          <div style={{ ...s.modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Confirmar pago múltiple</h2>
            <div style={{ background: '#faf8ff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              {cobrosPendientesEst.filter(c => cobrosSeleccionados.includes(c.id)).map(c => {
                const tieneMora = c.conceptos_cobro?.tipo === 'mensualidad' && hayMora(c.mes, c.year_escolar)
                const monto = tieneMora ? parseFloat(c.monto) * 1.25 : parseFloat(c.monto)
                return (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0eeff', fontSize: 13 }}>
                    <span style={{ color: '#555' }}>{c.conceptos_cobro?.nombre} {c.mes ? `— ${c.mes}` : ''}{tieneMora && <span style={{ color: '#dc2626', fontSize: 11 }}> +mora</span>}</span>
                    <b style={{ color: '#3d1f61' }}>${monto.toFixed(2)}</b>
                  </div>
                )
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 16, fontWeight: 900 }}>
                <span style={{ color: '#3d1f61' }}>Total</span>
                <span style={{ color: '#16a34a' }}>
                  ${cobrosPendientesEst.filter(c => cobrosSeleccionados.includes(c.id)).reduce((a, c) => { const tieneMora = c.conceptos_cobro?.tipo === 'mensualidad' && hayMora(c.mes, c.year_escolar); return a + (tieneMora ? parseFloat(c.monto) * 1.25 : parseFloat(c.monto)) }, 0).toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalPagoMultiple(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={registrarPagoMultiple} style={s.btnPrimary} disabled={guardando}>{guardando ? 'Registrando...' : 'Confirmar pago'}</button>
            </div>
          </div>
        </div>
      )}

      {ticketVisible && cobroSeleccionado && (<TicketTérmico cobro={cobroSeleccionado} onClose={() => { setTicketVisible(false); setCobroSeleccionado(null) }} />)}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' },
  search: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 16, background: '#fff', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#374151', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#faf8ff' },
  tr: { borderTop: '1px solid #f3eeff' },
  td: { padding: '12px 18px', fontSize: 13, color: '#333' },
  gradoBadge: { background: '#f3eeff', color: '#5B2D8E', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnPagar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnAnular: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnReimprimir: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#f3eeff', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalTitle: { color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.3px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}