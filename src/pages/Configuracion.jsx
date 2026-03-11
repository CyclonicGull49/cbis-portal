import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

const IcoEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)
const IcoCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IcoGrados = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
)

export default function Configuracion() {
  const [grados, setGrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalGrado, setModalGrado] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', nivel: 'primaria', orden: '', monto_matricula: '', monto_mensualidad: '' })
  const [yearEscolar, setYearEscolar] = useState(new Date().getFullYear())
  const [guardandoYear, setGuardandoYear] = useState(false)

  const niveles = ['primera_infancia', 'primaria', 'secundaria', 'bachillerato']

  const nivelLabel = {
    primera_infancia: 'Primera Infancia',
    inicial:          'Primera Infancia',
    primaria:         'Primaria',
    secundaria:       'Secundaria',
    bachillerato:     'Bachillerato',
  }

  const nivelColor = {
    primera_infancia: { bg: '#fdf4ff', color: '#7e22ce' },
    inicial:          { bg: '#fdf4ff', color: '#7e22ce' },
    primaria:         { bg: '#f3eeff', color: '#5B2D8E' },
    secundaria:       { bg: '#f0fdf4', color: '#166534' },
    bachillerato:     { bg: '#fef3c7', color: '#92400e' },
  }

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: gra }, { data: config }] = await Promise.all([
      supabase.from('grados').select('*').order('orden', { ascending: true }),
      supabase.from('configuracion').select('valor').eq('clave', 'year_escolar_activo').single()
    ])
    setGrados(gra || [])
    if (config?.valor) setYearEscolar(parseInt(config.valor))
    setLoading(false)
  }

  async function guardarGrado() {
    if (!form.nombre || !form.nivel || !form.orden) { setError('Nombre, nivel y orden son obligatorios'); return }
    setGuardando(true); setError('')
    const payload = {
      nombre: form.nombre,
      nivel: form.nivel,
      orden: parseInt(form.orden),
      monto_matricula: form.monto_matricula ? parseFloat(form.monto_matricula) : null,
      monto_mensualidad: form.monto_mensualidad ? parseFloat(form.monto_mensualidad) : null,
    }
    if (editando) { await supabase.from('grados').update(payload).eq('id', editando.id) }
    else { await supabase.from('grados').insert([payload]) }
    setModalGrado(false); setEditando(null); resetForm()
    toast.success(editando ? 'Grado actualizado' : 'Grado creado'); cargarDatos(); setGuardando(false)
  }

  async function eliminarGrado(grado) {
    await supabase.from('grados').delete().eq('id', grado.id)
    toast.success('Grado eliminado'); setModalEliminar(null); cargarDatos()
  }

  function abrirEditar(grado) {
    setEditando(grado)
    setForm({ nombre: grado.nombre, nivel: grado.nivel, orden: grado.orden, monto_matricula: grado.monto_matricula || '', monto_mensualidad: grado.monto_mensualidad || '' })
    setModalGrado(true)
  }

  function resetForm() { setForm({ nombre: '', nivel: 'primaria', orden: '', monto_matricula: '', monto_mensualidad: '' }); setError('') }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Configuración</h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>Gestión de grados y año escolar</p>
      </div>

      {/* Año escolar */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', marginBottom: 20, borderTop: '4px solid #D4A017' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#fffbeb', borderRadius: 10, padding: '8px 10px', color: '#D4A017' }}><IcoCalendar /></div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', letterSpacing: '-0.2px' }}>Año Escolar Activo</div>
            <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500 }}>Se usará por defecto al registrar cobros y matrículas</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            style={{ ...s.input, maxWidth: 130, fontWeight: 800, fontSize: 18, textAlign: 'center', color: '#3d1f61' }}
            type="number"
            value={yearEscolar}
            onChange={e => setYearEscolar(parseInt(e.target.value))}
          />
          <button onClick={async () => {
            setGuardandoYear(true)
            await supabase.from('configuracion').update({ valor: yearEscolar.toString() }).eq('clave', 'year_escolar_activo')
            toast.success('Año escolar actualizado'); setGuardandoYear(false)
          }} style={s.btnPrimary} disabled={guardandoYear}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IcoSave />{guardandoYear ? 'Guardado' : 'Guardar'}
            </span>
          </button>
        </div>
      </div>

      {/* Grados */}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden', borderTop: '4px solid #5B2D8E' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3eeff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#f3eeff', borderRadius: 10, padding: '8px 10px', color: '#5B2D8E' }}><IcoGrados /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', letterSpacing: '-0.2px' }}>Grados / Secciones</div>
              <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500 }}>{grados.length} grados configurados</div>
            </div>
          </div>
          <button onClick={() => { resetForm(); setEditando(null); setModalGrado(true) }} style={s.btnPrimary}>
            + Nuevo grado
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#b0a8c0', textAlign: 'center', padding: 48, fontSize: 13 }}>Cargando...</p>
        ) : grados.length === 0 ? (
          <p style={{ color: '#b0a8c0', textAlign: 'center', padding: 48, fontSize: 13 }}>No hay grados registrados</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={{ background: '#faf8ff' }}>
                {['#', 'Nombre', 'Nivel', 'Matrícula', 'Mensualidad', 'Acciones'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grados.map((g, idx) => (
                <tr key={g.id} style={{ ...s.tr, background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <td style={s.td}>
                    <span style={{ fontWeight: 700, color: '#b0a8c0', fontSize: 12 }}>#{g.orden}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontWeight: 700, color: '#3d1f61', fontSize: 13 }}>{g.nombre}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: nivelColor[g.nivel]?.bg || '#f3f4f6', color: nivelColor[g.nivel]?.color || '#6b7280' }}>
                      {nivelLabel[g.nivel] || g.nivel}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: g.monto_matricula ? '#5B2D8E' : '#d1d5db' }}>
                      {g.monto_matricula ? `$${parseFloat(g.monto_matricula).toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: g.monto_mensualidad ? '#5B2D8E' : '#d1d5db' }}>
                      {g.monto_mensualidad ? `$${parseFloat(g.monto_mensualidad).toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => abrirEditar(g)} style={s.btnEditar}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IcoEdit /> Editar</span>
                      </button>
                      <button onClick={() => setModalEliminar(g)} style={s.btnEliminar}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal grado */}
      {modalGrado && (
        <div style={s.modalBg} onClick={() => { setModalGrado(false); resetForm(); setEditando(null) }}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editando ? 'Editar Grado' : 'Nuevo Grado'}</h2>
            <div style={s.field}><label style={s.label}>Nombre *</label><input style={s.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Sección 1, Primer Grado A" /></div>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Nivel *</label>
                <select style={s.input} value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })}>
                  {niveles.map(n => (<option key={n} value={n}>{nivelLabel[n]}</option>))}
                </select>
              </div>
              <div style={s.field}><label style={s.label}>Orden *</label><input style={s.input} type="number" value={form.orden} onChange={e => setForm({ ...form, orden: e.target.value })} placeholder="1, 2, 3..." /></div>
            </div>
            <div style={{ background: '#faf8ff', borderRadius: 12, padding: '14px 16px', marginBottom: 14, border: '1px solid #e8e0f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Montos (para matrícula automática)</div>
              <div style={s.grid2}>
                <div style={s.field}><label style={s.label}>Monto matrícula</label><input style={s.input} type="number" step="0.01" value={form.monto_matricula} onChange={e => setForm({ ...form, monto_matricula: e.target.value })} placeholder="0.00" /></div>
                <div style={s.field}><label style={s.label}>Monto mensualidad</label><input style={s.input} type="number" step="0.01" value={form.monto_mensualidad} onChange={e => setForm({ ...form, monto_mensualidad: e.target.value })} placeholder="0.00" /></div>
              </div>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalGrado(false); resetForm(); setEditando(null) }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={guardarGrado} style={s.btnPrimary} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {modalEliminar && (
        <div style={s.modalBg} onClick={() => setModalEliminar(null)}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Eliminar grado</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
              Eliminar el grado <b style={{ color: '#3d1f61' }}>"{modalEliminar.nombre}"</b>? Los estudiantes asignados perderán su asignación de grado.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setModalEliminar(null)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={() => eliminarGrado(modalEliminar)} style={{ ...s.btnPrimary, background: '#dc2626' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tr: { borderTop: '1px solid #f3eeff' },
  td: { padding: '12px 18px', fontSize: 13, color: '#333' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnEditar: { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f3eeff', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnEliminar: { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalTitle: { color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.3px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}