import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

function FloatingOrb({ style }) {
  return <div style={{ position:'absolute', borderRadius:'50%', pointerEvents:'none', ...style }} />
}

function formatDui(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 8) return digits
  return digits.slice(0, 8) + '-' + digits.slice(8)
}

function duiSinGuion(dui) {
  return dui.replace(/-/g, '')
}

export default function RegistroPadre() {
  const navigate = useNavigate()
  const { perfil } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [dui, setDui] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => { 
    setTimeout(() => setMounted(true), 50)
    // Si ya está logueado como padre, redirigir al dashboard
    if (perfil?.rol === 'padres') {
      navigate('/padre/inicio')
    }
  }, [perfil, navigate])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const duiClean = duiSinGuion(dui.trim())
    if (duiClean.length !== 9) {
      setError('DUI debe tener 9 dígitos')
      setLoading(false)
      return
    }

    const email = `${duiClean}@cbis.padre.sv`

    // Intentar login
    const { error: loginErr } = await supabase.auth.signInWithPassword({
      email,
      password: password.trim(),
    })

    setLoading(false)

    if (loginErr) {
      if (loginErr.message?.includes('Invalid login')) {
        setError('DUI o contraseña incorrectos. La contraseña debe ser el apellido de tu hijo/a + 2026. Ej: Velis2026')
      } else {
        setError(loginErr.message || 'Error al iniciar sesión')
      }
      return
    }

    toast.success('Bienvenido al portal de padres')
    navigate('/padre/inicio')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }

        .rp-page {
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: radial-gradient(ellipse at top left, #2d1554 0%, #1a0d30 50%, #0f0720 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }
        .rp-blob {
          position: absolute; border-radius: 50%; filter: blur(80px);
          opacity: .35; pointer-events: none; animation: rpFloat 12s ease-in-out infinite;
        }
        .rp-blob-1 { width: 420px; height: 420px; background: #5B2D8E; top: -120px; left: -120px; }
        .rp-blob-2 { width: 380px; height: 380px; background: #D4A017; bottom: -120px; right: -120px; animation-delay: 3s; }
        .rp-blob-3 { width: 300px; height: 300px; background: #3d1f61; top: 40%; right: 10%; animation-delay: 6s; }
        @keyframes rpFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(30px, -20px) scale(1.06); }
        }
        .rp-card {
          position: relative; width: 100%; max-width: 420px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px; padding: 40px 36px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
          opacity: 0; transform: translateY(12px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .rp-card.mounted { opacity: 1; transform: translateY(0); }
        .rp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700; letter-spacing: 2px;
          color: #D4A017; text-transform: uppercase; margin-bottom: 12px;
        }
        .rp-eyebrow::before { content: ''; width: 24px; height: 2px; background: #D4A017; }
        .rp-title {
          font-size: 26px; font-weight: 700; color: #fff;
          margin-bottom: 6px; letter-spacing: -0.02em;
        }
        .rp-subtitle {
          font-size: 14px; color: rgba(255, 255, 255, 0.6);
          margin-bottom: 28px; line-height: 1.5;
        }
        .rp-label {
          display: block; font-size: 11px; font-weight: 700;
          color: rgba(255, 255, 255, 0.7); letter-spacing: 1.2px;
          text-transform: uppercase; margin-bottom: 8px;
        }
        .rp-input-wrap {
          position: relative; margin-bottom: 16px;
        }
        .rp-input {
          width: 100%; padding: 14px 44px 14px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px; color: #fff;
          font-family: inherit; font-size: 15px; font-weight: 500;
          transition: border-color .2s, background .2s;
        }
        .rp-input:focus {
          outline: none; border-color: #D4A017;
          background: rgba(255, 255, 255, 0.08);
        }
        .rp-input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .rp-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255, 255, 255, 0.5); padding: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .rp-eye:hover { color: rgba(255, 255, 255, 0.9); }
        .rp-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, #5B2D8E 0%, #3d1f61 100%);
          border: none; border-radius: 12px; color: #fff;
          font-family: inherit; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: transform .15s, box-shadow .2s;
          box-shadow: 0 10px 30px rgba(91, 45, 142, 0.35);
        }
        .rp-btn:hover:not(:disabled) {
          transform: translateY(-1px); box-shadow: 0 14px 36px rgba(91, 45, 142, 0.45);
        }
        .rp-btn:disabled { opacity: .6; cursor: not-allowed; }
        .rp-btn-ghost {
          background: none; border: none; color: rgba(255, 255, 255, 0.6);
          font-family: inherit; font-size: 13px; font-weight: 600;
          cursor: pointer; margin-top: 16px; text-align: center; width: 100%;
          padding: 8px; transition: color .2s;
        }
        .rp-btn-ghost:hover { color: #D4A017; }
        .rp-error {
          background: rgba(220, 38, 38, 0.12);
          border: 1px solid rgba(220, 38, 38, 0.3);
          color: #fca5a5;
          padding: 12px 14px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          margin-bottom: 18px; line-height: 1.5;
        }
        .rp-hint {
          font-size: 12px; color: rgba(255, 255, 255, 0.5);
          margin-top: 12px; line-height: 1.5;
        }
      `}</style>

      <div className="rp-page">
        <div className="rp-blob rp-blob-1" />
        <div className="rp-blob rp-blob-2" />
        <div className="rp-blob rp-blob-3" />

        <div className={`rp-card ${mounted ? 'mounted' : ''}`}>
          <span className="rp-eyebrow">Portal de Padres</span>
          <h1 className="rp-title">Acceso Padres</h1>
          <p className="rp-subtitle">
            Ingresa tu DUI y la contraseña que el colegio te proporcionó.
          </p>

          {error && <div className="rp-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <label className="rp-label">DUI</label>
            <div className="rp-input-wrap">
              <input
                type="text"
                className="rp-input"
                value={dui}
                onChange={(e) => setDui(formatDui(e.target.value))}
                placeholder="0123456-7"
                autoComplete="off"
                disabled={loading}
              />
            </div>

            <label className="rp-label">Contraseña</label>
            <div className="rp-input-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="rp-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
              <button type="button" className="rp-eye" onClick={() => setShowPass(s => !s)} tabIndex={-1} disabled={loading}>
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

            <p className="rp-hint">
              Si no recuerdas tu contraseña, comunícate con recepción del colegio.
            </p>

            <button type="submit" className="rp-btn" disabled={loading} style={{ marginTop: 24 }}>
              {loading ? 'Entrando...' : 'Entrar al portal'}
            </button>
          </form>

          <button type="button" className="rp-btn-ghost" onClick={() => navigate('/login')}>
            Volver al inicio
          </button>
        </div>
      </div>
    </>
  )
}
