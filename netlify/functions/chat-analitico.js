import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASE_SYSTEM = `Eres el Agente Analítico de AppHack CDMX. Tienes acceso a datos del Data Warehouse del sistema de gobierno.

Tu especialidad es responder preguntas sobre métricas, tendencias y estadísticas del sistema.
Cuando respondes, siempre das:
1. El DATO EXACTO del data warehouse
2. Una INTERPRETACIÓN breve en lenguaje natural
3. Una RECOMENDACIÓN accionable

Ejemplos de preguntas que respondes:
- "¿Cuál alcaldía tiene más solicitudes este trimestre?"
- "¿Cuántos trámites están fuera de tiempo?"
- "¿Qué tipo de trámite tarda más en resolverse?"
- "¿Cuál es la tendencia este mes vs el anterior?"

Respondes siempre en español, de forma precisa y útil para la toma de decisiones de gobierno.`

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { messages = [], data_summary = {} } = JSON.parse(event.body)

    const summaryStr = Object.keys(data_summary).length > 0
      ? `\n\nResumen actual del Data Warehouse:\n${JSON.stringify(data_summary, null, 2)}`
      : '\n\nEl Data Warehouse aún no tiene datos de negocio cargados. Indica esto al usuario.'

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: BASE_SYSTEM + summaryStr,
      messages,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: response.content[0].text }),
    }
  } catch (err) {
    console.error('chat-analitico error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
