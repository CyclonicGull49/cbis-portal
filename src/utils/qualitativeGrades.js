export const QUALITATIVE_OPTIONS = [
  { key: 'B', label: 'Bueno', short: 'B', score: 6, color: '#5B2D8E', bg: '#F3EEFF', border: '#D8C8F0' },
  { key: 'MB', label: 'Muy bueno', short: 'MB', score: 8, color: '#946A00', bg: '#FEF3C7', border: '#F5D06A' },
  { key: 'E', label: 'Excelente', short: 'E', score: 10, color: '#167A56', bg: '#DCFCE7', border: '#8ED9B5' },
]

export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

export function isSeminarioMateria(materia) {
  const nombre = typeof materia === 'string' ? materia : materia?.nombre
  return normalizeText(nombre).includes('seminario')
}

export function scoreFromQualitative(key) {
  const item = QUALITATIVE_OPTIONS.find(opt => opt.key === key)
  return item ? item.score : null
}

export function qualitativeFromScore(score) {
  if (score === null || score === undefined || score === '') return null
  const n = Number(score)
  if (Number.isNaN(n)) return null
  if (n >= 9) return QUALITATIVE_OPTIONS.find(opt => opt.key === 'E')
  if (n >= 7) return QUALITATIVE_OPTIONS.find(opt => opt.key === 'MB')
  return QUALITATIVE_OPTIONS.find(opt => opt.key === 'B')
}

export function qualitativeShort(score) {
  return qualitativeFromScore(score)?.short || '—'
}

export function qualitativeLabel(score) {
  return qualitativeFromScore(score)?.label || '—'
}

export function qualitativeTone(score) {
  return qualitativeFromScore(score) || { color: '#b0a8c0', bg: 'transparent', border: '#e9e3ff' }
}
