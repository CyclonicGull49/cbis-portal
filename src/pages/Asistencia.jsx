import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const ESTADOS = [
  { value: 'presente',    label: 'Presente',    color: '#1A7A4A', bg: '#dcfce7', dot: '#16a34a' },
  { value: 'ausente',     label: 'Ausente',     color: '#C0392B', bg: '#fee2e2', dot: '#dc2626' },
  { value: 'tardanza',    label: 'Tardanza',    color: '#946A00', bg: '#fef9c3', dot: '#ca8a04' },
  { value: 'justificado', label: 'Justificado', color: '#1e40af', bg: '#dbeafe', dot: '#2563eb' },
]

function estadoInfo(val) {
  return ESTADOS.find(e => e.value === val) || ESTADOS[0]
}

export default function Asistencia() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const isAdmin = ['admin', 'registro_academico', 'direccion_academica'].includes(perfil?.rol)

  // Selección
  const [materias,      setMaterias]      = useState([]) // materias asignadas al docente
  const [materiaId,     setMateriaId]     = useState('')
  const [gradoId,       setGradoId]       = useState('')
  const [fecha,         setFecha]         = useState(hoy())
  const [estudiantes,   setEstudiantes]   = useState([])
  const [asistencia,    setAsistencia]    = useState({}) // estudianteId → estado
  const [observaciones, setObservaciones] = useState({}) // estudianteId → texto
  const [guardando,     setGuardando]     = useState(false)
  const [cargando,      setCargando]      = useState(false)
  const [yaGuardado,    setYaGuardado]    = useState(false)

  function hoy() {
    return new Date().toISOString().split('T')[0]
  }

  // Cargar materias asignadas al docente
  useEffect(() => {
    if (!perfil) return
    supabase
      .from('asignaciones')
      .select('materia_id, grado_id, materias(id, nombre), grados(id, nombre, nivel)')
      .eq('docente_id', perfil.id)
      .eq('año_escolar', year)
      .then(({ data }) => {
        const lista = (data || []).map(a => ({
          materia_id: a.materia_id,
          grado_id:   a.grado_id,
          materia:    a.materias?.nombre || '',
          grado:      a.grados?.nombre || '',
          nivel:      a.grados?.nivel || '',
        }))
        setMaterias(lista)
      })
  }, [perfil, year])

  // Cargar estudiantes y asistencia existente cuando cambia materia o fecha
  useEffect(() => {
    if (!materiaId || !gradoId || !fecha) return
    setCargando(true)
    setYaGuardado(false)

    Promise.all([
      supabase.from('estudiantes').select('id, nombre, apellido')
        .eq('grado_id', parseInt(gradoId)).eq('estado', 'activo').order('apellido'),
      supabase.from('asistencia').select('estudiante_id, estado, observacion')
        .eq('materia_id', materiaId).eq('grado_id', parseInt(gradoId))
        .eq('fecha', fecha).eq('año_escolar', year),
    ]).then(([{ data: ests }, { data: asis }]) => {
      setEstudiantes(ests || [])
      const asMap = {}
      const obMap = {}
      for (const a of (asis || [])) {
        asMap[a.estudiante_id] = a.estado
        obMap[a.estudiante_id] = a.observacion || ''
      }
      // Si ya hay registros, mostrar los existentes; si no, pre-marcar todos como presente
      if ((asis || []).length > 0) {
        setAsistencia(asMap)
        setObservaciones(obMap)
        setYaGuardado(true)
      } else {
        const preMap = {}
        for (const e of (ests || [])) preMap[e.id] = 'presente'
        setAsistencia(preMap)
        setObservaciones({})
        setYaGuardado(false)
      }
      setCargando(false)
    })
  }, [materiaId, gradoId, fecha, year])

  function seleccionarMateria(val) {
    const [mId, gId] = val.split('|')
    setMateriaId(mId)
    setGradoId(gId)
  }

  function marcarTodos(estado) {
    const nuevo = {}
    for (const e of estudiantes) nuevo[e.id] = estado
    setAsistencia(nuevo)
  }

  async function guardar() {
    if (!materiaId || !gradoId || estudiantes.length === 0) return
    setGuardando(true)
    const toastId = toast.loading('Guardando asistencia...')

    try {
      const registros = estudiantes.map(e => ({
        fecha,
        estudiante_id: e.id,
        materia_id:    materiaId,
        grado_id:      parseInt(gradoId),
        docente_id:    perfil.id,
        año_escolar:   year,
        estado:        asistencia[e.id] || 'presente',
        observacion:   observaciones[e.id] || null,
      }))

      const { error } = await supabase.from('asistencia')
        .upsert(registros, { onConflict: 'fecha,estudiante_id,materia_id' })

      if (error) throw error
      toast.success('Asistencia guardada exitosamente', { id: toastId })
      setYaGuardado(true)
    } catch (err) {
      toast.error(err.message || 'Error al guardar', { id: toastId })
    } finally {
      setGuardando(false)
    }
  }

  // Resumen
  const resumen = ESTADOS.map(e => ({
    ...e,
    count: Object.values(asistencia).filter(v => v === e.value).length,
  }))

  const materiaSeleccionada = materias.find(m => m.materia_id === materiaId && String(m.grado_id) === gradoId)

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Registro de Asistencia
        </h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          Registra la asistencia de tus estudiantes por materia y fecha
        </p>
      </div>

      {/* Controles */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Materia */}
          <div style={{ flex: '1 1 260px' }}>
            <label style={s.label}>Materia · Grado</label>
            <select style={s.select}
              value={materiaId && gradoId ? `${materiaId}|${gradoId}` : ''}
              onChange={e => seleccionarMateria(e.target.value)}>
              <option value="">Selecciona una materia</option>
              {materias.map(m => (
                <option key={`${m.materia_id}|${m.grado_id}`} value={`${m.materia_id}|${m.grado_id}`}>
                  {m.materia} — {m.grado}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div style={{ flex: '0 0 180px' }}>
            <label style={s.label}>Fecha</label>
            <input type="date" style={s.select} value={fecha}
              onChange={e => setFecha(e.target.value)}
              max={hoy()} />
          </div>

          {/* Marcar todos */}
          {estudiantes.length > 0 && (
            <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'center', marginRight: 4 }}>Marcar todos:</span>
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

      {/* Lista de estudiantes */}
      {materiaId && gradoId && (
        <>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 14 }}>Cargando estudiantes...</div>
          ) : estudiantes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 14 }}>No hay estudiantes activos en este grado</div>
          ) : (
            <>
              {/* Indicador si ya fue guardado */}
              {yaGuardado && (
                <div style={{ marginBottom: 12, padding: '10px 16px', background: '#dbeafe', borderRadius: 10, fontSize: 13, color: '#1e40af', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✓ Asistencia ya registrada para esta fecha — puedes modificarla y guardar de nuevo
                </div>
              )}

              {/* Resumen */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {resumen.map(e => (
                  <div key={e.value} style={{ padding: '8px 16px', borderRadius: 10, background: e.bg, border: `1.5px solid ${e.dot}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.dot, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: e.color }}>{e.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: e.color }}>{e.count}</span>
                  </div>
                ))}
                <div style={{ padding: '8px 16px', borderRadius: 10, background: '#f3eeff', border: '1.5px solid #5B2D8E', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61' }}>Total</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#3d1f61' }}>{estudiantes.length}</span>
                </div>
              </div>

              {/* Tabla */}
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#1a2d5a' }}>
                      <th style={s.th}>#</th>
                      <th style={{ ...s.th, textAlign: 'left' }}>Estudiante</th>
                      {ESTADOS.map(e => (
                        <th key={e.value} style={s.th}>{e.label}</th>
                      ))}
                      <th style={{ ...s.th, textAlign: 'left' }}>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map((est, idx) => {
                      const estadoActual = asistencia[est.id] || 'presente'
                      const info = estadoInfo(estadoActual)
                      return (
                        <tr key={est.id}
                          style={{ background: idx % 2 === 0 ? '#fff' : '#f4f7fc', borderBottom: '1px solid #eee' }}>
                          <td style={{ ...s.td, color: '#b0a8c0', fontSize: 12, width: 36 }}>{idx + 1}</td>
                          <td style={{ ...s.td, fontWeight: 700, color: '#0f1d40' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.dot, display: 'inline-block', flexShrink: 0 }} />
                              {est.apellido}, {est.nombre}
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
                            <input
                              type="text"
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

              {/* Botón guardar */}
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={guardar} disabled={guardando}
                  style={{ padding: '12px 32px', background: guardando ? '#e5e7eb' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: guardando ? '#9ca3af' : '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {guardando ? (
                    <>
                      <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Guardando...
                    </>
                  ) : (
                    `${yaGuardado ? 'Actualizar' : 'Guardar'} asistencia`
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {!materiaId && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b0a8c0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Selecciona una materia y fecha para comenzar</div>
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
}