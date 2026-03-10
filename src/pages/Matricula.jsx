import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useYearEscolar } from '../hooks/useYearEscolar'

const PURPLE = '#5B2D8E'
const PURPLE_DARK = '#3d1f61'

const camposVacios = {
  // Datos del alumno
  nombre: '', apellido: '', nie: '', genero: '', fecha_nacimiento: '',
  nacionalidad: '', lugar_nacimiento: '', partida_nacimiento: '',
  folio_partida: '', libro_partida: '', grado_id: '',
  estudio_parvularia: false, institucion_procedencia: '', diplomado_opcion: '',
  // Residencia
  direccion: '', municipio: '', departamento: '', zona: '',
  // Situación familiar
  convivencia: '',
  // Padre
  nombre_padre: '', dui_padre: '', trabajo_padre: '',
  direccion_padre: '', telefono_padre: '', correo_padre: '',
  // Madre
  nombre_madre: '', dui_madre: '', trabajo_madre: '',
  direccion_madre: '', telefono_madre: '', correo_madre: '',
  // Tutor
  nombre_tutor: '', dui_tutor: '', trabajo_tutor: '',
  direccion_tutor: '', telefono_tutor: '', correo_tutor: '',
  // Emergencia
  iglesia: '', contacto_emergencia: '', telefono_emergencia: '',
  enfermedades_alergias: '', medicamento_permanente: '',
}

