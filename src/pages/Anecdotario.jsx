import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

// ── Iconos por tipo de registro ──────────────────────────────
function TipoIcono({ tipo, size = 16 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }
  if (tipo === 'conversacion')     return <svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  if (tipo === 'visita_direccion') return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  if (tipo === 'llamada_padres')   return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.08 6.08l1.07-1.07a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
  if (tipo === 'reunion_padres')   return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  if (tipo === 'incidencia')       return <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  if (tipo === 'logro')            return <svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
  return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}

const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IcoPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
  </svg>
)
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcoEmpty = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d8c8f0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
)

const TIPOS = {
  conversacion:     { label: 'Conversación',     color: '#5B2D8E', bg: '#f3eeff' },
  visita_direccion: { label: 'Visita a dirección', color: '#dc2626', bg: '#fef2f2' },
  llamada_padres:   { label: 'Llamada a padres',  color: '#d97706', bg: '#fffbeb' },
  reunion_padres:   { label: 'Reunión con padres', color: '#0e9490', bg: '#e0f7f6' },
  incidencia:       { label: 'Incidencia',         color: '#c2410c', bg: '#fff0e6' },
  logro:            { label: 'Logro',              color: '#16a34a', bg: '#f0fdf4' },
  otro:             { label: 'Otro',               color: '#6b7280', bg: '#f9fafb' },
}

