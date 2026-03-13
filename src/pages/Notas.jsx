import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const nivelPeriodos = (nivel) =>
  ['bachillerato'].includes(nivel) ? 4 : 3

const nivelColor = {
  primera_infancia: { bg: '#e0f7f6', color: '#0e9490' },
  inicial:          { bg: '#e0f7f6', color: '#0e9490' },
  primaria:         { bg: '#fef9c3', color: '#a16207' },
  secundaria:       { bg: '#fff0e6', color: '#c2410c' },
  bachillerato:     { bg: '#f3eeff', color: '#5B2D8E' },
}

function promedio(vals) {
  const v = vals.filter(x => x !== null && x !== undefined && x !== '')
  if (!v.length) return null
  return v.reduce((a, b) => a + parseFloat(b), 0) / v.length
}

function NotaInput({ value, onChange, disabled }) {
  const [local, setLocal] = useState(value ?? '')
  useEffect(() => setLocal(value ?? ''), [value])

  function handleBlur() {
    const n = parseFloat(local)
    if (local === '') { onChange(null); return }
    if (isNaN(n) || n < 0 || n > 10) {
      toast.error('Nota debe ser entre 0 y 10')
      setLocal(value ?? '')
      return
    }
    onChange(Math.round(n * 10) / 10)
  }

  return (
    <input
      type="number" min="0" max="10" step="0.1"
      value={local}
      disabled={disabled}
      onChange={e => setLocal(e.target.value)}
      onBlur={handleBlur}
      style={{
        width: 54, padding: '5px 6px', borderRadius: 7, textAlign: 'center',
        border: '1.5px solid #e5e7eb', fontSize: 13, fontWeight: 600,
        background: disabled ? '#f9fafb' : '#fff',
        color: local === '' ? '#ccc' : parseFloat(local) < 5 ? '#dc2626' : '#3d1f61',
        fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
        outline: 'none',
      }}
    />
  )
}

