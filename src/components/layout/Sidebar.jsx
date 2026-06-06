import { useApp } from '../../context/AppContext'

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',     icon: '📊' },
  { id: 'tramites',    label: 'Trámites',       icon: '📋' },
  { id: 'documentos',  label: 'Documentos',     icon: '📄' },
  { id: 'automatizar', label: 'Automatizar',    icon: '⚡' },
  { id: 'analitica',   label: 'Analítica IA',   icon: '🤖' },
]

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen } = useApp()

  return (
    <>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gov-verde-oscuro text-white z-40
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}>
        <div className="tricolor w-full" />
        <div className="p-4 font-bold text-lg border-b border-gov-verde">Menú</div>
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-gov-verde
                ${activeTab === item.id ? 'bg-gov-verde border-r-4 border-gov-oro' : ''}
              `}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 text-xs text-green-300 border-t border-gov-verde">
          AppHack v1.0
        </div>
      </aside>
    </>
  )
}
