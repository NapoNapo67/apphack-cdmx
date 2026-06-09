-- ============================================================
-- SEED: Catálogos y datos demo (UUID PKs)
-- ============================================================

-- ── DEPENDENCIAS ─────────────────────────────────────────────
INSERT INTO public.cat_dependencia (clave, nombre, siglas, url_tramite) VALUES
  ('SEDUVI',   'Secretaria de Desarrollo Urbano y Vivienda',                    'SEDUVI',   'https://seduvi.cdmx.gob.mx'),
  ('SEDECO',   'Secretaria de Desarrollo Economico',                            'SEDECO',   'https://sedeco.cdmx.gob.mx'),
  ('SAT',      'Servicio de Administracion Tributaria',                         'SAT',      'https://www.sat.gob.mx'),
  ('IMSS',     'Instituto Mexicano del Seguro Social',                          'IMSS',     'https://www.imss.gob.mx'),
  ('COFEPRIS', 'Comision Federal para la Proteccion contra Riesgos Sanitarios', 'COFEPRIS', 'https://www.gob.mx/cofepris'),
  ('PC_CDMX',  'Secretaria de Gestion Integral de Riesgos y Proteccion Civil',  'SGIRPC',   'https://www.proteccioncivil.cdmx.gob.mx'),
  ('IMPI',     'Instituto Mexicano de la Propiedad Industrial',                 'IMPI',     'https://www.impi.gob.mx'),
  ('ALCALDIA', 'Alcaldia correspondiente',                                      'ALCALDIA', 'https://www.cdmx.gob.mx')
ON CONFLICT (clave) DO NOTHING;

-- ── TRÁMITES ─────────────────────────────────────────────────
INSERT INTO public.cat_tramite (dependencia_id, clave, nombre, descripcion, tipo_siapem, costo_min, costo_max, dias_resolucion, es_obligatorio, url_tramite, orden_sugerido)
SELECT d.id, t.clave, t.nombre, t.descr, t.tipo, t.cmin, t.cmax, t.dias, t.oblig, t.url, t.ord
FROM cat_dependencia d
JOIN (VALUES
  ('SEDUVI',   'CZUS',     'Certificado de Zonificacion de Uso de Suelo',        'Verifica uso de suelo compatible con el giro',                       NULL,       853,   853,   5,  true,  'http://certificadodigital.cdmx.gob.mx:8080/CertificadoDigital/certificado/solicitaCertificado', 1),
  ('SAT',      'RFC',      'Registro Federal de Contribuyentes',                 'Alta ante el SAT como persona fisica o moral',                       NULL,       0,     0,     1,  true,  'https://www.sat.gob.mx/tramites/operacion/26140/inscripcion-en-el-rfc', 2),
  ('SEDECO',   'EM-03',    'Aviso de Apertura Bajo Impacto Mercantil',           'Tiendas, esteticas, cafeterias. Opera al dia siguiente. Gratuito.',  'BAJO',     0,     0,     1,  true,  'https://siapem.cdmx.gob.mx', 3),
  ('SEDECO',   'EM-11',    'Aviso de Apertura Impacto Vecinal',                  'Restaurantes, hoteles, salones. Requiere pago de derechos.',         'VECINAL',  2500,  8000,  15, true,  'https://siapem.cdmx.gob.mx', 3),
  ('SEDECO',   'EM-08',    'Permiso de Apertura Impacto Zonal',                  'Bares, cantinas, discotecas. Requiere aprobacion Alcaldia.',         'ZONAL',    5000,  15000, 45, true,  'https://siapem.cdmx.gob.mx', 3),
  ('IMSS',     'IMSS',     'Registro Patronal IMSS',                             'Alta como patron si se contrataran empleados',                       NULL,       0,     0,     3,  false, 'https://www.imss.gob.mx/tramites/imss02-008', 4),
  ('COFEPRIS', 'COFEPRIS', 'Licencia Sanitaria COFEPRIS',                        'Obligatoria para alimentos, medicamentos y productos de salud',      NULL,       1500,  5000,  30, false, 'https://www.gob.mx/cofepris/tramites-y-servicios', 5),
  ('PC_CDMX',  'PC',       'Programa Interno de Proteccion Civil',               'Requerido si mas de 100 personas o mas de 250 m2 (Art.10 LEM)',      NULL,       2000,  6000,  20, false, 'https://www.proteccioncivil.cdmx.gob.mx', 6),
  ('IMPI',     'IMPI',     'Registro de Marca IMPI',                             'Protege nombre comercial y logotipo a nivel nacional',               NULL,       2358,  2358,  90, false, 'https://www.impi.gob.mx', 7),
  ('ALCALDIA', 'APERTURA', 'Aviso de Apertura Municipal',                        'Notificacion a la Alcaldia sobre apertura del establecimiento',      NULL,       0,     500,   5,  false, 'https://www.cdmx.gob.mx', 8)
) AS t(dep, clave, nombre, descr, tipo, cmin, cmax, dias, oblig, url, ord)
  ON d.clave = t.dep
