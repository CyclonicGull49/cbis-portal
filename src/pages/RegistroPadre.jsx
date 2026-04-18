import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

function FloatingOrb({ style }) {
  return <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', ...style }} />
}

// ── Icons ──────────────────────────────────────
const IcoId   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M16 14h2M7 10h5M7 14h3"/></svg>
const IcoLock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const IcoEye  = ({ off }) => off
  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IcoCheck = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IcoUser  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoSchool = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>

// ── Formatea DUI con guión automático ──────────
function formatDui(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 8) return digits
  return digits.slice(0, 8) + '-' + digits.slice(8)
}

function duiSinGuion(dui) {
  return dui.replace(/-/g, '')
}

export default function RegistroPadre() {
  const navigate  = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [step,    setStep]    = useState(1) // 1=DUI+pass, 2=confirmar, 3=éxito
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPass,setShowPass]= useState(false)

  // Datos del form
  const [dui,      setDui]      = useState('')
  const [password, setPassword] = useState('')

  // Datos obtenidos del server tras verificar
  const [preview, setPreview] = useState(null)
  // { nombre, apellido_est, email, existe, hijos: [] }

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  // ── Paso 1: verificar DUI + contraseña ─────
  async function handleVerificar() {
    const duiClean = duiSinGuion(dui)
    if (duiClean.length !== 9) { setError('Ingresa tu DUI completo (9 dígitos)'); return }
    if (!password.trim())      { setError('Ingresa tu contraseña'); return }
    setError(''); setLoading(true)

    // Buscar estudiantes via función SECURITY DEFINER (bypasea RLS para usuario anon)
    // Busca en dui_padre, dui_madre y dui_tutor simultáneamente
    const duiConGuion = duiClean.slice(0,8) + '-' + duiClean.slice(8)

    // Intentar con dui sin guión primero, luego con guión (por si se guardó así)
    const { data: rows1, error: searchErr } = await supabase
      .rpc('buscar_estudiantes_por_dui', { p_dui: duiClean })
    const { data: rows2 } = await supabase
      .rpc('buscar_estudiantes_por_dui', { p_dui: duiConGuion })

    const allRows = [...(rows1 || []), ...(rows2 || [])]
    const seen = new Set()
    const rows = allRows.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true })

    setLoading(false)

    if (searchErr) { setError('Error al verificar: ' + searchErr.message); return }

    if (!rows || rows.length === 0) {
      setError('DUI no registrado en el sistema. Comunícate con el colegio.')
      return
    }

    // Verificar contraseña: primer apellido + 2026 (sin importar mayúsculas ni apellido compuesto)
    const passLower = password.trim().toLowerCase()
    const hijo = rows.find(r => {
      const primerApellido = (r.apellido || '').trim().split(' ')[0].toLowerCase()
      const apellidoCompleto = (r.apellido || '').trim().toLowerCase()
      return passLower === primerApellido + '2026' || passLower === apellidoCompleto + '2026'
    })

    if (!hijo) {
      const ejemploApellido = rows[0]?.apellido?.split(' ')[0] || 'García'
      setError(`Contraseña incorrecta. Usa el primer apellido de tu hijo/a seguido de "2026". Ej: ${ejemploApellido}2026`)
      return
    }

    // Verificar si ya tiene cuenta: intentar login silencioso
    const email = `${duiClean}@cbis.padre.sv`
    const { error: loginCheck } = await supabase.auth.signInWithPassword({
      email,
      password: password.trim()
    })
    const existe = !loginCheck
    // Si el login fue exitoso ya está dentro — lo sacamos para que el flujo continúe
    if (existe) await supabase.auth.signOut()

    setPreview({
      nombre:          rows[0].nombre || '',
      apellido_est:    (hijo.apellido || '').split(' ')[0],
      nombre_completo: `${hijo.nombre} ${hijo.apellido}`,
      email,
      existe,
      hijos:           rows,
    })
    setStep(2)
  }

  // ── Paso 2: crear cuenta o iniciar sesión ──
  async function handleActivar() {
    setLoading(true); setError('')
    const duiClean = duiSinGuion(dui)
    const email    = preview.email

    // Intentar login primero (cuenta ya podría existir)
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password: password.trim() })
if (!loginErr) {
  await new Promise(r => setTimeout(r, 500))
  navigate('/padre/inicio')
      return
    }

    // Crear cuenta nueva en Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password: password.trim(),
      options: {
        data: {
          nombre:   preview.nombre || 'Encargado',
          apellido: '',
          rol:      'padres',
          dui:      duiClean,
        }
      }
    })

    if (authErr) { setError('Error al crear cuenta: ' + authErr.message); setLoading(false); return }

    const userId = authData.user?.id
    if (!userId) { setError('Error inesperado. Intenta de nuevo.'); setLoading(false); return }

    // Esperar a que el trigger cree el perfil en perfiles
    await new Promise(r => setTimeout(r, 1200))

    // Upsert perfil con rol padres
    await supabase.from('perfiles').upsert({
      id:       userId,
      nombre:   preview.nombre || 'Encargado',
      apellido: '',
      email:    email,
      rol:      'padres',
    }, { onConflict: 'id' })

    // Vincular hijos usando UPDATE (unique constraint está en estudiante_id, no en perfil+estudiante)
    if (preview.hijos?.length > 0) {
      for (const h of preview.hijos) {
        const { error: e1 } = await supabase.from('padre_estudiante')
          .update({ perfil_id: userId, parentesco: 'Padre' })
          .eq('estudiante_id', h.id)
        if (e1) {
          await supabase.from('padre_estudiante')
            .insert({ perfil_id: userId, estudiante_id: h.id, parentesco: 'Padre' })
        }
      }
    }

    setLoading(false)
    setStep(3)
  }

  const duiFormateado = formatDui(dui)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { overflow-x:hidden; }
        .rp-root { min-height:100vh; width:100vw; font-family:'Plus Jakarta Sans',system-ui,sans-serif; display:flex; }

        /* LEFT */
        .rp-left {
          flex:1; position:relative; overflow:hidden;
          background:linear-gradient(160deg,#0d0720 0%,#1a0d30 30%,#2d1554 65%,#4a1f8a 100%);
          display:flex; flex-direction:column; justify-content:space-between; padding:48px 56px;
        }
        .rp-left::after { content:''; position:absolute; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; z-index:0; }
        .rp-lz { position:relative; z-index:1; }
        .rp-brand { display:flex; align-items:center; gap:12px; }
        .rp-logo-wrap { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05)); border:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .rp-logo-wrap img { width:100%; height:100%; object-fit:cover; border-radius:11px; }
        .rp-brand-name { font-size:20px; font-weight:800; color:#fff; letter-spacing:-0.5px; display:flex; align-items:center; gap:5px; }
        .rp-hero { padding:60px 0 40px; }
        .rp-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#D4A017; margin-bottom:24px; }
        .rp-eyebrow-line { width:20px; height:1.5px; background:#D4A017; }
        .rp-title { font-size:clamp(32px,2.8vw,50px); font-weight:800; line-height:1.05; letter-spacing:-2px; color:#fff; margin-bottom:24px; }
        .rp-title-dim  { color:rgba(255,255,255,0.32); font-style:italic; font-weight:300; }
        .rp-title-gold { color:#D4A017; }
        .rp-desc { font-size:14px; color:rgba(255,255,255,0.38); line-height:1.7; max-width:360px; margin-bottom:36px; }
        .rp-info-cards { display:flex; flex-direction:column; gap:10px; }
        .rp-info-card { display:flex; align-items:flex-start; gap:14px; padding:14px 16px; border-radius:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
        .rp-info-icon { width:34px; height:34px; border-radius:10px; flex-shrink:0; background:rgba(212,160,23,0.15); border:1px solid rgba(212,160,23,0.25); display:flex; align-items:center; justify-content:center; color:#D4A017; }
        .rp-info-title { font-size:12px; font-weight:700; color:rgba(255,255,255,0.85); margin-bottom:2px; }
        .rp-info-text  { font-size:11px; color:rgba(255,255,255,0.38); line-height:1.5; }
        .rp-footer { font-size:11px; color:rgba(255,255,255,0.18); font-weight:500; }

        /* RIGHT */
        .rp-right { width:500px; flex-shrink:0; background:#fff; display:flex; flex-direction:column; justify-content:center; padding:64px 56px; position:relative; overflow:hidden; }
        .rp-right::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,#1a0d30,#5B2D8E,#D4A017,#5B2D8E,#1a0d30); }
        .rp-right::after  { content:''; position:absolute; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(91,45,142,0.04) 0%,transparent 70%); bottom:-100px; right:-100px; pointer-events:none; }
        .rp-form-wrap { position:relative; z-index:1; opacity:0; transform:translateY(20px); transition:opacity 0.5s ease 0.1s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s; }
        .rp-form-wrap.mounted { opacity:1; transform:translateY(0); }
        .rp-greeting { font-size:11px; font-weight:700; color:#5B2D8E; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; display:flex; align-items:center; gap:8px; }
        .rp-greeting::before { content:''; width:16px; height:2px; background:linear-gradient(90deg,#5B2D8E,#D4A017); border-radius:2px; }
        .rp-h2 { font-size:26px; font-weight:800; color:#0f1d40; letter-spacing:-0.8px; line-height:1.1; margin-bottom:6px; }
        .rp-sub { font-size:13px; color:#9ca3af; line-height:1.5; margin-bottom:32px; }

        /* Fields */
        .rp-field { margin-bottom:18px; }
        .rp-label { display:block; font-size:11px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; transition:color 0.2s; }
        .rp-field:focus-within .rp-label { color:#5B2D8E; }
        .rp-input-wrap { display:flex; align-items:center; gap:10px; padding:13px 14px; background:#f8f7ff; border:1.5px solid #e9e3ff; border-radius:11px; transition:all 0.2s; }
        .rp-field:focus-within .rp-input-wrap { border-color:#5B2D8E; background:#fff; box-shadow:0 0 0 4px rgba(91,45,142,0.08); }
        .rp-ico { color:#c4b5fd; flex-shrink:0; display:flex; transition:color 0.2s; }
        .rp-field:focus-within .rp-ico { color:#5B2D8E; }
        .rp-input { flex:1; border:none; outline:none; font-size:15px; font-weight:600; font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:#0f1d40; background:transparent; caret-color:#5B2D8E; letter-spacing:0.5px; }
        .rp-input::placeholder { color:#c4c4d4; font-weight:400; letter-spacing:0; }
        .rp-show-btn { background:none; border:none; cursor:pointer; padding:2px; color:#c4b5fd; display:flex; transition:color 0.2s; }
        .rp-show-btn:hover { color:#5B2D8E; }

        /* Error */
        .rp-error { display:flex; align-items:flex-start; gap:8px; background:#fff1f2; border:1.5px solid #fecdd3; border-radius:10px; padding:11px 14px; margin-bottom:18px; font-size:13px; color:#be123c; font-weight:500; line-height:1.4; }

        /* Hint */
        .rp-hint { margin-top:12px; padding:12px 14px; border-radius:10px; background:rgba(212,160,23,0.08); border:1px solid rgba(212,160,23,0.2); font-size:12px; color:#92400e; font-weight:600; line-height:1.5; }

        /* Preview card */
        .rp-preview { background:#f8f7ff; border-radius:14px; border:1.5px solid #e9e3ff; padding:20px; margin-bottom:24px; }
        .rp-preview-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f3eeff; font-size:13px; }
        .rp-preview-row:last-child { border-bottom:none; }
        .rp-preview-key { color:#9ca3af; font-weight:600; }
        .rp-preview-val { color:#0f1d40; font-weight:700; text-align:right; }

        /* Buttons */
        .rp-btn { width:100%; padding:14px; background:linear-gradient(135deg,#2d1554 0%,#5B2D8E 100%); color:#fff; border:none; border-radius:11px; font-size:14px; font-weight:800; font-family:'Plus Jakarta Sans',system-ui,sans-serif; cursor:pointer; letter-spacing:0.3px; box-shadow:0 4px 16px rgba(91,45,142,0.35); transition:all 0.2s; position:relative; overflow:hidden; margin-bottom:12px; }
        .rp-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(91,45,142,0.45); }
        .rp-btn:disabled { opacity:0.6; cursor:not-allowed; }
        .rp-btn-shine { position:absolute; inset:0; background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.1) 50%,transparent 70%); transform:translateX(-100%); animation:shine 2.5s infinite 1s; }
        @keyframes shine { 100%{transform:translateX(250%);} }
        .rp-btn-ghost { width:100%; padding:11px; background:transparent; border:1.5px solid #e9e3ff; border-radius:11px; font-size:13px; font-weight:700; color:#9ca3af; font-family:'Plus Jakarta Sans',system-ui,sans-serif; cursor:pointer; transition:all 0.2s; }
        .rp-btn-ghost:hover { border-color:#5B2D8E; color:#5B2D8E; background:#f8f7ff; }
        .rp-btn-back { background:none; border:none; padding:0; margin-bottom:24px; font-size:12px; font-weight:700; color:#c4b5fd; font-family:'Plus Jakarta Sans',system-ui,sans-serif; cursor:pointer; display:flex; align-items:center; gap:6px; transition:color 0.2s; }
        .rp-btn-back:hover { color:#5B2D8E; }

        /* Loading dots */
        .rp-dots { display:inline-flex; gap:4px; align-items:center; }
        .rp-dots span { width:4px; height:4px; border-radius:50%; background:#fff; animation:blink 1.2s infinite; }
        .rp-dots span:nth-child(2){animation-delay:0.2s;} .rp-dots span:nth-child(3){animation-delay:0.4s;}
        @keyframes blink{0%,80%,100%{opacity:0.2;transform:scale(0.8)}40%{opacity:1;transform:scale(1)}}

        /* Éxito */
        .rp-exito { text-align:center; padding:16px 0; }
        .rp-exito-icon { width:68px; height:68px; border-radius:50%; background:linear-gradient(135deg,#2d1554,#5B2D8E); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; box-shadow:0 8px 24px rgba(91,45,142,0.4); }
        .rp-exito-title { font-size:22px; font-weight:800; color:#0f1d40; letter-spacing:-0.5px; margin-bottom:8px; }
        .rp-exito-sub { font-size:13px; color:#6b7280; line-height:1.6; margin-bottom:24px; }

        /* Login link */
        .rp-login-link { margin-top:20px; padding-top:18px; border-top:1px solid #f3eeff; text-align:center; font-size:13px; color:#9ca3af; }
        .rp-login-link button { background:none; border:none; cursor:pointer; color:#5B2D8E; font-weight:700; font-size:13px; font-family:inherit; text-decoration:underline; text-underline-offset:2px; }

        /* Mobile */
        @media(max-width:960px){.rp-root{flex-direction:column;}.rp-left{padding:36px 28px 40px;min-height:auto;}.rp-hero{padding:36px 0 28px;}.rp-title{font-size:30px;}.rp-info-cards{display:none;}.rp-right{width:100%;padding:44px 28px 52px;}}
        @media(max-width:480px){.rp-left{padding:24px 20px 32px;}.rp-right{padding:36px 20px 48px;}}
      `}</style>

      <div className="rp-root">

        {/* LEFT */}
        <div className="rp-left">
          <FloatingOrb style={{ width:480, height:480, background:'radial-gradient(circle,rgba(112,60,220,0.4) 0%,transparent 70%)', filter:'blur(70px)', top:-160, right:-80 }} />
          <FloatingOrb style={{ width:320, height:320, background:'radial-gradient(circle,rgba(234,88,12,0.25) 0%,transparent 70%)', filter:'blur(60px)', bottom:-60, right:40 }} />
          <FloatingOrb style={{ width:260, height:260, background:'radial-gradient(circle,rgba(212,160,23,0.18) 0%,transparent 70%)', filter:'blur(55px)', bottom:80, left:-20 }} />

          <div className="rp-lz">
            <div className="rp-brand">
              <div className="rp-logo-wrap">
                <img src="/logo.png" alt="CBIS" onError={e => { e.target.style.display='none' }} />
              </div>
              <div className="rp-brand-name">
                CBIS
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/><rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/></svg>
              </div>
            </div>
          </div>

          <div className="rp-hero rp-lz">
            <div className="rp-eyebrow"><span className="rp-eyebrow-line" /> Portal de Padres 2026</div>
            <h1 className="rp-title">
              Mantente<br />
              <span className="rp-title-dim">conectado</span><br />
              con tu <span className="rp-title-gold">hijo/a.</span>
            </h1>
            <p className="rp-desc">
              Accede a notas, cobros y documentos en tiempo real desde cualquier dispositivo.
            </p>
            <div className="rp-info-cards">
              {[
                { title:'Tu DUI es tu usuario', text:'Ingresa los 9 dígitos de tu DUI. Sin guiones, sin correo.' },
                { title:'Contraseña inicial',   text:'El apellido de tu hijo/a seguido de "2026". Ej: García2026' },
                { title:'Vinculación automática', text:'Si tienes más de un hijo en el colegio, todos aparecerán automáticamente.' },
              ].map(c => (
                <div className="rp-info-card" key={c.title}>
                  <div className="rp-info-icon"><IcoSchool /></div>
                  <div><div className="rp-info-title">{c.title}</div><div className="rp-info-text">{c.text}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-lz"><div className="rp-footer">© 2026 CBIS · Sonsonate, El Salvador</div></div>
        </div>

        {/* RIGHT */}
        <div className="rp-right">
          <div className={`rp-form-wrap ${mounted ? 'mounted' : ''}`}>

            {/* ── ÉXITO ── */}
            {step === 3 ? (
              <div className="rp-exito">
                <div className="rp-exito-icon"><IcoCheck /></div>
                <div className="rp-exito-title">¡Cuenta activada!</div>
                <p className="rp-exito-sub">
                  Tu acceso al portal está listo.<br />
                  La próxima vez ingresa con tu DUI y la misma contraseña.
                </p>
                <button className="rp-btn" onClick={() => navigate('/login')}>
                  <span className="rp-btn-shine" />
                  Ir al inicio de sesión
                </button>
              </div>

            ) : step === 2 && preview ? (
              /* ── CONFIRMAR ── */
              <>
                <button className="rp-btn-back" onClick={() => { setStep(1); setError('') }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Volver
                </button>
                <div className="rp-greeting">Confirma tu información</div>
                <h2 className="rp-h2">¿Todo correcto?</h2>
                <p className="rp-sub">Verificamos que tu DUI está registrado en el colegio.</p>

                <div className="rp-preview">
                  {[
                    ['Estudiante',  preview.nombre_completo || preview.nombre || '—'],
                    ['DUI',         formatDui(duiSinGuion(dui))],
                    ['Contraseña',  `${preview.apellido_est}2026`],
                  ].map(([k,v]) => (
                    <div className="rp-preview-row" key={k}>
                      <span className="rp-preview-key">{k}</span>
                      <span className="rp-preview-val" style={{ fontFamily: k==='Contraseña' ? 'monospace' : 'inherit' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="rp-hint">
                  Guarda tu contraseña: <strong style={{ fontFamily:'monospace' }}>{preview.apellido_est}2026</strong>
                  {' '}— podrás pedirle al colegio que la cambie si lo necesitas.
                </div>

                {error && (
                  <div className="rp-error" style={{ marginTop:16 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0,marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                  </div>
                )}

                <div style={{ marginTop:20 }}>
                  <button className="rp-btn" disabled={loading} onClick={handleActivar}>
                    <span className="rp-btn-shine" />
                    {loading ? <span className="rp-dots"><span/><span/><span/></span>
                      : preview.existe ? 'Iniciar sesión' : 'Activar mi cuenta'}
                  </button>
                </div>
              </>

            ) : (
              /* ── STEP 1: DUI + contraseña ── */
              <>
                <div className="rp-greeting">Portal de Padres</div>
                <h2 className="rp-h2">Accede con tu DUI</h2>
                <p className="rp-sub">Ingresa tu número de DUI y la contraseña que el colegio te indicó.</p>

                {error && (
                  <div className="rp-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0,marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                  </div>
                )}

                <div className="rp-field">
                  <label className="rp-label">Número de DUI</label>
                  <div className="rp-input-wrap">
                    <span className="rp-ico"><IcoId /></span>
                    <input className="rp-input"
                      placeholder="00000000-0"
                      value={duiFormateado}
                      onChange={e => setDui(e.target.value.replace(/\D/g,'').slice(0,9))}
                      inputMode="numeric" maxLength={10} />
                  </div>
                </div>

                <div className="rp-field">
                  <label className="rp-label">Contraseña</label>
                  <div className="rp-input-wrap">
                    <span className="rp-ico"><IcoLock /></span>
                    <input className="rp-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="ApellidoHijo2026"
                      value={password}
                      onChange={e => setPassword(e.target.value)} />
                    <button type="button" className="rp-show-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                      <IcoEye off={showPass} />
                    </button>
                  </div>
                </div>

                <div className="rp-hint">
                  Tu contraseña es el <strong>apellido de tu hijo/a</strong> seguido de <strong>2026</strong>.<br />
                  Ej: si tu hijo se llama Juan <strong>García</strong> → <span style={{ fontFamily:'monospace' }}>García2026</span>
                </div>

                <div style={{ marginTop:24 }}>
                  <button className="rp-btn" disabled={loading} onClick={handleVerificar}>
                    <span className="rp-btn-shine" />
                    {loading ? <span className="rp-dots"><span/><span/><span/></span> : 'Verificar y continuar'}
                  </button>
                  <button className="rp-btn-ghost" onClick={() => navigate('/login')}>
                    Volver al inicio de sesión
                  </button>
                </div>

                <div className="rp-login-link">
                  ¿Tu DUI no aparece?{' '}
                  <button onClick={() => window.open('mailto:info@cbis.edu.sv')}>Contacta al colegio</button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
