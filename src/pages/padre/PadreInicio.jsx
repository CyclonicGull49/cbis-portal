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
    <div onClick={onClick} style={{ background:'#fff', borderRadius:20, padding:'18px 20px', boxShadow:'0 12px 28px rgba(26,13,48,0.06)', border:'1px solid rgba(26,13,48,0.06)', display:'flex', alignItems:'flex-start', gap:14, cursor: onClick ? 'pointer' : 'default', transition:'box-shadow 0.2s, transform 0.2s', flex:1, minWidth:160 }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.boxShadow='0 18px 38px rgba(26,13,48,0.1)'; e.currentTarget.style.transform='translateY(-2px)' } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.boxShadow='0 12px 28px rgba(26,13,48,0.06)'; e.currentTarget.style.transform='translateY(0)' } }}>
      <div style={{ width:44, height:44, borderRadius:14, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:24, fontWeight:800, color:'#1a0d30', letterSpacing:0, lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', marginTop:4 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function ActionTile({ title, sub, icon, color, onClick }) {
  return (
    <button onClick={onClick} className="parent-action" style={{
      minHeight: 142,
      border: '1px solid rgba(26,13,48,0.07)',
      background: '#fff',
      borderRadius: 22,
      padding: 16,
      cursor: 'pointer',
      textAlign: 'left',
      fontFamily: 'inherit',
      boxShadow: '0 12px 28px rgba(26,13,48,0.06)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
    }}>
      <span style={{ width: 58, height: 58, borderRadius: 18, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a0d30', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.65)' }}>
        {icon}
      </span>
      <span>
        <span style={{ display:'block', color:'#1a0d30', fontSize:15, fontWeight:800, lineHeight:1.15 }}>{title}</span>
        <span style={{ display:'block', color:'#706882', fontSize:11.5, fontWeight:600, marginTop:5, lineHeight:1.35 }}>{sub}</span>
      </span>
    </button>
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
  const acciones = [
    {
      title: 'Notas',
      sub: 'Resultados y períodos',
      color: '#FFE7A8',
      to: '/padre/notas',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    },
    {
      title: 'Cobros',
      sub: 'Pagos y pendientes',
      color: '#F9C8DC',
      to: '/padre/cobros',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      title: 'Solicitudes',
      sub: 'Permisos y seguimiento',
      color: '#CDE7FF',
      to: '/padre/solicitudes',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      title: 'Documentos',
      sub: 'Archivos escolares',
      color: '#DDF7BF',
      to: '/padre/documentos',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
  ]

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <style>{`
        .parent-action:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 38px rgba(26,13,48,0.11) !important;
          border-color: rgba(91,45,142,0.18) !important;
        }
      `}</style>

      {/* Hero bienvenida */}
      <div style={{ background:`linear-gradient(135deg, #1a0d30, #5B2D8E)`, borderRadius:24, padding:'30px 34px', marginBottom:18, position:'relative', overflow:'hidden', boxShadow:'0 22px 60px rgba(26,13,48,0.22)' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(118deg, transparent 0 54%, rgba(255,255,255,0.08) 54% 68%, transparent 68%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:240, height:240, borderRadius:56, background:'rgba(212,160,23,0.16)', filter:'blur(42px)', bottom:-70, right:80, transform:'rotate(-14deg)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#D4A017', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>{saludo}, {(nombreEncargado || perfil?.nombre)?.split(' ')[0]}</div>
          {hijoActual ? (
            <>
              <div style={{ fontSize:28, fontWeight:800, color:'#fff', letterSpacing:0, marginBottom:10, lineHeight:1.12 }}>
                Gestiona el día escolar de {hijoActual.nombre}.
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ padding:'4px 12px', borderRadius:20, background: color, fontSize:11, fontWeight:700, color:'#fff' }}>
                  {hijoActual.grados?.nombre}
                </span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.66)', fontWeight:600 }}>
                  {hijoActual.nombre} {hijoActual.apellido}
                </span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.46)', fontWeight:500 }}>
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
          <section style={{ background:'#fff', borderRadius:24, padding:20, marginBottom:24, boxShadow:'0 16px 42px rgba(26,13,48,0.07), 0 0 0 1px rgba(26,13,48,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:16, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:11, fontWeight:800, color:'#D4A017', textTransform:'uppercase', letterSpacing:'1.3px', marginBottom:4 }}>Centro familiar</div>
                <h2 style={{ margin:0, color:'#1a0d30', fontSize:24, fontWeight:800, letterSpacing:0 }}>Accesos rápidos</h2>
              </div>
              <span style={{ color:'#6b647c', fontSize:12, fontWeight:700, background:'#F8FBFF', border:'1px solid rgba(26,13,48,0.07)', borderRadius:999, padding:'8px 12px' }}>
                {hijoActual?.grados?.nombre || 'Portal de Padres'}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:14 }}>
              {acciones.map(a => (
                <ActionTile key={a.to} title={a.title} sub={a.sub} color={a.color} icon={a.icon} onClick={() => navigate(a.to)} />
              ))}
            </div>
          </section>

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
