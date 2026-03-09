import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

export default function Configuracion() {
  const [grados, setGrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalGrado, setModalGrado] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ nombre: '', nivel: 'primaria', orden: '' })
  const [yearEscolar, setYearEscolar] = useState(new Date().getFullYear())
  const [guardandoYear, setGuardandoYear] = useState(false)

  const niveles = ['inicial', 'primaria', 'secundaria', 'bachillerato']

  const nivelColor = {
    inicial: { bg: '#fdf4ff', color: '#7e22ce' },
    primaria: { bg: '#eff6ff', color: '#3d1f61' },
    secundaria: { bg: '#f0fdf4', color: '#166534' },
    bachillerato: { bg: '#fef3c7', color: '#92400e' },
  }

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    setLoading(true)
    const { data } = await supabase
      .from('grados')
      .select('*')
      .order('orden', { ascending: true })
    setGrados(data || [])
    setLoading(false)
  }

  async function guardarGrado() {
    if (!form.nombre || !form.nivel || !form.orden) {
      setError('Todos los campos son obligatorios')
      return
    }
    setGuardando(true)
    setError('')

    if (editando) {
      await supabase.from('grados')
        .update({ nombre: form.nombre, nivel: form.nivel, orden: parseInt(form.orden) })
        .eq('id', editando.id)
    } else {
      await supabase.from('grados')
        .insert([{ nombre: form.nombre, nivel: form.nivel, orden: parseInt(form.orden) }])
    }

    setModalGrado(false)
    setEditando(null)
    resetForm()
    toast.success(editando ? 'Grado actualizado' : 'Grado creado')
    cargarDatos()
    setGuardando(false)
  }

  async function eliminarGrado(grado) {
    await supabase.from('grados').delete().eq('id', grado.id)
    toast.success('Grado eliminado')
    setModalEliminar(null)
    cargarDatos()
  }

  function abrirEditar(grado) {
    setEditando(grado)
    setForm({ nombre: grado.nombre, nivel: grado.nivel, orden: grado.orden })
    setModalGrado(true)
  }

  function resetForm() {
    setForm({ nombre: '', nivel: 'primaria', orden: '' })
    setError('')
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#5B2D8E', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>⚙️ Configuración</h1>
        <p style={{ color: '#888', fontSize: 13 }}>Gestión de grados y año escolar</p>
      </div>

      {/* Año escolar */}
      <div style={{ ...s.card, marginBottom: 20 }}>
        <h2 style={s.cardTitle}>📅 Año Escolar Activo</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            style={{ ...s.input, maxWidth: 120 }}
            type="number"
            value={yearEscolar}
            onChange={e => setYearEscolar(parseInt(e.target.value))}
          />
          <button
            onClick={() => {
              setGuardandoYear(true)
              setTimeout(() => setGuardandoYear(false), 800)
            }}
            style={s.btnPrimary}
            disabled={guardandoYear}
          >
            {guardandoYear ? '✅ Guardado' : '💾 Guardar'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#888', marginTop: 10 }}>
          Este año se usará por defecto al registrar cobros y matrículas.
        </p>
      </div>

      {/* Grados */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ ...s.cardTitle, marginBottom: 0 }}>🎓 Grados / Secciones</h2>
          <button onClick={() => { resetForm(); setEditando(null); setModalGrado(true) }} style={s.btnPrimary}>
            + Nuevo Grado
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>Cargando...</p>
        ) : grados.length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: 20 }}>No hay grados registrados</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Orden', 'Nombre', 'Nivel', 'Acción'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grados.map(g => (
                <tr key={g.id} style={s.tr}>
                  <td style={s.td}>
                    <span style={{ fontWeight: 700, color: '#888', fontSize: 13 }}>#{g.orden}</span>
                  </td>
                  <td style={s.td}>
                    <b style={{ color: '#5B2D8E' }}>{g.nombre}</b>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: nivelColor[g.nivel]?.bg, color: nivelColor[g.nivel]?.color }}>
                      {g.nivel}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => abrirEditar(g)} style={s.btnEditar}>✏️ Editar</button>
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
        <div style={s.modalBg}>
          <div style={s.modalBox}>
            <h2 style={s.modalTitle}>{editando ? '✏️ Editar Grado' : '➕ Nuevo Grado'}</h2>
            <div style={s.field}>
              <label style={s.label}>Nombre *</label>
              <input style={s.input} value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Sección 1, Primer Grado A"/>
            </div>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Nivel *</label>
                <select style={s.input} value={form.nivel}
                  onChange={e => setForm({ ...form, nivel: e.target.value })}>
                  {niveles.map(n => (
                    <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Orden *</label>
                <input style={s.input} type="number" value={form.orden}
                  onChange={e => setForm({ ...form, orden: e.target.value })}
                  placeholder="1, 2, 3..."/>
              </div>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalGrado(false); resetForm(); setEditando(null) }} style={s.btnSecondary}>
                Cancelar
              </button>
              <button onClick={guardarGrado} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar grado */}
      {modalEliminar && (
        <div style={s.modalBg} onClick={() => setModalEliminar(null)}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Eliminar grado</h2>
            <p style={{ color: '#555', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Eliminar el grado <b>"{modalEliminar.nombre}"</b>? Los estudiantes asignados a este grado perder\u00e1n su asignaci\u00f3n.
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
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 20 },
  cardTitle: { color: '#5B2D8E', fontSize: 15, fontWeight: 800, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #f0f4ff' },
  tr: { borderBottom: '1px solid #f8faff' },
  td: { padding: '10px 14px', fontSize: 14, color: '#333' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #dde3ee', background: '#fff', color: '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnEditar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#eff6ff', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  btnEliminar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { color: '#5B2D8E', fontSize: 17, fontWeight: 800, marginBottom: 20 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #dde3ee', fontSize: 14, background: '#f8faff', color: '#222', boxSizing: 'border-box' },
}