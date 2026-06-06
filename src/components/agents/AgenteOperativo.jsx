import { useState, useRef, useEffect } from 'react'
import { chatOperativo } from '../../lib/claude'

export default function AgenteOperativo() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await chatOperativo(newMessages)
      setMessages(prev => [...prev, { role: 'assistant', content: res.content }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el agente. Verifica la configuración.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 flex items-center justify-center text-2xl transition-transform hover:scale-110"
        style={{ backgroundColor: 'var(--gov-guinda)', color: 'white' }}
        title="Agente Operativo"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Panel de chat */}
      {open && (
        <div className={`
          fixed z-50 shadow-2xl rounded-xl overflow-hidden flex flex-col bg-white border border-gov-gris-medio
          bottom-24 right-6 w-80 h-[500px]
          sm:w-96 sm:h-[540px]
          max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:w-full max-sm:h-[80vh] max-sm:rounded-b-none
        `}>
          {/* Header del chat */}
          <div className="text-white px-4 py-3 flex items-center gap-2" style={{ backgroundColor:'var(--gov-guinda)' }}>
            <span className="text-xl">🤖</span>
            <div>
              <p className="font-bold text-sm">Agente Operativo</p>
              <p className="text-xs text-green-200">Asistente de trámites</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                <p className="text-3xl mb-2">👋</p>
                <p>¡Hola! Soy tu Agente Operativo.</p>
                <p className="mt-1">¿En qué puedo ayudarte hoy?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    m.role === 'user'
                      ? 'text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                  style={m.role === 'user' ? { backgroundColor:'var(--gov-guinda)' } : {}}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gov-gris-medio px-3 py-2 rounded-lg rounded-bl-none">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{animationDelay:'0ms', backgroundColor:'var(--gov-guinda)'}}/>
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{animationDelay:'150ms', backgroundColor:'var(--gov-guinda)'}}/>
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{animationDelay:'300ms', backgroundColor:'var(--gov-guinda)'}}/>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gov-gris-medio bg-white flex gap-2">
            <input
              className="input-gov flex-1 text-sm"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribe tu consulta..."
              disabled={loading}
            />
            <button onClick={send} disabled={loading} className="btn-gov px-3 py-2 text-sm">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
