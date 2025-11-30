import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uothcctfocnbjxyopxrg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdGhjY3Rmb2NuYmp4eW9weHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjIwNzcsImV4cCI6MjA2NTA5ODA3N30.wL0rzg9nHPpUjuNcfjtbqB8XT38XAbj4HjSaYpU5iuY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 