import { createServerClient, type CookieOptions } from "@supabase/ssr"

export const createClient = (request: Request) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan las variables de entorno de Supabase')
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.headers.get('cookie')?.split(';')
            .find(cookie => cookie.trim().startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: CookieOptions) {
          const response = new Response()
          response.headers.append(
            'Set-Cookie',
            `${name}=${value}; Path=${options.path || '/'}; ${
              options.maxAge ? `Max-Age=${options.maxAge};` : ''
            } ${options.secure ? 'Secure;' : ''} ${
              options.httpOnly ? 'HttpOnly;' : ''
            } ${options.sameSite ? `SameSite=${options.sameSite};` : ''}`
          )
        },
        remove(name: string, options: CookieOptions) {
          const response = new Response()
          response.headers.append(
            'Set-Cookie',
            `${name}=; Path=${options.path || '/'}; Max-Age=0; ${
              options.secure ? 'Secure;' : ''
            } ${options.httpOnly ? 'HttpOnly;' : ''} ${
              options.sameSite ? `SameSite=${options.sameSite};` : ''
            }`
          )
        }
      }
    }
  )

  return supabase
} 