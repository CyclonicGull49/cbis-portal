import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: loginErr } = await login(email, password)
    setLoading(false)

    if (loginErr) {
      setError('Correo o contraseña incorrectos')
      return
    }

    toast.success('Bienvenido')
    // AuthContext maneja la redirección
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Ingresa tu correo primero')
      return
    }

    setResetLoading(true)
    setError('')

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setResetLoading(false)

    if (resetErr) {
      setError('Error al enviar el correo. Verifica tu dirección.')
      return
    }

    setResetSent(true)
    toast.success('Revisa tu correo para restablecer tu contraseña')
    setTimeout(() => {
      setResetMode(false)
      setResetSent(false)
      setEmail('')
    }, 3000)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }

        .login-page {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background:
            radial-gradient(circle at 7% 0%, rgba(212,160,23,0.16), transparent 26rem),
            radial-gradient(circle at 95% 18%, rgba(14,148,144,0.12), transparent 24rem),
            linear-gradient(135deg, #fff 0%, #f4f7fc 45%, #eef4fb 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 28px; position: relative; overflow: hidden;
        }
        .login-page::before {
          content: '';
          position: absolute;
          inset: -10%;
          background-image: radial-gradient(circle, rgba(91,45,142,0.08) 1px, transparent 1.6px);
          background-size: 34px 34px;
          transform: rotate(-3deg);
          pointer-events: none;
        }
        .login-shell {
          width: min(1040px, 100%);
          min-height: 640px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 460px;
          border-radius: 32px;
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(26,13,48,0.08);
          box-shadow: 0 28px 80px rgba(26,13,48,0.14);
          overflow: hidden;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          animation: cbis-fade-up 460ms ease both;
        }
        .login-brand {
          position: relative;
          padding: 46px;
          background:
            linear-gradient(145deg, rgba(26,13,48,0.97), rgba(91,45,142,0.94)),
            radial-gradient(circle at 85% 12%, rgba(212,160,23,0.34), transparent 18rem);
          color: #fff;
          overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.10) 1px, transparent 1.7px);
          background-size: 28px 28px;
          opacity: .45;
        }
        .login-brand::after {
          content: '';
          position: absolute;
          width: 360px;
          height: 360px;
          border: 34px solid rgba(212,160,23,0.24);
          border-radius: 76px;
          right: -132px;
          bottom: -112px;
          transform: rotate(-9deg);
        }
        .login-brand-inner {
          position: relative;
          z-index: 1;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 40px;
        }
        .login-logo-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .login-logo {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          object-fit: cover;
          box-shadow: 0 18px 36px rgba(0,0,0,0.24);
        }
        .login-brand-title {
          font-size: 54px;
          line-height: 1.04;
          font-weight: 800;
          margin: 0 0 18px;
          letter-spacing: 0;
        }
        .login-brand-copy {
          max-width: 460px;
          color: rgba(255,255,255,0.72);
          font-size: 17px;
          line-height: 1.7;
          font-weight: 500;
        }
        .login-motto {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .login-motto span {
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.14);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
        }
        .login-form-side {
          display: flex;
          align-items: center;
          padding: 38px;
        }
        .login-card {
          position: relative; width: 100%;
          background: #fff;
          border: 1px solid rgba(26,13,48,0.08);
          border-radius: 24px; padding: 38px;
          box-shadow: 0 16px 42px rgba(26,13,48,0.08);
          opacity: 0; transform: translateY(12px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .login-card.mounted { opacity: 1; transform: translateY(0); }
        .login-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 2px;
          color: #5B2D8E; text-transform: uppercase; margin-bottom: 12px;
        }
        .login-eyebrow::before { content: ''; width: 24px; height: 3px; border-radius: 999px; background: #D4A017; }
        .login-title {
          font-size: 32px; font-weight: 800; color: #1a0d30;
          margin-bottom: 8px; letter-spacing: 0;
        }
        .login-subtitle {
          font-size: 14px; color: #625878;
          margin-bottom: 28px; line-height: 1.5;
        }
        .login-label {
          display: block; font-size: 11px; font-weight: 700;
          color: #1a0d30; letter-spacing: 1.2px;
          text-transform: uppercase; margin-bottom: 8px;
        }
        .login-input-wrap {
          position: relative; margin-bottom: 18px;
        }
        .login-input {
          width: 100%; padding: 14px 44px 14px 16px;
          background: #f8fbff;
          border: 1px solid rgba(26,13,48,0.10);
          border-radius: 16px; color: #1a0d30;
          font-family: inherit; font-size: 15px; font-weight: 500;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .login-input:focus {
          outline: none; border-color: #D4A017;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(212,160,23,0.14);
        }
        .login-input::placeholder { color: rgba(26,13,48,0.36); }
        .login-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(26,13,48,0.48); padding: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .login-eye:hover { color: #5B2D8E; }
        .login-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #5B2D8E 0%, #3d1f61 100%);
          border: none; border-radius: 16px; color: #fff;
          font-family: inherit; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: transform .15s, box-shadow .2s;
          box-shadow: 0 10px 30px rgba(91, 45, 142, 0.35);
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px); box-shadow: 0 14px 36px rgba(91, 45, 142, 0.45);
        }
        .login-btn:disabled { opacity: .6; cursor: not-allowed; }
        .login-btn-ghost {
          background: none; border: none; color: #625878;
          font-family: inherit; font-size: 13px; font-weight: 600;
          cursor: pointer; margin-top: 16px; text-align: center; width: 100%;
          padding: 8px; transition: color .2s;
        }
        .login-btn-ghost:hover { color: #5B2D8E; }
        .login-error {
          background: rgba(220, 38, 38, 0.12);
          border: 1px solid rgba(220, 38, 38, 0.3);
          color: #fca5a5;
          padding: 12px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          margin-bottom: 18px; line-height: 1.5;
        }
        .login-success {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #a7f3d0;
          padding: 12px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          margin-bottom: 18px; line-height: 1.5;
        }
        .login-divider {
          display: flex; align-items: center; gap: 12px; margin: 24px 0;
          color: #8d849e;
          font-size: 12px;
        }
        .login-divider::before,
        .login-divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(26,13,48,0.08);
        }
        .login-link {
          color: #D4A017; text-decoration: none; font-weight: 600;
          transition: color .2s;
        }
        .login-link:hover { color: #e6b829; }
        @media (max-width: 900px) {
          .login-shell { grid-template-columns: minmax(280px, 1fr) minmax(360px, 420px); min-height: auto; }
          .login-brand { padding: 32px; }
          .login-brand-title { font-size: 40px; }
          .login-brand-copy { font-size: 15px; }
          .login-form-side { padding: 24px; }
          .login-card { padding: 28px; }
        }
        @media (max-width: 720px) {
          .login-shell { grid-template-columns: 1fr; }
          .login-brand { padding: 28px; }
          .login-brand-title { font-size: 34px; }
          .login-form-side { padding: 16px; }
        }
        @media (max-width: 560px) {
          .login-page { padding: 14px; align-items: stretch; }
          .login-shell { border-radius: 24px; }
          .login-brand { padding: 26px; }
          .login-card { padding: 24px; }
          .login-form-side { padding: 14px; }
          .login-motto span { padding: 8px 11px; font-size: 11px; }
        }
      `}</style>

      <div className="login-page">
        <section className="login-shell" aria-label="Acceso CBIS+">
          <aside className="login-brand">
            <div className="login-brand-inner">
              <div className="login-logo-row">
                <img src="/logo.png" alt="CBIS" className="login-logo" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 24 }}>CBIS+</div>
                  <div style={{ color: 'rgba(255,255,255,0.64)', fontSize: 13, fontWeight: 700 }}>Colegio Bautista Internacional</div>
                </div>
              </div>

              <div>
                <h1 className="login-brand-title">Portal académico con identidad CBIS.</h1>
                <p className="login-brand-copy">
                  Un espacio para acompañar la gestión escolar con claridad, orden y cercanía.
                </p>
              </div>

              <div className="login-motto" aria-label="Lema institucional">
                <span>Fe</span>
                <span>Innovación</span>
                <span>Cultura</span>
                <span>Disciplina</span>
              </div>
            </div>
          </aside>

          <div className="login-form-side">
            <div className={`login-card ${mounted ? 'mounted' : ''}`}>
          {!resetMode ? (
            <>
              <span className="login-eyebrow">Portal Académico 2026</span>
              <h1 className="login-title">Inicia sesión</h1>
              <p className="login-subtitle">
                Usa tus credenciales institucionales para continuar.
              </p>

              {error && <div className="login-error">{error}</div>}

              <form onSubmit={handleLogin}>
                <label className="login-label">Correo</label>
                <div className="login-input-wrap">
                  <input
                    type="email"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.correo@cbis.edu.sv"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>

                <label className="login-label">Contraseña</label>
                <div className="login-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button type="button" className="login-eye" onClick={() => setShowPass(s => !s)} tabIndex={-1} disabled={loading}>
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: 24 }}>
                  {loading ? 'Entrando...' : 'Entrar al portal'}
                </button>
              </form>

              <button type="button" className="login-btn-ghost" onClick={() => setResetMode(true)} disabled={loading}>
                ¿Olvidaste tu contraseña?
              </button>

              <div className="login-divider">Soy padre de familia</div>

              <button type="button" className="login-btn" onClick={() => navigate('/registro-padre')} style={{ background: 'rgba(212, 160, 23, 0.12)', border: '1.5px solid #D4A017', color: '#D4A017' }}>
                Acceder al portal de padres
              </button>
            </>
          ) : (
            <>
              <span className="login-eyebrow">Restablecer contraseña</span>
              <h1 className="login-title">¿Olvidaste tu contraseña?</h1>
              <p className="login-subtitle">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>

              {error && <div className="login-error">{error}</div>}
              {resetSent && <div className="login-success">Revisa tu correo para el enlace de restablecimiento.</div>}

              <form onSubmit={handleForgotPassword}>
                <label className="login-label">Correo</label>
                <div className="login-input-wrap">
                  <input
                    type="email"
                    className="login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu.correo@cbis.edu.sv"
                    autoComplete="email"
                    disabled={resetLoading || resetSent}
                  />
                </div>

                <button type="submit" className="login-btn" disabled={resetLoading || resetSent} style={{ marginTop: 24 }}>
                  {resetLoading ? 'Enviando...' : resetSent ? 'Correo enviado' : 'Enviar enlace'}
                </button>
              </form>

              <button type="button" className="login-btn-ghost" onClick={() => { setResetMode(false); setError(''); setResetSent(false); }} disabled={resetLoading}>
                Volver al login
              </button>
            </>
          )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
