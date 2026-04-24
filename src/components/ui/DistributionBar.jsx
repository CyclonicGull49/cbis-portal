// src/components/ui/DistributionBar.jsx
// DistributionBar — CBIS+ Visual Refresh Fase 1.3
//
// Muestra distribución proporcional entre N segmentos.
// Dos variantes:
// - variant="list"    → cada segmento en su propia fila (barra horizontal individual) ★ default, más legible
// - variant="stacked" → una sola barra segmentada (más compacto, menos legible)
//
// Usado dentro de KpiCard variant="primary" para mostrar "distribución por nivel" en el Dashboard.
//
// Props:
// - segments: [{ label, value, color }]    ← color esperado: hex sólido del nivel (ej: t.color.level.primaria.solid)
// - total: number                          ← si no se pasa, se suma de segments
// - variant: "list" | "stacked"
// - showValues: bool                       ← mostrar número absoluto al final de cada barra (default true en list)
// - showPercentages: bool                  ← mostrar % en vez de absoluto
// - size: "sm" | "md"                      ← altura de barras
//
// Uso:
//   <DistributionBar
//     segments={[
//       { label: 'Primera Infancia', value: 109, color: t.color.level.primeraInfancia.solid },
//       { label: 'Primaria',         value: 146, color: t.color.level.primaria.solid },
//       { label: 'Secundaria',       value: 96,  color: t.color.level.secundaria.solid },
//       { label: 'Bachillerato',     value: 55,  color: t.color.level.bachillerato.solid },
//     ]}
//   />

import { t } from '../../theme/tokens'

export default function DistributionBar({
  segments = [],
  total: providedTotal,
  variant = 'list',
  showValues = true,
  showPercentages = false,
  size = 'md',
  labelWidth = 140,
  style: customStyle,
}) {
  const total = providedTotal ?? segments.reduce((sum, seg) => sum + seg.value, 0)
  if (total === 0) return null

  if (variant === 'stacked') {
    return (
      <div style={{ ...s.stackedWrap, ...customStyle }}>
        <div style={{ ...s.stackedBar, height: size === 'sm' ? 10 : 14 }}>
          {segments.map((seg, i) => (
            <div
              key={i}
              style={{
                width: `${(seg.value / total) * 100}%`,
                background: seg.color,
                transition: `width ${t.transition.slow} ${t.transition.snappy}`,
              }}
              title={`${seg.label}: ${seg.value}`}
            />
          ))}
        </div>
        {/* Leyenda inline debajo */}
        <div style={s.stackedLegend}>
          {segments.map((seg, i) => (
            <div key={i} style={s.stackedLegendItem}>
              <span style={{ ...s.stackedDot, background: seg.color }} />
              <span style={s.stackedLabel}>{seg.label}</span>
              <span style={s.stackedValue}>{seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // variant="list" (default)
  return (
    <div style={{ ...s.listWrap, ...customStyle }}>
      {segments.map((seg, i) => {
        const percent = (seg.value / total) * 100
        return (
          <div key={i} style={s.listRow}>
            <span style={{ ...s.listLabel, width: labelWidth }}>{seg.label}</span>
            <div style={{ ...s.listBarTrack, height: size === 'sm' ? 6 : 8 }}>
              <div
                style={{
                  ...s.listBarFill,
                  width: `${percent}%`,
                  background: seg.color,
                }}
              />
            </div>
            <span style={{ ...s.listValue, color: seg.color }}>
              {showPercentages ? `${percent.toFixed(0)}%` : seg.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const s = {
  // ─── LIST variant ──────────────────────────
  listWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  listRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  listLabel: {
    flexShrink: 0,
    fontFamily: t.font.family,
    fontSize: t.font.size.sm,
    fontWeight: t.font.weight.medium,
    color: t.color.text.secondary,
    letterSpacing: t.font.tracking.normal,
  },
  listBarTrack: {
    flex: 1,
    background: t.color.surface.sunken,
    borderRadius: t.radius.full,
    overflow: 'hidden',
    position: 'relative',
  },
  listBarFill: {
    height: '100%',
    borderRadius: t.radius.full,
    transition: `width ${t.transition.slow} ${t.transition.snappy}`,
  },
  listValue: {
    flexShrink: 0,
    minWidth: 36,
    textAlign: 'right',
    fontFamily: t.font.family,
    fontSize: t.font.size.base,
    fontWeight: t.font.weight.bold,
    letterSpacing: t.font.tracking.tight,
    fontVariantNumeric: 'tabular-nums',
  },

  // ─── STACKED variant ──────────────────────────
  stackedWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  stackedBar: {
    display: 'flex',
    width: '100%',
    borderRadius: t.radius.full,
    overflow: 'hidden',
    background: t.color.surface.sunken,
  },
  stackedLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px 20px',
  },
  stackedLegendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: t.font.size.sm,
    fontFamily: t.font.family,
  },
  stackedDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  stackedLabel: {
    color: t.color.text.secondary,
    fontWeight: t.font.weight.medium,
  },
  stackedValue: {
    color: t.color.text.primary,
    fontWeight: t.font.weight.bold,
    fontVariantNumeric: 'tabular-nums',
  },
}
