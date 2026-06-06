import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../hooks/useSupabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const SCORE_CONFIG = {
  ALTO:    { label: 'Alta Viabilidad',    color: '#10B981', bg: '#ECFDF5', emoji: '✅', barra: 'bg-green-500' },
  MEDIO:   { label: 'Viabilidad Media',   color: '#F59E0B', bg: '#FFFBEB', emoji: '⚠️', barra: 'bg-yellow-500' },
  BAJO:    { label: 'Viabilidad Baja',    color: '#EF4444', bg: '#FEF2F2', emoji: '❌', barra: 'bg-red-500' },
  MUY_BAJO:{ label: 'No Recomendable',   color: '#6B7280', bg: '#F9FAFB', emoji: '🚫', barra: 'bg-gray-400' },
}

function ScoreGauge({ score, nivel }) {
  const cfg = SCORE_CONFIG[nivel] || SCORE_CONFIG.MEDIO
  return (
    <div className="text-center">
      <div
        className="w-32 h-32 rounded-full mx-auto flex flex-col items-center justify-center border-8 mb-2"
        style={{ borderColor: cfg.color, background: cfg.bg }}
      >
        <span className="text-4xl font-black" style={{ color: cfg.color }}>{score}</span>
        <span className="text-xs font-semibold" style={{ color: cfg.color }}>/100</span>
      </div>
      <p className="font-bold text-sm" style={{ color: cfg.color }}>
        {cfg.emoji} {cfg.label}
      </p>
    </div>
  )
}

