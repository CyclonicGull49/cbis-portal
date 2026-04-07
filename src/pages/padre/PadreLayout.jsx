import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PadreHijoProvider, usePadreHijo } from '../../hooks/usePadreHijo.jsx'
import { supabase } from '../../supabase'

// ── Breakpoint ─────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = window.innerWidth
    if (w < 768)  return 'mobile'
    if (w < 1024) return 'tablet'
    return 'desktop'
  })
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth
      setBp(w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop')
    }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return bp
}

// ── Icons ──────────────────────────────────────
const Icons = {
  inicio: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  notas: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  cobros: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  documentos: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  solicitudes: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  calendario: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  logout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
}

const NAV = [
  { id: 'inicio',      label: 'Inicio',       path: '/padre/inicio' },
  { id: 'notas',       label: 'Notas',        path: '/padre/notas' },
  { id: 'cobros',      label: 'Cobros',       path: '/padre/cobros' },
  { id: 'documentos',  label: 'Documentos',   path: '/padre/documentos' },
  { id: 'solicitudes', label: 'Solicitudes',  path: '/padre/solicitudes' },
  { id: 'calendario',  label: 'Calendario',   path: '/padre/calendario' },
]
const PRIORIDAD_MOVIL = ['inicio', 'notas', 'cobros', 'solicitudes']

// ── Nivel → color ──────────────────────────────
const nivelColor = {
  primera_infancia: '#0e9490',
  primaria:         '#a16207',
  secundaria:       '#c2410c',
  bachillerato:     '#5B2D8E',
}

