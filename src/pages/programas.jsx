import { useState } from 'react'
import { useSupabase } from '../hooks/useSupabase'
import { FB_PROGRAMAS, FB_TIPOS_PROGRAMA } from '../lib/fallback-data'

const TIPO_ICON = {
  FINANCIAMIENTO: '💰', CAPACITACION: '📚', INCUBACION: '🚀',
  VINCULACION: '🤝',    SUBSIDIO: '🎁',     ESPACIO: '🏢',
}

export default function Programas() {
  const { data: _programas } = useSupabase('programa_emprendimiento', { order: 'orden' })
  const { data: _tipos }     = useSupabase('cat_programa_tipo', { order: 'orden' })
  const programas = _programas.length ? _programas : FB_PROGRAMAS
  const tipos     = _tipos.length     ? _tipos     : FB_TIPOS_PROGRAMA
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [busqueda, setBusqueda]     = useState('')

  const filtrados = programas.filter(p => {
    const ok_tipo = filtroTipo === 'TODOS' || tipos.find(t => t.id === p.tipo_id)?.clave === filtroTipo
    const ok_bus  = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    return ok_tipo && ok_bus
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gov-verde flex items-center gap-2">
          🎯 Programas de Emprendimiento CDMX
        </h1>
        <p className="text-sm text-gray-500">Apoyos del Gobierno de la CDMX y federal para emprendedores e inversionistas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroTipo('TODOS')}
          className={`text-sm px-3 py-1.5 rounded-full font-medium border-2 transition ${filtroTipo === 'TODOS' ? 'bg-gov-verde text-white border-gov-verde' : 'border-gov-gris-medio text-gray-600 hover:border-gov-verde'}`}
        >
          Todos ({programas.length})
        </button>
        {tipos.map(t => (
          <button
            key={t.id}
            onClick={() => setFiltroTipo(t.clave)}
            className={`text-sm px-3 py-1.5 rounded-full font-medium border-2 transition ${filtroTipo === t.clave ? 'bg-gov-verde text-white border-gov-verde' : 'border-gov-gris-medio text-gray-600 hover:border-gov-verde'}`}
          >
            {TIPO_ICON[t.clave]} {t.nombre}
          </button>
        ))}
      </div>

      <input
        className="input-gov"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar programa..."
      />

      {/* Cards de programas */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtrados.map(p => {
          const tipo = tipos.find(t => t.id === p.tipo_id)
          return (
            <div key={p.id} className={`card-gov flex flex-col ${p.destacado ? 'border-gov-verde border-2' : ''}`}>
              {p.destacado && (
                <div className="bg-gov-verde text-white text-xs font-bold px-3 py-1 rounded-t-lg -mx-5 -mt-5 mb-3 text-center">
                  ⭐ PROGRAMA DESTACADO
                </div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{TIPO_ICON[tipo?.clave] || '📋'}</span>
                <div>
                  <h3 className="font-bold text-gov-verde text-sm leading-tight">{p.nombre}</h3>
                  <span className="text-xs bg-gov-verde-claro text-gov-verde px-2 py-0.5 rounded-full font-medium">
                    {tipo?.nombre}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gov-texto flex-1">{p.descripcion}</p>

              <div className="mt-3 pt-3 border-t border-gov-gris-medio space-y-1">
                {p.monto_min > 0 || p.monto_max > 0 ? (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-bold text-gov-verde">💰</span>
                    <span className="font-semibold">{p.monto_descripcion}</span>
                  </div>
                ) : (
                  <div className="text-sm text-green-600 font-semibold">✅ Gratuito</div>
                )}
                {p.anos_operacion_max !== null && (
                  <p className="text-xs text-gray-500">
                    ⏰ Para negocios con hasta {p.anos_operacion_max} año{p.anos_operacion_max !== 1 ? 's' : ''} de operación
                  </p>
                )}
                {p.anos_operacion_max === null && (
                  <p className="text-xs text-gray-500">✓ Para negocios en cualquier etapa (incluye nuevos)</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.requiere_plan_negocio && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">📄 Plan de negocio</span>}
                  {p.requiere_rfc          && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">🔢 RFC</span>}
                </div>
              </div>

              {p.convocatoria_url && (
                <a
                  href={p.convocatoria_url} target="_blank" rel="noreferrer"
                  className="mt-3 btn-gov text-sm text-center block"
                >
                  Ver convocatoria →
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
