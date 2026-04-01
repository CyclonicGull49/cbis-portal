import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

// ── Iconos ────────────────────────────────────
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IcoEmpty = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d8c8f0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <polyline points="16 11 18 13 22 9"/>
  </svg>
)
const IcoUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IcoClock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoDoor = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const IcoBell = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

// ── Config ────────────────────────────────────
const SUBTIPOS = {
  ausencia:          { label: 'Ausencia',           color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', desc: 'El alumno no asistirá' },
  retiro_anticipado: { label: 'Retiro anticipado',  color: '#d97706', bg: '#fffbeb', border: '#fcd34d', desc: 'El alumno saldrá antes del horario' },
  llegada_tarde:     { label: 'Llegada tarde',      color: '#0e9490', bg: '#e0f7f6', border: '#5eead4', desc: 'El alumno llegará después de la hora de entrada' },
}

const ESTADOS = {
  pendiente:          { label: 'Pendiente',           color: '#92400e', bg: '#fef9c3' },
  aprobado:           { label: 'Aprobado',            color: '#16a34a', bg: '#dcfce7' },
  rechazado:          { label: 'Rechazado',           color: '#dc2626', bg: '#fee2e2' },
  salida_confirmada:  { label: 'Salida confirmada',   color: '#5B2D8E', bg: '#f3eeff' },
}

function formatFecha(f) {
  if (!f) return '—'
  return new Date(f + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTs(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('es-SV', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function hoy() { return new Date().toISOString().split('T')[0] }

// ── Notificaciones automáticas ────────────────
async function notificar(usuarioIds, tipo, titulo, mensaje, link) {
  if (!usuarioIds?.length) return
  const lote = usuarioIds.map(id => ({ usuario_id: id, tipo, titulo, mensaje, link }))
  for (let i = 0; i < lote.length; i += 50) {
    await supabase.from('notificaciones').insert(lote.slice(i, i + 50))
  }
}

async function notificarRetiro(permiso, accion, perfil) {
  const nombreAlumno = `${permiso.estudiantes?.apellido}, ${permiso.estudiantes?.nombre}`
  const grado = permiso.estudiantes?.grados?.nombre || ''

  if (accion === 'nuevo') {
    // Notificar a recepción
    const { data: recepcion } = await supabase.from('perfiles')
      .select('id').in('rol', ['recepcion', 'admin'])
    const idsRecepcion = (recepcion || []).map(p => p.id)
    await notificar(idsRecepcion, 'retiro',
      'Retiro anticipado registrado',
      `${nombreAlumno} (${grado}) — ${permiso.hora_retiro ? `a las ${permiso.hora_retiro}` : 'hora por confirmar'}. Retira: ${permiso.quien_retira}`,
      'permisos'
    )
    // Notificar al docente encargado del grado
    const { data: encargado } = await supabase.from('grados')
      .select('encargado_id').eq('nombre', grado).single()
    if (encargado?.encargado_id) {
      await notificar([encargado.encargado_id], 'retiro',
        'Retiro anticipado — tu alumno',
        `${nombreAlumno} tiene permiso de retiro anticipado${permiso.hora_retiro ? ` a las ${permiso.hora_retiro}` : ''}`,
        'permisos'
      )
    }
  }

  if (accion === 'salida_confirmada') {
    // Notificar al docente que el alumno ya salió
    const { data: ests } = await supabase.from('estudiantes')
      .select('grado_id').eq('id', permiso.estudiante_id).single()
    if (ests?.grado_id) {
      const { data: encargado } = await supabase.from('grados')
        .select('encargado_id').eq('id', ests.grado_id).single()
      if (encargado?.encargado_id) {
        await notificar([encargado.encargado_id], 'retiro',
          'Salida confirmada',
          `${nombreAlumno} salió del colegio — confirmado por recepción`,
          'permisos'
        )
      }
    }
  }
}

// ── Tarjeta permiso ───────────────────────────
function Tarjeta({ p, esRecepcion, procesando, onSelect, onAprobar, onRechazar, onConfirmarSalida }) {
  const subtipo  = SUBTIPOS[p.subtipo] || SUBTIPOS.ausencia
  const estado   = ESTADOS[p.estado]   || ESTADOS.pendiente
  const esRetiro = p.subtipo === 'retiro_anticipado'
  const puedeConfirmar = esRecepcion && esRetiro && p.estado === 'aprobado'

  return (
    <div onClick={() => onSelect(p)}
      style={{
        background: '#fff',
        borderRadius: 14,
        border: `1.5px solid ${p.estado === 'pendiente' ? subtipo.border : p.estado === 'salida_confirmada' ? '#c4b5fd' : '#f0ecf8'}`,
        padding: '14px 18px', marginBottom: 10, cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        borderLeft: `4px solid ${subtipo.color}`,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(61,31,97,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          {/* Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: subtipo.color, background: subtipo.bg, padding: '2px 10px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {subtipo.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: estado.bg, color: estado.color }}>
              {estado.label}
            </span>
            {esRetiro && p.hora_retiro && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280', fontWeight: 600, background: '#f9fafb', padding: '2px 8px', borderRadius: 8 }}>
                <IcoClock /> {p.hora_retiro}
              </span>
            )}
          </div>

          {/* Nombre */}
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f1d40', marginBottom: 2 }}>
            {p.estudiantes?.apellido}, {p.estudiantes?.nombre}
          </div>
          <div style={{ fontSize: 11, color: '#b0a8c0', marginBottom: 6 }}>
            {p.estudiantes?.grados?.nombre} · {formatFecha(p.fecha)}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
            {p.motivo}
          </div>
          {esRetiro && p.quien_retira && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#5B2D8E', fontWeight: 600, marginTop: 4 }}>
              <IcoUser /> Retira: {p.quien_retira}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {/* Confirmar salida — solo para retiro aprobado */}
          {puedeConfirmar && (
            <button onClick={() => onConfirmarSalida(p)} disabled={procesando === p.id}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(91,45,142,0.3)' }}>
              <IcoDoor /> Confirmar salida
            </button>
          )}
          {/* Aprobar/rechazar para pendientes */}
          {esRecepcion && p.estado === 'pendiente' && (
            <>
              <button onClick={() => onAprobar(p)} disabled={procesando === p.id}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: '1.5px solid #86efac', background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                <IcoCheck /> {esRetiro ? 'Autorizar' : 'Aprobar'}
              </button>
              <button onClick={() => onRechazar(p)} disabled={procesando === p.id}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #fca5a5', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                <IcoX />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────
export default function Permisos() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const esRecepcion = ['admin', 'recepcion', 'direccion_academica', 'registro_academico'].includes(perfil?.rol)
  const esDocente   = perfil?.rol === 'docente'

  const [permisos,     setPermisos]     = useState([])
  const [estudiantes,  setEstudiantes]  = useState([])
  const [grados,       setGrados]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [procesando,   setProcesando]   = useState(null)
  const [guardando,    setGuardando]    = useState(false)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [tabActiva,    setTabActiva]    = useState('hoy')
  const [modalNuevo,   setModalNuevo]   = useState(false)
  const [modalDetalle, setModalDetalle] = useState(null)

  const [form, setForm] = useState({
    estudiante_id: '', subtipo: 'ausencia', fecha: hoy(),
    motivo: '', quien_retira: '', hora_retiro: '',
  })

  useEffect(() => { cargarDatos() }, [year])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: gra }, { data: ests }] = await Promise.all([
      supabase.from('grados').select('id, nombre').order('orden'),
      supabase.from('estudiantes').select('id, nombre, apellido, grado_id, grados(nombre)')
        .eq('estado', 'activo').order('apellido'),
    ])
    setGrados(gra || [])
    setEstudiantes(ests || [])
    await cargarPermisos()
    setLoading(false)
  }

  async function cargarPermisos() {
    let q = supabase.from('permisos')
      .select(`*, estudiantes(id, nombre, apellido, grado_id, grados(nombre)), registrador:perfiles!permisos_registrado_por_fkey(nombre, apellido), aprobador:perfiles!permisos_aprobado_por_fkey(nombre, apellido)`)
      .eq('año_escolar', year)
      .order('creado_en', { ascending: false })

    // Docente: solo ve permisos de alumnos de sus grados
    if (esDocente && !esRecepcion) {
      const { data: asigs } = await supabase.from('asignaciones')
        .select('grado_id').eq('docente_id', perfil.id).eq('año_escolar', year)
      const gradoIds = [...new Set((asigs || []).map(a => a.grado_id))]
      if (gradoIds.length) {
        const { data: ests } = await supabase.from('estudiantes')
          .select('id').in('grado_id', gradoIds)
        const estIds = (ests || []).map(e => e.id)
        if (estIds.length) q = q.in('estudiante_id', estIds)
      }
    }

    const { data } = await q
    setPermisos(data || [])
  }

  async function crear() {
    if (!form.estudiante_id || !form.motivo.trim()) { toast.error('Estudiante y motivo son obligatorios'); return }
    if (form.subtipo === 'retiro_anticipado' && !form.quien_retira.trim()) { toast.error('Indica quién retira al estudiante'); return }

    setGuardando(true)
    const aprobadoAuto = esRecepcion

    const { data: nuevo, error } = await supabase.from('permisos').insert({
      estudiante_id:  parseInt(form.estudiante_id),
      subtipo:        form.subtipo,
      tipo:           form.subtipo,
      fecha:          form.fecha,
      motivo:         form.motivo.trim(),
      quien_retira:   form.quien_retira.trim() || null,
      hora_retiro:    form.hora_retiro || null,
      estado:         aprobadoAuto ? 'aprobado' : 'pendiente',
      registrado_por: perfil.id,
      aprobado_por:   aprobadoAuto ? perfil.id : null,
      aprobado_en:    aprobadoAuto ? new Date().toISOString() : null,
      año_escolar:    year,
    }).select('*, estudiantes(id, nombre, apellido, grado_id, grados(nombre))').single()

    if (error) { toast.error('Error al registrar'); setGuardando(false); return }

    // Notificaciones automáticas para retiro anticipado
    if (form.subtipo === 'retiro_anticipado' && nuevo) {
      await notificarRetiro(nuevo, 'nuevo', perfil)
    }

    // Si es ausencia, actualizar asistencia si ya existe registro del día
    if (form.subtipo === 'ausencia' && nuevo) {
      const est = estudiantes.find(e => e.id === parseInt(form.estudiante_id))
      if (est) {
        await supabase.from('asistencia').upsert({
          estudiante_id: parseInt(form.estudiante_id),
          grado_id:      est.grado_id,
          fecha:         form.fecha,
          estado:        'justificado',
          año_escolar:   year,
          observacion:   `Permiso: ${form.motivo}`,
        }, { onConflict: 'estudiante_id,grado_id,fecha,año_escolar', ignoreDuplicates: false })
      }
    }

    toast.success(form.subtipo === 'retiro_anticipado' ? 'Retiro registrado — recepción y docente notificados' : 'Permiso registrado')
    setModalNuevo(false)
    resetForm()
    cargarPermisos()
    setGuardando(false)
  }

  async function aprobar(permiso) {
    setProcesando(permiso.id)
    await supabase.from('permisos').update({
      estado: 'aprobado', aprobado_por: perfil.id, aprobado_en: new Date().toISOString(),
    }).eq('id', permiso.id)
    toast.success('Permiso aprobado')
    cargarPermisos()
    setModalDetalle(null)
    setProcesando(null)
  }

  async function rechazar(permiso) {
    setProcesando(permiso.id)
    await supabase.from('permisos').update({
      estado: 'rechazado', aprobado_por: perfil.id, aprobado_en: new Date().toISOString(),
    }).eq('id', permiso.id)
    toast.success('Permiso rechazado')
    cargarPermisos()
    setModalDetalle(null)
    setProcesando(null)
  }

  async function confirmarSalida(permiso) {
    setProcesando(permiso.id)
    await supabase.from('permisos').update({
      estado: 'salida_confirmada',
      aprobado_por: perfil.id,
      aprobado_en: new Date().toISOString(),
    }).eq('id', permiso.id)

    // Notificar al docente encargado
    await notificarRetiro({ ...permiso, estudiante_id: permiso.estudiantes?.id }, 'salida_confirmada', perfil)

    toast.success(`Salida confirmada — ${permiso.estudiantes?.nombre} ${permiso.estudiantes?.apellido} salió del colegio`)
    cargarPermisos()
    setModalDetalle(null)
    setProcesando(null)
  }

  function resetForm() {
    setForm({ estudiante_id: '', subtipo: 'ausencia', fecha: hoy(), motivo: '', quien_retira: '', hora_retiro: '' })
  }

  // Filtros
  const permisosFiltrados = permisos.filter(p => {
    const nombre = `${p.estudiantes?.nombre} ${p.estudiantes?.apellido}`.toLowerCase()
    const matchBusqueda = !busqueda || nombre.includes(busqueda.toLowerCase())
    const matchEstado   = !filtroEstado || p.estado === filtroEstado
    const matchTab =
      tabActiva === 'todos'     ? true :
      tabActiva === 'hoy'       ? p.fecha === hoy() :
      tabActiva === 'pendientes'? p.estado === 'pendiente' :
      tabActiva === 'retiros'   ? p.subtipo === 'retiro_anticipado' && p.fecha === hoy() :
      true
    return matchBusqueda && matchEstado && matchTab
  })

  const pendientesCount  = permisos.filter(p => p.estado === 'pendiente').length
  const retirosHoy       = permisos.filter(p => p.subtipo === 'retiro_anticipado' && p.fecha === hoy()).length
  const salidasPendientes = permisos.filter(p => p.subtipo === 'retiro_anticipado' && p.estado === 'aprobado' && p.fecha === hoy()).length

  const tabs = [
    { id: 'hoy',        label: 'Hoy' },
    { id: 'pendientes', label: 'Pendientes' },
    { id: 'retiros',    label: 'Retiros hoy' },
    { id: 'todos',      label: 'Todos' },
  ]

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#0f1d40', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Permisos</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {pendientesCount > 0 && <span style={{ color: '#d97706', fontWeight: 700 }}>{pendientesCount} pendiente{pendientesCount !== 1 ? 's' : ''}</span>}
            {retirosHoy > 0 && <span style={{ color: '#d97706', fontWeight: 700 }}>· {retirosHoy} retiro{retirosHoy !== 1 ? 's' : ''} hoy</span>}
            {salidasPendientes > 0 && <span style={{ color: '#5B2D8E', fontWeight: 700 }}>· {salidasPendientes} salida{salidasPendientes !== 1 ? 's' : ''} por confirmar</span>}
          </p>
        </div>
        {(esRecepcion || esDocente) && (
          <button onClick={() => { resetForm(); setModalNuevo(true) }}
            style={{ ...s.btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoPlus /> Registrar permiso
          </button>
        )}
      </div>

      {/* Banner salidas pendientes de confirmar */}
      {salidasPendientes > 0 && esRecepcion && (
        <div style={{ background: '#f3eeff', border: '1.5px solid #c4b5fd', borderRadius: 12, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#5B2D8E', fontWeight: 700 }}>
          <IcoDoor />
          {salidasPendientes} retiro{salidasPendientes !== 1 ? 's' : ''} autorizado{salidasPendientes !== 1 ? 's' : ''} esperando confirmación de salida física
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: 12, padding: 4, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setTabActiva(tab.id)}
            style={{ padding: '7px 14px', borderRadius: 9, border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: tabActiva === tab.id ? 700 : 500, cursor: 'pointer', background: tabActiva === tab.id ? 'linear-gradient(135deg, #5B2D8E, #3d1f61)' : 'transparent', color: tabActiva === tab.id ? '#fff' : '#6b7280', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab.label}
            {tab.id === 'pendientes' && pendientesCount > 0 && (
              <span style={{ background: tabActiva === 'pendientes' ? 'rgba(255,255,255,0.25)' : '#fef9c3', color: tabActiva === 'pendientes' ? '#fff' : '#92400e', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                {pendientesCount}
              </span>
            )}
            {tab.id === 'retiros' && retirosHoy > 0 && (
              <span style={{ background: tabActiva === 'retiros' ? 'rgba(255,255,255,0.25)' : '#fef2f2', color: tabActiva === 'retiros' ? '#fff' : '#dc2626', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                {retirosHoy}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0a8c0', display: 'flex' }}><IcoSearch /></span>
            <input type="text" placeholder="Buscar estudiante..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ ...s.input, paddingLeft: 34, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={s.input}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobados</option>
              <option value="salida_confirmada">Salida confirmada</option>
              <option value="rechazado">Rechazados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#b0a8c0' }}>Cargando...</div>
      ) : permisosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><IcoEmpty /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>Sin permisos</div>
          <div style={{ fontSize: 12, color: '#b0a8c0', marginTop: 4 }}>No hay permisos para los filtros seleccionados</div>
        </div>
      ) : (
        <div>
          {permisosFiltrados.map(p => (
            <Tarjeta key={p.id} p={p} esRecepcion={esRecepcion} procesando={procesando}
              onSelect={setModalDetalle} onAprobar={aprobar} onRechazar={rechazar} onConfirmarSalida={confirmarSalida} />
          ))}
        </div>
      )}

      {/* Modal nuevo permiso */}
      {modalNuevo && (
        <div style={s.modalBg} onClick={() => { setModalNuevo(false); resetForm() }}>
          <div style={{ ...s.modalBox, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#0f1d40', fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Registrar permiso</h2>
            <p style={{ color: '#b0a8c0', fontSize: 12, marginBottom: 20 }}>Selecciona el tipo y completa los datos del permiso</p>

            {/* Tipo */}
            <div style={s.field}>
              <label style={s.label}>Tipo de permiso</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {Object.entries(SUBTIPOS).map(([k, v]) => (
                  <button key={k} onClick={() => setForm(f => ({ ...f, subtipo: k }))}
                    style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.subtipo === k ? v.color : '#e5e7eb'}`, background: form.subtipo === k ? v.bg : '#fff', color: form.subtipo === k ? v.color : '#6b7280', fontWeight: form.subtipo === k ? 700 : 500, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{v.label}</div>
                    <div style={{ fontSize: 9, opacity: 0.7 }}>{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Estudiante */}
            <div style={s.field}>
              <label style={s.label}>Estudiante</label>
              <select style={s.inputFull} value={form.estudiante_id}
                onChange={e => setForm(f => ({ ...f, estudiante_id: e.target.value }))}>
                <option value="">Selecciona un estudiante...</option>
                {grados.map(g => {
                  const ests = estudiantes.filter(e => e.grado_id === g.id)
                  if (!ests.length) return null
                  return (
                    <optgroup key={g.id} label={g.nombre}>
                      {ests.map(e => <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>)}
                    </optgroup>
                  )
                })}
              </select>
            </div>

            {/* Fecha */}
            <div style={s.field}>
              <label style={s.label}>Fecha</label>
              <input type="date" style={s.inputFull} value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>

            {/* Campos retiro */}
            {form.subtipo === 'retiro_anticipado' && (
              <>
                <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IcoBell /> Se notificará automáticamente a recepción y al docente encargado
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={s.field}>
                    <label style={s.label}>Quién retira *</label>
                    <input type="text" style={s.inputFull} value={form.quien_retira}
                      placeholder="Nombre del familiar..."
                      onChange={e => setForm(f => ({ ...f, quien_retira: e.target.value }))} />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Hora aproximada</label>
                    <input type="time" style={s.inputFull} value={form.hora_retiro}
                      onChange={e => setForm(f => ({ ...f, hora_retiro: e.target.value }))} />
                  </div>
                </div>
              </>
            )}

            {/* Ausencia info */}
            {form.subtipo === 'ausencia' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: '#be123c', fontWeight: 600 }}>
                La asistencia del alumno quedará marcada como justificada automáticamente
              </div>
            )}

            {/* Motivo */}
            <div style={s.field}>
              <label style={s.label}>Motivo</label>
              <textarea style={{ ...s.inputFull, minHeight: 80, resize: 'vertical' }}
                placeholder={form.subtipo === 'ausencia' ? 'Motivo de la ausencia...' : form.subtipo === 'retiro_anticipado' ? 'Motivo del retiro anticipado...' : 'Motivo de la llegada tarde...'}
                value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} />
            </div>

            {esRecepcion && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '8px 12px', marginBottom: 14, fontSize: 11, color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <IcoCheck /> Al registrar como recepción, el permiso queda aprobado automáticamente
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalNuevo(false); resetForm() }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={crear} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Registrar permiso'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {modalDetalle && (
        <div style={s.modalBg} onClick={() => setModalDetalle(null)}>
          <div style={{ ...s.modalBox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            {(() => {
              const p = modalDetalle
              const subtipo = SUBTIPOS[p.subtipo] || SUBTIPOS.ausencia
              const estado  = ESTADOS[p.estado]   || ESTADOS.pendiente
              const esRetiro = p.subtipo === 'retiro_anticipado'
              const puedeConfirmar = esRecepcion && esRetiro && p.estado === 'aprobado'
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: subtipo.bg, border: `1.5px solid ${subtipo.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: subtipo.color, display: 'block' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: subtipo.color, background: subtipo.bg, padding: '2px 10px', borderRadius: 10 }}>{subtipo.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: estado.bg, color: estado.color }}>{estado.label}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f1d40' }}>{p.estudiantes?.apellido}, {p.estudiantes?.nombre}</div>
                      <div style={{ fontSize: 11, color: '#b0a8c0' }}>{p.estudiantes?.grados?.nombre}</div>
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#b0a8c0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Fecha</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{formatFecha(p.fecha)}</div>
                      </div>
                      {p.hora_retiro && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#b0a8c0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Hora retiro</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}><IcoClock />{p.hora_retiro}</div>
                        </div>
                      )}
                      {p.quien_retira && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#b0a8c0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Quién retira</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}><IcoUser />{p.quien_retira}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#f3eeff', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Motivo</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{p.motivo}</div>
                  </div>

                  <div style={{ fontSize: 11, color: '#b0a8c0', marginBottom: 16 }}>
                    Registrado por {p.registrador?.nombre} {p.registrador?.apellido} · {formatTs(p.creado_en)}
                    {p.aprobador && <span> · {p.estado === 'aprobado' ? 'Aprobado' : p.estado === 'salida_confirmada' ? 'Salida confirmada' : 'Rechazado'} por {p.aprobador.nombre} {p.aprobador.apellido}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => setModalDetalle(null)} style={s.btnSecondary}>Cerrar</button>
                    {puedeConfirmar && (
                      <button onClick={() => confirmarSalida(p)} disabled={procesando === p.id}
                        style={{ ...s.btnPrimary, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <IcoDoor /> Confirmar salida del colegio
                      </button>
                    )}
                    {esRecepcion && p.estado === 'pendiente' && (
                      <>
                        <button onClick={() => aprobar(p)} disabled={procesando === p.id}
                          style={{ ...s.btnSecondary, color: '#16a34a', borderColor: '#86efac', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IcoCheck /> {esRetiro ? 'Autorizar retiro' : 'Aprobar'}
                        </button>
                        <button onClick={() => rechazar(p)} disabled={procesando === p.id}
                          style={{ ...s.btnSecondary, color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IcoX /> Rechazar
                        </button>
                      </>
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
  input:       { padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none', width: '100%' },
  inputFull:   { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none' },
  btnPrimary:  { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary:{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox:    { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', maxHeight: '90vh', overflowY: 'auto' },
}