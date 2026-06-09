// Datos de respaldo para demo sin Supabase configurado

export const FB_CATEGORIAS = [
  { id:'cat-1', clave:'ALIMENTOS',   nombre:'Alimentos y Bebidas', icono:'🍽️', orden:1 },
  { id:'cat-2', clave:'COMERCIO',    nombre:'Comercio',            icono:'🛒', orden:2 },
  { id:'cat-3', clave:'SERVICIOS',   nombre:'Servicios',           icono:'💼', orden:3 },
  { id:'cat-4', clave:'SALUD',       nombre:'Salud y Bienestar',   icono:'💊', orden:4 },
  { id:'cat-5', clave:'TECNOLOGIA',  nombre:'Tecnología',          icono:'💻', orden:5 },
  { id:'cat-6', clave:'EDUCACION',   nombre:'Educación',           icono:'📚', orden:6 },
  { id:'cat-7', clave:'TURISMO',     nombre:'Turismo',             icono:'🏨', orden:7 },
  { id:'cat-8', clave:'MANUFACTURA', nombre:'Manufactura',         icono:'🏭', orden:8 },
]

export const FB_GIROS = [
  { id:'g-01', clave:'TAQUERIA',     nombre:'Taquería / Fonda',               categoria_id:'cat-1', nivel_inversion:'BAJO',  meses_tramite:1, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['HAB_M','COM','COM_S','MIX'], riesgo_sanitario:'MEDIO' },
  { id:'g-02', clave:'RESTAURANTE',  nombre:'Restaurante',                    categoria_id:'cat-1', nivel_inversion:'MEDIO', meses_tramite:3, impacto_mercantil:'VECINAL', formato_siapem:'EM-11', uso_suelo_ok:['COM','COM_S','MIX'],         riesgo_sanitario:'MEDIO' },
  { id:'g-03', clave:'BAR_CANTINA',  nombre:'Bar / Cantina / Antro',          categoria_id:'cat-1', nivel_inversion:'ALTO',  meses_tramite:6, impacto_mercantil:'ZONAL',   formato_siapem:'EM-08', uso_suelo_ok:['COM_S','MIX'],               riesgo_sanitario:'ALTO'  },
  { id:'g-04', clave:'PANADERIA',    nombre:'Panadería / Pastelería',         categoria_id:'cat-1', nivel_inversion:'BAJO',  meses_tramite:1, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['HAB_M','COM','MIX'],         riesgo_sanitario:'BAJO'  },
  { id:'g-05', clave:'TIENDA_ABAR',  nombre:'Tienda de Abarrotes',            categoria_id:'cat-2', nivel_inversion:'BAJO',  meses_tramite:1, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['HAB_M','COM','MIX'],         riesgo_sanitario:'BAJO'  },
  { id:'g-06', clave:'TIENDA_ROPA',  nombre:'Tienda de Ropa / Boutique',      categoria_id:'cat-2', nivel_inversion:'MEDIO', meses_tramite:1, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['COM','COM_S','MIX'],         riesgo_sanitario:'BAJO'  },
  { id:'g-07', clave:'FARMACIA',     nombre:'Farmacia / Botica',              categoria_id:'cat-4', nivel_inversion:'MEDIO', meses_tramite:2, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['HAB_M','COM','MIX'],         riesgo_sanitario:'BAJO'  },
  { id:'g-08', clave:'SALON_BELL',   nombre:'Estética / Salón de Belleza',    categoria_id:'cat-3', nivel_inversion:'BAJO',  meses_tramite:1, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['HAB_M','COM','MIX'],         riesgo_sanitario:'BAJO'  },
  { id:'g-09', clave:'GIMNASIO',     nombre:'Gimnasio / Centro Deportivo',    categoria_id:'cat-3', nivel_inversion:'ALTO',  meses_tramite:3, impacto_mercantil:'VECINAL', formato_siapem:'EM-11', uso_suelo_ok:['COM','COM_S','MIX'],         riesgo_sanitario:'BAJO'  },
  { id:'g-10', clave:'CONSULTORIO',  nombre:'Consultorio Médico',             categoria_id:'cat-4', nivel_inversion:'MEDIO', meses_tramite:2, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['HAB_M','COM','MIX'],         riesgo_sanitario:'BAJO'  },
  { id:'g-11', clave:'TECH_STARTUP', nombre:'Startup / Oficina Tech',         categoria_id:'cat-5', nivel_inversion:'BAJO',  meses_tramite:1, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['COM','COM_S','MIX','EQU'],   riesgo_sanitario:'BAJO'  },
  { id:'g-12', clave:'ESCUELA',      nombre:'Escuela / Centro de Capacitación',categoria_id:'cat-6',nivel_inversion:'MEDIO', meses_tramite:3, impacto_mercantil:'VECINAL', formato_siapem:'EM-11', uso_suelo_ok:['EQU','COM','MIX'],           riesgo_sanitario:'BAJO'  },
  { id:'g-13', clave:'HOTEL',        nombre:'Hotel / Hostal',                 categoria_id:'cat-7', nivel_inversion:'ALTO',  meses_tramite:4, impacto_mercantil:'VECINAL', formato_siapem:'EM-11', uso_suelo_ok:['COM','COM_S','MIX'],         riesgo_sanitario:'MEDIO' },
  { id:'g-14', clave:'TALLER_MEC',   nombre:'Taller Mecánico / Automotriz',   categoria_id:'cat-8', nivel_inversion:'MEDIO', meses_tramite:2, impacto_mercantil:'VECINAL', formato_siapem:'EM-11', uso_suelo_ok:['IND','COM_S'],               riesgo_sanitario:'MEDIO' },
  { id:'g-15', clave:'VETERINARIA',  nombre:'Veterinaria / Pet Shop',         categoria_id:'cat-4', nivel_inversion:'MEDIO', meses_tramite:2, impacto_mercantil:'BAJO',   formato_siapem:'EM-03', uso_suelo_ok:['HAB_M','COM','MIX'],         riesgo_sanitario:'BAJO'  },
]

