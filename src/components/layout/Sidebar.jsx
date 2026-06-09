import { useApp } from '../../context/AppContext'

const NAV_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',           icon: '📊', grupo: null },
  { id: 'viabilidad',      label: 'Evaluador IA',        icon: '🚀', grupo: 'Viabilidad' },
  { id: 'ruta-tramites',   label: 'Ruta de Trámites',    icon: '📋', grupo: 'Viabilidad' },
  { id: 'programas',       label: 'Programas de Apoyo',  icon: '🎯', grupo: 'Viabilidad' },
  { id: 'gestion',         label: 'Gestión Consultas',   icon: '📋', grupo: 'Operación' },
  { id: 'analitica',       label: 'Analítica BI',        icon: '📈', grupo: 'BI' },
  { id: 'etl-control',    label: 'Control ETL',         icon: '⚙️', grupo: 'BI' },
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
        fixed top-0 left-0 h-full w-64 text-white z-40
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
      `}
      style={{ backgroundColor: 'var(--gov-guinda-oscuro)' }}>
        <div className="tricolor w-full" />
        <div className="p-4 font-bold text-lg border-b border-white border-opacity-20">Menú</div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.reduce((acc, item, i) => {
            const prev = NAV_ITEMS[i - 1]
            if (item.grupo && item.grupo !== prev?.grupo) {
              acc.push(
                <p key={`g-${item.grupo}`} className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider" style={{color:'rgba(255,255,255,0.5)'}}>
                  {item.grupo}
                </p>
              )
            }
            acc.push(
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors
                  ${activeTab === item.id ? 'border-r-4' : 'hover:bg-white hover:bg-opacity-10'}
                `}
                style={activeTab === item.id
                  ? { backgroundColor: 'var(--gov-guinda)', borderColor: 'var(--gov-dorado)' }
                  : {}
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
            return acc
          }, [])}
        </nav>
        <div className="p-4 text-xs text-green-300 border-t border-gov-verde">
          AppHack v1.0
        </div>
      </aside>
    </>
  )
}
