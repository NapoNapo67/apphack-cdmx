-- ═══════════════════════════════════════════════════════════
-- update_siapem_tramites.sql
-- Actualiza los trámites SIAPEM con la normativa real:
-- Ley de Establecimientos Mercantiles CDMX (LEM)
-- EM-03 (Art. 35), EM-11 (Art. 19), EM-08 (Art. 27 Bis)
-- Ejecutar DESPUÉS de reset_reto2.sql
-- ═══════════════════════════════════════════════════════════

-- ── Agregar columna de impacto mercantil a cat_giro_negocio ──
ALTER TABLE public.cat_giro_negocio
  ADD COLUMN IF NOT EXISTS impacto_mercantil VARCHAR(10),  -- BAJO, VECINAL, ZONAL
  ADD COLUMN IF NOT EXISTS formato_siapem    VARCHAR(10);  -- EM-03, EM-11, EM-08

-- Bajo Impacto (Art. 35 LEM) → EM-03, gratuito
UPDATE public.cat_giro_negocio SET impacto_mercantil='BAJO',    formato_siapem='EM-03'
WHERE clave IN ('TIENDA_ABAR','SALON_BELL','PAPELERIA','TAQUERIA','OFICINA',
                'VETERINARIA','FERRETERIA','LAVANDERIA','FARMACIA','PANADERIA','CONSULTORIO');

-- Impacto Vecinal (Art. 19 LEM) → EM-11, pago de derechos
UPDATE public.cat_giro_negocio SET impacto_mercantil='VECINAL', formato_siapem='EM-11'
WHERE clave IN ('RESTAURANTE','HOTEL','GIMNASIO','ESCUELA','TIENDA_ROPA','TECH_STARTUP');

-- Impacto Zonal (Art. 27 Bis LEM) → EM-08, solicitud de PERMISO (no aviso), aprobación Alcaldía
UPDATE public.cat_giro_negocio SET impacto_mercantil='ZONAL',   formato_siapem='EM-08'
WHERE clave IN ('BAR_CANTINA','TALLER_MEC','FABRICA');

-- ── Actualizar trámites SIAPEM con datos reales ──────────────

-- Eliminar los genéricos anteriores
DELETE FROM public.tramite WHERE clave IN ('AVISO_APERTURA','PERMISO_SIAPEM');

-- EM-03: Aviso de Funcionamiento — Bajo Impacto (Art. 35 LEM)
INSERT INTO public.tramite
  (clave, nombre, descripcion, tipo_id, dependencia_id,
   aplica_pf, aplica_pm, costo_min, costo_max, costo_descripcion,
   plazo_dias, url_tramite, documentos, es_digital, es_obligatorio,
   observaciones, orden_sugerido)
VALUES (
  'EM_03',
  'EM-03 — Aviso de Funcionamiento Bajo Impacto (Art. 35 LEM)',
  'Aviso electrónico para tiendas de abarrotes, estéticas, florerías, papelerías, oficinas, cafeterías, fondas y demás establecimientos del Art. 35 LEM. Puedes operar al día siguiente de presentarlo. No requiere aprobación previa.',
  (SELECT id FROM cat_tipo_tramite WHERE clave='AVISO'),
  (SELECT id FROM cat_dependencia WHERE clave='SIAPEM'),
  true, true,
  0, 0, 'Gratuito (Art. 35 LEM)',
  1,
  'https://siapem.cdmx.gob.mx/index.xhtml',
  '[
    "Certificado Único de Zonificación de Uso de Suelo vigente (max 1 año, expedido por SEDUVI)",
    "Programa Interno de Protección Civil (SOLO si el establecimiento tiene ≥100 personas O >250 m²)",
    "RFC o CURP del titular",
    "Cuenta Llave CDMX activa",
    "Datos del establecimiento: nombre, dirección, giro, superficie"
  ]',
  true, true,
  'Procedimiento: 1) Crear cuenta Llave CDMX en siapem.cdmx.gob.mx → 2) Mis negocios → Dar de alta nuevo negocio → 3) Mis trámites → Registrar nuevo trámite → 4) Seleccionar EM-03 → 5) Llenar datos → 6) Descargar Acuse. Dudas: dudas.siapem@sedeco.cdmx.gob.mx | CENPROIN: Av. Cuauhtémoc 899, Narvarte, BJ. Lun-Vie 9:00-14:30h',
  5
),

