import { useState } from 'react'
import { chatAnalitico } from '../../lib/claude'

export default function AgenteAnalitico({ dataSummary = {} }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const SUGERIDAS = [
    '¿Cuántos registros hay en total?',
    '¿Cuál es el estado más común?',
    '¿Qué alcaldía tiene más registros?',
  ]

  async function send(text) {
    const query = (text || input).trim()
    if (!query || loading) return
    const newMessages = [...messages, { role: 'user', content: query }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await chatAnalitico(newMessages, dataSummary)
      setMessages(prev => [...prev, { role: 'assistant', content: res.content }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el agente analítico.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-gov">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📊</span>
        <div>
          <h3 className="font-bold text-gov-verde">Agente Analítico</h3>
          <p className="text-xs text-gray-500">Pregunta sobre datos y métricas</p>
        </div>
      </div>

      {/* Preguntas sugeridas */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGERIDAS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs btn-gov-outline py-1 px-2"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Mensajes */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg text-sm ${
            m.role === 'user'
              ? 'bg-gov-verde-claro border border-gov-verde text-gov-texto'
              : 'bg-white border border-gov-gris-medio'
          }`}>
            <p className="font-semibold text-xs mb-1 text-gray-400">
              {m.role === 'user' ? '🙋 Tu pregunta' : '🤖 Agente Analítico'}
            </p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400 italic">Analizando datos...</p>}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          className="input-gov flex-1 text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="¿Cuál alcaldía tiene más registros este mes?"
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading} className="btn-gov px-4">
          Preguntar
        </button>
      </div>
    </div>
  )
}