export default function Anecdotario() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const esDireccion = ['admin', 'direccion_academica', 'registro_academico'].includes(perfil?.rol)
  const esDocente   = perfil?.rol === 'docente'

  const [registros,      setRegistros]      = useState([])
  const [estudiantes,    setEstudiantes]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [modalAbierto,   setModalAbierto]   = useState(false)
  const [modalDetalle,   setModalDetalle]   = useState(null)
  const [guardando,      setGuardando]      = useState(false)
  const [busqueda,       setBusqueda]       = useState('')
  const [filtroTipo,     setFiltroTipo]     = useState('')
  const [filtroEstudiante, setFiltroEstudiante] = useState('')
  const [editando,       setEditando]       = useState(null)

  const [form, setForm] = useState({
    estudiante_id: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'conversacion',
    descripcion: '',
    seguimiento: '',
  })

  useEffect(() => { cargarDatos() }, [year])

  async function cargarDatos() {
    setLoading(true)

    // Cargar registros
    let q = supabase.from('anecdotario')
      .select('*, estudiantes(nombre, apellido, grados(nombre)), perfiles(nombre, apellido)')
      .eq('año_escolar', year)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })

    if (esDocente) q = q.eq('docente_id', perfil.id)

    const { data: regs } = await q
    setRegistros(regs || [])

    // Cargar estudiantes según rol
    if (esDocente) {
      // Docente: estudiantes de todos los grados donde tiene asignaciones
      const { data: asigs } = await supabase.from('asignaciones')
        .select('grado_id')
        .eq('docente_id', perfil.id)
        .eq('año_escolar', year)
      const gradoIds = [...new Set((asigs || []).map(a => a.grado_id))]
      if (gradoIds.length > 0) {
        const { data: ests } = await supabase.from('estudiantes')
          .select('id, nombre, apellido, grados(nombre)')
          .in('grado_id', gradoIds)
          .eq('estado', 'activo')
          .order('apellido')
        setEstudiantes(ests || [])
      }
    } else {
      const { data: ests } = await supabase.from('estudiantes')
        .select('id, nombre, apellido, grados(nombre)')
        .eq('estado', 'activo')
        .order('apellido')
      setEstudiantes(ests || [])
    }

    setLoading(false)
  }

  async function guardar() {
    if (!form.estudiante_id || !form.descripcion.trim()) {
      toast.error('Estudiante y descripción son obligatorios')
      return
    }
    setGuardando(true)
    const payload = {
      estudiante_id: parseInt(form.estudiante_id),
      docente_id:    perfil.id,
      fecha:         form.fecha,
      tipo:          form.tipo,
      descripcion:   form.descripcion.trim(),
      seguimiento:   form.seguimiento.trim() || null,
      año_escolar:   year,
    }

    let error
    if (editando) {
      ({ error } = await supabase.from('anecdotario').update(payload).eq('id', editando))
    } else {
      ({ error } = await supabase.from('anecdotario').insert(payload))
    }

    if (error) { toast.error('Error al guardar'); setGuardando(false); return }
    toast.success(editando ? 'Registro actualizado' : 'Registro guardado')
    setModalAbierto(false)
    setEditando(null)
    resetForm()
    cargarDatos()
    setGuardando(false)
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este registro?')) return
    await supabase.from('anecdotario').delete().eq('id', id)
    toast.success('Registro eliminado')
    setModalDetalle(null)
    cargarDatos()
  }

  function abrirEditar(reg) {
    setForm({
      estudiante_id: String(reg.estudiante_id),
      fecha:         reg.fecha,
      tipo:          reg.tipo,
      descripcion:   reg.descripcion,
      seguimiento:   reg.seguimiento || '',
    })
    setEditando(reg.id)
    setModalDetalle(null)
    setModalAbierto(true)
  }

  function resetForm() {
    setForm({
      estudiante_id: filtroEstudiante || '',
      fecha:         new Date().toISOString().split('T')[0],
      tipo:          'conversacion',
      descripcion:   '',
      seguimiento:   '',
    })
  }

  // Filtros
  const registrosFiltrados = registros.filter(r => {
    const nombre = `${r.estudiantes?.nombre} ${r.estudiantes?.apellido}`.toLowerCase()
    const matchBusqueda = !busqueda || nombre.includes(busqueda.toLowerCase())
    const matchTipo = !filtroTipo || r.tipo === filtroTipo
    const matchEst = !filtroEstudiante || String(r.estudiante_id) === filtroEstudiante
    return matchBusqueda && matchTipo && matchEst
  })

  // Agrupar por estudiante para el anecdotario
  const porEstudiante = {}
  for (const r of registrosFiltrados) {
    const key = r.estudiante_id
    if (!porEstudiante[key]) porEstudiante[key] = { estudiante: r.estudiantes, registros: [] }
    porEstudiante[key].registros.push(r)
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Registro Anecdótico</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13 }}>{registros.length} registros — Año {year}</p>
        </div>
        <button onClick={() => { resetForm(); setEditando(null); setModalAbierto(true) }}
          style={{ ...s.btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
          <IcoPlus /> Nueva anotación
        </button>
      </div>

      {/* Filtros */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Buscador */}
          <div style={{ flex: '2 1 220px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0a8c0', display: 'flex' }}><IcoSearch /></span>
            <input type="text" placeholder="Buscar estudiante..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ ...s.input, paddingLeft: 34, width: '100%', boxSizing: 'border-box' }} />
          </div>
          {/* Filtro tipo */}
          <div style={{ flex: '1 1 180px' }}>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={s.input}>
              <option value="">Todos los tipos</option>
              {Object.entries(TIPOS).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          {/* Filtro estudiante */}
          <div style={{ flex: '1 1 200px' }}>
            <select value={filtroEstudiante} onChange={e => setFiltroEstudiante(e.target.value)} style={s.input}>
              <option value="">Todos los estudiantes</option>
              {estudiantes.map(e => (
                <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>
              ))}
            </select>
          </div>
          {(busqueda || filtroTipo || filtroEstudiante) && (
            <button onClick={() => { setBusqueda(''); setFiltroTipo(''); setFiltroEstudiante('') }}
              style={{ ...s.btnSecondary, padding: '8px 14px', fontSize: 12 }}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#b0a8c0' }}>Cargando...</div>
      ) : registrosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', color: '#b0a8c0' }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IcoEmpty /></div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No hay registros aún</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Presiona "+ Nueva anotación" para comenzar</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.values(porEstudiante).map(({ estudiante, registros: regsEst }) => (
            <div key={regsEst[0].estudiante_id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' }}>
              {/* Header estudiante */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3eeff', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  {estudiante?.nombre?.charAt(0)}{estudiante?.apellido?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61' }}>
                    {estudiante?.apellido}, {estudiante?.nombre}
                  </div>
                  <div style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 600 }}>
                    {estudiante?.grados?.nombre} · {regsEst.length} registro{regsEst.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={() => { setFiltroEstudiante(String(regsEst[0].estudiante_id)); setForm(f => ({ ...f, estudiante_id: String(regsEst[0].estudiante_id) })); resetForm(); setEditando(null); setModalAbierto(true) }}
                  style={{ marginLeft: 'auto', ...s.btnSecondary, fontSize: 11, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IcoPlus /> Anotar
                </button>
              </div>

              {/* Registros del estudiante */}
              <div style={{ padding: '8px 0' }}>
                {regsEst.map((reg, i) => {
                  const tipo = TIPOS[reg.tipo] || TIPOS.otro
                  return (
                    <div key={reg.id}
                      onClick={() => setModalDetalle(reg)}
                      style={{ padding: '12px 20px', cursor: 'pointer', borderTop: i > 0 ? '1px solid #f9fafb' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        {/* Tipo badge */}
                        <div style={{ flexShrink: 0, marginTop: 1 }}>
                          <span style={{ color: tipo.color }}><TipoIcono tipo={reg.tipo} size={18} /></span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: tipo.color, background: tipo.bg, padding: '2px 8px', borderRadius: 10 }}>
                              {tipo.label}
                            </span>
                            <span style={{ fontSize: 11, color: '#b0a8c0' }}>
                              {new Date(reg.fecha + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {reg.perfiles && (
                              <span style={{ fontSize: 11, color: '#b0a8c0' }}>
                                · {reg.perfiles.nombre} {reg.perfiles.apellido}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {reg.descripcion}
                          </div>
                          {reg.seguimiento && (
                            <div style={{ fontSize: 11, color: '#5B2D8E', fontWeight: 600, marginTop: 4 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IcoPin /> Seguimiento: {reg.seguimiento}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva anotación / editar */}
      {modalAbierto && (
        <div style={s.modalBg} onClick={() => { setModalAbierto(false); setEditando(null); resetForm() }}>
          <div style={{ ...s.modalBox, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20 }}>
              {editando ? 'Editar anotación' : 'Nueva anotación'}
            </h2>

            {/* Estudiante */}
            <div style={s.field}>
              <label style={s.label}>Estudiante *</label>
              <select style={s.inputFull} value={form.estudiante_id}
                onChange={e => setForm(f => ({ ...f, estudiante_id: e.target.value }))}>
                <option value="">Selecciona un estudiante...</option>
                {estudiantes.map(e => (
                  <option key={e.id} value={e.id}>{e.apellido}, {e.nombre} — {e.grados?.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fecha y Tipo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={s.field}>
                <label style={s.label}>Fecha *</label>
                <input type="date" style={s.inputFull} value={form.fecha}
                  onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Tipo *</label>
                <select style={s.inputFull} value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  {Object.entries(TIPOS).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div style={s.field}>
              <label style={s.label}>Descripción *</label>
              <textarea style={{ ...s.inputFull, minHeight: 100, resize: 'vertical' }}
                placeholder="Describe lo sucedido con detalle..."
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>

            {/* Seguimiento */}
            <div style={s.field}>
              <label style={s.label}>Seguimiento <span style={{ color: '#b0a8c0', fontWeight: 500, textTransform: 'none' }}>(opcional)</span></label>
              <input type="text" style={s.inputFull}
                placeholder="Ej: Citar a padres la próxima semana, Hablar con dirección..."
                value={form.seguimiento}
                onChange={e => setForm(f => ({ ...f, seguimiento: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalAbierto(false); setEditando(null); resetForm() }} style={s.btnSecondary}>
                Cancelar
              </button>
              <button onClick={guardar} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar anotación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {modalDetalle && (
        <div style={s.modalBg} onClick={() => setModalDetalle(null)}>
          <div style={{ ...s.modalBox, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            {(() => {
              const tipo = TIPOS[modalDetalle.tipo] || TIPOS.otro
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: tipo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tipo.color, flexShrink: 0 }}><TipoIcono tipo={modalDetalle.tipo} size={20} /></div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: tipo.color, background: tipo.bg, padding: '2px 10px', borderRadius: 10, display: 'inline-block', marginBottom: 4 }}>
                        {tipo.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61' }}>
                        {modalDetalle.estudiantes?.apellido}, {modalDetalle.estudiantes?.nombre}
                      </div>
                      <div style={{ fontSize: 11, color: '#b0a8c0' }}>
                        {modalDetalle.estudiantes?.grados?.nombre} · {new Date(modalDetalle.fecha + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#b0a8c0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Descripción</div>
                    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{modalDetalle.descripcion}</div>
                  </div>

                  {modalDetalle.seguimiento && (
                    <div style={{ background: '#f3eeff', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><IcoPin /> Seguimiento</div>
                      <div style={{ fontSize: 13, color: '#3d1f61', fontWeight: 600 }}>{modalDetalle.seguimiento}</div>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#b0a8c0', marginBottom: 20 }}>
                    Registrado por {modalDetalle.perfiles?.nombre} {modalDetalle.perfiles?.apellido}
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setModalDetalle(null)} style={s.btnSecondary}>Cerrar</button>
                    {(modalDetalle.docente_id === perfil?.id || esDireccion) && (
                      <button onClick={() => abrirEditar(modalDetalle)}
                        style={{ ...s.btnSecondary, color: '#5B2D8E', borderColor: '#5B2D8E' }}>
                        Editar
                      </button>
                    )}
                    {esDireccion && (
                      <button onClick={() => eliminar(modalDetalle.id)}
                        style={{ ...s.btnSecondary, color: '#dc2626', borderColor: '#fca5a5' }}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  label:       { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  field:       { marginBottom: 14 },
  input:       { padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none' },
  inputFull:   { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none' },
  btnPrimary:  { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary:{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox:    { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', maxHeight: '90vh', overflowY: 'auto' },
}