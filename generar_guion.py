from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch

GUINDA = HexColor('#7B1F3A')
ORO    = HexColor('#B8975A')
GRIS   = HexColor('#374151')
CLARO  = HexColor('#F3F4F6')

doc = SimpleDocTemplate(
    "C:/Hackton/h20260606/guion_notebooklm.pdf",
    pagesize=letter,
    rightMargin=0.8*inch, leftMargin=0.8*inch,
    topMargin=0.8*inch, bottomMargin=0.8*inch
)

styles = getSampleStyleSheet()

titulo = ParagraphStyle('titulo', fontSize=20, textColor=GUINDA,
    alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=4)
subtitulo = ParagraphStyle('subtitulo', fontSize=11, textColor=ORO,
    alignment=TA_CENTER, fontName='Helvetica', spaceAfter=14)
seccion = ParagraphStyle('seccion', fontSize=13, textColor=GUINDA,
    fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=4)
cuerpo = ParagraphStyle('cuerpo', fontSize=10, textColor=GRIS,
    fontName='Helvetica', leading=15, spaceAfter=6)
dialogo = ParagraphStyle('dialogo', fontSize=10, textColor=HexColor('#1D4ED8'),
    fontName='Helvetica-Oblique', leading=14, leftIndent=16, spaceAfter=4)
nota = ParagraphStyle('nota', fontSize=9, textColor=HexColor('#6B7280'),
    fontName='Helvetica', leading=12, leftIndent=16, spaceAfter=4)

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=ORO, spaceAfter=8, spaceBefore=4)

def sp(n=6):
    return Spacer(1, n)

contenido = []

# Portada
contenido += [
    sp(20),
    Paragraph("Viabilidad de Negocios CDMX", titulo),
    Paragraph("Plataforma inteligente SEDECO | Hackathon AppHack CDMX 2026", subtitulo),
    hr(),
    Paragraph("Guion para video de presentacion — NotebookLM", ParagraphStyle('c2',
        fontSize=10, textColor=GRIS, alignment=TA_CENTER, fontName='Helvetica')),
    sp(10),
]

# 1. PROBLEMA
contenido += [
    hr(),
    Paragraph("1. El Problema", seccion),
    Paragraph(
        "Emprender en la Ciudad de Mexico es complicado. Un ciudadano que quiere abrir un negocio "
        "debe navegar por lo menos seis dependencias distintas: SEDUVI, SIAPEM, SAT, IMSS, COFEPRIS "
        "y su alcaldia, sin saber el orden correcto ni los costos reales. El resultado: el 60 por "
        "ciento de los emprendedores abandona el proceso por falta de orientacion clara.",
        cuerpo),
    Paragraph(
        "SEDECO necesitaba una solucion digital que guiara al ciudadano paso a paso, con inteligencia "
        "artificial, desde su celular y sin requerir una cita presencial.",
        cuerpo),
]

# 2. SOLUCION
contenido += [
    hr(),
    Paragraph("2. La Solucion", seccion),
    Paragraph(
        "Desarrollamos Viabilidad de Negocios CDMX, una plataforma web mobile-first con tres "
        "capacidades principales. Primero, un evaluador con inteligencia artificial que genera un "
        "score de viabilidad del cero al cien, con semaforos en cinco dimensiones: mercado, "
        "competencia, regulacion, inversion y ubicacion.",
        cuerpo),
    Paragraph(
        "Segundo, una ruta de tramites personalizada que genera la secuencia exacta de permisos "
        "segun el giro elegido, en el orden correcto, con costos reales y tiempos de resolucion. "
        "Tercero, un catalogo de diez programas de apoyo de SEDECO con filtros por tipo de apoyo.",
        cuerpo),
    Paragraph(
        "Todo funciona sin crear una cuenta. El ciudadano llega, evalua y obtiene claridad "
        "completa en menos de tres minutos.",
        cuerpo),
]

