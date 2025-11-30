"use client"

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GrabacionPage from './pages/GrabacionPage'
import GrabacionesPage from './pages/GrabacionesPage'
import PartidosPage from './pages/PartidosPage'
import DetalleGrabacionPage from './pages/DetalleGrabacionPage'
import VideosPage from './pages/VideosPage'
import EstadisticasPage from './pages/EstadisticasPage'
import AyudaPage from './pages/AyudaPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import ConectarDrivePage from './pages/ConectarDrivePage'
import YouTubePage from './pages/YouTubePage'
import YouTubeCallbackPage from './pages/YouTubeCallbackPage'
import AppLayout from './pages/AppLayout'

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas sin sidebar */}
        <Route path="/youtube/callback" element={<YouTubeCallbackPage />} />
        <Route path="/youtube" element={<YouTubePage />} />

        {/* Rutas con layout (sidebar) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/grabar" element={<GrabacionPage />} />
          <Route path="/partidos" element={<PartidosPage />} />
          <Route path="/partidos/:id" element={<DetalleGrabacionPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/estadisticas" element={<EstadisticasPage />} />
          <Route path="/ayuda" element={<AyudaPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/conectar-drive" element={<ConectarDrivePage />} />
          <Route path="/grabaciones" element={<GrabacionesPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App 