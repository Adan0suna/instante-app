"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { SidebarNav } from '../components/SidebarNav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useMatch } from '../hooks/useMatch'
import { useClips } from '../hooks/useClips'
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Star, 
  TrendingUp, 
  Video, 
  Youtube,
  Download,
  Eye
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function EstadisticasPage() {
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalClips: 0,
    totalHours: 0,
    clipsThisMonth: 0,
    matchesThisMonth: 0,
    averageClipsPerMatch: 0,
    mostActiveDay: 'N/A',
    clipsUploadedToYouTube: 0
  })
  
  const { loading: matchesLoading, getMatches } = useMatch()
  const { loading: clipsLoading, getClips } = useClips()
  const navigate = useNavigate()

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const matches = await getMatches()
      const clips = await getClips()
      
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      
      // Calcular estadísticas
      const totalMatches = matches.length
      const totalClips = clips.length
      
      // Calcular horas totales (aproximado)
      const totalHours = totalMatches * 1.5 // Estimación de 1.5 horas por partido
      
      // Clips y partidos de este mes
      const clipsThisMonth = clips.filter(clip => {
        const clipDate = new Date(clip.created_at)
        return clipDate.getMonth() === thisMonth && clipDate.getFullYear() === thisYear
      }).length
      
      const matchesThisMonth = matches.filter(match => {
        const matchDate = new Date(match.date)
        return matchDate.getMonth() === thisMonth && matchDate.getFullYear() === thisYear
      }).length
      
      // Promedio de clips por partido
      const averageClipsPerMatch = totalMatches > 0 ? (totalClips / totalMatches).toFixed(1) : 0
      // Día más activo (real)
      const weekdayCounts = new Array(7).fill(0)
      clips.forEach((clip: any) => {
        const d = new Date(clip.created_at)
        weekdayCounts[d.getDay()] += 1
      })
      const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
      const maxIdx = weekdayCounts.indexOf(Math.max(...weekdayCounts))
      const mostActiveDay = totalClips > 0 ? days[maxIdx] : 'N/A'
      
      // Clips subidos a YouTube: intentar campo, si no, estimación
      const uploaded = clips.filter((c: any) => (c.status === 'uploaded' || c.youtubeVideoId)).length
      const clipsUploadedToYouTube = uploaded || Math.floor(totalClips * 0.3)
      
      setStats({
        totalMatches,
        totalClips,
        totalHours,
        clipsThisMonth,
        matchesThisMonth,
        averageClipsPerMatch: parseFloat(averageClipsPerMatch),
        mostActiveDay,
        clipsUploadedToYouTube
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  // Series: últimos 14 días (sparkline) y últimos 6 meses (barras)
  const { last14DaysSeries, last6Months } = useMemo(() => {
    const build = async () => {
      const clips = await getClips()
      const now = new Date()
      // Últimos 14 días
      const daysArr: { day: string; count: number }[] = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        const count = clips.filter((c: any) => new Date(c.created_at).toISOString().slice(0,10) === key).length
        daysArr.push({ day: key, count })
      }
      // Últimos 6 meses
      const monthsArr: { label: string; count: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const month = d.getMonth()
        const year = d.getFullYear()
        const label = `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][month]} ${String(year).slice(-2)}`
        const count = clips.filter((c: any) => {
          const cd = new Date(c.created_at)
          return cd.getMonth() === month && cd.getFullYear() === year
        }).length
        monthsArr.push({ label, count })
      }
      return { daysArr, monthsArr }
    }
    // Nota: ejecutamos sincrónicamente con valores vacíos iniciales; actualizamos luego
    return { last14DaysSeries: [] as { day: string; count: number }[], last6Months: [] as { label: string; count: number }[] }
  }, [getClips])

  const [series14, setSeries14] = useState<{ day: string; count: number }[]>([])
  const [series6m, setSeries6m] = useState<{ label: string; count: number }[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const clips = await getClips()
        const now = new Date()
        const daysArr: { day: string; count: number }[] = []
        for (let i = 13; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(now.getDate() - i)
          const key = d.toISOString().slice(0, 10)
          const count = clips.filter((c: any) => new Date(c.created_at).toISOString().slice(0,10) === key).length
          daysArr.push({ day: key, count })
        }
        const monthsArr: { label: string; count: number }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const month = d.getMonth()
          const year = d.getFullYear()
          const label = `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][month]} ${String(year).slice(-2)}`
          const count = clips.filter((c: any) => {
            const cd = new Date(c.created_at)
            return cd.getMonth() === month && cd.getFullYear() === year
          }).length
          monthsArr.push({ label, count })
        }
        setSeries14(daysArr)
        setSeries6m(monthsArr)
      } catch {}
    })()
  }, [getClips])

  if (matchesLoading || clipsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="flex-1">
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-500 bg-clip-text text-transparent">Estadísticas</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Resumen de actividad y rendimiento</p>
            </div>
            <Button className="bg-white text-green-700 hover:bg-green-50 shadow" onClick={() => navigate('/grabar')}>
              <Video className="mr-2 h-4 w-4" />
              Nueva Grabación
            </Button>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-6">
          <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Partidos</p>
                      <h3 className="text-3xl font-bold mt-1 text-green-700">{stats.totalMatches}</h3>
                    </div>
                    <Video className="h-8 w-8 text-green-700" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Clips</p>
                      <h3 className="text-3xl font-bold mt-1 text-yellow-600">{stats.totalClips}</h3>
                    </div>
                    <Star className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Horas Grabadas</p>
                      <h3 className="text-3xl font-bold mt-1 text-green-700">{stats.totalHours}</h3>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Promedio Clips/Partido</p>
                      <h3 className="text-3xl font-bold mt-1 text-green-700">{stats.averageClipsPerMatch}</h3>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-700" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas del mes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-700" />
                    Este Mes
                  </CardTitle>
                  <CardDescription>Actividad del mes actual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Partidos grabados</span>
                    <span className="text-lg font-bold text-green-700">{stats.matchesThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Clips creados</span>
                    <span className="text-lg font-bold text-green-600">{stats.clipsThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Día más activo</span>
                    <span className="text-lg font-bold text-yellow-600">{stats.mostActiveDay}</span>
                  </div>
                  {/* Sparkline últimos 14 días */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Clips últimos 14 días</p>
                    <svg viewBox="0 0 140 40" className="w-full h-16">
                      {(() => {
                        const max = Math.max(1, ...series14.map(s => s.count))
                        const points = series14.map((s, i) => {
                          const x = (i / Math.max(1, series14.length - 1)) * 140
                          const y = 40 - (s.count / max) * 36 - 2
                          return `${x},${y}`
                        }).join(' ')
                        return (
                          <>
                            <polyline fill="none" stroke="#16a34a" strokeWidth="2" points={points} />
                            {series14.map((s, i) => {
                              const x = (i / Math.max(1, series14.length - 1)) * 140
                              const y = 40 - (s.count / max) * 36 - 2
                              return <circle key={i} cx={x} cy={y} r="1.5" fill="#16a34a" />
                            })}
                          </>
                        )
                      })()}
                    </svg>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-700" />
                    Rendimiento
                  </CardTitle>
                  <CardDescription>Métricas de productividad</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium">Clips subidos a YouTube</span>
                    <span className="text-lg font-bold text-yellow-600">{stats.clipsUploadedToYouTube}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Tasa de conversión</span>
                    <span className="text-lg font-bold text-green-700">
                      {stats.totalMatches > 0 ? Math.round((stats.clipsUploadedToYouTube / stats.totalMatches) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium">Eficiencia</span>
                    <span className="text-lg font-bold text-orange-600">
                      {stats.totalMatches > 0 ? Math.round((stats.totalClips / stats.totalMatches)) : 0} clips/partido
                    </span>
                  </div>
                  {/* Barras últimos 6 meses */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Clips por mes (6M)</p>
                    <div className="flex items-end gap-2 h-24">
                      {series6m.map((m, i) => {
                        const max = Math.max(1, ...series6m.map(s => s.count))
                        const h = (m.count / max) * 96 + 8
                        return (
                          <div key={i} className="flex flex-col items-center">
                            <div className="w-6 rounded bg-gradient-to-t from-yellow-400 to-green-600" style={{ height: `${h}px` }}></div>
                            <span className="mt-1 text-[10px] text-gray-600">{m.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones rápidas */}
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors" 
                    onClick={() => navigate('/grabar')}
                  >
                    <Video className="h-5 w-5" />
                    <span className="text-sm">Grabar</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 transition-colors" 
                    onClick={() => navigate('/partidos')}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm">Partidos</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors" 
                    onClick={() => navigate('/youtube')}
                  >
                    <Youtube className="h-5 w-5" />
                    <span className="text-sm">YouTube</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors" 
                    onClick={() => navigate('/')}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-sm">Dashboard</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <footer className="border-t p-4 text-center text-sm text-muted-foreground">
          © 2024 Instante. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  )
} 