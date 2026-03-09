import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'


// ── COMPONENTE DE IMPRESIÓN TÉRMICA ──
function TicketTérmico({ cobro, pago, onClose }) {
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
        .sello { border: 2px solid #000; padding: 4px; text-align: center; font-weight: 900; font-size: 14px; margin: 8px 0; letter-spacing: 2px; }
      </style></head><body>${contenido}</body></html>
    `)
    ventana.document.close()
    ventana.focus()
    ventana.print()
    ventana.close()
  }

  const fechaPago = new Date().toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaPago = new Date().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={s.modalBg}>
      <div style={{ ...s.modalBox, maxWidth: 420 }}>
        <h2 style={s.modalTitle}>🖨️ Vista previa del recibo</h2>
        <div ref={printRef} style={{ fontFamily: 'Courier New', fontSize: 12, border: '1px dashed #ccc', padding: 16, borderRadius: 8, background: '#fffef8', maxWidth: 280, margin: '0 auto' }}>
          <div className="center" style={{ textAlign: 'center', marginBottom: 8 }}>
            <div className="titulo bold" style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.4 }}>
              COLEGIO BAUTISTA<br/>INTERNACIONAL<br/>DE SONSONATE
            </div>
          </div>
          <div className="divider" style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
            <span className="bold" style={{ fontWeight: 900 }}>RECIBO</span>
            <span className="bold" style={{ fontWeight: 900 }}>{fechaPago}</span>
          </div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>Hora: {horaPago}</div>
          <div className="divider" style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Nombre del estudiante:</div>
            <div className="bold" style={{ fontWeight: 900 }}>{cobro.estudiantes?.nombre} {cobro.estudiantes?.apellido}</div>
          </div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Grado:</div>
            <div className="bold" style={{ fontWeight: 900 }}>{cobro.estudiantes?.grados?.nombre}</div>
          </div>
          <div className="divider" style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Concepto:</div>
            <div className="bold" style={{ fontWeight: 900 }}>{cobro.conceptos_cobro?.nombre}</div>
          </div>
          {cobro.mes && (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Mes:</div>
              <div className="bold" style={{ fontWeight: 900 }}>{cobro.mes} {cobro.year_escolar}</div>
            </div>
          )}
          <div className="divider" style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#555' }}>Total pagado:</div>
            <div className="monto bold" style={{ fontWeight: 900, fontSize: 20 }}>${parseFloat(cobro.monto).toFixed(2)}</div>
          </div>
          <div className="divider" style={{ borderTop: '1px dashed #000', margin: '6px 0' }}/>
          <div style={{ textAlign: 'center', fontSize: 9, color: '#555', marginTop: 8 }}>
            <div className="bold" style={{ fontWeight: 900 }}>✓ PAGO REGISTRADO</div>
            <div style={{ marginTop: 4 }}>Conserve este comprobante</div>
            <div>— CBIS —</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button onClick={onClose} style={s.btnSecondary}>Cerrar</button>
          <button onClick={imprimir} style={s.btnPrimary}>🖨️ Imprimir</button>
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
  const [modalCobro, setModalCobro] = useState(false)
  const [modalPago, setModalPago] = useState(false)
  const [modalMora, setModalMora] = useState(false)
  const [ticketVisible, setTicketVisible] = useState(false)
  const [cobroSeleccionado, setCobroSeleccionado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    estudiante_id: '', concepto_id: '', monto: '',
    mes: '', year_escolar: new Date().getFullYear()
  })

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: est }, { data: con }, { data: cob }] = await Promise.all([
      supabase.from('estudiantes').select('id, nombre, apellido, grados(nombre)').order('apellido'),
      supabase.from('conceptos_cobro').select('*').eq('activo', true).order('tipo'),
      supabase.from('cobros').select(`
        *, estudiantes(nombre, apellido, grados(nombre)),
        conceptos_cobro(nombre, tipo)
      `).order('creado_en', { ascending: false })
    ])
    setEstudiantes(est || [])
    setConceptos(con || [])
    setCobros(cob || [])
    setLoading(false)
  }

  function onConceptoChange(concepto_id) {
    const concepto = conceptos.find(c => c.id === parseInt(concepto_id))
    setForm({ ...form, concepto_id, monto: concepto?.monto || '' })
  }

  // Calcular fecha de vencimiento automática (día 10 del mes seleccionado)
  function calcularVencimiento(mes, year) {
    if (!mes) return null
    const idxMes = meses.indexOf(mes)
    if (idxMes === -1) return null
    return new Date(year, idxMes, 10).toISOString().split('T')[0]
  }

  // Detectar si hoy ya pasó el día 10 del mes seleccionado
  function hayMora(mes, year) {
    if (!mes) return false
    const hoy = new Date()
    const vencimiento = new Date(year, meses.indexOf(mes), 10)
    return hoy > vencimiento
  }

  async function guardarCobro() {
    if (!form.estudiante_id || !form.concepto_id || !form.monto) {
      setError('Estudiante, concepto y monto son obligatorios')
      return
    }
    setGuardando(true)
    setError('')
    const vencimiento = calcularVencimiento(form.mes, form.year_escolar)
    const { error } = await supabase.from('cobros').insert([{
      estudiante_id: parseInt(form.estudiante_id),
      concepto_id: parseInt(form.concepto_id),
      monto: parseFloat(form.monto),
      fecha_vencimiento: vencimiento,
      mes: form.mes || null,
      year_escolar: form.year_escolar,
      estado: 'pendiente'
    }])
    if (error) {
      setError('Error: ' + error.message)
    } else {
      setModalCobro(false)
      resetForm()
      cargarDatos()
    }
    setGuardando(false)
  }

  function iniciarPago(cobro) {
    setCobroSeleccionado(cobro)
    // Detectar si hay mora aplicable
    const esMensualidad = cobro.conceptos_cobro?.tipo === 'mensualidad'
    if (esMensualidad && hayMora(cobro.mes, cobro.year_escolar)) {
      setModalMora(true)
    } else {
      setModalPago(true)
    }
  }

  async function registrarPago(conMora = false) {
  if (!cobroSeleccionado) return
  setGuardando(true)

  const montoBase = parseFloat(cobroSeleccionado.monto)
  const montoFinal = conMora ? parseFloat((montoBase * 1.25).toFixed(2)) : montoBase

  const { error } = await supabase.from('pagos').insert([{
    cobro_id: cobroSeleccionado.id,
    estudiante_id: cobroSeleccionado.estudiante_id,
    monto_pagado: montoFinal,
    metodo: 'presencial',
    recibido_por: perfil.id,
    fecha_pago: new Date().toISOString()
  }])

  if (!error) {
    await supabase.from('cobros')
      .update({ estado: 'pagado', monto: montoFinal })
      .eq('id', cobroSeleccionado.id)

    const cobroActualizado = cobros.find(c => c.id === cobroSeleccionado.id)
setCobroSeleccionado({ ...cobroSeleccionado, ...cobroActualizado, monto: montoFinal })
    setModalMora(false)
    setModalPago(false)
    await cargarDatos()
    setTicketVisible(true)
  }
  setGuardando(false)
}
async function anularCobro(cobro) {
  const motivo = window.prompt(`¿Motivo de anulación del cobro de ${cobro.estudiantes?.nombre} ${cobro.estudiantes?.apellido} por $${parseFloat(cobro.monto).toFixed(2)}?\n\nEjemplo: Pago duplicado, Error de monto, Devolución solicitada...`)
  if (motivo === null) return
  if (!motivo.trim()) {
    alert('❌ Debes ingresar un motivo para anular el cobro.')
    return
  }

  await supabase.from('cobros')
    .update({ estado: 'anulado', motivo_anulacion: motivo })
    .eq('id', cobro.id)
  
  await supabase.from('pagos')
    .update({ anulado: true, motivo_anulacion: motivo })
    .eq('cobro_id', cobro.id)

  cargarDatos()
}
  function resetForm() {
    setForm({ estudiante_id: '', concepto_id: '', monto: '', mes: '', year_escolar: new Date().getFullYear() })
    setError('')
  }

  const estadoColor = {
    pendiente: { bg: '#fef9c3', color: '#854d0e' },
    pagado: { bg: '#dcfce7', color: '#16a34a' },
    vencido: { bg: '#fee2e2', color: '#dc2626' },
    anulado: { bg: '#f3f4f6', color: '#6b7280' },
  }

  const filtrados = cobros.filter(c => {
    const nombre = `${c.estudiantes?.nombre} ${c.estudiantes?.apellido}`.toLowerCase()
    return nombre.includes(busqueda.toLowerCase()) ||
      c.conceptos_cobro?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  })

const totalPendiente = cobros.filter(c => c.estado === 'pendiente').reduce((a, c) => a + parseFloat(c.monto), 0)
const totalHoy = cobros.filter(c => c.estado === 'pagado').reduce((a, c) => a + parseFloat(c.monto), 0)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: '#5B2D8E', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>💰 Cobros</h1>
          <p style={{ color: '#888', fontSize: 13 }}>{cobros.length} cobros registrados</p>
        </div>
        <button onClick={() => setModalAbierto(true)} style={s.btnPrimary}>
  {esRecepcion ? '+ Registrar cobro' : '+ Nuevo Cobro'}
</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { icon: '📋', val: `$${totalPendiente.toFixed(2)}`, label: 'Pendiente de cobro', color: '#f59e0b' },
          { icon: '✅', val: `$${totalHoy.toFixed(2)}`, label: 'Cobrado hoy', color: '#16a34a' },
          { icon: '🧾', val: cobros.filter(c => c.estado === 'pendiente').length, label: 'Cobros pendientes', color: '#7B4DB8' },
          { icon: '🚨', val: cobros.filter(c => c.estado === 'vencido').length, label: 'Cobros vencidos', color: '#ef4444' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderLeft: `4px solid ${k.color}` }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.color, marginBottom: 4 }}>{k.val}</div>
            <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <input style={s.search} placeholder="🔍 Buscar por estudiante o concepto..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)}/>

      {/* Tabla */}
      <div style={s.card}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Cargando...</p>
        ) : filtrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>No hay cobros registrados aún</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>{['Estudiante','Grado','Concepto','Mes','Monto','Vencimiento','Estado','Acción'].map(h =>
                <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id} style={s.tr}>
                  <td style={s.td}>{c.estudiantes?.nombre} {c.estudiantes?.apellido}</td>
                  <td style={s.td}><span style={s.gradoBadge}>{c.estudiantes?.grados?.nombre || '—'}</span></td>
                  <td style={s.td}>{c.conceptos_cobro?.nombre}</td>
                  <td style={s.td}>{c.mes || '—'}</td>
                  <td style={s.td}><b>${parseFloat(c.monto).toFixed(2)}</b></td>
                  <td style={s.td}>{c.fecha_vencimiento ? new Date(c.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-SV') : '—'}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: estadoColor[c.estado]?.bg, color: estadoColor[c.estado]?.color }}>
                      {c.estado}
                    </span>
                  </td>
                  <td style={s.td}>
  <div style={{ display: 'flex', gap: 6 }}>
 {c.estado === 'pendiente' && (
  <button onClick={() => iniciarPago(c)} style={s.btnPagar}>
    💵 Registrar pago
  </button>
)}
{c.estado === 'pendiente' && !esRecepcion && (
  <button onClick={() => anularCobro(c)} style={s.btnAnular}>
    Anular
  </button>
)}
{c.estado === 'pagado' && (
  <button onClick={() => { setCobroSeleccionado(c); setTicketVisible(true) }} style={s.btnReimprimir}>
    🖨️ Reimprimir
  </button>
)}
{c.estado === 'pagado' && !esRecepcion && (
  <button onClick={() => anularCobro(c)} style={s.btnAnular}>
    🚫 Anular
  </button>
)}
  </div>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo cobro */}
      {modalCobro && (
        <div style={s.modalBg}>
          <div style={s.modalBox}>
            <h2 style={s.modalTitle}>➕ Nuevo Cobro</h2>
            <div style={s.field}>
              <label style={s.label}>Estudiante *</label>
              <select style={s.input} value={form.estudiante_id}
                onChange={e => setForm({ ...form, estudiante_id: e.target.value })}>
                <option value="">— Seleccione un estudiante —</option>
                {estudiantes.map(e => (
                  <option key={e.id} value={e.id}>{e.apellido}, {e.nombre} — {e.grados?.nombre}</option>
                ))}
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Concepto *</label>
              <select style={s.input} value={form.concepto_id} onChange={e => onConceptoChange(e.target.value)}>
                <option value="">— Seleccione un concepto —</option>
                {['matricula','mensualidad','mora','constancia','excursion'].map(tipo => (
                  <optgroup key={tipo} label={tipo.charAt(0).toUpperCase() + tipo.slice(1)}>
                    {conceptos.filter(c => c.tipo === tipo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} — ${c.monto}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Monto (USD) *</label>
                <input style={s.input} type="number" step="0.01" value={form.monto}
                  onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0.00"/>
              </div>
              <div style={s.field}>
                <label style={s.label}>Mes</label>
                <select style={s.input} value={form.mes}
                  onChange={e => setForm({ ...form, mes: e.target.value })}>
                  <option value="">— Sin mes —</option>
                  {meses.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            {/* Mostrar fecha de vencimiento calculada automáticamente */}
            {form.mes && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#0369a1' }}>
                📅 Fecha de vencimiento: <b>10 de {form.mes} {form.year_escolar}</b>
                {hayMora(form.mes, form.year_escolar) && (
                  <span style={{ color: '#dc2626', fontWeight: 700, marginLeft: 8 }}>⚠️ Ya venció — aplica mora</span>
                )}
              </div>
            )}
            <div style={s.field}>
              <label style={s.label}>Año escolar</label>
              <input style={s.input} type="number" value={form.year_escolar}
                onChange={e => setForm({ ...form, year_escolar: parseInt(e.target.value) })}/>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalCobro(false); resetForm() }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={guardarCobro} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ¿Aplicar mora? */}
      {modalMora && cobroSeleccionado && (
        <div style={s.modalBg}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Este cobro tiene mora</h2>
            <p style={{ color: '#555', fontSize: 13, marginBottom: 8, lineHeight: 1.7 }}>
              El plazo de pago venció el <b>10 de {cobroSeleccionado.mes}</b>.<br/>
              Aplica un recargo del <b>25%</b> por atraso.
            </p>
            <div style={{ background: '#fef9c3', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Monto original: <b>${parseFloat(cobroSeleccionado.monto).toFixed(2)}</b></div>
              <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 4 }}>+ Mora (25%): <b>${(parseFloat(cobroSeleccionado.monto) * 0.25).toFixed(2)}</b></div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#5B2D8E' }}>Total: <b>${(parseFloat(cobroSeleccionado.monto) * 1.25).toFixed(2)}</b></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setModalMora(false); setModalPago(true) }} style={s.btnSecondary}>
                Sin mora
              </button>
              <button onClick={() => registrarPago(true)} style={{ ...s.btnPrimary, background: '#dc2626' }} disabled={guardando}>
                {guardando ? 'Registrando...' : '⚠️ Cobrar con mora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar pago */}
      {modalPago && cobroSeleccionado && (
        <div style={s.modalBg}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💵</div>
            <h2 style={s.modalTitle}>Confirmar pago presencial</h2>
            <div style={{ background: '#f8faff', borderRadius: 12, padding: 16, marginBottom: 20, textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                <b>Estudiante:</b> {cobroSeleccionado.estudiantes?.nombre} {cobroSeleccionado.estudiantes?.apellido}
              </p>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                <b>Concepto:</b> {cobroSeleccionado.conceptos_cobro?.nombre}
              </p>
              {cobroSeleccionado.mes && (
                <p style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
                  <b>Mes:</b> {cobroSeleccionado.mes} {cobroSeleccionado.year_escolar}
                </p>
              )}
              <p style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', marginTop: 10 }}>
                Total: ${parseFloat(cobroSeleccionado.monto).toFixed(2)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setModalPago(false); setCobroSeleccionado(null) }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={() => registrarPago(false)} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Registrando...' : '✅ Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket térmico */}
      {ticketVisible && cobroSeleccionado && (
        <TicketTérmico
          cobro={cobroSeleccionado}
          onClose={() => { setTicketVisible(false); setCobroSeleccionado(null) }}
        />
      )}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  search: { width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, marginBottom: 16, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #f0f4ff' },
  tr: { borderBottom: '1px solid #f8faff' },
  td: { padding: '12px 16px', fontSize: 14, color: '#333' },
  gradoBadge: { background: '#eff6ff', color: '#5B2D8E', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #dde3ee', background: '#fff', color: '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnPagar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  btnAnular: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  btnReimprimir: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#eff6ff', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { color: '#5B2D8E', fontSize: 17, fontWeight: 800, marginBottom: 20 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #dde3ee', fontSize: 14, background: '#f8faff', color: '#222', boxSizing: 'border-box' },
}