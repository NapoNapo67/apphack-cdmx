import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function Header() {
  const { user, logout, setSidebarOpen, sidebarOpen } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'G'

  return (
    <header className="bg-white sticky top-0 z-40 shadow-sm">
      {/* Franja guinda */}
      <div className="tricolor w-full" />

      <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">

        {/* Izquierda: hamburguesa + logos */}
        <div className="flex items-center gap-3">
          {user && (
            <button
              className="lg:hidden p-1 rounded"
              style={{ color: 'var(--gov-guinda)' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          )}

          {/* Logo CDMX */}
          <img
            src="/Logo_CDMX.png"
            alt="Ciudad de México"
            className="h-10 object-contain"
            onError={e => { e.target.style.display = 'none' }}
          />

          {/* Divisor */}
          <div className="hidden sm:block h-8 w-px bg-gray-200" />

          {/* Logo SEDECO */}
          <img
            src="/Logo_Dependencia.png"
            alt="SEDECO"
            className="hidden sm:block h-8 object-contain"
            onError={e => { e.target.style.display = 'none' }}
          />

          {/* Nombre fallback si no cargan imágenes */}
          <div className="sm:hidden">
            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--gov-guinda)' }}>
              Viabilidad CDMX
            </p>
          </div>
        </div>

        {/* Derecha: usuario */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-md transition hover:bg-gray-50"
            >
              <div
                className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: 'var(--gov-guinda)' }}
              >
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-600 max-w-[140px] truncate">
                {user.email}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-4 py-2 text-xs text-gray-400 border-b truncate">{user.email}</div>
                <button
                  onClick={() => { logout(); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
