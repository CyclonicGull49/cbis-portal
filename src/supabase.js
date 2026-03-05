import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rgbrozdghvdockjpdcri.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnYnJvemRnaHZkb2NranBkY3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzA5NjcsImV4cCI6MjA4ODMwNjk2N30.a94-KeWX1vZXEURO-dcnzQepUdv7ACYRFdDXrp8JBEY'

export const supabase = createClient(supabaseUrl, supabaseKey)