import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ESTACIONES_METRO, CENTROS_ALCALDIA } from '../../data/metro-cdmx'
import { INSEGURIDAD_ALCALDIA, DENSIDAD_COMPETENCIA } from '../../data/inseguridad-cdmx'

// Fix Leaflet icons en Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Generar competidores sintéticos realistas alrededor de un punto
function generarCompetidores(lat, lng, alcaldia, giro, cantidad) {
  const puntos = []
  const seed = alcaldia.length + giro.length // pseudo-random seed
  for (let i = 0; i < cantidad; i++) {
    const angulo = (i * 137.5 + seed * 23) % 360 // distribución áurea
    const radio  = 0.003 + (((i * 17 + seed) % 100) / 100) * 0.012 // 300m a 1.5km
    const radAng = angulo * Math.PI / 180
    puntos.push({
      lat: lat + Math.cos(radAng) * radio,
      lng: lng + Math.sin(radAng) * radio,
      nombre: `${giro.charAt(0) + giro.slice(1).toLowerCase()} #${i + 1}`,
    })
  }
  return puntos
}

// Genera puntos de afluencia (metro + mercados simulados)
function generarPuntosAfluencia(lat, lng, radio = 0.015) {
  return ESTACIONES_METRO.filter(e => {
    const dLat = e.lat - lat
    const dLng = e.lng - lng
    return Math.sqrt(dLat * dLat + dLng * dLng) < radio
  })
}

function RecenterMap({ lat, lng }) {
  const map = useMap()
  map.setView([lat, lng], 14)
  return null
}

const LINEA_COLOR = {
  '1':'#f0a',  '2':'#3498db', '3':'#2ecc71', '4':'#a8d8ea',
  '5':'#f39c12','6':'#d35400','7':'#e74c3c', '8':'#1abc9c',
  '9':'#8e44ad','A':'#2c3e50','B':'#bdc3c7', '12':'#f1c40f',
}

