-- ═══════════════════════════════════════════════════════════
-- reset_reto2.sql — Viabilidad de Negocios CDMX (Reto 2)
-- SEDECO — Herramienta para emprendedores e inversionistas
-- NO afecta esquema dw.* ni catálogos universales
-- ═══════════════════════════════════════════════════════════

-- ── PASO 1: LIMPIAR ──────────────────────────────────────
DROP TABLE IF EXISTS public.consulta_viabilidad    CASCADE;
DROP TABLE IF EXISTS public.ruta_tramite_detalle   CASCADE;
DROP TABLE IF EXISTS public.ruta_tramite           CASCADE;
DROP TABLE IF EXISTS public.tramite                CASCADE;
DROP TABLE IF EXISTS public.programa_emprendimiento CASCADE;
DROP TABLE IF EXISTS public.competencia_zona       CASCADE;
DROP TABLE IF EXISTS public.cat_programa_tipo      CASCADE;
DROP TABLE IF EXISTS public.cat_dependencia        CASCADE;
DROP TABLE IF EXISTS public.cat_tipo_tramite       CASCADE;
DROP TABLE IF EXISTS public.cat_tipo_persona       CASCADE;
DROP TABLE IF EXISTS public.cat_giro_negocio       CASCADE;
DROP TABLE IF EXISTS public.cat_categoria_giro     CASCADE;

-- ── PASO 2: CATÁLOGOS ────────────────────────────────────

