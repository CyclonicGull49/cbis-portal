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
          gap: 18px;
          margin-bottom: auto;
        }

        .brand-logo {
          width: 76px;
          height: 76px;
          border-radius: 20px;
          object-fit: cover;
          box-shadow: 0 10px 32px rgba(0,0,0,0.45);
        }

        .brand-name {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 40px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -1.5px;
          line-height: 1;
        }

        .left-headline {
          margin-top: 64px;
        }

        .slogan-block {
          margin-bottom: 32px;
        }

        .slogan-block p {
          font-size: 54px;
          font-weight: 800;
          color: #fff;
          line-height: 1.12;
          letter-spacing: -2px;
        }

        .slogan-block p span {
          color: #D4A017;
        }

        .stat-pills {
          display: flex;
          gap: 10px;
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

        /* Área inferior izquierda: ilustración + redes */
        .left-bottom {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .left-illustration {
          opacity: 0.18;
          pointer-events: none;
          margin-bottom: -8px;
        }

        .social-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .social-label {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-weight: 500;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          margin-right: 4px;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          transition: all 0.2s;
        }

        .social-link:hover {
          background: rgba(255,255,255,0.14);
          color: #fff;
          transform: translateY(-2px);
        }

        .left-footer {
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          font-weight: 500;
          margin-top: 16px;
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
          .login-root { background: linear-gradient(180deg, #1a0d30 0%, #2d1554 55%, #3d1f61 100%); }

          .login-right {
            width: 100%;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            min-height: 100vh;
            background: transparent;
          }

          .login-form-wrap {
            max-width: 100%;
            display: flex;
            flex-direction: column;
            flex: 1;
          }

          /* Header móvil con branding */
          .mobile-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 56px 32px 48px;
            position: relative;
            overflow: hidden;
            flex: 1;
          }

          .mobile-header::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 32px 32px;
          }

          /* Círculos decorativos */
          .mobile-header::after {
            content: '';
            position: absolute;
            bottom: -60px;
            right: -60px;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: rgba(212,160,23,0.08);
            pointer-events: none;
          }

          .mobile-header-content {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            text-align: center;
          }

          .mobile-logo {
            width: 72px;
            height: 72px;
            border-radius: 18px;
            object-fit: cover;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          }

          .mobile-brand-name {
            color: #fff;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -1px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .mobile-lema {
            color: rgba(255,255,255,0.5);
            font-size: 13px;
            font-style: italic;
            letter-spacing: 0.2px;
          }

          /* Pills decorativas bajo el lema */
          .mobile-pills {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: 8px;
          }

          .mobile-pill {
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 100px;
            padding: 5px 12px;
            font-size: 11px;
            color: rgba(255,255,255,0.5);
            font-weight: 500;
          }

          /* Área del formulario — tarjeta blanca con radio */
          .mobile-form-area {
            background: #fff;
            border-radius: 24px 24px 0 0;
            padding: 32px 28px 48px;
            box-shadow: 0 -4px 32px rgba(0,0,0,0.2);
          }

          .form-header {
            margin-bottom: 28px;
          }

          .form-header h2 {
            font-size: 22px;
          }
        }

        @media (min-width: 769px) {
          .mobile-header { display: none; }
          .mobile-form-area { display: contents; }
          .mobile-pills { display: none; }
        }
      `}</style>

      <div className="login-root">
        {/* Panel izquierdo */}
        <div className="login-left">
          <div className="grid-overlay" />
          <div className="login-left-content">
            <div className="brand-mark">
              <img src="/logo.png" alt="CBIS" className="brand-logo" />
              <div className="brand-name">
                CBIS
                {/* Plus SVG — cruz con esquinas redondeadas en dorado */}
                <svg className="brand-plus" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/>
                  <rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/>
                </svg>
              </div>
            </div>

            <div className="left-headline">
              <div className="slogan-block">
                <p>Fe, Cultura,<br/>Innovación <span>&</span><br/>Disciplina.</p>
              </div>

              <div className="stat-pills">
                <div className="stat-pill">Matrículas <strong>automatizadas</strong></div>
                <div className="stat-pill">Estados de <strong>cuenta</strong></div>
                <div className="stat-pill">Pagos en <strong>línea</strong></div>
                <div className="stat-pill"><strong>Y más</strong></div>
              </div>
            </div>
          </div>

          {/* Área inferior: ilustración sutil + redes sociales */}
          <div className="left-bottom">
            {/* Ilustración geométrica abstracta */}
            <svg
              className="left-illustration"
              width="320"
              height="80"
              viewBox="0 0 320 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Líneas de conexión */}
              <line x1="20" y1="60" x2="80" y2="20" stroke="white" strokeWidth="1"/>
              <line x1="80" y1="20" x2="160" y2="50" stroke="white" strokeWidth="1"/>
              <line x1="160" y1="50" x2="240" y2="15" stroke="white" strokeWidth="1"/>
              <line x1="240" y1="15" x2="300" y2="45" stroke="white" strokeWidth="1"/>
              <line x1="80" y1="20" x2="120" y2="65" stroke="white" strokeWidth="0.6" strokeDasharray="4 4"/>
              <line x1="160" y1="50" x2="200" y2="70" stroke="white" strokeWidth="0.6" strokeDasharray="4 4"/>
              <line x1="240" y1="15" x2="270" y2="70" stroke="white" strokeWidth="0.6" strokeDasharray="4 4"/>
              {/* Nodos */}
              <circle cx="20" cy="60" r="4" fill="#D4A017"/>
              <circle cx="80" cy="20" r="5" fill="white"/>
              <circle cx="160" cy="50" r="4" fill="white"/>
              <circle cx="240" cy="15" r="6" fill="#D4A017"/>
              <circle cx="300" cy="45" r="4" fill="white"/>
              <circle cx="120" cy="65" r="3" fill="white" opacity="0.5"/>
              <circle cx="200" cy="70" r="3" fill="white" opacity="0.5"/>
              <circle cx="270" cy="70" r="3" fill="white" opacity="0.5"/>
              {/* Anillos en nodos principales */}
              <circle cx="80" cy="20" r="10" stroke="white" strokeWidth="0.5" opacity="0.4"/>
              <circle cx="240" cy="15" r="12" stroke="#D4A017" strokeWidth="0.5" opacity="0.5"/>
            </svg>

            {/* Redes sociales */}
            <div className="social-row">
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a href="https://wa.me/50300000000" target="_blank" rel="noopener noreferrer" className="social-link" title="WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </a>
            </div>

            <div className="left-footer">
              © 2026 CBIS · Sistema de Gestión Escolar
            </div>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="login-right">
          <div className="login-form-wrap">

            {/* Header móvil — solo visible en <768px */}
            <div className="mobile-header">
              <div className="mobile-header-content">
                <img src="/logo.png" alt="CBIS" className="mobile-logo" />
                <div className="mobile-brand-name">
                  CBIS
                  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                    <rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/>
                    <rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/>
                  </svg>
                </div>
                <div className="mobile-lema">Fe, Cultura, Innovación y Disciplina</div>
                <div className="mobile-pills">
                  <span className="mobile-pill">Notas en línea</span>
                  <span className="mobile-pill">Asistencia</span>
                  <span className="mobile-pill">Cobros</span>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="mobile-form-area">
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
                {loading ? 'Verificando...' : 'Acceder'}
              </button>
            </form>

            <div className="form-footer">
                CBIS · Sonsonate, El Salvador
              </div>
            </div>{/* fin mobile-form-area */}
          </div>
        </div>
      </div>
    </>
  )
}