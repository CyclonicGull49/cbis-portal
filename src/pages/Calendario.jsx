import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const TIPOS = {
  examen:    { label: 'Examen/Evaluación', color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
  excursion: { label: 'Excursión',         color: '#0e9490', bg: '#e0f7f6', dot: '#0e9490' },
  feriado:   { label: 'Feriado/Asueto',   color: '#d97706', bg: '#fffbeb', dot: '#d97706' },
  actividad: { label: 'Actividad',         color: '#5B2D8E', bg: '#f3eeff', dot: '#5B2D8E' },
  otro:      { label: 'Otro',             color: '#6b7280', bg: '#f9fafb', dot: '#6b7280' },
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
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
  const esAlumno = perfil?.rol === 'alumno'

  const hoy = new Date()
  const [mesActual, setMesActual] = useState(hoy.getMonth())
  const [anioActual, setAnioActual] = useState(hoy.getFullYear())
  const [eventos, setEventos] = useState([])
  const [modalDetalle, setModalDetalle] = useState(null)
  const [modalForm, setModalForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', tipo: 'actividad' })

  useEffect(() => { cargarEventos() }, [year])

  async function cargarEventos() {
    const { data } = await supabase.from('eventos_calendario')
      .select('*').eq('año_escolar', year).order('fecha_inicio')
    setEventos(data || [])
  }

  function diasEnMes(mes, anio) { return new Date(anio, mes + 1, 0).getDate() }
  function primerDiaSemana(mes, anio) { return new Date(anio, mes, 1).getDay() }

  function getEventosDia(dia) {
    const fechaStr = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return eventos.filter(e => esFechaEnRango(fechaStr, e.fecha_inicio, e.fecha_fin))
  }

  const totalDias = diasEnMes(mesActual, anioActual)
  const primerDia = primerDiaSemana(mesActual, anioActual)
  const celdas = Array.from({ length: primerDia + totalDias }, (_, i) => i < primerDia ? null : i - primerDia + 1)
  while (celdas.length % 7 !== 0) celdas.push(null)

  const eventosMes = eventos.filter(e => {
    const ini = new Date(e.fecha_inicio + 'T12:00:00')
    const fin = e.fecha_fin ? new Date(e.fecha_fin + 'T12:00:00') : ini
    return (ini.getMonth() === mesActual && ini.getFullYear() === anioActual) ||
           (fin.getMonth() === mesActual && fin.getFullYear() === anioActual) ||
           (ini <= new Date(anioActual, mesActual, 1) && fin >= new Date(anioActual, mesActual + 1, 0))
  })

  const proximosEventos = eventos
    .filter(e => new Date(e.fecha_inicio + 'T12:00:00') >= hoy)
    .slice(0, 6)

  function mesAnterior() {
    const d = new Date(anioActual, mesActual - 1)
    setMesActual(d.getMonth()); setAnioActual(d.getFullYear())
  }
  function mesSiguiente() {
    const d = new Date(anioActual, mesActual + 1)
    setMesActual(d.getMonth()); setAnioActual(d.getFullYear())
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
    toast.success('Evento eliminado'); setModalDetalle(null); cargarEventos()
  }

  function abrirEditar(ev) {
    setForm({ titulo: ev.titulo, descripcion: ev.descripcion || '', fecha_inicio: ev.fecha_inicio, fecha_fin: ev.fecha_fin || '', tipo: ev.tipo })
    setEditando(ev.id); setModalDetalle(null); setModalForm(true)
  }

  // ── Grilla calendario ─────────────────────────
  function GrillaCalendario({ maxEventosPorDia = 3 }) {
    return (
      <div style={{ width: '100%', tableLayout: 'fixed' }}>
        {/* Cabecera */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '2px solid #f3eeff' }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#b0a8c0', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>
        {/* Celdas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          {celdas.map((dia, i) => {
            const evsDia = dia ? getEventosDia(dia) : []
            const esHoy = dia && anioActual === hoy.getFullYear() && mesActual === hoy.getMonth() && dia === hoy.getDate()
            const esFinde = i % 7 === 0 || i % 7 === 6
            return (
              <div key={i}
                onClick={() => dia && evsDia.length && setModalDetalle({ dia, eventos: evsDia })}
                style={{
                  minHeight: 72,
                  padding: '4px',
                  borderTop: '1px solid #f3eeff',
                  borderLeft: i % 7 !== 0 ? '1px solid #f3eeff' : 'none',
                  background: esHoy ? '#faf8ff' : esFinde && dia ? '#fafafa' : '#fff',
                  cursor: dia && evsDia.length ? 'pointer' : 'default',
                  overflow: 'hidden',
                  minWidth: 0,
                }}>
                {dia && (
                  <>
                    <div style={{
                      fontSize: 11, fontWeight: 700, marginBottom: 2,
                      width: 20, height: 20, borderRadius: '50%',
                      background: esHoy ? '#5B2D8E' : 'transparent',
                      color: esHoy ? '#fff' : esFinde ? '#9ca3af' : '#374151',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>{dia}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                      {evsDia.slice(0, maxEventosPorDia).map(ev => (
                        <div key={ev.id} style={{
                          fontSize: 9, fontWeight: 600,
                          color: TIPOS[ev.tipo]?.color || '#6b7280',
                          background: TIPOS[ev.tipo]?.bg || '#f9fafb',
                          borderLeft: `2px solid ${TIPOS[ev.tipo]?.dot || '#6b7280'}`,
                          borderRadius: '0 3px 3px 0',
                          padding: '1px 3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                          maxWidth: '100%',
                        }}>
                          {ev.titulo}
                        </div>
                      ))}
                      {evsDia.length > maxEventosPorDia && (
                        <div style={{ fontSize: 9, color: '#b0a8c0', fontWeight: 700 }}>+{evsDia.length - maxEventosPorDia}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Modal detalle ─────────────────────────────
  function ModalDetalle() {
    if (!modalDetalle) return null
    return (
      <div style={s.modalBg} onClick={() => setModalDetalle(null)}>
        <div style={{ ...s.modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
          {modalDetalle.dia && (
            <div style={{ fontSize: 16, fontWeight: 800, color: '#3d1f61', marginBottom: 16 }}>
              {modalDetalle.dia} de {MESES[mesActual]}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {modalDetalle.eventos.map(ev => (
              <div key={ev.id} style={{ background: TIPOS[ev.tipo]?.bg, borderRadius: 12, padding: '14px 16px', borderLeft: `3px solid ${TIPOS[ev.tipo]?.dot}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TIPOS[ev.tipo]?.color, display: 'block', marginBottom: 4 }}>{TIPOS[ev.tipo]?.label}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>{ev.titulo}</div>
                    {ev.descripcion && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{ev.descripcion}</div>}
                    <div style={{ fontSize: 11, color: '#b0a8c0', marginTop: 6 }}>
                      {formatFecha(ev.fecha_inicio, { weekday: 'long', day: 'numeric', month: 'long' })}
                      {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && ` — ${formatFecha(ev.fecha_fin, { day: 'numeric', month: 'long' })}`}
                    </div>
                  </div>
                  {puedeEditar && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => abrirEditar(ev)}
                        style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#5B2D8E', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Editar
                      </button>
                      <button onClick={() => eliminarEvento(ev.id)}
                        style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setModalDetalle(null)} style={{ ...s.btnSecondary, width: '100%', marginTop: 16 }}>Cerrar</button>
        </div>
      </div>
    )
  }

  // ── Vista alumno ──────────────────────────────
  if (esAlumno) {
    return (
      <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Calendario Escolar</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13 }}>Año {year}</p>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={mesAnterior} style={s.navBtn}>‹</button>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#3d1f61' }}>{MESES[mesActual]} {anioActual}</span>
            <button onClick={mesSiguiente} style={s.navBtn}>›</button>
          </div>
          <GrillaCalendario maxEventosPorDia={2} />
        </div>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', marginBottom: 14 }}>Próximos eventos</div>
          {proximosEventos.length === 0 ? (
            <div style={{ color: '#b0a8c0', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No hay eventos próximos</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {proximosEventos.map(ev => (
                <div key={ev.id} style={{ padding: '8px 12px', background: TIPOS[ev.tipo]?.bg, borderRadius: 10, borderLeft: `3px solid ${TIPOS[ev.tipo]?.dot}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3d1f61' }}>{ev.titulo}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {formatFecha(ev.fecha_inicio, { day: 'numeric', month: 'short' })}
                    {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && ` — ${formatFecha(ev.fecha_fin, { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <ModalDetalle />
      </div>
    )
  }

  // ── Vista staff ───────────────────────────────
  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Calendario Escolar</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13 }}>{eventos.length} eventos — Año {year}</p>
        </div>
        {puedeEditar && (
          <button onClick={() => { setEditando(null); setForm({ titulo: '', descripcion: '', fecha_inicio: '', fecha_fin: '', tipo: 'actividad' }); setModalForm(true) }}
            style={s.btnPrimary}>+ Nuevo evento</button>
        )}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(TIPOS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: v.color, background: v.bg, padding: '3px 10px', borderRadius: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: v.dot, flexShrink: 0 }} />
            {v.label}
          </div>
        ))}
      </div>

      {/* Calendario full width */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={mesAnterior} style={s.navBtn}>‹</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#3d1f61' }}>{MESES[mesActual]} {anioActual}</span>
            <span style={{ fontSize: 11, color: '#b0a8c0', background: '#f3eeff', padding: '2px 10px', borderRadius: 10 }}>{eventosMes.length} eventos</span>
          </div>
          <button onClick={mesSiguiente} style={s.navBtn}>›</button>
        </div>
        <GrillaCalendario maxEventosPorDia={3} />
      </div>

      {/* Paneles inferiores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20, maxHeight: 300, overflowY: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', marginBottom: 14 }}>Este mes</div>
          {eventosMes.length === 0 ? (
            <div style={{ color: '#b0a8c0', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Sin eventos este mes</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {eventosMes.map(ev => (
                <div key={ev.id} onClick={() => setModalDetalle({ dia: null, eventos: [ev] })}
                  style={{ padding: '8px 12px', borderRadius: 10, background: TIPOS[ev.tipo]?.bg, cursor: 'pointer', borderLeft: `3px solid ${TIPOS[ev.tipo]?.dot}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3d1f61' }}>{ev.titulo}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {formatFecha(ev.fecha_inicio, { day: 'numeric', month: 'short' })}
                    {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && ` — ${formatFecha(ev.fecha_fin, { day: 'numeric', month: 'short' })}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20, maxHeight: 300, overflowY: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', marginBottom: 14 }}>Próximos eventos</div>
          {proximosEventos.length === 0 ? (
            <div style={{ color: '#b0a8c0', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No hay eventos próximos</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {proximosEventos.map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: TIPOS[ev.tipo]?.dot, flexShrink: 0, marginTop: 4 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#3d1f61' }}>{ev.titulo}</div>
                    <div style={{ fontSize: 11, color: '#b0a8c0' }}>{formatFecha(ev.fecha_inicio, { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModalDetalle />

      {/* Modal crear/editar */}
      {modalForm && (
        <div style={s.modalBg} onClick={() => setModalForm(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20 }}>
              {editando ? 'Editar evento' : 'Nuevo evento'}
            </h2>
            <div style={s.field}>
              <label style={s.label}>Título *</label>
              <input style={s.input} value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Nombre del evento" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Descripción</label>
              <textarea style={{ ...s.input, resize: 'vertical', minHeight: 70 }} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción opcional..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
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
  navBtn:       { background: '#f3eeff', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#5B2D8E', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },
  btnPrimary:   { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox:     { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', maxHeight: '90vh', overflowY: 'auto' },
  field:        { marginBottom: 14 },
  label:        { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input:        { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none' },
}