export const FB_PERSONAS = [
  { id:'p-1', clave:'PF',   nombre:'Persona Física',                           descripcion:'Sin constitución formal. Ideal para micronegocios y emprendedores individuales.',      ventajas:'Más sencillo,Sin notario,Menos costos administrativos' },
  { id:'p-2', clave:'PFAE', nombre:'Persona Física con Actividad Empresarial', descripcion:'Régimen fiscal para emprendedores individuales con facturación y deducciones.',        ventajas:'Deducciones fiscales,Facturación electrónica,Créditos IMSS' },
  { id:'p-3', clave:'SAS',  nombre:'Sociedad por Acciones Simplificada (SAS)', descripcion:'Constitución 100% en línea, sin notario, desde $0. Ideal para socios.',               ventajas:'Sin notario,Constitución en línea,Ideal para socios jóvenes' },
  { id:'p-4', clave:'SA',   nombre:'Sociedad Anónima (S.A. de C.V.)',          descripcion:'Estructura formal para negocios con socios, inversión externa o expansión planeada.', ventajas:'Protección patrimonial,Atrae inversión,Facilita expansión' },
]

export const FB_ALCALDIAS = [
  { id:'a-01', clave:'AZC', nombre:'Azcapotzalco',          poblacion_aprox:400161,  superficie_km2:33.66  },
  { id:'a-02', clave:'COY', nombre:'Coyoacán',               poblacion_aprox:614447,  superficie_km2:54.4   },
  { id:'a-03', clave:'CJM', nombre:'Cuajimalpa de Morelos',  poblacion_aprox:186391,  superficie_km2:74.58  },
  { id:'a-04', clave:'CUA', nombre:'Cuauhtémoc',             poblacion_aprox:532553,  superficie_km2:32.44  },
  { id:'a-05', clave:'GAM', nombre:'Gustavo A. Madero',      poblacion_aprox:1173351, superficie_km2:88.17  },
  { id:'a-06', clave:'IZC', nombre:'Iztacalco',              poblacion_aprox:390348,  superficie_km2:23.26  },
  { id:'a-07', clave:'IZP', nombre:'Iztapalapa',             poblacion_aprox:1835486, superficie_km2:117.86 },
  { id:'a-08', clave:'MGC', nombre:'La Magdalena Contreras', poblacion_aprox:239086,  superficie_km2:74.58  },
  { id:'a-09', clave:'MIH', nombre:'Miguel Hidalgo',         poblacion_aprox:364439,  superficie_km2:46.99  },
  { id:'a-10', clave:'MIA', nombre:'Milpa Alta',             poblacion_aprox:137927,  superficie_km2:228.8  },
  { id:'a-11', clave:'AO',  nombre:'Álvaro Obregón',         poblacion_aprox:727034,  superficie_km2:96.17  },
  { id:'a-12', clave:'TLH', nombre:'Tláhuac',                poblacion_aprox:361593,  superficie_km2:85.57  },
  { id:'a-13', clave:'TLP', nombre:'Tlalpan',                poblacion_aprox:677104,  superficie_km2:312.0  },
  { id:'a-14', clave:'VCA', nombre:'Venustiano Carranza',    poblacion_aprox:427263,  superficie_km2:33.42  },
  { id:'a-15', clave:'XOC', nombre:'Xochimilco',             poblacion_aprox:415007,  superficie_km2:122.06 },
  { id:'a-16', clave:'BJU', nombre:'Benito Juárez',          poblacion_aprox:434153,  superficie_km2:26.63  },
]

