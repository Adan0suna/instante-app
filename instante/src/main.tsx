import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('Starting application...')

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  console.log('Root element found, mounting app...')

  const root = ReactDOM.createRoot(rootElement)
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )

  console.log('App mounted successfully')
} catch (error) {
  console.error('Error mounting app:', error)
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <h1 style="color: #ef4444; margin-bottom: 16px;">Error al cargar la aplicación</h1>
      <p style="color: #666; margin-bottom: 8px;">${error instanceof Error ? error.message : 'Error desconocido'}</p>
      <button 
        onclick="window.location.reload()"
        style="
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 16px;
        "
      >
        Recargar página
      </button>
    </div>
  `
} 