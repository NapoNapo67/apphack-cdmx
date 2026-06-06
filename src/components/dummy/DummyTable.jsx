import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSupabase } from '../../hooks/useSupabase'
import DataTable from '../ui/DataTable'

const COLUMNS = [
  { key: 'descripcion', label: 'Descripción' },
  { key: 'etiqueta',    label: 'Etiqueta' },
  { key: 'created_at',  label: 'Creado', render: v => new Date(v).toLocaleString('es-MX') },
]

export default function DummyTable() {
  const { data, loading, error, refetch } = useSupabase('dummy', { order: 'created_at', ascending: false })
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  async function agregar() {
    if (!desc.trim()) return
    setSaving(true)
    await supabase.from('dummy').insert({ descripcion: desc, etiqueta: 'manual' })
    setDesc('')
    setSaving(false)
    refetch()
  }

  return (
    <div className="card-gov">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔌</span>
        <h3 className="font-bold text-gov-verde">Prueba de Conexión Supabase</h3>
        {!loading && !error && (
          <span className="ml-auto text-xs text-green-600 font-semibold">✓ Conectado</span>
        )}
        {error && <span className="ml-auto text-xs text-red-500">✗ Error: {error}</span>}
      </div>

      {/* Agregar registro */}
      <div className="flex gap-2 mb-4">
        <input
          className="input-gov flex-1"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregar()}
          placeholder="Agregar registro de prueba..."
        />
        <button onClick={agregar} disabled={saving} className="btn-gov">
          {saving ? '...' : 'Agregar'}
        </button>
      </div>

      <DataTable columns={COLUMNS} rows={data} loading={loading} emptyMsg="Sin registros en dummy" />
      <p className="text-xs text-gray-400 mt-2">{data.length} registros encontrados</p>
    </div>
  )
}
