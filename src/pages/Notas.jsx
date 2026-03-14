import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

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
  useEffect(() => { setLocal(value ?? '') }, [value])

  function handleChange(e) {
    const v = e.target.value
    setLocal(v)
    const n = parseFloat(v)
    if (!isNaN(n) && n >= 0 && n <= 10) onPreview?.(Math.round(n * 10) / 10)
    else if (v === '') onPreview?.(null)
  }

  function handleBlur() {
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

export default function Notas() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()

  const esDocente   = perfil?.rol === 'docente'
  const puedeEditar = ['admin', 'registro_academico', 'docente'].includes(perfil?.rol)

  const [grados, setGrados]           = useState([])
  const [gradoId, setGradoId]         = useState(null)
  const [gradoInfo, setGradoInfo]     = useState(null)
  const [materias, setMaterias]       = useState([])
  const [materiaId, setMateriaId]     = useState('todas')
  const [estudiantes, setEstudiantes] = useState([])
  const [notas, setNotas]             = useState({})
  const [preview, setPreview]         = useState({})
  const [loading, setLoading]         = useState(false)

  const componentes  = gradoInfo?.componentes_nota?.split(',') || ['ac', 'ai', 'em', 'ef']
  const numPeriodos  = gradoInfo?.nivel === 'bachillerato' ? 4 : 3
  const periodoLabel = gradoInfo?.nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'
  const nivel        = nivelColor[gradoInfo?.nivel] || nivelColor.primaria

  // Preview tiene prioridad sobre DB para el cálculo del NFT en tiempo real
  function getVal(estId, matId, periodo, tipo) {
    const key = `${estId}-${matId}-${periodo}-${tipo}`
    return preview[key] !== undefined ? preview[key] : (notas[key]?.nota ?? null)
  }
  function getNotasMap(estId, matId, periodo) {
    const map = {}
    for (const c of componentes) map[c] = getVal(estId, matId, periodo, c)
    return map
  }

  // ── Cargar grados ──────────────────────────────────────────
  useEffect(() => {
    async function cargar() {
      if (esDocente) {
        const { data } = await supabase
          .from('perfiles').select('grado_id, grados(id, nombre, nivel, orden, componentes_nota)')
          .eq('id', perfil.id).single()
        if (data?.grado_id) { setGrados([data.grados]); setGradoId(data.grado_id); setGradoInfo(data.grados) }
      } else {
        const { data } = await supabase.from('grados').select('id, nombre, nivel, orden, componentes_nota').order('orden')
        setGrados(data || [])
      }
    }
    cargar()
  }, [perfil])

  // ── Cargar materias ────────────────────────────────────────
  useEffect(() => {
    if (!gradoId) return
    async function cargar() {
      let mat = []
      if (esDocente) {
        const { data } = await supabase.from('asignaciones').select('materia_id')
          .eq('docente_id', perfil.id).eq('grado_id', gradoId).eq('año_escolar', yearEscolar || new Date().getFullYear())
        if (data?.length) {
          const { data: ms } = await supabase.from('materias').select('id, nombre').in('id', data.map(a => a.materia_id))
          mat = ms || []
        }
      } else {
        const { data: mgs } = await supabase.from('materia_grado').select('materia_id').eq('grado_id', gradoId)
        if (mgs?.length) {
          const { data: ms } = await supabase.from('materias').select('id, nombre').in('id', mgs.map(m => m.materia_id)).order('nombre')
          mat = ms || []
        }
      }
     setMaterias(mat); setMateriaId('todas')
    }
    cargar()
  }, [gradoId, yearEscolar])

  // ── Cargar estudiantes y notas ─────────────────────────────
  useEffect(() => { if (gradoId) cargarDatos() }, [gradoId, yearEscolar])

  async function cargarDatos() {
    setLoading(true); setPreview({})
    const year = yearEscolar || new Date().getFullYear()
    const [{ data: ests }, { data: ns }] = await Promise.all([
      supabase.from('estudiantes').select('id, nombre, apellido').eq('grado_id', gradoId).order('apellido'),
      supabase.from('notas').select('*').eq('grado_id', gradoId).eq('año_escolar', year),
    ])
    setEstudiantes(ests || [])
    const mapa = {}
    for (const n of (ns || [])) mapa[`${n.estudiante_id}-${n.materia_id}-${n.periodo}-${n.tipo}`] = n
    setNotas(mapa); setLoading(false)
  }

  async function guardarNota(estudianteId, matId, periodo, tipo, valor) {
    const key  = `${estudianteId}-${matId}-${periodo}-${tipo}`
    const year = yearEscolar || new Date().getFullYear()
    const existe = notas[key]

    if (valor === null) {
      if (existe) await supabase.from('notas').delete().eq('id', existe.id)
      setNotas(n => { const c = { ...n }; delete c[key]; return c })
      setPreview(p => { const c = { ...p }; delete c[key]; return c })
      return
    }

    const payload = { estudiante_id: estudianteId, materia_id: matId, grado_id: gradoId, año_escolar: year, periodo, tipo, nota: valor, docente_id: perfil.id }
    const { data } = existe
      ? await supabase.from('notas').update({ nota: valor, docente_id: perfil.id }).eq('id', existe.id).select().single()
      : await supabase.from('notas').insert(payload).select().single()
    if (data) {
      setNotas(n => ({ ...n, [key]: data }))
      setPreview(p => { const c = { ...p }; delete c[key]; return c })
    }
  }

  function setPreviewVal(estId, matId, periodo, tipo, val) {
    setPreview(p => ({ ...p, [`${estId}-${matId}-${periodo}-${tipo}`]: val }))
  }

  // ── Tabla resumen ──────────────────────────────────────────
  function TablaResumen() {
    return (
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr style={{ background: '#faf8ff' }}>
              <th style={{ ...s.th, textAlign: 'left', width: 200 }}>Estudiante</th>
              {materias.map(m => (
                <th key={m.id} style={{ ...s.th, borderLeft: '1px solid #e9e3f5' }}>
                  <div style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 auto' }} title={m.nombre}>{m.nombre}</div>
                </th>
              ))}
              <th style={{ ...s.th, borderLeft: '2px solid #c9b8e8' }}>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((est, idx) => {
              const nftsPorMateria = materias.map(m => {
                const vals = Array.from({ length: numPeriodos }, (_, i) => calcNFT(componentes, getNotasMap(est.id, m.id, i + 1))).filter(v => v !== null)
                return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
              })
              const validos = nftsPorMateria.filter(v => v !== null)
              const prom = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null
              return (
                <tr key={est.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#3d1f61', whiteSpace: 'nowrap' }}>{est.apellido}, {est.nombre}</td>
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
            {!estudiantes.length && <tr><td colSpan={99} style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>No hay estudiantes en este grado</td></tr>}
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
              <th style={{ ...s.th, textAlign: 'left', width: 200 }}>Estudiante</th>
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
                    <th key={`${i}-${c}`} style={{ ...s.th2, borderLeft: c === componentes[0] ? '2px solid #e9e3f5' : undefined }} title={FULL_LABELS[c]}>{LABELS[c]}</th>
                  ))}
                  <th key={`${i}-nft`} style={{ ...s.th2, color: '#5B2D8E', fontWeight: 800 }}>NFT</th>
                </>
              ))}
              <th style={{ ...s.th2, borderLeft: '2px solid #c9b8e8', color: '#5B2D8E', fontWeight: 800 }}>Final</th>
            </tr>
          </thead>
          <tbody>
            {estudiantes.map((est, idx) => {
              const nfts = Array.from({ length: numPeriodos }, (_, i) => calcNFT(componentes, getNotasMap(est.id, materiaId, i + 1)))
              const validos = nfts.filter(v => v !== null)
              const notaFinal = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null
              return (
                <tr key={est.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#3d1f61', whiteSpace: 'nowrap' }}>{est.apellido}, {est.nombre}</td>
                  {Array.from({ length: numPeriodos }, (_, i) => {
                    const periodo = i + 1
                    const map = getNotasMap(est.id, materiaId, periodo)
                    const nft = calcNFT(componentes, map)
                    return (
                      <>
                        {componentes.map(c => (
                          <td key={`${est.id}-${periodo}-${c}`} style={{ padding: '6px 4px', borderLeft: c === componentes[0] ? '2px solid #e9e3f5' : undefined, textAlign: 'center' }}>
                            <NotaInput
                              value={getVal(est.id, materiaId, periodo, c)}
                              disabled={!puedeEditar}
                              onPreview={v => setPreviewVal(est.id, materiaId, periodo, c, v)}
                              onChange={v => guardarNota(est.id, materiaId, periodo, c, v)}
                            />
                          </td>
                        ))}
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
            {!estudiantes.length && <tr><td colSpan={99} style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>No hay estudiantes en este grado</td></tr>}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {!esDocente && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={s.label}>Grado</label>
            <select style={s.select} value={gradoId || ''} onChange={e => {
              const id = parseInt(e.target.value)
              setGradoId(id); setGradoInfo(grados.find(g => g.id === id))
            }}>
              <option value="">Selecciona un grado</option>
              {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={s.label}>Materia</label>
          <select style={s.select} value={materiaId} onChange={e => setMateriaId(e.target.value)} disabled={!gradoId}>
            <option value="todas">Ver todas las materias</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
      </div>

      {!gradoId && (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>Selecciona un grado para comenzar</div>
        </div>
      )}
      {gradoId && !loading && !materias.length && (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📚</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61', marginBottom: 6 }}>Este grado no tiene materias asignadas</div>
        </div>
      )}
      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Cargando...</div>}
      {gradoId && !loading && !!materias.length && (materiaId === 'todas' ? <TablaResumen /> : <TablaMateria />)}
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer' },
  th:     { padding: '10px 10px', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center' },
  th2:    { padding: '6px 6px', fontSize: 10, fontWeight: 600, color: '#b0a8c0', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' },
}