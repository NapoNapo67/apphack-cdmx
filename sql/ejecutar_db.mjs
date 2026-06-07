// Ejecuta los 3 scripts SQL via Supabase Management API
// node sql/ejecutar_db.mjs

import { readFileSync } from 'fs'

const PAT = process.env.SUPABASE_PAT || '' // export SUPABASE_PAT=sbp_...
const REF = 'emyoqloretqdoqskgqho'
const URL = `https://api.supabase.com/v1/projects/${REF}/database/query`

async function runSQL(label, sql) {
  console.log(`\n⏳ Ejecutando: ${label}...`)
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const data = await res.json()
  if (!res.ok || data.message) {
    console.error(`  ❌ ERROR:`, data.message || data)
    return false
  }
  const last = Array.isArray(data) ? data[data.length - 1] : data
  console.log(`  ✅ OK:`, JSON.stringify(last))
  return true
}

console.log('🚀 Iniciando carga de base de datos...')

const scripts = [
  ['Schema operacional (tablas + RLS)',       'C:/Hackton/h20260606/sql/01_schema_operacional.sql'],
  ['Seed catálogos y datos demo',             'C:/Hackton/h20260606/sql/02_seed_catalogos.sql'],
  ['Data Warehouse + dimensiones + vistas',   'C:/Hackton/h20260606/sql/03_dw_schema.sql'],
]

let ok = 0
for (const [label, path] of scripts) {
  const sql = readFileSync(path, 'utf8')
  const success = await runSQL(label, sql)
  if (success) ok++
  else { console.error('\n🛑 Script fallido. Revisando...'); break }
}

console.log(`\n📊 Resultado: ${ok}/${scripts.length} scripts ejecutados`)

// Verificar conteos finales
if (ok === scripts.length) {
  console.log('\n🔍 Verificando datos cargados...')
  const SKEY = process.env.SUPABASE_SERVICE_ROLE || ''
  const BASE = 'https://emyoqloretqdoqskgqho.supabase.co/rest/v1'
  const tablas = [
    'cat_categoria_giro', 'cat_giro_negocio', 'cat_alcaldia',
    'cat_persona_juridica', 'cat_tramite', 'cat_dependencia',
    'cat_estado_tramite', 'cat_programa_tipo', 'programa_emprendimiento',
  ]
  for (const t of tablas) {
    const r = await fetch(`${BASE}/${t}?select=*`, {
      headers: { 'apikey': SKEY, 'Authorization': `Bearer ${SKEY}`, 'Prefer': 'count=exact' }
    })
    const count = r.headers.get('content-range')?.split('/')[1] ?? '?'
    const estado = r.ok ? '✅' : '❌'
    console.log(`  ${estado} ${t.padEnd(32)} ${count} registros`)
  }
}
