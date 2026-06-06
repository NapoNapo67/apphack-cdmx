import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, LayersControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useSupabase } from '../hooks/useSupabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import StatusBadge from '../components/ui/StatusBadge'

// Fix icono Leaflet en Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SECTOR_COLOR = {
  COM:   '#3B82F6', SER: '#8B5CF6', MAN: '#F59E0B',
  ALI:   '#EF4444', SAL: '#10B981', EDU: '#6366F1',
  TRA:   '#EC4899', COM_M: '#14B8A6',
}

function FitBounds({ points }) {
  const map = useMap()
  if (points.length > 0) {
    const bounds = L.latLngBounds(points.map(p => [p.latitud, p.longitud]))
    map.fitBounds(bounds, { padding: [30, 30] })
  }
  return null
}

export default function Mapa() {
  const { data: establecimientos, loading: eL } = useSupabase('establecimiento')
  const { data: mercados,          loading: mL } = useSupabase('mercado_publico')
  const { data: sectores }                       = useSupabase('cat_sector_economico')
  const { data: alcaldias }                      = useSupabase('dw.dim_alcaldia')

  const [capas, setCapas] = useState({ establecimientos: true, mercados: true, inconsistencias: false })
  const [filtroSector, setFiltroSector]     = useState('TODOS')
  const [filtroAlcaldia, setFiltroAlcaldia] = useState('TODAS')
  const [seleccionado, setSeleccionado]     = useState(null)

  const estFiltrados = useMemo(() => {
    return establecimientos.filter(e => {
      if (filtroSector !== 'TODOS' && e.sector_id !== filtroSector) return false
      if (filtroAlcaldia !== 'TODAS' && e.alcaldia_id !== filtroAlcaldia) return false
      if (capas.inconsistencias && !e.tiene_inconsistencia) return false
      return true
    })
  }, [establecimientos, filtroSector, filtroAlcaldia, capas.inconsistencias])

  const mercFiltrados = useMemo(() => {
    if (filtroAlcaldia === 'TODAS') return mercados
    return mercados.filter(m => m.alcaldia_id === filtroAlcaldia)
  }, [mercados, filtroAlcaldia])

  const loading = eL || mL

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gov-verde flex items-center gap-2">
            🗺️ Radar CDMX — Mapa Territorial
          </h1>
          <p className="text-xs text-gray-500">
            {estFiltrados.length} establecimientos · {mercFiltrados.length} mercados públicos
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card-gov">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Capas */}
          <div>
            <p className="text-xs font-bold text-gov-verde mb-1.5">Capas visibles</p>
            <div className="space-y-1">
              {[
                { key: 'establecimientos', label: 'Establecimientos', color: '#3B82F6' },
                { key: 'mercados',         label: 'Mercados Públicos', color: '#EF4444' },
                { key: 'inconsistencias',  label: 'Solo inconsistencias', color: '#F59E0B' },
              ].map(c => (
                <label key={c.key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={capas[c.key]}
                    onChange={e => setCapas(p => ({ ...p, [c.key]: e.target.checked }))}
                    className="accent-gov-verde"
                  />
                  <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: c.color }} />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          {/* Sector */}
          <div>
            <label className="text-xs font-bold text-gov-verde block mb-1.5">Sector económico</label>
            <select className="input-gov text-xs" value={filtroSector} onChange={e => setFiltroSector(e.target.value)}>
              <option value="TODOS">Todos los sectores</option>
              {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          {/* Alcaldía */}
          <div>
            <label className="text-xs font-bold text-gov-verde block mb-1.5">Alcaldía</label>
            <select className="input-gov text-xs" value={filtroAlcaldia} onChange={e => setFiltroAlcaldia(e.target.value)}>
              <option value="TODAS">Todas las alcaldías</option>
              {alcaldias.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          {/* Leyenda sectores */}
          <div>
            <p className="text-xs font-bold text-gov-verde mb-1.5">Leyenda de sectores</p>
            <div className="grid grid-cols-2 gap-0.5">
              {sectores.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center gap-1 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color_hex }} />
                  <span className="truncate">{s.nombre.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      {loading ? <LoadingSpinner size="lg" /> : (
        <div className="rounded-xl overflow-hidden border border-gov-gris-medio shadow" style={{ height: 520 }}>
          <MapContainer
            center={[19.42, -99.13]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Establecimientos */}
            {capas.establecimientos && estFiltrados.map(e => (
              <CircleMarker
                key={e.id}
                center={[e.latitud, e.longitud]}
                radius={e.tiene_inconsistencia ? 9 : 7}
                pathOptions={{
                  color: e.tiene_inconsistencia ? '#F59E0B' : (sectores.find(s => s.id === e.sector_id)?.color_hex || '#3B82F6'),
                  fillColor: e.tiene_inconsistencia ? '#FEF3C7' : (sectores.find(s => s.id === e.sector_id)?.color_hex || '#3B82F6'),
                  fillOpacity: 0.85,
                  weight: e.tiene_inconsistencia ? 2.5 : 1,
                }}
                eventHandlers={{ click: () => setSeleccionado({ tipo: 'est', ...e }) }}
              >
                <Popup>
                  <div className="text-xs font-sans min-w-[180px]">
                    <p className="font-bold text-gov-verde text-sm">{e.nombre}</p>
                    <p className="text-gray-500">{e.direccion}</p>
                    <p className="mt-1">{e.colonia}</p>
                    {e.tiene_inconsistencia && (
                      <p className="mt-1 text-orange-600 font-semibold">⚠️ Inconsistencia detectada</p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Mercados Públicos */}
            {capas.mercados && mercFiltrados.map(m => (
              <CircleMarker
                key={m.id}
                center={[m.latitud, m.longitud]}
                radius={10}
                pathOptions={{
                  color: '#7C3AED',
                  fillColor: m.tiene_inconsistencia ? '#FEF3C7' : '#8B5CF6',
                  fillOpacity: 0.9,
                  weight: 2,
                }}
                eventHandlers={{ click: () => setSeleccionado({ tipo: 'mrc', ...m }) }}
              >
                <Popup>
                  <div className="text-xs font-sans">
                    <p className="font-bold text-purple-700 text-sm">🏪 {m.nombre}</p>
                    <p className="text-gray-500">{m.direccion}</p>
                    <p className="mt-1"><strong>{m.num_locales_activos}</strong>/{m.num_locales} locales activos</p>
                    {m.tiene_inconsistencia && (
                      <p className="mt-1 text-orange-600 font-semibold">⚠️ Inconsistencia</p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Panel lateral de detalle */}
      {seleccionado && (
        <div className="card-gov border-l-4 border-l-gov-verde">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gov-verde">
              {seleccionado.tipo === 'mrc' ? '🏪' : '🏢'} {seleccionado.nombre}
            </h3>
            <button onClick={() => setSeleccionado(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><p className="text-xs text-gray-400">Dirección</p><p className="font-medium">{seleccionado.direccion}</p></div>
            <div><p className="text-xs text-gray-400">Colonia</p><p className="font-medium">{seleccionado.colonia}</p></div>
            <div><p className="text-xs text-gray-400">Coordenadas</p><p className="font-medium">{seleccionado.latitud?.toFixed(4)}, {seleccionado.longitud?.toFixed(4)}</p></div>
            <div><p className="text-xs text-gray-400">Estado</p><StatusBadge status={seleccionado.estado_tramite} label={seleccionado.estado_tramite} /></div>
          </div>
          {seleccionado.tiene_inconsistencia && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
              ⚠️ Este registro tiene inconsistencias detectadas. Revísalo en el módulo de Inconsistencias.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
