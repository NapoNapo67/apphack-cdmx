# CLAUDE.md — AppHack CDMX

## Filosofía
Esta es una fábrica de soluciones de gobierno, no una app específica.
La plataforma base está construida. Solo se agrega el módulo de negocio en el hackathon.

## Stack
React + Vite + Tailwind | Supabase | Netlify Functions | Claude API (claude-sonnet-4-20250514)

## Variables de entorno
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → frontend (vite)
- `ANTHROPIC_API_KEY` → **SOLO Netlify Functions**, NUNCA en frontend

## Arquitectura de datos
- Esquema `public` → modelo operacional del negocio
- Esquema `dw` → Data Warehouse (dimensiones + hechos)

## Dimensiones conformadas ya disponibles (NO recrear)
| Tabla | Llave | Rango |
|---|---|---|
| `dw.dim_tiempo_dia` | YYYYMMDD (int) | 2020-2030 |
| `dw.dim_tiempo_mes` | YYYYMM (int) | 2020-2030 |
| `dw.dim_tiempo_trimestre` | YYYYTt (varchar) | 2020-2030 |
| `dw.dim_tiempo_semestre` | YYYYSs (varchar) | 2020-2030 |
| `dw.dim_tiempo_anio` | YYYY (int) | 2020-2030 |
| `dw.dim_estado` | clave_inegi | 5 estados |
| `dw.dim_alcaldia` | clave (3 letras) | 16 alcaldías CDMX |

## Catálogos universales ya disponibles
- `public.cat_estado_tramite` → NUEVO / ASIGNADO / EN_PROCESO / PENDIENTE / RESUELTO / CANCELADO

## Reglas de desarrollo
- Español en UI y comentarios
- Mobile first, responsivo siempre
- Design System Gobierno CDMX (Montserrat, #006847)
- Claude API **solo** via Netlify Functions (nunca directo desde React)
- Auditoría en todas las tablas: `created_at`, `updated_at`, `created_by`, `updated_by`
- Catálogos normalizados para todo valor que se repite (3FN)

## Dos agentes IA
- `AgenteOperativo` → proceso y trámites (chat flotante, todas las páginas)
- `AgenteAnalitico` → Data Warehouse y métricas (en dashboard/analítica)

## Estructura de archivos clave
```
src/lib/supabase.js      → cliente Supabase
src/lib/claude.js        → helpers para llamar Netlify Functions
src/lib/auth.js          → Google OAuth
src/context/AppContext.jsx → estado global (user, activeTab)
src/hooks/useSupabase.js → hook genérico para queries
netlify/functions/
  chat-operativo.js      → agente IA operativo
  chat-analitico.js      → agente IA analítico
sql/schema_base.sql      → esquema base (ya ejecutado)
```

## Mañana (hackathon) — Prompt B
Con el reto definido, Claude Code genera:
- Análisis del negocio (entidades, procesos, flujo)
- Modelo operacional normalizado con catálogos
- `sql/reset_database.sql`
- 5 módulos de negocio sobre esta plataforma
- Datos sintéticos realistas (30+ registros)

## Pasado el hackathon — Prompt C
- Tablas de hechos en esquema `dw`
- ETL idempotente operacional → DW
- 6 vistas analíticas
- 6 tableros BI con Recharts
- Agente Analítico enriquecido con datos reales
