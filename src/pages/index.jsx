import { useSupabase } from '../hooks/useSupabase'
import KPICard from '../components/ui/KPICard'
import { useApp } from '../context/AppContext'

export default function Dashboard() {
  const { setActiveTab } = useApp()
  const { data: giros }      = useSupabase('cat_giro_negocio')
  const { data: tramites }   = useSupabase('tramite')
  const { data: programas }  = useSupabase('programa_emprendimiento')
  const { data: consultas }  = useSupabase('consulta_viabilidad')

  const consultasAlto  = consultas.filter(c => c.nivel_viabilidad === 'ALTO').length
  const consultasMedio = consultas.filter(c => c.nivel_viabilidad === 'MEDIO').length

  const ACCESOS = [
    {
      id: 'viabilidad',
      icon: '🚀',
      title: 'Evaluar mi negocio',
      desc: 'Analiza si tu idea es viable en la zona elegida. Score con IA en segundos.',
      color: 'verde',
    },
    {
      id: 'ruta-tramites',
      icon: '📋',
      title: 'Ver mis trámites',
      desc: 'Obtén la ruta exacta de trámites para tu giro — en orden, con costos y tiempos.',
      color: 'verde',
    },
    {
      id: 'programas',
      icon: '🎯',
      title: 'Programas de apoyo',
      desc: 'Créditos, incubación y subsidios del Gobierno CDMX para emprendedores.',
      color: 'oro',
    },
    {
      id: 'analitica',
      icon: '📈',
      title: 'Analítica y datos',
      desc: 'Tableros con métricas de consultas, giros más evaluados y tendencias.',
      color: 'gris',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="card-gov text-center py-10 border-t-4 border-t-gov-verde">
        <p className="text-5xl mb-3">🚀</p>
        <h1 className="text-3xl font-black text-gov-verde mb-2">
          Viabilidad de Negocios CDMX
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Herramienta de SEDECO para que emprendedores e inversionistas
          conozcan si su negocio puede prosperar en la Ciudad de México,
          qué trámites necesitan y cómo obtener apoyo.
        </p>
        <button
          onClick={() => setActiveTab('viabilidad')}
          className="btn-gov mt-6 px-8 py-3 text-base"
        >
          🤖 Evaluar mi negocio con IA →
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Tipos de giro"         value={giros.length}    icon="🏪" subtitle="catalogados" />
        <KPICard title="Trámites disponibles"  value={tramites.length} icon="📄" subtitle="del RETYS/SIAPEM" />
        <KPICard title="Programas de apoyo"    value={programas.length}icon="🎯" subtitle="SEDECO y federal" />
        <KPICard title="Consultas realizadas"  value={consultas.length}icon="📊" subtitle={`${consultasAlto} viabilidad alta`} color="oro" />
      </div>

      {/* Accesos rápidos */}
      <div className="grid md:grid-cols-2 gap-4">
        {ACCESOS.map(a => (
          <button
            key={a.id}
            onClick={() => setActiveTab(a.id)}
            className="card-gov text-left hover:border-gov-verde hover:shadow-md transition-all border-2 border-transparent"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{a.icon}</span>
              <div>
                <p className="font-bold text-gov-verde">{a.title}</p>
                <p className="text-sm text-gray-500 mt-1">{a.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info institucional */}
      <div className="card-gov bg-gov-verde-claro border-gov-verde border text-sm text-gov-gris-oscuro">
        <p className="font-bold text-gov-verde mb-2">ℹ️ ¿Necesitas asesoría presencial?</p>
        <p>
          <strong>CENPROIN</strong> — Centro Promotor de Inversión · SEDECO<br/>
          📍 Av. Cuauhtémoc 899, Col. Narvarte, Alcaldía Benito Juárez<br/>
          🕘 Lunes a viernes, 9:00 – 14:30 horas<br/>
          📧 <a href="mailto:dudas.siapem@sedeco.cdmx.gob.mx" className="text-gov-verde underline">dudas.siapem@sedeco.cdmx.gob.mx</a>
        </p>
      </div>
    </div>
  )
}
