import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import { NIVEL_COLOR as nivelColor } from '../constants/colores'
import toast from 'react-hot-toast'

const TIPOS_DOC = [
  { key: 'partida_nacimiento', label: 'Partida de nacimiento',    icon: 'doc' },
  { key: 'dui_encargado',      label: 'DUI del encargado',        icon: 'id'  },
  { key: 'foto_estudiante',    label: 'Foto del estudiante',      icon: 'img' },
  { key: 'constancia_medica',  label: 'Constancia médica',        icon: 'med' },
  { key: 'esquema_vacunacion', label: 'Esquema de vacunación',    icon: 'vac', soloInicial: true },
]

const TABS = [
  { id: 'perfil',  label: 'Mi Perfil',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> },
  { id: 'notas',   label: 'Mis Notas',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="13" y1="17" x2="8" y2="17"/></svg> },
  { id: 'cobros',  label: 'Mis Cobros',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { id: 'docs',    label: 'Documentos',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
  { id: 'config',  label: 'Seguridad',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
]

export default function PerfilAlumno({ seccion = 'perfil' }) {
  const { perfil } = useAuth()
  const [tab, setTab]               = useState(seccion)
  const [estudiante, setEstudiante] = useState(null)
  const [cobros, setCobros]         = useState([])
  const [docs, setDocs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [passNueva, setPassNueva]   = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState(false)

  // Sincronizar tab cuando cambia la prop seccion (navegación desde sidebar)
  useEffect(() => { setTab(seccion) }, [seccion])

  useEffect(() => {
    if (perfil?.estudiante_id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: est }, { data: cob }, { data: d }] = await Promise.all([
      supabase.from('estudiantes').select('*, grados(nombre, nivel, componentes_nota)').eq('id', perfil.estudiante_id).single(),
      supabase.from('cobros').select('*, conceptos_cobro(nombre)').eq('estudiante_id', perfil.estudiante_id).order('fecha_vencimiento', { ascending: true }),
      supabase.from('documentos_estudiante').select('*').eq('estudiante_id', perfil.estudiante_id),
    ])
    setEstudiante(est)
    setCobros(cob || [])
    setDocs(d || [])
    setLoading(false)
  }

  async function verDoc(doc) {
    const { data } = await supabase.storage.from('documentos-estudiantes').createSignedUrl(doc.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    else toast.error('No se pudo abrir el documento')
  }

  async function cambiarPassword() {
    if (!passNueva || !passConfirm) { toast.error('Completa todos los campos'); return }
    if (passNueva.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    if (passNueva !== passConfirm) { toast.error('Las contraseñas no coinciden'); return }
    setCambiandoPass(true)
    const { error } = await supabase.auth.updateUser({ password: passNueva })
    if (error) { toast.error('Error: ' + error.message); setCambiandoPass(false); return }
    toast.success('Contraseña actualizada correctamente')
    setPassNueva(''); setPassConfirm('')
    setCambiandoPass(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #f0ecf8', borderTopColor: '#5B2D8E', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <span style={{ fontSize: 13, color: '#b0a8c0', fontWeight: 500 }}>Cargando perfil...</span>
      </div>
    </div>
  )

  if (!estudiante) return (
    <div style={{ textAlign: 'center', padding: 48, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ color: '#b0a8c0', fontSize: 13 }}>No se encontró un estudiante vinculado a tu cuenta.</div>
    </div>
  )

  const esInicial   = ['primera_infancia', 'inicial'].includes(estudiante.grados?.nivel)
  const tiposDoc    = TIPOS_DOC.filter(t => !t.soloInicial || esInicial)
  const cobrosPend  = cobros.filter(c => c.estado === 'pendiente')
  const cobrosVenc  = cobrosPend.filter(c => c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date())
  const nivel       = nivelColor[estudiante.grados?.nivel] || nivelColor.primaria
  const iniciales   = `${estudiante.nombre?.charAt(0) || ''}${estudiante.apellido?.charAt(0) || ''}`
  const docsSubidos = docs.length

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', maxWidth: 760, margin: '0 auto' }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0d30 0%, #3d1f61 60%, #5B2D8E 100%)',
        borderRadius: 24, padding: '28px 24px 20px', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Fondo texturizado */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 20% 50%, #D4A017 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)',
        }} />
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(212,160,23,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* Avatar + nombre */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #D4A017, #b8860b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 24, letterSpacing: '-0.5px',
            boxShadow: '0 0 0 3px rgba(212,160,23,0.3), 0 8px 24px rgba(0,0,0,0.3)',
          }}>
            {iniciales}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
              Estudiante CBIS
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.2, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {estudiante.nombre} {estudiante.apellido}
            </div>
            <span style={{ ...nivel, padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {estudiante.grados?.nombre}
            </span>
          </div>
        </div>

        {/* KPI chips */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            {
              label: 'Cobros pendientes',
              value: cobrosPend.length,
              alert: cobrosVenc.length > 0,
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
            },
            {
              label: 'Documentos',
              value: `${docsSubidos}/${tiposDoc.length}`,
              alert: docsSubidos < tiposDoc.length,
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
            },
            {
              label: 'Año escolar',
              value: new Date().getFullYear(),
              alert: false,
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
            },
          ].map(kpi => (
            <div key={kpi.label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: kpi.alert ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${kpi.alert ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 10, padding: '7px 12px',
              color: kpi.alert ? '#fca5a5' : 'rgba(255,255,255,0.8)',
            }}>
              {kpi.icon}
              <span style={{ fontSize: 12, fontWeight: 700 }}>{kpi.value}</span>
              <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>{kpi.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20,
        overflowX: 'auto', paddingBottom: 2,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        <style>{`.tabs-scroll::-webkit-scrollbar { display: none }`}</style>
        {TABS.map(t => {
          const activo = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: activo ? 700 : 600,
              whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
              background: activo ? '#5B2D8E' : '#fff',
              color: activo ? '#fff' : '#6b7280',
              boxShadow: activo ? '0 4px 14px rgba(91,45,142,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              {t.icon}
              {t.label}
              {t.id === 'cobros' && cobrosVenc.length > 0 && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── MI PERFIL ─────────────────────────────────────────── */}
      {tab === 'perfil' && (
        <div>
          <SectionTitle>Información Personal</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Nombre completo',      val: `${estudiante.nombre} ${estudiante.apellido}` },
              { label: 'NIE',                  val: estudiante.nie },
              { label: 'Género',               val: estudiante.genero },
              { label: 'Fecha de nacimiento',  val: estudiante.fecha_nacimiento ? new Date(estudiante.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-SV') : null },
              { label: 'Correo institucional', val: estudiante.correo_institucional },
              { label: 'Dirección',            val: estudiante.direccion },
              { label: 'Municipio',            val: estudiante.municipio },
            ].map(({ label, val }) => (
              <InfoCard key={label} label={label} val={val} />
            ))}
          </div>

          <SectionTitle>Encargado</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { label: 'Nombre',   val: estudiante.nombre_tutor || estudiante.nombre_padre || estudiante.nombre_madre },
              { label: 'Teléfono', val: estudiante.telefono_tutor || estudiante.telefono_padre || estudiante.telefono_madre },
            ].map(({ label, val }) => (
              <InfoCard key={label} label={label} val={val} />
            ))}
          </div>
        </div>
      )}

      {/* ── MIS NOTAS ─────────────────────────────────────────── */}
      {tab === 'notas' && (
        <Boletin
          estudianteId={perfil?.estudiante_id}
          gradoId={perfil?.grado_id || estudiante?.grado_id}
          nivel={estudiante?.grados?.nivel}
          componentesNota={estudiante?.grados?.componentes_nota}
        />
      )}

      {/* ── MIS COBROS ────────────────────────────────────────── */}
      {tab === 'cobros' && (
        <div>
          {cobrosVenc.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fef2f2, #fff5f5)',
              border: '1.5px solid #fecaca', borderRadius: 14,
              padding: '14px 18px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                  {cobrosVenc.length} cobro{cobrosVenc.length !== 1 ? 's' : ''} vencido{cobrosVenc.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 500 }}>Contáctate con recepción para regularizar tu estado.</div>
              </div>
            </div>
          )}

          {cobros.length === 0 ? (
            <EmptyState icon="cobros" msg="Sin cobros registrados" sub="No hay cobros asignados a tu cuenta." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cobros.map(c => {
                const vencido = c.estado === 'pendiente' && c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date()
                const pagado  = c.estado === 'pagado'
                const badge   = pagado ? { bg: '#dcfce7', color: '#16a34a', label: 'Pagado' }
                              : vencido ? { bg: '#fee2e2', color: '#dc2626', label: 'Vencido' }
                              : { bg: '#fef9c3', color: '#a16207', label: 'Pendiente' }
                return (
                  <div key={c.id} style={{
                    background: '#fff', borderRadius: 16, padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16,
                    boxShadow: '0 2px 12px rgba(61,31,97,0.06)',
                    borderLeft: `4px solid ${pagado ? '#86efac' : vencido ? '#fca5a5' : '#fcd34d'}`,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a0d30', marginBottom: 4 }}>
                        {c.conceptos_cobro?.nombre || '—'}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {c.mes && <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{c.mes}</span>}
                        {c.fecha_vencimiento && (
                          <span style={{ fontSize: 12, color: vencido ? '#dc2626' : '#9ca3af', fontWeight: vencido ? 700 : 500 }}>
                            Vence: {new Date(c.fecha_vencimiento).toLocaleDateString('es-SV')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#1a0d30' }}>
                        ${parseFloat(c.monto).toFixed(2)}
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DOCUMENTOS ────────────────────────────────────────── */}
      {tab === 'docs' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {tiposDoc.map(({ key, label }) => {
              const doc = docs.find(d => d.tipo === key)
              return (
                <div key={key} style={{
                  background: '#fff', borderRadius: 16, padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 2px 12px rgba(61,31,97,0.06)',
                  border: doc ? '1.5px solid #c9b8e8' : '1.5px dashed #e5e7eb',
                  transition: 'box-shadow 0.15s',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: doc ? 'linear-gradient(135deg, #5B2D8E, #3d1f61)' : '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: doc ? '#fff' : '#d1d5db',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0d30', marginBottom: 3 }}>{label}</div>
                    {doc
                      ? <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Disponible
                        </div>
                      : <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>No subido aún</div>
                    }
                  </div>
                  {doc && (
                    <button onClick={() => verDoc(doc)} style={{
                      padding: '8px 14px', borderRadius: 10, border: 'none',
                      background: '#f3eeff', color: '#5B2D8E',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      fontFamily: 'inherit', flexShrink: 0,
                      transition: 'background 0.15s',
                    }}>Ver</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SEGURIDAD ─────────────────────────────────────────── */}
      {tab === 'config' && (
        <div style={{ maxWidth: 440 }}>
          <div style={{
            background: '#fff', borderRadius: 20, padding: 28,
            boxShadow: '0 2px 16px rgba(61,31,97,0.07)',
            borderTop: '4px solid #5B2D8E',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B2D8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1a0d30' }}>Cambiar contraseña</div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Si recibiste una contraseña temporal, cámbiala aquí.</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={s.label}>Nueva contraseña</label>
                <input type="password" style={s.input} value={passNueva} onChange={e => setPassNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label style={s.label}>Confirmar contraseña</label>
                <input type="password" style={s.input} value={passConfirm} onChange={e => setPassConfirm(e.target.value)} placeholder="Repite la nueva contraseña" />
              </div>
              {passNueva && passConfirm && passNueva !== passConfirm && (
                <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Las contraseñas no coinciden
                </div>
              )}
              <button onClick={cambiarPassword} disabled={cambiandoPass} style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: cambiandoPass ? '#c4bad4' : 'linear-gradient(135deg, #5B2D8E, #3d1f61)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: cambiandoPass ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', boxShadow: cambiandoPass ? 'none' : '0 4px 14px rgba(91,45,142,0.3)',
                transition: 'all 0.15s',
              }}>
                {cambiandoPass ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10, marginTop: 4 }}>
      {children}
    </div>
  )
}

function InfoCard({ label, val }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 6px rgba(61,31,97,0.06)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 14, color: val ? '#1a0d30' : '#d1d5db', fontWeight: val ? 600 : 400 }}>{val || '—'}</div>
    </div>
  )
}

function EmptyState({ msg, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(61,31,97,0.06)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9b8e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61', marginBottom: 6 }}>{msg}</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>{sub}</div>
    </div>
  )
}

// ── Boletín de notas rediseñado ────────────────────────────
const PESOS_NOTA  = { ac: 0.35, ai: 0.35, em: 0.10, ep: 0.10, ef: 0.20 }

function calcNFT(componentes, notasMap) {
  const vals = componentes.map(c => notasMap[c])
  if (vals.some(v => v === null || v === undefined)) return null
  return componentes.reduce((sum, c) => sum + parseFloat(notasMap[c]) * PESOS_NOTA[c], 0)
}

function colorNota(n) {
  if (n === null || n === undefined) return '#d1d5db'
  if (n < 5)  return '#ef4444'
  if (n < 7)  return '#f59e0b'
  return '#22c55e'
}
function bgNota(n) {
  if (n === null || n === undefined) return '#f9fafb'
  if (n < 5)  return '#fef2f2'
  if (n < 7)  return '#fffbeb'
  return '#f0fdf4'
}

function Boletin({ estudianteId, gradoId, nivel, componentesNota }) {
  const { yearEscolar } = useYearEscolar()
  const [materias, setMaterias] = useState([])
  const [notas, setNotas]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [periodoTab, setPeriodoTab] = useState(1)

  const componentes  = componentesNota?.split(',') || ['ac', 'ai', 'em', 'ef']
  const numPeriodos  = nivel === 'bachillerato' ? 4 : 3
  const periodoLabel = nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'

  useEffect(() => {
    const year = yearEscolar || new Date().getFullYear()
    if (!estudianteId || !gradoId) return
    async function cargar() {
      setLoading(true)
      const [{ data: mgs }, { data: ns }] = await Promise.all([
        supabase.from('materia_grado').select('materia_id').eq('grado_id', gradoId),
        supabase.from('notas').select('*').eq('estudiante_id', estudianteId).eq('grado_id', gradoId).eq('año_escolar', year),
      ])
      if (mgs?.length) {
        const ids = mgs.map(m => m.materia_id)
        const { data: ms } = await supabase.from('materias').select('id, nombre').in('id', ids).order('nombre')
        setMaterias(ms || [])
      }
      const mapa = {}
      for (const n of (ns || [])) mapa[`${n.materia_id}-${n.periodo}-${n.tipo}`] = n.nota
      setNotas(mapa)
      setLoading(false)
    }
    cargar()
  }, [estudianteId, gradoId, yearEscolar])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Cargando boletín...</div>

  if (!materias.length) return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(61,31,97,0.06)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9b8e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61', marginBottom: 6 }}>Aún no hay notas registradas</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>Las notas aparecerán aquí una vez que el docente las registre.</div>
    </div>
  )

  // Calcular NFT de cada materia por período y ACU
  const materiasConNotas = materias.map(m => {
    const nftsPeriodo = Array.from({ length: numPeriodos }, (_, i) => {
      const map = {}
      for (const c of componentes) map[c] = notas[`${m.id}-${i + 1}-${c}`] ?? null
      return calcNFT(componentes, map)
    })
    const validos = nftsPeriodo.filter(v => v !== null)
    const acu = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null
    return { ...m, nftsPeriodo, acu }
  })

  const notasPeriodo = materiasConNotas.map(m => m.nftsPeriodo[periodoTab - 1]).filter(v => v !== null)
  const promedioPeriodo = notasPeriodo.length ? notasPeriodo.reduce((a, b) => a + b, 0) / notasPeriodo.length : null

  return (
    <div>
      {/* Tabs período */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        {Array.from({ length: numPeriodos }, (_, i) => {
          const p = i + 1
          const activo = periodoTab === p
          return (
            <button key={p} onClick={() => setPeriodoTab(p)} style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: activo ? 700 : 600,
              background: activo ? '#1a0d30' : '#fff',
              color: activo ? '#fff' : '#9ca3af',
              boxShadow: activo ? '0 4px 12px rgba(26,13,48,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
              flexShrink: 0, transition: 'all 0.15s',
            }}>
              {periodoLabel} {p}
            </button>
          )
        })}
        <button onClick={() => setPeriodoTab(0)} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: periodoTab === 0 ? 700 : 600,
          background: periodoTab === 0 ? '#D4A017' : '#fff',
          color: periodoTab === 0 ? '#fff' : '#9ca3af',
          boxShadow: periodoTab === 0 ? '0 4px 12px rgba(212,160,23,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
          flexShrink: 0, marginLeft: 'auto', transition: 'all 0.15s',
        }}>
          Acumulado
        </button>
      </div>

      {/* Promedio del período */}
      {periodoTab > 0 && promedioPeriodo !== null && (
        <div style={{
          background: 'linear-gradient(135deg, #1a0d30, #3d1f61)',
          borderRadius: 16, padding: '16px 20px', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 2 }}>
              Promedio {periodoLabel} {periodoTab}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: colorNota(promedioPeriodo), letterSpacing: '-0.5px' }}>
              {promedioPeriodo.toFixed(2)}
            </div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `conic-gradient(${colorNota(promedioPeriodo)} ${(promedioPeriodo / 10) * 360}deg, rgba(255,255,255,0.1) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2d1554', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: colorNota(promedioPeriodo) }}>{Math.round((promedioPeriodo / 10) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de materias con barra de progreso */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {materiasConNotas.map(m => {
          const nota = periodoTab === 0 ? m.acu : m.nftsPeriodo[periodoTab - 1]
          const pct  = nota !== null ? Math.min((nota / 10) * 100, 100) : 0
          return (
            <div key={m.id} style={{
              background: '#fff', borderRadius: 14, padding: '14px 18px',
              boxShadow: '0 1px 6px rgba(61,31,97,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0d30', flex: 1, paddingRight: 12 }}>{m.nombre}</div>
                <span style={{
                  fontSize: 16, fontWeight: 900, color: colorNota(nota),
                  background: bgNota(nota), padding: '3px 12px', borderRadius: 8,
                  minWidth: 52, textAlign: 'center', flexShrink: 0,
                }}>
                  {nota !== null ? nota.toFixed(2) : '—'}
                </span>
              </div>
              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: nota !== null ? `${pct}%` : '0%',
                  background: nota === null ? '#e5e7eb' : nota < 5 ? '#ef4444' : nota < 7 ? '#f59e0b' : '#22c55e',
                  transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#1a0d30', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', outline: 'none', fontSize: 16 },
}
