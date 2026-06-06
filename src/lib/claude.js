// Claude API se llama SIEMPRE via Netlify Functions, nunca directo desde frontend

export async function chatOperativo(messages, system = '', context = {}) {
  const res = await fetch('/.netlify/functions/chat-operativo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system, context }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}

export async function chatAnalitico(messages, data_summary = {}) {
  const res = await fetch('/.netlify/functions/chat-analitico', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, data_summary }),
  })
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json()
}
