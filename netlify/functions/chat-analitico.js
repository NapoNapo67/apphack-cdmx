import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Eres el Agente Analitico del sistema "Viabilidad CDMX" de SEDECO (Secretaria de Desarrollo Economico de la Ciudad de Mexico).

CONCEPTOS CRITICOS — distingue SIEMPRE entre estos dos:
1. VIABILIDAD POSITIVA (resultado IA): consultas donde el analisis de IA asigno nivel ALTO o MEDIO.
   Campo: viabilidad_positiva / pct_viabilidad_positiva
   Ejemplo: "49 de 62 analisis tuvieron viabilidad ALTO o MEDIO (79%)"

2. ESTADO DEL TRAMITE (workflow): estado operativo de cada consulta en el proceso de atencion.
   Campos: estado_NUEVO, estado_ASIGNADO, estado_EN_PROCESO, estado_PENDIENTE, estado_RESUELTO, estado_CANCELADO
   Ejemplo: "62 consultas en NUEVO, 0 en RESUELTO — el equipo aun no ha procesado las solicitudes"

NUNCA confundas viabilidad_positiva con estado_RESUELTO. Son metricas completamente distintas.

Tienes acceso al Data Warehouse de CDMX con:
- Consultas de viabilidad por alcaldia, giro y perfil demografico
- Estado de tramitacion de cada consulta
- Tendencias mensuales y rankings

Cuando respondes:
1. DATO EXACTO del campo correcto (usa el nombre exacto del campo)
2. INTERPRETACION clara diferenciando los dos conceptos si aplica
3. RECOMENDACION accionable para el funcionario de SEDECO

Respondes en espanol. Eres preciso y util para la toma de decisiones de politica economica.`

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
