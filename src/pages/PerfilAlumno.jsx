import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import { NIVEL_COLOR as nivelColor } from '../constants/colores'
import { ActionTile, InfoPill, ProfileHero, StudentIdCard } from '../components/profile/ProfilePrimitives'
import { isSeminarioMateria, qualitativeLabel, qualitativeTone } from '../utils/qualitativeGrades'

const IcoId = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h2M16 14h2M7 10h5M7 14h3"/>
  </svg>
)
const IcoChart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IcoShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-5"/>
  </svg>
)

export default function PerfilAlumno({ seccion = 'perfil', onNavigate = () => {} }) {
  const { perfil } = useAuth()
  const yearEscolar = useYearEscolar()
  const [estudiante, setEstudiante] = useState(null)
  const [fotoUrl, setFotoUrl]       = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (perfil?.estudiante_id) cargarDatos()
  }, [perfil])

  async function cargarDatos() {
    setLoading(true)
    const { data: est } = await supabase
      .from('estudiantes')
      .select('*, grados(nombre, nivel, componentes_nota)')
      .eq('id', perfil.estudiante_id)
      .single()
    setEstudiante(est)
    setFotoUrl('')

    if (est?.id) {
      const { data: docs } = await supabase
        .from('documentos_estudiante')
        .select('storage_path')
        .eq('estudiante_id', est.id)
        .eq('tipo', 'foto_estudiante')
        .limit(1)

      const path = docs?.[0]?.storage_path
      if (path) {
        const { data: signed } = await supabase.storage
          .from('documentos-estudiantes')
          .createSignedUrl(path, 60 * 60)
        if (signed?.signedUrl) setFotoUrl(signed.signedUrl)
      }
    }

    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #f0ecf8', borderTopColor: '#5B2D8E', animation: 'spin 0.8s linear infinite' }} />
        <style>{"@keyframes spin { to { transform: rotate(360deg) } }"}</style>
        <span style={{ fontSize: 13, color: '#b0a8c0', fontWeight: 500 }}>Cargando...</span>
      </div>
    </div>
  )

  if (!estudiante) return (
    <div style={{ textAlign: 'center', padding: 48, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
      <div style={{ color: '#b0a8c0', fontSize: 13 }}>No se encontró un estudiante vinculado a tu cuenta.</div>
    </div>
  )

  const iniciales = `${estudiante.nombre?.charAt(0) || ''}${estudiante.apellido?.charAt(0) || ''}`
  const year = yearEscolar || new Date().getFullYear()
  const estadoLabel = estudiante.estado === 'activo' ? 'Activo' : estudiante.estado || 'Activo'

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', maxWidth: 1080, margin: '0 auto' }}>
      <style>{`
        .profile-action-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 38px rgba(26,13,48,0.11) !important;
          border-color: rgba(91,45,142,0.18) !important;
        }
        @media (max-width: 860px) {
          .student-profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      {seccion === 'perfil' && (
        <div style={{ marginBottom: 18 }}>
          <ProfileHero
            eyebrow="Mi espacio CBIS+"
            title={`${estudiante.nombre} ${estudiante.apellido}`}
            subtitle="Tu información escolar, carnet digital y accesos personales en un solo lugar."
            avatarUrl={fotoUrl}
            initials={iniciales}
            badge={estudiante.grados?.nombre || 'Grado no asignado'}
            meta={`NIE ${estudiante.nie || '—'} · ${estadoLabel}`}
          />
        </div>
      )}

      {/* ── MI PERFIL ────────────────────────────────────────── */}
      {seccion === 'perfil' && (
        <div className="student-profile-grid" style={s.profileGrid}>
          <div style={s.mainColumn}>
            <section style={s.card}>
              <SectionLabel>Accesos personales</SectionLabel>
              <div style={s.actionGrid}>
                <ActionTile title="Carnet digital" meta="Identificación escolar" icon={<IcoId />} tone="#FFE7A8" />
                <ActionTile title="Notas" meta="Resultados por período" icon={<IcoChart />} tone="#CDE7FF" onClick={() => onNavigate('mis-notas')} />
                <ActionTile title="Estado activo" meta="Credencial vigente" icon={<IcoShield />} tone="#DDF7BF" />
              </div>
            </section>

            <section style={s.card}>
              <SectionLabel>Información personal</SectionLabel>
              <div style={s.infoGrid}>
                {[
                  { label: 'Nombre completo', value: `${estudiante.nombre} ${estudiante.apellido}` },
                  { label: 'NIE', value: estudiante.nie },
                  { label: 'Género', value: estudiante.genero },
                  { label: 'Nacimiento', value: estudiante.fecha_nacimiento ? new Date(estudiante.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-SV') : null },
                  { label: 'Correo institucional', value: estudiante.correo_institucional },
                  { label: 'Municipio', value: estudiante.municipio },
                ].map(item => <InfoPill key={item.label} label={item.label} value={item.value} />)}
              </div>
            </section>

            <section style={s.card}>
              <SectionLabel>Encargado</SectionLabel>
              <div style={s.infoGrid}>
                <InfoPill label="Nombre" value={estudiante.nombre_tutor || estudiante.nombre_padre || estudiante.nombre_madre} />
                <InfoPill label="Teléfono" value={estudiante.telefono_tutor || estudiante.telefono_padre || estudiante.telefono_madre} />
              </div>
            </section>
          </div>

          <aside style={s.sideColumn}>
            <StudentIdCard student={estudiante} photoUrl={fotoUrl} yearEscolar={year} status={estadoLabel} />
            <div style={s.noteBox}>
              La fotografía del carnet es administrada por el colegio. Si necesitas actualizarla, solicita el cambio en recepción o registro académico.
            </div>
          </aside>
        </div>
      )}

      {/* ── MIS NOTAS ────────────────────────────────────────── */}
      {seccion === 'notas' && (
        <Boletin
          estudianteId={perfil?.estudiante_id}
          gradoId={perfil?.grado_id || estudiante?.grado_id}
          nivel={estudiante?.grados?.nivel}
          componentesNota={estudiante?.grados?.componentes_nota}
        />
      )}

      {['docs', 'cobros', 'config'].includes(seccion) && (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}><IcoShield /></div>
          <h2 style={s.emptyTitle}>Vista en preparación</h2>
          <p style={s.emptyText}>Esta sección conservará su lógica actual y se rediseñará en el bloque de módulos internos.</p>
        </div>
      )}

    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, color: '#D4A017', textTransform: 'uppercase', letterSpacing: '1.3px', marginBottom: 12 }}>
      {children}
    </div>
  )
}

const s = {
  profileGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 380px)', gap: 18, alignItems: 'start' },
  mainColumn: { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
  sideColumn: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 },
  card: { background: '#fff', borderRadius: 24, padding: 20, boxShadow: '0 16px 42px rgba(26,13,48,0.07), 0 0 0 1px rgba(26,13,48,0.05)' },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 },
  noteBox: { background: '#FEFAF0', border: '1px solid rgba(212,160,23,0.22)', color: '#7A5C0D', borderRadius: 18, padding: '13px 14px', fontSize: 12, lineHeight: 1.55, fontWeight: 700 },
  emptyState: { textAlign: 'center', padding: '58px 24px', background: '#fff', borderRadius: 24, boxShadow: '0 16px 42px rgba(26,13,48,0.07), 0 0 0 1px rgba(26,13,48,0.05)' },
  emptyIcon: { width: 58, height: 58, borderRadius: 18, background: '#F3E8FA', color: '#5B2D8E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' },
  emptyTitle: { color: '#1a0d30', fontSize: 20, fontWeight: 900, margin: '0 0 6px' },
  emptyText: { color: '#706882', fontSize: 13, lineHeight: 1.55, margin: 0, fontWeight: 600 },
}

// ── Boletín ───────────────────────────────────────────────
const PESOS_NOTA = { ac: 0.35, ai: 0.35, em: 0.10, ep: 0.10, ef: 0.20 }

function calcNFT(componentes, notasMap) {
  const vals = componentes.map(c => notasMap[c])
  if (vals.some(v => v === null || v === undefined)) return null
  return componentes.reduce((sum, c) => sum + parseFloat(notasMap[c]) * PESOS_NOTA[c], 0)
}

function colorNota(n) {
  if (n === null || n === undefined) return '#d1d5db'
  if (n < 5)  return '#ef4444'
  if (n < 7)  return '#f59e0b'
  return '#22c55e'
}
function bgNota(n) {
  if (n === null || n === undefined) return '#f9fafb'
  if (n < 5)  return '#fef2f2'
  if (n < 7)  return '#fffbeb'
  return '#f0fdf4'
}

function Boletin({ estudianteId, gradoId, nivel, componentesNota }) {
  const yearEscolar = useYearEscolar()
  const [materias, setMaterias]   = useState([])
  const [notas, setNotas]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [periodoTab, setPeriodoTab] = useState(1)

  const componentes  = componentesNota?.split(',') || ['ac', 'ai', 'em', 'ef']
  const numPeriodos  = nivel === 'bachillerato' ? 4 : 3
  const periodoLabel = nivel === 'bachillerato' ? 'Bimestre' : 'Trimestre'

  useEffect(() => {
    const year = yearEscolar || new Date().getFullYear()
    if (!estudianteId || !gradoId) return
    async function cargar() {
      setLoading(true)
      const [{ data: mgs }, { data: ns }] = await Promise.all([
        supabase.from('materia_grado').select('materia_id').eq('grado_id', gradoId),
        supabase.from('notas').select('*').eq('estudiante_id', estudianteId).eq('grado_id', gradoId).eq('año_escolar', year),
      ])
      if (mgs?.length) {
        const ids = mgs.map(m => m.materia_id)
        const { data: ms } = await supabase.from('materias').select('id, nombre').in('id', ids).order('nombre')
        setMaterias(ms || [])
      }
      const mapa = {}
      for (const n of (ns || [])) mapa[`${n.materia_id}|${n.periodo}|${n.tipo}`] = n.nota
      setNotas(mapa)
      setLoading(false)
    }
    cargar()
  }, [estudianteId, gradoId, yearEscolar])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#b0a8c0', fontSize: 13 }}>Cargando boletín...</div>

  if (!materias.length) return (
    <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(61,31,97,0.06)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f3eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9b8e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#3d1f61', marginBottom: 6 }}>Aún no hay notas registradas</div>
      <div style={{ fontSize: 13, color: '#9ca3af' }}>Las notas aparecerán aquí una vez que el docente las registre.</div>
    </div>
  )

  const materiasConNotas = materias.map(m => {
    const esSeminario = isSeminarioMateria(m)
    const nftsPeriodo = Array.from({ length: numPeriodos }, (_, i) => {
      const map = {}
      for (const c of componentes) map[c] = notas[`${m.id}|${i + 1}|${c}`] ?? null
      return calcNFT(componentes, map)
    })
    const validos = nftsPeriodo.filter(v => v !== null)
    const acu = validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : null
    return { ...m, nftsPeriodo, acu, esSeminario }
  })

  const notasPeriodo = periodoTab > 0
    ? materiasConNotas.filter(m => !m.esSeminario).map(m => m.nftsPeriodo[periodoTab - 1]).filter(v => v !== null)
    : materiasConNotas.filter(m => !m.esSeminario).map(m => m.acu).filter(v => v !== null)
  const promedio = notasPeriodo.length ? notasPeriodo.reduce((a, b) => a + b, 0) / notasPeriodo.length : null

  return (
    <div>
      {/* Tabs período */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
        {Array.from({ length: numPeriodos }, (_, i) => {
          const p = i + 1
          const activo = periodoTab === p
          return (
            <button key={p} onClick={() => setPeriodoTab(p)} style={{
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: activo ? 700 : 600,
              background: activo ? '#1a0d30' : '#fff',
              color: activo ? '#fff' : '#9ca3af',
              boxShadow: activo ? '0 4px 12px rgba(26,13,48,0.2)' : '0 1px 4px rgba(0,0,0,0.06)',
              flexShrink: 0, transition: 'all 0.15s',
            }}>
              {periodoLabel} {p}
            </button>
          )
        })}
        <button onClick={() => setPeriodoTab(0)} style={{
          padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: periodoTab === 0 ? 700 : 600,
          background: periodoTab === 0 ? '#D4A017' : '#fff',
          color: periodoTab === 0 ? '#fff' : '#9ca3af',
          boxShadow: periodoTab === 0 ? '0 4px 12px rgba(212,160,23,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
          flexShrink: 0, marginLeft: 'auto', transition: 'all 0.15s',
        }}>
          Acumulado
        </button>
      </div>

      {/* Promedio */}
      {promedio !== null && (
        <div style={{
          background: 'linear-gradient(135deg, #1a0d30, #3d1f61)',
          borderRadius: 16, padding: '16px 20px', marginBottom: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 2 }}>
              Promedio {periodoTab === 0 ? 'Acumulado' : `${periodoLabel} ${periodoTab}`}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: colorNota(promedio), letterSpacing: '-0.5px' }}>
              {promedio.toFixed(2)}
            </div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `conic-gradient(${colorNota(promedio)} ${(promedio / 10) * 360}deg, rgba(255,255,255,0.1) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2d1554', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: colorNota(promedio) }}>{Math.round((promedio / 10) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista materias */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {materiasConNotas.map(m => {
          const nota = periodoTab === 0 ? m.acu : m.nftsPeriodo[periodoTab - 1]
          const pct  = nota !== null ? Math.min((nota / 10) * 100, 100) : 0
          const tone = m.esSeminario ? qualitativeTone(nota) : null
          return (
            <div key={m.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 6px rgba(61,31,97,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a0d30', flex: 1, paddingRight: 12 }}>{m.nombre}</div>
                <span style={{
                  fontSize: m.esSeminario ? 13 : 16, fontWeight: 900, color: m.esSeminario ? tone.color : colorNota(nota),
                  background: m.esSeminario ? tone.bg : bgNota(nota), padding: '3px 12px', borderRadius: 8,
                  minWidth: m.esSeminario ? 96 : 52, textAlign: 'center', flexShrink: 0,
                }}>
                  {m.esSeminario ? qualitativeLabel(nota) : nota !== null ? nota.toFixed(2) : '—'}
                </span>
              </div>
              <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: nota !== null ? `${pct}%` : '0%',
                  background: m.esSeminario ? tone.color : nota === null ? '#e5e7eb' : nota < 5 ? '#ef4444' : nota < 7 ? '#f59e0b' : '#22c55e',
                  transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
