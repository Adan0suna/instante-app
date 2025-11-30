import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    'https://uothcctfocnbjxyopxrg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdGhjY3Rmb2NuYmp4eW9weHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MjIwNzcsImV4cCI6MjA2NTA5ODA3N30.wL0rzg9nHPpUjuNcfjtbqB8XT38XAbj4HjSaYpU5iuY',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // El método `setAll` fue llamado desde un Server Component.
            // Esto puede ser ignorado si tienes middleware refrescando
            // las sesiones de usuario.
          }
        },
      },
    }
  )
} 