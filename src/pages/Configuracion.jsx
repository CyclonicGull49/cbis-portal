import GruposIngles from '../components/GruposIngles'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { NIVEL_COLOR } from '../constants/colores'
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
const IcoBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)
const IcoClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function Configuracion() {
  const { perfil } = useAuth()
  const isAdmin = perfil?.rol === 'admin'

  // ── Perfil personal ───────────────────────────────────────
  const [perfilForm, setPerfilForm]     = useState({ nombre: '', apellido: '' })
  const [pwForm, setPwForm]             = useState({ nueva: '', confirmar: '' })
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [guardandoPw, setGuardandoPw]   = useState(false)
  const [resetEnviado, setResetEnviado] = useState(false)

  useEffect(() => {
    if (perfil) setPerfilForm({ nombre: perfil.nombre || '', apellido: perfil.apellido || '' })
  }, [perfil])

  async function guardarPerfil() {
    setGuardandoPerfil(true)
    const { error } = await supabase.from('perfiles')
      .update({ nombre: perfilForm.nombre, apellido: perfilForm.apellido })
      .eq('id', perfil.id)
    if (error) toast.error('Error al guardar')
    else toast.success('Perfil actualizado')
    setGuardandoPerfil(false)
  }

  async function cambiarPassword() {
    if (!pwForm.nueva || pwForm.nueva.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    if (pwForm.nueva !== pwForm.confirmar) { toast.error('Las contraseñas no coinciden'); return }
    setGuardandoPw(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.nueva })
    if (error) toast.error('Error al cambiar contraseña')
    else { toast.success('Contraseña actualizada'); setPwForm({ nueva: '', confirmar: '' }) }
    setGuardandoPw(false)
  }

  async function enviarReset() {
    const email = perfil?.email
    if (!email) { toast.error('No hay correo en tu perfil'); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    })
    if (error) toast.error('Error al enviar correo')
    else { setResetEnviado(true); toast.success('Correo enviado') }
  }

  // ── Sistema (admin only) ──────────────────────────────────
  const [grados, setGrados]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [modalGrado, setModalGrado]   = useState(false)
  const [modalEliminar, setModalEliminar] = useState(null)
  const [guardando, setGuardando]     = useState(false)
  const [error, setError]             = useState('')
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState({ nombre: '', nivel: 'primaria', orden: '', monto_matricula: '', monto_mensualidad: '' })
  const [yearEscolar, setYearEscolar] = useState(new Date().getFullYear())
  const [guardandoYear, setGuardandoYear] = useState(false)
  const [periodos, setPeriodos] = useState([])

  // Materias por grado
  const [panelMaterias, setPanelMaterias]       = useState(null)  // grado seleccionado
  const [todasMaterias, setTodasMaterias]       = useState([])
  const [materiasGrado, setMateriasGrado]       = useState([])    // ids asignados al grado
  const [guardandoMaterias, setGuardandoMaterias] = useState(false)
  const [buscarMateria, setBuscarMateria]       = useState('')

  const niveles = ['primera_infancia', 'primaria', 'secundaria', 'bachillerato']

  const nivelLabel = {
    primera_infancia: 'Primera Infancia',
    inicial:          'Primera Infancia',
    primaria:         'Primaria',
    secundaria:       'Secundaria',
    bachillerato:     'Bachillerato',
  }

  const nivelColor = NIVEL_COLOR

  useEffect(() => { cargarDatos() }, [])

  async function cargarDatos() {
    setLoading(true)
    const [{ data: gra }, { data: config }, { data: mats }, { data: pers }] = await Promise.all([
      supabase.from('grados').select('*').order('orden', { ascending: true }),
      supabase.from('configuracion').select('valor').eq('clave', 'year_escolar_activo').single(),
      supabase.from('materias').select('*').order('nombre', { ascending: true }),
      supabase.from('periodos_notas').select('*').order('nivel').order('numero'),
    ])
    setGrados(gra || [])
    if (config?.valor) setYearEscolar(parseInt(config.valor))
    setTodasMaterias(mats || [])
    setPeriodos(pers || [])
    setLoading(false)
  }

  async function abrirPanelMaterias(grado) {
    setPanelMaterias(grado)
    setBuscarMateria('')
    const { data } = await supabase
      .from('materia_grado')
      .select('materia_id')
      .eq('grado_id', grado.id)
    setMateriasGrado(data?.map(d => d.materia_id) || [])
  }

  async function guardarMaterias() {
    setGuardandoMaterias(true)

    // Obtener asignaciones actuales
    const { data: actuales } = await supabase
      .from('materia_grado')
      .select('materia_id')
      .eq('grado_id', panelMaterias.id)
    const actualesIds = actuales?.map(d => d.materia_id) || []

    const agregar  = materiasGrado.filter(id => !actualesIds.includes(id))
    const eliminar = actualesIds.filter(id => !materiasGrado.includes(id))

    if (agregar.length > 0) {
      await supabase.from('materia_grado').insert(
        agregar.map(materia_id => ({ grado_id: panelMaterias.id, materia_id }))
      )
    }
    if (eliminar.length > 0) {
      await supabase.from('materia_grado')
        .delete()
        .eq('grado_id', panelMaterias.id)
        .in('materia_id', eliminar)
    }

    toast.success(`Materias de ${panelMaterias.nombre} actualizadas`)
    setGuardandoMaterias(false)
    setPanelMaterias(null)
  }

  function toggleMateria(id) {
    setMateriasGrado(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  async function guardarGrado() {
    if (!form.nombre || !form.nivel || !form.orden) { setError('Nombre, nivel y orden son obligatorios'); return }
    setGuardando(true); setError('')
    const payload = {
      nombre: form.nombre, nivel: form.nivel, orden: parseInt(form.orden),
      monto_matricula:   form.monto_matricula   ? parseFloat(form.monto_matricula)   : null,
      monto_mensualidad: form.monto_mensualidad ? parseFloat(form.monto_mensualidad) : null,
    }
    if (editando) { await supabase.from('grados').update(payload).eq('id', editando.id) }
    else          { await supabase.from('grados').insert([payload]) }
    setModalGrado(false); setEditando(null); resetForm()
    toast.success(editando ? 'Grado actualizado' : 'Grado creado')
    cargarDatos(); setGuardando(false)
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

  const materiasFiltradas = todasMaterias.filter(m =>
    m.nombre.toLowerCase().includes(buscarMateria.toLowerCase())
  )

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Configuración</h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>
          {isAdmin ? 'Perfil personal y configuración del sistema' : 'Tu perfil y seguridad de cuenta'}
        </p>
      </div>

      {/* ── PERFIL PERSONAL (todos los roles) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>

        {/* Datos personales */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', borderTop: '4px solid #5B2D8E' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', marginBottom: 4 }}>Datos personales</div>
          <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500, marginBottom: 18 }}>{perfil?.email}</div>
          <div style={s.field}>
            <label style={s.label}>Nombre</label>
            <input style={s.input} value={perfilForm.nombre} onChange={e => setPerfilForm({ ...perfilForm, nombre: e.target.value })} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Apellido</label>
            <input style={s.input} value={perfilForm.apellido} onChange={e => setPerfilForm({ ...perfilForm, apellido: e.target.value })} />
          </div>
          <button onClick={guardarPerfil} disabled={guardandoPerfil} style={{ ...s.btnPrimary, width: '100%' }}>
            {guardandoPerfil ? 'Guardando...' : 'Guardar datos'}
          </button>
        </div>

        {/* Seguridad */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', borderTop: '4px solid #D4A017' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', marginBottom: 4 }}>Seguridad</div>
          <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500, marginBottom: 18 }}>Cambia tu contraseña o solicita un enlace de restablecimiento</div>
          <div style={s.field}>
            <label style={s.label}>Nueva contraseña</label>
            <input style={s.input} type="password" placeholder="Mínimo 6 caracteres"
              value={pwForm.nueva} onChange={e => setPwForm({ ...pwForm, nueva: e.target.value })} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Confirmar contraseña</label>
            <input style={s.input} type="password" placeholder="Repite la nueva contraseña"
              value={pwForm.confirmar} onChange={e => setPwForm({ ...pwForm, confirmar: e.target.value })} />
          </div>
          <button onClick={cambiarPassword} disabled={guardandoPw} style={{ ...s.btnPrimary, width: '100%', marginBottom: 10 }}>
            {guardandoPw ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 4 }}>
            {resetEnviado ? (
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, textAlign: 'center', padding: '8px 0' }}>
                ✓ Revisa tu correo — te enviamos el enlace
              </div>
            ) : (
              <button onClick={enviarReset}
                style={{ width: '100%', padding: '9px 0', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fafafa', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Enviarme enlace de restablecimiento
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CONFIGURACIÓN DEL SISTEMA (solo admin) ── */}
      {isAdmin && (<>

      {/* Períodos de notas */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)', marginBottom: 20, borderTop: '4px solid #c2410c' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#3d1f61', marginBottom: 4 }}>Fechas límite de notas</div>
        <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500, marginBottom: 20 }}>Configura hasta qué fecha pueden ingresar notas los docentes por período</div>
        {['general','bachillerato'].map(nivel => (
          <div key={nivel} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              {nivel === 'general' ? 'Inicial → Noveno (Trimestres)' : 'Bachillerato (Bimestres)'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {Array.from({ length: nivel === 'bachillerato' ? 4 : 3 }, (_, i) => {
                const num = i + 1
                const p = periodos.find(p => p.nivel === nivel && p.numero === num)
                return (
                  <div key={num}>
                    <label style={s.label}>{nivel === 'bachillerato' ? `Bimestre ${num}` : `Trimestre ${num}`}</label>
                    <input type="datetime-local" style={s.input}
                      defaultValue={p?.fecha_limite ? new Date(p.fecha_limite).toISOString().slice(0,16) : ''}
                      onBlur={async e => {
                        const val = e.target.value
                        if (!val) return
                        const ts = new Date(val).toISOString()
                        await supabase.from('periodos_notas').upsert({
                          año_escolar: yearEscolar, nivel, numero: num,
                          fecha_limite: ts, creado_por: perfil?.id
                        }, { onConflict: 'año_escolar,nivel,numero' })
                        toast.success(`Fecha límite ${nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'} ${num} guardada`)
                        cargarDatos()
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
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
          <input style={{ ...s.input, maxWidth: 130, fontWeight: 800, fontSize: 18, textAlign: 'center', color: '#3d1f61' }}
            type="number" value={yearEscolar} onChange={e => setYearEscolar(parseInt(e.target.value))} />
          <button onClick={async () => {
            setGuardandoYear(true)
            await supabase.from('configuracion').update({ valor: yearEscolar.toString() }).eq('clave', 'year_escolar_activo')
            toast.success('Año escolar actualizado'); setGuardandoYear(false)
          }} style={s.btnPrimary} disabled={guardandoYear}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IcoSave />{guardandoYear ? 'Guardado' : 'Guardar'}</span>
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
          <button onClick={() => { resetForm(); setEditando(null); setModalGrado(true) }} style={s.btnPrimary}>+ Nuevo grado</button>
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
                  <td style={s.td}><span style={{ fontWeight: 700, color: '#b0a8c0', fontSize: 12 }}>#{g.orden}</span></td>
                  <td style={s.td}><span style={{ fontWeight: 700, color: '#3d1f61', fontSize: 13 }}>{g.nombre}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: nivelColor[g.nivel]?.bg || '#f3f4f6', color: nivelColor[g.nivel]?.color || '#6b7280' }}>
                      {nivelLabel[g.nivel] || g.nivel}
                    </span>
                  </td>
                  <td style={s.td}><span style={{ fontSize: 13, fontWeight: 700, color: g.monto_matricula ? '#5B2D8E' : '#d1d5db' }}>{g.monto_matricula ? `$${parseFloat(g.monto_matricula).toFixed(2)}` : '—'}</span></td>
                  <td style={s.td}><span style={{ fontSize: 13, fontWeight: 700, color: g.monto_mensualidad ? '#5B2D8E' : '#d1d5db' }}>{g.monto_mensualidad ? `$${parseFloat(g.monto_mensualidad).toFixed(2)}` : '—'}</span></td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => abrirPanelMaterias(g)} style={s.btnMaterias}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IcoBook /> Materias</span>
                      </button>
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

      {/* Panel lateral — Materias del grado */}
      {panelMaterias && (
        <>
          {/* Overlay */}
          <div onClick={() => setPanelMaterias(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }} />

          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
            background: '#fff', zIndex: 100, display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(61,31,97,0.18)',
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          }}>
            {/* Header del panel */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f3eeff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#3d1f61', letterSpacing: '-0.3px' }}>
                    {panelMaterias.nombre}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ ...s.badge, background: nivelColor[panelMaterias.nivel]?.bg, color: nivelColor[panelMaterias.nivel]?.color, fontSize: 11 }}>
                      {nivelLabel[panelMaterias.nivel] || panelMaterias.nivel}
                    </span>
                    <span style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 600 }}>
                      {materiasGrado.length} materia{materiasGrado.length !== 1 ? 's' : ''} asignada{materiasGrado.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <button onClick={() => setPanelMaterias(null)}
                  style={{ background: '#f3eeff', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#5B2D8E' }}>
                  <IcoClose />
                </button>
              </div>

              {/* Buscador */}
              <input
                value={buscarMateria}
                onChange={e => setBuscarMateria(e.target.value)}
                placeholder="Buscar materia..."
                style={{ ...s.input, marginTop: 14, fontSize: 13 }}
              />
            </div>

            {/* Lista de materias con checkboxes */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
              {materiasFiltradas.length === 0 ? (
                <p style={{ color: '#b0a8c0', fontSize: 13, textAlign: 'center', padding: 24 }}>Sin resultados</p>
              ) : (
                materiasFiltradas.map(m => {
                  const checked = materiasGrado.includes(m.id)
                  return (
                    <div key={m.id}
                      onClick={() => toggleMateria(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                        background: checked ? '#f3eeff' : 'transparent',
                        marginBottom: 4, transition: 'background 0.12s',
                        border: checked ? '1px solid #d8c8f0' : '1px solid transparent',
                      }}>
                      {/* Checkbox visual */}
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: checked ? 'linear-gradient(135deg, #5B2D8E, #3d1f61)' : '#fff',
                        border: checked ? 'none' : '2px solid #d1d5db',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checked && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? '#3d1f61' : '#374151' }}>
                        {m.nombre}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer con acciones */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f3eeff', display: 'flex', gap: 10 }}>
              <button onClick={() => setPanelMaterias(null)} style={{ ...s.btnSecondary, flex: 1 }}>Cancelar</button>
              <button onClick={guardarMaterias} style={{ ...s.btnPrimary, flex: 2 }} disabled={guardandoMaterias}>
                {guardandoMaterias ? 'Guardando...' : `Guardar ${materiasGrado.length} materias`}
              </button>
            </div>
          </div>
        </>
      )}

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

      </>)} {/* fin isAdmin */}
      {(isAdmin || perfil?.rol === 'registro_academico' || perfil?.rol === 'docente') && (
  <GruposIngles />
)}
    </div>
  )
}

const s = {
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tr:           { borderTop: '1px solid #f3eeff' },
  td:           { padding: '12px 18px', fontSize: 13, color: '#333' },
  badge:        { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary:   { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnEditar:    { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f3eeff', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnMaterias:  { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#e0f7f6', color: '#0e9490', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnEliminar:  { padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox:     { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalTitle:   { color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.3px' },
  grid2:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field:        { marginBottom: 14 },
  label:        { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input:        { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}