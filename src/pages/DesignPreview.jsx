// src/pages/DesignPreview.jsx
// Ruta oculta: /design-preview (v3 — Sub-fase 1.3 completa)
//
// Novedades vs v2:
// - Sin blobs decorativos (descartados: se veían bajos comparado con lo actual)
// - Card + KpiCard primary/secondary + DistributionBar
// - Simulación de Dashboard admin completo para sentir el antes/después

import { useState } from 'react'
import { t } from '../theme/tokens'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import KpiCard from '../components/ui/KpiCard'
import DistributionBar from '../components/ui/DistributionBar'

// ─── Iconos SVG inline (stroke 2 consistente) ───
const I = {
  search:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  mail:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/></svg>,
  lock:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  plus:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  arrow:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  trash:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
  card:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>,
  chart:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>,
  clock:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  alert:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
}

export default function DesignPreview() {
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2200)
  }

  const levelSegments = [
    { label: 'Primera Infancia', value: 109, color: t.color.level.primeraInfancia.solid },
    { label: 'Primaria',         value: 146, color: t.color.level.primaria.solid },
    { label: 'Secundaria',       value: 96,  color: t.color.level.secundaria.solid },
    { label: 'Bachillerato',     value: 55,  color: t.color.level.bachillerato.solid },
  ]

  return (
    <div style={s.page}>
      <style>{`
        @keyframes cbis-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes cbis-fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cbis-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .cbis-fade-in { animation: cbis-fade-in-up 400ms cubic-bezier(0.22, 1, 0.36, 1) both; }
        .cbis-stagger-1 { animation-delay: 60ms; }
        .cbis-stagger-2 { animation-delay: 120ms; }
        .cbis-stagger-3 { animation-delay: 180ms; }
        .cbis-stagger-4 { animation-delay: 240ms; }
      `}</style>

      {/* ═══════════ HEADER limpio y potente (sin blobs) ═══════════ */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.eyebrow}>VISUAL REFRESH · FASE 1.3</div>
          <h1 style={s.title}>Design Preview</h1>
          <p style={s.subtitle}>
            Card + KpiCard (primary/secondary) + DistributionBar. Sistema jerárquico con propósito.
            Al final, simulación de Dashboard admin para ver el antes/después.
          </p>
        </div>
      </header>

      {/* ═══════════ DASHBOARD SIMULATION (lo importante) ═══════════ */}
      <Section
        title="⚡ Dashboard admin — simulación"
        description="Así se sentiría el Dashboard aplicando el nuevo sistema. Hero (texto) → KPI primary (406 + distribución) → KPIs secondary (cobros). Un líder claro, todos coherentes, sin la card oscura rompiendo armonía."
      >
        {/* Hero del dashboard — minimalista, de texto */}
        <div style={s.dashHero}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={s.dashDate}>sábado, 18 de abril de 2026</span>
            <span style={s.dashRolePill}>ADMINISTRADOR</span>
          </div>
          <h2 style={s.dashGreeting}>Buenos días, Julio</h2>
          <p style={s.dashSub}>Colegio Bautista Internacional de Sonsonate</p>
        </div>

        {/* KPI primary + distribución inline */}
        <div className="cbis-fade-in">
          <KpiCard
            variant="primary"
            value={406}
            label="Estudiantes activos"
            sublabel="de 406 matriculados · año escolar 2026"
            accent="bachillerato"
            distribution={
              <DistributionBar
                segments={levelSegments}
                labelWidth={150}
              />
            }
          />
        </div>

        {/* KPIs secondary en grid */}
        <div style={s.secondaryGrid}>
          <div className="cbis-fade-in cbis-stagger-1">
            <KpiCard
              variant="secondary"
              value="$0.00"
              label="Cobrado hoy"
              sublabel="ingresos del día"
              icon={<I.card />}
              accent="success"
            />
          </div>
          <div className="cbis-fade-in cbis-stagger-2">
            <KpiCard
              variant="secondary"
              value="$0.00"
              label="Cobrado este mes"
              sublabel="ingresos del mes"
              icon={<I.chart />}
              accent="purple"
            />
          </div>
          <div className="cbis-fade-in cbis-stagger-3">
            <KpiCard
              variant="secondary"
              value="$0.00"
              label="Pendiente de cobro"
              sublabel="0 cobros pendientes"
              icon={<I.clock />}
              accent="warning"
            />
          </div>
          <div className="cbis-fade-in cbis-stagger-4">
            <KpiCard
              variant="secondary"
              value={0}
              label="Cobros vencidos"
              sublabel="requieren atención"
              icon={<I.alert />}
              accent="error"
            />
          </div>
        </div>

        <div style={s.contextNote}>
          <strong>Compara con el dashboard actual:</strong> la vieja card morada oscura desapareció.
          Ahora hay un líder claro (el KPI de 406 con distribución), y 4 cards secundarias que se leen
          en un vistazo. Jerarquía, no inconsistencia.
        </div>
      </Section>

      {/* ═══════════ KPI CARD — componente aislado ═══════════ */}
      <Section
        title="KpiCard — variantes primary y secondary"
        description="Jerarquía interna: número primero, label debajo (el cerebro lee el dato antes del rótulo). Sin icono en primary (el número es el hero). Icono 22px en círculo soft en secondary."
      >
        <Row label="Primary — con distribución inline (el líder del Dashboard)">
          <div style={{ width: 520 }}>
            <KpiCard
              variant="primary"
              value={406}
              label="Estudiantes activos"
              sublabel="de 406 matriculados"
              accent="bachillerato"
              distribution={<DistributionBar segments={levelSegments} labelWidth={150} />}
            />
          </div>
        </Row>

        <Row label="Primary — sin distribución (para roles que no la necesitan)">
          <div style={{ width: 380 }}>
            <KpiCard
              variant="primary"
              value="8 solicitudes"
              label="Por revisar hoy"
              sublabel="2 urgentes · 6 regulares"
              accent="warning"
            />
          </div>
        </Row>

        <Row label="Secondary — icono + label + valor + sublabel/trend">
          <div style={{ width: 240 }}>
            <KpiCard
              variant="secondary"
              value="$12,840"
              label="Cobrado hoy"
              sublabel="vs ayer"
              trend={{ direction: 'up', value: '+18%' }}
              icon={<I.card />}
              accent="success"
            />
          </div>
          <div style={{ width: 240 }}>
            <KpiCard
              variant="secondary"
              value={12}
              label="Pendiente de cobro"
              icon={<I.clock />}
              accent="warning"
              trend={{ direction: 'down', value: '-3' }}
            />
          </div>
          <div style={{ width: 240 }}>
            <KpiCard
              variant="secondary"
              value={3}
              label="Cobros vencidos"
              sublabel="requieren atención"
              icon={<I.alert />}
              accent="error"
            />
          </div>
        </Row>

        <Row label="Loading state (skeleton con shimmer)">
          <div style={{ width: 240 }}>
            <KpiCard variant="secondary" label="Cargando…" icon={<I.chart />} loading />
          </div>
        </Row>
      </Section>

      {/* ═══════════ DISTRIBUTION BAR — variantes ═══════════ */}
      <Section
        title="DistributionBar — list vs stacked"
        description="Elegimos `list` por default (Opción A): más legible para nuestro usuario (docentes 45+, padres de todas las edades). Stacked es más elegante pero menos legible."
      >
        <Row label="Variant list (default — recomendada)">
          <div style={{ width: 480 }}>
            <DistributionBar segments={levelSegments} labelWidth={140} />
          </div>
        </Row>

        <Row label="Variant stacked (más compacta, menos legible)">
          <div style={{ width: 480 }}>
            <DistributionBar segments={levelSegments} variant="stacked" />
          </div>
        </Row>

        <Row label="List con porcentajes en vez de valores absolutos">
          <div style={{ width: 480 }}>
            <DistributionBar segments={levelSegments} showPercentages labelWidth={140} />
          </div>
        </Row>
      </Section>

      {/* ═══════════ CARD BASE — variantes ═══════════ */}
      <Section
        title="Card — contenedor base"
        description="3 variantes: default (flotante), flat (sin sombra, para anidar), elevated (más presencia). Hover opcional: sube 2px + sombra crece."
      >
        <Row label="Default · con hover activado">
          <Card hover style={{ width: 280 }}>
            <h4 style={s.cardTitle}>Card default</h4>
            <p style={s.cardText}>
              Sombra `card` (2 capas). Hover sube 2px. Pasale el mouse.
            </p>
          </Card>
          <Card hover style={{ width: 280 }}>
            <h4 style={s.cardTitle}>Clickeable</h4>
            <p style={s.cardText}>
              Si tiene onClick, hover se activa automáticamente.
            </p>
          </Card>
        </Row>

        <Row label="Flat · para anidar dentro de cards">
          <Card variant="flat" style={{ width: 280 }}>
            <h4 style={s.cardTitle}>Card flat</h4>
            <p style={s.cardText}>Sin sombra, solo borde. Ideal dentro de otra Card.</p>
          </Card>
        </Row>

        <Row label="Elevated · destacar algo">
          <Card variant="elevated" hover style={{ width: 280 }}>
            <h4 style={s.cardTitle}>Card elevated</h4>
            <p style={s.cardText}>Sombra lg. Para modales o elementos que queremos que destaquen.</p>
          </Card>
        </Row>
      </Section>

      {/* ═══════════ BUTTONS (repaso de Fase 1.2) ═══════════ */}
      <Section
        title="Buttons — repaso"
        description="Para que tengas el set completo a mano."
      >
        <Row label="Variantes">
          <Button variant="primary">Guardar cambios</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="ghost">Ver más</Button>
          <Button variant="danger" leftIcon={<I.trash />}>Eliminar</Button>
          <Button variant="success" leftIcon={<I.check />}>Aprobar</Button>
        </Row>

        <Row label="Estados">
          <Button loading={loading} onClick={handleLoadingDemo}>
            {loading ? 'Guardando…' : 'Probar loading'}
          </Button>
          <Button disabled>Deshabilitado</Button>
        </Row>
      </Section>

      {/* ═══════════ INPUTS (repaso de Fase 1.2) ═══════════ */}
      <Section
        title="Inputs — repaso"
        description="3 variantes: floating (login), dense (formularios densos), search."
      >
        <Row label="Floating / Dense / Search">
          <div style={{ width: 280 }}>
            <Input variant="floating" label="Correo" type="email" value={email} onChange={e=>setEmail(e.target.value)} leftIcon={<I.mail/>} fullWidth />
          </div>
          <div style={{ width: 200 }}>
            <Input variant="dense" label="NOMBRE" value="Jessica Sophia" onChange={()=>{}} fullWidth />
          </div>
          <div style={{ width: 320 }}>
            <Input variant="search" placeholder="Buscar estudiante…" value={search} onChange={e=>setSearch(e.target.value)} leftIcon={<I.search/>} fullWidth />
          </div>
        </Row>
      </Section>

      <footer style={s.footer}>
        <p style={{ margin: 0, fontWeight: 500 }}>
          Si apruebas, siguiente: <strong>Sub-fase 1.4 — Tag/Badge + estado activo del sidebar</strong>.
          Luego propagación al Dashboard real.
        </p>
      </footer>
    </div>
  )
}