// ── HijoSelector ──────────────────────────────
function HijoSelector({ compact = false }) {
  const { hijos, hijoActual, setHijoActual, agregarHijo } = usePadreHijo()
  const [open,       setOpen]       = useState(false)
  const [modoAgreg,  setModoAgreg]  = useState(false)
  const [query,      setQuery]      = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando,   setBuscando]   = useState(false)
  const [agregando,  setAgregando]  = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (query.trim().length < 2) { setResultados([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      const { data } = await supabase.rpc('buscar_estudiantes_publico', { p_query: query.trim() })
      setBuscando(false)
      setResultados((data || []).map(r => ({
        id: r.id, nombre: r.nombre, apellido: r.apellido,
        grados: { nombre: r.grado_nombre, nivel: r.grado_nivel },
      })))
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function handleAgregar(est) {
    setAgregando(true)
    try {
      await agregarHijo(est.id, 'Padre')
      setModoAgreg(false)
      setOpen(false)
      setQuery('')
      setResultados([])
    } catch (e) {
      alert(e.message?.includes('ya tiene') ? 'Este estudiante ya tiene un encargado vinculado.' : e.message)
    }
    setAgregando(false)
  }

  if (!hijoActual) return null
  const color    = nivelColor[hijoActual.grados?.nivel] || '#5B2D8E'
  const initials = `${hijoActual.nombre?.[0] || ''}${hijoActual.apellido?.[0] || ''}`

  return (
    <div style={{ position:'relative' }}>
      <button onClick={() => { setOpen(v => !v); setModoAgreg(false) }}
        style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
          padding:'10px 12px',
          background: open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
          borderRadius:11, border:'1px solid rgba(255,255,255,0.1)',
          cursor:'pointer', fontFamily:'inherit' }}>
        <div style={{ width:34, height:34, borderRadius:10, background:color,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:800, fontSize:13, color:'#fff', flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ flex:1, textAlign:'left' }}>
          <div style={{ color:'#fff', fontWeight:700, fontSize:13, lineHeight:1.2 }}>
            {hijoActual.nombre} {hijoActual.apellido}
          </div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10, fontWeight:600 }}>
            {hijoActual.grados?.nombre || '—'}{hijos.length > 1 ? ` · ${hijos.length} vinculados` : ''}
          </div>
        </div>
        <span style={{ color:'rgba(255,255,255,0.4)', display:'flex', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>{Icons.chevron}</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:99,
          background:'linear-gradient(160deg,#2d1554,#5B2D8E)',
          borderRadius:12, border:'1px solid rgba(255,255,255,0.15)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.3)', overflow:'hidden' }}>

          {/* Lista de hijos */}
          {!modoAgreg && hijos.map(h => {
            const c   = nivelColor[h.grados?.nivel] || '#5B2D8E'
            const ini = `${h.nombre?.[0] || ''}${h.apellido?.[0] || ''}`
            const activo = h.id === hijoActual.id
            return (
              <button key={h.id} onClick={() => { setHijoActual(h); setOpen(false) }}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%',
                  padding:'10px 12px', border:'none', cursor:'pointer', fontFamily:'inherit',
                  background: activo ? 'rgba(255,255,255,0.12)' : 'transparent',
                  borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width:30, height:30, borderRadius:9, background:c,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:800, fontSize:11, color:'#fff', flexShrink:0 }}>{ini}</div>
                <div style={{ textAlign:'left', flex:1 }}>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:12 }}>{h.nombre} {h.apellido}</div>
                  <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10 }}>{h.grados?.nombre}</div>
                </div>
                {activo && <span style={{ width:7, height:7, borderRadius:'50%', background:'#D4A017', flexShrink:0 }} />}
              </button>
            )
          })}

          {/* Botón agregar / búsqueda */}
          {!modoAgreg ? (
            <button onClick={() => setModoAgreg(true)}
              style={{ display:'flex', alignItems:'center', gap:8, width:'100%',
                padding:'10px 12px', border:'none', cursor:'pointer', fontFamily:'inherit',
                background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.55)',
                fontSize:12, fontWeight:600 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Vincular otro hijo/a
            </button>
          ) : (
            <div style={{ padding:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                background:'rgba(255,255,255,0.1)', borderRadius:9, marginBottom:8,
                border:'1px solid rgba(255,255,255,0.15)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Nombre o apellido…"
                  style={{ flex:1, background:'transparent', border:'none', outline:'none',
                    color:'#fff', fontSize:12, fontFamily:'inherit' }} />
              </div>
              {buscando && <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textAlign:'center', padding:'6px 0' }}>Buscando…</div>}
              {resultados.map(r => (
                <button key={r.id} onClick={() => handleAgregar(r)} disabled={agregando}
                  style={{ display:'flex', alignItems:'center', gap:8, width:'100%',
                    padding:'8px 10px', borderRadius:8, border:'none', cursor:'pointer',
                    fontFamily:'inherit', background:'rgba(255,255,255,0.07)',
                    marginBottom:4, opacity: agregando ? 0.5 : 1 }}>
                  <div style={{ width:26, height:26, borderRadius:7,
                    background: nivelColor[r.grados?.nivel] || '#5B2D8E',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontWeight:800, fontSize:10, color:'#fff', flexShrink:0 }}>
                    {r.nombre?.[0]}{r.apellido?.[0]}
                  </div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:12 }}>{r.apellido}, {r.nombre}</div>
                    <div style={{ color:'rgba(255,255,255,0.45)', fontSize:10 }}>{r.grados?.nombre}</div>
                  </div>
                </button>
              ))}
              <button onClick={() => { setModoAgreg(false); setQuery(''); setResultados([]) }}
                style={{ width:'100%', marginTop:4, padding:'6px', background:'none', border:'none',
                  color:'rgba(255,255,255,0.35)', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


// ── SidebarContent ─────────────────────────────
function SidebarContent({ onNav, sidebarOpen, setSidebarOpen, isTablet }) {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { perfil, signOut } = useAuth()
  const current = NAV.find(n => location.pathname.startsWith(n.path))?.id || 'inicio'

  return (
    <>
      {/* blobs */}
      <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', width:280, height:280, background:'radial-gradient(circle,rgba(255,255,255,0.08) 0%,transparent 100%)', filter:'blur(50px)', top:-60, left:-60 }} />
      <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', width:180, height:180, background:'radial-gradient(circle,rgba(212,160,23,0.12) 0%,transparent 70%)', filter:'blur(40px)', top:120, right:-40 }} />
      <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', width:200, height:200, background:'radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)', filter:'blur(45px)', bottom:120, left:-30 }} />
      <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', width:220, height:220, background:'radial-gradient(circle,rgba(212,160,23,0.10) 0%,transparent 70%)', filter:'blur(50px)', bottom:-40, right:-40 }} />
      {/* grid pattern */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize:'28px 28px' }} />

      {/* Header */}
      <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)', position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:11, overflow:'hidden', boxShadow:'0 4px 12px rgba(0,0,0,0.3)', flexShrink:0 }}>
            <img src="/logo.png" alt="CBIS" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:11 }} onError={e => { e.target.style.display='none' }} />
          </div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:15, letterSpacing:'-0.3px', display:'flex', alignItems:'center', gap:5 }}>
              CBIS
              <svg width="13" height="13" viewBox="0 0 28 28" fill="none"><rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/><rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/></svg>
            </div>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9, fontStyle:'italic', lineHeight:1.3 }}>Portal de Padres</div>
          </div>
        </div>
        {isTablet && (
          <button onClick={() => setSidebarOpen(false)}
            style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:6, cursor:'pointer', color:'rgba(255,255,255,0.6)', display:'flex' }}>
            {Icons.close}
          </button>
        )}
      </div>

      {/* Hijo selector */}
      <div style={{ padding:'12px 10px', borderBottom:'1px solid rgba(255,255,255,0.08)', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6, paddingLeft:2 }}>Estudiante</div>
        <HijoSelector />
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 8px 4px', overflowY:'auto', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'1.2px', padding:'8px 10px 4px' }}>Menú</div>
        {NAV.map(item => {
          const activo = current === item.id
          return (
            <button key={item.id}
              onClick={() => { navigate(item.path); onNav?.() }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'7px 8px', borderRadius:10, border:'none', background: activo ? 'rgba(255,255,255,0.11)' : 'transparent', color: activo ? '#fff' : 'rgba(255,255,255,0.48)', fontSize:12.5, fontWeight: activo ? 700 : 500, cursor:'pointer', textAlign:'left', fontFamily:'Plus Jakarta Sans,system-ui,sans-serif', transition:'all 0.15s', marginBottom:1 }}
              className="padre-nav-btn">
              <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: activo ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.06)', border: activo ? '1px solid rgba(212,160,23,0.28)' : '1px solid rgba(255,255,255,0.06)', color: activo ? '#D4A017' : 'rgba(255,255,255,0.4)', transition:'all 0.15s' }}>
                {Icons[item.id]}
              </div>
              <span style={{ flex:1, letterSpacing:'-0.1px' }}>{item.label}</span>
              {activo && <span style={{ width:5, height:5, borderRadius:'50%', background:'#D4A017', flexShrink:0 }} />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.08)', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:10, background:'rgba(255,255,255,0.05)', marginBottom:6, border:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#D4A017,#b8860b)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11, flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,0.25)', border:'1.5px solid rgba(255,255,255,0.15)' }}>
            {perfil?.nombre?.charAt(0)}
          </div>
          <div style={{ overflow:'hidden', flex:1 }}>
            <div style={{ color:'#fff', fontSize:11.5, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.3 }}>{perfil?.nombre}</div>
            <div style={{ color:'#D4A017', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', marginTop:1 }}>Padre / Tutor</div>
          </div>
        </div>
        <button onClick={() => signOut()}
          style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.4)', fontSize:11.5, fontWeight:600, cursor:'pointer', textAlign:'left', fontFamily:'inherit', display:'flex', alignItems:'center', gap:8 }}
          className="padre-logout-btn">
          {Icons.logout} Cerrar sesión
        </button>
      </div>
    </>
  )
}