function BarMetrica({ label, nivel, descripcion }) {
  const w = { ALTA: 85, MEDIA: 55, BAJA: 25 }[nivel] || 50
  const c = { ALTA: 'bg-green-500', MEDIA: 'bg-yellow-500', BAJA: 'bg-red-400' }[nivel] || 'bg-gray-400'
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-gov-gris-oscuro">{label}</span>
        <span className="text-gray-500">{nivel}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${c} rounded-full transition-all duration-700`} style={{ width: `${w}%` }} />
      </div>
      {descripcion && <p className="text-xs text-gray-400 mt-0.5">{descripcion}</p>}
    </div>
  )
}

export default function Viabilidad() {
  const { data: giros }       = useSupabase('cat_giro_negocio', { order: 'orden' })
  const { data: categorias }  = useSupabase('cat_categoria_giro', { order: 'orden' })
  const { data: personas }    = useSupabase('cat_tipo_persona', { order: 'orden' })
  const { data: alcaldias }   = useSupabase('dw.dim_alcaldia', { order: 'nombre' })
  const { data: historial, refetch: refetchHistorial } = useSupabase('consulta_viabilidad', {
    order: 'created_at', ascending: false, limit: 5,
  })

  const [paso, setPaso]     = useState(1)
  const [form, setForm]     = useState({
    giro_id: '', giro_libre: '', tipo_persona: '', alcaldia_id: '', colonia: '', categoria: '',
  })
  const [analisis, setAnalisis] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState(null)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const girosFiltrados = form.categoria
    ? giros.filter(g => g.categoria_id === form.categoria)
    : giros

  const giroSeleccionado = giros.find(g => g.id === form.giro_id)
  const personaSeleccionada = personas.find(p => p.clave === form.tipo_persona)
  const alcaldiaSeleccionada = alcaldias.find(a => a.id === form.alcaldia_id)

  async function analizar() {
    if (!form.giro_id || !form.tipo_persona || !form.alcaldia_id) {
      setError('Completa giro, tipo de persona y alcaldía')
      return
    }
    setCargando(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/analizar-viabilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giro: { ...giroSeleccionado, descripcion_libre: form.giro_libre },
          tipo_persona: personaSeleccionada,
          alcaldia: { ...alcaldiaSeleccionada, colonia: form.colonia },
          contexto_giro: {
            riesgo_sanitario: giroSeleccionado?.riesgo_sanitario,
            nivel_inversion:  giroSeleccionado?.nivel_inversion,
            meses_tramite:    giroSeleccionado?.meses_tramite,
            uso_suelo_ok:     giroSeleccionado?.uso_suelo_ok,
          },
          contexto_zona: {
            alcaldia:   alcaldiaSeleccionada?.nombre,
            poblacion:  alcaldiaSeleccionada?.poblacion_aprox,
            superficie: alcaldiaSeleccionada?.superficie_km2,
          },
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalisis(data.analisis)

      // Guardar en historial
      await supabase.from('consulta_viabilidad').insert({
        giro_id:          form.giro_id,
        giro_descripcion: form.giro_libre,
        tipo_persona_clave: form.tipo_persona,
        alcaldia_id:      form.alcaldia_id,
        colonia:          form.colonia,
        score_viabilidad: data.analisis.score,
        nivel_viabilidad: data.analisis.nivel,
        resumen_ia:       data.analisis.resumen,
      })
      refetchHistorial()
      setPaso(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-gov-verde mb-1">🚀 Evaluador de Viabilidad</h1>
        <p className="text-gray-500">Descubre si tu negocio puede prosperar en la CDMX — análisis con IA en segundos</p>
      </div>

      {/* Pasos */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {['Tu negocio', 'Ubicación', 'Resultados'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${paso >= i + 1 ? 'bg-gov-verde text-white' : 'bg-gray-200 text-gray-500'}`}>
              {paso > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`hidden sm:block ${paso === i + 1 ? 'font-bold text-gov-verde' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <span className="text-gray-300">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {error}</div>
      )}

      {/* ── PASO 1: El negocio ─────────────────────────── */}
      {paso === 1 && (
        <div className="space-y-4">
          {/* Describe tu idea */}
          <div className="card-gov">
            <h2 className="font-bold text-gov-verde mb-1">¿Qué quieres abrir?</h2>
            <p className="text-xs text-gray-400 mb-3">Cuéntanos brevemente tu idea — la IA la analizará en contexto</p>
            <textarea
              className="input-gov resize-none h-20"
              value={form.giro_libre}
              onChange={e => set('giro_libre', e.target.value)}
              placeholder='Ej: "Quiero abrir una taquería de suadero y canasta cerca del metro, con servicio para llevar..."'
            />
          </div>

          {/* Seleccionar categoría y giro */}
          <div className="card-gov">
            <h2 className="font-bold text-gov-verde mb-3">Selecciona el tipo de giro</h2>

            {/* Categorías */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
              {categorias.map(c => (
                <button
                  key={c.id}
                  onClick={() => { set('categoria', form.categoria === c.id ? '' : c.id); set('giro_id', '') }}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 text-xs transition-all ${
                    form.categoria === c.id
                      ? 'border-gov-verde bg-gov-verde-claro'
                      : 'border-gov-gris-medio hover:border-gov-verde'
                  }`}
                >
                  <span className="text-xl mb-0.5">{c.icono}</span>
                  <span className="text-center leading-tight font-medium">{c.nombre.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Giros */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {girosFiltrados.map(g => (
                <button
                  key={g.id}
                  onClick={() => set('giro_id', g.id)}
                  className={`text-left p-3 rounded-lg border-2 text-sm transition-all ${
                    form.giro_id === g.id
                      ? 'border-gov-verde bg-gov-verde-claro font-semibold'
                      : 'border-gov-gris-medio hover:border-gov-verde'
                  }`}
                >
                  <p className="font-medium leading-tight">{g.nombre}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <span className={`text-xs px-1 rounded ${
                      g.nivel_inversion === 'BAJO' ? 'bg-green-100 text-green-700' :
                      g.nivel_inversion === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>💰 {g.nivel_inversion}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded">⏱ {g.meses_tramite}m</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de persona */}
          <div className="card-gov">
            <h2 className="font-bold text-gov-verde mb-3">¿Cómo quieres operar legalmente?</h2>
            <div className="space-y-2">
              {personas.map(p => (
                <label
                  key={p.id}
                  onClick={() => set('tipo_persona', p.clave)}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    form.tipo_persona === p.clave
                      ? 'border-gov-verde bg-gov-verde-claro'
                      : 'border-gov-gris-medio hover:border-gov-verde'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    form.tipo_persona === p.clave ? 'border-gov-verde bg-gov-verde' : 'border-gray-300'
                  }`}>
                    {form.tipo_persona === p.clave && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gov-texto">{p.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.descripcion}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-green-600">✓ {p.ventajas?.split(',')[0]}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => { if (!form.giro_id || !form.tipo_persona) { setError('Selecciona el giro y tipo de persona') } else { setPaso(2); setError(null) } }}
            className="btn-gov w-full py-3 text-base"
          >
            Siguiente: elegir ubicación →
          </button>
        </div>
      )}

      {/* ── PASO 2: Ubicación ──────────────────────────── */}
      {paso === 2 && (
        <div className="space-y-4">
          <div className="card-gov">
            <div className="flex items-center gap-3 mb-4 p-3 bg-gov-verde-claro rounded-lg">
              <span className="text-2xl">{categorias.find(c => c.id === giroSeleccionado?.categoria_id)?.icono}</span>
              <div>
                <p className="font-bold text-gov-verde">{giroSeleccionado?.nombre}</p>
                <p className="text-xs text-gray-500">{personaSeleccionada?.nombre}</p>
              </div>
            </div>

            <h2 className="font-bold text-gov-verde mb-3">¿Dónde quieres abrirlo?</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Alcaldía *</label>
                <select className="input-gov" value={form.alcaldia_id} onChange={e => set('alcaldia_id', e.target.value)}>
                  <option value="">Seleccionar alcaldía...</option>
                  {alcaldias.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({(a.poblacion_aprox/1000).toFixed(0)}k hab.)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gov-gris-oscuro block mb-1">Colonia / Barrio (opcional)</label>
                <input
                  className="input-gov"
                  value={form.colonia}
                  onChange={e => set('colonia', e.target.value)}
                  placeholder="Ej: Roma Norte, Coyoacán Centro..."
                />
              </div>
            </div>

            {/* Usos de suelo compatibles */}
            {giroSeleccionado && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-bold text-blue-700 mb-1">🗺️ Usos de suelo compatibles con {giroSeleccionado.nombre}:</p>
                <div className="flex flex-wrap gap-1">
                  {(giroSeleccionado.uso_suelo_ok || []).map(u => (
                    <span key={u} className="text-xs bg-white border border-blue-300 text-blue-700 px-2 py-0.5 rounded-full font-medium">{u}</span>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Verifica el uso de suelo exacto de tu local en{' '}
                  <a href="http://ciudadmx.cdmx.gob.mx:8080/seduvi/" target="_blank" rel="noreferrer" className="underline">ciudadmx.cdmx.gob.mx</a>
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPaso(1)} className="btn-gov-outline px-6">← Atrás</button>
            <button
              onClick={analizar}
              disabled={cargando || !form.alcaldia_id}
              className="btn-gov flex-1 py-3 text-base flex items-center justify-center gap-2"
            >
              {cargando
                ? <><LoadingSpinner size="sm" /> Analizando con IA...</>
                : '🤖 Analizar viabilidad con IA'}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: Resultados ─────────────────────────── */}
      {paso === 3 && analisis && (
        <div className="space-y-4">
          {/* Header de resultado */}
          <div className="card-gov" style={{ borderTop: `4px solid ${SCORE_CONFIG[analisis.nivel]?.color}` }}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ScoreGauge score={analisis.score} nivel={analisis.nivel} />
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs text-gray-400 mb-1">
                  {giroSeleccionado?.nombre} · {alcaldiaSeleccionada?.nombre} · {personaSeleccionada?.nombre}
                </p>
                <p className="text-base font-medium text-gov-texto">{analisis.resumen}</p>
                {analisis.uso_suelo_compatible === false && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    ⚠️ {analisis.uso_suelo_explicacion}
                  </div>
                )}
                {analisis.uso_suelo_compatible === true && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    ✅ {analisis.uso_suelo_explicacion}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-gov">
              <h3 className="font-bold text-gov-verde mb-3">📊 Indicadores de Mercado</h3>
              <BarMetrica label="Demanda estimada"       nivel={analisis.demanda?.nivel}     descripcion={analisis.demanda?.descripcion} />
              <BarMetrica label="Nivel de competencia"   nivel={analisis.competencia?.nivel} descripcion={`~${analisis.competencia?.estimado_competidores || '?'} competidores · ${analisis.competencia?.descripcion}`} />
            </div>
            <div className="card-gov">
              <h3 className="font-bold text-gov-verde mb-3">💰 Estimaciones</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gov-verde-claro rounded-lg">
                  <p className="text-xs text-gray-500">Inversión estimada</p>
                  <p className="text-xl font-black text-gov-verde">
                    ${analisis.inversion_estimada?.min?.toLocaleString()} –
                    ${analisis.inversion_estimada?.max?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">{analisis.inversion_estimada?.descripcion}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Tiempo para apertura</p>
                  <p className="text-xl font-black text-gov-gris-oscuro">{analisis.tiempo_apertura_meses} meses</p>
                  <p className="text-xs text-gray-400">Incluyendo todos los trámites</p>
                </div>
              </div>
            </div>
          </div>

          {/* Oportunidades y Riesgos */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-gov">
              <h3 className="font-bold text-green-600 mb-3">✅ Oportunidades</h3>
              <ul className="space-y-2">
                {analisis.oportunidades?.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">▸</span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-gov">
              <h3 className="font-bold text-red-500 mb-3">⚠️ Riesgos a considerar</h3>
              <ul className="space-y-2">
                {analisis.riesgos?.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">▸</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tip clave + Recomendación zona */}
          {(analisis.tip_clave || analisis.recomendacion_zona) && (
            <div className="card-gov border-l-4 border-l-gov-oro bg-amber-50">
              <p className="font-bold text-gov-oro mb-1">💡 Consejo clave de la IA</p>
              <p className="text-sm">{analisis.tip_clave}</p>
              {analisis.recomendacion_zona && (
                <p className="text-sm text-gray-600 mt-2">{analisis.recomendacion_zona}</p>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setPaso(1); setAnalisis(null); setForm({ giro_id:'', giro_libre:'', tipo_persona:'', alcaldia_id:'', colonia:'', categoria:'' }) }}
              className="btn-gov-outline"
            >
              ← Nueva consulta
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: 'ruta-tramites' }))}
              className="btn-gov flex-1"
            >
              📋 Ver ruta de trámites →
            </button>
          </div>
        </div>
      )}

      {/* Historial */}
      {historial.length > 0 && paso === 1 && (
        <div className="card-gov">
          <h3 className="font-bold text-gov-verde mb-3">🕐 Consultas recientes</h3>
          <div className="space-y-2">
            {historial.map(h => {
              const cfg = SCORE_CONFIG[h.nivel_viabilidad] || SCORE_CONFIG.MEDIO
              return (
                <div key={h.id} className="flex items-center gap-3 p-2 border border-gov-gris-medio rounded-lg text-sm">
                  <span className="text-xl">{cfg.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium">{giros.find(g => g.id === h.giro_id)?.nombre || 'Giro desconocido'}</p>
                    <p className="text-xs text-gray-400">{alcaldias.find(a => a.id === h.alcaldia_id)?.nombre} · Score: {h.score_viabilidad}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                    {h.nivel_viabilidad}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
