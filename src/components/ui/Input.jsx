// src/components/ui/Input.jsx
// Input — CBIS+ Visual Refresh Fase 1, v2
//
// Filosofía: densidad de datos de CBIS+ demanda legibilidad sobre trendy.
// Por eso 3 variantes con propósito explícito:
//
// - variant="floating"  → label flotante, borde tenue. Para login, formularios cortos.
// - variant="dense"     → label arriba, campo compacto con borde visible. Para tablas,
//                         formularios largos (Estudiantes, Matrícula).
// - variant="search"    → sin borde, bg hundido, parece "flotar". Para search bars.
//
// Uso:
//   <Input variant="floating" label="Correo" value={email} onChange={...} />
//   <Input variant="dense" label="Nombre" value={name} onChange={...} />
//   <Input variant="search" placeholder="Buscar…" leftIcon={<IconSearch/>} />

import { useState, forwardRef, cloneElement, isValidElement } from 'react'
import { t } from '../../theme/tokens'

const Input = forwardRef(function Input({
  variant = 'floating',
  label = null,
  helperText = null,
  error = null,
  leftIcon = null,
  rightIcon = null,
  disabled = false,
  value,
  onChange,
  onFocus,
  onBlur,
  type = 'text',
  placeholder = '',
  size = 'md',
  fullWidth = false,
  id,
  ...rest
}, ref) {
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hasValue = value !== undefined && value !== null && value !== ''
  const isFloating = variant === 'floating' && !!label && (focused || hasValue)
  const inputId = id || `cbis-input-${Math.random().toString(36).slice(2, 8)}`

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16
  const normalizedLeft  = normalizeIcon(leftIcon, iconSize)
  const normalizedRight = normalizeIcon(rightIcon, iconSize)

  const wrapperStyle = { ...s.wrapper, ...(fullWidth ? { width: '100%' } : {}) }

  const fieldStyle = {
    ...s.field,
    ...s[`size_${size}`],
    ...s[`variant_${variant}`],
    ...(error ? s.fieldError : null),
    ...(focused && !error ? s.fieldFocus : null),
    ...(hovered && !focused && !error && variant !== 'search' ? s.fieldHover : null),
    ...(disabled ? s.fieldDisabled : null),
  }

  const inputStyle = {
    ...s.input,
    ...(variant === 'floating' && label ? s.inputFloating : {}),
    ...(normalizedLeft ? { paddingLeft: 0 } : {}),
    ...(normalizedRight ? { paddingRight: 0 } : {}),
  }

  return (
    <div style={wrapperStyle}>
      {/* Label externa (dense/search) */}
      {variant === 'dense' && label && (
        <label htmlFor={inputId} style={s.denseLabel}>{label}</label>
      )}

      <div
        style={fieldStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {normalizedLeft && (
          <span style={{
            ...s.iconLeft,
            color: focused ? t.color.purple[600] : t.color.text.tertiary,
          }}>
            {normalizedLeft}
          </span>
        )}

        {/* Label flotante (solo variant floating) */}
        {variant === 'floating' && label && (
          <label
            htmlFor={inputId}
            style={{
              ...s.floatingLabel,
              ...(normalizedLeft ? { left: 42 } : {}),
              ...(isFloating ? s.floatingLabelUp : {}),
              ...(focused && !error ? { color: t.color.purple[600] } : {}),
              ...(error ? { color: t.color.status.error.solid } : {}),
            }}
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={
            variant === 'floating' && label && !focused ? '' : placeholder
          }
          disabled={disabled}
          onFocus={(e) => { setFocused(true); onFocus?.(e) }}
          onBlur={(e)  => { setFocused(false); onBlur?.(e) }}
          style={inputStyle}
          {...rest}
        />

        {normalizedRight && (
          <span style={s.iconRight}>{normalizedRight}</span>
        )}
      </div>

      {(helperText || error) && (
        <div style={{
          ...s.helper,
          ...(error ? { color: t.color.status.error.solid } : {}),
        }}>
          {error || helperText}
        </div>
      )}
    </div>
  )
})

export default Input

function normalizeIcon(icon, size) {
  if (!icon || !isValidElement(icon)) return icon
  return cloneElement(icon, {
    width: icon.props.width  ?? size,
    height: icon.props.height ?? size,
    strokeWidth: icon.props.strokeWidth ?? 1.75,
  })
}

const s = {
  wrapper: { display: 'inline-flex', flexDirection: 'column', gap: 8 },

  field: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    borderRadius: t.radius.md, // 16 ★
    transition: `
      border-color ${t.transition.fast} ${t.transition.standard},
      box-shadow ${t.transition.base} ${t.transition.snappy},
      background-color ${t.transition.fast} ${t.transition.standard}
    `,
  },

  // ─── VARIANT: floating (login, forms cortos) ──
  variant_floating: {
    background: t.color.surface.card,
    border: `1px solid ${t.color.border.light}`,
    boxShadow: t.shadow.xs,
  },
  // ─── VARIANT: dense (forms densos, tablas) ──
  variant_dense: {
    background: t.color.surface.card,
    border: `1px solid ${t.color.border.medium}`,
  },
  // ─── VARIANT: search (flotante sin borde) ──
  variant_search: {
    background: t.color.surface.sunken,
    border: '1px solid transparent',
    boxShadow: t.shadow.xs,
  },

  // ─── Estados compartidos ──
  fieldHover: {
    borderColor: t.color.border.strong,
    boxShadow: t.shadow.sm,
  },
  fieldFocus: {
    borderColor: t.color.purple[500],
    boxShadow: t.shadow.focusPurple,
    background: t.color.surface.card,
  },
  fieldError: {
    borderColor: t.color.status.error.solid,
    boxShadow: t.shadow.focusError,
  },
  fieldDisabled: {
    background: t.color.surface.sunken,
    cursor: 'not-allowed',
    opacity: 0.6,
  },

  // Sizes
  size_sm: { height: 38 },
  size_md: { height: 48 },
  size_lg: { height: 56 },

  input: {
    flex: 1,
    minWidth: 0,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontFamily: t.font.family,
    fontSize: t.font.size.base,
    color: t.color.text.primary,
    padding: '0 16px',
    height: '100%',
    letterSpacing: t.font.tracking.normal,
  },
  inputFloating: {
    paddingTop: 14, // hueco para la label que sube
  },

  iconLeft: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: '100%',
    color: t.color.text.tertiary,
    transition: t.transition.colors,
    flexShrink: 0,
  },
  iconRight: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 40, height: '100%',
    color: t.color.text.tertiary,
    flexShrink: 0,
  },

  floatingLabel: {
    position: 'absolute',
    left: 16, top: '50%',
    transform: 'translateY(-50%)',
    fontFamily: t.font.family,
    fontSize: t.font.size.base,
    color: t.color.text.tertiary,
    pointerEvents: 'none',
    transition: `
      transform ${t.transition.base} ${t.transition.snappy},
      color ${t.transition.fast} ${t.transition.standard},
      top ${t.transition.base} ${t.transition.snappy}
    `,
    background: t.color.surface.card,
    padding: '0 6px',
    letterSpacing: t.font.tracking.normal,
  },
  floatingLabelUp: {
    top: 0,
    transform: 'translateY(-50%) scale(0.82)',
    transformOrigin: 'left center',
    fontWeight: t.font.weight.semibold,
  },

  denseLabel: {
    fontFamily: t.font.family,
    fontSize: t.font.size.xs,
    fontWeight: t.font.weight.semibold,
    color: t.color.text.secondary,
    letterSpacing: t.font.tracking.wider,
    textTransform: 'uppercase',
    paddingLeft: 2,
  },

  helper: {
    fontFamily: t.font.family,
    fontSize: t.font.size.xs,
    color: t.color.text.tertiary,
    paddingLeft: 4,
  },
}
