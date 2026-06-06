import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { signOut } from '../../lib/auth'

const EscudoNacional = () => (
  <svg width="40" height="44" viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="26" rx="16" ry="14" fill="#006847"/>
    <ellipse cx="20" cy="26" rx="10" ry="9" fill="#CE1126"/>
    <ellipse cx="20" cy="26" rx="5" ry="5" fill="#C8A217"/>
    <rect x="18" y="4" width="4" height="16" fill="#006847"/>
    <ellipse cx="20" cy="4" rx="4" ry="3" fill="#C8A217"/>
  </svg>
)

export default function Header({ projectName = 'AppHack CDMX' }) {
  const { user, setSidebarOpen, sidebarOpen } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'G'

  return (
    <header className="bg-white border-b-2 border-gov-verde sticky top-0 z-40 shadow-sm">
      <div className="tricolor w-full" />
      <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto">
        {/* Izquierda: hamburguesa + escudo + nombre */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 rounded text-gov-verde hover:bg-gov-verde-claro"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <EscudoNacional />
          <div>
            <p className="text-xs text-gray-500 leading-none">Gobierno de la Ciudad de México</p>
            <p className="font-bold text-gov-verde text-base leading-tight">{projectName}</p>
          </div>
        </div>

        {/* Derecha: usuario */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-gov-verde-claro px-2 py-1 rounded-md transition"
            >
              <div className="w-8 h-8 rounded-full bg-gov-verde text-white flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gov-gris-oscuro max-w-[120px] truncate">
                {user.email}
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gov-gris-medio rounded-lg shadow-lg z-50">
                <div className="px-4 py-2 text-xs text-gray-500 border-b">{user.email}</div>
                <button
                  onClick={() => { signOut(); setMenuOpen(false) }}
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