# 3. DEMO
contenido += [
    hr(),
    Paragraph("3. Flujo de la Aplicacion", seccion),
    Paragraph(
        "El usuario llega a la pantalla principal y presiona el boton Evaluar mi negocio con IA. "
        "En el paso uno selecciona su categoria de giro, por ejemplo Alimentos y Bebidas, luego "
        "elige el giro especifico como Cafeteria, y su figura juridica como persona fisica con "
        "actividad empresarial.",
        cuerpo),
    Paragraph(
        "En el paso dos elige su alcaldia, por ejemplo Coyoacan, y puede indicar la colonia. "
        "El mapa de Leaflet muestra competidores en un radio de un kilometro, estaciones de metro "
        "cercanas e indicadores de seguridad de la zona.",
        cuerpo),
    Paragraph(
        "En el paso tres aparece el resultado: el score en un gauge circular, el punto de vista "
        "de la IA con una recomendacion directa, los cinco indicadores con semaforo y barra de "
        "progreso hacia el cien por ciento, oportunidades, riesgos, inversion estimada y tiempo "
        "de apertura. Al final el usuario puede ir directo a su ruta de tramites.",
        cuerpo),
]

# 4. STACK
contenido += [
    hr(),
    Paragraph("4. Stack Tecnologico", seccion),
    Paragraph(
        "El frontend esta construido con React 18, Vite y Tailwind CSS, siguiendo el Design System "
        "del Gobierno CDMX con la fuente Montserrat y el color guinda institucional. Es mobile-first "
        "y funciona como aplicacion de pagina unica.",
        cuerpo),
    Paragraph(
        "El backend utiliza Netlify Functions, que son funciones serverless en Node.js. Esto "
        "elimina la necesidad de mantener un servidor. La base de datos es Supabase, que es "
        "PostgreSQL administrado con autenticacion y seguridad por filas incorporada.",
        cuerpo),
    Paragraph(
        "La inteligencia artificial usa Claude Sonnet 4.5 de Anthropic. Por seguridad, la llave "
        "de la API nunca llega al navegador del ciudadano. Solo se invoca desde las funciones "
        "serverless. El despliegue es en Netlify con integracion continua desde GitHub.",
        cuerpo),
]

# 5. AGENTES IA
contenido += [
    hr(),
    Paragraph("5. Los Dos Agentes de Inteligencia Artificial", seccion),
    Paragraph(
        "La plataforma tiene dos agentes con roles distintos. El Agente Operativo aparece como "
        "chat flotante en todas las paginas. Es experto en tramites mercantiles: clasifica el giro "
        "en bajo impacto, impacto vecinal o impacto zonal segun la Ley de Establecimientos "
        "Mercantiles, indica el formato SIAPEM correcto y da el primer paso concreto al ciudadano.",
        cuerpo),
    Paragraph(
        "El Agente Analitico vive en el modulo de analitica. Interpreta los tableros de datos, "
        "detecta tendencias y responde preguntas en lenguaje natural sobre los indicadores del "
        "sistema. Por ejemplo, puede explicar por que bajaron las consultas en una alcaldia "
        "especifica durante un mes determinado.",
        cuerpo),
]

# 6. MODELO DATOS
contenido += [
    hr(),
    Paragraph("6. Modelo de Datos Operacional", seccion),
    Paragraph(
        "El esquema operacional en PostgreSQL sigue la Tercera Forma Normal. La tabla central "
        "es consulta_viabilidad, que registra cada evaluacion con su score, nivel de viabilidad "
        "y el JSON de resultado generado por la IA.",
        cuerpo),
    Paragraph(
        "Todo valor que se repite vive en un catalogo normalizado: ocho categorias de giro, "
        "quince tipos de giro, dieciseis alcaldias de la Ciudad de Mexico, cuatro figuras "
        "juridicas, diez tramites reales del RETYS y SIAPEM, y sus dependencias responsables. "
        "La relacion entre consultas y tramites es de muchos a muchos mediante la tabla "
        "tramite_consulta.",
        cuerpo),
    Paragraph(
        "Todas las tablas tienen campos de auditoria: fecha de creacion, fecha de actualizacion, "
        "usuario que creo el registro y usuario que lo modifico.",
        cuerpo),
]

