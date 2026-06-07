-- ============================================================
-- SCHEMA OPERACIONAL — Viabilidad de Negocios CDMX · SEDECO
-- Ejecutar en: Supabase SQL Editor
-- ============================================================

-- ── CATÁLOGOS BASE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cat_categoria_giro (
  id     SERIAL PRIMARY KEY,
  clave  VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  icono  VARCHAR(10),
  orden  SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_giro_negocio (
  id                  SERIAL PRIMARY KEY,
  categoria_id        INT REFERENCES public.cat_categoria_giro(id),
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
  id                SERIAL PRIMARY KEY,
  clave             VARCHAR(10) UNIQUE NOT NULL,
  nombre            VARCHAR(80) NOT NULL,
  descripcion       TEXT,
  ventajas          TEXT,
  requiere_notario  BOOLEAN DEFAULT false,
  orden             SMALLINT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_alcaldia (
  id               SERIAL PRIMARY KEY,
  clave            CHAR(3) UNIQUE NOT NULL,
  nombre           VARCHAR(60) NOT NULL,
  nombre_corto     VARCHAR(20),
  poblacion_aprox  INTEGER,
  superficie_km2   NUMERIC(6,2),
  lat              NUMERIC(9,6),
  lng              NUMERIC(9,6),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_dependencia (
  id          SERIAL PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  siglas      VARCHAR(20),
  url_tramite TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_tramite (
  id               SERIAL PRIMARY KEY,
  dependencia_id   INT REFERENCES public.cat_dependencia(id),
  clave            VARCHAR(20) UNIQUE NOT NULL,
  nombre           VARCHAR(150) NOT NULL,
  descripcion      TEXT,
  tipo_siapem      VARCHAR(10),
  costo_min        NUMERIC(10,2) DEFAULT 0,
  costo_max        NUMERIC(10,2) DEFAULT 0,
  dias_resolucion  SMALLINT,
  es_obligatorio   BOOLEAN DEFAULT true,
  url_tramite      TEXT,
  orden_sugerido   SMALLINT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_estado_tramite (
  id         SERIAL PRIMARY KEY,
  clave      VARCHAR(20) UNIQUE NOT NULL,
  nombre     VARCHAR(60) NOT NULL,
  color_hex  CHAR(7),
  es_terminal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_programa_tipo (
  id     SERIAL PRIMARY KEY,
  clave  VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(60) NOT NULL,
  orden  SMALLINT DEFAULT 0
);

-- ── TABLAS OPERACIONALES ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.consulta_viabilidad (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giro_id             INT REFERENCES public.cat_giro_negocio(id),
  giro_descripcion    TEXT,
  alcaldia_id         INT REFERENCES public.cat_alcaldia(id),
  colonia             VARCHAR(100),
  tipo_persona_clave  VARCHAR(10),
  score_viabilidad    NUMERIC(5,2),
  nivel_viabilidad    VARCHAR(10),
  resumen_ia          TEXT,
  resultado_json      JSONB,
  estado_id           INT REFERENCES public.cat_estado_tramite(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  created_by          UUID,
  updated_by          UUID
);

CREATE TABLE IF NOT EXISTS public.tramite_consulta (
  id           SERIAL PRIMARY KEY,
  consulta_id  UUID REFERENCES public.consulta_viabilidad(id) ON DELETE CASCADE,
  tramite_id   INT REFERENCES public.cat_tramite(id),
  orden        SMALLINT,
  completado   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(consulta_id, tramite_id)
);

CREATE TABLE IF NOT EXISTS public.programa_emprendimiento (
  id                    SERIAL PRIMARY KEY,
  tipo_id               INT REFERENCES public.cat_programa_tipo(id),
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

-- ── RLS (Row Level Security) ────────────────────────────────

ALTER TABLE public.consulta_viabilidad   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tramite_consulta      ENABLE ROW LEVEL SECURITY;

-- Lectura pública para catálogos
ALTER TABLE public.cat_giro_negocio      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_categoria_giro    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_alcaldia          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tramite           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_dependencia       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_persona_juridica  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_estado_tramite    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_programa_tipo     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programa_emprendimiento ENABLE ROW LEVEL SECURITY;

-- Políticas: catálogos y programas son de solo lectura pública
CREATE POLICY "lectura publica catalogos" ON public.cat_giro_negocio      FOR SELECT USING (true);
CREATE POLICY "lectura publica categ"     ON public.cat_categoria_giro    FOR SELECT USING (true);
CREATE POLICY "lectura publica alcaldia"  ON public.cat_alcaldia          FOR SELECT USING (true);
CREATE POLICY "lectura publica tramite"   ON public.cat_tramite           FOR SELECT USING (true);
CREATE POLICY "lectura publica dep"       ON public.cat_dependencia       FOR SELECT USING (true);
CREATE POLICY "lectura publica persona"   ON public.cat_persona_juridica  FOR SELECT USING (true);
CREATE POLICY "lectura publica estado"    ON public.cat_estado_tramite    FOR SELECT USING (true);
CREATE POLICY "lectura publica ptipo"     ON public.cat_programa_tipo     FOR SELECT USING (true);
CREATE POLICY "lectura publica programa"  ON public.programa_emprendimiento FOR SELECT USING (true);

-- Consultas: cualquiera puede insertar y leer (demo sin auth)
CREATE POLICY "insertar consulta demo"   ON public.consulta_viabilidad FOR INSERT WITH CHECK (true);
CREATE POLICY "leer consultas demo"      ON public.consulta_viabilidad FOR SELECT USING (true);
CREATE POLICY "insertar tramite demo"    ON public.tramite_consulta    FOR INSERT WITH CHECK (true);
CREATE POLICY "leer tramites demo"       ON public.tramite_consulta    FOR SELECT USING (true);

SELECT 'Schema operacional creado correctamente' AS resultado;

-- ============================================================
-- SEED: Catálogos y datos de demo
-- ============================================================

-- ── ESTADOS DE TRÁMITE (catálogo universal) ─────────────────
INSERT INTO public.cat_estado_tramite (clave, nombre, color_hex, es_terminal) VALUES
  ('NUEVO',       'Nuevo',       '#6B7280', false),
  ('ASIGNADO',    'Asignado',    '#3B82F6', false),
  ('EN_PROCESO',  'En Proceso',  '#F59E0B', false),
  ('PENDIENTE',   'Pendiente',   '#8B5CF6', false),
  ('RESUELTO',    'Resuelto',    '#10B981', true),
  ('CANCELADO',   'Cancelado',   '#EF4444', true)
ON CONFLICT (clave) DO NOTHING;

-- ── DEPENDENCIAS ────────────────────────────────────────────
INSERT INTO public.cat_dependencia (clave, nombre, siglas, url_tramite) VALUES
  ('SEDUVI',   'Secretaria de Desarrollo Urbano y Vivienda',    'SEDUVI',   'https://seduvi.cdmx.gob.mx'),
  ('SEDECO',   'Secretaria de Desarrollo Economico',            'SEDECO',   'https://sedeco.cdmx.gob.mx'),
  ('SAT',      'Servicio de Administracion Tributaria',         'SAT',      'https://www.sat.gob.mx'),
  ('IMSS',     'Instituto Mexicano del Seguro Social',          'IMSS',     'https://www.imss.gob.mx'),
  ('COFEPRIS', 'Comision Federal para la Proteccion contra Riesgos Sanitarios', 'COFEPRIS', 'https://www.gob.mx/cofepris'),
  ('PC_CDMX',  'Secretaria de Gestion Integral de Riesgos y Proteccion Civil', 'SGIRPC',   'https://www.proteccioncivil.cdmx.gob.mx'),
  ('IMPI',     'Instituto Mexicano de la Propiedad Industrial', 'IMPI',     'https://www.impi.gob.mx'),
  ('ALCALDIA', 'Alcaldia correspondiente',                      'ALCALDIA', 'https://www.cdmx.gob.mx')
ON CONFLICT (clave) DO NOTHING;

-- ── TRÁMITES ────────────────────────────────────────────────
INSERT INTO public.cat_tramite (dependencia_id, clave, nombre, descripcion, tipo_siapem, costo_min, costo_max, dias_resolucion, es_obligatorio, url_tramite, orden_sugerido) VALUES
  ((SELECT id FROM cat_dependencia WHERE clave='SEDUVI'),   'CZUS',    'Certificado de Zonificacion de Uso de Suelo', 'Verifica que el uso de suelo del local sea compatible con el giro', null, 853, 853, 5,  true,  'http://certificadodigital.cdmx.gob.mx:8080/CertificadoDigital/certificado/solicitaCertificado', 1),
  ((SELECT id FROM cat_dependencia WHERE clave='SAT'),      'RFC',     'Registro Federal de Contribuyentes', 'Alta ante el SAT como persona fisica o moral', null, 0, 0, 1, true, 'https://www.sat.gob.mx/tramites/operacion/26140/inscripcion-en-el-rfc', 2),
  ((SELECT id FROM cat_dependencia WHERE clave='SEDECO'),   'EM-03',   'Aviso de Apertura Bajo Impacto Mercantil', 'Para giros de bajo impacto: tiendas, esteticas, cafeterias, papelerias. Opera al dia siguiente. Gratuito.', 'BAJO', 0, 0, 1, true, 'https://siapem.cdmx.gob.mx', 3),
  ((SELECT id FROM cat_dependencia WHERE clave='SEDECO'),   'EM-11',   'Aviso de Apertura Impacto Vecinal', 'Para restaurantes, hoteles, salones de fiesta, cines, teatros. Requiere pago de derechos.', 'VECINAL', 2500, 8000, 15, true, 'https://siapem.cdmx.gob.mx', 3),
  ((SELECT id FROM cat_dependencia WHERE clave='SEDECO'),   'EM-08',   'Permiso de Apertura Impacto Zonal', 'Para bares, cantinas, discotecas. Requiere aprobacion de la Alcaldia. Plazo 30+ dias habiles.', 'ZONAL', 5000, 15000, 45, true, 'https://siapem.cdmx.gob.mx', 3),
  ((SELECT id FROM cat_dependencia WHERE clave='IMSS'),     'IMSS',    'Registro Patronal IMSS', 'Alta como patron ante el IMSS si se contrataran empleados', null, 0, 0, 3, false, 'https://www.imss.gob.mx/tramites/imss02-008', 4),
  ((SELECT id FROM cat_dependencia WHERE clave='COFEPRIS'), 'COFEPRIS','Licencia Sanitaria COFEPRIS', 'Obligatoria para giros que manejan alimentos, medicamentos o productos de salud', null, 1500, 5000, 30, false, 'https://www.gob.mx/cofepris/tramites-y-servicios', 5),
  ((SELECT id FROM cat_dependencia WHERE clave='PC_CDMX'),  'PC',      'Programa Interno de Proteccion Civil', 'Requerido si el local tiene mas de 100 personas o mas de 250 m2 (Art. 10, A, X, LEM)', null, 2000, 6000, 20, false, 'https://www.proteccioncivil.cdmx.gob.mx', 6),
  ((SELECT id FROM cat_dependencia WHERE clave='IMPI'),     'IMPI',    'Registro de Marca IMPI', 'Protege el nombre comercial y logotipo del negocio a nivel nacional', null, 2358, 2358, 90, false, 'https://www.impi.gob.mx', 7),
  ((SELECT id FROM cat_dependencia WHERE clave='ALCALDIA'), 'APERTURA','Aviso de Apertura Municipal', 'Notificacion a la Alcaldia correspondiente sobre la apertura del establecimiento', null, 0, 500, 5, false, 'https://www.cdmx.gob.mx', 8)
ON CONFLICT (clave) DO NOTHING;

-- ── CATEGORÍAS DE GIRO ──────────────────────────────────────
INSERT INTO public.cat_categoria_giro (clave, nombre, icono, orden) VALUES
  ('ALIMENTOS',     'Alimentos y Bebidas',     '🍽️', 1),
  ('COMERCIO',      'Comercio al por Menor',   '🛍️', 2),
  ('SERVICIOS',     'Servicios Personales',    '💇', 3),
  ('SALUD',         'Salud y Bienestar',       '🏥', 4),
  ('TECNOLOGIA',    'Tecnologia y Digital',    '💻', 5),
  ('EDUCACION',     'Educacion y Cultura',     '📚', 6),
  ('ENTRETENIMIENTO','Entretenimiento',        '🎭', 7),
  ('MANUFACTURA',   'Manufactura y Taller',    '🔧', 8)
ON CONFLICT (clave) DO NOTHING;

-- ── GIROS DE NEGOCIO ────────────────────────────────────────
INSERT INTO public.cat_giro_negocio (categoria_id, clave, nombre, nivel_inversion, meses_tramite, riesgo_sanitario, requiere_cofepris, requiere_pc, impacto_mercantil, formato_siapem, uso_suelo_ok, orden) VALUES
  ((SELECT id FROM cat_categoria_giro WHERE clave='ALIMENTOS'), 'CAFETERIA',     'Cafeteria / Coffee Shop',    'MEDIO', 2, true,  true,  false, 'BAJO',    'EM-03', ARRAY['COM','COM_S','MIX','HAB_M'], 1),
  ((SELECT id FROM cat_categoria_giro WHERE clave='ALIMENTOS'), 'TAQUERIA',      'Taqueria / Comida Rapida',   'BAJO',  1, true,  true,  false, 'BAJO',    'EM-03', ARRAY['COM','COM_S','MIX'],         2),
  ((SELECT id FROM cat_categoria_giro WHERE clave='ALIMENTOS'), 'RESTAURANTE',   'Restaurante',                'ALTO',  3, true,  true,  true,  'VECINAL', 'EM-11', ARRAY['COM','COM_S','MIX'],         3),
  ((SELECT id FROM cat_categoria_giro WHERE clave='ALIMENTOS'), 'PANADERIA',     'Panaderia / Pasteleria',     'MEDIO', 2, true,  true,  false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],         4),
  ((SELECT id FROM cat_categoria_giro WHERE clave='COMERCIO'),  'ABARROTES',     'Tienda de Abarrotes',        'BAJO',  1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],         5),
  ((SELECT id FROM cat_categoria_giro WHERE clave='COMERCIO'),  'ROPA',          'Tienda de Ropa y Moda',      'MEDIO', 1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','COM_S','MIX'],         6),
  ((SELECT id FROM cat_categoria_giro WHERE clave='SERVICIOS'), 'ESTETICA',      'Estetica / Salon de Belleza','BAJO',  1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],         7),
  ((SELECT id FROM cat_categoria_giro WHERE clave='SERVICIOS'), 'LAVANDERIA',    'Lavanderia / Tintoreria',    'MEDIO', 1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX'],                 8),
  ((SELECT id FROM cat_categoria_giro WHERE clave='SALUD'),     'FARMACIA',      'Farmacia',                   'MEDIO', 3, false, true,  false, 'BAJO',    'EM-03', ARRAY['COM','COM_S','MIX'],         9),
  ((SELECT id FROM cat_categoria_giro WHERE clave='TECNOLOGIA'),'SOFTDEV',       'Desarrollo de Software',     'BAJO',  1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M','OFI'],  10),
  ((SELECT id FROM cat_categoria_giro WHERE clave='EDUCACION'), 'ACADEMIA',      'Academia / Centro de Idiomas','MEDIO',2, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','EQU'],          11),
  ((SELECT id FROM cat_categoria_giro WHERE clave='ENTRETENIMIENTO'),'GYM',       'Gimnasio',                  'ALTO',  3, false, false, true,  'VECINAL', 'EM-11', ARRAY['COM','COM_S','MIX'],        12),
  ((SELECT id FROM cat_categoria_giro WHERE clave='ENTRETENIMIENTO'),'BAR',        'Bar / Cantina',             'ALTO',  4, false, false, true,  'ZONAL',   'EM-08', ARRAY['COM','COM_S'],              13),
  ((SELECT id FROM cat_categoria_giro WHERE clave='MANUFACTURA'),'TALLER_MECA',  'Taller Mecanico',            'MEDIO', 2, false, false, false, 'BAJO',    'EM-03', ARRAY['IND','MIX','COM'],          14),
  ((SELECT id FROM cat_categoria_giro WHERE clave='COMERCIO'),  'PAPELERIA',     'Papeleria / Impresiones',    'BAJO',  1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],        15)
ON CONFLICT (clave) DO NOTHING;

-- ── PERSONAS JURÍDICAS ──────────────────────────────────────
INSERT INTO public.cat_persona_juridica (clave, nombre, descripcion, ventajas, requiere_notario, orden) VALUES
  ('PF',   'Persona Fisica',                        'Persona natural sin actividad empresarial formal. Para actividades menores.',                                    'Sin tramites de constitucion,Sin capital minimo,Inicio inmediato',              false, 1),
  ('PFAE', 'Persona Fisica con Actividad Empresarial','La forma mas comun para emprender. Te permite emitir facturas y deducir gastos de tu negocio.',               'RFC sencillo,Facturacion electronica,Sin notario,Menos impuestos al inicio',   false, 2),
  ('SAS',  'Sociedad por Acciones Simplificada',    'Sociedad mercantil moderna y de bajo costo. Constitucion en linea en 24 horas por la SE.',                     'Constitucion en linea,Capital minimo 1 peso,Responsabilidad limitada',         false, 3),
  ('SA',   'Sociedad Anonima de Capital Variable',  'La figura clasica para empresas medianas y grandes. Requiere notario y capital social minimo.',                 'Mayor credibilidad,Acceso a credito,Socios multiples,Expansion facilitada',    true,  4)
ON CONFLICT (clave) DO NOTHING;

-- ── ALCALDÍAS CDMX ──────────────────────────────────────────
INSERT INTO public.cat_alcaldia (clave, nombre, nombre_corto, poblacion_aprox, superficie_km2, lat, lng) VALUES
  ('AZC', 'Azcapotzalco',          'Azcapotzalco',  414711, 33.66,  19.4867, -99.1849),
  ('COY', 'Coyoacan',              'Coyoacan',      614447, 54.40,  19.3467, -99.1617),
  ('CUA', 'Cuajimalpa de Morelos', 'Cuajimalpa',    186391, 74.58,  19.3614, -99.2978),
  ('CUH', 'Cuauhtemoc',            'Cuauhtemoc',    531831, 32.44,  19.4326, -99.1452),
  ('GAM', 'Gustavo A. Madero',     'Gust. A. Madero',1173351,94.07, 19.4978, -99.1044),
  ('IZT', 'Iztacalco',             'Iztacalco',     384326, 23.30,  19.3944, -99.0978),
  ('IZP', 'Iztapalapa',            'Iztapalapa',   1835486,117.38,  19.3590, -99.0478),
  ('LAM', 'La Magdalena Contreras','Magdalena Cont.',243886, 74.58,  19.3267, -99.2297),
  ('MHI', 'Miguel Hidalgo',        'Miguel Hidalgo', 364439, 46.99,  19.4267, -99.2017),
  ('MIL', 'Milpa Alta',            'Milpa Alta',    137927,228.80,  19.1926, -98.9847),
  ('ALV', 'Alvaro Obregon',        'Alvaro Obregon', 749075, 96.17,  19.3590, -99.2017),
  ('TLA', 'Tlahuac',               'Tlahuac',       361593, 85.34,  19.2927, -99.0048),
  ('TLP', 'Tlalpan',               'Tlalpan',       677104,312.00,  19.2926, -99.1700),
  ('VEN', 'Venustiano Carranza',   'V. Carranza',   427263, 33.42,  19.4267, -99.0978),
  ('XOC', 'Xochimilco',            'Xochimilco',    415007,122.00,  19.2647, -99.1053),
  ('BJU', 'Benito Juarez',         'Benito Juarez',  434153, 26.63,  19.3867, -99.1617)
ON CONFLICT (clave) DO NOTHING;

-- ── TIPOS DE PROGRAMA ───────────────────────────────────────
INSERT INTO public.cat_programa_tipo (clave, nombre, orden) VALUES
  ('FINANCIAMIENTO', 'Financiamiento',   1),
  ('CAPACITACION',   'Capacitacion',     2),
  ('INCUBACION',     'Incubacion',       3),
  ('VINCULACION',    'Vinculacion',      4),
  ('SUBSIDIO',       'Subsidio',         5),
  ('ESPACIO',        'Espacio de Trabajo',6)
ON CONFLICT (clave) DO NOTHING;

-- ── PROGRAMAS DE EMPRENDIMIENTO ─────────────────────────────
INSERT INTO public.programa_emprendimiento (tipo_id, nombre, descripcion, monto_min, monto_max, monto_descripcion, anos_operacion_max, requiere_plan_negocio, requiere_rfc, destacado, convocatoria_url, orden) VALUES
  ((SELECT id FROM cat_programa_tipo WHERE clave='FINANCIAMIENTO'), 'Credito FONDESO Inicial', 'Credito para capital de trabajo e inversion fija para nuevos emprendedores de la CDMX. Tasa preferencial del 12% anual.', 30000, 300000, '$30,000 a $300,000 MXN', 2, true, true, true, 'https://fondeso.cdmx.gob.mx', 1),
  ((SELECT id FROM cat_programa_tipo WHERE clave='FINANCIAMIENTO'), 'Credito FONDESO Crecimiento', 'Credito para empresas con al menos 2 anos de operacion que buscan expandirse. Mayor monto y plazo.', 300000, 1000000, '$300,000 a $1,000,000 MXN', null, true, true, false, 'https://fondeso.cdmx.gob.mx', 2),
  ((SELECT id FROM cat_programa_tipo WHERE clave='INCUBACION'), 'Incubadora SEDECO Digital', 'Programa de incubacion de 6 meses para negocios digitales y de tecnologia. Mentoria, red de contactos y espacio de coworking incluidos.', 0, 0, 'Gratuito', 1, true, false, true, 'https://sedeco.cdmx.gob.mx/incubadora', 3),
  ((SELECT id FROM cat_programa_tipo WHERE clave='CAPACITACION'), 'Capacitate para el Empleo', 'Cursos gratuitos de habilidades empresariales, contabilidad basica, marketing digital y uso de tecnologia para emprendedores.', 0, 0, 'Gratuito', null, false, false, false, 'https://capacitateparaelempleo.org', 4),
  ((SELECT id FROM cat_programa_tipo WHERE clave='SUBSIDIO'), 'Apoyo Mujer Emprendedora', 'Subsidio directo para mujeres que inician un negocio en la CDMX. Enfocado en giros de comercio y servicios personales.', 10000, 50000, '$10,000 a $50,000 MXN', 1, true, true, true, 'https://sedeco.cdmx.gob.mx/mujer', 5),
  ((SELECT id FROM cat_programa_tipo WHERE clave='VINCULACION'), 'Red de Proveedores CDMX', 'Conecta a pequenos negocios con compradores institucionales del gobierno de la CDMX. Acceso a licitaciones menores.', 0, 0, 'Gratuito', null, true, true, false, 'https://sedeco.cdmx.gob.mx/proveedores', 6),
  ((SELECT id FROM cat_programa_tipo WHERE clave='ESPACIO'), 'Espacios de Innovacion CDMX', 'Acceso a espacios de coworking y laboratorios de innovacion en las 16 alcaldias. Renta subsidiada para emprendedores.', 0, 2000, 'Desde gratuito hasta $2,000/mes', null, false, false, false, 'https://sedeco.cdmx.gob.mx/espacios', 7),
  ((SELECT id FROM cat_programa_tipo WHERE clave='FINANCIAMIENTO'), 'Microcredito Solidario', 'Creditos grupales de bajo monto para emprendedores informales que buscan formalizarse. Sin garantias reales.', 5000, 30000, '$5,000 a $30,000 MXN', null, false, false, false, 'https://fondeso.cdmx.gob.mx/microcredi', 8),
  ((SELECT id FROM cat_programa_tipo WHERE clave='CAPACITACION'), 'Mentoria Ejecutiva SEDECO', 'Programa de mentoria uno a uno con empresarios exitosos de la CDMX durante 3 meses. 20 horas de asesoria.', 0, 0, 'Gratuito', 3, true, true, false, 'https://sedeco.cdmx.gob.mx/mentoria', 9),
  ((SELECT id FROM cat_programa_tipo WHERE clave='SUBSIDIO'), 'Registro de Marca Subsidiado', 'SEDECO subsidia el costo del registro de marca ante el IMPI para emprendedores de la CDMX. Ahorro de $2,358.', 0, 2358, 'Subsidio hasta $2,358 MXN', 2, false, true, false, 'https://sedeco.cdmx.gob.mx/marca', 10)
ON CONFLICT DO NOTHING;

SELECT 'Catalogos y datos de demo insertados correctamente' AS resultado;

-- ============================================================
-- DATA WAREHOUSE — Esquema dw · Star Schema
-- ============================================================

CREATE SCHEMA IF NOT EXISTS dw;

-- ── DIMENSIONES DE TIEMPO (pre-generadas 2020-2030) ─────────

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_dia (
  id_dia       INT PRIMARY KEY,  -- YYYYMMDD
  fecha        DATE NOT NULL,
  anio         SMALLINT,
  mes          SMALLINT,
  dia          SMALLINT,
  trimestre    SMALLINT,
  semestre     SMALLINT,
  dia_semana   VARCHAR(12),
  es_fin_semana BOOLEAN
);

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_mes (
  id_mes     INT PRIMARY KEY,  -- YYYYMM
  anio       SMALLINT,
  mes        SMALLINT,
  nombre_mes VARCHAR(12),
  trimestre  VARCHAR(8),
  semestre   VARCHAR(8)
);

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_trimestre (
  id_trimestre VARCHAR(8) PRIMARY KEY,  -- 2025T1
  anio         SMALLINT,
  trimestre    SMALLINT,
  nombre       VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_semestre (
  id_semestre VARCHAR(8) PRIMARY KEY,  -- 2025S1
  anio        SMALLINT,
  semestre    SMALLINT,
  nombre      VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dw.dim_tiempo_anio (
  id_anio INT PRIMARY KEY,
  anio    SMALLINT
);

-- ── DIMENSIONES DE NEGOCIO ──────────────────────────────────

CREATE TABLE IF NOT EXISTS dw.dim_alcaldia (
  id            SERIAL PRIMARY KEY,
  clave         CHAR(3) UNIQUE NOT NULL,
  nombre        VARCHAR(60),
  nombre_corto  VARCHAR(20),
  poblacion     INTEGER,
  zona_cdmx     VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS dw.dim_giro (
  id            SERIAL PRIMARY KEY,
  clave_giro    VARCHAR(20) UNIQUE NOT NULL,
  nombre        VARCHAR(100),
  categoria     VARCHAR(60),
  tipo_siapem   VARCHAR(10),
  nivel_inversion VARCHAR(10),
  nivel_riesgo  VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS dw.dim_persona_juridica (
  id               SERIAL PRIMARY KEY,
  clave            VARCHAR(10) UNIQUE NOT NULL,
  nombre           VARCHAR(80),
  requiere_notario BOOLEAN,
  complejidad      VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS dw.dim_estado_tramite (
  id          SERIAL PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(60),
  color_hex   CHAR(7),
  es_terminal BOOLEAN
);

-- ── TABLA DE HECHOS CENTRAL ─────────────────────────────────

CREATE TABLE IF NOT EXISTS dw.fact_consulta (
  id                    BIGSERIAL PRIMARY KEY,
  id_consulta_origen    UUID UNIQUE,
  id_tiempo_dia         INT  REFERENCES dw.dim_tiempo_dia(id_dia),
  id_tiempo_mes         INT  REFERENCES dw.dim_tiempo_mes(id_mes),
  id_alcaldia           INT  REFERENCES dw.dim_alcaldia(id),
  id_giro               INT  REFERENCES dw.dim_giro(id),
  id_persona_juridica   INT  REFERENCES dw.dim_persona_juridica(id),
  id_estado_tramite     INT  REFERENCES dw.dim_estado_tramite(id),
  score_viabilidad      NUMERIC(5,2),
  nivel_viabilidad      VARCHAR(10),
  inversion_estimada    NUMERIC(12,2),
  dias_apertura_est     SMALLINT,
  dias_resolucion_real  SMALLINT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fact_dia      ON dw.fact_consulta(id_tiempo_dia);
CREATE INDEX IF NOT EXISTS idx_fact_mes      ON dw.fact_consulta(id_tiempo_mes);
CREATE INDEX IF NOT EXISTS idx_fact_alcaldia ON dw.fact_consulta(id_alcaldia);
CREATE INDEX IF NOT EXISTS idx_fact_giro     ON dw.fact_consulta(id_giro);

-- ── POBLAR DIMENSIONES DESDE CATÁLOGOS ──────────────────────

INSERT INTO dw.dim_alcaldia (clave, nombre, nombre_corto, poblacion, zona_cdmx)
SELECT clave, nombre, nombre_corto, poblacion_aprox,
  CASE WHEN clave IN ('MHI','CUH','BJU','AZC') THEN 'Centro-Norte'
       WHEN clave IN ('COY','TLP','XOC','MIL','LAM') THEN 'Sur'
       WHEN clave IN ('IZT','IZP','GAM','VEN','TLA') THEN 'Oriente'
       ELSE 'Poniente' END
FROM public.cat_alcaldia
ON CONFLICT (clave) DO NOTHING;

INSERT INTO dw.dim_giro (clave_giro, nombre, tipo_siapem, nivel_inversion, nivel_riesgo)
SELECT clave, nombre, impacto_mercantil, nivel_inversion,
  CASE WHEN impacto_mercantil = 'ZONAL' THEN 'ALTO'
       WHEN impacto_mercantil = 'VECINAL' THEN 'MEDIO'
       ELSE 'BAJO' END
FROM public.cat_giro_negocio
ON CONFLICT (clave_giro) DO NOTHING;

INSERT INTO dw.dim_persona_juridica (clave, nombre, requiere_notario, complejidad)
SELECT clave, nombre, requiere_notario,
  CASE clave WHEN 'PF' THEN 'BAJA' WHEN 'PFAE' THEN 'BAJA'
             WHEN 'SAS' THEN 'MEDIA' ELSE 'ALTA' END
FROM public.cat_persona_juridica
ON CONFLICT (clave) DO NOTHING;

INSERT INTO dw.dim_estado_tramite (clave, nombre, color_hex, es_terminal)
SELECT clave, nombre, color_hex, es_terminal
FROM public.cat_estado_tramite
ON CONFLICT (clave) DO NOTHING;

-- ── GENERAR DIMENSIÓN DE TIEMPO 2020-2030 ───────────────────

INSERT INTO dw.dim_tiempo_mes (id_mes, anio, mes, nombre_mes, trimestre, semestre)
SELECT
  (EXTRACT(YEAR FROM d)::INT * 100 + EXTRACT(MONTH FROM d)::INT) AS id_mes,
  EXTRACT(YEAR FROM d)::SMALLINT,
  EXTRACT(MONTH FROM d)::SMALLINT,
  TO_CHAR(d, 'TMMonth'),
  EXTRACT(YEAR FROM d)::TEXT || 'T' || CEIL(EXTRACT(MONTH FROM d)/3.0)::TEXT,
  EXTRACT(YEAR FROM d)::TEXT || 'S' || CASE WHEN EXTRACT(MONTH FROM d) <= 6 THEN '1' ELSE '2' END
FROM generate_series('2020-01-01'::date, '2030-12-01'::date, '1 month'::interval) d
ON CONFLICT (id_mes) DO NOTHING;

INSERT INTO dw.dim_tiempo_dia (id_dia, fecha, anio, mes, dia, trimestre, semestre, dia_semana, es_fin_semana)
SELECT
  TO_CHAR(d, 'YYYYMMDD')::INT,
  d::DATE,
  EXTRACT(YEAR FROM d)::SMALLINT,
  EXTRACT(MONTH FROM d)::SMALLINT,
  EXTRACT(DAY FROM d)::SMALLINT,
  CEIL(EXTRACT(MONTH FROM d)/3.0)::SMALLINT,
  CASE WHEN EXTRACT(MONTH FROM d) <= 6 THEN 1 ELSE 2 END::SMALLINT,
  TO_CHAR(d, 'TMDay'),
  EXTRACT(DOW FROM d) IN (0, 6)
FROM generate_series('2020-01-01'::date, '2030-12-31'::date, '1 day'::interval) d
ON CONFLICT (id_dia) DO NOTHING;

-- ── VISTAS ANALÍTICAS (DATA MARTS) ─────────────────────────

CREATE OR REPLACE VIEW dw.v_kpi_ejecutivo AS
SELECT
  COUNT(*)                                         AS total,
  COUNT(*) FILTER (WHERE f.nivel_viabilidad = 'ALTO')   AS resueltos,
  ROUND(COUNT(*) FILTER (WHERE f.nivel_viabilidad = 'ALTO') * 100.0 / NULLIF(COUNT(*),0), 1) AS pct_resueltos,
  ROUND(AVG(f.dias_apertura_est), 1)               AS promedio_dias,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', f.created_at) = DATE_TRUNC('month', NOW()))  AS total_mes_actual,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', f.created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')) AS total_mes_anterior
FROM dw.fact_consulta f;

CREATE OR REPLACE VIEW dw.v_tendencia_mensual AS
SELECT
  m.id_mes,
  m.anio,
  m.mes,
  m.nombre_mes,
  m.trimestre,
  TO_CHAR(TO_DATE(m.id_mes::TEXT, 'YYYYMM'), 'Mon YY') AS periodo,
  COUNT(f.id)                                          AS total,
  COUNT(f.id) FILTER (WHERE f.nivel_viabilidad = 'ALTO') AS resueltos,
  ROUND(AVG(f.score_viabilidad), 1)                    AS score_promedio
FROM dw.dim_tiempo_mes m
LEFT JOIN dw.fact_consulta f ON f.id_tiempo_mes = m.id_mes
WHERE m.anio BETWEEN 2024 AND 2030
GROUP BY m.id_mes, m.anio, m.mes, m.nombre_mes, m.trimestre
ORDER BY m.id_mes;

CREATE OR REPLACE VIEW dw.v_por_alcaldia AS
SELECT
  a.clave,
  a.nombre,
  a.nombre_corto,
  a.zona_cdmx,
  COUNT(f.id)                                         AS total,
  ROUND(AVG(f.score_viabilidad), 1)                   AS score_promedio,
  COUNT(f.id) FILTER (WHERE f.nivel_viabilidad = 'ALTO') AS alto_viabilidad,
  ROUND(COUNT(f.id) FILTER (WHERE f.nivel_viabilidad = 'ALTO') * 100.0 / NULLIF(COUNT(f.id),0), 1) AS pct_resueltos,
  ROUND(AVG(f.dias_apertura_est), 1)                  AS promedio_dias
FROM dw.dim_alcaldia a
LEFT JOIN dw.fact_consulta f ON f.id_alcaldia = a.id
GROUP BY a.id, a.clave, a.nombre, a.nombre_corto, a.zona_cdmx
ORDER BY total DESC;

CREATE OR REPLACE VIEW dw.v_por_tipo_giro AS
SELECT
  g.clave_giro                                        AS clave,
  g.nombre                                            AS tipo,
  g.tipo_siapem,
  g.nivel_riesgo,
  COUNT(f.id)                                         AS total,
  ROUND(AVG(f.score_viabilidad), 1)                   AS score_promedio,
  ROUND(COUNT(f.id) FILTER (WHERE f.nivel_viabilidad = 'ALTO') * 100.0 / NULLIF(COUNT(f.id),0), 1) AS pct_resueltos,
  ROUND(AVG(f.dias_apertura_est), 1)                  AS promedio_dias
FROM dw.dim_giro g
LEFT JOIN dw.fact_consulta f ON f.id_giro = g.id
GROUP BY g.id, g.clave_giro, g.nombre, g.tipo_siapem, g.nivel_riesgo
ORDER BY total DESC;

CREATE OR REPLACE VIEW dw.v_por_estado AS
SELECT
  e.clave,
  e.nombre,
  e.color_hex,
  e.es_terminal,
  COUNT(f.id)                                         AS total,
  ROUND(COUNT(f.id) * 100.0 / NULLIF(SUM(COUNT(f.id)) OVER (), 0), 1) AS porcentaje
FROM dw.dim_estado_tramite e
LEFT JOIN dw.fact_consulta f ON f.id_estado_tramite = e.id
GROUP BY e.id, e.clave, e.nombre, e.color_hex, e.es_terminal
ORDER BY total DESC;

-- ── RLS EN ESQUEMA DW (solo lectura) ────────────────────────

ALTER TABLE dw.dim_alcaldia          ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.dim_giro              ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.dim_persona_juridica  ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.dim_estado_tramite    ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.dim_tiempo_mes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.dim_tiempo_dia        ENABLE ROW LEVEL SECURITY;
ALTER TABLE dw.fact_consulta         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dw lectura publica alcaldia"  ON dw.dim_alcaldia         FOR SELECT USING (true);
CREATE POLICY "dw lectura publica giro"      ON dw.dim_giro             FOR SELECT USING (true);
CREATE POLICY "dw lectura publica persona"   ON dw.dim_persona_juridica FOR SELECT USING (true);
CREATE POLICY "dw lectura publica estado"    ON dw.dim_estado_tramite   FOR SELECT USING (true);
CREATE POLICY "dw lectura publica tmes"      ON dw.dim_tiempo_mes       FOR SELECT USING (true);
CREATE POLICY "dw lectura publica tdia"      ON dw.dim_tiempo_dia       FOR SELECT USING (true);
CREATE POLICY "dw lectura publica fact"      ON dw.fact_consulta        FOR SELECT USING (true);
CREATE POLICY "dw insertar fact"             ON dw.fact_consulta        FOR INSERT WITH CHECK (true);

SELECT 'Data Warehouse creado: ' || COUNT(*) || ' dias generados' AS resultado
FROM dw.dim_tiempo_dia;
