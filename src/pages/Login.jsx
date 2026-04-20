import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />
}

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
          background: radial-gradient(ellipse at top left, #2d1554 0%, #1a0d30 50%, #0f0720 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }
        .login-blob {
          position: absolute; border-radius: 50%; filter: blur(80px);
          opacity: .35; pointer-events: none; animation: loginFloat 12s ease-in-out infinite;
        }
        .login-blob-1 { width: 480px; height: 480px; background: #5B2D8E; top: -160px; left: -160px; }
        .login-blob-2 { width: 420px; height: 420px; background: #D4A017; bottom: -140px; right: -140px; animation-delay: 3s; }
        .login-blob-3 { width: 340px; height: 340px; background: #3d1f61; top: 35%; right: 8%; animation-delay: 6s; }
        @keyframes loginFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(40px, -30px) scale(1.08); }
        }
        .login-card {
          position: relative; width: 100%; max-width: 460px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px; padding: 44px 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
          opacity: 0; transform: translateY(12px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .login-card.mounted { opacity: 1; transform: translateY(0); }
        .login-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 2px;
          color: #D4A017; text-transform: uppercase; margin-bottom: 12px;
        }
        .login-eyebrow::before { content: ''; width: 24px; height: 2px; background: #D4A017; }
        .login-title {
          font-size: 28px; font-weight: 700; color: #fff;
          margin-bottom: 8px; letter-spacing: -0.02em;
        }
        .login-subtitle {
          font-size: 14px; color: rgba(255, 255, 255, 0.6);
          margin-bottom: 28px; line-height: 1.5;
        }
        .login-label {
          display: block; font-size: 11px; font-weight: 700;
          color: rgba(255, 255, 255, 0.7); letter-spacing: 1.2px;
          text-transform: uppercase; margin-bottom: 8px;
        }
        .login-input-wrap {
          position: relative; margin-bottom: 18px;
        }
        .login-input {
          width: 100%; padding: 14px 44px 14px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px; color: #fff;
          font-family: inherit; font-size: 15px; font-weight: 500;
          transition: border-color .2s, background .2s;
        }
        .login-input:focus {
          outline: none; border-color: #D4A017;
          background: rgba(255, 255, 255, 0.08);
        }
        .login-input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .login-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255, 255, 255, 0.5); padding: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .login-eye:hover { color: rgba(255, 255, 255, 0.9); }
        .login-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #5B2D8E 0%, #3d1f61 100%);
          border: none; border-radius: 12px; color: #fff;
          font-family: inherit; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: transform .15s, box-shadow .2s;
          box-shadow: 0 10px 30px rgba(91, 45, 142, 0.35);
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-1px); box-shadow: 0 14px 36px rgba(91, 45, 142, 0.45);
        }
        .login-btn:disabled { opacity: .6; cursor: not-allowed; }
        .login-btn-ghost {
          background: none; border: none; color: rgba(255, 255, 255, 0.6);
          font-family: inherit; font-size: 13px; font-weight: 600;
          cursor: pointer; margin-top: 16px; text-align: center; width: 100%;
          padding: 8px; transition: color .2s;
        }
        .login-btn-ghost:hover { color: #D4A017; }
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
          color: rgba(255, 255, 255, 0.3);
          font-size: 12px;
        }
        .login-divider::before,
        .login-divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }
        .login-link {
          color: #D4A017; text-decoration: none; font-weight: 600;
          transition: color .2s;
        }
        .login-link:hover { color: #e6b829; }
      `}</style>

      <div className="login-page">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />

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
                  {resetLoading ? 'Enviando...' : resetSent ? 'Correo enviado ✓' : 'Enviar enlace'}
                </button>
              </form>

              <button type="button" className="login-btn-ghost" onClick={() => { setResetMode(false); setError(''); setResetSent(false); }} disabled={resetLoading}>
                Volver al login
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
