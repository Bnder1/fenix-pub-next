/**
 * Migration script — bypasses drizzle-kit WebSocket issue under Bun
 * Uses neon() HTTP mode directly (no WebSocket)
 */
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const url =
  process.env.NETLIFY_DATABASE_URL_UNPOOLED ??
  process.env.NETLIFY_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) {
  console.error('❌  No database URL found in environment');
  process.exit(1);
}

const sql = neon(url);

// neon() is a tagged-template fn — we can pass a raw string by faking the TemplateStringsArray
async function exec(stmt: string) {
  const arr = Object.assign([stmt], { raw: [stmt] }) as unknown as TemplateStringsArray;
  return sql(arr);
}

const content = readFileSync('./drizzle/migrate.sql', 'utf-8');

const statements = content
  .split(';')
  .map(chunk =>
    // Strip comment lines within each chunk, then trim
    chunk
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim()
  )
  .filter(s => s.length > 0);

console.log(`Running ${statements.length} SQL statements against Neon...\n`);

let ok = 0;
let err = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i]!;
  const label = stmt.slice(0, 70).replace(/\s+/g, ' ');
  try {
    await exec(stmt);
    console.log(`  ✓  [${i + 1}/${statements.length}] ${label}`);
    ok++;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`  ✗  [${i + 1}/${statements.length}] ${label}`);
    console.error(`     ${msg}`);
    err++;
  }
}

console.log(`\nDone — ${ok} OK, ${err} errors`);
if (err > 0) process.exit(1);