CREATE TABLE public.cat_categoria_giro (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(100) NOT NULL,
  icono       VARCHAR(10),
  color_hex   VARCHAR(7),
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_categoria_giro (clave, nombre, icono, color_hex, orden) VALUES
  ('ALIMENTOS',   'Alimentos y Bebidas',    '🍽️', '#EF4444', 1),
  ('COMERCIO',    'Comercio',               '🛒', '#3B82F6', 2),
  ('SERVICIOS',   'Servicios',              '💼', '#8B5CF6', 3),
  ('MANUFACTURA', 'Manufactura',            '🏭', '#F59E0B', 4),
  ('SALUD',       'Salud y Bienestar',      '💊', '#10B981', 5),
  ('EDUCACION',   'Educación y Cultura',    '📚', '#6366F1', 6),
  ('TECNOLOGIA',  'Tecnología',             '💻', '#14B8A6', 7),
  ('TURISMO',     'Turismo y Hospedaje',    '🏨', '#EC4899', 8);

CREATE TABLE public.cat_giro_negocio (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave             VARCHAR(20) UNIQUE NOT NULL,
  nombre            VARCHAR(150) NOT NULL,
  categoria_id      UUID REFERENCES public.cat_categoria_giro(id),
  clave_scian       VARCHAR(10),
  descripcion       TEXT,
  -- Uso de suelo compatible (claves de cat_uso_suelo)
  uso_suelo_ok      TEXT[],   -- ['COM','COM_S','HAB_M','MIX']
  -- Riesgos y requerimientos
  requiere_licencia_funcionamiento BOOLEAN DEFAULT true,
  requiere_aviso_siapem            BOOLEAN DEFAULT false,
  requiere_permiso_construccion    BOOLEAN DEFAULT false,
  requiere_impacto_ambiental       BOOLEAN DEFAULT false,
  riesgo_sanitario  VARCHAR(10),  -- ALTO, MEDIO, BAJO
  aforo_max         INTEGER,
  nivel_inversion   VARCHAR(10),  -- BAJO, MEDIO, ALTO, MUY_ALTO
  meses_tramite     NUMERIC(4,1),
  activo            BOOLEAN DEFAULT true,
  orden             INTEGER DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_giro_negocio
  (clave, nombre, categoria_id, clave_scian, descripcion, uso_suelo_ok,
   requiere_licencia_funcionamiento, requiere_aviso_siapem, riesgo_sanitario,
   nivel_inversion, meses_tramite, orden)
VALUES
  ('TAQUERIA',    'Taquería / Fonda',
    (SELECT id FROM cat_categoria_giro WHERE clave='ALIMENTOS'), '722514',
    'Establecimiento de comida rápida mexicana con venta de tacos, tortas y similares',
    ARRAY['COM','COM_S','HAB_M','MIX'],  true, true,  'MEDIO', 'BAJO',  2.0, 1),

  ('RESTAURANTE', 'Restaurante con servicio a mesa',
    (SELECT id FROM cat_categoria_giro WHERE clave='ALIMENTOS'), '722511',
    'Establecimiento de alimentos con mesas, meseros y servicio completo',
    ARRAY['COM','COM_S','MIX'],          true, true,  'MEDIO', 'MEDIO', 3.0, 2),

  ('BAR_CANTINA', 'Bar / Cantina',
    (SELECT id FROM cat_categoria_giro WHERE clave='ALIMENTOS'), '722412',
    'Establecimiento con venta de bebidas alcohólicas y servicio de alimentos',
    ARRAY['COM','COM_S','MIX'],          true, true,  'ALTO',  'MEDIO', 4.5, 3),

  ('PANADERIA',   'Panadería / Pastelería',
    (SELECT id FROM cat_categoria_giro WHERE clave='ALIMENTOS'), '311811',
    'Elaboración y venta de pan, pasteles y repostería',
    ARRAY['COM','HAB_M','COM_S','MIX'],  true, false, 'BAJO',  'BAJO',  1.5, 4),

  ('TIENDA_ABAR', 'Tienda de Abarrotes',
    (SELECT id FROM cat_categoria_giro WHERE clave='COMERCIO'), '461110',
    'Venta al menudeo de alimentos, bebidas y productos de limpieza',
    ARRAY['COM','HAB_M','COM_S','MIX'],  true, false, 'BAJO',  'BAJO',  1.5, 5),

  ('FARMACIA',    'Farmacia',
    (SELECT id FROM cat_categoria_giro WHERE clave='SALUD'), '464111',
    'Venta de medicamentos, productos farmacéuticos y artículos de salud',
    ARRAY['COM','HAB_M','COM_S','EQU','MIX'], true, false, 'BAJO', 'MEDIO', 2.0, 6),

  ('SALON_BELL',  'Salón de Belleza / Barbería',
    (SELECT id FROM cat_categoria_giro WHERE clave='SERVICIOS'), '812110',
    'Servicios de corte de cabello, coloración, manicure y estética',
    ARRAY['COM','HAB_M','COM_S','MIX'],  true, false, 'BAJO',  'BAJO',  1.5, 7),

  ('TALLER_MEC',  'Taller Mecánico',
    (SELECT id FROM cat_categoria_giro WHERE clave='SERVICIOS'), '811111',
    'Reparación y mantenimiento de vehículos automotores',
    ARRAY['IND','COM','COM_S','MIX'],    true, true,  'ALTO',  'MEDIO', 3.5, 8),

  ('GIMNASIO',    'Gimnasio / Centro Deportivo',
    (SELECT id FROM cat_categoria_giro WHERE clave='SERVICIOS'), '713940',
    'Instalaciones para ejercicio físico, artes marciales y deporte',
    ARRAY['COM','COM_S','EQU','MIX'],    true, false, 'BAJO',  'MEDIO', 2.0, 9),

  ('ESCUELA',     'Escuela / Academia / Guardería',
    (SELECT id FROM cat_categoria_giro WHERE clave='EDUCACION'), '611119',
    'Servicios educativos, capacitación o cuidado de menores',
    ARRAY['EQU','HAB_M','COM','MIX'],    true, false, 'BAJO',  'MEDIO', 3.0, 10),

  ('OFICINA',     'Oficina / Coworking / Despacho',
    (SELECT id FROM cat_categoria_giro WHERE clave='SERVICIOS'), '531190',
    'Espacios de trabajo administrativo, profesional o compartido',
    ARRAY['COM','COM_S','HAB_M','MIX'],  true, false, 'BAJO',  'BAJO',  1.0, 11),

  ('HOTEL',       'Hotel / Hostal / Airbnb colectivo',
    (SELECT id FROM cat_categoria_giro WHERE clave='TURISMO'), '721111',
    'Hospedaje con más de 5 cuartos o unidades para turistas',
    ARRAY['COM','COM_S','MIX'],          true, true,  'MEDIO', 'ALTO',  4.0, 12),

  ('TIENDA_ROPA', 'Tienda de Ropa y Accesorios',
    (SELECT id FROM cat_categoria_giro WHERE clave='COMERCIO'), '461410',
    'Venta al menudeo de prendas de vestir, calzado y accesorios',
    ARRAY['COM','HAB_M','COM_S','MIX'],  true, false, 'BAJO',  'BAJO',  1.5, 13),

  ('FABRICA',     'Pequeña Industria / Taller de Manufactura',
    (SELECT id FROM cat_categoria_giro WHERE clave='MANUFACTURA'), '311',
    'Producción o transformación de bienes físicos a pequeña escala',
    ARRAY['IND','MIX'],                  true, true,  'ALTO',  'ALTO',  5.0, 14),

  ('CONSULTORIO', 'Consultorio Médico / Dental',
    (SELECT id FROM cat_categoria_giro WHERE clave='SALUD'), '621111',
    'Atención médica, dental, psicológica u otras especialidades de salud',
    ARRAY['EQU','HAB_M','COM','COM_S','MIX'], true, false, 'BAJO', 'BAJO', 2.0, 15),

  ('TECH_STARTUP','Startup / Empresa de Tecnología',
    (SELECT id FROM cat_categoria_giro WHERE clave='TECNOLOGIA'), '519130',
    'Empresa de software, apps, e-commerce o servicios digitales',
    ARRAY['COM','COM_S','HAB_M','MIX'],  false, false, 'BAJO', 'BAJO',  0.5, 16),

  ('VETERINARIA', 'Veterinaria / Estética Canina',
    (SELECT id FROM cat_categoria_giro WHERE clave='SALUD'), '541940',
    'Atención médica de animales y servicios de estética para mascotas',
    ARRAY['COM','HAB_M','COM_S','MIX'],  true, false, 'BAJO', 'BAJO',  2.0, 17),

  ('FERRETERIA',  'Ferretería / Tlapalería',
    (SELECT id FROM cat_categoria_giro WHERE clave='COMERCIO'), '431110',
    'Venta de herramientas, materiales de construcción y artículos de ferretería',
    ARRAY['COM','HAB_M','COM_S','MIX'],  true, false, 'BAJO', 'BAJO',  1.5, 18),

  ('LAVANDERIA',  'Lavandería / Tintorería',
    (SELECT id FROM cat_categoria_giro WHERE clave='SERVICIOS'), '812310',
    'Servicio de lavado, secado, planchado y tintorería de ropa',
    ARRAY['COM','HAB_M','COM_S','MIX'],  true, false, 'MEDIO','BAJO',  1.5, 19),

  ('PAPELERIA',   'Papelería / Copias / Impresión',
    (SELECT id FROM cat_categoria_giro WHERE clave='COMERCIO'), '461612',
    'Venta de artículos de papelería, servicio de copiado e impresión',
    ARRAY['COM','HAB_M','COM_S','MIX'],  true, false, 'BAJO', 'BAJO',  1.0, 20);

CREATE TABLE public.cat_tipo_persona (
  id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave  VARCHAR(10) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  ventajas    TEXT,
  desventajas TEXT,
  orden  INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_tipo_persona (clave, nombre, descripcion, ventajas, desventajas, orden) VALUES
  ('PF',    'Persona Física con Actividad Empresarial',
   'El emprendedor opera directamente como individuo ante el SAT.',
   'Trámites más sencillos, menos costos iniciales, ideal para negocios pequeños',
   'Responsabilidad ilimitada, límite de deducciones, imagen menos formal',
   1),
  ('PFAE',  'Persona Física — Régimen Simplificado de Confianza (RESICO)',
   'Personas físicas con ingresos hasta 3.5 MDP/año, impuestos simplificados.',
   'ISR reducido (1-2.5%), facturación simplificada, menos obligaciones contables',
   'Solo para ingresos hasta 3.5 MDP, no permite socios',
   2),
  ('SAS',   'Sociedad por Acciones Simplificada (S.A.S.)',
   'Sociedad mercantil para micro y pequeñas empresas, constitución 100% digital.',
   'Se constituye en línea gratis en un día, mínimo 1 socio, capital mínimo $1',
   'Solo para ingresos hasta 5 MDP, limitada a personas físicas mexicanas',
   3),
  ('SA',    'Sociedad Anónima (S.A. de C.V.)',
   'La forma corporativa tradicional para empresas medianas y grandes.',
   'Máxima protección de patrimonio, ideal para inversión, sin límite de capital',
   'Requiere notario (~$15,000-$30,000), mínimo 2 socios, más obligaciones fiscales',
   4),
  ('SAPI',  'Sociedad Anónima Promotora de Inversión (SAPI)',
   'Variante de S.A. diseñada para atraer inversión y capital de riesgo.',
   'Permite distintas clases de acciones, ideal para startups con inversionistas',
   'Mayor complejidad legal, requiere notario, para empresas con visión de crecimiento',
   5);

CREATE TABLE public.cat_dependencia (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave       VARCHAR(20) UNIQUE NOT NULL,
  nombre      VARCHAR(150) NOT NULL,
  nombre_corto VARCHAR(30),
  url_oficial TEXT,
  telefono    VARCHAR(30),
  activo      BOOLEAN DEFAULT true,
  orden       INTEGER DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_dependencia (clave, nombre, nombre_corto, url_oficial, orden) VALUES
  ('SAT',    'Servicio de Administración Tributaria',                            'SAT',      'https://www.sat.gob.mx',                               1),
  ('SEDECO', 'Secretaría de Desarrollo Económico CDMX',                         'SEDECO',   'https://sedeco.cdmx.gob.mx',                           2),
  ('SEDUVI', 'Secretaría de Desarrollo Urbano y Vivienda CDMX',                 'SEDUVI',   'http://ciudadmx.cdmx.gob.mx:8080/seduvi/',             3),
  ('ALCALDIA','Alcaldía correspondiente a la ubicación del negocio',             'Alcaldía', 'https://www.cdmx.gob.mx',                              4),
  ('SIAPEM', 'Sistema de Avisos y Permisos Mercantiles (ventanilla electrónica)','SIAPEM',   'https://siapem.cdmx.gob.mx',                           5),
  ('IMSS',   'Instituto Mexicano del Seguro Social',                             'IMSS',     'https://www.imss.gob.mx',                              6),
  ('COFEPRIS','Comisión Federal para la Protección contra Riesgos Sanitarios',   'COFEPRIS', 'https://www.gob.mx/cofepris',                          7),
  ('SEMARNAT','Secretaría de Medio Ambiente y Recursos Naturales',               'SEMARNAT', 'https://www.gob.mx/semarnat',                          8),
  ('PROFECO','Procuraduría Federal del Consumidor',                              'PROFECO',  'https://www.gob.mx/profeco',                           9),
  ('REPSE',  'Registro de Prestadores de Servicios Especializados (STPS)',       'REPSE',    'https://repse.stps.gob.mx',                           10),
  ('NOTARIO','Notario Público (para constitución de sociedad ante fedatario)',   'Notario',  NULL,                                                  11),
  ('SEECE',  'Sistema Electrónico de Constitución Empresarial (economía.gob.mx)','SE/ECE',   'https://www.gob.mx/empresas',                         12);

CREATE TABLE public.cat_tipo_tramite (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave      VARCHAR(20) UNIQUE NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  color_hex  VARCHAR(7),
  orden      INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_tipo_tramite (clave, nombre, color_hex, orden) VALUES
  ('CONSTITUCION',  'Constitución de Empresa',     '#6366F1', 1),
  ('FISCAL',        'Registro Fiscal',             '#F59E0B', 2),
  ('USO_SUELO',     'Uso de Suelo',                '#10B981', 3),
  ('PERMISO',       'Permiso / Licencia',          '#3B82F6', 4),
  ('AVISO',         'Aviso de Apertura',           '#8B5CF6', 5),
  ('SANITARIO',     'Registro Sanitario',          '#EF4444', 6),
  ('SEGURIDAD',     'Seguridad e Higiene',         '#EC4899', 7),
  ('LABORAL',       'Obligaciones Laborales',      '#14B8A6', 8),
  ('MARCA',         'Propiedad Intelectual',       '#C8A217', 9),
  ('PROGRAMA',      'Programa de Apoyo',           '#006847',10);

CREATE TABLE public.tramite (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave            VARCHAR(30) UNIQUE NOT NULL,
  nombre           VARCHAR(200) NOT NULL,
  descripcion      TEXT NOT NULL,
  tipo_id          UUID REFERENCES public.cat_tipo_tramite(id),
  dependencia_id   UUID REFERENCES public.cat_dependencia(id),
  -- Aplicabilidad
  aplica_pf        BOOLEAN DEFAULT true,
  aplica_pm        BOOLEAN DEFAULT true,
  aplica_giros     TEXT[],   -- NULL = todos los giros
  -- Detalles del trámite
  costo_min        NUMERIC(10,2),
  costo_max        NUMERIC(10,2),
  costo_descripcion VARCHAR(200),
  plazo_dias       INTEGER,  -- días hábiles
  vigencia_meses   INTEGER,  -- NULL = permanente
  url_tramite      TEXT,
  documentos       JSONB,    -- lista de documentos requeridos
  es_digital       BOOLEAN DEFAULT false,
  es_obligatorio   BOOLEAN DEFAULT true,
  observaciones    TEXT,
  orden_sugerido   INTEGER DEFAULT 0,
  activo           BOOLEAN DEFAULT true,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.tramite
  (clave, nombre, descripcion, tipo_id, dependencia_id,
   aplica_pf, aplica_pm, costo_min, costo_max, costo_descripcion,
   plazo_dias, vigencia_meses, url_tramite, documentos, es_digital,
   es_obligatorio, observaciones, orden_sugerido)
VALUES

-- ── CONSTITUCIÓN ────────────────────────────────────────
('RFC_PF', 'Alta en el RFC como Persona Física',
 'Registro ante el SAT para obtener la Clave Única de Registro de Población fiscal y poder emitir facturas.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='FISCAL'),
 (SELECT id FROM cat_dependencia WHERE clave='SAT'),
 true, false, 0, 0, 'Gratuito',
 1, NULL, 'https://www.sat.gob.mx/tramites/operacion/23824/inscripcion-al-rfc',
 '["CURP","Identificación oficial","Comprobante de domicilio"]',
 true, true, 'Puede hacerse en línea o en módulo SAT.', 1),

('SAS_CONSTITUCION', 'Constitución de S.A.S. (Sociedad por Acciones Simplificada)',
 'Constitución 100% digital y gratuita a través del sistema del Gobierno Federal. Lista en 24 horas.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='CONSTITUCION'),
 (SELECT id FROM cat_dependencia WHERE clave='SEECE'),
 false, true, 0, 0, 'Gratuito (solo para S.A.S.)',
 1, NULL, 'https://www.gob.mx/empresas',
 '["CURP de todos los socios","E.firma (firma electrónica SAT)","Acta constitutiva en sistema"]',
 true, true, 'Solo para S.A.S. Otros tipos de sociedad requieren notario.', 1),

('SA_NOTARIO', 'Constitución ante Notario (S.A. de C.V. / S. de R.L.)',
 'Protocolización del acta constitutiva ante notario público e inscripción en el Registro Público de Comercio.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='CONSTITUCION'),
 (SELECT id FROM cat_dependencia WHERE clave='NOTARIO'),
 false, true, 15000, 35000, '$15,000–$35,000 honorarios notariales aprox.',
 20, NULL, NULL,
 '["Acta constitutiva firmada","Identificaciones de socios","CURP de socios","Capital mínimo"]',
 false, true, 'Costo varía según capital social y notario. Incluye inscripción en RPC.', 1),

('RFC_PM', 'Alta en el RFC como Persona Moral',
 'Registro de la empresa ante el SAT para obtener el RFC de la sociedad y poder facturar.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='FISCAL'),
 (SELECT id FROM cat_dependencia WHERE clave='SAT'),
 false, true, 0, 0, 'Gratuito',
 3, NULL, 'https://www.sat.gob.mx',
 '["Acta constitutiva","E.firma del representante legal","Comprobante de domicilio fiscal","CURP del representante"]',
 true, true, 'Requiere contar primero con el acta constitutiva.', 2),

-- ── USO DE SUELO ────────────────────────────────────────
('CERT_USO_SUELO', 'Certificado Único de Zonificación de Uso de Suelo (SEDUVI)',
 'Documento que certifica el uso de suelo permitido en la ubicación elegida. Es el primer paso para cualquier establecimiento comercial.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='USO_SUELO'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDUVI'),
 true, true, 982, 2890, '$982–$2,890 según m² del predio',
 15, 12, 'https://www.cdmx.gob.mx/public/InformacionTramite.xhtml?idTramite=806',
 '["Solicitud","Identificación","Escritura o contrato de arrendamiento","Croquis de ubicación"]',
 false, true, 'OBLIGATORIO antes de cualquier obra o apertura. Verificar en http://ciudadmx.cdmx.gob.mx:8080/seduvi/', 3),

('CONSTANCIA_US', 'Constancia de Uso de Suelo Específico',
 'Para giros que requieren uso de suelo específico o condicionado por SEDUVI.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='USO_SUELO'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDUVI'),
 true, true, 2500, 8000, 'Variable según dictamen',
 30, 24, 'https://www.cdmx.gob.mx',
 '["Certificado de zonificación","Proyecto arquitectónico","Dictamen de impacto urbano si aplica"]',
 false, false, 'Solo requerida para giros condicionados o de alto impacto.', 4),

-- ── AVISOS Y PERMISOS (SIAPEM) ───────────────────────────
('AVISO_APERTURA', 'Aviso de Apertura de Establecimiento Mercantil (SIAPEM)',
 'Aviso electrónico para establecimientos mercantiles de bajo impacto. Permite abrir al día siguiente de presentarlo.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='AVISO'),
 (SELECT id FROM cat_dependencia WHERE clave='SIAPEM'),
 true, true, 0, 0, 'Gratuito',
 1, NULL, 'https://siapem.cdmx.gob.mx',
 '["RFC","Certificado de uso de suelo","CURP o acta constitutiva","Identificación oficial","Comprobante de domicilio del local"]',
 true, true, 'Para giros de impacto vecinal bajo. Revisar Ley de Establecimientos Mercantiles.', 5),

('PERMISO_SIAPEM', 'Permiso de Establecimiento Mercantil (SIAPEM — impacto medio/alto)',
 'Permiso para establecimientos de impacto vecinal medio o alto (bares, antros, industrias, cementerios, etc.).',
 (SELECT id FROM cat_tipo_tramite WHERE clave='PERMISO'),
 (SELECT id FROM cat_dependencia WHERE clave='SIAPEM'),
 true, true, 3500, 25000, 'Variable según tipo de giro e impacto',
 30, 24, 'https://siapem.cdmx.gob.mx',
 '["Todo lo del Aviso + Dictamen de impacto vecinal","Estudio de ruido si aplica","Visto bueno de Protección Civil"]',
 true, true, 'Para bares, talleres mecánicos, gasolineras, hospitales, etc.', 5),

('LIC_ALCOHOL', 'Licencia para Venta de Bebidas Alcohólicas',
 'Permiso especial para establecimientos que venden o sirven bebidas alcohólicas al público.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='PERMISO'),
 (SELECT id FROM cat_dependencia WHERE clave='ALCALDIA'),
 true, true, 8000, 45000, '$8,000–$45,000 según categoría del giro',
 45, 12, 'https://www.cdmx.gob.mx',
 '["Permiso SIAPEM vigente","Certificado de uso de suelo","Opinión vecinal favorable","No adeudo predial"]',
 false, false, 'Solo para bares, cantinas, restaurantes con bar, centros nocturnos. Renovación anual.', 6),

-- ── SANITARIO ────────────────────────────────────────────
('AVISO_SANITARIO', 'Aviso de Funcionamiento ante COFEPRIS',
 'Registro sanitario para establecimientos que manejan alimentos, medicamentos o productos de belleza.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='SANITARIO'),
 (SELECT id FROM cat_dependencia WHERE clave='COFEPRIS'),
 true, true, 0, 2500, 'Gratuito para algunos giros, hasta $2,500 para otros',
 5, NULL, 'https://www.gob.mx/cofepris/acciones-y-programas/aviso-de-funcionamiento',
 '["RFC","CURP o acta constitutiva","Croquis del establecimiento","Descripción de actividades"]',
 true, false, 'Obligatorio para alimentos, bebidas, farmacias, consultorios, estéticas.', 7),

('LIC_SANITARIA', 'Licencia Sanitaria (establecimientos de alto riesgo)',
 'Para establecimientos que requieren autorización sanitaria previa: hospitales, laboratorios, bancos de sangre.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='SANITARIO'),
 (SELECT id FROM cat_dependencia WHERE clave='COFEPRIS'),
 true, true, 5000, 30000, 'Variable según categoría',
 60, 24, 'https://www.gob.mx/cofepris',
 '["Proyecto del establecimiento","Responsable sanitario titulado","Planos y memorias técnicas"]',
 false, false, 'Solo para hospitales, laboratorios clínicos, unidades de hemodiálisis, etc.', 8),

-- ── SEGURIDAD ────────────────────────────────────────────
('PROT_CIVIL', 'Visto Bueno de Protección Civil',
 'Dictamen de que el establecimiento cumple con las medidas de seguridad para los trabajadores y el público.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='SEGURIDAD'),
 (SELECT id FROM cat_dependencia WHERE clave='ALCALDIA'),
 true, true, 1500, 8000, '$1,500–$8,000 según m² y giro',
 10, 12, 'https://www.cdmx.gob.mx',
 '["Plano del local","Memoria de cálculo estructural si aplica","Equipos contra incendio","Salidas de emergencia señalizadas"]',
 false, false, 'Obligatorio para establecimientos con aforo mayor a 50 personas o con riesgo.', 9),

-- ── LABORAL ──────────────────────────────────────────────
('IMSS_PATRON', 'Registro Patronal ante el IMSS',
 'Alta como empleador ante el IMSS para poder afiliar a tus trabajadores al seguro social.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='LABORAL'),
 (SELECT id FROM cat_dependencia WHERE clave='IMSS'),
 true, true, 0, 0, 'Gratuito',
 3, NULL, 'https://www.imss.gob.mx',
 '["RFC","CURP o acta constitutiva","Comprobante de domicilio fiscal","E.firma"]',
 true, true, 'Obligatorio si tienes aunque sea un empleado. Se hace al mismo tiempo que el primer trabajador.', 10),

-- ── MARCA ────────────────────────────────────────────────
('MARCA_IMPI', 'Registro de Marca ante el IMPI',
 'Protección legal del nombre comercial, logo o slogan de tu negocio a nivel nacional.',
 (SELECT id FROM cat_tipo_tramite WHERE clave='MARCA'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDECO'),
 true, true, 2458, 2458, '$2,458 por clase de productos/servicios',
 180, NULL, 'https://www.gob.mx/impi',
 '["Solicitud","Reproducción de la marca","Clasificación de productos/servicios","Pago de derechos"]',
 true, false, 'Recomendado antes de invertir en imagen. Protege por 10 años renovables.', 11);

-- ── RUTAS DE TRÁMITES POR GIRO Y TIPO DE PERSONA ─────────

CREATE TABLE public.ruta_tramite (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  giro_id         UUID REFERENCES public.cat_giro_negocio(id),
  tipo_persona_clave VARCHAR(10) REFERENCES public.cat_tipo_persona(clave),
  nombre          VARCHAR(200),
  descripcion     TEXT,
  total_tramites  INTEGER DEFAULT 0,
  costo_estimado_min NUMERIC(10,2),
  costo_estimado_max NUMERIC(10,2),
  meses_estimados NUMERIC(4,1),
  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.ruta_tramite_detalle (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ruta_id         UUID REFERENCES public.ruta_tramite(id) ON DELETE CASCADE,
  tramite_id      UUID REFERENCES public.tramite(id),
  orden           INTEGER NOT NULL,
  es_paralelo     BOOLEAN DEFAULT false, -- puede hacerse al mismo tiempo que el anterior
  es_condicional  BOOLEAN DEFAULT false, -- solo si aplica
  condicion_texto TEXT,
  nota_especifica TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ruta para Taquería como Persona Física
WITH ruta AS (
  INSERT INTO public.ruta_tramite (giro_id, tipo_persona_clave, nombre, descripcion,
    total_tramites, costo_estimado_min, costo_estimado_max, meses_estimados)
  VALUES (
    (SELECT id FROM cat_giro_negocio WHERE clave='TAQUERIA'), 'PF',
    'Abrir una Taquería como Persona Física',
    'Ruta completa para emprendedor que quiere abrir taquería/fonda operando como persona física',
    6, 982, 4000, 2.0
  ) RETURNING id
)
INSERT INTO public.ruta_tramite_detalle (ruta_id, tramite_id, orden, nota_especifica)
SELECT ruta.id, t.id, t.orden_sugerido, t.observaciones
FROM ruta, tramite t
WHERE t.clave IN ('RFC_PF','CERT_USO_SUELO','AVISO_APERTURA','AVISO_SANITARIO','PROT_CIVIL','IMSS_PATRON')
ORDER BY t.orden_sugerido;

-- Ruta para Restaurante como S.A.S.
WITH ruta AS (
  INSERT INTO public.ruta_tramite (giro_id, tipo_persona_clave, nombre, descripcion,
    total_tramites, costo_estimado_min, costo_estimado_max, meses_estimados)
  VALUES (
    (SELECT id FROM cat_giro_negocio WHERE clave='RESTAURANTE'), 'SAS',
    'Abrir un Restaurante como S.A.S.',
    'Ruta para abrir restaurante con servicio a mesa constituyendo una Sociedad por Acciones Simplificada',
    7, 982, 6000, 3.0
  ) RETURNING id
)
INSERT INTO public.ruta_tramite_detalle (ruta_id, tramite_id, orden, nota_especifica)
SELECT ruta.id, t.id, t.orden_sugerido, t.observaciones
FROM ruta, tramite t
WHERE t.clave IN ('SAS_CONSTITUCION','RFC_PM','CERT_USO_SUELO','AVISO_APERTURA','AVISO_SANITARIO','PROT_CIVIL','IMSS_PATRON')
ORDER BY t.orden_sugerido;

-- Ruta para Bar/Cantina como S.A. de C.V.
WITH ruta AS (
  INSERT INTO public.ruta_tramite (giro_id, tipo_persona_clave, nombre, descripcion,
    total_tramites, costo_estimado_min, costo_estimado_max, meses_estimados)
  VALUES (
    (SELECT id FROM cat_giro_negocio WHERE clave='BAR_CANTINA'), 'SA',
    'Abrir un Bar o Cantina como S.A. de C.V.',
    'Ruta completa para establecimiento con venta de alcohol, constituyendo una Sociedad Anónima',
    8, 30000, 90000, 5.0
  ) RETURNING id
)
INSERT INTO public.ruta_tramite_detalle (ruta_id, tramite_id, orden, nota_especifica)
SELECT ruta.id, t.id, t.orden_sugerido, t.observaciones
FROM ruta, tramite t
WHERE t.clave IN ('SA_NOTARIO','RFC_PM','CERT_USO_SUELO','PERMISO_SIAPEM','LIC_ALCOHOL','AVISO_SANITARIO','PROT_CIVIL','IMSS_PATRON')
ORDER BY t.orden_sugerido;

-- ── PROGRAMAS DE EMPRENDIMIENTO ───────────────────────────

CREATE TABLE public.cat_programa_tipo (
  id     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave  VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  orden  INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.cat_programa_tipo (clave, nombre, orden) VALUES
  ('FINANCIAMIENTO', 'Financiamiento / Crédito',  1),
  ('CAPACITACION',   'Capacitación y Mentoring',  2),
  ('INCUBACION',     'Incubación / Aceleración',  3),
  ('VINCULACION',    'Vinculación Comercial',      4),
  ('SUBSIDIO',       'Subsidio / Apoyo Directo',   5),
  ('ESPACIO',        'Espacio / Infraestructura',  6);

CREATE TABLE public.programa_emprendimiento (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave            VARCHAR(30) UNIQUE NOT NULL,
  nombre           VARCHAR(200) NOT NULL,
  descripcion      TEXT NOT NULL,
  tipo_id          UUID REFERENCES public.cat_programa_tipo(id),
  dependencia_id   UUID REFERENCES public.cat_dependencia(id),
  -- Elegibilidad
  aplica_giros     TEXT[],  -- NULL = todos
  aplica_personas  TEXT[],  -- ['PF','SAS','SA']
  monto_min        NUMERIC(12,2),
  monto_max        NUMERIC(12,2),
  monto_descripcion VARCHAR(200),
  -- Requisitos
  requiere_plan_negocio  BOOLEAN DEFAULT true,
  requiere_rfc           BOOLEAN DEFAULT true,
  anos_operacion_max     INTEGER,  -- NULL = cualquiera (incluso nuevas)
  -- Vigencia
  convocatoria_url TEXT,
  activo           BOOLEAN DEFAULT true,
  destacado        BOOLEAN DEFAULT false,
  orden            INTEGER DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.programa_emprendimiento
  (clave, nombre, descripcion, tipo_id, dependencia_id,
   monto_min, monto_max, monto_descripcion,
   requiere_plan_negocio, anos_operacion_max, destacado, orden)
VALUES

('FONDO_CDMX', 'Fondo de Desarrollo Social CDMX — Créditos a Emprendedores',
 'Créditos a tasa preferencial para micro y pequeñas empresas de la CDMX con hasta 3 años de operación. Sin aval ni garantías prendarias para montos menores a $100,000.',
 (SELECT id FROM cat_programa_tipo WHERE clave='FINANCIAMIENTO'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDECO'),
 10000, 200000, '$10,000 hasta $200,000 a tasa 0–6% anual',
 true, 3, true, 1),

('FONDESO', 'FONDESO — Fondo para el Desarrollo Social de la CDMX',
 'Financiamiento para emprendedoras y emprendedores de la CDMX. Prioriza sectores vulnerables, jóvenes y mujeres. Montos desde $5,000 hasta $500,000.',
 (SELECT id FROM cat_programa_tipo WHERE clave='FINANCIAMIENTO'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDECO'),
 5000, 500000, '$5,000–$500,000 a tasas preferenciales',
 true, 5, true, 2),

('INCUBA_CDMX', 'Red de Incubadoras de Empresas CDMX',
 'Programa de incubación con asesoría en plan de negocios, registro legal, mercadotecnia y acceso a financiamiento. 12 semanas de acompañamiento gratuito.',
 (SELECT id FROM cat_programa_tipo WHERE clave='INCUBACION'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDECO'),
 0, 0, 'Gratuito — aporta conocimiento y red de contactos',
 true, NULL, true, 3),

('MUJER_EMPRENDE', 'Mujeres que Emprenden CDMX',
 'Programa exclusivo para emprendedoras. Incluye capacitación, mentoría, acceso a crédito preferencial y vinculación con mercados. Convocatoria abierta todo el año.',
 (SELECT id FROM cat_programa_tipo WHERE clave='SUBSIDIO'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDECO'),
 20000, 150000, 'Apoyo de hasta $150,000 no reembolsable para mujeres',
 true, 3, true, 4),

('MERCADOS_DIG', 'Mercados Digitales CDMX',
 'Apoyo para que negocios físicos (especialmente mercados y comercio tradicional) tengan presencia en plataformas digitales. Incluye capacitación en e-commerce y fotografía de producto.',
 (SELECT id FROM cat_programa_tipo WHERE clave='CAPACITACION'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDECO'),
 0, 0, 'Gratuito — subsidia acceso a plataformas digitales',
 false, NULL, false, 5),

('FINABIEN', 'FinaBien — Financiamiento para Bienestar',
 'Créditos del Gobierno Federal canalizados a través de SEDECO para negocios en zonas prioritarias de CDMX. Sin intereses para montos hasta $25,000.',
 (SELECT id FROM cat_programa_tipo WHERE clave='FINANCIAMIENTO'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDECO'),
 5000, 50000, '$5,000–$50,000 a 0% en zonas prioritarias',
 false, 2, false, 6),

('STARTUP_CDMX', 'Startup CDMX — Aceleradora de Tecnología',
 'Programa de aceleración para startups tecnológicas con potencial de crecimiento. Incluye capital semilla, espacios de trabajo, mentoría especializada y conexión con inversionistas.',
 (SELECT id FROM cat_programa_tipo WHERE clave='INCUBACION'),
 (SELECT id FROM cat_dependencia WHERE clave='SEDECO'),
 100000, 500000, '$100,000–$500,000 capital semilla por convocatoria',
 true, 2, false, 7),

('CAPACITACION_SAT','Cursos y Talleres SAT para Nuevos Contribuyentes',
 'Cursos gratuitos del SAT sobre facturación electrónica, declaraciones, regímenes fiscales y obligaciones de los negocios. Presencial y en línea.',
 (SELECT id FROM cat_programa_tipo WHERE clave='CAPACITACION'),
 (SELECT id FROM cat_dependencia WHERE clave='SAT'),
 0, 0, 'Completamente gratuito',
 false, NULL, false, 8);

-- ── TABLA CONSULTAS (historial de análisis de viabilidad) ─

CREATE TABLE public.consulta_viabilidad (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Qué quiere abrir
  giro_id           UUID REFERENCES public.cat_giro_negocio(id),
  giro_descripcion  TEXT,        -- texto libre del usuario
  tipo_persona_clave VARCHAR(10) REFERENCES public.cat_tipo_persona(clave),
  -- Dónde
  alcaldia_id       UUID REFERENCES dw.dim_alcaldia(id),
  colonia           VARCHAR(100),
  direccion_ref     TEXT,
  -- Resultado IA
  score_viabilidad  INTEGER,     -- 0-100
  nivel_viabilidad  VARCHAR(10), -- ALTO, MEDIO, BAJO, MUY_BAJO
  resumen_ia        TEXT,
  riesgos_ia        TEXT,
  oportunidades_ia  TEXT,
  tramites_ia       TEXT,        -- JSON string de ruta generada
  programas_ia      TEXT,        -- JSON string de programas recomendados
  -- Auditoría
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by        UUID
);

-- Consultas de ejemplo
INSERT INTO public.consulta_viabilidad
  (giro_id, giro_descripcion, tipo_persona_clave, alcaldia_id, colonia,
   score_viabilidad, nivel_viabilidad)
VALUES
  ((SELECT id FROM cat_giro_negocio WHERE clave='TAQUERIA'),
   'Taquería de canasta y tortas', 'PF',
   (SELECT id FROM dw.dim_alcaldia WHERE clave='COY'), 'Coyoacán',
   82, 'ALTO'),
  ((SELECT id FROM cat_giro_negocio WHERE clave='BAR_CANTINA'),
   'Bar de cocteles artesanales', 'SAS',
   (SELECT id FROM dw.dim_alcaldia WHERE clave='CUH'), 'Roma Norte',
   68, 'MEDIO'),
  ((SELECT id FROM cat_giro_negocio WHERE clave='TECH_STARTUP'),
   'App de delivery para mercados tradicionales', 'SAS',
   (SELECT id FROM dw.dim_alcaldia WHERE clave='BEN'), 'Narvarte',
   91, 'ALTO');

-- ── RLS ──────────────────────────────────────────────────

ALTER TABLE public.cat_categoria_giro        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_giro_negocio          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tipo_persona          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_dependencia           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tipo_tramite          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_programa_tipo         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tramite                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ruta_tramite              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ruta_tramite_detalle      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programa_emprendimiento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulta_viabilidad       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectura_publica" ON public.cat_categoria_giro      FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.cat_giro_negocio        FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.cat_tipo_persona        FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.cat_dependencia         FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.cat_tipo_tramite        FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.cat_programa_tipo       FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.tramite                 FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.ruta_tramite            FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.ruta_tramite_detalle    FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.programa_emprendimiento FOR SELECT USING (true);
CREATE POLICY "lectura_publica" ON public.consulta_viabilidad     FOR SELECT USING (true);
CREATE POLICY "insercion"       ON public.consulta_viabilidad     FOR INSERT WITH CHECK (true);
CREATE POLICY "actualizacion"   ON public.consulta_viabilidad     FOR UPDATE USING (true);