export default function MapaViabilidad({ alcaldia, giroNombre, giroClave, analisis }) {
  const [capas, setCapas] = useState({
    competencia:  true,
    metro:        true,
    inseguridad:  true,
    radio500:     true,
    radio1km:     true,
    afluencia:    false,
  })

  const centro = CENTROS_ALCALDIA[alcaldia] || { lat: 19.4326, lng: -99.1332 }
  const inseg  = INSEGURIDAD_ALCALDIA[alcaldia]
  const densidad = DENSIDAD_COMPETENCIA[alcaldia]

  // Número de competidores basado en densidad + nivel competencia del análisis
  const numComp = useMemo(() => {
    const base = densidad?.factor || 1.5
    const factor = analisis?.competencia?.nivel === 'ALTA' ? 4
                 : analisis?.competencia?.nivel === 'MEDIA' ? 2.5 : 1.5
    return Math.round(base * factor)
  }, [densidad, analisis])

  const competidores = useMemo(
    () => generarCompetidores(centro.lat, centro.lng, alcaldia, giroNombre, numComp),
    [centro, alcaldia, giroNombre, numComp]
  )

  const estacionesCercanas = useMemo(
    () => generarPuntosAfluencia(centro.lat, centro.lng, 0.018),
    [centro]
  )

  const toggleCapa = key => setCapas(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-3">
      {/* Controles de capas */}
      <div className="flex flex-wrap gap-2">
        {[
          { key:'competencia', label:`Competencia (${numComp})`,   color:'#EF4444' },
          { key:'metro',       label:`Metro (${estacionesCercanas.length})`, color:'#3B82F6' },
          { key:'inseguridad', label:'Inseguridad', color: inseg?.color || '#10B981' },
          { key:'radio500',    label:'Radio 500m',  color:'#7B1F3A' },
          { key:'radio1km',    label:'Radio 1km',   color:'#B8975A' },
        ].map(c => (
          <button
            key={c.key}
            onClick={() => toggleCapa(c.key)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border-2 font-medium transition-all ${
              capas[c.key] ? 'text-white' : 'bg-white text-gray-500 border-gray-200'
            }`}
            style={capas[c.key] ? { background: c.color, borderColor: c.color } : {}}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Mapa */}
      <div className="rounded-xl overflow-hidden border-2 shadow-md" style={{ height: 380, borderColor: 'var(--gov-guinda)' }}>
        <MapContainer
          center={[centro.lat, centro.lng]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap lat={centro.lat} lng={centro.lng} />

          {/* Círculo de inseguridad (fondo de zona) */}
          {capas.inseguridad && inseg && (
            <Circle
              center={[centro.lat, centro.lng]}
              radius={1800}
              pathOptions={{
                color: inseg.color,
                fillColor: inseg.color,
                fillOpacity: 0.08,
                weight: 0,
              }}
            />
          )}

          {/* Radio 1km */}
          {capas.radio1km && (
            <Circle
              center={[centro.lat, centro.lng]}
              radius={1000}
              pathOptions={{ color:'#B8975A', fillColor:'#B8975A', fillOpacity:0.04, weight:2, dashArray:'8 4' }}
            >
              <Popup>Radio de 1 km</Popup>
            </Circle>
          )}

          {/* Radio 500m */}
          {capas.radio500 && (
            <Circle
              center={[centro.lat, centro.lng]}
              radius={500}
              pathOptions={{ color:'#7B1F3A', fillColor:'#7B1F3A', fillOpacity:0.06, weight:2.5 }}
            >
              <Popup>Radio de 500 m</Popup>
            </Circle>
          )}

          {/* Tu negocio (pin central) */}
          <CircleMarker
            center={[centro.lat, centro.lng]}
            radius={14}
            pathOptions={{ color:'#7B1F3A', fillColor:'#7B1F3A', fillOpacity:1, weight:3 }}
          >
            <Popup>
              <div className="text-xs font-sans">
                <p className="font-bold text-lg mb-0.5">📍 Tu negocio</p>
                <p className="text-gray-600">{giroNombre}</p>
                <p className="text-gray-500">{alcaldia}</p>
              </div>
            </Popup>
          </CircleMarker>

          {/* Competidores */}
          {capas.competencia && competidores.map((c, i) => (
            <CircleMarker
              key={i}
              center={[c.lat, c.lng]}
              radius={7}
              pathOptions={{ color:'#EF4444', fillColor:'#EF4444', fillOpacity:0.75, weight:1.5 }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-red-600">🏪 Competidor</p>
                  <p className="text-gray-600">{giroNombre} en la zona</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Estaciones de Metro */}
          {capas.metro && estacionesCercanas.map((e, i) => (
            <CircleMarker
              key={i}
              center={[e.lat, e.lng]}
              radius={9}
              pathOptions={{
                color: LINEA_COLOR[e.linea] || '#3B82F6',
                fillColor: LINEA_COLOR[e.linea] || '#3B82F6',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-blue-700">🚇 {e.nombre}</p>
                  <p className="text-gray-500">Línea {e.linea}</p>
                  <p className="text-gray-600 font-medium">
                    ~{(e.afluencia/1000).toFixed(0)}k pasajeros/día
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Panel de métricas del mapa */}
      <div className="grid grid-cols-3 gap-3">

        {/* Competencia */}
        <div className="p-3 rounded-lg border-2 text-center" style={{ borderColor:'#EF4444', background:'#FEF2F2' }}>
          <p className="text-2xl font-black text-red-600">{numComp}</p>
          <p className="text-xs font-semibold text-red-700">Competidores en 1km</p>
          <p className="text-xs text-red-500 mt-0.5">
            {densidad?.densidad === 'MUY_ALTA' ? 'Zona muy saturada'
            : densidad?.densidad === 'ALTA'    ? 'Zona saturada'
            : densidad?.densidad === 'MEDIA'   ? 'Competencia moderada'
            : 'Baja competencia'}
          </p>
        </div>

        {/* Metro */}
        <div className="p-3 rounded-lg border-2 text-center" style={{ borderColor:'#3B82F6', background:'#EFF6FF' }}>
          <p className="text-2xl font-black text-blue-600">{estacionesCercanas.length}</p>
          <p className="text-xs font-semibold text-blue-700">Estaciones de metro</p>
          {estacionesCercanas.length > 0 && (
            <p className="text-xs text-blue-500 mt-0.5">
              ~{(estacionesCercanas.reduce((s, e) => s + e.afluencia, 0) / 1000).toFixed(0)}k pas/día
            </p>
          )}
        </div>

        {/* Inseguridad */}
        <div className="p-3 rounded-lg border-2 text-center" style={{
          borderColor: inseg?.color || '#22C55E',
          background: (inseg?.color || '#22C55E') + '18',
        }}>
          <p className="text-2xl font-black" style={{ color: inseg?.color }}>
            {inseg?.nivel || 'N/D'}
          </p>
          <p className="text-xs font-semibold" style={{ color: inseg?.color }}>Índice inseguridad</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {inseg?.delitos_100k?.toLocaleString()} del/100k hab
          </p>
        </div>
      </div>

      {/* Delitos principales si inseguridad es alta */}
      {inseg?.nivel === 'ALTO' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-bold text-red-700 mb-1">⚠️ Delitos frecuentes en {alcaldia}</p>
          <div className="flex flex-wrap gap-1">
            {inseg.principales.map(d => (
              <span key={d} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{d}</span>
            ))}
          </div>
          <p className="text-xs text-red-600 mt-1">Considera medidas de seguridad en tu plan de negocio</p>
        </div>
      )}
    </div>
  )
}
