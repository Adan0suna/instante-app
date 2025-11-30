import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uothcctfocnbjxyopxrg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  throw new Error(
    'Falta la clave anónima de Supabase (VITE_SUPABASE_ANON_KEY). ' +
    'Por favor, agrega esta variable en el archivo .env con el valor de "anon public" de tu proyecto Supabase.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 