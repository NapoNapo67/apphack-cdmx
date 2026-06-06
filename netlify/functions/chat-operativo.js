import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `Eres el Agente Operativo del sistema "Radar CDMX" de SEDECO (Secretaría de Desarrollo Económico de la Ciudad de México).

Tu especialidad es el análisis territorial y de uso de suelo de la CDMX.

PUEDES AYUDAR CON:
- Explicar qué es el uso de suelo y cómo afecta a un establecimiento
- Orientar sobre trámites de SEDUVI para regularización de uso de suelo
- Clasificar tipos de establecimiento por su clave SCIAN
- Explicar qué es el DENUE (Directorio Estadístico Nacional de Unidades Económicas)
- Describir el proceso para detectar y resolver inconsistencias territoriales
- Guiar sobre cómo cargar datos geográficos (CSV, GeoJSON) al sistema
- Responder sobre las 16 alcaldías de CDMX y sus características económicas

USOS DE SUELO EN CDMX (SEDUVI):
- HAB: Habitacional (solo vivienda)
- HAB_M: Habitacional Mixto (vivienda + comercio en PB)
- COM: Comercial (comercio y servicios)
- COM_S: Corredor Urbano (sobre vialidades primarias)
- IND: Industrial (manufactura y industria)
- EQU: Equipamiento (hospitales, escuelas, mercados)
- VER: Área Verde (parques y conservación)
- MIX: Mixto (usos múltiples)

INCONSISTENCIAS COMUNES:
- Taller mecánico en zona habitacional (alta severidad)
- Depósito de gas en zona residencial (alta severidad)
- Vivero en área verde (puede ser compatible, análisis caso a caso)
- Comercio en equipamiento (media severidad, requiere constancia)

Respondes siempre en español, de forma clara, profesional y orientada a la acción.
Cuando des recomendaciones, incluye el nombre exacto del trámite y la dependencia responsable.`

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }
  try {
    const { messages = [], system = '', context = {} } = JSON.parse(event.body)
    const contextStr = Object.keys(context).length > 0
      ? `\n\nContexto actual del sistema:\n${JSON.stringify(context, null, 2)}`
      : ''
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM + (system ? '\n\n' + system : '') + contextStr,
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
