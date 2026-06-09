-- ============================================================
-- DW: Completar tablas faltantes y crear vistas analíticas
-- (dim_tiempo_* y dim_alcaldia ya existen con datos)
-- ============================================================

-- ── NUEVAS DIMENSIONES ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS dw.dim_giro (
  id              SERIAL PRIMARY KEY,
  clave_giro      VARCHAR(20) UNIQUE NOT NULL,
  nombre          VARCHAR(100),
  categoria       VARCHAR(60),
  tipo_siapem     VARCHAR(10),
  nivel_inversion VARCHAR(10),
  nivel_riesgo    VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS dw.dim_persona_juridica (
  id               SERIAL PRIMARY KEY,
  clave            VARCHAR(10) UNIQUE NOT NULL,
  nombre           VARCHAR(80),
  requiere_notario BOOLEAN,
  complejidad      VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS dw.dim_estado_tramite_neg (
  id          SERIAL PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(60),
  color_hex   CHAR(7),
  es_terminal BOOLEAN
);

-- ── TABLA DE HECHOS ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dw.fact_consulta (
  id                   BIGSERIAL PRIMARY KEY,
  id_consulta_origen   UUID UNIQUE,
  llave_mes            INT,
  id_alcaldia          UUID,
  id_giro              INT,
  id_persona_juridica  INT,
  id_estado            INT,
  score_viabilidad     NUMERIC(5,2),
  nivel_viabilidad     VARCHAR(10),
  inversion_estimada   NUMERIC(12,2),
  dias_apertura_est    SMALLINT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fact_mes      ON dw.fact_consulta(llave_mes);
CREATE INDEX IF NOT EXISTS idx_fact_alcaldia ON dw.fact_consulta(id_alcaldia);
CREATE INDEX IF NOT EXISTS idx_fact_giro     ON dw.fact_consulta(id_giro);

-- ── POBLAR NUEVAS DIMENSIONES ────────────────────────────────

INSERT INTO dw.dim_giro (clave_giro, nombre, tipo_siapem, nivel_inversion, nivel_riesgo)
SELECT clave, nombre, impacto_mercantil, nivel_inversion,
  CASE impacto_mercantil WHEN 'ZONAL' THEN 'ALTO' WHEN 'VECINAL' THEN 'MEDIO' ELSE 'BAJO' END
FROM public.cat_giro_negocio
ON CONFLICT (clave_giro) DO NOTHING;

INSERT INTO dw.dim_persona_juridica (clave, nombre, requiere_notario, complejidad)
SELECT clave, nombre, requiere_notario,
  CASE clave WHEN 'PF' THEN 'BAJA' WHEN 'PFAE' THEN 'BAJA' WHEN 'SAS' THEN 'MEDIA' ELSE 'ALTA' END
FROM public.cat_persona_juridica
ON CONFLICT (clave) DO NOTHING;

INSERT INTO dw.dim_estado_tramite_neg (clave, nombre, color_hex, es_terminal)
SELECT clave, nombre, color_hex, es_terminal
FROM public.cat_estado_tramite
ON CONFLICT (clave) DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE dw.dim_giro             ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.dim_persona_juridica ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.dim_estado_tramite_neg ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.fact_consulta        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dw select giro"      ON dw.dim_giro;
DROP POLICY IF EXISTS "dw select persona"   ON dw.dim_persona_juridica;
DROP POLICY IF EXISTS "dw select estado_n"  ON dw.dim_estado_tramite_neg;
DROP POLICY IF EXISTS "dw select fact"      ON dw.fact_consulta;
DROP POLICY IF EXISTS "dw insert fact"      ON dw.fact_consulta;

CREATE POLICY "dw select giro"      ON dw.dim_giro             FOR SELECT USING (true);
CREATE POLICY "dw select persona"   ON dw.dim_persona_juridica FOR SELECT USING (true);
CREATE POLICY "dw select estado_n"  ON dw.dim_estado_tramite_neg FOR SELECT USING (true);
CREATE POLICY "dw select fact"      ON dw.fact_consulta        FOR SELECT USING (true);
CREATE POLICY "dw insert fact"      ON dw.fact_consulta        FOR INSERT WITH CHECK (true);

-- ── VISTAS ANALÍTICAS ────────────────────────────────────────

CREATE OR REPLACE VIEW dw.v_kpi_ejecutivo AS
SELECT
  COUNT(*)                                                                                                    AS total,
  COUNT(*) FILTER (WHERE nivel_viabilidad IN ('ALTO','MEDIO'))                                               AS resueltos,
  ROUND(COUNT(*) FILTER (WHERE nivel_viabilidad IN ('ALTO','MEDIO')) * 100.0 / NULLIF(COUNT(*),0), 1)       AS pct_resueltos,
  ROUND(AVG(dias_apertura_est), 1)                                                                           AS promedio_dias,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()))                      AS total_mes_actual,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')) AS total_mes_anterior
FROM dw.fact_consulta;

CREATE OR REPLACE VIEW dw.v_tendencia_mensual AS
SELECT
  m.llave_mes                                                     AS id_mes,
  m.anio,
  m.mes,
  m.mes_nombre                                                    AS nombre_mes,
  m.trimestre_etiqueta                                            AS trimestre,
  m.mes_anio_etiqueta                                             AS periodo,
  COUNT(f.id)                                                     AS total,
  COUNT(f.id) FILTER (WHERE f.nivel_viabilidad IN ('ALTO','MEDIO')) AS resueltos,
  ROUND(AVG(f.score_viabilidad), 1)                               AS score_promedio
FROM dw.dim_tiempo_mes m
LEFT JOIN dw.fact_consulta f ON f.llave_mes = m.llave_mes
WHERE m.anio BETWEEN 2025 AND 2030
GROUP BY m.llave_mes, m.anio, m.mes, m.mes_nombre, m.trimestre_etiqueta, m.mes_anio_etiqueta
ORDER BY m.llave_mes;

CREATE OR REPLACE VIEW dw.v_por_alcaldia AS
SELECT
  a.clave, a.nombre, a.nombre_corto,
  COUNT(f.id)                                                                                                  AS total,
  ROUND(AVG(f.score_viabilidad), 1)                                                                            AS score_promedio,
  ROUND(COUNT(f.id) FILTER (WHERE f.nivel_viabilidad IN ('ALTO','MEDIO')) * 100.0 / NULLIF(COUNT(f.id),0), 1) AS pct_resueltos,
  ROUND(AVG(f.dias_apertura_est), 1)                                                                           AS promedio_dias
FROM dw.dim_alcaldia a
LEFT JOIN dw.fact_consulta f ON f.id_alcaldia = a.id
GROUP BY a.id, a.clave, a.nombre, a.nombre_corto
ORDER BY total DESC;

CREATE OR REPLACE VIEW dw.v_por_tipo_giro AS
SELECT
  g.clave_giro AS clave, g.nombre AS tipo, g.tipo_siapem, g.nivel_riesgo,
  COUNT(f.id)                                                                                                  AS total,
  ROUND(AVG(f.score_viabilidad), 1)                                                                            AS score_promedio,
  ROUND(COUNT(f.id) FILTER (WHERE f.nivel_viabilidad IN ('ALTO','MEDIO')) * 100.0 / NULLIF(COUNT(f.id),0), 1) AS pct_resueltos,
  ROUND(AVG(f.dias_apertura_est), 1)                                                                           AS promedio_dias
FROM dw.dim_giro g
LEFT JOIN dw.fact_consulta f ON f.id_giro = g.id
GROUP BY g.id, g.clave_giro, g.nombre, g.tipo_siapem, g.nivel_riesgo
ORDER BY total DESC;

CREATE OR REPLACE VIEW dw.v_por_estado AS
SELECT
  e.clave, e.nombre, e.color_hex, e.es_terminal,
  COUNT(f.id)                                                                   AS total,
  ROUND(COUNT(f.id) * 100.0 / NULLIF(SUM(COUNT(f.id)) OVER (), 0), 1)          AS porcentaje
FROM dw.dim_estado_tramite_neg e
LEFT JOIN dw.fact_consulta f ON f.id_estado = e.id
GROUP BY e.id, e.clave, e.nombre, e.color_hex, e.es_terminal
ORDER BY total DESC;

SELECT
  (SELECT COUNT(*) FROM dw.dim_giro)              AS dim_giros,
  (SELECT COUNT(*) FROM dw.dim_persona_juridica)  AS dim_personas,
  (SELECT COUNT(*) FROM dw.dim_estado_tramite_neg)AS dim_estados,
  (SELECT COUNT(*) FROM dw.dim_tiempo_mes)        AS dim_meses_existentes,
  (SELECT COUNT(*) FROM dw.dim_tiempo_dia)        AS dim_dias_existentes,
  (SELECT COUNT(*) FROM dw.dim_alcaldia)          AS dim_alcaldias_existentes,
  'DW completo OK' AS resultado;
