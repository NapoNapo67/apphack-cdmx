-- ═══════════════════════════════════════════════════════════
-- AppHack CDMX — Esquema Base
-- Ejecutar una sola vez en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS dw;

-- ═══════════════════════════════════════════
-- DIMENSIÓN TIEMPO — GRANULARIDAD DÍA
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_dia (
  llave_dia        INTEGER PRIMARY KEY,
  fecha            DATE UNIQUE NOT NULL,
  llave_mes        INTEGER NOT NULL,
  llave_bimestre   VARCHAR(7) NOT NULL,
  llave_trimestre  VARCHAR(7) NOT NULL,
  llave_semestre   VARCHAR(7) NOT NULL,
  llave_anio       INTEGER NOT NULL,
  anio             INTEGER NOT NULL,
  semestre         INTEGER NOT NULL,
  trimestre        INTEGER NOT NULL,
  bimestre         INTEGER NOT NULL,
  mes              INTEGER NOT NULL,
  mes_nombre       VARCHAR(20) NOT NULL,
  mes_abrev        VARCHAR(5) NOT NULL,
  semana_anio      INTEGER NOT NULL,
  dia_mes          INTEGER NOT NULL,
  dia_anio         INTEGER NOT NULL,
  dia_semana       INTEGER NOT NULL,
  dia_semana_nombre VARCHAR(20) NOT NULL,
  dia_semana_abrev  VARCHAR(5) NOT NULL,
  es_fin_semana    BOOLEAN NOT NULL DEFAULT false,
  es_dia_habil     BOOLEAN NOT NULL DEFAULT true,
  es_festivo_mx    BOOLEAN NOT NULL DEFAULT false,
  nombre_festivo   VARCHAR(100),
  dia_etiqueta     VARCHAR(20),
  mes_anio_etiqueta VARCHAR(20),
  trimestre_etiqueta VARCHAR(20),
  semestre_etiqueta  VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_mes (
  llave_mes        INTEGER PRIMARY KEY,
  llave_bimestre   VARCHAR(7) NOT NULL,
  llave_trimestre  VARCHAR(7) NOT NULL,
  llave_semestre   VARCHAR(7) NOT NULL,
  llave_anio       INTEGER NOT NULL,
  anio             INTEGER NOT NULL,
  mes              INTEGER NOT NULL,
  mes_nombre       VARCHAR(20) NOT NULL,
  mes_abrev        VARCHAR(5) NOT NULL,
  bimestre         INTEGER NOT NULL,
  trimestre        INTEGER NOT NULL,
  semestre         INTEGER NOT NULL,
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL,
  dias_calendario  INTEGER NOT NULL,
  dias_habiles     INTEGER,
  mes_anio_etiqueta   VARCHAR(20),
  trimestre_etiqueta  VARCHAR(20),
  semestre_etiqueta   VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_trimestre (
  llave_trimestre  VARCHAR(7) PRIMARY KEY,
  llave_semestre   VARCHAR(7) NOT NULL,
  llave_anio       INTEGER NOT NULL,
  anio             INTEGER NOT NULL,
  trimestre        INTEGER NOT NULL,
  semestre         INTEGER NOT NULL,
  mes_inicio       INTEGER NOT NULL,
  mes_fin          INTEGER NOT NULL,
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL,
  trimestre_etiqueta VARCHAR(20),
  semestre_etiqueta  VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_semestre (
  llave_semestre   VARCHAR(7) PRIMARY KEY,
  llave_anio       INTEGER NOT NULL,
  anio             INTEGER NOT NULL,
  semestre         INTEGER NOT NULL,
  trimestre_inicio INTEGER NOT NULL,
  trimestre_fin    INTEGER NOT NULL,
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL,
  semestre_etiqueta VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_anio (
  llave_anio       INTEGER PRIMARY KEY,
  anio             INTEGER NOT NULL,
  es_bisiesto      BOOLEAN NOT NULL DEFAULT false,
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL,
  dias_calendario  INTEGER NOT NULL,
  dias_habiles     INTEGER
);

-- ═══════════════════════════════════════════
-- POBLAR DIMENSIÓN TIEMPO (2020-2030)
-- ═══════════════════════════════════════════

INSERT INTO dw.dim_tiempo_dia
SELECT
  TO_CHAR(d, 'YYYYMMDD')::INTEGER AS llave_dia,
  d::DATE AS fecha,
  TO_CHAR(d, 'YYYYMM')::INTEGER AS llave_mes,
  EXTRACT(YEAR FROM d)::TEXT || 'B' || CEIL(EXTRACT(MONTH FROM d)/2.0)::INTEGER::TEXT AS llave_bimestre,
  EXTRACT(YEAR FROM d)::TEXT || 'T' || EXTRACT(QUARTER FROM d)::INTEGER::TEXT AS llave_trimestre,
  EXTRACT(YEAR FROM d)::TEXT || 'S' || CASE WHEN EXTRACT(MONTH FROM d)<=6 THEN '1' ELSE '2' END AS llave_semestre,
  EXTRACT(YEAR FROM d)::INTEGER AS llave_anio,
  EXTRACT(YEAR FROM d)::INTEGER AS anio,
  CASE WHEN EXTRACT(MONTH FROM d)<=6 THEN 1 ELSE 2 END AS semestre,
  EXTRACT(QUARTER FROM d)::INTEGER AS trimestre,
  CEIL(EXTRACT(MONTH FROM d)/2.0)::INTEGER AS bimestre,
  EXTRACT(MONTH FROM d)::INTEGER AS mes,
  TO_CHAR(d, 'TMMonth') AS mes_nombre,
  TO_CHAR(d, 'TMMon') AS mes_abrev,
  EXTRACT(WEEK FROM d)::INTEGER AS semana_anio,
  EXTRACT(DAY FROM d)::INTEGER AS dia_mes,
  EXTRACT(DOY FROM d)::INTEGER AS dia_anio,
  EXTRACT(ISODOW FROM d)::INTEGER AS dia_semana,
  TO_CHAR(d, 'TMDay') AS dia_semana_nombre,
  TO_CHAR(d, 'TMDy') AS dia_semana_abrev,
  EXTRACT(ISODOW FROM d) IN (6,7) AS es_fin_semana,
  EXTRACT(ISODOW FROM d) NOT IN (6,7) AS es_dia_habil,
  FALSE AS es_festivo_mx,
  NULL AS nombre_festivo,
  TO_CHAR(d, 'DD TMMon YYYY') AS dia_etiqueta,
  TO_CHAR(d, 'TMMon YYYY') AS mes_anio_etiqueta,
  'T' || EXTRACT(QUARTER FROM d)::INTEGER::TEXT || ' ' || EXTRACT(YEAR FROM d)::TEXT AS trimestre_etiqueta,
  'S' || CASE WHEN EXTRACT(MONTH FROM d)<=6 THEN '1' ELSE '2' END || ' ' || EXTRACT(YEAR FROM d)::TEXT AS semestre_etiqueta
FROM generate_series('2020-01-01'::DATE, '2030-12-31'::DATE, '1 day'::INTERVAL) d
ON CONFLICT DO NOTHING;

INSERT INTO dw.dim_tiempo_mes
SELECT DISTINCT
  llave_mes,
  llave_bimestre, llave_trimestre, llave_semestre, llave_anio,
  anio, mes, mes_nombre, mes_abrev, bimestre, trimestre, semestre,
  DATE_TRUNC('month', fecha)::DATE AS fecha_inicio,
  (DATE_TRUNC('month', fecha) + INTERVAL '1 month' - INTERVAL '1 day')::DATE AS fecha_fin,
  EXTRACT(DAY FROM (DATE_TRUNC('month', fecha) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER AS dias_calendario,
  NULL AS dias_habiles,
  mes_anio_etiqueta, trimestre_etiqueta, semestre_etiqueta
FROM dw.dim_tiempo_dia
ON CONFLICT DO NOTHING;

INSERT INTO dw.dim_tiempo_trimestre
SELECT DISTINCT
  llave_trimestre,
  llave_semestre, llave_anio,
  anio, trimestre, semestre,
  MIN(mes) AS mes_inicio,
  MAX(mes) AS mes_fin,
  MIN(fecha) AS fecha_inicio,
  MAX(fecha) AS fecha_fin,
  trimestre_etiqueta,
  semestre_etiqueta
FROM dw.dim_tiempo_dia
GROUP BY llave_trimestre, llave_semestre, llave_anio, anio, trimestre, semestre, trimestre_etiqueta, semestre_etiqueta
ON CONFLICT DO NOTHING;

INSERT INTO dw.dim_tiempo_semestre
SELECT DISTINCT
  llave_semestre, llave_anio, anio, semestre,
  MIN(trimestre) AS trimestre_inicio,
  MAX(trimestre) AS trimestre_fin,
  MIN(fecha) AS fecha_inicio,
  MAX(fecha) AS fecha_fin,
  semestre_etiqueta
FROM dw.dim_tiempo_dia
GROUP BY llave_semestre, llave_anio, anio, semestre, semestre_etiqueta
ON CONFLICT DO NOTHING;

INSERT INTO dw.dim_tiempo_anio
SELECT DISTINCT
  llave_anio, anio,
  EXTRACT(DAY FROM (DATE_TRUNC('year', fecha) + INTERVAL '1 year' - INTERVAL '1 day')) = 366 AS es_bisiesto,
  MIN(fecha) AS fecha_inicio,
  MAX(fecha) AS fecha_fin,
  COUNT(*)::INTEGER AS dias_calendario,
  COUNT(*) FILTER (WHERE es_dia_habil)::INTEGER AS dias_habiles
FROM dw.dim_tiempo_dia
GROUP BY llave_anio, anio
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════
-- DIMENSIÓN GEOGRÁFICA — ESTADO
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dw.dim_estado (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave_inegi      VARCHAR(5) UNIQUE NOT NULL,
  nombre           VARCHAR(100) NOT NULL,
  abrev            VARCHAR(5) NOT NULL,
  region           VARCHAR(50),
  activo           BOOLEAN DEFAULT true
);

INSERT INTO dw.dim_estado (clave_inegi, nombre, abrev, region) VALUES
  ('09', 'Ciudad de México', 'CDMX', 'Centro'),
  ('15', 'Estado de México', 'EDOMEX', 'Centro'),
  ('13', 'Hidalgo', 'HGO', 'Centro'),
  ('21', 'Puebla', 'PUE', 'Centro-Sur'),
  ('17', 'Morelos', 'MOR', 'Centro-Sur')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════
-- DIMENSIÓN GEOGRÁFICA — ALCALDÍA (CDMX)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dw.dim_alcaldia (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave            VARCHAR(5) UNIQUE NOT NULL,
  nombre           VARCHAR(100) NOT NULL,
  nombre_corto     VARCHAR(50),
  estado_clave     VARCHAR(5) DEFAULT '09' REFERENCES dw.dim_estado(clave_inegi),
  poblacion_aprox  INTEGER,
  superficie_km2   NUMERIC(8,2),
  activo           BOOLEAN DEFAULT true
);

INSERT INTO dw.dim_alcaldia (clave, nombre, nombre_corto, poblacion_aprox, superficie_km2) VALUES
  ('AZC', 'Azcapotzalco',               'Azcapotzalco',    400161,  33.66),
  ('COY', 'Coyoacán',                   'Coyoacán',        614447,  54.40),
  ('CUA', 'Cuajimalpa de Morelos',      'Cuajimalpa',      186391,  74.58),
  ('CUH', 'Cuauhtémoc',                 'Cuauhtémoc',      531831,  32.44),
  ('GAM', 'Gustavo A. Madero',          'G.A. Madero',    1173351,  94.07),
  ('IZT', 'Iztacalco',                  'Iztacalco',       384326,  23.30),
  ('IZP', 'Iztapalapa',                 'Iztapalapa',     1835486, 114.97),
  ('LAM', 'La Magdalena Contreras',     'Magdalena C.',    239086,  74.58),
  ('MIH', 'Miguel Hidalgo',             'Miguel Hidalgo',  364439,  46.99),
  ('MIA', 'Milpa Alta',                 'Milpa Alta',      137927, 228.00),
  ('OBR', 'Álvaro Obregón',             'Álvaro Obregón',  749982,  96.17),
  ('TLH', 'Tláhuac',                    'Tláhuac',         361593,  85.33),
  ('TLP', 'Tlalpan',                    'Tlalpan',         677104, 312.00),
  ('VEN', 'Venustiano Carranza',        'V. Carranza',     427263,  33.42),
  ('XOC', 'Xochimilco',                 'Xochimilco',      415007, 118.00),
  ('BEN', 'Benito Juárez',              'Benito Juárez',   434153,  26.63)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════
-- CATÁLOGO UNIVERSAL DE ESTADOS DE TRÁMITE
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cat_estado_tramite (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave            VARCHAR(20) UNIQUE NOT NULL,
  nombre           VARCHAR(100) NOT NULL,
  descripcion      TEXT,
  color_hex        VARCHAR(7),
  icono            VARCHAR(50),
  orden            INTEGER DEFAULT 0,
  es_terminal      BOOLEAN DEFAULT false,
  activo           BOOLEAN DEFAULT true,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_estado_tramite (clave, nombre, descripcion, color_hex, orden, es_terminal) VALUES
  ('NUEVO',       'Nuevo',          'Recién ingresado, sin asignar',          '#6B7280', 1, false),
  ('ASIGNADO',    'Asignado',       'Asignado a un área o funcionario',       '#3B82F6', 2, false),
  ('EN_PROCESO',  'En Proceso',     'El área está trabajando en él',          '#F59E0B', 3, false),
  ('PENDIENTE',   'Pendiente',      'En espera de información del ciudadano', '#EF4444', 4, false),
  ('RESUELTO',    'Resuelto',       'Trámite completado exitosamente',        '#10B981', 5, true),
  ('CANCELADO',   'Cancelado',      'Trámite cancelado',                      '#9CA3AF', 6, true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════
-- TABLA DUMMY (prueba de conexión)
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.dummy (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descripcion      TEXT NOT NULL,
  etiqueta         TEXT DEFAULT 'general',
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by       UUID,
  updated_by       UUID
);

INSERT INTO public.dummy (descripcion, etiqueta) VALUES
  ('Conexión Supabase verificada ✓',     'sistema'),
  ('Data Warehouse poblado ✓',           'sistema'),
  ('16 alcaldías CDMX cargadas ✓',       'sistema'),
  ('Dimensiones tiempo 2020-2030 ✓',     'sistema'),
  ('Catálogo estados de trámite ✓',      'sistema')
ON CONFLICT DO NOTHING;

ALTER TABLE public.dummy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_estado_tramite ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública dummy" ON public.dummy;
DROP POLICY IF EXISTS "Inserción dummy" ON public.dummy;
DROP POLICY IF EXISTS "Lectura pública cat_estado" ON public.cat_estado_tramite;

CREATE POLICY "Lectura pública dummy" ON public.dummy FOR SELECT USING (true);
CREATE POLICY "Inserción dummy" ON public.dummy FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura pública cat_estado" ON public.cat_estado_tramite FOR SELECT USING (true);
