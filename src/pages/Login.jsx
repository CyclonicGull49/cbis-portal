import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await login(email, password)
    if (error) {
      setError('Correo o contraseña incorrectos')
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #0f0a1a;
        }

        /* Panel izquierdo — branding */
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #1a0d30 0%, #2d1554 50%, #3d1f61 100%);
        }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(212,160,23,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 20%, rgba(91,45,142,0.3) 0%, transparent 50%);
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .login-left-content {
          position: relative;
          z-index: 1;
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: auto;
        }

        .brand-logo {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          object-fit: cover;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }

        .brand-name {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .brand-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .left-headline {
          margin-top: 80px;
        }

        .left-headline h1 {
          font-size: 42px;
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }

        .left-headline h1 span {
          color: #D4A017;
        }

        .left-headline p {
          font-size: 15px;
          color: rgba(255,255,255,0.55);
          line-height: 1.7;
          max-width: 340px;
          font-weight: 400;
        }

        .left-footer {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          font-weight: 500;
        }

        .stat-pills {
          display: flex;
          gap: 10px;
          margin-top: 40px;
          flex-wrap: wrap;
        }

        .stat-pill {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          padding: 8px 16px;
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
          backdrop-filter: blur(8px);
        }

        .stat-pill strong {
          color: #D4A017;
          font-weight: 700;
        }

        /* Panel derecho — formulario */
        .login-right {
          width: 480px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
        }

        .login-form-wrap {
          width: 100%;
          max-width: 360px;
        }

        .form-header {
          margin-bottom: 36px;
        }

        .form-header h2 {
          font-size: 26px;
          font-weight: 800;
          color: #0f0a1a;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .form-header p {
          font-size: 14px;
          color: #9ca3af;
          font-weight: 400;
        }

        .field-group {
          margin-bottom: 20px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .field-input-wrap {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .field-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #f9fafb;
          color: #111827;
          outline: none;
          transition: all 0.2s;
          font-weight: 500;
        }

        .field-input:focus {
          border-color: #5B2D8E;
          background: #faf8ff;
          box-shadow: 0 0 0 4px rgba(91,45,142,0.08);
        }

        .field-input::placeholder {
          color: #d1d5db;
          font-weight: 400;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
        }

        .error-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #dc2626;
          flex-shrink: 0;
        }

        .error-text {
          font-size: 13px;
          color: #dc2626;
          font-weight: 500;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #3d1f61, #5B2D8E);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer;
          letter-spacing: -0.2px;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(61,31,97,0.35);
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(61,31,97,0.45);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-btn .btn-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
          transform: translateX(-100%);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }

        .form-footer {
          text-align: center;
          font-size: 12px;
          color: #d1d5db;
          font-weight: 500;
          margin-top: 32px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right {
            width: 100%;
            padding: 40px 28px;
          }
        }
      `}</style>

      <div className="login-root">
        {/* Panel izquierdo */}
        <div className="login-left">
          <div className="grid-overlay" />
          <div className="login-left-content">
            <div className="brand-mark">
              <img src="/logo.png" alt="CBIS" className="brand-logo" />
              <div>
                <div className="brand-name">CBIS+</div>
                <div className="brand-sub">Portal de Gestión Escolar</div>
              </div>
            </div>

            <div className="left-headline">
              <h1>Gestión escolar<br/>hecha <span>simple.</span></h1>
              <p>Administra estudiantes, cobros y reportes del Colegio Bautista Internacional de Sonsonate desde un solo lugar.</p>

              <div className="stat-pills">
                <div className="stat-pill">Matrículas <strong>automatizadas</strong></div>
                <div className="stat-pill">Reportes en <strong>PDF</strong></div>
                <div className="stat-pill">Recibos <strong>térmicos</strong></div>
              </div>
            </div>
          </div>

          <div className="left-footer">
            © 2026 CBIS · Sistema de Gestión Escolar
          </div>
        </div>

        {/* Panel derecho */}
        <div className="login-right">
          <div className="login-form-wrap">
            <div className="form-header">
              <h2>Bienvenido</h2>
              <p>Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label">Correo electrónico</label>
                <div className="field-input-wrap">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="field-input"
                    placeholder="usuario@cbis.edu.sv"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Contraseña</label>
                <div className="field-input-wrap">
                  <span className="field-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="field-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="error-box">
                  <div className="error-dot" />
                  <span className="error-text">{error}</span>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                <span className="btn-shimmer" />
                {loading ? 'Verificando...' : 'Ingresar al sistema'}
              </button>
            </form>

            <div className="form-footer">
              CBIS · Sonsonate, El Salvador
            </div>
          </div>
        </div>
      </div>
    </>
  )
}