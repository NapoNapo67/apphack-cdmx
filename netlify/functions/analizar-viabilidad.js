import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { giro, alcaldia, tipo_persona, contexto_giro } = JSON.parse(event.body)

    const prompt = `Analiza la viabilidad de este negocio en CDMX y responde SOLO con JSON valido.

Negocio: ${giro.nombre} en ${alcaldia.nombre}
Descripcion: "${giro.descripcion_libre || 'Sin descripcion'}"
Persona juridica: ${tipo_persona?.nombre || 'No especificada'}
Inversion requerida: ${contexto_giro?.nivel_inversion || 'MEDIO'}
Meses de tramite: ${contexto_giro?.meses_tramite || 2}
Usos suelo OK: ${(giro.uso_suelo_ok || ['COM','MIX']).join(',')}

Responde SOLO este JSON sin texto adicional:
{
  "score": 72,
  "nivel": "MEDIO",
  "resumen": "2-3 oraciones ejecutivas sobre viabilidad real en esta alcaldia",
  "uso_suelo_compatible": true,
  "uso_suelo_explicacion": "explicacion breve",
  "oportunidades": ["op1","op2","op3"],
  "riesgos": ["riesgo1","riesgo2","riesgo3"],
  "competencia": {"nivel":"MEDIA","descripcion":"breve","estimado_competidores": 5},
  "demanda": {"nivel":"ALTA","descripcion":"breve"},
  "inversion_estimada": {"min":150000,"max":400000,"descripcion":"incluye..."},
  "tiempo_apertura_meses": 2,
  "recomendacion_zona": "consejo sobre la zona o mejor zona alternativa",
  "tip_clave": "el consejo mas importante para este emprendedor"
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 900,
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
