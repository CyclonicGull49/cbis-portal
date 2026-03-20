import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import { usePeriodosNotas } from '../hooks/usePeriodosNotas'
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

const LABELS = { ac: 'AC', ai: 'AI', em: 'EM', ep: 'EP', ef: 'EF' }
const FULL_LABELS = {
  ac: 'Actividad Cotidiana', ai: 'Actividad Integradora',
  em: 'Examen Mensual', ep: 'Examen de Periodo', ef: 'Examen Final',
}
const PESOS = { ac: 0.35, ai: 0.35, em: 0.10, ep: 0.10, ef: 0.20 }

function calcNFT(componentes, notasMap) {
  const vals = componentes.map(c => notasMap[c])
  if (vals.some(v => v === null || v === undefined || v === '')) return null
  return componentes.reduce((sum, c) => sum + parseFloat(notasMap[c]) * PESOS[c], 0)
}

const nivelColor = {
  primera_infancia: { bg: '#e0f7f6', color: '#0e9490' },
  inicial:          { bg: '#e0f7f6', color: '#0e9490' },
  primaria:         { bg: '#fef9c3', color: '#a16207' },
  secundaria:       { bg: '#fff0e6', color: '#c2410c' },
  bachillerato:     { bg: '#f3eeff', color: '#5B2D8E' },
}

function colorNota(n) {
  if (n === null || n === undefined) return '#b0a8c0'
  if (n < 5) return '#dc2626'
  if (n < 7) return '#a16207'
  return '#16a34a'
}

function NotaInput({ value, onChange, onPreview, disabled }) {
  const [local, setLocal] = useState(value ?? '')
  const timerRef = React.useRef(null)

  useEffect(() => { setLocal(value ?? '') }, [value])

  // Limpiar timer al desmontar
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  function tryGuardar(v) {
    const n = parseFloat(v)
    if (v === '' || v === null) { onChange(null); return }
    if (isNaN(n) || n < 0 || n > 10) return
    onChange(Math.round(n * 10) / 10)
  }

  function handleChange(e) {
    const v = e.target.value
    setLocal(v)
    const n = parseFloat(v)
    if (!isNaN(n) && n >= 0 && n <= 10) onPreview?.(Math.round(n * 10) / 10)
    else if (v === '') onPreview?.(null)

    // Guardar automáticamente 800ms después de dejar de escribir
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => tryGuardar(v), 800)
  }

  function handleBlur() {
    // Cancelar debounce y guardar inmediatamente al salir
    if (timerRef.current) clearTimeout(timerRef.current)
    const n = parseFloat(local)
    if (local === '' || local === null) { onChange(null); return }
    if (isNaN(n) || n < 0 || n > 10) {
      toast.error('Nota debe ser entre 0 y 10')
      setLocal(value ?? '')
      onPreview?.(value ?? null)
      return
    }
    onChange(Math.round(n * 10) / 10)
  }

  return (
    <input
      type="number" min="0" max="10" step="0.1"
      inputMode="decimal"
      value={local} disabled={disabled}
      onChange={handleChange} onBlur={handleBlur}
      style={{
        width: 52, padding: '5px 4px', borderRadius: 7, textAlign: 'center',
        border: '1.5px solid #e5e7eb',
        fontSize: 16, fontWeight: 600,
        transform: 'scale(0.75)', transformOrigin: 'center',
        background: disabled ? '#f9fafb' : '#fff',
        color: local === '' ? '#ccc' : parseFloat(local) < 5 ? '#dc2626' : '#3d1f61',
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none',
        WebkitAppearance: 'none', MozAppearance: 'textfield',
      }}
    />
  )
}