ON CONFLICT (clave) DO NOTHING;

-- ── CATEGORÍAS DE GIRO ───────────────────────────────────────
INSERT INTO public.cat_categoria_giro (clave, nombre, icono, orden) VALUES
  ('ALIMENTOS',      'Alimentos y Bebidas',    '🍽️', 1),
  ('COMERCIO',       'Comercio al por Menor',  '🛍️', 2),
  ('SERVICIOS',      'Servicios Personales',   '💇', 3),
  ('SALUD',          'Salud y Bienestar',      '🏥', 4),
  ('TECNOLOGIA',     'Tecnologia y Digital',   '💻', 5),
  ('EDUCACION',      'Educacion y Cultura',    '📚', 6),
  ('ENTRETENIMIENTO','Entretenimiento',        '🎭', 7),
  ('MANUFACTURA',    'Manufactura y Taller',   '🔧', 8)
ON CONFLICT (clave) DO NOTHING;

-- ── GIROS DE NEGOCIO ─────────────────────────────────────────
INSERT INTO public.cat_giro_negocio (categoria_id, clave, nombre, nivel_inversion, meses_tramite, riesgo_sanitario, requiere_cofepris, requiere_pc, impacto_mercantil, formato_siapem, uso_suelo_ok, orden)
SELECT c.id, g.clave, g.nombre, g.inv, g.meses, g.san, g.cof, g.pc, g.impacto, g.formato, g.usos, g.ord
FROM cat_categoria_giro c
JOIN (VALUES
  ('ALIMENTOS',      'CAFETERIA',   'Cafeteria / Coffee Shop',     'MEDIO', 2, true,  true,  false, 'BAJO',    'EM-03', ARRAY['COM','COM_S','MIX','HAB_M'], 1),
  ('ALIMENTOS',      'TAQUERIA',    'Taqueria / Comida Rapida',    'BAJO',  1, true,  true,  false, 'BAJO',    'EM-03', ARRAY['COM','COM_S','MIX'],         2),
  ('ALIMENTOS',      'RESTAURANTE', 'Restaurante',                 'ALTO',  3, true,  true,  true,  'VECINAL', 'EM-11', ARRAY['COM','COM_S','MIX'],         3),
  ('ALIMENTOS',      'PANADERIA',   'Panaderia / Pasteleria',      'MEDIO', 2, true,  true,  false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],         4),
  ('COMERCIO',       'ABARROTES',   'Tienda de Abarrotes',         'BAJO',  1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],         5),
  ('COMERCIO',       'ROPA',        'Tienda de Ropa y Moda',       'MEDIO', 1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','COM_S','MIX'],         6),
  ('SERVICIOS',      'ESTETICA',    'Estetica / Salon de Belleza', 'BAJO',  1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],         7),
  ('SERVICIOS',      'LAVANDERIA',  'Lavanderia / Tintoreria',     'MEDIO', 1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX'],                 8),
  ('SALUD',          'FARMACIA',    'Farmacia',                    'MEDIO', 3, false, true,  false, 'BAJO',    'EM-03', ARRAY['COM','COM_S','MIX'],         9),
  ('TECNOLOGIA',     'SOFTDEV',     'Desarrollo de Software',      'BAJO',  1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],        10),
  ('EDUCACION',      'ACADEMIA',    'Academia / Centro de Idiomas','MEDIO', 2, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','EQU'],          11),
  ('ENTRETENIMIENTO','GYM',         'Gimnasio',                    'ALTO',  3, false, false, true,  'VECINAL', 'EM-11', ARRAY['COM','COM_S','MIX'],        12),
  ('ENTRETENIMIENTO','BAR',         'Bar / Cantina',               'ALTO',  4, false, false, true,  'ZONAL',   'EM-08', ARRAY['COM','COM_S'],              13),
  ('MANUFACTURA',    'TALLER_MECA', 'Taller Mecanico',             'MEDIO', 2, false, false, false, 'BAJO',    'EM-03', ARRAY['IND','MIX','COM'],          14),
  ('COMERCIO',       'PAPELERIA',   'Papeleria / Impresiones',     'BAJO',  1, false, false, false, 'BAJO',    'EM-03', ARRAY['COM','MIX','HAB_M'],        15)
) AS g(cat, clave, nombre, inv, meses, san, cof, pc, impacto, formato, usos, ord)
  ON c.clave = g.cat