export default function Notas() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()

  const esDocente   = perfil?.rol === 'docente'
  const esAdmin     = ['admin', 'direccion_academica', 'registro_academico'].includes(perfil?.rol)
  const puedeEditar = ['admin', 'registro_academico', 'docente'].includes(perfil?.rol)

  const [grados, setGrados]               = useState([])
  const [gradoId, setGradoId]             = useState(null)
  const [gradoInfo, setGradoInfo]         = useState(null)
  const [materias, setMaterias]           = useState([])  // asignadas al grado
  const [materiaId, setMateriaId]         = useState(null)
  const [estudiantes, setEstudiantes]     = useState([])
  const [notas, setNotas]                 = useState({})  // key: est_id-periodo-tipo
  const [saving, setSaving]               = useState({})
  const [loading, setLoading]             = useState(false)

  // Cargar grados disponibles
  useEffect(() => {
    async function cargar() {
      if (esDocente) {
        // Solo el grado asignado al docente
        const { data } = await supabase
          .from('perfiles').select('grado_id, grados(id, nombre, nivel, orden)')
          .eq('id', perfil.id).single()
        if (data?.grado_id) {
          setGrados([data.grados])
          setGradoId(data.grado_id)
          setGradoInfo(data.grados)
        }
      } else {
        const { data } = await supabase
          .from('grados').select('id, nombre, nivel, orden').order('orden')
        setGrados(data || [])
      }
    }
    cargar()
  }, [perfil])

  // Cargar materias del grado (via materia_grado + asignaciones para docente)
  useEffect(() => {
    if (!gradoId || !yearEscolar) return
    async function cargar() {
      if (esDocente) {
        const { data } = await supabase
          .from('asignaciones')
          .select('materia_id, materias(id, nombre)')
          .eq('docente_id', perfil.id)
          .eq('grado_id', gradoId)
          .eq('año_escolar', yearEscolar)
        setMaterias(data?.map(a => a.materias) || [])
      } else {
        const { data } = await supabase
          .from('materia_grado')
          .select('materia_id, materias(id, nombre)')
          .eq('grado_id', gradoId)
        setMaterias(data?.map(m => m.materias) || [])
      }
      setMateriaId(null)
      setEstudiantes([])
      setNotas({})
    }
    cargar()
  }, [gradoId, yearEscolar])

  // Cargar estudiantes y notas al seleccionar materia
  useEffect(() => {
    if (!materiaId || !gradoId || !yearEscolar) return
    cargarNotasMateria()
  }, [materiaId, gradoId, yearEscolar])

  async function cargarNotasMateria() {
    setLoading(true)
    const [{ data: ests }, { data: ns }] = await Promise.all([
      supabase.from('estudiantes')
        .select('id, nombre, apellido')
        .eq('grado_id', gradoId)
        .eq('activo', true)
        .order('apellido'),
      supabase.from('notas')
        .select('*')
        .eq('materia_id', materiaId)
        .eq('grado_id', gradoId)
        .eq('año_escolar', yearEscolar),
    ])
    setEstudiantes(ests || [])
    const mapa = {}
    for (const n of (ns || [])) {
      mapa[`${n.estudiante_id}-${n.periodo}-${n.tipo}`] = n
    }
    setNotas(mapa)
    setLoading(false)
  }

  async function guardarNota(estudianteId, periodo, tipo, valor) {
    const key = `${estudianteId}-${periodo}-${tipo}`
    setSaving(s => ({ ...s, [key]: true }))

    const existe = notas[key]
    if (valor === null) {
      // Borrar si existe
      if (existe) {
        await supabase.from('notas').delete().eq('id', existe.id)
        setNotas(n => { const c = { ...n }; delete c[key]; return c })
      }
      setSaving(s => ({ ...s, [key]: false }))
      return
    }

    if (existe) {
      const { data } = await supabase.from('notas')
        .update({ nota: valor, docente_id: perfil.id })
        .eq('id', existe.id).select().single()
      if (data) setNotas(n => ({ ...n, [key]: data }))
    } else {
      const { data } = await supabase.from('notas')
        .insert({ estudiante_id: estudianteId, materia_id: materiaId, grado_id: gradoId,
                  año_escolar: yearEscolar, periodo, tipo, nota: valor, docente_id: perfil.id })
        .select().single()
      if (data) setNotas(n => ({ ...n, [key]: data }))
    }
    setSaving(s => ({ ...s, [key]: false }))
  }

  function getNota(estId, periodo, tipo) {
    return notas[`${estId}-${periodo}-${tipo}`]?.nota ?? null
  }

  const numPeriodos = nivelPeriodos(gradoInfo?.nivel)
  const nivel       = nivelColor[gradoInfo?.nivel] || nivelColor.primaria

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* ── Selectores ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {!esDocente && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={s.label}>Grado</label>
            <select style={s.select} value={gradoId || ''} onChange={e => {
              const id = parseInt(e.target.value)
              setGradoId(id)
              setGradoInfo(grados.find(g => g.id === id))
            }}>
              <option value="">Selecciona un grado</option>
              {grados.map(g => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={s.label}>Materia</label>
          <select style={s.select} value={materiaId || ''} onChange={e => setMateriaId(e.target.value)}
            disabled={!gradoId}>
            <option value="">Selecciona una materia</option>
            {materias.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Estado vacío ─────────────────────────────────────── */}
      {!materiaId && (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61', marginBottom: 6 }}>
            {!gradoId ? 'Selecciona un grado para comenzar' : 'Selecciona una materia para ver las notas'}
          </div>
          <div style={{ fontSize: 13, color: '#b0a8c0' }}>
            {materias.length === 0 && gradoId ? 'Este grado no tiene materias asignadas aún.' : ''}
          </div>
        </div>
      )}

      {/* ── Tabla de notas ───────────────────────────────────── */}
      {materiaId && !loading && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'auto' }}>

          {/* Info grado + materia */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3eeff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ ...nivel, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {gradoInfo?.nombre}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>
              {materias.find(m => m.id === materiaId)?.nombre}
            </span>
            <span style={{ fontSize: 12, color: '#b0a8c0', marginLeft: 'auto' }}>
              {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''}
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#faf8ff' }}>
                <th style={{ ...s.th, width: 200, textAlign: 'left' }}>Estudiante</th>
                {Array.from({ length: numPeriodos }, (_, i) => i + 1).map(p => (
                  <th key={p} colSpan={3} style={{ ...s.th, borderLeft: '2px solid #e9e3f5' }}>
                    {gradoInfo?.nivel === 'bachillerato' ? `Bimestre ${p}` : `Trimestre ${p}`}
                  </th>
                ))}
                <th style={{ ...s.th, borderLeft: '2px solid #e9e3f5' }}>Final</th>
              </tr>
              <tr style={{ background: '#f5f3ff' }}>
                <th style={s.th2} />
                {Array.from({ length: numPeriodos }, (_, i) => i + 1).map(p => (
                  <>
                    <th key={`${p}-ord`} style={{ ...s.th2, borderLeft: '2px solid #e9e3f5' }}>Ord.</th>
                    <th key={`${p}-exa`} style={s.th2}>Exam.</th>
                    <th key={`${p}-prom`} style={s.th2}>Prom.</th>
                  </>
                ))}
                <th style={{ ...s.th2, borderLeft: '2px solid #e9e3f5' }}>Nota</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est, idx) => {
                const promediosPeriodo = Array.from({ length: numPeriodos }, (_, i) => {
                  const ord  = getNota(est.id, i + 1, 'ordinaria')
                  const exa  = getNota(est.id, i + 1, 'examen')
                  return promedio([ord, exa])
                })
                const notaFinal = promedio(promediosPeriodo)

                return (
                  <tr key={est.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#3d1f61' }}>
                      {est.apellido}, {est.nombre}
                    </td>
                    {Array.from({ length: numPeriodos }, (_, i) => {
                      const periodo = i + 1
                      const ord  = getNota(est.id, periodo, 'ordinaria')
                      const exa  = getNota(est.id, periodo, 'examen')
                      const prom = promedio([ord, exa])
                      return (
                        <>
                          <td key={`${est.id}-${periodo}-ord`} style={{ padding: '6px 8px', borderLeft: '2px solid #e9e3f5', textAlign: 'center' }}>
                            <NotaInput
                              value={ord}
                              disabled={!puedeEditar}
                              onChange={v => guardarNota(est.id, periodo, 'ordinaria', v)}
                            />
                          </td>
                          <td key={`${est.id}-${periodo}-exa`} style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <NotaInput
                              value={exa}
                              disabled={!puedeEditar}
                              onChange={v => guardarNota(est.id, periodo, 'examen', v)}
                            />
                          </td>
                          <td key={`${est.id}-${periodo}-prom`} style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{
                              fontSize: 13, fontWeight: 700,
                              color: prom === null ? '#ccc' : prom < 5 ? '#dc2626' : prom < 7 ? '#a16207' : '#16a34a'
                            }}>
                              {prom !== null ? prom.toFixed(1) : '—'}
                            </span>
                          </td>
                        </>
                      )
                    })}
                    <td style={{ padding: '6px 16px', borderLeft: '2px solid #e9e3f5', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 800,
                        color: notaFinal === null ? '#ccc' : notaFinal < 5 ? '#dc2626' : notaFinal < 7 ? '#a16207' : '#16a34a'
                      }}>
                        {notaFinal !== null ? notaFinal.toFixed(1) : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {estudiantes.length === 0 && (
                <tr>
                  <td colSpan={99} style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>
                    No hay estudiantes en este grado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {materiaId && loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Cargando...</div>
      )}
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer' },
  th:     { padding: '10px 12px', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center' },
  th2:    { padding: '6px 8px', fontSize: 10, fontWeight: 600, color: '#b0a8c0', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' },
}