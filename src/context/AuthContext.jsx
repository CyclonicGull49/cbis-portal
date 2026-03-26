import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sesión activa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) cargarPerfil(session.user.id)
      else setLoading(false)
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) cargarPerfil(session.user.id)
        else { setPerfil(null); setLoading(false) }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function cargarPerfil(userId) {
    // Intentar hasta 3 veces por si hay delay post-registro
    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        setPerfil(data)
        setLoading(false)
        return
      }
      if (error && error.code !== 'PGRST116') {
        // Error real de base de datos (no es simplemente "sin resultados")
        console.error('[AuthContext] Error al cargar perfil:', error.message)
        break
      }
      // Sin perfil aún — esperar antes de reintentar
      await new Promise(r => setTimeout(r, 1000))
    }
    // Si llegamos aquí sin perfil, cerrar sesión para evitar estado inconsistente
    console.warn('[AuthContext] No se encontró perfil para el usuario:', userId)
    await supabase.auth.signOut()
    setPerfil(null)
    setLoading(false)
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    })
    return { data, error }
  }

  async function logout() {
  setLoading(false)
  setPerfil(null)
  await supabase.auth.signOut()
}

  return (
    <AuthContext.Provider value={{ user, perfil, loading, login, logout, signOut: logout }}>
  {children}
</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)