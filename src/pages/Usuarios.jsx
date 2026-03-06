import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [passwordGenerado, setPasswordGenerado] = useState(null)
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', rol: 'recepcion'
  })

  useEffect(() => { cargarUsuarios() }, [])

  async function cargarUsuarios() {
    setLoading(true)
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .order('creado_en', { ascending: false })
    setUsuarios(data || [])
    setLoading(false)
  }

  function generarPasswordTemporal() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return Array.from({length: 10}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  async function crearUsuario() {
    if (!form.nombre || !form.apellido || !form.email || !form.rol) {
      setError('Todos los campos son obligatorios')
      return
    }
    setGuardando(true)
    setError('')
    const passwordTemp = generarPasswordTemporal()

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: passwordTemp,
    })

    if (authError) {
      setError('Error: ' + authError.message)
      setGuardando(false)
      return
    }

    const { error: perfilError } = await supabase.from('perfiles').insert([{
      id: data.user.id,
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      rol: form.rol,
      activo: true,
    }])

    if (perfilError) {
      setError('Error al crear perfil: ' + perfilError.message)
      setGuardando(false)
      return
    }

    const infoGuardada = { nombre: form.nombre, apellido: form.apellido, email: form.email, password: passwordTemp }
    setModalAbierto(false)
    resetForm()
    setPasswordGenerado(infoGuardada)
    cargarUsuarios()
    setGuardando(false)
  }

  async function toggleActivo(usuario) {
    const nuevoEstado = !usuario.activo
    if (!window.confirm(`¿${nuevoEstado ? 'Activar' : 'Desactivar'} a ${usuario.nombre} ${usuario.apellido}?`)) return
    await supabase.from('perfiles').update({ activo: nuevoEstado }).eq('id', usuario.id)
    cargarUsuarios()
  }

  function resetForm() {
    setForm({ nombre: '', apellido: '', email: '', rol: 'recepcion' })
    setError('')
  }

  const rolColor = {
    admin: { bg: '#fef3c7', color: '#92400e' },
    recepcion: { bg: '#eff6ff', color: '#1d4ed8' },
    docente: { bg: '#f0fdf4', color: '#166534' },
    alumno: { bg: '#fdf4ff', color: '#7e22ce' },
    padre: { bg: '#fff7ed', color: '#c2410c' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: '#1e3a5f', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>👥 Usuarios</h1>
          <p style={{ color: '#888', fontSize: 13 }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={() => setModalAbierto(true)} style={s.btnPrimary}>+ Nuevo Usuario</button>
      </div>

      <div style={s.card}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Cargando...</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Nombre', 'Apellido', 'Email', 'Rol', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} style={s.tr}>
                  <td style={s.td}>{u.nombre}</td>
                  <td style={s.td}>{u.apellido}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: rolColor[u.rol]?.bg, color: rolColor[u.rol]?.color }}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: u.activo ? '#dcfce7' : '#fee2e2', color: u.activo ? '#16a34a' : '#dc2626' }}>
                      {u.activo ? '✅ Activo' : '🔴 Inactivo'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button onClick={() => toggleActivo(u)} style={u.activo ? s.btnDesactivar : s.btnActivar}>
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo usuario */}
      {modalAbierto && (
        <div style={s.modalBg}>
          <div style={s.modalBox}>
            <h2 style={s.modalTitle}>➕ Nuevo Usuario</h2>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Nombre *</label>
                <input style={s.input} value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre"/>
              </div>
              <div style={s.field}>
                <label style={s.label}>Apellido *</label>
                <input style={s.input} value={form.apellido}
                  onChange={e => setForm({ ...form, apellido: e.target.value })} placeholder="Apellido"/>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Correo electrónico *</label>
              <input style={s.input} type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@cbis.edu.sv"/>
            </div>
            <div style={s.field}>
              <label style={s.label}>Rol *</label>
              <select style={s.input} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
                <option value="recepcion">Recepción</option>
                <option value="docente">Docente</option>
                <option value="alumno">Alumno</option>
                <option value="padre">Padre de familia</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalAbierto(false); resetForm() }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={crearUsuario} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Creando...' : '💾 Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal contraseña generada */}
      {passwordGenerado && (
        <div style={s.modalBg}>
          <div style={{ ...s.modalBox, maxWidth: 420, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
            <h2 style={{ ...s.modalTitle, textAlign: 'center' }}>Usuario creado exitosamente</h2>
            <p style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>
              Comparte esta contraseña temporal con <b>{passwordGenerado.nombre} {passwordGenerado.apellido}</b>.<br/>
              El usuario deberá cambiarla en su primer ingreso.
            </p>
            <div style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Correo</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e3a5f', marginBottom: 16 }}>{passwordGenerado.email}</div>
              <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Contraseña temporal</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e3a5f', letterSpacing: 3, fontFamily: 'monospace' }}>
                {passwordGenerado.password}
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 20 }}>
              ⚠️ Esta contraseña no se volverá a mostrar
            </p>
            <button onClick={() => setPasswordGenerado(null)} style={s.btnPrimary}>✅ Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #f0f4ff' },
  tr: { borderBottom: '1px solid #f8faff' },
  td: { padding: '12px 16px', fontSize: 14, color: '#333' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #1e3a5f, #2563a8)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #dde3ee', background: '#fff', color: '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnActivar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  btnDesactivar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle: { color: '#1e3a5f', fontSize: 17, fontWeight: 800, marginBottom: 20 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#1e3a5f', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #dde3ee', fontSize: 14, background: '#f8faff', color: '#222', boxSizing: 'border-box' },
}