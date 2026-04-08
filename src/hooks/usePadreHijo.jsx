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
    const { data } = await supabase
      .from('padre_estudiante')
      .select(`
        id, parentesco,
        estudiantes (
          id, nombre, apellido, email,
          nombre_padre, nombre_madre, nombre_tutor,
          grados ( id, nombre, nivel, componentes_nota )
        )
      `)
      .eq('perfil_id', perfil.id)

    const lista = (data || []).map(r => ({
      vinculoId:  r.id,
      parentesco: r.parentesco,
      ...r.estudiantes,
    }))

    // Determinar nombre del encargado desde la ficha del primer hijo
    if (lista.length > 0) {
      const h = lista[0]
      const nombreEncargado = h.nombre_padre || h.nombre_madre || h.nombre_tutor || null
      if (nombreEncargado) {
        // Actualizar perfil en contexto con el nombre real de la ficha
        setNombreEncargado(nombreEncargado)
      }
    }

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
    <PadreHijoContext.Provider value={{ hijos, hijoActual, setHijoActual, loading, agregarHijo, nombreEncargado }}>
      {children}
    </PadreHijoContext.Provider>
  )
}

export const usePadreHijo = () => useContext(PadreHijoContext)
