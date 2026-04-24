// src/components/ui/Button.jsx
// Button — CBIS+ Visual Refresh Fase 1, v2
//
// Cambios vs v1:
// - Radius md (16) en vez de md (14)
// - Padding más generoso (más "aire")
// - Gradient con stops más separados → más volumen
// - Iconos default a 20px, stroke 2px consistente
// - Hover lift más marcado (2px) + sombra purpleLg
// - Active scale 0.96 (más táctil)

import { useState, Children, cloneElement, isValidElement } from 'react'
import { t } from '../../theme/tokens'

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  ...rest
}) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const isDisabled = disabled || loading

  // Normalizar tamaño de íconos según el tamaño del botón
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 20
  const normalizedLeft  = normalizeIcon(leftIcon, iconSize)
  const normalizedRight = normalizeIcon(rightIcon, iconSize)

  const style = {
    ...s.base,
    ...s[`size_${size}`],
    ...s[`variant_${variant}`],
    ...(hovered && !isDisabled ? s[`hover_${variant}`] : null),
    ...(pressed && !isDisabled ? s.pressed : null),
    ...(isDisabled ? s.disabled : null),
    ...(fullWidth ? s.fullWidth : null),
  }

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={style}
      {...rest}
    >
      {loading && <Spinner size={iconSize} variant={variant} />}
      {!loading && normalizedLeft && <span style={s.icon}>{normalizedLeft}</span>}
      <span style={s.label}>{children}</span>
      {!loading && normalizedRight && <span style={s.icon}>{normalizedRight}</span>}
    </button>
  )
}

// Forzar width/height consistente en los íconos SVG pasados como prop
function normalizeIcon(icon, size) {
  if (!icon || !isValidElement(icon)) return icon
  return cloneElement(icon, {
    width: icon.props.width  ?? size,
    height: icon.props.height ?? size,
    strokeWidth: icon.props.strokeWidth ?? 2,
  })
}

function Spinner({ size, variant }) {
  const darkBg = variant === 'primary' || variant === 'danger' || variant === 'success'
  const color  = darkBg ? '#fff' : t.color.purple[600]
  return (
    <span style={{
      width: size, height: size,
      border: `2px solid ${darkBg ? 'rgba(255,255,255,0.3)' : 'rgba(91,45,142,0.25)'}`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'cbis-spin 0.7s linear infinite',
      display: 'inline-block',
      flexShrink: 0,
    }} />
  )
}

const s = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontFamily: t.font.family,
    fontWeight: t.font.weight.semibold,
    letterSpacing: t.font.tracking.tight,
    borderRadius: t.radius.md, // 16px ★
    border: '1px solid transparent',
    cursor: 'pointer',
    outline: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    transition: `
      transform ${t.transition.base} ${t.transition.bouncy},
      background-color ${t.transition.fast} ${t.transition.standard},
      background ${t.transition.fast} ${t.transition.standard},
      box-shadow ${t.transition.smooth} ${t.transition.snappy},
      border-color ${t.transition.fast} ${t.transition.standard},
      color ${t.transition.fast} ${t.transition.standard}
    `,
    willChange: 'transform, box-shadow',
  },
  fullWidth: { width: '100%' },
  label: { display: 'inline-block', lineHeight: 1 },
  icon: { display: 'inline-flex', alignItems: 'center', flexShrink: 0 },

  // Sizes — padding más generoso (más aire) ★
  size_sm: { height: 36, padding: '0 16px', fontSize: t.font.size.sm, gap: 8 },
  size_md: { height: 44, padding: '0 22px', fontSize: t.font.size.base }, // ★
  size_lg: { height: 54, padding: '0 28px', fontSize: t.font.size.md, borderRadius: 18 },

  // ─── PRIMARY — gradient con stops separados ──────
  variant_primary: {
    background: `linear-gradient(135deg, ${t.color.purple[500]} 0%, ${t.color.purple[700]} 100%)`,
    color: '#FFFFFF',
    boxShadow: t.shadow.purpleMd,
  },
  hover_primary: {
    background: `linear-gradient(135deg, ${t.color.purple[400]} 0%, ${t.color.purple[600]} 100%)`,
    boxShadow: t.shadow.purpleLg,
    transform: 'translateY(-2px)',
  },

  // ─── SECONDARY — borde tenue, hover con tinte morado ──────
  variant_secondary: {
    background: t.color.surface.card,
    color: t.color.text.primary,
    border: `1px solid ${t.color.border.medium}`,
    boxShadow: t.shadow.xs,
  },
  hover_secondary: {
    border: `1px solid ${t.color.purple[300]}`,
    color: t.color.purple[700],
    boxShadow: t.shadow.sm,
    transform: 'translateY(-1px)',
  },

  // ─── GHOST ──────
  variant_ghost: {
    background: 'transparent',
    color: t.color.purple[600],
    border: '1px solid transparent',
  },
  hover_ghost: {
    background: t.color.purple[50],
    color: t.color.purple[700],
  },

  // ─── DANGER ──────
  variant_danger: {
    background: `linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)`,
    color: '#FFFFFF',
    boxShadow: '0 4px 10px rgba(220, 38, 38, 0.22)',
  },
  hover_danger: {
    background: `linear-gradient(135deg, #F87171 0%, #DC2626 100%)`,
    boxShadow: '0 8px 20px rgba(220, 38, 38, 0.32)',
    transform: 'translateY(-2px)',
  },

  // ─── SUCCESS ──────
  variant_success: {
    background: `linear-gradient(135deg, #10B981 0%, #047857 100%)`,
    color: '#FFFFFF',
    boxShadow: '0 4px 10px rgba(5, 150, 105, 0.22)',
  },
  hover_success: {
    background: `linear-gradient(135deg, #34D399 0%, #059669 100%)`,
    boxShadow: '0 8px 20px rgba(5, 150, 105, 0.32)',
    transform: 'translateY(-2px)',
  },

  // Shared
  pressed: {
    transform: 'scale(0.96)',
    transitionDuration: t.transition.fast,
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
    filter: 'saturate(0.6)',
  },
}

// Keyframes globales (inyectar una vez en App.jsx o en la página):
// @keyframes cbis-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
