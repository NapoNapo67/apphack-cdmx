import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useKPIs, useTendencia, usePorAlcaldia, usePorTipo, usePorEstado } from '../hooks/useDW'
import AgenteAnalitico from '../components/agents/AgenteAnalitico'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const GOV_VERDE = '#006847'
const GOV_ROJO  = '#CE1126'
const GOV_ORO   = '#C8A217'
const SLA_DIAS  = 15  // línea de referencia SLA

const COLORES_ESTADO = {
  NUEVO:      '#6B7280',
  ASIGNADO:   '#3B82F6',
  EN_PROCESO: '#F59E0B',
  PENDIENTE:  '#EF4444',
  RESUELTO:   '#10B981',
  CANCELADO:  '#9CA3AF',
}

const COLORES_PIE = [GOV_VERDE, '#3B82F6', GOV_ORO, '#8B5CF6', '#EC4899']

function KPI({ title, value, sub, color = 'verde', trend }) {
  const bg = { verde: 'border-gov-verde bg-gov-verde-claro', rojo: 'border-red-500 bg-red-50', oro: 'border-yellow-500 bg-yellow-50' }
  return (
    <div className={`card-gov border-l-4 ${bg[color]}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gov-texto">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} vs mes anterior
        </p>
      )}
    </div>
  )
}

function Skeleton() {
  return <div className="card-gov animate-pulse h-48 bg-gray-100" />
}

// Tooltip personalizado con diseño CDMX
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gov-gris-medio rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-gov-verde mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function Analitica() {
  const { data: kpisArr,   loading: kL } = useKPIs()
  const { data: tendencia, loading: tL } = useTendencia()
  const { data: alcaldias, loading: aL } = usePorAlcaldia()
  const { data: tipos,     loading: tiL } = usePorTipo()
  const { data: estados,   loading: eL } = usePorEstado()

  const kpis    = kpisArr?.[0] ?? {}
  const anyLoad = kL || tL || aL || tiL || eL

  // Resumen para el Agente Analítico
  const dataSummary = {
    total:           kpis.total,
    resueltos:       kpis.resueltos,
    en_proceso:      kpis.en_proceso,
    pct_resueltos:   kpis.pct_resueltos,
    promedio_dias:   kpis.promedio_dias,
    mes_actual:      kpis.total_mes_actual,
    mes_anterior:    kpis.total_mes_anterior,
    top_alcaldia:    alcaldias?.[0]?.alcaldia,
    top_tipo:        tipos?.[0]?.tipo,
    sla_objetivo_dias: SLA_DIAS,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-verde">Analítica — Data Warehouse</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Datos de <code>dw.fact_dummy</code> · vistas <code>dw.v_kpis</code>, <code>dw.v_tendencia_mensual</code>, <code>dw.v_por_alcaldia</code>, <code>dw.v_por_tipo</code>
          {' '}· Al definir el negocio (Prompt B) estas vistas apuntarán a <code>dw.fact_[negocio]</code>
        </p>
      </div>

      {/* ── Tablero 1: KPIs ─────────────────────────── */}
      <section>
        <h2 className="font-bold text-gov-verde mb-3 flex items-center gap-2">
          <span className="bg-gov-verde text-white rounded px-1.5 py-0.5 text-xs">1</span>
          Resumen Ejecutivo
        </h2>
        {kL ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Skeleton/><Skeleton/><Skeleton/><Skeleton/></div> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI title="Total de registros"   value={kpis.total}           sub="todos los períodos"       color="verde" />
            <KPI title="% Resueltos"          value={`${kpis.pct_resueltos ?? 0}%`} sub={`${kpis.resueltos} completados`} color="verde" />
            <KPI title="Días promedio"        value={kpis.promedio_dias}   sub={`SLA objetivo: ${SLA_DIAS} días`}  color={kpis.promedio_dias > SLA_DIAS ? 'rojo' : 'verde'} />
            <KPI
              title="Este mes"
              value={kpis.total_mes_actual}
              sub={`vs ${kpis.total_mes_anterior} el mes pasado`}
              color="oro"
              trend={(kpis.total_mes_actual ?? 0) - (kpis.total_mes_anterior ?? 0)}
            />
          </div>
        )}
      </section>

      {/* ── Tablero 2: Tendencia mensual ────────────── */}
      <section className="card-gov">
        <h2 className="font-bold text-gov-verde mb-4 flex items-center gap-2">
          <span className="bg-gov-verde text-white rounded px-1.5 py-0.5 text-xs">2</span>
          Tendencia Mensual — últimos 12 meses
        </h2>
        {tL ? <LoadingSpinner /> : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={tendencia} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="total"     name="Total"     stroke={GOV_VERDE} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="resueltos" name="Resueltos" stroke={GOV_ORO}   strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ── Tablero 3 y 4 en grid ───────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Tablero 3: Por alcaldía */}
        <section className="card-gov">
          <h2 className="font-bold text-gov-verde mb-4 flex items-center gap-2">
            <span className="bg-gov-verde text-white rounded px-1.5 py-0.5 text-xs">3</span>
            Por Alcaldía
          </h2>
          {aL ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={alcaldias?.slice(0,10)}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="nombre_corto" tick={{ fontSize: 10 }} width={75} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" fill={GOV_VERDE} radius={[0,4,4,0]}>
                  {alcaldias?.slice(0,10).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? GOV_ROJO : GOV_VERDE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Tablero 4: Por tipo */}
        <section className="card-gov">
          <h2 className="font-bold text-gov-verde mb-4 flex items-center gap-2">
            <span className="bg-gov-verde text-white rounded px-1.5 py-0.5 text-xs">4</span>
            Por Tipo
          </h2>
          {tiL ? <LoadingSpinner /> : (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={tipos}
                    dataKey="total"
                    nameKey="tipo"
                    cx="50%" cy="50%"
                    outerRadius={70}
                    label={({ tipo, porcentaje }) => `${tipo?.split(' ')[1] ?? tipo}: ${Math.round((porcentaje || 0))}%`}
                    labelLine={false}
                  >
                    {tipos?.map((_, i) => (
                      <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Tabla de detalle */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs tabla-gov">
                  <thead><tr>
                    <th className="px-2 py-1.5 text-left">Tipo</th>
                    <th className="px-2 py-1.5 text-right">Total</th>
                    <th className="px-2 py-1.5 text-right">% Res.</th>
                    <th className="px-2 py-1.5 text-right">Días prom.</th>
                  </tr></thead>
                  <tbody>
                    {tipos?.map((t, i) => (
                      <tr key={t.clave} className="border-t border-gov-gris-medio">
                        <td className="px-2 py-1.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORES_PIE[i % COLORES_PIE.length] }} />
                          {t.tipo}
                        </td>
                        <td className="px-2 py-1.5 text-right font-bold">{t.total}</td>
                        <td className="px-2 py-1.5 text-right">{t.pct_resueltos ?? 0}%</td>
                        <td className="px-2 py-1.5 text-right">{t.promedio_dias ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Tablero 5: Análisis de tiempos / SLA ────── */}
      <section className="card-gov">
        <h2 className="font-bold text-gov-verde mb-1 flex items-center gap-2">
          <span className="bg-gov-verde text-white rounded px-1.5 py-0.5 text-xs">5</span>
          Análisis de Tiempos — SLA {SLA_DIAS} días
        </h2>
        <p className="text-xs text-gray-400 mb-4">Rojo = fuera de SLA · Verde = dentro de SLA</p>
        {tiL ? <LoadingSpinner /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tipos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="tipo" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={SLA_DIAS} stroke={GOV_ROJO} strokeDasharray="6 3" label={{ value: `SLA ${SLA_DIAS}d`, fill: GOV_ROJO, fontSize: 11 }} />
              <Bar dataKey="promedio_dias" name="Días promedio" radius={[4,4,0,0]}>
                {tipos?.map((t, i) => (
                  <Cell key={i} fill={(t.promedio_dias ?? 0) > SLA_DIAS ? GOV_ROJO : GOV_VERDE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* ── Tablero 6: Por estado ───────────────────── */}
      <section className="card-gov">
        <h2 className="font-bold text-gov-verde mb-4 flex items-center gap-2">
          <span className="bg-gov-verde text-white rounded px-1.5 py-0.5 text-xs">6</span>
          Distribución por Estado
        </h2>
        {eL ? <LoadingSpinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {estados?.map(e => (
              <div key={e.clave} className="text-center p-3 rounded-lg border-2" style={{ borderColor: e.color_hex, background: e.color_hex + '18' }}>
                <p className="text-2xl font-bold" style={{ color: e.color_hex }}>{e.total}</p>
                <p className="text-xs font-semibold text-gray-600 mt-1">{e.nombre}</p>
                <p className="text-xs text-gray-400">{e.porcentaje ?? 0}%</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Agente Analítico con contexto del DW */}
      <AgenteAnalitico dataSummary={dataSummary} />
    </div>
  )
}
