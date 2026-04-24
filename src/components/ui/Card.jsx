// src/components/ui/Card.jsx
// Card — CBIS+ Visual Refresh Fase 1.3
//
// Contenedor base blanco flotante. Reutilizable para cualquier bloque de contenido.
// Tres variantes con propósito:
// - variant="default" → card estándar, sombra suave (cardHover solo con hover=true)
// - variant="flat"    → sin sombra, solo borde sutil (cards dentro de cards, o listas)
// - variant="elevated"→ sombra más marcada (modales, elementos destacados)
//
// Props:
// - hover (bool): activar lift + sombra al hover. Default: false (los contenedores no suelen ser clickeables)
// - onClick: si se pasa, automáticamente activa hover (porque ya es clickeable)
// - padding: preset ("sm" | "md" | "lg") o número custom
// - children
//
// Uso:
//   <Card>...</Card>
//   <Card hover onClick={handleClick}>...</Card>
//   <Card variant="flat" padding="sm">...</Card>

import { useState } from 'react'
import { t } from '../../theme/tokens'

export default function Card({
  variant = 'default',
  hover = false,
  padding = 'md',
  onClick,
  children,
  style: customStyle,
  ...rest
}) {
  const [hovered, setHovered] = useState(false)
  const isClickable = !!onClick
  const shouldHover = (hover || isClickable) && hovered

  const paddingValue =
    typeof padding === 'number' ? padding :
    padding === 'sm' ? 16 :
    padding === 'lg' ? 32 :
    24 // md default

  const finalStyle = {
    ...s.base,
    ...s[`variant_${variant}`],
    padding: paddingValue,
    ...(shouldHover ? s[`hover_${variant}`] : null),
    ...(isClickable ? { cursor: 'pointer' } : null),
    ...customStyle, // permitir override puntual
  }

  return (
    <div
      style={finalStyle}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...rest}
    >
      {children}
    </div>
  )
}

const s = {
  base: {
    background: t.color.surface.card,
    borderRadius: t.radius.lg, // 20
    transition: `
      box-shadow ${t.transition.smooth} ${t.transition.snappy},
      transform ${t.transition.base} ${t.transition.snappy},
      border-color ${t.transition.fast} ${t.transition.standard}
    `,
    willChange: 'transform, box-shadow',
  },

  // ─── DEFAULT ─── card estándar
  variant_default: {
    border: `1px solid ${t.color.border.subtle}`,
    boxShadow: t.shadow.card,
  },
  hover_default: {
    boxShadow: t.shadow.cardHover,
    transform: 'translateY(-2px)',
    borderColor: t.color.border.light,
  },

  // ─── FLAT ─── sin sombra (para anidar cards)
  variant_flat: {
    border: `1px solid ${t.color.border.subtle}`,
    boxShadow: 'none',
  },
  hover_flat: {
    borderColor: t.color.border.light,
    background: t.color.surface.raised,
  },

  // ─── ELEVATED ─── más presencia (modales, highlights)
  variant_elevated: {
    border: `1px solid ${t.color.border.subtle}`,
    boxShadow: t.shadow.lg,
  },
  hover_elevated: {
    boxShadow: t.shadow.xl,
    transform: 'translateY(-3px)',
  },
}
