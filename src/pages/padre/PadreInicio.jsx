import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase'
import { useAuth } from '../../context/AuthContext'
import { usePadreHijo } from '../../hooks/usePadreHijo.jsx'
import { useYearEscolar } from '../../hooks/useYearEscolar'

const nivelColor = {
  primera_infancia: '#0e9490', primaria: '#a16207',
  secundaria: '#c2410c',       bachillerato: '#5B2D8E',
}

function StatCard({ icon, label, value, sub, color = '#5B2D8E', onClick }) {
  return (
    <div onClick={onClick} style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff', display:'flex', alignItems:'flex-start', gap:16, cursor: onClick ? 'pointer' : 'default', transition:'box-shadow 0.2s', flex:1, minWidth:160 }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow='0 6px 20px rgba(91,45,142,0.13)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow='0 2px 12px rgba(91,45,142,0.07)')}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:24, fontWeight:800, color:'#0f1d40', letterSpacing:'-1px', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', marginTop:4 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function PadreInicio() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const { hijoActual, nombreEncargado } = usePadreHijo()
  const yearEscolar = useYearEscolar()

  const [stats,    setStats]    = useState({ cobros:0, solicitudes:0, promedio:null })
  const [eventos,  setEventos]  = useState([])
  const [loading,  setLoading]  = useState(true)

  const { loading: loadingHijo } = usePadreHijo()
  useEffect(() => {
    if (hijoActual) cargar()
    else if (!loadingHijo) setLoading(false)
  }, [hijoActual, yearEscolar, loadingHijo])

  async function cargar() {
    setLoading(true)
    const estId = hijoActual.id
    const year  = yearEscolar || new Date().getFullYear()

    const [
      { data: cobros },
      { data: solicitudes },
      { data: notas },
      { data: evts },
    ] = await Promise.all([
      supabase.from('cobros').select('id, estado').eq('estudiante_id', estId).eq('estado', 'pendiente'),
      supabase.from('solicitudes').select('id').eq('solicitante_id', perfil.id).eq('estado', 'pendiente'),
      supabase.from('notas').select('nota').eq('estudiante_id', estId).eq('año_escolar', year).eq('tipo', 'ef'),
      supabase.from('eventos_calendario').select('titulo, fecha_inicio, tipo').eq('año_escolar', year).gte('fecha_inicio', new Date().toISOString().split('T')[0]).order('fecha_inicio').limit(4),
    ])

    const notasEf = (notas || []).map(n => n.nota).filter(n => n !== null)
    const prom = notasEf.length ? (notasEf.reduce((a, b) => a + b, 0) / notasEf.length).toFixed(1) : null

    setStats({ cobros: cobros?.length || 0, solicitudes: solicitudes?.length || 0, promedio: prom })
    setEventos(evts || [])
    setLoading(false)
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  const color = hijoActual ? (nivelColor[hijoActual.grados?.nivel] || '#5B2D8E') : '#5B2D8E'

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>

      {/* Hero bienvenida */}
      <div style={{ background:`linear-gradient(135deg, #1a0d30, #5B2D8E)`, borderRadius:20, padding:'28px 32px', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(212,160,23,0.15) 0%,transparent 70%)', filter:'blur(60px)', top:-80, right:-60, pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>{saludo}, {(nombreEncargado || perfil?.nombre)?.split(' ')[0]}</div>
          {hijoActual ? (
            <>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:10 }}>
                {hijoActual.nombre} {hijoActual.apellido}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ padding:'4px 12px', borderRadius:20, background: color, fontSize:11, fontWeight:700, color:'#fff' }}>
                  {hijoActual.grados?.nombre}
                </span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontWeight:500 }}>
                  Año escolar {new Date().getFullYear()}
                </span>
              </div>
            </>
          ) : (
            <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>Bienvenido al Portal de Padres</div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af', fontWeight:600 }}>Cargando…</div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:24 }}>
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              label="Cobros pendientes"
              value={stats.cobros}
              sub={stats.cobros > 0 ? 'Requieren atención' : 'Al día'}
              color={stats.cobros > 0 ? '#dc2626' : '#16a34a'}
              onClick={() => navigate('/padre/cobros')}
            />
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
              label="Promedio EF"
              value={stats.promedio ?? '—'}
              sub="Notas finales registradas"
              color="#5B2D8E"
              onClick={() => navigate('/padre/notas')}
            />
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
              label="Solicitudes pendientes"
              value={stats.solicitudes}
              sub="Enviadas por ti"
              color="#d97706"
              onClick={() => navigate('/padre/solicitudes')}
            />
          </div>

          {/* Próximos eventos */}
          <div style={{ background:'#fff', borderRadius:16, padding:'20px 24px', boxShadow:'0 2px 12px rgba(91,45,142,0.07)', border:'1px solid #f0ebff' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#0f1d40' }}>Próximos eventos</div>
              <button onClick={() => navigate('/padre/calendario')} style={{ background:'none', border:'none', cursor:'pointer', color:'#5B2D8E', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>Ver calendario →</button>
            </div>
            {eventos.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'#9ca3af', fontSize:13 }}>No hay eventos próximos</div>
            ) : eventos.map((e, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < eventos.length - 1 ? '1px solid #f3eeff' : 'none' }}>
                <div style={{ width:38, height:38, borderRadius:10, background: e.color ? `${e.color}18` : '#f3eeff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={'#5B2D8E' || '#5B2D8E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:'#0f1d40' }}>{e.titulo}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                    {new Date(e.fecha_inicio + 'T00:00:00').toLocaleDateString('es-SV', { weekday:'short', day:'numeric', month:'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