ON CONFLICT (clave) DO NOTHING;

-- ── PERSONAS JURÍDICAS ───────────────────────────────────────
INSERT INTO public.cat_persona_juridica (clave, nombre, descripcion, ventajas, requiere_notario, orden) VALUES
  ('PF',   'Persona Fisica',                         'Para actividades menores sin estructura empresarial.',                                             'Sin tramites de constitucion,Sin capital minimo,Inicio inmediato',             false, 1),
  ('PFAE', 'Persona Fisica con Actividad Empresarial','La mas comun para emprender. Permite emitir facturas y deducir gastos.',                          'RFC sencillo,Facturacion electronica,Sin notario,Menos impuestos al inicio',  false, 2),
  ('SAS',  'Sociedad por Acciones Simplificada',     'Constitucion en linea en 24h por la SE. Capital minimo: 1 peso.',                                 'Constitucion en linea,Capital minimo 1 peso,Responsabilidad limitada',        false, 3),
  ('SA',   'Sociedad Anonima de Capital Variable',   'Para empresas medianas/grandes. Requiere notario y capital social minimo.',                       'Mayor credibilidad,Acceso a credito,Socios multiples,Expansion facilitada',   true,  4)
ON CONFLICT (clave) DO NOTHING;

-- ── ALCALDÍAS ────────────────────────────────────────────────
INSERT INTO public.cat_alcaldia (clave, nombre, nombre_corto, poblacion_aprox, superficie_km2, lat, lng) VALUES
  ('AZC', 'Azcapotzalco',           'Azcapotzalco',   414711,  33.66, 19.4867,-99.1849),
  ('COY', 'Coyoacan',               'Coyoacan',        614447,  54.40, 19.3467,-99.1617),
  ('CUA', 'Cuajimalpa de Morelos',  'Cuajimalpa',      186391,  74.58, 19.3614,-99.2978),
  ('CUH', 'Cuauhtemoc',             'Cuauhtemoc',      531831,  32.44, 19.4326,-99.1452),
  ('GAM', 'Gustavo A. Madero',      'Gust. A. Madero',1173351,  94.07, 19.4978,-99.1044),
  ('IZT', 'Iztacalco',              'Iztacalco',       384326,  23.30, 19.3944,-99.0978),
  ('IZP', 'Iztapalapa',             'Iztapalapa',     1835486, 117.38, 19.3590,-99.0478),
  ('LAM', 'La Magdalena Contreras', 'Magdalena Cont.', 243886,  74.58, 19.3267,-99.2297),
  ('MHI', 'Miguel Hidalgo',         'Miguel Hidalgo',  364439,  46.99, 19.4267,-99.2017),
  ('MIL', 'Milpa Alta',             'Milpa Alta',      137927, 228.80, 19.1926,-98.9847),
  ('ALV', 'Alvaro Obregon',         'Alvaro Obregon',  749075,  96.17, 19.3590,-99.2017),
  ('TLA', 'Tlahuac',                'Tlahuac',         361593,  85.34, 19.2927,-99.0048),
  ('TLP', 'Tlalpan',                'Tlalpan',         677104, 312.00, 19.2926,-99.1700),
  ('VEN', 'Venustiano Carranza',    'V. Carranza',     427263,  33.42, 19.4267,-99.0978),
  ('XOC', 'Xochimilco',             'Xochimilco',      415007, 122.00, 19.2647,-99.1053),
  ('BJU', 'Benito Juarez',          'Benito Juarez',   434153,  26.63, 19.3867,-99.1617)
ON CONFLICT (clave) DO NOTHING;

-- ── TIPOS DE PROGRAMA ────────────────────────────────────────
INSERT INTO public.cat_programa_tipo (clave, nombre, orden) VALUES
  ('FINANCIAMIENTO', 'Financiamiento',    1),
  ('CAPACITACION',   'Capacitacion',      2),
  ('INCUBACION',     'Incubacion',        3),
  ('VINCULACION',    'Vinculacion',       4),
  ('SUBSIDIO',       'Subsidio',          5),
  ('ESPACIO',        'Espacio de Trabajo',6)
ON CONFLICT (clave) DO NOTHING;

