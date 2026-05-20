export function ProfileHero({ eyebrow, title, subtitle, avatarUrl, initials, badge, meta, actions = [] }) {
  return (
    <section style={s.hero}>
      <div style={s.heroSheen} />
      <div style={s.heroAccent} />
      <div style={s.heroInner}>
        <div style={s.identity}>
          <Avatar src={avatarUrl} initials={initials} size={82} />
          <div style={s.heroCopy}>
            <div style={s.eyebrow}>{eyebrow}</div>
            <h1 style={s.title}>{title}</h1>
            {subtitle && <p style={s.subtitle}>{subtitle}</p>}
            <div style={s.metaRow}>
              {badge && <span style={s.badge}>{badge}</span>}
              {meta && <span style={s.metaText}>{meta}</span>}
            </div>
          </div>
        </div>
        {actions.length > 0 && (
          <div style={s.actionRow}>
            {actions.map(action => (
              <button key={action.label} type="button" onClick={action.onClick} style={action.primary ? s.heroButtonPrimary : s.heroButton}>
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function Avatar({ src, initials, size = 56 }) {
  return (
    <div style={{ ...s.avatar, width: size, height: size, borderRadius: Math.max(16, size * 0.24), fontSize: Math.max(16, size * 0.28) }}>
      {src ? (
        <img src={src} alt="" style={s.avatarImg} />
      ) : (
        <span>{initials || 'CB'}</span>
      )}
    </div>
  )
}

export function ActionTile({ title, meta, icon, tone = '#FFE7A8', onClick }) {
  const content = (
    <>
      <span style={{ ...s.actionIcon, background: tone }}>{icon}</span>
      <span>
        <span style={s.actionTitle}>{title}</span>
        <span style={s.actionMeta}>{meta}</span>
      </span>
    </>
  )

  if (!onClick) {
    return (
      <article className="profile-action-tile" style={{ ...s.actionTile, cursor: 'default' }}>
        {content}
      </article>
    )
  }

  return (
    <button type="button" onClick={onClick} className="profile-action-tile" style={s.actionTile}>
      {content}
    </button>
  )
}

export function InfoPill({ label, value }) {
  return (
    <article style={s.infoPill}>
      <span style={s.infoLabel}>{label}</span>
      <strong style={s.infoValue}>{value || '—'}</strong>
    </article>
  )
}

export function StudentIdCard({ student, photoUrl, yearEscolar, status = 'Activo' }) {
  const initials = `${student?.nombre?.charAt(0) || ''}${student?.apellido?.charAt(0) || ''}`
  const exp = `01/01/${yearEscolar}`
  const due = `31/12/${yearEscolar}`

  return (
    <article style={s.idCard}>
      <div style={s.idTopLine} />
      <div style={s.idHeader}>
        <div>
          <span style={s.idEyebrow}>Carnet digital</span>
          <h2 style={s.idSchool}>CBIS+</h2>
        </div>
        <img src="/logo.png" alt="CBIS" style={s.idLogo} />
      </div>

      <div style={s.idBody}>
        <Avatar src={photoUrl} initials={initials} size={96} />
        <div style={s.idNameBlock}>
          <span style={s.idLabel}>Estudiante</span>
          <strong style={s.idName}>{student?.nombre} {student?.apellido}</strong>
          <span style={s.idGrade}>{student?.grados?.nombre || 'Grado no asignado'}</span>
        </div>
      </div>

      <div style={s.idGrid}>
        <InfoPill label="NIE" value={student?.nie} />
        <InfoPill label="Estado" value={status} />
        <InfoPill label="Expedición" value={exp} />
        <InfoPill label="Vencimiento" value={due} />
      </div>

      <div style={s.idFooter}>
        <span>Fe, Innovación, Cultura & Disciplina</span>
        <span style={s.idCode}>{student?.id ? `CBIS-${student.id}` : 'CBIS'}</span>
      </div>
    </article>
  )
}

const s = {
  hero: {
    background: 'linear-gradient(135deg, #1a0d30 0%, #2d1554 52%, #5B2D8E 100%)',
    borderRadius: 28,
    padding: 26,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 24px 62px rgba(26,13,48,0.2)',
  },
  heroSheen: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(118deg, transparent 0 54%, rgba(255,255,255,0.08) 54% 68%, transparent 68%)',
    pointerEvents: 'none',
  },
  heroAccent: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 58,
    background: 'rgba(212,160,23,0.16)',
    filter: 'blur(44px)',
    right: 34,
    bottom: -96,
    transform: 'rotate(-14deg)',
    pointerEvents: 'none',
  },
  heroInner: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' },
  identity: { display: 'flex', alignItems: 'center', gap: 18, minWidth: 0 },
  heroCopy: { minWidth: 0 },
  eyebrow: { color: '#D4A017', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.4px', marginBottom: 6 },
  title: { color: '#fff', fontSize: 'clamp(26px, 4vw, 40px)', lineHeight: 1.04, fontWeight: 800, margin: 0, letterSpacing: 0 },
  subtitle: { color: 'rgba(255,255,255,0.68)', fontSize: 14, lineHeight: 1.55, fontWeight: 600, margin: '8px 0 0', maxWidth: 620 },
  metaRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  badge: { color: '#1a0d30', background: '#F5E3A8', borderRadius: 999, padding: '6px 12px', fontSize: 11, fontWeight: 800 },
  metaText: { color: 'rgba(255,255,255,0.62)', fontSize: 12, fontWeight: 700 },
  actionRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  heroButton: { border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.10)', color: '#fff', borderRadius: 14, padding: '10px 13px', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  heroButtonPrimary: { border: 'none', background: '#D4A017', color: '#1a0d30', borderRadius: 14, padding: '10px 13px', fontFamily: 'inherit', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  avatar: { flexShrink: 0, background: 'linear-gradient(135deg, #D4A017, #5B2D8E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, overflow: 'hidden', boxShadow: '0 16px 34px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.18)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  actionTile: { minHeight: 136, border: '1px solid rgba(26,13,48,0.07)', background: '#fff', borderRadius: 22, padding: 16, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', boxShadow: '0 12px 28px rgba(26,13,48,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease' },
  actionIcon: { width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a0d30', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.65)' },
  actionTitle: { display: 'block', color: '#1a0d30', fontSize: 15, fontWeight: 800, lineHeight: 1.15 },
  actionMeta: { display: 'block', color: '#706882', fontSize: 11.5, fontWeight: 600, marginTop: 5, lineHeight: 1.35 },
  infoPill: { background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(26,13,48,0.07)', borderRadius: 16, padding: '11px 12px' },
  infoLabel: { display: 'block', color: '#746b83', fontSize: 9.5, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { display: 'block', color: '#1a0d30', fontSize: 13, fontWeight: 800, lineHeight: 1.2 },
  idCard: { background: 'linear-gradient(155deg, #fff 0%, #F8FBFF 62%, #FFF8DF 100%)', border: '1px solid rgba(26,13,48,0.08)', borderRadius: 28, padding: 20, overflow: 'hidden', position: 'relative', boxShadow: '0 20px 54px rgba(26,13,48,0.12)' },
  idTopLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 7, background: 'linear-gradient(90deg, #5B2D8E, #D4A017, #0e9490)' },
  idHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  idEyebrow: { color: '#746b83', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' },
  idSchool: { color: '#1a0d30', margin: '3px 0 0', fontSize: 24, fontWeight: 900, letterSpacing: 0 },
  idLogo: { width: 48, height: 48, objectFit: 'cover', borderRadius: 14, boxShadow: '0 10px 22px rgba(26,13,48,0.18)' },
  idBody: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 },
  idNameBlock: { minWidth: 0 },
  idLabel: { display: 'block', color: '#746b83', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 },
  idName: { display: 'block', color: '#1a0d30', fontSize: 22, fontWeight: 900, lineHeight: 1.08 },
  idGrade: { display: 'inline-block', color: '#5B2D8E', background: '#F3E8FA', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 900, marginTop: 8 },
  idGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 },
  idFooter: { borderTop: '1px solid rgba(26,13,48,0.08)', marginTop: 16, paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, color: '#746b83', fontSize: 10.5, fontWeight: 800 },
  idCode: { color: '#5B2D8E', background: '#F3E8FA', borderRadius: 999, padding: '4px 8px' },
}
