import { useApp } from './context/AppContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Sidebar from './components/layout/Sidebar'
import AgenteOperativo from './components/agents/AgenteOperativo'
import Dashboard from './pages/index'
import Admin from './pages/admin'
import { signInWithGoogle } from './lib/auth'
import LoadingSpinner from './components/ui/LoadingSpinner'

const PlaceholderPage = ({ title, icon, desc }) => (
  <div className="card-gov text-center py-16">
    <p className="text-5xl mb-4">{icon}</p>
    <h2 className="text-xl font-bold text-gov-verde mb-2">{title}</h2>
    <p className="text-gray-500">{desc}</p>
    <p className="text-sm text-gray-400 mt-2">Se configura en el Prompt B (día del hackathon)</p>
  </div>
)

const PAGES = {
  dashboard:   <Dashboard />,
  tramites:    <PlaceholderPage title="Módulo de Trámites" icon="📋" desc="CRUD principal del negocio" />,
  documentos:  <PlaceholderPage title="Procesamiento de Documentos" icon="📄" desc="Extracción IA de documentos" />,
  automatizar: <PlaceholderPage title="Automatización" icon="⚡" desc="Flujo extremo a extremo con IA" />,
  analitica:   <PlaceholderPage title="Analítica Avanzada" icon="📊" desc="6 tableros BI con Data Warehouse" />,
}

function LoginScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gov-gris px-4">
      <div className="tricolor w-full fixed top-0" />
      <div className="card-gov max-w-md w-full text-center py-12">
        <div className="text-5xl mb-4">🏛️</div>
        <h1 className="text-2xl font-bold text-gov-verde mb-2">AppHack CDMX</h1>
        <p className="text-gray-500 text-sm mb-8">Plataforma de Gobierno Digital</p>
        <button onClick={signInWithGoogle} className="btn-gov w-full py-3 flex items-center justify-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar con Google
        </button>
        <p className="text-xs text-gray-400 mt-6">Solo usuarios autorizados del Gobierno CDMX</p>
      </div>
      <div className="tricolor w-full fixed bottom-0" />
    </div>
  )
}

export default function App() {
  const { user, authLoading, activeTab } = useApp()

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (!user) return <LoginScreen />

  return (
    <div className="flex flex-col min-h-screen">
      <Header projectName="AppHack CDMX" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
          {PAGES[activeTab] || <Dashboard />}
        </main>
      </div>
      <Footer projectName="AppHack" />
      <AgenteOperativo />
    </div>
  )
}