-- ── PROGRAMAS DE EMPRENDIMIENTO ──────────────────────────────
INSERT INTO public.programa_emprendimiento (tipo_id, nombre, descripcion, monto_min, monto_max, monto_descripcion, anos_operacion_max, requiere_plan_negocio, requiere_rfc, destacado, convocatoria_url, orden)
SELECT t.id, p.nombre, p.descr, p.mmin, p.mmax, p.mdesc, p.anos, p.plan, p.rfc, p.dest, p.url, p.ord
FROM cat_programa_tipo t
JOIN (VALUES
  ('FINANCIAMIENTO','Credito FONDESO Inicial',          'Credito para capital de trabajo e inversion fija. Tasa preferencial 12% anual.',         30000,   300000,  '$30,000 a $300,000 MXN',   2,    true,  true,  true,  'https://fondeso.cdmx.gob.mx',                     1),
  ('FINANCIAMIENTO','Credito FONDESO Crecimiento',      'Para empresas con 2+ anos de operacion que buscan expandirse.',                          300000,  1000000, '$300,000 a $1,000,000 MXN', NULL, true,  true,  false, 'https://fondeso.cdmx.gob.mx',                     2),
  ('INCUBACION',    'Incubadora SEDECO Digital',        'Incubacion 6 meses para negocios digitales. Mentoria, red y coworking incluidos.',       0,       0,       'Gratuito',                  1,    true,  false, true,  'https://sedeco.cdmx.gob.mx/incubadora',           3),
  ('CAPACITACION',  'Capacitate para el Empleo',        'Cursos gratuitos: contabilidad, marketing digital y tecnologia para emprendedores.',     0,       0,       'Gratuito',                  NULL, false, false, false, 'https://capacitateparaelempleo.org',              4),
  ('SUBSIDIO',      'Apoyo Mujer Emprendedora',         'Subsidio directo para mujeres que inician negocio en CDMX. Comercio y servicios.',       10000,   50000,   '$10,000 a $50,000 MXN',    1,    true,  true,  true,  'https://sedeco.cdmx.gob.mx/mujer',                5),
  ('VINCULACION',   'Red de Proveedores CDMX',          'Conecta pequenos negocios con compradores institucionales del gobierno CDMX.',           0,       0,       'Gratuito',                  NULL, true,  true,  false, 'https://sedeco.cdmx.gob.mx/proveedores',          6),
  ('ESPACIO',       'Espacios de Innovacion CDMX',      'Coworking y laboratorios en 16 alcaldias. Renta subsidiada para emprendedores.',         0,       2000,    'Desde gratuito hasta $2,000/mes', NULL, false, false, false, 'https://sedeco.cdmx.gob.mx/espacios',       7),
  ('FINANCIAMIENTO','Microcredito Solidario',           'Creditos grupales sin garantias reales para emprendedores informales.',                  5000,    30000,   '$5,000 a $30,000 MXN',     NULL, false, false, false, 'https://fondeso.cdmx.gob.mx/microcredi',          8),
  ('CAPACITACION',  'Mentoria Ejecutiva SEDECO',        'Mentoria uno a uno con empresarios exitosos. 20 horas en 3 meses.',                     0,       0,       'Gratuito',                  3,    true,  true,  false, 'https://sedeco.cdmx.gob.mx/mentoria',             9),
  ('SUBSIDIO',      'Registro de Marca Subsidiado',     'SEDECO subsidia el registro de marca ante el IMPI para emprendedores CDMX.',            0,       2358,    'Subsidio hasta $2,358 MXN', 2,    false, true,  false, 'https://sedeco.cdmx.gob.mx/marca',               10)
) AS p(tipo, nombre, descr, mmin, mmax, mdesc, anos, plan, rfc, dest, url, ord)
  ON t.clave = p.tipo
ON CONFLICT DO NOTHING;

SELECT
  (SELECT COUNT(*) FROM cat_dependencia)         AS dependencias,
  (SELECT COUNT(*) FROM cat_tramite)             AS tramites,
  (SELECT COUNT(*) FROM cat_categoria_giro)      AS categorias,
  (SELECT COUNT(*) FROM cat_giro_negocio)        AS giros,
  (SELECT COUNT(*) FROM cat_persona_juridica)    AS personas_juridicas,
  (SELECT COUNT(*) FROM cat_alcaldia)            AS alcaldias,
  (SELECT COUNT(*) FROM cat_programa_tipo)       AS tipos_programa,
  (SELECT COUNT(*) FROM programa_emprendimiento) AS programas;
