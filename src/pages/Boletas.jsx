import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const API_URL = 'https://web-production-b7240a.up.railway.app'

export default function Boletas() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()

  const [grados, setGrados]             = useState([])
  const [gradoId, setGradoId]           = useState('')
  const [gradoInfo, setGradoInfo]       = useState(null)
  const [estudiantes, setEstudiantes]   = useState([])
  const [estudianteId, setEstudianteId] = useState('')
  const [periodo, setPeriodo]           = useState('1')
  const [generando, setGenerando]       = useState(false)
  const [loadingEst, setLoadingEst]     = useState(false)

  const year         = yearEscolar || new Date().getFullYear()
  const isBach       = gradoInfo?.nivel === 'bachillerato'
  const numPeriodos  = isBach ? 4 : 3
  const periodoTerm  = isBach ? 'Período' : 'Trimestre'

  const PERIODO_NAMES = ['Primer','Segundo','Tercer','Cuarto']
  const periodoOpciones = [
    ...Array.from({ length: numPeriodos }, (_, i) => ({
      value: String(i + 1),
      label: `${PERIODO_NAMES[i]} ${periodoTerm}`,
    })),
    { value: 'anual', label: 'Anual (promedio final)' },
  ]

  useEffect(() => {
    supabase.from('grados')
      .select('id, nombre, nivel, orden, componentes_nota, encargado_nombre')
      .order('orden')
      .then(({ data }) => setGrados(data || []))
  }, [])

  useEffect(() => {
    if (!gradoId) return
    setEstudianteId('')
    setLoadingEst(true)
    supabase.from('estudiantes').select('id, nombre, apellido')
      .eq('grado_id', parseInt(gradoId)).order('apellido')
      .then(({ data }) => { setEstudiantes(data || []); setLoadingEst(false) })
  }, [gradoId])

  async function generarBoleta() {
    if (!estudianteId || !gradoId) { toast.error('Selecciona grado y estudiante'); return }
    setGenerando(true)
    const toastId = toast.loading('Generando boleta...')

    try {
      const grado   = grados.find(g => g.id === parseInt(gradoId))
      const est     = estudiantes.find(e => e.id === parseInt(estudianteId))
      const comps   = (grado.componentes_nota || 'ac,ai,em,ef').split(',')
      const numPer  = grado.nivel === 'bachillerato' ? 4 : 3
      const pTerm   = grado.nivel === 'bachillerato' ? 'Período' : 'Trimestre'

      // Docente guía del grado
      const { data: docenteData } = await supabase
        .from('perfiles').select('nombre, apellido')
        .eq('rol', 'docente').eq('grado_id', parseInt(gradoId)).single()
      const encargado = docenteData
        ? `${docenteData.nombre} ${docenteData.apellido}`
        : (grado.encargado_nombre || '___________________________')

      // Materias del grado
      const { data: mgs } = await supabase
        .from('materia_grado').select('materia_id, es_complementario')
        .eq('grado_id', parseInt(gradoId))
      const matIds = (mgs || []).map(m => m.materia_id)
      const { data: matsData } = await supabase
        .from('materias').select('id, nombre').in('id', matIds).order('nombre')
      const mats = matsData || []

      // Notas del estudiante — TODOS los períodos
      const { data: notasData } = await supabase
        .from('notas').select('*')
        .eq('estudiante_id', parseInt(estudianteId))
        .eq('grado_id', parseInt(gradoId))
        .eq('año_escolar', year)

      // Mapa rápido: materia_id-periodo-tipo → nota
      const notasMap = {}
      for (const n of (notasData || [])) {
        notasMap[`${n.materia_id}-${n.periodo}-${n.tipo}`] = n.nota
      }

      // Función para obtener notas de todos los períodos de una materia
      function getNotasPorPeriodo(matId) {
        const result = {}
        for (let p = 1; p <= numPer; p++) {
          const notas = {}
          for (const c of comps) {
            notas[c] = notasMap[`${matId}-${p}-${c}`] ?? null
          }
          result[String(p)] = notas
        }
        return result
      }

      const complementariaIds = (mgs || []).filter(m => m.es_complementario).map(m => m.materia_id)
      const normales   = mats.filter(m => !complementariaIds.includes(m.id))
      const compMats   = mats.filter(m => complementariaIds.includes(m.id))

      const materiasPayload = normales.map(m => ({
        nombre: m.nombre,
        notas_por_periodo: getNotasPorPeriodo(m.id),
      }))

      let inglesPayload = null
      if (compMats.length > 0) {
        const ing = compMats[0]
        inglesPayload = {
          nombre_curso: ing.nombre,
          notas_por_periodo: getNotasPorPeriodo(ing.id),
        }
      }

      // Etiqueta del período seleccionado
      const periodoLabel = periodo === 'anual'
        ? 'Anual'
        : periodoOpciones.find(o => o.value === periodo)?.label || periodo

      const payload = {
        estudiante: {
          nombre:    est.nombre,
          apellido:  est.apellido,
          grado:     grado.nombre,
          nivel:     grado.nivel,
          encargado: encargado,
        },
        year,
        periodo_label:        periodoLabel,
        periodo_seleccionado: periodo,
        num_periodos:         numPer,
        periodo_term:         pTerm,
        componentes:          comps,
        materias:             materiasPayload,
        ingles:               inglesPayload,
        competencias_valores: {},
      }

      const response = await fetch(`${API_URL}/generar-boleta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al generar boleta')
      }

      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `boleta_${est.apellido}_${est.nombre}_${periodoLabel.replace(/ /g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Boleta generada exitosamente', { id: toastId })
    } catch (err) {
      toast.error(err.message || 'Error al generar boleta', { id: toastId })
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Boletas de Calificaciones
        </h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          Genera e imprime boletas en formato PDF · Siempre muestra todos los períodos
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 28, maxWidth: 600 }}>

        <div style={{ marginBottom: 18 }}>
          <label style={s.label}>Grado</label>
          <select style={s.select} value={gradoId} onChange={e => {
            const id = e.target.value
            setGradoId(id)
            setGradoInfo(grados.find(g => g.id === parseInt(id)) || null)
            setPeriodo('1')
          }}>
            <option value="">Selecciona un grado</option>
            {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={s.label}>Estudiante</label>
          <select style={s.select} value={estudianteId}
            onChange={e => setEstudianteId(e.target.value)}
            disabled={!gradoId || loadingEst}>
            <option value="">{loadingEst ? 'Cargando...' : 'Selecciona un estudiante'}</option>
            {estudiantes.map(e => (
              <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={s.label}>Período a emitir</label>
          <select style={s.select} value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            disabled={!gradoId}>
            {gradoId
              ? periodoOpciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
              : <option value="1">Primer Trimestre</option>
            }
          </select>
          <p style={{ fontSize: 11, color: '#b0a8c0', marginTop: 6, fontWeight: 500 }}>
            La boleta siempre muestra los {numPeriodos} {numPeriodos === 4 ? 'períodos' : 'trimestres'} — el período seleccionado aparece en el encabezado
          </p>
        </div>

        <button
          onClick={generarBoleta}
          disabled={generando || !estudianteId}
          style={{
            width: '100%', padding: '14px 0',
            background: generando || !estudianteId
              ? '#e5e7eb'
              : 'linear-gradient(135deg, #3d1f61, #5B2D8E)',
            color: generando || !estudianteId ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
            cursor: generando || !estudianteId ? 'not-allowed' : 'pointer',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.2s',
          }}
        >
          {generando ? (
            <>
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Generando PDF...
            </>
          ) : (
            <>📄 Generar Boleta PDF</>
          )}
        </button>

        {gradoInfo && (
          <div style={{ marginTop: 18, padding: '12px 16px', background: '#f3eeff', borderRadius: 10, fontSize: 12, color: '#5B2D8E', fontWeight: 600 }}>
            {gradoInfo.nombre} · {isBach ? '4 períodos' : '3 trimestres'} · {(gradoInfo.componentes_nota || 'ac,ai,em,ef').toUpperCase().replace(/,/g, ' · ')}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer', outline: 'none' },
}