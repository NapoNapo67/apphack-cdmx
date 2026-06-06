import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { establecimiento, inconsistencia } = JSON.parse(event.body)

    const prompt = `Eres un experto en regulación de uso de suelo de la Ciudad de México (CDMX) y en la normativa de SEDUVI.

Analiza la siguiente inconsistencia detectada en un establecimiento y proporciona:
1. VEREDICTO: ¿Es realmente una inconsistencia grave, moderada o es un falso positivo?
2. EXPLICACIÓN: ¿Por qué es un problema (o no)?
3. RIESGO: ¿Qué consecuencias legales o económicas puede tener para el establecimiento y para la alcaldía?
4. ACCIÓN RECOMENDADA: Paso a paso, ¿qué debe hacer el funcionario y el propietario?
5. TRÁMITE APLICABLE: ¿Qué trámite de SEDUVI o SEDECO debe iniciarse?

DATOS DEL ESTABLECIMIENTO:
- Nombre: ${establecimiento.nombre}
- Dirección: ${establecimiento.direccion}, ${establecimiento.colonia}
- Uso de suelo permitido (SEDUVI): ${establecimiento.uso_suelo_real}
- Uso de suelo en operación real: ${establecimiento.uso_suelo_operacion}
- Clave SCIAN: ${establecimiento.sector}

INCONSISTENCIA DETECTADA:
- Tipo: ${inconsistencia.tipo}
- Descripción: ${inconsistencia.descripcion}

Responde de forma estructurada, clara y profesional. Máximo 300 palabras.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
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
