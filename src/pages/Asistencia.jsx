import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
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
  otro:      { label: 'Otro',      color: '#92400e', bg: '#fef3c7' },
}

function estadoInfo(val) {
  return ESTADOS.find(e => e.value === val) || ESTADOS[0]
}

function hoy() {
  return new Date().toISOString().split('T')[0]
}

export default function Asistencia() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const isAdmin = ['admin', 'registro_academico', 'direccion_academica'].includes(perfil?.rol)
  const isDocente = perfil?.rol === 'docente'

  const [grados,        setGrados]        = useState([])
  const [gradoId,       setGradoId]       = useState('')
  const [fecha,         setFecha]         = useState(hoy())
  const [estudiantes,   setEstudiantes]   = useState([])
  const [asistencia,    setAsistencia]    = useState({})
  const [observaciones, setObservaciones] = useState({})
  const [permisosMap,   setPermisosMap]   = useState({}) // estudianteId → permiso
  const [guardando,     setGuardando]     = useState(false)
  const [cargando,      setCargando]      = useState(false)
  const [yaGuardado,    setYaGuardado]    = useState(false)

  // Cargar grados disponibles según rol
  useEffect(() => {
    if (!perfil) return
    if (isDocente) {
      // Docente: solo su grado encargado
      supabase.from('grados')
        .select('id, nombre, nivel, orden')
        .eq('encargado_id', perfil.id)
        .then(({ data }) => setGrados(data ? [data[0]].filter(Boolean) : []))

    } else {
      // Admin / dirección: todos los grados
      supabase.from('grados').select('id, nombre, nivel, orden')
        .order('orden')
        .then(({ data }) => setGrados(data || []))
    }
  }, [perfil, year])

  // Si docente tiene solo un grado asignado, seleccionarlo automáticamente
  useEffect(() => {
    if (isDocente && grados.length === 1) setGradoId(String(grados[0].id))
  }, [grados, isDocente])

  // Cargar estudiantes, asistencia existente y permisos al cambiar grado o fecha
  useEffect(() => {
    if (!gradoId || !fecha) return
    setCargando(true)
    setYaGuardado(false)

    Promise.all([
      // Estudiantes activos del grado
      supabase.from('estudiantes').select('id, nombre, apellido')
        .eq('grado_id', parseInt(gradoId)).eq('estado', 'activo').order('apellido'),

      // Asistencia ya registrada para esa fecha y grado
      supabase.from('asistencia').select('estudiante_id, estado, observacion')
        .eq('grado_id', parseInt(gradoId))
        .eq('fecha', fecha)
        .eq('año_escolar', year),
    ]).then(async ([{ data: ests }, { data: asis }]) => {
      const estList = ests || []
      setEstudiantes(estList)

      // Permisos: buscar por IDs de estudiantes del grado
      const estIds = estList.map(e => e.id)
      let pMap = {}
      if (estIds.length > 0) {
        const { data: perms } = await supabase
          .from('permisos')
          .select('estudiante_id, tipo, motivo')
          .eq('fecha', fecha)
          .in('estudiante_id', estIds)
        for (const p of (perms || [])) pMap[p.estudiante_id] = p
      }
      setPermisosMap(pMap)

      if ((asis || []).length > 0) {
        // Ya existe asistencia — cargarla
        const asMap = {}, obMap = {}
        for (const a of asis) {
          asMap[a.estudiante_id] = a.estado
          obMap[a.estudiante_id] = a.observacion || ''
        }
        setAsistencia(asMap)
        setObservaciones(obMap)
        setYaGuardado(true)
      } else {
        // Nueva asistencia: pre-marcar según permisos
        const asMap = {}
        for (const e of estList) {
          asMap[e.id] = pMap[e.id] ? 'justificado' : 'presente'
        }
        const obMap = {}
        for (const e of estList) {
          if (pMap[e.id]) obMap[e.id] = `${TIPO_PERMISO[pMap[e.id].tipo]?.label || 'Permiso'}: ${pMap[e.id].motivo}`
        }
        setAsistencia(asMap)
        setObservaciones(obMap)
        setYaGuardado(false)
      }
      setCargando(false)
    })
  }, [gradoId, fecha, year])

  function marcarTodos(estado) {
    const nuevo = {}
    for (const e of estudiantes) nuevo[e.id] = estado
    setAsistencia(nuevo)
  }

  async function guardar() {
    if (!gradoId || estudiantes.length === 0) return
    setGuardando(true)
    const toastId = toast.loading('Guardando asistencia...')

    try {
      const registros = estudiantes.map(e => ({
        fecha,
        estudiante_id:  e.id,
        grado_id:       parseInt(gradoId),
        docente_id:     perfil.id,
        año_escolar:    year,
        estado:         asistencia[e.id] || 'presente',
        observacion:    observaciones[e.id] || null,
        materia_id:     null,
        registrado_por: perfil.id,
      }))

      const { error } = await supabase.from('asistencia')
        .upsert(registros, { onConflict: 'estudiante_id,fecha' })


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
    ...e,
    count: Object.values(asistencia).filter(v => v === e.value).length,
  }))

  const gradoInfo = grados.find(g => g.id === parseInt(gradoId))
  const permisosHoy = Object.keys(permisosMap).length

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Registro de Asistencia
        </h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          Registra la asistencia diaria por grado
        </p>
      </div>

      {/* Controles */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Grado */}
          <div style={{ flex: '1 1 220px' }}>
            <label style={s.label}>Grado</label>
            <select style={s.select} value={gradoId}
              onChange={e => setGradoId(e.target.value)}>
              <option value="">Selecciona un grado</option>
              {grados.map(g => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div style={{ flex: '0 0 180px' }}>
            <label style={s.label}>Fecha</label>
            <input type="date" style={s.select} value={fecha}
              onChange={e => setFecha(e.target.value)} max={hoy()} />
          </div>

          {/* Marcar todos — solo en desktop, como botones pequeños */}
          {!isMobile && estudiantes.length > 0 && (
            <div style={{ flex: '1 1 auto', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ ...s.label, marginBottom: 0 }}>Marcar todos:</span>
              {ESTADOS.map(e => (
                <button key={e.value} onClick={() => marcarTodos(e.value)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${e.dot}`, background: e.bg, color: e.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {e.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
              <div style={s.aviso('#dbeafe', '#1e40af')}>
                ✓ Asistencia ya registrada para esta fecha — puedes modificarla y actualizar
              </div>
            )}
            {permisosHoy > 0 && !yaGuardado && (
              <div style={s.aviso('#ede9fe', '#6d28d9')}>
                📋 {permisosHoy} estudiante{permisosHoy > 1 ? 's' : ''} con permiso para hoy — marcado{permisosHoy > 1 ? 's' : ''} automáticamente como Justificado
              </div>
            )}

            {/* Resumen — en móvil también sirven para marcar todos */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {resumen.map(e => (
                <button key={e.value}
                  onClick={() => isMobile && marcarTodos(e.value)}
                  style={{ padding: isMobile ? '8px 12px' : '8px 16px', borderRadius: 10, background: e.bg, border: `1.5px solid ${e.dot}`, display: 'flex', alignItems: 'center', gap: 6, cursor: isMobile ? 'pointer' : 'default', fontFamily: 'inherit', flexShrink: 0 }}>
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
            {isMobile && (
              <div style={{ fontSize: 11, color: '#b0a8c0', marginBottom: 12, fontWeight: 500 }}>
                Toca un estado para marcar todos
              </div>
            )}

            {/* Tabla desktop / Tarjetas móvil */}
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {estudiantes.map((est, idx) => {
                  const estadoActual = asistencia[est.id] || 'presente'
                  const permiso      = permisosMap[est.id]
                  return (
                    <div key={est.id} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(61,31,97,0.07)', padding: 14 }}>
                      {/* Nombre */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f1d40', fontSize: 14 }}>{est.apellido}, {est.nombre}</div>
                          {permiso && (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: TIPO_PERMISO[permiso.tipo]?.bg || '#f3f4f6', color: TIPO_PERMISO[permiso.tipo]?.color || '#374151' }}>
                              🗓 Permiso {TIPO_PERMISO[permiso.tipo]?.label}
                            </span>
                          )}
                        </div>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: estadoInfo(estadoActual).dot, display: 'inline-block', marginTop: 4 }} />
                      </div>
                      {/* Botones de estado */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 8 }}>
                        {ESTADOS.map(e => (
                          <button key={e.value} onClick={() => setAsistencia(prev => ({ ...prev, [est.id]: e.value }))}
                            style={{ padding: '8px 4px', borderRadius: 10, border: `2px solid ${estadoActual === e.value ? e.dot : '#e5e7eb'}`, background: estadoActual === e.value ? e.bg : '#fafafa', color: estadoActual === e.value ? e.color : '#9ca3af', fontWeight: estadoActual === e.value ? 800 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                            {e.label}
                          </button>
                        ))}
                      </div>
                      {/* Observación */}
                      {estadoActual !== 'presente' && (
                        <input type="text" placeholder="Motivo u observación..."
                          value={observaciones[est.id] || ''}
                          onChange={e => setObservaciones(prev => ({ ...prev, [est.id]: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', background: '#fffbeb' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a2d5a' }}>
                      <th style={{ ...s.th, width: 36 }}>#</th>
                      <th style={{ ...s.th, textAlign: 'left' }}>Estudiante</th>
                      {ESTADOS.map(e => (
                        <th key={e.value} style={{ ...s.th, width: 90 }}>{e.label}</th>
                      ))}
                      <th style={{ ...s.th, textAlign: 'left' }}>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map((est, idx) => {
                      const estadoActual = asistencia[est.id] || 'presente'
                      const info         = estadoInfo(estadoActual)
                      const permiso      = permisosMap[est.id]
                      return (
                        <tr key={est.id}
                          style={{ background: idx % 2 === 0 ? '#fff' : '#f4f7fc', borderBottom: '1px solid #eee' }}>
                          <td style={{ ...s.td, color: '#b0a8c0', fontSize: 12 }}>{idx + 1}</td>
                          <td style={s.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.dot, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f1d40', fontSize: 13 }}>
                                  {est.apellido}, {est.nombre}
                                </div>
                                {permiso && (
                                  <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: TIPO_PERMISO[permiso.tipo]?.bg || '#f3f4f6', color: TIPO_PERMISO[permiso.tipo]?.color || '#374151' }}>
                                    🗓 Permiso {TIPO_PERMISO[permiso.tipo]?.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          {ESTADOS.map(e => (
                            <td key={e.value} style={{ ...s.td, textAlign: 'center' }}>
                              <input type="radio"
                                name={`est-${est.id}`}
                                value={e.value}
                                checked={estadoActual === e.value}
                                onChange={() => setAsistencia(prev => ({ ...prev, [est.id]: e.value }))}
                                style={{ accentColor: e.dot, width: 16, height: 16, cursor: 'pointer' }} />
                            </td>
                          ))}
                          <td style={s.td}>
                            <input type="text"
                              placeholder={estadoActual !== 'presente' ? 'Motivo...' : ''}
                              value={observaciones[est.id] || ''}
                              onChange={e => setObservaciones(prev => ({ ...prev, [est.id]: e.target.value }))}
                              style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, fontFamily: 'inherit', background: estadoActual !== 'presente' ? '#fffbeb' : '#fff' }} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Guardar */}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={guardar} disabled={guardando}
                style={{ padding: '12px 32px', background: guardando ? '#e5e7eb' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: guardando ? '#9ca3af' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                {guardando ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Guardando...
                  </>
                ) : `${yaGuardado ? 'Actualizar' : 'Guardar'} asistencia`}
              </button>
            </div>
          </>
        )
      )}

      {!gradoId && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b0a8c0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Selecciona un grado y fecha para comenzar</div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer', outline: 'none' },
  th:     { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#F5EDD0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' },
  td:     { padding: '10px 12px', fontSize: 13, color: '#374151', verticalAlign: 'middle' },
  aviso:  (bg, color) => ({ marginBottom: 12, padding: '10px 16px', background: bg, borderRadius: 10, fontSize: 13, color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }),
}