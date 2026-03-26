import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const API_URL = 'https://web-production-b7240a.up.railway.app'

// ── Iconos ────────────────────────────────────
const IcoDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const IcoDownloadAll = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    <line x1="4" y1="20" x2="20" y2="20"/>
  </svg>
)
const IcoEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IcoLock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IcoFile = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d8c8f0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
  </svg>
)

// ── Helper: calcular NFT ──────────────────────
function calcNFT(notas, comps, nivel) {
  const esBach = nivel === 'bachillerato'
  const pesos = esBach
    ? { ac: 0.35, ai: 0.35, ep: 0.10, ef: 0.20 }
    : { ac: 0.35, ai: 0.35, em: 0.10, ef: 0.20 }
  let total = 0, pesoTotal = 0
  for (const c of comps) {
    const v = notas[c]
    if (v !== null && v !== undefined && v !== '') {
      total += parseFloat(v) * (pesos[c] || 0)
      pesoTotal += (pesos[c] || 0)
    }
  }
  if (pesoTotal === 0) return null
  return (total / pesoTotal).toFixed(2)
}

// ── Vista previa boleta parcial ───────────────
function VistaPreviaBoleta({ est, grado, materias, comps, periodo, periodoLabel, year }) {
  const isBach   = grado.nivel === 'bachillerato'
  const numPer   = isBach ? 4 : 3
  const pTerm    = isBach ? 'Per.' : 'Trim.'
  const compLabels = { ac: 'AC', ai: 'AI', em: 'EM', ep: 'EP', ef: 'EF' }

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden', marginTop: 20 }}>
      {/* Header boleta */}
      <div style={{ background: 'linear-gradient(135deg, #1a0d30, #3d1f61)', padding: '20px 24px', color: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>Vista previa — solo lectura</div>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Colegio Bautista Internacional de Sonsonate</div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 2 }}>Boleta de Calificaciones {year} · {periodoLabel}</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>Estudiante</div><div style={{ fontSize: 13, fontWeight: 700 }}>{est.apellido}, {est.nombre}</div></div>
          <div><div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>Grado</div><div style={{ fontSize: 13, fontWeight: 700 }}>{grado.nombre}</div></div>
          <div><div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>Docente encargado</div><div style={{ fontSize: 13, fontWeight: 700 }}>{grado.encargado_nombre || '—'}</div></div>
        </div>
      </div>

      {/* Aviso parcial */}
      <div style={{ background: '#fffbeb', borderBottom: '1px solid #fcd34d', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
        <IcoLock /> Esta es una boleta parcial — para obtener el documento físico acércate a Registro Académico
      </div>

      {/* Tabla de notas */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ ...s.th, textAlign: 'left', minWidth: 180 }}>Materia</th>
              {Array.from({ length: numPer }, (_, i) => (
                comps.map(c => (
                  <th key={`${i}-${c}`} style={s.th}>{pTerm}{i+1}<br/>{compLabels[c]}</th>
                ))
              ))}
              {Array.from({ length: numPer }, (_, i) => (
                <th key={`nft${i}`} style={{ ...s.th, background: '#f3eeff', color: '#5B2D8E' }}>NFT{i+1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materias.map((mat, mi) => (
              <tr key={mat.id} style={{ background: mi % 2 === 0 ? '#fff' : '#fdfcff', borderBottom: '1px solid #f3eeff' }}>
                <td style={{ ...s.td, fontWeight: 600, color: '#3d1f61' }}>{mat.nombre}</td>
                {Array.from({ length: numPer }, (_, pi) => (
                  comps.map(c => {
                    const val = mat.notas[pi + 1]?.[c]
                    return <td key={`${pi}-${c}`} style={{ ...s.td, textAlign: 'center', color: val !== null && val !== undefined ? '#374151' : '#e5e7eb' }}>{val !== null && val !== undefined ? val : '—'}</td>
                  })
                ))}
                {Array.from({ length: numPer }, (_, pi) => {
                  const nft = calcNFT(mat.notas[pi + 1] || {}, comps, grado.nivel)
                  return <td key={`nft${pi}`} style={{ ...s.td, textAlign: 'center', fontWeight: 800, color: '#5B2D8E', background: '#f9f7ff' }}>{nft || '—'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Boletas() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()

  const [grados,       setGrados]       = useState([])
  const [gradoId,      setGradoId]      = useState('')
  const [gradoInfo,    setGradoInfo]    = useState(null)
  const [estudiantes,  setEstudiantes]  = useState([])
  const [estudianteId, setEstudianteId] = useState('')
  const [periodo,      setPeriodo]      = useState('1')
  const [generando,    setGenerando]    = useState(false)
  const [generandoTodos, setGenerandoTodos] = useState(false)
  const [loadingEst,   setLoadingEst]   = useState(false)
  const [previewData,  setPreviewData]  = useState(null) // datos para vista previa parcial
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [publicaciones,  setPublicaciones]  = useState([]) // periodos publicados para el grado
  const [publicando,     setPublicando]     = useState(false)
  const [progreso,     setProgreso]     = useState(null) // para generar todos

  const year        = yearEscolar || new Date().getFullYear()
  const isBach      = gradoInfo?.nivel === 'bachillerato'
  const numPeriodos = isBach ? 4 : 3
  const periodoTerm = isBach ? 'Período' : 'Trimestre'
  const esFinal     = periodo === 'anual'

  const PERIODO_NAMES = ['Primer','Segundo','Tercer','Cuarto']
  const periodoOpciones = [
    ...Array.from({ length: numPeriodos }, (_, i) => ({
      value: String(i + 1),
      label: `${PERIODO_NAMES[i]} ${periodoTerm}`,
    })),
    { value: 'anual', label: 'Anual — Boleta Final' },
  ]

  useEffect(() => {
    supabase.from('grados').select('id, nombre, nivel, orden, componentes_nota, encargado_nombre')
      .order('orden').then(({ data }) => setGrados(data || []))
  }, [])

  useEffect(() => {
    if (!gradoId) return
    setEstudianteId('')
    setPreviewData(null)
    setLoadingEst(true)
    supabase.from('estudiantes').select('id, nombre, apellido')
      .eq('grado_id', parseInt(gradoId)).eq('estado', 'activo').order('apellido')
      .then(({ data }) => { setEstudiantes(data || []); setLoadingEst(false) })
  }, [gradoId])

  // Al cambiar estudiante o período, cargar vista previa si es parcial
  useEffect(() => {
    if (!estudianteId || !gradoId || esFinal) { setPreviewData(null); return }
    cargarPreview()
  }, [estudianteId, gradoId, periodo])

  async function cargarPreview() {
    setLoadingPreview(true)
    const grado = grados.find(g => g.id === parseInt(gradoId))
    const est   = estudiantes.find(e => e.id === parseInt(estudianteId))
    if (!grado || !est) { setLoadingPreview(false); return }

    const comps  = (grado.componentes_nota || 'ac,ai,em,ef').split(',')
    const numPer = grado.nivel === 'bachillerato' ? 4 : 3

    const { data: mgs } = await supabase.from('materia_grado')
      .select('materia_id, es_complementario').eq('grado_id', parseInt(gradoId))
    const matIds = (mgs || []).map(m => m.materia_id)
    const { data: matsData } = await supabase.from('materias')
      .select('id, nombre').in('id', matIds).order('nombre')

    const { data: notasData } = await supabase.from('notas').select('*')
      .eq('estudiante_id', parseInt(estudianteId))
      .eq('grado_id', parseInt(gradoId))
      .eq('año_escolar', year)

    const notasMap = {}
    for (const n of (notasData || [])) {
      notasMap[`${n.materia_id}-${n.periodo}-${n.tipo}`] = n.nota
    }

    const materias = (matsData || []).map(m => {
      const notas = {}
      for (let p = 1; p <= numPer; p++) {
        notas[p] = {}
        for (const c of comps) notas[p][c] = notasMap[`${m.id}-${p}-${c}`] ?? null
      }
      return { id: m.id, nombre: m.nombre, notas }
    })

    setPreviewData({ est, grado, materias, comps })
    setLoadingPreview(false)
  }

  // ── Construir payload para la API ─────────────
  async function buildPayload(est, gradoId) {
    const grado  = grados.find(g => g.id === parseInt(gradoId))
    const comps  = (grado.componentes_nota || 'ac,ai,em,ef').split(',')
    const numPer = grado.nivel === 'bachillerato' ? 4 : 3
    const pTerm  = grado.nivel === 'bachillerato' ? 'Período' : 'Trimestre'

    const { data: mgs } = await supabase.from('materia_grado')
      .select('materia_id, es_complementario').eq('grado_id', parseInt(gradoId))
    const matIds = (mgs || []).map(m => m.materia_id)
    const { data: matsData } = await supabase.from('materias')
      .select('id, nombre').in('id', matIds).order('nombre')
    const mats = matsData || []

    const { data: notasData } = await supabase.from('notas').select('*')
      .eq('estudiante_id', est.id)
      .eq('grado_id', parseInt(gradoId))
      .eq('año_escolar', year)

    const notasMap = {}
    for (const n of (notasData || [])) {
      notasMap[`${n.materia_id}-${n.periodo}-${n.tipo}`] = n.nota
    }

    function getNotasPorPeriodo(matId) {
      const result = {}
      for (let p = 1; p <= numPer; p++) {
        const notas = {}
        for (const c of comps) notas[c] = notasMap[`${matId}-${p}-${c}`] ?? null
        result[String(p)] = notas
      }
      return result
    }

    const complementariaIds = (mgs || []).filter(m => m.es_complementario).map(m => m.materia_id)
    const normales  = mats.filter(m => !complementariaIds.includes(m.id))
    const compMats  = mats.filter(m => complementariaIds.includes(m.id))

    const materiasPayload = normales.map(m => ({
      nombre: m.nombre,
      notas_por_periodo: getNotasPorPeriodo(m.id),
    }))

    let inglesPayload = null
    if (compMats.length > 0) {
      inglesPayload = {
        nombre_curso: compMats[0].nombre,
        notas_por_periodo: getNotasPorPeriodo(compMats[0].id),
      }
    }

    return {
      estudiante: {
        nombre: est.nombre, apellido: est.apellido,
        grado: grado.nombre, nivel: grado.nivel,
        encargado: grado.encargado_nombre || '—',
      },
      year,
      periodo_label: 'Anual',
      periodo_seleccionado: 'anual',
      num_periodos: numPer,
      periodo_term: pTerm,
      componentes: comps,
      materias: materiasPayload,
      ingles: inglesPayload,
      competencias_valores: {},
    }
  }

  // ── Generar boleta individual ─────────────────
  async function generarBoleta() {
    if (!estudianteId || !gradoId) { toast.error('Selecciona grado y estudiante'); return }
    setGenerando(true)
    const toastId = toast.loading('Generando boleta final...')
    try {
      const est     = estudiantes.find(e => e.id === parseInt(estudianteId))
      const payload = await buildPayload(est, gradoId)
      const response = await fetch(`${API_URL}/generar-boleta`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Error') }
      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `boleta_final_${est.apellido}_${est.nombre}_${year}.pdf`
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url); document.body.removeChild(a)
      toast.success('Boleta generada', { id: toastId })
    } catch (err) {
      toast.error(err.message || 'Error al generar', { id: toastId })
    } finally { setGenerando(false) }
  }

  // ── Generar todos — un solo PDF ──────────────
  async function generarTodos() {
    if (!gradoId || estudiantes.length === 0) return
    if (!window.confirm(`¿Generar un PDF con las boletas finales de los ${estudiantes.length} estudiantes de ${gradoInfo?.nombre}?`)) return

    setGenerandoTodos(true)
    setProgreso({ actual: 0, total: estudiantes.length, nombre: 'Preparando...' })
    const toastId = toast.loading(`Preparando ${estudiantes.length} boletas...`)

    try {
      // Construir todos los payloads
      const boletas = []
      for (let i = 0; i < estudiantes.length; i++) {
        const est = estudiantes[i]
        setProgreso({ actual: i + 1, total: estudiantes.length, nombre: `${est.apellido}, ${est.nombre}` })
        const payload = await buildPayload(est, gradoId)
        boletas.push(payload)
      }

      // Enviar al endpoint de lote
      setProgreso({ actual: estudiantes.length, total: estudiantes.length, nombre: 'Generando PDF...' })
      const response = await fetch(`${API_URL}/generar-boletas-lote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grado:   gradoInfo?.nombre,
          year,
          boletas,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al generar PDF')
      }

      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `boletas_finales_${gradoInfo?.nombre?.replace(/ /g, '_')}_${year}.pdf`
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url); document.body.removeChild(a)

      toast.success(`PDF con ${estudiantes.length} boletas descargado`, { id: toastId, duration: 5000 })
    } catch (err) {
      toast.error(err.message || 'Error al generar', { id: toastId })
    } finally {
      setGenerandoTodos(false)
      setProgreso(null)
    }
  }

  async function publicarBoleta() {
    if (!gradoId) return
    const yaPublicada = publicaciones.find(p => p.periodo === periodo)
    if (yaPublicada) {
      // Despublicar
      if (!window.confirm('¿Quitar la publicación de esta boleta? Los alumnos ya no podrán verla.')) return
      setPublicando(true)
      await supabase.from('boletas_publicadas').update({ activo: false }).eq('id', yaPublicada.id)
      toast.success('Boleta despublicada')
    } else {
      if (!window.confirm(`¿Publicar la boleta de ${periodoLabel} para ${gradoInfo?.nombre}? Los alumnos podrán verla si cumplen los requisitos.`)) return
      setPublicando(true)
      await supabase.from('boletas_publicadas')
        .upsert({ grado_id: parseInt(gradoId), año_escolar: year, periodo, publicado_por: perfil.id, activo: true }, { onConflict: 'grado_id,año_escolar,periodo' })
      toast.success('Boleta publicada — alumnos elegibles ya pueden verla')
    }
    const { data } = await supabase.from('boletas_publicadas').select('id, periodo, activo')
      .eq('grado_id', parseInt(gradoId)).eq('año_escolar', year).eq('activo', true)
    setPublicaciones(data || [])
    setPublicando(false)
  }

  const periodoLabel = periodoOpciones.find(o => o.value === periodo)?.label || periodo

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Boletas de Calificaciones
        </h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          Boletas parciales — vista previa · Boletas finales — descarga PDF
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 380px) 1fr', gap: 20, alignItems: 'start' }}>

        {/* Panel izquierdo — controles */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 24 }}>

          {/* Grado */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Grado</label>
            <select style={s.select} value={gradoId} onChange={e => {
              const id = e.target.value
              setGradoId(id)
              setGradoInfo(grados.find(g => g.id === parseInt(id)) || null)
              setPeriodo('1')
              setPreviewData(null)
            }}>
              <option value="">Selecciona un grado</option>
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

          {/* Período */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Período</label>
            <select style={s.select} value={periodo}
              onChange={e => { setPeriodo(e.target.value); setPreviewData(null) }}
              disabled={!gradoId}>
              {gradoId
                ? periodoOpciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
                : <option value="1">Primer Trimestre</option>}
            </select>
          </div>

          {/* Estudiante */}
          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Estudiante</label>
            <select style={s.select} value={estudianteId}
              onChange={e => setEstudianteId(e.target.value)}
              disabled={!gradoId || loadingEst}>
              <option value="">{loadingEst ? 'Cargando...' : 'Selecciona un estudiante'}</option>
              {estudiantes.map(e => <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>)}
            </select>
          </div>

          {/* Info del grado */}
          {gradoInfo && (
            <div style={{ padding: '10px 14px', background: '#f3eeff', borderRadius: 10, fontSize: 12, color: '#5B2D8E', fontWeight: 600, marginBottom: 20 }}>
              {gradoInfo.nombre} · {isBach ? '4 períodos' : '3 trimestres'} · {(gradoInfo.componentes_nota || 'ac,ai,em,ef').toUpperCase().replace(/,/g, ' · ')}
            </div>
          )}

          {/* Botón publicar */}
          {gradoId && (() => {
            const yaPublicada = publicaciones.find(p => p.periodo === periodo)
            return (
              <div style={{ marginBottom: 16 }}>
                <button onClick={publicarBoleta} disabled={publicando}
                  style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1.5px solid ${yaPublicada ? '#86efac' : '#e5e7eb'}`, background: yaPublicada ? '#f0fdf4' : '#f9fafb', color: yaPublicada ? '#166534' : '#6b7280', fontWeight: 700, fontSize: 12, cursor: publicando ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {publicando ? 'Procesando...' : yaPublicada ? '✓ Publicada — clic para despublicar' : 'Publicar boleta para alumnos'}
                </button>
              </div>
            )
          })()}

          {/* Aviso parcial */}
          {gradoId && !esFinal && (
            <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 10, fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <IcoLock />
              <span>Las boletas parciales son solo de consulta. Para el documento físico el alumno o padre debe acercarse a Registro Académico.</span>
            </div>
          )}

          {/* Botones */}
          {esFinal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Individual */}
              <button onClick={generarBoleta} disabled={generando || !estudianteId}
                style={{ width: '100%', padding: '13px 0', background: generando || !estudianteId ? '#e5e7eb' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: generando || !estudianteId ? '#9ca3af' : '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: generando || !estudianteId ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {generando ? (
                  <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generando...</>
                ) : (
                  <><IcoDownload /> Descargar boleta final</>
                )}
              </button>

              {/* Todos */}
              <button onClick={generarTodos} disabled={generandoTodos || !gradoId || estudiantes.length === 0}
                style={{ width: '100%', padding: '13px 0', background: generandoTodos || !gradoId ? '#f3eeff' : '#f3eeff', color: generandoTodos ? '#b0a8c0' : '#5B2D8E', border: '2px solid #5B2D8E', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: generandoTodos || !gradoId ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {generandoTodos ? (
                  <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #5B2D8E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Generando...</>
                ) : (
                  <><IcoDownloadAll /> Descargar todos en un PDF ({estudiantes.length} estudiantes)</>
                )}
              </button>

              {/* Progreso */}
              {progreso && (
                <div style={{ padding: '12px 14px', background: '#f3eeff', borderRadius: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: '#5B2D8E' }}>{progreso.actual} de {progreso.total}</span>
                    <span style={{ color: '#b0a8c0' }}>{Math.round((progreso.actual / progreso.total) * 100)}%</span>
                  </div>
                  <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', background: '#5B2D8E', borderRadius: 2, width: `${(progreso.actual / progreso.total) * 100}%`, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{progreso.nombre}</div>
                </div>
              )}
            </div>
          ) : (
            <button disabled={!estudianteId || loadingPreview}
              style={{ width: '100%', padding: '13px 0', background: estudianteId ? '#f3eeff' : '#f9fafb', color: estudianteId ? '#5B2D8E' : '#b0a8c0', border: `2px solid ${estudianteId ? '#5B2D8E' : '#e5e7eb'}`, borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loadingPreview ? (
                <><span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid #5B2D8E`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Cargando vista previa...</>
              ) : (
                <><IcoEye /> Ver notas</>
              )}
            </button>
          )}
        </div>

        {/* Panel derecho — vista previa o instrucciones */}
        <div>
          {!gradoId ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', color: '#b0a8c0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><IcoFile /></div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Selecciona un grado para comenzar</div>
            </div>
          ) : esFinal ? (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', marginBottom: 12 }}>Boletas Finales — {gradoInfo?.nombre}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
                Las boletas finales incluyen todos los {numPeriodos} {numPeriodos === 4 ? 'períodos/bimestres' : 'trimestres'} del año {year}.
                <br/><br/>
                <strong>Individual:</strong> selecciona un estudiante y descarga su boleta.<br/>
                <strong>Todos:</strong> genera y descarga las boletas de todos los estudiantes del grado una por una. El proceso puede tomar varios minutos dependiendo del número de estudiantes.
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, fontSize: 12, color: '#166534', fontWeight: 600 }}>
                {estudiantes.length} estudiantes en {gradoInfo?.nombre}
              </div>
            </div>
          ) : previewData ? (
            <VistaPreviaBoleta
              est={previewData.est}
              grado={previewData.grado}
              materias={previewData.materias}
              comps={previewData.comps}
              periodo={periodo}
              periodoLabel={periodoLabel}
              year={year}
            />
          ) : estudianteId ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', color: '#b0a8c0' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Selecciona un período para ver la vista previa</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', color: '#b0a8c0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><IcoFile /></div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Selecciona un estudiante para ver su boleta</div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer', outline: 'none' },
  th:     { padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.3px', textAlign: 'center', borderBottom: '2px solid #f3eeff', whiteSpace: 'nowrap' },
  td:     { padding: '8px 10px', fontSize: 12, color: '#374151', verticalAlign: 'middle', borderBottom: '1px solid #f9fafb' },
}