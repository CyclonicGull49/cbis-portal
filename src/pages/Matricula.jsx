import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useYearEscolar } from '../hooks/useYearEscolar'

const PURPLE = '#5B2D8E'
const PURPLE_DARK = '#3d1f61'

const camposVacios = {
  nombre: '', apellido: '', nie: '', genero: '', fecha_nacimiento: '',
  nacionalidad: '', lugar_nacimiento: '', partida_nacimiento: '',
  folio_partida: '', libro_partida: '', grado_id: '',
  estudio_parvularia: false, institucion_procedencia: '', diplomado_opcion: '',
  direccion: '', municipio: '', departamento: '', zona: '',
  convivencia: '',
  proceso_legal_pendiente: false,
  nombre_padre: '', dui_padre: '', trabajo_padre: '', direccion_padre: '', telefono_padre: '', correo_padre: '',
  nombre_madre: '', dui_madre: '', trabajo_madre: '', direccion_madre: '', telefono_madre: '', correo_madre: '',
  nombre_tutor: '', dui_tutor: '', trabajo_tutor: '', direccion_tutor: '', telefono_tutor: '', correo_tutor: '',
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

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  function handleDui(campo, raw) {
    // Solo dígitos, máximo 9
    const digits = raw.replace(/\D/g, '').slice(0, 9)
    // Formato 00000000-0
    const masked = digits.length <= 8 ? digits : digits.slice(0, 8) + '-' + digits.slice(8)
    set(campo, masked)
  }

  async function guardar() {
    setLoading(true); setError('')
    if (form.nie) {
      const { data: existe } = await supabase.from('estudiantes').select('id').eq('nie', form.nie).single()
      if (existe) { setError('El NIE ingresado ya existe en el sistema.'); setLoading(false); return }
    }
    const { data: grado } = await supabase.from('grados').select('id, nombre, nivel, monto_matricula, monto_mensualidad').eq('id', form.grado_id).single()
    if (!grado) { setError('Error al obtener información del grado.'); setLoading(false); return }
    const { data: estudiante, error: errEst } = await supabase.from('estudiantes').insert({ ...form, tipo_ingreso: 'nuevo', estado: 'activo', year_escolar: yearEscolar, grado_id: form.grado_id || null }).select().single()
    if (errEst) { setError(`Error: ${errEst.message}`); setLoading(false); return }
    const esBachillerato = grado.nivel === 'bachillerato'
    const conceptoMatriculaId = esBachillerato ? 21 : 20
    const conceptoMensualidadId = esBachillerato ? 24 : grado.nivel === 'secundaria' ? 23 : 22
    const año = yearEscolar
    const mesesArr = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre']
    const cobros = [
      { estudiante_id: estudiante.id, concepto_id: conceptoMatriculaId, monto: grado.monto_matricula, mes: 'Enero', year_escolar: año, estado: 'pendiente', fecha_vencimiento: new Date(año, 0, 10).toISOString().split('T')[0] },
      ...mesesArr.map((mes, i) => ({ estudiante_id: estudiante.id, concepto_id: conceptoMensualidadId, monto: grado.monto_mensualidad, mes, year_escolar: año, estado: 'pendiente', fecha_vencimiento: new Date(año, i, 10).toISOString().split('T')[0] }))
    ]
    const { error: errCobros } = await supabase.from('cobros').insert(cobros)
    if (errCobros) { setError(`Estudiante registrado pero error al generar cobros: ${errCobros.message}`); setLoading(false); return }
    setExito(true); setLoading(false)
  }

  const pasos = ['Datos del Alumno', 'Residencia y Familia', 'Padre y Madre', 'Emergencia y Salud']

  if (exito) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 style={{ color: PURPLE_DARK, fontSize: 22, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.5px' }}>Matrícula registrada</h2>
      <p style={{ color: '#b0a8c0', marginBottom: 28, fontSize: 14 }}>{form.nombre} {form.apellido} ha sido matriculado exitosamente.</p>
      <button onClick={() => { setForm(camposVacios); setPaso(1); setExito(false) }}
        style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
        + Nueva matrícula
      </button>
    </div>
  )

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: PURPLE_DARK, fontSize: 22, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.5px' }}>Matrícula — Nuevo Ingreso {yearEscolar}</h1>
        <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>Complete todos los campos de la ficha de registro académico</p>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>
        {pasos.map((p, i) => {
          const num = i + 1; const activo = paso === num; const completo = paso > num
          return (
            <div key={i} onClick={() => completo && setPaso(num)} style={{ flex: 1, padding: '14px 8px', textAlign: 'center', background: activo ? PURPLE : completo ? '#f3eeff' : '#fff', color: activo ? '#fff' : completo ? PURPLE : '#c4bad4', fontWeight: activo ? 800 : 600, fontSize: 12, cursor: completo ? 'pointer' : 'default', borderRight: i < 3 ? '1px solid #f0e8ff' : 'none', transition: 'all 0.2s', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              <div style={{ marginBottom: 4 }}>
                {completo ? (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: PURPLE, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: activo ? 'rgba(255,255,255,0.3)' : '#f3eeff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: activo ? '#fff' : '#c4bad4' }}>{num}</div>
                )}
              </div>
              {p}
            </div>
          )
        })}
      </div>

      {/* Formulario */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 2px 16px rgba(61,31,97,0.07)' }}>

        {paso === 1 && (
          <div>
            <h3 style={tituloSeccion}>Datos del Alumno</h3>
            <div style={grid2}>
              <Campo label="Nombre(s) *"><input style={inp} value={form.nombre} onChange={e => set('nombre', e.target.value)} /></Campo>
              <Campo label="Apellido(s) *"><input style={inp} value={form.apellido} onChange={e => set('apellido', e.target.value)} /></Campo>
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
                  {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
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

        {paso === 2 && (
          <div>
            <h3 style={tituloSeccion}>Datos de Residencia</h3>
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
            <h3 style={{ ...tituloSeccion, marginTop: 28 }}>Información Adicional</h3>
            <Campo label="¿Se congregan en alguna iglesia?">
              <input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={form.iglesia} onChange={e => set('iglesia', e.target.value)} placeholder="Nombre de la iglesia o 'No'" />
            </Campo>
          </div>
        )}

        {paso === 3 && (
          <div>
            {[
              { titulo: 'Datos del Padre', prefix: 'padre' },
              { titulo: 'Datos de la Madre', prefix: 'madre' },
              { titulo: 'Datos del Encargado/Tutor (si aplica)', prefix: 'tutor' },
            ].map(({ titulo, prefix }, idx) => (
              <div key={prefix}>
                {idx > 0 && <div style={{ height: 1, background: '#f3eeff', margin: '24px 0' }} />}
                <h3 style={tituloSeccion}>{titulo}</h3>
                <div style={grid2}>
                  <Campo label="Nombre completo"><input style={inp} value={form[`nombre_${prefix}`]} onChange={e => set(`nombre_${prefix}`, e.target.value)} /></Campo>
                  <Campo label="DUI"><input style={inp} value={form[`dui_${prefix}`]} onChange={e => handleDui(`dui_${prefix}`, e.target.value)} placeholder="00000000-0" maxLength={10} /></Campo>
                  <Campo label="Lugar de trabajo"><input style={inp} value={form[`trabajo_${prefix}`]} onChange={e => set(`trabajo_${prefix}`, e.target.value)} /></Campo>
                  <Campo label="Teléfono"><input style={inp} value={form[`telefono_${prefix}`]} onChange={e => set(`telefono_${prefix}`, e.target.value)} /></Campo>
                  <Campo label="Correo electrónico"><input style={inp} value={form[`correo_${prefix}`]} onChange={e => set(`correo_${prefix}`, e.target.value)} /></Campo>
                </div>
                <Campo label="Dirección de residencia"><input style={{ ...inp, width: '100%', boxSizing: 'border-box' }} value={form[`direccion_${prefix}`]} onChange={e => set(`direccion_${prefix}`, e.target.value)} /></Campo>
              </div>
            ))}
          </div>
        )}

        {paso === 4 && (
          <div>
            <h3 style={tituloSeccion}>Contacto de Emergencia</h3>
            <div style={grid2}>
              <Campo label="Persona a avisar"><input style={inp} value={form.contacto_emergencia} onChange={e => set('contacto_emergencia', e.target.value)} /></Campo>
              <Campo label="Teléfono de emergencia"><input style={inp} value={form.telefono_emergencia} onChange={e => set('telefono_emergencia', e.target.value)} /></Campo>
            </div>
            <h3 style={{ ...tituloSeccion, marginTop: 28 }}>Salud</h3>
            <Campo label="Enfermedades o alergias">
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.enfermedades_alergias} onChange={e => set('enfermedades_alergias', e.target.value)} placeholder="Describa si aplica, o escriba 'Ninguna'" />
            </Campo>
            <Campo label="Medicamento prescrito permanente">
              <textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.medicamento_permanente} onChange={e => set('medicamento_permanente', e.target.value)} placeholder="Describa si aplica, o escriba 'Ninguno'" />
            </Campo>
            <div style={{ marginTop: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '14px 16px', background: form.proceso_legal_pendiente ? '#fff7ed' : '#faf8ff', border: `1.5px solid ${form.proceso_legal_pendiente ? '#fed7aa' : '#e9e3ff'}`, borderRadius: 11, transition: 'all 0.15s' }}>
                <input type="checkbox" checked={form.proceso_legal_pendiente} onChange={e => set('proceso_legal_pendiente', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: PURPLE, cursor: 'pointer' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: form.proceso_legal_pendiente ? '#c2410c' : '#3d1f61' }}>Proceso legal pendiente</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Marcar si el estudiante tiene una situación legal activa que requiere seguimiento institucional.</div>
                </div>
              </label>
            </div>
            {error && (<div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginTop: 16 }}><p style={{ color: '#dc2626', margin: 0, fontSize: 13 }}>{error}</p></div>)}
          </div>
        )}

        {/* Navegación */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: '1px solid #f3eeff' }}>
          <button onClick={() => setPaso(p => p - 1)} disabled={paso === 1}
            style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: paso === 1 ? '#d1d5db' : PURPLE, fontWeight: 700, cursor: paso === 1 ? 'not-allowed' : 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: 14 }}>
            ← Anterior
          </button>
          {paso < 4 ? (
            <button onClick={() => {
              if (paso === 1 && (!form.nombre || !form.apellido || !form.genero || !form.grado_id)) { setError('Completa los campos obligatorios: Nombre, Apellido, Género y Grado.'); return }
              setError(''); setPaso(p => p + 1)
            }}
              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: 14 }}>
              Siguiente →
            </button>
          ) : (
            <button onClick={guardar} disabled={loading}
              style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: loading ? '#d1fae5' : 'linear-gradient(135deg, #16a34a, #22c55e)', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: 14 }}>
              {loading ? 'Guardando...' : 'Guardar matrícula'}
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
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>{label}</label>
      {children}
    </div>
  )
}

const tituloSeccion = { color: '#3d1f61', fontSize: 14, fontWeight: 800, marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid #f3eeff', letterSpacing: '-0.2px' }
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }
const inp = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }