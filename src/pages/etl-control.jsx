import { useState } from 'react'
import { useEstadoETL, useLogETL, useContadorLive } from '../hooks/useETL'
import { supabase } from '../lib/supabase'

const GOV_VERDE  = '#006847'
const GOV_ROJO   = '#CE1126'
const GOV_ORO    = '#C8A217'

// ── Indicador de salud ────────────────────────────────────────
function Semaforo({ lag, errores }) {
  if (errores > 0) return <span className="flex items-center gap-1.5 text-red-600 font-bold text-sm">🔴 Con errores</span>
  if (lag > 5)     return <span className="flex items-center gap-1.5 text-yellow-600 font-bold text-sm">🟡 Lag detectado ({lag} registros)</span>
  return              <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm">🟢 Operando en línea</span>
}

// ── Tarjeta KPI ───────────────────────────────────────────────
function KPICard({ label, value, sub, color = 'verde', pulse = false }) {
  const border = { verde: 'border-gov-verde', rojo: 'border-red-500', oro: 'border-yellow-500' }
  return (
    <div className={`card-gov border-l-4 ${border[color]} relative overflow-hidden`}>
      {pulse && (
        <span className="absolute top-2 right-2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      )}
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-black text-gov-texto">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Fila del log ──────────────────────────────────────────────
function LogRow({ row, isNew }) {
  const tipoIcon = { TRIGGER: '⚡', MANUAL: '👆', SCHEDULE: '🕐' }
  const estadoColor = row.estado === 'OK' ? 'text-green-600' : 'text-red-600'
  const fecha = new Date(row.ejecutado_en)
  return (
    <tr className={`border-t border-gray-100 transition-colors ${isNew ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
      <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
        {fecha.toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}{' '}
        <span className="font-mono">{fecha.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
      </td>
      <td className="px-3 py-2 text-xs">{tipoIcon[row.tipo] || '?'} {row.tipo}</td>
      <td className={`px-3 py-2 text-xs font-bold ${estadoColor}`}>{row.estado}</td>
      <td className="px-3 py-2 text-xs text-right font-mono">{row.registros_insertados ?? 0}</td>
      <td className="px-3 py-2 text-xs text-right font-mono text-gray-500">
        {row.duracion_ms != null ? `${row.duracion_ms} ms` : '—'}
      </td>
      {row.detalle && <td className="px-3 py-2 text-xs text-red-500">{row.detalle}</td>}
    </tr>
  )
}

export default function ETLControl() {
  const { data: estado, loading: loadEst, lastRefresh, refetch: refetchEstado } = useEstadoETL(10000)
  const { data: logs, loading: loadLog, refetch: refetchLog }                   = useLogETL(50)
  const { total: totalLive, nuevos }                                             = useContadorLive()
  const [ejecutando, setEjecutando] = useState(false)
  const [mensaje,    setMensaje]    = useState(null)

  // IDs de las últimas 3 filas del log para animarlas como "nuevas"
  const idsRecientes = logs.slice(0, 3).map(l => l.id)

  async function ejecutarETLManual() {
    setEjecutando(true)
    setMensaje(null)
    try {
      // Llamar al endpoint de Netlify que corre el ETL
      const res = await fetch('/.netlify/functions/ejecutar-etl', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setMensaje({ tipo: 'ok', texto: `ETL completado: ${data.insertados} insertados, ${data.actualizados} actualizados en ${data.ms}ms` })
        refetchEstado(); refetchLog()
      } else throw new Error(data.error)
    } catch (e) {
      setMensaje({ tipo: 'error', texto: e.message })
    } finally {
      setEjecutando(false)
    }
  }

  const lag = estado?.lag_registros ?? 0
  const latencia = estado?.latencia_promedio_ms

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gov-verde flex items-center gap-2">
            ⚙️ Tablero de Control ETL
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            operacional <code>public.consulta_viabilidad</code> → DW <code>dw.fact_consulta</code>
          </p>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>Auto-refresca cada 10s</p>
          {lastRefresh && <p>Última lectura: {lastRefresh.toLocaleTimeString('es-MX')}</p>}
        </div>
      </div>

      {/* Estado general */}
      <div className="card-gov flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Estado del pipeline</p>
          <Semaforo lag={lag} errores={estado?.errores_24h ?? 0} />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Arquitectura:</span>
          <div className="flex items-center gap-1 font-mono bg-gray-100 rounded px-2 py-1">
            INSERT → <span className="text-green-600 font-bold">TRIGGER</span> → fact_consulta
          </div>
          <span className="text-green-600">⚡ Latencia {latencia ?? '~50'} ms</span>
        </div>
        <button
          onClick={ejecutarETLManual}
          disabled={ejecutando}
          className="btn-gov py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {ejecutando ? <><span className="animate-spin">⏳</span> Ejecutando...</> : '▶ Ejecutar ETL manual'}
        </button>
      </div>

      {mensaje && (
        <div className={`p-3 rounded-lg text-sm border ${
          mensaje.tipo === 'ok'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {mensaje.tipo === 'ok' ? '✅' : '❌'} {mensaje.texto}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Registros en origen"
          value={totalLive ?? estado?.registros_origen}
          sub="public.consulta_viabilidad"
          color="verde"
          pulse={nuevos > 0}
        />
        <KPICard
          label="Registros en DW"
          value={estado?.registros_dw}
          sub="dw.fact_consulta"
          color="verde"
        />
        <KPICard
          label="Lag (pendientes)"
          value={lag}
          sub={lag === 0 ? 'DW sincronizado ✓' : 'registros sin cargar'}
          color={lag > 0 ? 'rojo' : 'verde'}
        />
        <KPICard
          label="Ejecuciones hoy"
          value={estado?.ejecuciones_24h ?? 0}
          sub={`${estado?.errores_24h ?? 0} errores en 24h`}
          color={estado?.errores_24h > 0 ? 'rojo' : 'oro'}
        />
      </div>

      {/* Indicador live de nuevos registros */}
      {nuevos > 0 && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-sm text-green-700 flex items-center gap-3 animate-pulse">
          <span className="text-lg">⚡</span>
          <span>
            <strong>{nuevos} registro{nuevos > 1 ? 's' : ''} nuevo{nuevos > 1 ? 's' : ''}</strong> acaba de llegar —
            el trigger lo procesó en tiempo real al DW
          </span>
        </div>
      )}

      {/* Diagrama de flujo */}
      <div className="card-gov">
        <h2 className="font-bold text-gov-verde mb-4 text-sm">📐 Arquitectura del pipeline</h2>
        <div className="flex items-center justify-center flex-wrap gap-2 text-xs font-mono">
          {[
            { icon: '👤', label: 'Emprendedor', sub: 'llena formulario', color: '#e0f2fe', border: '#0284c7' },
            { arrow: true },
            { icon: '📝', label: 'consulta_viabilidad', sub: 'INSERT', color: '#f0fdf4', border: '#16a34a' },
            { arrow: true },
            { icon: '⚡', label: 'TRIGGER', sub: 'fn_etl_consulta', color: '#fef9c3', border: '#ca8a04' },
            { arrow: true },
            { icon: '⭐', label: 'fact_consulta', sub: 'UPSERT ~50ms', color: '#f0fdf4', border: '#006847' },
            { arrow: true },
            { icon: '📊', label: 'Vistas DW', sub: 'v_kpi, v_tendencia...', color: '#faf5ff', border: '#7c3aed' },
            { arrow: true },
            { icon: '📈', label: 'Dashboard', sub: 'tiempo real', color: '#fff7ed', border: '#ea580c' },
          ].map((item, i) =>
            item.arrow ? (
              <span key={i} className="text-gray-400 text-base">→</span>
            ) : (
              <div key={i} className="text-center p-2 rounded-lg border-2 min-w-[90px]"
                style={{ background: item.color, borderColor: item.border }}>
                <div className="text-xl">{item.icon}</div>
                <div className="font-bold text-[10px]" style={{ color: item.border }}>{item.label}</div>
                <div className="text-[9px] text-gray-500">{item.sub}</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Log de ejecuciones */}
      <div className="card-gov">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gov-verde flex items-center gap-2">
            📋 Historial de ejecuciones
            <span className="text-xs font-normal text-gray-400">(últimas 50)</span>
          </h2>
          <button onClick={refetchLog} className="text-xs text-gov-verde hover:underline">↻ Actualizar</button>
        </div>

        {loadLog ? (
          <p className="text-sm text-gray-400 text-center py-8">Cargando historial...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Sin ejecuciones registradas aún. El log se llena automáticamente cuando el trigger procesa registros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabla-gov">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Fecha / Hora</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Estado</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Registros</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Latencia</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(row => (
                  <LogRow key={row.id} row={row} isNew={idsRecientes.includes(row.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leyenda de tipos */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span>⚡ TRIGGER — automático al hacer INSERT</span>
          <span>👆 MANUAL — botón "Ejecutar ETL"</span>
          <span>🕐 SCHEDULE — ejecución programada</span>
        </div>
      </div>

    </div>
  )
}
