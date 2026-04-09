import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export function usePadreEstudiante() {
  const [estudiante, setEstudiante] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      const { data: { user } } = await supabase.auth.getSession().then(r => ({ data: { user: r.data.session?.user } }))
      if (!user?.id) { console.warn('usePadreEstudiante: no session'); return }
      console.log('usePadreEstudiante: user.id =', user.id)
      const { data, error } = await supabase.rpc('get_padre_estudiante_by_id', {
        p_perfil_id: user.id
      })
      if (error) { console.error('get_padre_estudiante_by_id error:', error); return }
      console.log('usePadreEstudiante data:', data)
      if (data && data.length > 0) {
        const r = data[0]
        setEstudiante({
          id:           r.estudiante_id,
          nombre:       r.nombre,
          apellido:     r.apellido,
          grado_id:     r.grado_id,
          nombre_padre: r.nombre_padre,
          nombre_madre: r.nombre_madre,
          nombre_tutor: r.nombre_tutor,
          parentesco:   r.parentesco,
          grado: {
            id:               r.grado_id,
            nombre:           r.grado_nombre,
            nivel:            r.grado_nivel,
            componentes_nota: r.componentes_nota,
          }
        })
      }
    } catch(e) {
      console.error('usePadreEstudiante:', e)
    } finally {
      setLoading(false)
    }
  }

  return { estudiante, loading }
}
