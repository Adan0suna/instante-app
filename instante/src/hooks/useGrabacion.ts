import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadToDrive } from '../lib/drive/service'
// import { createRecorte } from '../lib/recortes/service'
import type { Grabacion, Highlight, Recorte } from '../lib/supabase/types'

export function useGrabacion() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadGrabacion = async (file: File, metadata: Omit<Grabacion, 'id' | 'created_at' | 'updated_at' | 'drive_file_id' | 'drive_url'>) => {
    try {
      setLoading(true)
      setError(null)

      // subir archivo a Drive
      const driveFile = await uploadToDrive(file)

      // crear grabación en Supabase
      const { data: grabacion, error: supabaseError } = await supabase
        .from('grabaciones')
        .insert([{
          ...metadata,
          drive_file_id: driveFile.id,
          drive_url: driveFile.webContentLink
        }])
        .select()
        .single()

      if (supabaseError) throw supabaseError

      return grabacion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la grabación')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createHighlight = async (
    grabacionId: number,
    highlight: Omit<Highlight, 'id' | 'created_at' | 'recorte_id' | 'recorte_url'> & { drive_url: string }
  ) => {
    try {
      setLoading(true)
      setError(null)

      // crear highlight en Supabase
      const { data: newHighlight, error: supabaseError } = await supabase
        .from('highlights')
        .insert([{
          ...highlight,
          grabacion_id: grabacionId
        }])
        .select()
        .single()

      if (supabaseError) throw supabaseError

      // crear recorte
      // const recorte = await createRecorte({
      //   videoUrl: highlight.drive_url,
      //   startTime: highlight.time - 20, // 20 segundos antes
      //   endTime: highlight.time + 20, // 20 segundos después
      //   outputFormat: 'mp4'
      // })

      //   // actualizar highlight con el ID del recorte
      // const { error: updateError } = await supabase
      //   .from('highlights')
      //   .update({ recorte_id: recorte.id })
      //   .eq('id', newHighlight.id)

      // if (updateError) throw updateError

      return newHighlight
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el momento destacado')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    uploadGrabacion,
    createHighlight
  }
} 