import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'

// ── Helpers ──────────────────────────────────────────────────
const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre']
function fechaEs(d) {
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getDate()} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
}
function hoy() { return new Date().toISOString().split('T')[0] }
function fmtMoney(n) { return `$${(n||0).toFixed(2)}` }
function fmtNota(n) { return n != null ? parseFloat(n).toFixed(2) : '—' }
function notaColor(n) {
  if (n == null) return '#b0a8c0'
  if (n < 5)    return '#C0392B'
  if (n < 7)    return '#946A00'
  return '#1A7A4A'
}
const PESOS = { ac: 0.35, ai: 0.35, em: 0.10, ep: 0.10, ef: 0.20 }
function calcNFT(comps, notas) {
  const vals = comps.map(c => notas[c])
  if (vals.some(v => v == null)) return null
  return comps.reduce((s, c) => s + notas[c] * PESOS[c], 0)
}

// ── Imprimir ──────────────────────────────────────────────────
function imprimirReporte(titulo, contenidoId) {
  const el = document.getElementById(contenidoId)
  if (!el) return
  const w = window.open('', '_blank')
  w.document.write(`<html><head><title>${titulo}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 24px; color: #0f1d40; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #1a2d5a; color: #F5EDD0; padding: 8px 10px; text-align: left; font-size: 11px; }
      td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f4f7fc; }
      h2 { color: #3d1f61; margin-bottom: 4px; }
      .sub { color: #b0a8c0; font-size: 12px; margin-bottom: 16px; }
    </style></head>
    <body>${el.innerHTML}</body></html>`)
  w.document.close()
  w.print()
}

// ── Seccion ──────────────────────────────────────────────────
function Seccion({ titulo, descripcion, onImprimir, cargando, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#3d1f61' }}>{titulo}</div>
          <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500, marginTop: 2 }}>{descripcion}</div>
        </div>
        <button onClick={onImprimir}
          style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #5B2D8E', background: '#f3eeff', color: '#5B2D8E', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimir
        </button>
      </div>
      <div style={{ padding: 24 }}>
        {cargando
          ? <div style={{ textAlign: 'center', color: '#b0a8c0', padding: 24 }}>Cargando...</div>
          : children}
      </div>
    </div>
  )
}

