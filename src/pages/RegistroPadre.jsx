import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

// ── Helpers ────────────────────────────────────────
function FloatingOrb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }} />
}

const PARENTESCOS = ['Padre', 'Madre', 'Tutor']

// ── Icons ──────────────────────────────────────────
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IconCheck = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconSchool = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

// ── Step indicator ─────────────────────────────────
function Steps({ current }) {
  const steps = ['Tus datos', 'Buscar hijo/a', 'Confirmar']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((label, i) => {
        const n = i + 1
        const done = current > n
        const active = current === n
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#5B2D8E' : active ? 'linear-gradient(135deg,#2d1554,#5B2D8E)' : '#f3eeff',
                border: active ? 'none' : done ? 'none' : '2px solid #e9e3ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 4px 12px rgba(91,45,142,0.35)' : 'none',
                transition: 'all 0.3s',
              }}>
                {done
                  ? <IconCheck size={14} style={{ color: '#fff' }} />
                  : <span style={{ fontSize: 12, fontWeight: 800, color: active ? '#fff' : '#c4b5fd' }}>{n}</span>
                }
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#5B2D8E' : done ? '#5B2D8E' : '#c4b5fd', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? '#5B2D8E' : '#f3eeff', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Field wrapper ──────────────────────────────────
function Field({ label, icon, children }) {
  return (
    <div className="rp-field">
      <label className="rp-label">{label}</label>
      <div className="rp-input-wrap">
        {icon && <span className="rp-field-icon">{icon}</span>}
        {children}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────
export default function RegistroPadre() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1 — datos del padre
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [parentesco, setParentesco] = useState('Padre')

  // Step 2 — búsqueda de hijo
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [hijoSeleccionado, setHijoSeleccionado] = useState(null)
  const debounceRef = useRef(null)

  // Step 3 — confirmación
  const [exito, setExito] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  // ── Autocomplete búsqueda ──────────────────────
  useEffect(() => {
    if (query.trim().length < 2) { setResultados([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarEstudiante(query.trim()), 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  async function buscarEstudiante(q) {
    setBuscando(true)
    const { data, error } = await supabase.rpc('buscar_estudiantes_publico', { p_query: q.trim() })
    setBuscando(false)
    if (!error) {
      setResultados((data || []).map(r => ({
        id: r.id,
        nombre: r.nombre,
        apellido: r.apellido,
        grados: { nombre: r.grado_nombre, nivel: r.grado_nivel },
      })))
    }
  }

  // ── Nivel → color ──────────────────────────────
  const nivelColor = {
    primera_infancia: '#0e9490',
    primaria: '#a16207',
    secundaria: '#c2410c',
    bachillerato: '#5B2D8E',
  }

  // ── Validación step 1 ──────────────────────────
  function validarStep1() {
    if (!nombre.trim()) { setError('Ingresa tu nombre'); return false }
    if (!apellido.trim()) { setError('Ingresa tu apellido'); return false }
    if (!email.trim() || !email.includes('@')) { setError('Ingresa un correo válido'); return false }
    setError('')
    return true
  }

  // ── Registro final ─────────────────────────────
  async function handleRegistro() {
    setLoading(true)
    setError('')

    const nombreCompleto = `${nombre.trim()} ${apellido.trim()}`
    const password = `${apellido.trim().toLowerCase().replace(/\s+/g, '')}2026`

    // 1. Crear usuario en Supabase Auth con metadatos
    // El trigger handle_new_user() leerá estos datos y creará el perfil correcto
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          nombre:   nombreCompleto,
          apellido: apellido.trim(),
          rol:      'padres',
        }
      }
    })

    if (authError) {
      setError(
        authError.message.includes('already registered')
          ? 'Ya existe una cuenta con ese correo.'
          : 'Error al crear la cuenta: ' + authError.message
      )
      setLoading(false)
      return
    }

    const userId = authData.user?.id
    if (!userId) { setError('Error inesperado. Intenta de nuevo.'); setLoading(false); return }

    // 2. Vincular padre con estudiante via RPC
    const { error: rpcError } = await supabase.rpc('crear_perfil_padre', {
      p_user_id:    userId,
      p_nombre:     nombreCompleto,
      p_email:      email.trim().toLowerCase(),
      p_est_id:     hijoSeleccionado.id,
      p_parentesco: parentesco,
    })

    if (rpcError) {
      setError(
        rpcError.message.includes('ya tiene un padre')
          ? 'Este estudiante ya tiene un padre o tutor vinculado en el sistema.'
          : 'Error al completar el registro: ' + rpcError.message
      )
      setLoading(false)
      return
    }

    setLoading(false)
    setExito(true)
  }

  // ── Render ─────────────────────────────────────
  const passwordPreview = apellido
    ? `${apellido.trim().toLowerCase().replace(/\s+/g, '')}2026`
    : 'tuapellido2026'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }

        .rp-root {
          min-height: 100vh; width: 100vw;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          display: flex;
        }

        /* ── LEFT ──────────────────────────── */
        .rp-left {
          flex: 1; position: relative; overflow: hidden;
          background: linear-gradient(160deg, #0d0720 0%, #1a0d30 30%, #2d1554 65%, #4a1f8a 100%);
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
        }
        .rp-left::after {
          content: ''; position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0;
        }
        .rp-left-z { position: relative; z-index: 1; }

        .rp-brand { display: flex; align-items: center; gap: 12px; }
        .rp-logo-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05));
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(10px); overflow: hidden;
        }
        .rp-logo-wrap img { width: 100%; height: 100%; object-fit: cover; border-radius: 11px; }
        .rp-brand-name {
          font-size: 20px; font-weight: 800; color: #fff;
          letter-spacing: -0.5px; display: flex; align-items: center; gap: 5px;
        }

        .rp-hero { padding: 80px 0 60px; }
        .rp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #D4A017; margin-bottom: 28px;
        }
        .rp-eyebrow-line { width: 20px; height: 1.5px; background: #D4A017; }

        .rp-title {
          font-size: clamp(34px, 2.8vw, 52px); font-weight: 800;
          line-height: 1.05; letter-spacing: -2px; color: #fff; margin-bottom: 28px;
        }
        .rp-title-dim  { color: rgba(255,255,255,0.32); font-style: italic; font-weight: 300; }
        .rp-title-gold { color: #D4A017; }

        .rp-desc { font-size: 14px; color: rgba(255,255,255,0.38); line-height: 1.7; max-width: 360px; margin-bottom: 40px; }

        /* Info cards */
        .rp-info-cards { display: flex; flex-direction: column; gap: 12px; }
        .rp-info-card {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px 18px; border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
        }
        .rp-info-card-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: rgba(212,160,23,0.15); border: 1px solid rgba(212,160,23,0.25);
          display: flex; align-items: center; justify-content: center;
          color: #D4A017;
        }
        .rp-info-card-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.85); margin-bottom: 3px; }
        .rp-info-card-text  { font-size: 11px; color: rgba(255,255,255,0.38); line-height: 1.5; }

        .rp-left-footer { font-size: 11px; color: rgba(255,255,255,0.18); font-weight: 500; }

        /* ── RIGHT ─────────────────────────── */
        .rp-right {
          width: 520px; flex-shrink: 0;
          background: #fff;
          display: flex; flex-direction: column;
          justify-content: center;
          padding: 64px 56px;
          position: relative; overflow: hidden;
        }
        .rp-right::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg,#1a0d30,#5B2D8E,#D4A017,#5B2D8E,#1a0d30);
        }
        .rp-right::after {
          content: ''; position: absolute;
          width: 400px; height: 400px; border-radius: 50%;
          background: radial-gradient(circle,rgba(91,45,142,0.04) 0%,transparent 70%);
          bottom: -100px; right: -100px; pointer-events: none;
        }

        .rp-form-wrap {
          position: relative; z-index: 1;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.5s ease 0.1s, transform 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s;
        }
        .rp-form-wrap.mounted { opacity: 1; transform: translateY(0); }

        .rp-form-header { margin-bottom: 32px; }
        .rp-form-greeting {
          font-size: 11px; font-weight: 700; color: #5B2D8E;
          letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;
          display: flex; align-items: center; gap: 8px;
        }
        .rp-form-greeting::before {
          content: ''; width: 16px; height: 2px;
          background: linear-gradient(90deg,#5B2D8E,#D4A017); border-radius: 2px;
        }
        .rp-form-title { font-size: 28px; font-weight: 800; color: #0f1d40; letter-spacing: -1px; line-height: 1.1; margin-bottom: 6px; }
        .rp-form-sub   { font-size: 13px; color: #9ca3af; font-weight: 400; line-height: 1.5; }

        /* Fields */
        .rp-field { margin-bottom: 20px; }
        .rp-label {
          display: block; font-size: 11px; font-weight: 700;
          color: #6b7280; text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 8px; transition: color 0.2s;
        }
        .rp-field:focus-within .rp-label { color: #5B2D8E; }

        .rp-input-wrap {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 14px;
          background: #f8f7ff; border: 1.5px solid #e9e3ff;
          border-radius: 11px; transition: all 0.2s;
        }
        .rp-field:focus-within .rp-input-wrap {
          border-color: #5B2D8E; background: #fff;
          box-shadow: 0 0 0 4px rgba(91,45,142,0.08);
        }
        .rp-field-icon { color: #c4b5fd; flex-shrink: 0; transition: color 0.2s; display: flex; }
        .rp-field:focus-within .rp-field-icon { color: #5B2D8E; }

        .rp-input {
          flex: 1; border: none; outline: none;
          font-size: 14px; font-weight: 500;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #0f1d40; background: transparent;
          caret-color: #5B2D8E;
        }
        .rp-input::placeholder { color: #c4c4d4; font-weight: 400; }

        .rp-select {
          flex: 1; border: none; outline: none;
          font-size: 14px; font-weight: 500;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #0f1d40; background: transparent;
          cursor: pointer; appearance: none;
        }

        /* Row 2-col */
        .rp-row { display: flex; gap: 14px; }
        .rp-row .rp-field { flex: 1; }

        /* Search results */
        .rp-results {
          margin-top: 8px; border-radius: 12px;
          border: 1.5px solid #e9e3ff;
          background: #fff;
          box-shadow: 0 8px 24px rgba(91,45,142,0.1);
          overflow: hidden; max-height: 240px; overflow-y: auto;
        }
        .rp-result-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; cursor: pointer;
          transition: background 0.15s; border-bottom: 1px solid #f3eeff;
        }
        .rp-result-item:last-child { border-bottom: none; }
        .rp-result-item:hover { background: #f8f7ff; }
        .rp-result-item.selected { background: #f3eeff; }

        .rp-result-avatar {
          width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .rp-result-name  { font-size: 13px; font-weight: 700; color: #0f1d40; margin-bottom: 2px; }
        .rp-result-grado { font-size: 11px; color: #9ca3af; font-weight: 500; }

        .rp-no-results {
          padding: 20px; text-align: center;
          font-size: 13px; color: #9ca3af; font-weight: 500;
        }

        /* Selected hijo card */
        .rp-hijo-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px; border-radius: 14px;
          background: #f8f7ff; border: 2px solid #5B2D8E;
          margin-bottom: 6px;
        }
        .rp-hijo-avatar {
          width: 48px; height: 48px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800; color: #fff; flex-shrink: 0;
        }
        .rp-hijo-name  { font-size: 15px; font-weight: 800; color: #0f1d40; }
        .rp-hijo-grado { font-size: 12px; color: #5B2D8E; font-weight: 600; margin-top: 2px; }

        /* Resumen confirmación */
        .rp-resumen {
          background: #f8f7ff; border-radius: 14px;
          border: 1.5px solid #e9e3ff; padding: 20px; margin-bottom: 24px;
        }
        .rp-resumen-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 0; border-bottom: 1px solid #f3eeff;
          font-size: 13px;
        }
        .rp-resumen-row:last-child { border-bottom: none; }
        .rp-resumen-key   { color: #9ca3af; font-weight: 600; }
        .rp-resumen-val   { color: #0f1d40; font-weight: 700; text-align: right; }
        .rp-password-hint {
          margin-top: 12px; padding: 12px 14px; border-radius: 10px;
          background: rgba(212,160,23,0.08); border: 1px solid rgba(212,160,23,0.2);
          font-size: 12px; color: #92400e; font-weight: 600; line-height: 1.5;
        }

        /* Error */
        .rp-error {
          display: flex; align-items: center; gap: 8px;
          background: #fff1f2; border: 1.5px solid #fecdd3;
          border-radius: 10px; padding: 11px 14px; margin-bottom: 18px;
          font-size: 13px; color: #be123c; font-weight: 500;
        }

        /* Buttons */
        .rp-btn-primary {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg,#2d1554 0%,#5B2D8E 100%);
          color: #fff; border: none; border-radius: 11px;
          font-size: 14px; font-weight: 800;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer; letter-spacing: 0.3px;
          box-shadow: 0 4px 16px rgba(91,45,142,0.35);
          transition: all 0.2s; position: relative; overflow: hidden;
          margin-bottom: 12px;
        }
        .rp-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(91,45,142,0.45);
        }
        .rp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .rp-btn-shine {
          position: absolute; inset: 0;
          background: linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.1) 50%,transparent 70%);
          transform: translateX(-100%); animation: shine 2.5s infinite 1s;
        }
        @keyframes shine { 100% { transform: translateX(250%); } }

        .rp-btn-ghost {
          width: 100%; padding: 11px;
          background: transparent; border: 1.5px solid #e9e3ff;
          border-radius: 11px; font-size: 13px; font-weight: 700;
          color: #9ca3af; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .rp-btn-ghost:hover { border-color: #5B2D8E; color: #5B2D8E; background: #f8f7ff; }

        .rp-btn-back {
          background: none; border: none; padding: 0; margin-bottom: 28px;
          font-size: 12px; font-weight: 700; color: #c4b5fd;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          transition: color 0.2s;
        }
        .rp-btn-back:hover { color: #5B2D8E; }

        /* Loading dots */
        .rp-dots { display: inline-flex; gap: 4px; align-items: center; }
        .rp-dots span { width: 4px; height: 4px; border-radius: 50%; background: #fff; animation: blink 1.2s infinite; }
        .rp-dots span:nth-child(2) { animation-delay: 0.2s; }
        .rp-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }

        /* Éxito */
        .rp-exito {
          text-align: center; padding: 20px 0;
        }
        .rp-exito-icon {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg,#2d1554,#5B2D8E);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px; box-shadow: 0 8px 24px rgba(91,45,142,0.4);
        }
        .rp-exito-title { font-size: 24px; font-weight: 800; color: #0f1d40; letter-spacing: -0.8px; margin-bottom: 10px; }
        .rp-exito-sub   { font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 28px; }
        .rp-exito-cred  {
          background: #f8f7ff; border-radius: 14px; border: 1.5px solid #e9e3ff;
          padding: 20px; margin-bottom: 28px; text-align: left;
        }
        .rp-exito-cred-title { font-size: 11px; font-weight: 700; color: #5B2D8E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }

        /* Login link */
        .rp-login-link {
          text-align: center; margin-top: 24px; padding-top: 20px;
          border-top: 1px solid #f3eeff;
          font-size: 13px; color: #9ca3af;
        }
        .rp-login-link button {
          background: none; border: none; cursor: pointer;
          color: #5B2D8E; font-weight: 700; font-size: 13px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          text-decoration: underline; text-underline-offset: 2px;
        }

        /* Mobile */
        @media (max-width: 960px) {
          .rp-root { flex-direction: column; }
          .rp-left { padding: 36px 32px 48px; min-height: auto; }
          .rp-hero { padding: 40px 0 32px; }
          .rp-title { font-size: 32px; }
          .rp-info-cards { display: none; }
          .rp-right { width: 100%; padding: 48px 32px 56px; }
        }
        @media (max-width: 480px) {
          .rp-left  { padding: 28px 20px 36px; }
          .rp-right { padding: 40px 20px 48px; }
          .rp-row { flex-direction: column; gap: 0; }
        }
      `}</style>

      <div className="rp-root">

        {/* ── LEFT ─────────────────────────────── */}
        <div className="rp-left">
          <FloatingOrb style={{ width:480, height:480, background:'radial-gradient(circle,rgba(112,60,220,0.4) 0%,transparent 70%)', filter:'blur(70px)', top:-160, right:-80 }} />
          <FloatingOrb style={{ width:360, height:360, background:'radial-gradient(circle,rgba(234,88,12,0.28) 0%,transparent 70%)', filter:'blur(60px)', bottom:-80, right:40 }} />
          <FloatingOrb style={{ width:260, height:260, background:'radial-gradient(circle,rgba(212,160,23,0.2) 0%,transparent 70%)', filter:'blur(55px)', bottom:80, left:-20 }} />

          <div className="rp-left-z">
            <div className="rp-brand">
              <div className="rp-logo-wrap">
                <img src="/logo.png" alt="CBIS" onError={e => { e.target.style.display='none' }} />
              </div>
              <div className="rp-brand-name">
                CBIS
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <rect x="11" y="2" width="6" height="24" rx="3" fill="#D4A017"/>
                  <rect x="2" y="11" width="24" height="6" rx="3" fill="#D4A017"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="rp-hero rp-left-z">
            <div className="rp-eyebrow">
              <span className="rp-eyebrow-line" /> Portal de Padres 2026
            </div>
            <h1 className="rp-title">
              Mantente<br />
              <span className="rp-title-dim">conectado</span><br />
              con tu{' '}
              <span className="rp-title-gold">hijo/a.</span>
            </h1>
            <p className="rp-desc">
              Accede a notas, cobros y documentos
              en tiempo real desde cualquier dispositivo.
            </p>

            <div className="rp-info-cards">
              {[
                { title: 'Solo 3 pasos', text: 'Ingresa tus datos, busca a tu hijo/a y confirma el vínculo.' },
                { title: 'Contraseña automática', text: 'Tu contraseña inicial será tu apellido seguido de "2026".' },
                { title: 'Un encargado por alumno', text: 'El sistema permite un padre, madre o tutor principal por estudiante.' },
              ].map(c => (
                <div className="rp-info-card" key={c.title}>
                  <div className="rp-info-card-icon">
                    <IconSchool />
                  </div>
                  <div>
                    <div className="rp-info-card-title">{c.title}</div>
                    <div className="rp-info-card-text">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-left-z">
            <div className="rp-left-footer">© 2026 CBIS · Sonsonate, El Salvador</div>
          </div>
        </div>

        {/* ── RIGHT ────────────────────────────── */}
        <div className="rp-right">
          <div className={`rp-form-wrap ${mounted ? 'mounted' : ''}`}>

            {/* ── ÉXITO ──────────────────────── */}
            {exito ? (
              <div className="rp-exito">
                <div className="rp-exito-icon">
                  <IconCheck size={32} />
                </div>
                <div className="rp-exito-title">¡Cuenta creada!</div>
                <p className="rp-exito-sub">
                  Tu acceso al portal de padres está listo.<br />
                  Guarda estas credenciales para iniciar sesión.
                </p>
                <div className="rp-exito-cred">
                  <div className="rp-exito-cred-title">Tus credenciales</div>
                  {[
                    ['Correo', email.trim().toLowerCase()],
                    ['Contraseña', `${apellido.trim().toLowerCase().replace(/\s+/g,'')}2026`],
                    ['Vinculado a', `${hijoSeleccionado?.nombre} ${hijoSeleccionado?.apellido}`],
                  ].map(([k, v]) => (
                    <div className="rp-resumen-row" key={k}>
                      <span className="rp-resumen-key">{k}</span>
                      <span className="rp-resumen-val" style={{ fontFamily: k === 'Contraseña' ? 'monospace' : 'inherit' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button className="rp-btn-primary" onClick={() => navigate('/login')}>
                  <span className="rp-btn-shine" />
                  Iniciar sesión ahora
                </button>
              </div>
            ) : (
              <>
                <div className="rp-form-header">
                  {step > 1 && (
                    <button className="rp-btn-back" onClick={() => { setStep(s => s - 1); setError('') }}>
                      <IconArrowLeft /> Volver
                    </button>
                  )}
                  <div className="rp-form-greeting">
                    {step === 1 ? 'Bienvenido/a' : step === 2 ? 'Paso 2 de 3' : 'Último paso'}
                  </div>
                  <h2 className="rp-form-title">
                    {step === 1 ? 'Crear cuenta de padre' : step === 2 ? 'Busca a tu hijo/a' : 'Confirma el registro'}
                  </h2>
                  <p className="rp-form-sub">
                    {step === 1 ? 'Ingresa tus datos personales para comenzar' :
                     step === 2 ? 'Escribe el nombre o apellido de tu hijo/a' :
                     'Verifica que toda la información es correcta'}
                  </p>
                </div>

                <Steps current={step} />

                {error && (
                  <div className="rp-error">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* ── STEP 1 — Datos del padre ── */}
                {step === 1 && (
                  <>
                    <div className="rp-row">
                      <Field label="Nombre" icon={<IconUser />}>
                        <input className="rp-input" placeholder="María" value={nombre} onChange={e => setNombre(e.target.value)} />
                      </Field>
                      <Field label="Apellido" icon={<IconUser />}>
                        <input className="rp-input" placeholder="García" value={apellido} onChange={e => setApellido(e.target.value)} />
                      </Field>
                    </div>

                    <Field label="Correo personal" icon={<IconMail />}>
                      <input className="rp-input" type="email" placeholder="correo@gmail.com"
                        value={email} onChange={e => setEmail(e.target.value)} />
                    </Field>

                    <Field label="Parentesco" icon={<IconChevron />}>
                      <select className="rp-select" value={parentesco} onChange={e => setParentesco(e.target.value)}>
                        {PARENTESCOS.map(p => <option key={p}>{p}</option>)}
                      </select>
                    </Field>

                    {apellido && (
                      <div className="rp-password-hint">
                        <strong>Tu contraseña inicial:</strong> <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>{passwordPreview}</span>
                        <br />
                        <span style={{ fontWeight: 500 }}>Guárdala — podrás pedir cambio al administrador después.</span>
                      </div>
                    )}

                    <div style={{ marginTop: 24 }}>
                      <button className="rp-btn-primary" onClick={() => { if (validarStep1()) setStep(2) }}>
                        <span className="rp-btn-shine" />
                        Continuar
                      </button>
                      <button className="rp-btn-ghost" onClick={() => navigate('/login')}>
                        Ya tengo cuenta — iniciar sesión
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP 2 — Buscar hijo ─────── */}
                {step === 2 && (
                  <>
                    <Field label="Buscar estudiante" icon={<IconSearch />}>
                      <input className="rp-input"
                        placeholder="Escribe nombre o apellido…"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setHijoSeleccionado(null) }}
                        autoFocus
                      />
                    </Field>

                    {/* Resultados */}
                    {query.trim().length >= 2 && !hijoSeleccionado && (
                      <div className="rp-results">
                        {buscando ? (
                          <div className="rp-no-results">Buscando…</div>
                        ) : resultados.length === 0 ? (
                          <div className="rp-no-results">No se encontraron estudiantes</div>
                        ) : resultados.map(est => {
                          const nivel = est.grados?.nivel || 'primaria'
                          const color = nivelColor[nivel] || '#5B2D8E'
                          const initials = `${est.nombre?.[0] || ''}${est.apellido?.[0] || ''}`
                          return (
                            <div key={est.id} className="rp-result-item"
                              onClick={() => { setHijoSeleccionado(est); setQuery(`${est.nombre} ${est.apellido}`) }}>
                              <div className="rp-result-avatar" style={{ background: color }}>{initials}</div>
                              <div>
                                <div className="rp-result-name">{est.apellido}, {est.nombre}</div>
                                <div className="rp-result-grado">{est.grados?.nombre || '—'}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Hijo seleccionado */}
                    {hijoSeleccionado && (
                      <div className="rp-hijo-card">
                        <div className="rp-hijo-avatar"
                          style={{ background: nivelColor[hijoSeleccionado.grados?.nivel] || '#5B2D8E' }}>
                          {hijoSeleccionado.nombre?.[0]}{hijoSeleccionado.apellido?.[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="rp-hijo-name">{hijoSeleccionado.nombre} {hijoSeleccionado.apellido}</div>
                          <div className="rp-hijo-grado">{hijoSeleccionado.grados?.nombre || '—'}</div>
                        </div>
                        <div style={{ color: '#16a34a', display: 'flex' }}>
                          <IconCheck size={20} />
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 24 }}>
                      <button className="rp-btn-primary"
                        disabled={!hijoSeleccionado}
                        onClick={() => { setError(''); setStep(3) }}>
                        <span className="rp-btn-shine" />
                        Continuar
                      </button>
                    </div>
                  </>
                )}

                {/* ── STEP 3 — Confirmar ───────── */}
                {step === 3 && (
                  <>
                    <div className="rp-resumen">
                      {[
                        ['Nombre completo', `${nombre} ${apellido}`],
                        ['Correo',          email.trim().toLowerCase()],
                        ['Parentesco',      parentesco],
                        ['Estudiante',      `${hijoSeleccionado?.nombre} ${hijoSeleccionado?.apellido}`],
                        ['Grado',           hijoSeleccionado?.grados?.nombre || '—'],
                      ].map(([k, v]) => (
                        <div className="rp-resumen-row" key={k}>
                          <span className="rp-resumen-key">{k}</span>
                          <span className="rp-resumen-val">{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className="rp-password-hint">
                      Tu contraseña inicial será{' '}
                      <span style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                        {passwordPreview}
                      </span>
                      . Anótala antes de continuar.
                    </div>

                    <div style={{ marginTop: 20 }}>
                      <button className="rp-btn-primary" disabled={loading} onClick={handleRegistro}>
                        <span className="rp-btn-shine" />
                        {loading ? <span className="rp-dots"><span/><span/><span/></span> : 'Confirmar y crear cuenta'}
                      </button>
                    </div>
                  </>
                )}

                <div className="rp-login-link">
                  ¿Ya tienes cuenta?{' '}
                  <button onClick={() => navigate('/login')}>Iniciar sesión</button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
