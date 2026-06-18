import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useYearEscolar } from '../hooks/useYearEscolar'
import { ActionTile, InfoPill, ProfileHero } from '../components/profile/ProfilePrimitives'

const IcoNotas = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="13" y1="17" x2="8" y2="17"/>
  </svg>
)
const IcoAsistencia = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
  </svg>
)
const IcoHorario = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IcoAnecdotario = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
)

export default function PerfilDocente({ onNavigate = () => {} }) {
  const { perfil } = useAuth()
  const yearEscolar = useYearEscolar()
  const year = yearEscolar || new Date().getFullYear()
  const [loading, setLoading] = useState(true)
  const [asignaciones, setAsignaciones] = useState([])
  const [gradoEncargado, setGradoEncargado] = useState(null)

  useEffect(() => {
    if (perfil?.id) cargar()
  }, [perfil?.id, year])

  async function cargar() {
    setLoading(true)
    const [{ data: asigs }, { data: grados }] = await Promise.all([
      supabase.from('asignaciones')
        .select('id, grado_id, materia_id, grados(nombre, nivel), materias(nombre)')
        .eq('docente_id', perfil.id)
        .eq('año_escolar', year),
      supabase.from('grados')
        .select('id, nombre, nivel')
        .eq('encargado_id', perfil.id)
        .limit(1),
    ])
    setAsignaciones(asigs || [])
    setGradoEncargado(grados?.[0] || null)
    setLoading(false)
  }

  const nombre = `${perfil?.nombre || ''} ${perfil?.apellido || ''}`.trim()
  const initials = `${perfil?.nombre?.charAt(0) || ''}${perfil?.apellido?.charAt(0) || ''}`
  const avatarUrl = perfil?.foto_url || perfil?.avatar_url || perfil?.photo_url || ''
  const materias = [...new Set(asignaciones.map(a => a.materias?.nombre).filter(Boolean))]
  const grados = [...new Set(asignaciones.map(a => a.grados?.nombre).filter(Boolean))]

  if (loading) {
    return <div style={s.loading}>Cargando perfil docente...</div>
  }

  return (
    <main style={s.page}>
      <style>{`
        .profile-action-tile:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 38px rgba(26,13,48,0.11) !important;
          border-color: rgba(91,45,142,0.18) !important;
        }
        @media (max-width: 860px) {
          .teacher-profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <ProfileHero
        eyebrow="Perfil docente"
        title={nombre || 'Docente CBIS'}
        subtitle="Tu espacio de trabajo para gestionar clases, seguimiento académico y comunicación institucional."
        avatarUrl={avatarUrl}
        initials={initials}
        badge={gradoEncargado ? `Encargado de ${gradoEncargado.nombre}` : 'Docente especialista'}
        meta={`Año escolar ${year}`}
      />

      <section style={s.card}>
        <div style={s.sectionHeader}>
          <div>
            <div style={s.eyebrow}>Centro docente</div>
            <h2 style={s.heading}>Accesos rápidos</h2>
          </div>
          <span style={s.softBadge}>{asignaciones.length} asignaciones</span>
        </div>
        <div style={s.actionGrid}>
          <ActionTile title="Notas" meta="Registrar evaluaciones" icon={<IcoNotas />} tone="#FFE7A8" onClick={() => onNavigate('notas')} />
          <ActionTile title="Asistencia" meta="Control diario de clase" icon={<IcoAsistencia />} tone="#CDEEEA" onClick={() => onNavigate('asistencia')} />
          <ActionTile title="Anecdotario" meta="Seguimiento formativo" icon={<IcoAnecdotario />} tone="#F9C8DC" onClick={() => onNavigate('anecdotario')} />
          <ActionTile title="Horario" meta="Planificación semanal" icon={<IcoHorario />} tone="#D8CCFF" onClick={() => onNavigate('horario')} />
        </div>
      </section>

      <div className="teacher-profile-grid" style={s.grid}>
        <section style={s.card}>
          <div style={s.eyebrow}>Información básica</div>
          <div style={s.infoGrid}>
            <InfoPill label="Nombre" value={nombre} />
            <InfoPill label="Correo" value={perfil?.email} />
            <InfoPill label="Rol" value="Docente" />
            <InfoPill label="Estado" value={perfil?.activo === false ? 'Inactivo' : 'Activo'} />
          </div>
        </section>

        <section style={s.card}>
          <div style={s.eyebrow}>Asignaciones</div>
          {materias.length || grados.length ? (
            <>
              <div style={s.assignmentBlock}>
                <strong style={s.assignmentTitle}>Materias</strong>
                <div style={s.chipRow}>{materias.map(m => <span key={m} style={s.chip}>{m}</span>)}</div>
              </div>
              <div style={s.assignmentBlock}>
                <strong style={s.assignmentTitle}>Grados</strong>
                <div style={s.chipRow}>{grados.map(g => <span key={g} style={s.chipAlt}>{g}</span>)}</div>
              </div>
            </>
          ) : (
            <p style={s.emptyText}>Aún no hay asignaciones registradas para este año escolar.</p>
          )}
        </section>
      </div>
    </main>
  )
}

const s = {
  page: { maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  loading: { textAlign: 'center', padding: 48, color: '#706882', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
  card: { background: '#fff', borderRadius: 24, padding: 20, boxShadow: '0 16px 42px rgba(26,13,48,0.07), 0 0 0 1px rgba(26,13,48,0.05)' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  eyebrow: { color: '#D4A017', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.3px', marginBottom: 5 },
  heading: { color: '#1a0d30', margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: 0 },
  softBadge: { color: '#6b647c', fontSize: 12, fontWeight: 800, background: '#F8FBFF', border: '1px solid rgba(26,13,48,0.07)', borderRadius: 999, padding: '8px 12px' },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 420px)', gap: 18, alignItems: 'start' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 },
  assignmentBlock: { marginTop: 12 },
  assignmentTitle: { display: 'block', color: '#1a0d30', fontSize: 13, fontWeight: 900, marginBottom: 8 },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { color: '#1a0d30', background: '#FFE7A8', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 800 },
  chipAlt: { color: '#5B2D8E', background: '#F3E8FA', borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 800 },
  emptyText: { color: '#706882', fontSize: 13, lineHeight: 1.55, margin: 0, fontWeight: 600 },
}
