import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASE_SYSTEM = `Eres el Agente Operativo de AppHack CDMX, un asistente de IA especializado en los trámites y procesos de gobierno de la Ciudad de México.

Ayudas a funcionarios y ciudadanos a:
- Clasificar documentos y trámites
- Extraer información de documentos
- Gestionar y dar seguimiento a trámites
- Entender el proceso administrativo
- Generar respuestas y oficios

Los estados de trámite disponibles son: NUEVO, ASIGNADO, EN_PROCESO, PENDIENTE, RESUELTO, CANCELADO.
Las 16 alcaldías de CDMX son: Azcapotzalco, Coyoacán, Cuajimalpa, Cuauhtémoc, Gustavo A. Madero, Iztacalco, Iztapalapa, Magdalena Contreras, Miguel Hidalgo, Milpa Alta, Álvaro Obregón, Tláhuac, Tlalpan, Venustiano Carranza, Xochimilco, Benito Juárez.

Respondes siempre en español, de forma clara, profesional y concisa.`

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { messages = [], system = '', context = {} } = JSON.parse(event.body)

    const systemPrompt = system
      ? `${BASE_SYSTEM}\n\n${system}`
      : BASE_SYSTEM

    const contextStr = Object.keys(context).length > 0
      ? `\n\nContexto actual:\n${JSON.stringify(context, null, 2)}`
      : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt + contextStr,
      messages,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: response.content[0].text }),
    }
  } catch (err) {
    console.error('chat-operativo error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
