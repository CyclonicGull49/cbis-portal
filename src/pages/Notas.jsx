import React, { useEffect, useState, useCallback } from 'react'
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
      value={local} disabled={disabled}
      onChange={handleChange} onBlur={handleBlur}
      style={{
        width: 52, padding: '5px 4px', borderRadius: 7, textAlign: 'center',
        border: '1.5px solid #e5e7eb', fontSize: 12, fontWeight: 600,
        background: disabled ? '#f9fafb' : '#fff',
        color: local === '' ? '#ccc' : parseFloat(local) < 5 ? '#dc2626' : '#3d1f61',
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none',
      }}
    />
  )
}

export default function Notas({ onVerEstudiante }) {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  const esDocente   = perfil?.rol === 'docente'
  const puedeEditar = ['admin', 'registro_academico', 'docente'].includes(perfil?.rol)

  // ── Estado principal ──────────────────────────────────────
  const [modo, setModo]               = useState('grados') // 'grados' | 'ingles'
  const [grados, setGrados]           = useState([])
  const [gradoId, setGradoId]         = useState(null)
  const [gradoInfo, setGradoInfo]     = useState(null)
  const [materias, setMaterias]       = useState([])
  const [misMateriasIds, setMisMateriasIds] = useState(new Set()) // materias que puede editar el docente
  const [esEncargado, setEsEncargado] = useState(false)
  const [materiaId, setMateriaId]     = useState('todas')
  const [estudiantes, setEstudiantes] = useState([])
  const [notas, setNotas]             = useState({})
  const [preview, setPreview]         = useState({})
  const [loading, setLoading]         = useState(false)
  const [busqueda, setBusqueda]       = useState('')
  const [periodoMovil, setPeriodoMovil] = useState(1)

  // ── Estado grupos inglés ──────────────────────────────────
  const [grupos, setGrupos]           = useState([]) // grupos_especiales del docente
  const [grupoId, setGrupoId]         = useState(null)
  const [grupoInfo, setGrupoInfo]     = useState(null)
  const [materiaInglesId, setMateriaInglesId] = useState(null)
  const [estGrupo, setEstGrupo]       = useState([])
  const [notasIngles, setNotasIngles] = useState({})
  const [previewIngles, setPreviewIngles] = useState({})
  const [loadingIngles, setLoadingIngles] = useState(false)

  // ── Estado actividades cotidianas ─────────────────────────
  const [actividades, setActividades]   = useState({})
  const [expandAC, setExpandAC]         = useState({})

  const year = yearEscolar || new Date().getFullYear()

  const componentes  = gradoInfo?.componentes_nota?.split(',') || ['ac', 'ai', 'em', 'ef']
  const numPeriodos  = gradoInfo?.nivel === 'bachillerato' ? 4 : 3
  const periodoLabel = gradoInfo?.nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'
  const nivel        = nivelColor[gradoInfo?.nivel] || nivelColor.primaria

  // Componentes inglés (bachillerato usa ep en vez de em)
  const compIngles  = grupoInfo ? (['ac','ai','ep','ef']) : ['ac','ai','em','ef']
  const numPerIngles = 4 // inglés siempre 4 períodos (bimestral)

  const estudiantesFiltrados = estudiantes.filter(e =>
    busqueda === '' ||
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    `${e.apellido} ${e.nombre}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  function puedeEditarMateria(matId) {
    if (!esDocente) return puedeEditar
    if (misMateriasIds.has(matId)) return true
    return false
  }

  function getVal(estId, matId, periodo, tipo) {
    const key = `${estId}-${matId}-${periodo}-${tipo}`
    return preview[key] !== undefined ? preview[key] : (notas[key]?.nota ?? null)
  }
  function getNotasMap(estId, matId, periodo) {
    const map = {}
    for (const c of componentes) map[c] = getVal(estId, matId, periodo, c)
    return map
  }
  function getValIngles(estId, gradoEstId, periodo, tipo) {
    const key = `${estId}-${materiaInglesId}-${gradoEstId}-${periodo}-${tipo}`
    return previewIngles[key] !== undefined ? previewIngles[key] : (notasIngles[key]?.nota ?? null)
  }

  // ── Cargar grados + grupos al iniciar ─────────────────────
  useEffect(() => {
    if (!perfil) return
    async function cargar() {
      if (esDocente) {
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
      const esEnc = esDocente && gInfo?.encargado_id === perfil?.id
      setEsEncargado(esEnc)

      // Materias que puede EDITAR el docente
      let misIds = new Set()
      if (esDocente) {
        const { data: asig } = await supabase.from('asignaciones').select('materia_id')
          .eq('docente_id', perfil.id).eq('grado_id', gradoId).eq('año_escolar', year)
        misIds = new Set((asig || []).map(a => a.materia_id))
        setMisMateriasIds(misIds)
      }

      // Materias visibles: si es encargado o admin, todas; si no, solo las suyas
      let mat = []
      if (!esDocente || esEnc) {
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
      setMaterias(mat); setMateriaId('todas'); setBusqueda('')
    }
    cargar()
  }, [gradoId, year])

  // ── Cargar estudiantes y notas del grado ──────────────────
  useEffect(() => { if (gradoId) cargarDatos() }, [gradoId, year])

  async function cargarDatos() {
    setLoading(true); setPreview({})
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

  // ── Cargar estudiantes del grupo inglés ───────────────────
  useEffect(() => {
    if (!grupoId || !materiaInglesId) return
    setLoadingIngles(true); setPreviewIngles({})
    async function cargar() {
      // Estudiantes del grupo con su grado
      const { data: eg } = await supabase
        .from('estudiante_grupo')
        .select('estudiante_id, estudiantes(id, nombre, apellido, grado_id)')
        .eq('grupo_id', grupoId).eq('año_escolar', year)
      const ests = (eg || []).map(e => e.estudiantes).filter(Boolean)
        .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
      setEstGrupo(ests)

      // Notas de inglés para estos estudiantes
      const estIds = ests.map(e => e.id)
      if (estIds.length > 0) {
        const { data: ns } = await supabase.from('notas').select('*')
          .in('estudiante_id', estIds).eq('materia_id', materiaInglesId).eq('año_escolar', year)
        const mapa = {}
        for (const n of (ns || [])) {
          mapa[`${n.estudiante_id}-${n.materia_id}-${n.grado_id}-${n.periodo}-${n.tipo}`] = n
        }
        setNotasIngles(mapa)
      }
      setLoadingIngles(false)
    }
    cargar()
  }, [grupoId, materiaInglesId, year])

  async function guardarActividad(estId, matId, periodo, numero, valor) {

    if (esDocente && !misMateriasIds.has(matId)) return
    const key = `${estId}-${matId}-${periodo}-${numero}`

    if (valor === null) {
      await supabase.from('actividades_cotidianas')
        .delete().eq('estudiante_id', estId).eq('materia_id', matId)
        .eq('grado_id', gradoId).eq('año_escolar', year).eq('periodo', periodo).eq('numero', numero)
      setActividades(a => { const c = { ...a }; delete c[key]; return c })
    } else {
      await supabase.from('actividades_cotidianas').upsert({
        estudiante_id: estId, materia_id: matId, grado_id: gradoId,
        año_escolar: year, periodo, numero, nota: valor, docente_id: perfil.id
      }, { onConflict: 'estudiante_id,materia_id,grado_id,año_escolar,periodo,numero' })
      setActividades(a => ({ ...a, [key]: valor }))
    }

    // Recalcular promedio AC y guardarlo en notas
    const newActs = { ...actividades, [key]: valor }
    const acts = Array.from({ length: numActividades }, (_, i) =>
      newActs[`${estId}-${matId}-${periodo}-${i + 1}`]
    ).filter(v => v !== null && v !== undefined)
    const acPromedio = acts.length > 0 ? Math.round((acts.reduce((a, b) => a + b, 0) / acts.length) * 10) / 10 : null
    await guardarNota(estId, matId, periodo, 'ac', acPromedio)
  }

  function toggleExpandAC(estId, periodo) {
    const key = `${estId}-${periodo}`
    setExpandAC(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function guardarNota(estudianteId, matId, periodo, tipo, valor) {
    if (esDocente && !misMateriasIds.has(matId)) return // no puede editar
    const key  = `${estudianteId}-${matId}-${periodo}-${tipo}`
    const existe = notas[key]

    if (valor === null) {
      if (existe) await supabase.from('notas').delete().eq('id', existe.id)
      setNotas(n => { const c = { ...n }; delete c[key]; return c })
      setPreview(p => { const c = { ...p }; delete c[key]; return c })
      return
    }

    const payload = { estudiante_id: estudianteId, materia_id: matId, grado_id: gradoId, año_escolar: year, periodo, tipo, nota: valor, docente_id: perfil.id }
    const { data, error } = existe
      ? await supabase.from('notas').update({ nota: valor, docente_id: perfil.id }).eq('id', existe.id).select().single()
      : await supabase.from('notas').insert(payload).select().single()

    if (error) { toast.error('Error al guardar nota'); return }
    if (data) {
      setNotas(n => ({ ...n, [key]: data }))
      setPreview(p => { const c = { ...p }; delete c[key]; return c })
      toast.success('Nota guardada', { duration: 1200, style: { fontSize: 13, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' } })
    }
  }

  async function guardarNotaIngles(estudianteId, gradoEstId, periodo, tipo, valor) {
    const key = `${estudianteId}-${materiaInglesId}-${gradoEstId}-${periodo}-${tipo}`
    const existe = notasIngles[key]

    if (valor === null) {
      if (existe) await supabase.from('notas').delete().eq('id', existe.id)
      setNotasIngles(n => { const c = { ...n }; delete c[key]; return c })
      setPreviewIngles(p => { const c = { ...p }; delete c[key]; return c })
      return
    }

    const payload = { estudiante_id: estudianteId, materia_id: materiaInglesId, grado_id: gradoEstId, año_escolar: year, periodo, tipo, nota: valor, docente_id: perfil.id }
    const { data, error } = existe
      ? await supabase.from('notas').update({ nota: valor, docente_id: perfil.id }).eq('id', existe.id).select().single()
      : await supabase.from('notas').insert(payload).select().single()

    if (error) { toast.error('Error al guardar nota'); return }
    if (data) {
      setNotasIngles(n => ({ ...n, [key]: data }))
      setPreviewIngles(p => { const c = { ...p }; delete c[key]; return c })
      toast.success('Nota guardada', { duration: 1200, style: { fontSize: 13, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' } })
    }
  }

  // ── Estado actividades cotidianas ─────────────────────────
  const numActividades = gradoInfo?.nivel === 'bachillerato' ? 5 : 7

  function setPreviewVal(estId, matId, periodo, tipo, val) {
    setPreview(p => ({ ...p, [`${estId}-${matId}-${periodo}-${tipo}`]: val }))
  }

  function getAC(estId, matId, periodo) {
    const acts = Array.from({ length: numActividades }, (_, i) =>
      actividades[`${estId}-${matId}-${periodo}-${i + 1}`]
    ).filter(v => v !== null && v !== undefined)
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
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {componentes.map(c => (
              <span key={c} style={{ fontSize: 10, fontWeight: 700, color: '#b0a8c0', background: '#f3eeff', padding: '2px 8px', borderRadius: 10 }}>
                {LABELS[c]} {PESOS[c] * 100}%
              </span>
            ))}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#faf8ff' }}>
              <th style={{ ...s.th, textAlign: 'left', width: 200 }}>
                Estudiante
                {busqueda && <span style={{ fontWeight: 400, color: '#b0a8c0', marginLeft: 6, fontSize: 10 }}>{estudiantesFiltrados.length} resultado{estudiantesFiltrados.length !== 1 ? 's' : ''}</span>}
              </th>
              {Array.from({ length: numPeriodos }, (_, i) => (
                <th key={i} colSpan={componentes.length + 1} style={{ ...s.th, borderLeft: '2px solid #e9e3f5' }}>{periodoLabel} {i + 1}</th>
              ))}
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
              return (
                <tr key={est.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <NombreEstudiante est={est} />
                  {Array.from({ length: numPeriodos }, (_, i) => {
                    const periodo = i + 1
                    const map = getNotasMap(est.id, materiaId, periodo)
                    const nft = calcNFT(componentes, map)
                    return (
                      <>
                        {componentes.map(c => {
                          if (c === 'ac') {
                            const acVal = getAC(est.id, materiaId, periodo)
                            const expanded = expandAC[`${est.id}-${periodo}`]
                            return (
                              <td key={`${est.id}-${periodo}-ac`} style={{ padding: '4px', borderLeft: '2px solid #e9e3f5', textAlign: 'center', background: expanded ? '#faf8ff' : 'transparent' }}>
                                {/* Promedio + botón expandir */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: colorNota(acVal), minWidth: 36 }}>
                                    {acVal !== null ? acVal.toFixed(1) : '—'}
                                  </span>
                                  {puedeEditarMateria(materiaId) && (
                                    <button onClick={() => toggleExpandAC(est.id, periodo)}
                                      title={`${numActividades} actividades`}
                                      style={{ width: 20, height: 20, borderRadius: 4, border: '1px solid #d8c8f0', background: expanded ? '#5B2D8E' : '#f3eeff', color: expanded ? '#fff' : '#5B2D8E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        {expanded ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                {/* Inputs de actividades expandibles */}
                                {expanded && (
                                  <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {Array.from({ length: numActividades }, (_, i) => {
                                      const num = i + 1
                                      const actVal = actividades[`${est.id}-${materiaId}-${periodo}-${num}`] ?? null
                                      return (
                                        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <span style={{ fontSize: 9, color: '#b0a8c0', fontWeight: 700, minWidth: 14 }}>A{num}</span>
                                          <NotaInput
                                            value={actVal}
                                            disabled={false}
                                            onPreview={() => {}}
                                            onChange={v => guardarActividad(est.id, materiaId, periodo, num, v)}
                                          />
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
                                disabled={!puedeEditarMateria(materiaId)}
                                onPreview={v => setPreviewVal(est.id, materiaId, periodo, c, v)}
                                onChange={v => guardarNota(est.id, materiaId, periodo, c, v)}
                              />
                            </td>
                          )
                        })}
                        <td key={`${est.id}-${periodo}-nft`} style={{ padding: '6px 10px', textAlign: 'center', minWidth: 52, background: nft !== null ? 'rgba(91,45,142,0.04)' : 'transparent' }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: colorNota(nft) }}>{nft !== null ? nft.toFixed(2) : '—'}</span>
                        </td>
                      </>
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
                  {componentes.map(c => (
                    <div key={c} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                        {LABELS[c]}
                      </div>
                      <NotaInput
                        value={getVal(est.id, materiaId, periodoMovil, c)}
                        disabled={!puedeEditar}
                        onPreview={v => setPreviewVal(est.id, materiaId, periodoMovil, c, v)}
                        onChange={v => guardarNota(est.id, materiaId, periodoMovil, c, v)}
                      />
                    </div>
                  ))}
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
          <span style={{ fontSize: 12, color: '#b0a8c0', marginLeft: 'auto' }}>{estGrupo.length} estudiante{estGrupo.length !== 1 ? 's' : ''}</span>
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
                  map[c] = previewIngles[k] !== undefined ? previewIngles[k] : (notasIngles[k]?.nota ?? null)
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
                          const val = previewIngles[k] !== undefined ? previewIngles[k] : (notasIngles[k]?.nota ?? null)
                          return (
                            <td key={c} style={{ padding: '6px 4px', borderLeft: c === compIngles[0] ? '2px solid #e9e3f5' : undefined, textAlign: 'center' }}>
                              <NotaInput
                                value={val}
                                disabled={false}
                                onPreview={v => setPreviewIngles(prev => ({ ...prev, [k]: v }))}
                                onChange={v => guardarNotaIngles(est.id, est.grado_id, p, c, v)}
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
      {esDocente && grupos.length > 0 && (
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
            {(!esDocente || grados.length > 1) && (
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
                    {m.nombre}{esDocente && esEncargado && !misMateriasIds.has(m.id) ? ' 👁' : ''}
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
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer' },
  th:     { padding: '10px 10px', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center' },
  th2:    { padding: '6px 6px', fontSize: 10, fontWeight: 600, color: '#b0a8c0', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' },
}