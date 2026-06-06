import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSupabase } from '../../hooks/useSupabase'
import DataTable from '../ui/DataTable'
import StatusBadge from '../ui/StatusBadge'

const ETIQUETAS = ['general', 'sistema', 'prueba', 'manual', 'demo']

function ModalEditar({ registro, onClose, onGuardado }) {
  const [desc, setDesc] = useState(registro?.descripcion || '')
  const [etiqueta, setEtiqueta] = useState(registro?.etiqueta || 'general')
  const [saving, setSaving] = useState(false)

  async function guardar() {
    if (!desc.trim()) return
    setSaving(true)
    if (registro?.id) {
      await supabase
        .from('dummy')
        .update({ descripcion: desc, etiqueta, updated_at: new Date().toISOString() })
        .eq('id', registro.id)
    } else {
      await supabase.from('dummy').insert({ descripcion: desc, etiqueta })
    }
    setSaving(false)
    onGuardado()
    onClose()
  }

  async function eliminar() {
    if (!registro?.id) return
    if (!confirm('¿Eliminar este registro?')) return
    await supabase.from('dummy').delete().eq('id', registro.id)
    onGuardado()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header modal */}
        <div className="bg-gov-verde text-white px-5 py-4 rounded-t-xl flex justify-between items-center">
          <h3 className="font-bold">{registro?.id ? 'Editar Registro' : 'Nuevo Registro'}</h3>
          <button onClick={onClose} className="text-white hover:text-green-200 text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gov-gris-oscuro mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-gov resize-none h-24"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Ingresa la descripción del registro..."
            />
          </div>

          {/* Etiqueta */}
          <div>
            <label className="block text-sm font-semibold text-gov-gris-oscuro mb-1">Etiqueta</label>
            <select
              className="input-gov"
              value={etiqueta}
              onChange={e => setEtiqueta(e.target.value)}
            >
              {ETIQUETAS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button onClick={guardar} disabled={saving || !desc.trim()} className="btn-gov flex-1">
              {saving ? 'Guardando...' : registro?.id ? 'Guardar cambios' : 'Crear registro'}
            </button>
            {registro?.id && (
              <button onClick={eliminar} className="px-4 py-2 bg-red-500 text-white rounded-md font-semibold hover:bg-red-600 transition">
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DummyTable() {
  const { data, loading, error, refetch } = useSupabase('dummy', {
    order: 'created_at',
    ascending: false,
  })
  const [modal, setModal] = useState(null) // null | {} (nuevo) | {id,...} (editar)
  const [busqueda, setBusqueda] = useState('')

  const filasFiltradas = data.filter(r =>
    r.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.etiqueta?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const COLUMNS = [
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'etiqueta',
      label: 'Etiqueta',
      render: v => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gov-verde-claro text-gov-verde border border-gov-verde">
          {v}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: v => new Date(v).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      key: 'updated_at',
      label: 'Actualizado',
      render: v => new Date(v).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (_, row) => (
        <button
          onClick={() => setModal(row)}
          className="btn-gov-outline text-xs py-1 px-3"
        >
          Editar
        </button>
      ),
    },
  ]

  return (
    <div className="card-gov">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔌</span>
          <div>
            <h3 className="font-bold text-gov-verde">Tabla Dummy — Prueba CRUD</h3>
            <p className="text-xs text-gray-500">Verifica conexión Supabase en tiempo real</p>
          </div>
          {!loading && !error && (
            <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              ✓ Supabase OK
            </span>
          )}
          {error && (
            <span className="ml-2 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              ✗ Sin conexión
            </span>
          )}
        </div>
        <button onClick={() => setModal({})} className="btn-gov text-sm flex items-center gap-1">
          + Nuevo registro
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          className="input-gov"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por descripción o etiqueta..."
        />
      </div>

      {/* Tabla */}
      <DataTable
        columns={COLUMNS}
        rows={filasFiltradas}
        loading={loading}
        emptyMsg={error ? `Error: ${error}` : 'Sin registros. Crea el primero.'}
      />

      {/* Footer stats */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
        <span>{data.length} registros totales</span>
        {busqueda && <span>{filasFiltradas.length} coincidencias con "{busqueda}"</span>}
        <button onClick={refetch} className="text-gov-verde hover:underline">↻ Actualizar</button>
      </div>

      {/* Modal */}
      {modal !== null && (
        <ModalEditar
          registro={modal}
          onClose={() => setModal(null)}
          onGuardado={refetch}
        />
      )}
    </div>
  )
}
