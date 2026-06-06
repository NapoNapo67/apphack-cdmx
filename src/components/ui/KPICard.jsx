export default function KPICard({ title, value, subtitle, icon, color = 'verde' }) {
  const colorMap = {
    verde: 'border-l-gov-verde bg-gov-verde-claro',
    rojo:  'border-l-red-500 bg-red-50',
    oro:   'border-l-yellow-500 bg-yellow-50',
    gris:  'border-l-gray-400 bg-gray-50',
  }
  return (
    <div className={`card-gov border-l-4 ${colorMap[color] || colorMap.verde}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gov-gris-oscuro">{title}</p>
          <p className="text-3xl font-bold text-gov-texto mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  )
}