export const FB_TRAMITES = [
  { id:'t-01', clave:'CZUS',      nombre:'Certificado Único de Zonificación de Uso de Suelo', dependencia_id:'dep-1', dependencia_corto:'SEDUVI',    tipo_clave:'USO_SUELO',   costo_descripcion:'$1,500–$3,000',  plazo_dias:5,  es_digital:true,  es_obligatorio:true,  descripcion:'Documento que certifica el uso permitido del suelo donde operará tu negocio. Es el PRIMER trámite obligatorio.',                   url_tramite:'http://ciudadmx.cdmx.gob.mx:8080/seduvi/', documentos:'["Escritura del inmueble o contrato de arrendamiento","CURP o RFC","Pago de derechos"]' },
  { id:'t-02', clave:'RFC',       nombre:'Registro Federal de Contribuyentes (RFC)',            dependencia_id:'dep-2', dependencia_corto:'SAT',        tipo_clave:'FISCAL',      costo_descripcion:'Gratuito',       plazo_dias:1,  es_digital:true,  es_obligatorio:true,  descripcion:'Clave fiscal obligatoria para cualquier actividad económica. Se tramita en línea o en módulos SAT.',                              url_tramite:'https://www.sat.gob.mx/tramites/operacion/inscripcion-al-rfc', documentos:'["CURP","Comprobante de domicilio","Identificación oficial"]' },
  { id:'t-03', clave:'EM03',      nombre:'Aviso de Apertura EM-03 (Bajo Impacto)',              dependencia_id:'dep-3', dependencia_corto:'SIAPEM',     tipo_clave:'PERMISO',     costo_descripcion:'Gratuito',       plazo_dias:1,  es_digital:true,  es_obligatorio:true,  descripcion:'Aviso para establecimientos de bajo impacto (Art. 35 LEM). Opera al día siguiente de presentarlo. Para abarrotes, estéticas, fondas, papelerías.',  url_tramite:'https://siapem.cdmx.gob.mx', documentos:'["Certificado de Uso de Suelo vigente","CURP o RFC","Identificación oficial","Número de empleados"]' },
  { id:'t-04', clave:'EM11',      nombre:'Licencia de Funcionamiento EM-11 (Impacto Vecinal)', dependencia_id:'dep-3', dependencia_corto:'SIAPEM',     tipo_clave:'PERMISO',     costo_descripcion:'$3,000–$8,000',  plazo_dias:15, es_digital:true,  es_obligatorio:true,  descripcion:'Licencia para establecimientos con impacto vecinal (Art. 19 LEM). Restaurantes, hoteles, salones. Requiere pago de derechos.',     url_tramite:'https://siapem.cdmx.gob.mx', documentos:'["Certificado de Uso de Suelo","RFC","Constancia no adeudo predial","Constancia no adeudo agua","Dictamen protección civil si aplica"]' },
  { id:'t-05', clave:'EM08',      nombre:'Permiso de Funcionamiento EM-08 (Impacto Zonal)',    dependencia_id:'dep-3', dependencia_corto:'SIAPEM/Alcaldía',tipo_clave:'PERMISO',  costo_descripcion:'$8,000–$20,000', plazo_dias:30, es_digital:false, es_obligatorio:true,  descripcion:'Permiso que REQUIERE aprobación de la Alcaldía (Art. 27 Bis LEM). Bares, cantinas, antros. La Alcaldía puede negarlo.',           url_tramite:'https://siapem.cdmx.gob.mx', documentos:'["Certificado de Uso de Suelo","RFC","Estudio de impacto vecinal","Dictamen protección civil","Plano del local"]' },
  { id:'t-06', clave:'IMSS',      nombre:'Registro Patronal IMSS',                             dependencia_id:'dep-4', dependencia_corto:'IMSS',       tipo_clave:'LABORAL',     costo_descripcion:'Gratuito',       plazo_dias:5,  es_digital:true,  es_obligatorio:false, descripcion:'Obligatorio si tendrás empleados. Permite afiliarlos al seguro social y cumplir obligaciones laborales.',                          url_tramite:'https://www.imss.gob.mx/patrones/registro-patronal', documentos:'["RFC","CURP del representante","Comprobante de domicilio fiscal","Datos de empleados"]' },
  { id:'t-07', clave:'COFEPRIS',  nombre:'Aviso de Funcionamiento COFEPRIS',                   dependencia_id:'dep-5', dependencia_corto:'COFEPRIS',   tipo_clave:'SANITARIO',   costo_descripcion:'$2,000–$5,000',  plazo_dias:10, es_digital:true,  es_obligatorio:false, descripcion:'Obligatorio para establecimientos que manejan alimentos, medicamentos o cosméticos. Se tramita por SADER o COFEPRIS.',            url_tramite:'https://www.cofepris.gob.mx/tramites', documentos:'["RFC","Planos del establecimiento","Responsable sanitario (médico o QFB)","Programa de manejo de residuos"]' },
  { id:'t-08', clave:'PC',        nombre:'Programa Interno de Protección Civil',                dependencia_id:'dep-6', dependencia_corto:'Alcaldía PC', tipo_clave:'SEGURIDAD',   costo_descripcion:'$3,000–$10,000', plazo_dias:20, es_digital:false, es_obligatorio:false, descripcion:'Requerido SOLO si tu local tiene más de 100 personas O más de 250 m². Incluye plan de evacuación y señalización.',               url_tramite:'', documentos:'["Planos del local con salidas de emergencia","Señalización fotoluminiscente","Extintores vigentes","Botiquín de primeros auxilios"]' },
  { id:'t-09', clave:'MARCA',     nombre:'Registro de Marca ante IMPI',                        dependencia_id:'dep-7', dependencia_corto:'IMPI',       tipo_clave:'MARCA',       costo_descripcion:'$2,457',         plazo_dias:120,es_digital:true,  es_obligatorio:false, descripcion:'Protege legalmente el nombre y logotipo de tu negocio en México por 10 años. Muy recomendable para marcas en crecimiento.',    url_tramite:'https://marcanet.impi.gob.mx', documentos:'["Logotipo en alta resolución","RFC","Descripción de productos/servicios","Pago de derechos"]' },
  { id:'t-10', clave:'APERTURA',  nombre:'Aviso de Apertura Municipal / Alcaldía',             dependencia_id:'dep-8', dependencia_corto:'Alcaldía',   tipo_clave:'AVISO',       costo_descripcion:'$500–$2,000',    plazo_dias:3,  es_digital:false, es_obligatorio:false, descripcion:'Notificación a la Alcaldía de tu inicio de operaciones. Complementa los trámites del SIAPEM en algunos giros.',                 url_tramite:'', documentos:'["Identificación oficial","Comprobante de domicilio del negocio","RFC","Licencia SIAPEM"]' },
]

