import { lazy, Suspense } from 'react'
import { useApp } from './context/AppContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Sidebar from './components/layout/Sidebar'
import AgenteOperativo from './components/agents/AgenteOperativo'
import LoadingSpinner from './components/ui/LoadingSpinner'
import Inicio from './pages/inicio'

const Spin = () => <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>

const Dashboard    = lazy(() => import('./pages/index'))
const Viabilidad   = lazy(() => import('./pages/viabilidad'))
const RutaTramites = lazy(() => import('./pages/ruta-tramites'))
const Programas    = lazy(() => import('./pages/programas'))
const Analitica    = lazy(() => import('./pages/analitica'))

// Páginas públicas (sin login)
const PAGES_PUBLICAS = ['viabilidad', 'ruta-tramites', 'programas']

export default function App() {
  const { user, authLoading, activeTab, setActiveTab } = useApp()

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  // Sin login: inicio O páginas públicas (viabilidad, ruta-tramites, programas)
  if (!user) {
    const esPublica = PAGES_PUBLICAS.includes(activeTab)
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="tricolor w-full" />
        {/* Mini-nav pública */}
        {esPublica && (
          <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-3">
            <button
              onClick={() => setActiveTab('inicio')}
              className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--gov-guinda)' }}
            >
              ← Inicio
            </button>
            <span className="text-gray-300">|</span>
            {PAGES_PUBLICAS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="text-xs px-3 py-1 rounded-full transition-all"
                style={activeTab === tab
                  ? { background: 'var(--gov-guinda)', color: 'white' }
                  : { color: 'var(--gov-guinda)', border: '1px solid var(--gov-guinda)' }
                }
              >
                {{ viabilidad: '🚀 Viabilidad', 'ruta-tramites': '📋 Trámites', programas: '🎯 Programas' }[tab]}
              </button>
            ))}
          </div>
        )}
        <main className="flex-1">
          <Suspense fallback={<Spin />}>
            {activeTab === 'viabilidad'      && <Viabilidad />}
            {activeTab === 'ruta-tramites'   && <RutaTramites />}
            {activeTab === 'programas'       && <Programas />}
            {!esPublica                      && <Inicio />}
          </Suspense>
        </main>
        <Footer projectName="SEDECO — Viabilidad CDMX" />
        <AgenteOperativo />
      </div>
    )
  }

  // Con login: app completa con sidebar
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          <Suspense fallback={<Spin />}>
            {activeTab === 'viabilidad'      ? <Viabilidad />   :
             activeTab === 'ruta-tramites'   ? <RutaTramites /> :
             activeTab === 'programas'       ? <Programas />    :
             activeTab === 'analitica'       ? <Analitica />    :
             <Dashboard />}
          </Suspense>
        </main>
      </div>
      <Footer projectName="SEDECO — Viabilidad CDMX" />
      <AgenteOperativo />
    </div>
  )
}
