import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    storageKey: 'sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token',
    detectSessionInUrl: true,
  },
})