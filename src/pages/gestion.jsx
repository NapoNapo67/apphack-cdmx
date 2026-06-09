import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

// Configuración visual de cada estado
const ESTADO_CFG = {
  NUEVO:      { color: '#6B7280', bg: '#F3F4F6', emoji: '🆕', label: 'Nuevo'       },
  ASIGNADO:   { color: '#3B82F6', bg: '#EFF6FF', emoji: '👤', label: 'Asignado'    },
  EN_PROCESO: { color: '#F59E0B', bg: '#FFFBEB', emoji: '⚙️', label: 'En Proceso'  },
  PENDIENTE:  { color: '#EF4444', bg: '#FEF2F2', emoji: '⏳', label: 'Pendiente'   },
  RESUELTO:   { color: '#10B981', bg: '#ECFDF5', emoji: '✅', label: 'Resuelto'    },
  CANCELADO:  { color: '#9CA3AF', bg: '#F9FAFB', emoji: '🚫', label: 'Cancelado'   },
}

// Orden de transición válida (flujo de negocio)
const FLUJO = ['NUEVO', 'ASIGNADO', 'EN_PROCESO', 'PENDIENTE', 'RESUELTO', 'CANCELADO']

function BadgeEstado({ clave }) {
  const cfg = ESTADO_CFG[clave] || ESTADO_CFG.NUEVO
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.emoji} {cfg.label}
    </span>
  )
}