export default function Matricula() {
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState(camposVacios)
  const [grados, setGrados] = useState([])
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')
  const yearEscolar = useYearEscolar()

  useEffect(() => {
    supabase.from('grados').select('id, nombre').order('orden').then(({ data }) => setGrados(data || []))
  }, [])

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function guardar() {
  setLoading(true)
  setError('')

  // Validar NIE único
  if (form.nie) {
    const { data: existe } = await supabase.from('estudiantes').select('id').eq('nie', form.nie).single()
    if (existe) {
      setError('❌ El NIE ingresado ya existe en el sistema.')
      setLoading(false)
      return
    }
  }

  // Obtener grado con precios
  const { data: grado } = await supabase
    .from('grados')
    .select('id, nombre, nivel, monto_matricula, monto_mensualidad')
    .eq('id', form.grado_id)
    .single()

  if (!grado) {
    setError('❌ Error al obtener información del grado.')
    setLoading(false)
    return
  }

  // Insertar estudiante
  const { data: estudiante, error: errEst } = await supabase
    .from('estudiantes')
    .insert({
      ...form,
      tipo_ingreso: 'nuevo',
      estado: 'activo',
      year_escolar: yearEscolar,
      grado_id: form.grado_id || null,
    })
    .select()
    .single()

  if (errEst) {
    setError(`❌ Error: ${errEst.message}`)
    setLoading(false)
    return
  }

  // Determinar conceptos según nivel
  const esBachillerato = grado.nivel === 'bachillerato'
  const conceptoMatriculaId = esBachillerato ? 21 : 20
  const conceptoMensualidadId = esBachillerato ? 24 : grado.nivel === 'secundaria' ? 23 : 22

  const hoy = new Date()
  const año = yearEscolar
  const cobros = []

  // Cobro de matrícula
  cobros.push({
    estudiante_id: estudiante.id,
    concepto_id: conceptoMatriculaId,
    monto: grado.monto_matricula,
    mes: 'Enero',
    year_escolar: año,
    estado: 'pendiente',
    fecha_vencimiento: new Date(año, 0, 10).toISOString().split('T')[0],
  })

  // 11 mensualidades — enero a noviembre
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre']

  meses.forEach((mes, i) => {
    cobros.push({
      estudiante_id: estudiante.id,
      concepto_id: conceptoMensualidadId,
      monto: grado.monto_mensualidad,
      mes,
      year_escolar: año,
      estado: 'pendiente',
      fecha_vencimiento: new Date(año, i, 10).toISOString().split('T')[0],
    })
  })

  const { error: errCobros } = await supabase.from('cobros').insert(cobros)

  if (errCobros) {
    setError(`❌ Estudiante registrado pero error al generar cobros: ${errCobros.message}`)
    setLoading(false)
    return
  }

  setExito(true)
  setLoading(false)
}

  const pasos = ['Datos del Alumno', 'Residencia y Familia', 'Padre y Madre', 'Emergencia y Salud']

  if (exito) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ color: PURPLE_DARK, fontSize: 22, fontWeight: 900, marginBottom: 8 }}>¡Matrícula registrada!</h2>
      <p style={{ color: '#888', marginBottom: 24 }}>{form.nombre} {form.apellido} ha sido matriculado exitosamente.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => { setForm(camposVacios); setPaso(1); setExito(false) }}
          style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: PURPLE, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          + Nueva matrícula
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: PURPLE_DARK, fontSize: 22, fontWeight: 900, marginBottom: 4 }}>📋 Matrícula — Nuevo Ingreso ${yearEscolar}</h1>
        <p style={{ color: '#888', fontSize: 13 }}>Complete todos los campos de la ficha de registro académico</p>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(91,45,142,0.08)' }}>
        {pasos.map((p, i) => {
          const num = i + 1
          const activo = paso === num
          const completo = paso > num
          return (
            <div key={i} onClick={() => paso > num && setPaso(num)} style={{
              flex: 1, padding: '14px 8px', textAlign: 'center',
              background: activo ? PURPLE : completo ? '#f3eeff' : '#fff',
              color: activo ? '#fff' : completo ? PURPLE : '#aaa',
              fontWeight: activo ? 800 : 600, fontSize: 12,
              cursor: completo ? 'pointer' : 'default',
              borderRight: i < 3 ? '1px solid #f0e8ff' : 'none',
              transition: 'all 0.2s'
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{completo ? '✅' : `${num}`}</div>
              {p}
            </div>
          )
        })}
      </div>

      {/* Formulario */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 16px rgba(91,45,142,0.08)' }}>

        {/* PASO 1 - Datos del alumno */}
        {paso === 1 && (
          <div>
            <h3 style={tituloSeccion}>👤 Datos del Alumno</h3>
            <div style={grid2}>
              <Campo label="Nombre(s) *" required><input style={inp} value={form.nombre} onChange={e => set('nombre', e.target.value)} /></Campo>
              <Campo label="Apellido(s) *" required><input style={inp} value={form.apellido} onChange={e => set('apellido', e.target.value)} /></Campo>
              <Campo label="NIE"><input style={inp} value={form.nie} onChange={e => set('nie', e.target.value)} placeholder="Número de Identificación Escolar" /></Campo>
              <Campo label="Género *">
                <select style={inp} value={form.genero} onChange={e => set('genero', e.target.value)}>
                  <option value="">— Seleccione —</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </Campo>
              <Campo label="Fecha de nacimiento"><input style={inp} type="date" value={form.fecha_nacimiento} onChange={e => set('fecha_nacimiento', e.target.value)} /></Campo>
              <Campo label="Nacionalidad"><input style={inp} value={form.nacionalidad} onChange={e => set('nacionalidad', e.target.value)} placeholder="Ej: Salvadoreña" /></Campo>
              <Campo label="Lugar de nacimiento"><input style={inp} value={form.lugar_nacimiento} onChange={e => set('lugar_nacimiento', e.target.value)} /></Campo>
              <Campo label="Nº Partida de nacimiento"><input style={inp} value={form.partida_nacimiento} onChange={e => set('partida_nacimiento', e.target.value)} /></Campo>
              <Campo label="Folio"><input style={inp} value={form.folio_partida} onChange={e => set('folio_partida', e.target.value)} /></Campo>
              <Campo label="Nº de Libro"><input style={inp} value={form.libro_partida} onChange={e => set('libro_partida', e.target.value)} /></Campo>
              <Campo label="Grado a cursar *">
                <select style={inp} value={form.grado_id} onChange={e => set('grado_id', e.target.value)}>
                  <option value="">— Seleccione —</option>
                  {grados.filter(g => !g.nombre.includes('2do Bachillerato') && !g.nombre.includes('2 Bach')).map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="¿Estudió Parvularia?">
                <select style={inp} value={form.estudio_parvularia} onChange={e => set('estudio_parvularia', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Sí</option>
                </select>
              </Campo>
            </div>
            <Campo label="Institución de procedencia"><input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={form.institucion_procedencia} onChange={e => set('institucion_procedencia', e.target.value)} /></Campo>
          </div>
        )}

        {/* PASO 2 - Residencia y familia */}
        {paso === 2 && (
          <div>
            <h3 style={tituloSeccion}>🏠 Datos de Residencia</h3>
            <Campo label="Dirección"><input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={form.direccion} onChange={e => set('direccion', e.target.value)} /></Campo>
            <div style={grid2}>
              <Campo label="Municipio"><input style={inp} value={form.municipio} onChange={e => set('municipio', e.target.value)} /></Campo>
              <Campo label="Departamento"><input style={inp} value={form.departamento} onChange={e => set('departamento', e.target.value)} /></Campo>
              <Campo label="Zona">
                <select style={inp} value={form.zona} onChange={e => set('zona', e.target.value)}>
                  <option value="">— Seleccione —</option>
                  <option value="urbana">Urbana</option>
                  <option value="rural">Rural</option>
                </select>
              </Campo>
              <Campo label="Convivencia familiar">
                <select style={inp} value={form.convivencia} onChange={e => set('convivencia', e.target.value)}>
                  <option value="">— Seleccione —</option>
                  <option value="padre">Padre</option>
                  <option value="madre">Madre</option>
                  <option value="ambos">Ambos</option>
                  <option value="otro">Otro</option>
                </select>
              </Campo>
            </div>

            <h3 style={{ ...tituloSeccion, marginTop: 28 }}>⛪ Información Adicional</h3>
            <Campo label="¿Se congregan en alguna iglesia?">
              <input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={form.iglesia} onChange={e => set('iglesia', e.target.value)} placeholder="Nombre de la iglesia o 'No'" />
            </Campo>
          </div>
        )}

        {/* PASO 3 - Padre y madre */}
        {paso === 3 && (
          <div>
            <h3 style={tituloSeccion}>👨 Datos del Padre</h3>
            <div style={grid2}>
              <Campo label="Nombre completo"><input style={inp} value={form.nombre_padre} onChange={e => set('nombre_padre', e.target.value)} /></Campo>
              <Campo label="DUI"><input style={inp} value={form.dui_padre} onChange={e => set('dui_padre', e.target.value)} placeholder="00000000-0" /></Campo>
              <Campo label="Lugar de trabajo"><input style={inp} value={form.trabajo_padre} onChange={e => set('trabajo_padre', e.target.value)} /></Campo>
              <Campo label="Teléfono"><input style={inp} value={form.telefono_padre} onChange={e => set('telefono_padre', e.target.value)} /></Campo>
              <Campo label="Correo electrónico"><input style={inp} value={form.correo_padre} onChange={e => set('correo_padre', e.target.value)} /></Campo>
            </div>
            <Campo label="Dirección de residencia"><input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={form.direccion_padre} onChange={e => set('direccion_padre', e.target.value)} /></Campo>

            <h3 style={{ ...tituloSeccion, marginTop: 28 }}>👩 Datos de la Madre</h3>
            <div style={grid2}>
              <Campo label="Nombre completo"><input style={inp} value={form.nombre_madre} onChange={e => set('nombre_madre', e.target.value)} /></Campo>
              <Campo label="DUI"><input style={inp} value={form.dui_madre} onChange={e => set('dui_madre', e.target.value)} placeholder="00000000-0" /></Campo>
              <Campo label="Lugar de trabajo"><input style={inp} value={form.trabajo_madre} onChange={e => set('trabajo_madre', e.target.value)} /></Campo>
              <Campo label="Teléfono"><input style={inp} value={form.telefono_madre} onChange={e => set('telefono_madre', e.target.value)} /></Campo>
              <Campo label="Correo electrónico"><input style={inp} value={form.correo_madre} onChange={e => set('correo_madre', e.target.value)} /></Campo>
            </div>
            <Campo label="Dirección de residencia"><input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={form.direccion_madre} onChange={e => set('direccion_madre', e.target.value)} /></Campo>

            <h3 style={{ ...tituloSeccion, marginTop: 28 }}>👤 Datos del Encargado/Tutor (si aplica)</h3>
            <div style={grid2}>
              <Campo label="Nombre completo"><input style={inp} value={form.nombre_tutor} onChange={e => set('nombre_tutor', e.target.value)} /></Campo>
              <Campo label="DUI"><input style={inp} value={form.dui_tutor} onChange={e => set('dui_tutor', e.target.value)} /></Campo>
              <Campo label="Lugar de trabajo"><input style={inp} value={form.trabajo_tutor} onChange={e => set('trabajo_tutor', e.target.value)} /></Campo>
              <Campo label="Teléfono"><input style={inp} value={form.telefono_tutor} onChange={e => set('telefono_tutor', e.target.value)} /></Campo>
              <Campo label="Correo electrónico"><input style={inp} value={form.correo_tutor} onChange={e => set('correo_tutor', e.target.value)} /></Campo>
            </div>
            <Campo label="Dirección de residencia"><input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={form.direccion_tutor} onChange={e => set('direccion_tutor', e.target.value)} /></Campo>
          </div>
        )}

        {/* PASO 4 - Emergencia y salud */}
        {paso === 4 && (
          <div>
            <h3 style={tituloSeccion}>🚨 Contacto de Emergencia</h3>
            <div style={grid2}>
              <Campo label="Persona a avisar"><input style={inp} value={form.contacto_emergencia} onChange={e => set('contacto_emergencia', e.target.value)} /></Campo>
              <Campo label="Teléfono de emergencia"><input style={inp} value={form.telefono_emergencia} onChange={e => set('telefono_emergencia', e.target.value)} /></Campo>
            </div>

            <h3 style={{ ...tituloSeccion, marginTop: 28 }}>🏥 Salud</h3>
            <Campo label="Enfermedades o alergias">
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.enfermedades_alergias} onChange={e => set('enfermedades_alergias', e.target.value)} placeholder="Describa si aplica, o escriba 'Ninguna'" />
            </Campo>
            <Campo label="Medicamento prescrito permanente">
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.medicamento_permanente} onChange={e => set('medicamento_permanente', e.target.value)} placeholder="Describa si aplica, o escriba 'Ninguno'" />
            </Campo>

            {error && (
              <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginTop: 16 }}>
                <p style={{ color: '#dc2626', margin: 0, fontSize: 13 }}>{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Navegación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid #f3eeff' }}>
          <button
            onClick={() => setPaso(p => p - 1)}
            disabled={paso === 1}
            style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid #e0d6f0', background: '#fff', color: paso === 1 ? '#ccc' : PURPLE, fontWeight: 700, cursor: paso === 1 ? 'not-allowed' : 'pointer' }}>
            ← Anterior
          </button>

          {paso < 4 ? (
            <button
              onClick={() => {
                if (paso === 1 && (!form.nombre || !form.apellido || !form.genero || !form.grado_id)) {
                  setError('❌ Completa los campos obligatorios: Nombre, Apellido, Género y Grado.')
                  return
                }
                setError('')
                setPaso(p => p + 1)
              }}
              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: PURPLE, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              Siguiente →
            </button>
          ) : (
            <button
              onClick={guardar}
              disabled={loading}
              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Guardando...' : '✅ Guardar matrícula'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      {children}
    </div>
  )
}

const tituloSeccion = { color: '#3d1f61', fontSize: 15, fontWeight: 800, marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #f3eeff' }
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }
const inp = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e0d6f0', fontSize: 14, background: '#faf8ff', color: '#222', boxSizing: 'border-box', fontFamily: 'inherit' }