export default function Notas({ onVerEstudiante }) {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const esDocente      = perfil?.rol === 'docente'
  const puedeEditar    = ['admin', 'registro_academico', 'docente'].includes(perfil?.rol)

  // Admin que también tiene asignaciones → se trata como docente en Notas
  const [tieneAsignaciones, setTieneAsignaciones] = useState(false)
  const esDocenteTambien = esDocente || (perfil?.rol === 'admin' && tieneAsignaciones)

  useEffect(() => {
    if (perfil?.rol !== 'admin' || !perfil?.id) return
    supabase.from('asignaciones').select('id', { count: 'exact', head: true })
      .eq('docente_id', perfil.id).eq('año_escolar', yearEscolar || new Date().getFullYear())
      .then(({ count }) => setTieneAsignaciones((count || 0) > 0))
  }, [perfil])

  // ── Estado principal ──────────────────────────────────────
  const [modo, setModo]               = useState('grados')
  const [grados, setGrados]           = useState([])
  const [gradoId, setGradoId]         = useState(null)
  const [gradoInfo, setGradoInfo]     = useState(null)
  const [materias, setMaterias]       = useState([])
  const [misMateriasIds, setMisMateriasIds] = useState(new Set())
  const [esEncargado, setEsEncargado] = useState(false)
  const [materiaId, setMateriaId]     = useState('todas')
  const [estudiantes, setEstudiantes] = useState([])
  const [notas, setNotas]             = useState({})
  const [loading, setLoading]         = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [busqueda, setBusqueda]       = useState('')
  const [periodoMovil, setPeriodoMovil] = useState(1)

  // ── Cambios pendientes (reemplaza preview/debounce) ───────
  const [pendingNotas, setPendingNotas]   = useState({}) // key: estId-matId-periodo-tipo → valor
  const [pendingActs, setPendingActs]     = useState({}) // key: estId-matId-periodo-num → valor
  const hayPendientes = Object.keys(pendingNotas).length > 0 || Object.keys(pendingActs).length > 0

  // ── Estado grupos inglés ──────────────────────────────────
  const [grupos, setGrupos]               = useState([])
  const [grupoId, setGrupoId]             = useState(null)
  const [grupoInfo, setGrupoInfo]         = useState(null)
  const [materiaInglesId, setMateriaInglesId] = useState(null)
  const [estGrupo, setEstGrupo]           = useState([])
  const [notasIngles, setNotasIngles]     = useState({})
  const [pendingIngles, setPendingIngles] = useState({})
  const [loadingIngles, setLoadingIngles] = useState(false)

  // ── Estado actividades cotidianas ─────────────────────────
  const [actividades, setActividades] = useState({})
  const [expandAC, setExpandAC]       = useState({})

  const year = yearEscolar || new Date().getFullYear()
  const { isPeriodoAbierto } = usePeriodosNotas(year)

  // ── Solicitudes por estudiante ────────────────────────────
  const [solicitudes, setSolicitudes]       = useState([])
  const [modalSolicitud, setModalSolicitud] = useState(null) // { matId, periodo, estId, estNombre }
  const [motivoSolicitud, setMotivoSolicitud] = useState('')
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false)

  async function recargarSolicitudes() {
    if (!esDocenteTambien || !perfil) return
    const { data } = await supabase.from('solicitudes_desbloqueo')
      .select('materia_id, grado_id, estudiante_id, periodo, estado, abierto_en, cierre_en')
      .eq('docente_id', perfil.id).eq('año_escolar', year)
    setSolicitudes(data || [])
  }

  useEffect(() => { if (esDocenteTambien && perfil) recargarSolicitudes() }, [perfil, year])
  useEffect(() => { if (esDocenteTambien && gradoId) recargarSolicitudes() }, [gradoId, materiaId])

  function isMateriaDesbloqueada(matId, gId, periodo, estId) {
    return solicitudes.some(s =>
      s.materia_id === matId && s.grado_id === gId &&
      s.periodo === periodo && s.estudiante_id === estId &&
      s.estado === 'aprobado' &&
      s.abierto_en && s.cierre_en && new Date() < new Date(s.cierre_en)
    )
  }

  function getSolicitudEstudiante(matId, periodo, estId) {
    return solicitudes.find(s =>
      s.materia_id === matId && s.periodo === periodo && s.estudiante_id === estId
    ) || null
  }

  function puedeEditarPeriodo(matId, periodo, estId = null) {
    const nivelGrado = gradoInfo?.nivel
    const abierto = isPeriodoAbierto(nivelGrado, periodo)
    if (abierto) return puedeEditarMateria(matId)
    if (estId && isMateriaDesbloqueada(matId, gradoId, periodo, estId)) return true
    if (perfil?.rol === 'registro_academico') return true
    return false
  }

  async function enviarSolicitud() {
    if (!motivoSolicitud.trim()) { toast.error('Escribe el motivo'); return }
    setEnviandoSolicitud(true)
    const { error } = await supabase.from('solicitudes_desbloqueo').insert({
      docente_id: perfil.id, materia_id: modalSolicitud.matId,
      grado_id: gradoId, estudiante_id: modalSolicitud.estId,
      periodo: modalSolicitud.periodo, año_escolar: year, motivo: motivoSolicitud,
    })
    if (error) {
      if (error.code === '23505') toast.error('Ya tienes una solicitud pendiente para este estudiante')
      else toast.error('Error al enviar')
    } else {
      toast.success('Solicitud enviada a Dirección Académica')
      setModalSolicitud(null); setMotivoSolicitud('')
      await recargarSolicitudes()
    }
    setEnviandoSolicitud(false)
  }

  const componentes    = gradoInfo?.componentes_nota?.split(',') || ['ac', 'ai', 'em', 'ef']
  const numPeriodos    = gradoInfo?.nivel === 'bachillerato' ? 4 : 3
  const periodoLabel   = gradoInfo?.nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'
  const numActividades = gradoInfo?.nivel === 'bachillerato' ? 5 : 7
  const nivel          = nivelColor[gradoInfo?.nivel] || nivelColor.primaria

  // Componentes inglés (bachillerato usa ep en vez de em)
  const compIngles  = grupoInfo ? (['ac','ai','ep','ef']) : ['ac','ai','em','ef']
  const numPerIngles = 4 // inglés siempre 4 períodos (bimestral)

  const estudiantesFiltrados = estudiantes.filter(e =>
    busqueda === '' ||
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    `${e.apellido} ${e.nombre}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  function puedeEditarMateria(matId) {
    if (!esDocenteTambien) return ['admin','registro_academico','direccion_academica','recepcion'].includes(perfil?.rol)
    if (misMateriasIds.has(matId)) return true
    return false
  }

  function getVal(estId, matId, periodo, tipo) {
    const pKey = `${estId}|${matId}|${periodo}|${tipo}`
    const dbKey = `${estId}-${matId}-${periodo}-${tipo}`
    return pendingNotas[pKey] !== undefined ? pendingNotas[pKey] : (notas[dbKey]?.nota ?? null)
  }
  function getNotasMap(estId, matId, periodo) {
    const map = {}
    for (const c of componentes) map[c] = getVal(estId, matId, periodo, c)
    return map
  }
  function getValIngles(estId, gradoEstId, periodo, tipo) {
    const pKey = `${estId}|${materiaInglesId}|${gradoEstId}|${periodo}|${tipo}`
    const dbKey = `${estId}-${materiaInglesId}-${gradoEstId}-${periodo}-${tipo}`
    return pendingIngles[pKey] !== undefined ? pendingIngles[pKey] : (notasIngles[dbKey]?.nota ?? null)
  }
  function getAC(estId, matId, periodo) {
    const acts = Array.from({ length: numActividades }, (_, i) => {
      const pKey = `${estId}|${matId}|${periodo}|${i + 1}`
      const dbKey = `${estId}-${matId}-${periodo}-${i + 1}`
      return pendingActs[pKey] !== undefined ? pendingActs[pKey] : actividades[dbKey]
    }).filter(v => v !== null && v !== undefined)
    if (acts.length === 0) return null
    return acts.reduce((a, b) => a + b, 0) / acts.length
  }
  function toggleExpandAC(estId, periodo) {
    setExpandAC(prev => ({ ...prev, [`${estId}-${periodo}`]: !prev[`${estId}-${periodo}`] }))
  }

  // ── Cargar grados + grupos al iniciar ─────────────────────
  useEffect(() => {
    if (!perfil) return
    async function cargar() {
      if (esDocenteTambien) {
        // Grados desde asignaciones
        const { data: asig } = await supabase
          .from('asignaciones')
          .select('grado_id, grados(id, nombre, nivel, orden, componentes_nota, encargado_id)')
          .eq('docente_id', perfil.id).eq('año_escolar', year)
        const vistos = new Set(); const lista = []
        for (const a of (asig || [])) {
          if (a.grados && !vistos.has(a.grado_id)) {
            vistos.add(a.grado_id); lista.push(a.grados)
          }
        }
        lista.sort((a, b) => a.orden - b.orden)
        setGrados(lista)
        if (lista.length === 1) { setGradoId(lista[0].id); setGradoInfo(lista[0]) }

        // Grupos especiales de inglés
        const { data: grps } = await supabase
          .from('grupos_especiales')
          .select('id, nombre, materia')
          .eq('docente_id', perfil.id).eq('año_escolar', year)
        setGrupos(grps || [])

        // ID de la materia Inglés
        const { data: matIng } = await supabase
          .from('materias').select('id').ilike('nombre', 'inglés').single()
        setMateriaInglesId(matIng?.id || null)
      } else {
        const { data } = await supabase
          .from('grados').select('id, nombre, nivel, orden, componentes_nota, encargado_id').order('orden')
        setGrados(data || [])
      }
    }
    cargar()
  }, [perfil])

  // ── Cargar materias al cambiar grado ──────────────────────
  useEffect(() => {
    if (!gradoId) return
    async function cargar() {
      const gInfo = grados.find(g => g.id === gradoId)
      const esEnc = esDocenteTambien && gInfo?.encargado_id === perfil?.id
      setEsEncargado(esEnc)

      // Materias que puede EDITAR el docente
      let misIds = new Set()
      if (esDocenteTambien) {
        const { data: asig } = await supabase.from('asignaciones').select('materia_id')
          .eq('docente_id', perfil.id).eq('grado_id', gradoId).eq('año_escolar', year)
        misIds = new Set((asig || []).map(a => a.materia_id))
        setMisMateriasIds(misIds)
      }

      // Materias visibles: si es encargado o admin, todas; si no, solo las suyas
      let mat = []
      if (!esDocenteTambien || esEnc) {
        const { data: mgs } = await supabase.from('materia_grado').select('materia_id')
          .eq('grado_id', gradoId)
        if (mgs?.length) {
          const { data: ms } = await supabase.from('materias').select('id, nombre')
            .in('id', mgs.map(m => m.materia_id)).order('nombre')
          mat = ms || []
        }
      } else {
        // Docente no encargado: solo sus materias
        if (misIds.size > 0) {
          const { data: ms } = await supabase.from('materias').select('id, nombre')
            .in('id', Array.from(misIds)).order('nombre')
          mat = ms || []
        }
      }
      setMaterias(mat); setMateriaId(mat.length > 0 ? mat[0].id : 'todas'); setBusqueda('')
    }
    cargar()
  }, [gradoId, year])

  // ── Cargar estudiantes y notas del grado ──────────────────
  useEffect(() => { if (gradoId) cargarDatos() }, [gradoId, year])

  async function cargarDatos() {
    setLoading(true); setPendingNotas({}); setPendingActs({})
    const [{ data: ests }, { data: ns }, { data: acs }] = await Promise.all([
      supabase.from('estudiantes').select('id, nombre, apellido').eq('grado_id', gradoId).eq('estado', 'activo').order('apellido'),
      supabase.from('notas').select('*').eq('grado_id', gradoId).eq('año_escolar', year),
      supabase.from('actividades_cotidianas').select('*').eq('grado_id', gradoId).eq('año_escolar', year),
    ])
    setEstudiantes(ests || [])
    const mapa = {}
    for (const n of (ns || [])) mapa[`${n.estudiante_id}-${n.materia_id}-${n.periodo}-${n.tipo}`] = n
    setNotas(mapa)
    const acMapa = {}
    for (const a of (acs || [])) acMapa[`${a.estudiante_id}-${a.materia_id}-${a.periodo}-${a.numero}`] = a.nota
    setActividades(acMapa)
    setLoading(false)
  }

  async function guardarTodo() {
    if (!hayPendientes) return
    setGuardando(true)
    const ops = []
    const keysNotas = Object.keys(pendingNotas)
    const keysActs  = Object.keys(pendingActs)

    for (const key of keysNotas) {
      const parts = key.split('|')
      const estId = parts[0], matId = parts[1], periodo = parts[2], tipo = parts[3]
      const valor = pendingNotas[key]
      const dbKey = `${estId}-${matId}-${periodo}-${tipo}`
      const existe = notas[dbKey]
      const payload = { estudiante_id: parseInt(estId), materia_id: matId, grado_id: gradoId, año_escolar: year, periodo: parseInt(periodo), tipo, nota: valor, docente_id: perfil.id }
      ops.push(existe
        ? supabase.from('notas').update({ nota: valor, docente_id: perfil.id }).eq('id', existe.id).select().single()
        : supabase.from('notas').insert(payload).select().single()
      )
    }
    for (const key of keysActs) {
      const parts = key.split('|')
      const estId = parts[0], matId = parts[1], periodo = parts[2], num = parts[3]
      ops.push(supabase.from('actividades_cotidianas').upsert({
        estudiante_id: parseInt(estId), materia_id: matId, grado_id: gradoId,
        año_escolar: year, periodo: parseInt(periodo), numero: parseInt(num),
        nota: pendingActs[key], docente_id: perfil.id
      }, { onConflict: 'estudiante_id,materia_id,grado_id,año_escolar,periodo,numero' }))
    }

    const results = await Promise.all(ops)
    const errores = results.filter(r => r.error)
    if (errores.length > 0) {
      toast.error('Hubo errores al guardar algunas notas')
    } else {
      const nuevasNotas = { ...notas }
      keysNotas.forEach((key, i) => {
        if (results[i]?.data) {
          const parts = key.split('|')
          const dbKey = `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`
          nuevasNotas[dbKey] = results[i].data
        }
      })
      const nuevasActs = { ...actividades }
      keysActs.forEach((key) => {
        const parts = key.split('|')
        const dbKey = `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`
        nuevasActs[dbKey] = pendingActs[key]
      })
      setActividades(nuevasActs)

      // Recalcular promedios AC
      const combos = new Set(keysActs.map(k => k.split('|').slice(0, 3).join('|')))
      for (const combo of combos) {
        const [estId, matId, periodo] = combo.split('|')
        const acts = Array.from({ length: numActividades }, (_, j) => {
          const dbKey = `${estId}-${matId}-${periodo}-${j + 1}`
          return nuevasActs[dbKey]
        }).filter(v => v !== null && v !== undefined)
        const acPromedio = acts.length > 0 ? Math.round((acts.reduce((a, b) => a + b, 0) / acts.length) * 10) / 10 : null
        const acDbKey = `${estId}-${matId}-${periodo}-ac`
        const existeAC = nuevasNotas[acDbKey]
        const payloadAC = { estudiante_id: parseInt(estId), materia_id: matId, grado_id: gradoId, año_escolar: year, periodo: parseInt(periodo), tipo: 'ac', nota: acPromedio, docente_id: perfil.id }
        const { data: acData } = existeAC
          ? await supabase.from('notas').update({ nota: acPromedio, docente_id: perfil.id }).eq('id', existeAC.id).select().single()
          : await supabase.from('notas').insert(payloadAC).select().single()
        if (acData) nuevasNotas[acDbKey] = acData
      }
      setNotas(nuevasNotas)
      setPendingNotas({}); setPendingActs({})
      toast.success(`Cambios guardados correctamente`, { duration: 2500, style: { fontSize: 13, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' } })
    }
    setGuardando(false)
  }

  async function guardarTodoIngles() {
    if (Object.keys(pendingIngles).length === 0) return
    setGuardando(true)
    const keys = Object.keys(pendingIngles)
    const ops = keys.map(key => {
      const parts = key.split('|')
      const estId = parts[0], matId = parts[1], gradoEstId = parts[2], periodo = parts[3], tipo = parts[4]
      const dbKey = `${estId}-${matId}-${gradoEstId}-${periodo}-${tipo}`
      const existe = notasIngles[dbKey]
      const payload = { estudiante_id: parseInt(estId), materia_id: matId, grado_id: parseInt(gradoEstId), año_escolar: year, periodo: parseInt(periodo), tipo, nota: pendingIngles[key], docente_id: perfil.id }
      return existe
        ? supabase.from('notas').update({ nota: pendingIngles[key], docente_id: perfil.id }).eq('id', existe.id).select().single()
        : supabase.from('notas').insert(payload).select().single()
    })
    const results = await Promise.all(ops)
    if (results.some(r => r.error)) {
      toast.error('Hubo errores al guardar')
    } else {
      const nuevas = { ...notasIngles }
      keys.forEach((key, i) => {
        if (results[i].data) {
          const parts = key.split('|')
          const dbKey = `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`
          nuevas[dbKey] = results[i].data
        }
      })
      setNotasIngles(nuevas); setPendingIngles({})
      toast.success('Cambios guardados', { duration: 2500, style: { fontSize: 13, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' } })
    }
    setGuardando(false)
  }

  // ── Cargar estudiantes del grupo inglés ───────────────────
  useEffect(() => {
    if (!grupoId || !materiaInglesId) return
    setLoadingIngles(true); setPendingIngles({})
    async function cargar() {
      const { data: eg } = await supabase
        .from('estudiante_grupo')
        .select('estudiante_id, estudiantes(id, nombre, apellido, grado_id)')
        .eq('grupo_id', grupoId).eq('año_escolar', year)
      const ests = (eg || []).map(e => e.estudiantes).filter(Boolean)
        .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
      setEstGrupo(ests)
      if (ests.length > 0) {
        const { data: ns } = await supabase.from('notas').select('*')
          .in('estudiante_id', ests.map(e => e.id)).eq('materia_id', materiaInglesId).eq('año_escolar', year)
        const mapa = {}
        for (const n of (ns || [])) mapa[`${n.estudiante_id}-${n.materia_id}-${n.grado_id}-${n.periodo}-${n.tipo}`] = n
        setNotasIngles(mapa)
      }
      setLoadingIngles(false)
    }
    cargar()
  }, [grupoId, materiaInglesId, year])

  function toggleExpandAC(estId, periodo) {
    setExpandAC(prev => ({ ...prev, [`${estId}-${periodo}`]: !prev[`${estId}-${periodo}`] }))
  }

  // ── Estado actividades cotidianas ─────────────────────────
  function setPreviewVal(estId, matId, periodo, tipo, val) {
    const key = `${estId}|${matId}|${periodo}|${tipo}`
    setPendingNotas(p => val === null
      ? Object.fromEntries(Object.entries(p).filter(([k]) => k !== key))
      : { ...p, [key]: val }
    )
  }

  function getAC(estId, matId, periodo) {
    const acts = Array.from({ length: numActividades }, (_, i) => {
      const key = `${estId}-${matId}-${periodo}-${i + 1}`
      return pendingActs[key] !== undefined ? pendingActs[key] : actividades[key]
    }).filter(v => v !== null && v !== undefined)
    if (acts.length === 0) return null
    return acts.reduce((a, b) => a + b, 0) / acts.length
  }

  // ── Nombre clickeable ──────────────────────────────────────
  function NombreEstudiante({ est }) {
    const canClick = !!onVerEstudiante
    return (
      <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: canClick ? '#5B2D8E' : '#3d1f61', whiteSpace: 'nowrap' }}>
        <span
          onClick={() => canClick && onVerEstudiante(est.id)}
          style={{
            cursor: canClick ? 'pointer' : 'default',
            borderBottom: canClick ? '1px dashed #c9b8e8' : 'none',
            paddingBottom: canClick ? 1 : 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => { if (canClick) e.target.style.color = '#3d1f61' }}
          onMouseLeave={e => { if (canClick) e.target.style.color = '#5B2D8E' }}
        >
          {est.apellido}, {est.nombre}
        </span>
      </td>
    )
  }

  // ── Barra de búsqueda ──────────────────────────────────────
  function BarraBusqueda() {
    if (!gradoId || !estudiantes.length) return null
    return (
      <div style={{ position: 'relative', minWidth: 220 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0a8c0', display: 'flex' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          type="text"
          placeholder="Buscar estudiante..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px 10px 34px', borderRadius: 10,
            border: '1.5px solid #e5e7eb', fontSize: 13, background: '#fff',
            color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b0a8c0', fontSize: 16, lineHeight: 1 }}>×</button>
        )}
      </div>
    )
  }

  // ── Tabla resumen ──────────────────────────────────────────
  function TablaResumen() {
    return (
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr style={{ background: '#faf8ff' }}>
              <th style={{ ...s.th, textAlign: 'left', width: 200 }}>
                Estudiante
                {busqueda && <span style={{ fontWeight: 400, color: '#b0a8c0', marginLeft: 6, fontSize: 10 }}>{estudiantesFiltrados.length} resultado{estudiantesFiltrados.length !== 1 ? 's' : ''}</span>}
              </th>
              {materias.map(m => (
                <th key={m.id} style={{ ...s.th, borderLeft: '1px solid #e9e3f5' }}>
                  <div style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }} title={m.nombre}>{m.nombre}</div>
                </th>
              ))}
              <th style={{ ...s.th, borderLeft: '2px solid #c9b8e8' }}>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {estudiantesFiltrados.map((est, idx) => {
              const nftsPorMateria = materias.map(m => {
                const vals = Array.from({ length: numPeriodos }, (_, i) => calcNFT(componentes, getNotasMap(est.id, m.id, i + 1))).filter(v => v !== null)
                return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
              })
              const validos = nftsPorMateria.filter(v => v !== null)
              const prom = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null
              return (
                <tr key={est.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <NombreEstudiante est={est} />
                  {nftsPorMateria.map((n, i) => (
                    <td key={i} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid #f3eeff' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: colorNota(n) }}>{n !== null ? n.toFixed(2) : '—'}</span>
                    </td>
                  ))}
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderLeft: '2px solid #c9b8e8' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: colorNota(prom) }}>{prom !== null ? prom.toFixed(2) : '—'}</span>
                  </td>
                </tr>
              )
            })}
            {estudiantesFiltrados.length === 0 && (
              <tr><td colSpan={99} style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>
                {busqueda ? `No se encontró ningún estudiante con "${busqueda}"` : 'No hay estudiantes en este grado'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Tabla materia individual ───────────────────────────────
  function TablaMateria() {
    const materia = materias.find(m => m.id === materiaId)
    return (
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'auto' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3eeff', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ ...nivel, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{gradoInfo?.nombre}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>{materia?.nombre}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {componentes.map(c => (
              <span key={c} style={{ fontSize: 10, fontWeight: 700, color: '#b0a8c0', background: '#f3eeff', padding: '2px 8px', borderRadius: 10 }}>
                {c === 'ac' ? `AC (${numActividades})` : LABELS[c]} {PESOS[c] * 100}%
              </span>
            ))}
            {hayPendientes && (
              <button onClick={guardarTodo} disabled={guardando}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, border: 'none', background: guardando ? '#c4bad4' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                {guardando ? 'Guardando...' : 'Guardar todo'}
              </button>
            )}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#faf8ff' }}>
              <th style={{ ...s.th, textAlign: 'left', width: 200 }}>
                Estudiante
                {busqueda && <span style={{ fontWeight: 400, color: '#b0a8c0', marginLeft: 6, fontSize: 10 }}>{estudiantesFiltrados.length} resultado{estudiantesFiltrados.length !== 1 ? 's' : ''}</span>}
              </th>
              {Array.from({ length: numPeriodos }, (_, i) => {
                const p = i + 1
                const abierto = isPeriodoAbierto(gradoInfo?.nivel, p)
                const desbloqueado = esDocenteTambien && isMateriaDesbloqueada(materiaId, gradoId, p)
                return (
                  <th key={i} colSpan={componentes.length + 1} style={{ ...s.th, borderLeft: '2px solid #e9e3f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {!abierto && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={desbloqueado ? '#16a34a' : '#dc2626'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          {desbloqueado
                            ? <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                            : <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          }
                        </svg>
                      )}
                      {periodoLabel} {p}
                    </div>
                  </th>
                )
              })}
              <th style={{ ...s.th, borderLeft: '2px solid #c9b8e8' }}>ACU</th>
            </tr>
            <tr style={{ background: '#f5f3ff' }}>
              <th style={s.th2} />
              {Array.from({ length: numPeriodos }, (_, i) => (
                <>
                  {componentes.map(c => (
                    <th key={`${i}-${c}`} style={{ ...s.th2, borderLeft: c === componentes[0] ? '2px solid #e9e3f5' : undefined }} title={FULL_LABELS[c]}>
                      {c === 'ac' ? `AC (${numActividades})` : LABELS[c]}
                    </th>
                  ))}
                  <th key={`${i}-nft`} style={{ ...s.th2, color: '#5B2D8E', fontWeight: 800 }}>NFT</th>
                </>
              ))}
              <th style={{ ...s.th2, borderLeft: '2px solid #c9b8e8', color: '#5B2D8E', fontWeight: 800 }}>Final</th>
            </tr>
          </thead>
          <tbody>
            {estudiantesFiltrados.map((est, idx) => {
              const nfts = Array.from({ length: numPeriodos }, (_, i) => calcNFT(componentes, getNotasMap(est.id, materiaId, i + 1)))
              const validos = nfts.filter(v => v !== null)
              const notaFinal = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null
              const tienePendientes = Object.keys(pendingNotas).some(k => k.startsWith(`${est.id}|`)) ||
                                     Object.keys(pendingActs).some(k => k.startsWith(`${est.id}|`))
              return (
                <tr key={est.id} style={{ borderTop: '1px solid #f3eeff', background: tienePendientes ? '#fffbeb' : idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#3d1f61', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {tienePendientes && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} title="Cambios sin guardar" />}
                      <span onClick={() => onVerEstudiante && onVerEstudiante(est.id)} style={{ cursor: onVerEstudiante ? 'pointer' : 'default', borderBottom: onVerEstudiante ? '1px dashed #c9b8e8' : 'none' }}>
                        {est.apellido}, {est.nombre}
                      </span>
                    </div>
                  </td>
                  {Array.from({ length: numPeriodos }, (_, i) => {
                    const periodo = i + 1
                    const map = getNotasMap(est.id, materiaId, periodo)
                    const nft = calcNFT(componentes, map)
                    const puedeEdit = puedeEditarPeriodo(materiaId, periodo, est.id)
                    const periodoCerrado = esDocenteTambien && !isPeriodoAbierto(gradoInfo?.nivel, periodo)
                    const solicitudEst = esDocenteTambien ? getSolicitudEstudiante(materiaId, periodo, est.id) : null
                    const desbloqueado = isMateriaDesbloqueada(materiaId, gradoId, periodo, est.id)
                    const enRevision = solicitudEst && !desbloqueado && !['rechazado','cerrado'].includes(solicitudEst.estado)
                    const sinSolicitud = !solicitudEst || ['rechazado','cerrado'].includes(solicitudEst.estado)
                    return (
                      <React.Fragment key={periodo}>
                        {componentes.map(c => {
                          if (c === 'ac') {
                            const acVal = getAC(est.id, materiaId, periodo)
                            const expanded = expandAC[`${est.id}-${periodo}`]
                            return (
                              <td key={`${est.id}-${periodo}-ac`} style={{ padding: '4px', borderLeft: '2px solid #e9e3f5', textAlign: 'center', background: expanded ? '#faf8ff' : 'transparent' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: colorNota(acVal), minWidth: 36 }}>
                                    {acVal !== null ? acVal.toFixed(1) : '—'}
                                  </span>
                                  {puedeEdit && (
                                    <button onClick={() => toggleExpandAC(est.id, periodo)}
                                      style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid #d8c8f0', background: expanded ? '#5B2D8E' : '#f3eeff', color: expanded ? '#fff' : '#5B2D8E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        {expanded ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                {expanded && puedeEdit && (
                                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {Array.from({ length: numActividades }, (_, j) => {
                                      const num = j + 1
                                      const actKey = `${est.id}|${materiaId}|${periodo}|${num}`
                                      const dbKey  = `${est.id}-${materiaId}-${periodo}-${num}`
                                      const actVal = pendingActs[actKey] !== undefined ? pendingActs[actKey] : (actividades[dbKey] ?? null)
                                      return (
                                        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <span style={{ fontSize: 9, color: '#b0a8c0', fontWeight: 700, minWidth: 14 }}>A{num}</span>
                                          <NotaInput value={actVal} disabled={false} onPreview={() => {}}
                                            onChange={v => setPendingActs(p => ({ ...p, [actKey]: v }))} />
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </td>
                            )
                          }
                          return (
                            <td key={`${est.id}-${periodo}-${c}`} style={{ padding: '6px 4px', borderLeft: c === componentes[0] ? '2px solid #e9e3f5' : undefined, textAlign: 'center' }}>
                              <NotaInput
                                value={getVal(est.id, materiaId, periodo, c)}
                                disabled={!puedeEdit}
                                onPreview={() => {}}
                                onChange={v => setPreviewVal(est.id, materiaId, periodo, c, v)}
                              />
                            </td>
                          )
                        })}
                        <td style={{ padding: '6px 10px', textAlign: 'center', minWidth: 52, background: nft !== null ? 'rgba(91,45,142,0.04)' : 'transparent' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: colorNota(nft) }}>{nft !== null ? nft.toFixed(2) : '—'}</span>
                        </td>
                        {/* Solicitud por estudiante */}
                        {periodoCerrado && sinSolicitud && !desbloqueado && puedeEditarMateria(materiaId) && (
                          <td style={{ padding: '4px 6px', textAlign: 'center', borderLeft: '1px solid #f3eeff' }}>
                            <button onClick={() => { setModalSolicitud({ matId: materiaId, periodo, estId: est.id, estNombre: `${est.apellido}, ${est.nombre}` }); setMotivoSolicitud('') }}
                              style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid #c9b8e8', background: '#f3eeff', color: '#5B2D8E', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                              </svg>
                              Solicitar
                            </button>
                          </td>
                        )}
                        {periodoCerrado && enRevision && (
                          <td style={{ padding: '4px 6px', textAlign: 'center', borderLeft: '1px solid #f3eeff' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: solicitudEst?.estado === 'aprobado' ? '#16a34a' : '#92400e', background: solicitudEst?.estado === 'aprobado' ? '#dcfce7' : '#fef9c3', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                              {solicitudEst?.estado === 'aprobado' ? 'Aprobada' : 'En revisión'}
                            </span>
                          </td>
                        )}
                        {periodoCerrado && desbloqueado && (
                          <td style={{ padding: '4px 6px', textAlign: 'center', borderLeft: '1px solid #f3eeff' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>Abierto</span>
                          </td>
                        )}
                        {!periodoCerrado && <td style={{ borderLeft: '1px solid #f3eeff' }} />}
                      </React.Fragment>
                    )
                  })}
                  <td style={{ padding: '6px 12px', borderLeft: '2px solid #c9b8e8', textAlign: 'center', background: notaFinal !== null ? 'rgba(91,45,142,0.06)' : 'transparent' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: colorNota(notaFinal) }}>{notaFinal !== null ? notaFinal.toFixed(2) : '—'}</span>
                  </td>
                </tr>
              )
            })}
            {estudiantesFiltrados.length === 0 && (
              <tr><td colSpan={99} style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>
                {busqueda ? `No se encontró ningún estudiante con "${busqueda}"` : 'No hay estudiantes en este grado'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Vista móvil: tarjetas ─────────────────────────────────
  function VistaMóvil() {
    const mat = materias.find(m => m.id === materiaId)
    if (!mat) return (
      <div style={{ textAlign: 'center', padding: 32, color: '#b0a8c0', fontSize: 13 }}>
        Selecciona una materia para ingresar notas
      </div>
    )
    const periodos = Array.from({ length: numPeriodos }, (_, i) => i + 1)
    return (
      <div>
        {/* Botón guardar + indicador pendientes */}
        {hayPendientes && (
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={guardarTodo} disabled={guardando}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: guardando ? '#c4bad4' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(91,45,142,0.3)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {guardando ? 'Guardando...' : `Guardar todo`}
            </button>
          </div>
        )}
        {/* Selector período */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {periodos.map(p => (
            <button key={p} onClick={() => setPeriodoMovil(p)}
              style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 20, border: 'none', background: periodoMovil === p ? '#5B2D8E' : '#f3eeff', color: periodoMovil === p ? '#fff' : '#5B2D8E', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {periodoLabel} {p}
            </button>
          ))}
        </div>
        {/* Tarjetas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {estudiantesFiltrados.map(est => {
            const map = getNotasMap(est.id, materiaId, periodoMovil)
            const nft = calcNFT(componentes, map)
            return (
              <div key={est.id} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(61,31,97,0.07)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: '#3d1f61', fontSize: 14 }}>{est.apellido}, {est.nombre}</div>
                  <div style={{ textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#b0a8c0', textTransform: 'uppercase', marginBottom: 2 }}>NFT</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: colorNota(nft) }}>{nft !== null ? nft.toFixed(2) : '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${componentes.length}, 1fr)`, gap: 8 }}>
                  {componentes.map(c => {
                    const puedeEdit = puedeEditarPeriodo(materiaId, periodoMovil, est.id)
                    if (c === 'ac') {
                      const acVal = getAC(est.id, materiaId, periodoMovil)
                      const expanded = expandAC[`${est.id}-${periodoMovil}`]
                      return (
                        <div key={c} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                            AC ({numActividades})
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: colorNota(acVal) }}>
                              {acVal !== null ? acVal.toFixed(1) : '—'}
                            </span>
                            {puedeEdit && (
                              <button onClick={() => toggleExpandAC(est.id, periodoMovil)}
                                style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #d8c8f0', background: expanded ? '#5B2D8E' : '#f3eeff', color: expanded ? '#fff' : '#5B2D8E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  {expanded ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                                </svg>
                              </button>
                            )}
                          </div>
                          {expanded && puedeEdit && (
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {Array.from({ length: numActividades }, (_, j) => {
                                const num = j + 1
                                const actKey = `${est.id}|${materiaId}|${periodoMovil}|${num}`
                                const dbKey  = `${est.id}-${materiaId}-${periodoMovil}-${num}`
                                const actVal = pendingActs[actKey] !== undefined ? pendingActs[actKey] : (actividades[dbKey] ?? null)
                                return (
                                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 10, color: '#b0a8c0', fontWeight: 700, minWidth: 20 }}>A{num}</span>
                                    <NotaInput value={actVal} disabled={false} onPreview={() => {}}
                                      onChange={v => setPendingActs(p => ({ ...p, [actKey]: v }))} />
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }
                    return (
                      <div key={c} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                          {LABELS[c]}
                        </div>
                        <NotaInput
                          value={getVal(est.id, materiaId, periodoMovil, c)}
                          disabled={!puedeEdit}
                          onPreview={() => {}}
                          onChange={v => setPreviewVal(est.id, materiaId, periodoMovil, c, v)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Tabla grupos inglés ───────────────────────────────────
  function TablaGrupoIngles() {
    const periodos = Array.from({ length: numPerIngles }, (_, i) => i + 1)
    return (
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3eeff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: '#f3eeff', color: '#5B2D8E', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            Inglés — {grupoInfo?.nombre}
          </span>
          <span style={{ fontSize: 12, color: '#b0a8c0' }}>{estGrupo.length} estudiante{estGrupo.length !== 1 ? 's' : ''}</span>
          {Object.keys(pendingIngles).length > 0 && (
            <button onClick={guardarTodoIngles} disabled={guardando} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, border: 'none', background: guardando ? '#c4bad4' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              {guardando ? 'Guardando...' : 'Guardar todo'}
            </button>
          )}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#1a2d5a' }}>
              <th style={{ ...s.th, textAlign: 'left', color: '#F5EDD0' }}>Estudiante</th>
              <th style={{ ...s.th, color: '#F5EDD0' }}>Grado</th>
              {periodos.map(p => (
                <th key={p} colSpan={compIngles.length + 1} style={{ ...s.th, borderLeft: '2px solid rgba(255,255,255,0.1)', color: '#F5EDD0' }}>
                  Bimestre {p}
                </th>
              ))}
              <th style={{ ...s.th, borderLeft: '2px solid rgba(255,255,255,0.2)', color: '#F5EDD0' }}>ACU</th>
            </tr>
            <tr style={{ background: '#f5f3ff' }}>
              <th style={s.th2} /><th style={s.th2} />
              {periodos.map(p => (
                <React.Fragment key={p}>
                  {compIngles.map(c => (
                    <th key={c} style={{ ...s.th2, borderLeft: c === compIngles[0] ? '2px solid #e9e3f5' : undefined }}>{LABELS[c]}</th>
                  ))}
                  <th style={{ ...s.th2, color: '#5B2D8E', fontWeight: 800 }}>NFT</th>
                </React.Fragment>
              ))}
              <th style={{ ...s.th2, borderLeft: '2px solid #c9b8e8', color: '#5B2D8E', fontWeight: 800 }}>Final</th>
            </tr>
          </thead>
          <tbody>
            {estGrupo.map((est, idx) => {
              const compEst = est.grado_id ? (['ac','ai','ep','ef']) : compIngles // bachillerato usa ep
              const nfts = periodos.map(p => {
                const map = {}
                for (const c of compIngles) {
                  const k = `${est.id}-${materiaInglesId}-${est.grado_id}-${p}-${c}`
                  map[c] = getValIngles(est.id, est.grado_id, p, c)
                }
                return calcNFT(compIngles, map)
              })
              const validos = nfts.filter(v => v !== null)
              const notaFinal = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null

              return (
                <tr key={est.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#3d1f61', whiteSpace: 'nowrap' }}>
                    {est.apellido}, {est.nombre}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: '#b0a8c0', whiteSpace: 'nowrap' }}>
                    {est.grado_id}
                  </td>
                  {periodos.map(p => {
                    const nft = nfts[p - 1]
                    return (
                      <React.Fragment key={p}>
                        {compIngles.map(c => {
                          const k = `${est.id}-${materiaInglesId}-${est.grado_id}-${p}-${c}`
                          const val = getValIngles(est.id, est.grado_id, p, c)
                          return (
                            <td key={c} style={{ padding: '6px 4px', borderLeft: c === compIngles[0] ? '2px solid #e9e3f5' : undefined, textAlign: 'center' }}>
                              <NotaInput
                                value={getValIngles(est.id, est.grado_id, p, c)}
                                disabled={!isPeriodoAbierto('bachillerato', p) && perfil?.rol !== 'registro_academico'}
                                onPreview={() => {}}
                                onChange={v => {
                                  const k = `${est.id}|${materiaInglesId}|${est.grado_id}|${p}|${c}`
                                  setPendingIngles(prev => v === null
                                    ? Object.fromEntries(Object.entries(prev).filter(([key]) => key !== k))
                                    : { ...prev, [k]: v }
                                  )
                                }}
                              />
                            </td>
                          )
                        })}
                        <td style={{ padding: '6px 8px', textAlign: 'center', background: nft !== null ? 'rgba(91,45,142,0.04)' : 'transparent' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: colorNota(nft) }}>{nft !== null ? nft.toFixed(2) : '—'}</span>
                        </td>
                      </React.Fragment>
                    )
                  })}
                  <td style={{ padding: '6px 12px', borderLeft: '2px solid #c9b8e8', textAlign: 'center', background: notaFinal !== null ? 'rgba(91,45,142,0.06)' : 'transparent' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: colorNota(notaFinal) }}>{notaFinal !== null ? notaFinal.toFixed(2) : '—'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Tabs modo — solo si docente tiene grupos inglés */}
      {esDocenteTambien && grupos.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f0f0f0' }}>
          <button onClick={() => setModo('grados')}
            style={{ padding: '9px 20px', border: 'none', borderBottom: modo === 'grados' ? '3px solid #5B2D8E' : '3px solid transparent', background: 'none', color: modo === 'grados' ? '#3d1f61' : '#b0a8c0', fontWeight: modo === 'grados' ? 800 : 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Mis materias
          </button>
          <button onClick={() => setModo('ingles')}
            style={{ padding: '9px 20px', border: 'none', borderBottom: modo === 'ingles' ? '3px solid #5B2D8E' : '3px solid transparent', background: 'none', color: modo === 'ingles' ? '#3d1f61' : '#b0a8c0', fontWeight: modo === 'ingles' ? 800 : 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            Grupos de Inglés
          </button>
        </div>
      )}

      {/* ── MODO GRUPOS INGLÉS ── */}
      {modo === 'ingles' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={s.label}>Grupo</label>
              <select style={s.select} value={grupoId || ''} onChange={e => {
                const id = parseInt(e.target.value)
                setGrupoId(id)
                setGrupoInfo(grupos.find(g => g.id === id) || null)
              }}>
                <option value="">Selecciona un grupo</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
          </div>
          {!grupoId && (
            <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#d8c8f0' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>Selecciona un grupo para comenzar</div>
            </div>
          )}
          {grupoId && loadingIngles && <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0' }}>Cargando...</div>}
          {grupoId && !loadingIngles && <TablaGrupoIngles />}
        </div>
      )}

      {/* ── MODO GRADOS ── */}
      {modo === 'grados' && (
        <>
          {/* Selectores */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {(!esDocenteTambien || grados.length > 1) && (
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={s.label}>Grado</label>
                <select style={s.select} value={gradoId || ''} onChange={e => {
                  const id = parseInt(e.target.value)
                  setGradoId(id); setGradoInfo(grados.find(g => g.id === id)); setBusqueda('')
                }}>
                  <option value="">Selecciona un grado</option>
                  {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={s.label}>Materia</label>
              <select style={s.select} value={materiaId} onChange={e => { setMateriaId(e.target.value); setBusqueda('') }} disabled={!gradoId}>
                {!isMobile && <option value="todas">Ver todas las materias</option>}
                {materias.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}{esDocenteTambien && esEncargado && !misMateriasIds.has(m.id) ? ' 👁' : ''}
                  </option>
                ))}
              </select>
            </div>
            {!isMobile && (
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={s.label}>Buscar</label>
                <BarraBusqueda />
              </div>
            )}
          </div>

          {/* Aviso encargado */}
          {esEncargado && (
            <div style={{ marginBottom: 12, padding: '10px 16px', background: '#fffbeb', borderRadius: 10, fontSize: 12, color: '#92400e', fontWeight: 600, border: '1px solid #fde68a' }}>
              👁 Eres encargado de este grado — ves todas las materias. Las marcadas con 👁 son de solo lectura.
            </div>
          )}

          {!gradoId && (
            <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#d8c8f0' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>Selecciona un grado para comenzar</div>
            </div>
          )}
          {gradoId && !loading && !materias.length && (
            <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#d8c8f0' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>Este grado no tiene materias asignadas</div>
            </div>
          )}
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Cargando...</div>}
          {gradoId && !loading && !!materias.length && (
            isMobile ? <VistaMóvil /> : (materiaId === 'todas' ? <TablaResumen /> : <TablaMateria />)
          )}
        </>
      )}
      {/* Modal solicitud desbloqueo */}
      {modalSolicitud && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onClick={() => setModalSolicitud(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 440, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Solicitar desbloqueo</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>
              {materias.find(m => m.id === modalSolicitud.matId)?.nombre} · {gradoInfo?.nombre} · {periodoLabel} {modalSolicitud.periodo}
            </p>
            {modalSolicitud.estNombre && (
              <p style={{ color: '#5B2D8E', fontSize: 12, fontWeight: 700, marginBottom: 16, background: '#f3eeff', padding: '4px 10px', borderRadius: 8, display: 'inline-block' }}>
                {modalSolicitud.estNombre}
              </p>
            )}
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Motivo *
            </label>
            <textarea
              value={motivoSolicitud}
              onChange={e => setMotivoSolicitud(e.target.value)}
              placeholder="Explica por qué necesitas modificar las notas de este período..."
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalSolicitud(null)}
                style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={enviarSolicitud} disabled={enviandoSolicitud}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {enviandoSolicitud ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer' },
  th:     { padding: '10px 10px', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center' },
  th2:    { padding: '6px 6px', fontSize: 10, fontWeight: 600, color: '#b0a8c0', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' },
}