#!/usr/bin/env node

/**
 * Applies Drizzle-generated migrations via the Neon HTTP driver.
 *
 * Why: The standard `drizzle-kit push/migrate` uses the `pg` TCP driver
 * which fails behind corporate TLS-intercepting proxies. The Neon HTTP
 * driver (HTTPS, port 443) works through these proxies.
 *
 * Usage:
 *   node scripts/db-apply.mjs                # apply all pending migrations
 *   node scripts/db-apply.mjs --force 0001   # re-apply a specific migration
 *   node scripts/db-apply.mjs --status       # show applied vs pending
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const MIGRATIONS_DIR = join(import.meta.dirname, '..', 'drizzle');
const JOURNAL_PATH = join(MIGRATIONS_DIR, 'meta', '_journal.json');

const GEOGRAPHY_RE = /"geography\(([^"]+)\)"/g;

function fixGeographyQuoting(stmt) {
  return stmt.replace(GEOGRAPHY_RE, 'geography($1)');
}

async function ensureMigrationsTable() {
  await sql(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL UNIQUE,
      created_at BIGINT NOT NULL
    )
  `);
}

async function getAppliedMigrations() {
  const rows = await sql('SELECT hash FROM "__drizzle_migrations"');
  return new Set(rows.map((r) => r.hash));
}

function getJournalEntries() {
  const journal = JSON.parse(readFileSync(JOURNAL_PATH, 'utf8'));
  return journal.entries;
}

async function applyMigration(entry) {
  const filePath = join(MIGRATIONS_DIR, `${entry.tag}.sql`);
  const rawSql = readFileSync(filePath, 'utf8');
  const statements = rawSql
    .split('--> statement-breakpoint')
    .map((s) => fixGeographyQuoting(s.trim()))
    .filter(Boolean);

  console.log(`\n  Applying ${entry.tag} (${statements.length} statements)...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 72).replace(/\n/g, ' ').replace(/\s+/g, ' ');
    try {
      await sql(stmt);
      console.log(`    [${i + 1}/${statements.length}] OK  ${preview}`);
    } catch (e) {
      console.error(`    [${i + 1}/${statements.length}] FAIL ${preview}`);
      console.error(`         ${e.message}`);
      throw new Error(`Migration ${entry.tag} failed at statement ${i + 1}`);
    }
  }

  await sql(
    'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
    [entry.tag, Date.now()],
  );
  console.log(`  [done] ${entry.tag} recorded.`);
}

async function showStatus(entries, applied) {
  console.log('\nMigration status:');
  for (const entry of entries) {
    const status = applied.has(entry.tag) ? 'applied' : 'pending';
    console.log(`  ${entry.tag}  ${status}`);
  }
  const tables = await sql(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  console.log(`\nTables (${tables.length}): ${tables.map((t) => t.tablename).join(', ')}`);
}

async function main() {
  const args = process.argv.slice(2);
  const isStatus = args.includes('--status');
  const forceIdx = args.indexOf('--force');
  const forceTag = forceIdx !== -1 ? args[forceIdx + 1] : null;

  console.log('Connecting to Neon via HTTP driver...');
  await sql('SELECT 1');
  console.log('Connected.');

  await ensureMigrationsTable();
  const entries = getJournalEntries();
  const applied = await getAppliedMigrations();

  if (isStatus) {
    await showStatus(entries, applied);
    return;
  }

  // Enable PostGIS if any migration references geography
  const allSql = entries
    .map((e) => {
      try {
        return readFileSync(join(MIGRATIONS_DIR, `${e.tag}.sql`), 'utf8');
      } catch {
        return '';
      }
    })
    .join('');

  if (allSql.includes('geography')) {
    console.log('Enabling PostGIS extension...');
    await sql('CREATE EXTENSION IF NOT EXISTS postgis');
  }

  let pending = entries.filter((e) => !applied.has(e.tag));

  if (forceTag) {
    const match = entries.find((e) => e.tag.includes(forceTag));
    if (!match) {
      console.error(`No migration matching "${forceTag}".`);
      process.exit(1);
    }
    console.log(`Force re-applying: ${match.tag}`);
    await applyMigration(match);
    return;
  }

  if (pending.length === 0) {
    console.log('All migrations already applied. Nothing to do.');
    await showStatus(entries, applied);
    return;
  }

  console.log(`${pending.length} pending migration(s).`);
  for (const entry of pending) {
    await applyMigration(entry);
  }

  console.log('\nAll migrations applied successfully.');
}

main().catch((e) => {
  console.error('\nFatal:', e.message);
  process.exit(1);
});
