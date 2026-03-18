import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

const IcoLock = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalConfirm, setModalConfirm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [passwordGenerado, setPasswordGenerado] = useState(null)
  const [grados, setGrados] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', rol: 'recepcion', grado_id: '', estudiante_id: '' })
  const [resetando, setResetando] = useState(null) // id del usuario reseteando

  async function resetearPassword(usuario) {
    if (!usuario.email) { toast.error('Este usuario no tiene correo registrado'); return }
    setResetando(usuario.id)
    const { error } = await supabase.auth.resetPasswordForEmail(usuario.email, {
      redirectTo: `${window.location.origin}/dashboard`,
    })
    setResetando(null)
    if (error) toast.error('Error al enviar correo')
    else toast.success(`Enlace enviado a ${usuario.email}`)
  }

  useEffect(() => { cargarUsuarios(); cargarExtras() }, [])

  async function cargarUsuarios() {
    setLoading(true)
    const { data, error } = await supabase.from('perfiles').select('*, grados!perfiles_grado_id_fkey(nombre)').order('nombre', { ascending: true })
    if (error) console.error('Error cargando usuarios:', error)
    setUsuarios(data || []); setLoading(false)
  }

  async function cargarExtras() {
    const [{ data: gra }, { data: est }] = await Promise.all([
      supabase.from('grados').select('id, nombre, nivel').order('orden', { ascending: true }),
      supabase.from('estudiantes').select('id, nombre, apellido, grados(nombre)').eq('estado', 'activo').order('apellido', { ascending: true }),
    ])
    setGrados(gra || [])
    setEstudiantes(est || [])
  }

  function generarPasswordTemporal() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  async function crearUsuario() {
    if (!form.nombre || !form.apellido || !form.email || !form.rol) { setError('Todos los campos son obligatorios'); return }
    if (form.rol === 'docente' && !form.grado_id) { setError('Selecciona el grado encargado'); return }
    setGuardando(true); setError('')
    const passwordTemp = generarPasswordTemporal()

    const { data, error: authError } = await supabase.auth.signUp({ email: form.email, password: passwordTemp })
    if (authError) { setError('Error: ' + authError.message); setGuardando(false); return }

    const { error: rpcErr } = await supabase.rpc('crear_perfil_staff', {
      p_id:       data.user.id,
      p_nombre:   form.nombre,
      p_apellido: form.apellido,
      p_email:    form.email,
      p_rol:      form.rol,
      p_grado_id: form.rol === 'docente' ? parseInt(form.grado_id) : null,
    })
    if (rpcErr) { setError('Error al crear perfil: ' + rpcErr.message); setGuardando(false); return }

    const infoGuardada = { nombre: form.nombre, apellido: form.apellido, email: form.email, password: passwordTemp }
    setModalAbierto(false); resetForm(); setPasswordGenerado(infoGuardada); cargarUsuarios(); setGuardando(false)
  }

  async function toggleActivo(usuario) {
    const nuevoEstado = !usuario.activo
    const { error } = await supabase.from('perfiles').update({ activo: nuevoEstado }).eq('id', usuario.id)
    if (!error) { toast.success(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`); await cargarUsuarios() }
    setModalConfirm(null)
  }

  async function eliminarUsuario(usuario) {
    await supabase.from('perfiles').delete().eq('id', usuario.id)
    await supabase.rpc('eliminar_usuario_auth', { p_perfil_id: usuario.id })
    toast.success('Usuario eliminado'); cargarUsuarios(); setModalConfirm(null)
  }

  function resetForm() { setForm({ nombre: '', apellido: '', email: '', rol: 'recepcion', grado_id: '', estudiante_id: '' }); setError('') }

  const ROLES = [
    { value: 'admin',               label: 'Administrador' },
    { value: 'direccion_academica', label: 'Dirección Académica' },
    { value: 'registro_academico',  label: 'Registro Académico' },
    { value: 'recepcion',           label: 'Recepción' },
    { value: 'docente',             label: 'Docente' },
  ]

  const rolColor = {
    admin:               { bg: '#fef3c7', color: '#92400e' },
    direccion_academica: { bg: '#fdf4ff', color: '#7e22ce' },
    registro_academico:  { bg: '#f0fdf4', color: '#166534' },
    recepcion:           { bg: '#f3eeff', color: '#5B2D8E' },
    docente:             { bg: '#e0f7f6', color: '#0e9490' },
    alumno:              { bg: '#fff0e6', color: '#c2410c' },
  }

  const rolLabel = {
    admin:               'Administrador',
    direccion_academica: 'Dirección Académica',
    registro_academico:  'Registro Académico',
    recepcion:           'Recepción',
    docente:             'Docente',
    alumno:              'Alumno',
  }

  const staff  = usuarios.filter(u => u.rol !== 'alumno')
  const alumnos = usuarios.filter(u => u.rol === 'alumno')

  function TablaUsuarios({ lista, titulo, subtitulo, colorAcento }) {
    if (!lista.length) return null
    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#3d1f61', margin: 0 }}>{titulo}</h2>
          <span style={{ fontSize: 11, fontWeight: 700, color: colorAcento, background: colorAcento + '18', padding: '2px 10px', borderRadius: 20 }}>{lista.length}</span>
        </div>
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr style={{ background: '#faf8ff' }}>
                {['Usuario', 'Email', 'Rol', 'Detalle', 'Estado', ''].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((u, idx) => (
                <tr key={u.id} style={{ ...s.tr, background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, #3d1f61, #5B2D8E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                        {u.nombre?.charAt(0)}{u.apellido?.charAt(0)}
                      </div>
                      <div style={{ fontWeight: 700, color: '#3d1f61', fontSize: 13 }}>{u.nombre} {u.apellido}</div>
                    </div>
                  </td>
                  <td style={s.td}><span style={{ fontSize: 13, color: '#6b7280' }}>{u.email}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: rolColor[u.rol]?.bg || '#f3f4f6', color: rolColor[u.rol]?.color || '#6b7280' }}>
                      {rolLabel[u.rol] || u.rol}
                    </span>
                  </td>
                  <td style={s.td}>
                    {u.rol === 'docente' && u.grados ? (
                      <span style={{ fontSize: 12, color: '#0e9490', fontWeight: 600, background: '#e0f7f6', padding: '3px 10px', borderRadius: 20 }}>{u.grados.nombre}</span>
                    ) : u.rol === 'alumno' && u.estudiante_id ? (
                      <span style={{ fontSize: 12, color: '#c2410c', fontWeight: 600, background: '#fff0e6', padding: '3px 10px', borderRadius: 20 }}>ID #{u.estudiante_id}</span>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: u.activo ? '#dcfce7' : '#fee2e2', color: u.activo ? '#16a34a' : '#dc2626' }}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <MenuAcciones u={u} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

function MenuAcciones({ u }) {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(v => !v)}
          style={{ background: '#f4f0fa', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B2D8E', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>
          ···
        </button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            <div style={{ position: 'absolute', right: 0, top: 36, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(61,31,97,0.15)', zIndex: 100, minWidth: 160, overflow: 'hidden', border: '1px solid #f0ecf8' }}>
              <button onClick={() => { setOpen(false); setModalConfirm({ tipo: 'toggle', usuario: u }) }}
                style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: u.activo ? '#dc2626' : '#16a34a', fontFamily: 'inherit' }}>
                {u.activo ? 'Desactivar' : 'Activar'}
              </button>
              <div style={{ height: 1, background: '#f3eeff', margin: '0 12px' }} />
              <button onClick={() => { setOpen(false); resetearPassword(u) }}
                disabled={resetando === u.id}
                style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#2563eb', fontFamily: 'inherit' }}>
                {resetando === u.id ? 'Enviando...' : 'Restablecer contraseña'}
              </button>
              <div style={{ height: 1, background: '#f3eeff', margin: '0 12px' }} />
              <button onClick={() => { setOpen(false); setModalConfirm({ tipo: 'eliminar', usuario: u }) }}
                style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}>
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Usuarios</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={() => setModalAbierto(true)} style={s.btnPrimary}>+ Nuevo usuario</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#b0a8c0', padding: 48, fontSize: 13 }}>Cargando...</p>
      ) : (
        <>
          <TablaUsuarios lista={staff} titulo="Personal" colorAcento="#5B2D8E" />
          <TablaUsuarios lista={alumnos} titulo="Alumnos" colorAcento="#c2410c" />
        </>
      )}

      {/* Modal nuevo usuario */}
      {modalAbierto && (
        <div style={s.modalBg} onClick={() => { setModalAbierto(false); resetForm() }}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Nuevo Usuario</h2>
            <div style={s.grid2}>
              <div style={s.field}><label style={s.label}>Nombre *</label><input style={s.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" /></div>
              <div style={s.field}><label style={s.label}>Apellido *</label><input style={s.input} value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} placeholder="Apellido" /></div>
            </div>
            <div style={s.field}><label style={s.label}>Correo electrónico *</label><input style={s.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@cbis.edu.sv" /></div>
            <div style={s.field}>
              <label style={s.label}>Rol *</label>
              <select style={s.input} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value, grado_id: '', estudiante_id: '' })}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Campo extra: grado encargado para docente */}
            {form.rol === 'docente' && (
              <div style={s.field}>
                <label style={s.label}>Grado encargado *</label>
                <select style={s.input} value={form.grado_id} onChange={e => setForm({ ...form, grado_id: e.target.value })}>
                  <option value="">Selecciona un grado...</option>
                  {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
            )}

            {/* Campo extra: estudiante vinculado para alumno */}
            {form.rol === 'alumno' && (
              <div style={s.field}>
                <label style={s.label}>Estudiante vinculado *</label>
                <select style={s.input} value={form.estudiante_id} onChange={e => setForm({ ...form, estudiante_id: e.target.value })}>
                  <option value="">Selecciona un estudiante...</option>
                  {estudiantes.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.apellido}, {e.nombre} — {e.grados?.nombre || 'Sin grado'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalAbierto(false); resetForm() }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={crearUsuario} style={s.btnPrimary} disabled={guardando}>{guardando ? 'Creando...' : 'Crear usuario'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal contraseña generada */}
      {passwordGenerado && (
        <div style={s.modalBg}>
          <div style={{ ...s.modalBox, maxWidth: 420, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 20px' }}>
              <IcoLock />
            </div>
            <h2 style={{ ...s.modalTitle, textAlign: 'center' }}>Usuario creado exitosamente</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
              Comparte esta contraseña temporal con <b style={{ color: '#3d1f61' }}>{passwordGenerado.nombre} {passwordGenerado.apellido}</b>.<br/>
              El usuario deberá cambiarla en su primer ingreso.
            </p>
            <div style={{ background: '#f3eeff', border: '1.5px solid #d8c8f0', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 10, color: '#5B2D8E', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correo</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61', marginBottom: 16 }}>{passwordGenerado.email}</div>
              <div style={{ fontSize: 10, color: '#5B2D8E', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contraseña temporal</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#3d1f61', letterSpacing: 3, fontFamily: 'monospace', textAlign: 'center', background: '#fff', borderRadius: 10, padding: '12px', marginTop: 4 }}>
                {passwordGenerado.password}
              </div>
            </div>
            <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
              Esta contraseña no se volverá a mostrar
            </div>
            <button onClick={() => setPasswordGenerado(null)} style={s.btnPrimary}>Entendido</button>
          </div>
        </div>
      )}

      {/* Modal confirmación */}
      {modalConfirm && (
        <div style={s.modalBg} onClick={() => setModalConfirm(null)}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: modalConfirm.tipo === 'eliminar' ? '#dc2626' : '#5B2D8E' }}>
              {modalConfirm.tipo === 'eliminar' ? 'Eliminar usuario' : `${modalConfirm.usuario.activo ? 'Desactivar' : 'Activar'} usuario`}
            </h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
              {modalConfirm.tipo === 'eliminar'
                ? <>Eliminar permanentemente a <b style={{ color: '#3d1f61' }}>{modalConfirm.usuario.nombre} {modalConfirm.usuario.apellido}</b>? Esta acción no se puede deshacer.</>
                : <>{modalConfirm.usuario.activo ? 'Desactivar' : 'Activar'} a <b style={{ color: '#3d1f61' }}>{modalConfirm.usuario.nombre} {modalConfirm.usuario.apellido}</b>?</>
              }
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setModalConfirm(null)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={() => modalConfirm.tipo === 'eliminar' ? eliminarUsuario(modalConfirm.usuario) : toggleActivo(modalConfirm.usuario)}
                style={{ ...s.btnPrimary, background: modalConfirm.tipo === 'eliminar' ? '#dc2626' : undefined }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tr: { borderTop: '1px solid #f3eeff' },
  td: { padding: '12px 18px', fontSize: 13, color: '#333' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnActivar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnDesactivar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnEliminar: { padding: '6px 14px', borderRadius: 8, border: 'none', background: '#f3eeff', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalTitle: { color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.3px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}