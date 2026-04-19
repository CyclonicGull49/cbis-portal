import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Capacitor } from '@capacitor/core'

// Configurar plugins nativos solo cuando corre en dispositivo
async function initNative() {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    // Barra de estado púrpura CBIS
    await StatusBar.setBackgroundColor({ color: '#1a0d30' })
    await StatusBar.setStyle({ style: Style.Dark }) // texto/íconos blancos
    await StatusBar.show()
  } catch (e) {
    console.warn('StatusBar:', e)
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    // Ocultar splash después de que la app cargue
    await SplashScreen.hide({ fadeOutDuration: 300 })
  } catch (e) {
    console.warn('SplashScreen:', e)
  }
}

initNative()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
