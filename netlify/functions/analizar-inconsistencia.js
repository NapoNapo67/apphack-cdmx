const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { establecimiento, inconsistencia } = JSON.parse(event.body)

    const prompt = `Eres un experto en regulaciÃ³n de uso de suelo de la Ciudad de MÃ©xico (CDMX) y en la normativa de SEDUVI.

Analiza la siguiente inconsistencia detectada en un establecimiento y proporciona:
1. VEREDICTO: Â¿Es realmente una inconsistencia grave, moderada o es un falso positivo?
2. EXPLICACIÃ“N: Â¿Por quÃ© es un problema (o no)?
3. RIESGO: Â¿QuÃ© consecuencias legales o econÃ³micas puede tener para el establecimiento y para la alcaldÃ­a?
4. ACCIÃ“N RECOMENDADA: Paso a paso, Â¿quÃ© debe hacer el funcionario y el propietario?
5. TRÃMITE APLICABLE: Â¿QuÃ© trÃ¡mite de SEDUVI o SEDECO debe iniciarse?

DATOS DEL ESTABLECIMIENTO:
- Nombre: ${establecimiento.nombre}
- DirecciÃ³n: ${establecimiento.direccion}, ${establecimiento.colonia}
- Uso de suelo permitido (SEDUVI): ${establecimiento.uso_suelo_real}
- Uso de suelo en operaciÃ³n real: ${establecimiento.uso_suelo_operacion}
- Clave SCIAN: ${establecimiento.sector}

INCONSISTENCIA DETECTADA:
- Tipo: ${inconsistencia.tipo}
- DescripciÃ³n: ${inconsistencia.descripcion}

Responde de forma estructurada, clara y profesional. MÃ¡ximo 300 palabras.`

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

