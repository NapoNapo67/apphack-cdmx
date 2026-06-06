const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { giro, alcaldia, tipo_persona, contexto_giro, contexto_zona } = JSON.parse(event.body)

    const prompt = `Eres un experto en desarrollo economico, normatividad mercantil y analisis de mercado de la Ciudad de Mexico (CDMX), con conocimiento profundo del RETYS, SIAPEM, SEDUVI y la Ley de Establecimientos Mercantiles.

Un emprendedor quiere abrir el siguiente negocio:

NEGOCIO:
- Tipo de giro: ${giro.nombre} (${giro.clave})
- Descripcion del emprendedor: "${giro.descripcion_libre}"
- Categoria SCIAN: ${giro.clave_scian || 'N/A'}
- Estructura legal elegida: ${tipo_persona.nombre}

UBICACION:
- Alcaldia: ${alcaldia.nombre}
- Colonia / zona: ${alcaldia.colonia || 'No especificada'}
- Uso de suelo permitido en la zona (SEDUVI): ${contexto_zona.uso_suelo || 'No verificado aun'}
- Usos de suelo compatibles con este giro: ${giro.uso_suelo_ok?.join(', ') || 'COM, COM_S, MIX'}

DATOS DE CONTEXTO DE LA ZONA:
${JSON.stringify(contexto_zona, null, 2)}

DATOS DEL GIRO:
${JSON.stringify(contexto_giro, null, 2)}

Proporciona un analisis estructurado en JSON con exactamente este formato:

{
  "score": <numero del 0 al 100>,
  "nivel": "<ALTO|MEDIO|BAJO|MUY_BAJO>",
  "resumen": "<2-3 oraciones de resumen ejecutivo>",
  "uso_suelo_compatible": <true|false>,
  "uso_suelo_explicacion": "<explicacion de compatibilidad>",
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
    "descripcion": "<descripcion de la competencia en la zona>",
    "estimado_competidores": <numero estimado>
  },
  "demanda": {
    "nivel": "<ALTA|MEDIA|BAJA>",
    "descripcion": "<descripcion de la demanda esperada>"
  },
  "inversion_estimada": {
    "min": <numero en pesos>,
    "max": <numero en pesos>,
    "descripcion": "<que incluye esta estimacion>"
  },
  "tiempo_apertura_meses": <numero>,
  "recomendacion_zona": "<recomendacion especifica sobre la zona o si sugiere otra zona>",
  "tip_clave": "<el consejo mas importante para este emprendedor especifico>"
}

Responde UNICAMENTE con el JSON, sin texto adicional. Se especifico y realista sobre la CDMX.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = response.content[0].text.trim()
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