// ── Inner layout (necesita el contexto del hijo) ──
function PadreLayoutInner() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { perfil } = useAuth()
  const { hijoActual } = usePadreHijo()
  const bp = useBreakpoint()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isMobile  = bp === 'mobile'
  const isTablet  = bp === 'tablet'
  const isDesktop = bp === 'desktop'

  const current = NAV.find(n => location.pathname.startsWith(n.path))
  const barraItems = NAV.filter(n => PRIORIDAD_MOVIL.includes(n.id))
  const masItems   = NAV.filter(n => !PRIORIDAD_MOVIL.includes(n.id))

  const sidebarStyle = {
    width:228, flexShrink:0,
    background:'linear-gradient(180deg,#1a0d30 0%,#2d1554 45%,#5B2D8E 100%)',
    display:'flex', flexDirection:'column',
    boxShadow:'4px 0 24px rgba(61,31,97,0.35)',
    position:'relative', overflow:'hidden',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .padre-nav-btn:hover{background:rgba(255,255,255,0.1)!important;color:#fff!important;}
        .padre-logout-btn:hover{background:rgba(239,68,68,0.12)!important;color:#fca5a5!important;border-color:rgba(239,68,68,0.2)!important;}
        .padre-bottom-btn:hover{background:rgba(91,45,142,0.08)!important;}
        :root{--sab:env(safe-area-inset-bottom,0px);--sat:env(safe-area-inset-top,0px);}
      `}</style>

      <div style={{ display:'flex', minHeight:'100vh', width:'100vw', background:'#F4F7FC', fontFamily:'Plus Jakarta Sans,system-ui,sans-serif' }}>

        {/* Desktop sidebar */}
        {isDesktop && (
          <div style={sidebarStyle}>
            <SidebarContent isTablet={false} />
          </div>
        )}

        {/* Tablet drawer */}
        {isTablet && (
          <>
            {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:99 }} />}
            <div style={{ ...sidebarStyle, position:'fixed', top:0, left:0, height:'100vh', zIndex:100, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition:'transform 0.25s ease' }}>
              <SidebarContent isTablet onNav={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            </div>
          </>
        )}

        {/* Main */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, paddingBottom: isMobile ? 'calc(60px + env(safe-area-inset-bottom,0px))' : 0 }}>

          {/* Topbar */}
          <div style={{ position:'sticky', top:0, zIndex:50 }}>
            {isMobile && <div style={{ height:'env(safe-area-inset-top,44px)', background:'#1a0d30', minHeight:44 }} />}
            <div style={{ background:'#fff', padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(91,45,142,0.07)', borderBottom:'3px solid transparent', backgroundImage:'linear-gradient(#fff,#fff),linear-gradient(90deg,#7B3FE4,#EA580C,#D4A017,#16A34A)', backgroundOrigin:'border-box', backgroundClip:'padding-box,border-box' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                {isTablet && (
                  <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#3d1f61', display:'flex', padding:4 }}>
                    {Icons.menu}
                  </button>
                )}
                {isMobile && <img src="/logo.png" alt="CBIS" style={{ width:28, height:28, objectFit:'cover', borderRadius:8 }} />}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:4, height:20, borderRadius:2, background:'linear-gradient(180deg,#3d1f61,#5B2D8E)', flexShrink:0 }} />
                  <span style={{ color:'#3d1f61', fontWeight:800, fontSize: isMobile ? 14 : 15, letterSpacing:'-0.3px' }}>
                    {current?.label || 'Portal de Padres'}
                  </span>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {!isMobile && hijoActual && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 12px', background:'#f8f7ff', borderRadius:20, border:'1px solid #e9e3ff' }}>
                    <div style={{ width:22, height:22, borderRadius:7, background: nivelColor[hijoActual.grados?.nivel] || '#5B2D8E', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:9, color:'#fff' }}>
                      {hijoActual.nombre?.[0]}{hijoActual.apellido?.[0]}
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:'#3d1f61' }}>{hijoActual.nombre} {hijoActual.apellido}</span>
                    <span style={{ fontSize:10, color:'#9ca3af' }}>·</span>
                    <span style={{ fontSize:11, color:'#9ca3af' }}>{hijoActual.grados?.nombre}</span>
                  </div>
                )}
                <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#D4A017,#b8860b)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11 }}>
                  {perfil?.nombre?.charAt(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Outlet */}
          <div style={{ flex:1, padding: isMobile ? 16 : 28, overflowY:'auto', paddingBottom: isMobile ? 'calc(76px + env(safe-area-inset-bottom,0px))' : 28 }}>
            <Outlet />
          </div>
        </div>

        {/* Mobile bottom bar */}
        {isMobile && (
          <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #e5e7eb', display:'flex', alignItems:'center', zIndex:200, boxShadow:'0 -2px 16px rgba(61,31,97,0.1)', paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
            <div style={{ display:'flex', width:'100%', height:60 }}>
              {barraItems.map(item => {
                const activo = current?.id === item.id
                return (
                  <button key={item.id} onClick={() => navigate(item.path)} className="padre-bottom-btn"
                    style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, height:'100%', border:'none', background:'transparent', cursor:'pointer', fontFamily:'inherit', position:'relative' }}>
                    {activo && <span style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:32, height:3, borderRadius:'0 0 4px 4px', background:'#5B2D8E' }} />}
                    <span style={{ color: activo ? '#5B2D8E' : '#9ca3af', transition:'color 0.15s' }}>{Icons[item.id]}</span>
                    <span style={{ fontSize:10, fontWeight: activo ? 700 : 500, color: activo ? '#5B2D8E' : '#9ca3af' }}>{item.label}</span>
                  </button>
                )
              })}
              {masItems.map(item => {
                const activo = current?.id === item.id
                return (
                  <button key={item.id} onClick={() => navigate(item.path)} className="padre-bottom-btn"
                    style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, height:'100%', border:'none', background: activo ? '#f3eeff' : 'transparent', cursor:'pointer', fontFamily:'inherit', position:'relative' }}>
                    {activo && <span style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:32, height:3, borderRadius:'0 0 4px 4px', background:'#5B2D8E' }} />}
                    <span style={{ color: activo ? '#5B2D8E' : '#9ca3af' }}>{Icons[item.id]}</span>
                    <span style={{ fontSize:10, fontWeight: activo ? 700 : 500, color: activo ? '#5B2D8E' : '#9ca3af' }}>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Export con Provider ────────────────────────
export default function PadreLayout() {
  return (
    <PadreHijoProvider>
      <PadreLayoutInner />
    </PadreHijoProvider>
  )
}
