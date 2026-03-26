import { useEffect, useState } from 'react'

function getBreakpoint() {
  const w = window.innerWidth
  if (w < 768)  return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export function useBreakpoint() {
  const [bp, setBp] = useState(getBreakpoint)
  useEffect(() => {
    function onResize() { setBp(getBreakpoint()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return bp
}
