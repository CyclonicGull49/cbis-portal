import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

// ── Iconos ────────────────────────────────────
const IcoUnlock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
)
const IcoClipboard = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
)
const IcoUsers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IcoClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
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
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

// Icono por tipo como SVG
function TipoIcono({ tipo, size = 16 }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }
  if (tipo === 'desbloqueo_notas') return (
    <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
  )
  if (tipo === 'modificar_asistencia') return (
    <svg {...props}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>
  )
  if (tipo === 'permiso_personal') return (
    <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
  )
  return (
    <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )
}

const TIPOS = {
  desbloqueo_notas:     { label: 'Desbloqueo de notas',  color: '#5B2D8E', bg: '#f3eeff' },
  modificar_asistencia: { label: 'Modificar asistencia', color: '#0e9490', bg: '#e0f7f6' },
  cita_padres:          { label: 'Cita con padres',      color: '#d97706', bg: '#fffbeb' },
  permiso_personal:     { label: 'Permiso personal',     color: '#be185d', bg: '#fdf2f8' },
}

const ESTADOS = {
  pendiente: { label: 'Pendiente',  bg: '#fef9c3', color: '#92400e' },
  aprobado:  { label: 'Aprobado',   bg: '#dcfce7', color: '#16a34a' },
  rechazado: { label: 'Rechazado',  bg: '#fee2e2', color: '#dc2626' },
  cerrado:   { label: 'Cerrado',    bg: '#f3f4f6', color: '#6b7280' },
}

function formatFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('es-SV', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatHoras(ts) {
  if (!ts) return null
  const diff = new Date(ts) - new Date()
  if (diff <= 0) return 'Expirado'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m restantes`
}

// ── Notificaciones ───────────────────────────────────────
async function notificar(usuarioIds, tipo, titulo, mensaje, link) {
  if (!usuarioIds?.length) return
  const lote = usuarioIds.map(id => ({ usuario_id: id, tipo, titulo, mensaje, link }))
  for (let i = 0; i < lote.length; i += 50)
    await supabase.from('notificaciones').insert(lote.slice(i, i + 50))
}

export default function Solicitudes() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()
  const location = useLocation()

  const esDocente   = perfil?.rol === 'docente'
  const esDireccion = ['admin', 'direccion_academica'].includes(perfil?.rol)
  const esRegistro  = ['admin', 'registro_academico'].includes(perfil?.rol)
  const canManage   = esDireccion || esRegistro

  const [solicitudes,    setSolicitudes]    = useState([])
  const [loading,        setLoading]        = useState(true)
  const [procesando,     setProcesando]     = useState(null)
  const [tabActiva,      setTabActiva]      = useState('todas')
  const [modalNueva,     setModalNueva]     = useState(false)
  const [modalDetalle,   setModalDetalle]   = useState(null)
  const [modalRespuesta, setModalRespuesta] = useState(null)
  const [respuesta,      setRespuesta]      = useState('')
  const [guardando,      setGuardando]      = useState(false)
  const [materias,       setMaterias]       = useState([])
  const [grados,         setGrados]         = useState([])
  const [estudiantes,    setEstudiantes]    = useState([])
  const [form, setForm] = useState({
    tipo: 'desbloqueo_notas', motivo: '', materia_id: '',
    grado_id: '', periodo: '', estudiante_id: '', fecha_asistencia: '', fecha_permiso: '',
  })

  useEffect(() => { cargar() }, [perfil, year])
  useEffect(() => { if (modalNueva) cargarExtras() }, [modalNueva])

  // Pre-llenar form y abrir modal si viene state desde Notas o Asistencia
  useEffect(() => {
    if (!location.state || !perfil) return
    const st = location.state
    setForm(f => ({
      ...f,
      tipo:             st.tipo             || 'desbloqueo_notas',
      materia_id:       st.materia_id       || '',
      grado_id:         st.grado_id         || '',
      periodo:          st.periodo          || '',
      estudiante_id:    st.estudiante_id    || '',
      fecha_asistencia: st.fecha_asistencia || '',
    }))
    setModalNueva(true)
    // Limpiar state para que no re-abra si el usuario recarga
    window.history.replaceState({}, '', window.location.pathname)
  }, [location.state, perfil])

  async function cargar() {
    setLoading(true)
    let q = supabase.from('solicitudes')
      .select(`*, solicitante:perfiles!solicitudes_solicitante_id_fkey(nombre, apellido), materias(nombre), grados(nombre, nivel), estudiantes(nombre, apellido), respondedor:perfiles!solicitudes_respondido_por_fkey(nombre, apellido)`)
      .eq('año_escolar', year).order('creado_en', { ascending: false })
    if (esDocente) q = q.eq('solicitante_id', perfil.id)
    const { data } = await q
    setSolicitudes(data || [])
    setLoading(false)
  }

  async function cargarExtras() {
    const [{ data: mat }, { data: gra }] = await Promise.all([
      supabase.from('materias').select('id, nombre').order('nombre'),
      supabase.from('grados').select('id, nombre, nivel').order('orden'),
    ])
    setGrados(gra || [])
    if (esDocente) {
      const { data: gradoEnc } = await supabase.from('grados').select('id').eq('encargado_id', perfil.id).single()
      if (gradoEnc) {
        const { data: ests } = await supabase.from('estudiantes').select('id, nombre, apellido').eq('grado_id', gradoEnc.id).eq('estado', 'activo').order('apellido')
        setEstudiantes(ests || [])
        setForm(f => ({ ...f, grado_id: String(gradoEnc.id) }))
      }
      const { data: asigs } = await supabase.from('asignaciones').select('materia_id, materias(id, nombre)').eq('docente_id', perfil.id).eq('año_escolar', year)
      const unicas = [...new Map((asigs || []).map(a => [a.materia_id, { id: a.materia_id, nombre: a.materias?.nombre }])).values()]
      setMaterias(unicas)
    } else {
      setMaterias(mat || [])
    }
  }

  async function crearSolicitud() {
    if (!form.motivo.trim()) { toast.error('El motivo es obligatorio'); return }
    if (form.tipo === 'desbloqueo_notas' && (!form.materia_id || !form.grado_id || !form.periodo)) { toast.error('Completa materia, grado y periodo'); return }
    if (form.tipo === 'modificar_asistencia' && !form.fecha_asistencia) { toast.error('Indica la fecha de asistencia'); return }
    if (form.tipo === 'permiso_personal') {
      if (!form.fecha_permiso) { toast.error('Indica la fecha del permiso'); return }
      const diasAnticipacion = Math.ceil((new Date(form.fecha_permiso) - new Date()) / (1000 * 60 * 60 * 24))
      if (diasAnticipacion < 4) { toast.error('El permiso personal debe solicitarse con al menos 4 días de anticipación'); return }
    }
    setGuardando(true)
    const { error } = await supabase.from('solicitudes').insert({
      tipo: form.tipo, motivo: form.motivo.trim(), solicitante_id: perfil.id, año_escolar: year,
      materia_id: form.materia_id || null, grado_id: form.grado_id ? parseInt(form.grado_id) : null,
      periodo: form.periodo ? parseInt(form.periodo) : null,
      estudiante_id: form.estudiante_id ? parseInt(form.estudiante_id) : null,
      fecha_asistencia: form.fecha_asistencia || null,
      fecha_permiso: form.fecha_permiso || null,
    })
    if (error) { toast.error('Error al crear solicitud'); setGuardando(false); return }

    // Notificar a dirección y registro
    const { data: gestores } = await supabase.from('perfiles')
      .select('id').in('rol', ['admin', 'direccion_academica', 'registro_academico'])
    const idsGestores = (gestores || []).map(p => p.id).filter(id => id !== perfil.id)
    const tipoLabel = TIPOS[form.tipo]?.label || form.tipo
    await notificar(idsGestores, 'solicitud',
      'Nueva solicitud recibida',
      `${perfil.nombre} ${perfil.apellido} solicitó: ${tipoLabel}`,
      'solicitudes'
    )

    toast.success('Solicitud enviada — dirección notificada')
    setModalNueva(false); resetForm(); cargar()
    setGuardando(false)
  }

  async function responder(accion) {
    const s = modalRespuesta?.solicitud
    if (!s) return
    if (accion === 'rechazar' && !respuesta.trim()) { toast.error('Escribe el motivo del rechazo'); return }
    setProcesando(s.id)
    const { error } = await supabase.from('solicitudes').update({
      estado: accion === 'aprobar' ? 'aprobado' : 'rechazado',
      respuesta: respuesta.trim() || null, respondido_por: perfil.id, respondido_en: new Date().toISOString(),
    }).eq('id', s.id)
    if (error) { toast.error('Error'); setProcesando(null); return }

    if (accion === 'aprobar') {
      // permiso_ausencia → marcar asistencia como justificado
      if (s.tipo === 'permiso_ausencia' && s.estudiante_id && s.fecha_asistencia) {
        await supabase.from('asistencia').upsert({
          estudiante_id: s.estudiante_id,
          grado_id:      s.grado_id,
          fecha:         s.fecha_asistencia,
          estado:        'justificado',
          año_escolar:   s.año_escolar,
          registrado_por: perfil.id,
          observacion:   `Permiso aprobado por ${perfil.nombre} ${perfil.apellido}`,
        }, { onConflict: 'estudiante_id,fecha,grado_id' })
      }

      // permiso_ausencia con retiro → notificar recepción con detalle completo
      if (s.tipo === 'permiso_ausencia' && s.motivo?.includes('[RETIRO]')) {
        const { data: recepPerfiles } = await supabase.from('perfiles').select('id').eq('rol', 'recepcion')
        const idsRecep = (recepPerfiles || []).map(p => p.id)
        if (idsRecep.length) {
          const nombreEst = s.estudiantes ? `${s.estudiantes.nombre} ${s.estudiantes.apellido}` : `Estudiante #${s.estudiante_id}`
          const aprobadoPor = `${perfil.nombre} ${perfil.apellido}`
          await notificar(idsRecep, 'retiro',
            `Retiro autorizado: ${nombreEst}`,
            `${s.motivo.replace('\n[RETIRO]', ' —')} | Aprobado por: ${aprobadoPor}`,
            'solicitudes'
          )
        }
      }
    }

    // Notificar al solicitante
    if (s.solicitante_id) {
      const tipoLabel = TIPOS[s.tipo]?.label || s.tipo
      await notificar(
        [s.solicitante_id],
        accion === 'aprobar' ? 'solicitud_aprobada' : 'solicitud_rechazada',
        accion === 'aprobar' ? 'Solicitud aprobada' : 'Solicitud rechazada',
        `Tu solicitud de ${tipoLabel} fue ${accion === 'aprobar' ? 'aprobada' : 'rechazada'}${respuesta.trim() ? ': ' + respuesta.trim() : ''}`,
        'solicitudes'
      )
    }

    toast.success(accion === 'aprobar' ? 'Solicitud aprobada' : 'Solicitud rechazada')
    setModalRespuesta(null); setRespuesta(''); setModalDetalle(null); cargar()
    setProcesando(null)
  }

  async function abrirMateria(s) {
    setProcesando(s.id)
    const cierre = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('solicitudes').update({ abierto_por: perfil.id, abierto_en: new Date().toISOString(), cierre_en: cierre }).eq('id', s.id)
    if (error) toast.error('Error al abrir')
    else { toast.success('Materia abierta por 12 horas'); cargar() }
    setProcesando(null)
  }

  async function cerrarMateria(s) {
    setProcesando(s.id)
    await supabase.from('solicitudes').update({ estado: 'cerrado', cierre_en: new Date().toISOString() }).eq('id', s.id)
    toast.success('Materia cerrada'); cargar(); setProcesando(null)
  }

  async function confirmarRetiro(s) {
    setProcesando(s.id)
    const horaRetiro = new Date().toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit' })
    const respActual = s.respuesta || ''
    const { error } = await supabase.from('solicitudes').update({
      estado:         'cerrado',
      respuesta:      `${respActual ? respActual + ' | ' : ''}Retiro confirmado por recepción a las ${horaRetiro}`,
      respondido_por: perfil.id,
      respondido_en:  new Date().toISOString(),
    }).eq('id', s.id)
    if (error) { toast.error('Error al confirmar retiro'); setProcesando(null); return }
    // Notificar al solicitante (padre)
    if (s.solicitante_id) {
      await notificar([s.solicitante_id], 'solicitud_aprobada',
        'Retiro confirmado',
        `Recepción confirmó el retiro de su hijo/a a las ${horaRetiro}`,
        'solicitudes'
      )
    }
    toast.success(`Retiro confirmado — ${horaRetiro}`)
    setModalDetalle(null); cargar(); setProcesando(null)
  }

  function resetForm() {
    setForm({ tipo: 'desbloqueo_notas', motivo: '', materia_id: '', grado_id: '', periodo: '', estudiante_id: '', fecha_asistencia: '', fecha_permiso: '' })
  }

  const tabs = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'aprobado', label: 'Aprobadas' },
    { id: 'historial', label: 'Historial' },
  ]
  const filtradas = solicitudes.filter(s => {
    if (tabActiva === 'todas') return true
    if (tabActiva === 'historial') return ['rechazado','cerrado'].includes(s.estado)
    return s.estado === tabActiva
  })
  const pendientesCount = solicitudes.filter(s => s.estado === 'pendiente').length

  function TarjetaSolicitud({ s }) {
    const tipo   = TIPOS[s.tipo]   || TIPOS.desbloqueo_notas
    const estado = ESTADOS[s.estado] || ESTADOS.pendiente
    const abierta = s.abierto_en && s.cierre_en && new Date() < new Date(s.cierre_en) && s.estado === 'aprobado'
    const tiempoRestante = abierta ? formatHoras(s.cierre_en) : null

    return (
      <div onClick={() => setModalDetalle(s)}
        style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0ecf8', padding: '16px 20px', marginBottom: 10, cursor: 'pointer', transition: 'box-shadow 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(61,31,97,0.1)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ color: tipo.color }}><TipoIcono tipo={s.tipo} size={15} /></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: tipo.color, background: tipo.bg, padding: '2px 10px', borderRadius: 10 }}>{tipo.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: estado.bg, color: estado.color }}>{estado.label}</span>
            </div>

            {s.tipo === 'desbloqueo_notas' && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61', marginBottom: 4 }}>
                {s.materias?.nombre} · {s.grados?.nombre}
                {s.periodo && <span style={{ fontWeight: 500, color: '#6b7280' }}> · {s.grados?.nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'} {s.periodo}</span>}
                {s.estudiantes && <span style={{ fontWeight: 500, color: '#6b7280' }}> · {s.estudiantes.apellido}, {s.estudiantes.nombre}</span>}
              </div>
            )}
            {s.tipo === 'modificar_asistencia' && s.fecha_asistencia && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61', marginBottom: 4 }}>
                Asistencia: {new Date(s.fecha_asistencia + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })}
                {s.grados && <span style={{ fontWeight: 500, color: '#6b7280' }}> · {s.grados.nombre}</span>}
              </div>
            )}
            {s.tipo === 'cita_padres' && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61', marginBottom: 4 }}>
                {s.estudiantes ? `${s.estudiantes.apellido}, ${s.estudiantes.nombre}` : 'Cita con padres'}
                {s.grados && <span style={{ fontWeight: 500, color: '#6b7280' }}> · {s.grados.nombre}</span>}
              </div>
            )}
            {s.tipo === 'permiso_personal' && s.fecha_permiso && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#be185d', marginBottom: 4 }}>
                Permiso: {new Date(s.fecha_permiso + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            )}

            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>
              {s.motivo}
            </div>
            <div style={{ fontSize: 11, color: '#b0a8c0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {canManage && <span>{s.solicitante?.nombre} {s.solicitante?.apellido}</span>}
              <span>{formatFecha(s.creado_en)}</span>
            </div>
            {tiempoRestante && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#dcfce7', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
                <IcoClock /> {tiempoRestante}
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {esDireccion && s.estado === 'pendiente' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setModalRespuesta({ solicitud: s, accion: 'aprobar' }); setRespuesta('') }} disabled={procesando === s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IcoCheck /> Aprobar
                </button>
                <button onClick={() => { setModalRespuesta({ solicitud: s, accion: 'rechazar' }); setRespuesta('') }} disabled={procesando === s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IcoX /> Rechazar
                </button>
              </div>
            )}
            {esRegistro && s.tipo === 'desbloqueo_notas' && s.estado === 'aprobado' && !s.abierto_en && (
              <button onClick={() => abrirMateria(s)} disabled={procesando === s.id}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                <IcoUnlock /> Abrir 12h
              </button>
            )}
            {esRegistro && s.tipo === 'permiso_ausencia' && s.motivo?.includes('[RETIRO]') && s.estado === 'aprobado' && (
              <button onClick={() => confirmarRetiro(s)} disabled={procesando === s.id}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #c2410c, #ea580c)', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                <IcoCheck /> Confirmar retiro
              </button>
            )}
            {esRegistro && abierta && (
              <button onClick={() => cerrarMateria(s)} disabled={procesando === s.id}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: 'none', background: '#f3f4f6', color: '#6b7280', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                <IcoX /> Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Solicitudes</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13 }}>{esDocente ? 'Tus solicitudes enviadas' : `${solicitudes.length} solicitudes este año`}</p>
        </div>
        {esDocente && (
          <button onClick={() => { resetForm(); setModalNueva(true) }}
            style={{ ...s.btnPrimary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoPlus /> Nueva solicitud
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 12, padding: 4, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setTabActiva(tab.id)}
            style={{ padding: '7px 16px', borderRadius: 9, border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: tabActiva === tab.id ? 700 : 500, cursor: 'pointer', background: tabActiva === tab.id ? 'linear-gradient(135deg, #5B2D8E, #3d1f61)' : 'transparent', color: tabActiva === tab.id ? '#fff' : '#6b7280', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {tab.label}
            {tab.id === 'pendiente' && pendientesCount > 0 && (
              <span style={{ background: tabActiva === 'pendiente' ? 'rgba(255,255,255,0.3)' : '#fef9c3', color: tabActiva === 'pendiente' ? '#fff' : '#92400e', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
                {pendientesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#b0a8c0' }}>Cargando...</div>
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IcoEmpty /></div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>
            {tabActiva === 'pendiente' ? 'Sin solicitudes pendientes' : 'Sin solicitudes'}
          </div>
        </div>
      ) : (
        <div>{filtradas.map(s => <TarjetaSolicitud key={s.id} s={s} />)}</div>
      )}

      {/* Modal nueva solicitud */}
      {modalNueva && (
        <div style={s.modalBg} onClick={() => { setModalNueva(false); resetForm() }}>
          <div style={{ ...s.modalBox, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: location.state?._hint ? 8 : 20 }}>Nueva solicitud</h2>

            {location.state?._hint && (
              <div style={{ background: '#f3eeff', borderRadius: 8, padding: '7px 12px', marginBottom: 16, fontSize: 12, fontWeight: 600, color: '#5B2D8E' }}>
                {location.state._hint}
              </div>
            )}

            <div style={s.field}>
              <label style={s.label}>Tipo de solicitud</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {Object.entries(TIPOS).map(([k, v]) => (
                  <button key={k} onClick={() => setForm(f => ({ ...f, tipo: k }))}
                    style={{ padding: '10px 12px', borderRadius: 10, border: `2px solid ${form.tipo === k ? v.color : '#e5e7eb'}`, background: form.tipo === k ? v.bg : '#fff', color: form.tipo === k ? v.color : '#6b7280', fontWeight: form.tipo === k ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: form.tipo === k ? v.color : '#b0a8c0' }}><TipoIcono tipo={k} size={18} /></span>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {form.tipo === 'desbloqueo_notas' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={s.field}>
                    <label style={s.label}>Materia</label>
                    <select style={s.inputFull} value={form.materia_id} onChange={e => setForm(f => ({ ...f, materia_id: e.target.value }))}>
                      <option value="">Selecciona...</option>
                      {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Periodo</label>
                    <select style={s.inputFull} value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))}>
                      <option value="">Selecciona...</option>
                      <option value="1">Trimestre / Bimestre 1</option>
                      <option value="2">Trimestre / Bimestre 2</option>
                      <option value="3">Trimestre / Bimestre 3</option>
                      <option value="4">Bimestre 4</option>
                    </select>
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Estudiante <span style={{ color: '#b0a8c0', textTransform: 'none', fontWeight: 400 }}>(opcional)</span></label>
                  <select style={s.inputFull} value={form.estudiante_id} onChange={e => setForm(f => ({ ...f, estudiante_id: e.target.value }))}>
                    <option value="">Todos los estudiantes del grado</option>
                    {estudiantes.map(e => <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>)}
                  </select>
                </div>
              </>
            )}

            {form.tipo === 'modificar_asistencia' && (
              <div style={s.field}>
                <label style={s.label}>Fecha a modificar</label>
                <input type="date" style={s.inputFull} value={form.fecha_asistencia}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, fecha_asistencia: e.target.value }))} />
              </div>
            )}

            {form.tipo === 'cita_padres' && (
              <div style={s.field}>
                <label style={s.label}>Estudiante <span style={{ color: '#b0a8c0', textTransform: 'none', fontWeight: 400 }}>(opcional)</span></label>
                <select style={s.inputFull} value={form.estudiante_id} onChange={e => setForm(f => ({ ...f, estudiante_id: e.target.value }))}>
                  <option value="">Selecciona estudiante...</option>
                  {estudiantes.map(e => <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>)}
                </select>
              </div>
            )}

            {form.tipo === 'permiso_personal' && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 10, marginBottom: 14 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ fontSize: 12, color: '#9d174d', fontWeight: 600, lineHeight: 1.6 }}>
                    Los permisos personales deben solicitarse con <strong>mínimo 4 días de anticipación</strong>. Solicitudes con menor anticipación no serán procesadas.
                  </span>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Fecha del permiso</label>
                  <input type="date" style={s.inputFull} value={form.fecha_permiso}
                    min={(() => { const d = new Date(); d.setDate(d.getDate() + 4); return d.toISOString().split('T')[0] })()}
                    onChange={e => setForm(f => ({ ...f, fecha_permiso: e.target.value }))} />
                </div>
              </>
            )}

            <div style={s.field}>
              <label style={s.label}>Motivo</label>
              <textarea style={{ ...s.inputFull, minHeight: 90, resize: 'vertical' }}
                placeholder={form.tipo === 'desbloqueo_notas' ? 'Explica por qué necesitas modificar las notas...' : form.tipo === 'modificar_asistencia' ? 'Explica por qué necesitas modificar la asistencia...' : form.tipo === 'permiso_personal' ? 'Describe el motivo de tu permiso (médico, personal, familiar...)' : 'Describe el motivo de la cita...'}
                value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalNueva(false); resetForm() }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={crearSolicitud} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Enviando...' : 'Enviar solicitud'}
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
              const tipo   = TIPOS[modalDetalle.tipo]   || TIPOS.desbloqueo_notas
              const estado = ESTADOS[modalDetalle.estado] || ESTADOS.pendiente
              const abierta = modalDetalle.abierto_en && modalDetalle.cierre_en && new Date() < new Date(modalDetalle.cierre_en)
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: tipo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tipo.color, flexShrink: 0 }}>
                      <TipoIcono tipo={modalDetalle.tipo} size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tipo.color, background: tipo.bg, padding: '2px 10px', borderRadius: 10, display: 'inline-block', marginBottom: 4 }}>{tipo.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: estado.bg, color: estado.color, display: 'inline-block', marginLeft: 6 }}>{estado.label}</span>
                    </div>
                  </div>

                  <div style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', marginBottom: 12 }}>
                    {modalDetalle.materias    && <div style={{ fontSize: 12, marginBottom: 4 }}><b>Materia:</b> {modalDetalle.materias.nombre}</div>}
                    {modalDetalle.grados      && <div style={{ fontSize: 12, marginBottom: 4 }}><b>Grado:</b> {modalDetalle.grados.nombre}</div>}
                    {modalDetalle.periodo     && <div style={{ fontSize: 12, marginBottom: 4 }}><b>Periodo:</b> {modalDetalle.periodo}</div>}
                    {modalDetalle.estudiantes && <div style={{ fontSize: 12, marginBottom: 4 }}><b>Estudiante:</b> {modalDetalle.estudiantes.apellido}, {modalDetalle.estudiantes.nombre}</div>}
                    {modalDetalle.fecha_asistencia && <div style={{ fontSize: 12, marginBottom: 4 }}><b>Fecha asistencia:</b> {new Date(modalDetalle.fecha_asistencia + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })}</div>}
                    {modalDetalle.fecha_permiso && <div style={{ fontSize: 12, marginBottom: 4 }}><b>Fecha permiso:</b> {new Date(modalDetalle.fecha_permiso + 'T12:00:00').toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric', month: 'long' })}</div>}
                    {canManage && <div style={{ fontSize: 12, marginBottom: 4 }}><b>Solicitado por:</b> {modalDetalle.solicitante?.nombre} {modalDetalle.solicitante?.apellido}</div>}
                    <div style={{ fontSize: 12 }}><b>Fecha:</b> {formatFecha(modalDetalle.creado_en)}</div>
                  </div>

                  <div style={{ background: '#f3eeff', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Motivo</div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{modalDetalle.motivo}</div>
                  </div>

                  {modalDetalle.respuesta && (
                    <div style={{ background: estado.bg, borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: estado.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Respuesta — {modalDetalle.respondedor?.nombre} {modalDetalle.respondedor?.apellido}
                      </div>
                      <div style={{ fontSize: 13, color: '#374151' }}>{modalDetalle.respuesta}</div>
                    </div>
                  )}

                  {abierta && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dcfce7', borderRadius: 12, padding: '10px 16px', marginBottom: 12, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                      <IcoClock /> {formatHoras(modalDetalle.cierre_en)} — materia abierta para edición
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => setModalDetalle(null)} style={s.btnSecondary}>Cerrar</button>
                    {esDireccion && modalDetalle.estado === 'pendiente' && (
                      <>
                        <button onClick={() => { setModalRespuesta({ solicitud: modalDetalle, accion: 'aprobar' }); setRespuesta('') }}
                          style={{ ...s.btnSecondary, color: '#16a34a', borderColor: '#86efac', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IcoCheck /> Aprobar
                        </button>
                        <button onClick={() => { setModalRespuesta({ solicitud: modalDetalle, accion: 'rechazar' }); setRespuesta('') }}
                          style={{ ...s.btnSecondary, color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IcoX /> Rechazar
                        </button>
                      </>
                    )}
                    {esRegistro && modalDetalle.tipo === 'desbloqueo_notas' && modalDetalle.estado === 'aprobado' && !modalDetalle.abierto_en && (
                      <button onClick={() => { abrirMateria(modalDetalle); setModalDetalle(null) }}
                        style={{ ...s.btnPrimary, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IcoUnlock /> Abrir 12h
                      </button>
                    )}
                    {esRegistro && modalDetalle.tipo === 'permiso_ausencia' && modalDetalle.motivo?.includes('[RETIRO]') && modalDetalle.estado === 'aprobado' && (
                      <button onClick={() => confirmarRetiro(modalDetalle)}
                        style={{ ...s.btnPrimary, background: 'linear-gradient(135deg, #c2410c, #ea580c)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IcoCheck /> Confirmar retiro
                      </button>
                    )}
                    {esRegistro && abierta && (
                      <button onClick={() => { cerrarMateria(modalDetalle); setModalDetalle(null) }}
                        style={{ ...s.btnSecondary, color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IcoX /> Cerrar
                      </button>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal aprobar/rechazar */}
      {modalRespuesta && (
        <div style={s.modalBg} onClick={() => setModalRespuesta(null)}>
          <div style={{ ...s.modalBox, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: modalRespuesta.accion === 'aprobar' ? '#16a34a' : '#dc2626', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
              {modalRespuesta.accion === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
              {TIPOS[modalRespuesta.solicitud?.tipo]?.label} · {modalRespuesta.solicitud?.solicitante?.nombre} {modalRespuesta.solicitud?.solicitante?.apellido}
            </p>
            <div style={s.field}>
              <label style={s.label}>{modalRespuesta.accion === 'rechazar' ? 'Motivo del rechazo' : 'Comentario (opcional)'}</label>
              <textarea value={respuesta} onChange={e => setRespuesta(e.target.value)}
                placeholder={modalRespuesta.accion === 'rechazar' ? 'Explica por qué se rechaza...' : 'Instrucciones adicionales...'}
                style={{ ...s.inputFull, minHeight: 80, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalRespuesta(null)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={() => responder(modalRespuesta.accion)} disabled={procesando === modalRespuesta.solicitud?.id}
                style={{ ...s.btnPrimary, background: modalRespuesta.accion === 'aprobar' ? 'linear-gradient(135deg, #16a34a, #166534)' : 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
                {procesando ? 'Procesando...' : modalRespuesta.accion === 'aprobar' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  label:       { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  field:       { marginBottom: 14 },
  inputFull:   { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none' },
  btnPrimary:  { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary:{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox:    { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', maxHeight: '90vh', overflowY: 'auto' },
}