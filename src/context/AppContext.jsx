import { createContext, useContext, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <AppContext.Provider value={{ user, authLoading, sidebarOpen, setSidebarOpen, activeTab, setActiveTab }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
