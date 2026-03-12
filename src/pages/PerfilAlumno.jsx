import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

// ── Icons ─────────────────────────────────────────────────────
const IcoUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IcoDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IcoCobro = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IcoAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const TIPOS_DOC = [
  { key: 'partida_nacimiento', label: 'Partida de nacimiento' },
  { key: 'dui_encargado',      label: 'DUI del encargado' },
  { key: 'foto_estudiante',    label: 'Foto del estudiante' },
  { key: 'constancia_medica',  label: 'Constancia médica' },
  { key: 'esquema_vacunacion', label: 'Esquema de vacunación', soloInicial: true },
]

const nivelColor = {
  primera_infancia: { bg: '#e0f7f6', color: '#0e9490' },
  inicial:          { bg: '#e0f7f6', color: '#0e9490' },
  primaria:         { bg: '#fef9c3', color: '#a16207' },
  secundaria:       { bg: '#fff0e6', color: '#c2410c' },
  bachillerato:     { bg: '#f3eeff', color: '#5B2D8E' },
}

export default function PerfilAlumno({ defaultTab = 'perfil' }) {
  const { perfil } = useAuth()
  const [tab, setTab]             = useState(defaultTab)
  const [estudiante, setEstudiante] = useState(null)
  const [cobros, setCobros]       = useState([])
  const [docs, setDocs]           = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (perfil?.estudiante_id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: est }, { data: cob }, { data: docs }] = await Promise.all([
      supabase.from('estudiantes')
        .select('*, grados(nombre, nivel)')
        .eq('id', perfil.estudiante_id)
        .single(),
      supabase.from('cobros')
        .select('*, conceptos_cobro(nombre)')
        .eq('estudiante_id', perfil.estudiante_id)
        .order('fecha_vencimiento', { ascending: true }),
      supabase.from('documentos_estudiante')
        .select('*')
        .eq('estudiante_id', perfil.estudiante_id),
    ])
    setEstudiante(est)
    setCobros(cob || [])
    setDocs(docs || [])
    setLoading(false)
  }

  async function verDoc(doc) {
    const { data } = await supabase.storage
      .from('documentos-estudiantes')
      .createSignedUrl(doc.storage_path, 60 * 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ color: '#b0a8c0', fontSize: 13 }}>Cargando tu perfil...</div>
    </div>
  )

  if (!estudiante) return (
    <div style={{ textAlign: 'center', padding: 48, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ color: '#b0a8c0', fontSize: 13 }}>No se encontró un estudiante vinculado a tu cuenta.</div>
    </div>
  )

  const esInicial    = ['primera_infancia', 'inicial'].includes(estudiante.grados?.nivel)
  const tiposDoc     = TIPOS_DOC.filter(t => !t.soloInicial || esInicial)
  const cobrosPend   = cobros.filter(c => c.estado === 'pendiente')
  const cobrosVenc   = cobrosPend.filter(c => c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date())
  const totalPend    = cobrosPend.reduce((a, c) => a + parseFloat(c.monto), 0)
  const docsSubidos  = tiposDoc.filter(t => docs.find(d => d.tipo === t.key)).length
  const nivel        = nivelColor[estudiante.grados?.nivel] || nivelColor.primaria

  const tabs = [
    { id: 'perfil',    label: 'Mi Perfil' },
    { id: 'cobros',    label: `Mis Cobros ${cobrosPend.length > 0 ? `(${cobrosPend.length})` : ''}` },
    { id: 'docs',      label: `Documentos (${docsSubidos}/${tiposDoc.length})` },
  ]

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header del alumno */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0d30, #3d1f61)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid decorativo */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', borderRadius: 20 }} />

        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #D4A017, #b8860b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 900, fontSize: 26,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1,
        }}>
          {estudiante.nombre?.charAt(0)}{estudiante.apellido?.charAt(0)}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 4 }}>
            {estudiante.nombre} {estudiante.apellido}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ ...nivel, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {estudiante.grados?.nombre}
            </span>
            {estudiante.nie && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                NIE: {estudiante.nie}
              </span>
            )}
          </div>
        </div>

        {/* KPIs rápidos */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
          {cobrosVenc.length > 0 && (
            <div style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fca5a5' }}>{cobrosVenc.length}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vencido{cobrosVenc.length !== 1 ? 's' : ''}</div>
            </div>
          )}
          {cobrosPend.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>${totalPend.toFixed(0)}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pendiente</div>
            </div>
          )}
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{docsSubidos}/{tiposDoc.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Documentos</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #f3eeff', marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t.id ? 800 : 500,
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            color: tab === t.id ? '#5B2D8E' : '#aaa',
            borderBottom: tab === t.id ? '2px solid #5B2D8E' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Mi Perfil ─────────────────────────────────────── */}
      {tab === 'perfil' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Nombre completo',   val: `${estudiante.nombre} ${estudiante.apellido}` },
            { label: 'NIE',               val: estudiante.nie },
            { label: 'Grado',             val: estudiante.grados?.nombre },
            { label: 'Género',            val: estudiante.genero },
            { label: 'Fecha de nacimiento', val: estudiante.fecha_nacimiento ? new Date(estudiante.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-SV') : null },
            { label: 'Correo institucional', val: estudiante.correo_institucional },
            { label: 'Dirección',         val: estudiante.direccion },
            { label: 'Municipio',         val: estudiante.municipio },
            { label: 'Encargado',         val: estudiante.nombre_tutor || estudiante.nombre_padre || estudiante.nombre_madre },
            { label: 'Teléfono encargado', val: estudiante.telefono_tutor || estudiante.telefono_padre || estudiante.telefono_madre },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(61,31,97,0.05)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: val ? '#222' : '#ccc', fontWeight: val ? 600 : 400 }}>{val || '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Mis Cobros ──────────────────────────────────────── */}
      {tab === 'cobros' && (
        <div>
          {cobrosPend.length > 0 && cobrosVenc.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#dc2626' }}><IcoAlert /></span>
              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                Tienes {cobrosVenc.length} cobro{cobrosVenc.length !== 1 ? 's' : ''} vencido{cobrosVenc.length !== 1 ? 's' : ''}. Por favor contáctate con la recepción.
              </span>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf8ff' }}>
                  {['Concepto', 'Mes', 'Monto', 'Vencimiento', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cobros.map((c, idx) => {
                  const vencido = c.estado === 'pendiente' && c.fecha_vencimiento && new Date(c.fecha_vencimiento) < new Date()
                  return (
                    <tr key={c.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                      <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: '#3d1f61' }}>{c.conceptos_cobro?.nombre || '—'}</td>
                      <td style={{ padding: '12px 18px', fontSize: 13, color: '#6b7280' }}>{c.mes || '—'}</td>
                      <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 700, color: '#3d1f61' }}>${parseFloat(c.monto).toFixed(2)}</td>
                      <td style={{ padding: '12px 18px', fontSize: 13, color: vencido ? '#dc2626' : '#6b7280', fontWeight: vencido ? 700 : 400 }}>
                        {c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString('es-SV') : '—'}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: c.estado === 'pagado' ? '#dcfce7' : vencido ? '#fee2e2' : '#fef9c3',
                          color:      c.estado === 'pagado' ? '#16a34a' : vencido ? '#dc2626' : '#a16207',
                        }}>
                          {c.estado === 'pagado' ? 'Pagado' : vencido ? 'Vencido' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {cobros.length === 0 && (
              <p style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Sin cobros registrados</p>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Documentos ─────────────────────────────────────── */}
      {tab === 'docs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {tiposDoc.map(({ key, label }) => {
            const doc = docs.find(d => d.tipo === key)
            return (
              <div key={key} style={{
                background: '#fff', borderRadius: 14, padding: 18,
                border: doc ? '1.5px solid #c9b8e8' : '1.5px dashed #e0d6f0',
                boxShadow: '0 2px 8px rgba(61,31,97,0.05)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: doc ? 'linear-gradient(135deg, #5B2D8E, #3d1f61)' : '#f0ecf8',
                  color: doc ? '#fff' : '#b0a8c0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IcoDoc />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61', marginBottom: 3 }}>{label}</div>
                  {doc ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IcoCheck />
                      </div>
                      <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Disponible</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 500 }}>No subido aún</span>
                  )}
                </div>
                {doc && (
                  <button onClick={() => verDoc(doc)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 8, border: 'none',
                    background: '#f3eeff', color: '#5B2D8E', fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', flexShrink: 0,
                  }}>
                    <IcoDownload /> Ver
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}