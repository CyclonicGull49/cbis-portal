import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNotificaciones } from '../hooks/useNotificaciones'

// ── Iconos ────────────────────────────────────
const IcoBell = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcoClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoSend = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

// ── Config tipos y destinatarios ──────────────
const TIPO_CONFIG = {
  recordatorio_notas: { color: '#5B2D8E', bg: '#f3eeff', label: 'Notas' },
  ausencias:          { color: '#d97706', bg: '#fffbeb', label: 'Asistencia' },
  boleta_publicada:   { color: '#16a34a', bg: '#f0fdf4', label: 'Boleta' },
  solicitud:          { color: '#2563eb', bg: '#eff6ff', label: 'Solicitud' },
  retiro:             { color: '#dc2626', bg: '#fef2f2', label: 'Retiro' },
  pago:               { color: '#d97706', bg: '#fffbeb', label: 'Pago' },
  examen:             { color: '#7c3aed', bg: '#f5f3ff', label: 'Examen' },
  horario_devuelto:   { color: '#dc2626', bg: '#fef2f2', label: 'Horario' },
  horas_sociales:     { color: '#0891b2', bg: '#ecfeff', label: 'Horas Soc.' },
  academico:          { color: '#5B2D8E', bg: '#f3eeff', label: 'Académico' },
  administrativo:     { color: '#374151', bg: '#f3f4f6', label: 'Administrativo' },
  recordatorio:       { color: '#d97706', bg: '#fffbeb', label: 'Recordatorio' },
  urgente:            { color: '#dc2626', bg: '#fef2f2', label: 'Urgente' },
  general:            { color: '#374151', bg: '#f9fafb', label: 'General' },
}

const TIPOS_ENVIO = [
  { value: 'general',        label: 'General' },
  { value: 'academico',      label: 'Académico' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'recordatorio',   label: 'Recordatorio' },
  { value: 'urgente',        label: 'Urgente' },
  { value: 'pago',           label: 'Pago' },
  { value: 'examen',         label: 'Examen' },
]

// Destinatarios según rol
function useDestinatarios(perfil) {
  const [grados, setGrados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!perfil) return
    const rol = perfil.rol

    if (rol === 'docente') {
      // Grados donde tiene asignaciones
      supabase.from('asignaciones').select('grado_id, grados(id, nombre)')
        .eq('docente_id', perfil.id).eq('año_escolar', new Date().getFullYear())
        .then(({ data }) => {
          const vistos = new Set(); const lista = []
          for (const a of (data || [])) {
            if (!vistos.has(a.grado_id)) { vistos.add(a.grado_id); lista.push(a.grados) }
          }
          setGrados(lista); setLoading(false)
        })
    } else {
      supabase.from('grados').select('id, nombre').order('orden')
        .then(({ data }) => { setGrados(data || []); setLoading(false) })
    }
  }, [perfil?.id])

  const rol = perfil?.rol
  const opciones = []

  if (['admin'].includes(rol)) {
    opciones.push({ value: 'todos',   label: 'Todo el colegio' })
    opciones.push({ value: 'staff',   label: 'Todo el staff' })
    opciones.push({ value: 'alumnos', label: 'Todos los alumnos' })
    opciones.push({ value: 'padres',  label: 'Todos los padres' })
  }
  if (['admin', 'direccion_academica', 'registro_academico'].includes(rol)) {
    opciones.push({ value: 'docentes', label: 'Todos los docentes' })
  }
  if (['admin', 'talento_humano'].includes(rol)) {
    opciones.push({ value: 'staff', label: 'Todo el staff' })
  }
  if (['admin', 'direccion_academica', 'registro_academico', 'docente'].includes(rol)) {
    for (const g of grados) {
      opciones.push({ value: `grado_alumnos_${g.id}`, label: `Alumnos — ${g.nombre}` })
    }
    if (['admin', 'direccion_academica', 'docente'].includes(rol)) {
      for (const g of grados) {
        opciones.push({ value: `grado_padres_${g.id}`, label: `Padres — ${g.nombre}` })
      }
    }
  }

  return { opciones: [...new Map(opciones.map(o => [o.value, o])).values()], loading }
}

function tiempoRelativo(fecha) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min  = Math.floor(diff / 60000)
  const hrs  = Math.floor(min / 60)
  const dias = Math.floor(hrs / 24)
  if (min < 1)  return 'ahora'
  if (min < 60) return `hace ${min}m`
  if (hrs < 24) return `hace ${hrs}h`
  if (dias < 7) return `hace ${dias}d`
  return new Date(fecha).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' })
}

