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
          display: flex;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #1a0d30;
        }

        /* ── PANEL IZQUIERDO — mismo púrpura del sidebar ── */
        .ll {
          flex: 1;
          position: relative;
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 52px 64px;
          overflow: hidden;
          background: linear-gradient(160deg, #1a0d30 0%, #2d1554 50%, #5B2D8E 100%);
        }

        /* Detalles decorativos sutiles */
        .ll::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 8% 90%, rgba(212,160,23,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 92% 8%,  rgba(255,255,255,0.05) 0%, transparent 60%);
          pointer-events: none;
        }

        /* Grid sutil */
        .ll::after {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .ll-inner { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

        .ll-brand { display: flex; align-items: center; gap: 14px; }
        .ll-logo { width: 56px; height: 56px; border-radius: 14px; object-fit: cover; box-shadow: 0 6px 20px rgba(0,0,0,0.4); }
        .ll-brand-name { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; display: flex; align-items: center; gap: 7px; }

        .ll-center { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 48px 0 24px; }

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
        .ll-title em { font-style: italic; font-weight: 400; color: rgba(255,255,255,0.4); }
        .ll-title span { color: #D4A017; }

        .ll-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .ll-pill {
          padding: 6px 14px; border-radius: 100px;
          font-size: 11px; font-weight: 600;
          color: rgba(255,255,255,0.45);
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
        }
        .ll-pill strong { color: rgba(255,255,255,0.8); font-weight: 700; }
        .ll-footer { font-size: 11px; color: rgba(255,255,255,0.25); font-weight: 500; }

        /* ── SEPARADOR vertical entre paneles ── */
        .ll-sep {
          position: absolute; right: 0; top: 8%; bottom: 8%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent);
        }

        /* ── PANEL DERECHO — blanco limpio ── */
        .rr {
          width: 480px; min-width: 380px;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          padding: 64px 56px;
          box-shadow: -8px 0 40px rgba(0,0,0,0.15);
        }

        .rr-inner {
          width: 100%; max-width: 340px;
          animation: fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Form header */
        .fh { margin-bottom: 40px; }
        .fh h2 { font-size: 26px; font-weight: 800; color: #1a0d30; letter-spacing: -0.8px; margin-bottom: 6px; }
        .fh p { font-size: 13px; color: #9ca3af; font-weight: 400; }

        /* Fields — underline style */
        .fg { margin-bottom: 28px; }
        .fg-label {
          display: block; font-size: 10px; font-weight: 700;
          color: #9ca3af; text-transform: uppercase;
          letter-spacing: 1.2px; margin-bottom: 10px; transition: color 0.2s;
        }
        .fg:focus-within .fg-label { color: #5B2D8E; }

        .fg-row {
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1.5px solid #e5e7eb;
          padding-bottom: 10px; transition: border-color 0.2s;
        }
        .fg:focus-within .fg-row { border-color: #5B2D8E; }

        .fg-icon { color: #d1d5db; flex-shrink: 0; display: flex; transition: color 0.2s; }
        .fg:focus-within .fg-icon { color: #5B2D8E; }

        .fg-input {
          flex: 1; border: none; outline: none;
          font-size: 15px; font-weight: 500;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #111827; background: transparent;
        }
        .fg-input::placeholder { color: #d1d5db; font-weight: 400; }
        .fg-input:-webkit-autofill,
        .fg-input:-webkit-autofill:hover,
        .fg-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
          -webkit-text-fill-color: #111827 !important;
        }

        .fg-btn {
          background: none; border: none; cursor: pointer;
          color: #d1d5db; padding: 0; display: flex;
          align-items: center; transition: color 0.2s;
        }
        .fg-btn:hover { color: #5B2D8E; }

        /* Error */
        .err {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 10px 14px; margin-bottom: 20px;
          font-size: 13px; color: #dc2626; font-weight: 500;
        }

        /* Submit — púrpura del sidebar */
        .sbtn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #1a0d30 0%, #5B2D8E 100%);
          color: #fff; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 800;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer; transition: all 0.2s;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(91,45,142,0.4);
          margin-bottom: 4px;
        }
        .sbtn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(91,45,142,0.55); }
        .sbtn:active:not(:disabled) { transform: translateY(0); }
        .sbtn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sbtn-shine {
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%);
          transform: translateX(-100%); animation: shine 2.5s infinite;
        }
        @keyframes shine { 100% { transform: translateX(200%); } }

        .fbtn {
          width: 100%; background: none; border: none;
          color: #c4bad4; font-size: 13px; font-weight: 500;
          cursor: pointer; padding: 10px 0; margin-top: 2px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          transition: color 0.2s;
        }
        .fbtn:hover { color: #5B2D8E; }

        .rst-ok {
          margin-top: 14px; padding: 11px 14px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          border-radius: 10px; font-size: 13px;
          color: #16a34a; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
        }

        .ff { margin-top: 36px; text-align: center; font-size: 11px; color: #d1d5db; font-weight: 500; }

        /* ── RESPONSIVE MÓVIL ── */
        @media (max-width: 768px) {
          .ll { display: none; }
          .lr { background: linear-gradient(160deg, #1a0d30 0%, #2d1554 55%, #5B2D8E 100%); }
          .rr {
            width: 100%; min-width: 0;
            padding: 0; background: transparent;
            display: flex; flex-direction: column;
            align-items: stretch; justify-content: flex-end;
            min-height: 100vh; box-shadow: none;
          }
          .rr-inner { max-width: 100%; display: flex; flex-direction: column; flex: 1; }

          .mob-top {
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            padding: 64px 32px 52px; flex: 1;
            position: relative; overflow: hidden;
          }
          .mob-top::before {
            content: ''; position: absolute; inset: 0;
            background-image:
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
            background-size: 36px 36px;
          }
          .mob-top-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
          .mob-logo { width: 64px; height: 64px; border-radius: 16px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
          .mob-name { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -1px; display: flex; align-items: center; gap: 6px; }
          .mob-lema { font-size: 13px; color: rgba(255,255,255,0.45); font-style: italic; max-width: 240px; }
          .mob-pills { display: flex; gap: 7px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
          .mob-pill { padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); }

          .mob-card {
            background: #fff;
            border-radius: 28px 28px 0 0;
            padding: 36px 28px 52px;
            box-shadow: 0 -8px 32px rgba(0,0,0,0.2);
          }
          .mob-card::before { content: ''; display: block; width: 40px; height: 3px; border-radius: 100px; background: #e5e7eb; margin: 0 auto 28px; }
          .fh { margin-bottom: 28px; }
          .fh h2 { font-size: 22px; }
          .ff { margin-top: 24px; }
        }

        @media (min-width: 769px) {
          .mob-top { display: none; }
          .mob-card { display: contents; }
        }
      `}</style>

      <div className="lr">

        {/* Panel izquierdo */}
        <div className="ll">
          <div className="ll-sep" />
          <div className="ll-inner">
            <div className="ll-brand">
              <img src="/logo.png" alt="CBIS" className="ll-logo" />
              <div className="ll-brand-name">
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

            <div className="ll-footer">© 2026 CBIS</div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="rr">
          <div className="rr-inner">

            {/* Móvil top */}
            <div className="mob-top">
              <div className="mob-top-inner">
                <img src="/logo.png" alt="CBIS" className="mob-logo" />
                <div className="mob-name">CBIS <svg width="18" height="18" viewBox="0 0 28 28" fill="none"><rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/><rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/></svg></div>
                <div className="mob-lema">Fe, Cultura, Innovación y Disciplina</div>
                <div className="mob-pills"><span className="mob-pill">Notas</span><span className="mob-pill">Asistencia</span><span className="mob-pill">Cobros</span></div>
              </div>
            </div>

            <div className="mob-card">
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
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                  </div>
                )}

                <button type="submit" className="sbtn" disabled={loading}>
                  <span className="sbtn-shine" />
                  {loading ? 'Verificando...' : 'Acceder al portal'}
                </button>

                {resetSent ? (
                  <div className="rst-ok">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
      </div>
    </>
  )
}