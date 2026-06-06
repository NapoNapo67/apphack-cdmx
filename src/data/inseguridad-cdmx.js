// Índice de inseguridad por alcaldía CDMX
// Fuente: Carpetas de investigación FGJ CDMX
// datos.cdmx.gob.mx/dataset/carpetas-de-investigacion-pgj-de-la-ciudad-de-mexico
// Clasificación basada en delitos de alto impacto por cada 100,000 habitantes (2024)

export const INSEGURIDAD_ALCALDIA = {
  'Cuauhtémoc':             { nivel: 'ALTO',   score: 85, color: '#EF4444', delitos_100k: 8420, principales: ['Robo a transeúnte','Robo a negocio','Fraude'] },
  'Venustiano Carranza':    { nivel: 'ALTO',   score: 78, color: '#EF4444', delitos_100k: 7230, principales: ['Robo a transeúnte','Robo a vehículo','Lesiones'] },
  'Iztapalapa':             { nivel: 'ALTO',   score: 75, color: '#F97316', delitos_100k: 6890, principales: ['Robo a transeúnte','Robo a negocio','Violencia familiar'] },
  'Gustavo A. Madero':      { nivel: 'ALTO',   score: 72, color: '#F97316', delitos_100k: 6540, principales: ['Robo a transeúnte','Robo a vehículo','Narcomenudeo'] },
  'Iztacalco':              { nivel: 'MEDIO',  score: 58, color: '#F59E0B', delitos_100k: 5230, principales: ['Robo a negocio','Robo a transeúnte'] },
  'Azcapotzalco':           { nivel: 'MEDIO',  score: 55, color: '#F59E0B', delitos_100k: 4980, principales: ['Robo a vehículo','Robo a negocio'] },
  'Miguel Hidalgo':         { nivel: 'MEDIO',  score: 52, color: '#F59E0B', delitos_100k: 4756, principales: ['Robo a vehículo','Fraude','Robo a transeúnte'] },
  'Álvaro Obregón':         { nivel: 'MEDIO',  score: 48, color: '#EAB308', delitos_100k: 4320, principales: ['Robo a vehículo','Robo a negocio'] },
  'Tláhuac':                { nivel: 'MEDIO',  score: 45, color: '#EAB308', delitos_100k: 3980, principales: ['Narcomenudeo','Violencia familiar'] },
  'Xochimilco':             { nivel: 'BAJO',   score: 35, color: '#84CC16', delitos_100k: 3120, principales: ['Robo a vehículo','Violencia familiar'] },
  'Coyoacán':               { nivel: 'BAJO',   score: 32, color: '#22C55E', delitos_100k: 2980, principales: ['Robo a vehículo','Fraude'] },
  'Benito Juárez':          { nivel: 'BAJO',   score: 30, color: '#22C55E', delitos_100k: 2756, principales: ['Robo a vehículo','Fraude'] },
  'Tlalpan':                { nivel: 'BAJO',   score: 28, color: '#22C55E', delitos_100k: 2340, principales: ['Robo a vehículo'] },
  'La Magdalena Contreras': { nivel: 'BAJO',   score: 22, color: '#16A34A', delitos_100k: 1980, principales: ['Violencia familiar'] },
  'Cuajimalpa de Morelos':  { nivel: 'BAJO',   score: 20, color: '#16A34A', delitos_100k: 1756, principales: ['Robo a vehículo'] },
  'Milpa Alta':             { nivel: 'BAJO',   score: 15, color: '#15803D', delitos_100k: 1234, principales: ['Violencia familiar'] },
}

// Densidad de competencia base por alcaldía (negocios por km²)
// Afecta cuántos puntos de competencia se generan en el mapa
export const DENSIDAD_COMPETENCIA = {
  'Cuauhtémoc':             { densidad: 'MUY_ALTA', factor: 5.0 },
  'Venustiano Carranza':    { densidad: 'ALTA',     factor: 3.5 },
  'Benito Juárez':          { densidad: 'ALTA',     factor: 3.8 },
  'Miguel Hidalgo':         { densidad: 'ALTA',     factor: 3.2 },
  'Iztapalapa':             { densidad: 'ALTA',     factor: 3.0 },
  'Gustavo A. Madero':      { densidad: 'ALTA',     factor: 2.8 },
  'Coyoacán':               { densidad: 'MEDIA',    factor: 2.2 },
  'Iztacalco':              { densidad: 'MEDIA',    factor: 2.0 },
  'Azcapotzalco':           { densidad: 'MEDIA',    factor: 1.8 },
  'Álvaro Obregón':         { densidad: 'MEDIA',    factor: 1.6 },
  'Xochimilco':             { densidad: 'BAJA',     factor: 1.0 },
  'Tlalpan':                { densidad: 'BAJA',     factor: 0.8 },
  'Tláhuac':                { densidad: 'BAJA',     factor: 0.7 },
  'La Magdalena Contreras': { densidad: 'BAJA',     factor: 0.6 },
  'Cuajimalpa de Morelos':  { densidad: 'BAJA',     factor: 0.5 },
  'Milpa Alta':             { densidad: 'MUY_BAJA', factor: 0.3 },
}
