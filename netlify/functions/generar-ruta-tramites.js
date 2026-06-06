import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  try {
    const { giro, tipo_persona, alcaldia, tramites_disponibles, programas_disponibles } = JSON.parse(event.body)

    const impacto = giro.impacto_mercantil || 'BAJO'
    const formatoSIAPEM = giro.formato_siapem || 'EM-03'
    const impactoDesc = {
      BAJO:    'Bajo Impacto (Art. 35 LEM) -> EM-03, GRATUITO, opera al dia siguiente',
      VECINAL: 'Impacto Vecinal (Art. 19 LEM) -> EM-11, requiere pago de derechos',
      ZONAL:   'Impacto Zonal (Art. 27 Bis LEM) -> EM-08, requiere APROBACION de la Alcaldia (no es automatico)',
    }[impacto]

    const prompt = `Eres un experto en tramites mercantiles de la Ciudad de Mexico. Conoces a fondo la Ley de Establecimientos Mercantiles (LEM), el SIAPEM, SEDUVI, SAT, COFEPRIS e IMSS.

CLASIFICACION SIAPEM (LEM):
- EM-03: Bajo Impacto (Art. 35) -> gratuito, opera al dia siguiente, para abarrotes/esteticas/papelerias/fondas/oficinas
- EM-11: Impacto Vecinal (Art. 19) -> pago de derechos, para restaurantes/hoteles/salones de fiesta
- EM-08: Impacto Zonal (Art. 27 Bis) -> PERMISO que DEBE SER APROBADO por la Alcaldia, para bares/cantinas/antros/discotecas

PROTECCION CIVIL: NO se requiere si el local tiene menos de 100 personas Y hasta 250 m2 (Art. 10, A, X, LEM)

PRIMER DOCUMENTO SIEMPRE: Certificado Unico de Zonificacion de Uso de Suelo (SEDUVI, vigencia max 1 ano)

Un emprendedor quiere abrir:
- Giro: ${giro.nombre} (${giro.clave})
- Clasificacion de impacto mercantil: ${impactoDesc}
- Formato SIAPEM que le corresponde: ${formatoSIAPEM}
- Estructura legal: ${tipo_persona.nombre} (${tipo_persona.clave})
- Alcaldia: ${alcaldia.nombre}
- Requiere licencia de alcohol?: ${giro.clave === 'BAR_CANTINA' ? 'SI' : 'NO'}
- Riesgo sanitario?: ${giro.riesgo_sanitario || 'BAJO'}

TRAMITES DISPONIBLES EN EL SISTEMA:
${tramites_disponibles.map(t => `- [${t.clave}] ${t.nombre} | ${t.costo_descripcion} | ${t.plazo_dias} dias habiles`).join('\n')}

PROGRAMAS DE APOYO DISPONIBLES:
${programas_disponibles.map(p => `- [${p.clave}] ${p.nombre} | ${p.monto_descripcion}`).join('\n')}

Genera una respuesta JSON con exactamente este formato:

{
  "ruta": [
    {
      "paso": 1,
      "clave_tramite": "<clave exacta del tramite>",
      "nombre": "<nombre del tramite>",
      "por_que": "<por que este paso en este momento>",
      "tip": "<consejo practico especifico para este emprendedor>",
      "es_paralelo": false,
      "semana_inicio": 1
    }
  ],
  "programas_recomendados": [
    {
      "clave_programa": "<clave exacta>",
      "nombre": "<nombre>",
      "por_que": "<por que aplica a este emprendedor>"
    }
  ],
  "resumen_cronograma": "<descripcion de cuanto tiempo toma todo el proceso>",
  "costo_total_estimado": {
    "min": <numero>,
    "max": <numero>,
    "nota": "<que incluye>"
  },
  "primer_paso_hoy": "<que puede hacer el emprendedor HOY MISMO para empezar>"
}

Usa solo claves que existan en la lista de tramites disponibles. Responde UNICAMENTE con el JSON.`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
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
