import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const API_URL = 'https://web-production-b7240a.up.railway.app'

const PESOS = { ac: 0.35, ai: 0.35, em: 0.10, ep: 0.10, ef: 0.20 }

function calcNFT(componentes, notasMap) {
  const vals = componentes.map(c => notasMap[c])
  if (vals.some(v => v === null || v === undefined)) return null
  return componentes.reduce((sum, c) => sum + parseFloat(notasMap[c]) * PESOS[c], 0)
}

export default function Boletas() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()

  const [grados, setGrados]           = useState([])
  const [gradoId, setGradoId]         = useState('')
  const [gradoInfo, setGradoInfo]     = useState(null)
  const [estudiantes, setEstudiantes] = useState([])
  const [estudianteId, setEstudianteId] = useState('')
  const [periodo, setPeriodo]         = useState('1')
  const [generando, setGenerando]     = useState(false)
  const [loading, setLoading]         = useState(false)

  const year = yearEscolar || new Date().getFullYear()
  const esBachillerato = gradoInfo?.nivel === 'bachillerato'
  const numPeriodos    = esBachillerato ? 4 : 3
  const periodoTerm    = esBachillerato ? 'Período' : 'Trimestre'

  const periodoOpciones = [
    ...Array.from({ length: numPeriodos }, (_, i) => ({
      value: String(i + 1),
      label: `${['Primer','Segundo','Tercer','Cuarto'][i]} ${periodoTerm}`,
    })),
    { value: 'anual', label: 'Anual (promedio final)' },
  ]

  // Cargar grados
  useEffect(() => {
    supabase.from('grados').select('id, nombre, nivel, orden, componentes_nota, encargado_nombre')
      .order('orden')
      .then(({ data }) => setGrados(data || []))
  }, [])

  // Cargar estudiantes al cambiar grado
  useEffect(() => {
    if (!gradoId) return
    setEstudianteId('')
    setLoading(true)
    supabase.from('estudiantes').select('id, nombre, apellido')
      .eq('grado_id', parseInt(gradoId)).order('apellido')
      .then(({ data }) => { setEstudiantes(data || []); setLoading(false) })
  }, [gradoId])

  async function generarBoleta() {
    if (!estudianteId || !gradoId) {
      toast.error('Selecciona grado y estudiante')
      return
    }
    setGenerando(true)
    const toastId = toast.loading('Generando boleta...')

    try {
      const grado    = grados.find(g => g.id === parseInt(gradoId))
      const est      = estudiantes.find(e => e.id === parseInt(estudianteId))
      const comps    = (grado.componentes_nota || 'ac,ai,em,ef').split(',')
      const isBach   = grado.nivel === 'bachillerato'
      const numPer   = isBach ? 4 : 3
      const pTerm    = isBach ? 'Período' : 'Trimestre'
      const periodosNums = periodo === 'anual'
        ? Array.from({ length: numPer }, (_, i) => i + 1)
        : [parseInt(periodo)]

      // Cargar encargado del grado (docente guía)
      // Buscar en perfiles el docente con grado_id = gradoId
      const { data: docenteData } = await supabase
        .from('perfiles')
        .select('nombre, apellido')
        .eq('rol', 'docente')
        .eq('grado_id', parseInt(gradoId))
        .single()

      const encargado = docenteData
        ? `${docenteData.nombre} ${docenteData.apellido}`
        : (grado.encargado_nombre || '___________________________')

      // Cargar materias del grado
      const { data: mgs } = await supabase
        .from('materia_grado')
        .select('materia_id, es_complementario')
        .eq('grado_id', parseInt(gradoId))

      const matIds = (mgs || []).map(m => m.materia_id)
      const { data: matsData } = await supabase
        .from('materias').select('id, nombre').in('id', matIds).order('nombre')
      const mats = matsData || []

      // Cargar notas del estudiante
      const { data: notasData } = await supabase
        .from('notas').select('*')
        .eq('estudiante_id', parseInt(estudianteId))
        .eq('grado_id', parseInt(gradoId))
        .eq('año_escolar', year)

      // Mapear notas
      const notasMap = {}
      for (const n of (notasData || [])) {
        const key = `${n.materia_id}-${n.periodo}-${n.tipo}`
        notasMap[key] = n.nota
      }

      // Construir materias con notas según periodo
      const complementarias = (mgs || []).filter(m => m.es_complementario).map(m => m.materia_id)
      const materiasNormales = mats.filter(m => !complementarias.includes(m.id))
      const materiasComp     = mats.filter(m => complementarias.includes(m.id))

      function getNotasMateria(matId) {
        if (periodo === 'anual') {
          // Para boleta anual mandamos los promedios de cada periodo como "notas"
          // El API calcula NFT de cada periodo y promedia
          // Simplificamos: mandamos notas del primer periodo disponible
          // y dejamos que el servidor lo maneje periodo por periodo
          const notas = {}
          for (const c of comps) {
            const vals = periodosNums.map(p => notasMap[`${matId}-${p}-${c}`]).filter(v => v != null)
            notas[c] = vals.length ? vals.reduce((a, b) => a + parseFloat(b), 0) / vals.length : null
          }
          return notas
        } else {
          const p = parseInt(periodo)
          const notas = {}
          for (const c of comps) {
            notas[c] = notasMap[`${matId}-${p}-${c}`] ?? null
          }
          return notas
        }
      }

      const materiasPayload = materiasNormales.map(m => ({
        nombre: m.nombre,
        notas: getNotasMateria(m.id),
      }))

      // Inglés complementario
      let inglesPayload = null
      if (materiasComp.length > 0) {
        const ing = materiasComp[0]
        inglesPayload = {
          nombre_curso: ing.nombre,
          notas: getNotasMateria(ing.id),
        }
      }

      // Periodo label
      const periodoLabel = periodo === 'anual'
        ? 'Anual'
        : periodoOpciones.find(o => o.value === periodo)?.label || periodo

      // Payload para la API
      const payload = {
        estudiante: {
          nombre:    est.nombre,
          apellido:  est.apellido,
          grado:     grado.nombre,
          nivel:     grado.nivel,
          encargado: encargado,
        },
        year,
        periodo_label: periodoLabel,
        num_periodos:  numPer,
        periodo_term:  pTerm,
        componentes:   comps,
        materias:      materiasPayload,
        ingles:        inglesPayload,
        competencias_valores: {},
      }

      // Llamar a la API
      const response = await fetch(`${API_URL}/generar-boleta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al generar boleta')
      }

      // Descargar PDF
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

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Boletas de Calificaciones
        </h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          Genera e imprime boletas en formato PDF
        </p>
      </div>

      {/* Form card */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 28, maxWidth: 600 }}>

        {/* Grado */}
        <div style={{ marginBottom: 18 }}>
          <label style={s.label}>Grado</label>
          <select style={s.select} value={gradoId} onChange={e => {
            setGradoId(e.target.value)
            setGradoInfo(grados.find(g => g.id === parseInt(e.target.value)) || null)
            setPeriodo('1')
          }}>
            <option value="">Selecciona un grado</option>
            {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>

        {/* Estudiante */}
        <div style={{ marginBottom: 18 }}>
          <label style={s.label}>Estudiante</label>
          <select style={s.select} value={estudianteId}
            onChange={e => setEstudianteId(e.target.value)}
            disabled={!gradoId || loading}>
            <option value="">{loading ? 'Cargando...' : 'Selecciona un estudiante'}</option>
            {estudiantes.map(e => (
              <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>
            ))}
          </select>
        </div>

        {/* Período */}
        <div style={{ marginBottom: 28 }}>
          <label style={s.label}>Período</label>
          <select style={s.select} value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            disabled={!gradoId}>
            {gradoId ? periodoOpciones.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            )) : <option value="1">Primer Trimestre</option>}
          </select>
        </div>

        {/* Botón */}
        <button
          onClick={generarBoleta}
          disabled={generando || !estudianteId}
          style={{
            width: '100%', padding: '14px 0',
            background: generando || !estudianteId ? '#e5e7eb' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)',
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
            <>
              📄 Generar Boleta PDF
            </>
          )}
        </button>

        {/* Info */}
        {gradoInfo && (
          <div style={{ marginTop: 18, padding: '12px 16px', background: '#f3eeff', borderRadius: 10, fontSize: 12, color: '#5B2D8E', fontWeight: 600 }}>
            {gradoInfo.nombre} · {esBachillerato ? '4 períodos' : '3 trimestres'} · Componentes: {(gradoInfo.componentes_nota || 'ac,ai,em,ef').toUpperCase().replace(/,/g, ' · ')}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer', outline: 'none' },
}