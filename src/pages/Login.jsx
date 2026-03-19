import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

        .lr { min-height: 100vh; width: 100vw; display: flex; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #0d0818; overflow: hidden; }

        .ll { flex: 1; position: relative; display: flex; flex-direction: column; justify-content: space-between; padding: 52px 60px 48px; overflow: hidden; background: #0d0818; }
        .ll::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 10% 90%, rgba(212,160,23,0.10) 0%, transparent 55%), radial-gradient(ellipse 60% 70% at 90% 10%, rgba(91,45,142,0.25) 0%, transparent 55%); }

        .ll-inner { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
        .ll-brand { display: flex; align-items: center; gap: 14px; }
        .ll-logo { width: 52px; height: 52px; border-radius: 14px; object-fit: cover; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .ll-brand-name { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; display: flex; align-items: center; gap: 6px; }

        .ll-headline { margin-top: auto; padding-bottom: 24px; }
        .ll-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #D4A017; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .ll-eyebrow::before { content: ''; display: block; width: 28px; height: 1.5px; background: #D4A017; }
        .ll-title { font-size: clamp(42px, 4vw, 62px); font-weight: 800; color: #fff; line-height: 1.08; letter-spacing: -2.5px; margin-bottom: 28px; }
        .ll-title em { font-style: italic; font-weight: 400; color: rgba(255,255,255,0.4); }
        .ll-title span { color: #D4A017; }

        .ll-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .ll-pill { padding: 6px 14px; border-radius: 100px; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
        .ll-pill strong { color: rgba(255,255,255,0.8); font-weight: 700; }
        .ll-footer { font-size: 11px; color: rgba(255,255,255,0.2); font-weight: 500; margin-top: 40px; }
        .ll-wave { position: absolute; right: -2px; bottom: 0; z-index: 0; pointer-events: none; }

        .rr { width: 500px; min-width: 400px; background: #fff; display: flex; align-items: center; justify-content: center; padding: 64px 60px; position: relative; }
        .rr-wave { position: absolute; left: -1px; top: 0; height: 100%; pointer-events: none; }
        .rr-inner { width: 100%; max-width: 340px; animation: fadeUp 0.5s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .fh { margin-bottom: 44px; }
        .fh-tag { display: inline-flex; align-items: center; gap: 6px; background: #f3eeff; color: #5B2D8E; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 100px; margin-bottom: 16px; }
        .fh h2 { font-size: 28px; font-weight: 800; color: #0d0818; letter-spacing: -1px; margin-bottom: 6px; }
        .fh p { font-size: 14px; color: #9ca3af; font-weight: 400; }

        .fg { margin-bottom: 32px; position: relative; }
        .fg-label { display: block; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; transition: color 0.2s; }
        .fg:focus-within .fg-label { color: #5B2D8E; }
        .fg-row { display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid #e5e7eb; padding-bottom: 10px; transition: border-color 0.2s; }
        .fg:focus-within .fg-row { border-color: #5B2D8E; }
        .fg-icon { color: #d1d5db; flex-shrink: 0; transition: color 0.2s; display: flex; }
        .fg:focus-within .fg-icon { color: #5B2D8E; }
        .fg-input { flex: 1; border: none; outline: none; font-size: 15px; font-weight: 500; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #111827; background: transparent; }
        .fg-input::placeholder { color: #d1d5db; font-weight: 400; }
        .fg-btn { background: none; border: none; cursor: pointer; color: #d1d5db; padding: 0; display: flex; align-items: center; transition: color 0.2s; }
        .fg-btn:hover { color: #5B2D8E; }

        .err { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; margin-bottom: 24px; font-size: 13px; color: #dc2626; font-weight: 500; }

        .sbtn { width: 100%; padding: 15px; background: linear-gradient(135deg, #1a0d30 0%, #5B2D8E 100%); color: #fff; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; cursor: pointer; letter-spacing: -0.2px; transition: all 0.25s; position: relative; overflow: hidden; box-shadow: 0 4px 24px rgba(91,45,142,0.4); margin-bottom: 4px; }
        .sbtn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(91,45,142,0.5); }
        .sbtn:active:not(:disabled) { transform: translateY(0); }
        .sbtn:disabled { opacity: 0.65; cursor: not-allowed; }
        .sbtn-shine { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%); transform: translateX(-100%); animation: shine 2.5s infinite; }
        @keyframes shine { 100% { transform: translateX(200%); } }

        .fbtn { width: 100%; background: none; border: none; color: #c4b5d4; font-size: 13px; font-weight: 500; cursor: pointer; padding: 10px 0; margin-top: 4px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; transition: color 0.2s; }
        .fbtn:hover { color: #5B2D8E; }
        .rst-ok { margin-top: 16px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; font-size: 13px; color: #16a34a; font-weight: 600; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .ff { margin-top: 36px; text-align: center; font-size: 11px; color: #d1d5db; font-weight: 500; }

        @media (max-width: 768px) {
          .ll { display: none; }
          .lr { background: linear-gradient(170deg, #0d0818 0%, #2d1554 50%, #3d1f61 100%); }
          .rr { width: 100%; min-width: 0; padding: 0; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; min-height: 100vh; background: transparent; }
          .rr-wave { display: none; }
          .rr-inner { max-width: 100%; display: flex; flex-direction: column; flex: 1; }
          .mob-top { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 32px 52px; flex: 1; position: relative; overflow: hidden; }
          .mob-top::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 36px 36px; }
          .mob-top-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
          .mob-logo { width: 68px; height: 68px; border-radius: 18px; object-fit: cover; box-shadow: 0 8px 28px rgba(0,0,0,0.45); }
          .mob-name { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; display: flex; align-items: center; gap: 7px; }
          .mob-lema { font-size: 13px; color: rgba(255,255,255,0.45); font-style: italic; max-width: 240px; }
          .mob-pills { display: flex; gap: 7px; flex-wrap: wrap; justify-content: center; margin-top: 6px; }
          .mob-pill { padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); }
          .mob-card { background: #fff; border-radius: 28px 28px 0 0; padding: 36px 28px 52px; box-shadow: 0 -8px 40px rgba(0,0,0,0.25); }
          .mob-card::before { content: ''; display: block; width: 40px; height: 4px; border-radius: 100px; background: #e5e7eb; margin: 0 auto 28px; }
          .fh { margin-bottom: 28px; }
          .fh h2 { font-size: 22px; }
          .fh-tag { display: none; }
          .ff { margin-top: 24px; }
        }

        @media (min-width: 769px) {
          .mob-top { display: none; }
          .mob-card { display: contents; }
        }
      `}</style>

      <div className="lr">
        <div className="ll">
          <svg className="ll-wave" viewBox="0 0 120 900" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '100%', width: 'auto' }}>
            <path d="M120 0 C60 150, 0 200, 20 350 C40 500, 120 550, 80 700 C50 820, 0 860, 0 900 L120 900 Z" fill="white" fillOpacity="0.02"/>
            <path d="M120 0 C80 100, 30 180, 50 320 C70 460, 120 500, 100 650 C80 780, 20 840, 0 900 L120 900 Z" fill="white" fillOpacity="0.015"/>
          </svg>
          <div className="ll-inner">
            <div className="ll-brand">
              <img src="/logo.png" alt="CBIS" className="ll-logo" />
              <div className="ll-brand-name">
                CBIS
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/>
                  <rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/>
                </svg>
              </div>
            </div>
            <div className="ll-headline">
              <div className="ll-eyebrow">Portal Académico 2026</div>
              <h1 className="ll-title">Fe, <em>Cultura,</em><br/>Innovación<br/><span>&amp;</span> Disciplina.</h1>
              <div className="ll-pills">
                <div className="ll-pill">Matrículas <strong>automatizadas</strong></div>
                <div className="ll-pill">Notas en <strong>tiempo real</strong></div>
                <div className="ll-pill">Cobros y <strong>pagos</strong></div>
                <div className="ll-pill"><strong>+</strong> más</div>
              </div>
            </div>
            <div className="ll-footer">© 2026 CBIS · Sonsonate, El Salvador</div>
          </div>
        </div>

        <div className="rr">
          <svg className="rr-wave" viewBox="0 0 80 900" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80 }}>
            <path d="M80 0 C40 150, 0 200, 20 350 C40 500, 80 550, 60 700 C40 820, 0 860, 0 900 L80 900 L80 0 Z" fill="#0d0818"/>
          </svg>
          <div className="rr-inner">
            <div className="mob-top">
              <div className="mob-top-inner">
                <img src="/logo.png" alt="CBIS" className="mob-logo" />
                <div className="mob-name">CBIS <svg width="20" height="20" viewBox="0 0 28 28" fill="none"><rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/><rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/></svg></div>
                <div className="mob-lema">Fe, Cultura, Innovación y Disciplina</div>
                <div className="mob-pills"><span className="mob-pill">Notas</span><span className="mob-pill">Asistencia</span><span className="mob-pill">Cobros</span></div>
              </div>
            </div>
            <div className="mob-card">
              <div className="fh">
                <div className="fh-tag">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="#5B2D8E"><circle cx="4" cy="4" r="4"/></svg>
                  Sistema de gestión escolar
                </div>
                <h2>Bienvenido</h2>
                <p>Ingresa tus credenciales para continuar</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="fg">
                  <label className="fg-label">Correo electrónico</label>
                  <div className="fg-row">
                    <span className="fg-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </span>
                    <input type="email" className="fg-input" placeholder="usuario@cbis.edu.sv" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="fg">
                  <label className="fg-label">Contraseña</label>
                  <div className="fg-row">
                    <span className="fg-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input type={showPass ? 'text' : 'password'} className="fg-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="fg-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                      {showPass
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="err">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                  </div>
                )}
                <button type="submit" className="sbtn" disabled={loading}>
                  <span className="sbtn-shine" />
                  {loading ? 'Verificando...' : 'Acceder al portal'}
                </button>
                {resetSent ? (
                  <div className="rst-ok">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Revisa tu correo — enlace enviado
                  </div>
                ) : (
                  <button type="button" className="fbtn" onClick={handleForgotPassword} disabled={resetLoading}>
                    {resetLoading ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
                  </button>
                )}
              </form>
              <div className="ff">CBIS · Colegio Bautista Internacional de Sonsonate</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}