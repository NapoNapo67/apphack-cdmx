import LoadingSpinner from './LoadingSpinner'

export default function DataTable({ columns = [], rows = [], loading = false, emptyMsg = 'Sin registros' }) {
  if (loading) return <LoadingSpinner />
  return (
    <div className="overflow-x-auto rounded-lg border border-gov-gris-medio">
      <table className="w-full text-sm tabla-gov">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold text-sm">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-gray-400">{emptyMsg}</td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={row.id || i} className="border-t border-gov-gris-medio hover:bg-gov-verde-claro transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
