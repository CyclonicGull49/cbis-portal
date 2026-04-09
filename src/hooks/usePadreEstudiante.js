import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

// Hook simple: obtiene el estudiante vinculado al padre logueado
// Sin depender de contexto ni joins anidados
export function usePadreEstudiante() {
  const [estudiante, setEstudiante] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    try {
      // 1. Usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // 2. Vínculo padre→estudiante
      const { data: vinculo } = await supabase
        .from('padre_estudiante')
        .select('estudiante_id, parentesco')
        .eq('perfil_id', user.id)
        .limit(1)
        .single()

      if (!vinculo) { setLoading(false); return }

      // 3. Datos del estudiante
      const { data: est } = await supabase
        .from('estudiantes')
        .select('id, nombre, apellido, grado_id, nombre_padre, nombre_madre, nombre_tutor')
        .eq('id', vinculo.estudiante_id)
        .single()

      if (!est) { setLoading(false); return }

      // 4. Grado
      const { data: grado } = await supabase
        .from('grados')
        .select('id, nombre, nivel, componentes_nota')
        .eq('id', est.grado_id)
        .single()

      setEstudiante({ ...est, grado, parentesco: vinculo.parentesco })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return { estudiante, loading, error }
}
