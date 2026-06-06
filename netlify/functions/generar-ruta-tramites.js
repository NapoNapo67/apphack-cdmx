import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { giro, tipo_persona, alcaldia, tramites_disponibles, programas_disponibles } = JSON.parse(event.body)

    const prompt = `Eres un experto en trámites mercantiles de la Ciudad de México. Conoces a fondo el RETYS, SIAPEM, la Ley de Establecimientos Mercantiles y los procesos de SEDUVI, SAT, COFEPRIS e IMSS.

Un emprendedor quiere abrir:
- Giro: ${giro.nombre} (${giro.clave})
- Estructura legal: ${tipo_persona.nombre} (${tipo_persona.clave})
- Alcaldía: ${alcaldia.nombre}
- ¿Requiere licencia de alcohol?: ${giro.clave === 'BAR_CANTINA' ? 'SÍ' : 'NO'}
- ¿Riesgo sanitario?: ${giro.riesgo_sanitario || 'BAJO'}

TRÁMITES DISPONIBLES EN EL SISTEMA:
${tramites_disponibles.map(t => `- [${t.clave}] ${t.nombre} | ${t.costo_descripcion} | ${t.plazo_dias} días hábiles`).join('\n')}

PROGRAMAS DE APOYO DISPONIBLES:
${programas_disponibles.map(p => `- [${p.clave}] ${p.nombre} | ${p.monto_descripcion}`).join('\n')}

Genera una respuesta JSON con exactamente este formato:

{
  "ruta": [
    {
      "paso": 1,
      "clave_tramite": "<clave exacta del tramite>",
      "nombre": "<nombre del trámite>",
      "por_que": "<por qué este paso en este momento>",
      "tip": "<consejo práctico específico para este emprendedor>",
      "es_paralelo": false,
      "semana_inicio": 1
    }
  ],
  "programas_recomendados": [
    {
      "clave_programa": "<clave exacta>",
      "nombre": "<nombre>",
      "por_que": "<por qué aplica a este emprendedor>"
    }
  ],
  "resumen_cronograma": "<descripción de cuánto tiempo toma todo el proceso>",
  "costo_total_estimado": {
    "min": <número>,
    "max": <número>,
    "nota": "<qué incluye>"
  },
  "primer_paso_hoy": "<qué puede hacer el emprendedor HOY MISMO para empezar>"
}

Usa solo claves que existan en la lista de trámites disponibles. Responde ÚNICAMENTE con el JSON.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = response.content[0].text.trim()
    const jsonMatch = texto.match(/\{[\s\S]*\}/)
    const resultado = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(texto)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultado }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