// ── Formulario de creación ────────────────────
function FormCrear({ perfil, onCerrar, onEnviado }) {
  const { opciones, loading } = useDestinatarios(perfil)
  const [para,     setPara]     = useState('')
  const [tipo,     setTipo]     = useState('general')
  const [titulo,   setTitulo]   = useState('')
  const [mensaje,  setMensaje]  = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    if (!para || !titulo.trim() || !mensaje.trim()) return
    setEnviando(true)

    // Resolver destinatarios → array de usuario_ids
    let ids = []
    try {
      if (para === 'todos') {
        const { data } = await supabase.from('perfiles').select('id').eq('activo', true)
        ids = (data || []).map(p => p.id)
      } else if (para === 'staff') {
        const { data } = await supabase.from('perfiles').select('id')
          .in('rol', ['admin','direccion_academica','registro_academico','recepcion','docente','talento_humano'])
        ids = (data || []).map(p => p.id)
      } else if (para === 'alumnos') {
        const { data } = await supabase.from('perfiles').select('id').eq('rol', 'alumno')
        ids = (data || []).map(p => p.id)
      } else if (para === 'docentes') {
        const { data } = await supabase.from('perfiles').select('id').eq('rol', 'docente')
        ids = (data || []).map(p => p.id)
      } else if (para === 'padres') {
        const { data } = await supabase.from('perfiles').select('id').eq('rol', 'padres')
        ids = (data || []).map(p => p.id)
      } else if (para.startsWith('grado_alumnos_')) {
        const gradoId = parseInt(para.replace('grado_alumnos_', ''))
        const { data: ests } = await supabase.from('estudiantes').select('id').eq('grado_id', gradoId).eq('estado', 'activo')
        const estIds = (ests || []).map(e => e.id)
        if (estIds.length) {
          const { data } = await supabase.from('perfiles').select('id').eq('rol', 'alumno').in('estudiante_id', estIds)
          ids = (data || []).map(p => p.id)
        }
      } else if (para.startsWith('grado_padres_')) {
        const gradoId = parseInt(para.replace('grado_padres_', ''))
        const { data: ests } = await supabase.from('estudiantes').select('id').eq('grado_id', gradoId).eq('estado', 'activo')
        const estIds = (ests || []).map(e => e.id)
        if (estIds.length) {
          const { data } = await supabase.from('perfiles').select('id').eq('rol', 'padres').in('estudiante_id', estIds)
          ids = (data || []).map(p => p.id)
        }
      }

      if (!ids.length) { setEnviando(false); return }

      // Insertar en lotes de 50
      const notif = { tipo, titulo: titulo.trim(), mensaje: mensaje.trim() }
      for (let i = 0; i < ids.length; i += 50) {
        const lote = ids.slice(i, i + 50).map(id => ({ ...notif, usuario_id: id }))
        await supabase.from('notificaciones').insert(lote)
      }

      onEnviado(ids.length)
    } catch (e) {
      console.error(e)
    }
    setEnviando(false)
  }

  return (
    <div style={{ borderBottom: '1px solid #f0ecff', background: '#fdfcff', padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#1a0d30' }}>Nueva notificación</span>
        <button onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0a8c0', padding: 2 }}><IcoClose /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Para */}
        <select value={para} onChange={e => setPara(e.target.value)} style={sForm.select} disabled={loading}>
          <option value="">Para quién...</option>
          {opciones.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Tipo */}
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={sForm.select}>
          {TIPOS_ENVIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Título */}
        <div style={{ position: 'relative' }}>
          <input
            value={titulo} onChange={e => setTitulo(e.target.value.slice(0, 50))}
            placeholder="Título (máx. 50 caracteres)"
            style={sForm.input}
          />
          <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, color: titulo.length > 40 ? '#dc2626' : '#b0a8c0' }}>
            {titulo.length}/50
          </span>
        </div>

        {/* Mensaje */}
        <div style={{ position: 'relative' }}>
          <textarea
            value={mensaje} onChange={e => setMensaje(e.target.value.slice(0, 120))}
            placeholder="Mensaje (máx. 120 caracteres)"
            rows={3}
            style={{ ...sForm.input, resize: 'none', paddingBottom: 20, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}
          />
          <span style={{ position: 'absolute', right: 8, bottom: 8, fontSize: 9, color: mensaje.length > 100 ? '#dc2626' : '#b0a8c0' }}>
            {mensaje.length}/120
          </span>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCerrar}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
          <button onClick={enviar} disabled={enviando || !para || !titulo.trim() || !mensaje.trim()}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: (!para || !titulo.trim() || !mensaje.trim()) ? '#e5e7eb' : 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: (!para || !titulo.trim() || !mensaje.trim()) ? '#9ca3af' : '#fff', fontSize: 12, fontWeight: 700, cursor: (!para || !titulo.trim() || !mensaje.trim()) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IcoSend /> {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────
export default function Campanita({ onNavegar }) {
  const { perfil } = useAuth()
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificaciones()
  const [abierto,   setAbierto]   = useState(false)
  const [creando,   setCreando]   = useState(false)
  const [enviado,   setEnviado]   = useState(null) // número de destinatarios
  const ref = useRef(null)

  const puedeCrear = ['admin','direccion_academica','registro_academico','docente','talento_humano'].includes(perfil?.rol)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) { setAbierto(false); setCreando(false) } }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleEnviado(count) {
    setCreando(false)
    setEnviado(count)
    setTimeout(() => setEnviado(null), 3000)
  }

  async function handleClick(n) {
    if (!n.leida) await marcarLeida(n.id)
    if (n.link && onNavegar) onNavegar(n.link)
    setAbierto(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Botón campanita */}
      <button onClick={() => { setAbierto(v => !v); setCreando(false) }}
        style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', border: 'none', background: abierto ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', flexShrink: 0 }}>
        <IcoBell size={18} />
        {noLeidas > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid #1a0d30', lineHeight: 1 }}>
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel */}
      {abierto && (
        <div style={{ position: 'fixed', top: 80, right: 24, width: 340, background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', zIndex: 9999, overflow: 'hidden', border: '1px solid #f0f0f0' }}>

          {/* Header panel */}
          <div style={{ padding: '14px 18px', borderBottom: creando ? 'none' : '1px solid #f3eeff', background: '#fdfcff' }}>
            {/* Fila 1: título + badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (noLeidas > 0 || puedeCrear) && !creando ? 10 : 0 }}>
            </div>
            {/* Fila 2: acciones — solo si no está creando */}
            {!creando && (noLeidas > 0 || puedeCrear) && (
              <div style={{ display: 'flex', gap: 8 }}>
                {puedeCrear && (
                  <button onClick={() => setCreando(true)}
                    style={{ flex: 1, fontSize: 12, color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'inherit', padding: '7px 0', borderRadius: 8 }}>
                    <IcoPlus /> Nueva notificación
                  </button>
                )}
                {noLeidas > 0 && (
                  <button onClick={marcarTodasLeidas}
                    style={{ flex: puedeCrear ? '0 0 auto' : 1, fontSize: 11, color: '#5B2D8E', fontWeight: 700, background: '#f3eeff', border: '1.5px solid #e9d8ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'inherit', padding: '7px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}>
                    <IcoCheck /> Marcar leídas
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Formulario crear */}
          {creando && (
            <FormCrear perfil={perfil} onCerrar={() => setCreando(false)} onEnviado={handleEnviado} />
          )}

          {/* Banner de éxito */}
          {enviado !== null && (
            <div style={{ padding: '10px 18px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', fontSize: 12, color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcoCheck /> Notificación enviada a {enviado} usuario{enviado !== 1 ? 's' : ''}
            </div>
          )}

          {/* Lista notificaciones */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notificaciones.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#b0a8c0', fontSize: 13 }}>
                <div style={{ marginBottom: 8, opacity: 0.5 }}><IcoBell size={28} /></div>
                Sin notificaciones
              </div>
            ) : (
              notificaciones.map(n => {
                const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.general
                return (
                  <div key={n.id} onClick={() => handleClick(n)}
                    style={{ padding: '12px 18px', borderBottom: '1px solid #f9f9f9', cursor: n.link ? 'pointer' : 'default', background: n.leida ? '#fff' : '#fdfcff', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background 0.1s' }}>
                    <div style={{ flexShrink: 0, marginTop: 3 }}>
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 8, background: cfg.bg, color: cfg.color, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: n.leida ? 500 : 700, color: '#1a0d30', marginBottom: 2, lineHeight: 1.4 }}>{n.titulo}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4, marginBottom: 4 }}>{n.mensaje}</div>
                      <div style={{ fontSize: 10, color: '#b0a8c0', fontWeight: 600 }}>{tiempoRelativo(n.creado_en)}</div>
                    </div>
                    {!n.leida && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5B2D8E', flexShrink: 0, marginTop: 5 }} />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const sForm = {
  select: { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, color: '#374151', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', background: '#fff', outline: 'none', cursor: 'pointer' },
  input:  { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 12, color: '#374151', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', background: '#fff', outline: 'none', boxSizing: 'border-box' },
}