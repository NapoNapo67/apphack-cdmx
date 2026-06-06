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

const PAGES_LOGUEADO = {
  dashboard:       <Dashboard />,
  viabilidad:      <Viabilidad />,
  'ruta-tramites': <RutaTramites />,
  programas:       <Programas />,
  analitica:       <Analitica />,
}

export default function App() {
  const { user, authLoading, activeTab } = useApp()

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  // Sin login: pantalla de inicio + agente operativo flotante
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="tricolor w-full" />
        <main className="flex-1">
          <Inicio />
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
            {PAGES_LOGUEADO[activeTab] || <Dashboard />}
          </Suspense>
        </main>
      </div>
      <Footer projectName="SEDECO — Viabilidad CDMX" />
      <AgenteOperativo />
    </div>
  )
}
