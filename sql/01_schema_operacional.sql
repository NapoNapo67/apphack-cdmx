-- ============================================================
-- SCHEMA OPERACIONAL — Viabilidad de Negocios CDMX · SEDECO
-- PKs: UUID en todas las tablas (consistente con cat_estado_tramite)
-- ============================================================

-- ── CATÁLOGOS BASE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cat_categoria_giro (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave      VARCHAR(20) UNIQUE NOT NULL,
  nombre     VARCHAR(80) NOT NULL,
  icono      VARCHAR(10),
  orden      SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_giro_negocio (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id        UUID REFERENCES public.cat_categoria_giro(id),
  clave               VARCHAR(20) UNIQUE NOT NULL,
  nombre              VARCHAR(100) NOT NULL,
  clave_scian         VARCHAR(10),
  nivel_inversion     VARCHAR(10) CHECK (nivel_inversion IN ('BAJO','MEDIO','ALTO')),
  meses_tramite       SMALLINT DEFAULT 1,
  riesgo_sanitario    BOOLEAN DEFAULT false,
  requiere_cofepris   BOOLEAN DEFAULT false,
  requiere_pc         BOOLEAN DEFAULT false,
  impacto_mercantil   VARCHAR(10) CHECK (impacto_mercantil IN ('BAJO','VECINAL','ZONAL')),
  formato_siapem      VARCHAR(10),
  uso_suelo_ok        TEXT[],
  orden               SMALLINT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_persona_juridica (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave            VARCHAR(10) UNIQUE NOT NULL,
  nombre           VARCHAR(80) NOT NULL,
  descripcion      TEXT,
  ventajas         TEXT,
  requiere_notario BOOLEAN DEFAULT false,
  orden            SMALLINT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_alcaldia (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave           CHAR(3) UNIQUE NOT NULL,
  nombre          VARCHAR(60) NOT NULL,
  nombre_corto    VARCHAR(20),
  poblacion_aprox INTEGER,
  superficie_km2  NUMERIC(6,2),
  lat             NUMERIC(9,6),
  lng             NUMERIC(9,6),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_dependencia (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  siglas      VARCHAR(20),
  url_tramite TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_tramite (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dependencia_id  UUID REFERENCES public.cat_dependencia(id),
  clave           VARCHAR(20) UNIQUE NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  tipo_siapem     VARCHAR(10),
  costo_min       NUMERIC(10,2) DEFAULT 0,
  costo_max       NUMERIC(10,2) DEFAULT 0,
  dias_resolucion SMALLINT,
  es_obligatorio  BOOLEAN DEFAULT true,
  url_tramite     TEXT,
  orden_sugerido  SMALLINT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_programa_tipo (
  id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave  VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(60) NOT NULL,
  orden  SMALLINT DEFAULT 0
);

-- ── TABLAS OPERACIONALES ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.consulta_viabilidad (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giro_id             UUID REFERENCES public.cat_giro_negocio(id),
  giro_descripcion    TEXT,
  alcaldia_id         UUID REFERENCES public.cat_alcaldia(id),
  colonia             VARCHAR(100),
  tipo_persona_clave  VARCHAR(10),
  score_viabilidad    NUMERIC(5,2),
  nivel_viabilidad    VARCHAR(10),
  resumen_ia          TEXT,
  resultado_json      JSONB,
  estado_id           UUID REFERENCES public.cat_estado_tramite(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID,
  updated_by          UUID
);

CREATE TABLE IF NOT EXISTS public.tramite_consulta (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consulta_id  UUID REFERENCES public.consulta_viabilidad(id) ON DELETE CASCADE,
  tramite_id   UUID REFERENCES public.cat_tramite(id),
  orden        SMALLINT,
  completado   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(consulta_id, tramite_id)
);

CREATE TABLE IF NOT EXISTS public.programa_emprendimiento (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_id               UUID REFERENCES public.cat_programa_tipo(id),
  nombre                VARCHAR(120) NOT NULL,
  descripcion           TEXT,
  monto_min             NUMERIC(12,2) DEFAULT 0,
  monto_max             NUMERIC(12,2) DEFAULT 0,
  monto_descripcion     VARCHAR(100),
  anos_operacion_max    SMALLINT,
  requiere_plan_negocio BOOLEAN DEFAULT false,
  requiere_rfc          BOOLEAN DEFAULT false,
  destacado             BOOLEAN DEFAULT false,
  convocatoria_url      TEXT,
  orden                 SMALLINT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ── ÍNDICES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_consulta_giro     ON public.consulta_viabilidad(giro_id);
CREATE INDEX IF NOT EXISTS idx_consulta_alcaldia ON public.consulta_viabilidad(alcaldia_id);
CREATE INDEX IF NOT EXISTS idx_consulta_fecha    ON public.consulta_viabilidad(created_at);
CREATE INDEX IF NOT EXISTS idx_giro_categoria    ON public.cat_giro_negocio(categoria_id);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE public.cat_giro_negocio        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_categoria_giro      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_alcaldia            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tramite             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_dependencia         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_persona_juridica    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_programa_tipo       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programa_emprendimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulta_viabilidad     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tramite_consulta        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lectura publica catalogos" ON public.cat_giro_negocio;
DROP POLICY IF EXISTS "lectura publica categ"     ON public.cat_categoria_giro;
DROP POLICY IF EXISTS "lectura publica alcaldia"  ON public.cat_alcaldia;
DROP POLICY IF EXISTS "lectura publica tramite"   ON public.cat_tramite;
DROP POLICY IF EXISTS "lectura publica dep"       ON public.cat_dependencia;
DROP POLICY IF EXISTS "lectura publica persona"   ON public.cat_persona_juridica;
DROP POLICY IF EXISTS "lectura publica ptipo"     ON public.cat_programa_tipo;
DROP POLICY IF EXISTS "lectura publica programa"  ON public.programa_emprendimiento;
DROP POLICY IF EXISTS "insertar consulta demo"    ON public.consulta_viabilidad;
DROP POLICY IF EXISTS "leer consultas demo"       ON public.consulta_viabilidad;
DROP POLICY IF EXISTS "insertar tramite demo"     ON public.tramite_consulta;
DROP POLICY IF EXISTS "leer tramites demo"        ON public.tramite_consulta;

CREATE POLICY "lectura publica catalogos" ON public.cat_giro_negocio      FOR SELECT USING (true);
CREATE POLICY "lectura publica categ"     ON public.cat_categoria_giro    FOR SELECT USING (true);
CREATE POLICY "lectura publica alcaldia"  ON public.cat_alcaldia          FOR SELECT USING (true);
CREATE POLICY "lectura publica tramite"   ON public.cat_tramite           FOR SELECT USING (true);
CREATE POLICY "lectura publica dep"       ON public.cat_dependencia       FOR SELECT USING (true);
CREATE POLICY "lectura publica persona"   ON public.cat_persona_juridica  FOR SELECT USING (true);
CREATE POLICY "lectura publica ptipo"     ON public.cat_programa_tipo     FOR SELECT USING (true);
CREATE POLICY "lectura publica programa"  ON public.programa_emprendimiento FOR SELECT USING (true);
CREATE POLICY "insertar consulta demo"    ON public.consulta_viabilidad   FOR INSERT WITH CHECK (true);
CREATE POLICY "leer consultas demo"       ON public.consulta_viabilidad   FOR SELECT USING (true);
CREATE POLICY "insertar tramite demo"     ON public.tramite_consulta      FOR INSERT WITH CHECK (true);
CREATE POLICY "leer tramites demo"        ON public.tramite_consulta      FOR SELECT USING (true);

SELECT 'Schema operacional OK' AS resultado;
