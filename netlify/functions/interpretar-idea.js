import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const GIROS = [
  'TAQUERIA','RESTAURANTE','BAR_CANTINA','PANADERIA','TIENDA_ABAR',
  'FARMACIA','SALON_BELL','TALLER_MEC','GIMNASIO','ESCUELA',
  'OFICINA','HOTEL','TIENDA_ROPA','FABRICA','CONSULTORIO',
  'TECH_STARTUP','VETERINARIA','FERRETERIA','LAVANDERIA','PAPELERIA',
]

const ALCALDIAS = [
  'Azcapotzalco','Coyoacan','Cuajimalpa','Cuauhtemoc','Gustavo A. Madero',
  'Iztacalco','Iztapalapa','Magdalena Contreras','Miguel Hidalgo','Milpa Alta',
  'Alvaro Obregon','Tlahuac','Tlalpan','Venustiano Carranza','Xochimilco','Benito Juarez',
]

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { texto } = JSON.parse(event.body)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analiza esta descripcion de un emprendedor mexicano y extrae informacion estructurada.

Texto del emprendedor: "${texto}"

Responde UNICAMENTE con JSON, sin texto adicional:
{
  "giro_clave": "<una de: ${GIROS.join(', ')} - elige la mas cercana>",
  "alcaldia": "<una de: ${ALCALDIAS.join(', ')} - si no menciona ninguna, null>",
  "descripcion_refinada": "<reescribe su idea en 1 oracion clara y concreta>",
  "palabras_clave": ["<keyword1>", "<keyword2>"]
}

Si no puedes identificar el giro con certeza, usa el mas probable.`,
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
