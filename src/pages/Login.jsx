import { useEffect } from 'react'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { login, authLoading } = useApp()

  // Si el usuario regresa del redirect de Google, Supabase lo detecta solo
  useEffect(() => {
    // Supabase onAuthStateChange en AppContext maneja el token
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gov-verde via-[#005538] to-[#003d28] flex flex-col items-center justify-center px-4">

      {/* Logo + nombre */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-2xl">
          <span className="text-4xl">🏛️</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Viabilidad CDMX
        </h1>
        <p className="text-green-200 mt-1 text-sm">
          Plataforma de Evaluación Empresarial · SEDECO
        </p>
      </div>

      {/* Tarjeta de login */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <h2 className="text-xl font-bold text-gov-texto mb-1">Bienvenido, emprendedor</h2>
        <p className="text-sm text-gray-500 mb-6">
          Inicia sesión para evaluar la viabilidad de tu negocio y guardar tu historial de consultas.
        </p>

        {/* Botón Google */}
        <button
          onClick={login}
          disabled={authLoading}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 px-4 font-semibold text-gov-texto hover:border-gov-verde hover:bg-green-50 transition-all duration-200 disabled:opacity-50"
        >
          {/* Logo Google SVG */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8H6.5C9.9 35.7 16.4 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C40.7 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.9z"/>
          </svg>
          {authLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <p className="text-xs text-center text-gray-400 mt-6">
          Solo usamos tu nombre y correo para identificar tus consultas.<br />
          No compartimos tu información.
        </p>
      </div>

      {/* Footer */}
      <p className="text-green-300 text-xs mt-8 text-center">
        Secretaría de Desarrollo Económico · Ciudad de México<br />
        AppHack CDMX 2026
      </p>
    </div>
  )
}