# 7. DATA WAREHOUSE
contenido += [
    hr(),
    Paragraph("7. Data Warehouse y Star Schema", seccion),
    Paragraph(
        "El esquema dw implementa un Data Warehouse con arquitectura estrella. La tabla de hechos "
        "central es fact_consulta, que almacena las metricas de cada evaluacion: score de "
        "viabilidad, nivel de riesgo, inversion estimada, dias de apertura estimados y dias de "
        "resolucion real.",
        cuerpo),
    Paragraph(
        "Las dimensiones conformadas ya estan pre-generadas hasta el ano 2030. Las dimensiones "
        "de tiempo cubren cinco granularidades: dia con formato YYYYMMDD, mes con formato YYYYMM, "
        "trimestre, semestre y ano. Las dimensiones de negocio son alcaldia, giro, figura "
        "juridica y estado del tramite.",
        cuerpo),
    Paragraph(
        "La diferencia con el modelo operacional es el enfoque. El sistema operacional responde "
        "preguntas de hoy: que tramites necesita este ciudadano. El Data Warehouse responde "
        "preguntas de gestion: cual alcaldia tiene mas emprendimientos de alto riesgo, o si el "
        "tiempo promedio de resolucion esta mejorando trimestre a trimestre.",
        cuerpo),
]

# 8. DATA MARTS
contenido += [
    hr(),
    Paragraph("8. Data Marts y Vistas Analiticas", seccion),
    Paragraph(
        "Sobre el Data Warehouse construimos cuatro Data Marts como vistas pre-calculadas. El "
        "primero es para la Direccion de SEDECO y contiene KPIs ejecutivos, tendencia mensual "
        "de los ultimos doce meses y cumplimiento del SLA de quince dias.",
        cuerpo),
    Paragraph(
        "El segundo es el Mart Territorial, que muestra consultas y score promedio por las "
        "dieciseis alcaldias. El tercero es el Mart Regulatorio, con analisis por tipo de giro "
        "y tiempos de resolucion por tramite. El cuarto es el Mart de Fomento, que mide que "
        "programas de apoyo tienen mayor tasa de aplicacion por tipo de negocio.",
        cuerpo),
    Paragraph(
        "El proceso ETL que alimenta el Data Warehouse es idempotente, lo que significa que "
        "puede ejecutarse varias veces sin duplicar datos. Usa el patron INSERT con ON CONFLICT "
        "DO NOTHING y corre de forma programada cada noche.",
        cuerpo),
]

# 9. BENEFICIOS
contenido += [
    hr(),
    Paragraph("9. Beneficios", seccion),
    Paragraph(
        "Para el ciudadano emprendedor, el tiempo de orientacion baja de tres a cinco dias a "
        "menos de tres minutos. Obtiene la secuencia correcta de tramites desde el primer "
        "intento, evitando rechazos por orden incorrecto o documentacion incompleta.",
        cuerpo),
    Paragraph(
        "Para SEDECO, la plataforma reduce la carga de consultas presenciales en el CENPROIN "
        "y genera un Data Warehouse de emprendimiento que permite hacer politica publica basada "
        "en datos reales. Los tableros permiten detectar que zonas tienen mayor demanda "
        "emprendedora y focalizar los programas de apoyo.",
        cuerpo),
]

# 10. ESCALABILIDAD
contenido += [
    hr(),
    Paragraph("10. Escalabilidad y Vision", seccion),
    Paragraph(
        "Esta plataforma es una fabrica de soluciones de gobierno, no una aplicacion especifica. "
        "El modulo de viabilidad de negocios es la primera instancia. El mismo stack tecnologico "
        "soporta permisos de construccion para SEDUVI, tramites vehiculares para SEMOVI, "
        "licencias sanitarias para SEDESA, o cualquier proceso que combine tramites, catalogos "
        "e inteligencia artificial.",
        cuerpo),
    Paragraph(
        "La base tecnologica esta construida. En un hackathon se agrega el modulo de negocio "
        "especifico. El costo operativo es marginal: Supabase en nivel gratuito, Netlify en "
        "nivel gratuito y aproximadamente un centavo de dolar por consulta de inteligencia "
        "artificial.",
        cuerpo),
]

# CIERRE
contenido += [
    hr(),
    Paragraph("Cierre", seccion),
    Paragraph(
        "Viabilidad de Negocios CDMX reduce la brecha entre el ciudadano emprendedor y el "
        "gobierno. No prometemos digitalizacion. Entregamos claridad: el ciudadano sabe "
        "exactamente que hacer, en que orden, cuanto le cuesta y si su negocio tiene futuro. "
        "Todo con inteligencia artificial, en tiempo real, desde su celular.",
        cuerpo),
    sp(10),
    Paragraph("Gracias.", ParagraphStyle('cierre', fontSize=14, textColor=GUINDA,
        alignment=TA_CENTER, fontName='Helvetica-Bold')),
]

doc.build(contenido)
print("PDF generado: guion_notebooklm.pdf")
