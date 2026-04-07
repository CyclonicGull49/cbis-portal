import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'

const PadreHijoContext = createContext({})

export function PadreHijoProvider({ children }) {
  const { perfil } = useAuth()
  const [hijos,      setHijos]      = useState([])
  const [hijoActual, setHijoActual] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { if (perfil?.id) cargar() }, [perfil?.id])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('padre_estudiante')
      .select(`
        id, parentesco,
        estudiantes (
          id, nombre, apellido, email,
          grados ( id, nombre, nivel, componentes_nota )
        )
      `)
      .eq('perfil_id', perfil.id)

    const lista = (data || []).map(r => ({
      vinculoId:  r.id,
      parentesco: r.parentesco,
      ...r.estudiantes,
    }))
    setHijos(lista)
    setHijoActual(prev =>
      prev ? (lista.find(h => h.id === prev.id) || lista[0] || null) : (lista[0] || null)
    )
    setLoading(false)
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
    <PadreHijoContext.Provider value={{ hijos, hijoActual, setHijoActual, loading, agregarHijo }}>
      {children}
    </PadreHijoContext.Provider>
  )
}

export const usePadreHijo = () => useContext(PadreHijoContext)
