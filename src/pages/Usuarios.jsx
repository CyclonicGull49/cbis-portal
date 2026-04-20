import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'

const IcoLock = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

function normalizar(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
}

function generarCorreo(nombre, apellido) {
  const n = normalizar(nombre.split(' ')[0])
  const a = normalizar(apellido.split(' ')[0])
  return `${n}.${a}@cbis.edu.sv`
}

function generarPassword(apellido) {
  const a = normalizar(apellido.split(' ')[0])
  return `${a}2026`
}

export default function Usuarios() {
  const [usuarios, setUsuarios]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [modalAbierto, setModalAbierto]     = useState(false)
  const [modalMasivo, setModalMasivo]       = useState(false)
  const [modalConfirm, setModalConfirm]     = useState(null)
  const [guardando, setGuardando]           = useState(false)
  const [error, setError]                   = useState('')
  const [passwordGenerado, setPasswordGenerado] = useState(null)
  const [grados, setGrados]                 = useState([])
  const [estudiantes, setEstudiantes]       = useState([])
  const [resetando, setResetando]           = useState(null)
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('')
  const [paginaStaff, setPaginaStaff]       = useState(1)
  const [paginaAlumnos, setPaginaAlumnos]   = useState(1)
  const [paginaPadres, setPaginaPadres]     = useState(1)
  const POR_PAGINA = 25
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', rol: 'recepcion', grado_id: '', estudiante_id: '' })

  // ── Masivo ────────────────────────────────────────────────
  const [gradoFiltro, setGradoFiltro]       = useState('')
  const [estudiantesSinCuenta, setEstudiantesSinCuenta] = useState([])
  const [seleccionados, setSeleccionados]   = useState(new Set())
  const [progresoMasivo, setProgresoMasivo] = useState(null) // { actual, total, errores }
  const [resultadoMasivo, setResultadoMasivo] = useState(null) // { creados, errores }

  async function resetearPassword(usuario) {
    if (!usuario.email) { toast.error('Este usuario no tiene correo registrado'); return }
    setResetando(usuario.id)
    const { error } = await supabase.auth.resetPasswordForEmail(usuario.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetando(null)
    if (error) toast.error('Error al enviar correo')
    else toast.success(`Enlace enviado a ${usuario.email}`)
  }


  useEffect(() => { cargarUsuarios(); cargarExtras() }, [])

  async function cargarUsuarios() {
    setLoading(true)
    const [{ data: perfilesData }, { data: vinculos }] = await Promise.all([
      supabase.from('perfiles')
        .select('*, grados!perfiles_grado_id_fkey(nombre)')
        .order('nombre', { ascending: true }),
      supabase.from('padre_estudiante').select('perfil_id'),
    ])
    const conteoHijos = {}
    for (const v of (vinculos || [])) {
      conteoHijos[v.perfil_id] = (conteoHijos[v.perfil_id] || 0) + 1
    }
    const enriquecidos = (perfilesData || []).map(p => ({
      ...p,
      hijos_count: p.rol === 'padres' ? (conteoHijos[p.id] || 0) : undefined,
    }))
    setUsuarios(enriquecidos)
    setLoading(false)
  }

  async function cargarExtras() {
    const [{ data: gra }, { data: est }] = await Promise.all([
      supabase.from('grados').select('id, nombre, nivel').order('orden', { ascending: true }),
      supabase.from('estudiantes').select('id, nombre, apellido, grados(nombre)').eq('estado', 'activo').order('apellido', { ascending: true }),
    ])
    setGrados(gra || [])
    setEstudiantes(est || [])
  }

  async function cargarSinCuenta(gradoId) {
    // Estudiantes activos sin perfil alumno
    const { data: conCuenta } = await supabase.from('perfiles')
      .select('estudiante_id').eq('rol', 'alumno').not('estudiante_id', 'is', null)
    const idsConCuenta = new Set((conCuenta || []).map(p => p.estudiante_id))

    let q = supabase.from('estudiantes').select('id, nombre, apellido, grado_id, grados(nombre)')
      .eq('estado', 'activo').order('apellido')
    if (gradoId) q = q.eq('grado_id', parseInt(gradoId))

    const { data } = await q
    const sinCuenta = (data || []).filter(e => !idsConCuenta.has(e.id))
    setEstudiantesSinCuenta(sinCuenta)
    setSeleccionados(new Set(sinCuenta.map(e => e.id)))
  }

  async function crearUsuario() {
    if (!form.nombre || !form.apellido || !form.email || !form.rol) { setError('Todos los campos son obligatorios'); return }
    if (form.rol === 'docente' && !form.grado_id) { setError('Selecciona el grado encargado'); return }
    if (form.rol === 'alumno' && !form.estudiante_id) { setError('Selecciona el estudiante vinculado'); return }
    setGuardando(true); setError('')

    const passwordTemp = form.rol === 'alumno'
      ? generarPassword(form.apellido)
      : Array.from({ length: 10 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 55)]).join('')

    const { data, error: authError } = await supabase.auth.signUp({ email: form.email, password: passwordTemp })
    if (authError) { setError('Error: ' + authError.message); setGuardando(false); return }

    const { error: rpcErr } = await supabase.rpc('crear_perfil_staff', {
      p_id:            data.user.id,
      p_nombre:        form.nombre,
      p_apellido:      form.apellido,
      p_email:         form.email,
      p_rol:           form.rol,
      p_grado_id:      form.rol === 'docente' ? parseInt(form.grado_id) : null,
    })

    // Si es alumno, vincular estudiante_id
    if (!rpcErr && form.rol === 'alumno') {
      await supabase.from('perfiles').update({ estudiante_id: parseInt(form.estudiante_id) }).eq('id', data.user.id)
    }

    if (rpcErr) { setError('Error al crear perfil: ' + rpcErr.message); setGuardando(false); return }

    setModalAbierto(false)
    resetForm()
    setPasswordGenerado({ nombre: form.nombre, apellido: form.apellido, email: form.email, password: passwordTemp })
    cargarUsuarios()
    setGuardando(false)
  }

  async function crearMasivo() {
    const lista = estudiantesSinCuenta.filter(e => seleccionados.has(e.id))
    if (lista.length === 0) { toast.error('Selecciona al menos un estudiante'); return }

    setGuardando(true)
    setProgresoMasivo({ actual: 1, total: lista.length, errores: [] })

    const payload = lista.map(est => ({
      id: est.id,
      nombre: est.nombre,
      apellido: est.apellido,
      email: generarCorreo(est.nombre, est.apellido),
      password: generarPassword(est.apellido),
    }))

    const { data, error } = await supabase.rpc('crear_alumnos_bulk', {
      estudiantes: payload,
    })

    setProgresoMasivo(null)

    if (error) {
      toast.error('Error: ' + error.message)
      setResultadoMasivo({ creados: 0, errores: [{ nombre: 'General', error: error.message }] })
    } else {
      setResultadoMasivo({ creados: data.creados, errores: data.errores || [] })
    }

    setGuardando(false)
    cargarUsuarios()
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
    { value: 'talento_humano',      label: 'Talento Humano' },
  ]

  const rolColor = {
    admin:               { bg: '#fef3c7', color: '#92400e' },
    direccion_academica: { bg: '#fdf4ff', color: '#7e22ce' },
    registro_academico:  { bg: '#f0fdf4', color: '#166534' },
    recepcion:           { bg: '#f3eeff', color: '#5B2D8E' },
    docente:             { bg: '#e0f7f6', color: '#0e9490' },
    alumno:              { bg: '#fff0e6', color: '#c2410c' },
    talento_humano:      { bg: '#f0fdf4', color: '#166534' },
    padres:              { bg: '#e0f7f6', color: '#0e9490' },
  }

  const rolLabel = {
    admin:               'Administrador',
    direccion_academica: 'Dirección Académica',
    registro_academico:  'Registro Académico',
    recepcion:           'Recepción',
    docente:             'Docente',
    alumno:              'Alumno',
    talento_humano:      'Talento Humano',
    padres:              'Padre/Madre',
  }

  const staff   = usuarios.filter(u => u.rol !== 'alumno' && u.rol !== 'padres')
  const alumnos = usuarios.filter(u => u.rol === 'alumno')
  const padres  = usuarios.filter(u => u.rol === 'padres')

  function MenuAccionesPadre({ u }) {
    const [open, setOpen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Obtener apellido del primer hijo para mostrar password esperada
    const primeraContrasena = u.hijos_count > 0 
      ? '(Solicita a recepción que busque el apellido del hijo)'
      : '(No tiene hijos vinculados)'

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button onClick={() => setOpen(v => !v)}
          style={{ background: '#f4f0fa', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B2D8E', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>
          ···
        </button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
            <div style={{ position: 'fixed', background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(61,31,97,0.18)', zIndex: 200, minWidth: 220, border: '1px solid #f0ecf8', overflow: 'hidden' }}
              ref={el => {
                if (el) {
                  const btn = el.previousSibling?.previousSibling
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    el.style.top = (rect.bottom + 4) + 'px'
                    el.style.right = (window.innerWidth - rect.right) + 'px'
                  }
                }
              }}>
              <button onClick={() => { setShowPassword(!showPassword) }}
                style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#5B2D8E', fontFamily: 'inherit' }}>
                {showPassword ? 'Ocultar' : 'Ver'} contraseña esperada
              </button>
              {showPassword && (
                <>
                  <div style={{ height: 1, background: '#f3eeff', margin: '0 12px' }} />
                  <div style={{ padding: '11px 16px', background: '#faf8ff', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #f3eeff' }}>
                    {primeraContrasena}
                  </div>
                </>
              )}
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

  function MenuAcciones({ u }) {
    const [open, setOpen] = useState(false)
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button onClick={() => setOpen(v => !v)}
          style={{ background: '#f4f0fa', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B2D8E', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>
          ···
        </button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
            <div style={{ position: 'fixed', background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(61,31,97,0.18)', zIndex: 200, minWidth: 180, border: '1px solid #f0ecf8', overflow: 'hidden' }}
              ref={el => {
                if (el) {
                  const btn = el.previousSibling?.previousSibling
                  if (btn) {
                    const rect = btn.getBoundingClientRect()
                    el.style.top = (rect.bottom + 4) + 'px'
                    el.style.right = (window.innerWidth - rect.right) + 'px'
                  }
                }
              }}>
              <button onClick={() => { setOpen(false); setModalConfirm({ tipo: 'toggle', usuario: u }) }}
                style={{ width: '100%', padding: '11px 16px', border: 'none', background: 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: u.activo ? '#dc2626' : '#16a34a', fontFamily: 'inherit' }}>
                {u.activo ? 'Desactivar' : 'Activar'}
              </button>
              <div style={{ height: 1, background: '#f3eeff', margin: '0 12px' }} />
              <button onClick={() => { setOpen(false); resetearPassword(u) }} disabled={resetando === u.id}
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

  function TablaUsuarios({ lista, titulo, colorAcento, pagina, setPagina, variant = 'staff' }) {
    if (!lista.length) return null

    const filtrada = busquedaUsuarios
      ? lista.filter(u =>
          `${u.nombre} ${u.apellido}`.toLowerCase().includes(busquedaUsuarios.toLowerCase()) ||
          u.email?.toLowerCase().includes(busquedaUsuarios.toLowerCase())
        )
      : lista

    const totalPaginas = Math.ceil(filtrada.length / POR_PAGINA)
    const inicio = (pagina - 1) * POR_PAGINA
    const paginada = filtrada.slice(inicio, inicio + POR_PAGINA)

    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#3d1f61', margin: 0 }}>{titulo}</h2>
          <span style={{ fontSize: 11, fontWeight: 700, color: colorAcento, background: colorAcento + '18', padding: '2px 10px', borderRadius: 20 }}>
            {filtrada.length}{busquedaUsuarios ? ` de ${lista.length}` : ''}
          </span>
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
              {paginada.map((u, idx) => (
                <tr key={u.id} style={{ ...s.tr, background: idx % 2 === 0 ? '#fff' : '#fdfcff' }}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
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
                    ) : u.rol === 'padres' && u.hijos_count ? (
                      <span style={{ fontSize: 12, color: '#5B2D8E', fontWeight: 600, background: '#f3eeff', padding: '3px 10px', borderRadius: 20 }}>
                        {u.hijos_count} {u.hijos_count === 1 ? 'hijo' : 'hijos'}
                      </span>
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
                    {variant === 'padres' ? <MenuAccionesPadre u={u} /> : <MenuAcciones u={u} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPaginas > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', borderTop: '1px solid #f3eeff' }}>
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}
                style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: pagina === 1 ? '#f9fafb' : '#fff', color: pagina === 1 ? '#d1d5db' : '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: pagina === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                ‹ Ant
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPaginas || Math.abs(p - pagina) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i-1] > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) => p === '...'
                  ? <span key={`e${i}`} style={{ fontSize: 12, color: '#b0a8c0' }}>...</span>
                  : <button key={p} onClick={() => setPagina(p)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid', borderColor: pagina === p ? '#5B2D8E' : '#e5e7eb', background: pagina === p ? '#5B2D8E' : '#fff', color: pagina === p ? '#fff' : '#3d1f61', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {p}
                    </button>
                )
              }
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: pagina === totalPaginas ? '#f9fafb' : '#fff', color: pagina === totalPaginas ? '#d1d5db' : '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: pagina === totalPaginas ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                Sig ›
              </button>
            </div>
          )}
        </div>
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
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setModalMasivo(true); cargarSinCuenta('') }}
            style={{ ...s.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Crear cuentas alumnos
          </button>
          <button onClick={() => setModalAbierto(true)} style={s.btnPrimary}>+ Nuevo usuario</button>
        </div>
      </div>

     {loading ? (
        <p style={{ textAlign: 'center', color: '#b0a8c0', padding: 48, fontSize: 13 }}>Cargando...</p>
      ) : (
        <>
          <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b0a8c0' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input type="text" placeholder="Buscar por nombre o correo..."
              value={busquedaUsuarios}
              onChange={e => { setBusquedaUsuarios(e.target.value); setPaginaStaff(1); setPaginaAlumnos(1); setPaginaPadres(1) }}
              style={{ width: '100%', padding: '9px 14px 9px 34px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
            />
            {busquedaUsuarios && (
              <button onClick={() => setBusquedaUsuarios('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#b0a8c0', fontSize: 16 }}>×</button>
            )}
          </div>
          <TablaUsuarios lista={staff}   titulo="Personal" colorAcento="#5B2D8E" pagina={paginaStaff}   setPagina={setPaginaStaff}   variant="staff" />
          <TablaUsuarios lista={alumnos} titulo="Alumnos"  colorAcento="#c2410c" pagina={paginaAlumnos} setPagina={setPaginaAlumnos} variant="staff" />
          <TablaUsuarios lista={padres}  titulo="Padres"   colorAcento="#0e9490" pagina={paginaPadres}  setPagina={setPaginaPadres}  variant="padres" />
        </>
      )}

      {/* ── Modal nuevo usuario ── */}
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
            {form.rol === 'docente' && (
              <div style={s.field}>
                <label style={s.label}>Grado encargado *</label>
                <select style={s.input} value={form.grado_id} onChange={e => setForm({ ...form, grado_id: e.target.value })}>
                  <option value="">Selecciona un grado...</option>
                  {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </div>
            )}
            {form.rol === 'alumno' && (
              <div style={s.field}>
                <label style={s.label}>Estudiante vinculado *</label>
                <select style={s.input} value={form.estudiante_id} onChange={e => setForm({ ...form, estudiante_id: e.target.value })}>
                  <option value="">Selecciona un estudiante...</option>
                  {estudiantes.map(e => (
                    <option key={e.id} value={e.id}>{e.apellido}, {e.nombre} — {e.grados?.nombre || 'Sin grado'}</option>
                  ))}
                </select>
              </div>
            )}
            {form.rol === 'alumno' && form.nombre && form.apellido && (
              <div style={{ background: '#f3eeff', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#5B2D8E', fontWeight: 600 }}>
                Correo generado: <b>{generarCorreo(form.nombre, form.apellido)}</b> · Contraseña: <b>{generarPassword(form.apellido)}</b>
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

      {/* ── Modal creación masiva ── */}
      {modalMasivo && !resultadoMasivo && (
        <div style={s.modalBg} onClick={() => !guardando && setModalMasivo(false)}>
          <div style={{ ...s.modalBox, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Crear cuentas de alumnos</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Se generará un correo <b>nombre.apellido@cbis.edu.sv</b> y contraseña <b>apellido2026</b> para cada alumno seleccionado.
            </p>

            {/* Filtro por grado */}
            <div style={s.field}>
              <label style={s.label}>Filtrar por grado</label>
              <select style={s.input} value={gradoFiltro} onChange={e => { setGradoFiltro(e.target.value); cargarSinCuenta(e.target.value) }}>
                <option value="">Todos los grados</option>
                {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>

            {estudiantesSinCuenta.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#16a34a', fontWeight: 700, fontSize: 14 }}>
                ✓ Todos los alumnos ya tienen cuenta
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{seleccionados.size} de {estudiantesSinCuenta.length} seleccionados</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setSeleccionados(new Set(estudiantesSinCuenta.map(e => e.id)))}
                      style={{ fontSize: 12, color: '#5B2D8E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      Seleccionar todos
                    </button>
                    <button onClick={() => setSeleccionados(new Set())}
                      style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      Deseleccionar
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: 280, overflowY: 'auto', border: '1.5px solid #e5e7eb', borderRadius: 10, marginBottom: 16 }}>
                  {estudiantesSinCuenta.map((est, idx) => (
                    <label key={est.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: idx % 2 === 0 ? '#fff' : '#fdfcff', cursor: 'pointer', borderBottom: '1px solid #f3eeff' }}>
                      <input type="checkbox" checked={seleccionados.has(est.id)}
                        onChange={e => {
                          const s = new Set(seleccionados)
                          e.target.checked ? s.add(est.id) : s.delete(est.id)
                          setSeleccionados(s)
                        }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#3d1f61' }}>{est.apellido}, {est.nombre}</div>
                        <div style={{ fontSize: 11, color: '#b0a8c0' }}>{est.grados?.nombre} · {generarCorreo(est.nombre, est.apellido)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Progreso */}
            {progresoMasivo && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                  <span>Creando cuentas...</span>
                  <span>{progresoMasivo.actual} / {progresoMasivo.total}</span>
                </div>
                <div style={{ height: 8, background: '#f3eeff', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #3d1f61, #5B2D8E)', borderRadius: 4, width: `${(progresoMasivo.actual / progresoMasivo.total) * 100}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalMasivo(false)} style={s.btnSecondary} disabled={guardando}>Cancelar</button>
              {estudiantesSinCuenta.length > 0 && (
                <button onClick={crearMasivo} style={s.btnPrimary} disabled={guardando || seleccionados.size === 0}>
                  {guardando ? 'Creando...' : `Crear ${seleccionados.size} cuenta${seleccionados.size !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Resultado masivo ── */}
      {resultadoMasivo && (
        <div style={s.modalBg}>
          <div style={{ ...s.modalBox, maxWidth: 460, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ ...s.modalTitle, textAlign: 'center' }}>Cuentas creadas</h2>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px 24px' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#16a34a' }}>{resultadoMasivo.creados}</div>
                <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Creadas</div>
              </div>
              {resultadoMasivo.errores.length > 0 && (
                <div style={{ background: '#fef2f2', borderRadius: 12, padding: '12px 24px' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626' }}>{resultadoMasivo.errores.length}</div>
                  <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Errores</div>
                </div>
              )}
            </div>
            {resultadoMasivo.errores.length > 0 && (
              <div style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 14px', marginBottom: 16, textAlign: 'left', maxHeight: 150, overflowY: 'auto' }}>
                {resultadoMasivo.errores.map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#dc2626', marginBottom: 4 }}>• {e.nombre}: {e.error}</div>
                ))}
              </div>
            )}
            <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
              Contraseña inicial: apellido + 2026 · Los alumnos deberán cambiarla en su primer ingreso
            </div>
            <button onClick={() => { setResultadoMasivo(null); setModalMasivo(false) }} style={s.btnPrimary}>Entendido</button>
          </div>
        </div>
      )}

      {/* ── Modal contraseña individual ── */}
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

      {/* ── Modal confirmación ── */}
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
              <button
                onClick={() => modalConfirm.tipo === 'eliminar' ? eliminarUsuario(modalConfirm.usuario) : toggleActivo(modalConfirm.usuario)}
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
  card:          { background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'visible' },
  table:         { width: '100%', borderCollapse: 'collapse' },
  th:            { padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tr:            { borderTop: '1px solid #f3eeff' },
  td:            { padding: '12px 18px', fontSize: 13, color: '#333' },
  badge:         { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary:    { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary:  { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox:      { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalTitle:    { color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.3px' },
  grid2:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field:         { marginBottom: 14 },
  label:         { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input:         { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}