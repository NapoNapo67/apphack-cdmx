import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

// Usuario demo para el hackathon — no requiere OAuth
const USUARIO_DEMO = {
  id: 'demo-user',
  email: 'racota.ideas@gmail.com',
  user_metadata: { full_name: 'Usuario SEDECO', avatar_url: null },
}

export function AppProvider({ children }) {
  const [user, setUser]                       = useState(USUARIO_DEMO)
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [activeTab, setActiveTab]             = useState('inicio')
  const [busquedaInicial, setBusquedaInicial] = useState('')

  const login  = () => setUser(USUARIO_DEMO)
  const logout = () => { setUser(null); setActiveTab('inicio') }

  return (
    <AppContext.Provider value={{
      user, authLoading: false,
      login, logout,
      sidebarOpen, setSidebarOpen,
      activeTab, setActiveTab,
      busquedaInicial, setBusquedaInicial,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
