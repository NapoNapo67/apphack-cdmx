// Verificar que la base de datos tiene todos los datos
// node sql/verificar_db.mjs

const URL  = 'https://emyoqloretqdoqskgqho.supabase.co/rest/v1'
const KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY || ''
const HDR  = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Prefer': 'count=exact' }

const tablas = [
  'cat_categoria_giro', 'cat_giro_negocio', 'cat_alcaldia',
  'cat_persona_juridica', 'cat_tramite', 'cat_dependencia',
  'cat_estado_tramite', 'cat_programa_tipo', 'programa_emprendimiento',
]

console.log('\n Verificando base de datos Supabase...\n')
let ok = 0, err = 0
for (const t of tablas) {
  const r = await fetch(`${URL}/${t}?select=*&limit=1`, { headers: HDR })
  const count = r.headers.get('content-range')?.split('/')[1] ?? '?'
  if (r.ok) { console.log(`  OK  ${t.padEnd(30)} ${count} registros`); ok++ }
  else       { const b = await r.json(); console.log(`  ERR ${t.padEnd(30)} ${b.message ?? r.status}`); err++ }
}
console.log(`\n  ${ok} tablas OK · ${err} errores\n`)
