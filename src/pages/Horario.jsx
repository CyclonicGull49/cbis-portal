import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

// ── Iconos ────────────────────────────────────
const IcoSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoWarn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoMsg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IcoList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IcoArrowUp = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)
const IcoArrowDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IcoCalEmpty = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d8c8f0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)



const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const DIA_COLOR = { 1: '#5B2D8E', 2: '#0e9490', 3: '#a16207', 4: '#c2410c', 5: '#2563eb' }
const ESTADO_CONFIG = {
  borrador:    { label: 'Borrador',    color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  en_revision: { label: 'En revisión', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  aprobado:    { label: 'Aprobado',    color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  devuelto:    { label: 'Devuelto',    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
}

function tmpId() { return `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}` }

// ── Notificaciones ───────────────────────────────────────
async function notificar(usuarioIds, tipo, titulo, mensaje, link) {
  if (!usuarioIds?.length) return
  const lote = usuarioIds.map(id => ({ usuario_id: id, tipo, titulo, mensaje, link }))
  for (let i = 0; i < lote.length; i += 50)
    await supabase.from('notificaciones').insert(lote.slice(i, i + 50))
}

export default function Horario() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const esDireccion  = ['admin', 'direccion_academica'].includes(perfil?.rol)
  const esDocente    = perfil?.rol === 'docente'
  const esAlumno     = perfil?.rol === 'alumno'

  const [grados,          setGrados]          = useState([])
  const [gradoId,         setGradoId]         = useState('')
  const [filas,           setFilas]           = useState([])
  const [loading,         setLoading]         = useState(true)
  const [guardando,       setGuardando]       = useState(false)
  const [hayCambios,      setHayCambios]      = useState(false)
  const [estadoHorario,   setEstadoHorario]   = useState(null)
  const [modalEstado,     setModalEstado]     = useState(false)
  const [comentario,      setComentario]      = useState('')

  // Info del docente actual
  const [gradoEncargado,  setGradoEncargado]  = useState(null)   // grado donde es encargado
  const [esEncargado,     setEsEncargado]     = useState(false)
  const [esEspecialista,  setEsEspecialista]  = useState(false)
  const [misMateriasGrado,setMisMaterias]     = useState([])     // materias asignadas al grado actual
  const [choquesDetect,   setChoques]         = useState({})     // key: `${orden}-${dia}` → true si choca

  useEffect(() => { cargarInicial() }, [year])

  async function cargarInicial() {
    setLoading(true)
    const { data: gra } = await supabase.from('grados').select('id, nombre, nivel, orden, encargado_id').order('orden')
    setGrados(gra || [])

    if (esDocente) {
      // ¿Es encargado de algún grado?
      const gradoEnc = (gra || []).find(g => g.encargado_id === perfil.id)
      if (gradoEnc) {
        setGradoEncargado(gradoEnc)
        setEsEncargado(true)
        setEsEspecialista(false)
        setGradoId(String(gradoEnc.id))
      } else {
        setEsEncargado(false)
        setEsEspecialista(true)
      }
    } else if (esAlumno && perfil?.estudiante_id) {
      const { data: est } = await supabase.from('estudiantes').select('grado_id').eq('id', perfil.estudiante_id).single()
      if (est?.grado_id) setGradoId(String(est.grado_id))
    }
    setLoading(false)
  }

  // Al cambiar grado: cargar horario + mis materias en ese grado
  useEffect(() => {
    if (!gradoId) return
    cargarHorario()
    cargarEstado()
    if (esDocente) cargarMisMaterias(gradoId)
  }, [gradoId, year])

  async function cargarMisMaterias(gId) {
    const { data } = await supabase.from('asignaciones')
      .select('materia_id, materias(id, nombre)')
      .eq('docente_id', perfil.id)
      .eq('grado_id', parseInt(gId))
      .eq('año_escolar', year)
    setMisMaterias((data || []).map(a => ({ id: a.materia_id, nombre: a.materias?.nombre })))
  }

  async function cargarHorario() {
    const { data } = await supabase.from('horario')
      .select('id, hora_inicio, hora_fin, es_receso, es_almuerzo, orden, dia_semana, materia_id, docente_id, materias(nombre), perfiles(nombre, apellido)')
      .eq('grado_id', parseInt(gradoId))
      .eq('año_escolar', year)
      .order('orden')

    if (!data || data.length === 0) { setFilas([]); return }

    const filaMap = {}
    for (const h of data) {
      const key = h.orden
      if (!filaMap[key]) {
        filaMap[key] = {
          id: `row_${key}`,
          orden: h.orden,
          hora_inicio: h.hora_inicio || '',
          hora_fin: h.hora_fin || '',
          es_receso: h.es_receso || false,
          es_almuerzo: h.es_almuerzo || false,
          dias: { 1: null, 2: null, 3: null, 4: null, 5: null },
          dbIds: {},
        }
      }
      if (!h.es_receso && !h.es_almuerzo) {
        filaMap[key].dias[h.dia_semana] = {
          materia_id: h.materia_id || '',
          docente_id: h.docente_id || '',
          materia_nombre: h.materias?.nombre || '',
          docente_nombre: h.perfiles ? `${h.perfiles.nombre} ${h.perfiles.apellido}` : '',
        }
        filaMap[key].dbIds[h.dia_semana] = h.id
      }
    }
    setFilas(Object.values(filaMap).sort((a, b) => a.orden - b.orden))
    setHayCambios(false)
  }

  async function cargarEstado() {
    const { data } = await supabase.from('horario_estado')
      .select('*').eq('grado_id', parseInt(gradoId)).eq('año_escolar', year).single()
    setEstadoHorario(data || null)
  }

  // ── Permisos de edición ───────────────────────────────────
  // encargado: puede editar solo si borrador o devuelto
  // especialista: puede editar bloques VACÍOS si horario aprobado o en revisión
  // dirección: puede editar siempre
  const estado = estadoHorario?.estado || 'borrador'

  const puedeEditarEncargado = useCallback(() => {
    if (!esEncargado) return false
    return estado === 'borrador' || estado === 'devuelto'
  }, [esEncargado, estado])

  const puedeEditarEspecialista = useCallback(() => {
    if (!esEspecialista) return false
    // Especialista puede asignar en bloques vacíos cuando el encargado ya envió (en_revision o aprobado)
    return estado === 'en_revision' || estado === 'aprobado' || estado === 'borrador'
  }, [esEspecialista, estado])

  // ── Verificar choque para especialista ────────────────────
  async function verificarChoque(franjaInicio, franjaFin, dia) {
    // ¿Ya tiene el especialista alguna materia en otro grado a esa hora y día?
    const { data } = await supabase.from('horario')
      .select('grado_id, grados(nombre)')
      .eq('docente_id', perfil.id)
      .eq('hora_inicio', franjaInicio)
      .eq('hora_fin', franjaFin)
      .eq('dia_semana', dia)
      .eq('año_escolar', year)
      .neq('grado_id', parseInt(gradoId))
    if (data && data.length > 0) return data[0].grados?.nombre || 'otro grado'
    return null
  }

  // ── Edición encargado ─────────────────────────────────────
  function agregarFila(tipo = 'normal') {
    const maxOrden = filas.length > 0 ? Math.max(...filas.map(f => f.orden)) : 0
    setFilas(prev => [...prev, {
      id: tmpId(), orden: maxOrden + 1,
      hora_inicio: '', hora_fin: '',
      es_receso: tipo === 'receso', es_almuerzo: tipo === 'almuerzo',
      dias: { 1: null, 2: null, 3: null, 4: null, 5: null },
      dbIds: {},
    }])
    setHayCambios(true)
  }

  function eliminarFila(filaId) {
    setFilas(prev => prev.filter(f => f.id !== filaId))
    setHayCambios(true)
  }

  function actualizarFila(filaId, campo, valor) {
    setFilas(prev => prev.map(f => f.id === filaId ? { ...f, [campo]: valor } : f))
    setHayCambios(true)
  }

  function actualizarCeldaEncargado(filaId, dia, materiaId) {
    const materia = misMateriasGrado.find(m => m.id === materiaId)
    setFilas(prev => prev.map(f => {
      if (f.id !== filaId) return f
      return {
        ...f,
        dias: {
          ...f.dias,
          [dia]: materiaId ? {
            materia_id: materiaId,
            docente_id: perfil.id,
            materia_nombre: materia?.nombre || '',
            docente_nombre: `${perfil.nombre} ${perfil.apellido}`,
          } : null,
        }
      }
    }))
    setHayCambios(true)
  }

  function moverFila(filaId, dir) {
    setFilas(prev => {
      const idx = prev.findIndex(f => f.id === filaId)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const arr = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
      return arr.map((f, i) => ({ ...f, orden: i + 1 }))
    })
    setHayCambios(true)
  }

  // ── Especialista asigna una celda vacía ───────────────────
  async function asignarCeldaEspecialista(fila, dia) {
    if (!esEspecialista) return
    if (misMateriasGrado.length === 0) {
      toast.error('No tienes materias asignadas en este grado')
      return
    }
    // Verificar choque
    const conflicto = await verificarChoque(fila.hora_inicio, fila.hora_fin, dia)
    if (conflicto) {
      toast.error(`Conflicto: ya tienes clase en ${conflicto} a las ${fila.hora_inicio}-${fila.hora_fin}`)
      return
    }
    // Si solo tiene una materia en este grado, asignarla directamente
    if (misMateriasGrado.length === 1) {
      await guardarCeldaEspecialista(fila, dia, misMateriasGrado[0].id)
    } else {
      // Si tiene varias materias, mostrar selector
      setModalEspecialista({ fila, dia })
    }
  }

  async function guardarCeldaEspecialista(fila, dia, materiaId) {
    const materia = misMateriasGrado.find(m => m.id === materiaId)
    const toastId = toast.loading('Asignando...')
    const payload = {
      grado_id: parseInt(gradoId), año_escolar: year,
      hora_inicio: fila.hora_inicio, hora_fin: fila.hora_fin,
      es_receso: false, es_almuerzo: false,
      orden: fila.orden, dia_semana: dia,
      materia_id: materiaId, docente_id: perfil.id,
      franja_id: null,
    }
    // Upsert por grado+orden+dia+año
    const { error } = await supabase.from('horario')
      .upsert(payload, { onConflict: 'grado_id,orden,dia_semana,año_escolar' })
    if (error) { toast.error('Error al asignar', { id: toastId }); return }
    toast.success(`${materia?.nombre} asignado`, { id: toastId })
    setModalEspecialista(null)
    await cargarHorario()
  }

  async function quitarCeldaEspecialista(fila, dia) {
    const celda = fila.dias[dia]
    if (celda?.docente_id !== perfil.id) return
    const dbId = fila.dbIds[dia]
    if (!dbId) return
    await supabase.from('horario').delete().eq('id', dbId)
    toast.success('Celda liberada')
    await cargarHorario()
  }

  const [modalEspecialista, setModalEspecialista] = useState(null)

  // ── Guardar horario encargado ─────────────────────────────
  async function guardarTodo() {
    if (!gradoId) return
    setGuardando(true)
    const toastId = toast.loading('Guardando horario...')
    try {
      await supabase.from('horario').delete()
        .eq('grado_id', parseInt(gradoId))
        .eq('año_escolar', year)
        .is('docente_id', null) // solo borra filas del encargado (sin docente asignado)

      // También borrar las celdas del propio encargado
      await supabase.from('horario').delete()
        .eq('grado_id', parseInt(gradoId))
        .eq('año_escolar', year)
        .eq('docente_id', perfil.id)

      const registros = []
      for (let fi = 0; fi < filas.length; fi++) {
        const fila = filas[fi]
        const orden = fi + 1
        if (fila.es_receso || fila.es_almuerzo) {
          registros.push({
            grado_id: parseInt(gradoId), año_escolar: year,
            hora_inicio: fila.hora_inicio, hora_fin: fila.hora_fin,
            es_receso: fila.es_receso, es_almuerzo: fila.es_almuerzo,
            orden, dia_semana: 1, materia_id: null, docente_id: null, franja_id: null,
          })
        } else {
          for (let dia = 1; dia <= 5; dia++) {
            const celda = fila.dias[dia]
            registros.push({
              grado_id: parseInt(gradoId), año_escolar: year,
              hora_inicio: fila.hora_inicio, hora_fin: fila.hora_fin,
              es_receso: false, es_almuerzo: false, orden,
              dia_semana: dia,
              materia_id: celda?.materia_id || null,
              docente_id: celda?.materia_id ? perfil.id : null,
              franja_id: null,
            })
          }
        }
      }
      if (registros.length > 0) {
        const { error } = await supabase.from('horario').insert(registros)
        if (error) throw error
      }
      toast.success('Horario guardado', { id: toastId })
      setHayCambios(false)
      await cargarHorario()
    } catch (err) {
      toast.error('Error: ' + err.message, { id: toastId })
    }
    setGuardando(false)
  }

  async function cambiarEstado(nuevoEstado, comentarioTexto = '') {
    const payload = {
      grado_id: parseInt(gradoId), año_escolar: year,
      estado: nuevoEstado, comentario: comentarioTexto || null,
      actualizado_por: perfil.id, updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('horario_estado')
      .upsert(payload, { onConflict: 'grado_id,año_escolar' }).select().single()
    if (error) { toast.error('Error al cambiar estado'); return }
    setEstadoHorario(data)

    const nombreGrado = gradoInfo?.nombre || 'un grado'

    // Notificar según el nuevo estado
    if (nuevoEstado === 'en_revision') {
      // Docente envía a revisión → notificar a dirección
      const { data: dirs } = await supabase.from('perfiles')
        .select('id').in('rol', ['admin', 'direccion_academica'])
      const ids = (dirs || []).map(p => p.id).filter(id => id !== perfil.id)
      await notificar(ids, 'horario',
        'Horario enviado a revisión',
        `${perfil.nombre} ${perfil.apellido} envió el horario de ${nombreGrado} para revisión`,
        'horario'
      )
    }

    if (nuevoEstado === 'aprobado' || nuevoEstado === 'devuelto') {
      // Dirección aprueba/devuelve → notificar al encargado del grado
      const gInfo = grados.find(g => g.id === parseInt(gradoId))
      if (gInfo?.encargado_id) {
        await notificar(
          [gInfo.encargado_id],
          nuevoEstado === 'aprobado' ? 'horario_aprobado' : 'horario_devuelto',
          nuevoEstado === 'aprobado' ? 'Horario aprobado' : 'Horario devuelto para correcciones',
          nuevoEstado === 'aprobado'
            ? `Tu horario de ${nombreGrado} fue aprobado por dirección`
            : `Tu horario de ${nombreGrado} fue devuelto${comentarioTexto ? ': ' + comentarioTexto : ''}`,
          'horario'
        )
      }
    }

    const msgs = { en_revision: 'Enviado a dirección', aprobado: 'Horario aprobado — docente notificado', devuelto: 'Horario devuelto — docente notificado', borrador: 'Regresado a borrador' }
    toast.success(msgs[nuevoEstado] || 'Estado actualizado')
    setModalEstado(false); setComentario('')
  }

  async function limpiarGrado() {
    if (!window.confirm(`¿Limpiar TODO el horario de ${gradoInfo?.nombre}?`)) return
    await supabase.from('horario').delete().eq('grado_id', parseInt(gradoId)).eq('año_escolar', year)
    await supabase.from('horario_estado').delete().eq('grado_id', parseInt(gradoId)).eq('año_escolar', year)
    setFilas([]); setEstadoHorario(null); setHayCambios(false)
    toast.success('Horario limpiado')
  }

  const gradoInfo = grados.find(g => g.id === parseInt(gradoId))
  const estadoCfg = ESTADO_CONFIG[estado]
  const canEditEnc = puedeEditarEncargado()
  const canEditEsp = puedeEditarEspecialista()

  // Bloques vacíos disponibles para especialista (filas sin receso y sin materia en ese día)
  function esBloqueDisponible(fila, dia) {
    if (fila.es_receso || fila.es_almuerzo) return false
    const celda = fila.dias[dia]
    return !celda?.materia_id
  }

  function esMiCelda(fila, dia) {
    return fila.dias[dia]?.docente_id === perfil?.id
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Horario de Clases</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13 }}>
            {gradoId ? `${gradoInfo?.nombre} — ${filas.filter(f => !f.es_receso && !f.es_almuerzo).length} bloques` : 'Selecciona un grado'}
            {esEspecialista && gradoId && <span style={{ marginLeft: 8, color: '#0e9490', fontWeight: 700 }}>· Vista especialista</span>}
          </p>
        </div>

        {gradoId && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: estadoCfg.bg, border: `1.5px solid ${estadoCfg.border}` }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: estadoCfg.color }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: estadoCfg.color }}>{estadoCfg.label}</span>
            </div>

            {canEditEnc && hayCambios && (
              <button onClick={guardarTodo} disabled={guardando}
                style={{ ...s.btnPrimary, fontSize: 12, padding: '7px 16px', background: 'linear-gradient(135deg, #16a34a, #166534)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{guardando ? 'Guardando...' : <><IcoSave /> Guardar cambios</>}</span>
              </button>
            )}
            {canEditEnc && !hayCambios && filas.length > 0 && (
              <button onClick={guardarTodo} disabled={guardando}
                style={{ ...s.btnSecondary, fontSize: 12, padding: '7px 14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IcoSave /> Guardar</span>
              </button>
            )}
            {esEncargado && (estado === 'borrador' || estado === 'devuelto') && filas.length > 0 && !hayCambios && (
              <button onClick={() => cambiarEstado('en_revision')}
                style={{ ...s.btnPrimary, fontSize: 12, padding: '7px 14px' }}>
                Enviar a dirección →
              </button>
            )}
            {esDireccion && estado === 'en_revision' && (
              <>
                <button onClick={() => cambiarEstado('aprobado')}
                  style={{ ...s.btnPrimary, fontSize: 12, padding: '7px 14px', background: 'linear-gradient(135deg, #16a34a, #166534)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IcoCheck /> Aprobar
                </button>
                <button onClick={() => setModalEstado(true)}
                  style={{ ...s.btnSecondary, fontSize: 12, padding: '7px 14px', borderColor: '#fca5a5', color: '#dc2626' }}>
                  Devolver
                </button>
              </>
            )}
            {esDireccion && estado === 'aprobado' && (
              <button onClick={() => cambiarEstado('borrador')}
                style={{ ...s.btnSecondary, fontSize: 12, padding: '7px 14px' }}>
                Reabrir
              </button>
            )}
            {esDireccion && (
              <button onClick={limpiarGrado}
                style={{ ...s.btnSecondary, fontSize: 12, padding: '7px 14px', borderColor: '#fca5a5', color: '#dc2626' }}>
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alertas */}
      {estadoHorario?.estado === 'devuelto' && estadoHorario?.comentario && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <IcoMsg /> <span>Dirección: {estadoHorario.comentario}</span>
        </div>
      )}
      {estadoHorario?.estado === 'en_revision' && esEncargado && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          ⏳ Enviado a dirección — en espera de aprobación
        </div>
      )}
      {estadoHorario?.estado === 'aprobado' && !esDireccion && !esEspecialista && (
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#166534', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcoCheck /> Horario aprobado — vigente para {year}
        </div>
      )}
      {esEspecialista && gradoId && misMateriasGrado.length > 0 && (
        <div style={{ background: '#e0f7f6', border: '1.5px solid #0e9490', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#0e9490', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <IcoList /> <span>Tus materias en este grado: {misMateriasGrado.map(m => m.nombre).join(', ')} — Toca un bloque verde para asignarte</span>
        </div>
      )}
      {esEspecialista && gradoId && misMateriasGrado.length === 0 && (
        <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
          No tienes materias asignadas en este grado
        </div>
      )}
      {hayCambios && canEditEnc && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IcoWarn /> Cambios sin guardar
        </div>
      )}

      {/* Selector grado */}
      {(esDireccion || esEspecialista) && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: '16px 20px', marginBottom: 16 }}>
          <label style={s.label}>Grado</label>
          <select style={{ ...s.select, maxWidth: 320 }} value={gradoId}
            onChange={e => { setGradoId(e.target.value); setHayCambios(false) }}>
            <option value="">Selecciona un grado...</option>
            {['primera_infancia','primaria','secundaria','bachillerato'].map(nivel => {
              const lista = grados.filter(g => g.nivel === nivel)
              if (!lista.length) return null
              const lbls = { primera_infancia: 'Primera Infancia', primaria: 'Primaria', secundaria: 'Secundaria', bachillerato: 'Bachillerato' }
              return (
                <optgroup key={nivel} label={lbls[nivel]}>
                  {lista.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </optgroup>
              )
            })}
          </select>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#b0a8c0' }}>Cargando...</div>
      ) : !gradoId ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', color: '#b0a8c0' }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><IcoCalEmpty /></div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Selecciona un grado para ver su horario</div>
        </div>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'auto', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: '#1a0d30' }}>
                  {canEditEnc && <th style={{ ...s.th, width: 36 }}></th>}
                  <th style={{ ...s.th, width: 140, textAlign: 'left', paddingLeft: 16, color: 'rgba(255,255,255,0.5)' }}>Hora</th>
                  {DIAS.map((dia, i) => (
                    <th key={dia} style={{ ...s.th, borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                      <span style={{ color: DIA_COLOR[i + 1], fontWeight: 800 }}>{dia}</span>
                    </th>
                  ))}
                  {canEditEnc && <th style={{ ...s.th, width: 36 }}></th>}
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={canEditEnc ? 8 : 6} style={{ textAlign: 'center', padding: '48px 20px', color: '#b0a8c0', fontSize: 13 }}>
                      {canEditEnc ? 'No hay filas — agrega una para comenzar' : 'No hay horario cargado aún'}
                    </td>
                  </tr>
                )}
                {filas.map((fila, fi) => {
                  const esBreak = fila.es_receso || fila.es_almuerzo
                  return (
                    <tr key={fila.id} style={{ background: esBreak ? '#f9fafb' : fi % 2 === 0 ? '#fff' : '#fdfcff' }}>

                      {/* Botones mover — solo encargado */}
                      {canEditEnc && (
                        <td style={{ ...s.td, padding: '4px 2px', textAlign: 'center', borderRight: '1px solid #f3eeff' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <button onClick={() => moverFila(fila.id, 'up')} style={s.iconBtn}><IcoArrowUp /></button>
                            <button onClick={() => moverFila(fila.id, 'down')} style={s.iconBtn}><IcoArrowDown /></button>
                          </div>
                        </td>
                      )}

                      {/* Hora */}
                      <td style={{ ...s.td, borderRight: '2px solid #f3eeff', background: esBreak ? '#f9fafb' : undefined, minWidth: 140 }}>
                        {canEditEnc ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input type="time" value={fila.hora_inicio}
                              onChange={e => actualizarFila(fila.id, 'hora_inicio', e.target.value)}
                              style={{ ...s.inputSmall, flex: 1 }} />
                            <span style={{ color: '#b0a8c0', fontSize: 11 }}>–</span>
                            <input type="time" value={fila.hora_fin}
                              onChange={e => actualizarFila(fila.id, 'hora_fin', e.target.value)}
                              style={{ ...s.inputSmall, flex: 1 }} />
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, fontWeight: 700, color: esBreak ? '#9ca3af' : '#5B2D8E' }}>
                            {fila.hora_inicio} – {fila.hora_fin}
                            {esBreak && <div style={{ fontSize: 10, color: '#b0a8c0', marginTop: 2 }}>{fila.es_almuerzo ? 'ALMUERZO' : 'RECESO'}</div>}
                          </div>
                        )}
                      </td>

                      {/* Celdas */}
                      {DIAS.map((_, di) => {
                        const dia = di + 1
                        const celda = fila.dias[dia]
                        const vacio = esBloqueDisponible(fila, dia)
                        const miCelda = esDocente && esMiCelda(fila, dia)

                        if (esBreak) return (
                          <td key={dia} style={{ ...s.td, background: '#f9fafb', textAlign: 'center', borderLeft: '1px solid #f3eeff' }}>
                            <span style={{ fontSize: 10, color: '#d1d5db', fontWeight: 700 }}>
                              {fila.es_almuerzo ? '— ALMUERZO —' : '— RECESO —'}
                            </span>
                          </td>
                        )

                        // Vista encargado editando
                        if (canEditEnc) return (
                          <td key={dia} style={{ ...s.td, borderLeft: '1px solid #f3eeff', verticalAlign: 'top', minWidth: 130 }}>
                            <select value={celda?.materia_id || ''}
                              onChange={e => actualizarCeldaEncargado(fila.id, dia, e.target.value)}
                              style={{ ...s.inputSmall, color: celda?.materia_id ? '#3d1f61' : '#b0a8c0', width: '100%' }}>
                              <option value="">— Libre —</option>
                              {misMateriasGrado.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                          </td>
                        )

                        // Vista especialista
                        if (canEditEsp && misMateriasGrado.length > 0) {
                          if (vacio) return (
                            <td key={dia}
                              onClick={() => asignarCeldaEspecialista(fila, dia)}
                              style={{ ...s.td, borderLeft: '1px solid #f3eeff', background: '#f0fdf4', cursor: 'pointer', textAlign: 'center', transition: 'background 0.1s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                              onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
                              title="Bloque disponible — haz clic para asignarte">
                              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>+ Disponible</span>
                            </td>
                          )
                          if (miCelda) return (
                            <td key={dia}
                              style={{ ...s.td, borderLeft: '1px solid #f3eeff', background: '#e0f7f6', position: 'relative' }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#0e9490' }}>{celda.materia_nombre}</div>
                              <div style={{ fontSize: 10, color: '#0e9490', opacity: 0.7 }}>Tú</div>
                              <button onClick={() => quitarCeldaEspecialista(fila, dia)}
                                title="Liberar bloque"
                                style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex' }}><IcoClose /></button>
                            </td>
                          )
                        }

                        // Vista solo lectura
                        return (
                          <td key={dia} style={{ ...s.td, borderLeft: '1px solid #f3eeff', minWidth: 120 }}>
                            {celda?.materia_nombre ? (
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#3d1f61', marginBottom: 2 }}>{celda.materia_nombre}</div>
                                {celda.docente_nombre && <div style={{ fontSize: 10, color: '#b0a8c0', fontWeight: 600 }}>{celda.docente_nombre}</div>}
                              </div>
                            ) : (
                              <span style={{ fontSize: 10, color: '#e5e7eb' }}>—</span>
                            )}
                          </td>
                        )
                      })}

                      {/* Eliminar fila */}
                      {canEditEnc && (
                        <td style={{ ...s.td, padding: '4px 6px', textAlign: 'center' }}>
                          <button onClick={() => eliminarFila(fila.id)}
                            style={{ ...s.iconBtn, color: '#dc2626' }}><IcoClose /></button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Botones agregar fila — solo encargado */}
          {canEditEnc && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => agregarFila('normal')} style={{ ...s.btnSecondary, fontSize: 12, padding: '8px 16px' }}>
                + Agregar bloque
              </button>
              <button onClick={() => agregarFila('receso')}
                style={{ ...s.btnSecondary, fontSize: 12, padding: '8px 16px', borderColor: '#fcd34d', color: '#92400e' }}>
                + Receso
              </button>
              <button onClick={() => agregarFila('almuerzo')}
                style={{ ...s.btnSecondary, fontSize: 12, padding: '8px 16px', borderColor: '#86efac', color: '#166534' }}>
                + Almuerzo
              </button>
              {hayCambios && (
                <button onClick={guardarTodo} disabled={guardando}
                  style={{ ...s.btnPrimary, fontSize: 12, padding: '8px 20px', marginLeft: 'auto' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{guardando ? 'Guardando...' : <><IcoSave /> Guardar todo</>}</span>
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal especialista — seleccionar materia si tiene varias */}
      {modalEspecialista && (
        <div style={s.modalBg} onClick={() => setModalEspecialista(null)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#3d1f61', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Asignar bloque</h2>
            <p style={{ color: '#b0a8c0', fontSize: 12, marginBottom: 20 }}>
              {DIAS[modalEspecialista.dia - 1]} · {modalEspecialista.fila.hora_inicio} – {modalEspecialista.fila.hora_fin}
            </p>
            <p style={{ fontSize: 13, color: '#374151', marginBottom: 14, fontWeight: 600 }}>¿Qué materia asignas?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {misMateriasGrado.map(m => (
                <button key={m.id}
                  onClick={() => guardarCeldaEspecialista(modalEspecialista.fila, modalEspecialista.dia, m.id)}
                  style={{ padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#f9fafb', color: '#3d1f61', fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  {m.nombre}
                </button>
              ))}
            </div>
            <button onClick={() => setModalEspecialista(null)} style={{ ...s.btnSecondary, width: '100%', marginTop: 16 }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal devolver */}
      {modalEstado && (
        <div style={s.modalBg} onClick={() => setModalEstado(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#dc2626', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Devolver horario</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>Indica qué debe corregir el docente:</p>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)}
              placeholder="Ej: Falta asignar bloque del martes 8:35..."
              style={{ ...s.input, minHeight: 80, resize: 'vertical', width: '100%', boxSizing: 'border-box', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalEstado(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={() => cambiarEstado('devuelto', comentario)}
                style={{ ...s.btnPrimary, background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
                disabled={!comentario.trim()}>Devolver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  label:        { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select:       { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none' },
  th:           { padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', color: 'rgba(255,255,255,0.7)' },
  td:           { padding: '8px 10px', fontSize: 13, color: '#374151', verticalAlign: 'middle', borderTop: '1px solid #f3eeff' },
  inputSmall:   { padding: '5px 6px', borderRadius: 7, border: '1px solid #e5e7eb', fontSize: 11, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none', background: '#fafafa', color: '#374151' },
  iconBtn:      { background: 'none', border: 'none', cursor: 'pointer', color: '#b0a8c0', fontSize: 10, padding: '2px 4px', borderRadius: 4, lineHeight: 1, fontFamily: 'inherit' },
  btnPrimary:   { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  input:        { padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none' },
  modalBg:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox:     { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}