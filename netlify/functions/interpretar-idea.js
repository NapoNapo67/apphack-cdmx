const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Giros disponibles en el sistema
const GIROS = [
  'TAQUERIA','RESTAURANTE','BAR_CANTINA','PANADERIA','TIENDA_ABAR',
  'FARMACIA','SALON_BELL','TALLER_MEC','GIMNASIO','ESCUELA',
  'OFICINA','HOTEL','TIENDA_ROPA','FABRICA','CONSULTORIO',
  'TECH_STARTUP','VETERINARIA','FERRETERIA','LAVANDERIA','PAPELERIA',
]

// AlcaldÃ­as de CDMX
const ALCALDIAS = [
  'Azcapotzalco','CoyoacÃ¡n','Cuajimalpa','CuauhtÃ©moc','Gustavo A. Madero',
  'Iztacalco','Iztapalapa','Magdalena Contreras','Miguel Hidalgo','Milpa Alta',
  'Ãlvaro ObregÃ³n','TlÃ¡huac','Tlalpan','Venustiano Carranza','Xochimilco','Benito JuÃ¡rez',
]

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { texto } = JSON.parse(event.body)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analiza esta descripciÃ³n de un emprendedor mexicano y extrae informaciÃ³n estructurada.

Texto del emprendedor: "${texto}"

Responde ÃšNICAMENTE con JSON, sin texto adicional:
{
  "giro_clave": "<una de: ${GIROS.join(', ')} â€” elige la mÃ¡s cercana>",
  "alcaldia": "<una de: ${ALCALDIAS.join(', ')} â€” si no menciona ninguna, null>",
  "descripcion_refinada": "<reescribe su idea en 1 oraciÃ³n clara y concreta>",
  "palabras_clave": ["<keyword1>", "<keyword2>"]
}

Si no puedes identificar el giro con certeza, usa el mÃ¡s probable.`,
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

