import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// ── SVG Icons ────────────────────────────────────────────────
const IcoFile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)
const IcoImage = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)
const IcoUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)
const IcoDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const IcoTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoVaccine = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/>
    <path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>
  </svg>
)

const TIPOS_DOC = [
  { key: 'partida_nacimiento', label: 'Partida de nacimiento',   icon: 'file' },
  { key: 'dui_encargado',      label: 'DUI del encargado',        icon: 'file' },
  { key: 'foto_estudiante',    label: 'Foto del estudiante',      icon: 'image' },
  { key: 'constancia_medica',  label: 'Constancia médica',        icon: 'file' },
  { key: 'esquema_vacunacion', label: 'Esquema de vacunación',    icon: 'vaccine', soloInicial: true },
]

function TabDocumentos({ estudiante, puedeSubir, esAdmin }) {
  const [docs, setDocs]           = useState([])
  const [loadingDocs, setLoading] = useState(true)
  const [subiendo, setSubiendo]   = useState(null)   // key del tipo en proceso
  const [confirm, setConfirm]     = useState(null)   // doc a eliminar
  const [urlFirmada, setUrlFirmada] = useState(null) // { url, nombre }

  const esInicial = ['primera_infancia', 'inicial'].includes(estudiante.grados?.nivel)
  const tipos = TIPOS_DOC.filter(t => !t.soloInicial || esInicial)

  useEffect(() => { cargarDocs() }, [estudiante.id])

  async function cargarDocs() {
    setLoading(true)
    const { data } = await supabase
      .from('documentos_estudiante')
      .select('*')
      .eq('estudiante_id', estudiante.id)
    setDocs(data || [])
    setLoading(false)
  }

  async function subirDoc(tipo, file) {
    const maxMB = 10
    if (file.size > maxMB * 1024 * 1024) { toast.error(`Máximo ${maxMB}MB por archivo`); return }
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${estudiante.id}/${tipo}.${ext}`
    setSubiendo(tipo)

    // Subir al storage (upsert)
    const { error: uploadError } = await supabase.storage
      .from('documentos-estudiantes')
      .upload(path, file, { upsert: true })

    if (uploadError) { toast.error('Error al subir el archivo'); setSubiendo(null); return }

    // Generar signed URL de larga duración (10 años)
    const { data: signed } = await supabase.storage
      .from('documentos-estudiantes')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)

    // Guardar/actualizar registro en tabla
    await supabase.from('documentos_estudiante').upsert({
      estudiante_id: estudiante.id,
      tipo,
      nombre_archivo: file.name,
      storage_path:   path,
      url:            signed?.signedUrl || '',
    }, { onConflict: 'estudiante_id,tipo' })

    toast.success('Documento guardado')
    cargarDocs()
    setSubiendo(null)
  }

  async function eliminarDoc(doc) {
    await supabase.storage.from('documentos-estudiantes').remove([doc.storage_path])
    await supabase.from('documentos_estudiante').delete().eq('id', doc.id)
    toast.success('Documento eliminado')
    setConfirm(null)
    cargarDocs()
  }

  async function verDoc(doc) {
    // Regenerar signed URL fresca para abrir
    const { data } = await supabase.storage
      .from('documentos-estudiantes')
      .createSignedUrl(doc.storage_path, 60 * 60) // 1 hora
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    else toast.error('No se pudo abrir el documento')
  }

  const docPorTipo = (key) => docs.find(d => d.tipo === key)

  const esPDF = (nombre) => nombre?.toLowerCase().endsWith('.pdf')

  if (loadingDocs) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #e0d6f0', borderTopColor: '#5B2D8E', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div>
      {!puedeSubir && (
        <div style={{ background: '#faf8ff', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#b0a8c0', fontWeight: 600 }}>
          Tu rol no tiene permisos para subir documentos.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {tipos.map(({ key, label, icon }) => {
          const doc        = docPorTipo(key)
          const cargando   = subiendo === key
          const tieneDoc   = !!doc
          const esImg      = doc && !esPDF(doc.nombre_archivo)

          return (
            <div key={key} style={{
              borderRadius: 14,
              border: tieneDoc ? '1.5px solid #c9b8e8' : '1.5px dashed #d8d0e8',
              background: tieneDoc ? '#faf8ff' : '#fdfdff',
              padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 10,
              transition: 'all 0.15s',
            }}>
              {/* Header del card */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: tieneDoc ? 'linear-gradient(135deg, #5B2D8E, #3d1f61)' : '#f0ecf8',
                  color: tieneDoc ? '#fff' : '#b0a8c0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {icon === 'image' ? <IcoImage /> : icon === 'vaccine' ? <IcoVaccine /> : <IcoFile />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3d1f61', letterSpacing: '-0.1px', lineHeight: 1.3 }}>{label}</div>
                  {tieneDoc ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        <IcoCheck />
                      </div>
                      <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Subido</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#b0a8c0', marginTop: 3, fontWeight: 500 }}>Pendiente</div>
                  )}
                </div>
              </div>

              {/* Nombre del archivo si existe */}
              {tieneDoc && (
                <div style={{
                  background: '#f0ecf8', borderRadius: 8, padding: '6px 10px',
                  fontSize: 11, color: '#5B2D8E', fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {esImg ? <IcoImage /> : <IcoFile />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.nombre_archivo}</span>
                </div>
              )}

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                {tieneDoc && (
                  <button onClick={() => verDoc(doc)} style={ds.btnVer}>
                    <IcoDownload /> Ver
                  </button>
                )}
                {puedeSubir && (
                  <label style={{ ...ds.btnSubir, opacity: cargando ? 0.6 : 1, cursor: cargando ? 'not-allowed' : 'pointer', flex: tieneDoc ? undefined : 1 }}>
                    {cargando ? (
                      'Subiendo...'
                    ) : (
                      <><IcoUpload /> {tieneDoc ? 'Reemplazar' : 'Subir'}</>
                    )}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                      disabled={cargando}
                      onChange={e => { if (e.target.files[0]) subirDoc(key, e.target.files[0]); e.target.value = '' }}
                    />
                  </label>
                )}
                {tieneDoc && esAdmin && (
                  <button onClick={() => setConfirm(doc)} style={ds.btnEliminar} title="Eliminar">
                    <IcoTrash />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      <div style={{ marginTop: 16, padding: '10px 16px', background: '#faf8ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 600 }}>
          {docs.length} de {tipos.length} documentos subidos
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {tipos.map(({ key }) => (
            <div key={key} style={{ width: 8, height: 8, borderRadius: '50%', background: docPorTipo(key) ? '#16a34a' : '#e0d6f0' }} />
          ))}
        </div>
      </div>

      {/* Modal confirmar eliminación */}
      {confirm && (
        <div style={s.modalBg} onClick={() => setConfirm(null)}>
          <div style={{ ...s.modalBox, maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Eliminar documento</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
              Eliminar <b style={{ color: '#3d1f61' }}>{confirm.nombre_archivo}</b>?<br/>Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirm(null)} style={s.btnSecondary}>Cancelar</button>
              <button onClick={() => eliminarDoc(confirm)} style={{ ...s.btnPrimary, background: '#dc2626' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ds = {
  btnVer:      { display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: 'none', background: '#f0ecf8', color: '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSubir:    { display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnEliminar: { display: 'flex', alignItems: 'center', padding: '7px 10px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}

// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────

const IcoPermiso = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IcoMedico = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)
const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const TIPO_PERMISO = {
  medico:    { label: 'Médico',          bg: '#fef2f2', color: '#dc2626' },
  familiar:  { label: 'Familiar',        bg: '#fff7ed', color: '#c2410c' },
  academico: { label: 'Académico',       bg: '#f0fdf4', color: '#16a34a' },
  otro:      { label: 'Otro',            bg: '#faf8ff', color: '#5B2D8E' },
}

function TabPermisos({ estudiante, perfil }) {
  const [permisos, setPermisos]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo]   = useState(false)
  const [form, setForm]           = useState({ fecha: '', motivo: '', tipo: 'otro' })
  const [archivo, setArchivo]     = useState(null)

  const puedeRegistrar = ['admin', 'docente', 'recepcion', 'registro_academico'].includes(perfil?.rol)

  useEffect(() => { cargarPermisos() }, [estudiante.id])

  async function cargarPermisos() {
    setLoading(true)
    const { data } = await supabase
      .from('permisos')
      .select('*, perfiles(nombre, apellido)')
      .eq('estudiante_id', estudiante.id)
      .order('fecha', { ascending: false })
    setPermisos(data || [])
    setLoading(false)
  }

  async function guardarPermiso() {
    if (!form.fecha || !form.motivo) { toast.error('Fecha y motivo son obligatorios'); return }
    setGuardando(true)

    const { error } = await supabase.from('permisos').insert({
      estudiante_id:   estudiante.id,
      fecha:           form.fecha,
      motivo:          form.motivo,
      tipo:            form.tipo,
      registrado_por:  perfil?.id,
    })

    if (error) { toast.error('Error al guardar'); setGuardando(false); return }

    toast.success('Permiso registrado')
    setModalOpen(false)
    setForm({ fecha: '', motivo: '', tipo: 'otro' })
    setArchivo(null)
    cargarPermisos()
    setGuardando(false)
  }

  async function verComprobante(permiso) {
    const { data } = await supabase.storage
      .from('documentos-estudiantes')
      .createSignedUrl(permiso.storage_path, 60 * 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    else toast.error('No se pudo abrir el comprobante')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#3d1f61' }}>Permisos y ausencias</div>
          <div style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 500, marginTop: 2 }}>
            {permisos.length} permiso{permisos.length !== 1 ? 's' : ''} registrado{permisos.length !== 1 ? 's' : ''}
          </div>
        </div>
        {puedeRegistrar && (
          <button onClick={() => setModalOpen(true)} style={ps.btnPrimary}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <IcoPlus /> Registrar permiso
            </span>
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#b0a8c0', fontSize: 13 }}>Cargando...</div>
      ) : permisos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: '#faf8ff', borderRadius: 12 }}>
          <div style={{ color: '#d8c8f0', marginBottom: 10 }}><IcoPermiso /></div>
          <div style={{ fontSize: 13, color: '#b0a8c0', fontWeight: 600 }}>Sin permisos registrados</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {permisos.map(p => {
            const tipo = TIPO_PERMISO[p.tipo] || TIPO_PERMISO.otro
            return (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 12, padding: '14px 16px',
                border: '1px solid #f0ecf8', display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                {/* Fecha */}
                <div style={{ background: '#f3eeff', borderRadius: 10, padding: '8px 12px', textAlign: 'center', flexShrink: 0, minWidth: 52 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#3d1f61', lineHeight: 1 }}>
                    {new Date(p.fecha + 'T12:00:00').getDate()}
                  </div>
                  <div style={{ fontSize: 10, color: '#b0a8c0', fontWeight: 600, textTransform: 'uppercase' }}>
                    {new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-SV', { month: 'short' })}
                  </div>
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ ...ps.badge, background: tipo.bg, color: tipo.color }}>
                      {tipo.label}
                    </span>
                    {p.storage_path && (
                      <span style={{ ...ps.badge, background: '#f0fdf4', color: '#16a34a', cursor: 'pointer' }}
                        onClick={() => verComprobante(p)}>
                        <IcoMedico /> Comprobante
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, lineHeight: 1.5 }}>{p.motivo}</div>
                  {p.perfiles && (
                    <div style={{ fontSize: 11, color: '#b0a8c0', marginTop: 4, fontWeight: 500 }}>
                      Registrado por {p.perfiles.nombre} {p.perfiles.apellido}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nuevo permiso */}
      {modalOpen && (
        <div style={s.modalBg} onClick={() => setModalOpen(false)}>
          <div style={{ ...s.modalBox, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Registrar permiso</h2>

            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Fecha *</label>
                <input type="date" style={s.input}
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Tipo *</label>
                <select style={s.input} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  {Object.entries(TIPO_PERMISO).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Motivo *</label>
              <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }}
                value={form.motivo}
                onChange={e => setForm({ ...form, motivo: e.target.value })}
                placeholder="Describe el motivo de la ausencia..." />
            </div>

            {/* Comprobante — solo si tipo médico */}
            {form.tipo === 'medico' && (
              <div style={s.field}>
                <label style={s.label}>Comprobante médico</label>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 10, border: '1.5px dashed #d8c8f0',
                  background: '#faf8ff', cursor: 'pointer', fontSize: 13, color: '#5B2D8E', fontWeight: 600,
                }}>
                  <IcoUpload />
                  {archivo ? archivo.name : 'Adjuntar PDF o imagen'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                    onChange={e => setArchivo(e.target.files[0] || null)} />
                </label>
                {archivo && (
                  <button onClick={() => setArchivo(null)}
                    style={{ marginTop: 6, fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
                    Quitar archivo
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => { setModalOpen(false); setForm({ fecha: '', motivo: '', tipo: 'otro' }); setArchivo(null) }}
                style={s.btnSecondary}>Cancelar</button>
              <button onClick={guardarPermiso} style={s.btnPrimary} disabled={guardando || subiendo}>
                {subiendo ? 'Subiendo...' : guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ps = {
  btnPrimary: { padding: '8px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
}

// ── Componentes de edición ─────────────────────────────────────
let gradosEditRef = [] // se llenará desde el componente principal

function SeccionEdit({ titulo, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:12, fontWeight:800, color:'#3d1f61', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12, paddingBottom:6, borderBottom:'1px solid #f3eeff' }}>{titulo}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 20px' }}>
        {children}
      </div>
    </div>
  )
}

function CampoEdit({ label, val, onChange, tipo = 'text', opciones = [], fullWidth = false }) {
  const s = {
    gridColumn: fullWidth ? '1 / -1' : 'auto',
  }
  const inputStyle = {
    width:'100%', padding:'8px 10px', border:'1.5px solid #e9e3ff', borderRadius:8,
    fontSize:13, fontFamily:'Plus Jakarta Sans,system-ui,sans-serif', color:'#0f1d40',
    background:'#f8f7ff', outline:'none', marginTop:4,
  }
  return (
    <div style={s}>
      <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</div>
      {tipo === 'select' ? (
        <select value={val ?? ''} onChange={onChange} style={{ ...inputStyle, cursor:'pointer' }}>
          <option value="">— Sin especificar —</option>
          {opciones.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ) : tipo === 'textarea' ? (
        <textarea value={val ?? ''} onChange={onChange} rows={3}
          style={{ ...inputStyle, resize:'vertical', lineHeight:1.5 }} />
      ) : (
        <input type={tipo} value={val ?? ''} onChange={onChange} style={inputStyle} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function FichaTabs({ estudiante, onUpdate, onDelete, esRecepcion, perfil }) {
  const [tab, setTab] = useState(0)
  const [modalCorreo, setModalCorreo] = useState(false)
  const [nuevoCorreo, setNuevoCorreo] = useState('')
  const [modalEliminar, setModalEliminar] = useState(false)
  const [verificandoEliminar, setVerificandoEliminar] = useState(false)
  const [tienePagos, setTienePagos] = useState(false)

  // ── Edición ────────────────────────────────────────────────
  const puedeEditar = ['admin', 'registro_academico'].includes(perfil?.rol)
  const [editando,  setEditando]  = useState(false)
  const [formEdit,  setFormEdit]  = useState({})
  const [guardandoEdit, setGuardandoEdit] = useState(false)

  function iniciarEdicion() {
    setFormEdit({ ...estudiante })
    setEditando(true)
  }

  function cancelarEdicion() {
    setEditando(false)
    setFormEdit({})
  }

  async function guardarEdicion() {
    setGuardandoEdit(true)
    const campos = [
      'nombre','apellido','nie','genero','fecha_nacimiento','grado_id',
      'tipo_ingreso','nacionalidad','lugar_nacimiento','partida_nacimiento',
      'folio_partida','libro_partida','direccion','municipio','departamento',
      'zona','correo_institucional','telefono_contacto','email_contacto',
      'institucion_procedencia','convivencia','iglesia',
      'nombre_padre','dui_padre','telefono_padre','correo_padre','trabajo_padre','direccion_padre',
      'nombre_madre','dui_madre','telefono_madre','correo_madre','trabajo_madre','direccion_madre',
      'nombre_tutor','dui_tutor','telefono_tutor','correo_tutor','trabajo_tutor','direccion_tutor',
      'contacto_emergencia','telefono_emergencia',
      'enfermedades_alergias','medicamento_permanente',
      'diplomado_opcion','estudio_parvularia',
    ]
    const payload = {}
    campos.forEach(c => { payload[c] = formEdit[c] ?? null })
    // grado_id debe ser int
    if (payload.grado_id) payload.grado_id = parseInt(payload.grado_id)

    const { error } = await supabase.from('estudiantes').update(payload).eq('id', estudiante.id)
    setGuardandoEdit(false)
    if (error) { toast.error('Error al guardar: ' + error.message); return }
    toast.success('Datos actualizados')
    setEditando(false)
    onUpdate()
  }

  // helpers de edición
  const fe = (campo) => formEdit[campo] ?? ''
  const sf = (campo) => (e) => setFormEdit(f => ({ ...f, [campo]: e.target.value }))

  // Acceso al portal
  const [cuentaPortal, setCuentaPortal] = useState(null)
  const [emailPortal, setEmailPortal]   = useState('')
  const [creandoCuenta, setCreandoCuenta] = useState(false)
  const [credenciales, setCredenciales] = useState(null)

  useEffect(() => { verificarCuentaPortal() }, [estudiante.id])

  async function verificarCuentaPortal() {
    const { data } = await supabase
      .from('perfiles')
      .select('id, email, activo')
      .eq('estudiante_id', estudiante.id)
      .single()
    setCuentaPortal(data || null)
  }

  function generarPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  async function crearAccesoPortal() {
    if (!emailPortal) { toast.error('Ingresa un correo electrónico'); return }
    setCreandoCuenta(true)
    const password = generarPassword()

    // Guardar sesión del admin ANTES del signUp
    const { data: { session: sessionAdmin } } = await supabase.auth.getSession()

    const { data, error: authErr } = await supabase.auth.signUp({ email: emailPortal, password })
    if (authErr) { toast.error('Error auth: ' + authErr.message); setCreandoCuenta(false); return }
    
    const userId = data?.user?.id
    if (!userId) { toast.error('No se obtuvo ID del usuario'); setCreandoCuenta(false); return }

    const { error: rpcErr } = await supabase.rpc('crear_perfil_alumno', {
      p_id:            userId,
      p_nombre:        estudiante.nombre,
      p_apellido:      estudiante.apellido,
      p_email:         emailPortal,
      p_estudiante_id: estudiante.id,
    })

    // Restaurar sesión del admin en background (sin reload inmediato)
    if (sessionAdmin) {
      await supabase.auth.setSession({
        access_token:  sessionAdmin.access_token,
        refresh_token: sessionAdmin.refresh_token,
      })
    }

    if (rpcErr) { toast.error('RPC error: ' + rpcErr.message); setCreandoCuenta(false); return }

    setCredenciales({ email: emailPortal, password, sessionAdmin })
    setCuentaPortal({ email: emailPortal, activo: true })
    toast.success('Acceso creado exitosamente')
    setCreandoCuenta(false)
  }

  const puedeSubir = ['admin', 'recepcion', 'registro_academico', 'padre'].includes(perfil?.rol)
  const esAdmin    = perfil?.rol === 'admin'

  const tabs = esRecepcion
    ? ['General', 'Familia', 'Salud', 'Documentos', 'Permisos']
    : ['General', 'Familia', 'Salud', 'Documentos', 'Permisos', 'Acciones']

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
      const { data: pagos } = await supabase.from('pagos').select('id').in('cobro_id', cobrosIds).neq('anulado', true)
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
    // 1. Buscar perfil del alumno (si tiene cuenta en el portal)
    const { data: perfilAlumno } = await supabase.from('perfiles')
      .select('id').eq('estudiante_id', estudiante.id).single()

    // 2. Borrar cobros y pagos
    const { data: cobrosEst } = await supabase.from('cobros').select('id').eq('estudiante_id', estudiante.id)
    const cobrosIds = cobrosEst?.map(c => c.id) || []
    if (cobrosIds.length > 0) {
      await supabase.from('pagos').delete().in('cobro_id', cobrosIds)
      await supabase.from('cobros').delete().eq('estudiante_id', estudiante.id)
    }

    // 3. Borrar vínculo padre_estudiante y notas
    await supabase.from('padre_estudiante').delete().eq('estudiante_id', estudiante.id)
    await supabase.from('notas').delete().eq('estudiante_id', estudiante.id)
    await supabase.from('asistencia').delete().eq('estudiante_id', estudiante.id)

    // 4. Borrar perfil del portal + cuenta Auth del alumno
    if (perfilAlumno?.id) {
      await supabase.from('perfiles').delete().eq('id', perfilAlumno.id)
      await supabase.rpc('eliminar_usuario_auth', { p_perfil_id: perfilAlumno.id })
    }

    // 5. Borrar el estudiante
    await supabase.from('estudiantes').delete().eq('id', estudiante.id)
    toast.success('Estudiante eliminado')
    onDelete()
  }

  return (
    <div>
      {/* ── Barra de tabs + botón editar ── */}
      <div style={{ display:'flex', alignItems:'center', borderBottom:'2px solid #f3eeff', marginBottom:20 }}>
        <div style={{ display:'flex', flex:1, overflowX:'auto' }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding:'10px 16px', border:'none', background:'none', cursor:'pointer',
              fontSize:13, fontWeight: tab===i ? 800 : 500,
              fontFamily:'Plus Jakarta Sans, system-ui, sans-serif',
              color: tab===i ? '#5B2D8E' : '#aaa',
              borderBottom: tab===i ? '2px solid #5B2D8E' : '2px solid transparent',
              marginBottom:-2, whiteSpace:'nowrap',
            }}>{t}</button>
          ))}
        </div>
        {puedeEditar && (tab === 0 || tab === 1 || tab === 2) && (
          editando ? (
            <div style={{ display:'flex', gap:8, paddingLeft:12, flexShrink:0 }}>
              <button onClick={cancelarEdicion}
                style={{ padding:'6px 14px', borderRadius:8, border:'1.5px solid #e9e3ff', background:'#fff', color:'#9ca3af', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Cancelar
              </button>
              <button onClick={guardarEdicion} disabled={guardandoEdit}
                style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'linear-gradient(135deg,#2d1554,#5B2D8E)', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', opacity: guardandoEdit ? 0.6 : 1 }}>
                {guardandoEdit ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          ) : (
            <button onClick={iniciarEdicion}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:'1.5px solid #e9e3ff', background:'#f8f7ff', color:'#5B2D8E', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0, marginLeft:12 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
          )
        )}
      </div>

      {tab === 0 && (
        editando ? (
          <div>
            {/* Sección: Datos académicos */}
            <SeccionEdit titulo="Datos académicos">
              <CampoEdit label="Nombre(s)"    val={fe('nombre')}    onChange={sf('nombre')} />
              <CampoEdit label="Apellido(s)"  val={fe('apellido')}  onChange={sf('apellido')} />
              <CampoEdit label="NIE"          val={fe('nie')}       onChange={sf('nie')} />
              <CampoEdit label="Género" val={fe('genero')} onChange={sf('genero')} tipo="select"
                opciones={[['masculino','Masculino'],['femenino','Femenino']]} />
              <CampoEdit label="Fecha de nacimiento" val={fe('fecha_nacimiento')} onChange={sf('fecha_nacimiento')} tipo="date" />
              <CampoEdit label="Grado" val={fe('grado_id')} onChange={sf('grado_id')} tipo="select"
                opciones={gradosEditRef.map(g => [g.id, g.nombre])} />
              <CampoEdit label="Tipo de ingreso" val={fe('tipo_ingreso')} onChange={sf('tipo_ingreso')} tipo="select"
                opciones={[['nuevo','Nuevo'],['antiguo','Antiguo']]} />
              <CampoEdit label="Correo institucional" val={fe('correo_institucional')} onChange={sf('correo_institucional')} tipo="email" />
            </SeccionEdit>
            {/* Sección: Procedencia */}
            <SeccionEdit titulo="Origen y procedencia">
              <CampoEdit label="Nacionalidad"           val={fe('nacionalidad')}            onChange={sf('nacionalidad')} />
              <CampoEdit label="Lugar de nacimiento"    val={fe('lugar_nacimiento')}        onChange={sf('lugar_nacimiento')} />
              <CampoEdit label="Partida de nacimiento"  val={fe('partida_nacimiento')}      onChange={sf('partida_nacimiento')} />
              <CampoEdit label="Folio"                  val={fe('folio_partida')}           onChange={sf('folio_partida')} />
              <CampoEdit label="Nº de libro"            val={fe('libro_partida')}           onChange={sf('libro_partida')} />
              <CampoEdit label="Inst. de procedencia"   val={fe('institucion_procedencia')} onChange={sf('institucion_procedencia')} />
              <CampoEdit label="Estudió parvularia" val={fe('estudio_parvularia')} onChange={sf('estudio_parvularia')} tipo="select"
                opciones={[['true','Sí'],['false','No']]} />
            </SeccionEdit>
            {/* Sección: Dirección */}
            <SeccionEdit titulo="Dirección y contacto">
              <CampoEdit label="Dirección"          val={fe('direccion')}         onChange={sf('direccion')} fullWidth />
              <CampoEdit label="Municipio"          val={fe('municipio')}         onChange={sf('municipio')} />
              <CampoEdit label="Departamento"       val={fe('departamento')}      onChange={sf('departamento')} />
              <CampoEdit label="Zona"               val={fe('zona')}              onChange={sf('zona')} />
              <CampoEdit label="Teléfono contacto"  val={fe('telefono_contacto')} onChange={sf('telefono_contacto')} />
              <CampoEdit label="Correo contacto"    val={fe('email_contacto')}    onChange={sf('email_contacto')} tipo="email" />
            </SeccionEdit>
          </div>
        ) : (
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
            <Dato label="Correo institucional" val={estudiante.email} />
            <Dato label="Institución de procedencia" val={estudiante.institucion_procedencia} />
            <Dato label="Dirección" val={estudiante.direccion} />
            <Dato label="Municipio" val={estudiante.municipio} />
            <Dato label="Departamento" val={estudiante.departamento} />
            <Dato label="Zona" val={estudiante.zona} />
            <Dato label="Registrado" val={estudiante.creado_en ? new Date(estudiante.creado_en).toLocaleDateString('es-SV') : null} />
          </div>
        )
      )}

      {tab === 1 && (
        editando ? (
          <div>
            <SeccionEdit titulo="Padre">
              <CampoEdit label="Nombre"          val={fe('nombre_padre')}    onChange={sf('nombre_padre')} />
              <CampoEdit label="DUI"             val={fe('dui_padre')}       onChange={sf('dui_padre')} />
              <CampoEdit label="Teléfono"        val={fe('telefono_padre')}  onChange={sf('telefono_padre')} />
              <CampoEdit label="Correo"          val={fe('correo_padre')}    onChange={sf('correo_padre')} tipo="email" />
              <CampoEdit label="Lugar de trabajo" val={fe('trabajo_padre')}  onChange={sf('trabajo_padre')} />
              <CampoEdit label="Dirección"       val={fe('direccion_padre')} onChange={sf('direccion_padre')} />
            </SeccionEdit>
            <SeccionEdit titulo="Madre">
              <CampoEdit label="Nombre"          val={fe('nombre_madre')}    onChange={sf('nombre_madre')} />
              <CampoEdit label="DUI"             val={fe('dui_madre')}       onChange={sf('dui_madre')} />
              <CampoEdit label="Teléfono"        val={fe('telefono_madre')}  onChange={sf('telefono_madre')} />
              <CampoEdit label="Correo"          val={fe('correo_madre')}    onChange={sf('correo_madre')} tipo="email" />
              <CampoEdit label="Lugar de trabajo" val={fe('trabajo_madre')}  onChange={sf('trabajo_madre')} />
              <CampoEdit label="Dirección"       val={fe('direccion_madre')} onChange={sf('direccion_madre')} />
            </SeccionEdit>
            <SeccionEdit titulo="Tutor / Encargado">
              <CampoEdit label="Nombre"          val={fe('nombre_tutor')}    onChange={sf('nombre_tutor')} />
              <CampoEdit label="DUI"             val={fe('dui_tutor')}       onChange={sf('dui_tutor')} />
              <CampoEdit label="Teléfono"        val={fe('telefono_tutor')}  onChange={sf('telefono_tutor')} />
              <CampoEdit label="Correo"          val={fe('correo_tutor')}    onChange={sf('correo_tutor')} tipo="email" />
              <CampoEdit label="Lugar de trabajo" val={fe('trabajo_tutor')}  onChange={sf('trabajo_tutor')} />
              <CampoEdit label="Dirección"       val={fe('direccion_tutor')} onChange={sf('direccion_tutor')} />
            </SeccionEdit>
            <SeccionEdit titulo="Emergencia y familia">
              <CampoEdit label="Contacto emergencia"  val={fe('contacto_emergencia')}  onChange={sf('contacto_emergencia')} />
              <CampoEdit label="Teléfono emergencia"  val={fe('telefono_emergencia')}  onChange={sf('telefono_emergencia')} />
              <CampoEdit label="Convivencia familiar" val={fe('convivencia')}          onChange={sf('convivencia')} />
              <CampoEdit label="Iglesia"              val={fe('iglesia')}              onChange={sf('iglesia')} />
            </SeccionEdit>
          </div>
        ) : (
          <div>
            {[
              { titulo: 'Padre', campos: ['nombre_padre','dui_padre','telefono_padre','correo_padre','trabajo_padre','direccion_padre'], labels: ['Nombre','DUI','Teléfono','Correo','Lugar de trabajo','Dirección'] },
              { titulo: 'Madre', campos: ['nombre_madre','dui_madre','telefono_madre','correo_madre','trabajo_madre','direccion_madre'], labels: ['Nombre','DUI','Teléfono','Correo','Lugar de trabajo','Dirección'] },
              { titulo: 'Tutor/Encargado', campos: ['nombre_tutor','dui_tutor','telefono_tutor','correo_tutor','trabajo_tutor','direccion_tutor'], labels: ['Nombre','DUI','Teléfono','Correo','Lugar de trabajo','Dirección'] },
            ].map(({ titulo, campos, labels }) => (
              <div key={titulo} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#3d1f61', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f3eeff' }}>{titulo}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                  {campos.map((c, i) => <Dato key={c} label={labels[i]} val={estudiante[c]} />)}
                </div>
              </div>
            ))}
            <div style={{ background: '#fff4f0', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#E8573A', marginBottom: 8 }}>Contacto de emergencia</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                <Dato label="Persona" val={estudiante.contacto_emergencia} />
                <Dato label="Teléfono" val={estudiante.telefono_emergencia} />
              </div>
            </div>
            <Dato label="Convivencia familiar" val={estudiante.convivencia} />
            <Dato label="Iglesia" val={estudiante.iglesia} />
          </div>
        )
      )}

      {tab === 2 && (
        editando ? (
          <div>
            <SeccionEdit titulo="Salud">
              <CampoEdit label="Enfermedades o alergias"     val={fe('enfermedades_alergias')}   onChange={sf('enfermedades_alergias')} tipo="textarea" fullWidth />
              <CampoEdit label="Medicamento prescrito permanente" val={fe('medicamento_permanente')} onChange={sf('medicamento_permanente')} tipo="textarea" fullWidth />
            </SeccionEdit>
          </div>
        ) : (
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
        )
      )}

      {tab === 3 && (
        <TabDocumentos estudiante={estudiante} puedeSubir={puedeSubir} esAdmin={esAdmin} />
      )}

      {tab === 4 && (
        <TabPermisos estudiante={estudiante} perfil={perfil} />
      )}

      {tab === 5 && !esRecepcion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Acceso al portal ───────────────────────────── */}
          <div style={{ background: '#faf8ff', borderRadius: 14, padding: '18px 20px', border: '1.5px solid #e8e0f0' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#3d1f61', marginBottom: 4, letterSpacing: '-0.2px' }}>Acceso al portal</div>
            <div style={{ fontSize: 12, color: '#b0a8c0', fontWeight: 500, marginBottom: 14 }}>
              Cuenta para que el alumno/familia acceda a CBIS+
            </div>

            {cuentaPortal ? (
              /* Ya tiene cuenta */
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#b0a8c0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Correo de acceso</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61' }}>{cuentaPortal.email}</div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cuentaPortal.activo ? '#dcfce7' : '#fee2e2', color: cuentaPortal.activo ? '#16a34a' : '#dc2626' }}>
                  {cuentaPortal.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            ) : (
              /* Sin cuenta — crear */
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  value={emailPortal}
                  onChange={e => setEmailPortal(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  style={{ ...s.input, flex: 1, fontSize: 13 }}
                />
                <button onClick={crearAccesoPortal} disabled={creandoCuenta} style={s.btnPrimary}>
                  {creandoCuenta ? 'Creando...' : 'Crear acceso'}
                </button>
              </div>
            )}

            {/* Credenciales generadas */}
            {credenciales && (
              <div style={{ marginTop: 14, background: '#f3eeff', border: '1.5px solid #d8c8f0', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  ✓ Cuenta creada — comparte estas credenciales
                </div>
                {[['Correo', credenciales.email], ['Contraseña temporal', credenciales.password]].map(([label, val]) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: '#b0a8c0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#3d1f61', background: '#fff', borderRadius: 8, padding: '6px 10px', letterSpacing: 1 }}>{val}</div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: '#b0a8c0', marginTop: 6, marginBottom: 12 }}>El alumno deberá cambiar la contraseña en su primer ingreso.</div>
                <button
                  onClick={() => window.location.reload()}
                  style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
                  ✓ Listo, ya anoté las credenciales
                </button>
              </div>
            )}
          </div>

          {/* ── Otras acciones ─────────────────────────────── */}
          <button onClick={() => { setNuevoCorreo(estudiante.correo_institucional || ''); setModalCorreo(true) }}
            style={{ padding: '12px 18px', borderRadius: 10, border: '1.5px solid #e0d6f0', background: '#faf8ff', color: '#5B2D8E', fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
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
              padding: '12px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, textAlign: 'left', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
              background: estudiante.estado === 'activo' ? '#fee2e2' : '#dcfce7',
              color: estudiante.estado === 'activo' ? '#dc2626' : '#16a34a'
            }}>
            {estudiante.estado === 'activo' ? 'Desactivar estudiante' : 'Activar estudiante'}
          </button>
          <button onClick={verificarYEliminar} disabled={verificandoEliminar}
            style={{ padding: '12px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: '#dc2626', color: '#fff', textAlign: 'left', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
            {verificandoEliminar ? 'Verificando...' : 'Eliminar estudiante permanentemente'}
          </button>
          {tienePagos && (
            <div style={{ background: '#fef9c3', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#854d0e', lineHeight: 1.6 }}>
              <b>{estudiante.nombre}</b> tiene historial de pagos registrado. Para eliminar un estudiante con historial, primero cámbialo a "Inactivo".
            </div>
          )}
        </div>
      )}

      {modalCorreo && (
        <div style={s.modalBg} onClick={() => setModalCorreo(false)}>
          <div style={{ ...s.modalBox, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Editar correo institucional</h2>
            <div style={s.field}>
              <label style={s.label}>Correo institucional</label>
              <input style={s.input} type="email" value={nuevoCorreo} onChange={e => setNuevoCorreo(e.target.value)} placeholder="estudiante@cbis.edu.sv" />
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

      {modalEliminar && (
        <div style={s.modalBg} onClick={() => setModalEliminar(false)}>
          <div style={{ ...s.modalBox, maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ ...s.modalTitle, color: '#dc2626' }}>Eliminar estudiante</h2>
            <p style={{ color: '#555', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Eliminar permanentemente a <b>{estudiante.nombre} {estudiante.apellido}</b>?<br/>Esta acción no se puede deshacer.
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

export default function Estudiantes({ estudianteIdInicial, onVolver }) {
  const { perfil } = useAuth()
  const esRecepcion = perfil?.rol === 'recepcion'
  const esDocente   = perfil?.rol === 'docente'
  const [estudianteDetalle, setEstudianteDetalle] = useState(null)
  const [estudiantes, setEstudiantes] = useState([])
  const [grados, setGrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [gradoFiltro, setGradoFiltro] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', fecha_nacimiento: '', genero: '', nie: '', correo_institucional: '', direccion: '', grado_id: '', tipo_ingreso: 'antiguo' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { cargarDatos() }, [])

  // Abrir estudiante directamente si viene desde Notas
  useEffect(() => {
    if (estudianteIdInicial && estudiantes.length) {
      const est = estudiantes.find(e => e.id === estudianteIdInicial)
      if (est) setEstudianteDetalle(est)
    }
  }, [estudianteIdInicial, estudiantes])

  async function cambiarEstado(e, estudiante) {
    e.stopPropagation()
    const nuevoEstado = estudiante.estado === 'activo' ? 'inactivo' : 'activo'
    await supabase.from('estudiantes').update({ estado: nuevoEstado }).eq('id', estudiante.id)
    toast.success(`Estudiante ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`)
    cargarDatos()
  }

  async function cargarDatos() {
    setLoading(true)

    // Si es docente, verificar si es encargado
    let gradoEncargadoId = null
    if (esDocente) {
      const { data: gradoEnc } = await supabase.from('grados')
        .select('id').eq('encargado_id', perfil.id).single()
      gradoEncargadoId = gradoEnc?.id || null
      if (!gradoEncargadoId) {
        setEstudiantes([]); setGrados([]); setLoading(false); return
      }
    }

    let q = supabase.from('estudiantes').select('*, grados(nombre, nivel)').order('apellido')
    if (gradoEncargadoId) q = q.eq('grado_id', gradoEncargadoId)

    const [{ data: est }, { data: gra }] = await Promise.all([
      q,
      supabase.from('grados').select('*').order('orden')
    ])
    // Ordenar por orden de grado, luego por apellido
    const sorted = (est || []).sort((a, b) => {
      const oA = a.grados?.orden ?? 999
      const oB = b.grados?.orden ?? 999
      if (oA !== oB) return oA - oB
      return `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
    })
    setEstudiantes(sorted)
    setGrados(gra || [])
    gradosEditRef = gra || []
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
      nombre: form.nombre, apellido: form.apellido,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero, nie: form.nie || null,
      correo_institucional: form.correo_institucional || null,
      direccion: form.direccion || null,
      grado_id: parseInt(form.grado_id),
      tipo_ingreso: form.tipo_ingreso,
    }])
    if (error) { setError('Error al guardar: ' + error.message) }
    else { setModalAbierto(false); resetForm(); toast.success('Estudiante registrado exitosamente'); cargarDatos() }
    setGuardando(false)
  }

  function resetForm() {
    setForm({ nombre: '', apellido: '', fecha_nacimiento: '', genero: '', nie: '', correo_institucional: '', direccion: '', grado_id: '', tipo_ingreso: 'antiguo' })
    setError('')
  }

  const [paginaEst, setPaginaEst] = useState(1)
  const POR_PAGINA_EST = 25

  const filtrados = estudiantes.filter(e => {
    const matchBusqueda =
      `${e.nombre} ${e.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.grados?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      (e.nie && e.nie.includes(busqueda))
    const matchGrado = !gradoFiltro || e.grado_id === parseInt(gradoFiltro)
    return matchBusqueda && matchGrado
  })

  const totalPaginasEst = Math.ceil(filtrados.length / POR_PAGINA_EST)
  const filtradosPaginados = filtrados.slice((paginaEst - 1) * POR_PAGINA_EST, paginaEst * POR_PAGINA_EST)

  function descargarPlantilla() {
    // Grados disponibles como comentario de referencia
    const gradosRef = grados.map(g => g.nombre).join(' | ')
    const headers = [
      // Obligatorios
      'nombre', 'apellido', 'nie', 'genero', 'fecha_nacimiento', 'grado', 'tipo_ingreso',
      // Contacto
      'telefono_contacto', 'email_contacto', 'correo_institucional',
      'direccion', 'municipio', 'departamento',
      // Padre
      'nombre_padre', 'dui_padre', 'telefono_padre', 'correo_padre', 'trabajo_padre', 'direccion_padre',
      // Madre
      'nombre_madre', 'dui_madre', 'telefono_madre', 'correo_madre', 'trabajo_madre', 'direccion_madre',
      // Tutor/Encargado
      'nombre_tutor', 'dui_tutor', 'telefono_tutor', 'correo_tutor', 'trabajo_tutor', 'direccion_tutor',
      // Emergencia y salud
      'contacto_emergencia', 'telefono_emergencia', 'enfermedades_alergias', 'medicamento_permanente',
      // Datos adicionales
      'nacionalidad', 'lugar_nacimiento', 'iglesia',
    ]
    const ejemplo = [
      'Camilo Aryéh', 'Velis Figueroa', '12345678', 'masculino', '2015-03-10', 'Sección 4', 'antiguo',
      '7890-1234', 'camilo@cbis.edu.sv', 'camilo.velis@cbis.edu.sv',
      'Col. La Paz, Sonsonate', 'Sonsonate', 'Sonsonate',
      'Nelson Velis', '00000000-0', '7000-0000', 'nelson@email.com', 'Empresa X', 'Sonsonate',
      'María Figueroa', '11111111-1', '7111-1111', 'maria@email.com', 'Empresa Y', 'Sonsonate',
      '', '', '', '', '', '',
      'Abuela Ana', '7222-2222', '', '',
      'Salvadoreño', 'Sonsonate', 'Iglesia Bautista',
    ]
    // Comentario con grados válidos
    const comentario = `# GRADOS VÁLIDOS: ${gradosRef}\n# GÉNERO: masculino | femenino\n# TIPO_INGRESO: nuevo | antiguo\n# FECHA: formato YYYY-MM-DD (ej. 2015-03-10)\n`
    const csv = comentario + [headers.join(','), ejemplo.join(',')].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_estudiantes_cbis.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Plantilla descargada — revisa los comentarios al inicio del archivo')
  }

  function normalizar(str) {
    return str?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || ''
  }

  async function importarCSV(ev) {
    const file = ev.target.files[0]
    if (!file) return
    const toastId = toast.loading('Procesando archivo...')

    try {
      const text = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = e => resolve(e.target.result)
        r.onerror = reject
        r.readAsText(file, 'UTF-8')
      })

      // Filtrar líneas de comentario (#) y vacías
      const lineas = text.trim().split('\n').filter(l => !l.startsWith('#') && l.trim() !== '')
      if (lineas.length < 2) { toast.error('El archivo está vacío o solo tiene encabezados', { id: toastId }); ev.target.value = ''; return }

      const headers = lineas[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
      const filas   = lineas.slice(1)

      // Parsear respetando campos entre comillas
      function parseFila(linea) {
        const vals = []; let cur = ''; let inQ = false
        for (const ch of linea) {
          if (ch === '"') { inQ = !inQ }
          else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = '' }
          else cur += ch
        }
        vals.push(cur.trim())
        return vals
      }

      const datos = filas.map(fila => {
        const valores = parseFila(fila)
        const obj = {}
        headers.forEach((h, i) => { obj[h] = valores[i] || '' })
        return obj
      })

      // Validaciones
      const faltanObligatorios = datos.filter(e => !e.nombre || !e.apellido || !e.grado)
      if (faltanObligatorios.length > 0) {
        toast.error(`Filas sin nombre, apellido o grado: fila(s) ${faltanObligatorios.map((_, i) => i+2).join(', ')}`, { id: toastId })
        ev.target.value = ''; return
      }

      const niesCSV = datos.map(e => e.nie).filter(Boolean)
      if (niesCSV.length > 0) {
        const duplicadosInternos = niesCSV.filter((nie, i) => niesCSV.indexOf(nie) !== i)
        if (duplicadosInternos.length > 0) {
          toast.error(`NIEs duplicados en el archivo: ${[...new Set(duplicadosInternos)].join(', ')}`, { id: toastId })
          ev.target.value = ''; return
        }
        const { data: existentes } = await supabase.from('estudiantes').select('nie').in('nie', niesCSV)
        if (existentes?.length > 0) {
          toast.error(`NIE ya existe en el sistema: ${existentes.map(e => e.nie).join(', ')}`, { id: toastId })
          ev.target.value = ''; return
        }
      }

      // Mapa de grados
      const { data: gds } = await supabase.from('grados').select('id, nombre')
      const gradoMap = {}
      gds?.forEach(g => { gradoMap[normalizar(g.nombre)] = g.id })
      const gradosInvalidos = datos.filter(est => !gradoMap[normalizar(est.grado)]).map(e => `"${e.grado}"`)
      if (gradosInvalidos.length > 0) {
        toast.error(`Grados no reconocidos: ${[...new Set(gradosInvalidos)].join(', ')}`, { id: toastId })
        ev.target.value = ''; return
      }

      // Construir registros con todos los campos
      const yearActual = new Date().getFullYear()
      const registros = datos.map(e => ({
        nombre:                e.nombre,
        apellido:              e.apellido,
        nie:                   e.nie || null,
        genero:                e.genero || null,
        fecha_nacimiento:      e.fecha_nacimiento || null,
        grado_id:              gradoMap[normalizar(e.grado)],
        tipo_ingreso:          ['nuevo','antiguo'].includes(e.tipo_ingreso) ? e.tipo_ingreso : 'nuevo',
        estado:                'activo',
        year_escolar:          yearActual,
        telefono_contacto:     e.telefono_contacto || null,
        email_contacto:        e.email_contacto || null,
        correo_institucional:  e.correo_institucional || null,
        direccion:             e.direccion || null,
        municipio:             e.municipio || null,
        departamento:          e.departamento || null,
        nombre_padre:          e.nombre_padre || null,
        dui_padre:             e.dui_padre || null,
        telefono_padre:        e.telefono_padre || null,
        correo_padre:          e.correo_padre || null,
        trabajo_padre:         e.trabajo_padre || null,
        direccion_padre:       e.direccion_padre || null,
        nombre_madre:          e.nombre_madre || null,
        dui_madre:             e.dui_madre || null,
        telefono_madre:        e.telefono_madre || null,
        correo_madre:          e.correo_madre || null,
        trabajo_madre:         e.trabajo_madre || null,
        direccion_madre:       e.direccion_madre || null,
        nombre_tutor:          e.nombre_tutor || null,
        dui_tutor:             e.dui_tutor || null,
        telefono_tutor:        e.telefono_tutor || null,
        correo_tutor:          e.correo_tutor || null,
        trabajo_tutor:         e.trabajo_tutor || null,
        direccion_tutor:       e.direccion_tutor || null,
        contacto_emergencia:   e.contacto_emergencia || null,
        telefono_emergencia:   e.telefono_emergencia || null,
        enfermedades_alergias: e.enfermedades_alergias || null,
        medicamento_permanente:e.medicamento_permanente || null,
        nacionalidad:          e.nacionalidad || null,
        lugar_nacimiento:      e.lugar_nacimiento || null,
        iglesia:               e.iglesia || null,
      }))

      const { error } = await supabase.from('estudiantes').insert(registros)
      if (error) {
        toast.error(`Error al importar: ${error.message}`, { id: toastId })
      } else {
        toast.success(`${registros.length} estudiante(s) importado(s) exitosamente`, { id: toastId })
        cargarDatos()
      }
    } catch (err) {
      toast.error('Error al leer el archivo', { id: toastId })
    }
    ev.target.value = ''
  }

  const activos = estudiantes.filter(e => e.estado === 'activo').length
  const inactivos = estudiantes.filter(e => e.estado === 'inactivo').length

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          {onVolver && (
            <button onClick={onVolver} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5B2D8E', fontSize: 13, fontWeight: 700, padding: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Volver a Notas
            </button>
          )}
          <h1 style={{ color: '#3d1f61', fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.5px' }}>Estudiantes</h1>
          <p style={{ color: '#b0a8c0', fontSize: 13, fontWeight: 500 }}>{estudiantes.length} estudiantes registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!esRecepcion && (
            <>
              <button onClick={descargarPlantilla} style={s.btnSecondary}>Descargar plantilla</button>
              <label style={{ ...s.btnSecondary, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                Importar CSV
                <input type="file" accept=".csv" onChange={importarCSV} style={{ display: 'none' }} />
              </label>
            </>
          )}
          {!esRecepcion && (
            <div />
          )}
        </div>
      </div>

      {/* KPI mini */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20, maxWidth: 480 }}>
        {[
          { label: 'Total', val: estudiantes.length, color: '#5B2D8E', bg: '#f3eeff' },
          { label: 'Activos', val: activos, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Inactivos', val: inactivos, color: '#9ca3af', bg: '#f9fafb' },
        ].map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 12px rgba(61,31,97,0.07)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: k.color }}>{loading ? '...' : k.val}</div>
          </div>
        ))}
      </div>

      {/* Buscador + filtro grado */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input style={{ ...s.search, flex: '1 1 220px', marginBottom: 0 }}
          placeholder="Buscar por nombre, grado o NIE..."
         value={busqueda} onChange={e => { setBusqueda(e.target.value); setPaginaEst(1) }}
 />
        <select
          value={gradoFiltro} onChange={e => { setGradoFiltro(e.target.value ? parseInt(e.target.value) : ''); setPaginaEst(1) }}
          style={{ flex: '0 0 180px', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 13, background: '#fff', color: gradoFiltro ? '#3d1f61' : '#9ca3af', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', cursor: 'pointer' }}>
          <option value="">Todos los grados</option>
          {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div style={s.card}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#b0a8c0', padding: 48, fontSize: 13 }}>Cargando...</p>
        ) : filtrados.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#b0a8c0', padding: 48, fontSize: 13 }}>
            {busqueda ? 'No se encontraron resultados' : 'No hay estudiantes registrados aún'}
          </p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={{ background: '#faf8ff' }}>
                {['Nombre', 'Apellido', 'Grado', 'NIE', 'Género', 'Estado'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradosPaginados.map((e, idx) => (
                <tr key={e.id} style={{ ...s.tr, cursor: 'pointer', background: idx % 2 === 0 ? '#fff' : '#fdfcff' }} onClick={() => {
                  const puedeVerPerfil = ['admin', 'direccion_academica', 'recepcion', 'registro_academico'].includes(perfil?.rol)
                  if (puedeVerPerfil) setEstudianteDetalle(e)
}}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>
                        {e.nombre?.charAt(0)}{e.apellido?.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 700, color: '#3d1f61', fontSize: 13 }}>{e.nombre}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={{ fontWeight: 600, color: '#374151', fontSize: 13 }}>{e.apellido}</span></td>
                  <td style={s.td}><span style={s.gradoBadge}>{e.grados?.nombre || '—'}</span></td>
                  <td style={s.td}><span style={{ fontFamily: 'monospace', fontSize: 13, color: e.nie ? '#374151' : '#d1d5db' }}>{e.nie || 'Sin NIE'}</span></td>
                  <td style={s.td}><span style={{ fontSize: 13, color: '#6b7280', textTransform: 'capitalize' }}>{e.genero || '—'}</span></td>
                  <td style={s.td}>
                    <span onClick={(ev) => cambiarEstado(ev, e)} title="Clic para cambiar estado" style={{ ...s.estadoBadge, background: e.estado === 'activo' ? '#dcfce7' : '#fee2e2', color: e.estado === 'activo' ? '#16a34a' : '#dc2626', cursor: 'pointer' }}>
                      {e.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPaginasEst > 1 && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 0', borderTop: '1px solid #f3eeff' }}>
            <button onClick={() => setPaginaEst(p => Math.max(1, p - 1))} disabled={paginaEst === 1}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: paginaEst === 1 ? '#f9fafb' : '#fff', color: paginaEst === 1 ? '#d1d5db' : '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: paginaEst === 1 ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              ‹ Ant
            </button>
            {Array.from({ length: totalPaginasEst }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPaginasEst || Math.abs(p - paginaEst) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i-1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) => p === '...'
                ? <span key={`e${i}`} style={{ fontSize: 12, color: '#b0a8c0' }}>...</span>
                : <button key={p} onClick={() => setPaginaEst(p)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid', borderColor: paginaEst === p ? '#5B2D8E' : '#e5e7eb', background: paginaEst === p ? '#5B2D8E' : '#fff', color: paginaEst === p ? '#fff' : '#3d1f61', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {p}
                  </button>
              )
            }
            <button onClick={() => setPaginaEst(p => Math.min(totalPaginasEst, p + 1))} disabled={paginaEst === totalPaginasEst}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', background: paginaEst === totalPaginasEst ? '#f9fafb' : '#fff', color: paginaEst === totalPaginasEst ? '#d1d5db' : '#5B2D8E', fontWeight: 700, fontSize: 12, cursor: paginaEst === totalPaginasEst ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              Sig ›
            </button>
          </div>
        )}
      </div>
      {/* Modal nuevo estudiante */}
      {modalAbierto && (
        <div style={s.modalBg} onClick={() => { setModalAbierto(false); resetForm() }}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Nuevo Estudiante</h2>
            <div style={s.field}>
              <label style={s.label}>Tipo de ingreso *</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['antiguo', 'nuevo'].map(tipo => (
                  <button key={tipo} type="button" onClick={() => setForm({ ...form, tipo_ingreso: tipo })} style={{ ...s.tipoBtnBase, background: form.tipo_ingreso === tipo ? '#5B2D8E' : '#f8faff', color: form.tipo_ingreso === tipo ? '#fff' : '#555', border: form.tipo_ingreso === tipo ? 'none' : '1.5px solid #dde3ee' }}>
                    {tipo === 'antiguo' ? 'Antiguo ingreso' : 'Nuevo Ingreso'}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.grid2}>
              <div style={s.field}><label style={s.label}>Nombres *</label><input style={s.input} value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombres completos" /></div>
              <div style={s.field}><label style={s.label}>Apellidos *</label><input style={s.input} value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} placeholder="Apellidos completos" /></div>
            </div>
            <div style={s.grid2}>
              <div style={s.field}><label style={s.label}>Fecha de nacimiento</label><input style={s.input} type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} /></div>
              <div style={s.field}>
                <label style={s.label}>Género *</label>
                <select style={s.input} value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })}>
                  <option value="">— Seleccione —</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </div>
            </div>
            <div style={s.field}><label style={s.label}>NIE (opcional)</label><input style={s.input} value={form.nie} onChange={e => setForm({ ...form, nie: e.target.value })} placeholder="Ej: 12345678-1" /></div>
            <div style={s.field}><label style={s.label}>Correo institucional (opcional)</label><input style={s.input} type="email" value={form.correo_institucional} onChange={e => setForm({ ...form, correo_institucional: e.target.value })} placeholder="estudiante@cbis.edu.sv" /></div>
            <div style={s.field}><label style={s.label}>Dirección</label><input style={s.input} value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección de residencia" /></div>
            <div style={s.field}>
              <label style={s.label}>Grado *</label>
              <select style={s.input} value={form.grado_id} onChange={e => setForm({ ...form, grado_id: e.target.value })}>
                <option value="">— Seleccione un grado —</option>
                {grados.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalAbierto(false); resetForm() }} style={s.btnSecondary}>Cancelar</button>
              <button onClick={guardarEstudiante} style={s.btnPrimary} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle estudiante */}
      {estudianteDetalle && (
        <div style={s.modalBg} onClick={() => setEstudianteDetalle(null)}>
          <div style={{ ...s.modalBox, maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #3d1f61, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 20, flexShrink: 0 }}>
                  {estudianteDetalle.nombre?.charAt(0)}{estudianteDetalle.apellido?.charAt(0)}
                </div>
                <div>
                  <h2 style={{ color: '#3d1f61', fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{estudianteDetalle.nombre} {estudianteDetalle.apellido}</h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: estudianteDetalle.estado === 'activo' ? '#dcfce7' : '#fee2e2', color: estudianteDetalle.estado === 'activo' ? '#16a34a' : '#dc2626' }}>
                      {estudianteDetalle.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                    <span style={{ fontSize: 12, color: '#888' }}>{estudianteDetalle.grados?.nombre}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setEstudianteDetalle(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: ['admin', 'direccion_academica', 'recepcion', 'registro_academico'].includes(perfil?.rol) ? 'pointer' : 'default', color: '#aaa' }}>✕</button>
            </div>
            <FichaTabs estudiante={estudianteDetalle} esRecepcion={esRecepcion} perfil={perfil} onUpdate={async () => { await cargarDatos(); const { data } = await supabase.from('estudiantes').select('*, grados(nombre, nivel)').eq('id', estudianteDetalle.id).single(); if (data) setEstudianteDetalle(data) }} onDelete={() => { setEstudianteDetalle(null); cargarDatos() }} />
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  card: { background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(61,31,97,0.07)', overflow: 'hidden' },
  search: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 16, background: '#fff', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', color: '#374151', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#5B2D8E', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tr: { borderTop: '1px solid #f3eeff' },
  td: { padding: '12px 18px', fontSize: 14, color: '#333' },
  gradoBadge: { background: '#f3eeff', color: '#5B2D8E', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.3, display: 'inline-block' },
  estadoBadge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  btnPrimary: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #5B2D8E, #3d1f61)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  btnSecondary: { padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalBox: { background: '#fff', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  modalTitle: { color: '#3d1f61', fontSize: 17, fontWeight: 800, marginBottom: 20, letterSpacing: '-0.3px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#5B2D8E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#f9fafb', color: '#222', boxSizing: 'border-box', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  tipoBtnBase: { padding: '9px 18px', borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
}