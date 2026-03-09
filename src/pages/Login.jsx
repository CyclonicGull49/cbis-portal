import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
    <div style={{
      minHeight: '100vh', width: '100vw',
      background: 'linear-gradient(135deg, #3d1f61 0%, #5B2D8E 50%, #7B4DB8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Decoración fondo */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ position: 'absolute', top: '30%', left: '10%', width: 12, height: 12, borderRadius: '50%', background: '#E91E8C', opacity: 0.7 }} />
      <div style={{ position: 'absolute', top: '20%', right: '15%', width: 10, height: 10, borderRadius: '50%', background: '#D4A017', opacity: 0.7 }} />
      <div style={{ position: 'absolute', bottom: '25%', right: '10%', width: 14, height: 14, borderRadius: '50%', background: '#2ABFBF', opacity: 0.7 }} />
      <div style={{ position: 'absolute', bottom: '35%', left: '8%', width: 10, height: 10, borderRadius: '50%', background: '#E8573A', opacity: 0.7 }} />

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        <img src="/logo.png" alt="CBIS" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="usuario@cbis.edu.sv"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1.5px solid #e0d6f0', fontSize: 14,
                background: '#faf8ff', color: '#222',
                boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1.5px solid #e0d6f0', fontSize: 14,
                background: '#faf8ff', color: '#222',
                boxSizing: 'border-box', outline: 'none',
              }}
            />
          </div>
          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>⚠️ {error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#9d7cc4' : 'linear-gradient(135deg, #3d1f61, #5B2D8E)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(91,45,142,0.4)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 24 }}>
          © 2026 CBIS · Sistema de Gestión Escolar
        </p>
      </div>
    </div>
  )
}