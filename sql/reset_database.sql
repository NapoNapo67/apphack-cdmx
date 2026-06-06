-- ═══════════════════════════════════════════════════════════
-- reset_database.sql — Radar CDMX (Reto 1 SEDECO)
-- Análisis territorial de datos geográficos CDMX
-- NO afecta esquema dw.* ni catálogos universales
-- ═══════════════════════════════════════════════════════════

-- ── PASO 1: LIMPIAR ──────────────────────────────────────
DROP TABLE IF EXISTS public.inconsistencia       CASCADE;
DROP TABLE IF EXISTS public.registro_capa        CASCADE;
DROP TABLE IF EXISTS public.capa_geografica      CASCADE;
DROP TABLE IF EXISTS public.mercado_publico       CASCADE;
DROP TABLE IF EXISTS public.establecimiento       CASCADE;
DROP TABLE IF EXISTS public.cat_uso_suelo         CASCADE;
DROP TABLE IF EXISTS public.cat_sector_economico  CASCADE;
DROP TABLE IF EXISTS public.cat_fuente_dato       CASCADE;
DROP TABLE IF EXISTS public.cat_severidad         CASCADE;

-- ── PASO 2: CATÁLOGOS ────────────────────────────────────

CREATE TABLE public.cat_fuente_dato (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  url_origen  TEXT,
  activo      BOOLEAN DEFAULT true,
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_fuente_dato (clave, nombre, descripcion, url_origen, orden) VALUES
  ('DENUE',    'DENUE — INEGI',         'Directorio Estadístico Nacional de Unidades Económicas', 'https://www.inegi.org.mx', 1),
  ('MERCADOS', 'Mercados Públicos CDMX','Padrón de mercados públicos de la Ciudad de México',    'https://datos.cdmx.gob.mx', 2),
  ('USO_SUELO','Uso de Suelo SEDUVI',   'Zonificación de uso de suelo CDMX',                     'http://ciudadmx.cdmx.gob.mx:8080/seduvi/', 3),
  ('MANUAL',   'Carga Manual',          'Datos ingresados manualmente por el usuario',            NULL, 4),
  ('CARGA',    'Archivo Subido',        'Datos cargados desde archivo CSV o GeoJSON',             NULL, 5);

CREATE TABLE public.cat_sector_economico (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(10) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  color_hex   VARCHAR(7),
  activo      BOOLEAN DEFAULT true,
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_sector_economico (clave, nombre, descripcion, color_hex, orden) VALUES
  ('COM',  'Comercio al por menor',     'Tiendas, abarrotes, mercados, papelerías',           '#3B82F6', 1),
  ('SER',  'Servicios',                 'Restaurantes, peluquerías, talleres, consultorios',  '#8B5CF6', 2),
  ('MAN',  'Manufactura',               'Industria, fabricación, producción',                 '#F59E0B', 3),
  ('ALI',  'Alimentos y Bebidas',       'Restaurantes, fondas, cafeterías, bares',            '#EF4444', 4),
  ('SAL',  'Salud',                     'Consultorios, farmacias, laboratorios',              '#10B981', 5),
  ('EDU',  'Educación',                 'Escuelas, guarderías, academias',                    '#6366F1', 6),
  ('TRA',  'Transporte y Logística',    'Agencias, talleres automotrices, fletes',            '#EC4899', 7),
  ('COM_M','Comercio al por mayor',     'Distribuidoras, bodegas, mayoristas',                '#14B8A6', 8);

CREATE TABLE public.cat_uso_suelo (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  color_hex   VARCHAR(7),
  permite_comercio   BOOLEAN DEFAULT false,
  permite_industria  BOOLEAN DEFAULT false,
  permite_servicios  BOOLEAN DEFAULT false,
  activo      BOOLEAN DEFAULT true,
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_uso_suelo (clave, nombre, descripcion, color_hex, permite_comercio, permite_industria, permite_servicios, orden) VALUES
  ('HAB',   'Habitacional',             'Uso exclusivo residencial',                        '#FDE68A', false, false, false, 1),
  ('HAB_M', 'Habitacional Mixto',       'Residencial con comercio en planta baja',          '#FCD34D', true,  false, true,  2),
  ('COM',   'Comercial',                'Uso comercial y de servicios',                     '#93C5FD', true,  false, true,  3),
  ('COM_S', 'Corredor Urbano',          'Comercio y servicios sobre vialidades primarias',  '#60A5FA', true,  false, true,  4),
  ('IND',   'Industrial',              'Uso industrial y manufactura',                     '#D1D5DB', true,  true,  true,  5),
  ('EQU',   'Equipamiento',             'Uso para equipamiento urbano (escuelas, hospitales)','#86EFAC',false,false, true,  6),
  ('VER',   'Área Verde',              'Parques, jardines, zonas de conservación',         '#4ADE80', false, false, false, 7),
  ('MIX',   'Mixto',                   'Usos mixtos permitidos por SEDUVI',                '#C4B5FD', true,  true,  true,  8);

CREATE TABLE public.cat_severidad (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(10) UNIQUE NOT NULL,
  nombre      VARCHAR(50) NOT NULL,
  color_hex   VARCHAR(7),
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_severidad (clave, nombre, color_hex, orden) VALUES
  ('ALTA',  'Alta',  '#EF4444', 1),
  ('MEDIA', 'Media', '#F59E0B', 2),
  ('BAJA',  'Baja',  '#10B981', 3);

-- ── PASO 3: TABLAS PRINCIPALES ───────────────────────────

CREATE TABLE public.establecimiento (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Identificación
  nombre             VARCHAR(200) NOT NULL,
  razon_social       VARCHAR(200),
  -- Clasificación (FKs a catálogos)
  sector_id          UUID REFERENCES public.cat_sector_economico(id),
  fuente_id          UUID REFERENCES public.cat_fuente_dato(id),
  uso_suelo_real_id  UUID REFERENCES public.cat_uso_suelo(id),   -- lo que dice SEDUVI
  uso_suelo_op_id    UUID REFERENCES public.cat_uso_suelo(id),   -- lo que opera en realidad
  estado_tramite     VARCHAR(20) REFERENCES public.cat_estado_tramite(clave) DEFAULT 'NUEVO',
  -- Ubicación geográfica
  latitud            NUMERIC(10,7) NOT NULL,
  longitud           NUMERIC(10,7) NOT NULL,
  alcaldia_id        UUID REFERENCES dw.dim_alcaldia(id),
  direccion          TEXT,
  colonia            VARCHAR(100),
  cp                 VARCHAR(10),
  -- Atributos DENUE
  clave_scian        VARCHAR(10),
  num_empleados      INTEGER,
  telefono           VARCHAR(20),
  correo             VARCHAR(100),
  -- Flags de análisis
  tiene_inconsistencia BOOLEAN DEFAULT false,
  verificado         BOOLEAN DEFAULT false,
  -- Auditoría
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by         UUID,
  updated_by         UUID
);

CREATE TABLE public.mercado_publico (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre             VARCHAR(200) NOT NULL,
  clave_oficial      VARCHAR(20),
  alcaldia_id        UUID REFERENCES dw.dim_alcaldia(id),
  latitud            NUMERIC(10,7) NOT NULL,
  longitud           NUMERIC(10,7) NOT NULL,
  direccion          TEXT,
  colonia            VARCHAR(100),
  num_locales        INTEGER,
  num_locales_activos INTEGER,
  uso_suelo_id       UUID REFERENCES public.cat_uso_suelo(id),
  estado_tramite     VARCHAR(20) REFERENCES public.cat_estado_tramite(clave) DEFAULT 'NUEVO',
  fecha_apertura     DATE,
  tiene_inconsistencia BOOLEAN DEFAULT false,
  -- Auditoría
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by         UUID,
  updated_by         UUID
);

CREATE TABLE public.capa_geografica (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre             VARCHAR(200) NOT NULL,
  descripcion        TEXT,
  fuente_id          UUID REFERENCES public.cat_fuente_dato(id),
  tipo_archivo       VARCHAR(10),   -- CSV, GEOJSON, SHP
  num_registros      INTEGER DEFAULT 0,
  alcaldia_filtro    UUID REFERENCES dw.dim_alcaldia(id),
  fecha_datos        DATE,
  estado_tramite     VARCHAR(20) REFERENCES public.cat_estado_tramite(clave) DEFAULT 'EN_PROCESO',
  -- Auditoría
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by         UUID,
  updated_by         UUID
);

CREATE TABLE public.registro_capa (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  capa_id            UUID REFERENCES public.capa_geografica(id) ON DELETE CASCADE,
  latitud            NUMERIC(10,7),
  longitud           NUMERIC(10,7),
  atributos          JSONB DEFAULT '{}',   -- todos los campos del archivo original
  tiene_inconsistencia BOOLEAN DEFAULT false,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.inconsistencia (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Puede pertenecer a establecimiento O mercado O registro de capa
  establecimiento_id    UUID REFERENCES public.establecimiento(id),
  mercado_id            UUID REFERENCES public.mercado_publico(id),
  registro_capa_id      UUID REFERENCES public.registro_capa(id),
  -- Clasificación
  tipo                  VARCHAR(50) NOT NULL,  -- USO_SUELO, DUPLICADO, COORDENADA, DATOS
  severidad_clave       VARCHAR(10) REFERENCES public.cat_severidad(clave),
  descripcion           TEXT NOT NULL,
  recomendacion         TEXT,
  -- Estado
  estado_tramite        VARCHAR(20) REFERENCES public.cat_estado_tramite(clave) DEFAULT 'NUEVO',
  analizado_por_ia      BOOLEAN DEFAULT false,
  ia_respuesta          TEXT,
  -- Auditoría
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by            UUID,
  updated_by            UUID
);

-- Índices para búsqueda geoespacial
CREATE INDEX IF NOT EXISTS idx_est_latlon   ON public.establecimiento(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_est_alcaldia ON public.establecimiento(alcaldia_id);
CREATE INDEX IF NOT EXISTS idx_est_sector   ON public.establecimiento(sector_id);
CREATE INDEX IF NOT EXISTS idx_mrc_latlon   ON public.mercado_publico(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_reg_latlon   ON public.registro_capa(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_reg_capa     ON public.registro_capa(capa_id);
CREATE INDEX IF NOT EXISTS idx_inco_est     ON public.inconsistencia(establecimiento_id);

-- ── PASO 4: DATOS SINTÉTICOS REALISTAS ───────────────────
-- Coordenadas reales de CDMX por alcaldía

INSERT INTO public.establecimiento (
  nombre, razon_social, sector_id, fuente_id, uso_suelo_real_id, uso_suelo_op_id,
  estado_tramite, latitud, longitud, alcaldia_id, direccion, colonia,
  clave_scian, num_empleados, tiene_inconsistencia, verificado
) VALUES

-- Iztapalapa
('Abarrotes El Buen Gusto',  'Martínez García SA',     (SELECT id FROM cat_sector_economico WHERE clave='COM'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB'),   (SELECT id FROM cat_uso_suelo WHERE clave='COM'),  'RESUELTO',    19.3571, -99.0662, (SELECT id FROM dw.dim_alcaldia WHERE clave='IZP'), 'Av. Ermita Iztapalapa 321',  'Iztapalapa',   '461110', 3, true,  true),
('Taller Mecánico Chávez',   'Chávez Hnos SC',          (SELECT id FROM cat_sector_economico WHERE clave='TRA'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB'),   (SELECT id FROM cat_uso_suelo WHERE clave='IND'),  'PENDIENTE',   19.3612, -99.0714, (SELECT id FROM dw.dim_alcaldia WHERE clave='IZP'), 'Calle Texcoco 88',           'Agrícola Oriental','432310', 8, true,  false),
('Farmacia del Ahorro',      'Chedraui SA de CV',       (SELECT id FROM cat_sector_economico WHERE clave='SAL'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM'),   (SELECT id FROM cat_uso_suelo WHERE clave='COM'),  'RESUELTO',    19.3544, -99.0598, (SELECT id FROM dw.dim_alcaldia WHERE clave='IZP'), 'Av. Rojo Gómez 412',         'Iztapalapa',   '464111', 5, false, true),
('Restaurante Los Compadres','Ramírez Olmos SA',         (SELECT id FROM cat_sector_economico WHERE clave='ALI'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB_M'), (SELECT id FROM cat_uso_suelo WHERE clave='ALI'),  'RESUELTO',    19.3688, -99.0734, (SELECT id FROM dw.dim_alcaldia WHERE clave='IZP'), 'Av. Telecomunicaciones 209', 'El Vergel',    '722514', 12,false, true),
('Bodega de Material',       'Construcciones Rey SA',   (SELECT id FROM cat_sector_economico WHERE clave='COM_M'),(SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB'),   (SELECT id FROM cat_uso_suelo WHERE clave='COM_M'),'NUEVO',       19.3502, -99.0820, (SELECT id FROM dw.dim_alcaldia WHERE clave='IZP'), 'Calle 7 Norte 156',          'Los Ángeles',  '434219', 4, true,  false),

-- Gustavo A. Madero
('OXXO Insurgentes Norte',   'Femsa Comercio SA',       (SELECT id FROM cat_sector_economico WHERE clave='COM'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM_S'), (SELECT id FROM cat_uso_suelo WHERE clave='COM'),  'RESUELTO',    19.4845, -99.1102, (SELECT id FROM dw.dim_alcaldia WHERE clave='GAM'), 'Insurgentes Norte 1892',     'Lindavista',   '461110', 4, false, true),
('Tortillería La Esperanza', 'García Torres SA',        (SELECT id FROM cat_sector_economico WHERE clave='ALI'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB'),   (SELECT id FROM cat_uso_suelo WHERE clave='ALI'),  'EN_PROCESO',  19.4762, -99.1188, (SELECT id FROM dw.dim_alcaldia WHERE clave='GAM'), 'Calle Magnolia 43',          'Tepeyac',      '311812', 6, true,  false),
('Escuela de Corte y Conf.', 'Academia Morelos AC',     (SELECT id FROM cat_sector_economico WHERE clave='EDU'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='EQU'),   (SELECT id FROM cat_uso_suelo WHERE clave='EDU'),  'RESUELTO',    19.4899, -99.1245, (SELECT id FROM dw.dim_alcaldia WHERE clave='GAM'), 'Av. de las Culturas 78',     'La Raza',      '611119', 25,false, true),
('Mueblería Los Pinos',      'Torres Muebles SA',       (SELECT id FROM cat_sector_economico WHERE clave='COM'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM'),   (SELECT id FROM cat_uso_suelo WHERE clave='COM'),  'RESUELTO',    19.4803, -99.1305, (SELECT id FROM dw.dim_alcaldia WHERE clave='GAM'), 'Av. Montevideo 556',         'Vallejo',      '461219', 8, false, true),
('Purificadora Cristal',     'Aguas Puras CDMX SA',    (SELECT id FROM cat_sector_economico WHERE clave='MAN'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB_M'), (SELECT id FROM cat_uso_suelo WHERE clave='MAN'),  'ASIGNADO',    19.4720, -99.1178, (SELECT id FROM dw.dim_alcaldia WHERE clave='GAM'), 'Calle 5 de Febrero 22',      'Santo Tomás',  '311411', 3, true,  false),

-- Cuauhtémoc
('Restaurante El Cardenal',  'Cardenal Rest SA',        (SELECT id FROM cat_sector_economico WHERE clave='ALI'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM_S'), (SELECT id FROM cat_uso_suelo WHERE clave='ALI'),  'RESUELTO',    19.4328, -99.1398, (SELECT id FROM dw.dim_alcaldia WHERE clave='CUH'), 'Palma 23 Centro Histórico',  'Centro',       '722511', 45,false, true),
('Papelería La Comercial',   'Suárez Papeles SA',       (SELECT id FROM cat_sector_economico WHERE clave='COM'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM'),   (SELECT id FROM cat_uso_suelo WHERE clave='COM'),  'RESUELTO',    19.4285, -99.1421, (SELECT id FROM dw.dim_alcaldia WHERE clave='CUH'), 'Donceles 89',                'Centro',       '461612', 7, false, true),
('Consultorio Dr. Méndez',   'Médicos Unidos SC',       (SELECT id FROM cat_sector_economico WHERE clave='SAL'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB_M'), (SELECT id FROM cat_uso_suelo WHERE clave='SAL'),  'RESUELTO',    19.4367, -99.1356, (SELECT id FROM dw.dim_alcaldia WHERE clave='CUH'), 'Insurgentes Centro 149',     'Tabacalera',   '621111', 3, false, true),
('Hotel Histórico',          'Hotelera CDMX SA',        (SELECT id FROM cat_sector_economico WHERE clave='SER'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM_S'), (SELECT id FROM cat_uso_suelo WHERE clave='SER'),  'RESUELTO',    19.4312, -99.1445, (SELECT id FROM dw.dim_alcaldia WHERE clave='CUH'), 'Av. Juárez 76',              'Centro',       '721111', 85,false, true),
('Imprenta Rápida',          'Impresos del Centro SA',  (SELECT id FROM cat_sector_economico WHERE clave='MAN'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB'),   (SELECT id FROM cat_uso_suelo WHERE clave='MAN'),  'NUEVO',       19.4290, -99.1388, (SELECT id FROM dw.dim_alcaldia WHERE clave='CUH'), 'República de Uruguay 112',   'Centro',       '323119', 12,true,  false),

-- Coyoacán
('Librería El Sótano',       'Libros y Arte SA',        (SELECT id FROM cat_sector_economico WHERE clave='COM'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM_S'), (SELECT id FROM cat_uso_suelo WHERE clave='COM'),  'RESUELTO',    19.3484, -99.1623, (SELECT id FROM dw.dim_alcaldia WHERE clave='COY'), 'Miguel Ángel de Quevedo 7',  'Romero Rubio', '461613', 9, false, true),
('Café La Vuelta',           'Cafés Especiales SC',     (SELECT id FROM cat_sector_economico WHERE clave='ALI'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB_M'), (SELECT id FROM cat_uso_suelo WHERE clave='ALI'),  'RESUELTO',    19.3502, -99.1644, (SELECT id FROM dw.dim_alcaldia WHERE clave='COY'), 'Francisco Sosa 258',         'Coyoacán',     '722515', 15,false, true),
('Taller de Cerámica',       'Artes Artesanales SA',    (SELECT id FROM cat_sector_economico WHERE clave='MAN'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB'),   (SELECT id FROM cat_uso_suelo WHERE clave='MAN'),  'PENDIENTE',   19.3448, -99.1598, (SELECT id FROM dw.dim_alcaldia WHERE clave='COY'), 'Calle Aguayo 34',            'Del Carmen',   '327219', 4, true,  false),
('Gym Iron Body',            'Deportes Sur SA',         (SELECT id FROM cat_sector_economico WHERE clave='SER'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM'),   (SELECT id FROM cat_uso_suelo WHERE clave='SER'),  'RESUELTO',    19.3525, -99.1678, (SELECT id FROM dw.dim_alcaldia WHERE clave='COY'), 'Av. Copilco 245',            'Copilco',      '713940', 6, false, true),

-- Miguel Hidalgo
('Concesionaria BMW',        'Auto Premium SA',         (SELECT id FROM cat_sector_economico WHERE clave='TRA'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM_S'), (SELECT id FROM cat_uso_suelo WHERE clave='TRA'),  'RESUELTO',    19.4234, -99.1889, (SELECT id FROM dw.dim_alcaldia WHERE clave='MIH'), 'Av. Ejército Nacional 843',  'Polanco',      '441120', 35,false, true),
('Restaurante Pujol',        'Cocina Creativa SA',      (SELECT id FROM cat_sector_economico WHERE clave='ALI'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB_M'), (SELECT id FROM cat_uso_suelo WHERE clave='ALI'),  'RESUELTO',    19.4267, -99.1934, (SELECT id FROM dw.dim_alcaldia WHERE clave='MIH'), 'Tennyson 133',               'Polanco',      '722511', 55,false, true),
('Clinica Santa Fe',         'Servicios Médicos SA',    (SELECT id FROM cat_sector_economico WHERE clave='SAL'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='EQU'),   (SELECT id FROM cat_uso_suelo WHERE clave='SAL'),  'RESUELTO',    19.4189, -99.2012, (SELECT id FROM dw.dim_alcaldia WHERE clave='MIH'), 'Vasco de Quiroga 3000',      'Santa Fe',     '621210', 220,false,true),

-- Álvaro Obregón
('Bodega Aurrerá Express',   'Walmart SA de CV',        (SELECT id FROM cat_sector_economico WHERE clave='COM'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM'),   (SELECT id FROM cat_uso_suelo WHERE clave='COM'),  'RESUELTO',    19.3612, -99.1978, (SELECT id FROM dw.dim_alcaldia WHERE clave='OBR'), 'Av. Observatorio 601',       'Observatorio', '462111', 22,false, true),
('Taller de Costura',        'Confecciones Obreg SA',   (SELECT id FROM cat_sector_economico WHERE clave='MAN'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB'),   (SELECT id FROM cat_uso_suelo WHERE clave='MAN'),  'ASIGNADO',    19.3580, -99.2034, (SELECT id FROM dw.dim_alcaldia WHERE clave='OBR'), 'Calle Centenario 23',        'San Ángel',    '315111', 8, true,  false),

-- Benito Juárez
('Oficinas Coworking Hub',   'Espacios Profesionales', (SELECT id FROM cat_sector_economico WHERE clave='SER'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM_S'), (SELECT id FROM cat_uso_suelo WHERE clave='SER'),  'RESUELTO',    19.3784, -99.1589, (SELECT id FROM dw.dim_alcaldia WHERE clave='BEN'), 'Insurgentes Sur 925',        'Nápoles',      '531190', 18,false, true),
('Farmacia San Pablo',       'Farmacias SP SA',         (SELECT id FROM cat_sector_economico WHERE clave='SAL'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='COM_S'), (SELECT id FROM cat_uso_suelo WHERE clave='SAL'),  'RESUELTO',    19.3815, -99.1623, (SELECT id FROM dw.dim_alcaldia WHERE clave='BEN'), 'Av. del Imán 456',           'Narvarte',     '464111', 6, false, true),
('Depósito de Gas LP',       'Gas Natural CDMX SA',    (SELECT id FROM cat_sector_economico WHERE clave='COM_M'),(SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='HAB'),   (SELECT id FROM cat_uso_suelo WHERE clave='IND'),  'NUEVO',       19.3756, -99.1642, (SELECT id FROM dw.dim_alcaldia WHERE clave='BEN'), 'Calle Oklahoma 78',          'Nápoles',      '467113', 4, true,  false),

-- Tlalpan
('Vivero Los Prados',        'Flores y Plantas SA',     (SELECT id FROM cat_sector_economico WHERE clave='COM'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='VER'),   (SELECT id FROM cat_uso_suelo WHERE clave='COM'),  'PENDIENTE',   19.2890, -99.1678, (SELECT id FROM dw.dim_alcaldia WHERE clave='TLP'), 'Camino a Ajusco 678',        'Tlalpan',      '462113', 7, true,  false),
('Clínica IMSS T-III',       'IMSS',                   (SELECT id FROM cat_sector_economico WHERE clave='SAL'),  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'), (SELECT id FROM cat_uso_suelo WHERE clave='EQU'),   (SELECT id FROM cat_uso_suelo WHERE clave='SAL'),  'RESUELTO',    19.2934, -99.1523, (SELECT id FROM dw.dim_alcaldia WHERE clave='TLP'), 'Av. San Fernando 220',       'Tlalpan',      '621210', 180,false,true);

-- Mercados Públicos (muestra representativa)
INSERT INTO public.mercado_publico (
  nombre, clave_oficial, alcaldia_id, latitud, longitud, direccion, colonia,
  num_locales, num_locales_activos, uso_suelo_id, estado_tramite, fecha_apertura, tiene_inconsistencia
) VALUES
  ('Mercado de Jamaica',       'MJ-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='VEN'), 19.4030, -99.1245, 'Guillermo Prieto s/n',      'Jamaica',       320, 298, (SELECT id FROM cat_uso_suelo WHERE clave='EQU'), 'RESUELTO', '1957-01-01', false),
  ('Mercado de Medellín',      'MM-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='BEN'), 19.4023, -99.1678, 'Campeche s/n',              'Roma Sur',      186, 172, (SELECT id FROM cat_uso_suelo WHERE clave='EQU'), 'RESUELTO', '1955-01-01', false),
  ('Mercado de Sonora',        'MS-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='VEN'), 19.4191, -99.1123, 'Fray Servando Teresa 419',  'Merced Balbuena',450, 420, (SELECT id FROM cat_uso_suelo WHERE clave='COM'), 'RESUELTO', '1952-01-01', false),
  ('Mercado de Tlalpan',       'MT-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='TLP'), 19.2934, -99.1612, 'Av. San Fernando 123',      'Tlalpan',       212, 198, (SELECT id FROM cat_uso_suelo WHERE clave='EQU'), 'RESUELTO', '1960-01-01', false),
  ('Mercado Iztapalapa',       'MI-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='IZP'), 19.3571, -99.0745, 'Av. Ermita Iztapalapa 102', 'San Pablo',     380, 312, (SELECT id FROM cat_uso_suelo WHERE clave='EQU'), 'EN_PROCESO','1948-01-01',false),
  ('Mercado de Azcapotzalco',  'MA-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='AZC'), 19.4890, -99.1845, 'Av. Azcapotzalco La Villa', 'Del Recreo',   145, 130, (SELECT id FROM cat_uso_suelo WHERE clave='EQU'), 'RESUELTO', '1965-01-01', false),
  ('Mercado de Coyoacán',      'MC-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='COY'), 19.3489, -99.1623, 'Ignacio Allende s/n',       'Coyoacán',     220, 205, (SELECT id FROM cat_uso_suelo WHERE clave='EQU'), 'RESUELTO', '1956-01-01', false),
  ('Mercado de Xochimilco',    'MX-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='XOC'), 19.2590, -99.1032, 'Pino 9',                    'Xochimilco',   167, 145, (SELECT id FROM cat_uso_suelo WHERE clave='HAB_M'),'PENDIENTE','1953-01-01',true),
  ('Mercado de Mixcoac',       'MM-002', (SELECT id FROM dw.dim_alcaldia WHERE clave='OBR'), 19.3734, -99.1878, 'Av. Patriotismo 789',       'Mixcoac',      189, 178, (SELECT id FROM cat_uso_suelo WHERE clave='EQU'), 'RESUELTO', '1961-01-01', false),
  ('Mercado de la Merced',     'MLM-001',(SELECT id FROM dw.dim_alcaldia WHERE clave='VEN'), 19.4234, -99.1198, 'Anillo de Circunvalación',  'Merced',       620, 580, (SELECT id FROM cat_uso_suelo WHERE clave='COM'), 'RESUELTO', '1957-01-01', false),
  ('Mercado de Tepito',        'MTP-001',(SELECT id FROM dw.dim_alcaldia WHERE clave='CUH'), 19.4412, -99.1245, 'Toltecas y Aztecas s/n',    'Tepito',       540, 498, (SELECT id FROM cat_uso_suelo WHERE clave='COM'), 'ASIGNADO', '1950-01-01', false),
  ('Mercado G.A. Madero',      'MG-001', (SELECT id FROM dw.dim_alcaldia WHERE clave='GAM'), 19.4789, -99.1134, 'Av. 608 No. 23',            'San Juan de A.',156, 142, (SELECT id FROM cat_uso_suelo WHERE clave='EQU'), 'RESUELTO', '1963-01-01', false);

-- Capa geográfica de ejemplo (simulando una carga desde CSV)
INSERT INTO public.capa_geografica (nombre, descripcion, fuente_id, tipo_archivo, num_registros, estado_tramite, fecha_datos)
VALUES (
  'DENUE CDMX — Carga inicial',
  'Establecimientos del Directorio Estadístico Nacional cargados para análisis territorial',
  (SELECT id FROM cat_fuente_dato WHERE clave='DENUE'),
  'CSV', 30, 'RESUELTO', '2025-01-01'
);

-- Inconsistencias detectadas (pre-cargadas como ejemplos)
INSERT INTO public.inconsistencia (
  establecimiento_id, tipo, severidad_clave, descripcion, recomendacion,
  estado_tramite, analizado_por_ia
)
SELECT
  id,
  'USO_SUELO',
  CASE WHEN uso_suelo_real_id != uso_suelo_op_id THEN 'ALTA' ELSE 'MEDIA' END,
  'El establecimiento opera en uso de suelo ' ||
    (SELECT nombre FROM cat_uso_suelo WHERE id = uso_suelo_real_id) ||
    ' pero su actividad corresponde a ' ||
    (SELECT nombre FROM cat_uso_suelo WHERE id = uso_suelo_op_id),
  'Verificar con SEDUVI si cuenta con constancia de uso de suelo compatible. En caso contrario, iniciar trámite de regularización.',
  'NUEVO',
  false
FROM public.establecimiento
WHERE tiene_inconsistencia = true;

-- ── PASO 5: RLS ──────────────────────────────────────────

ALTER TABLE public.cat_fuente_dato       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_sector_economico  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_uso_suelo         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_severidad         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establecimiento       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mercado_publico       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capa_geografica       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_capa         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inconsistencia        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica" ON public.cat_fuente_dato      FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.cat_sector_economico FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.cat_uso_suelo        FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.cat_severidad        FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.establecimiento      FOR SELECT USING (true);
CREATE POLICY "insercion"       ON public.establecimiento      FOR INSERT WITH CHECK (true);
CREATE POLICY "actualizacion"   ON public.establecimiento      FOR UPDATE USING (true);
CREATE POLICY "lectura_publica" ON public.mercado_publico      FOR SELECT USING (true);
CREATE POLICY "insercion"       ON public.mercado_publico      FOR INSERT WITH CHECK (true);
CREATE POLICY "lectura_publica" ON public.capa_geografica      FOR SELECT USING (true);
CREATE POLICY "insercion"       ON public.capa_geografica      FOR INSERT WITH CHECK (true);
CREATE POLICY "actualizacion"   ON public.capa_geografica      FOR UPDATE USING (true);
CREATE POLICY "lectura_publica" ON public.registro_capa        FOR SELECT USING (true);
CREATE POLICY "insercion"       ON public.registro_capa        FOR INSERT WITH CHECK (true);
CREATE POLICY "lectura_publica" ON public.inconsistencia       FOR SELECT USING (true);
CREATE POLICY "insercion"       ON public.inconsistencia       FOR INSERT WITH CHECK (true);
CREATE POLICY "actualizacion"   ON public.inconsistencia       FOR UPDATE USING (true);
