import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'

// ── Iconos ────────────────────────────────────
const IcoLock = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d8c8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)
const IcoAlert = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoClock = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d8c8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const PESOS = { ac: 0.35, ai: 0.35, em: 0.10, ep: 0.10, ef: 0.20 }
const COMP_LABELS = { ac: 'AC', ai: 'AI', em: 'EM', ep: 'EP', ef: 'EF' }

function calcNFT(notas, comps) {
  const vals = comps.map(c => notas[c])
  if (vals.some(v => v === null || v === undefined)) return null
  return comps.reduce((sum, c) => sum + (notas[c] * (PESOS[c] || 0)), 0)
}

function notaColor(n) {
  if (n === null || n === undefined) return '#b0a8c0'
  if (n < 5)  return '#dc2626'
  if (n < 7)  return '#d97706'
  return '#16a34a'
}

function notaBg(n) {
  if (n === null || n === undefined) return 'transparent'
  if (n < 5)  return '#fef2f2'
  if (n < 7)  return '#fffbeb'
  return '#f0fdf4'
}

export default function MisNotas() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const [tab,          setTab]          = useState('notas')
  const [loading,      setLoading]      = useState(true)
  const [gradoInfo,    setGradoInfo]    = useState(null)
  const [materias,     setMaterias]     = useState([])
  const [comps,        setComps]        = useState([])
  const [isBach,       setIsBach]       = useState(false)
  const [numPer,       setNumPer]       = useState(3)

  // Estado boleta
  const [boletaStatus, setBoletaStatus] = useState(null)
  // null = cargando | { visible: false, motivo: 'no_publicada'|'pagos'|'notas', detalle: '' }
  // | { visible: true, materias, comps, gradoInfo }

  useEffect(() => { cargarTodo() }, [perfil, year])

  async function cargarTodo() {
    if (!perfil?.estudiante_id) return
    setLoading(true)

    // Datos del estudiante
    const { data: est } = await supabase.from('estudiantes')
      .select('id, nombre, apellido, grado_id').eq('id', perfil.estudiante_id).single()
    if (!est) { setLoading(false); return }

    const { data: grado } = await supabase.from('grados')
      .select('id, nombre, nivel, componentes_nota, encargado_nombre').eq('id', est.grado_id).single()
    if (!grado) { setLoading(false); return }

    const compsList = (grado.componentes_nota || 'ac,ai,em,ef').split(',')
    const esBach    = grado.nivel === 'bachillerato'
    const nPer      = esBach ? 4 : 3

    setGradoInfo({ ...grado, estudiante: est })
    setComps(compsList)
    setIsBach(esBach)
    setNumPer(nPer)

    // Materias del grado
    const { data: mgs } = await supabase.from('materia_grado')
      .select('materia_id, es_complementario').eq('grado_id', grado.id)
    const matIds = (mgs || []).map(m => m.materia_id)
    const { data: matsData } = await supabase.from('materias')
      .select('id, nombre').in('id', matIds).order('nombre')

    // Notas
    const { data: notasData } = await supabase.from('notas').select('*')
      .eq('estudiante_id', est.id).eq('grado_id', grado.id).eq('año_escolar', year)

    const notasMap = {}
    for (const n of (notasData || [])) {
      notasMap[`${n.materia_id}-${n.periodo}-${n.tipo}`] = n.nota
    }

    const compIds = (mgs || []).filter(m => m.es_complementario).map(m => m.materia_id)
    const matsConNotas = (matsData || []).map(m => {
      const notas = {}
      for (let p = 1; p <= nPer; p++) {
        notas[p] = {}
        for (const c of compsList) notas[p][c] = notasMap[`${m.id}-${p}-${c}`] ?? null
      }
      return { id: m.id, nombre: m.nombre, notas, esComplementaria: compIds.includes(m.id) }
    })
    setMaterias(matsConNotas)

    // ── Verificar elegibilidad de boleta ──────
    await verificarBoleta(est, grado, matsConNotas, compsList, nPer)
    setLoading(false)
  }

  async function verificarBoleta(est, grado, mats, compsList, nPer) {
    // 1. ¿Está publicada la boleta?
    const { data: pub } = await supabase.from('boletas_publicadas')
      .select('id, periodo, activo')
      .eq('grado_id', grado.id)
      .eq('año_escolar', year)
      .eq('activo', true)
      .order('publicado_en', { ascending: false })
      .limit(1)
      .single()

    if (!pub) {
      setBoletaStatus({ visible: false, motivo: 'no_publicada', detalle: 'Tu boleta aún no está disponible. Consulta con Registro Académico.' })
      return
    }

    // 2. ¿Tiene cobros pendientes?
    const { data: cobros } = await supabase.from('cobros')
      .select('id').eq('estudiante_id', est.id).eq('estado', 'pendiente').limit(1)

    if (cobros && cobros.length > 0) {
      setBoletaStatus({ visible: false, motivo: 'pagos', detalle: 'Tienes cobros pendientes. Acércate a recepción o contacta a tu encargado para regularizar tu situación.' })
      return
    }

    // 3. ¿Tiene materia reprobada o promedio bajo?
    const normales = mats.filter(m => !m.esComplementaria)
    let hayReprobada = false
    let sumNFTs = 0, countNFTs = 0

    for (const m of normales) {
      for (let p = 1; p <= nPer; p++) {
        const nft = calcNFT(m.notas[p] || {}, compsList)
        if (nft !== null) {
          if (nft < 7) hayReprobada = true
          sumNFTs += nft
          countNFTs++
        }
      }
    }

    const promedio = countNFTs > 0 ? sumNFTs / countNFTs : null
    const promBajo = promedio !== null && promedio < 7

    if (hayReprobada || promBajo) {
      const detalle = hayReprobada && promBajo
        ? 'Tienes materias reprobadas y tu promedio general es menor a 7.0.'
        : hayReprobada
        ? 'Tienes una o más materias reprobadas.'
        : 'Tu promedio general es menor a 7.0.'
      setBoletaStatus({
        visible: false, motivo: 'notas',
        detalle: `${detalle} Solicita una cita con tu docente encargado para más información.`,
        promedio,
      })
      return
    }

    // Todo bien — boleta visible
    setBoletaStatus({ visible: true, periodo: pub.periodo, promedio })
  }

  if (loading) return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', textAlign: 'center', padding: 60, color: '#b0a8c0' }}>Cargando...</div>
  )

  const periodoTerm = isBach ? 'Período' : 'Trimestre'

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Mis Notas</h1>
        <p style={{ color: '#b0a8c0', fontSize: 13 }}>
          {gradoInfo?.nombre} · Año {year}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 12, padding: 4, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', width: 'fit-content' }}>
        {[{ id: 'notas', label: 'Mis Notas' }, { id: 'boleta', label: 'Boleta' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', background: tab === t.id ? 'linear-gradient(135deg, #5B2D8E, #3d1f61)' : 'transparent', color: tab === t.id ? '#fff' : '#6b7280', transition: 'all 0.15s', position: 'relative' }}>
            {t.label}
            {t.id === 'boleta' && boletaStatus && !boletaStatus.visible && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#dc2626' }} />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB NOTAS ──────────────────────────── */}
      {tab === 'notas' && (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ background: '#1a0d30' }}>
                <th style={{ ...s.th, textAlign: 'left', paddingLeft: 20, minWidth: 160 }}>Materia</th>
                {Array.from({ length: numPer }, (_, i) => (
                  <th key={i} colSpan={comps.length + 1}
                    style={{ ...s.th, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ color: ['#a78bfa','#60a5fa','#34d399','#f59e0b'][i] }}>
                      {periodoTerm} {i + 1}
                    </span>
                  </th>
                ))}
                <th style={{ ...s.th, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>Prom.</th>
              </tr>
              <tr style={{ background: '#2d1554' }}>
                <th style={s.th2} />
                {Array.from({ length: numPer }, (_, i) => (
                  <>
                    {comps.map(c => <th key={`${i}-${c}`} style={s.th2}>{COMP_LABELS[c]}</th>)}
                    <th key={`nft-${i}`} style={{ ...s.th2, color: '#D4A017' }}>NFT</th>
                  </>
                ))}
                <th style={s.th2} />
              </tr>
            </thead>
            <tbody>
              {materias.map((mat, mi) => {
                const nfts = Array.from({ length: numPer }, (_, pi) => calcNFT(mat.notas[pi + 1] || {}, comps))
                const nftsValidos = nfts.filter(n => n !== null)
                const prom = nftsValidos.length ? nftsValidos.reduce((a, b) => a + b, 0) / nftsValidos.length : null

                return (
                  <tr key={mat.id} style={{ background: mi % 2 === 0 ? '#fff' : '#fdfcff', borderBottom: '1px solid #f3eeff' }}>
                    <td style={{ ...s.td, fontWeight: 700, color: mat.esComplementaria ? '#0e9490' : '#3d1f61', paddingLeft: 20 }}>
                      {mat.nombre}
                      {mat.esComplementaria && <span style={{ fontSize: 9, fontWeight: 600, color: '#0e9490', background: '#e0f7f6', padding: '1px 6px', borderRadius: 10, marginLeft: 6 }}>Complementaria</span>}
                    </td>
                    {Array.from({ length: numPer }, (_, pi) => (
                      <>
                        {comps.map(c => {
                          const val = mat.notas[pi + 1]?.[c]
                          return (
                            <td key={`${pi}-${c}`} style={{ ...s.td, textAlign: 'center', color: notaColor(val), fontWeight: val !== null ? 600 : 400 }}>
                              {val !== null && val !== undefined ? Number(val).toFixed(1) : '—'}
                            </td>
                          )
                        })}
                        <td key={`nft-${pi}`} style={{ ...s.td, textAlign: 'center', fontWeight: 800, color: notaColor(nfts[pi]), background: nfts[pi] !== null ? notaBg(nfts[pi]) : 'transparent' }}>
                          {nfts[pi] !== null ? Number(nfts[pi]).toFixed(2) : '—'}
                        </td>
                      </>
                    ))}
                    <td style={{ ...s.td, textAlign: 'center', fontWeight: 800, fontSize: 14, color: notaColor(prom), background: prom !== null ? notaBg(prom) : 'transparent' }}>
                      {prom !== null ? Number(prom).toFixed(2) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB BOLETA ─────────────────────────── */}
      {tab === 'boleta' && (
        <>
          {/* No publicada */}
          {boletaStatus?.motivo === 'no_publicada' && (
            <div style={s.bloqueado}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><IcoClock /></div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#3d1f61', marginBottom: 8 }}>Boleta no disponible</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{boletaStatus.detalle}</div>
            </div>
          )}

          {/* Pagos pendientes */}
          {boletaStatus?.motivo === 'pagos' && (
            <div style={s.bloqueado}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><IcoLock /></div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>Cobros pendientes</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{boletaStatus.detalle}</div>
              <div style={{ marginTop: 20, padding: '10px 20px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                Para regularizar tu situación acércate a recepción o comunícate con tu encargado
              </div>
            </div>
          )}

          {/* Notas insuficientes */}
          {boletaStatus?.motivo === 'notas' && (
            <div style={s.bloqueado}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><IcoAlert /></div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>Boleta no aprobada</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>{boletaStatus.detalle}</div>
              {boletaStatus.promedio !== null && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626', fontWeight: 700 }}>
                  Promedio actual: {Number(boletaStatus.promedio).toFixed(2)}
                </div>
              )}
              <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>
                Puedes solicitar una cita con tu docente encargado desde el módulo de Solicitudes
              </div>
            </div>
          )}

          {/* Boleta visible */}
          {boletaStatus?.visible && (
            <>
              {/* Banner verde */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                <IcoCheck /> Boleta disponible · {boletaStatus.promedio !== null && `Promedio general: ${Number(boletaStatus.promedio).toFixed(2)}`}
              </div>

              {/* Vista previa boleta */}
              <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1a0d30, #3d1f61)', padding: '20px 24px', color: '#fff' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>Colegio Bautista Internacional de Sonsonate</div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Boleta de Calificaciones {year}</div>
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                    <div><div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estudiante</div><div style={{ fontSize: 13, fontWeight: 700 }}>{gradoInfo?.estudiante?.apellido}, {gradoInfo?.estudiante?.nombre}</div></div>
                    <div><div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grado</div><div style={{ fontSize: 13, fontWeight: 700 }}>{gradoInfo?.nombre}</div></div>
                    <div><div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Docente</div><div style={{ fontSize: 13, fontWeight: 700 }}>{gradoInfo?.encargado_nombre || '—'}</div></div>
                  </div>
                </div>

                {/* Tabla notas — misma que tab notas pero solo lectura */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#1a2d5a' }}>
                        <th style={{ ...s.th, textAlign: 'left', paddingLeft: 16, color: '#F5EDD0', minWidth: 150 }}>Materia</th>
                        {Array.from({ length: numPer }, (_, i) => (
                          <th key={i} colSpan={comps.length + 1}
                            style={{ ...s.th, color: '#F5EDD0', borderLeft: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                            {periodoTerm} {i + 1}
                          </th>
                        ))}
                        <th style={{ ...s.th, color: '#D4A017', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>Prom.</th>
                      </tr>
                      <tr style={{ background: '#223468' }}>
                        <th style={s.th2} />
                        {Array.from({ length: numPer }, (_, i) => (
                          <>
                            {comps.map(c => <th key={`${i}-${c}`} style={s.th2}>{COMP_LABELS[c]}</th>)}
                            <th key={`nft-${i}`} style={{ ...s.th2, color: '#D4A017' }}>NFT</th>
                          </>
                        ))}
                        <th style={s.th2} />
                      </tr>
                    </thead>
                    <tbody>
                      {materias.filter(m => !m.esComplementaria).map((mat, mi) => {
                        const nfts = Array.from({ length: numPer }, (_, pi) => calcNFT(mat.notas[pi + 1] || {}, comps))
                        const nftsValidos = nfts.filter(n => n !== null)
                        const prom = nftsValidos.length ? nftsValidos.reduce((a, b) => a + b, 0) / nftsValidos.length : null
                        return (
                          <tr key={mat.id} style={{ background: mi % 2 === 0 ? '#fff' : '#f4f7fc', borderBottom: '1px solid #eee' }}>
                            <td style={{ ...s.td, fontWeight: 600, color: '#0f1d40', paddingLeft: 16 }}>{mat.nombre}</td>
                            {Array.from({ length: numPer }, (_, pi) => (
                              <>
                                {comps.map(c => {
                                  const val = mat.notas[pi + 1]?.[c]
                                  return <td key={`${pi}-${c}`} style={{ ...s.td, textAlign: 'center', color: notaColor(val), fontWeight: val !== null ? 600 : 400 }}>
                                    {val !== null && val !== undefined ? Number(val).toFixed(1) : '—'}
                                  </td>
                                })}
                                <td key={`nft-${pi}`} style={{ ...s.td, textAlign: 'center', fontWeight: 800, color: notaColor(nfts[pi]), background: nfts[pi] !== null ? notaBg(nfts[pi]) : 'transparent' }}>
                                  {nfts[pi] !== null ? Number(nfts[pi]).toFixed(2) : '—'}
                                </td>
                              </>
                            ))}
                            <td style={{ ...s.td, textAlign: 'center', fontWeight: 800, color: notaColor(prom) }}>
                              {prom !== null ? Number(prom).toFixed(2) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Materias complementarias */}
                {materias.some(m => m.esComplementaria) && (
                  <div style={{ padding: '12px 16px', borderTop: '2px solid #f3eeff' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#0e9490', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Cursos Complementarios</div>
                    {materias.filter(m => m.esComplementaria).map(mat => {
                      const nfts = Array.from({ length: numPer }, (_, pi) => calcNFT(mat.notas[pi + 1] || {}, comps))
                      return (
                        <div key={mat.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3eeff', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0e9490', flex: '1 1 120px' }}>{mat.nombre}</span>
                          {nfts.map((nft, i) => (
                            <span key={i} style={{ fontSize: 12, color: notaColor(nft), fontWeight: 700 }}>
                              {periodoTerm} {i + 1}: {nft !== null ? Number(nft).toFixed(2) : '—'}
                            </span>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Nota al pie */}
                <div style={{ padding: '12px 20px', background: '#f9fafb', borderTop: '1px solid #f3eeff', fontSize: 11, color: '#b0a8c0', textAlign: 'right' }}>
                  Esta es una vista de consulta. Para el documento oficial acércate a Registro Académico.
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

const s = {
  th:       { padding: '10px 8px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' },
  th2:      { padding: '6px 8px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textAlign: 'center', textTransform: 'uppercase' },
  td:       { padding: '9px 8px', fontSize: 12, color: '#374151', verticalAlign: 'middle' },
  bloqueado:{ textAlign: 'center', padding: '60px 32px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', maxWidth: 480, margin: '0 auto' },
}