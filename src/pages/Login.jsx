import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [showPass, setShowPass]         = useState(false)
  const [resetSent, setResetSent]       = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const { login } = useAuth()

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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── ROOT: fondo púrpura full screen ── */
        .lr {
          min-height: 100vh; width: 100vw;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: linear-gradient(145deg, #1a0d30 0%, #2d1554 40%, #5B2D8E 75%, #7B3FE4 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        /* Grid sutil de fondo */
        .lr::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
        }

        /* ── BLOBS de color para que el glass tenga algo que difuminar ── */
        .blob {
          position: absolute; border-radius: 50%;
          pointer-events: none;
        }
        /* Naranja — justo detrás de la tarjeta */
        .b-orange {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(234,88,12,0.55) 0%, rgba(200,60,10,0.25) 50%, transparent 100%);
          filter: blur(60px);
          right: 80px; top: -80px;
        }
        /* Dorado */
        .b-gold {
          width: 340px; height: 340px;
          background: radial-gradient(circle, rgba(212,160,23,0.45) 0%, rgba(180,130,0,0.2) 50%, transparent 100%);
          filter: blur(55px);
          right: 200px; bottom: -60px;
        }
        /* Verde sutil */
        .b-green {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(22,163,74,0.3) 0%, transparent 70%);
          filter: blur(50px);
          right: 420px; bottom: 40px;
        }
        /* Violeta claro — efecto de profundidad */
        .b-violet {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 65%);
          filter: blur(70px);
          left: 30%; top: -100px;
        }

        /* ── LAYOUT: izq = texto, der = card flotante ── */
        .ll {
          flex: 1;
          position: relative; z-index: 1;
          padding: 52px 48px 52px 64px;
          display: flex; flex-direction: column;
          justify-content: space-between;
          min-height: 100vh;
        }

        .ll-brand { display: flex; align-items: center; gap: 14px; }
        .ll-logo { width: 56px; height: 56px; border-radius: 14px; object-fit: cover; box-shadow: 0 6px 24px rgba(0,0,0,0.4); }
        .ll-name { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; display: flex; align-items: center; gap: 7px; }

        .ll-center { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0 24px; }
        .ll-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #D4A017; margin-bottom: 22px;
          display: flex; align-items: center; gap: 12px;
        }
        .ll-eyebrow::before { content: ''; width: 24px; height: 1.5px; background: #D4A017; flex-shrink: 0; }
        .ll-title {
          font-size: clamp(36px, 3vw, 54px); font-weight: 800;
          color: #fff; line-height: 1.1; letter-spacing: -2px; margin-bottom: 30px;
        }
        .ll-title em { font-style: italic; font-weight: 400; color: rgba(255,255,255,0.38); }
        .ll-title span { color: #D4A017; }
        .ll-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .ll-pill {
          padding: 6px 14px; border-radius: 100px; font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
        }
        .ll-pill strong { color: rgba(255,255,255,0.8); font-weight: 700; }
        .ll-footer { font-size: 11px; color: rgba(255,255,255,0.22); font-weight: 500; }

        /* ── TARJETA GLASS ── */
        .rr {
          position: relative; z-index: 1;
          width: 440px; min-width: 380px;
          padding: 48px 40px;
          margin: 40px 48px 40px 0;
          flex-shrink: 0;

          /* El glass morphism real */
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(36px) saturate(1.6) brightness(1.1);
          -webkit-backdrop-filter: blur(36px) saturate(1.6) brightness(1.1);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.1),
            0 32px 80px rgba(0,0,0,0.35),
            0 8px 24px rgba(0,0,0,0.2);

          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Brillo interno — esquina superior izquierda */
        .rr::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          border-radius: 24px 24px 0 0;
          pointer-events: none;
        }

        /* Form */
        .fh { margin-bottom: 36px; }
        .fh h2 { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.8px; margin-bottom: 6px; }
        .fh p { font-size: 13px; color: rgba(255,255,255,0.42); font-weight: 400; }

        .fg { margin-bottom: 26px; }
        .fg-label {
          display: block; font-size: 10px; font-weight: 700;
          color: rgba(255,255,255,0.32); text-transform: uppercase;
          letter-spacing: 1.2px; margin-bottom: 10px; transition: color 0.2s;
        }
        .fg:focus-within .fg-label { color: #D4A017; }
        .fg-row {
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.18);
          padding-bottom: 10px; transition: border-color 0.2s;
        }
        .fg:focus-within .fg-row { border-color: rgba(212,160,23,0.7); }
        .fg-icon { color: rgba(255,255,255,0.25); flex-shrink: 0; display: flex; transition: color 0.2s; }
        .fg:focus-within .fg-icon { color: #D4A017; }
        .fg-input {
          flex: 1; border: none; outline: none;
          font-size: 15px; font-weight: 500;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #fff; background: transparent;
          -webkit-text-fill-color: #fff;
          caret-color: #D4A017;
        }
        .fg-input::placeholder { color: rgba(255,255,255,0.2); -webkit-text-fill-color: rgba(255,255,255,0.2); font-weight: 400; }
        .fg-input:-webkit-autofill,
        .fg-input:-webkit-autofill:hover,
        .fg-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(91,45,142,0.01) inset !important;
          -webkit-text-fill-color: #fff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .fg-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.25); padding: 0; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .fg-btn:hover { color: #D4A017; }

        .err {
          display: flex; align-items: center; gap: 8px;
          background: rgba(220,38,38,0.15); border: 1px solid rgba(220,38,38,0.3);
          border-radius: 10px; padding: 10px 14px; margin-bottom: 20px;
          font-size: 13px; color: #fca5a5; font-weight: 500;
        }

        .sbtn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1a0d30 0%, #5B2D8E 100%);
          color: #fff; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 800;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer; transition: all 0.2s;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
          margin-bottom: 4px;
        }
        .sbtn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15); }
        .sbtn:active:not(:disabled) { transform: translateY(0); }
        .sbtn:disabled { opacity: 0.55; cursor: not-allowed; }
        .sbtn-shine {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%);
          transform: translateX(-100%); animation: shine 2.5s infinite;
        }
        @keyframes shine { 100% { transform: translateX(200%); } }

        .fbtn {
          width: 100%; background: none; border: none;
          color: rgba(255,255,255,0.25); font-size: 13px; font-weight: 500;
          cursor: pointer; padding: 10px 0; margin-top: 2px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif; transition: color 0.2s;
        }
        .fbtn:hover { color: rgba(255,255,255,0.65); }

        .rst-ok {
          margin-top: 14px; padding: 11px 14px;
          background: rgba(22,163,74,0.15); border: 1px solid rgba(22,163,74,0.3);
          border-radius: 10px; font-size: 13px; color: #4ade80; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
        }
        .ff { margin-top: 28px; text-align: center; font-size: 11px; color: rgba(255,255,255,0.18); font-weight: 500; }

        /* ── MÓVIL ── */
        @media (max-width: 768px) {
          .lr { flex-direction: column; align-items: stretch; padding: 0; }
          .ll {
            min-height: auto; padding: 52px 28px 40px;
            justify-content: flex-start; gap: 0;
          }
          .ll-center { padding: 36px 0 0; }
          .ll-title { font-size: 38px; }
          .rr {
            width: auto; min-width: 0;
            margin: 0 16px 32px;
            padding: 36px 28px;
          }
          .ll-footer { display: none; }
        }
      `}</style>

      <div className="lr">
        {/* Blobs de color */}
        <div className="blob b-orange" />
        <div className="blob b-gold" />
        <div className="blob b-green" />
        <div className="blob b-violet" />

        {/* Izquierda — texto sobre el fondo */}
        <div className="ll">
          <div className="ll-brand">
            <img src="/logo.png" alt="CBIS" className="ll-logo" />
            <div className="ll-name">
              CBIS
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/>
                <rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/>
              </svg>
            </div>
          </div>

          <div className="ll-center">
            <div className="ll-eyebrow">Portal Académico 2026</div>
            <h1 className="ll-title">
              Fe, <em>Cultura,</em><br/>
              Innovación<br/>
              <span>&amp;</span> Disciplina.
            </h1>
            <div className="ll-pills">
              <div className="ll-pill">Matrículas <strong>automatizadas</strong></div>
              <div className="ll-pill">Notas en <strong>tiempo real</strong></div>
              <div className="ll-pill">Cobros y <strong>pagos</strong></div>
              <div className="ll-pill"><strong>+</strong> más</div>
            </div>
          </div>

          <div className="ll-footer">© 2026 CBIS · Sonsonate, El Salvador</div>
        </div>

        {/* Tarjeta glass flotante */}
        <div className="rr">
          <div className="fh">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} autoComplete="on">
            <div className="fg">
              <label className="fg-label">Correo electrónico</label>
              <div className="fg-row">
                <span className="fg-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input type="email" className="fg-input" placeholder="usuario@cbis.edu.sv"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
              </div>
            </div>

            <div className="fg">
              <label className="fg-label">Contraseña</label>
              <div className="fg-row">
                <span className="fg-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input type={showPass ? 'text' : 'password'} className="fg-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
                <button type="button" className="fg-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div className="err">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" className="sbtn" disabled={loading}>
              <span className="sbtn-shine" />
              {loading ? 'Verificando...' : 'Acceder al portal'}
            </button>

            {resetSent ? (
              <div className="rst-ok">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Revisa tu correo — enlace enviado
              </div>
            ) : (
              <button type="button" className="fbtn" onClick={handleForgotPassword} disabled={resetLoading}>
                {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
              </button>
            )}
          </form>

          <div className="ff">CBIS · Sonsonate, El Salvador</div>
        </div>
      </div>
    </>
  )
}