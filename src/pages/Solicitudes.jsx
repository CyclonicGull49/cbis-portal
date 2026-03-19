import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

const ESTADO_INFO = {
  pendiente: { label: 'Pendiente',  bg: '#fef9c3', color: '#92400e' },
  aprobado:  { label: 'Aprobado',   bg: '#dcfce7', color: '#16a34a' },
  rechazado: { label: 'Rechazado',  bg: '#fee2e2', color: '#dc2626' },
  cerrado:   { label: 'Cerrado',    bg: '#f3f4f6', color: '#6b7280' },
}

const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcoUnlock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
)

function formatFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatHoras(ts) {
  if (!ts) return null
  const diff = new Date(ts) - new Date()
  if (diff <= 0) return 'Expirado'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m restantes`
}

export default function Solicitudes() {
  const { perfil } = useAuth()
  const { yearEscolar } = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()

  const isDocente   = perfil?.rol === 'docente'
  const isDireccion = perfil?.rol === 'direccion_academica'
  const isRegistro  = ['admin', 'registro_academico'].includes(perfil?.rol)
  const canManage   = isDireccion || isRegistro

  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading]         = useState(true)
  const [procesando, setProcesando]   = useState(null)
  const [modalRechazar, setModalRechazar] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  useEffect(() => { cargar() }, [perfil, year])

  async function cargar() {
    setLoading(true)
    let query = supabase.from('solicitudes_desbloqueo')
      .select(`*, 
        perfiles!solicitudes_desbloqueo_docente_id_fkey(nombre, apellido, email),
        materias(nombre),
        grados(nombre, nivel)
      `)
      .eq('año_escolar', year)
      .order('creado_en', { ascending: false })

    if (isDocente) query = query.eq('docente_id', perfil.id)

    const { data } = await query
    setSolicitudes(data || [])
    setLoading(false)
  }

  async function aprobar(s) {
    setProcesando(s.id)
    const { error } = await supabase.from('solicitudes_desbloqueo')
      .update({ estado: 'aprobado', aprobado_por: perfil.id, aprobado_en: new Date().toISOString() })
      .eq('id', s.id)
    if (error) toast.error('Error al aprobar')
    else { toast.success('Solicitud aprobada — Registro Académico puede abrir la materia'); cargar() }
    setProcesando(null)
  }

  async function rechazar(s) {
    if (!motivoRechazo.trim()) { toast.error('Ingresa el motivo del rechazo'); return }
    setProcesando(s.id)
    const { error } = await supabase.from('solicitudes_desbloqueo')
      .update({ estado: 'rechazado', aprobado_por: perfil.id, aprobado_en: new Date().toISOString() })
      .eq('id', s.id)
    if (error) toast.error('Error al rechazar')
    else { toast.success('Solicitud rechazada'); setModalRechazar(null); setMotivoRechazo(''); cargar() }
    setProcesando(null)
  }

  async function abrirMateria(s) {
    setProcesando(s.id)
    const cierre = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase.from('solicitudes_desbloqueo')
      .update({ abierto_por: perfil.id, abierto_en: new Date().toISOString(), cierre_en: cierre })
      .eq('id', s.id)
    if (error) toast.error('Error al abrir')
    else { toast.success('Materia abierta por 12 horas'); cargar() }
    setProcesando(null)
  }

  async function cerrarMateria(s) {
    setProcesando(s.id)
    const { error } = await supabase.from('solicitudes_desbloqueo')
      .update({ estado: 'cerrado', cierre_en: new Date().toISOString() })
      .eq('id', s.id)
    if (error) toast.error('Error al cerrar')
    else { toast.success('Materia cerrada'); cargar() }
    setProcesando(null)
  }

  // Agrupar por estado para mejor visualización
  const pendientes  = solicitudes.filter(s => s.estado === 'pendiente')
  const aprobadas   = solicitudes.filter(s => s.estado === 'aprobado')
  const historial   = solicitudes.filter(s => ['rechazado','cerrado'].includes(s.estado))

  function TarjetaSolicitud({ s }) {
    const periodo = s.grados?.nivel === 'bachillerato' ? `Bimestre ${s.periodo}` : `Trimestre ${s.periodo}`
    const abierta = s.abierto_en && s.cierre_en && new Date() < new Date(s.cierre_en) && s.estado === 'aprobado'
    const tiempoRestante = abierta ? formatHoras(s.cierre_en) : null

    return (
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f0ecf8', padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            {/* Encabezado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: '#3d1f61', fontSize: 14 }}>
                {s.materias?.nombre}
              </span>
              <span style={{ fontSize: 12, color: '#b0a8c0' }}>·</span>
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{s.grados?.nombre}</span>
              <span style={{ fontSize: 12, color: '#b0a8c0' }}>·</span>
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{periodo}</span>
            </div>

            {/* Docente (solo visible para dirección/registro) */}
            {canManage && (
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>Docente:</span> {s.perfiles?.nombre} {s.perfiles?.apellido}
              </div>
            )}

            {/* Motivo */}
            <div style={{ fontSize: 13, color: '#374151', background: '#f9fafb', borderRadius: 8, padding: '8px 12px', marginBottom: 8, borderLeft: '3px solid #e5e7eb' }}>
              {s.motivo}
            </div>

            {/* Info adicional */}
            <div style={{ fontSize: 11, color: '#b0a8c0', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>Solicitado: {formatFecha(s.creado_en)}</span>
              {s.aprobado_en && <span>{s.estado === 'rechazado' ? 'Rechazado' : 'Aprobado'}: {formatFecha(s.aprobado_en)}</span>}
              {s.abierto_en && <span>Abierto: {formatFecha(s.abierto_en)}</span>}
            </div>

            {/* Tiempo restante si está abierta */}
            {tiempoRestante && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: '#dcfce7', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {tiempoRestante}
              </div>
            )}
          </div>

          {/* Badge estado + acciones */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ESTADO_INFO[s.estado]?.bg, color: ESTADO_INFO[s.estado]?.color }}>
              {ESTADO_INFO[s.estado]?.label}
            </span>

            {/* Acciones para Dirección — aprobar/rechazar pendientes */}
            {isDireccion && s.estado === 'pendiente' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => aprobar(s)} disabled={procesando === s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IcoCheck /> Aprobar
                </button>
                <button onClick={() => { setModalRechazar(s); setMotivoRechazo('') }} disabled={procesando === s.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <IcoX /> Rechazar
                </button>
              </div>
            )}

            {/* Acciones para Registro — abrir materia aprobada */}
            {isRegistro && s.estado === 'aprobado' && !s.abierto_en && (
              <button onClick={() => abrirMateria(s)} disabled={procesando === s.id}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                <IcoUnlock /> Abrir 12h
              </button>
            )}

            {/* Cerrar materia abierta */}
            {isRegistro && abierta && (
              <button onClick={() => cerrarMateria(s)} disabled={procesando === s.id}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f3f4f6', color: '#6b7280', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                <IcoX /> Cerrar ahora
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  function Seccion({ titulo, lista, badge, badgeColor }) {
    if (!lista.length) return null
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', margin: 0 }}>{titulo}</h2>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: badgeColor + '20', color: badgeColor }}>{badge}</span>
        </div>
        {lista.map(s => <TarjetaSolicitud key={s.id} s={s} />)}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>
          Solicitudes de Desbloqueo
        </h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          {isDocente ? 'Estado de tus solicitudes de modificación de notas' : 'Gestiona las solicitudes de los docentes'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#b0a8c0' }}>Cargando...</div>
      ) : solicitudes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d8c8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>Sin solicitudes</div>
        </div>
      ) : (
        <>
          <Seccion titulo="Pendientes de aprobación" lista={pendientes} badge={pendientes.length} badgeColor="#92400e" />
          <Seccion titulo="Aprobadas" lista={aprobadas} badge={aprobadas.length} badgeColor="#16a34a" />
          <Seccion titulo="Historial" lista={historial} badge={historial.length} badgeColor="#6b7280" />
        </>
      )}

      {/* Modal rechazar */}
      {modalRechazar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          onClick={() => setModalRechazar(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 440, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#dc2626', fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Rechazar solicitud</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
              {modalRechazar.materias?.nombre} · {modalRechazar.grados?.nombre}
            </p>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Motivo del rechazo *
            </label>
            <textarea
              value={motivoRechazo}
              onChange={e => setMotivoRechazo(e.target.value)}
              placeholder="Explica por qué se rechaza la solicitud..."
              rows={3}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalRechazar(null)}
                style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={() => rechazar(modalRechazar)} disabled={procesando === modalRechazar.id}
                style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                {procesando === modalRechazar.id ? 'Rechazando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}