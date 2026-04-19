import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('validating')
  // 'validating' | 'ready' | 'updating' | 'success' | 'error'
  const [errorMsg, setErrorMsg]     = useState('')
  const [password, setPassword]     = useState('')
  const [confirm,  setConfirm]      = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [mounted,  setMounted]      = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  // Parsear token del hash (#access_token=...&refresh_token=...&type=recovery)
  // y establecer la sesión manualmente (detectSessionInUrl: false)
  useEffect(() => {
    async function procesarToken() {
      const hash = window.location.hash
      if (!hash) {
        setStatus('error')
        setErrorMsg('Enlace inválido o expirado. Solicita un nuevo correo de recuperación.')
        return
      }
      const params = new URLSearchParams(hash.substring(1))
      const access_token  = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const type          = params.get('type')
      const errorDesc     = params.get('error_description')

      if (errorDesc) {
        setStatus('error')
        setErrorMsg(decodeURIComponent(errorDesc.replace(/\+/g, ' ')))
        return
      }

      if (type !== 'recovery' || !access_token || !refresh_token) {
        setStatus('error')
        setErrorMsg('Enlace inválido. Solicita un nuevo correo de recuperación desde el inicio de sesión.')
        return
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token })
      if (error) {
        setStatus('error')
        setErrorMsg('No se pudo validar el enlace. Es posible que haya expirado.')
        return
      }

      // Limpiar hash para que no quede el token expuesto en la URL
      window.history.replaceState(null, '', window.location.pathname)
      setStatus('ready')
    }
    procesarToken()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setErrorMsg('Las contraseñas no coinciden.')
      return
    }

    setStatus('updating')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setStatus('ready')
      setErrorMsg('No se pudo actualizar la contraseña. Intenta de nuevo.')
      return
    }
    setStatus('success')
    // Cerrar sesión de recovery para forzar login limpio con nueva contraseña
    await supabase.auth.signOut()
    setTimeout(() => navigate('/login'), 2500)
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
          position: relative; width: 100%; max-width: 460px;
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
          position: relative; margin-bottom: 18px;
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
          cursor: pointer; margin-top: 18px; text-align: center; width: 100%;
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
        .rp-state {
          text-align: center; padding: 12px 0;
        }
        .rp-state-icon {
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 50%;
          margin-bottom: 16px;
        }
        .rp-state-icon.ok  { background: rgba(22, 163, 74, 0.15); color: #4ade80; }
        .rp-state-icon.err { background: rgba(220, 38, 38, 0.15); color: #fca5a5; }
        .rp-spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255, 255, 255, 0.25);
          border-top-color: #fff; border-radius: 50%;
          animation: rpSpin .8s linear infinite; display: inline-block; vertical-align: middle;
        }
        @keyframes rpSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="rp-page">
        <div className="rp-blob rp-blob-1" />
        <div className="rp-blob rp-blob-2" />
        <div className="rp-blob rp-blob-3" />

        <div className={`rp-card ${mounted ? 'mounted' : ''}`}>
          {status === 'validating' && (
            <div className="rp-state">
              <div className="rp-spinner" />
              <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 14, fontSize: 14, fontWeight: 500 }}>
                Validando enlace...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="rp-state">
              <div className="rp-state-icon err">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="rp-title" style={{ fontSize: 20 }}>Enlace no válido</div>
              <p className="rp-subtitle" style={{ marginBottom: 20 }}>{errorMsg}</p>
              <button className="rp-btn" onClick={() => navigate('/login')}>
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {status === 'success' && (
            <div className="rp-state">
              <div className="rp-state-icon ok">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="rp-title" style={{ fontSize: 20 }}>Contraseña actualizada</div>
              <p className="rp-subtitle">
                Tu nueva contraseña ya está activa. Te redirigimos al inicio de sesión...
              </p>
            </div>
          )}

          {(status === 'ready' || status === 'updating') && (
            <>
              <span className="rp-eyebrow">Recuperación</span>
              <h1 className="rp-title">Nueva contraseña</h1>
              <p className="rp-subtitle">
                Elige una contraseña segura. Debe tener al menos 8 caracteres.
              </p>

              {errorMsg && <div className="rp-error">{errorMsg}</div>}

              <form onSubmit={handleSubmit}>
                <label className="rp-label">Nueva contraseña</label>
                <div className="rp-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="rp-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="rp-eye" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
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

                <label className="rp-label">Confirmar contraseña</label>
                <div className="rp-input-wrap" style={{ marginBottom: 26 }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="rp-input"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <button type="submit" className="rp-btn" disabled={status === 'updating'}>
                  {status === 'updating' ? (
                    <><span className="rp-spinner" /> <span style={{ marginLeft: 8 }}>Actualizando...</span></>
                  ) : 'Actualizar contraseña'}
                </button>
              </form>

              <button type="button" className="rp-btn-ghost" onClick={() => navigate('/login')}>
                Cancelar y volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
