import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export function useYearEscolar() {
  const [yearEscolar, setYearEscolar] = useState(new Date().getFullYear())

  useEffect(() => {
    supabase.from('configuracion')
      .select('valor')
      .eq('clave', 'year_escolar_activo')
      .single()
      .then(({ data }) => {
        if (data?.valor) setYearEscolar(parseInt(data.valor))
      })
  }, [])

  return yearEscolar
}