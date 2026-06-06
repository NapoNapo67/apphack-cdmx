import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../hooks/useSupabase'
import DataTable from '../components/ui/DataTable'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const CAMPO_MAP = {
  latitud:   ['latitud', 'lat', 'latitude', 'y'],
  longitud:  ['longitud', 'lng', 'lon', 'longitude', 'x'],
  nombre:    ['nombre', 'name', 'nom_estab', 'establecimiento', 'razon_social'],
  direccion: ['direccion', 'domicilio', 'address', 'domicilio_completo'],
  colonia:   ['colonia', 'col', 'neighborhood'],
  alcaldia:  ['alcaldia', 'municipio', 'nom_mun', 'delegacion'],
}

function detectarCampo(headers, tipo) {
  const opciones = CAMPO_MAP[tipo] || []
  return headers.find(h => opciones.includes(h.toLowerCase().trim())) || null
}

export default function Carga() {
  const { data: fuentes } = useSupabase('cat_fuente_dato')
  const [paso, setPaso]   = useState(1)
  const [archivo, setArchivo]       = useState(null)
  const [rows, setRows]             = useState([])
  const [headers, setHeaders]       = useState([])
  const [mapeo, setMapeo]           = useState({})
  const [fuenteId, setFuenteId]     = useState('')
  const [nombreCapa, setNombreCapa] = useState('')
  const [guardando, setGuardando]   = useState(false)
  const [resultado, setResultado]   = useState(null)
  const [error, setError]           = useState(null)
  const fileRef = useRef()

  function onFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setArchivo(file)
    setNombreCapa(file.name.replace(/\.[^.]+$/, ''))
    setError(null)

    if (file.name.endsWith('.csv') || file.type === 'text/csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data, meta }) => {
          setHeaders(meta.fields || [])
          setRows(data.slice(0, 500)) // máx 500 para preview
          // Auto-detectar mapeo
          const auto = {}
          Object.keys(CAMPO_MAP).forEach(tipo => {
            const campo = detectarCampo(meta.fields || [], tipo)
            if (campo) auto[tipo] = campo
          })
          setMapeo(auto)
          setPaso(2)
        },
        error: err => setError('Error al leer el CSV: ' + err.message),
      })
    } else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
      const reader = new FileReader()
      reader.onload = ev => {
        try {
          const geo = JSON.parse(ev.target.result)
          const features = geo.features || []
          const sample = features.slice(0, 500).map(f => ({
            ...f.properties,
            latitud:  f.geometry?.coordinates?.[1],
            longitud: f.geometry?.coordinates?.[0],
          }))
          const hdrs = sample.length > 0 ? Object.keys(sample[0]) : []
          setHeaders(hdrs)
          setRows(sample)
          const auto = {}
          Object.keys(CAMPO_MAP).forEach(tipo => {
            const campo = detectarCampo(hdrs, tipo)
            if (campo) auto[tipo] = campo
          })
          setMapeo(auto)
          setPaso(2)
        } catch {
          setError('Archivo GeoJSON inválido')
        }
      }
      reader.readAsText(file)
    } else {
      setError('Formato no soportado. Usa CSV o GeoJSON.')
    }
  }

  async function guardar() {
    if (!mapeo.latitud || !mapeo.longitud) {
      setError('Debes mapear al menos Latitud y Longitud')
      return
    }
    setGuardando(true)
    setError(null)

    // 1. Crear capa geográfica
    const { data: capaData, error: capaErr } = await supabase
      .from('capa_geografica')
      .insert({
        nombre:        nombreCapa,
        descripcion:   `Cargado desde archivo ${archivo?.name}`,
        fuente_id:     fuenteId || null,
        tipo_archivo:  archivo?.name.split('.').pop().toUpperCase(),
        num_registros: rows.length,
        fecha_datos:   new Date().toISOString().split('T')[0],
        estado_tramite:'RESUELTO',
      })
      .select()
      .single()

    if (capaErr) { setError(capaErr.message); setGuardando(false); return }

    // 2. Insertar registros en lotes de 100
    const registros = rows
      .filter(r => r[mapeo.latitud] && r[mapeo.longitud])
      .map(r => ({
        capa_id:  capaData.id,
        latitud:  parseFloat(r[mapeo.latitud]),
        longitud: parseFloat(r[mapeo.longitud]),
        atributos: r,
      }))

    let insertados = 0
    for (let i = 0; i < registros.length; i += 100) {
      const { error: regErr } = await supabase
        .from('registro_capa')
        .insert(registros.slice(i, i + 100))
      if (!regErr) insertados += Math.min(100, registros.length - i)
    }

    setGuardando(false)
    setResultado({ total: rows.length, insertados, capaId: capaData.id })
    setPaso(3)
  }

  const colPreview = headers.slice(0, 6).map(h => ({
    key: h, label: h,
    render: v => <span className="text-xs truncate max-w-[120px] block">{String(v ?? '')}</span>,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-verde flex items-center gap-2">
          📤 Carga de Datos Geográficos
        </h1>
        <p className="text-sm text-gray-500">Sube archivos CSV o GeoJSON para integrarlos al análisis territorial</p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 text-sm">
        {['Seleccionar archivo', 'Mapear campos', 'Confirmación'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${paso >= i + 1 ? 'bg-gov-verde text-white' : 'bg-gray-200 text-gray-500'}`}>
              {paso > i + 1 ? '✓' : i + 1}
            </div>
            <span className={paso === i + 1 ? 'font-bold text-gov-verde' : 'text-gray-400'}>{label}</span>
            {i < 2 && <span className="text-gray-300 mx-1">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* PASO 1: Seleccionar */}
      {paso === 1 && (
        <div className="card-gov">
          <h2 className="font-bold text-gov-verde mb-4">Selecciona el archivo</h2>
          <div
            className="border-2 border-dashed border-gov-gris-medio rounded-xl p-10 text-center cursor-pointer hover:border-gov-verde hover:bg-gov-verde-claro transition"
            onClick={() => fileRef.current?.click()}
          >
            <p className="text-4xl mb-3">📁</p>
            <p className="font-semibold text-gov-gris-oscuro">Arrastra tu archivo aquí o haz clic</p>
            <p className="text-sm text-gray-400 mt-1">CSV o GeoJSON · máximo 500 registros en preview</p>
            <p className="text-xs text-gray-400 mt-2">Compatible con DENUE, Mercados Públicos, Uso de Suelo</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.geojson,.json" className="hidden" onChange={onFile} />

          {/* Fuentes sugeridas */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'DENUE — INEGI', url: 'https://www.inegi.org.mx/app/descarga/ficha.html?tit=3615697&ag=9&f=csv', icon: '📊' },
              { label: 'Mercados CDMX', url: 'https://drive.google.com', icon: '🏪' },
              { label: 'Uso de Suelo SEDUVI', url: 'http://ciudadmx.cdmx.gob.mx:8080/seduvi/', icon: '🗺️' },
            ].map(f => (
              <div key={f.label} className="text-xs p-2 border rounded-lg text-center text-gray-500">
                <p className="text-lg">{f.icon}</p>
                <p className="font-medium">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2: Mapear campos */}
      {paso === 2 && (
        <div className="space-y-4">
          <div className="card-gov">
            <h2 className="font-bold text-gov-verde mb-4">
              Archivo: <span className="text-gov-gris-oscuro font-normal">{archivo?.name}</span>
              <span className="ml-2 text-xs text-gray-400">({rows.length} filas)</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Nombre de la capa *</label>
                <input className="input-gov" value={nombreCapa} onChange={e => setNombreCapa(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Fuente de datos</label>
                <select className="input-gov" value={fuenteId} onChange={e => setFuenteId(e.target.value)}>
                  <option value="">Seleccionar fuente...</option>
                  {fuentes.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(CAMPO_MAP).map(tipo => (
                <div key={tipo}>
                  <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    {(tipo === 'latitud' || tipo === 'longitud') && ' *'}
                  </label>
                  <select
                    className={`input-gov text-xs ${(tipo === 'latitud' || tipo === 'longitud') && !mapeo[tipo] ? 'border-red-400' : ''}`}
                    value={mapeo[tipo] || ''}
                    onChange={e => setMapeo(p => ({ ...p, [tipo]: e.target.value }))}
                  >
                    <option value="">— Sin mapear —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="card-gov">
            <h3 className="font-bold text-gov-verde mb-3">Preview — primeras 10 filas</h3>
            <DataTable columns={colPreview} rows={rows.slice(0, 10)} />
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setPaso(1); setArchivo(null); setRows([]) }} className="btn-gov-outline">
              ← Cambiar archivo
            </button>
            <button onClick={guardar} disabled={guardando} className="btn-gov flex-1">
              {guardando ? <><LoadingSpinner size="sm" /> Guardando {rows.length} registros...</> : `💾 Guardar en Supabase (${rows.length} registros)`}
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Resultado */}
      {paso === 3 && resultado && (
        <div className="card-gov text-center py-12">
          <p className="text-5xl mb-4">✅</p>
          <h2 className="text-xl font-bold text-gov-verde mb-2">¡Carga completada!</h2>
          <p className="text-gray-600">
            <strong>{resultado.insertados}</strong> de {resultado.total} registros guardados en Supabase
          </p>
          <p className="text-xs text-gray-400 mt-1">Los puntos ya son visibles en el Mapa Territorial</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => { setPaso(1); setArchivo(null); setRows([]); setResultado(null) }} className="btn-gov-outline">
              Cargar otro archivo
            </button>
            <button onClick={() => window.location.hash = '#mapa'} className="btn-gov">
              🗺️ Ver en el mapa
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