export const FB_TIPOS_PROGRAMA = [
  { id:'tp-1', clave:'FINANCIAMIENTO', nombre:'Financiamiento', orden:1 },
  { id:'tp-2', clave:'CAPACITACION',   nombre:'Capacitación',   orden:2 },
  { id:'tp-3', clave:'INCUBACION',     nombre:'Incubación',     orden:3 },
  { id:'tp-4', clave:'SUBSIDIO',       nombre:'Subsidio',       orden:4 },
  { id:'tp-5', clave:'VINCULACION',    nombre:'Vinculación',    orden:5 },
  { id:'tp-6', clave:'ESPACIO',        nombre:'Espacio',        orden:6 },
]

export const FB_PROGRAMAS = [
  { id:'pr-01', clave:'FONDESO',       nombre:'FONDESO — Fondo de Desarrollo Social',           tipo_id:'tp-1', monto_descripcion:'Hasta $200,000 a tasa cero',            monto_min:10000,  monto_max:200000, destacado:true,  anos_operacion_max:null, requiere_plan_negocio:true,  requiere_rfc:true,  convocatoria_url:'https://fondeso.cdmx.gob.mx', descripcion:'Crédito para micro y pequeñas empresas de la CDMX. Sin aval, sin garantía prendaria. Plazo hasta 36 meses. Para comercio, servicios e industria.' },
  { id:'pr-02', clave:'EMPRENDE_MX',   nombre:'EmprendeCDMX — Capital Semilla',                 tipo_id:'tp-4', monto_descripcion:'$30,000–$150,000 no reembolsable',        monto_min:30000,  monto_max:150000, destacado:true,  anos_operacion_max:2,    requiere_plan_negocio:true,  requiere_rfc:true,  convocatoria_url:'https://sedeco.cdmx.gob.mx/emprendecdmx', descripcion:'Apoyo económico no reembolsable para emprendedores en etapa inicial. Incluye mentoría y acompañamiento de 6 meses con expertos del sector.' },
  { id:'pr-03', clave:'MUJERES_EMP',   nombre:'Mujeres Emprendedoras SEDECO',                   tipo_id:'tp-4', monto_descripcion:'Hasta $100,000 + capacitación gratuita',  monto_min:0,      monto_max:100000, destacado:true,  anos_operacion_max:5,    requiere_plan_negocio:true,  requiere_rfc:true,  convocatoria_url:'https://sedeco.cdmx.gob.mx/mujeres', descripcion:'Apoyo integral para mujeres emprendedoras de la CDMX. Enfocado en alimentos, comercio, servicios de belleza y tecnología. Incluye asesoría financiera.' },
  { id:'pr-04', clave:'CENPROIN',      nombre:'CENPROIN — Asesoría Empresarial Gratuita',        tipo_id:'tp-2', monto_descripcion:'Gratuito · Narvarte, Lun-Vie 9-14:30h',  monto_min:0,      monto_max:0,      destacado:true,  anos_operacion_max:null, requiere_plan_negocio:false, requiere_rfc:false, convocatoria_url:'', descripcion:'Centro Promotor de Inversión de SEDECO. Asesoría gratuita en trámites, financiamiento, plan de negocios y apertura de empresa. Presencial y videollamada.' },
  { id:'pr-05', clave:'CAPACITA_DIG',  nombre:'Capacitación Digital para Negocios',              tipo_id:'tp-2', monto_descripcion:'Gratuito',                                monto_min:0,      monto_max:0,      destacado:false, anos_operacion_max:null, requiere_plan_negocio:false, requiere_rfc:true,  convocatoria_url:'https://sedeco.cdmx.gob.mx/capacitacion', descripcion:'Cursos en marketing digital, e-commerce, redes sociales, contabilidad básica y atención al cliente. Modalidad híbrida, lunes a viernes.' },
  { id:'pr-06', clave:'INCUBADORA',    nombre:'Red de Incubadoras SEDECO',                       tipo_id:'tp-3', monto_descripcion:'Gratuito + espacio de coworking',         monto_min:0,      monto_max:0,      destacado:false, anos_operacion_max:2,    requiere_plan_negocio:true,  requiere_rfc:false, convocatoria_url:'https://sedeco.cdmx.gob.mx/incubadoras', descripcion:'Acceso a 12 incubadoras de negocios en la CDMX. Mentoría especializada, coworking, networking y vinculación con inversionistas ángel.' },
  { id:'pr-07', clave:'CREDITO_MUJER', nombre:'Crédito a la Palabra — Mujeres',                 tipo_id:'tp-1', monto_descripcion:'$25,000 a tasa preferencial',             monto_min:25000,  monto_max:25000,  destacado:false, anos_operacion_max:null, requiere_plan_negocio:false, requiere_rfc:true,  convocatoria_url:'', descripcion:'Crédito federal de $25,000 sin aval para mujeres que quieran iniciar o expandir su negocio. Tasa 0% el primer año para negocios nuevos.' },
  { id:'pr-08', clave:'MERCADOS',      nombre:'Programa de Modernización de Mercados',           tipo_id:'tp-4', monto_descripcion:'Hasta $500,000 en mejoras',               monto_min:0,      monto_max:500000, destacado:false, anos_operacion_max:null, requiere_plan_negocio:false, requiere_rfc:true,  convocatoria_url:'', descripcion:'Apoyo para locatarios de mercados públicos de la CDMX para modernizar sus instalaciones, equipo de refrigeración y sistemas de pago electrónico.' },
  { id:'pr-09', clave:'VINCULA_EMP',   nombre:'Vinculación Empresarial SEDECO',                  tipo_id:'tp-5', monto_descripcion:'Gratuito',                                monto_min:0,      monto_max:0,      destacado:false, anos_operacion_max:null, requiere_plan_negocio:false, requiere_rfc:true,  convocatoria_url:'', descripcion:'Programa de conexión entre emprendedores y grandes empresas, proveedores, exportadores y cámaras de comercio. Ferias y ruedas de negocios mensuales.' },
  { id:'pr-10', clave:'COWORK_GOB',    nombre:'Espacios de Coworking Gobierno CDMX',             tipo_id:'tp-6', monto_descripcion:'Desde $800/mes',                          monto_min:800,    monto_max:3000,   destacado:false, anos_operacion_max:null, requiere_plan_negocio:false, requiere_rfc:true,  convocatoria_url:'', descripcion:'Red de 8 espacios de coworking subsidiados por el Gobierno CDMX en colonias estratégicas. Internet, sala de juntas, impresión y área de descanso incluidos.' },
]

