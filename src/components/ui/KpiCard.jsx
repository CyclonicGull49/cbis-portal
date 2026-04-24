// src/components/ui/KpiCard.jsx
// KpiCard — CBIS+ Visual Refresh Fase 1.3
//
// Dos variantes con jerarquía clara:
//
// ┌─ PRIMARY ──────────────────────────┐
// │  El "hero" del dashboard. UN solo   │
// │  por vista. Número grande (52px),   │
// │  label debajo (orden: número         │
// │  primero = lo que el cerebro lee).   │
// │  Sin icono (el número ES el héroe).  │
// │  Borde morado alpha muy leve.        │
// │  Slot opcional para DistributionBar. │
// └─────────────────────────────────────┘
//
// ┌─ SECONDARY ────────────────────────┐
// │  Indicadores de apoyo. 3-4 por      │
// │  vista. Compactos (~100px alto).    │
// │  Icono 22px en círculo soft arriba. │
// │  Label uppercase arriba, número     │
// │  debajo, sublabel opcional.         │
// └─────────────────────────────────────┘
//
// Props:
// - variant: "primary" | "secondary" (default: "secondary")
// - value: número o string (se formatea con toLocaleString automáticamente si es number)
// - label: string (el rótulo principal)
// - sublabel: string (opcional, ej: "vs período anterior", "0 cobros pendientes")
// - icon: elemento SVG (solo se muestra en secondary)
// - accent: "purple" | "gold" | "success" | "warning" | "error" | "info" | "primeraInfancia" | "primaria" | "secundaria" | "bachillerato"
//   Controla el color del icono/círculo en secondary, y el borde en primary. Default: "purple"
// - distribution: JSX (se renderiza dentro del primary, típicamente un <DistributionBar />)
// - trend: { direction: "up" | "down" | "neutral", value: string } — opcional, solo secondary
// - loading: bool

import { cloneElement, isValidElement } from 'react'
import { t } from '../../theme/tokens'

