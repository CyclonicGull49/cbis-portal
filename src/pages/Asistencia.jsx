import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import { FieldGroup, ModuleHero, ModuleToolbar, PremiumEmptyState, StatusPill } from '../components/ui/ModuleChrome'
import toast from 'react-hot-toast'

function useBreakpoint() {
  const [bp, setBp] = useState(() => window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
  useEffect(() => {
    const fn = () => setBp(window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return bp
}

// ── Iconos ────────────────────────────────────
const IcoCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IcoWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IcoEmpty = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d8c8f0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/>
  </svg>
)

const ESTADOS = [
  { value: 'presente',    label: 'Presente',    color: '#1A7A4A', bg: '#dcfce7', dot: '#16a34a' },
  { value: 'ausente',     label: 'Ausente',     color: '#C0392B', bg: '#fee2e2', dot: '#dc2626' },
  { value: 'tardanza',    label: 'Tardanza',    color: '#946A00', bg: '#fef9c3', dot: '#ca8a04' },
  { value: 'justificado', label: 'Justificado', color: '#1e40af', bg: '#dbeafe', dot: '#2563eb' },
]

const TIPO_PERMISO = {
  medico:    { label: 'Médico',    color: '#1e40af', bg: '#dbeafe' },
  familiar:  { label: 'Familiar',  color: '#6d28d9', bg: '#ede9fe' },
  academico: { label: 'Académico', color: '#065f46', bg: '#d1fae5' },
  ausencia:  { label: 'Ausencia',  color: '#1e40af', bg: '#dbeafe' },
  llegada_tarde: { label: 'Llegada tarde', color: '#946A00', bg: '#fef9c3' },
  retiro_anticipado: { label: 'Retiro anticipado', color: '#c2410c', bg: '#fff7ed' },
  otro:      { label: 'Otro',      color: '#92400e', bg: '#fef3c7' },
}

function estadoInfo(val) { return ESTADOS.find(e => e.value === val) || ESTADOS[0] }
function hoy() { return new Date().toISOString().split('T')[0] }

function puedeEditarFecha(fecha, esAdmin) {
  if (esAdmin) return true
  if (!fecha) return false
  const hoyDate = new Date()
  hoyDate.setHours(0, 0, 0, 0)
  const fechaDate = new Date(`${fecha}T00:00:00`)
  const diffDias = Math.floor((hoyDate - fechaDate) / 86400000)
  return diffDias >= 0 && diffDias <= 1
}

export default function Asistencia({ onIrASolicitudes }) {
  const { perfil } = useAuth()
  const yearEscolar = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const isAdmin   = ['admin', 'registro_academico', 'direccion_academica'].includes(perfil?.rol)
  const isDocente = perfil?.rol === 'docente'

  const [grados,        setGrados]        = useState([])
  const [gradoId,       setGradoId]       = useState('')
  const [fecha,         setFecha]         = useState(hoy())
  const [estudiantes,   setEstudiantes]   = useState([])
  const [asistencia,    setAsistencia]    = useState({})
  const [observaciones, setObservaciones] = useState({})
  const [permisosMap,   setPermisosMap]   = useState({})
  const [guardando,     setGuardando]     = useState(false)
  const [cargando,          setCargando]          = useState(false)
  const [yaGuardado,        setYaGuardado]         = useState(false)
  const [registradoPor,     setRegistradoPor]      = useState(null)
  const [alertas,           setAlertas]            = useState([])
  const [modificacionAprobada, setModificacionAprobada] = useState(false)

  const puedeEditar = isAdmin || modificacionAprobada || (isDocente && puedeEditarFecha(fecha, false))

  useEffect(() => {
    if (!perfil) return
    async function cargarGrados() {
      if (!isDocente) {
        const { data } = await supabase.from('grados').select('id, nombre, nivel, orden').order('orden')
        setGrados(data || [])
        return
      }

      const [{ data: asigs }, { data: gradoEncargado }] = await Promise.all([
        supabase.from('asignaciones')
          .select('grado_id')
          .eq('docente_id', perfil.id)
          .eq('año_escolar', year),
        supabase.from('grados')
          .select('id')
          .eq('encargado_id', perfil.id)
          .maybeSingle(),
      ])

      const gradoIds = new Set((asigs || []).map(a => a.grado_id).filter(Boolean))
      if (perfil?.grado_id) gradoIds.add(perfil.grado_id)
      if (gradoEncargado?.id) gradoIds.add(gradoEncargado.id)

      if (gradoIds.size === 0) {
        setGrados([])
        setGradoId('')
        return
      }

      const { data } = await supabase.from('grados')
        .select('id, nombre, nivel, orden')
        .in('id', Array.from(gradoIds))
        .order('orden')
      setGrados(data || [])
    }
    cargarGrados()
  }, [perfil?.id, perfil?.grado_id, isDocente, year])

  useEffect(() => {
    if (!isDocente || grados.length === 0) return
    if (perfil?.grado_id && grados.some(g => g.id === perfil.grado_id)) {
      setGradoId(String(perfil.grado_id))
      return
    }
    if (grados.length === 1) setGradoId(String(grados[0].id))
  }, [grados, isDocente, perfil])

  useEffect(() => {
    if (!gradoId || !fecha) return
    setCargando(true)
    setYaGuardado(false)
    setRegistradoPor(null)
    setModificacionAprobada(false)
    setAlertas([])

    Promise.all([
      supabase.from('estudiantes').select('id, nombre, apellido')
        .eq('grado_id', parseInt(gradoId)).eq('estado', 'activo').order('apellido'),
      supabase.from('asistencia').select('estudiante_id, estado, observacion, registrado_por')
        .eq('grado_id', parseInt(gradoId)).eq('fecha', fecha).eq('año_escolar', year),
    ]).then(async ([{ data: ests }, { data: asis }]) => {
      const estList = ests || []
      setEstudiantes(estList)

      // Permisos del día
      const estIds = estList.map(e => e.id)
      let pMap = {}
      if (estIds.length > 0) {
        const { data: perms } = await supabase.from('permisos')
          .select('estudiante_id, tipo, subtipo, motivo').eq('fecha', fecha).in('estudiante_id', estIds)
        for (const p of (perms || [])) pMap[p.estudiante_id] = p
      }
      setPermisosMap(pMap)

      if ((asis || []).length > 0) {
        const asMap = {}, obMap = {}
        for (const a of asis) {
          asMap[a.estudiante_id] = a.estado
          obMap[a.estudiante_id] = a.observacion || ''
        }
        setAsistencia(asMap)
        setObservaciones(obMap)
        setYaGuardado(true)
        // Resolver nombre del docente que registró (tomar el primero, todos deberían ser el mismo)
        const regPorId = asis.find(a => a.registrado_por)?.registrado_por
        if (regPorId) {
          const { data: regPerfil } = await supabase.from('perfiles')
            .select('nombre, apellido').eq('id', regPorId).single()
          if (regPerfil) setRegistradoPor(`${regPerfil.nombre} ${regPerfil.apellido}`)
        }
      } else {
        const asMap = {}
        for (const e of estList) {
          const permisoTipo = pMap[e.id]?.subtipo || pMap[e.id]?.tipo
          if (permisoTipo === 'ausencia') asMap[e.id] = 'justificado'
          if (permisoTipo === 'llegada_tarde') asMap[e.id] = 'tardanza'
          // Sin registros previos: estado vacío, el docente debe marcarlo explícitamente
        }
        const obMap = {}
        for (const e of estList) {
          const permisoTipo = pMap[e.id]?.subtipo || pMap[e.id]?.tipo
          if (pMap[e.id]) obMap[e.id] = `${TIPO_PERMISO[permisoTipo]?.label || 'Permiso'}: ${pMap[e.id].motivo}`
        }
        setAsistencia(asMap)
        setObservaciones(obMap)
        setYaGuardado(false)
      }

      // ── Verificar alertas del mes ──────────────
      const fechaObj  = new Date(fecha + 'T12:00:00')
      const mesInicio = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}-01`
      const mesFin    = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}-31`

      if (estIds.length > 0) {
        const { data: resMes } = await supabase.from('asistencia')
          .select('estudiante_id, estado')
          .eq('grado_id', parseInt(gradoId))
          .eq('año_escolar', year)
          .gte('fecha', mesInicio)
          .lte('fecha', mesFin)
          .in('estudiante_id', estIds)
          .in('estado', ['ausente', 'tardanza'])

        // Contar por estudiante
        const conteo = {}
        for (const r of (resMes || [])) {
          if (!conteo[r.estudiante_id]) conteo[r.estudiante_id] = { ausente: 0, tardanza: 0 }
          conteo[r.estudiante_id][r.estado]++
        }

        const alertasList = []
        for (const est of estList) {
          const c = conteo[est.id]
          if (!c) continue
          if (c.ausente >= 3) alertasList.push({ estudiante: est, tipo: 'ausente', count: c.ausente })
          else if (c.tardanza >= 3) alertasList.push({ estudiante: est, tipo: 'tardanza', count: c.tardanza })
        }
        setAlertas(alertasList)
      }

      // Verificar si hay solicitud aprobada de modificación para este grado+fecha
      // Solo relevante cuando ya hay asistencia guardada (yaGuardado se setea arriba)
      if (perfil?.id && gradoId) {
        const { data: solMod } = await supabase.from('solicitudes')
          .select('id, abierto_en, cierre_en')
          .eq('tipo', 'modificar_asistencia')
          .eq('solicitante_id', perfil.id)
          .eq('grado_id', parseInt(gradoId))
          .eq('fecha_asistencia', fecha)
          .eq('año_escolar', year)
          .eq('estado', 'aprobado')
          .limit(1)
        setModificacionAprobada((solMod || []).some(sol => sol.abierto_en && sol.cierre_en && new Date() < new Date(sol.cierre_en)))
      }

      setCargando(false)
    })
  }, [gradoId, fecha, year, perfil?.id])

  function irASolicitudes(state) {
    if (onIrASolicitudes) {
      onIrASolicitudes(state)
    } else {
      sessionStorage.setItem('solicitudes_state', JSON.stringify(state))
    }
  }

  function marcarTodos(estado) {
    const nuevo = {}
    for (const e of estudiantes) nuevo[e.id] = estado
    setAsistencia(nuevo)
  }

  async function guardar() {
    if (!gradoId || estudiantes.length === 0) return
    if (!puedeEditar) { toast.error('La asistencia solo puede editarse hoy o al día siguiente. Para fechas anteriores solicita desbloqueo.'); return }
    setGuardando(true)
    const toastId = toast.loading('Guardando asistencia...')
    try {
      const registros = estudiantes
        .filter(e => asistencia[e.id]) // solo guardar los que tienen estado marcado
        .map(e => ({
          fecha, estudiante_id: e.id, grado_id: parseInt(gradoId),
          docente_id: perfil.id, año_escolar: year,
          estado: asistencia[e.id],
          observacion: observaciones[e.id] || null,
          materia_id: null, registrado_por: perfil.id,
        }))
      const { error } = await supabase.from('asistencia')
        .upsert(registros, { onConflict: 'estudiante_id,fecha,grado_id,año_escolar' })
      if (error) throw error
      toast.success('Asistencia guardada', { id: toastId })
      setYaGuardado(true)
    } catch (err) {
      toast.error(err.message || 'Error al guardar', { id: toastId })
    } finally {
      setGuardando(false)
    }
  }

  const resumen = ESTADOS.map(e => ({
    ...e, count: Object.values(asistencia).filter(v => v === e.value).length,
  }))
  const sinMarcar = estudiantes.filter(e => !asistencia[e.id]).length
  const gradoInfo    = grados.find(g => g.id === parseInt(gradoId))
  const permisosHoy  = Object.keys(permisosMap).length
  const mesNombre    = new Date(fecha + 'T12:00:00').toLocaleDateString('es-SV', { month: 'long' })

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <style>{`
        .attendance-state-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(26,13,48,0.08); }
        .attendance-save-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 28px rgba(91,45,142,0.20) !important; }
      `}</style>

      <ModuleHero
        eyebrow="Operación diaria"
        title="Registro de asistencia"
        subtitle="Marca la presencia del día, identifica permisos y detecta alertas sin perder el flujo original de control por grado."
        meta={gradoInfo ? `${gradoInfo.nombre} · ${new Date(fecha + 'T12:00:00').toLocaleDateString('es-SV', { day: '2-digit', month: 'long', year: 'numeric' })}` : `Año escolar ${year}`}
        stats={[
          { value: estudiantes.length || '—', label: 'estudiantes', color: '#fff' },
          { value: resumen.find(e => e.value === 'presente')?.count || 0, label: 'presentes', color: '#DDF7BF' },
          { value: sinMarcar, label: 'sin marcar', color: sinMarcar ? '#F5E3A8' : '#fff' },
          { value: alertas.length, label: 'alertas', color: alertas.length ? '#F9C8DC' : '#fff' },
        ]}
      />

      {/* Controles */}
      <ModuleToolbar>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FieldGroup label="Grado" minWidth={220}>
            <select style={s.select} value={gradoId} onChange={e => setGradoId(e.target.value)}>
              <option value="">Selecciona un grado</option>
              {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Fecha" minWidth={180}>
            <input type="date" style={s.select} value={fecha}
              onChange={e => setFecha(e.target.value)} max={hoy()} />
          </FieldGroup>
          {gradoId && <StatusPill label="Permisos" value={permisosHoy} color="#5B2D8E" bg="#F3E8FA" />}
          {!isMobile && estudiantes.length > 0 && puedeEditar && (
            <div style={{ flex: '1 1 auto', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ ...s.label, marginBottom: 0 }}>Marcar todos:</span>
              {ESTADOS.map(e => (
                <button key={e.value} onClick={() => marcarTodos(e.value)}
                  className="attendance-state-btn"
                  style={{ padding: '8px 12px', borderRadius: 999, border: `1.5px solid ${e.dot}`, background: e.bg, color: e.color, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 160ms ease, box-shadow 160ms ease' }}>
                  {e.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </ModuleToolbar>

      {/* Alerta fecha bloqueada */}
      {gradoId && !puedeEditar && !cargando && (
        <div style={{ ...s.aviso('#fee2e2', '#dc2626'), marginBottom: 16, justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IcoLock />
            Fecha fuera del rango de edición. Para fechas anteriores usa una solicitud de modificación.
          </span>
          {!isAdmin && (
            <button onClick={() => irASolicitudes({ tipo: 'modificar_asistencia', grado_id: String(gradoId), fecha_asistencia: fecha, _hint: `${gradoInfo?.nombre} · ${fecha}` })}
              style={{ padding: '5px 14px', borderRadius: 8, border: '1.5px solid #dc2626', background: '#fff', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              Solicitar modificación
            </button>
          )}
        </div>
      )}

      {/* Alertas del mes */}
      {alertas.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: '14px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <IcoWarn />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#c2410c' }}>
              Alertas de {mesNombre} — {alertas.length} estudiante{alertas.length !== 1 ? 's' : ''} con 3 o más registros
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertas.map(a => (
              <div key={`${a.estudiante.id}-${a.tipo}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: a.tipo === 'ausente' ? '#fef2f2' : '#fef9c3', border: `1px solid ${a.tipo === 'ausente' ? '#fca5a5' : '#fcd34d'}` }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.tipo === 'ausente' ? '#dc2626' : '#ca8a04', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                  {a.estudiante.apellido}, {a.estudiante.nombre}
                </span>
                <span style={{ fontSize: 12, color: a.tipo === 'ausente' ? '#dc2626' : '#92400e', fontWeight: 600, marginLeft: 'auto' }}>
                  {a.count} {a.tipo === 'ausente' ? 'ausencias' : 'tardanzas'} este mes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenido */}
      {gradoId && (
        cargando ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 14 }}>Cargando...</div>
        ) : estudiantes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 14 }}>No hay estudiantes activos en este grado</div>
        ) : (
          <>
            {/* Avisos */}
            {yaGuardado && (
              <div style={{ ...s.aviso('#dbeafe', '#1e40af'), marginBottom: 12 }}>
                <IcoCheck />
                <span>
                  Asistencia registrada{registradoPor ? ` por ${registradoPor}` : ''}{puedeEditar ? '. Puedes modificarla dentro del plazo permitido.' : '. Esta fecha está bloqueada para edición.'}
                </span>
              </div>
            )}
            {permisosHoy > 0 && !yaGuardado && (
              <div style={{ ...s.aviso('#ede9fe', '#6d28d9'), marginBottom: 12 }}>
                <IcoList /> {permisosHoy} estudiante{permisosHoy > 1 ? 's' : ''} con permiso — aplicado automáticamente según el tipo de solicitud
              </div>
            )}

            {/* Resumen */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {resumen.map(e => (
                <button key={e.value}
                  onClick={() => isMobile && puedeEditar && marcarTodos(e.value)}
                  className={isMobile && puedeEditar ? 'attendance-state-btn' : ''}
                  style={{ padding: isMobile ? '9px 12px' : '9px 16px', borderRadius: 999, background: e.bg, border: `1.5px solid ${e.dot}`, display: 'flex', alignItems: 'center', gap: 7, cursor: isMobile && puedeEditar ? 'pointer' : 'default', fontFamily: 'inherit', flexShrink: 0, transition: 'transform 160ms ease, box-shadow 160ms ease' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.dot, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: e.color }}>{e.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: e.color }}>{e.count}</span>
                </button>
              ))}
              <div style={{ padding: '8px 16px', borderRadius: 10, background: '#f3eeff', border: '1.5px solid #5B2D8E', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3d1f61' }}>Total</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61' }}>{estudiantes.length}</span>
              </div>
            </div>
            {isMobile && puedeEditar && (
              <div style={{ fontSize: 11, color: '#b0a8c0', marginBottom: 12, fontWeight: 500 }}>
                Toca un estado para marcar todos
              </div>
            )}

            {/* Tabla desktop */}
            {!isMobile ? (
              <div style={s.tableShell}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a2d5a' }}>
                      <th style={{ ...s.th, width: 36 }}>#</th>
                      <th style={{ ...s.th, textAlign: 'left' }}>Estudiante</th>
                      {ESTADOS.map(e => (
                        <th key={e.value} style={{ ...s.th, width: 90 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: e.dot, display: 'inline-block', flexShrink: 0 }} />
                            {e.label}
                          </div>
                        </th>
                      ))}
                      <th style={{ ...s.th, textAlign: 'left' }}>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map((est, idx) => {
                      const estadoActual = asistencia[est.id] || null
                      const info         = estadoActual ? estadoInfo(estadoActual) : { dot: '#d1d5db', bg: 'transparent', color: '#9ca3af' }
                      const permiso      = permisosMap[est.id]
                      const permisoTipo  = permiso?.subtipo || permiso?.tipo
                      const tieneAlerta  = alertas.some(a => a.estudiante.id === est.id)
                      return (
                        <tr key={est.id} style={{ background: tieneAlerta ? '#fffbeb' : idx % 2 === 0 ? '#fff' : '#fdfcff', borderBottom: '1px solid #f3eeff', transition: 'background 0.1s' }}>
                          <td style={{ ...s.td, color: '#b0a8c0', fontSize: 12 }}>{idx + 1}</td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.dot, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f1d40', fontSize: 13 }}>
                                  {est.apellido}, {est.nombre}
                                  {tieneAlerta && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: '#fef9c3', color: '#92400e' }}>Alerta</span>}
                                </div>
                                {permiso && (
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: TIPO_PERMISO[permisoTipo]?.bg || '#f3f4f6', color: TIPO_PERMISO[permisoTipo]?.color || '#374151', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <IcoCalendar /> Permiso {TIPO_PERMISO[permisoTipo]?.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          {ESTADOS.map(e => {
                            const activo = estadoActual === e.value
                            return (
                              <td key={e.value} style={{ ...s.td, textAlign: 'center', padding: '8px 6px' }}>
                                <button
                                  onClick={() => puedeEditar && setAsistencia(prev => ({ ...prev, [est.id]: e.value }))}
                                  disabled={!puedeEditar}
                                  style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    border: `2px solid ${activo ? e.dot : '#e5e7eb'}`,
                                    background: activo ? e.bg : 'transparent',
                                    cursor: puedeEditar ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                    flexShrink: 0, margin: '0 auto',
                                  }}>
                                  {activo && (
                                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: e.dot, display: 'block' }} />
                                  )}
                                </button>
                              </td>
                            )
                          })}
                          <td style={s.td}>
                            <input type="text"
                              placeholder={estadoActual && estadoActual !== 'presente' ? 'Motivo...' : ''}
                              value={observaciones[est.id] || ''}
                              onChange={e => puedeEditar && setObservaciones(prev => ({ ...prev, [est.id]: e.target.value }))}
                              disabled={!puedeEditar}
                              style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'inherit', background: estadoActual && estadoActual !== 'presente' ? '#fffbeb' : '#fff', cursor: puedeEditar ? 'text' : 'not-allowed' }} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Tarjetas móvil */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {estudiantes.map(est => {
                  const estadoActual = asistencia[est.id] || null
                  const permiso      = permisosMap[est.id]
                  const permisoTipo  = permiso?.subtipo || permiso?.tipo
                  const tieneAlerta  = alertas.some(a => a.estudiante.id === est.id)
                  return (
                    <div key={est.id} style={{ background: tieneAlerta ? '#fffbeb' : '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(61,31,97,0.07)', padding: 14, border: tieneAlerta ? '1.5px solid #fcd34d' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f1d40', fontSize: 14 }}>
                            {est.apellido}, {est.nombre}
                            {tieneAlerta && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: '#fef9c3', color: '#92400e' }}>Alerta</span>}
                          </div>
                          {permiso && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: TIPO_PERMISO[permisoTipo]?.bg || '#f3f4f6', color: TIPO_PERMISO[permisoTipo]?.color || '#374151', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                              <IcoCalendar /> Permiso {TIPO_PERMISO[permisoTipo]?.label}
                            </span>
                          )}
                        </div>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: estadoActual ? estadoInfo(estadoActual).dot : '#d1d5db', display: 'inline-block', marginTop: 4 }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 8 }}>
                        {ESTADOS.map(e => (
                          <button key={e.value}
                            onClick={() => puedeEditar && setAsistencia(prev => ({ ...prev, [est.id]: e.value }))}
                            disabled={!puedeEditar}
                            style={{ padding: '8px 4px', borderRadius: 10, border: `2px solid ${estadoActual === e.value ? e.dot : '#e5e7eb'}`, background: estadoActual === e.value ? e.bg : '#fafafa', color: estadoActual === e.value ? e.color : '#9ca3af', fontWeight: estadoActual === e.value ? 800 : 500, fontSize: 13, cursor: puedeEditar ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                            {e.label}
                          </button>
                        ))}
                      </div>
                      {estadoActual && estadoActual !== 'presente' && (
                        <input type="text" placeholder="Motivo u observación..."
                          value={observaciones[est.id] || ''}
                          onChange={e => puedeEditar && setObservaciones(prev => ({ ...prev, [est.id]: e.target.value }))}
                          disabled={!puedeEditar}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', background: '#fffbeb', boxSizing: 'border-box' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Guardar */}
            {puedeEditar && (
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {sinMarcar > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#b45309', background: '#fef3c7', padding: '6px 12px', borderRadius: 8 }}>
                    {sinMarcar} estudiante{sinMarcar !== 1 ? 's' : ''} sin marcar
                  </span>
                )}
                <button onClick={guardar} disabled={guardando}
                  className="attendance-save-btn"
                  style={{ padding: '12px 32px', background: guardando ? '#e5e7eb' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: guardando ? '#9ca3af' : '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 900, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, boxShadow: guardando ? 'none' : '0 12px 24px rgba(91,45,142,0.18)', transition: 'transform 160ms ease, box-shadow 160ms ease' }}>
                  {guardando ? (
                    <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Guardando...</>
                  ) : `${yaGuardado ? 'Actualizar' : 'Guardar'} asistencia`}
                </button>
              </div>
            )}
          </>
        )
      )}

      {!gradoId && (
        <PremiumEmptyState
          title="Selecciona un grado y fecha para comenzar"
          text="Después podrás marcar asistencia individual o aplicar un estado a todo el grupo."
          icon={<IcoEmpty />}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '12px 14px', borderRadius: 14, border: '1.5px solid rgba(26,13,48,0.08)', fontSize: 14, background: '#F8FBFF', color: '#1a0d30', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer', outline: 'none', fontWeight: 700 },
  th:     { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#F5EDD0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' },
  td:     { padding: '10px 12px', fontSize: 13, color: '#374151', verticalAlign: 'middle' },
  aviso:  (bg, color) => ({ padding: '10px 16px', background: bg, borderRadius: 10, fontSize: 13, color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }),
  tableShell: { background: '#fff', borderRadius: 24, boxShadow: '0 16px 42px rgba(26,13,48,0.07), 0 0 0 1px rgba(26,13,48,0.05)', overflow: 'hidden' },
}
