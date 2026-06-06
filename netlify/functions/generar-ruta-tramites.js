const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { giro, tipo_persona, alcaldia, tramites_disponibles, programas_disponibles } = JSON.parse(event.body)

    // Determinar tipo de impacto mercantil y formato SIAPEM correcto
    const impacto = giro.impacto_mercantil || 'BAJO'
    const formatoSIAPEM = giro.formato_siapem || 'EM-03'
    const impactoDesc = {
      BAJO:    'Bajo Impacto (Art. 35 LEM) â†’ EM-03, GRATUITO, opera al dÃ­a siguiente',
      VECINAL: 'Impacto Vecinal (Art. 19 LEM) â†’ EM-11, requiere pago de derechos',
      ZONAL:   'Impacto Zonal (Art. 27 Bis LEM) â†’ EM-08, requiere APROBACIÃ“N de la AlcaldÃ­a (no es automÃ¡tico)',
    }[impacto]

    const prompt = `Eres un experto en trÃ¡mites mercantiles de la Ciudad de MÃ©xico. Conoces a fondo la Ley de Establecimientos Mercantiles (LEM), el SIAPEM, SEDUVI, SAT, COFEPRIS e IMSS.

CLASIFICACIÃ“N SIAPEM (LEM):
- EM-03: Bajo Impacto (Art. 35) â†’ gratuito, opera al dÃ­a siguiente, para abarrotes/estÃ©ticas/papelerÃ­as/fondas/oficinas
- EM-11: Impacto Vecinal (Art. 19) â†’ pago de derechos, para restaurantes/hoteles/salones de fiesta
- EM-08: Impacto Zonal (Art. 27 Bis) â†’ PERMISO que DEBE SER APROBADO por la AlcaldÃ­a, para bares/cantinas/antros/discotecas

PROTECCIÃ“N CIVIL: NO se requiere si el local tiene <100 personas Y â‰¤250 mÂ² (Art. 10, A, X, LEM)

PRIMER DOCUMENTO SIEMPRE: Certificado Ãšnico de ZonificaciÃ³n de Uso de Suelo (SEDUVI, vigencia mÃ¡x 1 aÃ±o)

Un emprendedor quiere abrir:
- Giro: ${giro.nombre} (${giro.clave})
- ClasificaciÃ³n de impacto mercantil: ${impactoDesc}
- Formato SIAPEM que le corresponde: ${formatoSIAPEM}
- Estructura legal: ${tipo_persona.nombre} (${tipo_persona.clave})
- AlcaldÃ­a: ${alcaldia.nombre}
- Â¿Requiere licencia de alcohol?: ${giro.clave === 'BAR_CANTINA' ? 'SÃ' : 'NO'}
- Â¿Riesgo sanitario?: ${giro.riesgo_sanitario || 'BAJO'}

TRÃMITES DISPONIBLES EN EL SISTEMA:
${tramites_disponibles.map(t => `- [${t.clave}] ${t.nombre} | ${t.costo_descripcion} | ${t.plazo_dias} dÃ­as hÃ¡biles`).join('\n')}

PROGRAMAS DE APOYO DISPONIBLES:
${programas_disponibles.map(p => `- [${p.clave}] ${p.nombre} | ${p.monto_descripcion}`).join('\n')}

Genera una respuesta JSON con exactamente este formato:

{
  "ruta": [
    {
      "paso": 1,
      "clave_tramite": "<clave exacta del tramite>",
      "nombre": "<nombre del trÃ¡mite>",
      "por_que": "<por quÃ© este paso en este momento>",
      "tip": "<consejo prÃ¡ctico especÃ­fico para este emprendedor>",
      "es_paralelo": false,
      "semana_inicio": 1
    }
  ],
  "programas_recomendados": [
    {
      "clave_programa": "<clave exacta>",
      "nombre": "<nombre>",
      "por_que": "<por quÃ© aplica a este emprendedor>"
    }
  ],
  "resumen_cronograma": "<descripciÃ³n de cuÃ¡nto tiempo toma todo el proceso>",
  "costo_total_estimado": {
    "min": <nÃºmero>,
    "max": <nÃºmero>,
    "nota": "<quÃ© incluye>"
  },
  "primer_paso_hoy": "<quÃ© puede hacer el emprendedor HOY MISMO para empezar>"
}

Usa solo claves que existan en la lista de trÃ¡mites disponibles. Responde ÃšNICAMENTE con el JSON.`

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

