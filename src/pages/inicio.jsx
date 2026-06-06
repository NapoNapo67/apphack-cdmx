import { useState } from 'react'
import { useApp } from '../context/AppContext'

const EJEMPLOS = [
  'Quiero abrir una taquería cerca del metro en Iztapalapa',
  'Tengo idea de una barbería en Coyoacán, zona universitaria',
  'Pienso abrir un bar de cocteles en la Colonia Roma',
  'Quiero una panadería artesanal en Benito Juárez',
  'Me interesa una farmacia en Gustavo A. Madero',
]

export default function Inicio({ onAnalizar }) {
  const { setActiveTab, setBusquedaInicial, login } = useApp()
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)

  async function analizar(idea) {
    const query = (idea || texto).trim()
    if (!query) return
    setCargando(true)
    try {
      // Guardar el texto en contexto global para que viabilidad lo lea
      setBusquedaInicial(query)
      setActiveTab('viabilidad')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">

      {/* Logos */}
      <div className="flex items-center gap-4 mb-8">
        <img src="/Logo_CDMX.png" alt="CDMX" className="h-14 object-contain"
          onError={e => e.target.style.display='none'} />
        <div className="h-10 w-px bg-gray-200" />
        <img src="/Logo_Dependencia.png" alt="SEDECO" className="h-10 object-contain"
          onError={e => e.target.style.display='none'} />
      </div>

      {/* Título */}
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-black mb-3" style={{ color: 'var(--gov-guinda)' }}>
          ¿Quieres abrir un negocio<br />en la Ciudad de México?
        </h1>
        <p className="text-gray-500 text-lg">
          Cuéntanos tu idea. Te decimos si es viable, qué trámites necesitas
          y cómo obtener apoyo del gobierno.
        </p>
      </div>

      {/* Buscador grande */}
      <div className="w-full max-w-2xl">
        <div className="relative">
          <textarea
            className="w-full rounded-xl border-2 px-5 py-4 pr-36 text-base resize-none shadow-md focus:outline-none transition-all"
            style={{
              borderColor: texto ? 'var(--gov-guinda)' : 'var(--gov-gris-medio)',
              fontFamily: 'Montserrat, sans-serif',
              minHeight: '80px',
            }}
            placeholder="Describe tu idea de negocio... por ejemplo: &quot;Quiero abrir una taquería en Coyoacán&quot;"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                analizar()
              }
            }}
            rows={2}
          />
          <button
            onClick={() => analizar()}
            disabled={!texto.trim() || cargando}
            className="absolute right-3 bottom-3 btn-gov px-5 py-2 text-sm flex items-center gap-2"
          >
            {cargando
              ? <><span className="animate-spin">⏳</span> Analizando...</>
              : <>🤖 Evaluar</>
            }
          </button>
        </div>

        {/* Ejemplos */}
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2 text-center">O prueba con un ejemplo:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {EJEMPLOS.map((e, i) => (
              <button
                key={i}
                onClick={() => analizar(e)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all hover:shadow-sm"
                style={{
                  borderColor: 'var(--gov-guinda)',
                  color: 'var(--gov-guinda)',
                  background: 'white',
                }}
              >
                {e.length > 40 ? e.slice(0, 40) + '...' : e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 pilares */}
      <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl w-full">
        {[
          { icon: '🤖', title: 'Viabilidad con IA', desc: 'Score 0-100 en segundos' },
          { icon: '📋', title: 'Ruta de trámites', desc: 'Paso a paso personalizado' },
          { icon: '🎯', title: 'Apoyos SEDECO', desc: 'Créditos y programas' },
        ].map(p => (
          <div key={p.title} className="text-center p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
            <p className="text-3xl mb-2">{p.icon}</p>
            <p className="font-bold text-sm" style={{ color: 'var(--gov-guinda)' }}>{p.title}</p>
            <p className="text-xs text-gray-400 mt-1">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Pie + acceso funcionarios */}
      <p className="text-xs text-gray-400 mt-10 text-center">
        Secretaría de Desarrollo Económico · Gobierno de la Ciudad de México<br/>
        CENPROIN: Av. Cuauhtémoc 899, Narvarte · Lun–Vie 9:00–14:30 ·{' '}
        <a href="mailto:dudas.siapem@sedeco.cdmx.gob.mx" style={{ color: 'var(--gov-guinda)' }}>
          dudas.siapem@sedeco.cdmx.gob.mx
        </a>
      </p>
      <button
        onClick={login}
        className="mt-4 text-xs text-gray-300 hover:text-gray-400 transition-colors underline underline-offset-2"
      >
        Acceso funcionarios →
      </button>
    </div>
  )
}
