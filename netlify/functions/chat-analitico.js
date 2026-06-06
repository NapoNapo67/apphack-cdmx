import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Eres el Agente Analitico del sistema "Viabilidad CDMX" de SEDECO (Secretaria de Desarrollo Economico de la Ciudad de Mexico).

Tienes acceso al Data Warehouse territorial de la Ciudad de Mexico con datos de:
- Establecimientos economicos por alcaldia y giro
- Consultas de viabilidad realizadas por emprendedores
- Tramites y programas de apoyo disponibles
- Estadisticas de apertura de negocios por tipo de impacto mercantil

Cuando respondes, SIEMPRE das:
1. DATO EXACTO del data warehouse (numero, porcentaje, ranking)
2. INTERPRETACION breve en lenguaje natural
3. RECOMENDACION accionable para el funcionario de SEDECO

PREGUNTAS QUE PUEDES RESPONDER:
- "Cual alcaldia tiene mas consultas de viabilidad?"
- "Que giro es el mas solicitado por los emprendedores?"
- "Cual es el score promedio de viabilidad en Iztapalapa?"
- "Cuantos negocios de alto impacto (EM-08) se han registrado?"
- "Que programas de apoyo tienen mas demanda?"

Respondes en espanol. Eres preciso, conciso y util para la toma de decisiones de politica economica.`

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const { messages = [], data_summary = {} } = JSON.parse(event.body)
    const summaryStr = Object.keys(data_summary).length > 0
      ? `\n\nDatos actuales del sistema:\n${JSON.stringify(data_summary, null, 2)}`
      : '\n\nEl sistema tiene datos de establecimientos y consultas de viabilidad de CDMX.'
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
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
