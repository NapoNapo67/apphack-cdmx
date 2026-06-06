import { useSupabase } from '../hooks/useSupabase'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'

export default function Admin() {
  const { data: estados, loading } = useSupabase('cat_estado_tramite', { order: 'orden' })

  const cols = [
    { key: 'clave',      label: 'Clave' },
    { key: 'nombre',     label: 'Estado', render: (_, row) => <StatusBadge status={row.clave} label={row.nombre} /> },
    { key: 'descripcion',label: 'Descripción' },
    { key: 'es_terminal',label: 'Terminal', render: v => v ? '✓ Sí' : '—' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gov-verde">Administración de Catálogos</h1>
      <div className="card-gov">
        <h2 className="font-bold text-gov-verde mb-4">Estados de Trámite</h2>
        <DataTable columns={cols} rows={estados} loading={loading} />
      </div>
    </div>
  )
}
