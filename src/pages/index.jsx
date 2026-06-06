import { useSupabase } from '../hooks/useSupabase'
import KPICard from '../components/ui/KPICard'
import DummyTable from '../components/dummy/DummyTable'
import AgenteAnalitico from '../components/agents/AgenteAnalitico'

const SERVICIOS = [
  { label: 'React + Vite + Tailwind', ok: true },
  { label: 'Design System CDMX',      ok: true },
  { label: 'Netlify Functions',        ok: true },
  { label: 'Agente Operativo (IA)',    ok: true },
  { label: 'Agente Analítico (IA)',    ok: true },
  { label: 'Data Warehouse (dw.*)',    ok: true },
]

export default function Dashboard() {
  const { data: dummy, loading: loadingDummy, error: errorDummy } = useSupabase('dummy')
  const { data: estados, loading: loadingEstados }                = useSupabase('cat_estado_tramite')
  const { data: alcaldias }                                       = useSupabase('dw.dim_alcaldia' )

  const supabaseOK = !errorDummy

  const kpis = [
    {
      title:    'Supabase',
      value:    loadingDummy ? '...' : supabaseOK ? '✓ Conectado' : '✗ Error',
      icon:     '🔌',
      color:    supabaseOK ? 'verde' : 'rojo',
      subtitle: supabaseOK ? `${dummy.length} registros en dummy` : errorDummy,
    },
    {
      title:    'Estados de Trámite',
      value:    loadingEstados ? '...' : estados.length,
      icon:     '🏷️',
      color:    'oro',
      subtitle: 'Nuevo → Resuelto → Cancelado',
    },
    {
      title:    'Alcaldías CDMX',
      value:    alcaldias.length || 16,
      icon:     '🏙️',
      color:    'verde',
      subtitle: 'Dimensión geográfica DW',
    },
    {
      title:    'Agentes IA',
      value:    '2 activos',
      icon:     '🤖',
      color:    'gris',
      subtitle: 'Operativo + Analítico',
    },
    {
      title:    'Años en DW',
      value:    '2020–2030',
      icon:     '📅',
      color:    'verde',
      subtitle: 'dim_tiempo_dia/mes/trimestre',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-verde">Dashboard — Plataforma Base</h1>
        <p className="text-sm text-gray-500">
          Estado de infraestructura AppHack — todo lo que ya está listo antes del hackathon
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map(k => <KPICard key={k.title} {...k} />)}
      </div>

      {/* Estado de servicios */}
      <div className="card-gov">
        <h2 className="font-bold text-gov-verde mb-3 flex items-center gap-2">
          <span>⚙️</span> Estado de la Plataforma
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            ...SERVICIOS,
            { label: `Supabase DB`, ok: supabaseOK },
          ].map(s => (
            <div
              key={s.label}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md font-medium ${
                s.ok ? 'bg-gov-verde-claro text-gov-verde' : 'bg-red-50 text-red-600'
              }`}
            >
              <span>{s.ok ? '✅' : '❌'}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* CRUD Dummy — demo del flujo completo */}
      <DummyTable />

      {/* Agente Analítico */}
      <AgenteAnalitico />
    </div>
  )
}