export default function KpiCard({
  variant = 'secondary',
  value,
  label,
  sublabel,
  icon,
  accent = 'purple',
  distribution = null,
  trend = null,
  loading = false,
  style: customStyle,
}) {
  const accentCfg = getAccentConfig(accent)
  const formattedValue = typeof value === 'number' ? value.toLocaleString('es-SV') : value

  if (variant === 'primary') {
    return (
      <div style={{
        ...s.primaryCard,
        borderColor: `${accentCfg.solid}14`, // alpha muy leve 8%
        ...customStyle,
      }}>
        {/* Número PRIMERO (jerarquía: lo primero que se lee) */}
        <div style={s.primaryValueBlock}>
          {loading ? (
            <div style={{ ...s.skeleton, width: 180, height: 56 }} />
          ) : (
            <div style={s.primaryValue}>{formattedValue}</div>
          )}
          <div style={s.primaryLabel}>{label}</div>
          {sublabel && <div style={s.primarySublabel}>{sublabel}</div>}
        </div>

        {/* DistributionBar opcional */}
        {distribution && (
          <div style={s.primaryDistributionSlot}>
            {distribution}
          </div>
        )}
      </div>
    )
  }

  // secondary
  return (
    <div style={{ ...s.secondaryCard, ...customStyle }}>
      {icon && (
        <div style={{
          ...s.secondaryIconWrap,
          background: accentCfg.soft,
          color: accentCfg.solid,
        }}>
          {normalizeIcon(icon, 22)}
        </div>
      )}

      <div style={s.secondaryLabel}>{label}</div>

      {loading ? (
        <div style={{ ...s.skeleton, width: 80, height: 32, marginTop: 4 }} />
      ) : (
        <div style={s.secondaryValue}>{formattedValue}</div>
      )}

      {(sublabel || trend) && (
        <div style={s.secondaryFooter}>
          {trend && (
            <span style={{ ...s.trend, color: trendColor(trend.direction) }}>
              {trendArrow(trend.direction)} {trend.value}
            </span>
          )}
          {sublabel && <span style={s.secondarySublabel}>{sublabel}</span>}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────

function getAccentConfig(accent) {
  const map = {
    purple:    { solid: t.color.purple[600],        soft: t.color.purple[100] },
    gold:      { solid: t.color.gold[600],          soft: t.color.gold[100] },
    success:   { solid: t.color.status.success.solid, soft: t.color.status.success.soft },
    warning:   { solid: t.color.status.warning.solid, soft: t.color.status.warning.soft },
    error:     { solid: t.color.status.error.solid,   soft: t.color.status.error.soft },
    info:      { solid: t.color.status.info.solid,    soft: t.color.status.info.soft },
    primeraInfancia: { solid: t.color.level.primeraInfancia.solid, soft: t.color.level.primeraInfancia.soft },
    primaria:        { solid: t.color.level.primaria.solid,        soft: t.color.level.primaria.soft },
    secundaria:      { solid: t.color.level.secundaria.solid,      soft: t.color.level.secundaria.soft },
    bachillerato:    { solid: t.color.level.bachillerato.solid,    soft: t.color.level.bachillerato.soft },
  }
  return map[accent] || map.purple
}

function normalizeIcon(icon, size) {
  if (!icon) return null
  if (!isValidElement(icon)) return icon
  return cloneElement(icon, {
    width: icon.props.width ?? size,
    height: icon.props.height ?? size,
    strokeWidth: icon.props.strokeWidth ?? 2,
  })
}

function trendColor(dir) {
  if (dir === 'up') return t.color.status.success.solid
  if (dir === 'down') return t.color.status.error.solid
  return t.color.text.tertiary
}

function trendArrow(dir) {
  if (dir === 'up') return '↑'
  if (dir === 'down') return '↓'
  return '→'
}

// ─── Estilos ──────────────────────────

const s = {
  // ═════════ PRIMARY ═════════
  primaryCard: {
    background: t.color.surface.card,
    borderRadius: t.radius.xl, // 24
    border: `1px solid ${t.color.purple[600]}14`, // default; se override con accent
    boxShadow: t.shadow.card,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    minHeight: 180,
    transition: `box-shadow ${t.transition.smooth} ${t.transition.snappy}`,
  },
  primaryValueBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  primaryValue: {
    fontFamily: t.font.family,
    fontSize: 52,
    fontWeight: t.font.weight.extrabold,
    letterSpacing: t.font.tracking.tighter,
    lineHeight: t.font.leading.tight,
    color: t.color.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
  primaryLabel: {
    fontFamily: t.font.family,
    fontSize: t.font.size.lg,
    fontWeight: t.font.weight.semibold,
    color: t.color.text.primary,
    letterSpacing: t.font.tracking.tight,
  },
  primarySublabel: {
    marginTop: 2,
    fontFamily: t.font.family,
    fontSize: t.font.size.base,
    color: t.color.text.secondary,
    fontWeight: t.font.weight.regular,
  },
  primaryDistributionSlot: {
    marginTop: 4,
    paddingTop: 18,
    borderTop: `1px solid ${t.color.border.subtle}`,
  },

  // ═════════ SECONDARY ═════════
  secondaryCard: {
    background: t.color.surface.card,
    borderRadius: t.radius.lg, // 20
    border: `1px solid ${t.color.border.subtle}`,
    boxShadow: t.shadow.xs,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minHeight: 102,
    transition: `box-shadow ${t.transition.smooth} ${t.transition.snappy}, transform ${t.transition.base} ${t.transition.snappy}`,
  },
  secondaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: t.radius.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  secondaryLabel: {
    fontFamily: t.font.family,
    fontSize: t.font.size.xs,
    fontWeight: t.font.weight.semibold,
    color: t.color.text.tertiary,
    letterSpacing: t.font.tracking.wider,
    textTransform: 'uppercase',
  },
  secondaryValue: {
    fontFamily: t.font.family,
    fontSize: t.font.size['3xl'], // 28
    fontWeight: t.font.weight.bold,
    letterSpacing: t.font.tracking.tight,
    color: t.color.text.primary,
    lineHeight: t.font.leading.tight,
    fontVariantNumeric: 'tabular-nums',
  },
  secondaryFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    fontSize: t.font.size.xs,
    fontFamily: t.font.family,
  },
  secondarySublabel: {
    color: t.color.text.tertiary,
    fontWeight: t.font.weight.medium,
  },
  trend: {
    fontWeight: t.font.weight.bold,
    letterSpacing: t.font.tracking.normal,
  },

  // ═════════ SKELETON ═════════
  skeleton: {
    background: `linear-gradient(90deg, ${t.color.surface.sunken} 0%, ${t.color.border.subtle} 50%, ${t.color.surface.sunken} 100%)`,
    backgroundSize: '200% 100%',
    borderRadius: t.radius.xs,
    animation: 'cbis-shimmer 1.4s linear infinite',
  },
}

// Keyframe necesario (agregar globalmente):
// @keyframes cbis-shimmer {
//   0%   { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// }
