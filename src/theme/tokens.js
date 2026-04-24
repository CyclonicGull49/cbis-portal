// src/theme/tokens.js
// CBIS+ Design Tokens — v2 (Visual Refresh Fase 1, iteración 2)
//
// Cambios vs v1 (con propósito, no por cosmética):
// - Radius más generoso (amigable sin perder seriedad)
// - surface.page → #F8FAFC (fondo neutro limpio, cards "flotan")
// - Sombras recalibradas con 2 capas (cercana + difusa) + tinted por variante
// - Gradient botón primario con stops más separados
// - Tracking negativo en titulares (premium feel)

export const tokens = {
  // ─── COLOR ───────────────────────────────────────────────
  color: {
    purple: {
      900: '#1a0d30', 800: '#2d1554', 700: '#3d1f61',
      600: '#5B2D8E', 500: '#7C4DB3', 400: '#A881D4',
      300: '#C9AEE5', 200: '#E8D5F2', 100: '#F3E8FA', 50: '#FAF5FE',
    },
    gold: {
      700: '#9B6F08', 600: '#B8860A', 500: '#D4A017',
      400: '#E0B744', 300: '#ECCF77', 200: '#F5E3A8',
      100: '#FDF3E6', 50:  '#FEFAF0',
    },
    level: {
      primeraInfancia: { solid: '#0e9490', soft: '#D5F0ED', softer: '#EAF7F6', text: '#0A6E6B' },
      primaria:        { solid: '#a16207', soft: '#FDF3E6', softer: '#FEF9F1', text: '#7A4A05' },
      secundaria:      { solid: '#c2410c', soft: '#FDE5D8', softer: '#FEF1E8', text: '#92310A' },
      bachillerato:    { solid: '#5B2D8E', soft: '#E8D5F2', softer: '#F3E8FA', text: '#44226B' },
    },
    status: {
      success: { solid: '#059669', soft: '#D1FAE5', softer: '#ECFDF5', text: '#065F46' },
      warning: { solid: '#D4A017', soft: '#FDF3E6', softer: '#FEFAF0', text: '#7A5C0D' },
      error:   { solid: '#DC2626', soft: '#FEE2E2', softer: '#FEF2F2', text: '#991B1B' },
      info:    { solid: '#2563EB', soft: '#DBEAFE', softer: '#EFF6FF', text: '#1E40AF' },
    },
    surface: {
      page:   '#F8FAFC', // ★ fondo base, neutro frío
      card:   '#FFFFFF',
      raised: '#FCFDFE',
      sunken: '#F1F5F9',
    },
    border: {
      subtle: 'rgba(15, 23, 42, 0.05)',
      light:  'rgba(15, 23, 42, 0.07)',
      medium: 'rgba(15, 23, 42, 0.10)',
      strong: 'rgba(15, 23, 42, 0.16)',
    },
    text: {
      primary:   '#0F172A',
      secondary: '#475569',
      tertiary:  '#94A3B8',
      disabled:  '#CBD5E1',
      onDark:    '#FFFFFF',
      onDarkSec: 'rgba(255, 255, 255, 0.72)',
    },
  },

  // ─── SPACING (4pt) ───────────────────────────────────────
  spacing: {
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
    8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
  },

  // ─── RADIUS ★ más orgánico ───────────────────────────────
  radius: {
    xs: 8, sm: 12,
    md: 16,   // inputs/botones
    lg: 20,   // cards
    xl: 24,   // KPIs, cards grandes
    '2xl': 32,
    full: 9999,
  },

  // ─── TIPOGRAFÍA ──────────────────────────────────────────
  font: {
    family: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    size: {
      xs: 11, sm: 12, base: 14, md: 15, lg: 16,
      xl: 18, '2xl': 22, '3xl': 28, '4xl': 36, '5xl': 48, '6xl': 60,
    },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
    leading: { tight: 1.15, snug: 1.35, normal: 1.5, relaxed: 1.65 },
    tracking: {
      tighter: '-0.03em', tight: '-0.02em', normal: '0',
      wide: '0.02em', wider: '0.06em', widest: '0.12em',
    },
  },

  // ─── SHADOWS — "flotante" de verdad ──────────────────────
  shadow: {
    none: 'none',
    xs:  '0 1px 2px rgba(15, 23, 42, 0.04)',
    sm:  '0 2px 4px rgba(15, 23, 42, 0.04), 0 4px 8px rgba(15, 23, 42, 0.03)',
    // ★ card estándar — exacta como Julio pidió
    card:      '0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 10px 15px -3px rgba(15, 23, 42, 0.05)',
    cardHover: '0 8px 12px -2px rgba(15, 23, 42, 0.06), 0 16px 24px -4px rgba(15, 23, 42, 0.08)',
    md:  '0 4px 8px rgba(15, 23, 42, 0.05), 0 12px 24px rgba(15, 23, 42, 0.06)',
    lg:  '0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 20px 35px -5px rgba(15, 23, 42, 0.08)',
    xl:  '0 15px 25px -5px rgba(15, 23, 42, 0.08), 0 30px 50px -10px rgba(15, 23, 42, 0.12)',

    // Tinted morado
    purpleSm: '0 2px 6px rgba(91, 45, 142, 0.14), 0 4px 12px rgba(91, 45, 142, 0.08)',
    purpleMd: '0 4px 10px rgba(91, 45, 142, 0.20), 0 10px 24px rgba(91, 45, 142, 0.14)',
    purpleLg: '0 8px 16px rgba(91, 45, 142, 0.26), 0 16px 40px rgba(91, 45, 142, 0.18)',

    goldSm: '0 2px 6px rgba(212, 160, 23, 0.16)',
    goldMd: '0 4px 12px rgba(212, 160, 23, 0.22)',

    // Tinted por nivel
    levelInfancia:     '0 8px 20px rgba(14, 148, 144, 0.18)',
    levelPrimaria:     '0 8px 20px rgba(161, 98, 7, 0.16)',
    levelSecundaria:   '0 8px 20px rgba(194, 65, 12, 0.18)',
    levelBachillerato: '0 8px 20px rgba(91, 45, 142, 0.20)',

    // Focus rings más visibles
    focusPurple: '0 0 0 4px rgba(91, 45, 142, 0.15)',
    focusError:  '0 0 0 4px rgba(220, 38, 38, 0.18)',
  },

  // ─── TRANSITIONS ─────────────────────────────────────────
  transition: {
    fast: '150ms', base: '200ms', smooth: '280ms', slow: '400ms',
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    snappy:   'cubic-bezier(0.22, 1, 0.36, 1)',
    bouncy:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
    silk:     'cubic-bezier(0.4, 0, 0.6, 1)',
    colors: 'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
  },

  z: { base: 1, dropdown: 10, sticky: 20, overlay: 30, modal: 40, popover: 50, toast: 60, tooltip: 70 },
  bp: { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
}

export const t = tokens