/* ─── Helpers ─── */

function Section({ title, description, children }) {
  return (
    <section style={s.section}>
      <div style={s.sectionHead}>
        <h2 style={s.sectionTitle}>{title}</h2>
        {description && <p style={s.sectionDesc}>{description}</p>}
      </div>
      <div style={s.sectionBody}>{children}</div>
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div style={s.row}>
      <div style={s.rowLabel}>{label}</div>
      <div style={s.rowContent}>{children}</div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: t.color.surface.page,
    fontFamily: t.font.family,
    color: t.color.text.primary,
    paddingBottom: 80,
  },

  // ─── HEADER limpio ─────────────────
  header: {
    padding: '56px 40px 40px',
    borderBottom: `1px solid ${t.color.border.subtle}`,
    background: t.color.surface.card,
    marginBottom: 32,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
  },
  eyebrow: {
    fontSize: t.font.size.xs,
    fontWeight: t.font.weight.bold,
    color: t.color.purple[600],
    letterSpacing: t.font.tracking.wider,
    marginBottom: 8,
  },
  title: {
    fontSize: t.font.size['4xl'],
    fontWeight: t.font.weight.extrabold,
    letterSpacing: t.font.tracking.tighter,
    margin: 0,
    lineHeight: t.font.leading.tight,
    color: t.color.text.primary,
  },
  subtitle: {
    marginTop: 10,
    fontSize: t.font.size.lg,
    color: t.color.text.secondary,
    maxWidth: 720,
    lineHeight: t.font.leading.normal,
  },

  // ─── Dashboard simulation ─────────────────
  dashHero: {
    padding: '4px 0 20px',
  },
  dashDate: {
    fontFamily: t.font.family,
    fontSize: t.font.size.base,
    color: t.color.text.tertiary,
    fontWeight: t.font.weight.medium,
  },
  dashRolePill: {
    padding: '4px 10px',
    background: t.color.gold[100],
    color: t.color.gold[700],
    fontSize: t.font.size.xs,
    fontWeight: t.font.weight.bold,
    letterSpacing: t.font.tracking.wider,
    borderRadius: t.radius.full,
    textTransform: 'uppercase',
  },
  dashGreeting: {
    margin: '6px 0 4px',
    fontSize: 34,
    fontWeight: t.font.weight.bold,
    letterSpacing: t.font.tracking.tight,
    lineHeight: t.font.leading.tight,
  },
  dashSub: {
    margin: 0,
    fontSize: t.font.size.base,
    color: t.color.text.secondary,
  },
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  contextNote: {
    marginTop: 4,
    padding: '14px 18px',
    background: t.color.purple[50],
    border: `1px dashed ${t.color.purple[300]}`,
    borderRadius: t.radius.md,
    color: t.color.purple[700],
    fontSize: t.font.size.base,
    lineHeight: t.font.leading.normal,
  },

  // ─── Section ─────────────────
  section: {
    maxWidth: 1200,
    margin: '0 auto 28px',
    padding: '0 40px',
  },
  sectionHead: {
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: t.font.size['2xl'],
    fontWeight: t.font.weight.bold,
    letterSpacing: t.font.tracking.tight,
  },
  sectionDesc: {
    margin: '6px 0 0',
    fontSize: t.font.size.base,
    color: t.color.text.secondary,
    lineHeight: t.font.leading.normal,
    maxWidth: 760,
  },
  sectionBody: {
    background: t.color.surface.card,
    borderRadius: t.radius.xl,
    border: `1px solid ${t.color.border.subtle}`,
    boxShadow: t.shadow.card,
    padding: '28px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  row: { display: 'flex', flexDirection: 'column', gap: 12 },
  rowLabel: {
    fontSize: t.font.size.xs,
    fontWeight: t.font.weight.semibold,
    color: t.color.text.tertiary,
    letterSpacing: t.font.tracking.wider,
    textTransform: 'uppercase',
  },
  rowContent: {
    display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'stretch',
  },

  // Helpers para cards demo
  cardTitle: {
    margin: '0 0 6px',
    fontSize: t.font.size.lg,
    fontWeight: t.font.weight.bold,
    letterSpacing: t.font.tracking.tight,
  },
  cardText: {
    margin: 0,
    fontSize: t.font.size.base,
    color: t.color.text.secondary,
    lineHeight: t.font.leading.normal,
  },

  footer: {
    maxWidth: 1200,
    margin: '32px auto 0',
    padding: '24px 32px',
    background: t.color.purple[50],
    border: `1px dashed ${t.color.purple[300]}`,
    borderRadius: t.radius.lg,
    color: t.color.purple[700],
    fontSize: t.font.size.base,
    textAlign: 'center',
    marginLeft: 40,
    marginRight: 40,
  },
}
