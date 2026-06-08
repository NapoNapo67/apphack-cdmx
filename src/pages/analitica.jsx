import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useKPIs, useTendencia, usePorAlcaldia, usePorTipo, usePorEstado } from '../hooks/useDW'
import AgenteAnalitico from '../components/agents/AgenteAnalitico'
import { FB_KPI, FB_TENDENCIA, FB_POR_ALCALDIA, FB_POR_TIPO, FB_POR_ESTADO } from '../lib/fallback-data'

const GOV_GUINDA = '#7B1F3A'
const GOV_ORO    = '#B8975A'
const GOV_ROJO   = '#CE1126'
const SLA_DIAS   = 15

const COLORES_PIE = [GOV_GUINDA, '#3B82F6', GOV_ORO, '#8B5CF6', '#EC4899', '#10B981']

function KPI({ title, value, sub, color = 'verde', trend }) {
  const styles = {
    verde:  { border: '#10B981', bg: '#ECFDF5' },
    rojo:   { border: '#EF4444', bg: '#FEF2F2' },
    oro:    { border: GOV_ORO,   bg: '#FDF8EE' },
    guinda: { border: GOV_GUINDA,bg: '#fdf5f7' },
  }
  const s = styles[color] || styles.verde
  return (
    <div className="card-gov border-l-4" style={{ borderLeftColor: s.border, background: s.bg }}>
      <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trend !== undefined && (
        <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)} vs mes anterior
        </p>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold mb-1" style={{ color: GOV_GUINDA }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function Analitica() {
  const { data: _kpisArr }   = useKPIs()
  const { data: _tendencia } = useTendencia()
  const { data: _alcaldias } = usePorAlcaldia()
  const { data: _tipos }     = usePorTipo()
  const { data: _estados }   = usePorEstado()

  const kpis      = (_kpisArr?.length   ? _kpisArr[0] : FB_KPI)
  const tendencia = (_tendencia?.length ? _tendencia  : FB_TENDENCIA)
  const alcaldias = (_alcaldias?.length ? _alcaldias  : FB_POR_ALCALDIA)
  const tipos     = (_tipos?.length     ? _tipos      : FB_POR_TIPO)
  const estados   = (_estados?.length   ? _estados    : FB_POR_ESTADO)

  // dataSummary con términos inequívocos para el Agente Analítico
  const dataSummary = {
    // Totales generales
    total_consultas: kpis.total,
    mes_actual: kpis.total_mes_actual,
    mes_anterior: kpis.total_mes_anterior,
    // Resultado del análisis IA (≠ estado del trámite)
    viabilidad_positiva: kpis.viabilidad_positiva,  // ALTO o MEDIO según IA
    pct_viabilidad_positiva: kpis.pct_viabilidad_positiva,
    promedio_dias_apertura: kpis.promedio_dias_apertura,
    // Estado del trámite/workflow (cambia en Gestión Consultas)
    estado_NUEVO: estados.find(e => e.clave === 'NUEVO')?.total ?? 0,
    estado_ASIGNADO: estados.find(e => e.clave === 'ASIGNADO')?.total ?? 0,
    estado_EN_PROCESO: estados.find(e => e.clave === 'EN_PROCESO')?.total ?? 0,
    estado_PENDIENTE: estados.find(e => e.clave === 'PENDIENTE')?.total ?? 0,
    estado_RESUELTO: estados.find(e => e.clave === 'RESUELTO')?.total ?? 0,
    estado_CANCELADO: estados.find(e => e.clave === 'CANCELADO')?.total ?? 0,
    // Rankings
    top_alcaldia: alcaldias?.[0]?.nombre_corto,
    top_tipo_giro: tipos?.[0]?.tipo,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: GOV_GUINDA }}>
          📊 Analítica — Viabilidad de Negocios CDMX
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Datos del sistema SEDECO · {kpis.total?.toLocaleString()} consultas registradas
        </p>
      </div>

      {/* ── 1: KPIs ── */}
      <section>
        <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: GOV_GUINDA }}>
          <span className="text-white rounded px-1.5 py-0.5 text-xs" style={{ background: GOV_GUINDA }}>1</span>
          Resumen Ejecutivo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI title="Total consultas"       value={kpis.total?.toLocaleString()}
               sub="todos los períodos"      color="guinda" />
          <KPI title="Viabilidad favorable"  value={`${kpis.pct_viabilidad_positiva ?? 0}%`}
               sub={`${kpis.viabilidad_positiva?.toLocaleString() ?? 0} con score ALTO o MEDIO`} color="verde" />
          <KPI title="Días estimados apertura" value={kpis.promedio_dias_apertura}
               sub={`Promedio del giro · SLA ${SLA_DIAS}d`}
               color={kpis.promedio_dias_apertura > SLA_DIAS ? 'rojo' : 'verde'} />
          <KPI title="Este mes"              value={kpis.total_mes_actual}
               sub={`vs ${kpis.total_mes_anterior} el mes pasado`} color="oro"
               trend={(kpis.total_mes_actual ?? 0) - (kpis.total_mes_anterior ?? 0)} />
        </div>
        {/* Nota aclaratoria */}
        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          ℹ️ <strong>Viabilidad favorable</strong> = resultado del análisis IA (score ALTO o MEDIO).
          El estado del trámite (RESUELTO, EN PROCESO…) se gestiona en
          <button className="text-gov-verde underline ml-1" onClick={() => {}}>Gestión Consultas</button>.
        </p>
      </section>

      {/* ── 2: Tendencia mensual ── */}
      <section className="card-gov">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: GOV_GUINDA }}>
          <span className="text-white rounded px-1.5 py-0.5 text-xs" style={{ background: GOV_GUINDA }}>2</span>
          Tendencia Mensual — últimos 12 meses
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={tendencia} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="total"     name="Total"     stroke={GOV_GUINDA} strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="resueltos" name="Resueltos" stroke={GOV_ORO}    strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* ── 3 y 4: Alcaldía + Tipo ── */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="card-gov">
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: GOV_GUINDA }}>
            <span className="text-white rounded px-1.5 py-0.5 text-xs" style={{ background: GOV_GUINDA }}>3</span>
            Consultas por Alcaldía
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={alcaldias.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 30, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="nombre_corto" tick={{ fontSize: 10 }} width={75} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Consultas" radius={[0, 4, 4, 0]}>
                {alcaldias.slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={i === 0 ? GOV_GUINDA : '#C4687A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card-gov">
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: GOV_GUINDA }}>
            <span className="text-white rounded px-1.5 py-0.5 text-xs" style={{ background: GOV_GUINDA }}>4</span>
            Por Tipo de Giro
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={tipos} dataKey="total" nameKey="tipo" cx="50%" cy="50%" outerRadius={70}
                label={({ tipo, percent }) => `${tipo?.split('/')[0]?.trim()}: ${Math.round((percent || 0) * 100)}%`}
                labelLine={false}>
                {tipos.map((_, i) => <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left py-1.5 px-2">Giro</th>
                  <th className="text-right py-1.5 px-2">Total</th>
                  <th className="text-right py-1.5 px-2">% Res.</th>
                  <th className="text-right py-1.5 px-2">Días</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map((t, i) => (
                  <tr key={t.clave} className="border-t border-gray-100">
                    <td className="py-1.5 px-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ background: COLORES_PIE[i % COLORES_PIE.length] }} />
                      {t.tipo}
                    </td>
                    <td className="py-1.5 px-2 text-right font-bold">{t.total}</td>
                    <td className="py-1.5 px-2 text-right">{t.pct_resueltos ?? 0}%</td>
                    <td className="py-1.5 px-2 text-right">{t.promedio_dias ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── 5: SLA ── */}
      <section className="card-gov">
        <h2 className="font-bold mb-1 flex items-center gap-2" style={{ color: GOV_GUINDA }}>
          <span className="text-white rounded px-1.5 py-0.5 text-xs" style={{ background: GOV_GUINDA }}>5</span>
          Análisis de Tiempos — SLA {SLA_DIAS} días
        </h2>
        <p className="text-xs text-gray-400 mb-4">Rojo = fuera de SLA · Verde = dentro de SLA</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={tipos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="tipo" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={SLA_DIAS} stroke={GOV_ROJO} strokeDasharray="6 3"
              label={{ value: `SLA ${SLA_DIAS}d`, fill: GOV_ROJO, fontSize: 11 }} />
            <Bar dataKey="promedio_dias" name="Días promedio" radius={[4, 4, 0, 0]}>
              {tipos.map((t, i) => (
                <Cell key={i} fill={(t.promedio_dias ?? 0) > SLA_DIAS ? GOV_ROJO : '#10B981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* ── 6: Por estado ── */}
      <section className="card-gov">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: GOV_GUINDA }}>
          <span className="text-white rounded px-1.5 py-0.5 text-xs" style={{ background: GOV_GUINDA }}>6</span>
          Distribución por Estado
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {estados.map(e => (
            <div key={e.clave} className="text-center p-3 rounded-xl border-2"
              style={{ borderColor: e.color_hex, background: e.color_hex + '18' }}>
              <p className="text-2xl font-bold" style={{ color: e.color_hex }}>{e.total?.toLocaleString()}</p>
              <p className="text-xs font-semibold text-gray-600 mt-1">{e.nombre}</p>
              <p className="text-xs text-gray-400">{e.porcentaje}%</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agente Analítico */}
      <AgenteAnalitico dataSummary={dataSummary} />
    </div>
  )
}
