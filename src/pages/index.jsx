import { useSupabase } from '../hooks/useSupabase'
import KPICard from '../components/ui/KPICard'
import DummyTable from '../components/dummy/DummyTable'
import AgenteAnalitico from '../components/agents/AgenteAnalitico'

export default function Dashboard() {
  const { data: dummy, loading } = useSupabase('dummy')
  const { data: estados } = useSupabase('cat_estado_tramite')

  const kpis = [
    { title: 'Registros en Sistema',    value: dummy.length,    icon: '📦', color: 'verde' },
    { title: 'Catálogos de Estado',     value: estados.length,  icon: '🏷️', color: 'oro'   },
    { title: 'Conexión Supabase',       value: loading ? '...' : '✓ OK', icon: '🔌', color: 'verde' },
    { title: 'Agentes IA',              value: '2 activos',     icon: '🤖', color: 'gris'  },
    { title: 'Alcaldías CDMX',          value: '16',            icon: '🏙️', color: 'verde' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-verde">Dashboard Principal</h1>
        <p className="text-sm text-gray-500">Estado de la plataforma AppHack</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map(k => <KPICard key={k.title} {...k} />)}
      </div>

      {/* Estado de servicios */}
      <div className="card-gov">
        <h2 className="font-bold text-gov-verde mb-3">Estado de la Plataforma</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            '✅ React + Vite + Tailwind',
            '✅ Supabase conectado',
            '✅ Netlify Functions',
            '✅ Claude API (agentes)',
            '✅ Data Warehouse (dw.*)',
            '✅ Design System CDMX',
          ].map(s => (
            <div key={s} className="flex items-center gap-2 text-sm text-gov-texto bg-gov-verde-claro px-3 py-2 rounded-md">
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Dummy Table */}
      <DummyTable />

      {/* Agente Analítico */}
      <AgenteAnalitico />
    </div>
  )
}
