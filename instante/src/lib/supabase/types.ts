export type Match = {
  id: number
  title: string
  date: string
}

export type UserAlias = {
  id: number
  alias: string
}

export type MatchVideo = {
  id: number
  match_id: number
  video_url: string
  video_type?: string
}

export type Clip = {
  id: number
  match_id: number
  alias_id: number
  description: string
  start_time: string // interval en PostgreSQL se maneja como string
  end_time: string // interval en PostgreSQL se maneja como string
  clip_url?: string
}

export type ClipCategory = {
  id: number
  name: string
}

export type ClipCategoryAssignment = {
  id: number
  clip_id: number
  category_id: number
}

// Tipos para las relaciones
export type ClipWithDetails = Clip & {
  alias: UserAlias
  categories: ClipCategory[]
}

export type MatchWithDetails = Match & {
  videos: MatchVideo[]
  clips: ClipWithDetails[]
}

export type Grabacion = {
  id: number
  title: string
  date: string
  duration: string
  size: string
  drive_file_id: string
  drive_url: string
  thumbnail: string
  created_at: string
  updated_at: string
}

export type Highlight = {
  id: number
  grabacion_id: number
  time: number
  label: string
  type: 'Gol' | 'Tarjeta' | 'Falta' | 'Penal' | 'Tiro libre'
  color: string
  recorte_id?: string
  recorte_url?: string
  created_at: string
}

export type Recorte = {
  id: string
  grabacion_id: number
  highlight_id: number
  start_time: number
  end_time: number
  status: 'processing' | 'completed' | 'failed'
  output_url?: string
  error?: string
  created_at: string
  updated_at: string
} 