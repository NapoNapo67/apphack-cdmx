-- ═══════════════════════════════════════════════════════════
-- fact_dummy.sql — Tabla de hechos dummy para desarrollo
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema_base.sql
-- ═══════════════════════════════════════════════════════════

-- ─── Catálogo tipo (simula la dimensión de negocio principal) ───
CREATE TABLE IF NOT EXISTS public.cat_tipo_dummy (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT true,
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_tipo_dummy (clave, nombre, descripcion, orden) VALUES
  ('TIPO_A', 'Tipo Alpha',   'Primera categoría de proceso',   1),
  ('TIPO_B', 'Tipo Beta',    'Segunda categoría de proceso',   2),
  ('TIPO_C', 'Tipo Gamma',   'Tercera categoría de proceso',   3),
  ('TIPO_D', 'Tipo Delta',   'Cuarta categoría de proceso',    4),
  ('TIPO_E', 'Tipo Epsilon', 'Quinta categoría de proceso',    5)
ON CONFLICT DO NOTHING;

-- ─── Dimensión tipo en DW ───
CREATE TABLE IF NOT EXISTS dw.dim_tipo_dummy (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN DEFAULT true,
  version     INTEGER DEFAULT 1,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_fin    DATE
);

INSERT INTO dw.dim_tipo_dummy (clave, nombre, descripcion)
SELECT clave, nombre, descripcion FROM public.cat_tipo_dummy
ON CONFLICT (clave) DO UPDATE SET nombre = EXCLUDED.nombre;

-- ─── Tabla de hechos dummy ───
CREATE TABLE IF NOT EXISTS dw.fact_dummy (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Dimensión tiempo
  llave_dia        INTEGER REFERENCES dw.dim_tiempo_dia(llave_dia),
  llave_mes        INTEGER REFERENCES dw.dim_tiempo_mes(llave_mes),
  llave_trimestre  VARCHAR(7) REFERENCES dw.dim_tiempo_trimestre(llave_trimestre),
  -- Dimensión geográfica
  alcaldia_id      UUID REFERENCES dw.dim_alcaldia(id),
  -- Dimensión de negocio (tipo)
  tipo_id          UUID REFERENCES dw.dim_tipo_dummy(id),
  -- Dimensión estado
  estado_clave     VARCHAR(20) REFERENCES public.cat_estado_tramite(clave),
  -- Métricas
  cantidad         INTEGER NOT NULL DEFAULT 1,
  monto            NUMERIC(12,2),
  dias_resolucion  NUMERIC(5,1),
  -- Referencia operacional
  operacional_id   UUID,
  fecha_evento     DATE NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fact_dummy_mes        ON dw.fact_dummy(llave_mes);
CREATE INDEX IF NOT EXISTS idx_fact_dummy_trimestre  ON dw.fact_dummy(llave_trimestre);
CREATE INDEX IF NOT EXISTS idx_fact_dummy_alcaldia   ON dw.fact_dummy(alcaldia_id);
CREATE INDEX IF NOT EXISTS idx_fact_dummy_tipo       ON dw.fact_dummy(tipo_id);

-- ─── Poblar con 60 registros sintéticos (últimos 6 meses) ───
DO $$
DECLARE
  v_alcaldia_ids  UUID[];
  v_tipo_ids      UUID[];
  v_estados       VARCHAR[] := ARRAY['NUEVO','ASIGNADO','EN_PROCESO','RESUELTO','RESUELTO','RESUELTO','CANCELADO'];
  v_fecha         DATE;
  v_llave_dia     INTEGER;
  v_llave_mes     INTEGER;
  v_llave_trim    VARCHAR(7);
  v_alcaldia      UUID;
  v_tipo          UUID;
  v_estado        VARCHAR;
  v_dias          NUMERIC;
  i               INTEGER;
BEGIN
  -- Obtener IDs
  SELECT ARRAY(SELECT id FROM dw.dim_alcaldia ORDER BY random() LIMIT 16) INTO v_alcaldia_ids;
  SELECT ARRAY(SELECT id FROM dw.dim_tipo_dummy)                           INTO v_tipo_ids;

  -- Limpiar registros sintéticos previos
  DELETE FROM dw.fact_dummy WHERE operacional_id IS NULL;

  FOR i IN 1..60 LOOP
    -- Fecha aleatoria en los últimos 6 meses
    v_fecha     := CURRENT_DATE - (random() * 180)::INTEGER;
    v_llave_dia := TO_CHAR(v_fecha, 'YYYYMMDD')::INTEGER;
    v_llave_mes := TO_CHAR(v_fecha, 'YYYYMM')::INTEGER;
    v_llave_trim := EXTRACT(YEAR FROM v_fecha)::TEXT || 'T' || EXTRACT(QUARTER FROM v_fecha)::TEXT;

    -- Seleccionar dimensiones aleatorias
    v_alcaldia := v_alcaldia_ids[1 + (random() * (array_length(v_alcaldia_ids,1)-1))::INTEGER];
    v_tipo     := v_tipo_ids   [1 + (random() * (array_length(v_tipo_ids,1)-1))::INTEGER];
    v_estado   := v_estados    [1 + (random() * (array_length(v_estados,1)-1))::INTEGER];
    v_dias     := ROUND((random() * 25 + 1)::NUMERIC, 1);

    -- Solo registrar dias_resolucion si ya está resuelto
    IF v_estado NOT IN ('RESUELTO', 'CANCELADO') THEN v_dias := NULL; END IF;

    INSERT INTO dw.fact_dummy (
      llave_dia, llave_mes, llave_trimestre,
      alcaldia_id, tipo_id, estado_clave,
      cantidad, monto, dias_resolucion, fecha_evento
    ) VALUES (
      v_llave_dia, v_llave_mes, v_llave_trim,
      v_alcaldia, v_tipo, v_estado,
      1,
      ROUND((random() * 9000 + 1000)::NUMERIC, 2),
      v_dias,
      v_fecha
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════
-- VISTAS ANALÍTICAS — misma forma que tendrá el negocio real
-- ═══════════════════════════════════════════

-- Vista 1: KPIs ejecutivos
CREATE OR REPLACE VIEW dw.v_kpis AS
SELECT
  COUNT(*)                                                           AS total,
  COUNT(*) FILTER (WHERE estado_clave = 'RESUELTO')                 AS resueltos,
  COUNT(*) FILTER (WHERE estado_clave IN ('NUEVO','ASIGNADO','EN_PROCESO','PENDIENTE')) AS en_proceso,
  COUNT(*) FILTER (WHERE estado_clave = 'CANCELADO')                AS cancelados,
  ROUND(
    COUNT(*) FILTER (WHERE estado_clave = 'RESUELTO') * 100.0
    / NULLIF(COUNT(*), 0), 1
  )                                                                  AS pct_resueltos,
  ROUND(AVG(dias_resolucion) FILTER (WHERE dias_resolucion IS NOT NULL), 1) AS promedio_dias,
  COUNT(*) FILTER (
    WHERE llave_mes = TO_CHAR(CURRENT_DATE, 'YYYYMM')::INTEGER
  )                                                                  AS total_mes_actual,
  COUNT(*) FILTER (
    WHERE llave_mes = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYYMM')::INTEGER
  )                                                                  AS total_mes_anterior
FROM dw.fact_dummy;

-- Vista 2: Tendencia mensual (últimos 12 meses)
CREATE OR REPLACE VIEW dw.v_tendencia_mensual AS
SELECT
  m.llave_mes,
  m.mes_anio_etiqueta                                               AS periodo,
  COUNT(f.id)                                                       AS total,
  COUNT(f.id) FILTER (WHERE f.estado_clave = 'RESUELTO')           AS resueltos,
  ROUND(AVG(f.dias_resolucion) FILTER (WHERE f.dias_resolucion IS NOT NULL), 1) AS promedio_dias
FROM dw.dim_tiempo_mes m
LEFT JOIN dw.fact_dummy f ON f.llave_mes = m.llave_mes
WHERE m.llave_mes >= TO_CHAR(CURRENT_DATE - INTERVAL '11 months', 'YYYYMM')::INTEGER
  AND m.llave_mes <= TO_CHAR(CURRENT_DATE, 'YYYYMM')::INTEGER
GROUP BY m.llave_mes, m.mes_anio_etiqueta
ORDER BY m.llave_mes;

-- Vista 3: Por alcaldía
CREATE OR REPLACE VIEW dw.v_por_alcaldia AS
SELECT
  a.nombre                                                          AS alcaldia,
  a.nombre_corto,
  COUNT(f.id)                                                       AS total,
  COUNT(f.id) FILTER (WHERE f.estado_clave = 'RESUELTO')           AS resueltos,
  ROUND(
    COUNT(f.id) FILTER (WHERE f.estado_clave = 'RESUELTO') * 100.0
    / NULLIF(COUNT(f.id), 0), 1
  )                                                                  AS pct_resueltos,
  ROUND(AVG(f.dias_resolucion) FILTER (WHERE f.dias_resolucion IS NOT NULL), 1) AS promedio_dias
FROM dw.dim_alcaldia a
LEFT JOIN dw.fact_dummy f ON f.alcaldia_id = a.id
GROUP BY a.id, a.nombre, a.nombre_corto
HAVING COUNT(f.id) > 0
ORDER BY total DESC;

-- Vista 4: Por tipo (dimensión de negocio principal)
CREATE OR REPLACE VIEW dw.v_por_tipo AS
SELECT
  t.nombre                                                          AS tipo,
  t.clave,
  COUNT(f.id)                                                       AS total,
  COUNT(f.id) FILTER (WHERE f.estado_clave = 'RESUELTO')           AS resueltos,
  ROUND(
    COUNT(f.id) FILTER (WHERE f.estado_clave = 'RESUELTO') * 100.0
    / NULLIF(COUNT(f.id), 0), 1
  )                                                                  AS pct_resueltos,
  ROUND(AVG(f.dias_resolucion) FILTER (WHERE f.dias_resolucion IS NOT NULL), 1) AS promedio_dias
FROM dw.dim_tipo_dummy t
LEFT JOIN dw.fact_dummy f ON f.tipo_id = t.id
GROUP BY t.id, t.nombre, t.clave
ORDER BY total DESC;

-- Vista 5: Por estado
CREATE OR REPLACE VIEW dw.v_por_estado AS
SELECT
  e.clave,
  e.nombre,
  e.color_hex,
  COUNT(f.id)                                                       AS total,
  ROUND(COUNT(f.id) * 100.0 / NULLIF(SUM(COUNT(f.id)) OVER (), 0), 1) AS porcentaje
FROM public.cat_estado_tramite e
LEFT JOIN dw.fact_dummy f ON f.estado_clave = e.clave
GROUP BY e.id, e.clave, e.nombre, e.color_hex, e.orden
ORDER BY e.orden;

-- ─── RLS: vistas son públicas para lectura ───
ALTER TABLE dw.fact_dummy    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.dim_tipo_dummy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tipo_dummy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura fact_dummy"     ON dw.fact_dummy;
DROP POLICY IF EXISTS "Lectura dim_tipo_dummy" ON dw.dim_tipo_dummy;
DROP POLICY IF EXISTS "Lectura cat_tipo_dummy" ON public.cat_tipo_dummy;

CREATE POLICY "Lectura fact_dummy"     ON dw.fact_dummy     FOR SELECT USING (true);
CREATE POLICY "Inserción fact_dummy"   ON dw.fact_dummy     FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura dim_tipo_dummy" ON dw.dim_tipo_dummy FOR SELECT USING (true);
CREATE POLICY "Lectura cat_tipo_dummy" ON public.cat_tipo_dummy FOR SELECT USING (true);
