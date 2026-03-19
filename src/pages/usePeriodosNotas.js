import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

// Retorna funciones para verificar si un período está abierto
export function usePeriodosNotas(yearEscolar) {
  const [periodos, setPeriodos] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!yearEscolar) return
    supabase.from('periodos_notas').select('*').eq('año_escolar', yearEscolar)
      .then(({ data }) => { setPeriodos(data || []); setLoading(false) })
  }, [yearEscolar])

  // Verifica si un período específico está abierto para ingreso de notas
  function isPeriodoAbierto(nivel, numeroPeriodo) {
    const nivelKey = nivel === 'bachillerato' ? 'bachillerato' : 'general'
    const periodo = periodos.find(p => p.nivel === nivelKey && p.numero === numeroPeriodo)
    if (!periodo) return true // Sin fecha límite configurada = abierto
    return new Date() <= new Date(periodo.fecha_limite)
  }

  // Retorna la fecha límite de un período
  function getFechaLimite(nivel, numeroPeriodo) {
    const nivelKey = nivel === 'bachillerato' ? 'bachillerato' : 'general'
    const periodo = periodos.find(p => p.nivel === nivelKey && p.numero === numeroPeriodo)
    return periodo?.fecha_limite || null
  }

  return { periodos, loading, isPeriodoAbierto, getFechaLimite }
}