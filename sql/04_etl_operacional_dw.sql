-- ============================================================
-- ETL IDEMPOTENTE: operacional → Data Warehouse
-- Carga/actualiza fact_consulta desde consulta_viabilidad
-- Seguro de ejecutar múltiples veces (INSERT ... ON CONFLICT)
-- ============================================================

-- 1) Asegurar que las dimensiones estén actualizadas desde catálogos
INSERT INTO dw.dim_giro (clave_giro, nombre, categoria, tipo_siapem, nivel_inversion, nivel_riesgo)
SELECT
  g.clave,
  g.nombre,
  c.nombre AS categoria,
  g.impacto_mercantil,
  g.nivel_inversion,
  CASE g.impacto_mercantil
    WHEN 'ZONAL'    THEN 'ALTO'
    WHEN 'VECINAL'  THEN 'MEDIO'
    ELSE 'BAJO'
  END
FROM public.cat_giro_negocio g
LEFT JOIN public.cat_categoria_giro c ON c.id = g.categoria_id
ON CONFLICT (clave_giro) DO UPDATE SET
  nombre          = EXCLUDED.nombre,
  categoria       = EXCLUDED.categoria,
  tipo_siapem     = EXCLUDED.tipo_siapem,
  nivel_inversion = EXCLUDED.nivel_inversion,
  nivel_riesgo    = EXCLUDED.nivel_riesgo;

INSERT INTO dw.dim_persona_juridica (clave, nombre, requiere_notario, complejidad)
SELECT
  clave, nombre, requiere_notario,
  CASE clave
    WHEN 'PF'   THEN 'BAJA'
    WHEN 'PFAE' THEN 'BAJA'
    WHEN 'SAS'  THEN 'MEDIA'
    ELSE 'ALTA'
  END
FROM public.cat_persona_juridica
ON CONFLICT (clave) DO UPDATE SET
  nombre           = EXCLUDED.nombre,
  requiere_notario = EXCLUDED.requiere_notario,
  complejidad      = EXCLUDED.complejidad;

INSERT INTO dw.dim_estado_tramite_neg (clave, nombre, color_hex, es_terminal)
SELECT clave, nombre, color_hex, es_terminal
FROM public.cat_estado_tramite
ON CONFLICT (clave) DO UPDATE SET
  nombre      = EXCLUDED.nombre,
  color_hex   = EXCLUDED.color_hex,
  es_terminal = EXCLUDED.es_terminal;

-- 2) ETL principal: consulta_viabilidad → fact_consulta
INSERT INTO dw.fact_consulta (
  id_consulta_origen,
  llave_mes,
  id_alcaldia,
  id_giro,
  id_persona_juridica,
  id_estado,
  score_viabilidad,
  nivel_viabilidad,
  inversion_estimada,
  dias_apertura_est,
  created_at
)
SELECT
  cv.id                                                     AS id_consulta_origen,
  -- llave_mes = YYYYMM (ej. 202506)
  (EXTRACT(YEAR FROM cv.created_at)::INT * 100 +
   EXTRACT(MONTH FROM cv.created_at)::INT)                  AS llave_mes,
  -- id_alcaldia: join por clave (cat_alcaldia.clave → dim_alcaldia.clave)
  da.id                                                     AS id_alcaldia,
  -- id_giro: buscar en dim_giro por clave
  dg.id                                                     AS id_giro,
  -- id_persona_juridica: buscar en dim_persona_juridica por clave
  dpj.id                                                    AS id_persona_juridica,
  -- id_estado: NUEVO por defecto (primera vez que se registra)
  det.id                                                    AS id_estado,
  cv.score_viabilidad,
  cv.nivel_viabilidad,
  NULL                                                      AS inversion_estimada,
  -- dias estimados del giro
  cgn.meses_tramite * 30                                    AS dias_apertura_est,
  cv.created_at
FROM public.consulta_viabilidad cv
LEFT JOIN public.cat_alcaldia        ca  ON ca.id        = cv.alcaldia_id
LEFT JOIN dw.dim_alcaldia            da  ON da.clave     = ca.clave
LEFT JOIN public.cat_giro_negocio    cgn ON cgn.id       = cv.giro_id
LEFT JOIN dw.dim_giro                dg  ON dg.clave_giro = cgn.clave
LEFT JOIN dw.dim_persona_juridica    dpj ON dpj.clave    = cv.tipo_persona_clave
LEFT JOIN dw.dim_estado_tramite_neg  det ON det.clave    = cv.nivel_viabilidad
ON CONFLICT (id_consulta_origen) DO UPDATE SET
  score_viabilidad  = EXCLUDED.score_viabilidad,
  nivel_viabilidad  = EXCLUDED.nivel_viabilidad,
  id_estado         = EXCLUDED.id_estado,
  dias_apertura_est = EXCLUDED.dias_apertura_est;

-- 3) Reporte de resultado del ETL
SELECT
  (SELECT COUNT(*) FROM public.consulta_viabilidad)       AS registros_origen,
  (SELECT COUNT(*) FROM dw.fact_consulta)                 AS registros_fact,
  (SELECT COUNT(*) FROM dw.dim_giro)                      AS dim_giros,
  (SELECT COUNT(*) FROM dw.dim_persona_juridica)          AS dim_personas,
  (SELECT COUNT(*) FROM dw.dim_estado_tramite_neg)        AS dim_estados,
  NOW()                                                   AS ejecutado_en,
  'ETL completado OK'                                     AS resultado;
