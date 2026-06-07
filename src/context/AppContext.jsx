import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser]                       = useState(null)
  const [authLoading, setAuthLoading]         = useState(true)
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [activeTab, setActiveTab]             = useState('inicio')
  const [busquedaInicial, setBusquedaInicial] = useState('')

  useEffect(() => {
    // Sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    // Escuchar cambios de sesión (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setActiveTab('inicio')
  }

  return (
    <AppContext.Provider value={{
      user, authLoading,
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
