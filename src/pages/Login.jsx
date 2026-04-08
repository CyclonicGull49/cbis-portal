import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'

// ── Animated background dots ───────────────────
function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />
}

export default function Login() {
  const navigate = useNavigate()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [showPass,     setShowPass]     = useState(false)
  const [resetSent,    setResetSent]    = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [mounted,      setMounted]      = useState(false)
  const { login } = useAuth()

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await login(email, password)
    if (error) setError('Correo o contraseña incorrectos')
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) { setError('Ingresa tu correo primero'); return }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    })
    setResetLoading(false)
    if (error) setError('Error al enviar el correo. Verifica tu dirección.')
    else setResetSent(true)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }

        .login-root {
          min-height: 100vh; width: 100vw;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          display: flex;
        }

        /* ── LEFT PANEL ───────────────────────── */
        .login-left {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #0d0720 0%, #1a0d30 30%, #2d1554 65%, #4a1f8a 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
        }

        /* Noise texture overlay */
        .login-left::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0;
        }

        .login-left-content { position: relative; z-index: 1; }

        /* Brand */
        .login-brand {
          display: flex; align-items: center; gap: 12px;
        }
        .login-logo-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        .login-logo-wrap img { width: 100%; height: 100%; object-fit: cover; border-radius: 11px; }
        .login-brand-name {
          font-size: 20px; font-weight: 800; color: #fff;
          letter-spacing: -0.5px; display: flex; align-items: center; gap: 5px;
        }

        /* Hero text */
        .login-hero { padding: 80px 0 60px; }
        .login-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #D4A017; margin-bottom: 28px;
        }
        .login-eyebrow-line { width: 20px; height: 1.5px; background: #D4A017; }

        .login-title {
          font-size: clamp(38px, 3.2vw, 58px);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -2.5px; color: #fff;
          margin-bottom: 32px;
        }
        .login-title-dim { color: rgba(255,255,255,0.32); font-style: italic; font-weight: 300; }
        .login-title-gold { color: #D4A017; }

        .login-desc {
          font-size: 14px; color: rgba(255,255,255,0.38);
          line-height: 1.7; max-width: 360px; font-weight: 400;
          margin-bottom: 40px;
        }

        /* Feature pills */
        .login-features { display: flex; flex-wrap: wrap; gap: 8px; }
        .login-feat {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 100px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 500;
          backdrop-filter: blur(8px);
          transition: all 0.2s;
        }
        .login-feat-dot { width: 5px; height: 5px; border-radius: 50%; background: #D4A017; flex-shrink: 0; }

        /* Footer */
        .login-left-footer {
          font-size: 11px; color: rgba(255,255,255,0.18);
          font-weight: 500; letter-spacing: 0.3px;
        }

        /* ── RIGHT PANEL ──────────────────────── */
        .login-right {
          width: 480px; flex-shrink: 0;
          background: #fff;
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 64px 56px;
          position: relative;
          overflow: hidden;
        }

        /* Subtle top gradient accent */
        .login-right::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #1a0d30, #5B2D8E, #D4A017, #5B2D8E, #1a0d30);
        }

        /* Subtle background pattern */
        .login-right::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle, rgba(91,45,142,0.04) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          pointer-events: none;
        }

        .login-form-wrap {
          position: relative; z-index: 1;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.5s ease 0.1s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s;
        }
        .login-form-wrap.mounted { opacity: 1; transform: translateY(0); }

        /* Form header */
        .login-form-header { margin-bottom: 44px; }
        .login-form-greeting {
          font-size: 11px; font-weight: 700; color: #5B2D8E;
          letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .login-form-greeting::before {
          content: ''; width: 16px; height: 2px;
          background: linear-gradient(90deg, #5B2D8E, #D4A017);
          border-radius: 2px;
        }
        .login-form-title {
          font-size: 30px; font-weight: 800; color: #0f1d40;
          letter-spacing: -1px; line-height: 1.1; margin-bottom: 8px;
        }
        .login-form-sub { font-size: 13px; color: #9ca3af; font-weight: 400; line-height: 1.5; }

        /* Input groups */
        .login-field { margin-bottom: 28px; }
        .login-field-label {
          display: block; font-size: 11px; font-weight: 700;
          color: #6b7280; text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 10px; transition: color 0.2s;
        }
        .login-field:focus-within .login-field-label { color: #5B2D8E; }

        .login-field-input-wrap {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          background: #f8f7ff;
          border: 1.5px solid #e9e3ff;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .login-field:focus-within .login-field-input-wrap {
          border-color: #5B2D8E;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(91,45,142,0.08);
        }
        .login-field-icon { color: #c4b5fd; flex-shrink: 0; transition: color 0.2s; }
        .login-field:focus-within .login-field-icon { color: #5B2D8E; }

        .login-input {
          flex: 1; border: none; outline: none;
          font-size: 14px; font-weight: 500;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #0f1d40; background: transparent;
          caret-color: #5B2D8E;
        }
        .login-input::placeholder { color: #c4c4d4; font-weight: 400; }
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #f8f7ff inset !important;
          -webkit-text-fill-color: #0f1d40 !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .login-show-btn {
          background: none; border: none; cursor: pointer; padding: 2px;
          color: #c4b5fd; display: flex; align-items: center;
          transition: color 0.2s; flex-shrink: 0;
        }
        .login-show-btn:hover { color: #5B2D8E; }

        /* Error */
        .login-error {
          display: flex; align-items: center; gap: 8px;
          background: #fff1f2; border: 1.5px solid #fecdd3;
          border-radius: 10px; padding: 11px 14px; margin-bottom: 20px;
          font-size: 13px; color: #be123c; font-weight: 500;
        }

        /* Submit */
        .login-submit {
          width: 100%; padding: 15px;
          background: linear-gradient(135deg, #2d1554 0%, #5B2D8E 100%);
          color: #fff; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 800;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer; letter-spacing: 0.3px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 16px rgba(91,45,142,0.35), 0 1px 3px rgba(0,0,0,0.15);
          transition: all 0.2s;
          margin-bottom: 16px;
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(91,45,142,0.45), 0 2px 6px rgba(0,0,0,0.15);
        }
        .login-submit:active:not(:disabled) { transform: translateY(0); }
        .login-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-submit-shine {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
          transform: translateX(-100%);
          animation: shine 2.5s infinite 1s;
        }
        @keyframes shine { 100% { transform: translateX(250%); } }

        /* Loading dots */
        .login-loading-dots { display: inline-flex; gap: 4px; align-items: center; }
        .login-loading-dots span {
          width: 4px; height: 4px; border-radius: 50%; background: #fff;
          animation: blink 1.2s infinite;
        }
        .login-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .login-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,80%,100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }

        /* Forgot */
        .login-forgot {
          width: 100%; background: none; border: none; padding: 8px 0;
          font-size: 13px; color: #9ca3af; font-weight: 500;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer; text-align: center;
          transition: color 0.2s;
        }
        .login-forgot:hover { color: #5B2D8E; }

        /* Reset success */
        .login-reset-ok {
          display: flex; align-items: center; gap: 8px;
          background: #f0fdf4; border: 1.5px solid #bbf7d0;
          border-radius: 10px; padding: 11px 14px; margin-top: 12px;
          font-size: 13px; color: #166534; font-weight: 600;
        }

        /* Bottom note */
        .login-form-footer {
          margin-top: 36px; padding-top: 24px;
          border-top: 1px solid #f3eeff;
          text-align: center; font-size: 11px; color: #d1c4e9; font-weight: 500;
        }

        /* ── MOBILE ─────────────────────────── */
        @media (max-width: 900px) {
          .login-root { flex-direction: column; }

          .login-left {
            padding: 36px 32px 48px;
            min-height: auto;
          }
          .login-hero { padding: 48px 0 40px; }
          .login-title { font-size: 36px; }
          .login-desc { display: none; }

          .login-right {
            width: 100%; padding: 48px 32px 56px;
          }
          .login-form-title { font-size: 26px; }
        }

        @media (max-width: 480px) {
          .login-left { padding: 28px 24px 36px; }
          .login-hero { padding: 36px 0 28px; }
          .login-title { font-size: 30px; letter-spacing: -1.5px; }
          .login-right { padding: 40px 24px 48px; }
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT — brand & story ───────────── */}
        <div className="login-left">
          {/* Background orbs */}
          <FloatingOrb style={{ width: 480, height: 480, background: 'radial-gradient(circle, rgba(112,60,220,0.4) 0%, transparent 70%)', filter: 'blur(70px)', top: -160, right: -80 }} />
          <FloatingOrb style={{ width: 360, height: 360, background: 'radial-gradient(circle, rgba(234,88,12,0.28) 0%, transparent 70%)', filter: 'blur(60px)', bottom: -80, right: 40 }} />
          <FloatingOrb style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 70%)', filter: 'blur(55px)', bottom: 60, left: -40 }} />
          <FloatingOrb style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(22,163,74,0.2) 0%, transparent 70%)', filter: 'blur(45px)', top: '40%', left: '20%' }} />

          <div className="login-left-content">
            {/* Brand */}
            <div className="login-brand">
              <div className="login-logo-wrap">
                <img src="/logo.png" alt="CBIS" onError={e => { e.target.style.display='none' }} />
              </div>
              <div className="login-brand-name">
                CBIS
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/>
                  <rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="login-hero login-left-content">
            <div className="login-eyebrow">
              <span className="login-eyebrow-line" />
              Portal Académico 2026
            </div>
            <h1 className="login-title">
              Fe,{' '}
              <span className="login-title-dim">Innovación,</span>
              <br/>Cultura
              <br/><span className="login-title-gold">&amp;</span> Disciplina.
            </h1>
            
            <div className="login-features">
              {['Notas en tiempo real', 'Boletas PDF', 'Control de asistencia', 'Gestión de cobros', 'App móvil'].map(f => (
                <div className="login-feat" key={f}>
                  <span className="login-feat-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="login-left-content">
            <div className="login-left-footer">© 2026 CBIS · Sonsonate, El Salvador</div>
          </div>
        </div>

        {/* ── RIGHT — form ──────────────────── */}
        <div className="login-right">
          <div className={`login-form-wrap ${mounted ? 'mounted' : ''}`}>

            <div className="login-form-header">
              <div className="login-form-greeting">Bienvenido de vuelta</div>
              <h2 className="login-form-title">Ingresa a tu cuenta</h2>
              <p className="login-form-sub">Usa tus credenciales institucionales para continuar</p>
            </div>

            <form onSubmit={handleLogin} autoComplete="on">

              {/* Email */}
              <div className="login-field">
                <label className="login-field-label">Correo</label>
                <div className="login-field-input-wrap">
                  <span className="login-field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input type="email" className="login-input"
                    placeholder="usuario@cbis.edu.sv"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="email" required />
                </div>
              </div>

              {/* Password */}
              <div className="login-field">
                <label className="login-field-label">Contraseña</label>
                <div className="login-field-input-wrap">
                  <span className="login-field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input type={showPass ? 'text' : 'password'} className="login-input"
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password" required />
                  <button type="button" className="login-show-btn"
                    onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="login-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="login-submit" disabled={loading}>
                <span className="login-submit-shine" />
                {loading
                  ? <span className="login-loading-dots"><span/><span/><span/></span>
                  : 'Acceder al portal'
                }
              </button>

              {/* Forgot */}
              {resetSent ? (
                <div className="login-reset-ok">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Revisa tu correo — enlace enviado
                </div>
              ) : (
                <button type="button" className="login-forgot"
                  onClick={handleForgotPassword} disabled={resetLoading}>
                  {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
                </button>
              )}

            </form>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #f3eeff', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
              ¿Eres padre de familia?{' '}
              <button type="button" onClick={() => navigate('/registro-padre')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#5B2D8E', fontWeight: 700, fontSize: 13,
                fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2,
              }}>
                Acceder al portal de padres
              </button>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}