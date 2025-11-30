import { createClient } from '../utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: grabaciones } = await supabase
    .from('grabaciones')
    .select('*')

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Grabaciones</h1>
      <ul className="space-y-2">
        {grabaciones?.map((grabacion) => (
          <li key={grabacion.id} className="p-4 border rounded-lg">
            <h2 className="font-semibold">{grabacion.title}</h2>
            <p className="text-sm text-gray-600">Duración: {grabacion.duration}</p>
            <p className="text-sm text-gray-600">Fecha: {grabacion.date}</p>
          </li>
        ))}
      </ul>
    </div>
  )
} 