import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../hooks/useSupabase'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const SEVERIDAD_BADGE = {
  ALTA:  'bg-red-100 text-red-700 border border-red-300',
  MEDIA: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  BAJA:  'bg-green-100 text-green-700 border border-green-300',
}

function BadgeSeveridad({ clave }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${SEVERIDAD_BADGE[clave] || ''}`}>
      {clave === 'ALTA' ? '🔴' : clave === 'MEDIA' ? '🟡' : '🟢'} {clave}
    </span>
  )
}

export default function Inconsistencias() {
  const { data: inconsistencias, loading, refetch } = useSupabase('inconsistencia', {
    order: 'created_at', ascending: false,
  })
  const { data: establecimientos } = useSupabase('establecimiento', {
    filter: { tiene_inconsistencia: true },
  })
  const { data: usoSuelo } = useSupabase('cat_uso_suelo')

  const [analizando, setAnalizando] = useState(null)
  const [seleccionado, setSeleccionado] = useState(null)
  const [filtroSeveridad, setFiltroSeveridad] = useState('TODAS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  const filtradas = inconsistencias.filter(i => {
    if (filtroSeveridad !== 'TODAS' && i.severidad_clave !== filtroSeveridad) return false
    if (filtroEstado !== 'TODOS' && i.estado_tramite !== filtroEstado) return false
    return true
  })

  async function analizarConIA(inco) {
    setAnalizando(inco.id)
    try {
      const est = establecimientos.find(e => e.id === inco.establecimiento_id)
      const usoReal = usoSuelo.find(u => u.id === est?.uso_suelo_real_id)
      const usoOp   = usoSuelo.find(u => u.id === est?.uso_suelo_op_id)

      const res = await fetch('/.netlify/functions/analizar-inconsistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          establecimiento: {
            nombre:         est?.nombre,
            direccion:      est?.direccion,
            colonia:        est?.colonia,
            uso_suelo_real: usoReal?.nombre,
            uso_suelo_operacion: usoOp?.nombre,
            sector:         est?.clave_scian,
          },
          inconsistencia: {
            tipo:        inco.tipo,
            descripcion: inco.descripcion,
          },
        }),
      })
      const data = await res.json()

      await supabase
        .from('inconsistencia')
        .update({ analizado_por_ia: true, ia_respuesta: data.content, estado_tramite: 'EN_PROCESO', updated_at: new Date().toISOString() })
        .eq('id', inco.id)

      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setAnalizando(null)
    }
  }

  async function cambiarEstado(id, estado) {
    await supabase.from('inconsistencia').update({ estado_tramite: estado, updated_at: new Date().toISOString() }).eq('id', id)
    refetch()
  }

  const COLUMNS = [
    {
      key: 'severidad_clave',
      label: 'Severidad',
      render: v => <BadgeSeveridad clave={v} />,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: v => <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{v}</span>,
    },
    { key: 'descripcion', label: 'Descripción', render: v => <span className="text-xs">{v}</span> },
    {
      key: 'analizado_por_ia',
      label: 'IA',
      render: v => v ? <span className="text-green-600 text-sm">✓</span> : <span className="text-gray-400 text-sm">—</span>,
    },
    {
      key: 'estado_tramite',
      label: 'Estado',
      render: v => <StatusBadge status={v} label={v} />,
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (id, row) => (
        <div className="flex gap-1">
          <button
            onClick={() => setSeleccionado(row)}
            className="text-xs btn-gov-outline py-0.5 px-2"
          >
            Ver
          </button>
          <button
            onClick={() => analizarConIA(row)}
            disabled={analizando === id || row.analizado_por_ia}
            className="text-xs btn-gov py-0.5 px-2"
            title="Analizar con Claude"
          >
            {analizando === id ? '...' : '🤖'}
          </button>
        </div>
      ),
    },
  ]

  const stats = {
    alta:  inconsistencias.filter(i => i.severidad_clave === 'ALTA').length,
    media: inconsistencias.filter(i => i.severidad_clave === 'MEDIA').length,
    baja:  inconsistencias.filter(i => i.severidad_clave === 'BAJA').length,
    sinIA: inconsistencias.filter(i => !i.analizado_por_ia).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-verde flex items-center gap-2">
          ⚠️ Detector de Inconsistencias
        </h1>
        <p className="text-sm text-gray-500">
          Establecimientos con uso de suelo incompatible o datos irregulares — analizados con IA
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Severidad Alta', value: stats.alta,  color: 'bg-red-50 border-red-300 text-red-700',    icon: '🔴' },
          { label: 'Severidad Media',value: stats.media, color: 'bg-yellow-50 border-yellow-300 text-yellow-700', icon: '🟡' },
          { label: 'Severidad Baja', value: stats.baja,  color: 'bg-green-50 border-green-300 text-green-700',   icon: '🟢' },
          { label: 'Pendientes de IA',value: stats.sinIA,color: 'bg-purple-50 border-purple-300 text-purple-700', icon: '🤖' },
        ].map(k => (
          <div key={k.label} className={`card-gov border ${k.color}`}>
            <p className="text-xs font-medium mb-1">{k.label}</p>
            <p className="text-3xl font-bold">{k.icon} {k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card-gov flex flex-wrap gap-4">
        <div>
          <label className="text-xs font-bold text-gov-verde block mb-1">Severidad</label>
          <select className="input-gov text-sm" value={filtroSeveridad} onChange={e => setFiltroSeveridad(e.target.value)}>
            <option value="TODAS">Todas</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Media</option>
            <option value="BAJA">Baja</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gov-verde block mb-1">Estado</label>
          <select className="input-gov text-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="TODOS">Todos</option>
            <option value="NUEVO">Nuevo</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="RESUELTO">Resuelto</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => inconsistencias.filter(i => !i.analizado_por_ia).slice(0,3).forEach(i => analizarConIA(i))}
            className="btn-gov text-sm"
            disabled={stats.sinIA === 0}
          >
            🤖 Analizar pendientes con IA
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? <LoadingSpinner /> : (
        <DataTable columns={COLUMNS} rows={filtradas} emptyMsg="Sin inconsistencias detectadas ✓" />
      )}

      {/* Modal detalle */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gov-verde text-white px-5 py-4 rounded-t-xl flex justify-between">
              <h3 className="font-bold">Detalle de Inconsistencia</h3>
              <button onClick={() => setSeleccionado(null)} className="text-white hover:text-green-200">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2 items-center">
                <BadgeSeveridad clave={seleccionado.severidad_clave} />
                <StatusBadge status={seleccionado.estado_tramite} label={seleccionado.estado_tramite} />
                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{seleccionado.tipo}</span>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 mb-1">DESCRIPCIÓN</p>
                <p className="text-sm">{seleccionado.descripcion}</p>
              </div>

              {seleccionado.recomendacion && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-blue-700 mb-1">💡 RECOMENDACIÓN</p>
                  <p className="text-sm text-blue-800">{seleccionado.recomendacion}</p>
                </div>
              )}

              {seleccionado.ia_respuesta && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-purple-700 mb-1">🤖 ANÁLISIS IA (Claude)</p>
                  <p className="text-sm text-purple-900 whitespace-pre-wrap">{seleccionado.ia_respuesta}</p>
                </div>
              )}

              {!seleccionado.analizado_por_ia && (
                <button
                  onClick={() => { analizarConIA(seleccionado); setSeleccionado(null) }}
                  className="btn-gov w-full"
                >
                  🤖 Analizar con Claude
                </button>
              )}

              <div className="flex gap-2">
                {['EN_PROCESO','RESUELTO','CANCELADO'].map(e => (
                  <button
                    key={e}
                    onClick={() => { cambiarEstado(seleccionado.id, e); setSeleccionado(null) }}
                    className="btn-gov-outline text-xs flex-1"
                  >
                    → {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