// Datos analíticos mock para demo (Analítica BI)
export const FB_KPI = {
  total: 1284, resueltos: 891, en_proceso: 247, pendientes: 146,
  pct_resueltos: 69, promedio_dias: 11, total_mes_actual: 143, total_mes_anterior: 118,
}
export const FB_TENDENCIA = [
  { periodo:'2025-07', total:72,  resueltos:48  },
  { periodo:'2025-08', total:89,  resueltos:61  },
  { periodo:'2025-09', total:95,  resueltos:67  },
  { periodo:'2025-10', total:108, resueltos:79  },
  { periodo:'2025-11', total:121, resueltos:88  },
  { periodo:'2025-12', total:134, resueltos:96  },
  { periodo:'2026-01', total:98,  resueltos:71  },
  { periodo:'2026-02', total:115, resueltos:84  },
  { periodo:'2026-03', total:127, resueltos:93  },
  { periodo:'2026-04', total:139, resueltos:101 },
  { periodo:'2026-05', total:131, resueltos:97  },
  { periodo:'2026-06', total:143, resueltos:107 },
]
export const FB_POR_ALCALDIA = [
  { nombre_corto:'Iztapalapa',    total:198, resueltos:134 },
  { nombre_corto:'Cuauhtémoc',   total:187, resueltos:129 },
  { nombre_corto:'GAM',          total:156, resueltos:108 },
  { nombre_corto:'Álvaro Obr.',  total:132, resueltos:94  },
  { nombre_corto:'Benito Juárez',total:121, resueltos:89  },
  { nombre_corto:'Coyoacán',     total:108, resueltos:79  },
  { nombre_corto:'Tlalpan',      total:97,  resueltos:71  },
  { nombre_corto:'Xochimilco',   total:84,  resueltos:61  },
  { nombre_corto:'Azcapotzalco', total:79,  resueltos:58  },
  { nombre_corto:'Iztacalco',    total:72,  resueltos:53  },
]
export const FB_POR_TIPO = [
  { tipo:'Taquería / Fonda',        clave:'TAQUERIA',    total:287, pct_resueltos:74, promedio_dias:1  },
  { tipo:'Restaurante',              clave:'RESTAURANTE', total:198, pct_resueltos:62, promedio_dias:14 },
  { tipo:'Tienda de Abarrotes',     clave:'TIENDA_ABAR', total:176, pct_resueltos:81, promedio_dias:1  },
  { tipo:'Estética / Belleza',      clave:'SALON_BELL',  total:143, pct_resueltos:78, promedio_dias:2  },
  { tipo:'Bar / Cantina',           clave:'BAR_CANTINA', total:87,  pct_resueltos:41, promedio_dias:38 },
  { tipo:'Otros',                   clave:'OTROS',       total:393, pct_resueltos:68, promedio_dias:9  },
]
export const FB_POR_ESTADO = [
  { clave:'NUEVO',      nombre:'Nuevo',      total:87,  porcentaje:7,  color_hex:'#6B7280' },
  { clave:'ASIGNADO',   nombre:'Asignado',   total:112, porcentaje:9,  color_hex:'#3B82F6' },
  { clave:'EN_PROCESO', nombre:'En Proceso', total:247, porcentaje:19, color_hex:'#F59E0B' },
  { clave:'PENDIENTE',  nombre:'Pendiente',  total:146, porcentaje:11, color_hex:'#EF4444' },
  { clave:'RESUELTO',   nombre:'Resuelto',   total:891, porcentaje:69, color_hex:'#10B981' },
  { clave:'CANCELADO',  nombre:'Cancelado',  total:21,  porcentaje:2,  color_hex:'#9CA3AF' },
]
