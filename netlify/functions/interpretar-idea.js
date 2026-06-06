import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Giros disponibles en el sistema
const GIROS = [
  'TAQUERIA','RESTAURANTE','BAR_CANTINA','PANADERIA','TIENDA_ABAR',
  'FARMACIA','SALON_BELL','TALLER_MEC','GIMNASIO','ESCUELA',
  'OFICINA','HOTEL','TIENDA_ROPA','FABRICA','CONSULTORIO',
  'TECH_STARTUP','VETERINARIA','FERRETERIA','LAVANDERIA','PAPELERIA',
]

// Alcaldías de CDMX
const ALCALDIAS = [
  'Azcapotzalco','Coyoacán','Cuajimalpa','Cuauhtémoc','Gustavo A. Madero',
  'Iztacalco','Iztapalapa','Magdalena Contreras','Miguel Hidalgo','Milpa Alta',
  'Álvaro Obregón','Tláhuac','Tlalpan','Venustiano Carranza','Xochimilco','Benito Juárez',
]

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { texto } = JSON.parse(event.body)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analiza esta descripción de un emprendedor mexicano y extrae información estructurada.

Texto del emprendedor: "${texto}"

Responde ÚNICAMENTE con JSON, sin texto adicional:
{
  "giro_clave": "<una de: ${GIROS.join(', ')} — elige la más cercana>",
  "alcaldia": "<una de: ${ALCALDIAS.join(', ')} — si no menciona ninguna, null>",
  "descripcion_refinada": "<reescribe su idea en 1 oración clara y concreta>",
  "palabras_clave": ["<keyword1>", "<keyword2>"]
}

Si no puedes identificar el giro con certeza, usa el más probable.`,
      }],
    })

    const texto_resp = response.content[0].text.trim()
    const jsonMatch = texto_resp.match(/\{[\s\S]*\}/)
    const resultado = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(texto_resp)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultado),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
