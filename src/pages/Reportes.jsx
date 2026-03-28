import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'

// ── Helpers ───────────────────────────────────
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
function fechaEs(d) { const dt = new Date(d + 'T00:00:00'); return `${dt.getDate()} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}` }
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

// ── Iconos ────────────────────────────────────
const IcoPrint = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)
const IcoExcel = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ── Exportar a CSV/Excel ──────────────────────
function exportarCSV(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  URL.revokeObjectURL(url); document.body.removeChild(a)
}

// ── Imprimir ──────────────────────────────────
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
  w.document.close(); w.print()
}

// ── Componentes base ──────────────────────────
function Seccion({ titulo, descripcion, onImprimir, onExportar, cargando, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#3d1f61' }}>{titulo}</div>
          <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500, marginTop: 2 }}>{descripcion}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {onExportar && (
            <button onClick={onExportar}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #16a34a', background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcoExcel /> Excel
            </button>
          )}
          <button onClick={onImprimir}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #5B2D8E', background: '#f3eeff', color: '#5B2D8E', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoPrint /> Imprimir
          </button>
        </div>
      </div>
      <div style={{ padding: 24 }}>
        {cargando ? <div style={{ textAlign: 'center', color: '#b0a8c0', padding: 24 }}>Cargando...</div> : children}
      </div>
    </div>
  )
}

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

