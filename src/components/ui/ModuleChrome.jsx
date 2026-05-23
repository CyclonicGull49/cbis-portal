export function ModuleHero({ eyebrow, title, subtitle, meta, stats = [], children }) {
  return (
    <section style={s.hero}>
      <div style={s.heroSheen} />
      <div style={s.heroAccentA} />
      <div style={s.heroAccentB} />
      <div style={s.heroInner}>
        <div style={s.heroCopy}>
          {eyebrow && <div style={s.eyebrow}>{eyebrow}</div>}
          <h1 style={s.title}>{title}</h1>
          {subtitle && <p style={s.subtitle}>{subtitle}</p>}
          {meta && <div style={s.meta}>{meta}</div>}
        </div>
        {(stats.length > 0 || children) && (
          <div style={s.heroPanel}>
            {stats.length > 0 && (
              <div style={s.statsGrid}>
                {stats.map(item => (
                  <div key={item.label} style={s.statItem}>
                    <strong style={{ ...s.statValue, color: item.color || '#fff' }}>{item.value}</strong>
                    <span style={s.statLabel}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
            {children}
          </div>
        )}
      </div>
    </section>
  )
}

export function ModuleToolbar({ children, compact = false }) {
  return (
    <section style={{ ...s.toolbar, padding: compact ? 14 : 18 }}>
      {children}
    </section>
  )
}

export function FieldGroup({ label, children, minWidth = 180 }) {
  return (
    <div style={{ flex: `1 1 ${minWidth}px`, minWidth }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  )
}

export function StatusPill({ label, value, color = '#5B2D8E', bg = '#F3E8FA' }) {
  return (
    <span style={{ ...s.statusPill, color, background: bg, borderColor: color + '30' }}>
      <span style={{ ...s.statusDot, background: color }} />
      {label}
      {value !== undefined && <strong style={s.statusValue}>{value}</strong>}
    </span>
  )
}

export function PremiumEmptyState({ icon, title, text }) {
  return (
    <section style={s.empty}>
      <div style={s.emptyIcon}>{icon}</div>
      <h2 style={s.emptyTitle}>{title}</h2>
      {text && <p style={s.emptyText}>{text}</p>}
    </section>
  )
}

export function TableShell({ children, minWidth = 500 }) {
  return (
    <div style={s.tableShell}>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth }}>{children}</div>
      </div>
    </div>
  )
}

const s = {
  hero: {
    background: 'linear-gradient(135deg, #1a0d30 0%, #2b164f 54%, #65419b 100%)',
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0 18px 46px rgba(26,13,48,0.16)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  heroSheen: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(118deg, transparent 0 56%, rgba(255,255,255,0.075) 56% 69%, transparent 69%)',
    pointerEvents: 'none',
  },
  heroAccentA: {
    position: 'absolute',
    width: 250,
    height: 250,
    right: 54,
    bottom: -92,
    borderRadius: 64,
    background: 'rgba(212,160,23,0.12)',
    filter: 'blur(42px)',
    transform: 'rotate(-14deg)',
  },
  heroAccentB: {
    position: 'absolute',
    width: 180,
    height: 180,
    left: -70,
    top: -80,
    borderRadius: '50%',
    background: 'rgba(14,148,144,0.11)',
    filter: 'blur(42px)',
  },
  heroInner: { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' },
  heroCopy: { flex: '1 1 420px', minWidth: 0 },
  eyebrow: { color: '#F5D46E', fontSize: 10.5, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 7 },
  title: { color: '#fff', fontSize: 'clamp(25px, 3.2vw, 36px)', lineHeight: 1.06, fontWeight: 900, margin: 0, letterSpacing: 0 },
  subtitle: { color: 'rgba(255,255,255,0.70)', fontSize: 13.5, lineHeight: 1.56, fontWeight: 600, maxWidth: 650, margin: '9px 0 0' },
  meta: { display: 'inline-flex', marginTop: 12, color: '#1a0d30', background: '#F5E3A8', borderRadius: 999, padding: '7px 12px', fontSize: 11, fontWeight: 900 },
  heroPanel: { flex: '0 1 340px', minWidth: 252, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.17)', borderRadius: 20, padding: 12, backdropFilter: 'blur(10px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 },
  statItem: { background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 14, padding: '10px 11px' },
  statValue: { display: 'block', fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1 },
  statLabel: { display: 'block', color: 'rgba(255,255,255,0.68)', fontSize: 10, fontWeight: 800, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.06em' },
  toolbar: { background: '#fff', borderRadius: 24, boxShadow: '0 16px 42px rgba(26,13,48,0.07), 0 0 0 1px rgba(26,13,48,0.05)', marginBottom: 16 },
  label: { display: 'block', fontSize: 10, fontWeight: 900, color: '#5B2D8E', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em' },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid', borderRadius: 999, padding: '8px 11px', fontSize: 12, fontWeight: 800 },
  statusDot: { width: 7, height: 7, borderRadius: '50%' },
  statusValue: { fontSize: 14, lineHeight: 1 },
  empty: { textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 24, boxShadow: '0 16px 42px rgba(26,13,48,0.07), 0 0 0 1px rgba(26,13,48,0.05)' },
  emptyIcon: { width: 62, height: 62, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', background: '#F3E8FA', color: '#5B2D8E' },
  emptyTitle: { color: '#1a0d30', fontSize: 19, fontWeight: 900, margin: '0 0 6px' },
  emptyText: { color: '#706882', fontSize: 13, fontWeight: 600, lineHeight: 1.55, margin: 0 },
  tableShell: { background: '#fff', borderRadius: 24, boxShadow: '0 16px 42px rgba(26,13,48,0.07), 0 0 0 1px rgba(26,13,48,0.05)', overflow: 'hidden' },
}
