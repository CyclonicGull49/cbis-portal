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

        .lr {
          min-height: 100vh; width: 100vw;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #07030f;
          display: grid;
          grid-template-columns: 1fr 500px;
          position: relative;
          overflow: hidden;
        }

        /* ── BLOBS colores logo CBIS ── */
        .blobs { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        /* Violeta — círculo principal del logo */
        .b1 {
          position: absolute;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(112,60,220,0.8) 0%, rgba(80,30,160,0.45) 45%, transparent 100%);
          filter: blur(70px);
          top: -150px; right: 120px;
          animation: fa 9s ease-in-out infinite;
        }
        /* Naranja */
        .b2 {
          position: absolute;
          width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(234,88,12,0.7) 0%, rgba(194,65,12,0.35) 55%, transparent 100%);
          filter: blur(55px);
          top: 100px; right: 20px;
          animation: fb 11s ease-in-out infinite;
        }
        /* Dorado/amarillo */
        .b3 {
          position: absolute;
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,160,23,0.65) 0%, rgba(180,130,0,0.3) 55%, transparent 100%);
          filter: blur(50px);
          bottom: 100px; right: 300px;
          animation: fc 13s ease-in-out infinite;
        }
        /* Verde */
        .b4 {
          position: absolute;
          width: 260px; height: 260px; border-radius: 50%;
          background: radial-gradient(circle, rgba(22,163,74,0.6) 0%, rgba(15,120,55,0.28) 55%, transparent 100%);
          filter: blur(55px);
          bottom: -40px; right: 80px;
          animation: fd 10s ease-in-out infinite;
        }

        @keyframes fa { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-18px,25px)} }
        @keyframes fb { 0%,100%{transform:translate(0,0)} 50%{transform:translate(12px,-20px)} }
        @keyframes fc { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-8px,18px)} }
        @keyframes fd { 0%,100%{transform:translate(0,0)} 50%{transform:translate(16px,-12px)} }


        /* Violeta — círculo principal del logo */
        .b1 {
          position: absolute;
          width: 580px; height: 580px; border-radius: 50%;
          background: radial-gradient(circle, rgba(112,60,220,0.75) 0%, rgba(80,30,160,0.4) 50%, transparent 100%);
          filter: blur(72px);
          top: -140px; right: 160px;
          animation: fa 9s ease-in-out infinite;
        }
        /* Naranja */
        .b2 {
          position: absolute;
          width: 340px; height: 340px; border-radius: 50%;
          background: radial-gradient(circle, rgba(234,100,30,0.65) 0%, rgba(200,70,10,0.3) 55%, transparent 100%);
          filter: blur(60px);
          top: 120px; right: 30px;
          animation: fb 11s ease-in-out infinite;
        }
        /* Dorado/amarillo */
        .b3 {
          position: absolute;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,160,23,0.6) 0%, rgba(180,130,0,0.25) 55%, transparent 100%);
          filter: blur(55px);
          bottom: 80px; right: 280px;
          animation: fc 13s ease-in-out infinite;
        }
        /* Verde */
        .b4 {
          position: absolute;
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(30,180,100,0.55) 0%, rgba(10,140,70,0.25) 55%, transparent 100%);
          filter: blur(60px);
          bottom: -60px; right: 60px;
          animation: fd 10s ease-in-out infinite;
        }

        @keyframes fa { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.05)} }
        @keyframes fb { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-25px) scale(0.95)} }
        @keyframes fc { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-10px,20px) scale(1.08)} }
        @keyframes fd { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-15px) scale(0.97)} }

        /* ── PANEL IZQUIERDO ── */
        .ll {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 52px 64px;
          min-height: 100vh;
        }

        .ll-brand { display: flex; align-items: center; gap: 14px; }
        .ll-logo { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; box-shadow: 0 6px 20px rgba(0,0,0,0.5); }
        .ll-brand-name { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px; display: flex; align-items: center; gap: 6px; }

        .ll-center { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px 0 32px; }

        .ll-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #D4A017; margin-bottom: 24px;
          display: flex; align-items: center; gap: 12px;
        }
        .ll-eyebrow::before { content: ''; width: 24px; height: 1.5px; background: #D4A017; flex-shrink: 0; }

        .ll-title {
          font-size: clamp(38px, 3.2vw, 56px);
          font-weight: 800; color: #fff;
          line-height: 1.1; letter-spacing: -2px; margin-bottom: 32px;
          max-width: 480px;
        }
        .ll-title em { font-style: italic; font-weight: 400; color: rgba(255,255,255,0.35); }
        .ll-title span { color: #D4A017; }

        .ll-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .ll-pill {
          padding: 6px 14px; border-radius: 100px;
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.035);
        }
        .ll-pill strong { color: rgba(255,255,255,0.7); font-weight: 700; }
        .ll-footer { font-size: 11px; color: rgba(255,255,255,0.18); font-weight: 500; }

        /* ── PANEL DERECHO — frosted glass ── */
        .rr {
          position: relative; z-index: 1;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px;
        }

        .rr-card {
          width: 100%; max-width: 380px;
          background: rgba(14, 6, 28, 0.55);
          backdrop-filter: blur(32px) saturate(1.6);
          -webkit-backdrop-filter: blur(32px) saturate(1.6);
          border-radius: 24px;
          padding: 44px 40px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 32px 80px rgba(0,0,0,0.6),
            0 8px 24px rgba(0,0,0,0.4);
          animation: slideIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Form header */
        .fh { margin-bottom: 36px; }
        .fh-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(212,160,23,0.12); color: #D4A017;
          font-size: 9px; font-weight: 700; letter-spacing: 1.8px;
          text-transform: uppercase; padding: 4px 10px;
          border-radius: 100px; margin-bottom: 16px;
          border: 1px solid rgba(212,160,23,0.2);
        }
        .fh h2 { font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.8px; margin-bottom: 5px; }
        .fh p { font-size: 13px; color: rgba(255,255,255,0.38); font-weight: 400; }

        /* Fields */
        .fg { margin-bottom: 26px; }
        .fg-label {
          display: block; font-size: 10px; font-weight: 700;
          color: rgba(255,255,255,0.28); text-transform: uppercase;
          letter-spacing: 1.2px; margin-bottom: 10px; transition: color 0.2s;
        }
        .fg:focus-within .fg-label { color: #D4A017; }

        .fg-row {
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          padding-bottom: 10px; transition: border-color 0.2s;
        }
        .fg:focus-within .fg-row { border-color: rgba(212,160,23,0.7); }

        .fg-icon { color: rgba(255,255,255,0.22); flex-shrink: 0; display: flex; transition: color 0.2s; }
        .fg:focus-within .fg-icon { color: #D4A017; }

        .fg-input {
          flex: 1; border: none; outline: none;
          font-size: 14px; font-weight: 500;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #fff; background: transparent;
          -webkit-text-fill-color: #fff;
        }
        .fg-input::placeholder { color: rgba(255,255,255,0.18); -webkit-text-fill-color: rgba(255,255,255,0.18); font-weight: 400; }
        .fg-input:-webkit-autofill,
        .fg-input:-webkit-autofill:hover,
        .fg-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(14,6,28,0.98) inset !important;
          -webkit-text-fill-color: #fff !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .fg-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.22); padding: 0;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .fg-btn:hover { color: #D4A017; }

        /* Error */
        .err {
          display: flex; align-items: center; gap: 8px;
          background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.25);
          border-radius: 10px; padding: 10px 14px; margin-bottom: 20px;
          font-size: 13px; color: #f87171; font-weight: 500;
        }

        /* Submit */
        .sbtn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #5B2D8E 0%, #7c3aed 100%);
          color: #fff; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 800;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(91,45,142,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
          margin-bottom: 4px;
        }
        .sbtn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(91,45,142,0.65), inset 0 1px 0 rgba(255,255,255,0.15); }
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
          color: rgba(255,255,255,0.22); font-size: 12px; font-weight: 500;
          cursor: pointer; padding: 10px 0; margin-top: 2px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          transition: color 0.2s;
        }
        .fbtn:hover { color: rgba(255,255,255,0.6); }

        .rst-ok {
          margin-top: 14px; padding: 11px 14px;
          background: rgba(22,163,74,0.12); border: 1px solid rgba(22,163,74,0.25);
          border-radius: 10px; font-size: 13px;
          color: #4ade80; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
        }

        .ff { margin-top: 28px; text-align: center; font-size: 11px; color: rgba(255,255,255,0.15); font-weight: 500; }

        /* ── RESPONSIVE MÓVIL ── */
        @media (max-width: 768px) {
          .ll { display: none; }
          .lr {
            display: flex; flex-direction: column;
            background: #07030f;
          }
          .rr {
            flex: 1; padding: 0;
            display: flex; flex-direction: column;
            align-items: stretch; justify-content: flex-end;
            min-height: 100vh;
          }
          .rr-card {
            border-radius: 28px 28px 0 0;
            padding: 12px 28px 52px;
            max-width: 100%;
          }
          .rr-card::before {
            content: ''; display: block;
            width: 40px; height: 3px;
            border-radius: 100px;
            background: rgba(255,255,255,0.15);
            margin: 8px auto 28px;
          }

          .mob-brand {
            display: flex; flex-direction: column;
            align-items: center; gap: 12px;
            padding: 64px 32px 48px;
            text-align: center; flex: 1;
          }
          .mob-logo { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
          .mob-name { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -1px; display: flex; align-items: center; gap: 6px; }
          .mob-lema { font-size: 13px; color: rgba(255,255,255,0.38); font-style: italic; }
          .mob-pills { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
          .mob-pill { padding: 4px 11px; border-radius: 100px; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.38); border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }

          .fh { margin-bottom: 24px; }
          .fh h2 { font-size: 21px; }
          .fh-tag { display: none; }
          .ff { margin-top: 20px; }
        }

        @media (min-width: 769px) {
          .mob-brand { display: none; }
        }
      `}</style>

      <div className="lr">

        {/* Blobs de color */}
        <div className="blobs">
          <div className="b1" />
          <div className="b2" />
          <div className="b3" />
          <div className="b4" />
        </div>

        {/* Panel izquierdo */}
        <div className="ll">
          <div className="ll-brand">
            <img src="/logo.png" alt="CBIS" className="ll-logo" />
            <div className="ll-brand-name">
              CBIS
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
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
          <div className="ll-footer">© 2026 CBIS</div>
        </div>

        {/* Panel derecho — frosted glass */}
        <div className="rr">
          <div className="mob-brand">
            <img src="/logo.png" alt="CBIS" className="mob-logo" />
            <div className="mob-name">CBIS <svg width="18" height="18" viewBox="0 0 28 28" fill="none"><rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/><rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/></svg></div>
            <div className="mob-lema">Fe, Cultura, Innovación y Disciplina</div>
            <div className="mob-pills"><span className="mob-pill">Notas</span><span className="mob-pill">Asistencia</span><span className="mob-pill">Cobros</span></div>
          </div>

          <div className="rr-card">
            <div className="fh">
              <div className="fh-tag">
                <svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#D4A017"/></svg>
                Sistema de gestión escolar
              </div>
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
      </div>
    </>
  )
}