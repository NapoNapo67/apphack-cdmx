import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { giro, alcaldia, tipo_persona, contexto_giro, contexto_zona } = JSON.parse(event.body)

    const prompt = `Eres un experto en desarrollo económico, normatividad mercantil y análisis de mercado de la Ciudad de México (CDMX), con conocimiento profundo del RETYS, SIAPEM, SEDUVI y la Ley de Establecimientos Mercantiles.

Un emprendedor quiere abrir el siguiente negocio:

NEGOCIO:
- Tipo de giro: ${giro.nombre} (${giro.clave})
- Descripción del emprendedor: "${giro.descripcion_libre}"
- Categoría SCIAN: ${giro.clave_scian || 'N/A'}
- Estructura legal elegida: ${tipo_persona.nombre}

UBICACIÓN:
- Alcaldía: ${alcaldia.nombre}
- Colonia / zona: ${alcaldia.colonia || 'No especificada'}
- Uso de suelo permitido en la zona (SEDUVI): ${contexto_zona.uso_suelo || 'No verificado aún'}
- Usos de suelo compatibles con este giro: ${giro.uso_suelo_ok?.join(', ') || 'COM, COM_S, MIX'}

DATOS DE CONTEXTO DE LA ZONA:
${JSON.stringify(contexto_zona, null, 2)}

DATOS DEL GIRO:
${JSON.stringify(contexto_giro, null, 2)}

Proporciona un análisis estructurado en JSON con exactamente este formato:

{
  "score": <número del 0 al 100>,
  "nivel": "<ALTO|MEDIO|BAJO|MUY_BAJO>",
  "resumen": "<2-3 oraciones de resumen ejecutivo>",
  "uso_suelo_compatible": <true|false>,
  "uso_suelo_explicacion": "<explicación de compatibilidad>",
  "oportunidades": [
    "<oportunidad 1>",
    "<oportunidad 2>",
    "<oportunidad 3>"
  ],
  "riesgos": [
    "<riesgo 1>",
    "<riesgo 2>",
    "<riesgo 3>"
  ],
  "competencia": {
    "nivel": "<ALTA|MEDIA|BAJA>",
    "descripcion": "<descripción de la competencia en la zona>",
    "estimado_competidores": <número estimado>
  },
  "demanda": {
    "nivel": "<ALTA|MEDIA|BAJA>",
    "descripcion": "<descripción de la demanda esperada>"
  },
  "inversion_estimada": {
    "min": <número en pesos>,
    "max": <número en pesos>,
    "descripcion": "<qué incluye esta estimación>"
  },
  "tiempo_apertura_meses": <número>,
  "recomendacion_zona": "<recomendación específica sobre la zona o si sugiere otra zona>",
  "tip_clave": "<el consejo más importante para este emprendedor específico>"
}

Responde ÚNICAMENTE con el JSON, sin texto adicional. Sé específico y realista sobre la CDMX.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = response.content[0].text.trim()
    // Extraer JSON aunque venga con ```
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    const analisis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(texto)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analisis }),
    }
  } catch (err) {
    console.error('analizar-viabilidad error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
