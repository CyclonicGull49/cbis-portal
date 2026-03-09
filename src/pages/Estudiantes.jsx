import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function FichaTabs({ estudiante, onUpdate, onDelete, esRecepcion }) {
  const [tab, setTab] = useState(0)
  const [modalCorreo, setModalCorreo] = useState(false)
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [modalEliminar, setModalEliminar] = useState(false)
  const [verificandoEliminar, setVerificandoEliminar] = useState(false)
  const [tienePagos, setTienePagos] = useState(false)

  const tabs = esRecepcion
    ? ['General', 'Familia', 'Salud']
    : ['General', 'Familia', 'Salud', 'Acciones']

  const Dato = ({ label, val }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: val ? '#222' : '#ccc', fontWeight: val ? 600 : 400 }}>{val || '—'}</div>
    </div>
  )

  async function verificarYEliminar() {
  setVerificandoEliminar(true)
  const { data: cobrosEst } = await supabase.from('cobros').select('id').eq('estudiante_id', estudiante.id)
  const cobrosIds = cobrosEst?.map(c => c.id) || []

  if (cobrosIds.length > 0) {
    const { data: pagos } = await supabase.from('pagos')
      .select('id')
      .in('cobro_id', cobrosIds)
      .neq('anulado', true)
    
    if (pagos?.length > 0) {
      setTienePagos(true)
      setVerificandoEliminar(false)
      return
    }
  }
  setTienePagos(false)
  setModalEliminar(true)
  setVerificandoEliminar(false)
}

  async function ejecutarEliminar() {
  const { data: cobrosEst } = await supabase.from('cobros').select('id').eq('estudiante_id', estudiante.id)
  const cobrosIds = cobrosEst?.map(c => c.id) || []
  
  if (cobrosIds.length > 0) {
    await supabase.from('pagos').delete().in('cobro_id', cobrosIds)
    await supabase.from('cobros').delete().eq('estudiante_id', estudiante.id)
  }
  await supabase.from('estudiantes').delete().eq('id', estudiante.id)
  toast.success('Estudiante eliminado')
  onDelete()
}

  return (
    <div>
      {/* Tab nav */}
      <div style={{ display: 'flex', borderBottom: '2px solid #f3eeff', marginBottom: 20 }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === i ? 800 : 500,
            color: tab === i ? '#5B2D8E' : '#aaa',
            borderBottom: tab === i ? '2px solid #5B2D8E' : '2px solid transparent',
            marginBottom: -2
          }}>{t}</button>
        ))}
      </div>

      {/* Tab General */}
      {tab === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
          <Dato label="NIE" val={estudiante.nie} />
          <Dato label="Grado" val={estudiante.grados?.nombre} />
          <Dato label="Género" val={estudiante.genero} />
          <Dato label="Fecha de nacimiento" val={estudiante.fecha_nacimiento ? new Date(estudiante.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-SV') : null} />
          <Dato label="Nacionalidad" val={estudiante.nacionalidad} />
          <Dato label="Lugar de nacimiento" val={estudiante.lugar_nacimiento} />
          <Dato label="Partida de nacimiento" val={estudiante.partida_nacimiento} />
          <Dato label="Folio" val={estudiante.folio_partida} />
          <Dato label="Nº de libro" val={estudiante.libro_partida} />
          <Dato label="Tipo de ingreso" val={estudiante.tipo_ingreso} />
          <Dato label="Correo institucional" val={estudiante.correo_institucional} />
          <Dato label="Institución de procedencia" val={estudiante.institucion_procedencia} />
          <Dato label="Dirección" val={estudiante.direccion} />
          <Dato label="Municipio" val={estudiante.municipio} />
          <Dato label="Departamento" val={estudiante.departamento} />
          <Dato label="Zona" val={estudiante.zona} />
          <Dato label="Registrado" val={estudiante.creado_en ? new Date(estudiante.creado_en).toLocaleDateString('es-SV') : null} />
        </div>
      )}

      {/* Tab Familia */}
      {tab === 1 && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#3d1f61', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f3eeff' }}>Padre</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
              <Dato label="Nombre" val={estudiante.nombre_padre} />
              <Dato label="DUI" val={estudiante.dui_padre} />
              <Dato label="Teléfono" val={estudiante.telefono_padre} />
              <Dato label="Correo" val={estudiante.correo_padre} />
              <Dato label="Lugar de trabajo" val={estudiante.trabajo_padre} />
              <Dato label="Dirección" val={estudiante.direccion_padre} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#3d1f61', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f3eeff' }}>Madre</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
              <Dato label="Nombre" val={estudiante.nombre_madre} />
              <Dato label="DUI" val={estudiante.dui_madre} />
              <Dato label="Teléfono" val={estudiante.telefono_madre} />
              <Dato label="Correo" val={estudiante.correo_madre} />
              <Dato label="Lugar de trabajo" val={estudiante.trabajo_madre} />
              <Dato label="Dirección" val={estudiante.direccion_madre} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#3d1f61', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f3eeff' }}>Tutor/Encargado</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
              <Dato label="Nombre" val={estudiante.nombre_tutor} />
              <Dato label="DUI" val={estudiante.dui_tutor} />
              <Dato label="Teléfono" val={estudiante.telefono_tutor} />
              <Dato label="Correo" val={estudiante.correo_tutor} />
              <Dato label="Lugar de trabajo" val={estudiante.trabajo_tutor} />
              <Dato label="Dirección" val={estudiante.direccion_tutor} />
            </div>
          </div>
          <div style={{ background: '#fff4f0', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#E8573A', marginBottom: 8 }}>Contacto de emergencia</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
              <Dato label="Persona" val={estudiante.contacto_emergencia} />
              <Dato label="Teléfono" val={estudiante.telefono_emergencia} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Dato label="Convivencia familiar" val={estudiante.convivencia} />
            <Dato label="Iglesia" val={estudiante.iglesia} />
          </div>
        </div>
      )}

      {/* Tab Salud */}
      {tab === 2 && (
        <div>
          <div style={{ background: '#faf8ff', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Enfermedades o alergias</div>
            <div style={{ fontSize: 14, color: estudiante.enfermedades_alergias ? '#222' : '#ccc' }}>
              {estudiante.enfermedades_alergias || 'Ninguna registrada'}
            </div>
          </div>
          <div style={{ background: '#faf8ff', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Medicamento prescrito permanente</div>
            <div style={{ fontSize: 14, color: estudiante.medicamento_permanente ? '#222' : '#ccc' }}>
              {estudiante.medicamento_permanente || 'Ninguno registrado'}
            </div>
          </div>
        </div>
      )}

      {/* Tab Acciones */}
      {tab === 3 && !esRecepcion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => {
              setNuevoCorreo(estudiante.correo_institucional || '')
              setModalCorreo(true)
            }}
            style={{ padding: '12px 18px', borderRadius: 10, border: '1.5px solid #e0d6f0', background: '#faf8ff', color: '#5B2D8E', fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
            Editar correo institucional
          </button>
          <button
            onClick={async () => {
              const nuevoEstado = estudiante.estado === 'activo' ? 'inactivo' : 'activo'
              await supabase.from('estudiantes').update({ estado: nuevoEstado }).eq('id', estudiante.id)
              toast.success(`Estudiante ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`)
              onUpdate({ ...estudiante, estado: nuevoEstado })
            }}
            style={{
              padding: '12px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, textAlign: 'left',
              background: estudiante.estado === 'activo' ? '#fee2e2' : '#dcfce7',
              color: estudiante.estado === 'activo' ? '#dc2626' : '#16a34a'
            }}>
            {estudiante.estado === 'activo' ? 'Desactivar estudiante' : 'Activar estudiante'}
          </button>
          <button
            onClick={verificarYEliminar}
            disabled={verificandoEliminar}
            style={{ padding: '12px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: '#dc2626', color: '#fff', textAlign: 'left' }}>
            {verificandoEliminar ? 'Verificando...' : 'Eliminar estudiante permanentemente'}
          </button>

          {tienePagos && (
            <div style={{ background: '#fef9c3', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#854d0e', lineHeight: 1.6 }}>
              <b>{estudiante.nombre}</b> tiene historial de pagos registrado. Para eliminar un estudiante con historial, primero cámbialo a "Inactivo".
            </div>
          )}
        </div>
      )}

      {/* Modal editar correo */}
      {modalCorreo && (
        <div style={s.modalBg} onClick={() => setModalCorreo(false)}>
          <div style={{ ...s.modalBox, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Editar correo institucional</h2>
            <div style={s.field}>
              <label style={s.label}>Correo institucional</label>
              <input style={s.input} type="email" value={nuevoCorreo}
                onChange={e => setNuevoCorreo(e.target.value)}
                placeholder="estudiante@cbis.edu.sv" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalCorreo(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={async () => {
                await supabase.from('estudiantes').update({ correo_institucional: nuevoCorreo }).eq('id', estudiante.id)
                toast.success('Correo actualizado')
                onUpdate({ ...estudiante, correo_institucional: nuevoCorreo })
                setModalCorreo(false)
              }} style={s.btnPrimary}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {modalEliminar && (
        <div style={s.modalBg} onClick={() => setModalEliminar(false)}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Eliminar estudiante</h2>
            <p style={{ color: '#555', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Eliminar permanentemente a <b>{estudiante.nombre} {estudiante.apellido}</b>?<br/>
              Esta Acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setModalEliminar(false)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={ejecutarEliminar} style={{ ...s.btnPrimary, background: '#dc2626' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Estudiantes() {
  const { perfil } = useAuth()
  const esRecepcion = perfil?.rol === 'recepcion'
  const [estudianteDetalle, setEstudianteDetalle] = useState(null)
  const [estudiantes, setEstudiantes] = useState([])
  const [grados, setGrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState({
    nombre: '', apellido: '', fecha_nacimiento: '',
    genero: '', nie: '', correo_institucional: '',
    direccion: '', grado_id: '', tipo_ingreso: 'antiguo'
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { cargarDatos() }, [])

  async function cambiarEstado(e, estudiante) {
    e.stopPropagation()
    const nuevoEstado = estudiante.estado === 'activo' ? 'inactivo' : 'activo'
    await supabase.from('estudiantes')
      .update({ estado: nuevoEstado })
      .eq('id', estudiante.id)
    toast.success(`Estudiante ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`)
    cargarDatos()
  }

  async function cargarDatos() {
    setLoading(true)
    const [{ data: est }, { data: gra }] = await Promise.all([
      supabase.from('estudiantes').select(`*, grados(nombre)`).order('apellido'),
      supabase.from('grados').select('*').order('id')
    ])
    setEstudiantes(est || [])
    setGrados(gra || [])
    setLoading(false)
  }

  async function guardarEstudiante() {
    if (!form.nombre || !form.apellido || !form.grado_id || !form.genero) {
      setError('Nombres, apellidos, género y grado son obligatorios')
      return
    }
    setGuardando(true)
    setError('')
    const { error } = await supabase.from('estudiantes').insert([{
      nombre: form.nombre,
      apellido: form.apellido,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero,
      nie: form.nie || null,
      correo_institucional: form.correo_institucional || null,
      direccion: form.direccion || null,
      grado_id: parseInt(form.grado_id),
      tipo_ingreso: form.tipo_ingreso,
    }])
    if (error) {
      setError('Error al guardar: ' + error.message)
    } else {
      setModalAbierto(false)
      resetForm()
      toast.success('Estudiante registrado exitosamente')
      cargarDatos()
    }
    setGuardando(false)
  }

  function resetForm() {
    setForm({
      nombre: '', apellido: '', fecha_nacimiento: '',
      genero: '', nie: '', correo_institucional: '',
      direccion: '', grado_id: '', tipo_ingreso: 'antiguo'
    })
    setError('')
  }

  const filtrados = estudiantes.filter(e =>
    `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.grados?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.nie && e.nie.includes(busqueda))
  )

  function descargarPlantilla() {
    const headers = ['nombres', 'apellidos', 'fecha_nacimiento', 'genero', 'nie', 'correo', 'direccion', 'grado']
    const ejemplo = ['Camilo Aryéh', 'Velis Figueroa', '2015-03-10', 'masculino', '12345678', 'camilo@cbis.edu.sv', 'Sonsonate, El Salvador', 'Sección 4']
    const csv = [headers.join(','), ejemplo.join(',')].join('\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_estudiantes_cbis.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function normalizar(str) {
    return str?.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim() || ''
  }

  async function importarCSV(ev) {
    const file = ev.target.files[0]
    if (!file) return

    const text = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result)
      reader.readAsText(file, 'UTF-8')
    })
    const lineas = text.trim().split('\n')
    const headers = lineas[0].split(',').map(h => h.trim().toLowerCase())
    const filas = lineas.slice(1)

    if (filas.length === 0) {
      toast.error('El archivo está vacío')
      ev.target.value = ''
      return
    }

    // Parsear filas
    const datos = filas.map(fila => {
      const valores = fila.split(',').map(v => v.trim())
      const obj = {}
      headers.forEach((h, i) => { obj[h] = valores[i] || '' })
      return obj
    })

    // Validar NIEs en el CSV (duplicados entre sí)
    const niesCSV = datos.map(e => e.nie)
    const duplicadosInternos = niesCSV.filter((nie, i) => niesCSV.indexOf(nie) !== i)
    if (duplicadosInternos.length > 0) {
      toast.error(`NIEs duplicados en archivo: ${[...new Set(duplicadosInternos)].join(', ')}`)
      ev.target.value = ''
      return
    }

    // Validar NIEs contra la base de datos
    const { data: existentes } = await supabase
      .from('estudiantes')
      .select('nie')
      .in('nie', niesCSV)

    if (existentes && existentes.length > 0) {
      const niesExistentes = existentes.map(e => e.nie).join(', ')
      toast.error(`NIE ya existe en el sistema: ${niesExistentes}`)
      ev.target.value = ''
      return
    }

    // Buscar IDs de grados
    const { data: gds } = await supabase.from('grados').select('id, nombre')
    const gradoMap = {}
    gds?.forEach(g => { gradoMap[normalizar(g.nombre)] = g.id })

    // Validar que todos los grados existen
    const gradosInvalidos = []
    for (const est of datos) {
      const gradoNombre = normalizar(est.grado)
      if (!gradoMap[gradoNombre]) gradosInvalidos.push(est.grado)
    }
    if (gradosInvalidos.length > 0) {
      toast.error(`Grados no encontrados: ${[...new Set(gradosInvalidos)].join(', ')}`)
      ev.target.value = ''
      return
    }

    // Insertar todos
    const registros = datos.map(est => ({
      nombre: est.nombres,
      apellido: est.apellidos,
      fecha_nacimiento: est.fecha_nacimiento || null,
      genero: est.genero,
      nie: est.nie,
      correo_institucional: est.correo || null,
      direccion: est.direccion || null,
      grado_id: gradoMap[normalizar(est.grado)],
      estado: 'activo',
      tipo_ingreso: 'antiguo'
    }))

    const { error } = await supabase.from('estudiantes').insert(registros)

    if (error) {
      toast.error(`Error al importar: ${error.message}`)
    } else {
      toast.success(`${registros.length} estudiante(s) importado(s) exitosamente`)
      cargarDatos()
    }
    ev.target.value = ''
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: '#5B2D8E', fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Estudiantes</h1>
          <p style={{ color: '#888', fontSize: 13 }}>{estudiantes.length} estudiantes registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!esRecepcion && (
            <>
              <button onClick={descargarPlantilla} style={{ ...s.btnSecondary, fontSize: 13 }}>
                Descargar plantilla
              </button>
              <label style={{ ...s.btnSecondary, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                Importar CSV
                <input type="file" accept=".csv" onChange={importarCSV} style={{ display: 'none' }} />
              </label>
            </>
          )}

        </div>
      </div>

      {/* Buscador */}
      <input
        style={s.search}
        placeholder="Buscar por nombre, grado o NIE..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      {/* Tabla */}
      <div style={s.card}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>Cargando...</p>
        ) : filtrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
            {busqueda ? 'No se encontraron resultados' : 'No hay estudiantes registrados aún'}
          </p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Nombre', 'Apellido', 'Grado', 'NIE', 'Género', 'Estado'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(e => (
                <tr key={e.id} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => setEstudianteDetalle(e)}>
                  <td style={s.td}>{e.nombre}</td>
                  <td style={s.td}>{e.apellido}</td>
                  <td style={s.td}>
                    <span style={s.gradoBadge}>{e.grados?.nombre || '—'}</span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {e.nie || <span style={{ color: '#ccc' }}>Sin NIE</span>}
                    </span>
                  </td>
                  <td style={s.td}>{e.genero || '—'}</td>
                  <td style={s.td}>
                    <span
                      onClick={(ev) => cambiarEstado(ev, e)}
                      title="Clic para cambiar estado"
                      style={{
                        ...s.estadoBadge,
                        background: e.estado === 'activo' ? '#dcfce7' : '#fee2e2',
                        color: e.estado === 'activo' ? '#16a34a' : '#dc2626',
                        cursor: 'pointer',
                      }}
                    >
                      {e.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal nuevo estudiante */}
      {modalAbierto && (
        <div style={s.modalBg} onClick={() => { setModalAbierto(false); resetForm() }}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Nuevo Estudiante</h2>

            {/* Tipo de ingreso */}
            <div style={s.field}>
              <label style={s.label}>Tipo de ingreso *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['antiguo', 'nuevo'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm({ ...form, tipo_ingreso: tipo })}
                    style={{
                      ...s.tipoBtnBase,
                      background: form.tipo_ingreso === tipo ? '#5B2D8E' : '#f8faff',
                      color: form.tipo_ingreso === tipo ? '#fff' : '#555',
                      border: form.tipo_ingreso === tipo ? 'none' : '1.5px solid #dde3ee',
                    }}
                  >
                    {tipo === 'antiguo' ? 'Antiguo ingreso' : 'Nuevo Ingreso'}
                  </button>
                ))}
              </div>
              {form.tipo_ingreso === 'nuevo' && (
                <p style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
                  * El NIE puede dejarse vacío si el estudiante aún no lo tiene asignado
                </p>
              )}
            </div>

            {/* Nombres y apellidos */}
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Nombres *</label>
                <input style={s.input} value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombres completos"/>
              </div>
              <div style={s.field}>
                <label style={s.label}>Apellidos *</label>
                <input style={s.input} value={form.apellido}
                  onChange={e => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Apellidos completos"/>
              </div>
            </div>

            {/* Fecha y género */}
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Fecha de nacimiento</label>
                <input style={s.input} type="date" value={form.fecha_nacimiento}
                  onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}/>
              </div>
              <div style={s.field}>
                <label style={s.label}>Género *</label>
                <select style={s.input} value={form.genero}
                  onChange={e => setForm({ ...form, genero: e.target.value })}>
                  <option value="">— Seleccione —</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </div>
            </div>

            {/* NIE */}
            <div style={s.field}>
              <label style={s.label}>NIE (opcional)</label>
              <input style={s.input} value={form.nie}
                onChange={e => setForm({ ...form, nie: e.target.value })}
                placeholder="Ej: 12345678-1"/>
            </div>

            {/* Correo institucional */}
            <div style={s.field}>
              <label style={s.label}>Correo institucional (opcional)</label>
              <input style={s.input} type="email" value={form.correo_institucional}
                onChange={e => setForm({ ...form, correo_institucional: e.target.value })}
                placeholder="estudiante@cbis.edu.sv"/>
            </div>

            {/* Dirección */}
            <div style={s.field}>
              <label style={s.label}>Dirección</label>
              <input style={s.input} value={form.direccion}
                onChange={e => setForm({ ...form, direccion: e.target.value })}
                placeholder="Dirección de residencia"/>
            </div>

            {/* Grado */}
            <div style={s.field}>
              <label style={s.label}>Grado *</label>
              <select style={s.input} value={form.grado_id}
                onChange={e => setForm({ ...form, grado_id: e.target.value })}>
                <option value="">— Seleccione un grado —</option>
                {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalAbierto(false); resetForm() }} style={s.btnSecondary}>
                Cancelar
              </button>
              <button onClick={guardarEstudiante} style={s.btnPrimary} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle estudiante */}
      {estudianteDetalle && (
        <div style={s.modalBg} onClick={() => setEstudianteDetalle(null)}>
          <div style={{ ...s.modalBox, maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 900, fontSize: 20, flexShrink: 0
                }}>
                  {estudianteDetalle.nombre?.charAt(0)}{estudianteDetalle.apellido?.charAt(0)}
                </div>
                <div>
                  <h2 style={{ color: '#3d1f61', fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
                    {estudianteDetalle.nombre} {estudianteDetalle.apellido}
                  </h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: estudianteDetalle.estado === 'activo' ? '#dcfce7' : '#fee2e2',
                      color: estudianteDetalle.estado === 'activo' ? '#16a34a' : '#dc2626'
                    }}>
                      {estudianteDetalle.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                    <span style={{ fontSize: 12, color: '#888' }}>{estudianteDetalle.grados?.nombre}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setEstudianteDetalle(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>&#10005;</button>
            </div>

            {/* Pestañas */}
            <FichaTabs
              estudiante={estudianteDetalle}
              esRecepcion={esRecepcion}
              onUpdate={(updated) => { setEstudianteDetalle(updated); cargarDatos() }}
              onDelete={() => { setEstudianteDetalle(null); cargarDatos() }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  search: { width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', fontSize: 14, marginBottom: 16, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #f0f4ff' },
  tr: { borderBottom: '1px solid #f8faff' },
  td: { padding: '12px 16px', fontSize: 14, color: '#333' },
  gradoBadge: { background: '#eff6ff', color: '#5B2D8E', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  estadoBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #dde3ee', background: '#fff', color: '#555', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { color: '#5B2D8E', fontSize: 17, fontWeight: 800, marginBottom: 20 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #dde3ee', fontSize: 14, background: '#f8faff', color: '#222', boxSizing: 'border-box' },
  tipoBtnBase: { padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13 },
}
