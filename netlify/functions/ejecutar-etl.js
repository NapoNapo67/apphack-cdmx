// Netlify Function: ejecuta el ETL manual operacional → DW
// Llama directamente a la Management API de Supabase

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const PAT = process.env.SUPABASE_PAT
  const REF = process.env.SUPABASE_REF || 'emyoqloretqdoqskgqho'
  if (!PAT) return { statusCode: 503, body: JSON.stringify({ error: 'SUPABASE_PAT no configurado' }) }

  const URL = `https://api.supabase.com/v1/projects/${REF}/database/query`
  const inicio = Date.now()

  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `
        -- ETL manual: sincroniza todos los registros pendientes
        WITH upserted AS (
          INSERT INTO dw.fact_consulta (
            id_consulta_origen, llave_mes, id_alcaldia, id_giro,
            id_persona_juridica, id_estado, score_viabilidad, nivel_viabilidad,
            dias_apertura_est, created_at,
            edad, genero, grado_estudios, es_primer_negocio,
            situacion_laboral, fuente_financiamiento, id_alcaldia_residencia
          )
          SELECT
            cv.id,
            (EXTRACT(YEAR FROM cv.created_at)::INT * 100 + EXTRACT(MONTH FROM cv.created_at)::INT),
            da.id, dg.id, dpj.id,
            COALESCE(det.id, (SELECT id FROM dw.dim_estado_tramite_neg WHERE clave='NUEVO' LIMIT 1)),
            cv.score_viabilidad, cv.nivel_viabilidad,
            COALESCE(cgn.meses_tramite * 30, 90), cv.created_at,
            cv.edad, cv.genero, cv.grado_estudios, cv.es_primer_negocio,
            cv.situacion_laboral, cv.fuente_financiamiento, cv.alcaldia_residencia_id
          FROM public.consulta_viabilidad cv
          LEFT JOIN public.cat_alcaldia         ca  ON ca.id        = cv.alcaldia_id
          LEFT JOIN dw.dim_alcaldia             da  ON da.clave     = ca.clave
          LEFT JOIN public.cat_giro_negocio     cgn ON cgn.id       = cv.giro_id
          LEFT JOIN dw.dim_giro                 dg  ON dg.clave_giro = cgn.clave
          LEFT JOIN dw.dim_persona_juridica     dpj ON dpj.clave    = cv.tipo_persona_clave
          LEFT JOIN dw.dim_estado_tramite_neg   det ON det.clave    = cv.nivel_viabilidad
          ON CONFLICT (id_consulta_origen) DO UPDATE SET
            score_viabilidad  = EXCLUDED.score_viabilidad,
            nivel_viabilidad  = EXCLUDED.nivel_viabilidad,
            id_estado         = EXCLUDED.id_estado,
            edad              = EXCLUDED.edad,
            genero            = EXCLUDED.genero,
            grado_estudios    = EXCLUDED.grado_estudios,
            es_primer_negocio = EXCLUDED.es_primer_negocio,
            situacion_laboral = EXCLUDED.situacion_laboral,
            fuente_financiamiento = EXCLUDED.fuente_financiamiento
          RETURNING id
        )
        SELECT COUNT(*) AS procesados FROM upserted;
      `}),
    })

    const data = await res.json()
    const ms = Date.now() - inicio
    const procesados = Array.isArray(data) ? parseInt(data[0]?.procesados || 0) : 0

    // Registrar en log
    await fetch(URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `
        INSERT INTO dw.etl_log (tipo, origen, registros_procesados, registros_insertados, duracion_ms, estado)
        VALUES ('MANUAL', 'consulta_viabilidad', ${procesados}, ${procesados}, ${ms}, 'OK')
      `}),
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, insertados: procesados, actualizados: 0, ms }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
