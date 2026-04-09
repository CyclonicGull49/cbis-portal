import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

// Hook standalone que usa el perfil directamente desde la sesión activa
export function usePadreEstudiante() {
  const [estudiante, setEstudiante] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id
      if (!uid) { return }

      const { data, error } = await supabase.rpc('get_padre_estudiante_by_id', { p_perfil_id: uid })
      if (error) { console.error('usePadreEstudiante:', error); return }

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
      console.error('usePadreEstudiante catch:', e)
    } finally {
      setLoading(false)
    }
  }

  return { estudiante, loading }
}
