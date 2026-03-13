import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import toast from 'react-hot-toast'

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

export default function PerfilAlumno({ seccion = 'perfil' }) {
  const { perfil } = useAuth()
  const [estudiante, setEstudiante] = useState(null)
  const [cobros, setCobros]         = useState([])
  const [docs, setDocs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [passNueva, setPassNueva]   = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState(false)

  useEffect(() => {
    if (perfil?.estudiante_id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: est }, { data: cob }, { data: d }] = await Promise.all([
      supabase.from('estudiantes').select('*, grados(nombre, nivel)').eq('id', perfil.estudiante_id).single(),
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
      <div style={{ color: '#b0a8c0', fontSize: 13 }}>Cargando...</div>
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

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* ── Header — solo en perfil ──────────────────────────── */}
      {seccion === 'perfil' && (
        <div style={{
          background: 'linear-gradient(135deg, #1a0d30, #3d1f61)',
          borderRadius: 20, padding: '24px 28px', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #D4A017, #b8860b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 20,
              boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
            }}>
              {estudiante.nombre?.charAt(0)}{estudiante.apellido?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', marginBottom: 6 }}>
                {estudiante.nombre} {estudiante.apellido}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ ...nivel, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {estudiante.grados?.nombre}
                </span>
                {estudiante.nie && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>NIE: {estudiante.nie}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mi Perfil ────────────────────────────────────────── */}
      {seccion === 'perfil' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Nombre completo',     val: `${estudiante.nombre} ${estudiante.apellido}` },
            { label: 'NIE',                 val: estudiante.nie },
            { label: 'Grado',               val: estudiante.grados?.nombre },
            { label: 'Género',              val: estudiante.genero },
            { label: 'Fecha de nacimiento', val: estudiante.fecha_nacimiento ? new Date(estudiante.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-SV') : null },
            { label: 'Correo institucional', val: estudiante.correo_institucional },
            { label: 'Dirección',           val: estudiante.direccion },
            { label: 'Municipio',           val: estudiante.municipio },
            { label: 'Encargado',           val: estudiante.nombre_tutor || estudiante.nombre_padre || estudiante.nombre_madre },
            { label: 'Teléfono encargado',  val: estudiante.telefono_tutor || estudiante.telefono_padre || estudiante.telefono_madre },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(61,31,97,0.05)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: val ? '#222' : '#ccc', fontWeight: val ? 600 : 400 }}>{val || '—'}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Mis Notas ────────────────────────────────────────── */}
      {seccion === 'notas' && (
        <Boletin estudianteId={perfil?.estudiante_id} gradoId={estudiante?.grado_id} nivel={estudiante?.grados?.nivel} />
      )}

      {/* ── Mis Cobros ───────────────────────────────────────── */}
      {seccion === 'cobros' && (
        <div>
          {cobrosVenc.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                Tienes {cobrosVenc.length} cobro{cobrosVenc.length !== 1 ? 's' : ''} vencido{cobrosVenc.length !== 1 ? 's' : ''}. Contáctate con recepción.
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
            {cobros.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Sin cobros registrados</p>}
          </div>
        </div>
      )}

      {/* ── Documentos ───────────────────────────────────────── */}
      {seccion === 'docs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {tiposDoc.map(({ key, label }) => {
            const doc = docs.find(d => d.tipo === key)
            return (
              <div key={key} style={{
                background: '#fff', borderRadius: 14, padding: 18,
                border: doc ? '1.5px solid #c9b8e8' : '1.5px dashed #e0d6f0',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: doc ? 'linear-gradient(135deg, #5B2D8E, #3d1f61)' : '#f0ecf8',
                  color: doc ? '#fff' : '#b0a8c0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#3d1f61', marginBottom: 3 }}>{label}</div>
                  {doc
                    ? <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Disponible</span>
                    : <span style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 500 }}>No subido aún</span>
                  }
                </div>
                {doc && (
                  <button onClick={() => verDoc(doc)} style={{
                    padding: '7px 12px', borderRadius: 8, border: 'none',
                    background: '#f3eeff', color: '#5B2D8E', fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
                  }}>Ver</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Configuración ────────────────────────────────────── */}
      {seccion === 'config' && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', borderTop: '4px solid #5B2D8E' }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#3d1f61', marginBottom: 4 }}>Cambiar contraseña</div>
            <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500, marginBottom: 20 }}>
              Si recibiste una contraseña temporal, cámbiala aquí.
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Nueva contraseña</label>
              <input type="password" style={s.input} value={passNueva} onChange={e => setPassNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Confirmar contraseña</label>
              <input type="password" style={s.input} value={passConfirm} onChange={e => setPassConfirm(e.target.value)} placeholder="Repite la nueva contraseña" />
            </div>
            {passNueva && passConfirm && passNueva !== passConfirm && (
              <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 12 }}>Las contraseñas no coinciden</div>
            )}
            <button onClick={cambiarPassword} disabled={cambiandoPass} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
              opacity: cambiandoPass ? 0.7 : 1,
            }}>
              {cambiandoPass ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

function promedio(vals) {
  const v = vals.filter(x => x !== null && x !== undefined)
  if (!v.length) return null
  return v.reduce((a, b) => a + parseFloat(b), 0) / v.length
}

function Boletin({ estudianteId, gradoId, nivel }) {
  const { yearEscolar } = useYearEscolar()
  const [materias, setMaterias]   = useState([])
  const [notas, setNotas]         = useState({})
  const [loading, setLoading]     = useState(true)

  const numPeriodos = ['bachillerato'].includes(nivel) ? 4 : 3

  useEffect(() => {
    if (!estudianteId || !gradoId || !yearEscolar) return
    async function cargar() {
      setLoading(true)
      const [{ data: mgs }, { data: ns }] = await Promise.all([
        supabase.from('materia_grado').select('materia_id, materias(id, nombre)').eq('grado_id', gradoId),
        supabase.from('notas').select('*').eq('estudiante_id', estudianteId).eq('grado_id', gradoId).eq('año_escolar', yearEscolar),
      ])
      setMaterias(mgs?.map(m => m.materias) || [])
      const mapa = {}
      for (const n of (ns || [])) {
        mapa[`${n.materia_id}-${n.periodo}-${n.tipo}`] = n.nota
      }
      setNotas(mapa)
      setLoading(false)
    }
    cargar()
  }, [estudianteId, gradoId, yearEscolar])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Cargando boletín...</div>

  if (!materias.length) return (
    <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61', marginBottom: 6 }}>Aún no hay notas registradas</div>
      <div style={{ fontSize: 13, color: '#b0a8c0' }}>Las notas aparecerán aquí una vez que el docente las registre.</div>
    </div>
  )

  const periodoLabel = nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'

  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr style={{ background: '#faf8ff' }}>
            <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Materia</th>
            {Array.from({ length: numPeriodos }, (_, i) => (
              <th key={i} style={{ padding: '12px 8px', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center', borderLeft: '2px solid #e9e3f5' }}>
                {periodoLabel} {i + 1}
              </th>
            ))}
            <th style={{ padding: '12px 12px', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px', textAlign: 'center', borderLeft: '2px solid #e9e3f5' }}>
              Final
            </th>
          </tr>
        </thead>
        <tbody>
          {materias.map((m, idx) => {
            const promediosPeriodo = Array.from({ length: numPeriodos }, (_, i) => {
              const ord = notas[`${m.id}-${i + 1}-ordinaria`] ?? null
              const exa = notas[`${m.id}-${i + 1}-examen`]    ?? null
              return promedio([ord, exa])
            })
            const notaFinal = promedio(promediosPeriodo)

            return (
              <tr key={m.id} style={{ borderTop: '1px solid #f3eeff', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: '#3d1f61' }}>{m.nombre}</td>
                {promediosPeriodo.map((p, i) => (
                  <td key={i} style={{ padding: '12px 8px', textAlign: 'center', borderLeft: '2px solid #e9e3f5' }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700,
                      color: p === null ? '#ccc' : p < 5 ? '#dc2626' : p < 7 ? '#a16207' : '#16a34a'
                    }}>
                      {p !== null ? p.toFixed(1) : '—'}
                    </span>
                  </td>
                ))}
                <td style={{ padding: '12px 12px', textAlign: 'center', borderLeft: '2px solid #e9e3f5' }}>
                  <span style={{
                    fontSize: 15, fontWeight: 900,
                    color: notaFinal === null ? '#ccc' : notaFinal < 5 ? '#dc2626' : notaFinal < 7 ? '#a16207' : '#16a34a'
                  }}>
                    {notaFinal !== null ? notaFinal.toFixed(1) : '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const s = {
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}