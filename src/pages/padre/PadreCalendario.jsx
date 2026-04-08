import { useEffect, useState } from 'react'
import { supabase } from '../../supabase'
import { useYearEscolar } from '../../hooks/useYearEscolar'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function esFechaEnRango(fechaStr, inicio, fin) {
  return fechaStr >= inicio && fechaStr <= (fin || inicio)
}

export default function PadreCalendario() {
  const yearEscolar = useYearEscolar()
  const hoy = new Date()
  const [mes,      setMes]      = useState(hoy.getMonth())
  const [anio,     setAnio]     = useState(hoy.getFullYear())
  const [eventos,  setEventos]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [detalle,  setDetalle]  = useState(null) // { dia, eventos }

  useEffect(() => { cargar() }, [yearEscolar])

  async function cargar() {
    setLoading(true)
    const year = yearEscolar || hoy.getFullYear()

    // Intentar con año exacto primero
    let { data, error } = await supabase.from('eventos_calendario')
      .select('titulo, descripcion, fecha_inicio, fecha_fin, tipo, color')
      .eq('año_escolar', year)
      .order('fecha_inicio')

    // Si no hay datos (RLS o año distinto), cargar sin filtro de año
    if (!error && (!data || data.length === 0)) {
      const res = await supabase.from('eventos_calendario')
        .select('titulo, descripcion, fecha_inicio, fecha_fin, tipo, color')
        .order('fecha_inicio')
      if (!res.error) data = res.data
    }

    if (!error) setEventos(data || [])
    setLoading(false)
  }

  // Días del mes
  const primerDia    = new Date(anio, mes, 1).getDay()
  const diasEnMes    = new Date(anio, mes + 1, 0).getDate()
  const celdas       = primerDia + diasEnMes
  const filas        = Math.ceil(celdas / 7)

  function eventosDia(d) {
    const fechaStr = `${anio}-${String(mes + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return eventos.filter(e => esFechaEnRango(fechaStr, e.fecha_inicio, e.fecha_fin))
  }

  function navMes(delta) {
    let nm = mes + delta
    let na = anio
    if (nm < 0) { nm = 11; na-- }
    if (nm > 11) { nm = 0; na++ }
    setMes(nm); setAnio(na); setDetalle(null)
  }

  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()

  // Próximos eventos del mes actual
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`
  const proximos = eventos.filter(e => e.fecha_inicio >= hoyStr).slice(0, 6)

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontWeight:800, fontSize:20, color:'#0f1d40', letterSpacing:'-0.5px' }}>Calendario Escolar</div>
        <div style={{ fontSize:13, color:'#9ca3af', marginTop:4 }}>Eventos y actividades del colegio</div>
      </div>

      <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'flex-start' }}>
        {/* Grilla */}
        <div style={{ flex:'1 1 320px', background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff' }}>
          {/* Navegación mes */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <button onClick={() => navMes(-1)} style={{ background:'#f8f7ff', border:'1px solid #e9e3ff', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#5B2D8E', display:'flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ fontWeight:800, fontSize:15, color:'#0f1d40' }}>{MESES[mes]} {anio}</div>
            <button onClick={() => navMes(1)} style={{ background:'#f8f7ff', border:'1px solid #e9e3ff', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#5B2D8E', display:'flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Cabecera días */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'#9ca3af', padding:'4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Celdas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
            {Array.from({ length: filas * 7 }).map((_, i) => {
              const dia = i - primerDia + 1
              const valido = dia >= 1 && dia <= diasEnMes
              if (!valido) return <div key={i} />
              const evs = eventosDia(dia)
              const hoyDia = esHoy(dia)
              const tieneEvs = evs.length > 0
              return (
                <div key={i}
                  onClick={() => tieneEvs && setDetalle({ dia, eventos: evs })}
                  style={{ aspectRatio:'1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderRadius:9, background: hoyDia ? '#5B2D8E' : tieneEvs ? `${evs[0].color || '#5B2D8E'}14` : 'transparent', cursor: tieneEvs ? 'pointer' : 'default', transition:'background 0.15s', position:'relative', gap:2 }}>
                  <span style={{ fontSize:12, fontWeight: hoyDia || tieneEvs ? 800 : 500, color: hoyDia ? '#fff' : tieneEvs ? '#0f1d40' : '#6b7280' }}>{dia}</span>
                  {tieneEvs && (
                    <div style={{ display:'flex', gap:2 }}>
                      {evs.slice(0,3).map((e, ei) => (
                        <div key={ei} style={{ width:5, height:5, borderRadius:'50%', background: hoyDia ? 'rgba(255,255,255,0.7)' : (e.color || '#5B2D8E') }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Detalle del día o próximos */}
        <div style={{ flex:'1 1 240px', display:'flex', flexDirection:'column', gap:12 }}>
          {detalle ? (
            <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:14, color:'#0f1d40' }}>{MESES[mes]} {detalle.dia}</div>
                <button onClick={() => setDetalle(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, lineHeight:1 }}>×</button>
              </div>
              {detalle.eventos.map((e, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom: i < detalle.eventos.length - 1 ? '1px solid #f3eeff' : 'none' }}>
                  <div style={{ width:4, borderRadius:2, background: e.color || '#5B2D8E', flexShrink:0, alignSelf:'stretch' }} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:'#0f1d40', marginBottom:3 }}>{e.titulo}</div>
                    {e.descripcion && <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.4 }}>{e.descripcion}</div>}
                    {e.fecha_fin && e.fecha_fin !== e.fecha_inicio && (
                      <div style={{ fontSize:10, color:'#9ca3af', marginTop:3 }}>Hasta: {new Date(e.fecha_fin + 'T00:00:00').toLocaleDateString('es-SV', { day:'numeric', month:'short' })}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background:'#fff', borderRadius:16, padding:20, boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff' }}>
              <div style={{ fontWeight:800, fontSize:14, color:'#0f1d40', marginBottom:14 }}>Próximos eventos</div>
              {loading ? (
                <div style={{ color:'#9ca3af', fontSize:13 }}>Cargando…</div>
              ) : proximos.length === 0 ? (
                <div style={{ color:'#9ca3af', fontSize:13 }}>No hay eventos próximos</div>
              ) : proximos.map((e, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom: i < proximos.length - 1 ? '1px solid #f3eeff' : 'none' }}>
                  <div style={{ width:4, borderRadius:2, background: e.color || '#5B2D8E', flexShrink:0, minHeight:40, alignSelf:'stretch' }} />
                  <div>
                    <div style={{ fontWeight:700, fontSize:12, color:'#0f1d40' }}>{e.titulo}</div>
                    <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>
                      {new Date(e.fecha_inicio + 'T00:00:00').toLocaleDateString('es-SV', { weekday:'short', day:'numeric', month:'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
