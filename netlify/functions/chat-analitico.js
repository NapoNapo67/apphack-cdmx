const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Eres el Agente AnalÃ­tico del sistema "Radar CDMX" de SEDECO.

Tienes acceso al Data Warehouse territorial de la Ciudad de MÃ©xico con datos de:
- Establecimientos econÃ³micos (DENUE â€” INEGI)
- Mercados pÃºblicos (340 en CDMX)
- Inconsistencias de uso de suelo detectadas
- AnÃ¡lisis por alcaldÃ­a, sector econÃ³mico y tipo de uso de suelo

Cuando respondes, SIEMPRE das:
1. DATO EXACTO del data warehouse (nÃºmero, porcentaje, ranking)
2. INTERPRETACIÃ“N breve en lenguaje natural
3. RECOMENDACIÃ“N accionable para el funcionario de SEDECO

PREGUNTAS QUE PUEDES RESPONDER:
- "Â¿CuÃ¡l alcaldÃ­a tiene mÃ¡s inconsistencias de uso de suelo?"
- "Â¿QuÃ© sector econÃ³mico opera mÃ¡s en zonas habitacionales?"
- "Â¿CuÃ¡ntos mercados pÃºblicos tienen problemas en su uso de suelo?"
- "Â¿CuÃ¡l es la densidad de establecimientos en Iztapalapa vs CuauhtÃ©moc?"
- "Â¿QuÃ© tipo de inconsistencia es mÃ¡s frecuente?"

Respondes en espaÃ±ol. Eres preciso, conciso y Ãºtil para la toma de decisiones de polÃ­tica econÃ³mica.`

exports.handler = async (event) => {
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

