import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Estudiantes() {
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
async function cambiarEstado(estudiante) {
  const nuevoEstado = estudiante.estado === 'activo' ? 'inactivo' : 'activo'
  if (!window.confirm(`¿Cambiar estado de ${estudiante.nombre} ${estudiante.apellido} a "${nuevoEstado}"?`)) return
  await supabase.from('estudiantes')
    .update({ estado: nuevoEstado })
    .eq('id', estudiante.id)
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
async function importarCSV(e) {
  const file = e.target.files[0]
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
    alert('❌ El archivo está vacío.')
    return
  }

  // Parsear filas
  const estudiantes = filas.map(fila => {
    const valores = fila.split(',').map(v => v.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = valores[i] || '' })
    return obj
  })

  // Validar NIEs en el CSV (duplicados entre sí)
  const niesCSV = estudiantes.map(e => e.nie)
  const duplicadosInternos = niesCSV.filter((nie, i) => niesCSV.indexOf(nie) !== i)
  if (duplicadosInternos.length > 0) {
    alert(`❌ El archivo tiene NIEs duplicados: ${[...new Set(duplicadosInternos)].join(', ')}. Corrígelos y vuelve a intentar.`)
    e.target.value = ''
    return
  }

  // Validar NIEs contra la base de datos
  const { data: existentes } = await supabase
    .from('estudiantes')
    .select('nie')
    .in('nie', niesCSV)

  if (existentes && existentes.length > 0) {
    const niesExistentes = existentes.map(e => e.nie).join(', ')
    alert(`❌ NIE ya existe en el sistema: ${niesExistentes}. Corrígelo en el archivo y vuelve a intentar.`)
    e.target.value = ''
    return
  }

  // Buscar IDs de grados
  const { data: grados } = await supabase.from('grados').select('id, nombre')
  const gradoMap = {}
grados?.forEach(g => { gradoMap[normalizar(g.nombre)] = g.id })
  // Validar que todos los grados existen
  const gradosInvalidos = []
  for (const est of estudiantes) {
    const gradoNombre = normalizar(est.grado)
if (!gradoMap[gradoNombre]) gradosInvalidos.push(est.grado)
  }
  if (gradosInvalidos.length > 0) {
    alert(`❌ Grados no encontrados: ${[...new Set(gradosInvalidos)].join(', ')}. Verifica que coincidan con los grados del sistema.`)
    e.target.value = ''
    return
  }

  // Insertar todos
  const registros = estudiantes.map(est => ({
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
    alert(`❌ Error al importar: ${error.message}`)
  } else {
    alert(`✅ ${registros.length} estudiante(s) importado(s) exitosamente.`)
    cargarDatos()
  }
  e.target.value = ''
}

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', gap: 10 }}>
  <button onClick={descargarPlantilla} style={{ ...s.btnSecondary, fontSize: 13 }}>
    📥 Descargar plantilla
  </button>
  <label style={{ ...s.btnSecondary, fontSize: 13, cursor: 'pointer' }}>
    📂 Importar CSV
    <input type="file" accept=".csv" onChange={importarCSV} style={{ display: 'none' }} />
  </label>
  <button onClick={() => setModalAbierto(true)} style={s.btnPrimary}>+ Nuevo Estudiante</button>
</div>

      {/* Buscador */}
      <input
        style={s.search}
        placeholder="🔍 Buscar por nombre, grado o NIE..."
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
                  <td style={s.td} >{e.genero || '—'}</td>
                  <td style={s.td}>
                    <span
  onClick={() => cambiarEstado(e)}
  title="Clic para cambiar estado"
  style={{
    ...s.estadoBadge,
    background: e.estado === 'activo' ? '#dcfce7' : '#fee2e2',
    color: e.estado === 'activo' ? '#16a34a' : '#dc2626',
    cursor: 'pointer',
  }}
>
  {e.estado === 'activo' ? '✅ Activo' : '🔴 Inactivo'}
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
        <div style={s.modalBg}>
          <div style={s.modalBox}>
            <h2 style={s.modalTitle}>➕ Nuevo Estudiante</h2>

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
                    {tipo === 'antiguo' ? '🏫 Antiguo ingreso' : '🆕 Nuevo Ingreso'}
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
                {guardando ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>

            
          </div>
        </div>
      )}

{estudianteDetalle && (
  <div style={s.modalBg} onClick={() => setEstudianteDetalle(null)}>
    <div style={{ ...s.modalBox, maxWidth: 560 }} onClick={e => e.stopPropagation()}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
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
            <h2 style={{ color: '#3d1f61', fontSize: 18, fontWeight: 900, marginBottom: 2 }}>
              {estudianteDetalle.nombre} {estudianteDetalle.apellido}
            </h2>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: estudianteDetalle.estado === 'activo' ? '#dcfce7' : '#fee2e2',
              color: estudianteDetalle.estado === 'activo' ? '#16a34a' : '#dc2626'
            }}>
              {estudianteDetalle.estado === 'activo' ? '✅ Activo' : '⛔ Inactivo'}
            </span>
          </div>
        </div>
        <button onClick={() => setEstudianteDetalle(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>✕</button>
      </div>

      {/* Datos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'NIE', val: estudianteDetalle.nie || 'Sin NIE', icon: '🪪' },
          { label: 'Grado', val: estudianteDetalle.grados?.nombre || '—', icon: '🎓' },
          { label: 'Género', val: estudianteDetalle.genero || '—', icon: '👤' },
          { label: 'Fecha de nacimiento', val: estudianteDetalle.fecha_nacimiento ? new Date(estudianteDetalle.fecha_nacimiento).toLocaleDateString('es-SV') : '—', icon: '🎂' },
{ label: 'Correo institucional', val: estudianteDetalle.correo_institucional || '—', icon: '📧' },
          { label: 'Tipo matrícula', val: estudianteDetalle.tipo_ingreso || '—', icon: '📋' },
          { label: 'Dirección', val: estudianteDetalle.direccion || '—', icon: '📍' },
          { label: 'Registrado', val: estudianteDetalle.created_at ? new Date(estudianteDetalle.created_at).toLocaleDateString('es-SV') : '—', icon: '📅' },
        ].map((item, i) => (
          <div key={i} style={{ background: '#faf8ff', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: '#5B2D8E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              {item.icon} {item.label}
            </div>
            <div style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f3eeff', paddingTop: 16 }}>
       <button
  onClick={async () => {
    const nuevo = prompt('Nuevo correo institucional:', estudianteDetalle.correo_institucional || '')
    if (nuevo === null) return
    await supabase.from('estudiantes').update({ correo_institucional: nuevo }).eq('id', estudianteDetalle.id)
    setEstudianteDetalle({ ...estudianteDetalle, correo_institucional: nuevo })
    cargarDatos()
  }}
  style={{ padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: '#f3eeff', color: '#5B2D8E' }}>
  ✏️ Editar correo
</button>
        <button
          onClick={async () => {
            const nuevoEstado = estudianteDetalle.estado === 'activo' ? 'inactivo' : 'activo'
            await supabase.from('estudiantes').update({ estado: nuevoEstado }).eq('id', estudianteDetalle.id)
            setEstudianteDetalle({ ...estudianteDetalle, estado: nuevoEstado })
            cargarDatos()
          }}
          style={{
            padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
            background: estudianteDetalle.estado === 'activo' ? '#fee2e2' : '#dcfce7',
            color: estudianteDetalle.estado === 'activo' ? '#dc2626' : '#16a34a'
          }}>
          {estudianteDetalle.estado === 'activo' ? '⛔ Desactivar' : '✅ Activar'}
        </button>
        <button
          onClick={async () => {
  if (!confirm(`¿Eliminar permanentemente a ${estudianteDetalle.nombre} ${estudianteDetalle.apellido}? Esta acción no se puede deshacer.`)) return
  
  // Primero eliminar registros relacionados
  const { data: cobros } = await supabase.from('cobros').select('id').eq('estudiante_id', estudianteDetalle.id)
  if (cobros?.length > 0) {
    const cobrosIds = cobros.map(c => c.id)
    await supabase.from('pagos').delete().in('cobro_id', cobrosIds)
    await supabase.from('cobros').delete().eq('estudiante_id', estudianteDetalle.id)
  }
  
  const { error } = await supabase.from('estudiantes').delete().eq('id', estudianteDetalle.id)
  if (error) {
    alert(`❌ Error al eliminar: ${error.message}`)
  } else {
    setEstudianteDetalle(null)
    cargarDatos()
  }
}}
          style={{ padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: '#dc2626', color: '#fff' }}>
          🗑️ Eliminar estudiante
        </button>
      </div>
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