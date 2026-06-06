import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Eres el Agente Analítico del sistema "Radar CDMX" de SEDECO.

Tienes acceso al Data Warehouse territorial de la Ciudad de México con datos de:
- Establecimientos económicos (DENUE — INEGI)
- Mercados públicos (340 en CDMX)
- Inconsistencias de uso de suelo detectadas
- Análisis por alcaldía, sector económico y tipo de uso de suelo

Cuando respondes, SIEMPRE das:
1. DATO EXACTO del data warehouse (número, porcentaje, ranking)
2. INTERPRETACIÓN breve en lenguaje natural
3. RECOMENDACIÓN accionable para el funcionario de SEDECO

PREGUNTAS QUE PUEDES RESPONDER:
- "¿Cuál alcaldía tiene más inconsistencias de uso de suelo?"
- "¿Qué sector económico opera más en zonas habitacionales?"
- "¿Cuántos mercados públicos tienen problemas en su uso de suelo?"
- "¿Cuál es la densidad de establecimientos en Iztapalapa vs Cuauhtémoc?"
- "¿Qué tipo de inconsistencia es más frecuente?"

Respondes en español. Eres preciso, conciso y útil para la toma de decisiones de política económica.`

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const { messages = [], data_summary = {} } = JSON.parse(event.body)
    const summaryStr = Object.keys(data_summary).length > 0
      ? `\n\nDatos actuales del sistema:\n${JSON.stringify(data_summary, null, 2)}`
      : '\n\nEl sistema tiene datos de establecimientos y mercados de CDMX.'
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM + summaryStr,
      messages,
    })
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: response.content[0].text }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