// ── Tabla ────────────────────────────────────────────────────
function Tabla({ cols, rows, emptyMsg = 'Sin datos' }) {
  if (!rows || rows.length === 0)
    return <div style={{ textAlign: 'center', color: '#b0a8c0', padding: 24, fontSize: 13 }}>{emptyMsg}</div>
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#1a2d5a' }}>
          {cols.map(c => (
            <th key={c.key} style={{ padding: '9px 12px', color: '#F5EDD0', fontSize: 11, fontWeight: 700, textAlign: c.align || 'left', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f4f7fc', borderBottom: '1px solid #eee' }}>
            {cols.map(c => (
              <td key={c.key} style={{ padding: '9px 12px', color: '#374151', textAlign: c.align || 'left', verticalAlign: 'middle' }}>
                {c.render ? c.render(row) : (row[c.key] ?? '—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ════════════════════════════════════════════════════════════
// COBROS
// ════════════════════════════════════════════════════════════
function ReportesCobros() {
  const [pagosHoy,   setPagosHoy]   = useState([])
  const [vencidos,   setVencidos]   = useState([])
  const [pendientes, setPendientes] = useState([])
  const [cargando,   setCargando]   = useState(true)

  useEffect(() => {
    const hoyStr = hoy()
    Promise.all([
      supabase.from('pagos').select('id, monto, fecha_pago, concepto, estudiantes(nombre, apellido)')
        .eq('fecha_pago', hoyStr).neq('anulado', true).order('fecha_pago', { ascending: false }),
      supabase.from('cobros').select('id, concepto, monto, fecha_vencimiento, estudiantes(nombre, apellido)')
        .eq('estado', 'pendiente').neq('anulado', true).order('fecha_vencimiento'),
    ]).then(([{ data: pg }, { data: pend }]) => {
      const hoyDate = new Date(hoyStr)
      setPagosHoy(pg || [])
      setVencidos((pend || []).filter(c => new Date(c.fecha_vencimiento) < hoyDate))
      setPendientes((pend || []).filter(c => new Date(c.fecha_vencimiento) >= hoyDate))
      setCargando(false)
    })
  }, [])

  const totalHoy = pagosHoy.reduce((s, p) => s + (p.monto || 0), 0)

  return (
    <>
      <Seccion titulo="Pagos del día" descripcion={`${fechaEs(hoy())} · ${pagosHoy.length} pago(s) · Total: ${fmtMoney(totalHoy)}`}
        onImprimir={() => imprimirReporte('Pagos del día', 'rpt-pagos-dia')} cargando={cargando}>
        <div id="rpt-pagos-dia">
          <h2>Pagos del día</h2><div className="sub">{fechaEs(hoy())}</div>
          <Tabla
            cols={[
              { key: 'est',     label: 'Estudiante',  render: r => `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}` },
              { key: 'concepto',label: 'Concepto' },
              { key: 'monto',   label: 'Monto', align: 'right', render: r => fmtMoney(r.monto) },
            ]}
            rows={pagosHoy} emptyMsg="Sin pagos hoy" />
          {pagosHoy.length > 0 && (
            <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 800, color: '#3d1f61', fontSize: 14 }}>
              Total: {fmtMoney(totalHoy)}
            </div>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Cobros vencidos" descripcion={`${vencidos.length} cobro(s) fuera de fecha`}
        onImprimir={() => imprimirReporte('Cobros vencidos', 'rpt-vencidos')} cargando={cargando}>
        <div id="rpt-vencidos">
          <h2>Cobros vencidos</h2>
          <Tabla
            cols={[
              { key: 'est',              label: 'Estudiante',  render: r => `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}` },
              { key: 'concepto',         label: 'Concepto' },
              { key: 'monto',            label: 'Monto', align: 'right', render: r => fmtMoney(r.monto) },
              { key: 'fecha_vencimiento',label: 'Venció', render: r => fechaEs(r.fecha_vencimiento) },
            ]}
            rows={vencidos} emptyMsg="Sin cobros vencidos" />
        </div>
      </Seccion>

      <Seccion titulo="Cobros pendientes" descripcion={`${pendientes.length} cobro(s) por vencer`}
        onImprimir={() => imprimirReporte('Cobros pendientes', 'rpt-pendientes')} cargando={cargando}>
        <div id="rpt-pendientes">
          <h2>Cobros pendientes</h2>
          <Tabla
            cols={[
              { key: 'est',              label: 'Estudiante',  render: r => `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}` },
              { key: 'concepto',         label: 'Concepto' },
              { key: 'monto',            label: 'Monto', align: 'right', render: r => fmtMoney(r.monto) },
              { key: 'fecha_vencimiento',label: 'Vence', render: r => fechaEs(r.fecha_vencimiento) },
            ]}
            rows={pendientes} emptyMsg="Sin cobros pendientes" />
        </div>
      </Seccion>
    </>
  )
}

// ════════════════════════════════════════════════════════════
// ASISTENCIA
// ════════════════════════════════════════════════════════════
function ReportesAsistencia({ year, perfil }) {
  const isDocente = perfil?.rol === 'docente'
  const [grados,       setGrados]       = useState([])
  const [gradoId,      setGradoId]      = useState('')
  const [fecha,        setFecha]        = useState(hoy())
  const [resumen,      setResumen]      = useState([])
  const [inasistentes, setInasistentes] = useState([])
  const [cargando,     setCargando]     = useState(false)

  const COLORS = { presente: '#1A7A4A', ausente: '#C0392B', tardanza: '#946A00', justificado: '#1e40af' }

  useEffect(() => {
    if (isDocente) {
      supabase.from('asignaciones').select('grado_id, grados(id, nombre, orden)')
        .eq('docente_id', perfil.id).eq('año_escolar', year)
        .then(({ data }) => {
          const vistos = new Set(); const lista = []
          for (const a of (data || [])) { if (!vistos.has(a.grado_id)) { vistos.add(a.grado_id); lista.push(a.grados) } }
          lista.sort((a, b) => a.orden - b.orden)
          setGrados(lista)
          if (lista.length === 1) setGradoId(String(lista[0].id))
        })
    } else {
      supabase.from('grados').select('id, nombre, orden').order('orden')
        .then(({ data }) => setGrados(data || []))
    }
  }, [perfil, year])

  useEffect(() => {
    if (!gradoId) return
    setCargando(true)
    Promise.all([
      supabase.from('asistencia').select('estado, estudiantes(nombre, apellido)')
        .eq('grado_id', parseInt(gradoId)).eq('fecha', fecha).eq('año_escolar', year),
      supabase.from('asistencia').select('estudiante_id, estudiantes(nombre, apellido)')
        .eq('grado_id', parseInt(gradoId)).eq('estado', 'ausente').eq('año_escolar', year),
    ]).then(([{ data: asis }, { data: aus }]) => {
      setResumen(asis || [])
      const conteo = {}
      for (const a of (aus || [])) {
        const id = a.estudiante_id
        if (!conteo[id]) conteo[id] = { ...a.estudiantes, count: 0 }
        conteo[id].count++
      }
      setInasistentes(Object.values(conteo).filter(e => e.count >= 3).sort((a, b) => b.count - a.count))
      setCargando(false)
    })
  }, [gradoId, fecha, year])

  const conteos = resumen.reduce((acc, a) => { acc[a.estado] = (acc[a.estado] || 0) + 1; return acc }, { presente: 0, ausente: 0, tardanza: 0, justificado: 0 })

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20, marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={s.label}>Grado</label>
          <select style={s.select} value={gradoId} onChange={e => setGradoId(e.target.value)}>
            <option value="">Selecciona un grado</option>
            {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 0 180px' }}>
          <label style={s.label}>Fecha</label>
          <input type="date" style={s.select} value={fecha} onChange={e => setFecha(e.target.value)} max={hoy()} />
        </div>
      </div>

      {gradoId && (<>
        <Seccion titulo="Asistencia del día" descripcion={`${fechaEs(fecha)} · ${resumen.length} registros`}
          onImprimir={() => imprimirReporte('Asistencia del día', 'rpt-asis-dia')} cargando={cargando}>
          <div id="rpt-asis-dia">
            <h2>Asistencia del día</h2><div className="sub">{fechaEs(fecha)}</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {Object.entries(conteos).map(([est, cnt]) => (
                <div key={est} style={{ padding: '10px 18px', borderRadius: 10, background: '#f4f7fc', border: `1.5px solid ${COLORS[est]}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: COLORS[est] }}>{cnt}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS[est], textTransform: 'capitalize' }}>{est}</div>
                </div>
              ))}
            </div>
            <Tabla
              cols={[
                { key: 'est',    label: 'Estudiante', render: r => `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}` },
                { key: 'estado', label: 'Estado', render: r => (
                  <span style={{ padding: '2px 10px', borderRadius: 20, background: '#f4f7fc', color: COLORS[r.estado], fontWeight: 700, fontSize: 12, textTransform: 'capitalize' }}>{r.estado}</span>
                )},
              ]}
              rows={resumen} emptyMsg="Sin registros para esta fecha" />
          </div>
        </Seccion>

        <Seccion titulo="Inasistencias frecuentes" descripcion={`3 o más ausencias en ${year} · ${inasistentes.length} estudiante(s)`}
          onImprimir={() => imprimirReporte('Inasistencias frecuentes', 'rpt-inasis')} cargando={cargando}>
          <div id="rpt-inasis">
            <h2>Inasistencias frecuentes · {year}</h2>
            <Tabla
              cols={[
                { key: 'nombre', label: 'Estudiante', render: r => `${r.apellido}, ${r.nombre}` },
                { key: 'count',  label: 'Ausencias', align: 'center', render: r => (
                  <span style={{ fontWeight: 800, color: r.count >= 5 ? '#C0392B' : '#946A00', fontSize: 14 }}>{r.count}</span>
                )},
              ]}
              rows={inasistentes} emptyMsg="Sin inasistencias frecuentes" />
          </div>
        </Seccion>
      </>)}
    </>
  )
}

// ════════════════════════════════════════════════════════════
// ACADÉMICO
// ════════════════════════════════════════════════════════════
function ReportesAcademico({ year, perfil }) {
  const isDocente = perfil?.rol === 'docente'
  const [grados,    setGrados]    = useState([])
  const [gradoId,   setGradoId]   = useState('')
  const [gradoInfo, setGradoInfo] = useState(null)
  const [periodo,   setPeriodo]   = useState('1')
  const [promedios, setPromedios] = useState([])
  const [riesgo,    setRiesgo]    = useState([])
  const [cargando,  setCargando]  = useState(false)

  useEffect(() => {
    if (isDocente) {
      supabase.from('asignaciones').select('grado_id, grados(id, nombre, nivel, orden, componentes_nota)')
        .eq('docente_id', perfil.id).eq('año_escolar', year)
        .then(({ data }) => {
          const vistos = new Set(); const lista = []
          for (const a of (data || [])) { if (!vistos.has(a.grado_id)) { vistos.add(a.grado_id); lista.push(a.grados) } }
          lista.sort((a, b) => a.orden - b.orden)
          setGrados(lista)
          if (lista.length === 1) { setGradoId(String(lista[0].id)); setGradoInfo(lista[0]) }
        })
    } else {
      supabase.from('grados').select('id, nombre, nivel, orden, componentes_nota').order('orden')
        .then(({ data }) => setGrados(data || []))
    }
  }, [perfil, year])

  useEffect(() => {
    if (!gradoId) return
    const gInfo = grados.find(g => g.id === parseInt(gradoId))
    setGradoInfo(gInfo)
    const comps = (gInfo?.componentes_nota || 'ac,ai,em,ef').split(',')
    setCargando(true)

    Promise.all([
      supabase.from('materia_grado').select('materia_id, materias(id, nombre)')
        .eq('grado_id', parseInt(gradoId)).eq('es_complementario', false),
      supabase.from('estudiantes').select('id, nombre, apellido')
        .eq('grado_id', parseInt(gradoId)).eq('estado', 'activo'),
      supabase.from('notas').select('estudiante_id, materia_id, tipo, nota')
        .eq('grado_id', parseInt(gradoId)).eq('año_escolar', year).eq('periodo', parseInt(periodo)),
    ]).then(([{ data: mgs }, { data: ests }, { data: ns }]) => {
      const mats = (mgs || []).map(m => m.materias).filter(Boolean)
      const notasMap = {}
      for (const n of (ns || [])) {
        const key = `${n.estudiante_id}-${n.materia_id}`
        if (!notasMap[key]) notasMap[key] = {}
        notasMap[key][n.tipo] = n.nota
      }

      // Promedio NFT por materia
      const porMat = {}
      for (const est of (ests || [])) {
        for (const mat of mats) {
          const notas = notasMap[`${est.id}-${mat.id}`] || {}
          const nft = calcNFT(comps, notas)
          if (!porMat[mat.id]) porMat[mat.id] = { nombre: mat.nombre, nfts: [] }
          if (nft !== null) porMat[mat.id].nfts.push(nft)
        }
      }
      const promList = Object.values(porMat).map(m => ({
        nombre:   m.nombre,
        promedio: m.nfts.length ? m.nfts.reduce((a, b) => a + b, 0) / m.nfts.length : null,
        count:    m.nfts.length,
      })).sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
      setPromedios(promList)

      // En riesgo
      const enRiesgo = {}
      for (const est of (ests || [])) {
        for (const mat of mats) {
          const notas = notasMap[`${est.id}-${mat.id}`] || {}
          const nft = calcNFT(comps, notas)
          if (nft !== null && nft < 7) {
            if (!enRiesgo[est.id]) enRiesgo[est.id] = { est, materias: [] }
            enRiesgo[est.id].materias.push({ mat: mat.nombre, nft })
          }
        }
      }
      setRiesgo(Object.values(enRiesgo))
      setCargando(false)
    })
  }, [gradoId, periodo, year, grados])

  const isBach   = gradoInfo?.nivel === 'bachillerato'
  const numPer   = isBach ? 4 : 3
  const pTerm    = isBach ? 'Período' : 'Trimestre'
  const periodos = Array.from({ length: numPer }, (_, i) => ({
    value: String(i+1), label: `${['Primer','Segundo','Tercer','Cuarto'][i]} ${pTerm}`,
  }))
  const periodoLabel = periodos.find(p => p.value === periodo)?.label || ''

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20, marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={s.label}>Grado</label>
          <select style={s.select} value={gradoId} onChange={e => { setGradoId(e.target.value); setGradoInfo(grados.find(g => g.id === parseInt(e.target.value)) || null) }}>
            <option value="">Selecciona un grado</option>
            {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 0 200px' }}>
          <label style={s.label}>Período</label>
          <select style={s.select} value={periodo} onChange={e => setPeriodo(e.target.value)} disabled={!gradoId}>
            {periodos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      {gradoId && (<>
        <Seccion titulo="Promedio NFT por materia" descripcion={`${gradoInfo?.nombre} · ${periodoLabel}`}
          onImprimir={() => imprimirReporte('Promedio por materia', 'rpt-notas-mat')} cargando={cargando}>
          <div id="rpt-notas-mat">
            <h2>Promedio NFT por materia</h2>
            <div className="sub">{gradoInfo?.nombre} · {periodoLabel} · {year}</div>
            <Tabla
              cols={[
                { key: 'nombre',   label: 'Materia' },
                { key: 'promedio', label: 'Promedio NFT', align: 'center', render: r => (
                  <span style={{ fontWeight: 800, color: notaColor(r.promedio), fontSize: 14 }}>{fmtNota(r.promedio)}</span>
                )},
                { key: 'count', label: 'Con nota', align: 'center' },
              ]}
              rows={promedios} emptyMsg="Sin notas registradas" />
          </div>
        </Seccion>

        <Seccion titulo="Estudiantes en riesgo académico" descripcion={`NFT menor a 7.0 · ${riesgo.length} estudiante(s)`}
          onImprimir={() => imprimirReporte('Estudiantes en riesgo', 'rpt-riesgo')} cargando={cargando}>
          <div id="rpt-riesgo">
            <h2>Estudiantes en riesgo · {gradoInfo?.nombre} · {periodoLabel}</h2>
            {riesgo.length === 0
              ? <div style={{ textAlign: 'center', color: '#1A7A4A', fontWeight: 700, padding: 24 }}>✓ Sin estudiantes en riesgo en este período</div>
              : riesgo.map((r, i) => (
                <div key={i} style={{ marginBottom: 12, padding: '12px 16px', background: '#fff5f5', borderRadius: 10, border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: 800, color: '#0f1d40', marginBottom: 6 }}>{r.est.apellido}, {r.est.nombre}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {r.materias.map((m, j) => (
                      <span key={j} style={{ padding: '2px 10px', borderRadius: 20, background: '#fee2e2', color: '#C0392B', fontSize: 12, fontWeight: 700 }}>
                        {m.mat}: {fmtNota(m.nft)}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        </Seccion>
      </>)}
    </>
  )
}

// ════════════════════════════════════════════════════════════
// PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function Reportes() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const TABS = [
    ['admin','recepcion'].includes(perfil?.rol) && { id: 'cobros', label: 'Cobros y pagos', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    ['admin','docente','direccion_academica','registro_academico'].includes(perfil?.rol) && { id: 'asistencia', label: 'Asistencia', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
    ['admin','docente','direccion_academica','registro_academico'].includes(perfil?.rol) && { id: 'academico', label: 'Académico', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  ].filter(Boolean)

  const [tab, setTab] = useState(TABS[0]?.id || '')

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Reportes</h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>Visualiza e imprime reportes por área</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #f0f0f0' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 20px', border: 'none', borderBottom: tab === t.id ? '3px solid #5B2D8E' : '3px solid transparent', background: 'none', color: tab === t.id ? '#3d1f61' : '#b0a8c0', fontWeight: tab === t.id ? 800 : 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7 }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'cobros'     && <ReportesCobros />}
      {tab === 'asistencia' && <ReportesAsistencia year={year} perfil={perfil} />}
      {tab === 'academico'  && <ReportesAcademico year={year} perfil={perfil} />}
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer', outline: 'none' },
}