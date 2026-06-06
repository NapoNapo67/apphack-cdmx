const COLORS = {
  NUEVO:      'bg-gray-100 text-gray-700',
  ASIGNADO:   'bg-blue-100 text-blue-700',
  EN_PROCESO: 'bg-yellow-100 text-yellow-700',
  PENDIENTE:  'bg-red-100 text-red-700',
  RESUELTO:   'bg-green-100 text-green-700',
  CANCELADO:  'bg-gray-200 text-gray-500',
}

export default function StatusBadge({ status, label }) {
  const cls = COLORS[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label || status}
    </span>
  )
}
