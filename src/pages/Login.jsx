import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.logoBadge}>
          <span style={styles.logoText}>CBIS</span>
        </div>
        <h1 style={styles.titulo}>Portal CBIS</h1>
        <p style={styles.sub}>Colegio Bautista Internacional de Sonsonate</p>

        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              style={styles.input}
              type="email"
              placeholder="usuario@cbis.edu.sv"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar al Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  bg: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0f2444 0%, #1a3a6b 40%, #0d1f3c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1e3a5f, #2563a8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  logoText: {
    color: '#fff',
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: 1,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 800,
    color: '#1e3a5f',
    margin: '0 0 6px',
  },
  sub: {
    fontSize: 13,
    color: '#888',
    marginBottom: 28,
  },
  field: {
    marginBottom: 16,
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#1e3a5f',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: '1.5px solid #dde3ee',
    fontSize: 14,
    background: '#f8faff',
    color: '#222',
    boxSizing: 'border-box',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
  },
  btn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #1e3a5f, #2563a8)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 8,
  },
}