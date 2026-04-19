import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ─── Custom storage wrapper con logging para diagnosticar ─────
const debugStorage = {
  getItem: (key) => {
    const value = window.localStorage.getItem(key)
    console.log('[storage.getItem]', key, value ? '(presente)' : '(null)')
    return value
  },
  setItem: (key, value) => {
    console.log('[storage.setItem]', key, '(longitud:', value?.length, ')')
    window.localStorage.setItem(key, value)
  },
  removeItem: (key) => {
    console.log('[storage.removeItem] 🚨', key)
    console.trace('[storage.removeItem] Stack trace:')
    window.localStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: debugStorage,
  },
})

// Log inicial para confirmar que el módulo se carga
console.log('[supabase.js] Client inicializado, url:', supabaseUrl)