-- EM-11: Aviso de Funcionamiento — Impacto Vecinal (Art. 19 LEM)
(
  'EM_11',
  'EM-11 — Aviso de Funcionamiento Impacto Vecinal (Art. 19 LEM)',
  'Aviso para restaurantes, hoteles, clubes privados, salones de fiesta y salas de cine/teatros/auditorios (Art. 19 LEM). Requiere pago de derechos (Art. 191 fracc. I Código Fiscal CDMX). Puedes operar al presentar el aviso y realizar el pago.',
  (SELECT id FROM cat_tipo_tramite WHERE clave='AVISO'),
  (SELECT id FROM cat_dependencia WHERE clave='SIAPEM'),
  true, true,
  2000, 8000, 'Pago de derechos según Art. 191 fracc. I Código Fiscal CDMX',
  3,
  'https://siapem.cdmx.gob.mx/index.xhtml',
  '[
    "Certificado Único de Zonificación de Uso de Suelo vigente (max 1 año)",
    "Programa Interno de Protección Civil (SOLO si ≥100 personas O >250 m²)",
    "Constancia de no adeudo de predial: https://data.finanzas.cdmx.gob.mx/formato_lc",
    "Constancia de no adeudo de agua: https://data.finanzas.cdmx.gob.mx/formato_lc",
    "RFC o CURP del titular / Acta constitutiva si es persona moral",
    "Cuenta Llave CDMX activa"
  ]',
  true, true,
  'Procedimiento: 1) Llave CDMX en siapem.cdmx.gob.mx → 2) Mis negocios → Dar de alta → 3) Mis trámites → Nuevo trámite → 4) Seleccionar EM-11 → 5) Llenar datos → 6) Pagar línea de captura → 7) Descargar Acuse. Dudas: dudas.siapem@sedeco.cdmx.gob.mx | CENPROIN: Av. Cuauhtémoc 899, Narvarte, BJ.',
  5
),

-- EM-08: Solicitud de Permiso — Impacto Zonal (Art. 27 Bis LEM)
(
  'EM_08',
  'EM-08 — Solicitud de Permiso Impacto Zonal (Art. 27 Bis LEM)',
  'PERMISO (no aviso) para bares, cantinas, antros, discotecas, casinos, cabarets, cervecerías, chelerías, espacios de entretenimiento para adultos y similares (Art. 27 Bis LEM). A diferencia de EM-03 y EM-11, REQUIERE APROBACIÓN de la Alcaldía — no opera automáticamente al presentarlo. La Alcaldía puede negar el permiso.',
  (SELECT id FROM cat_tipo_tramite WHERE clave='PERMISO'),
  (SELECT id FROM cat_dependencia WHERE clave='SIAPEM'),
  true, true,
  8000, 35000, 'Pago de derechos según Art. 191 fracc. II Código Fiscal CDMX',
  30,
  'https://siapem.cdmx.gob.mx/index.xhtml',
  '[
    "Certificado Único de Zonificación de Uso de Suelo vigente (max 1 año)",
    "Programa Interno de Protección Civil (SOLO si ≥100 personas O >250 m²)",
    "Constancia de no adeudo de predial: https://data.finanzas.cdmx.gob.mx/formato_lc",
    "Constancia de no adeudo de agua: https://data.finanzas.cdmx.gob.mx/formato_lc",
    "RFC o CURP del titular / Acta constitutiva si es persona moral",
    "Cuenta Llave CDMX activa",
    "Documentos adicionales según giro específico"
  ]',
  true, true,
  'IMPORTANTE: Este es un PERMISO que debe ser APROBADO por la Alcaldía, no un simple aviso. Puede tardar 30+ días y puede ser negado. Procedimiento: 1) Llave CDMX en siapem.cdmx.gob.mx → 2) Mis negocios → Dar de alta → 3) Mis trámites → Nuevo trámite → 4) Seleccionar EM-08 → 5) Llenar datos → 6) Pagar línea de captura → 7) Esperar resolución de la Alcaldía. Dudas: dudas.siapem@sedeco.cdmx.gob.mx | CENPROIN: Av. Cuauhtémoc 899, Narvarte, BJ.',
  5
)
ON CONFLICT (clave) DO UPDATE SET
  nombre       = EXCLUDED.nombre,
  descripcion  = EXCLUDED.descripcion,
  costo_descripcion = EXCLUDED.costo_descripcion,
  documentos   = EXCLUDED.documentos,
  observaciones= EXCLUDED.observaciones;

-- Actualizar también el Certificado de Uso de Suelo con la URL real
UPDATE public.tramite SET
  url_tramite   = 'http://certificadodigital.cdmx.gob.mx:8080/CertificadoDigital/certificado/solicitaCertificado',
  observaciones = 'Expedido por la Secretaría de Planeación, Ordenamiento Territorial y Coordinación Metropolitana. Vigencia máxima 1 año. OBLIGATORIO antes de cualquier trámite SIAPEM. Verificar uso de suelo en: http://ciudadmx.cdmx.gob.mx:8080/seduvi/'
WHERE clave = 'CERT_USO_SUELO';
