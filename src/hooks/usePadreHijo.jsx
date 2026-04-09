import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

const PadreHijoContext = createContext({})

export function PadreHijoProvider({ children }) {
  const { perfil } = useAuth()
  const [hijos,           setHijos]           = useState([])
  const [hijoActual,      setHijoActual]      = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [nombreEncargado, setNombreEncargado] = useState(null)

  useEffect(() => { if (perfil?.id) cargar() }, [perfil?.id])

  async function cargar() {
    setLoading(true)
    try {
      // Pasar el ID explícitamente en lugar de depender de auth.uid() en el servidor
      const { data, error } = await supabase.rpc('get_padre_estudiante_by_id', {
        p_perfil_id: perfil.id
      })
      if (error) { console.error('usePadreHijo RPC error:', error); return }
      console.log('usePadreHijo data:', data, 'perfil.id:', perfil.id)

      const lista = (data || []).map(r => ({
        id:           r.estudiante_id,
        parentesco:   r.parentesco,
        nombre:       r.nombre,
        apellido:     r.apellido,
        grado_id:     r.grado_id,
        nombre_padre: r.nombre_padre,
        nombre_madre: r.nombre_madre,
        nombre_tutor: r.nombre_tutor,
        grados: {
          id:               r.grado_id,
          nombre:           r.grado_nombre,
          nivel:            r.grado_nivel,
          componentes_nota: r.componentes_nota,
        }
      }))

      if (lista.length > 0) {
        const enc = lista[0].nombre_padre || lista[0].nombre_madre || lista[0].nombre_tutor || null
        if (enc) setNombreEncargado(enc)
      }

      setHijos(lista)
      setHijoActual(prev =>
        prev ? (lista.find(h => h.id === prev.id) || lista[0] || null) : (lista[0] || null)
      )
    } catch(e) {
      console.error('usePadreHijo catch:', e)
    } finally {
      setLoading(false)
    }
  }

  async function agregarHijo(estId, parentesco = 'Padre') {
    const { error } = await supabase.rpc('agregar_hijo_padre', {
      p_perfil_id:  perfil.id,
      p_est_id:     estId,
      p_parentesco: parentesco,
    })
    if (error) throw error
    await cargar()
  }

  return (
    <PadreHijoContext.Provider value={{ hijos, hijoActual, setHijoActual, loading, agregarHijo, nombreEncargado }}>
      {children}
    </PadreHijoContext.Provider>
  )
}

export const usePadreHijo = () => useContext(PadreHijoContext)
