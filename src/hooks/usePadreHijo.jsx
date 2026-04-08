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

    // Paso 1: obtener IDs vinculados
    const { data: vinculos } = await supabase
      .from('padre_estudiante')
      .select('id, parentesco, estudiante_id')
      .eq('perfil_id', perfil.id)

    if (!vinculos || vinculos.length === 0) {
      setHijos([])
      setHijoActual(null)
      setLoading(false)
      return
    }

    const ids = vinculos.map(v => v.estudiante_id)

    // Paso 2: cargar datos de los estudiantes
    const { data: ests } = await supabase
      .from('estudiantes')
      .select('id, nombre, apellido, email, nombre_padre, nombre_madre, nombre_tutor, grado_id, grados(id, nombre, nivel, componentes_nota)')
      .in('id', ids)

    const lista = vinculos.map(v => {
      const est = (ests || []).find(e => e.id === v.estudiante_id)
      return est ? { vinculoId: v.id, parentesco: v.parentesco, ...est } : null
    }).filter(Boolean)

    // Nombre del encargado desde ficha
    if (lista.length > 0) {
      const enc = lista[0].nombre_padre || lista[0].nombre_madre || lista[0].nombre_tutor || null
      if (enc) setNombreEncargado(enc)
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