function FiltroBtn({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        activo
          ? 'bg-gov-guinda text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

export default function Gestion() {
  const { user } = useApp()
  const [consultas, setConsultas]     = useState([])
  const [estados, setEstados]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [buscando, setBuscando]       = useState('')
  const [actualizando, setActualizando] = useState(null)   // id de fila que se está guardando
  const [notif, setNotif]             = useState(null)      // { tipo, texto }
  const [expandido, setExpandido]     = useState(null)      // id de fila expandida

  // ── Cargar catálogo de estados ────────────────────────────────
  useEffect(() => {
    supabase.from('cat_estado_tramite').select('id,clave,nombre').order('nombre')
      .then(({ data }) => setEstados(data || []))
  }, [])

  // ── Cargar consultas con joins ────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('consulta_viabilidad')
      .select(`
        id, score_viabilidad, nivel_viabilidad, colonia, created_at,
        emprendedor_nombre, emprendedor_email, emprendedor_telefono,
        edad, genero, grado_estudios, es_primer_negocio,
        estado_id,
        cat_estado_tramite:estado_id ( id, clave, nombre ),
        cat_giro_negocio:giro_id      ( id, nombre, clave ),
        cat_alcaldia:alcaldia_id      ( id, nombre, clave )
      `)
      .order('created_at', { ascending: false })
    if (!error) setConsultas(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Suscripción en tiempo real
  useEffect(() => {
    const channel = supabase
      .channel('gestion_consultas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consulta_viabilidad' },
        () => cargar())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [cargar])

  // ── Cambiar estado ────────────────────────────────────────────
  async function cambiarEstado(consultaId, nuevoEstadoId) {
    setActualizando(consultaId)
    const { error } = await supabase
      .from('consulta_viabilidad')
      .update({ estado_id: nuevoEstadoId, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq('id', consultaId)

    if (error) {
      setNotif({ tipo: 'error', texto: `Error: ${error.message}` })
    } else {
      const nombreEstado = estados.find(e => e.id === nuevoEstadoId)?.nombre || ''
      setNotif({ tipo: 'ok', texto: `Estado actualizado a "${nombreEstado}" — ETL actualizará el DW en segundos` })
      setTimeout(() => setNotif(null), 4000)
      cargar()
    }
    setActualizando(null)
  }

  // ── Filtros ───────────────────────────────────────────────────
  const consultasFiltradas = consultas.filter(c => {
    const clave = c.cat_estado_tramite?.clave || 'NUEVO'
    const okEstado = filtroEstado === 'TODOS' || clave === filtroEstado
    const busq = buscando.toLowerCase()
    const okBusq = !busq || [
      c.emprendedor_nombre, c.emprendedor_email,
      c.cat_giro_negocio?.nombre, c.cat_alcaldia?.nombre
    ].some(v => v?.toLowerCase().includes(busq))
    return okEstado && okBusq
  })

  // Conteo por estado para los filtros
  const conteo = consultas.reduce((acc, c) => {
    const k = c.cat_estado_tramite?.clave || 'NUEVO'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--gov-guinda)' }}>
          📋 Gestión de Consultas
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Seguimiento del ciclo de vida de cada consulta de viabilidad · {consultas.length} registros totales
        </p>
      </div>

      {/* ── Notificación ── */}
      {notif && (
        <div className={`p-3 rounded-lg text-sm border flex items-center gap-2 ${
          notif.tipo === 'ok'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notif.tipo === 'ok' ? '✅' : '❌'} {notif.texto}
        </div>
      )}

      {/* ── Resumen de estados ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {FLUJO.map(clave => {
          const cfg = ESTADO_CFG[clave]
          const n = conteo[clave] || 0
          return (
            <div key={clave}
              className="text-center p-3 rounded-xl border-2 cursor-pointer transition-all"
              style={{
                borderColor: n > 0 ? cfg.color : '#E5E7EB',
                background: n > 0 ? cfg.bg : '#FAFAFA',
                opacity: n === 0 ? 0.5 : 1
              }}
              onClick={() => setFiltroEstado(filtroEstado === clave ? 'TODOS' : clave)}
            >
              <p className="text-2xl">{cfg.emoji}</p>
              <p className="text-xl font-black mt-1" style={{ color: cfg.color }}>{n}</p>
              <p className="text-xs text-gray-500 leading-tight mt-0.5">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* ── Filtros y búsqueda ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <FiltroBtn activo={filtroEstado === 'TODOS'} onClick={() => setFiltroEstado('TODOS')}>
          Todos ({consultas.length})
        </FiltroBtn>
        {Object.entries(conteo).map(([clave, n]) => (
          <FiltroBtn key={clave}
            activo={filtroEstado === clave}
            onClick={() => setFiltroEstado(filtroEstado === clave ? 'TODOS' : clave)}>
            {ESTADO_CFG[clave]?.emoji} {ESTADO_CFG[clave]?.label} ({n})
          </FiltroBtn>
        ))}
        <div className="ml-auto">
          <input
            className="input-gov py-1.5 text-sm w-56"
            placeholder="🔍 Buscar nombre, email, giro..."
            value={buscando}
            onChange={e => setBuscando(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tabla de consultas ── */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">⏳ Cargando consultas...</div>
      ) : consultasFiltradas.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📭</p>
          <p>No hay consultas con ese filtro</p>
        </div>
      ) : (
        <div className="space-y-2">
          {consultasFiltradas.map(c => {
            const estadoClave = c.cat_estado_tramite?.clave || 'NUEVO'
            const estadoCfg   = ESTADO_CFG[estadoClave] || ESTADO_CFG.NUEVO
            const isOpen      = expandido === c.id
            const fecha = c.created_at
              ? new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
              : '—'

            return (
              <div key={c.id}
                className="card-gov border-l-4 transition-all"
                style={{ borderLeftColor: estadoCfg.color }}
              >
                {/* ── Fila principal ── */}
                <div className="flex items-center gap-3">

                  {/* Score */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2"
                    style={{ borderColor: estadoCfg.color, background: estadoCfg.bg, color: estadoCfg.color }}>
                    {c.score_viabilidad ?? '—'}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-gov-texto">
                        {c.cat_giro_negocio?.nombre || 'Giro desconocido'}
                      </p>
                      <span className="text-xs text-gray-400">·</span>
                      <p className="text-xs text-gray-500">{c.cat_alcaldia?.nombre || '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                      {c.emprendedor_nombre && (
                        <span>👤 <strong className="text-gray-600">{c.emprendedor_nombre}</strong></span>
                      )}
                      {c.emprendedor_email && (
                        <a href={`mailto:${c.emprendedor_email}`} className="text-gov-verde hover:underline">
                          ✉️ {c.emprendedor_email}
                        </a>
                      )}
                      {c.emprendedor_telefono && (
                        <a href={`https://wa.me/52${c.emprendedor_telefono.replace(/\D/g,'')}`}
                          target="_blank" rel="noreferrer"
                          className="text-green-600 hover:underline">
                          💬 {c.emprendedor_telefono}
                        </a>
                      )}
                      <span className="text-gray-300">·</span>
                      <span>{fecha}</span>
                    </div>
                  </div>

                  {/* Cambiar estado */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <BadgeEstado clave={estadoClave} />
                    <select
                      value={c.estado_id || ''}
                      disabled={actualizando === c.id}
                      onChange={e => cambiarEstado(c.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer hover:border-gov-verde focus:outline-none focus:ring-1 focus:ring-gov-verde disabled:opacity-50"
                    >
                      <option value="" disabled>Cambiar estado...</option>
                      {estados.map(est => (
                        <option key={est.id} value={est.id}>
                          {ESTADO_CFG[est.clave]?.emoji} {est.nombre}
                        </option>
                      ))}
                    </select>
                    {actualizando === c.id && <span className="text-xs text-gray-400 animate-spin">⏳</span>}
                  </div>

                  {/* Expandir */}
                  <button
                    onClick={() => setExpandido(isOpen ? null : c.id)}
                    className="text-gray-400 hover:text-gov-verde text-lg transition-colors flex-shrink-0"
                  >
                    {isOpen ? '▲' : '▼'}
                  </button>
                </div>

                {/* ── Detalle expandido ── */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="font-bold text-gray-500 mb-2 uppercase tracking-wide">Perfil del emprendedor</p>
                      <div className="space-y-1 text-gray-600">
                        {c.edad      && <p>🎂 <strong>Edad:</strong> {c.edad} años</p>}
                        {c.genero    && <p>👤 <strong>Género:</strong> {c.genero}</p>}
                        {c.grado_estudios && <p>🎓 <strong>Estudios:</strong> {c.grado_estudios}</p>}
                        <p>🏪 <strong>¿Primer negocio?</strong> {c.es_primer_negocio ? 'Sí' : 'No'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-500 mb-2 uppercase tracking-wide">Resultado IA</p>
                      <div className="space-y-1 text-gray-600">
                        <p>📊 <strong>Score:</strong> {c.score_viabilidad}/100</p>
                        <p>🏷️ <strong>Nivel:</strong> {c.nivel_viabilidad}</p>
                        {c.colonia && <p>📍 <strong>Colonia:</strong> {c.colonia}</p>}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-500 mb-2 uppercase tracking-wide">Acciones rápidas</p>
                      <div className="space-y-2">
                        {c.emprendedor_email && (
                          <a href={`mailto:${c.emprendedor_email}?subject=Seguimiento de tu consulta SEDECO`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gov-verde-claro text-gov-verde text-xs font-semibold hover:bg-green-100 transition-colors">
                            ✉️ Enviar email
                          </a>
                        )}
                        {c.emprendedor_telefono && (
                          <a href={`https://wa.me/52${c.emprendedor_telefono.replace(/\D/g,'')}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                            style={{ background: '#25D366', color: '#fff' }}>
                            💬 WhatsApp
                          </a>
                        )}
                        {/* Marcar como resuelto directo */}
                        {estadoClave !== 'RESUELTO' && estadoClave !== 'CANCELADO' && (
                          <button
                            onClick={() => {
                              const resueltoId = estados.find(e => e.clave === 'RESUELTO')?.id
                              if (resueltoId) cambiarEstado(c.id, resueltoId)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors w-full justify-center"
                          >
                            ✅ Marcar como Resuelto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Nota sobre ETL */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 flex items-center gap-2">
        ⚡ Cada cambio de estado dispara el trigger ETL — <code>dw.fact_consulta</code> se actualiza automáticamente en ~50ms.
        El tablero de Analítica refleja los cambios en tiempo real.
      </div>
    </div>
  )
}
