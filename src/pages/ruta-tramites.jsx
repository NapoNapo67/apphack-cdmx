import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { FB_GIROS, FB_PERSONAS, FB_TRAMITES, FB_PROGRAMAS } from '../lib/fallback-data'

const TIPO_COLOR = {
  CONSTITUCION: '#6366F1', FISCAL: '#F59E0B', USO_SUELO: '#10B981',
  PERMISO: '#3B82F6',      AVISO: '#8B5CF6',  SANITARIO: '#EF4444',
  SEGURIDAD: '#EC4899',    LABORAL: '#14B8A6', MARCA: '#C8A217',
}

function TramiteCard({ tramite, paso, detalle, expanded, onToggle }) {
  const color = TIPO_COLOR[tramite?.tipo_clave] || '#6B7280'
  return (
    <div
      className={`rounded-xl border-2 overflow-hidden transition-all cursor-pointer hover:shadow-md ${
        expanded ? 'shadow-md' : ''
      }`}
      style={{ borderColor: expanded ? color : '#E0E0E0' }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 p-4" style={{ background: expanded ? color + '12' : 'white' }}>
        {/* Número de paso */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
          style={{ background: color }}
        >
          {paso}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gov-texto text-sm leading-tight">{tramite?.nombre}</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-xs text-gray-500">🏢 {tramite?.dependencia_corto}</span>
            <span className="text-xs text-gray-500">💰 {tramite?.costo_descripcion}</span>
            <span className="text-xs text-gray-500">⏱ {tramite?.plazo_dias}d hábiles</span>
            {tramite?.es_digital && <span className="text-xs text-blue-600 font-medium">🌐 Digital</span>}
          </div>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ background: color + '08' }}>
          <div className="pt-1 border-t border-gov-gris-medio">
            <p className="text-sm text-gov-texto">{tramite?.descripcion}</p>
          </div>
          {detalle?.por_que && (
            <div className="p-2 bg-white rounded border-l-4" style={{ borderColor: color }}>
              <p className="text-xs font-bold text-gray-500 mb-1">¿Por qué en este paso?</p>
              <p className="text-sm">{detalle.por_que}</p>
            </div>
          )}
          {detalle?.tip && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded">
              <p className="text-xs font-bold text-amber-700 mb-1">💡 Consejo práctico</p>
              <p className="text-sm text-amber-800">{detalle.tip}</p>
            </div>
          )}
          {tramite?.documentos && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1">📎 Documentos requeridos</p>
              <ul className="space-y-0.5">
                {JSON.parse(tramite.documentos).map((d, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                    <span className="text-gov-verde">•</span> {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tramite?.url_tramite && (
            <a
              href={tramite.url_tramite} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gov-verde hover:underline"
              onClick={e => e.stopPropagation()}
            >
              🔗 Ir al trámite en línea →
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function RutaTramites() {
  const { data: _giros }    = useSupabase('cat_giro_negocio', { order: 'orden' })
  const { data: _personas } = useSupabase('cat_tipo_persona', { order: 'orden' })
  const { data: _tramites } = useSupabase('tramite')
  const { data: _programas }= useSupabase('programa_emprendimiento', { order: 'orden' })

  // Fallback si Supabase está vacío
  const giros    = _giros.length    ? _giros    : FB_GIROS
  const personas = _personas.length ? _personas : FB_PERSONAS
  const tramites = _tramites.length ? _tramites : FB_TRAMITES
  const programas= _programas.length? _programas: FB_PROGRAMAS

  const [giroId, setGiroId]       = useState('')
  const [personaClave, setPC]     = useState('')
  const [rutaIA, setRutaIA]       = useState(null)
  const [cargando, setCargando]   = useState(false)
  const [expandido, setExpandido] = useState(null)
  const [error, setError]         = useState(null)

  const giroSel = giros.find(g => g.id === giroId)
  const persSel = personas.find(p => p.clave === personaClave)

  // tramites ya vienen enriquecidos en fallback
  const tramitesEnriq = tramites

  async function generarRuta() {
    if (!giroId || !personaClave) { setError('Selecciona giro y tipo de persona'); return }
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/generar-ruta-tramites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giro:                giroSel,
          tipo_persona:        persSel,
          alcaldia:            { nombre: 'Ciudad de México' },
          tramites_disponibles: tramitesEnriq.map(t => ({
            clave: t.clave, nombre: t.nombre, costo_descripcion: t.costo_descripcion,
            plazo_dias: t.plazo_dias, aplica_pf: t.aplica_pf, aplica_pm: t.aplica_pm,
          })),
          programas_disponibles: programas.map(p => ({
            clave: p.clave, nombre: p.nombre, monto_descripcion: p.monto_descripcion,
          })),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRutaIA(data.resultado)
      setExpandido(0)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gov-verde flex items-center gap-2">
          📋 Ruta de Trámites Personalizada
        </h1>
        <p className="text-sm text-gray-500">La IA genera el paso a paso exacto para tu tipo de negocio — en orden, con costos y tiempos reales</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">⚠️ {error}</div>}

      {/* Selector */}
      <div className="card-gov">
        <h2 className="font-bold text-gov-verde mb-3">Configura tu ruta</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Tipo de giro *</label>
            <select className="input-gov" value={giroId} onChange={e => { setGiroId(e.target.value); setRutaIA(null) }}>
              <option value="">Seleccionar...</option>
              {giros.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Estructura legal *</label>
            <select className="input-gov" value={personaClave} onChange={e => { setPC(e.target.value); setRutaIA(null) }}>
              <option value="">Seleccionar...</option>
              {personas.map(p => <option key={p.id} value={p.clave}>{p.nombre}</option>)}
            </select>
          </div>
        </div>

        {giroSel && persSel && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="bg-gov-verde-claro text-gov-verde px-2 py-1 rounded-full font-medium">
              ⏱ ~{giroSel.meses_tramite} meses estimados
            </span>
            <span className={`px-2 py-1 rounded-full font-medium ${
              giroSel.nivel_inversion === 'BAJO' ? 'bg-green-100 text-green-700' :
              giroSel.nivel_inversion === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>
              💰 Inversión {giroSel.nivel_inversion}
            </span>
            {giroSel.riesgo_sanitario === 'ALTO' && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">⚕️ Riesgo sanitario ALTO</span>
            )}
          </div>
        )}

        <button onClick={generarRuta} disabled={cargando} className="btn-gov w-full mt-4">
          {cargando
            ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Generando ruta con IA...</span>
            : '🤖 Generar ruta personalizada con IA'}
        </button>
      </div>

      {/* Ruta generada por IA */}
      {rutaIA && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="card-gov border-l-4 border-l-gov-verde bg-gov-verde-claro">
            <div className="flex flex-wrap gap-4 mb-2">
              <div>
                <p className="text-xs text-gray-500">Pasos totales</p>
                <p className="text-2xl font-black text-gov-verde">{rutaIA.ruta?.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Costo estimado</p>
                <p className="text-2xl font-black text-gov-verde">
                  ${rutaIA.costo_total_estimado?.min?.toLocaleString()}–${rutaIA.costo_total_estimado?.max?.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-gov-texto">{rutaIA.resumen_cronograma}</p>
            {rutaIA.primer_paso_hoy && (
              <div className="mt-2 p-2 bg-white rounded border border-gov-verde">
                <p className="text-xs font-bold text-gov-verde">🚀 ¿Qué puedes hacer HOY?</p>
                <p className="text-sm mt-0.5">{rutaIA.primer_paso_hoy}</p>
              </div>
            )}
          </div>

          {/* Pasos */}
          <div className="space-y-3">
            {rutaIA.ruta?.map((paso, i) => {
              const tramite = tramitesEnriq.find(t => t.clave === paso.clave_tramite)
              return (
                <TramiteCard
                  key={i}
                  tramite={tramite}
                  paso={paso.paso}
                  detalle={paso}
                  expanded={expandido === i}
                  onToggle={() => setExpandido(expandido === i ? null : i)}
                />
              )
            })}
          </div>

          {/* Programas recomendados */}
          {rutaIA.programas_recomendados?.length > 0 && (
            <div className="card-gov">
              <h3 className="font-bold text-gov-verde mb-3">🎯 Programas de apoyo recomendados para ti</h3>
              <div className="space-y-3">
                {rutaIA.programas_recomendados.map((pr, i) => {
                  const prog = programas.find(p => p.clave === pr.clave_programa)
                  if (!prog) return null
                  return (
                    <div key={i} className="p-3 border border-gov-gris-medio rounded-lg hover:border-gov-verde transition">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-sm text-gov-verde">{prog.nombre}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{prog.monto_descripcion}</p>
                        </div>
                        {prog.destacado && (
                          <span className="text-xs bg-gov-verde text-white px-2 py-0.5 rounded-full flex-shrink-0">★ Destacado</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{pr.por_que}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Catálogo completo de trámites */}
      {!rutaIA && (
        <div className="card-gov">
          <h3 className="font-bold text-gov-verde mb-3">📚 Catálogo completo de trámites disponibles</h3>
          <div className="space-y-2">
            {tramitesEnriq.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 border border-gov-gris-medio rounded hover:bg-gov-verde-claro transition">
                <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: TIPO_COLOR[t.tipo_clave] || '#E0E0E0' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.nombre}</p>
                  <p className="text-xs text-gray-400">{t.dependencia_corto} · {t.costo_descripcion} · {t.plazo_dias}d</p>
                </div>
                {t.es_digital && <span className="text-xs text-blue-500">🌐</span>}
                {!t.es_obligatorio && <span className="text-xs text-gray-400">Opcional</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
