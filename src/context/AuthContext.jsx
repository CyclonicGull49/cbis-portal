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
  // Intentar hasta 3 veces por si hay delay
  for (let i = 0; i < 3; i++) {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setPerfil(data)
      setLoading(false)
      return
    }
    // Esperar 1 segundo antes de reintentar
    await new Promise(r => setTimeout(r, 1000))
  }
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