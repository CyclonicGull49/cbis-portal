import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const TIPOS = {
  examen:               { label: 'Examen/Evaluación',   color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
  excursion:            { label: 'Excursión',            color: '#0e9490', bg: '#e0f7f6', dot: '#0e9490' },
  feriado:              { label: 'Feriado/Asueto',       color: '#d97706', bg: '#fffbeb', dot: '#d97706' },
  actividad:            { label: 'Actividad',            color: '#5B2D8E', bg: '#f3eeff', dot: '#5B2D8E' },
  otro:                 { label: 'Otro',                 color: '#6b7280', bg: '#f9fafb', dot: '#6b7280' },
  recordatorio_docente: { label: 'Recordatorio docente', color: '#0369a1', bg: '#e0f2fe', dot: '#0284c7' },
}

const MESES      = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function esFechaEnRango(fecha, inicio, fin) {
  const d = new Date(fecha + 'T12:00:00')
  const i = new Date(inicio + 'T12:00:00')
  const f = fin ? new Date(fin + 'T12:00:00') : i
  return d >= i && d <= f
}
function formatFecha(fechaStr, opciones) {
  return new Date(fechaStr + 'T12:00:00').toLocaleDateString('es-SV', opciones)
}

export default function Calendario() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const puedeEditar = ['admin', 'direccion_academica'].includes(perfil?.rol)
  const esAlumno    = perfil?.rol === 'alumno'

  const hoy = new Date()
  const [mes,        setMes]        = useState(hoy.getMonth())
  const [anio,       setAnio]       = useState(hoy.getFullYear())
  const [eventos,    setEventos]    = useState([])
  const [detalle,    setDetalle]    = useState(null)
  const [modalForm,  setModalForm]  = useState(false)
  const [guardando,  setGuardando]  = useState(false)
  const [editando,   setEditando]   = useState(null)
  const [form,       setForm]       = useState({ titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', tipo: 'actividad' })

  useEffect(() => { cargarEventos() }, [year])

  async function cargarEventos() {
    let q = supabase.from('eventos_calendario').select('*').eq('año_escolar', year).order('fecha_inicio')
    if (esAlumno) q = q.neq('tipo', 'recordatorio_docente')
    const { data } = await q
    setEventos(data || [])
  }

  const primerDia  = new Date(anio, mes, 1).getDay()
  const diasEnMes  = new Date(anio, mes + 1, 0).getDate()
  const totalCeldas = Math.ceil((primerDia + diasEnMes) / 7) * 7

  function getEventosDia(dia) {
    const f = `${anio}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
    return eventos.filter(e => esFechaEnRango(f, e.fecha_inicio, e.fecha_fin))
  }

  const hoyStr     = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`
  const proximos   = eventos.filter(e => e.fecha_inicio >= hoyStr).slice(0, 8)
  const eventosMes = eventos.filter(e => {
    const ini = new Date(e.fecha_inicio + 'T12:00:00')
    const fin = e.fecha_fin ? new Date(e.fecha_fin + 'T12:00:00') : ini
    return (ini.getMonth() === mes && ini.getFullYear() === anio) ||
           (fin.getMonth() === mes && fin.getFullYear() === anio)
  })

  function navMes(delta) {
    const d = new Date(anio, mes + delta)
    setMes(d.getMonth()); setAnio(d.getFullYear()); setDetalle(null)
  }

  async function guardarEvento() {
    if (!form.titulo || !form.fecha_inicio) { toast.error('Título y fecha son obligatorios'); return }
    setGuardando(true)
    const payload = { ...form, año_escolar: year, creado_por: perfil.id, fecha_fin: form.fecha_fin || null }
    const { error } = editando
      ? await supabase.from('eventos_calendario').update(payload).eq('id', editando)
      : await supabase.from('eventos_calendario').insert(payload)
    if (error) toast.error('Error al guardar')
    else {
      toast.success(editando ? 'Evento actualizado' : 'Evento creado')
      setModalForm(false); setEditando(null)
      setForm({ titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', tipo: 'actividad' })
      cargarEventos()
    }
    setGuardando(false)
  }

  async function eliminarEvento(id) {
    if (!window.confirm('¿Eliminar este evento?')) return
    await supabase.from('eventos_calendario').delete().eq('id', id)
    toast.success('Evento eliminado'); setDetalle(null); cargarEventos()
  }

  function abrirEditar(ev) {
    setForm({ titulo: ev.titulo, descripcion: ev.descripcion || '', fecha_inicio: ev.fecha_inicio, fecha_fin: ev.fecha_fin || '', tipo: ev.tipo })
    setEditando(ev.id); setDetalle(null); setModalForm(true)
  }

  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()

  return (
    <div style={{ fontFamily:'Plus Jakarta Sans,system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ color:'#3d1f61', fontSize:22, fontWeight:800, marginBottom:4 }}>Calendario Escolar</h1>
          <p style={{ color:'#b0a8c0', fontSize:13 }}>{eventos.length} eventos — Año {year}</p>
        </div>
        {puedeEditar && (
          <button onClick={() => { setEditando(null); setForm({ titulo:'', descripcion:'', fecha_inicio:'', fecha_fin:'', tipo:'actividad' }); setModalForm(true) }}
            style={s.btnPrimary}>+ Nuevo evento</button>
        )}
      </div>



      <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'flex-start' }}>

        {/* ── Grilla ── */}
        <div style={{ flex:'1 1 340px', background:'#fff', borderRadius:16, boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff', overflow:'hidden' }}>
          {/* Nav mes */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #f3eeff' }}>
            <button onClick={() => navMes(-1)} style={s.navBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:15, fontWeight:800, color:'#0f1d40' }}>{MESES[mes]} {anio}</span>

            </div>
            <button onClick={() => navMes(1)} style={s.navBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Cabecera días */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'8px 12px 4px', borderBottom:'1px solid #f3eeff' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#9ca3af' }}>{d}</div>
            ))}
          </div>

          {/* Celdas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, padding:'4px 12px 12px' }}>
            {Array.from({ length: totalCeldas }).map((_, i) => {
              const dia    = i - primerDia + 1
              const valido = dia >= 1 && dia <= diasEnMes
              if (!valido) return <div key={i} />
              const evs      = getEventosDia(dia)
              const hoyDia   = esHoy(dia)
              const tieneEvs = evs.length > 0
              return (
                <div key={i}
                  onClick={() => tieneEvs && setDetalle({ dia, eventos: evs })}
                  style={{ aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:9, background: hoyDia ? '#5B2D8E' : tieneEvs ? `${TIPOS[evs[0]?.tipo]?.dot || '#5B2D8E'}14` : 'transparent', cursor: tieneEvs ? 'pointer' : 'default', transition:'all 0.15s', gap:2,
                    ...(tieneEvs && !hoyDia ? { boxShadow:`0 0 0 1.5px ${TIPOS[evs[0]?.tipo]?.dot || '#5B2D8E'}30` } : {})
                  }}>
                  <span style={{ fontSize:12, fontWeight: hoyDia || tieneEvs ? 800 : 500, color: hoyDia ? '#fff' : tieneEvs ? '#0f1d40' : '#6b7280' }}>{dia}</span>
                  {tieneEvs && (
                    <div style={{ display:'flex', gap:2 }}>
                      {evs.slice(0,3).map((e, ei) => (
                        <div key={ei} style={{ width:5, height:5, borderRadius:'50%', background: hoyDia ? 'rgba(255,255,255,0.8)' : (TIPOS[e.tipo]?.dot || '#5B2D8E') }} />
                      ))}
                      {evs.length > 3 && <div style={{ width:5, height:5, borderRadius:'50%', background:'#9ca3af' }} />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Panel lateral ── */}
        <div style={{ flex:'1 1 240px', display:'flex', flexDirection:'column', gap:12 }}>

          {/* Detalle del día */}
          {detalle ? (
            <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:14, color:'#0f1d40' }}>{MESES[mes]} {detalle.dia}</div>
                <button onClick={() => setDetalle(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:20, lineHeight:1 }}>×</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {detalle.eventos.map((ev, i) => (
                  <div key={i} style={{ background: TIPOS[ev.tipo]?.bg || '#f9fafb', borderRadius:12, padding:'12px 14px', borderLeft:`3px solid ${TIPOS[ev.tipo]?.dot || '#5B2D8E'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                      <div style={{ flex:1 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:TIPOS[ev.tipo]?.color, display:'block', marginBottom:3 }}>{TIPOS[ev.tipo]?.label}</span>
                        <div style={{ fontWeight:700, fontSize:13, color:'#0f1d40' }}>{ev.titulo}</div>
                        {ev.descripcion && <div style={{ fontSize:11, color:'#6b7280', marginTop:3, lineHeight:1.4 }}>{ev.descripcion}</div>}
                        {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && (
                          <div style={{ fontSize:10, color:'#9ca3af', marginTop:3 }}>Hasta: {formatFecha(ev.fecha_fin, { day:'numeric', month:'short' })}</div>
                        )}
                      </div>
                      {puedeEditar && (
                        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                          <button onClick={() => abrirEditar(ev)} style={{ padding:'3px 8px', borderRadius:7, border:'1px solid #e5e7eb', background:'#fff', color:'#5B2D8E', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Editar</button>
                          <button onClick={() => eliminarEvento(ev.id)} style={{ padding:'3px 8px', borderRadius:7, border:'none', background:'#fef2f2', color:'#dc2626', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Eliminar</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Próximos eventos */
            <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff' }}>
              <div style={{ fontWeight:800, fontSize:14, color:'#0f1d40', marginBottom:14 }}>Próximos eventos</div>
              {proximos.length === 0 ? (
                <div style={{ color:'#9ca3af', fontSize:13, textAlign:'center', padding:'16px 0' }}>No hay eventos próximos</div>
              ) : proximos.map((e, i) => (
                <div key={i} onClick={() => {
                  const dia = parseInt(e.fecha_inicio.split('-')[2])
                  const evMes = parseInt(e.fecha_inicio.split('-')[1]) - 1
                  const evAnio = parseInt(e.fecha_inicio.split('-')[0])
                  setMes(evMes); setAnio(evAnio)
                  setDetalle({ dia, eventos: eventos.filter(ev => ev.fecha_inicio === e.fecha_inicio) })
                }}
                  style={{ display:'flex', gap:10, padding:'8px 0', borderBottom: i < proximos.length - 1 ? '1px solid #f3eeff' : 'none', cursor:'pointer' }}>
                  <div style={{ width:4, borderRadius:2, background: TIPOS[e.tipo]?.dot || '#5B2D8E', flexShrink:0, minHeight:36, alignSelf:'stretch' }} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:12, color:'#0f1d40' }}>{e.titulo}</div>
                    <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>
                      {formatFecha(e.fecha_inicio, { weekday:'short', day:'numeric', month:'short' })}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Este mes */}
          {!detalle && eventosMes.length > 0 && (
            <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff', maxHeight:220, overflowY:'auto' }}>
              <div style={{ fontWeight:800, fontSize:14, color:'#0f1d40', marginBottom:12 }}>Este mes</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {eventosMes.map((ev, i) => (
                  <div key={i} onClick={() => {
                    const dia = parseInt(ev.fecha_inicio.split('-')[2])
                    setDetalle({ dia, eventos: getEventosDia(dia) })
                  }} style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 10px', borderRadius:9, background: TIPOS[ev.tipo]?.bg || '#f9fafb', cursor:'pointer', borderLeft:`2.5px solid ${TIPOS[ev.tipo]?.dot || '#5B2D8E'}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#0f1d40' }}>{ev.titulo}</div>
                      <div style={{ fontSize:10, color:'#9ca3af' }}>{formatFecha(ev.fecha_inicio, { day:'numeric', month:'short' })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear/editar */}
      {modalForm && (
        <div style={s.modalBg} onClick={() => setModalForm(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ color:'#3d1f61', fontSize:17, fontWeight:800, marginBottom:20 }}>
              {editando ? 'Editar evento' : 'Nuevo evento'}
            </h2>
            <div style={s.field}>
              <label style={s.label}>Título *</label>
              <input style={s.input} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Nombre del evento" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Descripción</label>
              <textarea style={{ ...s.input, resize:'vertical', minHeight:70 }} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción opcional..." />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={s.field}>
                <label style={s.label}>Fecha inicio *</label>
                <input style={s.input} type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Fecha fin</label>
                <input style={s.input} type="date" value={form.fecha_fin} min={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Tipo</label>
              <select style={s.input} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(TIPOS)
                  .filter(([k]) => k !== 'recordatorio_docente' || perfil?.rol === 'docente' || puedeEditar)
                  .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
              <button onClick={() => setModalForm(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={guardarEvento} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  navBtn:       { background:'#f8f7ff', border:'1px solid #e9e3ff', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#5B2D8E', display:'flex', alignItems:'center', justifyContent:'center' },
  btnPrimary:   { padding:'10px 20px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#5B2D8E,#3d1f61)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Plus Jakarta Sans,system-ui,sans-serif' },
  btnSecondary: { padding:'10px 20px', borderRadius:10, border:'1.5px solid #e5e7eb', background:'#fff', color:'#555', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'Plus Jakarta Sans,system-ui,sans-serif' },
  modalBg:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:16 },
  modalBox:     { background:'#fff', borderRadius:16, padding:'28px 24px', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.25)', fontFamily:'Plus Jakarta Sans,system-ui,sans-serif', maxHeight:'90vh', overflowY:'auto' },
  field:        { marginBottom:14 },
  label:        { display:'block', fontSize:10, fontWeight:700, color:'#5B2D8E', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' },
  input:        { width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:14, background:'#f9fafb', color:'#222', boxSizing:'border-box', fontFamily:'Plus Jakarta Sans,system-ui,sans-serif', outline:'none' },
}
