import { supabase } from './supabase'
import type { Match, MatchWithDetails, Clip, ClipWithDetails, UserAlias, MatchVideo } from './types'

export async function getMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data as Match[]
}

export async function getMatchesWithDetails() {
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })

  if (matchesError) throw matchesError

  // Para cada partido, obtener sus videos y clips
  const matchesWithDetails = await Promise.all(
    (matches || []).map(async (match) => {
      // Obtener videos del partido
      const { data: videosData } = await supabase
        .from('match_videos')
        .select('*')
        .eq('match_id', match.id)

      // Obtener clips del partido
      const { data: clipsData } = await supabase
        .from('clips')
        .select('*')
        .eq('match_id', match.id)

      return {
        ...match,
        videos: videosData || [],
        clips: clipsData || []
      }
    })
  )

  return matchesWithDetails
}

export async function getMatch(id: number) {
  console.log('Obteniendo partido con ID:', id)
  
  // Primero obtenemos el partido básico
  const { data: matchData, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (matchError) {
    console.error('Error al obtener el partido:', matchError)
    throw matchError
  }

  console.log('Partido básico obtenido:', matchData)

  // Luego obtenemos los videos
  const { data: videosData, error: videosError } = await supabase
    .from('match_videos')
    .select('*')
    .eq('match_id', id)

  if (videosError) {
    console.error('Error al obtener los videos:', videosError)
    throw videosError
  }

  console.log('Videos obtenidos:', videosData)

  // Finalmente obtenemos los clips con sus relaciones
  const { data: clipsData, error: clipsError } = await supabase
    .from('clips')
    .select(`
      *,
      alias:user_aliases(*),
      categories:clip_category_assignments(
        category:clip_categories(*)
      )
    `)
    .eq('match_id', id)

  if (clipsError) {
    console.error('Error al obtener los clips:', clipsError)
    throw clipsError
  }

  console.log('Clips obtenidos:', clipsData)

  // Construimos el objeto final
  const matchWithDetails: MatchWithDetails = {
    ...matchData,
    videos: videosData || [],
    clips: clipsData || []
  }

  console.log('Partido con detalles construido:', matchWithDetails)
  return matchWithDetails
}

export async function createMatch(match: Omit<Match, 'id'>) {
  const { data, error } = await supabase
    .from('matches')
    .insert([match])
    .select()
    .single()

  if (error) throw error
  return data as Match
}

export async function updateMatch(id: number, match: Partial<Match>) {
  const { data, error } = await supabase
    .from('matches')
    .update(match)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Match
}

export async function deleteMatch(id: number) {
  // Primero eliminar todos los clips asociados
  const { error: clipsError } = await supabase
    .from('clips')
    .delete()
    .eq('match_id', id)

  if (clipsError) {
    console.error('Error eliminando clips:', clipsError)
    throw clipsError
  }

  // Luego eliminar todos los videos asociados
  const { error: videosError } = await supabase
    .from('match_videos')
    .delete()
    .eq('match_id', id)

  if (videosError) {
    console.error('Error eliminando videos:', videosError)
    throw videosError
  }

  // Finalmente eliminar el partido
  const { error: matchError } = await supabase
    .from('matches')
    .delete()
    .eq('id', id)

  if (matchError) {
    console.error('Error eliminando partido:', matchError)
    throw matchError
  }
}

export async function addVideo(video: Omit<MatchVideo, 'id'>) {
  const { data, error } = await supabase
    .from('match_videos')
    .insert([video])
    .select()
    .single()

  if (error) throw error
  return data as MatchVideo
}

export async function addClip(clip: Omit<Clip, 'id'>) {
  console.log('Intentando añadir clip:', clip)
  
  try {
    // Verificar que todos los campos requeridos estén presentes
    if (!clip.match_id || !clip.alias_id || !clip.description || clip.start_time === undefined || clip.end_time === undefined) {
      throw new Error('Faltan campos requeridos en el clip')
    }

    const { data, error } = await supabase
      .from('clips')
      .insert([{
        match_id: clip.match_id,
        alias_id: clip.alias_id,
        description: clip.description,
        start_time: clip.start_time,
        end_time: clip.end_time
      }])
      .select()
      .single()

    if (error) {
      console.error('Error de Supabase al añadir clip:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    if (!data) {
      throw new Error('No se recibió respuesta al crear el clip')
    }

    console.log('Clip añadido exitosamente:', data)
    return data as Clip
  } catch (error: any) {
    console.error('Error completo al añadir clip:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw error
  }
}

export async function updateClip(id: number, updates: Partial<Clip>) {
  const { data, error } = await supabase
    .from('clips')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Clip
}

export async function assignClipCategory(clipId: number, categoryId: number) {
  const { data, error } = await supabase
    .from('clip_category_assignments')
    .insert([{
      clip_id: clipId,
      category_id: categoryId
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserAliases() {
  const { data, error } = await supabase
    .from('user_aliases')
    .select('*')
    .order('alias')

  if (error) throw error
  return data as UserAlias[]
}

export async function getClipCategories() {
  const { data, error } = await supabase
    .from('clip_categories')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function uploadVideo(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `videos/${fileName}`

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(filePath, file)

  if (error) throw error

  // Obtener la URL pública del video
  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(filePath)

  return { data: { path: publicUrl }, error: null }
}

export async function createDefaultAlias() {
  // Primero verificamos si ya existe algún alias
  const { data: existingAliases, error: checkError } = await supabase
    .from('user_aliases')
    .select('*')
    .limit(1)

  if (checkError) throw checkError

  // Si no hay alias, creamos uno por defecto
  if (!existingAliases || existingAliases.length === 0) {
    const { data, error } = await supabase
      .from('user_aliases')
      .insert([{ alias: 'Usuario' }])
      .select()
      .single()

    if (error) throw error
    return data as UserAlias
  }

  return existingAliases[0] as UserAlias
} 