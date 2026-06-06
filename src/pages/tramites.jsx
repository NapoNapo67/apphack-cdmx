import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../hooks/useSupabase'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'

function Modal({ registro, onClose, onGuardado }) {
  const { data: sectores }  = useSupabase('cat_sector_economico')
  const { data: usoSuelo }  = useSupabase('cat_uso_suelo')
  const { data: fuentes }   = useSupabase('cat_fuente_dato')
  const { data: alcaldias } = useSupabase('dw.dim_alcaldia')

  const [form, setForm] = useState({
    nombre:          registro?.nombre         || '',
    direccion:       registro?.direccion       || '',
    colonia:         registro?.colonia         || '',
    cp:              registro?.cp              || '',
    latitud:         registro?.latitud         || '',
    longitud:        registro?.longitud        || '',
    sector_id:       registro?.sector_id       || '',
    fuente_id:       registro?.fuente_id       || '',
    uso_suelo_real_id: registro?.uso_suelo_real_id || '',
    uso_suelo_op_id: registro?.uso_suelo_op_id || '',
    alcaldia_id:     registro?.alcaldia_id     || '',
    num_empleados:   registro?.num_empleados   || '',
    estado_tramite:  registro?.estado_tramite  || 'NUEVO',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function guardar() {
    if (!form.nombre || !form.latitud || !form.longitud) return
    setSaving(true)
    const payload = {
      ...form,
      latitud:      parseFloat(form.latitud),
      longitud:     parseFloat(form.longitud),
      num_empleados: form.num_empleados ? parseInt(form.num_empleados) : null,
      tiene_inconsistencia: form.uso_suelo_real_id && form.uso_suelo_op_id
        ? form.uso_suelo_real_id !== form.uso_suelo_op_id
        : false,
      updated_at: new Date().toISOString(),
    }
    if (registro?.id) {
      await supabase.from('establecimiento').update(payload).eq('id', registro.id)
    } else {
      await supabase.from('establecimiento').insert(payload)
    }
    setSaving(false)
    onGuardado()
    onClose()
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este establecimiento?')) return
    await supabase.from('establecimiento').delete().eq('id', registro.id)
    onGuardado()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gov-verde text-white px-5 py-4 rounded-t-xl flex justify-between items-center">
          <h3 className="font-bold">{registro?.id ? 'Editar Establecimiento' : 'Nuevo Establecimiento'}</h3>
          <button onClick={onClose} className="text-white hover:text-green-200 text-xl">✕</button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {/* Nombre */}
          <div className="col-span-2">
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Nombre *</label>
            <input className="input-gov" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del establecimiento" />
          </div>
          {/* Coordenadas */}
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Latitud *</label>
            <input className="input-gov" type="number" step="0.0001" value={form.latitud} onChange={e => set('latitud', e.target.value)} placeholder="19.4326" />
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Longitud *</label>
            <input className="input-gov" type="number" step="0.0001" value={form.longitud} onChange={e => set('longitud', e.target.value)} placeholder="-99.1332" />
          </div>
          {/* Dirección */}
          <div className="col-span-2">
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Dirección</label>
            <input className="input-gov" value={form.direccion} onChange={e => set('direccion', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Colonia</label>
            <input className="input-gov" value={form.colonia} onChange={e => set('colonia', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">CP</label>
            <input className="input-gov" value={form.cp} onChange={e => set('cp', e.target.value)} />
          </div>
          {/* Catálogos */}
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Sector Económico</label>
            <select className="input-gov" value={form.sector_id} onChange={e => set('sector_id', e.target.value)}>
              <option value="">Seleccionar...</option>
              {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Alcaldía</label>
            <select className="input-gov" value={form.alcaldia_id} onChange={e => set('alcaldia_id', e.target.value)}>
              <option value="">Seleccionar...</option>
              {alcaldias.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Uso de Suelo Permitido (SEDUVI)</label>
            <select className="input-gov" value={form.uso_suelo_real_id} onChange={e => set('uso_suelo_real_id', e.target.value)}>
              <option value="">Seleccionar...</option>
              {usoSuelo.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Uso de Suelo en Operación</label>
            <select className="input-gov" value={form.uso_suelo_op_id} onChange={e => set('uso_suelo_op_id', e.target.value)}>
              <option value="">Seleccionar...</option>
              {usoSuelo.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Fuente de Datos</label>
            <select className="input-gov" value={form.fuente_id} onChange={e => set('fuente_id', e.target.value)}>
              <option value="">Seleccionar...</option>
              {fuentes.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Empleados</label>
            <input className="input-gov" type="number" value={form.num_empleados} onChange={e => set('num_empleados', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Estado del Trámite</label>
            <select className="input-gov" value={form.estado_tramite} onChange={e => set('estado_tramite', e.target.value)}>
              {['NUEVO','ASIGNADO','EN_PROCESO','PENDIENTE','RESUELTO','CANCELADO'].map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Alerta inconsistencia */}
          {form.uso_suelo_real_id && form.uso_suelo_op_id && form.uso_suelo_real_id !== form.uso_suelo_op_id && (
            <div className="col-span-2 p-2 bg-orange-50 border border-orange-300 rounded text-xs text-orange-700">
              ⚠️ El uso de suelo permitido y en operación son diferentes — se registrará una inconsistencia automáticamente.
            </div>
          )}

          {/* Botones */}
          <div className="col-span-2 flex gap-2 pt-2">
            <button onClick={guardar} disabled={saving || !form.nombre} className="btn-gov flex-1">
              {saving ? 'Guardando...' : registro?.id ? 'Guardar cambios' : 'Crear establecimiento'}
            </button>
            {registro?.id && (
              <button onClick={eliminar} className="px-4 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600">
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Tramites() {
  const { data, loading, refetch } = useSupabase('establecimiento', { order: 'created_at', ascending: false })
  const { data: sectores } = useSupabase('cat_sector_economico')
  const [modal, setModal] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroInco, setFiltroInco] = useState(false)

  const filtrados = data.filter(e => {
    const ok = e.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
               e.colonia?.toLowerCase().includes(busqueda.toLowerCase()) ||
               e.direccion?.toLowerCase().includes(busqueda.toLowerCase())
    if (filtroInco && !e.tiene_inconsistencia) return false
    return ok
  })

  const COLUMNS = [
    { key: 'nombre',         label: 'Nombre' },
    { key: 'colonia',        label: 'Colonia', render: v => <span className="text-xs">{v}</span> },
    {
      key: 'sector_id',
      label: 'Sector',
      render: v => {
        const s = sectores.find(x => x.id === v)
        return s ? (
          <span className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color_hex }} />
            {s.nombre.split(' ')[0]}
          </span>
        ) : '—'
      },
    },
    { key: 'estado_tramite', label: 'Estado', render: v => <StatusBadge status={v} label={v} /> },
    {
      key: 'tiene_inconsistencia',
      label: '⚠️',
      render: v => v ? <span className="text-orange-500 font-bold text-sm">⚠️</span> : <span className="text-green-500 text-sm">✓</span>,
    },
    {
      key: 'id', label: '',
      render: (_, row) => (
        <button onClick={() => setModal(row)} className="btn-gov-outline text-xs py-1 px-2">Editar</button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gov-verde">🏢 Establecimientos</h1>
          <p className="text-sm text-gray-500">
            {filtrados.length} registros · {data.filter(e => e.tiene_inconsistencia).length} con inconsistencias
          </p>
        </div>
        <button onClick={() => setModal({})} className="btn-gov">+ Nuevo establecimiento</button>
      </div>

      <div className="card-gov flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <input className="input-gov" placeholder="Buscar por nombre, colonia, dirección..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={filtroInco} onChange={e => setFiltroInco(e.target.checked)} className="accent-orange-500" />
          Solo con inconsistencias
        </label>
      </div>

      {loading ? <LoadingSpinner /> : (
        <DataTable columns={COLUMNS} rows={filtrados} emptyMsg="Sin establecimientos. Agrega el primero o carga un CSV." />
      )}

      {modal !== null && (
        <Modal registro={modal} onClose={() => setModal(null)} onGuardado={refetch} />
      )}
    </div>
  )
}