// ── COBROS ────────────────────────────────────
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

  const exportarVencidos = () => exportarCSV(
    `cobros_vencidos_${hoy()}.csv`,
    ['Estudiante','Concepto','Monto','Vencimiento'],
    vencidos.map(r => [`${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}`, r.concepto, fmtMoney(r.monto), r.fecha_vencimiento])
  )

  return (
    <>
      <Seccion titulo="Pagos del día" descripcion={`${fechaEs(hoy())} · ${pagosHoy.length} pago(s) · Total: ${fmtMoney(totalHoy)}`}
        onImprimir={() => imprimirReporte('Pagos del día', 'rpt-pagos-dia')} cargando={cargando}>
        <div id="rpt-pagos-dia">
          <h2>Pagos del día</h2><div className="sub">{fechaEs(hoy())}</div>
          <Tabla
            cols={[
              { key: 'est',     label: 'Estudiante', render: r => `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}` },
              { key: 'concepto',label: 'Concepto' },
              { key: 'monto',   label: 'Monto', align: 'right', render: r => fmtMoney(r.monto) },
            ]}
            rows={pagosHoy} emptyMsg="Sin pagos hoy" />
          {pagosHoy.length > 0 && (
            <div style={{ textAlign: 'right', marginTop: 12, fontWeight: 800, color: '#3d1f61', fontSize: 14 }}>Total: {fmtMoney(totalHoy)}</div>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Cobros vencidos" descripcion={`${vencidos.length} cobro(s) fuera de fecha`}
        onImprimir={() => imprimirReporte('Cobros vencidos', 'rpt-vencidos')}
        onExportar={exportarVencidos} cargando={cargando}>
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

// ── ASISTENCIA ────────────────────────────────
function ReportesAsistencia({ year, perfil }) {
  const isDocente = perfil?.rol === 'docente'
  const [grados,       setGrados]       = useState([])
  const [gradoId,      setGradoId]      = useState('')
  const [mes,          setMes]          = useState(String(new Date().getMonth() + 1).padStart(2,'0'))
  const [fecha,        setFecha]        = useState(hoy())
  const [vistaTab,     setVistaTab]     = useState('dia')
  const [resumen,      setResumen]      = useState([])
  const [resumenMes,   setResumenMes]   = useState([])
  const [inasistentes, setInasistentes] = useState([])
  const [cargando,     setCargando]     = useState(false)

  const COLORS = { presente: '#1A7A4A', ausente: '#C0392B', tardanza: '#946A00', justificado: '#1e40af' }
  const anio = new Date().getFullYear()

  useEffect(() => {
    if (isDocente) {
      supabase.from('grados').select('id, nombre, orden').eq('encargado_id', perfil.id)
        .then(({ data }) => { setGrados(data || []); if (data?.length === 1) setGradoId(String(data[0].id)) })
    } else {
      supabase.from('grados').select('id, nombre, orden').order('orden').then(({ data }) => setGrados(data || []))
    }
  }, [perfil, year])

  useEffect(() => {
    if (!gradoId) return
    setCargando(true)

    const mesInicio = `${anio}-${mes}-01`
    const mesFin    = `${anio}-${mes}-31`

    Promise.all([
      // Día
      supabase.from('asistencia').select('estado, estudiantes(nombre, apellido)')
        .eq('grado_id', parseInt(gradoId)).eq('fecha', fecha).eq('año_escolar', year),
      // Mes — ausencias y tardanzas
      supabase.from('asistencia').select('estudiante_id, estado, estudiantes(nombre, apellido)')
        .eq('grado_id', parseInt(gradoId)).eq('año_escolar', year)
        .gte('fecha', mesInicio).lte('fecha', mesFin)
        .in('estado', ['ausente','tardanza']),
    ]).then(([{ data: asis }, { data: mes_asis }]) => {
      setResumen(asis || [])

      // Agrupar por estudiante para el mes
      const conteo = {}
      for (const a of (mes_asis || [])) {
        const id = a.estudiante_id
        if (!conteo[id]) conteo[id] = { nombre: a.estudiantes?.nombre, apellido: a.estudiantes?.apellido, ausentes: 0, tardanzas: 0 }
        if (a.estado === 'ausente')  conteo[id].ausentes++
        if (a.estado === 'tardanza') conteo[id].tardanzas++
      }
      const lista = Object.values(conteo).sort((a, b) => (b.ausentes + b.tardanzas) - (a.ausentes + a.tardanzas))
      setResumenMes(lista)
      setInasistentes(lista.filter(e => e.ausentes >= 3 || e.tardanzas >= 3))
      setCargando(false)
    })
  }, [gradoId, fecha, mes, year])

  const conteos = resumen.reduce((acc, a) => { acc[a.estado] = (acc[a.estado]||0)+1; return acc }, { presente:0, ausente:0, tardanza:0, justificado:0 })
  const gradoNombre = grados.find(g => g.id === parseInt(gradoId))?.nombre || ''
  const mesNombre = MESES[parseInt(mes)-1]

  const exportarDia = () => exportarCSV(
    `asistencia_${gradoNombre.replace(/ /g,'_')}_${fecha}.csv`,
    ['Estudiante','Estado'],
    resumen.map(r => [`${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}`, r.estado])
  )

  const exportarMes = () => exportarCSV(
    `asistencia_mes_${gradoNombre.replace(/ /g,'_')}_${anio}_${mes}.csv`,
    ['Estudiante','Ausencias','Tardanzas'],
    resumenMes.map(r => [`${r.apellido}, ${r.nombre}`, r.ausentes, r.tardanzas])
  )

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={s.label}>Grado</label>
            <select style={s.select} value={gradoId} onChange={e => setGradoId(e.target.value)}>
              <option value="">Selecciona un grado</option>
              {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, paddingBottom: 2 }}>
            {[['dia','Por día'],['mes','Por mes']].map(([id,label]) => (
              <button key={id} onClick={() => setVistaTab(id)}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: vistaTab === id ? '#5B2D8E' : '#f3eeff', color: vistaTab === id ? '#fff' : '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                {label}
              </button>
            ))}
          </div>
          {vistaTab === 'dia' ? (
            <div style={{ flex: '0 0 180px' }}>
              <label style={s.label}>Fecha</label>
              <input type="date" style={s.select} value={fecha} onChange={e => setFecha(e.target.value)} max={hoy()} />
            </div>
          ) : (
            <div style={{ flex: '0 0 180px' }}>
              <label style={s.label}>Mes</label>
              <select style={s.select} value={mes} onChange={e => setMes(e.target.value)}>
                {MESES.map((m, i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {gradoId && vistaTab === 'dia' && (
        <Seccion titulo="Asistencia del día" descripcion={`${fechaEs(fecha)} · ${resumen.length} registros`}
          onImprimir={() => imprimirReporte('Asistencia del día', 'rpt-asis-dia')}
          onExportar={exportarDia} cargando={cargando}>
          <div id="rpt-asis-dia">
            <h2>Asistencia del día</h2><div className="sub">{fechaEs(fecha)} · {gradoNombre}</div>
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
      )}

      {gradoId && vistaTab === 'mes' && (<>
        <Seccion titulo={`Resumen de asistencia — ${mesNombre} ${anio}`} descripcion={`${gradoNombre} · ${resumenMes.length} estudiantes con registros`}
          onImprimir={() => imprimirReporte('Resumen mensual', 'rpt-asis-mes')}
          onExportar={exportarMes} cargando={cargando}>
          <div id="rpt-asis-mes">
            <h2>Resumen mensual — {mesNombre} {anio}</h2><div className="sub">{gradoNombre}</div>
            <Tabla
              cols={[
                { key: 'nombre',    label: 'Estudiante', render: r => `${r.apellido}, ${r.nombre}` },
                { key: 'ausentes',  label: 'Ausencias',  align: 'center', render: r => <span style={{ fontWeight: 800, color: r.ausentes >= 3 ? '#C0392B' : '#374151' }}>{r.ausentes}</span> },
                { key: 'tardanzas', label: 'Tardanzas',  align: 'center', render: r => <span style={{ fontWeight: 800, color: r.tardanzas >= 3 ? '#946A00' : '#374151' }}>{r.tardanzas}</span> },
              ]}
              rows={resumenMes} emptyMsg="Sin ausencias ni tardanzas este mes" />
          </div>
        </Seccion>

        {inasistentes.length > 0 && (
          <Seccion titulo="Alertas del mes" descripcion={`${inasistentes.length} estudiante(s) con 3 o más ausencias/tardanzas`}
            onImprimir={() => imprimirReporte('Alertas mes', 'rpt-alertas')} cargando={cargando}>
            <div id="rpt-alertas">
              <h2>Alertas — {mesNombre} {anio}</h2><div className="sub">{gradoNombre}</div>
              {inasistentes.map((r, i) => (
                <div key={i} style={{ marginBottom: 10, padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#0f1d40' }}>{r.apellido}, {r.nombre}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {r.ausentes >= 3 && <span style={{ padding: '2px 10px', borderRadius: 20, background: '#fee2e2', color: '#C0392B', fontSize: 12, fontWeight: 700 }}>{r.ausentes} ausencias</span>}
                    {r.tardanzas >= 3 && <span style={{ padding: '2px 10px', borderRadius: 20, background: '#fef9c3', color: '#946A00', fontSize: 12, fontWeight: 700 }}>{r.tardanzas} tardanzas</span>}
                  </div>
                </div>
              ))}
            </div>
          </Seccion>
        )}
      </>)}
    </>
  )
}

// ── ACADÉMICO ─────────────────────────────────
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
      supabase.from('grados').select('id, nombre, nivel, orden, componentes_nota').eq('encargado_id', perfil.id)
        .then(({ data }) => { setGrados(data||[]); if (data?.length===1) { setGradoId(String(data[0].id)); setGradoInfo(data[0]) } })
    } else {
      supabase.from('grados').select('id, nombre, nivel, orden, componentes_nota').order('orden').then(({ data }) => setGrados(data||[]))
    }
  }, [perfil, year])

  useEffect(() => {
    if (!gradoId) return
    const gInfo = grados.find(g => g.id === parseInt(gradoId))
    setGradoInfo(gInfo)
    const comps = (gInfo?.componentes_nota || 'ac,ai,em,ef').split(',')
    setCargando(true)

    Promise.all([
      supabase.from('materia_grado').select('materia_id, materias(id, nombre)').eq('grado_id', parseInt(gradoId)).eq('es_complementario', false),
      supabase.from('estudiantes').select('id, nombre, apellido').eq('grado_id', parseInt(gradoId)).eq('estado', 'activo'),
      supabase.from('notas').select('estudiante_id, materia_id, tipo, nota').eq('grado_id', parseInt(gradoId)).eq('año_escolar', year).eq('periodo', parseInt(periodo)),
    ]).then(([{ data: mgs }, { data: ests }, { data: ns }]) => {
      const mats = (mgs||[]).map(m => m.materias).filter(Boolean)
      const notasMap = {}
      for (const n of (ns||[])) {
        const key = `${n.estudiante_id}-${n.materia_id}`
        if (!notasMap[key]) notasMap[key] = {}
        notasMap[key][n.tipo] = n.nota
      }

      const porMat = {}
      for (const est of (ests||[])) {
        for (const mat of mats) {
          const notas = notasMap[`${est.id}-${mat.id}`] || {}
          const nft = calcNFT(comps, notas)
          if (!porMat[mat.id]) porMat[mat.id] = { nombre: mat.nombre, nfts: [] }
          if (nft !== null) porMat[mat.id].nfts.push(nft)
        }
      }
      const promList = Object.values(porMat).map(m => ({
        nombre: m.nombre,
        promedio: m.nfts.length ? m.nfts.reduce((a,b) => a+b, 0) / m.nfts.length : null,
        count: m.nfts.length,
      })).sort((a, b) => (b.promedio||0) - (a.promedio||0))
      setPromedios(promList)

      const enRiesgo = {}
      for (const est of (ests||[])) {
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
  const periodos = Array.from({ length: numPer }, (_, i) => ({ value: String(i+1), label: `${['Primer','Segundo','Tercer','Cuarto'][i]} ${pTerm}` }))
  const periodoLabel = periodos.find(p => p.value === periodo)?.label || ''

  const exportarPromedios = () => exportarCSV(
    `promedios_${gradoInfo?.nombre?.replace(/ /g,'_')}_${periodoLabel.replace(/ /g,'_')}.csv`,
    ['Materia','Promedio NFT','Estudiantes con nota'],
    promedios.map(r => [r.nombre, r.promedio ? r.promedio.toFixed(2) : '—', r.count])
  )

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20, marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={s.label}>Grado</label>
          <select style={s.select} value={gradoId} onChange={e => { setGradoId(e.target.value); setGradoInfo(grados.find(g => g.id === parseInt(e.target.value))||null) }}>
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
          onImprimir={() => imprimirReporte('Promedio por materia', 'rpt-notas-mat')}
          onExportar={exportarPromedios} cargando={cargando}>
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
              ? (
                <div style={{ textAlign: 'center', color: '#1A7A4A', fontWeight: 700, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <IcoCheck /> Sin estudiantes en riesgo en este período
                </div>
              )
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

// ── ANECDOTARIO ───────────────────────────────
function ReportesAnecdotario({ year, perfil }) {
  const [grados,      setGrados]      = useState([])
  const [gradoId,     setGradoId]     = useState('')
  const [estudianteId,setEstudianteId]= useState('')
  const [estudiantes, setEstudiantes] = useState([])
  const [registros,   setRegistros]   = useState([])
  const [cargando,    setCargando]    = useState(false)

  const TIPO_LABELS = {
    conversacion: 'Conversación', visita_direccion: 'Visita dirección',
    llamada_padres: 'Llamada a padres', reunion_padres: 'Reunión con padres',
    incidencia: 'Incidencia', logro: 'Logro', otro: 'Otro',
  }

  useEffect(() => {
    supabase.from('grados').select('id, nombre').order('orden').then(({ data }) => setGrados(data||[]))
  }, [])

  useEffect(() => {
    if (!gradoId) { setEstudiantes([]); return }
    supabase.from('estudiantes').select('id, nombre, apellido').eq('grado_id', parseInt(gradoId)).eq('estado','activo').order('apellido')
      .then(({ data }) => setEstudiantes(data||[]))
  }, [gradoId])

  useEffect(() => {
    if (!gradoId) return
    setCargando(true)
    let q = supabase.from('anecdotario')
      .select('*, estudiantes(nombre, apellido), perfiles(nombre, apellido)')
      .eq('año_escolar', year)
      .order('fecha', { ascending: false })

    if (estudianteId) q = q.eq('estudiante_id', parseInt(estudianteId))
    else {
      // Filtrar por grado vía estudiantes
      supabase.from('estudiantes').select('id').eq('grado_id', parseInt(gradoId)).then(({ data: ests }) => {
        const ids = (ests||[]).map(e => e.id)
        if (!ids.length) { setRegistros([]); setCargando(false); return }
        supabase.from('anecdotario').select('*, estudiantes(nombre, apellido), perfiles(nombre, apellido)')
          .eq('año_escolar', year).in('estudiante_id', ids).order('fecha', { ascending: false })
          .then(({ data }) => { setRegistros(data||[]); setCargando(false) })
      })
      return
    }

    q.then(({ data }) => { setRegistros(data||[]); setCargando(false) })
  }, [gradoId, estudianteId, year])

  const exportar = () => exportarCSV(
    `anecdotario_${year}.csv`,
    ['Fecha','Estudiante','Tipo','Descripcion','Seguimiento','Docente'],
    registros.map(r => [r.fecha, `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}`, TIPO_LABELS[r.tipo]||r.tipo, r.descripcion, r.seguimiento||'', `${r.perfiles?.nombre} ${r.perfiles?.apellido}`])
  )

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20, marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={s.label}>Grado</label>
          <select style={s.select} value={gradoId} onChange={e => { setGradoId(e.target.value); setEstudianteId('') }}>
            <option value="">Selecciona un grado</option>
            {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 220px' }}>
          <label style={s.label}>Estudiante (opcional)</label>
          <select style={s.select} value={estudianteId} onChange={e => setEstudianteId(e.target.value)} disabled={!gradoId}>
            <option value="">Todos los estudiantes</option>
            {estudiantes.map(e => <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>)}
          </select>
        </div>
      </div>

      {gradoId && (
        <Seccion titulo="Registros anecdóticos" descripcion={`${registros.length} registros · Año ${year}`}
          onImprimir={() => imprimirReporte('Anecdotario', 'rpt-anec')}
          onExportar={exportar} cargando={cargando}>
          <div id="rpt-anec">
            <h2>Registro Anecdótico {year}</h2>
            <Tabla
              cols={[
                { key: 'fecha',    label: 'Fecha', render: r => fechaEs(r.fecha) },
                { key: 'est',      label: 'Estudiante', render: r => `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}` },
                { key: 'tipo',     label: 'Tipo', render: r => TIPO_LABELS[r.tipo]||r.tipo },
                { key: 'descrip',  label: 'Descripción', render: r => <span style={{ fontSize: 12 }}>{r.descripcion?.substring(0,60)}{r.descripcion?.length > 60 ? '...' : ''}</span> },
                { key: 'docente',  label: 'Docente', render: r => `${r.perfiles?.nombre} ${r.perfiles?.apellido}` },
              ]}
              rows={registros} emptyMsg="Sin registros anecdóticos" />
          </div>
        </Seccion>
      )}
    </>
  )
}

// ── PERMISOS ──────────────────────────────────
function ReportesPermisos({ year }) {
  const [permisos,  setPermisos]  = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [filtroFecha, setFiltroFecha] = useState(hoy())

  const SUBTIPO = { ausencia: 'Ausencia', retiro_anticipado: 'Retiro anticipado', llegada_tarde: 'Llegada tarde' }
  const ESTADO_COLOR = { pendiente: '#d97706', aprobado: '#16a34a', rechazado: '#dc2626' }

  useEffect(() => {
    setCargando(true)
    supabase.from('permisos')
      .select('*, estudiantes(nombre, apellido, grados(nombre)), registrador:perfiles!permisos_registrado_por_fkey(nombre, apellido)')
      .eq('fecha', filtroFecha)
      .eq('año_escolar', year)
      .order('creado_en', { ascending: false })
      .then(({ data }) => { setPermisos(data||[]); setCargando(false) })
  }, [filtroFecha, year])

  const retiros   = permisos.filter(p => p.subtipo === 'retiro_anticipado')
  const pendientes = permisos.filter(p => p.estado === 'pendiente')

  const exportar = () => exportarCSV(
    `permisos_${filtroFecha}.csv`,
    ['Fecha','Estudiante','Grado','Tipo','Estado','Quien retira','Hora retiro','Motivo'],
    permisos.map(r => [r.fecha, `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}`, r.estudiantes?.grados?.nombre, SUBTIPO[r.subtipo]||r.subtipo, r.estado, r.quien_retira||'', r.hora_retiro||'', r.motivo])
  )

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', padding: 20, marginBottom: 16 }}>
        <div style={{ flex: '0 0 180px' }}>
          <label style={s.label}>Fecha</label>
          <input type="date" style={{ ...s.select, maxWidth: 200 }} value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} max={hoy()} />
        </div>
      </div>

      {retiros.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '12px 20px', marginBottom: 16, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          {retiros.length} retiro{retiros.length !== 1 ? 's' : ''} anticipado{retiros.length !== 1 ? 's' : ''} para hoy
          {retiros.filter(r => r.estado === 'pendiente').length > 0 && ` · ${retiros.filter(r => r.estado === 'pendiente').length} pendiente(s) de autorizar`}
        </div>
      )}

      <Seccion titulo={`Permisos del día`} descripcion={`${fechaEs(filtroFecha)} · ${permisos.length} registro(s)`}
        onImprimir={() => imprimirReporte('Permisos del día', 'rpt-permisos')}
        onExportar={exportar} cargando={cargando}>
        <div id="rpt-permisos">
          <h2>Permisos — {fechaEs(filtroFecha)}</h2>
          <Tabla
            cols={[
              { key: 'est',    label: 'Estudiante', render: r => `${r.estudiantes?.apellido}, ${r.estudiantes?.nombre}` },
              { key: 'grado',  label: 'Grado', render: r => r.estudiantes?.grados?.nombre },
              { key: 'tipo',   label: 'Tipo', render: r => SUBTIPO[r.subtipo]||r.subtipo },
              { key: 'quien',  label: 'Quién retira', render: r => r.quien_retira || '—' },
              { key: 'hora',   label: 'Hora', render: r => r.hora_retiro || '—' },
              { key: 'estado', label: 'Estado', render: r => (
                <span style={{ padding: '2px 10px', borderRadius: 20, background: '#f4f7fc', color: ESTADO_COLOR[r.estado]||'#374151', fontWeight: 700, fontSize: 12 }}>{r.estado}</span>
              )},
            ]}
            rows={permisos} emptyMsg="Sin permisos para esta fecha" />
        </div>
      </Seccion>
    </>
  )
}

// ── PRINCIPAL ─────────────────────────────────
export default function Reportes() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const TABS = [
    ['admin','recepcion'].includes(perfil?.rol) && { id: 'cobros', label: 'Cobros', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
    ['admin','docente','direccion_academica','registro_academico'].includes(perfil?.rol) && { id: 'asistencia', label: 'Asistencia', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
    ['admin','docente','direccion_academica','registro_academico'].includes(perfil?.rol) && { id: 'academico', label: 'Académico', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    ['admin','direccion_academica','registro_academico'].includes(perfil?.rol) && { id: 'anecdotario', label: 'Anecdotario', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
    ['admin','recepcion','direccion_academica'].includes(perfil?.rol) && { id: 'permisos', label: 'Permisos', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg> },
  ].filter(Boolean)

  const [tab, setTab] = useState(TABS[0]?.id || '')

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Reportes</h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>Visualiza, imprime y exporta reportes por área</p>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #f0f0f0', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '10px 20px', border: 'none', borderBottom: tab === t.id ? '3px solid #5B2D8E' : '3px solid transparent', background: 'none', color: tab === t.id ? '#3d1f61' : '#b0a8c0', fontWeight: tab === t.id ? 800 : 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7 }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'cobros'      && <ReportesCobros />}
      {tab === 'asistencia'  && <ReportesAsistencia year={year} perfil={perfil} />}
      {tab === 'academico'   && <ReportesAcademico year={year} perfil={perfil} />}
      {tab === 'anecdotario' && <ReportesAnecdotario year={year} perfil={perfil} />}
      {tab === 'permisos'    && <ReportesPermisos year={year} />}
    </div>
  )
}

const s = {
  label:  { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff', color: '#222', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer', outline: 'none' },
}