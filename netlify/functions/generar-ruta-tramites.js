import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { giro, tipo_persona, alcaldia, tramites_disponibles, programas_disponibles } = JSON.parse(event.body)

    // Determinar tipo de impacto mercantil y formato SIAPEM correcto
    const impacto = giro.impacto_mercantil || 'BAJO'
    const formatoSIAPEM = giro.formato_siapem || 'EM-03'
    const impactoDesc = {
      BAJO:    'Bajo Impacto (Art. 35 LEM) → EM-03, GRATUITO, opera al día siguiente',
      VECINAL: 'Impacto Vecinal (Art. 19 LEM) → EM-11, requiere pago de derechos',
      ZONAL:   'Impacto Zonal (Art. 27 Bis LEM) → EM-08, requiere APROBACIÓN de la Alcaldía (no es automático)',
    }[impacto]

    const prompt = `Eres un experto en trámites mercantiles de la Ciudad de México. Conoces a fondo la Ley de Establecimientos Mercantiles (LEM), el SIAPEM, SEDUVI, SAT, COFEPRIS e IMSS.

CLASIFICACIÓN SIAPEM (LEM):
- EM-03: Bajo Impacto (Art. 35) → gratuito, opera al día siguiente, para abarrotes/estéticas/papelerías/fondas/oficinas
- EM-11: Impacto Vecinal (Art. 19) → pago de derechos, para restaurantes/hoteles/salones de fiesta
- EM-08: Impacto Zonal (Art. 27 Bis) → PERMISO que DEBE SER APROBADO por la Alcaldía, para bares/cantinas/antros/discotecas

PROTECCIÓN CIVIL: NO se requiere si el local tiene <100 personas Y ≤250 m² (Art. 10, A, X, LEM)

PRIMER DOCUMENTO SIEMPRE: Certificado Único de Zonificación de Uso de Suelo (SEDUVI, vigencia máx 1 año)

Un emprendedor quiere abrir:
- Giro: ${giro.nombre} (${giro.clave})
- Clasificación de impacto mercantil: ${impactoDesc}
- Formato SIAPEM que le corresponde: ${formatoSIAPEM}
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
