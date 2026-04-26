import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import { usePadreHijo } from '../../hooks/usePadreHijo.jsx'
import { useYearEscolar } from '../../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const TIPOS = [
  { value:'permiso_ausencia',   label:'Permiso de ausencia',      desc:'Su hijo/a no se presentará ese día. Se justifica la inasistencia automáticamente.' },
  { value:'llegada_tardia',     label:'Llegada tardía',           desc:'Su hijo/a llegará tarde. Notifica al docente encargado y recepción.' },
  { value:'retiro_anticipado',  label:'Retiro anticipado',        desc:'Su hijo/a será retirado antes de terminar la jornada. Requiere aprobación del encargado.' },
  { value:'reunion_encargado',  label:'Reunión con encargado',    desc:'El encargado del grado confirmará fecha y hora.' },
  { value:'reunion_direccion',  label:'Reunión con dirección',    desc:'Dirección académica agendará fecha y hora.' },
  { value:'constancia_pago',    label:'Constancia de pago',       desc:'Constancia de pagos realizados — genera cobro de $4.00.' },
  { value:'constancia_estudio', label:'Constancia de estudio',    desc:'Constancia de alumno activo — genera cobro de $4.00.' },
]

const ESTADO_META = {
  pendiente: { label:'Pendiente',  color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  aprobado:  { label:'Aprobado',   color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  rechazado: { label:'Rechazado',  color:'#dc2626', bg:'#fef2f2', border:'#fecdd3' },
  cerrado:   { label:'Cerrado',    color:'#6b7280', bg:'#f9fafb', border:'#e5e7eb' },
}

const IcoPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IcoBack = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IcoMsg  = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1c4e9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IcoCal  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IcoInfo = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>

function Badge({ estado }) {
  const m = ESTADO_META[estado] || ESTADO_META.pendiente
  return <span style={{ fontSize:11, fontWeight:700, color:m.color, background:m.bg, border:`1px solid ${m.border}`, borderRadius:20, padding:'3px 10px' }}>{m.label}</span>
}

const CONSTANCIAS   = ['constancia_pago','constancia_estudio']
const CON_FECHA_EVT = ['permiso_ausencia','llegada_tardia','retiro_anticipado']  // fecha del evento
const CON_RETIRANTE = ['retiro_anticipado']  // requieren nombre+DUI de quien retira

export default function PadreSolicitudes() {
  const { perfil }    = useAuth()
  const { hijoActual } = usePadreHijo()
  const { yearEscolar } = useYearEscolar()

  const [solicitudes, setSolicitudes] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modo,        setModo]        = useState('lista')
  const [guardando,   setGuardando]   = useState(false)
  const [form, setForm] = useState({
    tipo: 'permiso_ausencia', motivo: '', fecha_evento: '',
    retira_nombre: '', retira_dui: '',
  })

  useEffect(() => { if (perfil) cargar() }, [perfil])

  async function cargar() {
    if (!perfil?.id) return
    setLoading(true)
    const { data } = await supabase.from('solicitudes')
      .select('id, tipo, estado, motivo, respuesta, fecha_cita, creado_en')
      .eq('solicitante_id', perfil.id)
      .order('creado_en', { ascending: false })
    setSolicitudes(data || [])
    setLoading(false)
  }

  async function enviar() {
    if (!form.motivo.trim()) { toast.error('Escribe el motivo de tu solicitud'); return }
    if (CON_FECHA_EVT.includes(form.tipo) && !form.fecha_evento) { toast.error('Indica la fecha'); return }
    if (CON_RETIRANTE.includes(form.tipo) && !form.retira_nombre.trim()) { toast.error('Indica el nombre de quien retirará al estudiante'); return }
    if (CON_RETIRANTE.includes(form.tipo) && !form.retira_dui.trim())    { toast.error('Indica el DUI de quien retirará al estudiante'); return }
    setGuardando(true)

    const esConstancia = CONSTANCIAS.includes(form.tipo)
    const esRetiro     = form.tipo === 'retiro_anticipado'

    // Resolver encargado del grado
    let encargadoId = null
    if (hijoActual?.grado_id) {
      const { data: grado } = await supabase.from('grados')
        .select('encargado_id').eq('id', hijoActual.grado_id).single()
      encargadoId = grado?.encargado_id || null
    }

    // Retiro: nombre y DUI van al motivo como respaldo
    const motivoFinal = esRetiro
      ? `${form.motivo.trim()}\n[RETIRO] Retira: ${form.retira_nombre.trim()} · DUI: ${form.retira_dui.trim()}`
      : form.motivo.trim()

    const { error: solError } = await supabase.from('solicitudes').insert({
      tipo:           form.tipo,
      solicitante_id: perfil.id,
      estudiante_id:  hijoActual?.id       || null,
      grado_id:       hijoActual?.grado_id || null,
      motivo:         motivoFinal,
      estado:         'pendiente',
      año_escolar:    yearEscolar || new Date().getFullYear(),
      ...(CON_FECHA_EVT.includes(form.tipo) && form.fecha_evento ? { fecha_asistencia: form.fecha_evento } : {}),
    }).select('id').single()

    if (solError) { toast.error('Error al enviar la solicitud'); setGuardando(false); return }

    // Constancia → cobro $4
    if (esConstancia && hijoActual) {
      const { data: concepto } = await supabase.from('conceptos_cobro')
        .select('id').eq('tipo', 'constancia').single()
      if (concepto) {
        const venc = new Date(); venc.setDate(venc.getDate() + 7)
        await supabase.from('cobros').insert({
          estudiante_id: hijoActual.id, concepto_id: concepto.id,
          monto: 4.00, estado: 'pendiente',
          year_escolar: yearEscolar || new Date().getFullYear(),
          fecha_vencimiento: venc.toISOString().split('T')[0],
        })
      }
    }

    // Routing notificaciones
    if (['permiso_ausencia','llegada_tardia','retiro_anticipado','reunion_encargado'].includes(form.tipo)) {
      // → docente encargado (+ recepción para llegada tardía)
      const ids = encargadoId ? [encargadoId] : []
      if (form.tipo === 'llegada_tardia') {
        const { data: recep } = await supabase.from('perfiles').select('id').eq('rol', 'recepcion')
        ids.push(...(recep || []).map(p => p.id))
      }
      if (ids.length) await notificarPadre(ids, form.tipo, hijoActual)
    } else if (form.tipo === 'reunion_direccion') {
      const { data: dir } = await supabase.from('perfiles').select('id').in('rol', ['direccion_academica','admin'])
      await notificarPadre((dir || []).map(p => p.id), form.tipo, hijoActual)
    } else if (esConstancia) {
      const { data: recep } = await supabase.from('perfiles').select('id').eq('rol', 'recepcion')
      await notificarPadre((recep || []).map(p => p.id), form.tipo, hijoActual)
    }

    setGuardando(false)
    toast.success(
      esConstancia ? 'Solicitud enviada — se generó un cobro de $4.00 en recepción' :
      esRetiro     ? 'Solicitud de retiro enviada — esperando aprobación del encargado' :
                     'Solicitud enviada correctamente'
    )
    setForm({ tipo:'permiso_ausencia', motivo:'', fecha_evento:'', retira_nombre:'', retira_dui:'' })
    setModo('lista')
    cargar()
  }

  async function notificarPadre(ids, tipo, hijo) {
    if (!ids.length) return
    const nombreHijo = hijo ? `${hijo.nombre} ${hijo.apellido}` : 'un estudiante'
    const tipoLabel  = TIPOS.find(t => t.value === tipo)?.label || tipo
    const lote = ids.map(id => ({
      usuario_id: id, tipo: 'solicitud',
      titulo: `Nueva solicitud: ${tipoLabel}`,
      mensaje: `Solicitud de padre/tutor para ${nombreHijo}`,
      link: 'solicitudes',
    }))
    for (let i = 0; i < lote.length; i += 50) {
      await supabase.from('notificaciones').insert(lote.slice(i, i + 50))
    }
  }

  const tipoMeta           = (tipo) => TIPOS.find(t => t.value === tipo) || { label: tipo }
  const esConstanciaActual = CONSTANCIAS.includes(form.tipo)
  const conFechaEvt        = CON_FECHA_EVT.includes(form.tipo)
  const conRetirante       = CON_RETIRANTE.includes(form.tipo)

  return (
    <div style={{ maxWidth:720, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:20, color:'#0f1d40', letterSpacing:'-0.5px', marginBottom:4 }}>Solicitudes</div>
          <div style={{ fontSize:13, color:'#9ca3af' }}>{hijoActual?.nombre} {hijoActual?.apellido}</div>
        </div>
        <button onClick={() => setModo(modo === 'nueva' ? 'lista' : 'nueva')}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 20px', borderRadius:20, border:'none', background: modo === 'nueva' ? '#f3eeff' : 'linear-gradient(135deg,#2d1554,#5B2D8E)', color: modo === 'nueva' ? '#5B2D8E' : '#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow: modo === 'nueva' ? 'none' : '0 4px 12px rgba(91,45,142,0.3)' }}>
          {modo === 'nueva' ? <><IcoBack /> Volver</> : <><IcoPlus /> Nueva solicitud</>}
        </button>
      </div>

      {modo === 'nueva' ? (
        <div style={{ background:'#fff', borderRadius:16, padding:'28px', boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff' }}>
          <div style={{ fontWeight:800, fontSize:16, color:'#0f1d40', marginBottom:20 }}>Nueva solicitud</div>

          {/* Tipos */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>Tipo de solicitud</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
              {TIPOS.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                  style={{ padding:'12px 14px', borderRadius:12, border: form.tipo === t.value ? '2px solid #5B2D8E' : '1.5px solid #e9e3ff', background: form.tipo === t.value ? '#f8f7ff' : '#fff', cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.15s' }}>
                  <div style={{ fontWeight:700, fontSize:12, color: form.tipo === t.value ? '#5B2D8E' : '#0f1d40', marginBottom:3 }}>{t.label}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', lineHeight:1.4 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aviso constancia */}
          {esConstanciaActual && (
            <div style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'12px 14px', background:'rgba(212,160,23,0.08)', border:'1px solid rgba(212,160,23,0.25)', borderRadius:10, marginBottom:20 }}>
              <span style={{ flexShrink:0, marginTop:1 }}><IcoInfo /></span>
              <span style={{ fontSize:12, color:'#92400e', fontWeight:600, lineHeight:1.5 }}>
                Esta solicitud genera un cobro de <strong>$4.00</strong> que deberá cancelarse en recepción del colegio antes de recibir el documento.
              </span>
            </div>
          )}

          {/* Fecha del evento */}
          {conFechaEvt && (
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>
                {form.tipo === 'permiso_ausencia' ? 'Fecha de ausencia' :
                 form.tipo === 'llegada_tardia'   ? 'Fecha de llegada tardía' :
                                                    'Fecha del retiro'}
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#f8f7ff', border:'1.5px solid #e9e3ff', borderRadius:11 }}>
                <IcoCal />
                <input type="date" value={form.fecha_evento}
                  onChange={e => setForm(f => ({ ...f, fecha_evento: e.target.value }))}
                  style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:14, fontWeight:500, color:'#0f1d40', fontFamily:'inherit' }} />
              </div>
            </div>
          )}

          {/* Datos de quien retira — solo retiro_anticipado */}
          {conRetirante && (
            <div style={{ marginBottom:20, padding:'16px 14px', background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:11 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#c2410c', textTransform:'uppercase', letterSpacing:'1px', marginBottom:12 }}>Datos de quien retira</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', marginBottom:6 }}>Nombre completo</label>
                  <input type="text" placeholder="Ej: María García" value={form.retira_nombre}
                    onChange={e => setForm(f => ({ ...f, retira_nombre: e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', background:'#fff', border:'1.5px solid #fed7aa', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#6b7280', marginBottom:6 }}>DUI</label>
                  <input type="text" placeholder="00000000-0" value={form.retira_dui}
                    onChange={e => setForm(f => ({ ...f, retira_dui: e.target.value }))}
                    style={{ width:'100%', padding:'10px 12px', background:'#fff', border:'1.5px solid #fed7aa', borderRadius:9, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
                </div>
              </div>
              <div style={{ fontSize:11, color:'#92400e', marginTop:10, fontWeight:500 }}>
                Incluir datos aunque sea el padre o madre quien retira.
              </div>
            </div>
          )}

          {/* Motivo */}
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Motivo / Descripción</label>
            <textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
              placeholder="Describe brevemente el motivo de tu solicitud…"
              rows={4}
              style={{ width:'100%', padding:'12px 14px', background:'#f8f7ff', border:'1.5px solid #e9e3ff', borderRadius:11, fontSize:14, color:'#0f1d40', fontFamily:'inherit', resize:'vertical', outline:'none', lineHeight:1.6 }} />
          </div>

          <button onClick={enviar} disabled={guardando}
            style={{ width:'100%', padding:'13px', borderRadius:11, border:'none', background:'linear-gradient(135deg,#2d1554,#5B2D8E)', color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(91,45,142,0.35)', opacity: guardando ? 0.6 : 1 }}>
            {guardando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      ) : (
        <>
          {loading ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontWeight:600 }}>Cargando…</div>
          ) : solicitudes.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 0' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}><IcoMsg /></div>
              <div style={{ color:'#9ca3af', fontSize:14 }}>Aún no has enviado solicitudes</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {solicitudes.map(s => (
                <div key={s.id} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(91,45,142,0.06)', border:'1px solid #f0ebff' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom: s.respuesta ? 12 : 0 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:'#0f1d40', marginBottom:3 }}>{tipoMeta(s.tipo).label}</div>
                      <div style={{ fontSize:12, color:'#6b7280', marginBottom:4, lineHeight:1.5 }}>{s.motivo}</div>
                      <div style={{ fontSize:11, color:'#c4b5fd' }}>
                        {new Date(s.creado_en).toLocaleDateString('es-SV', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        {s.fecha_cita && ` · Cita: ${new Date(s.fecha_cita + 'T00:00:00').toLocaleDateString('es-SV', { day:'numeric', month:'short' })}`}
                      </div>
                    </div>
                    <Badge estado={s.estado} />
                  </div>
                  {s.respuesta && (
                    <div style={{ padding:'10px 14px', background:'#f8f7ff', borderRadius:10, border:'1px solid #e9e3ff', fontSize:12, color:'#3d1f61', fontWeight:500, lineHeight:1.5 }}>
                      <span style={{ fontWeight:700, color:'#5B2D8E' }}>Respuesta: </span>{s.respuesta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
